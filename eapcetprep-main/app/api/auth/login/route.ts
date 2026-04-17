import { NextResponse } from 'next/server'
import { comparePasswords, createSession, setSessionCookie } from '@/utils/auth'
import { getUserByPhone } from '@/utils/supabase'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

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

    // Get user by phone
    const user = await getUserByPhone(phone)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await comparePasswords(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create session token
    const token = await createSession(user.id)
    
    // Set session cookie
    await setSessionCookie(token)

    // Resolve affiliate from cookies (affiliate_id or affiliate_code) and persist to users table
    // so every future checkout and share-link payment attributes the sale to this affiliate
    const cookieStore = await cookies()
    const affiliateIdFromCookie = cookieStore.get('affiliate_id')?.value
    const affiliateCode = cookieStore.get('affiliate_code')?.value

    let affiliateIdToStore: string | null = null
    if (affiliateIdFromCookie) {
      affiliateIdToStore = affiliateIdFromCookie
    } else if (affiliateCode) {
      const supabase = createClient()
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id')
        .eq('affiliate_code', affiliateCode)
        .eq('status', 'active')
        .single()
      if (affiliate) affiliateIdToStore = affiliate.id
    }

    if (affiliateIdToStore) {
      const supabase = createClient()
      // Persist affiliate_id in users table so checkout and share-link always get this affiliate
      await supabase
        .from('users')
        .update({ affiliate_id: affiliateIdToStore })
        .eq('id', user.id)

      // Link the most recent visit for this affiliate (without user_id) to this user
      await supabase
        .from('affiliate_visits')
        .update({ user_id: user.id })
        .eq('affiliate_id', affiliateIdToStore)
        .is('user_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
    }

    // Return success response
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
} 