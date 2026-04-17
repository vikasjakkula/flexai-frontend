'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4']
const COUNT = 50
const DURATION = 4.5

export function Confetti() {
  const [particles] = useState(() =>
    Array.from({ length: COUNT }, () => ({
      id: Math.random().toString(36).slice(2),
      startX: 50 + (Math.random() - 0.5) * 60,
      endX: (Math.random() - 0.5) * 30,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 8 + Math.random() * 10,
      delay: Math.random() * 0.3,
      duration: 2.8 + Math.random() * 1.5,
      rotation: Math.random() * 360,
      rotationEnd: (Math.random() - 0.5) * 1080,
    }))
  )
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), DURATION * 1000)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.startX}%`,
            top: '-5%',
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            boxShadow: '0 0 3px rgba(0,0,0,0.15)',
            originX: '50%',
            originY: '50%',
          }}
          initial={{ y: 0, x: 0, rotate: p.rotation, opacity: 1 }}
          animate={{
            y: '110vh',
            x: `${p.endX}vw`,
            rotate: p.rotation + p.rotationEnd,
            opacity: [1, 1, 0.3],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}
