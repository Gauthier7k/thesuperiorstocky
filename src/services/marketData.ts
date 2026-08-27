import { cachedOrNull } from '../lib/cache'
import { RESAMPLE_N, resampleToN } from '../lib/seriesMath'
import { finnhubNews, finnhubQuote } from './providers/finnhub'
import { mockHistory, mockNews, mockPriceAtDate, mockQuote } from './providers/mock'
import { twelvedataHistory } from './providers/twelvedata'
import type { HistoryResult, NewsItem, NewsPeriod, Quote, Timeframe } from './types'

/**
 * The only market-data surface the UI touches. Every function resolves —
 * never throws, never returns null — because the synthetic provider is a
 * guaranteed terminal fallback.
 */

const QUOTE_TTL = 15_000
const NEWS_TTL = 10 * 60_000
const HISTORY_TTL: Record<Timeframe, number> = {
  '1D': 5 * 60_000,
  '1W': 24 * 3_600_000,
  '1M': 24 * 3_600_000,
  '3M': 24 * 3_600_000,
  '1Y': 24 * 3_600_000,
}

/**
 * Once a symbol serves synthetic history for any timeframe, it serves synthetic
 * for all of them this session — so a stock's 1M and 1Y charts never disagree.
 */
const syntheticSticky = new Set<string>()

export async function getQuote(symbol: string): Promise<Quote> {
  const live = await cachedOrNull(`quote.${symbol}`, QUOTE_TTL, () => finnhubQuote(symbol))
  return live ?? mockQuote(symbol)
}

export async function getHistory(symbol: string, timeframe: Timeframe): Promise<HistoryResult> {
  const quote = await getQuote(symbol)
  if (!syntheticSticky.has(symbol)) {
    const real = await cachedOrNull(`history.${symbol}.${timeframe}`, HISTORY_TTL[timeframe], () =>
      twelvedataHistory(symbol, timeframe),
    )
    if (real && real.length >= 2) {
      return { symbol, timeframe, points: resampleToN(real, RESAMPLE_N), source: 'twelvedata' }
    }
    syntheticSticky.add(symbol)
  }
  const points = mockHistory(symbol, timeframe, quote)
  return { symbol, timeframe, points: resampleToN(points, RESAMPLE_N), source: 'mock' }
}

export async function getNews(symbol: string, period: NewsPeriod): Promise<NewsItem[]> {
  const live = await cachedOrNull(`news.${symbol}.${period}`, NEWS_TTL, () =>
    finnhubNews(symbol, period),
  )
  return live ?? mockNews(symbol, period)
}

/**
 * Closing price on (or just before) a date, for '@ date' cost basis. Uses the
 * synthetic master series (5 years), anchored to the current quote. Null when
 * the date is out of range.
 */
export async function priceAtDate(symbol: string, dateISO: string): Promise<number | null> {
  const quote = await getQuote(symbol)
  return mockPriceAtDate(symbol, dateISO, quote.price)
}
