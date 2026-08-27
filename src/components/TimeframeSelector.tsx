import { motion } from 'framer-motion'
import { TIMEFRAMES } from '../lib/time'
import type { Timeframe } from '../services/types'

interface TimeframeSelectorProps {
  value: Timeframe
  onChange: (tf: Timeframe) => void
}

export function TimeframeSelector({ value, onChange }: TimeframeSelectorProps) {
  return (
    <div className="tf-row" role="tablist" aria-label="Timeframe">
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf}
          role="tab"
          aria-selected={tf === value}
          className={`tf-btn ${tf === value ? 'on' : ''}`}
          onClick={() => onChange(tf)}
        >
          {tf === value && (
            <motion.span
              layoutId="tfPill"
              className="tf-pill"
              transition={{ type: 'spring', stiffness: 600, damping: 35 }}
            />
          )}
          <span className="tf-label">{tf}</span>
        </button>
      ))}
    </div>
  )
}
