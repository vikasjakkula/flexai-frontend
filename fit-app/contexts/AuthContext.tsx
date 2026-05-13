import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
  type User,
} from 'firebase/auth';

// Define the AuthCtx type
type AuthCtx = {
  user: User | null;
  loading: boolean;
  firebaseReady: boolean;
  googleConfigured: boolean;
  googleRedirectUri: string;
  signInWithGoogle: () => Promise<void>;
  signOutApp: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '';
  const googleRedirectUri = makeRedirectUri({
    // Keep scheme stable for native builds; for web dev this becomes http://localhost:8081/...
    scheme: 'myapp',
  });

  WebBrowser.maybeCompleteAuthSession();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: webClientId,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    redirectUri: googleRedirectUri,
  });

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const firebaseReady = isFirebaseConfigured();
  const googleConfigured = !!webClientId;

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, [firebaseReady]);

  useEffect(() => {
    async function consume() {
      if (response?.type !== 'success' || !firebaseReady) return;
      const idToken = response.params.id_token;
      if (!idToken) return;
      const auth = getFirebaseAuth();
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    }
    void consume();
  }, [response, firebaseReady]);

  const signInWithGoogle = useCallback(async () => {
    if (!firebaseReady || !googleConfigured || !request) {
      throw new Error('Firebase or Google OAuth client ID not configured (.env)');
    }
    await promptAsync();
  }, [firebaseReady, googleConfigured, promptAsync, request]);

  const signOutApp = useCallback(async () => {
    if (!firebaseReady) return;
    const auth = getFirebaseAuth();
    await signOut(auth);
  }, [firebaseReady]);

  const value = useMemo(
    () => ({
      user,
      loading,
      firebaseReady,
      googleConfigured,
      googleRedirectUri,
      signInWithGoogle,
      signOutApp,
    }),
    [user, loading, firebaseReady, googleConfigured, googleRedirectUri, signInWithGoogle, signOutApp],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be inside AuthProvider');
  return v;
}
