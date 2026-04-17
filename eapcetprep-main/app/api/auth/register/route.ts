import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '../../../../utils/supabase/server'
import { hashPassword, createSession } from '@/utils/auth'
// OTP commented out — registration now creates the account directly
// import { sendOTP } from '@/utils/otp'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, password } = body

    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone number and password are required' }, { status: 400 })
    }

    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit phone number' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
    }

    const supabase = createClient()

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`phone.eq.${phone}`)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this phone number or email. Please login instead.' },
        { status: 400 }
      )
    }

    // --- Direct registration (OTP commented out) ---
    // Previously: sendOTP → pending_registration cookie → verify-otp → create user
    // Now:        hash password → insert user → create session → done

    const hashedPassword = await hashPassword(password)

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        phone,
        password: hashedPassword,
        name: null,
        email: null,
        is_premium: false,
        onboarding_completed: false
      })
      .select()
      .single()

    if (userError || !user) {
      console.error('Error creating user:', userError)
      return NextResponse.json(
        { error: `Failed to create user: ${userError?.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    // Handle affiliate attribution from cookies
    const cookieStore = await cookies()
    let affiliateIdToStore: string | null = null
    const affiliateIdFromCookie = cookieStore.get('affiliate_id')?.value
    const affiliateCode = cookieStore.get('affiliate_code')?.value

    if (affiliateIdFromCookie) {
      affiliateIdToStore = affiliateIdFromCookie
    } else if (affiliateCode) {
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id')
        .eq('affiliate_code', affiliateCode)
        .eq('status', 'active')
        .single()
      if (affiliate) affiliateIdToStore = affiliate.id
    }

    if (affiliateIdToStore) {
      await supabase
        .from('users')
        .update({ affiliate_id: affiliateIdToStore })
        .eq('id', user.id)

      await supabase
        .from('affiliate_visits')
        .update({ user_id: user.id })
        .eq('affiliate_id', affiliateIdToStore)
        .is('user_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
    }

    const token = await createSession(user.id)

    return new NextResponse(
      JSON.stringify({ success: true, redirectPath: '/onboarding' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `session=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}SameSite=Lax`
        }
      }
    )

    // --- Original OTP flow (commented out for reference) ---
    // const { verificationId, error: otpError, success } = await sendOTP(phone)
    // if (otpError || !success) {
    //   return NextResponse.json(
    //     { error: otpError || 'Failed to send OTP.', details: 'OTP service unavailable' },
    //     { status: 400 }
    //   )
    // }
    // const response = NextResponse.json({ success: true, verificationId })
    // const cookieData = JSON.stringify({ phone, password })
    // cookieStore.set('pending_registration', cookieData, {
    //   httpOnly: true, secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'lax', maxAge: 600
    // })
    // return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
} 