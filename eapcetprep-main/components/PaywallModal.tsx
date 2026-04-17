'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { XMarkIcon, StarIcon, CheckIcon } from '@heroicons/react/24/solid'
import { SpinWheel } from '@/components/SpinWheel'
import {
  getProPlan,
  getOnboardingPaywallPriceRupees,
  getOnboardingPaywallOriginalRupees,
  SPIN_OFFER_RUPEES,
} from '@/utils/pricing'
import { trackInitiateCheckout } from '@/lib/facebook-pixel'

declare global {
  interface Window { Razorpay: any }
}

const FEATURES = [
  'All previous year papers from 2015-2025',
  'Chapter wise questions',
  'Chapter wise quizzes',
  'Unlimited attempts per test',
  'Performance analytics',
  'Rank predictor',
]

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [showSpinWheel, setShowSpinWheel] = useState(false)
  const [spinWheelApplied, setSpinWheelApplied] = useState(false)
  const spinWheelShownRef = useRef(false)
  const [shareLinkUrl, setShareLinkUrl] = useState<string | null>(null)
  const [shareLinkLoading, setShareLinkLoading] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareLinkError, setShareLinkError] = useState('')
  const [copied, setCopied] = useState(false)
  const shareLinkInputRef = useRef<HTMLInputElement>(null)


  // Midnight countdown
  const [midnightCountdown, setMidnightCountdown] = useState('')
  useEffect(() => {
    function getSecsToMidnight() {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000))
    }
    function fmt(s: number) {
      const h = Math.floor(s / 3600)
      const m = Math.floor((s % 3600) / 60)
      const sec = s % 60
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    }
    setMidnightCountdown(fmt(getSecsToMidnight()))
    const id = setInterval(() => setMidnightCountdown(fmt(getSecsToMidnight())), 1000)
    return () => clearInterval(id)
  }, [])

  const proPlan = getProPlan()
  const price = getOnboardingPaywallPriceRupees('PRO', true, spinWheelApplied)
  const originalPrice = getOnboardingPaywallOriginalRupees('PRO')

  useEffect(() => {
    if (!isOpen) return
    if (!window.Razorpay) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => setRazorpayLoaded(true)
      document.body.appendChild(script)
    } else {
      setRazorpayLoaded(true)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    fetch('/api/auth/user')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.phone) setUserPhone(d.phone) })
      .catch(() => {})
  }, [isOpen])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('')
      setShowSpinWheel(false)
      spinWheelShownRef.current = false
      setSpinWheelApplied(false)
    }
  }, [isOpen])

  const handleClose = () => {
    if (!spinWheelShownRef.current) {
      setShowSpinWheel(true)
      spinWheelShownRef.current = true
    } else {
      onClose()
    }
  }

  const handleProPayment = async () => {
    const authCheck = await fetch('/api/auth/check-session')
    const authData = await authCheck.json()
    if (!authData.authenticated) {
      router.push('/auth/login')
      return
    }
    try {
      setError('')
      setLoading(true)
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tier: 'PRO', amount_rupees: price, spin_wheel_applied: spinWheelApplied }),
      })
      const data = await response.json()
      if (!response.ok) {
        if (response.status === 401) { router.push('/auth/login'); return }
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
        method: { upi: true, card: false, netbanking: false, wallet: false },
        prefill: { name: 'Student', contact: userPhone, email: '' },
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
              if (verifyResponse.status === 401 || verifyResponse.status === 400) { router.push('/auth/login'); return }
              throw new Error(verifyData.error || 'Payment verification failed')
            }
          } catch (error) {
            router.push('/payment/failure')
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      }
      trackInitiateCheckout({ value: data.amount / 100, currency: 'INR', content_name: `eapcetpro · PRO · ${proPlan.label}` })
      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSpinOfferPayment = async () => {
    const authCheck = await fetch('/api/auth/check-session')
    const authData = await authCheck.json()
    if (!authData.authenticated) { router.push('/auth/login'); return }
    try {
      setError('')
      setLoading(true)

      // Always resolve the latest phone — fetch fresh if state hasn't populated yet
      let phone = userPhone
      if (!phone) {
        const userRes = await fetch('/api/auth/user')
        if (userRes.ok) {
          const ud = await userRes.json()
          phone = ud?.phone || ''
          if (phone) setUserPhone(phone)
        }
      }

      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tier: 'PRO', amount_rupees: SPIN_OFFER_RUPEES, spin_wheel_applied: true }),
      })
      const data = await response.json()
      if (!response.ok) {
        if (response.status === 401) { router.push('/auth/login'); return }
        throw new Error(data.error || 'Failed to create order')
      }
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: 'INR',
        name: 'eapcetpro',
        description: 'eapcetpro · ₹249 Unlimited',
        order_id: data.orderId,
        theme: { color: '#2563EB' },
        method: { upi: true, card: false, netbanking: false, wallet: false },
        prefill: { name: 'Student', contact: phone, email: '' },
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
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
            router.push('/payment/failure')
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      }
      trackInitiateCheckout({ value: data.amount / 100, currency: 'INR', content_name: 'eapcetpro · ₹249 Unlimited' })
      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSharePaymentLink = async () => {
    setShareLinkError('')
    setShareLinkLoading(true)
    try {
      const res = await fetch('/api/payments/share-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'PRO', amount_rupees: price }),
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
        if (input) { input.select(); input.setSelectionRange(0, text.length); document.execCommand('copy') }
        else return
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      const input = shareLinkInputRef.current
      if (input) { input.select(); input.setSelectionRange(0, text.length); document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 3000) }
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100 flex-shrink-0">
            <div>
              <h2 className="text-base font-bold text-gray-900">Unlock Full Access</h2>
              <p className="text-xs text-gray-500">Join thousands of EAPCET toppers</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 transition"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
            {/* Social proof */}
            <div className="flex items-center justify-center gap-2 mb-4 py-2.5 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => <StarIcon key={s} className="h-3.5 w-3.5 text-yellow-400" />)}
              </div>
              <span className="text-sm font-semibold text-gray-800">
                Trusted by <span className="text-blue-600 font-bold">1270+</span> students
              </span>
            </div>

            {/* Pricing card */}
            <div className="border-2 border-blue-600 rounded-xl p-4 bg-white shadow-md relative mb-4">
              <div className="absolute -top-2.5 left-3 flex gap-1">
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">POPULAR</span>
                <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">LIFETIME</span>
              </div>
              <div className="mt-1">
                <h3 className="text-sm font-bold text-gray-900 mb-0.5">PRO</h3>
                <p className="text-xs text-gray-500 mb-2">{proPlan.label}</p>
                <div className="flex items-baseline gap-1.5 mb-3 flex-wrap">
                  {spinWheelApplied ? (
                    <>
                      <span className="text-xs text-gray-400 line-through">₹{originalPrice}</span>
                      <span className="text-xs text-green-600 font-semibold">50% off</span>
                      <span className="text-2xl font-bold text-gray-900">₹{price}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-gray-400 line-through">₹{originalPrice}</span>
                      <span className="text-xs text-green-600 font-semibold">-₹{originalPrice - price} off</span>
                      <span className="text-2xl font-bold text-gray-900">₹{price}</span>
                      <span className="text-[11px] text-orange-600 font-semibold bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5 ml-1">
                        Price increases in {midnightCountdown}
                      </span>
                    </>
                  )}
                  <span className="text-xs text-gray-500 w-full">one-time payment</span>
                </div>
                <div className="space-y-1.5">
                  {FEATURES.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                {error}
              </div>
            )}
          </div>

          {/* Sticky bottom CTA */}
          <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-gray-100 bg-white">
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes border-spin { to { transform: rotate(360deg); } }
              .btn-glow-wrap { position: relative; border-radius: 0.75rem; padding: 2px; overflow: hidden; flex: 1.75; }
              .btn-glow-wrap::before {
                content: '';
                position: absolute;
                inset: -100%;
                background: conic-gradient(transparent 60deg, #93c5fd 120deg, #ffffff 180deg, #93c5fd 240deg, transparent 300deg);
                animation: border-spin 2s linear infinite;
              }
            `}} />
            <div className="flex gap-2">
              <div className="btn-glow-wrap">
              <button
                onClick={handleProPayment}
                disabled={loading || !razorpayLoaded}
                className="relative w-full bg-blue-600 text-white py-3 px-4 rounded-[10px] font-bold text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : `Pay ₹${price} Now`}
              </button>
              </div>
              <button
                type="button"
                onClick={handleSharePaymentLink}
                disabled={shareLinkLoading}
                className="flex-1 border-2 border-blue-600 text-blue-600 py-2 px-3 rounded-xl font-semibold text-xs hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {shareLinkLoading ? 'Creating...' : 'Share payment link'}
              </button>
            </div>
            {shareLinkError && (
              <p className="text-red-600 text-[10px] mt-1 text-center">{shareLinkError}</p>
            )}
            <div className="mt-2 flex items-center justify-center gap-1">
              <img src="https://razorpay.com/assets/razorpay-logo.svg" alt="Razorpay" className="h-2" />
              <p className="text-[9px] text-gray-400">Secure payment by Razorpay</p>
            </div>
          </div>
        </div>
      </div>

      {/* Spin wheel */}
      {showSpinWheel && (
        <SpinWheel
          onResult={() => setSpinWheelApplied(true)}
          onClose={() => setShowSpinWheel(false)}
          onPayNow={handleSpinOfferPayment}
          onSharePaymentLink={async () => {
            setShareLinkError('')
            setShareLinkLoading(true)
            try {
              const res = await fetch('/api/payments/share-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier: 'PRO', amount_rupees: SPIN_OFFER_RUPEES }),
              })
              const data = await res.json()
              if (!res.ok) throw new Error(data.error || 'Failed to create link')
              setShareLinkUrl(data.url)
              setShowSpinWheel(false)
              setShowShareModal(true)
            } catch (err) {
              setShareLinkError(err instanceof Error ? err.message : 'Failed to create link')
            } finally {
              setShareLinkLoading(false)
            }
          }}
        />
      )}

      {/* Share payment link modal */}
      {showShareModal && shareLinkUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-2">Share payment link</h3>
            <p className="text-xs text-gray-600 mb-3">
              Send this link to someone to pay ₹{price} for your account. They can pay without logging in.
            </p>
            <div className="flex gap-2 mb-2">
              <input
                ref={shareLinkInputRef}
                type="text"
                readOnly
                value={shareLinkUrl ?? ''}
                className="flex-1 text-xs border border-gray-200 rounded px-2 py-2 bg-gray-50 text-gray-700"
                aria-label="Payment link"
              />
              <button
                type="button"
                onClick={copyShareLink}
                className="shrink-0 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {copied && <p className="text-xs text-green-600 font-medium mb-2">Copied! Share it with your parents or anyone to complete payment.</p>}
            <button
              type="button"
              onClick={() => setShowShareModal(false)}
              className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
