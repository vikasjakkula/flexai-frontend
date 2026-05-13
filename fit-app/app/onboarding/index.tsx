import { T } from '@/constants/theme';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, Bolt } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function OnboardingWelcome() {
  const router = useRouter();
  const { saveDraft } = useUserProfile();

  const start = async () => {
    await saveDraft({ preLoginComplete: false });
    router.push('/onboarding/name');
  };

  return (
    <LinearGradient colors={['#061A2D', '#04070B']} style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <View style={styles.logoCircle}>
            <Bolt color="#0EA5FF" size={30} />
          </View>
          <Text style={styles.title}>Welcome to FitLife</Text>
          <Text style={styles.sub}>
            Your personal fitness companion. Let's set up your profile to personalize your experience.
          </Text>
        </View>

        <Pressable style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]} onPress={start}>
          <Text style={styles.ctaText}>Get Started</Text>
          <ArrowRight size={18} color="#001018" />
        </Pressable>

        <Text style={styles.hint}>You can edit this later in Settings → Profile.</Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: T.spacing.lg, paddingBottom: T.spacing.xxl },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(14,165,255,0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(14,165,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: T.spacing.md,
  },
  title: { color: '#EAF6FF', fontSize: 30, fontWeight: T.fontWeight.bold, letterSpacing: -0.6, marginBottom: 10 },
  sub: { color: 'rgba(234,246,255,0.75)', fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 18 },

  cta: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0EA5FF',
    borderRadius: 999,
    paddingVertical: 16,
    marginTop: T.spacing.md,
    shadowColor: '#0EA5FF',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  ctaPressed: { transform: [{ scale: 0.99 }], opacity: 0.95 },
  ctaText: { color: '#001018', fontSize: 16, fontWeight: T.fontWeight.semibold },
  hint: { textAlign: 'center', color: 'rgba(234,246,255,0.55)', fontSize: 12, marginTop: T.spacing.md },
});

