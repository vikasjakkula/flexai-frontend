import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAuth } from '@/utils/auth'
import { createOrder, getPlanAmount } from '@/utils/razorpay'
import { cookies } from 'next/headers'
import { getPlanByTier, type PlanTier } from '@/utils/pricing'

export async function POST(request: Request) {
  try {
    // Authenticate user - this will throw if not authenticated
    let userId: string
    try {
      userId = await requireAuth()
    } catch (error) {
      console.error('Authentication failed:', error)
      return NextResponse.json(
        { error: 'You must be signed in to make a payment. Please sign in and try again.' },
        { status: 401 }
      )
    }

    // Get tier and spin_wheel_applied from request body
    const body = await request.json().catch(() => ({}))
    const tier: PlanTier = (body.tier || 'PRO') as PlanTier
    const spinWheelApplied = !!body.spin_wheel_applied

    // Get plan details based on tier
    const plan = getPlanByTier(tier)
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan tier' }, { status: 400 })
    }

    // Get affiliate ID from cookie only (set when user visits /ref/[code])
    const cookieStore = await cookies()
    const affiliateId = cookieStore.get('affiliate_id')?.value || null

    if (affiliateId) {
      console.log('Affiliate ID found in cookie:', affiliateId)
    } else {
      console.log('No affiliate ID found - no attribution')
    }

    const supabase = createClient()

    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('phone, name')
      .eq('id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate amount: optional amount_rupees override (e.g. landing-b at ₹299), else spin offer ₹249, or selling price
    const overrideRupees = typeof body.amount_rupees === 'number' && body.amount_rupees > 0 ? Math.round(body.amount_rupees) : null
    const amount = overrideRupees != null ? overrideRupees * 100 : getPlanAmount(tier, spinWheelApplied)
    const amountInRupees = amount / 100

    // Create order with Razorpay
    const order = await createOrder({
      amount: amount,
      receipt: `order_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`,
      notes: {
        userId,
        planTier: tier
      }
    })

    // Store order details in database
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        razorpay_order_id: order.id,
        amount: amountInRupees,
        status: 'pending',
        affiliate_id: affiliateId,
        plan_duration: plan.duration, // Use plan duration (4 for BASIC, -1 for PRO)
        payment_type: 'one_time',
        plan_tier: tier
      })

    if (orderError) {
      console.error('Error storing order:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    console.log('Order created with affiliate:', {
      orderId: order.id,
      affiliateId: affiliateId || 'none'
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      planTier: tier,
      userDetails: {
        name: user.name,
        phone: user.phone
      }
    })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    )
  }
}
