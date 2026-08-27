import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { subscribeToasts, type ToastMsg } from '../lib/toast'

/** Fixed top-center stack of hype toasts — the app cheering you on. */
export function ToastLayer() {
  const [items, setItems] = useState<ToastMsg[]>([])
  useEffect(() => subscribeToasts(setItems), [])

  return (
    <div className="toast-layer" aria-live="polite">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            className={`toast toast-${t.variant}`}
            initial={{ y: -24, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -12, opacity: 0, scale: 0.95, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
