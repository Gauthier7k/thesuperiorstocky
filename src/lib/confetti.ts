import confetti from 'canvas-confetti'

const COLORS = ['#2CFF9E', '#00C8FF', '#7C5CFF', '#F2F4FF']
const COOLDOWN_MS = 2000
let lastFired = 0

export type CelebrationTier = 'pop' | 'select' | 'flip' | 'profit' | 'jackpot'

export interface Origin {
  x: number
  y: number
}

/** Fire a themed confetti burst. Cooldown-guarded so rapid clicking never spams. */
export function celebrate(tier: CelebrationTier, origin?: Origin, accent?: string): void {
  const now = Date.now()
  if (now - lastFired < COOLDOWN_MS) return
  lastFired = now

  const colors = accent ? [accent, ...COLORS] : COLORS
  const base = { colors, disableForReducedMotion: true, zIndex: 60 }
  const o = origin ?? { x: 0.5, y: 0.4 }

  switch (tier) {
    case 'pop':
      confetti({ ...base, particleCount: 35, spread: 45, startVelocity: 22, origin: o, scalar: 0.85 })
      break
    case 'select':
      confetti({ ...base, particleCount: 80, spread: 70, startVelocity: 35, origin: o })
      break
    case 'flip':
      confetti({ ...base, particleCount: 50, spread: 55, startVelocity: 28, origin: o })
      break
    case 'profit':
      confetti({ ...base, particleCount: 120, spread: 90, startVelocity: 38, origin: o })
      break
    case 'jackpot': {
      const cannons = () => {
        confetti({ ...base, particleCount: 200, spread: 100, angle: 60, origin: { x: 0, y: 1 }, scalar: 1.2 })
        confetti({ ...base, particleCount: 200, spread: 100, angle: 120, origin: { x: 1, y: 1 }, scalar: 1.2 })
      }
      cannons()
      setTimeout(cannons, 250)
      break
    }
  }
}
