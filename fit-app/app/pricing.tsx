import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Check, Star, Trophy, Shield } from 'lucide-react-native';
import { T } from '@/constants/theme';

type BillingCycle = 'monthly' | 'yearly';

const FREE_FEATURES = [
  'Basic workout templates',
  '5 diet suggestions',
  'Manual progress tracking',
  'Community forum access',
];

const PRO_FEATURES = [
  ...FREE_FEATURES,
  'Personalized adaptive plans',
  'Full exercise library (200+ exercises)',
  'Detailed nutrition tracking',
  'Advanced analytics',
  'Group challenges & leaderboard',
  'Priority support',
];

const ELITE_FEATURES = [
  ...PRO_FEATURES,
  '1-on-1 certified trainer',
  'Real-time in-app chat',
  'Injury prevention plan',
  'Video form checks',
  'Custom meal planning',
  'Weekly check-in calls',
];

const USP_POINTS = [
  'Your dedicated trainer learns your body, schedule, and limitations — adapting your plan every week.',
  'Real-time messaging so you never feel stuck mid-workout or unsure about your form.',
  'Certified professionals with proven track records, not just algorithm-generated suggestions.',
];

function FeatureItem({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.featureRow}>
      <Check size={15} color={T.success} />
      <Text style={[styles.featureText, { color }]}>{text}</Text>
    </View>
  );
}

function TogglePill({
  billing,
  onToggle,
}: {
  billing: BillingCycle;
  onToggle: (b: BillingCycle) => void;
}) {
  return (
    <View style={styles.toggleContainer}>
      <TouchableOpacity
        style={[styles.toggleOption, billing === 'monthly' && styles.toggleOptionActive]}
        onPress={() => onToggle('monthly')}
      >
        <Text style={[styles.toggleText, billing === 'monthly' && styles.toggleTextActive]}>
          Monthly
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleOption, billing === 'yearly' && styles.toggleOptionActive]}
        onPress={() => onToggle('yearly')}
      >
        <Text style={[styles.toggleText, billing === 'yearly' && styles.toggleTextActive]}>
          Yearly
        </Text>
        <View style={styles.saveBadge}>
          <Text style={styles.saveBadgeText}>Save 17%!</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default function PricingScreen() {
  const [billing, setBilling] = useState<BillingCycle>('monthly');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Trophy size={36} color={T.primary} style={{ marginBottom: T.spacing.sm }} />
        <Text style={styles.mainTitle}>Choose Your Plan</Text>
        <Text style={styles.mainSubtitle}>Unlock your full potential</Text>
        <TogglePill billing={billing} onToggle={setBilling} />
      </View>

      {/* ─── FitStart (Free) ─── */}
      <View style={[styles.pricingCard, styles.cardFree]}>
        <View style={styles.cardHeaderRow}>
          <View style={[styles.badge, styles.badgeFree]}>
            <Text style={[styles.badgeText, styles.badgeTextFree]}>FREE</Text>
          </View>
        </View>
        <Text style={styles.planName}>FitStart</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.priceMain, { color: T.textMuted }]}>$0</Text>
          <Text style={styles.pricePeriod}> / forever</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.featureList}>
          {FREE_FEATURES.map((f) => (
            <FeatureItem key={f} text={f} color={T.textMuted} />
          ))}
        </View>
        <TouchableOpacity style={[styles.ctaButton, styles.ctaOutlined]}>
          <Text style={[styles.ctaText, styles.ctaTextOutlined]}>Get Started Free</Text>
        </TouchableOpacity>
      </View>

      {/* ─── ProFlex (Most Popular) ─── */}
      <View style={[styles.pricingCard, styles.cardPro]}>
        <View style={styles.cardHeaderRow}>
          <View style={[styles.badge, styles.badgePro]}>
            <Star size={11} color="#ffffff" />
            <Text style={[styles.badgeText, styles.badgeTextPro]}>MOST POPULAR</Text>
          </View>
        </View>
        <Text style={styles.planName}>ProFlex</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.priceMain, { color: T.primary }]}>
            {billing === 'monthly' ? '$9.99' : '$8.33'}
          </Text>
          <Text style={styles.pricePeriod}>/mo</Text>
        </View>
        {billing === 'yearly' && (
          <Text style={styles.billingNote}>billed $99.99/yr</Text>
        )}
        <View style={styles.divider} />
        <View style={styles.featureList}>
          {PRO_FEATURES.map((f) => (
            <FeatureItem key={f} text={f} color={T.text} />
          ))}
        </View>
        <TouchableOpacity style={[styles.ctaButton, styles.ctaPrimary]}>
          <Text style={styles.ctaTextWhite}>Start 7-Day Free Trial</Text>
        </TouchableOpacity>
      </View>

      {/* ─── EliteCoach ─── */}
      <View style={[styles.pricingCard, styles.cardElite]}>
        <View style={styles.cardHeaderRow}>
          <View style={[styles.badge, styles.badgeElite]}>
            <Shield size={11} color="#ffffff" />
            <Text style={[styles.badgeText, styles.badgeTextElite]}>PREMIUM</Text>
          </View>
        </View>
        <Text style={styles.planName}>EliteCoach</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.priceMain, { color: T.accent }]}>
            {billing === 'monthly' ? '$49.99' : '$41.67'}
          </Text>
          <Text style={styles.pricePeriod}>/mo</Text>
        </View>
        {billing === 'yearly' && (
          <Text style={styles.billingNote}>billed $499.99/yr</Text>
        )}
        <View style={styles.divider} />
        <View style={styles.featureList}>
          {ELITE_FEATURES.map((f) => (
            <FeatureItem key={f} text={f} color={T.text} />
          ))}
        </View>
        <TouchableOpacity style={[styles.ctaButton, styles.ctaAccent]}>
          <Text style={styles.ctaTextWhite}>Get Elite Access</Text>
        </TouchableOpacity>
      </View>

      {/* ─── USP Section ─── */}
      <View style={styles.uspSection}>
        <Text style={styles.uspTitle}>Why EliteCoach is different</Text>
        {USP_POINTS.map((point, i) => (
          <View key={i} style={styles.uspRow}>
            <View style={styles.uspNumber}>
              <Text style={styles.uspNumberText}>{i + 1}</Text>
            </View>
            <Text style={styles.uspText}>{point}</Text>
          </View>
        ))}
      </View>

      {/* ─── Money-back guarantee ─── */}
      <View style={styles.guaranteeSection}>
        <Shield size={18} color={T.success} />
        <Text style={styles.guaranteeText}>
          30-day money-back guarantee on all paid plans
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.background,
  },
  content: {
    paddingBottom: T.spacing.xxl,
  },
  // ─── Header ─────────────────────────────────────────────────────────────────
  headerSection: {
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: T.spacing.lg,
    paddingHorizontal: T.spacing.lg,
  },
  mainTitle: {
    fontSize: T.fontSize.xxxl,
    fontWeight: T.fontWeight.bold,
    color: T.text,
    textAlign: 'center',
    marginBottom: T.spacing.xs,
  },
  mainSubtitle: {
    fontSize: T.fontSize.md,
    color: T.textMuted,
    textAlign: 'center',
    marginBottom: T.spacing.lg,
  },
  // ─── Toggle ──────────────────────────────────────────────────────────────────
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: T.surface,
    borderRadius: T.radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: T.border,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm - 2,
    borderRadius: T.radius.full,
    gap: T.spacing.xs,
  },
  toggleOptionActive: {
    backgroundColor: T.primary,
  },
  toggleText: {
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.medium,
    color: T.textDim,
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  saveBadge: {
    backgroundColor: T.accent,
    borderRadius: T.radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  saveBadgeText: {
    fontSize: T.fontSize.xs - 1,
    fontWeight: T.fontWeight.bold,
    color: '#ffffff',
  },
  // ─── Cards ───────────────────────────────────────────────────────────────────
  pricingCard: {
    backgroundColor: T.card,
    borderRadius: T.radius.xl,
    padding: T.spacing.lg,
    marginHorizontal: T.spacing.lg,
    marginBottom: T.spacing.md,
    borderWidth: 1,
    borderColor: T.border,
  },
  cardFree: {
    borderColor: T.border,
  },
  cardPro: {
    borderColor: T.primary,
    borderWidth: 2,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  cardElite: {
    borderColor: T.accent,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    marginBottom: T.spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: T.radius.full,
    paddingHorizontal: T.spacing.sm,
    paddingVertical: 3,
  },
  badgeFree: {
    backgroundColor: T.border,
  },
  badgePro: {
    backgroundColor: T.primary,
  },
  badgeElite: {
    backgroundColor: T.accent,
  },
  badgeText: {
    fontSize: T.fontSize.xs,
    fontWeight: T.fontWeight.bold,
    letterSpacing: 0.6,
  },
  badgeTextFree: {
    color: T.textDim,
  },
  badgeTextPro: {
    color: '#ffffff',
  },
  badgeTextElite: {
    color: '#ffffff',
  },
  planName: {
    fontSize: T.fontSize.xxl,
    fontWeight: T.fontWeight.bold,
    color: T.text,
    marginBottom: T.spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  priceMain: {
    fontSize: T.fontSize.xxxl,
    fontWeight: T.fontWeight.bold,
    lineHeight: T.fontSize.xxxl + 4,
  },
  pricePeriod: {
    fontSize: T.fontSize.md,
    color: T.textMuted,
    marginBottom: 4,
  },
  billingNote: {
    fontSize: T.fontSize.sm,
    color: T.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: T.border,
    marginVertical: T.spacing.md,
  },
  featureList: {
    gap: T.spacing.sm,
    marginBottom: T.spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: T.spacing.sm,
  },
  featureText: {
    flex: 1,
    fontSize: T.fontSize.sm,
    lineHeight: 20,
  },
  // ─── CTA Buttons ─────────────────────────────────────────────────────────────
  ctaButton: {
    borderRadius: T.radius.lg,
    paddingVertical: T.spacing.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaOutlined: {
    borderWidth: 1.5,
    borderColor: T.border,
  },
  ctaPrimary: {
    backgroundColor: T.primary,
  },
  ctaAccent: {
    backgroundColor: T.accent,
  },
  ctaText: {
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.semibold,
  },
  ctaTextOutlined: {
    color: T.textMuted,
  },
  ctaTextWhite: {
    color: '#ffffff',
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.semibold,
  },
  // ─── USP Section ─────────────────────────────────────────────────────────────
  uspSection: {
    marginHorizontal: T.spacing.lg,
    marginTop: T.spacing.md,
    backgroundColor: T.surface,
    borderRadius: T.radius.xl,
    padding: T.spacing.lg,
    borderWidth: 1,
    borderColor: T.border,
    gap: T.spacing.md,
  },
  uspTitle: {
    fontSize: T.fontSize.lg,
    fontWeight: T.fontWeight.bold,
    color: T.text,
    marginBottom: T.spacing.xs,
  },
  uspRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: T.spacing.md,
  },
  uspNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: T.primary + '33',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  uspNumberText: {
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.bold,
    color: T.primary,
  },
  uspText: {
    flex: 1,
    fontSize: T.fontSize.sm,
    color: T.textMuted,
    lineHeight: 20,
  },
  // ─── Guarantee ───────────────────────────────────────────────────────────────
  guaranteeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.spacing.sm,
    marginTop: T.spacing.lg,
    marginHorizontal: T.spacing.lg,
    paddingVertical: T.spacing.md,
    borderRadius: T.radius.lg,
    backgroundColor: T.success + '18',
    borderWidth: 1,
    borderColor: T.success + '44',
  },
  guaranteeText: {
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.medium,
    color: T.success,
    textAlign: 'center',
    flex: 1,
  },
});
