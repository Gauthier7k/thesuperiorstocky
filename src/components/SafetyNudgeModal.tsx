import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'

interface SafetyNudgeModalProps {
  open: boolean
  onReturn: () => void
  onDismiss: () => void
}

/** Reality got heavy — offer a way back to Anti-Depression Mode. */
export function SafetyNudgeModal({ open, onReturn, onDismiss }: SafetyNudgeModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onDismiss])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="safety-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onDismiss}
        >
          <motion.div
            className="safety-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="safety-modal-title"
            initial={{ y: 40, scale: 0.92, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 24, scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="safety-badge">🛟 REALITY CHECK</div>
            <h2 id="safety-modal-title" className="safety-title">
              Come back to the safety of Anti-Depression Mode?
            </h2>
            <p className="safety-body">
              You turned off the Depression Inverter — charts can go <strong>down</strong> again. No
              judgment. But the up-only bubble was right there.
            </p>
            <div className="safety-actions">
              <button type="button" className="safety-return" onClick={onReturn}>
                Take me back 🙃
              </button>
              <button type="button" className="safety-stay" onClick={onDismiss}>
                I&apos;ll brave it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
