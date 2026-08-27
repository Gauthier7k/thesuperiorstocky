import { useEffect, useState } from 'react'
import { getQuote } from '../services/marketData'
import type { Quote } from '../services/types'

export type WinnerPopup = 'tired' | 'too-much'

export interface WinnerTiers {
  /** Top-half winners — "Are you tired of winning?" */
  tired: Set<string>
  /** Bottom 15% of that winner pool — "It's too much winning, Mr. President." */
  tooMuch: Set<string>
}

function computeWinnerTiers(quotes: Quote[]): WinnerTiers {
  const ranked = [...quotes].sort((a, b) => b.changePercent - a.changePercent)
  const winnerCount = Math.max(1, Math.ceil(ranked.length / 2))
  const winners = ranked.slice(0, winnerCount)
  const bottomSlice = Math.max(1, Math.ceil(winnerCount * 0.15))
  const tooMuch = new Set(winners.slice(-bottomSlice).map((q) => q.symbol))
  const tired = new Set(
    winners.filter((q) => !tooMuch.has(q.symbol)).map((q) => q.symbol),
  )
  return { tired, tooMuch }
}

/** Ranks the board and buckets winners for presidential popups. */
export function useWinnerTiers(symbols: string[], pollMs = 20_000): WinnerTiers {
  const [tiers, setTiers] = useState<WinnerTiers>(() => ({ tired: new Set(), tooMuch: new Set() }))

  useEffect(() => {
    let alive = true
    const tick = async () => {
      const quotes = await Promise.all(symbols.map((s) => getQuote(s)))
      if (!alive) return
      setTiers(computeWinnerTiers(quotes))
    }
    void tick()
    const id = setInterval(() => void tick(), pollMs)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [symbols.join(','), pollMs])

  return tiers
}

export function winnerPopupFor(symbol: string, tiers: WinnerTiers): WinnerPopup | null {
  if (tiers.tooMuch.has(symbol)) return 'too-much'
  if (tiers.tired.has(symbol)) return 'tired'
  return null
}
