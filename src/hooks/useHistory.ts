import { useEffect, useRef, useState } from 'react'
import { getHistory } from '../services/marketData'
import type { HistoryResult, Timeframe } from '../services/types'

/**
 * History for (symbol, timeframe), always RESAMPLE_N points. Previous data is
 * kept while the next series loads — that's what the chart morphs from. A
 * request counter drops out-of-order responses when the user clicks fast.
 */
export function useHistory(symbol: string, timeframe: Timeframe): HistoryResult | null {
  const [state, setState] = useState<HistoryResult | null>(null)
  const reqRef = useRef(0)

  useEffect(() => {
    const req = ++reqRef.current
    void getHistory(symbol, timeframe).then((r) => {
      if (reqRef.current === req) setState(r)
    })
  }, [symbol, timeframe])

  return state
}
