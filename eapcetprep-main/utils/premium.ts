import { createClient } from '@/utils/supabase/server'
import { PlanTier, getPlanByTier } from './pricing'

export interface PremiumStatus {
  isPremium: boolean
  tier: PlanTier
  hasRankEstimation: boolean
  maxAttempts: number // -1 for unlimited
  premiumUntil: Date | null
}

/**
 * Get comprehensive premium status for a user
 * Returns tier information and feature access
 */
export async function getPremiumStatus(userId: string): Promise<PremiumStatus> {
  try {
    const supabase = createClient()
    const { data: user, error } = await supabase
      .from('users')
      .select('premium_until, plan_tier, is_premium')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return {
        isPremium: false,
        tier: 'FREE',
        hasRankEstimation: false,
        maxAttempts: 0,
        premiumUntil: null
      }
    }

    // If premium_until is null or in the past, user is FREE
    const premiumUntil = user.premium_until ? new Date(user.premium_until) : null
    const now = new Date()
    const isPremiumActive = premiumUntil && premiumUntil > now

    if (!isPremiumActive) {
      return {
        isPremium: false,
        tier: 'FREE',
        hasRankEstimation: false,
        maxAttempts: 0,
        premiumUntil: null
      }
    }

    // Get tier - default to PRO for existing premium users without tier set
    const tier: PlanTier = (user.plan_tier as PlanTier) || 'PRO'
    const plan = getPlanByTier(tier)

    return {
      isPremium: true,
      tier,
      hasRankEstimation: plan?.hasRankEstimation ?? (tier === 'PRO'),
      maxAttempts: plan?.maxAttempts ?? (tier === 'PRO' ? -1 : 1),
      premiumUntil
    }
  } catch (error) {
    console.error('Error getting premium status:', error)
    return {
      isPremium: false,
      tier: 'FREE',
      hasRankEstimation: false,
      maxAttempts: 0,
      premiumUntil: null
    }
  }
}

/**
 * Check if user has active premium subscription
 * Returns true if premium_until is in the future
 */
export async function isPremiumActive(userId: string): Promise<boolean> {
  const status = await getPremiumStatus(userId)
  return status.isPremium
}

/**
 * Check if user can access rank estimation feature
 * Only PRO tier users have access
 */
export async function canAccessRankEstimation(userId: string): Promise<boolean> {
  const status = await getPremiumStatus(userId)
  return status.hasRankEstimation
}

/**
 * Get max attempts allowed for a user
 * Returns -1 for unlimited (PRO), 1 for BASIC, 0 for FREE
 */
export async function getMaxAttempts(userId: string): Promise<number> {
  const status = await getPremiumStatus(userId)
  return status.maxAttempts
}

/**
 * Count completed attempts for a specific test by a user
 */
export async function countAttempts(userId: string, testId: number): Promise<number> {
  try {
    const supabase = createClient()
    const { count, error } = await supabase
      .from('test_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('test_id', testId)
      .eq('status', 'submitted')

    if (error) {
      console.error('Error counting attempts:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error counting attempts:', error)
    return 0
  }
}

/**
 * Check if user can attempt a test
 * Returns true if user has attempts remaining
 */
export async function canAttemptTest(userId: string, testId: number): Promise<{ canAttempt: boolean; reason?: string }> {
  const status = await getPremiumStatus(userId)

  // FREE users can't attempt premium tests
  if (!status.isPremium) {
    return { canAttempt: false, reason: 'Premium subscription required' }
  }

  // PRO users have unlimited attempts
  if (status.maxAttempts === -1) {
    return { canAttempt: true }
  }

  // BASIC users - check attempt count
  const attemptCount = await countAttempts(userId, testId)
  if (attemptCount >= status.maxAttempts) {
    return { canAttempt: false, reason: 'Upgrade to PRO for unlimited attempts' }
  }

  return { canAttempt: true }
}

/**
 * Require active premium subscription
 * Throws error if user is not premium
 */
export async function requirePremium(userId: string): Promise<void> {
  const isPremium = await isPremiumActive(userId)
  if (!isPremium) {
    throw new Error('Premium subscription required')
  }
}
