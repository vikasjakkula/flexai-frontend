import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAffiliateAuth } from '@/utils/affiliate-auth'

export async function GET() {
  try {
    // Authenticate affiliate user
    const affiliateUserId = await requireAffiliateAuth()
    
    const supabase = createClient()

    // Get affiliate details including commission rates
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, affiliate_code, status, created_at, commission_rate_first, commission_rate_second')
      .eq('affiliate_user_id', affiliateUserId)
      .single()

    if (affiliateError || !affiliate) {
      console.error('Error fetching affiliate:', affiliateError)
      return NextResponse.json({ error: 'User is not registered as an affiliate' }, { status: 404 })
    }

    // Get visit count
    const { count: totalVisits } = await supabase
      .from('affiliate_visits')
      .select('*', { count: 'exact', head: true })
      .eq('affiliate_id', affiliate.id)

    // Get sales count separately (using head: true for count only)
    const { count: totalSales, error: salesCountError } = await supabase
      .from('affiliate_sales')
      .select('*', { count: 'exact', head: true })
      .eq('affiliate_id', affiliate.id)

    if (salesCountError) {
      console.error('Error fetching affiliate sales count:', salesCountError)
    }

    // Get sales data for commission calculations
    const { data: sales, error: salesError } = await supabase
      .from('affiliate_sales')
      .select('commission_amount, amount, status, created_at')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })

    if (salesError) {
      console.error('Error fetching affiliate sales:', salesError)
    }

    // Use count from query, fallback to array length if count is null
    const actualTotalSales = totalSales ?? sales?.length ?? 0

    console.log('Affiliate dashboard data:', {
      affiliateId: affiliate.id,
      affiliateCode: affiliate.affiliate_code,
      totalSalesFromCount: totalSales,
      totalSalesFromArray: sales?.length,
      actualTotalSales,
      totalVisits: totalVisits || 0,
      sales: sales
    })

    // Calculate total commission
    const totalCommission = sales?.reduce((sum, sale) => 
      sum + (sale.commission_amount || 0), 0) || 0

    // Calculate pending commission
    const pendingCommission = sales?.filter(s => s.status === 'pending')
      .reduce((sum, sale) => sum + (sale.commission_amount || 0), 0) || 0

    // Calculate paid commission
    const paidCommission = sales?.filter(s => s.status === 'paid')
      .reduce((sum, sale) => sum + (sale.commission_amount || 0), 0) || 0

    // Get recent sales (last 10)
    const recentSales = sales?.slice(-10).reverse() || []

    // Calculate conversion rate
    const conversionRate = (totalVisits || 0) > 0 
      ? ((actualTotalSales / (totalVisits || 1)) * 100).toFixed(1) 
      : '0.0'

    return NextResponse.json({
      affiliateCode: affiliate.affiliate_code,
      status: affiliate.status,
      createdAt: affiliate.created_at,
      commissionRateFirst: affiliate.commission_rate_first ?? 30,
      commissionRateSecond: affiliate.commission_rate_second ?? 40,
      stats: {
        totalVisits: totalVisits || 0,
        totalSales: actualTotalSales,
        totalCommission,
        pendingCommission,
        paidCommission,
        conversionRate: parseFloat(conversionRate)
      },
      recentSales: recentSales.map(sale => ({
        amount: sale.amount,
        commission: sale.commission_amount,
        status: sale.status,
        createdAt: sale.created_at
      }))
    })

  } catch (error) {
    console.error('Error in affiliate details:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 