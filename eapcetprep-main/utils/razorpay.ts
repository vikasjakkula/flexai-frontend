import crypto from 'crypto'
import Razorpay from 'razorpay'

import { getPlanByTier, getPlanPriceInPaise, PlanTier } from './pricing'

// Add type declarations
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      RAZORPAY_KEY_ID: string
      RAZORPAY_KEY_SECRET: string
      NEXT_PUBLIC_RAZORPAY_KEY_ID: string
      RAZORPAY_BASIC_PLAN_ID?: string
      RAZORPAY_WEBHOOK_SECRET?: string
    }
  }
}

// Initialize Razorpay only on the server side
let razorpay: Razorpay | null = null
if (typeof window === 'undefined') {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables')
  }

  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  })
}

export function getRazorpayInstance(): Razorpay {
  if (!razorpay) {
    throw new Error('Razorpay not initialized - server-side only')
  }
  return razorpay
}

// Get plan amount in paise. When spin wheel applied: ₹249 (24900 paise) for unlimited lifetime (PRO).
export function getPlanAmount(tier: PlanTier, spinWheelApplied = false): number {
  if (spinWheelApplied) return 24900
  return getPlanPriceInPaise(tier) || 39900
}

// Legacy function for backwards compatibility
export function getPlanAmountByDuration(planDuration: number): number {
  // Map old durations to new tiers
  if (planDuration === 4) return getPlanAmount('BASIC')
  // Default to PRO for all other cases
  return getPlanAmount('PRO')
}

interface OrderParams {
  amount: number
  receipt: string
  notes?: Record<string, string>
}

interface RazorpayOrder {
  id: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string
  status: string
  attempts: number
  notes: Record<string, string>
  created_at: number
}

export async function createOrder(params: OrderParams): Promise<RazorpayOrder> {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Missing Razorpay credentials')
    }

    const instance = getRazorpayInstance()
    const order = await instance.orders.create({
      amount: params.amount,
      currency: 'INR',
      receipt: params.receipt,
      notes: params.notes,
    })

    return order as RazorpayOrder
  } catch (error) {
    console.error('Razorpay order creation error:', error)
    throw new Error('Failed to create order')
  }
}

interface SubscriptionParams {
  planId: string
  totalCount: number
  notes?: Record<string, string>
  customerId?: string
  startAt?: number // Unix timestamp for trial period (future date)
}

interface RazorpaySubscriptionCreateRequestBody {
  plan_id: string
  total_count: number
  notes?: Record<string, string>
  customer_id?: string
  start_at?: number
}

interface RazorpaySubscription {
  id: string
  plan_id: string
  status: string
  current_start: number
  current_end: number
  ended_at: number | null
  quantity: number
  notes: Record<string, string>
  charge_at: number
  offer_id: string | null
  short_url: string
  has_scheduled_changes: boolean
  change_scheduled_at: number | null
  source: string
  payment_method: string
  customer_id: string
}

export async function createSubscription(params: SubscriptionParams): Promise<RazorpaySubscription> {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Missing Razorpay credentials')
    }

    const instance = getRazorpayInstance()

    const subscriptionData: RazorpaySubscriptionCreateRequestBody = {
      plan_id: params.planId,
      total_count: params.totalCount,
      notes: params.notes || {},
    }

    if (params.customerId) {
      subscriptionData.customer_id = params.customerId
    }

    // Set start_at for trial period (per Razorpay docs)
    // The time between subscription creation and start_at is the trial period
    if (params.startAt) {
      subscriptionData.start_at = params.startAt
    }

    const subscription = await instance.subscriptions.create(subscriptionData)

    return subscription as unknown as RazorpaySubscription
  } catch (error) {
    console.error('Razorpay subscription creation error:', error)
    throw new Error('Failed to create subscription')
  }
}

export function verifyPayment(orderId: string, paymentId: string, signature: string): boolean {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      throw new Error('Missing Razorpay secret key')
    }

    const text = `${orderId}|${paymentId}`
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Payment verification error:', error)
    return false
  }
}

export function verifySubscriptionPayment(subscriptionId: string, paymentId: string, signature: string): boolean {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      throw new Error('Missing Razorpay secret key')
    }

    const text = `${paymentId}|${subscriptionId}`
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Subscription payment verification error:', error)
    return false
  }
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!secret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured')
      return false
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Webhook signature verification error:', error)
    return false
  }
}

// Client-side configuration
export const RAZORPAY_CONFIG = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  currency: 'INR',
  name: 'eapcetpro',
  theme: {
    color: '#2563EB'
  }
}

export function getRazorpayConfig() {
  return {
    key: process.env.RAZORPAY_KEY_ID,
  }
}
