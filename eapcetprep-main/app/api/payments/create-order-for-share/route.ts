import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createOrder, getPlanAmount } from '@/utils/razorpay'
import { getPlanByTier, type PlanTier } from '@/utils/pricing'

function getAmountPaiseFromLink(link: { amount_rupees?: number | null; plan_tier?: string | null }): number {
  const rupees = link.amount_rupees != null && link.amount_rupees > 0
    ? Number(link.amount_rupees)
    : null
  if (rupees != null) return Math.round(rupees * 100)
  const tier = (link.plan_tier || 'PRO') as PlanTier
  return getPlanAmount(tier)
}

/**
 * POST /api/payments/create-order-for-share
 * Public: creates an order for the user associated with a share link (token).
 * No auth required - used when someone else pays via the share link.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const token = body.token as string | undefined

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing payment link' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data: link, error: linkError } = await supabase
      .from('payment_share_links')
      .select('id, user_id, plan_tier, used_at, amount_rupees')
      .eq('token', token)
      .single()

    if (linkError || !link) {
      return NextResponse.json(
        { error: 'Payment link not found or expired' },
        { status: 404 }
      )
    }

    if (link.used_at) {
      return NextResponse.json(
        { error: 'This payment link has already been used' },
        { status: 410 }
      )
    }

    const tier = (link.plan_tier || 'BASIC') as PlanTier
    const plan = getPlanByTier(tier)
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const userId = link.user_id

    const { data: userRow } = await supabase
      .from('users')
      .select('phone, name, affiliate_id')
      .eq('id', userId)
      .single()

    if (!userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Resolve affiliate for the student (link owner): use users.affiliate_id, then fallback to most recent affiliate_visits
    let affiliateId: string | null = userRow.affiliate_id ?? null
    if (!affiliateId) {
      const { data: visit } = await supabase
        .from('affiliate_visits')
        .select('affiliate_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (visit?.affiliate_id) affiliateId = visit.affiliate_id
    }
    if (affiliateId) {
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id')
        .eq('id', affiliateId)
        .eq('status', 'active')
        .single()
      if (!affiliate) affiliateId = null
    }

    const amount = getAmountPaiseFromLink(link)
    const amountInRupees = amount / 100

    const razorpayOrder = await createOrder({
      amount,
      receipt: `share_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`,
      notes: {
        userId,
        planTier: tier,
        shareToken: token,
      },
    })

    const orderInsert: Record<string, unknown> = {
      user_id: userId,
      razorpay_order_id: razorpayOrder.id,
      amount: amountInRupees,
      status: 'pending',
      affiliate_id: affiliateId,
      plan_duration: plan.duration,
      payment_type: 'one_time',
      plan_tier: tier,
      share_link_token: token,
    }

    const { error: orderError } = await supabase.from('orders').insert(orderInsert)

    if (orderError) {
      console.error('Error storing order for share:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency || 'INR',
      receipt: razorpayOrder.receipt,
      planTier: tier,
      userDetails: {
        name: userRow.name,
        phone: userRow.phone,
      },
    })
  } catch (error) {
    console.error('Create order for share error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    )
  }
}
