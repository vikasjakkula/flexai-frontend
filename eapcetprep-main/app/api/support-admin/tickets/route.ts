import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('support_tickets')
      .select(
        `
        id,
        created_at,
        name,
        phone,
        category,
        subject,
        message,
        status,
        priority
      `
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching support tickets:', error)
      return NextResponse.json(
        { error: 'Failed to fetch support tickets' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tickets: data ?? [] })
  } catch (error) {
    console.error('Support admin GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status } = body as { id?: string; status?: string }

    if (!id) {
      return NextResponse.json(
        { error: 'Ticket id is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('support_tickets')
      .update({
        status: status ?? 'closed'
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating support ticket:', error)
      return NextResponse.json(
        { error: 'Failed to update support ticket' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ticket: data })
  } catch (error) {
    console.error('Support admin PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

