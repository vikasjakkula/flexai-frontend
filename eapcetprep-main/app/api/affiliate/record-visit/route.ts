import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'

const AFFILIATE_RECORDED_VISITS_COOKIE = 'affiliate_recorded_visits'
const COOKIE_MAX_AGE_DAYS = 30

function getVisitorFingerprint(request: Request): string {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const ua = request.headers.get('user-agent') || ''
  return createHash('sha256').update(`${ip}|${ua}`).digest('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { affiliate_code, user_id } = body

    if (!affiliate_code) {
      return NextResponse.json(
        { error: 'Affiliate code is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get affiliate ID from the code
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id')
      .eq('affiliate_code', affiliate_code)
      .single()

    if (affiliateError || !affiliate) {
      console.error('Invalid affiliate code:', affiliate_code)
      return NextResponse.json(
        { error: 'Invalid affiliate code' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const recorded = (cookieStore.get(AFFILIATE_RECORDED_VISITS_COOKIE)?.value ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (recorded.includes(affiliate.id)) {
      const response = NextResponse.json(
        { success: true, affiliate_id: affiliate.id },
        { status: 200 }
      )
      const expires = new Date(Date.now() + COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000)
      response.cookies.set('affiliate_id', affiliate.id, { expires, path: '/', secure: true, sameSite: 'lax' })
      return response
    }

    const visitorIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const referrer = request.headers.get('referer') || null
    const userAgent = request.headers.get('user-agent') || null
    const visitorFingerprint = getVisitorFingerprint(request)

    const { error: visitError } = await supabase.from('affiliate_visits').upsert(
      {
        affiliate_id: affiliate.id,
        user_id: user_id || null,
        visitor_ip: visitorIp,
        referrer,
        user_agent: userAgent,
        visitor_fingerprint: visitorFingerprint,
      },
      {
        onConflict: 'affiliate_id,visitor_fingerprint',
        ignoreDuplicates: true,
      }
    )

    if (visitError) {
      const isUniqueViolation = visitError.code === '23505'
      if (isUniqueViolation) {
        // Already counted for this visitor; treat as success
      } else {
        console.error('Error recording affiliate visit:', visitError)
        return NextResponse.json(
          { error: 'Failed to record visit' },
          { status: 500 }
        )
      }
    }

    const response = NextResponse.json({
      success: true,
      affiliate_id: affiliate.id,
    })

    const expires = new Date(Date.now() + COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000)
    response.cookies.set('affiliate_id', affiliate.id, {
      expires,
      path: '/',
      secure: true,
      sameSite: 'lax',
    })

    const newRecorded = [...new Set([...recorded, affiliate.id])].join(',')
    response.cookies.set(AFFILIATE_RECORDED_VISITS_COOKIE, newRecorded, {
      expires,
      path: '/',
      secure: true,
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    console.error('Error in record-visit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 