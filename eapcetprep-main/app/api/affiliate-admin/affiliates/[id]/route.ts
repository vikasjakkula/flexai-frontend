import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAffiliateAdmin } from '@/utils/affiliate-admin-auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAffiliateAdmin(request)
  if (authError) return authError

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'Affiliate ID required' }, { status: 400 })
  }

  const body = await request.json()
  const status = body?.status
  if (!status || !['pending', 'active', 'suspended'].includes(status)) {
    return NextResponse.json({ error: 'Valid status required (pending, active, suspended)' }, { status: 400 })
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('affiliates')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Affiliate admin update status error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ affiliate: data })
}
