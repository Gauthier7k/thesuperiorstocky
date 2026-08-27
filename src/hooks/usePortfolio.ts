import { useCallback } from 'react'
import type { Holding } from '../services/types'
import { usePersistentState } from './usePersistentState'

export interface Portfolio {
  holdings: Record<string, Holding>
  setHolding: (symbol: string, holding: Holding | null) => void
}

export function usePortfolio(): Portfolio {
  const [holdings, setHoldings] = usePersistentState<Record<string, Holding>>(
    'stonks.portfolio.v1',
    {},
  )

  const setHolding = useCallback(
    (symbol: string, holding: Holding | null) => {
      setHoldings((prev) => {
        const next = { ...prev }
        if (holding) next[symbol] = holding
        else delete next[symbol]
        return next
      })
    },
    [setHoldings],
  )

  return { holdings, setHolding }
}
