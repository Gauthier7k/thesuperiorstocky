import { isoDaysAgo, NEWS_DAYS } from '../../lib/time'
import type { NewsItem, NewsPeriod, Quote } from '../types'

const KEY: string | undefined = import.meta.env.VITE_FINNHUB_KEY || undefined
const BASE = 'https://finnhub.io/api/v1'

async function fetchJson(url: string, timeoutMs = 3500): Promise<unknown> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) return null
    return (await res.json()) as unknown
  } catch (err) {
    console.debug('[finnhub] fetch failed', err)
    return null
  } finally {
    clearTimeout(timer)
  }
}

interface FinnhubQuoteBody {
  c?: number
  d?: number
  dp?: number
  h?: number
  l?: number
  o?: number
  pc?: number
  t?: number
}

export async function finnhubQuote(symbol: string): Promise<Quote | null> {
  if (!KEY) return null
  const body = (await fetchJson(
    `${BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${KEY}`,
  )) as FinnhubQuoteBody | null
  // Finnhub returns HTTP 200 with c: 0 for unknown symbols/bad keys.
  if (!body || typeof body.c !== 'number' || body.c <= 0) return null
  return {
    symbol,
    price: body.c,
    change: body.d ?? 0,
    changePercent: body.dp ?? 0,
    open: body.o && body.o > 0 ? body.o : body.c,
    high: body.h && body.h > 0 ? body.h : body.c,
    low: body.l && body.l > 0 ? body.l : body.c,
    prevClose: body.pc && body.pc > 0 ? body.pc : body.c,
    ts: (body.t && body.t > 0 ? body.t : Math.floor(Date.now() / 1000)) * 1000,
    source: 'finnhub',
  }
}

interface FinnhubNewsRow {
  id?: number
  datetime?: number
  headline?: string
  source?: string
  url?: string
}

const POSITIVE = /(beat|surge|record|rally|upgrade|soar|jump|top|strong|growth|bull|gain|high)/i

export async function finnhubNews(symbol: string, period: NewsPeriod): Promise<NewsItem[] | null> {
  if (!KEY) return null
  const from = isoDaysAgo(NEWS_DAYS[period])
  const to = isoDaysAgo(0)
  const body = await fetchJson(
    `${BASE}/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&token=${KEY}`,
  )
  if (!Array.isArray(body) || body.length === 0) return null
  const items: NewsItem[] = []
  for (const raw of body as FinnhubNewsRow[]) {
    if (!raw.headline || !raw.datetime) continue
    items.push({
      id: String(raw.id ?? `${symbol}-${raw.datetime}`),
      headline: raw.headline,
      source: raw.source ?? 'News',
      ts: raw.datetime * 1000,
      url: raw.url,
      sentiment: POSITIVE.test(raw.headline) ? 'bullish' : 'watch',
    })
    if (items.length >= 12) break
  }
  return items.length > 0 ? items : null
}
