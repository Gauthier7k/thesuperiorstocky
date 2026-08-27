import { motion } from 'framer-motion'
import type { StockMeta } from '../data/stocks'
import type { Origin } from '../lib/confetti'
import { TickerCard } from './TickerCard'

const railVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
}

interface TickerRailProps {
  stocks: StockMeta[]
  selected: string
  depressionInverter: boolean
  onSelect: (symbol: string, origin: Origin) => void
}

export function TickerRail({ stocks, selected, depressionInverter, onSelect }: TickerRailProps) {
  return (
    <motion.nav
      className="rail"
      aria-label="Stocks"
      variants={railVariants}
      initial="hidden"
      animate="show"
    >
      <div className="rail-label">THE BOARD</div>
      {stocks.map((s) => (
        <TickerCard
          key={s.symbol}
          meta={s}
          selected={s.symbol === selected}
          depressionInverter={depressionInverter}
          onSelect={onSelect}
        />
      ))}
    </motion.nav>
  )
}
