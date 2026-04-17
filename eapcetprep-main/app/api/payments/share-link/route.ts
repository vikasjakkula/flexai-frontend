import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAuth } from '@/utils/auth'
import { getPlanByTier, type PlanTier } from '@/utils/pricing'
import { randomBytes } from 'crypto'

/**
 * POST /api/payments/share-link
 * Creates a shareable payment link for the authenticated user (BASIC or PRO plan).
 * Someone else can open the link, see user details, and pay to upgrade this user.
 */
export async function POST(request: Request) {
  try {
    const userId = await requireAuth()

    const body = await request.json().catch(() => ({}))
    const tier: PlanTier = (body.tier || 'BASIC') as PlanTier
    const amountRupees = typeof body.amount_rupees === 'number' && body.amount_rupees > 0
      ? Math.round(body.amount_rupees)
      : null

    if (tier !== 'BASIC' && tier !== 'PRO') {
      return NextResponse.json(
        { error: 'Share link is only available for BASIC or PRO plan' },
        { status: 400 }
      )
    }

    const plan = getPlanByTier(tier)
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const supabase = createClient()

    const token = randomBytes(24).toString('base64url')

    const insertRow: Record<string, unknown> = {
      token,
      user_id: userId,
      plan_tier: tier,
    }
    if (amountRupees != null) insertRow.amount_rupees = amountRupees

    const { error } = await supabase.from('payment_share_links').insert(insertRow)

    if (error) {
      console.error('Error creating share link:', error)
      return NextResponse.json(
        { error: 'Failed to create share link' },
        { status: 500 }
      )
    }

    const origin = request.headers.get('origin') || request.headers.get('x-forwarded-host') || ''
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const baseUrl = origin ? `${origin}` : `${protocol}://${request.headers.get('host') || ''}`
    const url = `${baseUrl}/pay-for/${token}`

    return NextResponse.json({ url, token })
  } catch (err) {
    if ((err as { status?: number })?.status === 401) {
      return NextResponse.json(
        { error: 'You must be signed in to create a share link' },
        { status: 401 }
      )
    }
    console.error('Share link error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create share link' },
      { status: 500 }
    )
  }
}
