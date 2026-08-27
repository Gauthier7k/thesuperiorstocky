/** Sliding-window request budget — skip a provider entirely once exhausted. */
export interface Budget {
  canSpend(): boolean
  spend(): void
}

export function makeBudget(max: number, windowMs: number): Budget {
  const stamps: number[] = []
  const prune = () => {
    const cutoff = Date.now() - windowMs
    while (stamps.length > 0 && stamps[0] < cutoff) stamps.shift()
  }
  return {
    canSpend() {
      prune()
      return stamps.length < max
    },
    spend() {
      stamps.push(Date.now())
    },
  }
}
