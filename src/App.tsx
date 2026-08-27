import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { Header } from './components/Header'
import { NewsFeed } from './components/NewsFeed'
import { PortfolioPanel } from './components/PortfolioPanel'
import { StockHero, type ClickInfo } from './components/StockHero'
import { TickerRail } from './components/TickerRail'
import { ToastLayer } from './components/ToastLayer'
import { STOCKS } from './data/stocks'
import type { Origin } from './lib/confetti'
import { hype, toast } from './lib/toast'
import { usePersistentState } from './hooks/usePersistentState'
import { usePortfolio } from './hooks/usePortfolio'
import type { NewsPeriod, Timeframe } from './services/types'

export default function App() {
  const [selected, setSelected] = usePersistentState<string>('stonks.selected.v1', 'AAPL')
  const [timeframe, setTimeframe] = usePersistentState<Timeframe>('stonks.timeframe.v1', '1M')
  const [inverterOn, setInverterOn] = usePersistentState<boolean>('stonks.inverter.v1', true)
  const [newsPeriod, setNewsPeriod] = useState<NewsPeriod>('daily')
  const { holdings, setHolding } = usePortfolio()

  const [clickInfo, setClickInfo] = useState<ClickInfo | null>(null)
  const nonceRef = useRef(0)

  const handleSelect = (symbol: string, origin: Origin) => {
    setSelected(symbol)
    setClickInfo({ symbol, origin, nonce: ++nonceRef.current })
  }

  const toggleInverter = () => {
    setInverterOn((v) => {
      toast(hype.inverter(!v))
      return !v
    })
  }

  return (
    <div className="app">
      <ToastLayer />
      <Header inverterOn={inverterOn} onToggleInverter={toggleInverter} />
      <motion.main
        className="grid"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <TickerRail
          stocks={STOCKS}
          selected={selected}
          depressionInverter={inverterOn}
          onSelect={handleSelect}
        />
        <StockHero
          symbol={selected}
          timeframe={timeframe}
          depressionInverter={inverterOn}
          clickInfo={clickInfo}
          onTimeframe={setTimeframe}
        />
        <aside className="side">
          <PortfolioPanel
            symbol={selected}
            holding={holdings[selected]}
            onChange={(h) => setHolding(selected, h)}
          />
          <NewsFeed symbol={selected} period={newsPeriod} onPeriod={setNewsPeriod} />
        </aside>
      </motion.main>
    </div>
  )
}
