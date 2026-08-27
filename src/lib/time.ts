import type { NewsPeriod, Timeframe } from '../services/types'

export const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '3M', '1Y']

export interface TimeframeSpec {
  /** trading days of daily closes the timeframe covers */
  tradingDays: number
  /** whether the series is built from intraday subdivisions */
  intraday: boolean
}

export const TF_SPEC: Record<Timeframe, TimeframeSpec> = {
  '1D': { tradingDays: 1, intraday: true },
  '1W': { tradingDays: 5, intraday: true },
  '1M': { tradingDays: 22, intraday: false },
  '3M': { tradingDays: 66, intraday: false },
  '1Y': { tradingDays: 252, intraday: false },
}

export const NEWS_DAYS: Record<NewsPeriod, number> = { daily: 1, weekly: 7, monthly: 30 }

export const DAY_MS = 86_400_000
/** a US cash session is 6.5 hours */
export const SESSION_MS = 6.5 * 3_600_000

/** most recent weekday (a stand-in for the last trading day) */
export function lastTradingDay(now = new Date()): Date {
  const d = new Date(now)
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1)
  return d
}

/**
 * Timestamps (ms, at 16:00 local ≈ close) for the last `count` trading days,
 * oldest → newest.
 */
export function tradingDayStamps(count: number, now = new Date()): number[] {
  const stamps: number[] = []
  const d = lastTradingDay(now)
  d.setHours(16, 0, 0, 0)
  while (stamps.length < count) {
    if (d.getDay() !== 0 && d.getDay() !== 6) stamps.push(d.getTime())
    d.setDate(d.getDate() - 1)
  }
  return stamps.reverse()
}

export function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString().slice(0, 10)
}

export function timeAgo(ts: number): string {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d}d ago`
  if (d < 32) return `${Math.round(d / 7)}w ago`
  return `${Math.round(d / 30)}mo ago`
}

/** rough US market-hours check (9:30–16:00 ET, weekdays) */
export function isMarketOpen(now = new Date()): boolean {
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = et.getDay()
  if (day === 0 || day === 6) return false
  const mins = et.getHours() * 60 + et.getMinutes()
  return mins >= 9 * 60 + 30 && mins < 16 * 60
}
