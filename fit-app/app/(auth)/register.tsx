import { T } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { upsertUser } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';
import { Activity, ArrowLeft, Dumbbell, HeartPulse, Sparkles, Trophy } from 'lucide-react-native';
import { Redirect, useRouter } from 'expo-router';
import { Link } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Role = 'user' | 'trainer';
type FitnessType = 'gym' | 'cardio' | 'yoga' | 'calisthenics';

const FITNESS_CARDS: { key: FitnessType; label: string; Icon: React.ComponentType<{ color: string; size: number }> }[] = [
  { key: 'gym', label: 'Gym', Icon: Dumbbell },
  { key: 'cardio', label: 'Cardio', Icon: HeartPulse },
  { key: 'yoga', label: 'Yoga', Icon: Sparkles },
  { key: 'calisthenics', label: 'Calisthenics', Icon: Activity },
];

export default function RegisterScreen() {
  const { user, loading, firebaseReady } = useAuth();
  const { saveProfile, draft, clearDraft } = useUserProfile();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [name, setName] = useState(draft?.name ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role | null>(null);
  const [fitnessType, setFitnessType] = useState<FitnessType | null>(
    (draft?.workoutTypes?.[0] as FitnessType | undefined) ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Animate step content in on each step change
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(16);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [step]);

  if (loading) return null;
  if (user) return <Redirect href="/" />;

  const totalSteps = role === 'trainer' ? 2 : 3;

  const goNext = () => {
    setErr(null);
    if (step === 1) {
      if (!name.trim() || !email.trim() || !password) {
        setErr('Please fill in all fields.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!role) { setErr('Please choose a role.'); return; }
      if (role === 'trainer') { handleSubmit(); } else { setStep(3); }
    } else if (step === 3) {
      if (!fitnessType) { setErr('Please select a training style.'); return; }
      handleSubmit();
    }
  };

  const goBack = () => { setErr(null); if (step > 1) setStep(s => s - 1); };

  const handleSubmit = async () => {
    setBusy(true);
    setErr(null);
    try {
      let uid = '';
      if (firebaseReady) {
        const auth = getFirebaseAuth();
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        uid = cred.user.uid;
      } else {
        uid = `local_${Date.now()}`;
      }

      const profileData = {
        uid,
        name: name.trim(),
        email: email.trim(),
        role: role ?? 'user',
        fitnessType: role === 'user' ? (fitnessType ?? null) : null,
        age: draft?.age ? Number(draft.age) : null,
        gender: draft?.gender ?? null,
        heightCm: draft?.heightCm ? Number(draft.heightCm) : null,
        weightKg: draft?.weightKg ? Number(draft.weightKg) : null,
        workoutTypes: (draft?.workoutTypes ?? []),
        goals: [],
        level: 'beginner' as const,
        points: 0,
        streak: 0,
        badges: [],
        onboardingComplete: true,
        assignedTrainerId: null,
      };

      await saveProfile(profileData);
      await clearDraft();
      try {
        await upsertUser(uid, { uid, name: name.trim(), email: email.trim(), role: role ?? 'user' });
      } catch { /* non-blocking */ }

      router.replace('/');
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            {step > 1 ? (
              <TouchableOpacity onPress={goBack} style={styles.iconBtn}>
                <ArrowLeft color={T.text} size={20} />
              </TouchableOpacity>
            ) : <View style={styles.iconBtn} />}
            <Text style={styles.headerTitle}>Create Account</Text>
            <View style={styles.iconBtn} />
          </View>

          {/* Progress pills */}
          <View style={styles.progressRow}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View key={i} style={[
                styles.pill,
                i + 1 < step && styles.pillDone,
                i + 1 === step && styles.pillActive,
                i + 1 > step && styles.pillInactive,
              ]} />
            ))}
          </View>

          {/* Step content */}
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* Step 1 — Account */}
            {step === 1 && (
              <View>
                <Text style={styles.stepTitle}>Create your account</Text>
                <Text style={styles.stepSub}>Join FitSync and start your journey</Text>

                <Text style={styles.label}>Full Name</Text>
                <TextInput value={name} onChangeText={setName} placeholder="John Doe" placeholderTextColor={T.textDim} style={styles.input} />

                <Text style={styles.label}>Email</Text>
                <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={T.textDim} autoCapitalize="none" keyboardType="email-address" style={styles.input} />

                <Text style={styles.label}>Password</Text>
                <TextInput value={password} onChangeText={setPassword} placeholder="min 6 characters" placeholderTextColor={T.textDim} secureTextEntry style={styles.input} />
              </View>
            )}

            {/* Step 2 — Role */}
            {step === 2 && (
              <View>
                <Text style={styles.stepTitle}>I am a…</Text>
                <Text style={styles.stepSub}>Choose your role on FitSync</Text>

                <Pressable
                  style={({ pressed }) => [styles.roleCard, role === 'user' && styles.cardSelected, pressed && role !== 'user' && styles.cardHover]}
                  onPress={() => setRole('user')}>
                  <View style={[styles.roleIconWrap, role === 'user' && styles.roleIconWrapActive]}>
                    <Dumbbell size={28} color={role === 'user' ? '#fff' : T.textMuted} />
                  </View>
                  <View style={styles.roleText}>
                    <Text style={[styles.roleTitle, role === 'user' && styles.roleTitleActive]}>Athlete / User</Text>
                    <Text style={styles.roleDesc}>Track workouts, diet & progress</Text>
                  </View>
                  {role === 'user' && <View style={styles.dot} />}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.roleCard, role === 'trainer' && styles.cardSelected, pressed && role !== 'trainer' && styles.cardHover]}
                  onPress={() => setRole('trainer')}>
                  <View style={[styles.roleIconWrap, role === 'trainer' && styles.roleIconWrapActive]}>
                    <Trophy size={28} color={role === 'trainer' ? '#fff' : T.textMuted} />
                  </View>
                  <View style={styles.roleText}>
                    <Text style={[styles.roleTitle, role === 'trainer' && styles.roleTitleActive]}>Personal Trainer</Text>
                    <Text style={styles.roleDesc}>Manage clients and assign plans</Text>
                  </View>
                  {role === 'trainer' && <View style={styles.dot} />}
                </Pressable>
              </View>
            )}

            {/* Step 3 — Training style */}
            {step === 3 && (
              <View>
                <Text style={styles.stepTitle}>Training style?</Text>
                <Text style={styles.stepSub}>We'll personalise your workout plan</Text>

                <View style={styles.fitGrid}>
                  {FITNESS_CARDS.map(({ key, label, Icon }) => (
                    <Pressable
                      key={key}
                      style={({ pressed }) => [
                        styles.fitCard,
                        fitnessType === key && styles.cardSelected,
                        pressed && fitnessType !== key && styles.cardHover,
                      ]}
                      onPress={() => setFitnessType(key)}>
                      <Icon size={34} color={fitnessType === key ? T.primary : T.textMuted} />
                      <Text style={[styles.fitLabel, fitnessType === key && styles.fitLabelActive]}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

          </Animated.View>

          {err ? <Text style={styles.errorText}>{err}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryBtn, busy && styles.btnDisabled]}
            disabled={busy}
            onPress={goNext}
            activeOpacity={0.85}>
            {busy
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>{step === totalSteps ? 'Create Account' : 'Continue'}</Text>}
          </TouchableOpacity>

          {step === 1 && (
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/login" asChild>
                <TouchableOpacity><Text style={styles.linkText}>Sign In</Text></TouchableOpacity>
              </Link>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.background },
  safeTop: { backgroundColor: T.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: T.spacing.md, paddingBottom: T.spacing.xxl },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: T.spacing.lg, marginBottom: T.spacing.md },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: T.text, fontSize: T.fontSize.lg, fontWeight: T.fontWeight.semibold },

  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: T.spacing.xl },
  pill: { height: 6, borderRadius: 3 },
  pillDone: { width: 24, backgroundColor: T.primaryLight },
  pillActive: { width: 36, backgroundColor: T.primary },
  pillInactive: { width: 24, backgroundColor: T.border },

  stepTitle: { color: T.text, fontSize: T.fontSize.xxl, fontWeight: T.fontWeight.bold, marginBottom: T.spacing.xs },
  stepSub: { color: T.textMuted, fontSize: T.fontSize.sm, marginBottom: T.spacing.xl },

  label: { color: T.textMuted, fontSize: T.fontSize.sm, fontWeight: T.fontWeight.medium, marginBottom: T.spacing.xs },
  input: {
    backgroundColor: T.surface, borderWidth: 1.5, borderColor: T.border, borderRadius: T.radius.md,
    paddingHorizontal: T.spacing.md, paddingVertical: 13, color: T.text, fontSize: T.fontSize.md, marginBottom: T.spacing.md,
  },

  // Shared card state
  cardSelected: { borderColor: T.primary, backgroundColor: '#EFF9FF' },
  cardHover: { borderColor: T.primaryLight, transform: [{ scale: 0.98 }] },

  // Role cards
  roleCard: {
    flexDirection: 'row', alignItems: 'center', gap: T.spacing.md,
    backgroundColor: T.surface, borderWidth: 2, borderColor: T.border,
    borderRadius: 20, padding: T.spacing.lg, marginBottom: T.spacing.md,
  },
  roleIconWrap: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: T.card, justifyContent: 'center', alignItems: 'center',
  },
  roleIconWrapActive: { backgroundColor: T.primary },
  roleText: { flex: 1 },
  roleTitle: { color: T.text, fontSize: T.fontSize.lg, fontWeight: T.fontWeight.semibold, marginBottom: 2 },
  roleTitleActive: { color: T.primaryDark },
  roleDesc: { color: T.textMuted, fontSize: T.fontSize.sm },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: T.primary },

  // Fitness grid
  fitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: T.spacing.md },
  fitCard: {
    width: '47%', aspectRatio: 1,
    backgroundColor: T.surface, borderWidth: 2, borderColor: T.border,
    borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: T.spacing.sm,
  },
  fitLabel: { color: T.textMuted, fontSize: T.fontSize.sm, fontWeight: T.fontWeight.medium },
  fitLabelActive: { color: T.primaryDark, fontWeight: T.fontWeight.semibold },

  errorText: { color: T.error, fontSize: T.fontSize.sm, textAlign: 'center', marginBottom: T.spacing.sm },
  primaryBtn: {
    backgroundColor: T.primary, borderRadius: T.radius.full,
    paddingVertical: 15, alignItems: 'center', marginTop: T.spacing.sm, marginBottom: T.spacing.md,
  },
  primaryBtnText: { color: '#fff', fontSize: T.fontSize.md, fontWeight: T.fontWeight.semibold },
  btnDisabled: { opacity: 0.5 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: T.spacing.xs },
  footerText: { color: T.textMuted, fontSize: T.fontSize.sm },
  linkText: { color: T.primary, fontSize: T.fontSize.sm, fontWeight: T.fontWeight.semibold },
});
