import { getApiBaseUrl } from '@/constants/api';
import type { AssignmentPayload, DietItem, ExerciseSearchHit, MuscleGroup } from '@/types/catalog';

// ─── Additional domain types ──────────────────────────────────────────────────

export type UserProfileData = {
  uid: string;
  name: string;
  email: string;
  role: string;
  assignedTrainerId?: string | null;
};

export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
};

export type ProgressEntry = {
  id: string;
  date: string;
  workoutsCompleted: number;
  calories: number;
  points: number;
  streak: number;
};

// ─── Internal fetch helper ────────────────────────────────────────────────────

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

// ─── Diets ────────────────────────────────────────────────────────────────────

export async function fetchDiets(q?: string): Promise<DietItem[]> {
  const query = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
  const data = await json<{ items: DietItem[] }>(`/api/diets${query}`);
  return data.items;
}

// ─── Exercises ────────────────────────────────────────────────────────────────

export async function fetchExerciseTree(): Promise<MuscleGroup[]> {
  const data = await json<{ muscleGroups: MuscleGroup[] }>('/api/exercises');
  return data.muscleGroups;
}

export async function searchExercises(q?: string): Promise<ExerciseSearchHit[]> {
  const query = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
  const data = await json<{ items: ExerciseSearchHit[] }>(`/api/exercises/search${query}`);
  return data.items;
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export async function fetchAssignments(userId: string): Promise<AssignmentPayload[]> {
  const data = await json<{ items: AssignmentPayload[] }>(
    `/api/assignments/${encodeURIComponent(userId)}`,
  );
  return data.items;
}

export async function postAssignment(body: {
  targetUserId: string;
  diets: { id: string; name: string }[];
  exercises: {
    id: string;
    name: string;
    typeName: string;
    muscleGroupName: string;
  }[];
}): Promise<AssignmentPayload> {
  const data = await json<{ assignment: AssignmentPayload }>('/api/assignments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return data.assignment;
}

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * Fetch a single user profile by Firebase UID.
 * Returns null if the user does not exist yet (server returns empty object {}).
 */
export async function getUser(uid: string): Promise<UserProfileData | null> {
  const data = await json<UserProfileData | Record<string, never>>(
    `/api/users/${encodeURIComponent(uid)}`,
  );
  // Server returns {} when user not found
  if (!data || !('uid' in data)) return null;
  return data as UserProfileData;
}

/**
 * Upsert (create or update) a user profile on the server.
 */
export async function upsertUser(
  uid: string,
  data: Partial<UserProfileData>,
): Promise<UserProfileData> {
  return json<UserProfileData>(`/api/users/${encodeURIComponent(uid)}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Fetch all users — used by trainers to see their client list.
 */
export async function getAllUsers(): Promise<UserProfileData[]> {
  const data = await json<{ users: UserProfileData[] }>('/api/users');
  return data.users;
}

// ─── Messages ─────────────────────────────────────────────────────────────────

/**
 * Fetch all messages for a conversation, sorted oldest-first.
 * Convention: conversationId = sorted([userId, trainerId]).join('_')
 */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const data = await json<{ messages: Message[] }>(
    `/api/messages/${encodeURIComponent(conversationId)}`,
  );
  return data.messages;
}

/**
 * Send a message to a conversation.
 */
export async function sendMessage(
  conversationId: string,
  body: { senderId: string; senderName: string; text: string },
): Promise<Message> {
  return json<Message>(`/api/messages/${encodeURIComponent(conversationId)}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ─── Progress ─────────────────────────────────────────────────────────────────

/**
 * Fetch all progress entries for a user.
 */
export async function getProgress(uid: string): Promise<ProgressEntry[]> {
  const data = await json<{ progress: ProgressEntry[] }>(
    `/api/progress/${encodeURIComponent(uid)}`,
  );
  return data.progress;
}

/**
 * Append a new progress entry for today.
 */
export async function addProgress(
  uid: string,
  entry: {
    workoutsCompleted: number;
    calories: number;
    points: number;
    streak: number;
  },
): Promise<ProgressEntry> {
  return json<ProgressEntry>(`/api/progress/${encodeURIComponent(uid)}`, {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

// ─── Conversation ID helper (mirrors server logic) ────────────────────────────

/**
 * Build a canonical conversation ID by sorting two UIDs lexicographically.
 * Use this whenever opening a chat between a user and their trainer.
 */
export function buildConversationId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}
