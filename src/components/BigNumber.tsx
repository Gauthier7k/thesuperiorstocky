import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

function formatMoney(v: number, prefix: string, decimals: number): string {
  const sign = v < 0 ? '-' : ''
  const abs = Math.abs(v)
  return `${sign}${prefix}${abs.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

interface BigNumberProps {
  value: number
  className?: string
  prefix?: string
  decimals?: number
}

/**
 * Animated count-up number. Retargets whenever `value` changes and pulses on
 * arrival for meaningful moves (> 0.5%).
 */
export function BigNumber({ value, className = '', prefix = '$', decimals = 2 }: BigNumberProps) {
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => formatMoney(v, prefix, decimals))
  const [pulseKey, setPulseKey] = useState(0)
  const prevRef = useRef(value)

  useEffect(() => {
    const prev = prevRef.current
    if (prev === value) return
    prevRef.current = value
    const meaningful = Math.abs(value - prev) / Math.max(Math.abs(prev), 1e-6) > 0.005
    const controls = animate(mv, value, {
      duration: 0.7,
      ease: 'circOut',
      onComplete: () => {
        if (meaningful) setPulseKey((k) => k + 1)
      },
    })
    return () => controls.stop()
  }, [value, mv])

  return (
    <motion.span
      key={pulseKey}
      className={`bignum ${className}`}
      animate={pulseKey > 0 ? { scale: [1, 1.08, 1] } : undefined}
      transition={{ duration: 0.35 }}
    >
      <motion.span>{text}</motion.span>
    </motion.span>
  )
}
