import { NextResponse } from 'next/server'
import { getAffiliateSessionToken, verifyAffiliateSession } from '@/utils/affiliate-auth'

export async function GET() {
  try {
    const token = await getAffiliateSessionToken()
    
    if (!token) {
      return NextResponse.json({ authenticated: false })
    }

    const affiliateUserId = await verifyAffiliateSession(token)
    
    if (!affiliateUserId) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({ authenticated: true, affiliateUserId })
  } catch (error) {
    return NextResponse.json({ authenticated: false })
  }
}
















