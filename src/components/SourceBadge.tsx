import type { DataSource } from '../services/types'

/** Tiny LIVE / SIM pill so we always know which mode the demo is in. */
export function SourceBadge({ source }: { source: DataSource }) {
  const live = source !== 'mock'
  return (
    <span
      className={`source-badge ${live ? 'live' : 'sim'}`}
      title={
        live
          ? 'Prices are live from Finnhub'
          : 'Simulation mode — deterministic synthetic data (no key or offline)'
      }
    >
      <span className="source-dot" />
      {live ? 'LIVE' : 'SIM'}
    </span>
  )
}
