'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Confetti } from './Confetti'

const WHEEL_SIZE = 280
const NUM_SEGMENTS = 10
const SEGMENT_ANGLE = 360 / NUM_SEGMENTS
const SPIN_DURATION_MS = 7500
const COUNTDOWN_SECONDS = 5 * 60

// Pointer at top. Segment 9 (50%) right edge at 270° = top when rotation ≡ 0.
const LAND_ON_INDEX = 9
const LAND_ANGLE = 0

// Blue-themed palette consistent with the site's blue-600 primary
const SEGMENTS: { label: string; value: number; bg: string; text: string }[] = [
  { label: '5%',        value: 5,  bg: '#dbeafe', text: '#1e40af' },
  { label: 'Try Again', value: 0,  bg: '#f1f5f9', text: '#94a3b8' },
  { label: '15%',       value: 15, bg: '#bfdbfe', text: '#1e40af' },
  { label: '20%',       value: 20, bg: '#93c5fd', text: '#1e3a8a' },
  { label: '25%',       value: 25, bg: '#60a5fa', text: '#fff'    },
  { label: '30%',       value: 30, bg: '#3b82f6', text: '#fff'    },
  { label: '35%',       value: 35, bg: '#2563eb', text: '#fff'    },
  { label: '40%',       value: 40, bg: '#1d4ed8', text: '#fff'    },
  { label: '10%',       value: 10, bg: '#eff6ff', text: '#1e40af' },
  { label: '50%',       value: 50, bg: '#1e3a8a', text: '#fff'    },
]

const SPIN_EASING = 'cubic-bezier(0.08, 0.6, 0.25, 1)'

function formatCountdown(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function SpinWheel({
  onResult,
  onClose,
  onPayNow,
  onSharePaymentLink,
}: {
  onResult: (percent: number) => void
  onClose: () => void
  onPayNow?: () => void
  onSharePaymentLink?: () => void
}) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [hasSpun, setHasSpun] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [showConfetti, setShowConfetti] = useState(false)
  const spinCompleteRef = useRef(false)
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const completeSpin = useCallback(() => {
    if (spinCompleteRef.current) return
    spinCompleteRef.current = true
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
    setSpinning(false)
    setHasSpun(true)
    setShowConfetti(true)
    onResult(SEGMENTS[LAND_ON_INDEX].value)
  }, [onResult])

  useEffect(() => {
    if (!hasSpun || countdown <= 0) return
    const id = setInterval(() => setCountdown(c => (c <= 1 ? 0 : c - 1)), 1000)
    return () => clearInterval(id)
  }, [hasSpun])

  const spin = useCallback(() => {
    if (spinning || hasSpun) return
    spinCompleteRef.current = false
    setSpinning(true)
    setRotation(prev => prev + 6 * 360 + LAND_ANGLE)
    fallbackTimerRef.current = setTimeout(completeSpin, SPIN_DURATION_MS + 400)
  }, [spinning, hasSpun, completeSpin])

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.propertyName !== 'transform' || !spinning) return
      completeSpin()
    },
    [spinning, completeSpin]
  )

  const cx = WHEEL_SIZE / 2
  const cy = WHEEL_SIZE / 2
  const rOuter = WHEEL_SIZE / 2 - 1
  const rInner = 32

  return (
    <>
      {showConfetti && <Confetti />}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {!hasSpun ? (
            <div className="p-5 flex flex-col items-center">
              {/* Header */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Spin &amp; Save</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Win up to <span className="text-blue-600 font-semibold">50% off</span> your plan
                </p>
              </div>

              {/* Wheel area */}
              <div className="relative" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE + 22 }}>
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '11px solid transparent',
                      borderRight: '11px solid transparent',
                      borderTop: '22px solid #2563eb',
                      filter: 'drop-shadow(0 2px 4px rgba(37,99,235,0.4))',
                    }}
                  />
                </div>

                {/* Wheel */}
                <div
                  className="absolute rounded-full overflow-hidden border-4 border-white"
                  style={{
                    width: WHEEL_SIZE,
                    height: WHEEL_SIZE,
                    top: 22,
                    left: 0,
                    boxShadow: '0 4px 24px rgba(37,99,235,0.15), 0 1px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  {/* Rotating part */}
                  <div
                    className="w-full h-full"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transition: spinning
                        ? `transform ${SPIN_DURATION_MS}ms ${SPIN_EASING}`
                        : 'none',
                      willChange: spinning ? 'transform' : 'auto',
                    }}
                    onTransitionEnd={handleTransitionEnd}
                  >
                    <svg
                      className="absolute inset-0 w-full h-full"
                      viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
                    >
                      <defs>
                        <clipPath id="wclip">
                          <circle cx={cx} cy={cy} r={cx} />
                        </clipPath>
                      </defs>
                      <g clipPath="url(#wclip)">
                        {SEGMENTS.map((seg, i) => {
                          const startAngle = (i * SEGMENT_ANGLE - 90) * (Math.PI / 180)
                          const endAngle = ((i + 1) * SEGMENT_ANGLE - 90) * (Math.PI / 180)
                          const x1o = cx + rOuter * Math.cos(startAngle)
                          const y1o = cy + rOuter * Math.sin(startAngle)
                          const x2o = cx + rOuter * Math.cos(endAngle)
                          const y2o = cy + rOuter * Math.sin(endAngle)
                          const x1i = cx + rInner * Math.cos(startAngle)
                          const y1i = cy + rInner * Math.sin(startAngle)
                          const x2i = cx + rInner * Math.cos(endAngle)
                          const y2i = cy + rInner * Math.sin(endAngle)
                          const largeArc = SEGMENT_ANGLE > 180 ? 1 : 0
                          const d = `M ${x1i} ${y1i} L ${x1o} ${y1o} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2o} ${y2o} L ${x2i} ${y2i} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x1i} ${y1i} Z`

                          const midAngleDeg = (i + 0.5) * SEGMENT_ANGLE
                          const midAngleRad = (midAngleDeg - 90) * (Math.PI / 180)
                          const textR = (rOuter + rInner) / 2 + 6
                          const tx = cx + textR * Math.cos(midAngleRad)
                          const ty = cy + textR * Math.sin(midAngleRad)

                          return (
                            <g key={i}>
                              <path d={d} fill={seg.bg} stroke="white" strokeWidth={2} />
                              {seg.label === 'Try Again' ? (
                                <text
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  transform={`translate(${tx},${ty}) rotate(${midAngleDeg})`}
                                  fill={seg.text}
                                  fontSize="7"
                                  fontWeight="700"
                                  style={{ fontFamily: 'system-ui, sans-serif' }}
                                >
                                  <tspan x="0" dy="-4">Try</tspan>
                                  <tspan x="0" dy="9">Again</tspan>
                                </text>
                              ) : (
                                <text
                                  x={tx}
                                  y={ty}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  transform={`rotate(${midAngleDeg}, ${tx}, ${ty})`}
                                  fill={seg.text}
                                  fontSize={seg.value === 50 ? '13' : '11'}
                                  fontWeight="800"
                                  style={{ fontFamily: 'system-ui, sans-serif' }}
                                >
                                  {seg.label}
                                </text>
                              )}
                            </g>
                          )
                        })}
                        {/* Outer ring */}
                        <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="white" strokeWidth={3} />
                      </g>
                    </svg>
                  </div>

                  {/* Center hub — fixed */}
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center z-10 pointer-events-none"
                    style={{
                      width: rInner * 2,
                      height: rInner * 2,
                      background: '#2563eb',
                      boxShadow: '0 0 0 3px white, 0 2px 8px rgba(37,99,235,0.3)',
                    }}
                  >
                    <span className="text-white font-black uppercase tracking-widest" style={{ fontSize: 8 }}>
                      SPIN
                    </span>
                  </div>
                </div>
              </div>

              {/* Spin button */}
              <button
                type="button"
                onClick={spin}
                disabled={spinning}
                className="mt-5 w-full py-3.5 rounded-xl font-bold text-base bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
              >
                {spinning ? 'Spinning...' : 'Spin the wheel'}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full py-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Maybe later
              </button>
            </div>
          ) : (
            /* Result screen */
            <div className="p-5">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="text-3xl mb-1">🎉</div>
                <h2 className="text-xl font-bold text-gray-900">You won 50% OFF!</h2>
                <p className="text-sm text-gray-500 mt-0.5">Offer applied to your plan</p>
              </div>

              {/* Discount badge */}
              <div className="flex items-center justify-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-3">
                <span className="text-2xl font-black text-blue-600">50%</span>
                <div className="w-px h-8 bg-blue-200" />
                <span className="text-sm text-blue-800 font-medium leading-snug">
                  Off your plan — limited time only
                </span>
              </div>

              {/* Gift bonus */}
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mb-4">
                <span className="text-lg shrink-0">🎁</span>
                <span className="text-xs text-gray-700 leading-snug flex-1">
                  Chapter wise EAPCET quizzes for all subjects 2026
                </span>
                <span className="shrink-0 animate-vibrate rounded bg-green-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                  Free
                </span>
              </div>

              {/* Countdown */}
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Offer expires in
                </span>
                <span
                  className={`text-2xl font-mono font-black tabular-nums ${
                    countdown <= 60 ? 'text-red-500' : 'text-gray-900'
                  }`}
                >
                  {formatCountdown(countdown)}
                </span>
              </div>

              {/* Price */}
              <p className="text-center text-lg font-bold text-gray-900 mb-4">
                ₹249 <span className="text-gray-400 font-normal text-sm">· Unlimited · Lifetime</span>
              </p>

              {/* CTAs */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onPayNow?.()}
                  className="w-full py-3.5 rounded-xl font-bold text-base bg-blue-600 text-white hover:bg-blue-700 transition-colors active:scale-[0.98]"
                >
                  Pay ₹249
                </button>
                {onSharePaymentLink && (
                  <button
                    type="button"
                    onClick={onSharePaymentLink}
                    className="w-full py-3 rounded-xl font-semibold text-sm border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    Share payment link
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
