export type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y'
export type NewsPeriod = 'daily' | 'weekly' | 'monthly'
export type DataSource = 'finnhub' | 'twelvedata' | 'mock'

export interface Quote {
  symbol: string
  price: number
  /** dollar change vs previous close */
  change: number
  /** percent change vs previous close */
  changePercent: number
  open: number
  high: number
  low: number
  prevClose: number
  ts: number
  source: DataSource
}

export interface HistoryPoint {
  t: number
  price: number
}

export interface HistoryResult {
  symbol: string
  timeframe: Timeframe
  /** always resampled to exactly RESAMPLE_N points by the facade */
  points: HistoryPoint[]
  source: DataSource
}

export interface NewsItem {
  id: string
  headline: string
  source: string
  ts: number
  url?: string
  sentiment: 'bullish' | 'watch'
}

/** A user's position in one stock, persisted to localStorage. */
export interface Holding {
  shares: number
  /** which input the user chose for cost basis */
  mode: 'price' | 'date'
  costBasis?: number
  /** ISO date 'YYYY-MM-DD' */
  buyDate?: string
}
