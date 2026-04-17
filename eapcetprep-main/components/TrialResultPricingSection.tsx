'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { PlanTier, getProPlan } from '@/utils/pricing'
import { SpinWheel } from '@/components/SpinWheel'

declare global {
  interface Window {
    Razorpay: any
  }
}

const FEATURES_COMPARISON = [
  { name: 'All previous year papers', basic: true, pro: true },
  { name: 'Performance analytics', basic: true, pro: true },
  { name: 'Test attempts per paper', basic: '1 attempt', pro: 'Unlimited' },
  { name: 'Rank predictor', basic: false, pro: true },
]

const LANDING_B_PRO_ORIGINAL_PRICE = 499
const LANDING_B_PRO_PRICE = 299

function getLandingBDisplayPrice(_tier: PlanTier, _unused: boolean, spinWheelApplied: boolean): number {
  if (spinWheelApplied) return 249
  return LANDING_B_PRO_PRICE
}

export type TrialImprovement = {
  multiple: number
  targetRank: number
  mockTests: number
}

export function TrialResultPricingSection({ trialImprovement }: { trialImprovement?: TrialImprovement | null }) {
  const router = useRouter()
  const [selectedTier, setSelectedTier] = useState<PlanTier>('PRO')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [userPhone, setUserPhone] = useState('')
  const [showSpinWheel, setShowSpinWheel] = useState(false)
  const [spinWheelApplied, setSpinWheelApplied] = useState(false)
  const [shareLinkLoading, setShareLinkLoading] = useState(false)
  const [shareLinkError, setShareLinkError] = useState('')
  const [shareLinkUrl, setShareLinkUrl] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const shareLinkInputRef = useRef<HTMLInputElement>(null)

  const proPlan = getProPlan()

  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => setRazorpayLoaded(true)
      document.body.appendChild(script)
    } else {
      setRazorpayLoaded(true)
    }

    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check-session')
        const data = await response.json()
        setIsAuthenticated(!!data.authenticated)
        if (data.authenticated) {
          const userResponse = await fetch('/api/auth/user')
          const userData = await userResponse.json()
          setUserPhone(userData.phone || '')
        }
      } catch (_) {
        setIsAuthenticated(false)
      } finally {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSpinWheel(true)
    }, 45000)
    return () => clearTimeout(timer)
  }, [])

  const handleProPayment = async () => {
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('redirectPath', window.location.pathname + window.location.search || '/test/result')
      }
      router.push('/auth/register')
      return
    }

    try {
      setError('')
      setLoading(true)

      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
          body: JSON.stringify({
            tier: 'PRO',
            spin_wheel_applied: spinWheelApplied,
            amount_rupees: getLandingBDisplayPrice('PRO', false, spinWheelApplied),
          }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login')
          return
        }
        throw new Error(data.error || 'Failed to create order')
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: 'INR',
        name: 'eapcetpro',
        description: `eapcetpro · PRO · ${proPlan.label}`,
        order_id: data.orderId,
        theme: { color: '#2563EB' },
        prefill: {
          name: 'Student',
          contact: userPhone,
          email: '',
        },
        method: {
          upi: '1',
          card: '0',
          netbanking: '0',
          wallet: '0',
          emi: '0',
          paylater: '0',
        },
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
            const verifyData = await verifyResponse.json()
            if (verifyData.success) {
              router.push('/payment/success')
            } else {
              if (verifyResponse.status === 401 || verifyResponse.status === 400) {
                router.push('/auth/login')
                return
              }
              throw new Error(verifyData.error || 'Payment verification failed')
            }
          } catch (err) {
            console.error('Verification error:', err)
            router.push('/payment/failure')
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      console.error('Payment error:', err)
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = () => {
    handleProPayment()
  }

  const handleSpinOfferPayment = async () => {
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('redirectPath', window.location.pathname + window.location.search || '/test/result')
      }
      router.push('/auth/register')
      return
    }
    try {
      setError('')
      setLoading(true)
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tier: 'PRO', spin_wheel_applied: true }),
      })
      const data = await response.json()
      if (!response.ok) {
        if (response.status === 401) router.push('/auth/login')
        else throw new Error(data.error || 'Failed to create order')
        return
      }
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: 'INR',
        name: 'eapcetpro',
        description: 'eapcetpro · ₹249 Unlimited',
        order_id: data.orderId,
        theme: { color: '#2563EB' },
        prefill: { name: 'Student', contact: userPhone, email: '' },
        method: {
          upi: '1',
          card: '0',
          netbanking: '0',
          wallet: '0',
          emi: '0',
          paylater: '0',
        },
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
            const verifyData = await verifyResponse.json()
            if (verifyData.success) router.push('/payment/success')
            else if (verifyResponse.status === 401 || verifyResponse.status === 400) router.push('/auth/login')
            else throw new Error(verifyData.error || 'Payment verification failed')
          } catch (e) {
            console.error(e)
            router.push('/payment/failure')
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      }
      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      console.error('Payment error:', err)
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSharePaymentLink = async () => {
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('redirectPath', window.location.pathname + window.location.search + (window.location.search ? '&' : '?') + 'shareLink=1')
      }
      router.push('/auth/register')
      return
    }
    setShareLinkError('')
    setShareLinkLoading(true)
    try {
      const res = await fetch('/api/payments/share-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'PRO' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create link')
      setShareLinkUrl(data.url)
      setShowShareModal(true)
    } catch (err) {
      setShareLinkError(err instanceof Error ? err.message : 'Failed to create link')
    } finally {
      setShareLinkLoading(false)
    }
  }

  const copyShareLink = async () => {
    const text = shareLinkUrl ?? ''
    if (!text) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const input = shareLinkInputRef.current
        if (input) {
          input.select()
          input.setSelectionRange(0, text.length)
          document.execCommand('copy')
        } else return
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      const input = shareLinkInputRef.current
      if (input) {
        input.select()
        input.setSelectionRange(0, text.length)
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      }
    }
  }

  return (
    <>
      <div
        id="pricing"
        className="fixed bottom-0 left-0 right-0 z-20 w-full max-w-[100vw] overflow-x-hidden bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
      >
        {trialImprovement && (
          <div className="bg-amber-500 text-amber-950 border-b border-amber-600/30">
            <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-3 text-center">
              <p className="text-sm sm:text-base font-medium leading-relaxed">
                Practice <span className="font-bold">{trialImprovement.mockTests} full-length mock tests</span> in the next 30 days to improve your rank by up to <span className="font-bold">{trialImprovement.multiple}x</span> and aim for a rank less than <span className="font-semibold">{trialImprovement.targetRank.toLocaleString()}</span>.
              </p>
            </div>
          </div>
        )}
        <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-2 min-w-0 box-border">
          {/* Money-back guarantee row — commented out
          <div className="flex items-center justify-between gap-1 min-w-0 mb-1">
            <p className="text-[9px] sm:text-[10px] text-emerald-700 truncate flex-1 min-w-0">
              Money-back 48hrs · Spin for offer
            </p>
            <button
              type="button"
              onClick={() => setShowSpinWheel(true)}
              className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 bg-white transition"
              aria-label="Try your luck / spin wheel"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </div>
          */}

          <div className="grid grid-cols-1 gap-1.5 mb-1.5 min-w-0">
            <div
              onClick={() => setSelectedTier('PRO')}
              className={`relative bg-white rounded-lg border-2 p-2 sm:p-2.5 cursor-pointer transition-all min-w-0 ${
                selectedTier === 'PRO' ? 'border-blue-600 shadow-md' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex flex-row gap-1.5 flex-wrap mb-1.5">
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">POPULAR</span>
                <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">LIFETIME</span>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">PRO</h3>
                <p className="text-[10px] sm:text-xs text-gray-600 mb-1">{proPlan.label}</p>
                <div className="flex items-baseline mb-1 flex-wrap gap-x-1">
                  {spinWheelApplied ? (
                    <>
                      <span className="text-[10px] sm:text-xs text-gray-500 line-through">₹{LANDING_B_PRO_ORIGINAL_PRICE}</span>
                      <span className="text-[10px] sm:text-xs text-green-600 font-medium">50% off</span>
                      <span className="text-lg sm:text-xl font-bold text-gray-900">₹{getLandingBDisplayPrice('PRO', false, true)}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] sm:text-xs text-gray-500 line-through">₹{LANDING_B_PRO_ORIGINAL_PRICE}</span>
                      <span className="text-[10px] sm:text-xs text-green-600 font-medium">-₹{LANDING_B_PRO_ORIGINAL_PRICE - LANDING_B_PRO_PRICE} off</span>
                      <span className="text-lg sm:text-xl font-bold text-gray-900">₹{getLandingBDisplayPrice('PRO', false, false)}</span>
                    </>
                  )}
                  <span className="text-[10px] text-gray-500 ml-0.5">one-time</span>
                </div>
                <div className="space-y-0.5 mb-1">
                  {FEATURES_COMPARISON.map((feature, index) => (
                    <div key={index} className="flex items-start gap-1 text-[10px] sm:text-xs">
                      <CheckIcon className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 leading-tight">
                        {typeof feature.pro === 'string' ? `${feature.name}: ${feature.pro}` : feature.name}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${selectedTier === 'PRO' ? 'border-blue-600' : 'border-gray-300'}`}>
                    {selectedTier === 'PRO' && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-600">Select</span>
                </div>
              </div>
            </div>
          </div>


          {error && (
            <div className="mb-1 bg-red-50 border border-red-200 text-red-700 px-1.5 py-1 rounded text-[9px]">
              {error}
            </div>
          )}

          <div className="flex gap-1.5 min-w-0">
            <button
              onClick={handlePayment}
              disabled={loading || !razorpayLoaded}
              className="flex-[1.75] min-w-0 bg-blue-600 text-white py-2 px-3 rounded font-bold text-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-1">
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Paying...
                </span>
              ) : (
                `Pay ₹${getLandingBDisplayPrice('PRO', false, spinWheelApplied)}`
              )}
            </button>
            <button
              type="button"
              onClick={handleSharePaymentLink}
              disabled={shareLinkLoading}
              className="flex-1 min-w-0 border border-blue-600 text-blue-600 py-2 px-2 rounded font-semibold text-[10px] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {shareLinkLoading ? '...' : 'Share link'}
            </button>
          </div>
          {shareLinkError && <p className="text-[9px] text-red-600 mt-0.5 text-center">{shareLinkError}</p>}
          <p className="text-[8px] text-gray-500 text-center mt-0.5">Razorpay · One-time</p>
        </div>
      </div>

      {showSpinWheel && (
        <SpinWheel
          onResult={() => setSpinWheelApplied(true)}
          onClose={() => setShowSpinWheel(false)}
          onPayNow={handleSpinOfferPayment}
          onSharePaymentLink={async () => {
            if (!isAuthenticated) {
              if (typeof window !== 'undefined') {
                localStorage.setItem('redirectPath', window.location.pathname + window.location.search || '/test/result')
              }
              router.push('/auth/register')
              return
            }
            setShowSpinWheel(false)
            await handleSharePaymentLink()
          }}
        />
      )}

      {showShareModal && shareLinkUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-auto min-w-0"
          onClick={() => setShowShareModal(false)}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-[min(24rem,calc(100vw-2rem))] p-4 min-w-0" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-2">Share payment link</h3>
            <p className="text-xs text-gray-600 mb-3">
              Send this link to someone to pay ₹{getLandingBDisplayPrice('PRO', false, spinWheelApplied)} for your account. They can pay without logging in.
            </p>
            <div className="flex gap-2 mb-2">
              <input
                ref={shareLinkInputRef}
                type="text"
                readOnly
                value={shareLinkUrl}
                className="flex-1 min-w-0 text-xs border border-gray-200 rounded px-2 py-2 bg-gray-50 text-gray-700"
                aria-label="Payment link"
              />
              <button
                type="button"
                onClick={copyShareLink}
                className="shrink-0 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 font-medium mb-3">
                Copied to clipboard. Share it with your parents or anyone to complete payment.
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowShareModal(false)}
              className="w-full border border-gray-300 text-gray-700 py-1 rounded-md text-sm font-medium hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
