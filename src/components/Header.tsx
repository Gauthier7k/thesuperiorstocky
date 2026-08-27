import { useEffect, useState } from 'react'
import { isMarketOpen } from '../lib/time'
import { InverterConfirmModal } from './InverterConfirmModal'

interface HeaderProps {
  inverterOn: boolean
  onToggleInverter: () => void
}

export function Header({ inverterOn, onToggleInverter }: HeaderProps) {
  const [open, setOpen] = useState(() => isMarketOpen())
  const [confirmOpen, setConfirmOpen] = useState(false)
  useEffect(() => {
    const id = setInterval(() => setOpen(isMarketOpen()), 60_000)
    return () => clearInterval(id)
  }, [])

  const confirmToggle = () => {
    setConfirmOpen(false)
    onToggleInverter()
  }

  return (
    <header className="header">
      <InverterConfirmModal
        open={confirmOpen}
        onConfirm={confirmToggle}
        onCancel={() => setConfirmOpen(false)}
      />
      <div className="brand">
        <div className="wordmark">
          STOCKY<span className="wordmark-rocket">🚀</span>
        </div>
        <div className="slogan">KEEP UP · ALWAYS UP · BE UP</div>
      </div>
      <div className="header-right">
        <button
          className={`inverter ${inverterOn ? 'on' : ''}`}
          onClick={() => (inverterOn ? setConfirmOpen(true) : onToggleInverter())}
          aria-pressed={inverterOn}
          title="When a stock is down, flip the chart so it only ever goes up."
        >
          🙃 DEPRESSION INVERTER
          <span className="inverter-state">{inverterOn ? 'ON' : 'OFF'}</span>
        </button>
        <div className={`market-pill ${open ? 'open' : ''}`}>
          <span className="market-dot" />
          {open ? 'MARKET IS OPEN' : 'MARKET SLEEPS'}
        </div>
      </div>
    </header>
  )
}
