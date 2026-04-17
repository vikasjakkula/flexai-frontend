import { NextRequest, NextResponse } from 'next/server'

const AFFILIATE_ADMIN_COOKIE = 'affiliate_admin'
const COOKIE_MAX_AGE = 60 * 60 * 24 // 24 hours

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const password = typeof body?.password === 'string' ? body.password.trim() : ''
    const expected = process.env.AFFILIATE_ADMIN_PASSWORD ?? 'hello'
    if (password !== expected) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }
    const res = NextResponse.json({ success: true })
    res.cookies.set(AFFILIATE_ADMIN_COOKIE, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
