import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAffiliateAdmin } from '@/utils/affiliate-admin-auth'

export async function POST(request: NextRequest) {
  const authError = requireAffiliateAdmin(request)
  if (authError) return authError

  const body = await request.json()
  const orderId = body?.orderId ?? body?.order_id
  const affiliateId = body?.affiliateId ?? body?.affiliate_id
  if (!orderId || !affiliateId) {
    return NextResponse.json(
      { error: 'orderId and affiliateId are required' },
      { status: 400 }
    )
  }

  const supabase = createClient()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, amount, status')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  if (order.status !== 'completed') {
    return NextResponse.json({ error: 'Order is not completed' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('affiliate_sales')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ error: 'Order is already attributed to an affiliate' }, { status: 400 })
  }

  const { data: affiliate, error: affError } = await supabase
    .from('affiliates')
    .select('id, commission_rate_first, commission_rate_second')
    .eq('id', affiliateId)
    .single()
  if (affError || !affiliate) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
  }

  const { count } = await supabase
    .from('affiliate_sales')
    .select('*', { count: 'exact', head: true })
    .eq('affiliate_id', affiliateId)
  const rateFirst = affiliate.commission_rate_first ?? 30
  const rateSecond = affiliate.commission_rate_second ?? 40
  const useFirst = (count ?? 0) < 10
  const rate = useFirst ? rateFirst : rateSecond
  const commissionAmount = Math.floor((order.amount ?? 0) * rate / 100)

  const { error: insertError } = await supabase.from('affiliate_sales').insert({
    affiliate_id: affiliateId,
    user_id: order.user_id,
    order_id: orderId,
    amount: order.amount ?? 0,
    commission_amount: commissionAmount,
    status: 'pending'
  })
  if (insertError) {
    console.error('Attribute sale insert error:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  await supabase
    .from('orders')
    .update({ affiliate_id: affiliateId })
    .eq('id', orderId)

  return NextResponse.json({ success: true, commission_amount: commissionAmount })
}
