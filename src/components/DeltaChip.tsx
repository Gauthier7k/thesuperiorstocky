import { formatPct } from '../lib/seriesMath'

interface DeltaChipProps {
  pct: number
  label?: string
  /** Depression Inverter active on a down move — show it as up, flagged */
  inverted?: boolean
  small?: boolean
}

/**
 * Direction chip. The arrow is the mandatory non-color cue: ▲ up, ▼ down,
 * ⤴ "down but inverted" (the Depression Inverter at work).
 */
export function DeltaChip({ pct, label, inverted = false, small = false }: DeltaChipProps) {
  const up = pct >= 0
  const arrow = inverted && !up ? '⤴' : up ? '▲' : '▼'
  const shown = inverted && !up ? Math.abs(pct) : pct
  const tone = inverted && !up ? 'chip-flip' : up ? 'chip-up' : 'chip-down'
  return (
    <span
      className={`chip ${tone} ${small ? 'chip-small' : ''}`}
      title={inverted && !up ? 'Inverted by the Depression Inverter — actually down' : undefined}
    >
      {arrow} {formatPct(shown)}
      {label ? ` · ${label}` : ''}
    </span>
  )
}
