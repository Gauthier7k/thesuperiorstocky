import type { HistoryPoint } from '../services/types'

/**
 * Every rendered series has exactly this many points — the invariant that lets
 * the chart morph between any two stocks/timeframes with a plain array lerp.
 */
export const RESAMPLE_N = 120

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

/** Linear-interpolate a series onto `n` evenly spaced timestamps. */
export function resampleToN(points: HistoryPoint[], n = RESAMPLE_N): HistoryPoint[] {
  if (points.length === 0) return []
  if (points.length === 1) {
    return Array.from({ length: n }, () => ({ ...points[0] }))
  }
  const t0 = points[0].t
  const t1 = points[points.length - 1].t
  const out: HistoryPoint[] = []
  let j = 0
  for (let i = 0; i < n; i++) {
    const t = t0 + ((t1 - t0) * i) / (n - 1)
    while (j < points.length - 2 && points[j + 1].t < t) j++
    const a = points[j]
    const b = points[j + 1] ?? a
    const span = b.t - a.t
    const f = span === 0 ? 0 : clamp01((t - a.t) / span)
    out.push({ t, price: a.price + (b.price - a.price) * f })
  }
  return out
}

export function extent(values: number[]): [number, number] {
  let lo = Infinity
  let hi = -Infinity
  for (const v of values) {
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  return [lo, hi]
}

/** ~`count` round tick values inside [min, max] */
export function niceTicks(min: number, max: number, count = 4): number[] {
  const range = max - min
  if (range <= 0 || !isFinite(range)) return [min]
  const rawStep = range / count
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const norm = rawStep / mag
  const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag
  const ticks: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max + step / 1e6; v += step) {
    ticks.push(v)
  }
  return ticks
}

export function formatPrice(v: number): string {
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  if (abs >= 1000) {
    return `${sign}$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  }
  return `${sign}$${abs.toFixed(2)}`
}

export function formatPct(pct: number, withSign = true): string {
  const sign = withSign && pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(2)}%`
}
