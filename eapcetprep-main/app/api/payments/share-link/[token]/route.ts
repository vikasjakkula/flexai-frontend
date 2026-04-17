import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getPlanByTier, type PlanTier } from '@/utils/pricing'

/**
 * GET /api/payments/share-link/[token]
 * Public: returns user display info and plan details for a share link.
 * No auth required - used by the pay-for page so someone else can pay for this user.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    if (!token) {
      return NextResponse.json({ error: 'Invalid link' }, { status: 400 })
    }

    const supabase = createClient()

    const { data: link, error: linkError } = await supabase
      .from('payment_share_links')
      .select('id, user_id, plan_tier, used_at, created_at, amount_rupees')
      .eq('token', token)
      .single()

    if (linkError || !link) {
      return NextResponse.json({ error: 'Link not found or expired' }, { status: 404 })
    }

    if (link.used_at) {
      return NextResponse.json({ error: 'This payment link has already been used' }, { status: 410 })
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, phone')
      .eq('id', link.user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const plan = getPlanByTier((link.plan_tier || 'BASIC') as PlanTier)
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const amount = link.amount_rupees != null && link.amount_rupees > 0
      ? Number(link.amount_rupees)
      : plan.displayPrice

    return NextResponse.json({
      user: {
        name: user.name || 'Student',
        phone: user.phone || '',
      },
      planTier: link.plan_tier,
      planLabel: plan.label,
      amount,
      currency: 'INR',
    })
  } catch (error) {
    console.error('Share link fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load link' },
      { status: 500 }
    )
  }
}
