import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';

/**
 * Metro resolves `@firebase/auth` to the RN build, which includes
 * `getReactNativePersistence`. `firebase/auth` typings are web-first and omit it.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getReactNativePersistence } = require('@firebase/auth') as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => unknown;
};

function readConfig(): FirebaseOptions | null {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim();
  const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  const messagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim();
  const measurementId = process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim();
  if (!apiKey || !authDomain || !projectId || !appId) return null;
  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    ...(measurementId ? { measurementId } : {}),
  };
}

let authSingleton: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (authSingleton) return authSingleton;
  const config = readConfig();
  if (!config) {
    throw new Error('Missing Firebase web config env vars (see .env.example)');
  }
  const app = getApps().length ? getApp() : initializeApp(config);
  try {
    authSingleton = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    } as Parameters<typeof initializeAuth>[1]);
  } catch {
    authSingleton = getAuth(app);
  }
  return authSingleton;
}

export function isFirebaseConfigured(): boolean {
  return readConfig() !== null;
}
