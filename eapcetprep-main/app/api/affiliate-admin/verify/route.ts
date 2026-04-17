import { NextRequest, NextResponse } from 'next/server'
import { isAffiliateAdminAuthenticated } from '@/utils/affiliate-admin-auth'

export async function GET(request: NextRequest) {
  if (!isAffiliateAdminAuthenticated(request)) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  return NextResponse.json({ authenticated: true })
}
