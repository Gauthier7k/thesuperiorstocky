import { AnimatePresence, motion } from 'framer-motion'
import { timeAgo } from '../lib/time'
import { useNews } from '../hooks/useNews'
import type { NewsPeriod } from '../services/types'

const PERIODS: Array<{ key: NewsPeriod; label: string }> = [
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
]

interface NewsFeedProps {
  symbol: string
  period: NewsPeriod
  onPeriod: (p: NewsPeriod) => void
}

export function NewsFeed({ symbol, period, onPeriod }: NewsFeedProps) {
  const { items, loading } = useNews(symbol, period)

  return (
    <section className="card news">
      <div className="panel-title">📰 The Buzz</div>

      <div className="news-tabs" role="group" aria-label="News period">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            aria-pressed={period === p.key}
            className={`tab ${period === p.key ? 'on' : ''}`}
            onClick={() => onPeriod(p.key)}
          >
            {period === p.key && (
              <motion.span
                layoutId="newsTab"
                className="tab-pill"
                transition={{ type: 'spring', stiffness: 600, damping: 35 }}
              />
            )}
            <span className="tab-label">{p.label}</span>
          </button>
        ))}
      </div>

      <div className={`news-list ${loading && items ? 'is-stale' : ''}`}>
        {items === null ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="news-skel" />
            ))}
          </>
        ) : (
          <AnimatePresence mode="popLayout">
            {items.map((n, i) => (
              <motion.article
                key={`${period}-${n.id}`}
                className="news-card"
                initial={{ x: 16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -16, opacity: 0, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 350, damping: 30, delay: i * 0.04 }}
              >
                <div className="news-eyebrow">
                  {n.source} · {timeAgo(n.ts)}
                </div>
                <div className="news-headline">
                  {n.url ? (
                    <a href={n.url} target="_blank" rel="noreferrer">
                      {n.headline}
                    </a>
                  ) : (
                    n.headline
                  )}
                </div>
                <span className={`chip chip-small ${n.sentiment === 'bullish' ? 'chip-up' : 'chip-watch'}`}>
                  {n.sentiment === 'bullish' ? '▲ Bullish' : '▼ On watch'}
                </span>
              </motion.article>
            ))}
          </AnimatePresence>
        )}
      </div>
    </section>
  )
}
