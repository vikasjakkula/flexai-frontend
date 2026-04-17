'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Inter } from 'next/font/google'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

const inter = Inter({ subsets: ['latin'] })

interface OnboardingData {
  name: string
  exam_type: 'TS EAPCET' | 'AP EAPCET' | ''
  field: 'engineering' | 'medical' | ''
  current_marks_range: string
  expected_rank: string
}

// Marks range to actual marks mapping
const getMarksFromRange = (range: string): { min: number; max: number } => {
  const mapping: Record<string, { min: number; max: number }> = {
    'less than 40': { min: 0, max: 40 },
    '40-60': { min: 40, max: 60 },
    '60-80': { min: 60, max: 80 },
    '80-120': { min: 80, max: 120 },
    '120+': { min: 120, max: 160 }
  }
  return mapping[range] || { min: 0, max: 0 }
}

// Rank mapping based on marks
const getRankFromMarks = (marksRange: string): { min: number; max: number; label: string } => {
  const mapping: Record<string, { min: number; max: number; label: string }> = {
    'less than 40': { min: 65001, max: 999999, label: '65001+' },
    '40-60': { min: 50001, max: 65000, label: '50001-65000' },
    '60-80': { min: 30001, max: 50000, label: '30001-50000' },
    '80-120': { min: 1001, max: 30000, label: '1001-30000' },
    '120+': { min: 1, max: 1000, label: '1-1000' }
  }
  return mapping[marksRange] || { min: 0, max: 0, label: 'Unknown' }
}

// Get expected marks from rank
const getExpectedMarksFromRank = (rank: string): { min: number; max: number } => {
  const mapping: Record<string, { min: number; max: number }> = {
    'less than 1k': { min: 110, max: 160 },
    'less than 5k': { min: 100, max: 120 },
    'less than 10k': { min: 90, max: 110 },
    'less than 20k': { min: 80, max: 100 }
  }
  return mapping[rank] || { min: 0, max: 0 }
}

// Calculate tests needed
const calculateTestsNeeded = (currentRankMin: number, expectedRankMax: number): number => {
  const rankDifference = currentRankMin - expectedRankMax
  if (rankDifference <= 0) return 4
  if (rankDifference < 5000) return 4
  if (rankDifference < 10000) return 6
  if (rankDifference < 20000) return 8
  if (rankDifference < 30000) return 10
  return 12
}

// Curved Area Chart Component
const CurvedAreaChart = ({
  currentMarks,
  expectedMarks
}: {
  currentMarks: { min: number; max: number }
  expectedMarks: { min: number; max: number }
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  
  useEffect(() => {
    const duration = 2000
    const steps = 60
    let currentStep = 0
    
    const interval = setInterval(() => {
      currentStep++
      if (currentStep <= steps) {
        setAnimatedProgress(currentStep / steps)
      } else {
        setAnimatedProgress(1)
        clearInterval(interval)
      }
    }, duration / steps)
    
    return () => clearInterval(interval)
  }, [])
  
  // Generate points for curved area chart with steeper slope and visible up-down curves
  const width = 600
  const height = 300
  const padding = 70
  const bottomPadding = 40 // Extra padding for labels below axes
  
  // Always create a steeper slope with visible ups and downs
  const graphHeight = height - 2 * padding - bottomPadding
  const graphWidth = width - 2 * padding
  
  // Calculate positions for steeper slope (more than 45 degrees)
  // Start at bottom-left, end at top-right with more dramatic difference
  const startY = height - padding - bottomPadding - (graphHeight * 0.15) // Start at 15% from bottom
  const endY = height - padding - bottomPadding - (graphHeight * 0.85)   // End at 85% from bottom
  
  // Create curve with initial dip then upward curve (like S-curve)
  // Start with a small dip down, then curve up to target
  const quarterX = padding + graphWidth * 0.25
  const halfX = padding + graphWidth * 0.5
  const threeQuarterX = padding + graphWidth * 0.75
  
  // Curve pattern: First increase, then visible dip, then increase to target
  // Use cubic bezier with control points to create smooth up-dip-up pattern
  
  // Control points for the curve
  // First control: pulls curve up initially (increase) - more pronounced
  const control1X = padding + graphWidth * 0.25
  const control1Y = startY - graphHeight * 0.25  // Above startY = goes up (25% increase)
  
  // Second control: creates visible dip (more noticeable but still smooth)
  const control2X = padding + graphWidth * 0.5
  const control2Y = control1Y + graphHeight * 0.15  // Visible dip: 15% below the peak (more visible)
  
  // Third control: pulls toward target (above endY to create upward curve)
  const control3X = padding + graphWidth * 0.75
  const control3Y = endY - graphHeight * 0.12   // Above endY to pull curve up smoothly
  
  // Animated end point
  const animatedEndY = startY + (endY - startY) * animatedProgress
  
  // Animate control points smoothly for visible progression
  const animatedControl1Y = startY + (control1Y - startY) * Math.min(animatedProgress * 1.2, 1)
  const animatedControl2Y = control1Y + (control2Y - control1Y) * Math.min(animatedProgress * 1.0, 1)
  const animatedControl3Y = control2Y + (control3Y - control2Y) * animatedProgress
  
  // Path for the area - smooth curve: up, small dip, then up to target
  const areaPath = `M ${padding} ${height - padding - bottomPadding} 
    L ${padding} ${startY} 
    C ${control1X} ${animatedControl1Y}, ${control2X} ${animatedControl2Y}, ${width - padding} ${animatedEndY}
    L ${width - padding} ${height - padding - bottomPadding} Z`
  
  // Path for the line - smooth curve: up, small dip, then up to target
  const linePath = `M ${padding} ${startY} 
    C ${control1X} ${animatedControl1Y}, ${control2X} ${animatedControl2Y}, ${width - padding} ${animatedEndY}`
  
  return (
    <div className="w-full">
      <div className="relative w-full bg-white rounded-lg border border-gray-200 h-full">
        <svg className="w-full h-full" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1={padding}
              y1={y * 3}
              x2={width - padding}
              y2={y * 3}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="2,2"
              opacity="0.5"
            />
          ))}
          
          {/* Area under curve */}
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            d={areaPath}
            fill="url(#areaGradient)"
          />
          
          {/* Curved line */}
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            d={linePath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinecap="round"
          />
          
          {/* Start point */}
          <circle
            cx={padding}
            cy={startY}
            r="6"
            fill="#2563eb"
            className="drop-shadow-sm"
          />
          
          {/* End point */}
          <motion.circle
            animate={{ cy: animatedEndY }}
            transition={{ duration: 2, ease: "easeInOut" }}
            cx={width - padding}
            cy={endY}
            r="6"
            fill="#2563eb"
            className="drop-shadow-sm"
          />
          
          {/* Current label BELOW the axis on left side */}
          <text
            x={padding}
            y={height - padding - bottomPadding + 20}
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            Current
          </text>
          
          {/* Target label BELOW the axis on right side */}
          <text
            x={width - padding}
            y={height - padding - bottomPadding + 20}
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            Target
          </text>
          
          {/* Y-axis labels */}
          <text x={padding - 15} y={padding} textAnchor="end" className="text-xs fill-gray-500">160</text>
          <text x={padding - 15} y={height - padding - bottomPadding} textAnchor="end" className="text-xs fill-gray-500">0</text>
        </svg>
      </div>
    </div>
  )
}

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<OnboardingData>({
    name: '',
    exam_type: '',
    field: '',
    current_marks_range: '',
    expected_rank: ''
  })

  const totalSteps = 6

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check-session')
        const data = await response.json()
        if (!data.authenticated) {
          router.push('/auth/login')
          return
        }
        // If user already completed onboarding and came for trial, go straight to trial
        const trialTestId = typeof window !== 'undefined' ? window.localStorage.getItem('trialTestId') : null
        if (trialTestId) {
          const userRes = await fetch('/api/auth/user')
          const userData = await userRes.json()
          if (userData?.onboarding_completed) {
            if (typeof window !== 'undefined') window.localStorage.removeItem('trialTestId')
            router.push(`/test/trial?testId=${trialTestId}`)
          }
        }
      } catch (error) {
        router.push('/auth/login')
      }
    }
    checkAuth()
  }, [router])

  const updateField = (field: keyof OnboardingData, value: string) => {
    // Prevent double-clicking by checking if already selected
    if (formData[field] === value) return
    
    setFormData({ ...formData, [field]: value })
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
    
    // Auto-advance on selection (except name input)
    if (field !== 'name' && value) {
      setTimeout(() => {
        // Directly advance without validation since we just set the value
        if (step < totalSteps) {
          setStep(step + 1)
        }
      }, 300)
    }
  }

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (stepNum === 1 && !formData.name.trim()) {
      newErrors.name = 'Please enter your name'
    }
    if (stepNum === 2 && !formData.exam_type) {
      newErrors.exam_type = 'Please select an exam type'
    }
    if (stepNum === 3 && !formData.field) {
      newErrors.field = 'Please select engineering or medical'
    }
    if (stepNum === 4 && !formData.current_marks_range) {
      newErrors.current_marks_range = 'Please select your current marks range'
    }
    if (stepNum === 5 && !formData.expected_rank) {
      newErrors.expected_rank = 'Please select your expected rank'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < totalSteps) {
        setStep(step + 1)
      }
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      setErrors({})
    }
  }

  const handleSubmit = async () => {
    // Validate all required fields before submitting
    const validationErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      validationErrors.name = 'Please enter your name'
    }
    if (!formData.exam_type) {
      validationErrors.exam_type = 'Please select an exam type'
    }
    if (!formData.field) {
      validationErrors.field = 'Please select engineering or medical'
    }
    if (!formData.current_marks_range) {
      validationErrors.current_marks_range = 'Please select your current marks range'
    }
    if (!formData.expected_rank) {
      validationErrors.expected_rank = 'Please select your expected rank'
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    
    setLoading(true)
    setErrors({})

    try {
      const currentRank = getRankFromMarks(formData.current_marks_range)
      const getExpectedRankMax = (rankStr: string): number => {
        const cleaned = rankStr.toLowerCase().replace(/[^0-9k]/g, '')
        if (cleaned.includes('k')) {
          const num = parseInt(cleaned.replace('k', ''))
          return num * 1000
        }
        return parseInt(cleaned) || 0
      }
      const expectedRankMax = getExpectedRankMax(formData.expected_rank)
      const testsNeeded = calculateTestsNeeded(currentRank.min, expectedRankMax)

      const response = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          exam_type: formData.exam_type,
          field: formData.field,
          current_marks_range: formData.current_marks_range,
          expected_rank: formData.expected_rank,
          target_rank: expectedRankMax.toString()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save onboarding data')
      }

      // If user came from landing-b "15 mins trial", send them to trial after onboarding
      const trialTestId = typeof window !== 'undefined' ? window.localStorage.getItem('trialTestId') : null
      if (trialTestId) {
        if (typeof window !== 'undefined') window.localStorage.removeItem('trialTestId')
        router.push(`/test/trial?testId=${trialTestId}`)
        return
      }

      const url = typeof window !== 'undefined' ? new URL(window.location.href) : null
      const checkoutAfterLanding = url?.searchParams.get('checkout') === '1'
      const returnTo = url?.searchParams.get('returnTo') || undefined
      if (checkoutAfterLanding) {
        const target = returnTo || '/landing?checkout=1'
        router.push(target)
        return
      }

      // Default: send to dashboard after onboarding (with paywall flag)
      router.push('/dashboard?paywall=1')
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save data' })
    } finally {
      setLoading(false)
    }
  }

  const currentMarks = formData.current_marks_range ? getMarksFromRange(formData.current_marks_range) : null
  const expectedMarks = formData.expected_rank ? getExpectedMarksFromRank(formData.expected_rank) : null
  const currentRank = formData.current_marks_range ? getRankFromMarks(formData.current_marks_range) : null
  
  // Fix rank parsing - handle "k" suffix (5k = 5000)
  const getExpectedRankMax = (rankStr: string): number | null => {
    const cleaned = rankStr.toLowerCase().replace(/[^0-9k]/g, '')
    if (cleaned.includes('k')) {
      const num = parseInt(cleaned.replace('k', ''))
      return num * 1000
    }
    return parseInt(cleaned) || null
  }
  
  const expectedRankMax = formData.expected_rank ? getExpectedRankMax(formData.expected_rank) : null
  const testsNeeded = currentRank && expectedRankMax ? calculateTestsNeeded(currentRank.min, expectedRankMax) : 0

  // Emoji mappings
  const examEmojis: Record<string, string> = {
    'TS EAPCET': '🎯',
    'AP EAPCET': '🚀'
  }
  
  const marksEmojis: Record<string, string> = {
    'less than 40': '💪',
    '40-60': '📈',
    '60-80': '🔥',
    '80-120': '⭐',
    '120+': '🏆'
  }
  
  const rankEmojis: Record<string, string> = {
    'less than 1k': '👑',
    'less than 5k': '💎',
    'less than 10k': '🎖️',
    'less than 20k': '🌟'
  }

  return (
    <div className={`min-h-screen bg-white flex flex-col ${inter.className}`} style={{ maxHeight: '100vh', overflow: 'hidden' }}>
      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden">
          <div className="container mx-auto px-6 py-4 max-w-2xl w-full h-full">
            {/* Floating Progress Bar - Part of content, positioned lower */}
            <div className="mb-6 pt-4">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(step / totalSteps) * 100}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-1.5 bg-blue-600 rounded-full"
                />
              </div>
            </div>

            {/* Back Button - Top Left */}
            {step > 1 && (
              <button
                onClick={handleBack}
                className="mb-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            )}

            {/* Error Messages */}
            {Object.keys(errors).length > 0 && (
              <div className="mb-4 space-y-2">
                {Object.entries(errors).map(([key, message]) => (
                  <div key={key} className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
                    {message}
                  </div>
                ))}
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* Step 1: Name */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col justify-center min-h-[calc(100vh-180px)]"
                >
                  <div className="text-center mb-8">
                    <div className="text-5xl mb-4">👋</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your name?</h2>
                    <p className="text-sm text-gray-600">Let's personalize your journey to success</p>
                  </div>
                  
                  <div className="flex gap-3 w-full">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Enter your full name"
                      className={`flex-1 min-w-0 border rounded-md px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && formData.name.trim()) {
                          handleNext()
                        }
                      }}
                    />
                    <button
                      onClick={handleNext}
                      disabled={loading || !formData.name.trim()}
                      className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap flex-shrink-0"
                    >
                      Continue
                    </button>
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </motion.div>
              )}

              {/* Step 2: Exam Type */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col justify-center min-h-[calc(100vh-180px)]"
                >
                  <div className="text-center mb-8">
                    <div className="text-5xl mb-4">🎓</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Preparing for?</h2>
                    <p className="text-sm text-gray-600">Choose your exam and let's crush it together!</p>
                  </div>
                  
                  <div className="space-y-3">
                    {(['TS EAPCET', 'AP EAPCET'] as const).map((exam) => (
                      <button
                        key={exam}
                        onClick={() => updateField('exam_type', exam)}
                        className={`w-full px-6 py-4 rounded-md border-2 text-base font-medium transition text-left ${
                          formData.exam_type === exam
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-blue-200 bg-white text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        <span className="text-2xl mr-3">{examEmojis[exam]}</span>
                        {exam}
                      </button>
                    ))}
                  </div>
                  {errors.exam_type && (
                    <p className="mt-2 text-sm text-red-600">{errors.exam_type}</p>
                  )}
                </motion.div>
              )}

              {/* Step 3: Field (Engineering or Medical) */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col justify-center min-h-[calc(100vh-180px)]"
                >
                  <div className="text-center mb-8">
                    <div className="text-5xl mb-4">🏥</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Medical or Engineering?</h2>
                    <p className="text-sm text-gray-600">Which stream are you preparing for?</p>
                  </div>

                  <div className="space-y-3">
                    {([
                      { label: 'Engineering', value: 'engineering', emoji: '⚙️' },
                      { label: 'Medical (BiPC)', value: 'medical', emoji: '🩺' },
                    ] as const).map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateField('field', option.value)}
                        className={`w-full px-6 py-4 rounded-md border-2 text-base font-medium transition text-left ${
                          formData.field === option.value
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-blue-200 bg-white text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        <span className="text-2xl mr-3">{option.emoji}</span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {errors.field && (
                    <p className="mt-2 text-sm text-red-600">{errors.field}</p>
                  )}
                </motion.div>
              )}

              {/* Step 4: Current Marks */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col justify-center min-h-[calc(100vh-180px)]"
                >
                  <div className="text-center mb-8">
                    <div className="text-5xl mb-4">📊</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">What are your current marks?</h2>
                    <p className="text-sm text-gray-600">Be honest - this is where your transformation begins!</p>
                  </div>
                  
                  <div className="space-y-3">
                    {['less than 40', '40-60', '60-80', '80-120', '120+'].map((range) => (
                      <button
                        key={range}
                        onClick={() => updateField('current_marks_range', range)}
                        className={`w-full px-6 py-4 rounded-md border-2 text-base font-medium transition text-left ${
                          formData.current_marks_range === range
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-blue-200 bg-white text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        <span className="text-2xl mr-3">{marksEmojis[range]}</span>
                        {range === '120+' ? '120+' : range}
                      </button>
                    ))}
                  </div>
                  {errors.current_marks_range && (
                    <p className="mt-2 text-sm text-red-600">{errors.current_marks_range}</p>
                  )}
                </motion.div>
              )}

              {/* Step 5: Expected Rank */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col justify-center min-h-[calc(100vh-180px)]"
                >
                  <div className="text-center mb-8">
                    <div className="text-5xl mb-4">🎯</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your target rank?</h2>
                    <p className="text-sm text-gray-600">Dream big! This is where you're heading! 🚀</p>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { label: 'Less than 1K', value: 'less than 1k' },
                      { label: 'Less than 5K', value: 'less than 5k' },
                      { label: 'Less than 10K', value: 'less than 10k' },
                      { label: 'Less than 20K', value: 'less than 20k' }
                    ].map((rank) => (
                      <button
                        key={rank.value}
                        onClick={() => updateField('expected_rank', rank.value)}
                        className={`w-full px-6 py-4 rounded-md border-2 text-base font-medium transition text-left ${
                          formData.expected_rank === rank.value
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-blue-200 bg-white text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        <span className="text-2xl mr-3">{rankEmojis[rank.value]}</span>
                        {rank.label}
                      </button>
                    ))}
                  </div>
                  {errors.expected_rank && (
                    <p className="mt-2 text-sm text-red-600">{errors.expected_rank}</p>
                  )}
                </motion.div>
              )}

              {/* Step 6: Plan Ready */}
              {step === 6 && currentMarks && expectedMarks && currentRank && expectedRankMax && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.35 }}
                  className="flex flex-col gap-4 pb-6"
                >
                  {/* Header */}
                  <div className="text-center pt-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white text-3xl mb-3 shadow-lg"
                    >
                      🎯
                    </motion.div>
                    <h2 className="text-2xl font-bold text-gray-900">Your plan is ready, {formData.name.split(' ')[0]}!</h2>
                    <p className="text-sm text-gray-500 mt-1">Here's exactly what it'll take to hit your target.</p>
                  </div>

                  {/* Rank journey card */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                  >
                    <div className="flex items-stretch">
                      {/* Current */}
                      <div className="flex-1 flex flex-col items-center justify-center py-5 px-4 bg-gray-50">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Now</span>
                        <span className="text-xl font-bold text-gray-700">{currentRank.label}</span>
                        <span className="text-xs text-gray-400 mt-0.5">rank</span>
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center justify-center px-3 bg-white">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </div>
                      </div>

                      {/* Target */}
                      <div className="flex-1 flex flex-col items-center justify-center py-5 px-4 bg-blue-600">
                        <span className="text-xs font-semibold uppercase tracking-wide text-blue-200 mb-1">Target</span>
                        <span className="text-xl font-bold text-white">&lt;{(expectedRankMax / 1000).toFixed(0)}K</span>
                        <span className="text-xs text-blue-200 mt-0.5">rank</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Stat pills */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col gap-1">
                      <span className="text-2xl">📚</span>
                      <span className="text-2xl font-bold text-gray-900">{testsNeeded}</span>
                      <span className="text-xs text-gray-500 leading-tight">previous year<br />papers to practice</span>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col gap-1">
                      <span className="text-2xl">⚡</span>
                      <span className="text-2xl font-bold text-gray-900">{formData.exam_type === 'TS EAPCET' ? 'TS' : 'AP'}</span>
                      <span className="text-xs text-gray-500 leading-tight">EAPCET<br />{formData.field === 'engineering' ? 'Engineering' : 'Medical'}</span>
                    </div>
                  </motion.div>

                  {/* Motivational strip */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3"
                  >
                    <span className="text-xl mt-0.5">💡</span>
                    <p className="text-sm text-amber-900 leading-snug">
                      Students who complete <strong>{testsNeeded} mock tests</strong> improve their rank by an average of <strong>40%</strong>. You've got this!
                    </p>
                  </motion.div>

                  {/* Error */}
                  {errors.submit && (
                    <p className="text-sm text-red-600 text-center">{errors.submit}</p>
                  )}

                  {/* CTA */}
                  <motion.button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-4 px-6 rounded-2xl font-bold text-base hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors shadow-md"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {loading ? 'Setting up your dashboard…' : 'Start preparing →'}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
