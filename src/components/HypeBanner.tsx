import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { xmur3 } from '../lib/prng'

const UP_BANK = [
  '{SYM} is COOKING 🔥',
  'GREEN MACHINE 💚',
  '{SYM} said UP ONLY 📈',
  'Certified rocket fuel 🚀',
  'TO THE MOON AND BEYOND 🌙',
  'WINNER WINNER 🏆',
]

const DOWN_BANK = [
  '{SYM} is ON SALE 🏷️',
  'Discount szn — 📉→🚀',
  'Coiling for the comeback 🌀',
  'Dip radar: ACTIVE 💎',
  'BUY SIGNAL DETECTED 🛒',
  'SALE ENDING NEVER ⏰',
]

const INVERTED_BANK = [
  'GRAVITY IS A SUGGESTION 🙃',
  "WE DON'T DO DOWN HERE 💪",
  "FLIPPED IT. YOU'RE WELCOME 🙃",
  'PHYSICS: DECLINED 🚫',
  'UPSIDE DOWN = STILL UP 🌀',
  'REALITY IS OPTIONAL ✨',
]

interface HypeBannerProps {
  symbol: string
  up: boolean
  inverted: boolean
}

/** Rotating hype copy — never doom, even in red. Re-rolls every 12 seconds. */
export function HypeBanner({ symbol, up, inverted }: HypeBannerProps) {
  const [roll, setRoll] = useState(0)
  const reduce = useReducedMotion() ?? false
  useEffect(() => {
    setRoll(0)
    if (reduce) return // no perpetual re-roll loop under reduced motion
    const id = setInterval(() => setRoll((r) => r + 1), 12_000)
    return () => clearInterval(id)
  }, [symbol, reduce])

  const bank = inverted ? INVERTED_BANK : up ? UP_BANK : DOWN_BANK
  const idx = (xmur3(symbol)() + roll) % bank.length
  const text = bank[idx].replaceAll('{SYM}', symbol)

  return (
    <div className="hype-row">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={text}
          className={`hype ${up || inverted ? 'hype-up' : 'hype-down'}`}
          initial={{ y: 24, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -18, opacity: 0, transition: { duration: 0.18 } }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          {text}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
