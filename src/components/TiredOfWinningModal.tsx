import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import type { WinnerPopup } from '../hooks/useTopChangers'

interface TiredOfWinningModalProps {
  open: boolean
  symbol: string
  variant: WinnerPopup
  onClose: () => void
}

const COPY: Record<
  WinnerPopup,
  { flag: string; title: string; btn: string; emoji: string }
> = {
  tired: {
    flag: '🇺🇸 TOP MOVER ALERT 🇺🇸',
    title: 'Are you tired of winning?',
    btn: 'Never tired 💪',
    emoji: '🍊',
  },
  'too-much': {
    flag: '🇺🇸 WINNER OVERLOAD 🇺🇸',
    title: "It's too much winning, Mr. President.",
    btn: 'Fine, one more win 🙄',
    emoji: '😮‍💨',
  },
}

/** Top-half changers get the presidential treatment. */
export function TiredOfWinningModal({ open, symbol, variant, onClose }: TiredOfWinningModalProps) {
  const copy = COPY[variant]

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="trump-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className={`trump-modal ${variant === 'too-much' ? 'trump-modal-overload' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="trump-modal-title"
            initial={{ y: 120, scale: 0.75, opacity: 0, rotate: -4 }}
            animate={{ y: 0, scale: 1, opacity: 1, rotate: 0 }}
            exit={{ y: 60, scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="trump-flag">{copy.flag}</div>
            <div className="trump-emoji" aria-hidden="true">
              {copy.emoji}
            </div>
            <h2 id="trump-modal-title" className="trump-title">
              {copy.title}
            </h2>
            <p className="trump-body">
              {variant === 'too-much' ? (
                <>
                  <strong>{symbol}</strong> is in the bottom 15% of winners — barely winning — and
                  even that is too much winning. Please stop, Mr. President.
                </>
              ) : (
                <>
                  <strong>{symbol}</strong> is in the top 50% today. Tremendous move. Huge. Many
                  people are saying it.
                </>
              )}
            </p>
            <button type="button" className="trump-btn" onClick={onClose}>
              {copy.btn}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
