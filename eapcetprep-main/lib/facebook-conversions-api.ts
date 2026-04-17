/**
 * Facebook Conversions API (CAPI) – server-side event tracking.
 * Use alongside the Meta Pixel for better attribution and iOS/ITP resilience.
 *
 * Env: FACEBOOK_PIXEL_ID (or NEXT_PUBLIC_FACEBOOK_PIXEL_ID), FACEBOOK_CAPI_ACCESS_TOKEN
 * Generate token: Meta Events Manager > Data Sources > Your Pixel > Settings > Conversions API > Generate access token.
 */

import crypto from 'crypto'

const PIXEL_ID = process.env.FACEBOOK_PIXEL_ID || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
const ACCESS_TOKEN = process.env.FACEBOOK_CAPI_ACCESS_TOKEN
const CAPI_URL = PIXEL_ID ? `https://graph.facebook.com/v18.0/${PIXEL_ID}/events` : ''

export type CAPIEventName =
  | 'PageView'
  | 'ViewContent'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'TrialCompleted'

export interface SendEventOptions {
  eventName: CAPIEventName | string
  eventId?: string
  eventSourceUrl?: string
  customData?: Record<string, unknown>
  userData?: {
    clientIp?: string
    clientUserAgent?: string
    fbp?: string
    fbc?: string
    em?: string
    ph?: string
  }
}

function hashSha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

function buildUserData(opts: SendEventOptions): Record<string, string> {
  const u: Record<string, string> = {}
  const { userData } = opts
  if (userData?.clientIp) u.client_ip_address = userData.clientIp
  if (userData?.clientUserAgent) u.client_user_agent = userData.clientUserAgent
  if (userData?.fbp) u.fbp = userData.fbp
  if (userData?.fbc) u.fbc = userData.fbc
  if (userData?.em) u.em = hashSha256(userData.em)
  if (userData?.ph) u.ph = hashSha256(userData.ph.replace(/\D/g, ''))
  return u
}

/**
 * Send a single event to Facebook Conversions API. Call from API routes or server code only.
 */
export async function sendServerEvent(opts: SendEventOptions): Promise<{ success: boolean; error?: string }> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    return { success: false, error: 'Facebook CAPI not configured (missing pixel id or access token)' }
  }

  const userData = buildUserData(opts)
  if (!userData.client_ip_address) userData.client_ip_address = '0.0.0.0'
  if (!userData.client_user_agent) userData.client_user_agent = 'unknown'

  const payload = {
    data: [
      {
        event_name: opts.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: opts.eventId || undefined,
        event_source_url: opts.eventSourceUrl || undefined,
        action_source: 'website',
        user_data: userData,
        custom_data: opts.customData || undefined,
      },
    ],
    access_token: ACCESS_TOKEN,
  }

  try {
    const res = await fetch(CAPI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.error?.message || res.statusText }
    }
    if (data.events_received !== undefined && data.events_received < 1) {
      return { success: false, error: 'No events received by Meta' }
    }
    return { success: true }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return { success: false, error: err }
  }
}
