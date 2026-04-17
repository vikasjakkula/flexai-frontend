"use client"

import { useState, useEffect, Suspense, useRef } from 'react'
import { Headset, Download, Home, BookOpen, FileText, BarChart3, X, User, AlertTriangle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SupportTicketModal } from '@/components/SupportTicketModal'
import { PwaInstallModal } from '@/components/PwaInstallModal'
import { PaywallModal } from '@/components/PaywallModal'
import HomeTab from '@/components/dashboard/HomeTab'
import ChapterTab from '@/components/dashboard/ChapterTab'
import MockTab from '@/components/dashboard/MockTab'
import AnalyticsTab from '@/components/dashboard/AnalyticsTab'
import ProfileTab from '@/components/dashboard/ProfileTab'
import QuizInterface from '@/components/dashboard/QuizInterface'

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState('home')
  const [activeQuiz, setActiveQuiz] = useState<{id: string | number, title: string, subject?: string, chapter?: string} | null>(null)
  const [quizRefreshKey, setQuizRefreshKey] = useState(0)

  // Shared state loaded at the top level
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [testResults, setTestResults] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [pwaInstalled, setPwaInstalled] = useState<boolean | null>(null)

  // Download/PWA dialog
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [showDownloadBanner, setShowDownloadBanner] = useState(true)
  const [showPwaModal, setShowPwaModal] = useState(false)

  // Support modal
  const [showSupportModal, setShowSupportModal] = useState(false)

  // Paywall modal
  // TEMPORARY DISABLE: Change back to just useState(false) and remove the no-op override to re-enable paywall
  const [showPaywallModal, _setShowPaywallModal] = useState(false)
  const setShowPaywallModal = (_v: boolean) => {} // no-op: paywall temporarily disabled

  // Backdoor: tap Home 5 times to open paywall
  const homeTapCount = useRef(0)
  const homeTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleHomeTap = () => {
    homeTapCount.current += 1
    if (homeTapTimer.current) clearTimeout(homeTapTimer.current)
    if (homeTapCount.current >= 5) {
      homeTapCount.current = 0
      setShowPaywallModal(true)
    } else {
      homeTapTimer.current = setTimeout(() => { homeTapCount.current = 0 }, 1000)
    }
  }

  // Auto-open paywall when coming from onboarding
  // TEMPORARY DISABLE: Remove the "false &&" to re-enable paywall auto-open
  useEffect(() => {
    if (false && !loading && !isPremium && searchParams.get('paywall') === '1') {
      setShowPaywallModal(true)
    }
  }, [loading, isPremium, searchParams])

  // Bootstrap: auth + user + results + analytics
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)

        // Auth check
        const authRes = await fetch('/api/auth/check-session')
        const authData = await authRes.json()
        if (!authData.authenticated) {
          router.push('/auth/login')
          return
        }

        // Premium check
        const premiumRes = await fetch('/api/auth/premium-check')
        const premiumData = await premiumRes.json()
        setIsPremium(premiumData.isPremium || false)

        // User data
        const userRes = await fetch('/api/auth/user')
        if (userRes.ok) {
          const ud = await userRes.json()
          setUserData(ud)
          setPwaInstalled(ud.pwa_installed || false)
          // Hide download banner if PWA already installed
          if (ud.pwa_installed) setShowDownloadBanner(false)
        }

        // Test results
        const resultsRes = await fetch('/api/test/results?limit=1000')
        const resultsData = await resultsRes.json()
        const fetchedResults = resultsData.success ? (resultsData.results || []) : []
        setTestResults(fetchedResults)

        // Calculate analytics from results
        if (fetchedResults.length > 0) {
          const totalTests = fetchedResults.length
          const totalScores = fetchedResults.reduce((sum: number, r: any) => sum + (r.total_marks || 0), 0)
          const avgScore = totalScores / totalTests
          const totalCorrect = fetchedResults.reduce((sum: number, r: any) => sum + (r.correct_answers || 0), 0)
          const totalQuestions = totalTests * 160
          const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0

          // Weighted average rank (exponential decay: most recent matters most)
          const sortedResults = [...fetchedResults].sort((a: any, b: any) =>
            new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
          )
          const resultsWithRank = sortedResults.filter((r: any) => r.estimated_rank?.estimatedRank)
          let avgEstimatedRank = null
          if (resultsWithRank.length > 0) {
            const decayRate = 0.5
            let totalWeightedRank = 0
            let totalWeight = 0
            resultsWithRank.forEach((result: any, index: number) => {
              const weight = Math.exp(-decayRate * index)
              totalWeightedRank += result.estimated_rank.estimatedRank * weight
              totalWeight += weight
            })
            avgEstimatedRank = Math.round(totalWeightedRank / totalWeight)
          }

          setAnalytics({
            total_tests_taken: totalTests,
            average_score: avgScore,
            total_correct: totalCorrect,
            accuracy,
            average_estimated_rank: avgEstimatedRank,
          })
        }
      } catch (err) {
        console.error('Dashboard init error:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  // Handle start test (from HomeTab or MockTab)
  const handleStartTest = async (testId: string) => {
    if (!isPremium) {
      setShowPaywallModal(true)
      return
    }
    router.push(`/test/instructions?testId=${testId}`)
  }

  const handlePwaInstalled = async () => {
    const res = await fetch('/api/user/update-pwa-installed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pwa_installed: true }),
    })
    if (res.ok) {
      setPwaInstalled(true)
      setShowPwaModal(false)
      setShowDownloadBanner(false)
    }
  }

  // If a quiz is active, show quiz interface full-screen
  if (activeQuiz) {
    return (
      <QuizInterface
        quizId={activeQuiz.id}
        quizTitle={activeQuiz.title}
        subject={activeQuiz.subject}
        chapter={activeQuiz.chapter}
        onClose={() => { setActiveQuiz(null); setQuizRefreshKey(k => k + 1); }}
      />
    )
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeTab
            showDownloadBanner={showDownloadBanner}
            setShowDownloadDialog={setShowDownloadDialog}
            setActiveTab={setActiveTab}
            isPremium={isPremium}
            userData={userData}
            userField={userData?.field}
            testResults={testResults}
            analytics={analytics}
            onStartTest={handleStartTest}
            onShowPaywall={() => setShowPaywallModal(true)}
          />
        )
      case 'chapter':
        return <ChapterTab setActiveQuiz={setActiveQuiz} refreshKey={quizRefreshKey} isPremium={isPremium} onShowPaywall={() => setShowPaywallModal(true)} userField={userData?.field} />
      case 'mock':
        return (
          <MockTab
            isPremium={isPremium}
            onShowPaywall={() => setShowPaywallModal(true)}
          />
        )
      case 'analytics':
        return <AnalyticsTab />
      case 'profile':
        return <ProfileTab userData={userData} isPremium={isPremium} />
      default:
        return (
          <HomeTab
            showDownloadBanner={showDownloadBanner}
            setShowDownloadDialog={setShowDownloadDialog}
            setActiveTab={setActiveTab}
            isPremium={isPremium}
            userData={userData}
            userField={userData?.field}
            testResults={testResults}
            analytics={analytics}
            onStartTest={handleStartTest}
            onShowPaywall={() => setShowPaywallModal(true)}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl relative pb-24 overflow-x-hidden">

        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-20">
          <div className="font-bold text-xl text-indigo-600 tracking-tight">eapcetpro</div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSupportModal(true)}
              className="flex items-center gap-1.5 text-sm font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Headset className="w-4 h-4" />
              Support
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center border border-indigo-100 hover:bg-indigo-100 transition-colors"
            >
              {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
            </button>
          </div>
        </header>

        {/* Loading overlay */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium text-sm">Loading...</p>
          </div>
        )}

        {/* TEMPORARY: Maintenance banner — remove this block when tests/quizzes are back */}
        {!loading && (
          <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">Tests & Quizzes Temporarily Unavailable</p>
              <p className="text-xs text-amber-600 mt-0.5">We're working on it and it will be resolved within 24 hours. Sorry for the inconvenience!</p>
            </div>
          </div>
        )}

        {/* Tab content */}
        {!loading && (
          <main className="p-4">
            {renderTab()}
          </main>
        )}

        {/* Bottom Navigation */}
        <nav
          className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 px-6 py-2 flex justify-between items-center z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
          style={{paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))'}}
        >
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'chapter', icon: BookOpen, label: 'Chapter wise' },
            { id: 'mock', icon: FileText, label: 'Mock tests' },
            { id: 'analytics', icon: BarChart3, label: 'Performance' },
          ].map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); if (item.id === 'home') handleHomeTap() }}
                className={`flex flex-col items-center gap-1 min-w-[64px] py-2 ${
                  isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-50' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-semibold'}`}>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Download/PWA Dialog */}
        {showDownloadDialog && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-gray-100">
              <div className="p-6">
                <div className="flex justify-between items-start mb-5">
                  <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                    <Download className="w-7 h-7" />
                  </div>
                  <button
                    onClick={() => setShowDownloadDialog(false)}
                    className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-lg p-2 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">Add to Homescreen</h3>
                <p className="text-gray-600 text-sm mb-8 leading-relaxed font-medium">
                  Install the EapcetPro app on your device for a faster, better experience. Access your tests and analytics anytime, anywhere.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowDownloadDialog(false)
                      setShowPwaModal(true)
                    }}
                    className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-700 transition-all active:scale-[0.98]"
                  >
                    Show me how
                  </button>
                  <button
                    onClick={() => {
                      setShowDownloadDialog(false)
                      setShowDownloadBanner(false)
                    }}
                    className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                  >
                    I have already downloaded
                  </button>
                  <button
                    onClick={() => {
                      setShowDownloadDialog(false)
                      setShowDownloadBanner(false)
                    }}
                    className="w-full py-3 text-gray-500 font-bold hover:text-gray-800 transition-colors text-sm"
                  >
                    Don't show this again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PWA Install Modal */}
      <PwaInstallModal
        isOpen={showPwaModal}
        onClose={() => setShowPwaModal(false)}
        onInstalled={handlePwaInstalled}
      />

      {/* Support Modal */}
      <SupportTicketModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
      />

      {/* Wave animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wave {
          0% { transform: rotate(0.0deg) }
          10% { transform: rotate(14.0deg) }
          20% { transform: rotate(-8.0deg) }
          30% { transform: rotate(14.0deg) }
          40% { transform: rotate(-4.0deg) }
          50% { transform: rotate(10.0deg) }
          60% { transform: rotate(0.0deg) }
          100% { transform: rotate(0.0deg) }
        }
        .animate-wave {
          animation: wave 2.5s infinite;
          transform-origin: bottom right;
        }
      `}} />
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex justify-center">
        <div className="w-full max-w-md bg-white min-h-screen shadow-xl flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium text-sm">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
