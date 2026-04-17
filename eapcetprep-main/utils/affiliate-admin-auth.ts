import { NextRequest, NextResponse } from 'next/server'

const AFFILIATE_ADMIN_COOKIE = 'affiliate_admin'

export function isAffiliateAdminAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get(AFFILIATE_ADMIN_COOKIE)?.value
  return cookie === 'authenticated'
}

export function requireAffiliateAdmin(request: NextRequest): NextResponse | null {
  if (!isAffiliateAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
