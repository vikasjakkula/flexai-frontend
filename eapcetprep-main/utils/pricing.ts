/**
 * Centralized Pricing Configuration
 *
 * Single source of truth for all pricing.
 *
 * Pricing structure:
 * - MRP (strikethrough): ₹499 Basic, ₹599 Pro
 * - Selling price: ₹299 Basic, ₹399 Pro (-₹200 off, no coupon needed)
 * - With spin wheel (50% off): ₹249 unlimited lifetime (PRO)
 */

export type PlanTier = 'FREE' | 'BASIC' | 'PRO'

export interface PricingPlan {
  tier: PlanTier
  /** Selling price (₹299 BASIC, ₹399 PRO) */
  price: number
  /** Same as price — kept for compatibility */
  displayPrice: number
  /** MRP shown as strikethrough (₹499 BASIC, ₹599 PRO) */
  originalPrice: number
  /** Price when spin wheel 50% is applied — modal shows ₹249 unlimited (PRO). */
  spinPrice: number
  duration: number
  label: string
  features: string[]
  hasTrial: boolean
  trialDays: number
  maxAttempts: number
  hasRankEstimation: boolean
  cta: string
  popular?: boolean
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    tier: 'BASIC',
    price: 299,
    displayPrice: 299,
    originalPrice: 499,
    spinPrice: 249,
    duration: 4,
    label: '4 Months',
    features: ['All previous year papers', '1 attempt per test', 'Performance analytics'],
    hasTrial: false,
    trialDays: 0,
    maxAttempts: 1,
    hasRankEstimation: false,
    cta: 'Pay ₹299 Now',
  },
  {
    tier: 'PRO',
    price: 399,
    displayPrice: 399,
    originalPrice: 599,
    spinPrice: 249,
    duration: -1,
    label: 'Rank Booster Unlimited',
    features: ['All previous year papers', 'Unlimited attempts', 'Performance analytics', 'Rank predictor'],
    hasTrial: false,
    trialDays: 0,
    maxAttempts: -1,
    hasRankEstimation: true,
    cta: 'Pay ₹399 Now',
    popular: true,
  }
]

export function getPlanByTier(tier: PlanTier): PricingPlan | undefined {
  return PRICING_PLANS.find(plan => plan.tier === tier)
}

export function getDefaultPlan(): PricingPlan {
  return PRICING_PLANS.find(plan => plan.popular) || PRICING_PLANS[PRICING_PLANS.length - 1]
}

export function getBasicPlan(): PricingPlan {
  return PRICING_PLANS.find(plan => plan.tier === 'BASIC')!
}

export function getProPlan(): PricingPlan {
  return PRICING_PLANS.find(plan => plan.tier === 'PRO')!
}

/** Spin wheel modal offer: ₹249 for unlimited lifetime (PRO). */
export const SPIN_OFFER_RUPEES = 249

/** Display price in UI. Order: spin offer (249 unlimited) > selling price. */
export function getDisplayPriceRupees(tier: PlanTier, spinWheelApplied = false): number {
  if (spinWheelApplied) {
    return SPIN_OFFER_RUPEES
  }
  const plan = getPlanByTier(tier)
  if (!plan) return 0
  return plan.price
}

/** Amount to charge (rupees). Same order: spin offer (249) > selling price. */
export function getChargePriceRupees(tier: PlanTier, spinWheelApplied = false): number {
  return getDisplayPriceRupees(tier, spinWheelApplied)
}

export function isValidTier(tier: string): tier is PlanTier {
  return ['FREE', 'BASIC', 'PRO'].includes(tier)
}

/** Price in paise for Razorpay. */
export function getPlanPriceInPaise(tier: PlanTier, spinWheelApplied = false): number {
  return getChargePriceRupees(tier, spinWheelApplied) * 100
}

export function getPlanByDuration(duration: number): PricingPlan | undefined {
  if (duration === 4) return getPlanByTier('BASIC')
  if (duration === -1 || duration === 12) return getPlanByTier('PRO')
  return getPlanByTier('PRO')
}

export function getPlanDurations(): number[] {
  return PRICING_PLANS.map(plan => plan.duration)
}

export function isValidDuration(duration: number): boolean {
  return PRICING_PLANS.some(plan => plan.duration === duration)
}

/** Onboarding paywall: single pricing = PRO only ₹299; dual = BASIC ₹299, PRO ₹399. Spin wheel still ₹249. */
export const ONBOARDING_SINGLE_PRO_RUPEES = 299
export const ONBOARDING_DUAL_BASIC_RUPEES = 299
export const ONBOARDING_DUAL_PRO_RUPEES = 399

/** MRP shown as strikethrough in onboarding paywall: BASIC ₹399, PRO ₹499. */
export const ONBOARDING_ORIGINAL_BASIC_RUPEES = 399
export const ONBOARDING_ORIGINAL_PRO_RUPEES = 499

export function getOnboardingPaywallPriceRupees(
  tier: PlanTier,
  singlePricing: boolean,
  spinWheelApplied = false
): number {
  if (spinWheelApplied) return SPIN_OFFER_RUPEES
  if (singlePricing) return ONBOARDING_SINGLE_PRO_RUPEES
  return tier === 'BASIC' ? ONBOARDING_DUAL_BASIC_RUPEES : ONBOARDING_DUAL_PRO_RUPEES
}

/** Original price (strikethrough) for onboarding paywall when showing discount. */
export function getOnboardingPaywallOriginalRupees(tier: PlanTier): number {
  return tier === 'BASIC' ? ONBOARDING_ORIGINAL_BASIC_RUPEES : ONBOARDING_ORIGINAL_PRO_RUPEES
}
