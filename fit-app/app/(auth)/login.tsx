import { T } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getFirebaseAuth } from '@/lib/firebase';
import { Flame } from 'lucide-react-native';
import { Link, Redirect } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { user, loading, firebaseReady, googleConfigured, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const emailTrim = useMemo(() => email.trim(), [email]);

  if (loading) return null;
  if (user) return <Redirect href="/" />;

  const loginEmail = async () => {
    if (!emailTrim || !password) { setErr('Please enter your email and password.'); return; }
    setBusy(true);
    setErr(null);
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, emailTrim, password);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    setErr(null);
    try {
      await signInWithGoogle();
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

          {/* Logo */}
          <View style={styles.logoArea}>
            <View style={styles.logoCircle}>
              <Flame color={T.primary} size={32} />
            </View>
            <Text style={styles.logoText}>FitSync</Text>
            <Text style={styles.logoSub}>Your personal fitness companion</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={T.textDim}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={T.textDim}
              secureTextEntry
              style={styles.input}
            />

            {err ? <Text style={styles.errorText}>{err}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryBtn, (!firebaseReady || busy) && styles.btnDisabled]}
              disabled={!firebaseReady || busy}
              onPress={loginEmail}
              activeOpacity={0.85}>
              {busy
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>Sign In</Text>}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google button — always shown */}
            <Pressable
              style={({ pressed }) => [styles.googleBtn, (busy || !googleConfigured) && styles.btnDisabled, pressed && styles.googleBtnPressed]}
              disabled={busy || !googleConfigured}
              onPress={handleGoogle}>
              {/* Google G icon */}
              <View style={styles.googleIconWrap}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>
                {googleConfigured ? 'Continue with Google' : 'Google (not configured)'}
              </Text>
            </Pressable>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Link href="/register" asChild>
                <TouchableOpacity><Text style={styles.linkText}>Sign Up</Text></TouchableOpacity>
              </Link>
            </View>
          </View>
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

  logoArea: { alignItems: 'center', paddingTop: T.spacing.xxl, paddingBottom: T.spacing.xl },
  logoCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#EFF9FF', justifyContent: 'center', alignItems: 'center',
    marginBottom: T.spacing.sm,
    borderWidth: 1.5, borderColor: T.primaryLight,
  },
  logoText: { color: T.text, fontSize: T.fontSize.xxxl, fontWeight: T.fontWeight.bold, letterSpacing: -0.5, marginBottom: 4 },
  logoSub: { color: T.textMuted, fontSize: T.fontSize.sm },

  card: {
    backgroundColor: T.surface, borderRadius: 24,
    padding: T.spacing.lg, borderWidth: 1.5, borderColor: T.border,
  },
  cardTitle: { color: T.text, fontSize: T.fontSize.xl, fontWeight: T.fontWeight.bold, marginBottom: T.spacing.lg },

  label: { color: T.textMuted, fontSize: T.fontSize.sm, fontWeight: T.fontWeight.medium, marginBottom: T.spacing.xs },
  input: {
    backgroundColor: T.white, borderWidth: 1.5, borderColor: T.border, borderRadius: T.radius.md,
    paddingHorizontal: T.spacing.md, paddingVertical: 13, color: T.text, fontSize: T.fontSize.md, marginBottom: T.spacing.md,
  },

  errorText: { color: T.error, fontSize: T.fontSize.sm, marginBottom: T.spacing.sm },

  primaryBtn: {
    backgroundColor: T.primary, borderRadius: T.radius.full,
    paddingVertical: 15, alignItems: 'center', marginBottom: T.spacing.md,
  },
  primaryBtnText: { color: '#fff', fontSize: T.fontSize.md, fontWeight: T.fontWeight.semibold },
  btnDisabled: { opacity: 0.45 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: T.spacing.sm, marginBottom: T.spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: T.border },
  dividerText: { color: T.textMuted, fontSize: T.fontSize.xs },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: T.spacing.sm, borderWidth: 1.5, borderColor: T.border, borderRadius: T.radius.full,
    paddingVertical: 13, backgroundColor: T.white, marginBottom: T.spacing.md,
  },
  googleBtnPressed: { borderColor: T.primary, backgroundColor: '#EFF9FF' },
  googleIconWrap: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#4285F4', justifyContent: 'center', alignItems: 'center',
  },
  googleG: { color: '#fff', fontSize: 13, fontWeight: '700' },
  googleBtnText: { color: T.text, fontSize: T.fontSize.md, fontWeight: T.fontWeight.medium },

  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: T.spacing.xs },
  footerText: { color: T.textMuted, fontSize: T.fontSize.sm },
  linkText: { color: T.primary, fontSize: T.fontSize.sm, fontWeight: T.fontWeight.semibold },
});
