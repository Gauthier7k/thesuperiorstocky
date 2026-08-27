import { NEWS_SOURCES, NEWS_TEMPLATES } from '../../data/newsTemplates'
import { stockMeta } from '../../data/stocks'
import { gaussian, makeRng } from '../../lib/prng'
import { DAY_MS, NEWS_DAYS, SESSION_MS, TF_SPEC, tradingDayStamps } from '../../lib/time'
import type { HistoryPoint, NewsItem, NewsPeriod, Quote, Timeframe } from '../types'

/**
 * Deterministic synthetic market data. One 5-year master series per symbol —
 * every timeframe is a slice of it, so 1M and 1Y always agree — rescaled at
 * request time so the final point lands exactly on the anchor price (the live
 * quote when available).
 */

const MASTER_DAYS = 1260 // ~5 trading years

interface Master {
  stamps: number[]
  /** cumulative log-price path */
  cum: number[]
}

const masters = new Map<string, Master>()

function master(symbol: string): Master {
  let m = masters.get(symbol)
  if (m) return m
  const meta = stockMeta(symbol)
  const rng = makeRng(`series:${symbol}`)
  const dailyVol = meta.mockVolatility / Math.sqrt(252)
  const dailyDrift = meta.mockDrift / 252
  const cum: number[] = [0]
  for (let i = 1; i < MASTER_DAYS; i++) {
    cum.push(cum[i - 1] + dailyDrift + dailyVol * gaussian(rng))
  }
  m = { stamps: tradingDayStamps(MASTER_DAYS), cum }
  masters.set(symbol, m)
  return m
}

/** Daily closes for the final `days` trading days, ending exactly at `anchor`. */
function anchoredTail(symbol: string, days: number, anchor: number): HistoryPoint[] {
  const { stamps, cum } = master(symbol)
  const end = cum[cum.length - 1]
  const from = Math.max(0, MASTER_DAYS - days)
  const out: HistoryPoint[] = []
  for (let i = from; i < MASTER_DAYS; i++) {
    out.push({ t: stamps[i], price: anchor * Math.exp(cum[i] - end) })
  }
  return out
}

/**
 * A seeded Brownian bridge from `open` to `close` across `n` points — used to
 * give intraday slices believable texture.
 */
function bridgePath(
  seedKey: string,
  open: number,
  close: number,
  n: number,
  stepVol: number,
  tStart: number,
  tEnd: number,
  low?: number,
  high?: number,
): HistoryPoint[] {
  const rng = makeRng(seedKey)
  const walk: number[] = [0]
  for (let i = 1; i < n; i++) walk.push(walk[i - 1] + gaussian(rng) * stepVol)
  const drift = Math.log(close / open)
  const out: HistoryPoint[] = []
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1)
    // bridge: remove the walk's endpoint so the path lands exactly on close
    const noise = walk[i] - f * walk[n - 1]
    let price = open * Math.exp(drift * f + noise)
    if (low !== undefined && price < low) price = low
    if (high !== undefined && price > high) price = high
    out.push({ t: tStart + (tEnd - tStart) * f, price })
  }
  // clamping can nudge endpoints — pin them back
  out[0].price = Math.min(Math.max(open, low ?? open), high ?? open)
  out[n - 1].price = Math.min(Math.max(close, low ?? close), high ?? close)
  return out
}

function intradayVol(symbol: string, n: number): number {
  const meta = stockMeta(symbol)
  return meta.mockVolatility / Math.sqrt(252) / Math.sqrt(n)
}

/** Mirror the series around `anchor` so the period reads up or down as the quote says. */
function alignPeriodDirection(
  points: HistoryPoint[],
  anchor: number,
  wantUp: boolean,
): HistoryPoint[] {
  if (points.length < 2) return points
  const periodUp = points[points.length - 1].price >= points[0].price
  if (periodUp === wantUp) return points
  const aligned = points.map((p) => ({
    ...p,
    price: anchor + (anchor - p.price),
  }))
  aligned[aligned.length - 1] = { ...aligned[aligned.length - 1], price: anchor }
  return aligned
}

/**
 * Synthetic history for a timeframe, anchored to the quote. When the quote is
 * live, the 1D path opens at the real open and stays inside the real [low, high].
 */
export function mockHistory(symbol: string, timeframe: Timeframe, quote: Quote): HistoryPoint[] {
  const anchor = quote.price
  const { stamps } = master(symbol)
  const lastStamp = stamps[MASTER_DAYS - 1]
  const live = quote.source !== 'mock'

  let points: HistoryPoint[]

  if (timeframe === '1D') {
    const n = 78 // 5-minute bars across a 6.5h session
    const prev = anchoredTail(symbol, 2, anchor)[0].price
    const open = live ? quote.open : prev * (1 + 0.002 * (makeRng(`gap:${symbol}`)() - 0.5))
    const dayKey = new Date(lastStamp).toISOString().slice(0, 10)
    points = bridgePath(
      `intraday:${symbol}:${dayKey}`,
      open,
      anchor,
      n,
      intradayVol(symbol, n) * 1.2,
      lastStamp - SESSION_MS,
      lastStamp,
      live ? Math.min(quote.low, anchor, open) : undefined,
      live ? Math.max(quote.high, anchor, open) : undefined,
    )
  } else if (timeframe === '1W') {
    // 5 daily segments, each subdivided with its own seeded bridge
    const closes = anchoredTail(symbol, 6, anchor)
    const per = 14
    points = []
    for (let d = 0; d < closes.length - 1; d++) {
      const a = closes[d]
      const b = closes[d + 1]
      const seg = bridgePath(
        `week:${symbol}:${d}`,
        a.price,
        b.price,
        per,
        intradayVol(symbol, per),
        b.t - SESSION_MS,
        b.t,
      )
      points.push(...(d === 0 ? seg : seg.slice(1)))
    }
  } else {
    points = anchoredTail(symbol, TF_SPEC[timeframe].tradingDays, anchor)
  }

  if (!live) {
    points = alignPeriodDirection(points, anchor, quote.changePercent >= 0)
  }

  return points
}

/**
 * Synthetic quote for zero-key mode. Deterministic per symbol, with a gentle
 * seeded tick every 4 seconds so the price feels alive.
 */
export function mockQuote(symbol: string): Quote {
  const meta = stockMeta(symbol)
  const windowId = Math.floor(Date.now() / 4000)
  const wobble = (makeRng(`tick:${symbol}:${windowId}`)() - 0.5) * 0.004
  const price = meta.mockBasePrice * (1 + wobble)
  const prev = anchoredTail(symbol, 2, price)[0].price
  const open = prev * (1 + 0.002 * (makeRng(`gap:${symbol}`)() - 0.5))
  const change = price - prev
  return {
    symbol,
    price,
    change,
    changePercent: (change / prev) * 100,
    open,
    high: Math.max(price, open) * 1.004,
    low: Math.min(price, open) * 0.996,
    prevClose: prev,
    ts: Date.now(),
    source: 'mock',
  }
}

/** Price on (or just before) a calendar date, for '@ date' cost basis. */
export function mockPriceAtDate(symbol: string, dateISO: string, anchor: number): number | null {
  const target = Date.parse(`${dateISO}T23:59:59`)
  if (!Number.isFinite(target)) return null
  const tail = anchoredTail(symbol, MASTER_DAYS, anchor)
  if (target < tail[0].t) return null
  let best = tail[0]
  for (const p of tail) {
    if (p.t <= target) best = p
    else break
  }
  return best.price
}

/** Seeded fake headlines, stable per (symbol, period). */
export function mockNews(symbol: string, period: NewsPeriod): NewsItem[] {
  const meta = stockMeta(symbol)
  const rng = makeRng(`news:${symbol}:${period}`)
  const count = period === 'daily' ? 6 : period === 'weekly' ? 8 : 10
  const spanMs = NEWS_DAYS[period] * DAY_MS
  const now = Date.now()
  const used = new Set<number>()
  const items: NewsItem[] = []
  for (let i = 0; i < count; i++) {
    let idx = Math.floor(rng() * NEWS_TEMPLATES.length)
    while (used.has(idx) && used.size < NEWS_TEMPLATES.length) {
      idx = (idx + 1) % NEWS_TEMPLATES.length
    }
    used.add(idx)
    const tpl = NEWS_TEMPLATES[idx]
    items.push({
      id: `mock-${symbol}-${period}-${i}`,
      headline: tpl.headline.replaceAll('{name}', meta.name).replaceAll('{symbol}', symbol),
      source: NEWS_SOURCES[Math.floor(rng() * NEWS_SOURCES.length)],
      ts: now - rng() * spanMs,
      sentiment: tpl.sentiment,
    })
  }
  items.sort((a, b) => b.ts - a.ts)
  return items
}
