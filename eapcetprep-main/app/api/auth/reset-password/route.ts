import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '../../../../utils/supabase/server'
import { hashPassword } from '@/utils/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, password } = body

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Phone number and new password are required' },
        { status: 400 }
      )
    }

    // Get cookies to verify the reset flow
    const cookieStore = await cookies()
    const storedPhone = cookieStore.get('reset_phone')?.value
    const isVerified = cookieStore.get('reset_verified')?.value === 'true'

    if (!storedPhone || storedPhone !== phone || !isVerified) {
      return NextResponse.json(
        { error: 'Invalid password reset request' },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password)

    // Update password in database
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('phone', phone)

    if (updateError) {
      throw updateError
    }

    // Create response and clear cookies in one go
    const response = NextResponse.json({ success: true })

    // Clear reset cookies
    cookieStore.delete('reset_phone')
    cookieStore.delete('reset_verified')

    return response
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
} 