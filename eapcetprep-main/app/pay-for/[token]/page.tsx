'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { StarIcon } from '@heroicons/react/24/solid'
import { trackInitiateCheckout, trackPurchase } from '@/lib/facebook-pixel'

declare global {
  interface Window {
    Razorpay: any
  }
}

interface LinkDetails {
  user: { name: string; phone: string }
  planTier: string
  planLabel: string
  amount: number
  currency: string
}

export default function PayForPage() {
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string
  const [details, setDetails] = useState<LinkDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [payLoading, setPayLoading] = useState(false)
  const [error, setError] = useState('')
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid link')
      setLoading(false)
      return
    }
    if (!window.Razorpay) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => setRazorpayLoaded(true)
      document.body.appendChild(script)
    } else {
      setRazorpayLoaded(true)
    }

    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/payments/share-link/${token}`)
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Link not found or expired')
          return
        }
        setDetails(data)
      } catch {
        setError('Failed to load link')
      } finally {
        setLoading(false)
      }
    }
    fetchDetails()
  }, [token])

  const handlePay = async () => {
    if (!token || !details || !razorpayLoaded) return
    setError('')
    setPayLoading(true)
    try {
      const res = await fetch('/api/payments/create-order-for-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create order')

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: details.amount * 100,
        currency: (details.currency || 'INR').toUpperCase(),
        name: 'eapcetpro',
        description: `Pay for ${details.user.name} · ${details.planLabel}`,
        order_id: data.orderId,
        theme: { color: '#2563EB' },
        method: { upi: true, card: false, netbanking: false, wallet: false },
        prefill: {
          name: details.user.name || 'Student',
          contact: details.user.phone || '',
          email: '',
        },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          try {
            const verifyRes = await fetch('/api/payments/verify-share', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              trackPurchase({ value: details.amount, currency: details.currency || 'INR', content_name: `eapcetpro · ${details.planLabel}` })
              setSuccess(true)
            } else {
              setError(verifyData.error || 'Payment verification failed')
            }
          } catch {
            setError('Payment verification failed')
          }
        },
        modal: {
          ondismiss: () => setPayLoading(false),
        },
      }

      trackInitiateCheckout({ value: details.amount, currency: details.currency || 'INR', content_name: `Pay for ${details.user.name} · ${details.planLabel}` })
      const rp = new window.Razorpay(options)
      rp.open()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setPayLoading(false)
    }
  }

  const BrandHeader = () => (
    <div className="sm:mx-auto sm:w-full sm:max-w-sm flex justify-center mb-6">
      <Link href="/" className="text-blue-600 font-bold text-2xl">
        eapcet<span className="text-gray-900">pro</span>
      </Link>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 p-4">
        <BrandHeader />
        <div className="animate-pulse text-gray-500 text-sm text-center">Loading...</div>
      </div>
    )
  }

  if (error && !details) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 p-4">
        <BrandHeader />
        <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <Link href="/" className="text-blue-600 text-sm font-medium hover:text-blue-500">Go to home</Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 p-4">
        <BrandHeader />
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="bg-white rounded-lg border border-gray-100 shadow-xl shadow-gray-100 p-6 text-center">
            <div className="text-green-600 text-4xl mb-2">✓</div>
            <h1 className="text-lg font-bold text-gray-900 mb-1">Payment successful</h1>
            <p className="text-sm text-gray-600 mb-4">
              {details?.user.name} has been upgraded. They can now access their plan.
            </p>
            <Link
              href="/"
              className="inline-block w-full bg-blue-600 text-white py-2.5 rounded-md font-medium text-sm hover:bg-blue-700"
            >
              Continue to eapcetpro
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!details) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 p-4">
      <BrandHeader />
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="text-center text-xl font-extrabold text-gray-900 mb-1">Pay for this student</h2>
        <p className="text-center text-sm text-gray-600 mb-2">Complete the payment to upgrade their account. No login required.</p>

        <div className="flex flex-col items-center justify-center mb-2">
          <div className="flex items-center justify-center gap-1 mb-1">
            <StarIcon className="h-4 w-4 text-yellow-400" />
            <StarIcon className="h-4 w-4 text-yellow-400" />
            <StarIcon className="h-4 w-4 text-yellow-400" />
          </div>
          <span className="text-[10px] text-gray-700 text-center">
            Trusted by <span className="font-bold">1270+</span> students
          </span>
        </div>

        <div className="text-center mb-4 py-3 px-2 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
            142+ question papers · 22,400+ questions · 70+ papers with detailed answers
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 shadow-xl shadow-gray-100 py-8 px-4 sm:px-6">
          <h1 className="text-lg font-bold text-gray-900 mb-1 sr-only">Pay for this student</h1>
          <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-gray-900">{details.user.name}</span>
            </div>
            {details.user.phone && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium text-gray-900">{details.user.phone}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Plan</span>
              <span className="font-medium text-gray-900">
                {details.planLabel} · ₹{details.amount}
              </span>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-xs mb-3">{error}</p>
          )}

          <button
            onClick={handlePay}
            disabled={payLoading || !razorpayLoaded}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md font-bold text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {payLoading ? 'Opening...' : `Pay ₹${details.amount}`}
          </button>

          <p className="text-[10px] text-gray-500 text-center mt-3">
            Secure payment by Razorpay
          </p>
        </div>
      </div>
    </div>
  )
}
