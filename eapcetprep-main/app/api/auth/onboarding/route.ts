import { NextResponse } from 'next/server'
import { requireAuth } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const userId = await requireAuth()
    const body = await request.json()

    const {
      name,
      email,
      year_of_study,
      target_year,
      target_rank,
      goal_college,
      goal_branch,
      exam_type,
      field,
      current_marks_range
    } = body

    // Validate required fields (only name and target_rank are required now)
    if (!name || !target_rank) {
      return NextResponse.json(
        { error: 'Name and target rank are required' },
        { status: 400 }
      )
    }

    // Validate email format only if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Please enter a valid email address' },
          { status: 400 }
        )
      }
    }

    const supabase = createClient()

    // Update user with onboarding data (only update provided fields)
    const updateData: any = {
      name,
      target_rank: parseInt(target_rank),
      onboarding_completed: true
    }
    
    // Only add optional fields if they are provided
    if (email) updateData.email = email
    if (year_of_study) updateData.year_of_study = year_of_study
    if (target_year) updateData.target_year = target_year
    if (goal_college) updateData.goal_college = goal_college
    if (goal_branch) updateData.goal_branch = goal_branch
    if (exam_type) updateData.exam_type = exam_type
    if (field) updateData.field = field
    if (current_marks_range) updateData.current_marks = current_marks_range
    
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json(
        { error: 'Failed to save onboarding data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding data saved successfully'
    })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save onboarding data' },
      { status: 500 }
    )
  }
}


