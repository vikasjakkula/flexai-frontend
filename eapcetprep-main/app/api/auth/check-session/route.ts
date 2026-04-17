import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/utils/auth'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false })
    }

    // Verify the session token
    const userId = await verifySession(sessionToken)
    
    return NextResponse.json({
      authenticated: Boolean(userId)
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ authenticated: false })
  }
} 