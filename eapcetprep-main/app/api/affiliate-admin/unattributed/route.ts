import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAffiliateAdmin } from '@/utils/affiliate-admin-auth'

export async function GET(request: NextRequest) {
  const authError = requireAffiliateAdmin(request)
  if (authError) return authError

  const supabase = createClient()

  const { data: completedOrders, error: ordersError } = await supabase
    .from('orders')
    .select('id, user_id, amount, status, created_at, razorpay_order_id')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  if (ordersError) {
    console.error('Affiliate admin unattributed orders error:', ordersError)
    return NextResponse.json({ error: ordersError.message }, { status: 500 })
  }

  const { data: attributedOrderIds } = await supabase
    .from('affiliate_sales')
    .select('order_id')
  const attributedSet = new Set((attributedOrderIds ?? []).map((r: { order_id: string }) => r.order_id))

  const unattributed = (completedOrders ?? []).filter(
    (o: { id: string }) => !attributedSet.has(o.id)
  )

  return NextResponse.json({ orders: unattributed })
}
