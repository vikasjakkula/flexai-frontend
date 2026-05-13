import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'data');

// ─── File paths ───────────────────────────────────────────────────────────────

const dietsPath       = path.join(DATA, 'diets.json');
const exercisesPath   = path.join(DATA, 'exercises.json');
const assignmentsPath = path.join(DATA, 'assignments-store.json');
const messagesPath    = path.join(DATA, 'messages.json');
const usersPath       = path.join(DATA, 'users.json');
const progressPath    = path.join(DATA, 'progress.json');

const PORT = Number(process.env.PORT || 4000);

// ─── Generic helpers ──────────────────────────────────────────────────────────

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// ─── Domain-specific load/save helpers ───────────────────────────────────────

function loadAssignments() {
  try { return readJson(assignmentsPath); } catch { return {}; }
}
function writeAssignments(map) {
  writeJson(assignmentsPath, map);
}

function loadMessages() {
  try { return readJson(messagesPath); } catch { return {}; }
}
function writeMessages(map) {
  writeJson(messagesPath, map);
}

function loadUsers() {
  try { return readJson(usersPath); } catch { return {}; }
}
function writeUsers(map) {
  writeJson(usersPath, map);
}

function loadProgress() {
  try { return readJson(progressPath); } catch { return {}; }
}
function writeProgress(map) {
  writeJson(progressPath, map);
}

// ─── App setup ────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// ─── Diets ────────────────────────────────────────────────────────────────────

/** GET /api/diets — list diets; optional ?q=search */
app.get('/api/diets', (req, res) => {
  const { items } = readJson(dietsPath);
  const q = String(req.query.q ?? '').trim().toLowerCase();
  const list = !q
    ? items
    : items.filter((d) =>
        `${d.name} ${d.summary} ${(d.foods ?? []).join(' ')} ${(d.tags ?? []).join(' ')}`
          .toLowerCase()
          .includes(q),
      );
  res.json({ items: list });
});

// ─── Exercises ────────────────────────────────────────────────────────────────

/** GET /api/exercises — full catalog tree (muscle groups → types → exercises) */
app.get('/api/exercises', (_req, res) => {
  const data = readJson(exercisesPath);
  res.json({ muscleGroups: data.muscleGroups });
});

/** GET /api/exercises/search — flat search; optional ?q=dumbbell */
app.get('/api/exercises/search', (req, res) => {
  const q = String(req.query.q ?? '').trim().toLowerCase();
  const data = readJson(exercisesPath);
  const hits = [];
  for (const mg of data.muscleGroups) {
    for (const t of mg.types) {
      for (const ex of t.exercises) {
        const haystack = `${mg.name} ${t.name} ${ex.name} ${ex.notes ?? ''}`.toLowerCase();
        if (!q || haystack.includes(q)) {
          hits.push({
            id: ex.id,
            name: ex.name,
            muscleGroupId: mg.id,
            muscleGroupName: mg.name,
            typeId: t.id,
            typeName: t.name,
            notes: ex.notes,
          });
        }
      }
    }
  }
  res.json({ items: hits });
});

// ─── Assignments ──────────────────────────────────────────────────────────────

/** GET /api/assignments/:userId */
app.get('/api/assignments/:userId', (req, res) => {
  const map = loadAssignments();
  const list = map[req.params.userId] ?? [];
  res.json({ items: list });
});

/**
 * POST /api/assignments
 * Body: { targetUserId, diets: [{ id, name }], exercises: [{ id, name, typeName, muscleGroupName }] }
 */
app.post('/api/assignments', (req, res) => {
  const { targetUserId, diets = [], exercises = [] } = req.body ?? {};
  if (!targetUserId || typeof targetUserId !== 'string') {
    res.status(400).json({ error: 'targetUserId required (Firebase uid string)' });
    return;
  }
  const map = loadAssignments();
  const prev = map[targetUserId] ?? [];
  const entry = {
    id: `asg-${Date.now()}`,
    createdAt: new Date().toISOString(),
    diets,
    exercises,
  };
  map[targetUserId] = [...prev, entry];
  writeAssignments(map);
  res.status(201).json({ assignment: entry });
});

// ─── Users ────────────────────────────────────────────────────────────────────

/** GET /api/users — all users (trainer client list) */
app.get('/api/users', (_req, res) => {
  const map = loadUsers();
  res.json({ users: Object.values(map) });
});

/** GET /api/users/:uid — single user or empty object */
app.get('/api/users/:uid', (req, res) => {
  const map = loadUsers();
  const user = map[req.params.uid] ?? null;
  res.json(user ?? {});
});

/**
 * POST /api/users/:uid — upsert user profile
 * Body: { name, email, role, assignedTrainerId }
 */
app.post('/api/users/:uid', (req, res) => {
  const { uid } = req.params;
  const { name, email, role, assignedTrainerId } = req.body ?? {};
  const map = loadUsers();
  const existing = map[uid] ?? { uid };
  const updated = {
    ...existing,
    uid,
    ...(name !== undefined && { name }),
    ...(email !== undefined && { email }),
    ...(role !== undefined && { role }),
    ...(assignedTrainerId !== undefined && { assignedTrainerId }),
  };
  map[uid] = updated;
  writeUsers(map);
  res.status(200).json(updated);
});

// ─── Messages ─────────────────────────────────────────────────────────────────

/**
 * GET /api/messages/:conversationId — sorted by timestamp ascending
 *
 * Conversation ID convention: use the helper buildConversationId(uidA, uidB)
 * which sorts UIDs lexicographically — but clients can also pass a pre-built ID.
 */
app.get('/api/messages/:conversationId', (req, res) => {
  const map = loadMessages();
  const msgs = (map[req.params.conversationId] ?? []).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  res.json({ messages: msgs });
});

/**
 * POST /api/messages/:conversationId — send a message
 * Body: { senderId, senderName, text }
 */
app.post('/api/messages/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const { senderId, senderName, text } = req.body ?? {};
  if (!senderId || !text) {
    res.status(400).json({ error: 'senderId and text are required' });
    return;
  }
  const map = loadMessages();
  const prev = map[conversationId] ?? [];
  const message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    senderId,
    senderName: senderName ?? '',
    text,
    timestamp: new Date().toISOString(),
  };
  map[conversationId] = [...prev, message];
  writeMessages(map);
  res.status(201).json(message);
});

// ─── Progress ─────────────────────────────────────────────────────────────────

/** GET /api/progress/:uid — full progress history for a user */
app.get('/api/progress/:uid', (req, res) => {
  const map = loadProgress();
  const entries = map[req.params.uid] ?? [];
  res.json({ progress: entries });
});

/**
 * POST /api/progress/:uid — append a progress entry for today
 * Body: { workoutsCompleted, calories, points, streak }
 */
app.post('/api/progress/:uid', (req, res) => {
  const { uid } = req.params;
  const { workoutsCompleted = 0, calories = 0, points = 0, streak = 0 } = req.body ?? {};
  const map = loadProgress();
  const prev = map[uid] ?? [];
  const entry = {
    id: `prog-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    workoutsCompleted,
    calories,
    points,
    streak,
  };
  map[uid] = [...prev, entry];
  writeProgress(map);
  res.status(201).json(entry);
});

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ ok: true, port: PORT });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Fit API listening on http://localhost:${PORT}`);
});
