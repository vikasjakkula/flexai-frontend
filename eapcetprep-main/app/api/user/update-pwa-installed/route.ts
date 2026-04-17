import { NextResponse } from 'next/server'
import { requireAuth } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const userId = await requireAuth()
    const body = await request.json()
    const { pwa_installed } = body

    if (typeof pwa_installed !== 'boolean') {
      return NextResponse.json(
        { error: 'pwa_installed must be a boolean' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // First check if column exists, if not add it
    const { error: updateError } = await supabase
      .from('users')
      .update({ pwa_installed })
      .eq('id', userId)

    if (updateError) {
      // If column doesn't exist, try to add it first
      if (updateError.code === '42703') {
        // Column doesn't exist, we'll need to add it via migration
        // For now, return success but log the error
        console.error('pwa_installed column does not exist. Please run migration to add it.')
        return NextResponse.json(
          { error: 'Database schema needs update. Please contact support.' },
          { status: 500 }
        )
      }
      
      console.error('Error updating PWA installation status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update PWA installation status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      pwa_installed
    })
  } catch (error) {
    console.error('Update PWA installed error:', error)
    return NextResponse.json(
      { error: 'Failed to update PWA installation status' },
      { status: 500 }
    )
  }
}








