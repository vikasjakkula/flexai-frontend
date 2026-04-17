import { NextResponse } from 'next/server'
import { comparePasswords, createAffiliateSession, setAffiliateSessionCookie } from '@/utils/affiliate-auth'
import { getAffiliateUserByPhone } from '@/utils/affiliate-supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, password } = body

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get affiliate user by phone
    const affiliateUser = await getAffiliateUserByPhone(phone)
    if (!affiliateUser) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await comparePasswords(password, affiliateUser.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create session token
    const token = await createAffiliateSession(affiliateUser.id)
    
    // Set session cookie
    await setAffiliateSessionCookie(token)

    // Return success response
    return NextResponse.json({ 
      success: true,
      redirectPath: '/affiliate/dashboard'
    })
  } catch (error) {
    console.error('Affiliate login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
















