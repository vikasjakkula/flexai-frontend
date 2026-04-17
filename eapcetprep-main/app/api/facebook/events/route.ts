import { NextResponse } from 'next/server'
import { sendServerEvent } from '@/lib/facebook-conversions-api'

export const dynamic = 'force-dynamic'

/**
 * POST /api/facebook/events
 * Receives client-side event and forwards to Facebook Conversions API (same event as pixel for deduplication).
 * Body: { event_name, event_id?, custom_data?, event_source_url? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { event_name, event_id, custom_data, event_source_url } = body as {
      event_name?: string
      event_id?: string
      custom_data?: Record<string, unknown>
      event_source_url?: string
    }

    if (!event_name || typeof event_name !== 'string') {
      return NextResponse.json({ error: 'event_name required' }, { status: 400 })
    }

    const forwarded = request.headers.get('x-forwarded-for')
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : undefined
    const userAgent = request.headers.get('user-agent') || undefined
    const fbp = request.headers.get('cookie')?.match(/_fbp=([^;]+)/)?.[1]
    const fbc = request.headers.get('cookie')?.match(/_fbc=([^;]+)/)?.[1]

    const result = await sendServerEvent({
      eventName: event_name,
      eventId: event_id,
      eventSourceUrl: event_source_url,
      customData: custom_data,
      userData: {
        clientIp,
        clientUserAgent: userAgent,
        fbp: fbp || undefined,
        fbc: fbc || undefined,
      },
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 502 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Facebook CAPI proxy error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Bad request' },
      { status: 400 }
    )
  }
}
