import { useEffect, useRef, useState } from 'react'
import { getNews } from '../services/marketData'
import type { NewsItem, NewsPeriod } from '../services/types'

export interface NewsState {
  /** null only before the very first load (skeletons) */
  items: NewsItem[] | null
  loading: boolean
}

/** News for (symbol, period). Previous items are held while the next set loads. */
export function useNews(symbol: string, period: NewsPeriod): NewsState {
  const [items, setItems] = useState<NewsItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const reqRef = useRef(0)

  useEffect(() => {
    const req = ++reqRef.current
    setLoading(true)
    void getNews(symbol, period).then((list) => {
      if (reqRef.current === req) {
        setItems(list)
        setLoading(false)
      }
    })
  }, [symbol, period])

  return { items, loading }
}
