import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { stockMeta } from '../data/stocks'
import { celebrate } from '../lib/confetti'
import { computePnl } from '../lib/pnl'
import { formatPct, formatPrice } from '../lib/seriesMath'
import { isoDaysAgo } from '../lib/time'
import { hype, toast } from '../lib/toast'
import { useQuote } from '../hooks/useQuote'
import { priceAtDate } from '../services/marketData'
import type { Holding } from '../services/types'
import { BigNumber } from './BigNumber'

interface PortfolioPanelProps {
  symbol: string
  holding: Holding | undefined
  onChange: (holding: Holding | null) => void
}

/** "I own N shares of X, bought @ price / @ date" → celebrated P/L. */
export function PortfolioPanel({ symbol, holding, onChange }: PortfolioPanelProps) {
  const meta = stockMeta(symbol)
  const quote = useQuote(symbol, 15_000)

  const [shares, setShares] = useState<number>(holding?.shares ?? 0)
  const [mode, setMode] = useState<'price' | 'date'>(holding?.mode ?? 'price')
  const [price, setPrice] = useState<string>(holding?.costBasis != null ? String(holding.costBasis) : '')
  const [date, setDate] = useState<string>(holding?.buyDate ?? '')
  const [dateBasis, setDateBasis] = useState<number | null>(null)

  // re-seed local form state when the selected stock changes
  useEffect(() => {
    setShares(holding?.shares ?? 0)
    setMode(holding?.mode ?? 'price')
    setPrice(holding?.costBasis != null ? String(holding.costBasis) : '')
    setDate(holding?.buyDate ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol])

  // '@ date' mode looks up the price on that day
  useEffect(() => {
    if (mode !== 'date' || !date) {
      setDateBasis(null)
      return
    }
    let alive = true
    void priceAtDate(symbol, date).then((v) => {
      if (alive) setDateBasis(v)
    })
    return () => {
      alive = false
    }
  }, [mode, date, symbol])

  const basis = mode === 'price' ? parseFloat(price) || 0 : dateBasis ?? 0
  const pnl = quote && quote.symbol === symbol ? computePnl(shares, basis, quote.price) : null

  const persist = (s: number, m: 'price' | 'date', p: string, d: string) => {
    if (s > 0) {
      onChange({
        shares: s,
        mode: m,
        costBasis: m === 'price' ? parseFloat(p) || undefined : undefined,
        buyDate: m === 'date' ? d || undefined : undefined,
      })
    } else {
      onChange(null)
    }
  }

  const fireForPnl = () => {
    if (pnl && pnl.pl > 0) {
      const tier = pnl.pl >= 100 || pnl.plPct >= 10 ? 'jackpot' : 'profit'
      celebrate(tier, { x: 0.85, y: 0.4 }, meta.accent)
      toast(hype.profit())
    } else if (pnl && pnl.pl < 0 && Math.random() < 0.5) {
      toast(hype.holdingDip())
    }
  }

  const commit = () => {
    persist(shares, mode, price, date)
    fireForPnl()
  }

  // celebrate the moment P/L first flips positive
  const prevPlRef = useRef<number>(0)
  useEffect(() => {
    const pl = pnl?.pl ?? 0
    if (prevPlRef.current <= 0 && pl > 0) fireForPnl()
    prevPlRef.current = pl
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pnl?.pl])

  const step = (delta: number) => {
    const next = Math.max(0, shares + delta)
    setShares(next)
    persist(next, mode, price, date)
    if (next > 0 && delta > 0) fireForPnl()
  }

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit()
  }

  return (
    <section className="card portfolio">
      <div className="panel-title">💼 Your Bag</div>

      <div className="sentence">
        <span className="sentence-word">I own</span>
        <span className="shares-group">
          <motion.button className="stepper" whileTap={{ scale: 0.88 }} onClick={() => step(-1)} aria-label="One share fewer">
            −
          </motion.button>
          <input
            className="shares-input"
            type="number"
            min={0}
            step="any"
            value={shares === 0 ? '' : shares}
            placeholder="0"
            onChange={(e) => setShares(Math.max(0, parseFloat(e.target.value) || 0))}
            onBlur={commit}
            onKeyDown={onEnter}
            aria-label="Shares owned"
          />
          <motion.button className="stepper" whileTap={{ scale: 0.88 }} onClick={() => step(1)} aria-label="One share more">
            +
          </motion.button>
        </span>
        <span className="sentence-word">
          shares of <strong>{symbol}</strong>
        </span>
      </div>

      <div className="sentence">
        <span className="sentence-word">bought</span>
        <span className="mode-toggle" role="tablist" aria-label="Cost basis input">
          {(['price', 'date'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              className={`mode-btn ${mode === m ? 'on' : ''}`}
              onClick={() => {
                setMode(m)
                persist(shares, m, price, date)
              }}
            >
              {mode === m && (
                <motion.span
                  layoutId="buyMode"
                  className="mode-pill"
                  transition={{ type: 'spring', stiffness: 600, damping: 35 }}
                />
              )}
              <span className="mode-label">{m === 'price' ? '@ price' : '@ date'}</span>
            </button>
          ))}
        </span>
        {mode === 'price' ? (
          <span className="basis-group">
            <span className="basis-prefix">$</span>
            <input
              className="basis-input"
              type="number"
              min={0}
              step="any"
              value={price}
              placeholder={quote ? quote.price.toFixed(2) : '0.00'}
              onChange={(e) => setPrice(e.target.value)}
              onBlur={commit}
              onKeyDown={onEnter}
              aria-label="Buy price per share"
            />
          </span>
        ) : (
          <input
            className="basis-input date-input"
            type="date"
            value={date}
            min={isoDaysAgo(365 * 5 - 10)}
            max={isoDaysAgo(0)}
            onChange={(e) => setDate(e.target.value)}
            onBlur={commit}
            aria-label="Buy date"
          />
        )}
      </div>

      {mode === 'date' && date && (
        <div className="basis-hint">
          {dateBasis !== null
            ? `≈ ${formatPrice(dateBasis)} that day`
            : 'that date is a bit too far back 📼'}
        </div>
      )}

      <div className="pl-divider" />

      {pnl && shares > 0 ? (
        <div className={`pl-readout ${pnl.pl >= 0 ? 'pl-up' : 'pl-down'}`}>
          <div className="pl-line">
            <span className="pl-word">You're {pnl.pl >= 0 ? 'up' : 'down'}</span>
            <BigNumber value={Math.abs(pnl.pl)} className="pl-big" />
            <span className="pl-emoji">{pnl.pl >= 0 ? '🎉' : '💎'}</span>
          </div>
          <div className="pl-sub">
            {pnl.pl >= 0
              ? `▲ ${formatPct(pnl.plPct)} since you bought`
              : `▼ ${formatPct(Math.abs(pnl.plPct), false)} — that's a ${Math.abs(pnl.plPct).toFixed(0)}% discount if you're buying`}
          </div>
          <div className="pl-meta">
            {shares} {shares === 1 ? 'share' : 'shares'} · basis {formatPrice(pnl.basis)} · now{' '}
            {quote ? formatPrice(quote.price) : '—'}
          </div>
        </div>
      ) : (
        <div className="pl-empty">Add your shares to see your gains 🎯</div>
      )}
    </section>
  )
}
