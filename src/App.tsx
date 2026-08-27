import { MotionConfig, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Header } from './components/Header'
import { NewsFeed } from './components/NewsFeed'
import { PortfolioPanel } from './components/PortfolioPanel'
import { SafetyNudgeModal } from './components/SafetyNudgeModal'
import { StockHero, type ClickInfo } from './components/StockHero'
import { TiredOfWinningModal } from './components/TiredOfWinningModal'
import { TickerRail } from './components/TickerRail'
import { ToastLayer } from './components/ToastLayer'
import { STOCKS } from './data/stocks'
import type { Origin } from './lib/confetti'
import { hype, toast } from './lib/toast'
import { usePersistentState } from './hooks/usePersistentState'
import { useWinnerTiers, winnerPopupFor, type WinnerPopup } from './hooks/useTopChangers'
import { usePortfolio } from './hooks/usePortfolio'
import type { NewsPeriod, Timeframe } from './services/types'

const STOCK_SYMBOLS = STOCKS.map((s) => s.symbol)
const SAFETY_NUDGE_MS = 22_000

export default function App() {
  const [selected, setSelected] = usePersistentState<string>('stonks.selected.v1', 'AAPL')
  const [timeframe, setTimeframe] = usePersistentState<Timeframe>('stonks.timeframe.v1', '1M')
  const [inverterOn, setInverterOn] = usePersistentState<boolean>('stonks.inverter.v1', true)
  const [newsPeriod, setNewsPeriod] = useState<NewsPeriod>('daily')
  const { holdings, setHolding } = usePortfolio()

  const [clickInfo, setClickInfo] = useState<ClickInfo | null>(null)
  const [trumpModal, setTrumpModal] = useState<{
    open: boolean
    symbol: string
    variant: WinnerPopup
  }>({
    open: false,
    symbol: '',
    variant: 'tired',
  })
  const nonceRef = useRef(0)
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const nudgeSnoozedRef = useRef(false)
  const [safetyNudgeOpen, setSafetyNudgeOpen] = useState(false)
  const winnerTiers = useWinnerTiers(STOCK_SYMBOLS)

  useEffect(() => {
    if (inverterOn) {
      setSafetyNudgeOpen(false)
      nudgeSnoozedRef.current = false
      clearTimeout(nudgeTimerRef.current)
      return
    }
    if (nudgeSnoozedRef.current) return

    nudgeTimerRef.current = setTimeout(() => setSafetyNudgeOpen(true), SAFETY_NUDGE_MS)
    return () => clearTimeout(nudgeTimerRef.current)
  }, [inverterOn])

  const enableInverter = () => {
    setInverterOn(true)
    toast(hype.inverter(true), 'flip')
    setSafetyNudgeOpen(false)
  }

  const handleSelect = (symbol: string, origin: Origin) => {
    setSelected(symbol)
    setClickInfo({ symbol, origin, nonce: ++nonceRef.current })
    const variant = winnerPopupFor(symbol, winnerTiers)
    if (variant) {
      setTrumpModal({ open: true, symbol, variant })
    }
  }

  const toggleInverter = () => {
    setInverterOn((v) => {
      const next = !v
      toast(hype.inverter(next), next ? 'flip' : 'chill')
      return next
    })
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="app">
      <ToastLayer />
      <TiredOfWinningModal
        open={trumpModal.open}
        symbol={trumpModal.symbol}
        variant={trumpModal.variant}
        onClose={() => setTrumpModal((m) => ({ ...m, open: false }))}
      />
      <SafetyNudgeModal
        open={safetyNudgeOpen}
        onReturn={enableInverter}
        onDismiss={() => {
          nudgeSnoozedRef.current = true
          setSafetyNudgeOpen(false)
        }}
      />
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
    </MotionConfig>
  )
}
