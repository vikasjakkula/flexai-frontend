import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { verifyWebhookSignature } from '@/utils/razorpay'
import { sendServerEvent } from '@/lib/facebook-conversions-api'

// Disable body parsing since we need raw body for signature verification
export const dynamic = 'force-dynamic'

interface WebhookPayload {
  event: string
  payload: {
    subscription?: {
      entity: {
        id: string
        plan_id: string
        status: string
        notes: Record<string, string>
        customer_id: string
        current_start: number
        current_end: number
      }
    }
    payment?: {
      entity: {
        id: string
        amount: number
        status: string
        subscription_id?: string
        order_id?: string
      }
    }
  }
}

export async function POST(request: Request) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      console.error('Missing webhook signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature)
    if (!isValid) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const payload: WebhookPayload = JSON.parse(rawBody)
    const { event } = payload

    console.log('Received Razorpay webhook:', event)

    const supabase = createClient()

    switch (event) {
      case 'subscription.activated': {
        // Trial started - grant BASIC access immediately
        const subscription = payload.payload.subscription?.entity
        if (!subscription) {
          console.error('Missing subscription entity in webhook')
          return NextResponse.json({ error: 'Missing subscription data' }, { status: 400 })
        }

        const userId = subscription.notes.userId
        if (!userId) {
          console.error('Missing userId in subscription notes')
          return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
        }

        console.log('Subscription activated (trial started):', {
          subscriptionId: subscription.id,
          userId,
          status: subscription.status
        })

        // Calculate premium_until (4 months from now for BASIC)
        const premiumUntil = new Date()
        premiumUntil.setMonth(premiumUntil.getMonth() + 4)

        // Update user to BASIC tier
        const { error: userError } = await supabase
          .from('users')
          .update({
            is_premium: true,
            premium_since: new Date().toISOString(),
            premium_until: premiumUntil.toISOString(),
            plan_tier: 'BASIC',
            razorpay_subscription_id: subscription.id
          })
          .eq('id', userId)

        if (userError) {
          console.error('Error updating user for subscription:', userError)
          return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
        }

        // Update order status
        await supabase
          .from('orders')
          .update({
            status: 'trial_active',
            updated_at: new Date().toISOString()
          })
          .eq('razorpay_subscription_id', subscription.id)

        // Verify user was upgraded; if not, retry once (handles transient DB/network issues)
        const { data: userAfter } = await supabase
          .from('users')
          .select('is_premium, plan_tier, premium_until')
          .eq('id', userId)
          .single()
        if (!userAfter?.is_premium || userAfter?.plan_tier !== 'BASIC') {
          console.warn('User not upgraded after subscription.activated, retrying:', userId)
          const { error: retryError } = await supabase
            .from('users')
            .update({
              is_premium: true,
              premium_since: new Date().toISOString(),
              premium_until: premiumUntil.toISOString(),
              plan_tier: 'BASIC',
              razorpay_subscription_id: subscription.id
            })
            .eq('id', userId)
          if (retryError) {
            console.error('Retry failed to upgrade user:', retryError)
            return NextResponse.json({ error: 'Failed to verify/update user' }, { status: 500 })
          }
          console.log('User upgraded on retry:', userId)
        }

        console.log('User granted BASIC access via trial:', userId)
        break
      }

      case 'subscription.charged': {
        // Payment received after trial - confirm BASIC subscription
        const subscription = payload.payload.subscription?.entity
        const payment = payload.payload.payment?.entity

        if (!subscription || !payment) {
          console.error('Missing subscription or payment entity in webhook')
          return NextResponse.json({ error: 'Missing data' }, { status: 400 })
        }

        const userId = subscription.notes.userId
        if (!userId) {
          console.error('Missing userId in subscription notes')
          return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
        }

        console.log('Subscription charged:', {
          subscriptionId: subscription.id,
          paymentId: payment.id,
          userId
        })

        // Update order status to completed
        const { data: order } = await supabase
          .from('orders')
          .update({
            status: 'completed',
            razorpay_payment_id: payment.id,
            updated_at: new Date().toISOString()
          })
          .eq('razorpay_subscription_id', subscription.id)
          .select('id, user_id, affiliate_id, amount')
          .single()

        if (order?.affiliate_id && order?.user_id) {
          // Calculate and create affiliate commission
          const commissionAmount = Math.floor((order.amount || 0) * 0.20)
          await supabase
            .from('affiliate_sales')
            .insert({
              affiliate_id: order.affiliate_id,
              user_id: order.user_id,
              order_id: order.id,
              amount: order.amount || 0,
              commission_amount: commissionAmount,
              status: 'pending'
            })
        }

        // Ensure user is upgraded (in case subscription.activated was missed or failed)
        const { data: userRow } = await supabase
          .from('users')
          .select('id, is_premium, premium_until, plan_tier')
          .eq('id', userId)
          .single()
        const now = new Date().toISOString()
        const needsUpgrade = !userRow?.is_premium || (userRow?.premium_until && userRow.premium_until < now)
        if (needsUpgrade && userRow?.id) {
          const premiumUntil = new Date()
          premiumUntil.setMonth(premiumUntil.getMonth() + 4)
          const { error: upgradeErr } = await supabase
            .from('users')
            .update({
              is_premium: true,
              premium_since: now,
              premium_until: premiumUntil.toISOString(),
              plan_tier: 'BASIC',
              razorpay_subscription_id: subscription.id
            })
            .eq('id', userId)
          if (upgradeErr) {
            console.error('Failed to ensure user upgraded on subscription.charged:', upgradeErr)
          } else {
            console.log('User upgraded on subscription.charged (was not premium):', userId)
          }
        }

        console.log('Subscription payment confirmed:', userId)
        break
      }

      case 'subscription.cancelled':
      case 'subscription.halted': {
        // Handle subscription cancellation
        const subscription = payload.payload.subscription?.entity

        if (!subscription) {
          console.error('Missing subscription entity in webhook')
          return NextResponse.json({ error: 'Missing subscription data' }, { status: 400 })
        }

        const userId = subscription.notes.userId

        console.log('Subscription cancelled/halted:', {
          subscriptionId: subscription.id,
          userId,
          status: subscription.status
        })

        // Check if order was in trial (trial_active status) or completed (payment received)
        const { data: order } = await supabase
          .from('orders')
          .select('status, razorpay_payment_id')
          .eq('razorpay_subscription_id', subscription.id)
          .single()

        // Update order status
        await supabase
          .from('orders')
          .update({
            status: event === 'subscription.cancelled' ? 'cancelled' : 'halted',
            updated_at: new Date().toISOString()
          })
          .eq('razorpay_subscription_id', subscription.id)

        // Always revoke premium access when subscription is cancelled
        // For trial: they didn't pay, so revoke immediately
        // For paid: user cancelled, so revoke access immediately
        console.log('[WEBHOOK] Revoking premium access for cancelled subscription:', {
          userId,
          subscriptionId: subscription.id,
          orderStatus: order?.status,
          isTrial: order?.status === 'trial_active' || !order?.razorpay_payment_id,
          hasPayment: !!order?.razorpay_payment_id
        })
        
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({
            is_premium: false,
            premium_until: null,
            plan_tier: 'FREE',
            razorpay_subscription_id: null
          })
          .eq('id', userId)

        if (userUpdateError) {
          console.error('[WEBHOOK] Error revoking premium access:', userUpdateError)
        } else {
          console.log('[WEBHOOK] Premium access revoked successfully:', {
            userId,
            wasTrial: order?.status === 'trial_active' || !order?.razorpay_payment_id,
            wasPaid: !!order?.razorpay_payment_id
          })
        }
        
        break
      }

      case 'payment.captured': {
        // One-time order: ensure user is upgraded (in case client never called /api/payments/verify)
        // Affiliate attribution happens HERE ONLY — not in handle_successful_payment RPC.
        const payment = payload.payload.payment?.entity
        if (!payment?.id || !payment?.order_id) {
          console.log('payment.captured missing payment id or order_id, skipping')
          break
        }
        if (payment.status !== 'captured') {
          console.log('payment.captured status not captured:', payment.status)
          break
        }
        // Subscription payments use subscription.charged; razorpay_order_id is for one-time orders
        const { data: order, error: orderErr } = await supabase
          .from('orders')
          .select('id, status, user_id, affiliate_id, amount')
          .eq('razorpay_order_id', payment.order_id)
          .maybeSingle()
        if (orderErr || !order) {
          console.log('payment.captured: no order found for razorpay order_id', payment.order_id, '(may be subscription)')
          break
        }
        if (!order.user_id) {
          console.error('payment.captured: order has no user_id', order.id)
          break
        }

        // Call handle_successful_payment only if not yet completed (i.e. verify didn't run first)
        if (order.status !== 'completed') {
          const { error: rpcError } = await supabase.rpc('handle_successful_payment', {
            p_order_id: order.id,
            p_payment_id: payment.id
          })
          if (rpcError) {
            console.error('payment.captured: handle_successful_payment failed', rpcError)
            return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
          }
        } else {
          console.log('payment.captured: order already completed (verify ran first), skipping RPC', order.id)
        }

        // Affiliate attribution — always runs here, never in the RPC.
        // Check no affiliate_sales record already exists for this order (idempotency).
        const { data: existingSale } = await supabase
          .from('affiliate_sales')
          .select('id')
          .eq('order_id', order.id)
          .maybeSingle()

        if (!existingSale) {
          // Resolve affiliate: prefer order's affiliate_id, fall back to most recent visit
          let affiliateId: string | null = order.affiliate_id ?? null
          if (!affiliateId) {
            const { data: visit } = await supabase
              .from('affiliate_visits')
              .select('affiliate_id')
              .eq('user_id', order.user_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
            affiliateId = visit?.affiliate_id ?? null
          }

          if (affiliateId) {
            const commissionAmount = Math.floor((order.amount ?? 0) * 30 / 100)

            const { error: saleErr } = await supabase
              .from('affiliate_sales')
              .insert({
                affiliate_id: affiliateId,
                user_id: order.user_id,
                order_id: order.id,
                amount: order.amount ?? 0,
                commission_amount: commissionAmount,
                status: 'pending',
              })

            if (saleErr) {
              console.error('payment.captured: failed to insert affiliate_sale', saleErr)
            } else {
              console.log('payment.captured: affiliate sale created', { orderId: order.id, affiliateId, commissionAmount })
            }
          } else {
            console.log('payment.captured: no affiliate found for order', order.id)
          }
        } else {
          console.log('payment.captured: affiliate_sale already exists for order', order.id)
        }

        // Facebook Conversions API: server-side Purchase for attribution
        const valueRupees = (payment.amount ?? 0) / 100
        const { data: userRow } = await supabase
          .from('users')
          .select('email')
          .eq('id', order.user_id)
          .single()
        await sendServerEvent({
          eventName: 'Purchase',
          eventSourceUrl: process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`
            : undefined,
          customData: {
            value: valueRupees,
            currency: 'INR',
            order_id: order.id,
            content_name: 'eapcetpro Premium',
          },
          userData: userRow?.email
            ? { em: userRow.email }
            : {},
        })

        console.log('payment.captured: processed', { orderId: order.id, userId: order.user_id })
        break
      }

      default:
        console.log('Unhandled webhook event:', event)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
