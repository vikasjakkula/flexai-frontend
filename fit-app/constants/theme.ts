import { Platform } from 'react-native';

export const T = {
  // Colors — white background, sky blue accent
  primary: '#38BDF8',
  primaryLight: '#7DD3FC',
  primaryDark: '#0284C7',

  accent: '#38BDF8',
  accentLight: '#7DD3FC',
  accentDark: '#0284C7',

  white: '#FFFFFF',
  black: '#000000',

  background: '#FFFFFF',
  surface: '#F1F5F9',
  card: '#F8FAFC',
  border: '#E2E8F0',

  text: '#1E293B',
  textMuted: '#64748B',
  textDim: '#94A3B8',

  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  // Slightly smaller than before
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  fontFamily: {
    regular: 'Outfit_400Regular',
    medium: 'Outfit_500Medium',
    semibold: 'Outfit_600SemiBold',
    bold: 'Outfit_700Bold',
    mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
} as const;

export const Colors = {
  light: {
    text: T.text,
    background: T.background,
    tint: T.primary,
    icon: T.textMuted,
    tabIconDefault: T.textDim,
    tabIconSelected: T.primary,
  },
  dark: {
    text: T.text,
    background: T.background,
    tint: T.primary,
    icon: T.textMuted,
    tabIconDefault: T.textDim,
    tabIconSelected: T.primary,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
