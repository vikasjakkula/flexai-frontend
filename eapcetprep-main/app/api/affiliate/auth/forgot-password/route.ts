import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sendOTP } from '@/utils/otp'
import { getAffiliateUserByPhone } from '@/utils/affiliate-supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Check if affiliate user exists
    const affiliateUser = await getAffiliateUserByPhone(phone)
    if (!affiliateUser) {
      return NextResponse.json(
        { error: 'No affiliate account found with this phone number' },
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
    cookieStore.set('affiliate_reset_phone', phone, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    })

    return response
  } catch (error) {
    console.error('Affiliate forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process forgot password request' },
      { status: 500 }
    )
  }
}



