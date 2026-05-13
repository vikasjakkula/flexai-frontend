import { T } from '@/constants/theme';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Activity, ArrowLeft, ArrowRight, Dumbbell, HeartPulse, Sparkles } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

type WorkoutType = 'gym' | 'cardio' | 'yoga' | 'calisthenics';

const CARDS: Array<{ key: WorkoutType; label: string; Icon: React.ComponentType<{ color: string; size: number }> }> = [
  { key: 'gym', label: 'Gym', Icon: Dumbbell },
  { key: 'cardio', label: 'Cardio', Icon: HeartPulse },
  { key: 'yoga', label: 'Yoga', Icon: Sparkles },
  { key: 'calisthenics', label: 'Calisthenics', Icon: Activity },
];

export default function OnboardingPreferences() {
  const router = useRouter();
  const { draft, saveDraft } = useUserProfile();
  const [selected, setSelected] = useState<Array<WorkoutType>>((draft?.workoutTypes as Array<WorkoutType>) ?? []);

  const toggle = (k: WorkoutType) => {
    setSelected((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  const canContinue = useMemo(() => selected.length > 0, [selected.length]);

  const finish = async () => {
    if (!canContinue) return;
    await saveDraft({ workoutTypes: selected, preLoginComplete: true });
    router.replace('/login');
  };

  return (
    <LinearGradient colors={['#071D33', '#04070B']} style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}>
            <ArrowLeft size={20} color="#EAF6FF" />
          </Pressable>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Pick what you like</Text>
          <Text style={styles.sub}>We'll tailor suggestions around your preferences</Text>

          <View style={styles.grid}>
            {CARDS.map(({ key, label, Icon }) => {
              const isOn = selected.includes(key);
              return (
                <Pressable
                  key={key}
                  onPress={() => toggle(key)}
                  style={({ pressed }) => [
                    styles.card,
                    isOn && styles.cardActive,
                    pressed && !isOn && styles.cardPressed,
                  ]}>
                  <View style={[styles.iconWrap, isOn && styles.iconWrapActive]}>
                    <Icon size={26} color={isOn ? '#001018' : 'rgba(234,246,255,0.7)'} />
                  </View>
                  <Text style={[styles.cardText, isOn && styles.cardTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          onPress={finish}
          disabled={!canContinue}
          style={({ pressed }) => [
            styles.cta,
            !canContinue && styles.ctaDisabled,
            pressed && canContinue && styles.btnPressed,
          ]}>
          <Text style={styles.ctaText}>Continue</Text>
          <ArrowRight size={18} color="#001018" />
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: T.spacing.lg, paddingBottom: T.spacing.xxl },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: T.spacing.md },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(234,246,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(234,246,255,0.12)',
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#0EA5FF' },

  content: { flex: 1, paddingTop: 36 },
  title: { color: '#EAF6FF', fontSize: 30, fontWeight: T.fontWeight.bold, letterSpacing: -0.6, marginBottom: 8 },
  sub: { color: 'rgba(234,246,255,0.7)', fontSize: 14, marginBottom: 18 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(234,246,255,0.12)',
    backgroundColor: 'rgba(13,20,30,0.78)',
    gap: 10,
  },
  cardActive: {
    borderColor: 'rgba(14,165,255,0.65)',
    backgroundColor: 'rgba(14,165,255,0.10)',
  },
  cardPressed: { transform: [{ scale: 0.98 }], borderColor: 'rgba(14,165,255,0.35)' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(234,246,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(234,246,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: '#0EA5FF', borderColor: '#0EA5FF' },
  cardText: { color: 'rgba(234,246,255,0.75)', fontSize: 13, fontWeight: '700' },
  cardTextActive: { color: '#EAF6FF' },

  cta: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0EA5FF',
    borderRadius: 999,
    paddingVertical: 16,
    marginTop: T.spacing.md,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: '#001018', fontSize: 16, fontWeight: T.fontWeight.semibold },
  btnPressed: { transform: [{ scale: 0.99 }], opacity: 0.95 },
});

