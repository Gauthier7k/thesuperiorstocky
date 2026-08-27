import confetti from 'canvas-confetti'

const COLORS = ['#2CFF9E', '#00C8FF', '#7C5CFF', '#F2F4FF', '#FFD700', '#FF5C7A']
const COOLDOWN_MS = 280
const Z = 100
let lastFired = 0

export type CelebrationTier = 'pop' | 'select' | 'flip' | 'profit' | 'jackpot'

export interface Origin {
  x: number
  y: number
}

type ConfettiOpts = confetti.Options

function burst(opts: ConfettiOpts): void {
  confetti({ disableForReducedMotion: true, zIndex: Z, ...opts })
}

/** Blanket the entire viewport — corners, edges, center, top rain. */
function fillScreen(colors: string[], scale: number, focal?: Origin): void {
  const count = (n: number) => Math.round(n * scale)
  const focalOrigin = focal ?? { x: 0.5, y: 0.45 }

  const edgeBlasts: Array<{ x: number; y: number; angle: number }> = [
    { x: 0, y: 1, angle: 60 },
    { x: 1, y: 1, angle: 120 },
    { x: 0, y: 0, angle: 300 },
    { x: 1, y: 0, angle: 240 },
    { x: 0.5, y: 0, angle: 270 },
    { x: 0.5, y: 1, angle: 90 },
    { x: 0, y: 0.5, angle: 0 },
    { x: 1, y: 0.5, angle: 180 },
  ]

  edgeBlasts.forEach((edge, i) => {
    setTimeout(() => {
      burst({
        colors,
        particleCount: count(120),
        spread: 110,
        angle: edge.angle,
        origin: { x: edge.x, y: edge.y },
        startVelocity: 42 + scale * 18,
        scalar: 1.1 + scale * 0.4,
        gravity: 0.85,
        ticks: 220,
      })
    }, i * 45)
  })

  setTimeout(() => {
    burst({
      colors,
      particleCount: count(200),
      spread: 360,
      origin: focalOrigin,
      startVelocity: 50 + scale * 20,
      scalar: 1.25 + scale * 0.35,
      gravity: 0.75,
      ticks: 260,
    })
  }, 60)

  for (let i = 0; i < 7; i++) {
    setTimeout(() => {
      burst({
        colors,
        particleCount: count(55),
        spread: 95,
        angle: 270,
        origin: { x: i / 6, y: 0 },
        startVelocity: 28 + scale * 12,
        gravity: 1,
        scalar: 1.05,
        ticks: 200,
      })
    }, 80 + i * 55)
  }

  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      burst({
        colors,
        particleCount: count(45),
        spread: 360,
        origin: { x: Math.random(), y: Math.random() * 0.6 + 0.2 },
        startVelocity: 22 + scale * 10,
        scalar: 0.9 + scale * 0.3,
        gravity: 0.6,
        ticks: 180,
      })
    }, 200 + i * 90)
  }
}

/** Fire a themed confetti burst. Cooldown-guarded so rapid clicking never spams. */
export function celebrate(tier: CelebrationTier, origin?: Origin, accent?: string): void {
  const now = Date.now()
  if (now - lastFired < COOLDOWN_MS) return
  lastFired = now

  const colors = accent ? [accent, ...COLORS] : COLORS
  const o = origin ?? { x: 0.5, y: 0.4 }

  switch (tier) {
    case 'pop':
      fillScreen(colors, 0.55, o)
      break
    case 'select':
      fillScreen(colors, 0.85, o)
      setTimeout(() => fillScreen(colors, 0.45, o), 350)
      break
    case 'flip':
      fillScreen(colors, 0.7, o)
      break
    case 'profit':
      fillScreen(colors, 1, o)
      setTimeout(() => fillScreen(colors, 0.6, o), 400)
      break
    case 'jackpot':
      fillScreen(colors, 1.2, o)
      setTimeout(() => fillScreen(colors, 1, o), 300)
      setTimeout(() => fillScreen(colors, 0.85, o), 650)
      setTimeout(() => fillScreen(colors, 0.7, o), 950)
      break
  }
}

/** Always fires — for stacking on top of a primary celebrate within the same moment. */
export function celebrateExtra(tier: CelebrationTier, origin?: Origin, accent?: string): void {
  const prev = lastFired
  lastFired = 0
  celebrate(tier, origin, accent)
  lastFired = Math.min(lastFired, prev + COOLDOWN_MS / 3)
}
