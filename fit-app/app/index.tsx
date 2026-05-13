import { T } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { Redirect } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { user, loading: authLoading, firebaseReady } = useAuth();
  const { profile, draft, loading: profileLoading, clearProfile } = useUserProfile();

  // If a different user logged in, wipe the stale profile so they re-onboard
  useEffect(() => {
    if (user && profile?.uid && profile.uid !== user.uid) {
      clearProfile();
    }
  }, [user, profile, clearProfile]);

  if (authLoading || profileLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: T.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={T.primary} />
      </View>
    );
  }

  if (!firebaseReady) return <Redirect href="/(user)" />;
  if (!user) {
    if (!draft?.preLoginComplete) return <Redirect href="/onboarding" />;
    return <Redirect href="/login" />;
  }
  if (!profile?.onboardingComplete) return <Redirect href="/register" />;
  if (profile.role === 'trainer') return <Redirect href="/(trainer)" />;
  return <Redirect href="/(user)" />;
}
