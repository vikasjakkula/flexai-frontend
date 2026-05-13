import { T } from '@/constants/theme';
import { useUserProfile } from '@/contexts/UserProfileContext';
import {
  Activity,
  Check,
  Dumbbell,
  Flame,
  Footprints,
  Hand,
  ImageIcon,
  Repeat,
  Timer,
  TrendingUp,
  Weight,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ExerciseKind = 'strength' | 'cardio' | 'bodyweight' | 'core';

type Exercise = {
  name: string;
  kind: ExerciseKind;
  sets?: number;
  reps?: string;
  weight?: string;
  duration?: string;
};

type FeedbackType = 'too_easy' | 'just_right' | 'too_hard' | null;

const KIND_META: Record<ExerciseKind, { icon: LucideIcon; color: string; tint: string; label: string }> = {
  strength: { icon: Dumbbell, color: '#4A9EFF', tint: '#15233f', label: 'Strength' },
  cardio: { icon: Activity, color: '#EF4444', tint: '#3a1a1a', label: 'Cardio' },
  bodyweight: { icon: Hand, color: '#10B981', tint: '#0f2d23', label: 'Bodyweight' },
  core: { icon: Zap, color: '#F59E0B', tint: '#3a2a1a', label: 'Core' },
};

function pickIcon(name: string, kind: ExerciseKind): LucideIcon {
  const lower = name.toLowerCase();
  if (lower.includes('plank')) return Timer;
  if (lower.includes('run') || lower.includes('jog') || lower.includes('sprint') || lower.includes('walk')) return Footprints;
  if (lower.includes('jump')) return TrendingUp;
  return KIND_META[kind].icon;
}

function getExercises(fitnessType: string | null): Exercise[] {
  switch (fitnessType) {
    case 'gym':
      return [
        { name: 'Flat Bench Press', kind: 'strength', sets: 4, reps: '10', weight: '60 kg' },
        { name: 'Incline Dumbbell Press', kind: 'strength', sets: 3, reps: '12', weight: '20 kg' },
        { name: 'Cable Fly', kind: 'strength', sets: 3, reps: '15', weight: '15 kg' },
        { name: 'Tricep Pushdown', kind: 'strength', sets: 3, reps: '12', weight: '25 kg' },
      ];
    case 'cardio':
      return [
        { name: 'Warm-up Jog', kind: 'cardio', duration: '5 min' },
        { name: 'Moderate Run', kind: 'cardio', duration: '20 min' },
        { name: 'Sprint Intervals', kind: 'cardio', sets: 8, duration: '30s on / 90s rest' },
        { name: 'Cool-down Walk', kind: 'cardio', duration: '5 min' },
      ];
    case 'calisthenics':
      return [
        { name: 'Push-Ups', kind: 'bodyweight', sets: 4, reps: '20' },
        { name: 'Pull-Ups', kind: 'bodyweight', sets: 4, reps: '10' },
        { name: 'Dips', kind: 'bodyweight', sets: 3, reps: '15' },
        { name: 'Plank', kind: 'core', sets: 3, duration: '60s' },
        { name: 'Jump Squats', kind: 'bodyweight', sets: 3, reps: '20' },
      ];
    case 'weightlifter':
      return [
        { name: 'Back Squat', kind: 'strength', sets: 5, reps: '5', weight: '100 kg' },
        { name: 'Deadlift', kind: 'strength', sets: 4, reps: '4', weight: '120 kg' },
        { name: 'Overhead Press', kind: 'strength', sets: 4, reps: '6', weight: '50 kg' },
        { name: 'Barbell Row', kind: 'strength', sets: 4, reps: '6', weight: '70 kg' },
      ];
    default:
      return [
        { name: 'Jumping Jacks', kind: 'cardio', sets: 3, reps: '30' },
        { name: 'Bodyweight Squats', kind: 'bodyweight', sets: 3, reps: '20' },
        { name: 'Push-Ups', kind: 'bodyweight', sets: 3, reps: '15' },
        { name: 'Plank', kind: 'core', sets: 3, duration: '45s' },
      ];
  }
}

function getWorkoutTitle(fitnessType: string | null): string {
  switch (fitnessType) {
    case 'gym':
      return 'Chest Day';
    case 'cardio':
      return 'Interval Day';
    case 'calisthenics':
      return 'Full Body';
    case 'weightlifter':
      return 'Power Day';
    default:
      return 'General Fitness';
  }
}

const FEEDBACK_OPTIONS: { key: Exclude<FeedbackType, null>; label: string }[] = [
  { key: 'too_easy', label: 'Too Easy' },
  { key: 'just_right', label: 'Just Right' },
  { key: 'too_hard', label: 'Too Hard' },
];

export default function WorkoutScreen() {
  const { profile } = useUserProfile();
  const fitnessType = profile?.fitnessType ?? null;
  const exercises = useMemo(() => getExercises(fitnessType), [fitnessType]);

  const [done, setDone] = useState<boolean[]>(() => exercises.map(() => false));
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [workoutComplete, setWorkoutComplete] = useState(false);

  const toggleDone = (i: number) => {
    if (workoutComplete) return;
    setDone((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const doneCount = done.filter(Boolean).length;
  const allDone = doneCount === exercises.length;
  const completionPct = Math.round((doneCount / exercises.length) * 100);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconWrap}>
              <Dumbbell color={T.primary} size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Today's Workout</Text>
              <Text style={styles.headerSubtitle}>
                {getWorkoutTitle(fitnessType)} · {doneCount}/{exercises.length} done
              </Text>
            </View>
            <View style={styles.fitnessBadge}>
              <Flame color="#fff" size={12} />
              <Text style={styles.fitnessBadgeText}>{getWorkoutTitle(fitnessType)}</Text>
            </View>
          </View>

          <View style={styles.headerProgressTrack}>
            <View style={[styles.headerProgressFill, { width: `${completionPct}%` }]} />
          </View>
        </View>

        {/* Feedback */}
        <Text style={styles.subSectionTitle}>How does today feel?</Text>
        <View style={styles.feedbackRow}>
          {FEEDBACK_OPTIONS.map(({ key, label }) => {
            const active = feedback === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.feedbackPill, active && styles.feedbackPillActive]}
                onPress={() => setFeedback(key)}
                activeOpacity={0.85}>
                <Text style={[styles.feedbackPillText, active && styles.feedbackPillTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Exercise Cards */}
        <Text style={styles.sectionTitle}>Exercises</Text>
        {exercises.map((ex, i) => {
          const meta = KIND_META[ex.kind];
          const Icon = pickIcon(ex.name, ex.kind);
          const isDone = done[i];
          const isDisabled = workoutComplete;

          return (
            <View
              key={`${ex.name}-${i}`}
              style={[
                styles.exerciseCard,
                isDone && styles.exerciseCardDone,
                isDisabled && !isDone && styles.exerciseCardDisabled,
              ]}>

              {/* Top: thumbnail + info */}
              <View style={styles.exerciseTopRow}>
                <View style={[styles.thumbnail, { backgroundColor: meta.tint }]}>
                  <Icon color={meta.color} size={26} />
                  <View style={styles.thumbnailBadge}>
                    <ImageIcon color={T.textDim} size={10} />
                  </View>
                </View>

                <View style={styles.exerciseInfo}>
                  <View style={[styles.kindBadge, { backgroundColor: meta.tint }]}>
                    <Text style={[styles.kindBadgeText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                  <Text
                    style={[styles.exerciseName, isDone && styles.exerciseNameDone]}
                    numberOfLines={2}>
                    {ex.name}
                  </Text>
                </View>
              </View>

              {/* Metrics */}
              <View style={styles.metricsRow}>
                {ex.sets !== undefined && (
                  <Metric icon={Repeat} label="Sets" value={String(ex.sets)} color={meta.color} />
                )}
                {ex.reps !== undefined && (
                  <Metric icon={TrendingUp} label="Reps" value={ex.reps} color={meta.color} />
                )}
                {ex.weight !== undefined && (
                  <Metric icon={Weight} label="Weight" value={ex.weight} color={meta.color} />
                )}
                {ex.duration !== undefined && (
                  <Metric icon={Timer} label="Time" value={ex.duration} color={meta.color} />
                )}
              </View>

              {/* Mark complete button */}
              <TouchableOpacity
                style={[
                  styles.markBtn,
                  isDone && styles.markBtnDone,
                  isDisabled && styles.markBtnDisabled,
                ]}
                onPress={() => toggleDone(i)}
                disabled={isDisabled}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={isDone ? `Mark ${ex.name} not done` : `Mark ${ex.name} complete`}>
                {isDone ? (
                  <>
                    <Check color="#fff" size={16} strokeWidth={3} />
                    <Text style={styles.markBtnText}>Completed</Text>
                  </>
                ) : (
                  <Text style={[styles.markBtnText, styles.markBtnTextIdle]}>
                    Mark as Complete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Counter */}
        <View style={styles.counterRow}>
          <Text style={styles.counterText}>
            {doneCount} / {exercises.length} exercises done
          </Text>
        </View>

        {/* Celebration Banner */}
        {allDone && (
          <View style={styles.celebrationBanner}>
            <Flame color="#fff" size={18} />
            <Text style={styles.celebrationText}>Great job! +50 pts</Text>
          </View>
        )}

        {/* Complete Button */}
        <TouchableOpacity
          style={[styles.completeBtn, workoutComplete && styles.completeBtnDone]}
          onPress={() => setWorkoutComplete(true)}
          disabled={workoutComplete}
          activeOpacity={0.85}>
          {workoutComplete ? <Check color="#fff" size={18} strokeWidth={3} /> : null}
          <Text style={styles.completeBtnText}>
            {workoutComplete ? 'Workout Completed' : 'Mark Workout Complete'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.metricChip}>
      <Icon color={color} size={14} />
      <View>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
    </View>
  );
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  android: {
    elevation: 3,
  },
  default: {},
});

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

  // Header
  header: {
    marginBottom: T.spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.sm,
    marginBottom: T.spacing.sm,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: T.radius.md,
    backgroundColor: '#15233f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: T.text,
    fontSize: T.fontSize.xl,
    fontWeight: T.fontWeight.bold,
  },
  headerSubtitle: {
    color: T.textMuted,
    fontSize: T.fontSize.sm,
    marginTop: 2,
  },
  fitnessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.primary,
    paddingHorizontal: T.spacing.sm,
    paddingVertical: T.spacing.xs,
    borderRadius: T.radius.full,
  },
  fitnessBadgeText: {
    color: '#fff',
    fontSize: T.fontSize.xs,
    fontWeight: T.fontWeight.semibold,
  },
  headerProgressTrack: {
    height: 6,
    backgroundColor: T.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  headerProgressFill: {
    height: '100%',
    backgroundColor: T.primary,
    borderRadius: 3,
  },

  subSectionTitle: {
    color: T.textMuted,
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.medium,
    marginBottom: T.spacing.sm,
  },

  // Feedback
  feedbackRow: {
    flexDirection: 'row',
    gap: T.spacing.sm,
    marginBottom: T.spacing.lg,
  },
  feedbackPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radius.full,
    paddingVertical: T.spacing.sm,
    alignItems: 'center',
    backgroundColor: T.surface,
  },
  feedbackPillActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  feedbackPillText: {
    color: T.textMuted,
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.medium,
  },
  feedbackPillTextActive: {
    color: '#fff',
    fontWeight: T.fontWeight.semibold,
  },

  sectionTitle: {
    color: T.text,
    fontSize: T.fontSize.lg,
    fontWeight: T.fontWeight.semibold,
    marginBottom: T.spacing.md,
  },

  // Exercise card
  exerciseCard: {
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    padding: T.spacing.md,
    marginBottom: T.spacing.md,
    borderWidth: 1,
    borderColor: T.border,
    ...cardShadow,
  },
  exerciseCardDone: {
    borderColor: T.success,
    backgroundColor: '#1d2a22',
  },
  exerciseCardDisabled: {
    opacity: 0.55,
  },
  exerciseTopRow: {
    flexDirection: 'row',
    gap: T.spacing.md,
    marginBottom: T.spacing.md,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: T.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  thumbnailBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: T.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  exerciseInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: T.spacing.xs,
  },
  kindBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: T.spacing.sm,
    paddingVertical: 2,
    borderRadius: T.radius.full,
  },
  kindBadgeText: {
    fontSize: T.fontSize.xs,
    fontWeight: T.fontWeight.semibold,
    letterSpacing: 0.2,
  },
  exerciseName: {
    color: T.text,
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.bold,
  },
  exerciseNameDone: {
    color: T.textMuted,
    textDecorationLine: 'line-through',
  },

  // Metrics
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: T.spacing.sm,
    paddingVertical: T.spacing.sm,
    marginBottom: T.spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: T.border,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: T.spacing.sm,
    paddingVertical: 6,
    backgroundColor: T.surface,
    borderRadius: T.radius.sm,
    minWidth: 80,
  },
  metricLabel: {
    color: T.textDim,
    fontSize: 10,
    fontWeight: T.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metricValue: {
    color: T.text,
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.semibold,
  },

  // Mark complete button
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.spacing.xs,
    paddingVertical: 10,
    borderRadius: T.radius.md,
    borderWidth: 1.5,
    borderColor: T.border,
    backgroundColor: T.surface,
  },
  markBtnDone: {
    backgroundColor: T.success,
    borderColor: T.success,
  },
  markBtnDisabled: {
    opacity: 0.7,
  },
  markBtnText: {
    color: '#fff',
    fontSize: T.fontSize.sm,
    fontWeight: T.fontWeight.semibold,
  },
  markBtnTextIdle: {
    color: T.textMuted,
  },

  // Counter
  counterRow: {
    alignItems: 'center',
    marginVertical: T.spacing.md,
  },
  counterText: {
    color: T.textMuted,
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.medium,
  },

  // Celebration
  celebrationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.spacing.sm,
    backgroundColor: T.accent,
    borderRadius: T.radius.md,
    padding: T.spacing.md,
    marginBottom: T.spacing.md,
    ...cardShadow,
  },
  celebrationText: {
    color: '#fff',
    fontSize: T.fontSize.lg,
    fontWeight: T.fontWeight.bold,
  },

  // Final complete CTA
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.spacing.sm,
    backgroundColor: T.primary,
    borderRadius: T.radius.md,
    paddingVertical: 16,
  },
  completeBtnDone: {
    backgroundColor: T.success,
  },
  completeBtnText: {
    color: '#fff',
    fontSize: T.fontSize.md,
    fontWeight: T.fontWeight.semibold,
  },
});
