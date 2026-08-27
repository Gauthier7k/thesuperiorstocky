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

  // shares kept as raw string so "0.5" and leading zeros type naturally
  const [sharesStr, setSharesStr] = useState<string>(
    holding?.shares ? String(holding.shares) : '',
  )
  const [mode, setMode] = useState<'price' | 'date'>(holding?.mode ?? 'price')
  const [price, setPrice] = useState<string>(
    holding?.mode !== 'date' && holding?.costBasis != null ? String(holding.costBasis) : '',
  )
  const [date, setDate] = useState<string>(holding?.buyDate ?? '')
  const [dateBasis, setDateBasis] = useState<number | null>(null)
  const [dateLookupPending, setDateLookupPending] = useState(false)

  const shares = Math.max(0, parseFloat(sharesStr) || 0)

  // re-seed local form state when the selected stock changes
  useEffect(() => {
    setSharesStr(holding?.shares ? String(holding.shares) : '')
    setMode(holding?.mode ?? 'price')
    setPrice(holding?.mode !== 'date' && holding?.costBasis != null ? String(holding.costBasis) : '')
    setDate(holding?.buyDate ?? '')
    setDateBasis(null)
    prevSharesRef.current = holding?.shares ?? 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol])

  // '@ date' mode looks up the price on that day
  useEffect(() => {
    if (mode !== 'date' || !date) {
      setDateBasis(null)
      setDateLookupPending(false)
      return
    }
    let alive = true
    setDateLookupPending(true)
    void priceAtDate(symbol, date).then((v) => {
      if (alive) {
        setDateBasis(v)
        setDateLookupPending(false)
      }
    })
    return () => {
      alive = false
    }
  }, [mode, date, symbol])

  // '@ date' basis freezes at first resolution per (symbol, date) — stored on
  // the holding so the anchored synthetic series can't make it drift.
  const frozenDateBasis =
    holding?.mode === 'date' && holding.buyDate === date ? holding.costBasis ?? null : null
  useEffect(() => {
    if (mode !== 'date' || !date || dateBasis === null) return
    if (shares > 0 && frozenDateBasis === null) {
      onChange({ shares, mode: 'date', buyDate: date, costBasis: dateBasis })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, date, dateBasis, shares])

  const effectiveDateBasis = frozenDateBasis ?? dateBasis
  const basis = mode === 'price' ? parseFloat(price) || 0 : effectiveDateBasis ?? 0
  const pnl = quote && quote.symbol === symbol ? computePnl(shares, basis, quote.price) : null

  const persist = (s: number, m: 'price' | 'date', p: string, d: string) => {
    if (s > 0) {
      onChange({
        shares: s,
        mode: m,
        costBasis: m === 'price' ? parseFloat(p) || undefined : effectiveDateBasis ?? undefined,
        buyDate: m === 'date' ? d || undefined : undefined,
      })
    } else {
      onChange(null)
    }
  }

  const prevSharesRef = useRef(0)

  const fireForPnl = (cheerDip = false) => {
    if (pnl && pnl.pl > 0 && (pnl.pl >= 100 || pnl.plPct >= 10)) {
      celebrate('jackpot', { x: 0.85, y: 0.4 }, meta.accent)
      toast(hype.profit(), 'win')
    } else if (cheerDip && pnl && pnl.pl < 0 && Math.random() < 0.35) {
      toast(hype.holdingDip(), 'chill')
    }
  }

  const commit = () => {
    persist(shares, mode, price, date)
    prevSharesRef.current = shares
    fireForPnl(true)
  }

  // celebrate the moment P/L first flips positive — real values only, per
  // symbol, once per selection, so loading states and the mock quote's ±0.2%
  // wobble can never fire confetti on their own.
  const prevPlRef = useRef<{ symbol: string; pl: number } | null>(null)
  const flipCelebratedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!pnl) {
      prevPlRef.current = null // loading / mid-edit / stale quote: not a real P/L of 0
      return
    }
    const prev = prevPlRef.current
    if (
      prev !== null &&
      prev.symbol === symbol &&
      prev.pl <= 0 &&
      pnl.pl > 0 &&
      flipCelebratedRef.current !== symbol
    ) {
      flipCelebratedRef.current = symbol
      fireForPnl()
    }
    if (prev?.symbol !== symbol) flipCelebratedRef.current = null
    prevPlRef.current = { symbol, pl: pnl.pl }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pnl?.pl, symbol])

  const step = (delta: number) => {
    const next = Math.max(0, shares + delta)
    setSharesStr(next ? String(next) : '')
    persist(next, mode, price, date)
    prevSharesRef.current = next
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
            value={sharesStr}
            placeholder="0"
            onChange={(e) => setSharesStr(e.target.value)}
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
        <span className="mode-toggle" role="group" aria-label="Cost basis input">
          {(['price', 'date'] as const).map((m) => (
            <button
              key={m}
              aria-pressed={mode === m}
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
            min={isoDaysAgo(1700)}
            max={isoDaysAgo(0)}
            onChange={(e) => setDate(e.target.value)}
            onBlur={commit}
            aria-label="Buy date"
          />
        )}
      </div>

      {mode === 'date' && date && (
        <div className="basis-hint">
          {dateLookupPending && effectiveDateBasis === null
            ? "checking that day's price…"
            : effectiveDateBasis !== null
              ? `≈ ${formatPrice(effectiveDateBasis)} that day`
              : 'that date is a bit too far back 📼'}
        </div>
      )}

      <div className="pl-divider" />

      {pnl && shares > 0 ? (
        <motion.div
          className={`pl-readout ${pnl.pl >= 0 ? 'pl-up' : 'pl-down'}`}
          key={`${symbol}-${pnl.pl >= 0 ? 'up' : 'down'}`}
          initial={{ scale: 0.96, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
          <div className="pl-line">
            <span className="pl-word">
              You're{' '}
              {pnl.pl >= 0 ? 'up' : <strong className="pl-up-lie">&quot;up&quot;</strong>}
            </span>
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
        </motion.div>
      ) : (
        <div className="pl-empty">Add your shares to see your gains 🎯</div>
      )}
    </section>
  )
}
