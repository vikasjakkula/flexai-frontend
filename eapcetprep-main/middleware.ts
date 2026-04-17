import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// CORS: allowed origins for API (e.g. Expo dev server, production app)
const CORS_ORIGINS = [
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  process.env.NEXT_PUBLIC_APP_ORIGIN
].filter(Boolean) as string[]

function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin') || ''
  const allowOrigin = CORS_ORIGINS.includes(origin) ? origin : CORS_ORIGINS[0] || '*'
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  }
}

// Add paths that don't require authentication
const publicPaths = [
  '/auth/login',
  '/auth/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-otp',
  '/onboarding',
  '/onboarding/summary',
  '/pricing',
  '/payment',
  '/payment/success',
  '/payment/failure',
  '/api/auth/onboarding',
  '/api/payments',
  '/api/auth/premium-check'
]

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // CORS for API routes (e.g. mobile app / Expo on localhost:8081)
  if (path.startsWith('/api')) {
    const corsHeaders = getCorsHeaders(request)
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: corsHeaders })
    }
    const response = NextResponse.next()
    Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value))
    return response
  }

  // Landing page A/B test (historical):
  // - Variant A: current landing at `/` rendered by `app/page.tsx`
  // - Variant B: paywall-style landing with scroll-to-reveal pricing at `/landing-b`
  //
  // We previously rewrote `/` to `/landing-b` for most users and stored a `landing_ab`
  // cookie, then passed the request through `handleAffiliateTracking`.
  //
  // This experiment is currently disabled so that `/` is always the classic landing page
  // and the new paywall-style experience lives on `/landing` (which renders landing-b).
  // If you want to re‑enable A/B testing in the future, restore the rewrite logic below
  // and make sure both variants still handle `?ref=` affiliate links via `handleAffiliateTracking`.
  if (path === '/' || path === '') {
    return handleAffiliateTracking(request)
  }

  // Check if the path is public (before any other checks)
  if (publicPaths.some(p => path.startsWith(p))) {
    // Handle affiliate tracking for public paths
    return handleAffiliateTracking(request)
  }

  // Check for static files and API routes that don't need auth
  if (
    path.startsWith('/_next') || // Static files
    path.startsWith('/favicon.ico')
  ) {
    return handleAffiliateTracking(request)
  }

  // Check if path requires authentication
  if (path.startsWith('/dashboard') || path.startsWith('/payment') || path.startsWith('/api/test/submit')) {
    const token = request.cookies.get('session')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    try {
      await jwtVerify(token, new TextEncoder().encode(JWT_SECRET))
      // Token is valid, continue with affiliate tracking and then allow access
      return handleAffiliateTracking(request)
    } catch (error) {
      // Token is invalid, redirect to login
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  // For all other paths, handle affiliate tracking and allow access
  return handleAffiliateTracking(request)
}

const AFFILIATE_RECORDED_VISITS_COOKIE = 'affiliate_recorded_visits'
const AFFILIATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

// SHA-256 hex hash for visitor fingerprint (Edge-compatible, matches record-visit API)
async function sha256Hex(str: string): Promise<string> {
  const data = new TextEncoder().encode(str)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Helper function to handle affiliate tracking (optional existing response for A/B rewrite)
async function handleAffiliateTracking(request: NextRequest, existingResponse?: NextResponse): Promise<NextResponse> {
  const baseResponse = existingResponse ?? NextResponse.next()
  try {
    // Get affiliate code from query parameter
    const { searchParams } = new URL(request.url)
    const affiliateCode = searchParams.get('ref')

    // If there's an affiliate code, process it
    if (affiliateCode) {
      // Create a new supabase client
      const supabase = createClient(request)

      // Check if affiliate code is valid
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id')
        .eq('affiliate_code', affiliateCode)
        .eq('status', 'active')
        .single()

      if (affiliate) {
        // Already recorded a visit for this affiliate in this browser? Skip DB write (same cookie as record-visit API)
        const recorded = (request.cookies.get(AFFILIATE_RECORDED_VISITS_COOKIE)?.value ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        const alreadyRecorded = recorded.includes(affiliate.id)

        if (!alreadyRecorded) {
          const forwardedFor = request.headers.get('x-forwarded-for')
          const visitorIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 
                            request.headers.get('x-real-ip') || 'unknown'
          const userAgent = request.headers.get('user-agent') || ''
          const visitorFingerprint = await sha256Hex(`${visitorIp}|${userAgent}`)

          const { error: visitError } = await supabase
            .from('affiliate_visits')
            .upsert(
              {
                affiliate_id: affiliate.id,
                visitor_ip: visitorIp,
                referrer: request.headers.get('referer') || null,
                user_agent: userAgent || null,
                utm_source: searchParams.get('utm_source') || null,
                utm_medium: searchParams.get('utm_medium') || null,
                utm_campaign: searchParams.get('utm_campaign') || null,
                visitor_fingerprint: visitorFingerprint,
              },
              { onConflict: 'affiliate_id,visitor_fingerprint', ignoreDuplicates: true }
            )

          if (visitError) {
            console.error('Error recording affiliate visit:', visitError)
          } else {
            console.log('Affiliate visit recorded:', { affiliateCode, affiliateId: affiliate.id, visitorIp })
          }
        }

        baseResponse.cookies.set('affiliate_code', affiliateCode, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: AFFILIATE_COOKIE_MAX_AGE,
          path: '/'
        })
        baseResponse.cookies.set('affiliate_id', affiliate.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: AFFILIATE_COOKIE_MAX_AGE,
          path: '/'
        })

        // Mark this affiliate as recorded for this browser so we don't hit DB on every refresh
        if (!alreadyRecorded) {
          const newRecorded = [...new Set([...recorded, affiliate.id])].join(',')
          baseResponse.cookies.set(AFFILIATE_RECORDED_VISITS_COOKIE, newRecorded, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: AFFILIATE_COOKIE_MAX_AGE,
            path: '/'
          })
        }

        return baseResponse
      }
    }
  } catch (error) {
    console.error('Error in affiliate tracking:', error)
    // Continue with normal flow even if affiliate tracking fails
  }

  return baseResponse
}

// Run middleware on all routes (including /api for CORS and rest for affiliate tracking)
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 