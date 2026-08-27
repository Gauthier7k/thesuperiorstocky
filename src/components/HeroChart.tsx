import { area, curveMonotoneX, line } from 'd3-shape'
import { animate, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { extent, formatPct, formatPrice, RESAMPLE_N } from '../lib/seriesMath'
import type { HistoryPoint, Timeframe } from '../services/types'

const W = 800
const H = 320
const PAD = { top: 14, right: 56, bottom: 20, left: 8 }
const INNER_H = H - PAD.top - PAD.bottom

const UP_START = '#2CFF9E'
const UP_END = '#00C8FF'
const DOWN_START = '#FF5C7A'
const DOWN_END = '#7C5CFF'

/** fixed x positions — the morph only ever moves points vertically */
const XS = Array.from(
  { length: RESAMPLE_N },
  (_, i) => PAD.left + (i * (W - PAD.left - PAD.right)) / (RESAMPLE_N - 1),
)

const lineGen = line<number>()
  .x((_, i) => XS[i])
  .y((d) => d)
  .curve(curveMonotoneX)

const areaGen = area<number>()
  .x((_, i) => XS[i])
  .y0(H - PAD.bottom)
  .y1((d) => d)
  .curve(curveMonotoneX)

/** fixed gridline rows; their labels re-read the (lerping) domain each frame */
const GRID_YS = [0, 1, 2, 3].map((k) => PAD.top + (INNER_H * k) / 3)

function yFor(v: number, lo: number, hi: number, inverted: boolean): number {
  const frac = hi === lo ? 0.5 : (v - lo) / (hi - lo)
  return inverted ? PAD.top + frac * INNER_H : PAD.top + (1 - frac) * INNER_H
}

function paddedDomain(prices: number[]): [number, number] {
  let [lo, hi] = extent(prices)
  const pad = (hi - lo) * 0.06 || Math.abs(hi) * 0.01 || 1
  lo -= pad
  hi += pad
  return [lo, hi]
}

function fmtWhen(t: number, tf: Timeframe): string {
  const d = new Date(t)
  if (tf === '1D') return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (tf === '1W') {
    return d.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: tf === '1Y' ? 'numeric' : undefined,
  })
}

interface HeroChartProps {
  points: HistoryPoint[] | null
  /** display direction — already accounts for the Depression Inverter */
  up: boolean
  /** true when the Depression Inverter has flipped the y-axis */
  inverted: boolean
  timeframe: Timeframe
}

export function HeroChart({ points, up, inverted, timeframe }: HeroChartProps) {
  const reduceMotion = useReducedMotion() ?? false

  const areaRef = useRef<SVGPathElement | null>(null)
  const glowRef = useRef<SVGPathElement | null>(null)
  const lineRef = useRef<SVGPathElement | null>(null)
  const shimmerRef = useRef<SVGPathElement | null>(null)
  const dotRef = useRef<SVGCircleElement | null>(null)
  const ringRef = useRef<SVGCircleElement | null>(null)
  const tickRefs = useRef<Array<SVGTextElement | null>>([])
  const stopStartRef = useRef<SVGStopElement | null>(null)
  const stopEndRef = useRef<SVGStopElement | null>(null)
  const areaStopTopRef = useRef<SVGStopElement | null>(null)
  const areaStopBottomRef = useRef<SVGStopElement | null>(null)

  const currentYs = useRef<number[] | null>(null)
  const currentDomain = useRef<[number, number] | null>(null)
  const targetYsRef = useRef<number[] | null>(null)
  const pointsRef = useRef<HistoryPoint[] | null>(null)
  const invertedRef = useRef(inverted)
  const animRef = useRef<{ stop: () => void } | null>(null)
  const colorsRef = useRef<{ start: string; end: string } | null>(null)

  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const writeFrame = (ys: number[], domain: [number, number], invertedNow: boolean) => {
    const dLine = lineGen(ys) ?? ''
    const dArea = areaGen(ys) ?? ''
    lineRef.current?.setAttribute('d', dLine)
    glowRef.current?.setAttribute('d', dLine)
    shimmerRef.current?.setAttribute('d', dLine)
    areaRef.current?.setAttribute('d', dArea)
    const lastY = String(ys[ys.length - 1])
    dotRef.current?.setAttribute('cy', lastY)
    ringRef.current?.setAttribute('cy', lastY)
    const [lo, hi] = domain
    GRID_YS.forEach((gy, i) => {
      const frac = (gy - PAD.top) / INNER_H
      const v = invertedNow ? lo + frac * (hi - lo) : hi - frac * (hi - lo)
      const el = tickRefs.current[i]
      if (el) el.textContent = formatPrice(v)
    })
  }

  // ---- morph engine: lerp pixel-space Ys toward each new series ----
  useEffect(() => {
    if (!points || points.length < 2) return
    invertedRef.current = inverted
    const prices = points.map((p) => p.price)
    const domain = paddedDomain(prices)
    const target = prices.map((v) => yFor(v, domain[0], domain[1], inverted))
    targetYsRef.current = target
    pointsRef.current = points

    animRef.current?.stop()

    if (!currentYs.current || currentYs.current.length !== target.length) {
      // first series: draw it in once, no morph
      currentYs.current = target.slice()
      currentDomain.current = domain
      writeFrame(target, domain, inverted)
      const lineEl = lineRef.current
      const glowEl = glowRef.current
      const shimmerEl = shimmerRef.current
      const areaEl = areaRef.current
      if (lineEl) {
        lineEl.setAttribute('pathLength', '1')
        lineEl.style.strokeDasharray = '1'
        lineEl.style.strokeDashoffset = '1'
        if (glowEl) glowEl.style.opacity = '0'
        if (shimmerEl) shimmerEl.style.opacity = '0'
        if (areaEl) areaEl.style.opacity = '0'
        animate(1, 0, {
          duration: reduceMotion ? 0.2 : 1.1,
          ease: 'easeOut',
          onUpdate: (v) => {
            lineEl.style.strokeDashoffset = String(v)
          },
          onComplete: () => {
            lineEl.style.strokeDasharray = ''
            lineEl.style.strokeDashoffset = ''
            if (shimmerEl) shimmerEl.style.opacity = ''
          },
        })
        animate(0, 1, {
          duration: reduceMotion ? 0.2 : 0.8,
          delay: reduceMotion ? 0 : 0.35,
          onUpdate: (v) => {
            if (areaEl) areaEl.style.opacity = String(v)
            if (glowEl) glowEl.style.opacity = String(v)
          },
        })
      }
      return
    }

    const startYs = currentYs.current.slice()
    const startDomain = currentDomain.current ?? domain
    animRef.current = animate(0, 1, {
      duration: reduceMotion ? 0.15 : 0.75,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (t) => {
        const ys = currentYs.current
        if (!ys) return
        for (let i = 0; i < target.length; i++) {
          ys[i] = startYs[i] + (target[i] - startYs[i]) * t
        }
        const dom: [number, number] = [
          startDomain[0] + (domain[0] - startDomain[0]) * t,
          startDomain[1] + (domain[1] - startDomain[1]) * t,
        ]
        currentDomain.current = dom
        writeFrame(ys, dom, invertedRef.current)
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, inverted, reduceMotion])

  useEffect(() => () => animRef.current?.stop(), [])

  // ---- color crossfade green ↔ red-violet ----
  useEffect(() => {
    const target = up
      ? { start: UP_START, end: UP_END }
      : { start: DOWN_START, end: DOWN_END }
    const from = colorsRef.current ?? target
    colorsRef.current = target
    const applyStart = (c: string) => {
      stopStartRef.current?.setAttribute('stop-color', c)
      areaStopTopRef.current?.setAttribute('stop-color', c)
      areaStopBottomRef.current?.setAttribute('stop-color', c)
    }
    const applyEnd = (c: string) => {
      stopEndRef.current?.setAttribute('stop-color', c)
      if (glowRef.current) glowRef.current.style.stroke = c
      dotRef.current?.setAttribute('fill', c)
      ringRef.current?.setAttribute('stroke', c)
    }
    if (from.start === target.start) {
      applyStart(target.start)
      applyEnd(target.end)
      return
    }
    const a1 = animate(from.start, target.start, { duration: 0.5, onUpdate: applyStart })
    const a2 = animate(from.end, target.end, { duration: 0.5, onUpdate: applyEnd })
    return () => {
      a1.stop()
      a2.stop()
    }
  }, [up])

  // ---- hover / keyboard crosshair ----
  const handleMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const frac = (e.clientX - rect.left) / rect.width
    const idx = Math.max(0, Math.min(RESAMPLE_N - 1, Math.round(frac * (RESAMPLE_N - 1))))
    setHoverIdx(idx)
  }

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      const delta = e.key === 'ArrowLeft' ? -1 : 1
      setHoverIdx((prev) => {
        const base = prev ?? RESAMPLE_N - 1
        return Math.max(0, Math.min(RESAMPLE_N - 1, base + delta))
      })
    } else if (e.key === 'Escape') {
      setHoverIdx(null)
    }
  }

  const hoverPoint =
    hoverIdx !== null && pointsRef.current && targetYsRef.current
      ? {
          idx: hoverIdx,
          x: XS[hoverIdx],
          y: targetYsRef.current[hoverIdx],
          point: pointsRef.current[hoverIdx],
          first: pointsRef.current[0],
        }
      : null
  const hoverDeltaPct = hoverPoint
    ? ((hoverPoint.point.price - hoverPoint.first.price) / hoverPoint.first.price) * 100
    : 0
  const tooltipFlip = hoverPoint !== null && hoverPoint.x > W - 140

  return (
    <div
      className="chart-wrap"
      tabIndex={0}
      role="img"
      aria-label={`Price chart, ${timeframe}. Use left and right arrow keys to inspect points.`}
      onKeyDown={handleKey}
      onBlur={() => setHoverIdx(null)}
    >
      <svg className="hero-chart" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2={W} y2="0" gradientUnits="userSpaceOnUse">
            <stop ref={stopStartRef} offset="0" stopColor={UP_START} />
            <stop ref={stopEndRef} offset="1" stopColor={UP_END} />
          </linearGradient>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop ref={areaStopTopRef} offset="0" stopColor={UP_START} stopOpacity="0.26" />
            <stop ref={areaStopBottomRef} offset="1" stopColor={UP_START} stopOpacity="0" />
          </linearGradient>
          <filter id="chartBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {GRID_YS.map((gy, i) => (
          <g key={gy}>
            <line className="gridline" x1={PAD.left} x2={W - PAD.right} y1={gy} y2={gy} />
            <text
              ref={(el) => {
                tickRefs.current[i] = el
              }}
              className="tick-label"
              x={W - PAD.right + 8}
              y={gy + 4}
            />
          </g>
        ))}

        <path ref={areaRef} className="chart-area" fill="url(#areaGrad)" />
        <path
          ref={glowRef}
          className="chart-glow"
          fill="none"
          stroke={UP_END}
          strokeWidth={10}
          strokeLinejoin="round"
          strokeLinecap="round"
          filter="url(#chartBlur)"
        />
        <path
          ref={lineRef}
          className="chart-line"
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          ref={shimmerRef}
          className="chart-shimmer"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={2}
          strokeLinecap="round"
          pathLength={1}
        />

        {hoverPoint && (
          <g className="crosshair">
            <line
              className="crosshair-line"
              x1={hoverPoint.x}
              x2={hoverPoint.x}
              y1={PAD.top}
              y2={H - PAD.bottom}
            />
            <circle
              className="crosshair-dot"
              cx={hoverPoint.x}
              cy={hoverPoint.y}
              r={5}
              fill={colorsRef.current?.end ?? UP_END}
            />
          </g>
        )}

        <circle
          ref={ringRef}
          className="live-ring"
          cx={XS[RESAMPLE_N - 1]}
          cy={H / 2}
          r={6}
          fill="none"
          stroke={UP_END}
          strokeWidth={2}
        />
        <circle
          ref={dotRef}
          className="live-dot"
          cx={XS[RESAMPLE_N - 1]}
          cy={H / 2}
          r={5}
          fill={UP_END}
        />

        <rect
          className="hover-rect"
          x={PAD.left}
          y={0}
          width={W - PAD.left - PAD.right}
          height={H}
          fill="transparent"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIdx(null)}
        />
      </svg>

      {hoverPoint && (
        <div
          className={`chart-tooltip ${tooltipFlip ? 'flip' : ''}`}
          style={{
            left: `${(hoverPoint.x / W) * 100}%`,
            top: `${(hoverPoint.y / H) * 100}%`,
          }}
        >
          <div className="tooltip-price">{formatPrice(hoverPoint.point.price)}</div>
          <div className="tooltip-when">{fmtWhen(hoverPoint.point.t, timeframe)}</div>
          <div className={`tooltip-delta ${hoverDeltaPct >= 0 ? 'up' : 'down'}`}>
            {hoverDeltaPct >= 0 ? '▲' : '▼'} {formatPct(hoverDeltaPct)}
            {inverted ? ' · inverted 🙃' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
