import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { stockMeta } from '../data/stocks'
import { celebrate, type Origin } from '../lib/confetti'
import { hype, toast } from '../lib/toast'
import { useHistory } from '../hooks/useHistory'
import { useQuote } from '../hooks/useQuote'
import type { Timeframe } from '../services/types'
import { BigNumber } from './BigNumber'
import { DeltaChip } from './DeltaChip'
import { HeroChart } from './HeroChart'
import { HypeBanner } from './HypeBanner'
import { SourceBadge } from './SourceBadge'
import { TimeframeSelector } from './TimeframeSelector'

export interface ClickInfo {
  symbol: string
  origin?: Origin
  nonce: number
}

interface StockHeroProps {
  symbol: string
  timeframe: Timeframe
  depressionInverter: boolean
  clickInfo: ClickInfo | null
  onTimeframe: (tf: Timeframe) => void
}

export function StockHero({
  symbol,
  timeframe,
  depressionInverter,
  clickInfo,
  onTimeframe,
}: StockHeroProps) {
  const meta = stockMeta(symbol)
  const quote = useQuote(symbol, 5000)
  const history = useHistory(symbol, timeframe)

  const pts = history?.points ?? null
  const first = pts?.[0]?.price
  const last = pts?.[pts.length - 1]?.price
  const actualUp = first !== undefined && last !== undefined ? last >= first : true
  const inverted = depressionInverter && !actualUp
  const displayUp = actualUp || depressionInverter
  const periodPct = first && last ? ((last - first) / first) * 100 : 0

  // celebration on stock click, once per click, when its data has landed.
  // The pending timer lives in a ref so dep changes (fast timeframe clicks,
  // inverter toggles) can't cancel a burst that's already owed.
  const firedNonce = useRef(0)
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    if (!clickInfo || clickInfo.nonce === firedNonce.current) return
    if (!history || history.symbol !== clickInfo.symbol) return
    firedNonce.current = clickInfo.nonce
    toast(hype.select(symbol, actualUp, inverted, meta.mockVolatility >= 0.5))
    if (displayUp) {
      const origin = clickInfo.origin
      const accent = meta.accent
      clearTimeout(celebrateTimer.current)
      celebrateTimer.current = setTimeout(() => celebrate('select', origin, accent), 300)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clickInfo, history, displayUp, meta.accent])
  useEffect(() => () => clearTimeout(celebrateTimer.current), [])

  // mini burst when a timeframe change flips the chart red → green —
  // rebaselined per symbol so the comparison never spans two different stocks
  const prevUpRef = useRef(actualUp)
  const prevTfRef = useRef(timeframe)
  const prevSymRef = useRef(symbol)
  useEffect(() => {
    if (!history || history.timeframe !== timeframe || history.symbol !== symbol) return
    if (prevSymRef.current !== symbol) {
      prevSymRef.current = symbol
      prevTfRef.current = timeframe
    } else if (prevTfRef.current !== timeframe) {
      if (!prevUpRef.current && actualUp) {
        celebrate('flip', { x: 0.5, y: 0.65 })
        toast(hype.turnedGreen())
      }
      prevTfRef.current = timeframe
    }
    prevUpRef.current = actualUp
  }, [history, timeframe, symbol, actualUp])

  return (
    <section className="hero card">
      <div className="hero-top">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={symbol}
            className="hero-title"
            initial={{ y: 32, scale: 0.85, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -24, scale: 0.9, opacity: 0, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            <span className="hero-emoji">{meta.emoji}</span>
            <span className="hero-symbol">{symbol}</span>
            <span className="hero-name">{meta.name}</span>
          </motion.div>
        </AnimatePresence>
        <SourceBadge source={quote?.source ?? 'mock'} />
      </div>

      <HypeBanner symbol={symbol} up={actualUp} inverted={inverted} />

      <div className="hero-price-row">
        <BigNumber value={quote?.price ?? meta.mockBasePrice} className="hero-price" />
        <DeltaChip pct={periodPct} label={timeframe} inverted={inverted} />
        <AnimatePresence>
          {inverted && (
            <motion.span
              key="inverted"
              className="badge badge-inverted"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: [0, -6, 5, -3, 0] }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              INVERTED 🙃
            </motion.span>
          )}
          {!actualUp && !depressionInverter && (
            <motion.span
              key="dip"
              className="badge badge-dip"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: [0, -6, 5, -3, 0] }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              DIP DEAL 🏷️
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <HeroChart points={pts} up={displayUp} inverted={inverted} timeframe={timeframe} />
      <TimeframeSelector value={timeframe} onChange={onTimeframe} />
    </section>
  )
}
