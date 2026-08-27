import { useEffect, useState } from 'react'
import { getQuote } from '../services/marketData'
import type { Quote } from '../services/types'

/**
 * Polls the quote for a symbol. Keeps the previous symbol's quote until the new
 * one arrives so price displays can count-up from old → new.
 */
export function useQuote(symbol: string, pollMs = 5000): Quote | null {
  const [quote, setQuote] = useState<Quote | null>(null)

  useEffect(() => {
    let alive = true
    const tick = () => {
      void getQuote(symbol).then((q) => {
        if (alive) setQuote(q)
      })
    }
    tick()
    const id = setInterval(tick, pollMs)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [symbol, pollMs])

  return quote
}
