import { NextResponse } from 'next/server'
import { requireAuth } from '@/utils/auth'
import { verifyPayment, verifySubscriptionPayment } from '@/utils/razorpay'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const userId = await requireAuth()

    const body = await request.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id
    } = body

    console.log('Verifying payment:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      subscriptionId: razorpay_subscription_id,
      signature: razorpay_signature?.slice(0, 10) + '...'
    })

    // Determine payment type
    const isSubscription = !!razorpay_subscription_id

    if (!razorpay_payment_id || !razorpay_signature) {
      console.error('Missing payment details:', { body })
      return NextResponse.json(
        { error: 'Missing payment details' },
        { status: 400 }
      )
    }

    // For regular payments, need order_id; for subscriptions, need subscription_id
    if (!isSubscription && !razorpay_order_id) {
      return NextResponse.json(
        { error: 'Missing order ID' },
        { status: 400 }
      )
    }

    // Verify payment signature
    let isValid: boolean
    if (isSubscription) {
      isValid = verifySubscriptionPayment(razorpay_subscription_id, razorpay_payment_id, razorpay_signature)
    } else {
      isValid = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    }

    if (!isValid) {
      console.error('Invalid payment signature')
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get order details (query by subscription_id for subscriptions, order_id for regular)
    let orderQuery = supabase
      .from('orders')
      .select('id, user_id, amount, affiliate_id, plan_tier, payment_type')

    if (isSubscription) {
      orderQuery = orderQuery.eq('razorpay_subscription_id', razorpay_subscription_id)
    } else {
      orderQuery = orderQuery.eq('razorpay_order_id', razorpay_order_id)
    }

    const { data: order, error: orderError } = await orderQuery.single()

    if (orderError) {
      console.error('Error fetching order:', orderError)
      return NextResponse.json(
        { error: 'Failed to fetch order details' },
        { status: 500 }
      )
    }

    if (!order) {
      console.error('Order not found:', razorpay_order_id || razorpay_subscription_id)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Validate that order has a user_id (required for payment processing)
    if (!order.user_id) {
      console.error('Order has no user_id - user must be authenticated:', {
        orderId: order.id,
        razorpayOrderId: razorpay_order_id || razorpay_subscription_id
      })
      return NextResponse.json(
        { error: 'Order is missing user information. Please sign in and try again.' },
        { status: 400 }
      )
    }

    // Verify order belongs to authenticated user
    if (order.user_id !== userId) {
      console.error('Order user mismatch:', {
        orderId: order.id,
        orderUserId: order.user_id,
        authenticatedUserId: userId
      })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get affiliate ID from order (preferred) or cookie (fallback)
    const cookieStore = await cookies()
    const affiliateIdFromCookie = cookieStore.get('affiliate_id')?.value
    let affiliateIdFromOrder = order.affiliate_id

    // CRITICAL: If order was created without affiliate_id (e.g. cookies not sent on create-order)
    // but we have affiliate_id in cookie at verify time, backfill the order so we don't lose attribution.
    if (!affiliateIdFromOrder && affiliateIdFromCookie) {
      const { error: updateErr } = await supabase
        .from('orders')
        .update({ affiliate_id: affiliateIdFromCookie, updated_at: new Date().toISOString() })
        .eq('id', order.id)
      if (updateErr) {
        console.error('Failed to backfill affiliate_id on order:', updateErr)
      } else {
        affiliateIdFromOrder = affiliateIdFromCookie
        console.log('Backfilled order affiliate_id from cookie:', order.id)
      }
    }

    const affiliateId = affiliateIdFromOrder || affiliateIdFromCookie

    console.log('Processing payment for order:', {
      orderId: order.id,
      amount: order.amount,
      planTier: order.plan_tier,
      paymentType: order.payment_type,
      affiliateId: affiliateId || 'none'
    })

    // Process payment using stored procedure
    const { error: transactionError } = await supabase.rpc('handle_successful_payment', {
      p_order_id: order.id,
      p_payment_id: razorpay_payment_id
    })

    if (transactionError) {
      console.error('Error processing payment:', transactionError)
      return NextResponse.json(
        { error: 'Failed to process payment' },
        { status: 500 }
      )
    }

    // Create response with success message
    const response = NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      planTier: order.plan_tier
    })

    // Clear affiliate cookies
    response.cookies.delete('affiliate_id')

    console.log('Payment processed successfully:', {
      orderId: order.id,
      paymentId: razorpay_payment_id,
      planTier: order.plan_tier,
      affiliateId: affiliateId || 'none'
    })

    return response
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
