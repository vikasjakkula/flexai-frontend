import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyOTP } from '@/utils/otp'
import { createClient } from '@/utils/supabase/server'
import { createAffiliateSession, hashPassword } from '@/utils/affiliate-auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { verificationId, code, phone } = body

    if (!verificationId || !code || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify OTP
    const verifyResult = await verifyOTP(phone, verificationId, code)
    if (!verifyResult.success) {
      return NextResponse.json(
        { error: verifyResult.error },
        { status: 400 }
      )
    }

    // Get pending registration data from cookies
    const cookieStore = await cookies()
    const pendingRegistrationValue = cookieStore.get('pending_affiliate_registration')?.value
    
    if (!pendingRegistrationValue) {
      return NextResponse.json(
        { error: 'Registration session expired' },
        { status: 400 }
      )
    }

    // Parse user data from cookie
    const { phone: userPhone, password: userPassword } = JSON.parse(pendingRegistrationValue)
    
    // Hash password before storing
    const hashedPassword = await hashPassword(userPassword)
    
    // Create affiliate user
    const supabase = createClient()
    
    // Check if user already exists (in case of duplicate registration attempts)
    const { data: existingUser } = await supabase
      .from('affiliate_users')
      .select('id')
      .eq('phone', userPhone)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Affiliate account already exists with this phone number. Please login instead.' },
        { status: 400 }
      )
    }

    const { data: affiliateUser, error: userError } = await supabase
      .from('affiliate_users')
      .insert({
        phone: userPhone,
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
    return new NextResponse(
      JSON.stringify({ 
        success: true,
        redirectPath: '/affiliate/register' // Redirect to affiliate registration form
      }), 
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': [
            `affiliate_session=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}SameSite=Lax`,
            'pending_affiliate_registration=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax' // Clear the registration cookie
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
















