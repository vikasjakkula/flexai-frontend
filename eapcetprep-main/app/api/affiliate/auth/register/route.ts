import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { sendOTP } from '@/utils/otp'
import { createAffiliateSession, hashPassword } from '@/utils/affiliate-auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, password, skipOTP } = body

    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone number and password are required' }, { status: 400 })
    }

    // Validate phone number format (10 digits)
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit phone number' }, { status: 400 })
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
    }

    const supabase = createClient()

    // Check if affiliate user already exists
    const { data: existingUser } = await supabase
      .from('affiliate_users')
      .select('id')
      .eq('phone', phone)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'An affiliate account already exists with this phone number. Please login instead.' },
        { status: 400 }
      )
    }

    // If skipOTP is true, create account directly without OTP
    if (skipOTP) {
      // Hash password before storing
      const hashedPassword = await hashPassword(password)
      
      // Create affiliate user directly
      const { data: affiliateUser, error: userError } = await supabase
        .from('affiliate_users')
        .insert({
          phone,
          password: hashedPassword,
          name: null,
          email: null
        })
        .select()
        .single()

      if (userError || !affiliateUser) {
        console.error('Error creating affiliate user:', userError)
        return NextResponse.json(
          { error: `Failed to create affiliate account: ${userError?.message || 'Unknown error'}` },
          { status: 500 }
        )
      }

      // Create session
      const token = await createAffiliateSession(affiliateUser.id)

      // Create response and set cookies
      const skipOTPResponse = new NextResponse(
        JSON.stringify({ 
          success: true,
          redirectPath: '/affiliate/register' // Redirect to affiliate registration form
        }), 
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': [
              `affiliate_session=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}SameSite=Lax`
            ].join(', ')
          }
        }
      )

      return skipOTPResponse
    }

    // Normal flow: Send OTP
    const { verificationId, error: otpError, success } = await sendOTP(phone)
    if (otpError || !success) {
      return NextResponse.json(
        { 
          error: otpError || 'Failed to send OTP. Please check your phone number and try again.',
          details: 'OTP service unavailable or phone number invalid'
        }, 
        { status: 400 }
      )
    }

    // Create response with verification ID
    const response = NextResponse.json({ success: true, verificationId })

    // Set cookie for pending registration (phone and password)
    const cookieStore = await cookies()
    const cookieData = JSON.stringify({ phone, password })
    cookieStore.set('pending_affiliate_registration', cookieData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    })

    return response
  } catch (error) {
    console.error('Affiliate registration error:', error)
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}
















