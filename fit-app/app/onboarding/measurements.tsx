import { T } from '@/constants/theme';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Ruler, Weight } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function OnboardingMeasurements() {
  const router = useRouter();
  const { draft, saveDraft } = useUserProfile();

  const [heightCm, setHeightCm] = useState(draft?.heightCm ?? '');
  const [weightKg, setWeightKg] = useState(draft?.weightKg ?? '');

  const heightNum = useMemo(() => Number(heightCm), [heightCm]);
  const weightNum = useMemo(() => Number(weightKg), [weightKg]);

  const canContinue = useMemo(() => {
    if (!heightCm.trim() || !weightKg.trim()) return false;
    if (!Number.isFinite(heightNum) || !Number.isFinite(weightNum)) return false;
    return heightNum >= 80 && heightNum <= 250 && weightNum >= 20 && weightNum <= 300;
  }, [heightCm, weightKg, heightNum, weightNum]);

  const next = async () => {
    if (!canContinue) return;
    await saveDraft({ heightCm, weightKg });
    router.push('/onboarding/preferences');
  };

  const digits = (v: string, max = 3) => v.replace(/[^\d]/g, '').slice(0, max);

  return (
    <LinearGradient colors={['#071D33', '#04070B']} style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}>
            <ArrowLeft size={20} color="#EAF6FF" />
          </Pressable>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '75%' }]} />
          </View>
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.content}>
            <Text style={styles.title}>Body measurements</Text>
            <Text style={styles.sub}>Used to calculate your calorie needs</Text>

            <Text style={styles.label}>Height (cm)</Text>
            <View style={styles.inputWrap}>
              <Ruler size={18} color="rgba(234,246,255,0.65)" />
              <TextInput
                value={heightCm}
                onChangeText={(v) => setHeightCm(digits(v, 3))}
                placeholder="e.g. 175"
                placeholderTextColor="rgba(234,246,255,0.35)"
                style={styles.input}
                keyboardType="number-pad"
                returnKeyType="next"
              />
            </View>

            <Text style={styles.label}>Weight (kg)</Text>
            <View style={styles.inputWrap}>
              <Weight size={18} color="rgba(234,246,255,0.65)" />
              <TextInput
                value={weightKg}
                onChangeText={(v) => setWeightKg(digits(v, 3))}
                placeholder="e.g. 70"
                placeholderTextColor="rgba(234,246,255,0.35)"
                style={styles.input}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={next}
              />
            </View>
          </View>

          <Pressable
            onPress={next}
            disabled={!canContinue}
            style={({ pressed }) => [
              styles.cta,
              !canContinue && styles.ctaDisabled,
              pressed && canContinue && styles.btnPressed,
            ]}>
            <Text style={styles.ctaText}>Continue</Text>
            <ArrowRight size={18} color="#001018" />
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: T.spacing.lg, paddingBottom: T.spacing.xxl },
  flex: { flex: 1 },

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
  sub: { color: 'rgba(234,246,255,0.7)', fontSize: 14, marginBottom: 22 },

  label: { color: 'rgba(234,246,255,0.7)', fontSize: 12, fontWeight: '600', marginBottom: 10 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(13,20,30,0.78)',
    borderWidth: 1.5,
    borderColor: 'rgba(14,165,255,0.25)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 18,
  },
  input: { flex: 1, color: '#EAF6FF', fontSize: 15 },

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

