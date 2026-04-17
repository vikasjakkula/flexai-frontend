import { NextResponse } from 'next/server'
import { verifyPayment } from '@/utils/razorpay'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/payments/verify-share
 * Public: verifies Razorpay payment for an order created via share link.
 * No auth required - the payer is paying for someone else; we upgrade the order's user_id.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment details' },
        { status: 400 }
      )
    }

    const isValid = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, share_link_token, plan_tier')
      .eq('razorpay_order_id', razorpay_order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (!order.user_id) {
      return NextResponse.json(
        { error: 'Invalid order' },
        { status: 400 }
      )
    }

    const { error: transactionError } = await supabase.rpc('handle_successful_payment', {
      p_order_id: order.id,
      p_payment_id: razorpay_payment_id,
    })

    if (transactionError) {
      console.error('Verify-share payment processing error:', transactionError)
      return NextResponse.json(
        { error: 'Failed to process payment' },
        { status: 500 }
      )
    }

    if (order.share_link_token) {
      await supabase
        .from('payment_share_links')
        .update({ used_at: new Date().toISOString() })
        .eq('token', order.share_link_token)
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      planTier: order.plan_tier,
    })
  } catch (error) {
    console.error('Verify-share error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
