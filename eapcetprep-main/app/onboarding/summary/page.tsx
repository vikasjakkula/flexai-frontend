'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Inter } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export default function OnboardingSummary() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/user')
        if (response.ok) {
          const data = await response.json()
          setUserData(data)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const calculateMarksRequirement = (targetRank: number) => {
    if (targetRank <= 1000) return '110-120'
    if (targetRank <= 5000) return '100-110'
    if (targetRank <= 10000) return '90-100'
    if (targetRank <= 20000) return '80-90'
    return '70-80'
  }

  const getNearestThousand = (rank: number) => {
    return Math.ceil(rank / 1000) * 1000
  }

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 flex justify-center font-sans ${inter.className}`}>
        <div className="w-full max-w-md bg-white min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className={`min-h-screen bg-gray-50 flex justify-center font-sans ${inter.className}`}>
        <div className="w-full max-w-md bg-white min-h-screen flex items-center justify-center">
          <div className="text-center px-6">
            <p className="text-gray-600 mb-4">Failed to load your profile</p>
            <Link href="/onboarding" className="text-indigo-600 font-semibold">
              Go back
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const marksNeeded = calculateMarksRequirement(userData.target_rank || 10000)
  const nearestThousand = getNearestThousand(userData.target_rank || 10000)

  return (
    <div className={`min-h-screen bg-gray-50 flex justify-center font-sans ${inter.className}`}>
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl flex flex-col">
        {/* Header */}
        <header className="p-4 border-b border-gray-100 bg-white">
          <div className="font-bold text-xl text-indigo-600 tracking-tight">eapcetpro</div>
        </header>

        {/* Content */}
        <div className="flex-1 p-5 overflow-y-auto">
          {/* Success Icon + Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 rounded-2xl border border-indigo-100 mb-4">
              <span className="text-3xl">🎯</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Your Action Plan</h1>
            <p className="text-sm text-gray-500 font-medium">Personalized roadmap to your dream rank</p>
          </div>

          {/* Summary Card */}
          <div className="bg-indigo-600 rounded-2xl p-5 mb-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-3">Goal Summary</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-90">Target Rank</span>
                <span className="font-bold text-lg">{'< '}{nearestThousand.toLocaleString()}</span>
              </div>
              <div className="h-px bg-white/20"></div>
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-90">Marks Needed</span>
                <span className="font-bold text-lg">{marksNeeded} / 160</span>
              </div>
              {userData.exam_type && (
                <>
                  <div className="h-px bg-white/20"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-90">Exam</span>
                    <span className="font-bold">{userData.exam_type}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Recommendation Card */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl mt-0.5">💪</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Recommended Practice</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Practice <strong>previous year papers</strong> to achieve your target rank. Students who practice more papers show up to <strong>65% better performance</strong> in the actual exam.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
              <div className="text-2xl font-bold text-indigo-600">200+</div>
              <div className="text-xs text-gray-500 font-medium mt-0.5">Previous Year Papers</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
              <div className="text-2xl font-bold text-indigo-600">15k+</div>
              <div className="text-xs text-gray-500 font-medium mt-0.5">Successful Students</div>
            </div>
          </div>

          {/* Quote */}
          <div className="bg-indigo-50 rounded-xl p-4 mb-6 border border-indigo-100">
            <p className="text-sm text-indigo-800 italic text-center leading-relaxed">
              "The more previous year papers you practice, the more familiar you become with the exam pattern."
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={() => router.push('/onboarding/paywall')}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-base hover:bg-indigo-700 transition shadow-sm"
          >
            Get Rank {'< '}{nearestThousand.toLocaleString()} →
          </button>
          <p className="text-center text-xs text-gray-500 mt-2">
            Start your preparation journey today
          </p>
        </div>
      </div>
    </div>
  )
}
