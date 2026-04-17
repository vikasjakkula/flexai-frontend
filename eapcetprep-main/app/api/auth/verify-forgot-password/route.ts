import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyOTP } from '@/utils/otp'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { verificationId, code, phone } = body

    if (!verificationId || !code || !phone) {
      return NextResponse.json(
        { error: 'Verification ID, code, and phone are required' },
        { status: 400 }
      )
    }

    // Get stored phone from cookie
    const cookieStore = await cookies()
    const storedPhone = cookieStore.get('reset_phone')?.value

    if (!storedPhone || storedPhone !== phone) {
      return NextResponse.json(
        { error: 'Invalid password reset request' },
        { status: 400 }
      )
    }

    // Verify OTP
    const { success, error: otpError } = await verifyOTP(phone, verificationId, code)
    if (!success || otpError) {
      return NextResponse.json(
        { error: otpError || 'Invalid OTP' },
        { status: 400 }
      )
    }

    // Create response and set cookie in one go
    const response = NextResponse.json({ success: true })

    // Set cookie to indicate successful OTP verification
    cookieStore.set('reset_verified', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300 // 5 minutes
    })

    return response
  } catch (error) {
    console.error('Verify forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
} 