import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAuth } from '@/utils/auth'
import { validateRequired } from '@/lib/utils/validation'

export async function POST(request: Request) {
  try {
    // Authenticate user
    const userId = await requireAuth()

    const body = await request.json()
    const { category, subject, message } = body

    // Validate required fields
    try {
      validateRequired(body, ['category', 'message'])
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['technical_issue', 'test_issue', 'feature_request', 'general_support']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    // Validate message length
    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters' },
        { status: 400 }
      )
    }

    // Get user details (name and phone will be auto-filled from user account)
    const supabase = createClient()
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, phone')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate that user has name and phone
    if (!user.name || !user.phone) {
      return NextResponse.json(
        { error: 'Please complete your profile (name and phone) before submitting a support ticket' },
        { status: 400 }
      )
    }

    // Create support ticket with auto-filled user details
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        name: user.name.trim(),
        phone: user.phone.trim(),
        category: category,
        subject: subject?.trim() || null,
        message: message.trim(),
        status: 'open',
        priority: 'medium'
      })
      .select()
      .single()

    if (ticketError) {
      console.error('Error creating support ticket:', ticketError)
      return NextResponse.json(
        { error: 'Failed to create support ticket. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        status: ticket.status
      }
    })
  } catch (error) {
    console.error('Support ticket creation error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

