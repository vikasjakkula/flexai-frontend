/**
 * Facebook Pixel utilities for retargeting.
 * Fires both Meta Pixel (client) and Facebook Conversions API (server) when configured.
 * Set NEXT_PUBLIC_FACEBOOK_PIXEL_ID for pixel; FACEBOOK_CAPI_ACCESS_TOKEN for server-side.
 */

declare global {
  interface Window {
    fbq?: (
      action: 'track' | 'trackCustom' | 'init',
      eventName: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string }
    ) => void
  }
}

function randomEventId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

/** Send same event to server-side Conversions API (deduplication via event_id). */
function sendToConversionsAPI(
  eventName: string,
  eventId: string,
  customData?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return
  const url = window.location.href
  fetch('/api/facebook/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: eventName,
      event_id: eventId,
      custom_data: customData,
      event_source_url: url,
    }),
  }).catch(() => {})
}

export function trackFacebookEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return
  const eventId = randomEventId()
  const payload = params ?? {}
  if (window.fbq) {
    window.fbq('track', eventName, payload, { eventID: eventId })
  }
  sendToConversionsAPI(eventName, eventId, payload)
}

/** Fire when user opens checkout (Razorpay) but may not complete — for “opened checkout, did not purchase” retargeting */
export function trackInitiateCheckout(params?: {
  value?: number
  currency?: string
  content_name?: string
}): void {
  trackFacebookEvent('InitiateCheckout', {
    value: params?.value ?? 900,
    currency: params?.currency ?? 'INR',
    content_name: params?.content_name ?? 'eapcetpro Premium',
    ...params,
  })
}

/** Fire on successful payment — for “purchased” conversion */
export function trackPurchase(params?: {
  value?: number
  currency?: string
  order_id?: string
  content_name?: string
}): void {
  trackFacebookEvent('Purchase', {
    value: params?.value ?? 900,
    currency: params?.currency ?? 'INR',
    content_name: params?.content_name ?? 'eapcetpro Premium',
    ...params,
  })
}

/** Optional: custom event for paywall view (page view is already tracked by pixel) */
export function trackViewPaywall(): void {
  trackFacebookEvent('ViewContent', {
    content_name: 'Paywall',
    content_category: 'paywall',
  })
}

/**
 * Fire when user views the landing page. Use this in Meta Ads Manager to create
 * a Custom Audience for retargeting (e.g. "Landing page visitors" or
 * "Landing visitors who did not purchase").
 */
export function trackLandingView(params?: { page_name?: string }): void {
  trackFacebookEvent('ViewContent', {
    content_name: params?.page_name ?? 'Landing Page',
    content_category: 'landing',
  })
}

/**
 * Fire when user selects BASIC or PRO plan on landing/paywall.
 * Use in Meta to build audiences like "Selected PRO but did not purchase".
 */
export function trackSelectPlan(tier: 'BASIC' | 'PRO', params?: { value?: number }): void {
  trackFacebookEvent('ViewContent', {
    content_name: `eapcetpro ${tier}`,
    content_category: 'plan_selection',
    content_type: 'product',
    ...(params?.value != null && { value: params.value }),
  })
}

/**
 * Fire when a user completes a 15-min trial test.
 * Use as a Custom Event audience in Meta (e.g. "TrialCompleted" but not purchased).
 */
export function trackTrialCompleted(params?: {
  resultId?: string
  testId?: number
  totalMarks?: number
  normalizedMarks160?: number
}): void {
  if (typeof window === 'undefined') return
  const eventId = randomEventId()
  const payload = {
    content_name: '15-min Trial',
    content_category: 'trial_completed',
    ...params,
  }
  if (window.fbq) {
    window.fbq('trackCustom', 'TrialCompleted', payload, { eventID: eventId })
  }
  sendToConversionsAPI('TrialCompleted', eventId, payload)
}
