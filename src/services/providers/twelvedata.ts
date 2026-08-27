import { makeBudget } from '../../lib/rateLimit'
import type { HistoryPoint, Timeframe } from '../types'

const KEY: string | undefined = import.meta.env.VITE_TWELVEDATA_KEY || undefined
// Free tier allows 8 req/min — keep one in reserve.
const budget = makeBudget(7, 60_000)

const TD_PARAMS: Record<Timeframe, { interval: string; outputsize: number }> = {
  '1D': { interval: '5min', outputsize: 78 },
  '1W': { interval: '1h', outputsize: 35 },
  '1M': { interval: '1day', outputsize: 22 },
  '3M': { interval: '1day', outputsize: 66 },
  '1Y': { interval: '1day', outputsize: 252 },
}

interface TDBody {
  status?: string
  values?: Array<{ datetime?: string; close?: string }>
}

export async function twelvedataHistory(
  symbol: string,
  timeframe: Timeframe,
): Promise<HistoryPoint[] | null> {
  if (!KEY || !budget.canSpend()) return null
  budget.spend()
  const { interval, outputsize } = TD_PARAMS[timeframe]
  const url =
    `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}` +
    `&interval=${interval}&outputsize=${outputsize}&apikey=${KEY}`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 3500)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) return null
    const body = (await res.json()) as TDBody
    // Twelve Data reports rate limits as HTTP 200 with status: "error".
    if (body.status !== 'ok' || !Array.isArray(body.values)) return null
    const points: HistoryPoint[] = []
    for (const v of body.values) {
      if (!v.datetime || !v.close) continue
      const t = Date.parse(v.datetime.includes(' ') ? v.datetime.replace(' ', 'T') : v.datetime)
      const price = parseFloat(v.close)
      if (Number.isFinite(t) && Number.isFinite(price) && price > 0) points.push({ t, price })
    }
    if (points.length < 2) return null
    points.sort((a, b) => a.t - b.t)
    return points
  } catch (err) {
    console.debug('[twelvedata] fetch failed', err)
    return null
  } finally {
    clearTimeout(timer)
  }
}
