import { T } from '@/constants/theme';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { Lock, Star, Trophy, Zap } from 'lucide-react-native';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// Mock: days 0-4 completed, day 5 is today, day 6 is future
const DAY_COMPLETED = [true, true, false, true, true, false, false];
const TODAY_INDEX = 5;

// Mock weekly bar heights (0-100)
const WEEK_BAR_HEIGHTS = [70, 85, 40, 90, 60, 30, 0];

function getLevel(points: number): string {
  if (points < 500) return 'Beginner';
  if (points < 1500) return 'Intermediate';
  if (points < 3000) return 'Advanced';
  return 'Elite';
}

type Badge = {
  id: string;
  label: string;
  icon: string;
  check: (points: number, streak: number, workouts: number) => boolean;
};

const BADGES: Badge[] = [
  { id: 'first_workout', label: 'First Workout', icon: '💪', check: (_, __, w) => w >= 1 },
  { id: 'streak_7', label: '7-Day Streak', icon: '🔥', check: (_, s) => s >= 7 },
  { id: '100_points', label: '100 Points', icon: '⭐', check: (p) => p >= 100 },
  { id: 'diet_master', label: 'Diet Master', icon: '🥗', check: () => false },
  { id: 'iron_will', label: 'Iron Will', icon: '🏋️', check: () => false },
  { id: 'elite_athlete', label: 'Elite Athlete', icon: '🏆', check: () => false },
];

export default function ProgressScreen() {
  const { profile } = useUserProfile();
  const points = profile?.points ?? 0;
  const streak = profile?.streak ?? 0;
  // Mock total workouts from points heuristic
  const totalWorkouts = Math.floor(points / 50) + 1;
  const level = getLevel(points);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Page Title */}
        <Text style={styles.pageTitle}>My Progress</Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Trophy color={T.primary} size={22} />
            <Text style={styles.statValue}>{totalWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Star color={T.warning} size={22} />
            <Text style={[styles.statValue, { color: T.warning }]}>{points}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Zap color={T.accent} size={22} />
            <Text style={[styles.statValue, { color: T.accent }]}>{level}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
        </View>

        {/* Streak Calendar */}
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.calendarCard}>
          {DAY_LABELS.map((day, i) => {
            const isToday = i === TODAY_INDEX;
            const isFuture = i > TODAY_INDEX;
            const isCompleted = DAY_COMPLETED[i];
            return (
              <View key={day} style={styles.dayCol}>
                <Text style={[styles.dayLabel, isFuture && styles.dayLabelDim]}>{day}</Text>
                <View
                  style={[
                    styles.dayCircle,
                    isToday && styles.dayCircleToday,
                    isCompleted && !isToday && styles.dayCircleCompleted,
                    isFuture && styles.dayCircleFuture,
                  ]}>
                  <Text
                    style={[
                      styles.dayNum,
                      isToday && styles.dayNumToday,
                      isCompleted && !isToday && styles.dayNumCompleted,
                      isFuture && styles.dayNumDim,
                    ]}>
                    {i + 1}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Badges */}
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.badgesGrid}>
          {BADGES.map((badge) => {
            const unlocked = badge.check(points, streak, totalWorkouts);
            return (
              <View
                key={badge.id}
                style={[
                  styles.badgeCard,
                  !unlocked && styles.badgeCardLocked,
                ]}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={[styles.badgeLabel, !unlocked && styles.badgeLabelLocked]}>
                  {badge.label}
                </Text>
                {!unlocked && (
                  <View style={styles.lockOverlay}>
                    <Lock color={T.textDim} size={16} />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Weekly Chart */}
        <Text style={styles.sectionTitle}>Weekly Activity</Text>
        <View style={styles.chartCard}>
          <View style={styles.chart}>
            {DAY_LABELS.map((day, i) => {
              const height = WEEK_BAR_HEIGHTS[i];
              return (
                <View key={day} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${height}%`,
                          backgroundColor: i === TODAY_INDEX ? T.primaryLight : T.primary,
                          opacity: height === 0 ? 0.2 : 1,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{day}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.background,
  },
  safeTop: {
    backgroundColor: T.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: T.spacing.md,
    paddingBottom: T.spacing.xxl,
  },
  pageTitle: {
    color: T.text,
    fontSize: T.fontSize.xxl,
    fontWeight: T.fontWeight.bold,
    marginBottom: T.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: T.spacing.sm,
    marginBottom: T.spacing.lg,
  },
  statCard: {
    backgroundColor: T.card,
    borderRadius: T.radius.md,
    padding: T.spacing.md,
    alignItems: 'center',
    gap: T.spacing.xs,
  },
  statValue: {
    color: T.primary,
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.bold,
  },
  statLabel: {
    color: T.textMuted,
    fontSize: T.fontSize.xs,
    textAlign: 'center',
  },
  sectionTitle: {
    color: T.text,
    fontSize: T.fontSize.lg,
    fontWeight: T.fontWeight.semibold,
    marginBottom: T.spacing.md,
  },
  // Calendar
  calendarCard: {
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    padding: T.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: T.spacing.lg,
  },
  dayCol: {
    alignItems: 'center',
    gap: T.spacing.xs,
  },
  dayLabel: {
    color: T.textMuted,
    fontSize: T.fontSize.xs,
    fontWeight: T.fontWeight.medium,
  },
  dayLabelDim: {
    color: T.textDim,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: T.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleToday: {
    backgroundColor: T.primary,
  },
  dayCircleCompleted: {
    backgroundColor: T.accent,
  },
  dayCircleFuture: {
    backgroundColor: T.border,
    opacity: 0.5,
  },
  dayNum: {
    color: T.textMuted,
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.medium,
  },
  dayNumToday: {
    color: '#fff',
  },
  dayNumCompleted: {
    color: '#fff',
  },
  dayNumDim: {
    color: T.textDim,
  },
  // Badges
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: T.spacing.sm,
    marginBottom: T.spacing.lg,
  },
  badgeCard: {
    width: '47%',
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    padding: T.spacing.md,
    alignItems: 'center',
    gap: T.spacing.xs,
    position: 'relative',
    overflow: 'hidden',
  },
  badgeCardLocked: {
    opacity: 0.4,
  },
  badgeIcon: {
    fontSize: 32,
  },
  badgeLabel: {
    color: T.text,
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.medium,
    textAlign: 'center',
  },
  badgeLabelLocked: {
    color: T.textMuted,
  },
  lockOverlay: {
    position: 'absolute',
    top: T.spacing.xs,
    right: T.spacing.xs,
  },
  // Chart
  chartCard: {
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    padding: T.spacing.md,
    marginBottom: T.spacing.lg,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: T.spacing.sm,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  barTrack: {
    flex: 1,
    width: '70%',
    justifyContent: 'flex-end',
  },
  barFill: {
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    color: T.textMuted,
    fontSize: T.fontSize.xs,
    marginTop: T.spacing.xs,
  },
});
