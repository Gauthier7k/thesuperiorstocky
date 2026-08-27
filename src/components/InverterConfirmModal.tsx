import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'

interface InverterConfirmModalProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** "Are you sure?" — the modal literally runs away from your cursor. */
export function InverterConfirmModal({ open, onConfirm, onCancel }: InverterConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: 0, y: 0 })
  const velRef = useRef({ x: 0, y: 0 })
  const reduce = useReducedMotion() ?? false

  useEffect(() => {
    if (!open) {
      posRef.current = { x: 0, y: 0 }
      velRef.current = { x: 0, y: 0 }
      if (modalRef.current) {
        modalRef.current.style.transform = 'translate(-50%, -50%)'
      }
      return
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  useEffect(() => {
    if (!open || reduce) return

    let raf = 0
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const t0 = performance.now()

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }

    const tick = (now: number) => {
      const el = modalRef.current
      if (el) {
        const rect = el.getBoundingClientRect()
        const halfW = rect.width / 2
        const halfH = rect.height / 2
        const pad = 28
        const maxX = Math.max(40, window.innerWidth / 2 - halfW - pad)
        const maxY = Math.max(40, window.innerHeight / 2 - halfH - pad)

        const pos = posRef.current
        const vel = velRef.current
        const cx = window.innerWidth / 2 + pos.x
        const cy = window.innerHeight / 2 + pos.y

        let ax = 0
        let ay = 0

        const dx = cx - mouse.x
        const dy = cy - mouse.y
        const dist = Math.hypot(dx, dy)
        const fleeRadius = 280

        if (dist < fleeRadius && dist > 1) {
          const urgency = ((fleeRadius - dist) / fleeRadius) ** 1.4
          ax += (dx / dist) * urgency * 2.2
          ay += (dy / dist) * urgency * 2.2
        }

        const edgeZone = 110
        const left = cx - halfW - pad
        const right = window.innerWidth - cx - halfW - pad
        const top = cy - halfH - pad
        const bottom = window.innerHeight - cy - halfH - pad

        if (left < edgeZone) ax += ((edgeZone - left) / edgeZone) ** 1.2 * 3.2
        if (right < edgeZone) ax -= ((edgeZone - right) / edgeZone) ** 1.2 * 3.2
        if (top < edgeZone) ay += ((edgeZone - top) / edgeZone) ** 1.2 * 3.2
        if (bottom < edgeZone) ay -= ((edgeZone - bottom) / edgeZone) ** 1.2 * 3.2

        const cornerZone = 72
        const nearLeft = left < cornerZone
        const nearRight = right < cornerZone
        const nearTop = top < cornerZone
        const nearBottom = bottom < cornerZone
        const inCorner =
          (nearLeft || nearRight) && (nearTop || nearBottom) && dist < fleeRadius * 1.35

        if (inCorner) {
          const slide = 4.5
          if (nearLeft) ax += slide
          if (nearRight) ax -= slide
          if (nearTop) ay += slide
          if (nearBottom) ay -= slide
          ax += (cx < mouse.x ? -1 : 1) * slide * 0.6
          ay += (cy < mouse.y ? -1 : 1) * slide * 0.6
        }

        if (pos.x <= -maxX + 2 || pos.x >= maxX - 2) {
          ay += (mouse.y - cy) * 0.04
        }
        if (pos.y <= -maxY + 2 || pos.y >= maxY - 2) {
          ax += (mouse.x - cx) * 0.04
        }

        const wanderT = (now - t0) / 1000
        ax += Math.sin(wanderT * 2.1) * 0.35
        ay += Math.cos(wanderT * 1.7) * 0.35

        vel.x = (vel.x + ax) * 0.86
        vel.y = (vel.y + ay) * 0.86

        pos.x += vel.x
        pos.y += vel.y

        if (pos.x < -maxX) {
          pos.x = -maxX
          vel.x = Math.abs(vel.x) * 0.75 + 2.5
        } else if (pos.x > maxX) {
          pos.x = maxX
          vel.x = -Math.abs(vel.x) * 0.75 - 2.5
        }
        if (pos.y < -maxY) {
          pos.y = -maxY
          vel.y = Math.abs(vel.y) * 0.75 + 2.5
        } else if (pos.y > maxY) {
          pos.y = maxY
          vel.y = -Math.abs(vel.y) * 0.75 - 2.5
        }

        el.style.transform = `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`
      }
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [open, reduce])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="inverter-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onCancel}
        >
          <div
            ref={modalRef}
            className="inverter-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inverter-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            >
              <p id="inverter-modal-title" className="inverter-modal-title">
                Are you sure?
              </p>
              <p className="inverter-modal-hint">
                {reduce ? 'Your call.' : 'Good luck catching this 🏃'}
              </p>
              <div className="inverter-modal-actions">
                <button type="button" className="inverter-modal-yes" onClick={onConfirm}>
                  Yes
                </button>
                <button type="button" className="inverter-modal-nope" onClick={onCancel}>
                  Never mind
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
