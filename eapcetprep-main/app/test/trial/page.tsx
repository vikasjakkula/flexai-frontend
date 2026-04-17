'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Inter } from 'next/font/google'
import { ClockIcon, BeakerIcon } from '@heroicons/react/24/outline'

const inter = Inter({ subsets: ['latin'] })

const TRIAL_DURATION_MINS = 15
const TRIAL_QUESTIONS_PER_SUBJECT = 5

function TrialPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const testIdParam = searchParams.get('testId')
  const [testId, setTestId] = useState<string | null>(testIdParam)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (testIdParam) setTestId(testIdParam)
    else if (typeof window !== 'undefined') {
      const fromStorage = window.localStorage.getItem('trialTestId')
      if (fromStorage) setTestId(fromStorage)
    }
  }, [testIdParam])

  const handleStartTrial = async () => {
    const id = testId?.trim()
    if (!id) {
      setError('Please select a test first.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/test/trial/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: parseInt(id, 10) })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start trial')
      const attemptId = data.attemptId
      router.push(`/test/take?testId=${id}&attemptId=${attemptId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start trial')
      setLoading(false)
    }
  }

  if (!testId) {
    return (
      <div className={`${inter.className} min-h-screen bg-gray-50 flex items-center justify-center px-4`}>
        <div className="text-center">
          <p className="text-gray-600">No test selected for trial.</p>
          <button
            type="button"
            onClick={() => router.push('/landing')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Go to landing
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${inter.className} min-h-screen bg-gray-50 text-gray-900`}>
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 flex items-center">
          <span className="text-blue-600 font-bold text-xl">eapcet<span className="text-gray-900">pro</span></span>
          <h1 className="ml-4 text-lg font-medium">15-minute trial</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center gap-2 text-blue-600 mb-4">
            <ClockIcon className="h-6 w-6" />
            <span className="font-semibold text-lg">{TRIAL_DURATION_MINS} minutes · {TRIAL_QUESTIONS_PER_SUBJECT} questions per subject</span>
          </div>
          <p className="text-gray-700 mb-4">
            This trial gives you a quick taste of the test: <strong>5 random questions each</strong> from Mathematics, Physics, and Chemistry (15 questions total) from the test you selected.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 mb-6">
            <li>Mathematics: 5 questions</li>
            <li>Physics: 5 questions</li>
            <li>Chemistry: 5 questions</li>
          </ul>
          {error && (
            <p className="text-red-600 text-sm mb-4">{error}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleStartTrial}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <>
                  <BeakerIcon className="h-5 w-5 animate-pulse" />
                  Starting…
                </>
              ) : (
                'Start 15-min trial'
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push('/landing-b')}
              className="bg-gray-200 text-gray-800 px-5 py-2.5 rounded-md hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function TrialPage() {
  return (
    <Suspense fallback={
      <div className={`${inter.className} min-h-screen bg-gray-50 flex items-center justify-center`}>
        <div className="animate-pulse text-gray-500">Loading…</div>
      </div>
    }>
      <TrialPageContent />
    </Suspense>
  )
}
