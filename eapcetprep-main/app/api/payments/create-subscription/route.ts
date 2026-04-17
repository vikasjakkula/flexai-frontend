import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAuth } from '@/utils/auth'
import { createSubscription } from '@/utils/razorpay'
import { cookies } from 'next/headers'
import { getBasicPlan } from '@/utils/pricing'

export async function POST() {
  try {
    // Authenticate user
    const userId = await requireAuth()

    // Get BASIC plan details
    const basicPlan = getBasicPlan()

    // Verify Razorpay plan ID is configured
    const planId = process.env.RAZORPAY_BASIC_PLAN_ID
    if (!planId) {
      console.error('RAZORPAY_BASIC_PLAN_ID not configured')
      return NextResponse.json({ error: 'Subscription plan not configured' }, { status: 500 })
    }

    // Get affiliate code from cookie
    const cookieStore = await cookies()
    const affiliateCode = cookieStore.get('affiliate_code')?.value

    const supabase = createClient()

    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('phone, name, affiliate_id')
      .eq('id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get affiliate ID with priority: cookies first, then users table, then null
    let affiliateId: string | null = null
    
    // Priority 1: Check affiliate_id from cookie
    const affiliateIdFromCookie = cookieStore.get('affiliate_id')?.value
    if (affiliateIdFromCookie) {
      affiliateId = affiliateIdFromCookie
      console.log('Affiliate ID found in cookie:', affiliateId)
    } 
    // Priority 2: Check affiliate_code from cookie
    else if (affiliateCode) {
      console.log('Affiliate code found in cookie:', affiliateCode)
      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .select('id')
        .eq('affiliate_code', affiliateCode)
        .eq('status', 'active')
        .single()

      if (affiliateError) {
        console.error('Error fetching affiliate:', affiliateError)
      }

      if (affiliate) {
        affiliateId = affiliate.id
        console.log('Affiliate ID found from code:', affiliateId)
      } else {
        console.log('No active affiliate found for code:', affiliateCode)
      }
    }
    // Priority 3: Check users table
    if (!affiliateId && user.affiliate_id) {
      affiliateId = user.affiliate_id
      console.log('Affiliate ID found in users table:', affiliateId)
    }
    // Priority 4: If still not found, affiliateId remains null
    if (!affiliateId) {
      console.log('No affiliate ID found - using null')
    }

    // Create subscription with Razorpay
    // total_count: 1 means single payment after trial ends
    // Set start_at to 3 days from now for trial period (per Razorpay docs)
    // The time between now and start_at is the free trial period
    const trialDays = basicPlan.trialDays || 3
    const startAtDate = new Date()
    startAtDate.setDate(startAtDate.getDate() + trialDays)
    const startAt = Math.floor(startAtDate.getTime() / 1000) // Unix timestamp in seconds

    const subscription = await createSubscription({
      planId,
      totalCount: 1,
      startAt: startAt, // Trial period: time between now and start_at
      notes: {
        userId,
        affiliateCode: affiliateCode || '',
        planTier: 'BASIC'
      }
    })

    // Store order details in database
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        razorpay_order_id: subscription.id, // Store subscription ID
        razorpay_subscription_id: subscription.id,
        amount: basicPlan.price,
        status: 'pending',
        affiliate_id: affiliateId,
        plan_duration: basicPlan.duration,
        payment_type: 'subscription',
        plan_tier: 'BASIC'
      })

    if (orderError) {
      console.error('Error storing order:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url,
      amount: basicPlan.price * 100, // In paise
      currency: 'INR',
      planTier: 'BASIC',
      trialDays: basicPlan.trialDays,
      userDetails: {
        name: user.name,
        phone: user.phone
      }
    })

  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
