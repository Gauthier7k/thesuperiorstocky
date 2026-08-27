import { line as d3line, curveMonotoneX } from 'd3-shape'
import { motion } from 'framer-motion'
import { useMemo, type CSSProperties } from 'react'
import type { StockMeta } from '../data/stocks'
import type { Origin } from '../lib/confetti'
import { extent, formatPrice } from '../lib/seriesMath'
import { useHistory } from '../hooks/useHistory'
import { useQuote } from '../hooks/useQuote'
import { DeltaChip } from './DeltaChip'

const SPARK_W = 200
const SPARK_H = 44
const SPARK_PTS = 40

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
}

interface TickerCardProps {
  meta: StockMeta
  selected: boolean
  depressionInverter: boolean
  onSelect: (symbol: string, origin: Origin) => void
}

export function TickerCard({ meta, selected, depressionInverter, onSelect }: TickerCardProps) {
  const quote = useQuote(meta.symbol, 60_000)
  const history = useHistory(meta.symbol, '1M')

  const spark = useMemo(() => {
    const pts = history?.points
    if (!pts || pts.length < 2) return null
    const step = Math.max(1, Math.floor(pts.length / SPARK_PTS))
    const sampled = pts.filter((_, i) => i % step === 0 || i === pts.length - 1)
    const prices = sampled.map((p) => p.price)
    const up = prices[prices.length - 1] >= prices[0]
    const flip = depressionInverter && !up
    const returnPct = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100
    const [lo, hi] = extent(prices)
    const range = hi - lo || 1
    const ys = prices.map((v) => {
      const frac = (v - lo) / range
      const f = flip ? frac : 1 - frac
      return 4 + f * (SPARK_H - 8)
    })
    const gen = d3line<number>()
      .x((_, i) => (i * SPARK_W) / (ys.length - 1))
      .y((d) => d)
      .curve(curveMonotoneX)
    return { d: gen(ys) ?? '', up: up || flip, returnPct }
  }, [history, depressionInverter])

  const sparkTilt = spark !== null && depressionInverter && Math.abs(spark.returnPct) < 5

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onSelect(meta.symbol, {
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    })
  }

  return (
    <motion.button
      className={`ticker-card ${selected ? 'is-selected' : ''}`}
      style={{ '--accent': meta.accent } as CSSProperties}
      variants={cardVariants}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={handleClick}
      aria-pressed={selected}
    >
      {selected && (
        <motion.span
          layoutId="selectedRing"
          className="card-ring"
          transition={{ type: 'spring', stiffness: 500, damping: 34 }}
        />
      )}
      <span className="ticker-head">
        <span className="ticker-emoji">{meta.emoji}</span>
        <span className="ticker-symbol">{meta.symbol}</span>
        <span className="ticker-price">{quote ? formatPrice(quote.price) : '—'}</span>
      </span>
      <svg
        className={`spark${sparkTilt ? ' spark-tilt' : ''}`}
        viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
        aria-hidden="true"
      >
        {spark && <path d={spark.d} className={spark.up ? 'spark-up' : 'spark-down'} />}
      </svg>
      <span className="ticker-foot">
        <span className="ticker-name">{meta.name}</span>
        {quote && (
          <DeltaChip
            pct={quote.changePercent}
            inverted={depressionInverter && quote.changePercent < 0}
            small
          />
        )}
      </span>
    </motion.button>
  )
}
