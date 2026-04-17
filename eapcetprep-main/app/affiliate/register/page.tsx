'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Inter } from 'next/font/google'
import { Shimmer } from '@/components/Shimmer'

const inter = Inter({ subsets: ['latin'] })

export default function AffiliateRegister() {
  const router = useRouter()
  const [step, setStep] = useState<'terms' | 'payment'>('terms')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authLoading, setAuthLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank'>('upi')
  const [formData, setFormData] = useState({
    upiId: '',
    accountNumber: '',
    ifscCode: '',
    termsAccepted: false
  })

  useEffect(() => {
    // Check if affiliate is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/affiliate/auth/check-session')
        const data = await response.json()

        if (!data.authenticated) {
          router.push('/affiliate/auth/login')
          return
        }
      } catch (error) {
        router.push('/affiliate/auth/login')
      } finally {
        setAuthLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleTermsAccept = async () => {
    if (!formData.termsAccepted) {
      setError('Please accept the terms and conditions')
      return
    }
    setStep('payment')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate form data
      if (paymentMethod === 'upi' && !formData.upiId) {
        throw new Error('Please enter your UPI ID')
      }
      if (paymentMethod === 'bank' && (!formData.accountNumber || !formData.ifscCode)) {
        throw new Error('Please enter both account number and IFSC code')
      }

      // Submit affiliate registration
      const response = await fetch('/api/affiliate/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentMethod,
          ...formData
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Redirect to affiliate dashboard
      router.push('/affiliate/dashboard')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className={`min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 ${inter.className}`}>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Shimmer height="h-8" width="w-32" />
          </div>
          <div className="mt-6 text-center">
            <Shimmer height="h-8" width="w-48" className="mx-auto" />
          </div>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl shadow-gray-100 sm:rounded-lg sm:px-10 border border-gray-100">
            <div className="space-y-6">
              <Shimmer height="h-4" width="w-full" />
              <Shimmer height="h-4" width="w-5/6" />
              <Shimmer height="h-10" width="w-full" rounded />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 ${inter.className}`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <span className="text-blue-600 font-bold text-2xl">eapcet<span className="text-gray-900">pro</span></span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {step === 'terms' ? 'Become an Affiliate' : 'Payment Details'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-100 sm:rounded-lg sm:px-10 border border-gray-100">
          {error && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 rounded-md mb-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === 'terms' ? (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-600 space-y-4">
                <h3 className="font-medium text-gray-900">Affiliate Terms & Conditions</h3>
                <p>1. Commission Structure:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>You will earn commission on each successful sale</li>
                  <li>Commissions are paid weekly for all verified sales</li>
                </ul>
                <p>2. Program Rules:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>No spamming or misleading marketing</li>
                  <li>No self-referrals or fraudulent activities</li>
                  <li>30-day cookie window for attributions</li>
                </ul>
              </div>

              <div className="flex items-center">
                <input
                  id="terms"
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                  I accept the terms and conditions
                </label>
              </div>

              <button
                onClick={handleTermsAccept}
                disabled={!formData.termsAccepted || loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Method
                </label>
                <div className="mt-2 space-y-4">
                  <div className="flex items-center">
                    <input
                      id="upi"
                      type="radio"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="upi" className="ml-2 block text-sm text-gray-900">
                      UPI ID (Recommended)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="bank"
                      type="radio"
                      checked={paymentMethod === 'bank'}
                      onChange={() => setPaymentMethod('bank')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="bank" className="ml-2 block text-sm text-gray-900">
                      Bank Account
                    </label>
                  </div>
                </div>
              </div>

              {paymentMethod === 'upi' ? (
                <div>
                  <label htmlFor="upiId" className="block text-sm font-medium text-gray-700">
                    UPI ID
                  </label>
                  <input
                    id="upiId"
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    placeholder="username@bank"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                      Account Number
                    </label>
                    <input
                      id="accountNumber"
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700">
                      IFSC Code
                    </label>
                    <input
                      id="ifscCode"
                      type="text"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
} 