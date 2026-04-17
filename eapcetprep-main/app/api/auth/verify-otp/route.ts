import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyOTP } from '@/utils/otp'
import { createClient } from '@/utils/supabase/server'
import { createSession } from '@/utils/auth'
import { hashPassword } from '@/utils/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { verificationId, code, otp, phone, redirectPath } = body
    const otpCode = code ?? otp

    if (!verificationId || !otpCode || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: verificationId, OTP (code/otp), and phone' },
        { status: 400 }
      )
    }

    // Verify OTP
    const verifyResult = await verifyOTP(phone, verificationId, otpCode)
    if (!verifyResult.success) {
      return NextResponse.json(
        { error: verifyResult.error },
        { status: 400 }
      )
    }

    // Get pending registration data from cookies
    const cookieStore = await cookies()
    const pendingRegistrationValue = cookieStore.get('pending_registration')?.value
    
    if (!pendingRegistrationValue) {
      return NextResponse.json(
        { error: 'Registration session expired' },
        { status: 400 }
      )
    }

    // Parse user data from cookie (only phone and password)
    const { phone: userPhone, password: userPassword } = JSON.parse(pendingRegistrationValue)
    
    // Hash password before storing
    const hashedPassword = await hashPassword(userPassword)
    
    // Create basic user with only phone and password (other fields will be filled in onboarding)
    const supabase = createClient()
    
    // Check if user already exists (in case of duplicate registration attempts)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', userPhone)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this phone number. Please login instead.' },
        { status: 400 }
      )
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        phone: userPhone,
        password: hashedPassword,
        name: null, // Will be updated in onboarding
        email: null, // Will be updated in onboarding
        is_premium: false,
        onboarding_completed: false
      })
      .select()
      .single()

    if (userError || !user) {
      console.error('Error creating user:', userError)
      console.error('User error details:', JSON.stringify(userError, null, 2))
      return NextResponse.json(
        { error: `Failed to create user: ${userError?.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    // Check for affiliate ID from cookies and store in users table
    // First check affiliate_id cookie (preferred), then affiliate_code cookie
    let affiliateIdToStore: string | null = null
    const affiliateIdFromCookie = cookieStore.get('affiliate_id')?.value
    const affiliateCode = cookieStore.get('affiliate_code')?.value

    if (affiliateIdFromCookie) {
      // Direct affiliate_id from cookie - use it directly
      affiliateIdToStore = affiliateIdFromCookie
    } else if (affiliateCode) {
      // Get affiliate ID from code
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id')
        .eq('affiliate_code', affiliateCode)
        .eq('status', 'active')
        .single()

      if (affiliate) {
        affiliateIdToStore = affiliate.id
      }
    }

    // Store affiliate_id in users table if found
    if (affiliateIdToStore) {
      await supabase
        .from('users')
        .update({ affiliate_id: affiliateIdToStore })
        .eq('id', user.id)
      
      console.log('Stored affiliate_id during signup:', affiliateIdToStore)
    }

    // Create session
    const token = await createSession(user.id)

    // Link affiliate visits to user_id if affiliate exists
    if (affiliateIdToStore) {
      // Update the most recent visit for this affiliate without a user_id
      await supabase
        .from('affiliate_visits')
        .update({ user_id: user.id })
        .eq('affiliate_id', affiliateIdToStore)
        .is('user_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
    }

    // Create response and set cookies in one go
    // Return token in body for mobile clients (React Native doesn't use cookies)
    return new NextResponse(
      JSON.stringify({
        success: true,
        token,
        redirectPath: '/onboarding',
      }), 
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': [
            `session=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}SameSite=Lax`,
            'pending_registration=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax' // Clear the registration cookie
          ].join(', ')
        }
      }
    )
  } catch (error) {
    console.error('OTP verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
} 