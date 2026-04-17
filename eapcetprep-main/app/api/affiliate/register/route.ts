import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAffiliateAuth } from '@/utils/affiliate-auth'
import { getAffiliateUserById } from '@/utils/affiliate-supabase'
import { nanoid } from 'nanoid'

export async function POST(request: Request) {
  try {
    // Authenticate affiliate user
    const affiliateUserId = await requireAffiliateAuth()
    
    // Get request body
    const body = await request.json()
    const { paymentMethod, upiId, accountNumber, ifscCode } = body

    // Validate payment details
    if (paymentMethod === 'upi' && !upiId) {
      return NextResponse.json({ error: 'UPI ID is required' }, { status: 400 })
    }
    if (paymentMethod === 'bank' && (!accountNumber || !ifscCode)) {
      return NextResponse.json({ error: 'Account number and IFSC code are required' }, { status: 400 })
    }

    const supabase = createClient()

    // Check if affiliate is already registered
    const { data: existingAffiliate } = await supabase
      .from('affiliates')
      .select('id')
      .eq('affiliate_user_id', affiliateUserId)
      .single()

    if (existingAffiliate) {
      return NextResponse.json({ error: 'You are already registered as an affiliate' }, { status: 400 })
    }

    // Generate unique affiliate code
    const affiliateCode = nanoid(8)

    // Prepare payment details based on payment method
    const paymentDetails = paymentMethod === 'upi'
      ? { upi_id: upiId }
      : { account_number: accountNumber, ifsc_code: ifscCode }

    // Insert affiliate record
    const { data: affiliate, error } = await supabase
      .from('affiliates')
      .insert({
        affiliate_user_id: affiliateUserId,
        affiliate_code: affiliateCode,
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        status: 'active',
        terms_accepted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating affiliate:', error)
      return NextResponse.json({ error: 'Failed to create affiliate account' }, { status: 500 })
    }

    // Automatically create a user account with premium enabled for the affiliate
    try {
      // Get affiliate user details
      const affiliateUser = await getAffiliateUserById(affiliateUserId)
      if (!affiliateUser) {
        console.error('Affiliate user not found:', affiliateUserId)
        // Continue even if we can't create user, but log the error
      } else {
        // Check if user already exists with this phone number
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('phone', affiliateUser.phone)
          .maybeSingle()

        // Calculate premium_until date (1 year from now)
        const premiumUntil = new Date()
        premiumUntil.setFullYear(premiumUntil.getFullYear() + 1)

        if (checkError) {
          // Database error checking for user - log but continue
          console.error('Error checking for existing user:', checkError)
        } else if (existingUser) {
          // User already exists, just enable premium for them
          const { error: updateError } = await supabase
            .from('users')
            .update({
              is_premium: true,
              premium_until: premiumUntil.toISOString()
            })
            .eq('phone', affiliateUser.phone)

          if (updateError) {
            console.error('Error updating user premium status:', updateError)
          } else {
            console.log(`Premium enabled for existing user: ${affiliateUser.phone}`)
          }
        } else {
          // User doesn't exist, create new user with premium enabled
          const { error: userError } = await supabase
            .from('users')
            .insert({
              phone: affiliateUser.phone,
              password: affiliateUser.password, // Use the same hashed password
              name: affiliateUser.name || null,
              email: affiliateUser.email || null,
              is_premium: true,
              premium_until: premiumUntil.toISOString(),
              onboarding_completed: false
            })

          if (userError) {
            console.error('Error creating user for affiliate:', userError)
            // Continue even if user creation fails, but log the error
          } else {
            console.log(`User account created with premium for affiliate: ${affiliateUser.phone}`)
          }
        }
      }
    } catch (userCreationError) {
      // Log error but don't fail the affiliate registration
      console.error('Error in automatic user creation for affiliate:', userCreationError)
    }

    return NextResponse.json({
      message: 'Affiliate registration successful',
      affiliateCode
    })

  } catch (error) {
    console.error('Error in affiliate registration:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 