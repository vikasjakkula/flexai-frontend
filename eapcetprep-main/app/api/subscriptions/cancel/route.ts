import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAuth } from '@/utils/auth'
import { getRazorpayInstance } from '@/utils/razorpay'

export async function POST(request: Request) {
  try {
    const userId = await requireAuth()

    const body = await request.json()
    const { subscriptionId } = body

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Verify the subscription belongs to this user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('razorpay_subscription_id, status, razorpay_payment_id')
      .eq('razorpay_subscription_id', subscriptionId)
      .eq('user_id', userId)
      .single()

    console.log('[CANCEL] Order lookup:', {
      subscriptionId,
      userId,
      orderFound: !!order,
      orderStatus: order?.status,
      hasPaymentId: !!order?.razorpay_payment_id,
      error: orderError?.message
    })

    if (orderError || !order) {
      console.error('[CANCEL] Order not found:', orderError)
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Check if subscription is already cancelled
    if (order.status === 'cancelled' || order.status === 'halted') {
      console.log('[CANCEL] Subscription already cancelled:', order.status)
      return NextResponse.json({ error: 'Subscription is already cancelled' }, { status: 400 })
    }

    try {
      console.log('[CANCEL] Starting cancellation process:', {
        subscriptionId,
        userId,
        orderStatus: order.status,
        isTrial: order.status === 'trial_active',
        hasPayment: !!order.razorpay_payment_id
      })

      // Cancel subscription in Razorpay
      const razorpay = getRazorpayInstance()
      await razorpay.subscriptions.cancel(subscriptionId, false) // false = cancel immediately, not at cycle end
      console.log('[CANCEL] Razorpay subscription cancelled successfully')

      // Update order status immediately
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('razorpay_subscription_id', subscriptionId)

      if (orderUpdateError) {
        console.error('[CANCEL] Error updating order status:', orderUpdateError)
      } else {
        console.log('[CANCEL] Order status updated to cancelled')
      }

      // Always revoke premium access when subscription is cancelled
      // For trial: they didn't pay, so revoke immediately
      // For paid: user cancelled, so revoke access immediately (refund handled separately if needed)
      console.log('[CANCEL] Revoking premium access immediately for cancelled subscription:', {
        userId,
        orderStatus: order.status,
        isTrial: order.status === 'trial_active' || !order.razorpay_payment_id,
        hasPayment: !!order.razorpay_payment_id
      })
      
      const { error: userUpdateError, data: userUpdateData } = await supabase
        .from('users')
        .update({
          is_premium: false,
          premium_until: null,
          plan_tier: 'FREE',
          razorpay_subscription_id: null
        })
        .eq('id', userId)
        .select('id, plan_tier, is_premium, premium_until')

      if (userUpdateError) {
        console.error('[CANCEL] Error revoking premium access:', userUpdateError)
      } else {
        console.log('[CANCEL] Premium access revoked successfully:', {
          userId,
          updatedUser: userUpdateData?.[0],
          wasTrial: order.status === 'trial_active' || !order.razorpay_payment_id,
          wasPaid: !!order.razorpay_payment_id
        })
      }

      // Note: Webhook will also handle this, but we do it immediately for better UX

      console.log('[CANCEL] Cancellation completed successfully')
      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled successfully'
      })
    } catch (razorpayError: any) {
      console.error('[CANCEL] Razorpay cancellation error:', {
        error: razorpayError.message,
        statusCode: razorpayError.statusCode,
        description: razorpayError.error?.description,
        subscriptionId,
        userId
      })
      
      // If subscription is already cancelled in Razorpay, handle locally
      if (razorpayError.statusCode === 400 || razorpayError.error?.description?.includes('already cancelled')) {
        console.log('[CANCEL] Subscription already cancelled in Razorpay - handling locally')
        
        // Update order status locally
        const { error: orderUpdateError } = await supabase
          .from('orders')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('razorpay_subscription_id', subscriptionId)

        if (orderUpdateError) {
          console.error('[CANCEL] Error updating order status (already cancelled):', orderUpdateError)
        } else {
          console.log('[CANCEL] Order status updated to cancelled (already cancelled in Razorpay)')
        }

        // Always revoke access when subscription is cancelled (even if already cancelled in Razorpay)
        console.log('[CANCEL] Revoking premium access for already-cancelled subscription:', {
          userId,
          orderStatus: order.status,
          isTrial: order.status === 'trial_active' || !order.razorpay_payment_id
        })
        
        const { error: userUpdateError, data: userUpdateData } = await supabase
          .from('users')
          .update({
            is_premium: false,
            premium_until: null,
            plan_tier: 'FREE',
            razorpay_subscription_id: null
          })
          .eq('id', userId)
          .select('id, plan_tier, is_premium, premium_until')

        if (userUpdateError) {
          console.error('[CANCEL] Error revoking premium access (already cancelled):', userUpdateError)
        } else {
          console.log('[CANCEL] Premium access revoked (already cancelled):', {
            userId,
            updatedUser: userUpdateData?.[0]
          })
        }

        return NextResponse.json({
          success: true,
          message: 'Subscription was already cancelled'
        })
      }

      throw razorpayError
    }
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
