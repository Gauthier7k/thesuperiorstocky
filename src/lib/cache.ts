/**
 * Two-tier read-through TTL cache (memory Map → localStorage) with in-flight
 * promise dedupe. Only successful (non-null) results are cached, so a live
 * provider can recover after a transient failure.
 */

interface Envelope<T> {
  ts: number
  data: T
}

const mem = new Map<string, Envelope<unknown>>()
const inflight = new Map<string, Promise<unknown>>()
const LS_PREFIX = 'stonks.v1.'

function readLS<T>(key: string): Envelope<T> | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    if (!raw) return null
    const env = JSON.parse(raw) as Envelope<T>
    if (typeof env?.ts !== 'number') return null
    return env
  } catch {
    return null
  }
}

function writeLS(key: string, env: Envelope<unknown>): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(env))
  } catch {
    // storage full or unavailable — memory tier still works
  }
}

export async function cachedOrNull<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T | null>,
): Promise<T | null> {
  const now = Date.now()
  const hit = mem.get(key) as Envelope<T> | undefined
  if (hit && now - hit.ts < ttlMs) return hit.data

  const ls = readLS<T>(key)
  if (ls && now - ls.ts < ttlMs) {
    mem.set(key, ls)
    return ls.data
  }

  const pending = inflight.get(key) as Promise<T | null> | undefined
  if (pending) return pending

  const p = (async () => {
    try {
      const data = await fetcher()
      if (data !== null && data !== undefined) {
        const env: Envelope<T> = { ts: Date.now(), data }
        mem.set(key, env)
        writeLS(key, env)
      }
      return data ?? null
    } catch (err) {
      console.debug('[cache] fetcher failed for', key, err)
      return null
    } finally {
      inflight.delete(key)
    }
  })()
  inflight.set(key, p)
  return p
}
