import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAffiliateAdmin } from '@/utils/affiliate-admin-auth'

export async function GET(request: NextRequest) {
  const authError = requireAffiliateAdmin(request)
  if (authError) return authError

  const supabase = createClient()
  const { data: sales, error } = await supabase
    .from('affiliate_sales')
    .select(`
      id,
      affiliate_id,
      user_id,
      order_id,
      amount,
      commission_amount,
      status,
      created_at,
      affiliates ( affiliate_code )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Affiliate admin sales error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sales: sales ?? [] })
}
