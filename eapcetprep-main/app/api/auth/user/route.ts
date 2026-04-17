import { NextResponse } from 'next/server'
import { requireAuth } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    // Verify user is authenticated
    const userId = await requireAuth()

    // Get user details from database including premium info
    const supabase = createClient()
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, phone, is_premium, premium_until, plan_tier, created_at, onboarding_completed, pwa_installed, exam_type, field')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get test count from analytics
    const { count: testCount } = await supabase
      .from('test_results')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    return NextResponse.json({
      ...user,
      tests_taken: testCount || 0
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to get user details' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await requireAuth()
    const body = await request.json()
    const { exam_type, field } = body

    const updateData: Record<string, string> = {}
    if (exam_type && ['TS EAPCET', 'AP EAPCET'].includes(exam_type)) {
      updateData.exam_type = exam_type
    }
    if (field && ['engineering', 'medical'].includes(field)) {
      updateData.field = field
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)

    if (error) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
} 