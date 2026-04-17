import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '../../../../utils/supabase/server'
import { sendOTP } from '@/utils/otp'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Check if user exists
    const supabase = createClient()
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this phone number' },
        { status: 404 }
      )
    }

    // Send OTP
    const { verificationId, error: otpError } = await sendOTP(phone)
    if (otpError) {
      return NextResponse.json({ error: otpError }, { status: 400 })
    }

    // Create response with verification ID and set cookie in one go
    const response = NextResponse.json({ success: true, verificationId })

    // Set cookie for phone verification
    const cookieStore = await cookies()
    cookieStore.set('reset_phone', phone, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    })

    return response
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process forgot password request' },
      { status: 500 }
    )
  }
} 