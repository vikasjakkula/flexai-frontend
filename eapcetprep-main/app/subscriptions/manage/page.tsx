'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Inter } from 'next/font/google'
import { createClient } from '@/utils/supabase/client'

const inter = Inter({ subsets: ['latin'] })

interface Subscription {
  id: string
  razorpay_subscription_id: string | null
  status: string
  plan_tier: string
  amount: number
  created_at: string
  razorpay_payment_id: string | null
}

export default function ManageSubscription() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        // Check authentication first using the same method as other pages
        const authResponse = await fetch('/api/auth/check-session')
        const authData = await authResponse.json()

        if (!authData.authenticated) {
          router.push('/auth/login')
          return
        }

        // Get user details to get user ID
        const userResponse = await fetch('/api/auth/user')
        if (!userResponse.ok) {
          throw new Error('Failed to get user details')
        }

        const userData = await userResponse.json()
        const userId = userData.id

        // Get user's active subscription (BASIC plan with subscription)
        const supabase = createClient()
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', userId)
          .eq('payment_type', 'subscription')
          .in('status', ['pending', 'trial_active', 'completed'])
          .order('created_at', { ascending: false })
          .limit(1)

        if (ordersError) {
          throw ordersError
        }

        if (orders && orders.length > 0) {
          setSubscription(orders[0] as Subscription)
        }
      } catch (err) {
        console.error('Error fetching subscription:', err)
        setError('Failed to load subscription details')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [router])

  const handleCancel = async () => {
    if (!subscription?.razorpay_subscription_id) {
      setError('Subscription ID not found')
      return
    }

    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features immediately if you are still in the trial period.')) {
      return
    }

    try {
      setCancelling(true)
      setError('')
      setSuccess('')

      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriptionId: subscription.razorpay_subscription_id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      setSuccess('Subscription cancelled successfully')
      
      // Refresh subscription data
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      console.error('Error cancelling subscription:', err)
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${inter.className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className={`min-h-screen bg-gray-50 ${inter.className}`}>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">Manage Subscription</h1>
            <p className="text-gray-900">You don't have an active subscription.</p>
            <button
              onClick={() => router.push('/onboarding/paywall')}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
            >
              View Plans
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isInTrial = subscription.status === 'trial_active'
  const isPaid = subscription.status === 'completed' && subscription.razorpay_payment_id

  return (
    <div className={`min-h-screen bg-gray-50 ${inter.className}`}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900">Manage Subscription</h1>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {success}
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Subscription Details</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-900 font-medium">Plan:</dt>
                  <dd className="font-semibold text-gray-900">{subscription.plan_tier}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-900 font-medium">Status:</dt>
                  <dd className="font-semibold capitalize">
                    {isInTrial ? (
                      <span className="text-green-600">Free Trial Active</span>
                    ) : isPaid ? (
                      <span className="text-blue-600">Active</span>
                    ) : (
                      <span className="text-gray-900">{subscription.status.replace('_', ' ')}</span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-900 font-medium">Amount:</dt>
                  <dd className="font-semibold text-gray-900">₹{subscription.amount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-900 font-medium">Started:</dt>
                  <dd className="font-semibold text-gray-900">
                    {new Date(subscription.created_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            {isInTrial && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Free Trial Active:</strong> You are currently on a 3-day free trial. 
                  If you cancel now, you will lose access to premium features immediately.
                </p>
              </div>
            )}

            {isPaid && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Active Subscription:</strong> You have already paid for this subscription. 
                  Cancelling will stop future charges, but you will retain access until your premium period expires.
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <button
                onClick={handleCancel}
                disabled={cancelling || subscription.status === 'cancelled'}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-md font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
