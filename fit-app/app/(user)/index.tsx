import { T } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { fetchAssignments } from '@/lib/api';
import type { AssignmentPayload } from '@/types/catalog';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Apple,
  ChevronRight,
  Dumbbell,
  Flame,
  LogOut,
  Trophy,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getWorkoutSubtitle(fitnessType: string | null) {
  switch (fitnessType) {
    case 'gym': return 'Chest & Triceps';
    case 'cardio': return 'Running Intervals';
    case 'calisthenics': return 'Full Body Calisthenics';
    case 'weightlifter': return 'Power Day';
    default: return 'General Fitness';
  }
}

function getWorkoutBullets(fitnessType: string | null): string[] {
  switch (fitnessType) {
    case 'gym': return ['Flat Bench Press 4×10', 'Incline DB Press 3×12', 'Tricep Pushdown 3×12'];
    case 'cardio': return ['5 min warm-up jog', '20 min moderate run', '8× 30s sprints'];
    case 'calisthenics': return ['Push-Ups 4×20', 'Pull-Ups 4×10', 'Plank 3×60s'];
    case 'weightlifter': return ['Back Squat 5×5', 'Deadlift 4×4', 'Overhead Press 4×6'];
    default: return ['Cardio 20 min', 'Core workout', 'Stretching'];
  }
}

function getCalorieGoal(goals: string[]) {
  if (goals.includes('muscle_gain')) return '3,200 kcal';
  if (goals.includes('weight_loss')) return '1,800 kcal';
  return '2,200 kcal';
}

function getMealHighlights(goals: string[]): string[] {
  if (goals.includes('muscle_gain')) {
    return ['Oats + Whey Protein', 'Chicken Breast + Rice', 'Salmon + Sweet Potato'];
  }
  return ['Egg Whites + Oats', 'Grilled Chicken Salad', 'Baked Salmon + Veg'];
}

export default function UserHome() {
  const { user, signOutApp } = useAuth();
  const { profile, loading, clearProfile } = useUserProfile();

  const handleSignOut = async () => {
    await clearProfile();
    await signOutApp();
  };
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentPayload[]>([]);
  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) return;
      fetchAssignments(user.uid)
        .then(setAssignments)
        .catch(() => {});
    }, [user?.uid]),
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={T.primary} size="large" />
      </View>
    );
  }

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Athlete';
  const streak = profile?.streak ?? 0;
  const points = profile?.points ?? 0;
  const fitnessType = profile?.fitnessType ?? null;
  const goals = profile?.goals ?? [];

  const workoutSubtitle = getWorkoutSubtitle(fitnessType);
  const workoutBullets = getWorkoutBullets(fitnessType);
  const calorieGoal = getCalorieGoal(goals);
  const mealHighlights = getMealHighlights(goals);

  const latestAssignment = assignments.length > 0 ? assignments[0] : null;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()}, {displayName}!</Text>
            <Text style={styles.headerSub}>Ready to crush today?</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.streakBadge}>
              <Flame color={T.warning} size={16} />
              <Text style={styles.streakText}>{streak}</Text>
            </View>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>{points} pts</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Trophy color={T.primary} size={20} />
            <Text style={styles.statValue}>{points}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Flame color={T.warning} size={20} />
            <Text style={[styles.statValue, { color: T.warning }]}>{streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Dumbbell color={T.accent} size={20} />
            <Text style={[styles.statValue, { color: T.accent }]}>3</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>

        {/* Today's Plan */}
        <Text style={styles.sectionTitle}>Today's Plan</Text>

        {/* Workout Card */}
        <View style={[styles.planCard, styles.workoutCard]}>
          <View style={styles.planCardHeader}>
            <View style={styles.planIconRow}>
              <Dumbbell color={T.primary} size={20} />
              <Text style={styles.planCardTitle}>Today's Workout</Text>
            </View>
          </View>
          <Text style={styles.planCardSubtitle}>{workoutSubtitle}</Text>
          {workoutBullets.map((bullet, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.planBtn}
            onPress={() => router.push('/(user)/explore?tab=workout')}
            activeOpacity={0.85}>
            <Text style={styles.planBtnText}>Start Workout</Text>
            <ChevronRight color="#fff" size={16} />
          </TouchableOpacity>
        </View>

        {/* Diet Card */}
        <View style={[styles.planCard, styles.dietCard]}>
          <View style={styles.planCardHeader}>
            <View style={styles.planIconRow}>
              <Apple color={T.accent} size={20} />
              <Text style={styles.planCardTitle}>Today's Diet</Text>
            </View>
          </View>
          <Text style={styles.planCardSubtitle}>Goal: {calorieGoal}</Text>
          {mealHighlights.map((meal, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: T.accent }]} />
              <Text style={styles.bulletText}>{meal}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={[styles.planBtn, { backgroundColor: T.accent }]}
            onPress={() => router.push('/(user)/explore?tab=diet')}
            activeOpacity={0.85}>
            <Text style={styles.planBtnText}>View Plan</Text>
            <ChevronRight color="#fff" size={16} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Today's Progress</Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '40%' }]} />
          </View>
          <Text style={styles.progressLabel}>2 / 5 exercises done</Text>
        </View>

        {/* Trainer Assignment */}
        {latestAssignment && (
          <View style={styles.assignmentCard}>
            <Text style={styles.assignmentTitle}>Trainer Assignment</Text>
            <Text style={styles.assignmentBody}>
              {latestAssignment.exercises?.length ?? 0} exercises &amp;{' '}
              {latestAssignment.diets?.length ?? 0} diet items assigned
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(user)/explore?tab=workout')}
              style={styles.assignmentLink}>
              <Text style={styles.assignmentLinkText}>See full plan</Text>
              <ChevronRight color={T.accent} size={14} />
            </TouchableOpacity>
          </View>
        )}

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.85}>
          <LogOut color={T.textMuted} size={16} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: T.spacing.md,
    paddingBottom: T.spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: T.background,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: T.spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    color: T.text,
    fontSize: T.fontSize.xl,
    fontWeight: T.fontWeight.bold,
  },
  headerSub: {
    color: T.textMuted,
    fontSize: T.fontSize.sm,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: T.spacing.sm,
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.card,
    paddingHorizontal: T.spacing.sm,
    paddingVertical: T.spacing.xs,
    borderRadius: T.radius.full,
  },
  streakText: {
    color: T.warning,
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.semibold,
  },
  pointsBadge: {
    backgroundColor: T.primary,
    paddingHorizontal: T.spacing.sm,
    paddingVertical: T.spacing.xs,
    borderRadius: T.radius.full,
  },
  pointsText: {
    color: '#fff',
    fontSize: T.fontSize.xs,
    fontWeight: T.fontWeight.semibold,
  },
  // Stats
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
    fontSize: T.fontSize.lg,
    fontWeight: T.fontWeight.bold,
  },
  statLabel: {
    color: T.textMuted,
    fontSize: T.fontSize.xs,
  },
  sectionTitle: {
    color: T.text,
    fontSize: T.fontSize.lg,
    fontWeight: T.fontWeight.semibold,
    marginBottom: T.spacing.md,
  },
  // Plan Cards
  planCard: {
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    padding: T.spacing.md,
    marginBottom: T.spacing.md,
    borderLeftWidth: 4,
  },
  workoutCard: {
    borderLeftColor: T.primary,
  },
  dietCard: {
    borderLeftColor: T.accent,
  },
  planCardHeader: {
    marginBottom: T.spacing.xs,
  },
  planIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
  },
  planCardTitle: {
    color: T.text,
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.semibold,
  },
  planCardSubtitle: {
    color: T.textMuted,
    fontSize: T.fontSize.sm,
    marginBottom: T.spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    marginBottom: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.primary,
  },
  bulletText: {
    color: T.textMuted,
    fontSize: T.fontSize.sm,
  },
  planBtn: {
    backgroundColor: T.primary,
    borderRadius: T.radius.md,
    paddingVertical: 10,
    paddingHorizontal: T.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.spacing.xs,
    marginTop: T.spacing.md,
  },
  planBtnText: {
    color: '#fff',
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.semibold,
  },
  // Progress
  progressCard: {
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    padding: T.spacing.md,
    marginBottom: T.spacing.md,
  },
  progressTitle: {
    color: T.text,
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.semibold,
    marginBottom: T.spacing.sm,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: T.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: T.spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: T.primary,
    borderRadius: 4,
  },
  progressLabel: {
    color: T.textMuted,
    fontSize: T.fontSize.xs,
  },
  // Assignment
  assignmentCard: {
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    padding: T.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: T.accent,
    marginBottom: T.spacing.md,
  },
  assignmentTitle: {
    color: T.text,
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.semibold,
    marginBottom: T.spacing.xs,
  },
  assignmentBody: {
    color: T.textMuted,
    fontSize: T.fontSize.sm,
    marginBottom: T.spacing.sm,
  },
  assignmentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  assignmentLinkText: {
    color: T.accent,
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.medium,
  },
  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.spacing.sm,
    paddingVertical: T.spacing.md,
    marginTop: T.spacing.sm,
  },
  signOutText: {
    color: T.textMuted,
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.medium,
  },
});
