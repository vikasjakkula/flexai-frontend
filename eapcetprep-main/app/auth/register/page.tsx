'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function Register() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // OTP-related state (commented out — OTP flow disabled)
  // const [step, setStep] = useState<'details' | 'otp'>('details')
  // const [verificationId, setVerificationId] = useState('')
  // const [otp, setOtp] = useState('')
  // const [resendTimer, setResendTimer] = useState(0)
  // const [resendLoading, setResendLoading] = useState(false)

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
    setFormData({ ...formData, phone: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Redirect to stored path (e.g. /?checkout=1 from landing A/B variant B) or API response or onboarding
      const redirectPath = typeof window !== 'undefined' ? localStorage.getItem('redirectPath') : null
      if (redirectPath) {
        localStorage.removeItem('redirectPath')
        router.push(redirectPath)
      } else {
        router.push(data.redirectPath || '/onboarding')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // OTP handlers (commented out — OTP flow disabled)
  // const handleVerifyOTP = async (e: React.FormEvent) => { ... }
  // const handleResendOTP = async () => { ... }

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 ${inter.className}`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <span className="text-blue-600 font-bold text-2xl">eapcet<span className="text-gray-900">pro</span></span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-100 sm:rounded-lg sm:px-10 border border-gray-100">
          {error && (
            <div className="border px-4 py-3 rounded-md mb-4 font-medium text-sm bg-red-50 border-red-200 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-900">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handlePhoneChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                maxLength={10}
                placeholder="10-digit mobile number"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="Minimum 6 characters"
                minLength={6}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || formData.phone.length !== 10 || formData.password.length < 6}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          {/* OTP step (commented out — OTP flow disabled)
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-900">Enter OTP</label>
              <input id="otp" name="otp" type="text" required value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="..." placeholder="• • • •" maxLength={4} />
              <p className="mt-2 text-sm text-gray-500 text-center">We've sent a 4-digit OTP to your phone number</p>
              <div className="mt-3 text-center">
                {resendTimer > 0 ? <p>Resend OTP in {resendTimer}s</p> :
                  <button type="button" onClick={handleResendOTP}>Resend OTP</button>}
              </div>
            </div>
            <button type="submit" disabled={loading || otp.length !== 4}>Verify OTP</button>
          </form>
          */}
        </div>
      </div>
    </div>
  )
} 