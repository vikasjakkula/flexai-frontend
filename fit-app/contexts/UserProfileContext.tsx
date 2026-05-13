import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  role: 'user' | 'trainer';
  fitnessType: 'gym' | 'cardio' | 'yoga' | 'calisthenics' | 'weightlifter' | null;
  // Pre-login / onboarding attributes (optional for backward compatibility)
  age?: number | null;
  gender?: 'male' | 'female' | 'other' | null;
  heightCm?: number | null;
  weightKg?: number | null;
  workoutTypes?: Array<'gym' | 'cardio' | 'yoga' | 'calisthenics'>;
  goals: Array<'weight_loss' | 'muscle_gain' | 'endurance' | 'general_fitness'>;
  level: 'beginner' | 'intermediate' | 'advanced';
  points: number;
  streak: number;
  badges: string[];
  onboardingComplete: boolean;
  assignedTrainerId: string | null;
};

export type PreLoginProfileDraft = {
  name: string;
  age: string; // keep as string for TextInput UX
  gender: 'male' | 'female' | 'other' | null;
  heightCm: string;
  weightKg: string;
  workoutTypes: Array<'gym' | 'cardio' | 'yoga' | 'calisthenics'>;
  preLoginComplete: boolean;
};

type ProfileCtx = {
  profile: UserProfile | null;
  draft: PreLoginProfileDraft | null;
  loading: boolean;
  saveProfile: (p: Partial<UserProfile>) => Promise<void>;
  saveDraft: (d: Partial<PreLoginProfileDraft>) => Promise<void>;
  clearProfile: () => Promise<void>;
  clearDraft: () => Promise<void>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = '@fitapp_profile';
const DRAFT_KEY = '@fitapp_profile_draft';

export function defaultProfile(uid: string, email: string): UserProfile {
  return {
    uid,
    name: '',
    email,
    role: 'user',
    fitnessType: null,
    age: null,
    gender: null,
    heightCm: null,
    weightKg: null,
    workoutTypes: [],
    goals: [],
    level: 'beginner',
    points: 0,
    streak: 0,
    badges: [],
    onboardingComplete: false,
    assignedTrainerId: null,
  };
}

export function defaultDraft(): PreLoginProfileDraft {
  return {
    name: '',
    age: '',
    gender: null,
    heightCm: '',
    weightKg: '',
    workoutTypes: [],
    preLoginComplete: false,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const Ctx = createContext<ProfileCtx | undefined>(undefined);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [draft, setDraft] = useState<PreLoginProfileDraft | null>(null);
  const [loading, setLoading] = useState(true);

  // Load persisted profile on mount
  useEffect(() => {
    (async () => {
      try {
        const [rawProfile, rawDraft] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(DRAFT_KEY),
        ]);

        if (rawProfile) setProfile(JSON.parse(rawProfile) as UserProfile);
        if (rawDraft) setDraft(JSON.parse(rawDraft) as PreLoginProfileDraft);
      } catch {
        // If parsing fails, treat as no profile
        setProfile(null);
        setDraft(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveProfile = useCallback(async (partial: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = prev ? { ...prev, ...partial } : ({ ...partial } as UserProfile);
      // Persist asynchronously (fire-and-forget inside setState callback isn't ideal
      // but we trigger the async work outside via the outer async function)
      return next;
    });

    // Re-read state outside of setState to get the latest merged value
    setProfile((prev) => {
      const next = prev ? { ...prev, ...partial } : ({ ...partial } as UserProfile);
      // Persist to AsyncStorage
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
        // silently fail — next app open will re-fetch from server
      });
      return next;
    });
  }, []);

  const saveDraft = useCallback(async (partial: Partial<PreLoginProfileDraft>) => {
    setDraft((prev) => {
      const base = prev ?? defaultDraft();
      const next = { ...base, ...partial };
      return next;
    });

    setDraft((prev) => {
      const base = prev ?? defaultDraft();
      const next = { ...base, ...partial };
      AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(next)).catch(() => {
        // ignore
      });
      return next;
    });
  }, []);

  const clearProfile = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  }, []);

  const clearDraft = useCallback(async () => {
    await AsyncStorage.removeItem(DRAFT_KEY);
    setDraft(null);
  }, []);

  const value = useMemo<ProfileCtx>(
    () => ({ profile, draft, loading, saveProfile, saveDraft, clearProfile, clearDraft }),
    [profile, draft, loading, saveProfile, saveDraft, clearProfile, clearDraft],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUserProfile(): ProfileCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useUserProfile must be used inside UserProfileProvider');
  return v;
}
