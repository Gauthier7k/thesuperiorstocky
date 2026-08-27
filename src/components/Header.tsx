import { useEffect, useState } from 'react'
import { isMarketOpen } from '../lib/time'

interface HeaderProps {
  inverterOn: boolean
  onToggleInverter: () => void
}

export function Header({ inverterOn, onToggleInverter }: HeaderProps) {
  const [open, setOpen] = useState(() => isMarketOpen())
  useEffect(() => {
    const id = setInterval(() => setOpen(isMarketOpen()), 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="header">
      <div className="brand">
        <div className="wordmark">
          STOCKY<span className="wordmark-rocket">🚀</span>
        </div>
        <div className="slogan">KEEP UP · ALWAYS UP · BE UP</div>
      </div>
      <div className="header-right">
        <button
          className={`inverter ${inverterOn ? 'on' : ''}`}
          onClick={onToggleInverter}
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
