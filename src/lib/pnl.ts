export interface PnL {
  basis: number
  cost: number
  marketValue: number
  pl: number
  plPct: number
}

/** Pure P/L math — basis resolution (price vs date) happens at the call site. */
export function computePnl(shares: number, basis: number, price: number): PnL | null {
  if (!(shares > 0) || !(basis > 0) || !(price > 0)) return null
  const cost = shares * basis
  const marketValue = shares * price
  const pl = marketValue - cost
  return { basis, cost, marketValue, pl, plPct: (pl / cost) * 100 }
}
