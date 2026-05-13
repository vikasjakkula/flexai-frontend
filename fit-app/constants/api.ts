import { Platform } from 'react-native';

const loopback = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

/** Base URL for the Express catalog server (default port 4000). */
export function getApiBaseUrl(): string {
  let fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!fromEnv) return `http://${loopback}:4000`;
  fromEnv = fromEnv.replace(/\/$/, '');
  // ANDROID EMULATOR ONLY: localhost in env is the emulator itself, not your dev machine — use loopback tunnel.
  if (Platform.OS === 'android' && /localhost|127\.0\.0\.1/i.test(fromEnv)) {
    return fromEnv.replace(/localhost|127\.0\.0\.1/i, '10.0.2.2');
  }
  return fromEnv;
}
