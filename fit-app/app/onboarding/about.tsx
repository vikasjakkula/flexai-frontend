import { T } from '@/constants/theme';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, User2 } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

type Gender = 'male' | 'female' | 'other';

export default function OnboardingAbout() {
  const router = useRouter();
  const { draft, saveDraft } = useUserProfile();

  const [age, setAge] = useState(draft?.age ?? '');
  const [gender, setGender] = useState<Gender | null>(draft?.gender ?? null);

  const ageNum = useMemo(() => {
    const n = Number(age);
    return Number.isFinite(n) ? n : NaN;
  }, [age]);

  const canContinue = useMemo(() => gender !== null && age.trim().length > 0 && ageNum >= 8 && ageNum <= 99, [gender, age, ageNum]);

  const next = async () => {
    if (!canContinue) return;
    await saveDraft({ age: age.replace(/[^\d]/g, ''), gender });
    router.push('/onboarding/measurements');
  };

  const setAgeSafe = (v: string) => setAge(v.replace(/[^\d]/g, '').slice(0, 2));

  return (
    <LinearGradient colors={['#071D33', '#04070B']} style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}>
            <ArrowLeft size={20} color="#EAF6FF" />
          </Pressable>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.content}>
            <Text style={styles.title}>About you</Text>
            <Text style={styles.sub}>Age & gender helps us tailor workouts</Text>

            <View style={styles.inputWrap}>
              <User2 size={18} color="rgba(234,246,255,0.65)" />
              <TextInput
                value={age}
                onChangeText={setAgeSafe}
                placeholder="Your age"
                placeholderTextColor="rgba(234,246,255,0.35)"
                style={styles.input}
                keyboardType="number-pad"
                returnKeyType="done"
              />
            </View>

            <Text style={styles.sectionLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {([
                { key: 'male' as const, label: 'Male' },
                { key: 'female' as const, label: 'Female' },
                { key: 'other' as const, label: 'Other' },
              ]).map((g) => (
                <Pressable
                  key={g.key}
                  onPress={() => setGender(g.key)}
                  style={({ pressed }) => [
                    styles.genderCard,
                    gender === g.key && styles.genderCardActive,
                    pressed && gender !== g.key && styles.genderCardPressed,
                  ]}>
                  <Text style={[styles.genderText, gender === g.key && styles.genderTextActive]}>{g.label}</Text>
                </Pressable>
              ))}
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

  sectionLabel: { color: 'rgba(234,246,255,0.7)', fontSize: 12, fontWeight: '600', marginBottom: 10 },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderCard: {
    flex: 1,
    backgroundColor: 'rgba(13,20,30,0.78)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(234,246,255,0.12)',
  },
  genderCardActive: { borderColor: '#0EA5FF', backgroundColor: 'rgba(14,165,255,0.12)' },
  genderCardPressed: { transform: [{ scale: 0.98 }], borderColor: 'rgba(14,165,255,0.35)' },
  genderText: { color: 'rgba(234,246,255,0.55)', fontWeight: '600' },
  genderTextActive: { color: '#EAF6FF' },

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

