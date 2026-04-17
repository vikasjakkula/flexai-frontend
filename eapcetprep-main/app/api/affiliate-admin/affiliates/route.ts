import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAffiliateAdmin } from '@/utils/affiliate-admin-auth'

export async function GET(request: NextRequest) {
  const authError = requireAffiliateAdmin(request)
  if (authError) return authError

  const supabase = createClient()

  const { data: affiliates, error: affError } = await supabase
    .from('affiliates')
    .select(`
      id,
      affiliate_code,
      coupon_code,
      payment_method,
      payment_details,
      status,
      commission_rate_first,
      commission_rate_second,
      created_at,
      affiliate_user_id,
      affiliate_users ( id, name, phone, email )
    `)
    .order('created_at', { ascending: false })

  if (affError) {
    console.error('Affiliate admin affiliates error:', affError)
    return NextResponse.json({ error: affError.message }, { status: 500 })
  }

  const { data: sales } = await supabase
    .from('affiliate_sales')
    .select('affiliate_id, commission_amount, status')

  const byAffiliate = (sales ?? []).reduce(
    (acc: Record<string, { pending: number; paid: number }>, row: { affiliate_id: string; commission_amount: number; status: string }) => {
      const id = row.affiliate_id
      if (!acc[id]) acc[id] = { pending: 0, paid: 0 }
      if (row.status === 'pending') acc[id].pending += row.commission_amount ?? 0
      else acc[id].paid += row.commission_amount ?? 0
      return acc
    },
    {}
  )

  const list = (affiliates ?? []).map((a: any) => ({
    ...a,
    pending_amount: byAffiliate[a.id]?.pending ?? 0,
    paid_amount: byAffiliate[a.id]?.paid ?? 0
  }))

  return NextResponse.json({ affiliates: list })
}
