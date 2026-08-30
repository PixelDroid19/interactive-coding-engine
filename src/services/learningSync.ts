import type { LearningEvidence, LearningProfile } from '../learning/types';
import { learningApiRequest } from './learningHttp';

const QUEUE_KEY = 'aula_learning_sync_v1';
const MAX_EVENTS = 300;

type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
type FeedbackKind = 'positive' | 'negative' | 'suggestion' | 'confusion';

type QueuedEvent = Readonly<{
  id: string;
  courseSlug: string;
  lessonKey?: string;
  type: string;
  occurredAt: string;
  payload?: Record<string, unknown>;
}>;

type QueuedProgress = Readonly<{
  courseSlug: string;
  lessonKey: string;
  status: ProgressStatus;
  playbackMs: number;
  score?: number;
}>;

type QueuedFeedback = Readonly<{
  id: string;
  courseSlug: string;
  lessonKey?: string;
  kind: FeedbackKind;
  message?: string;
}>;

type QueuedEvidence = Readonly<{
  fingerprint: string;
  id: string;
  courseSlug: string;
  itemKey: string;
  skillKey: string;
  capability: LearningEvidence['capability'];
  result: LearningEvidence['result'];
  source: LearningEvidence['source'] | 'agent';
  occurredAt: string;
}>;

export type ExerciseCompletion = Readonly<{
  response?: Record<string, unknown>;
  diagnostics?: Record<string, unknown>;
  score?: number;
}>;

type QueuedAttempt = Readonly<{
  id: string;
  courseSlug: string;
  itemKey: string;
  kind: 'challenge' | 'debugging' | 'exam' | 'project' | 'agent';
  result: 'success' | 'partial' | 'failure';
  score?: number;
  response?: Record<string, unknown>;
  diagnostics?: Record<string, unknown>;
  occurredAt: string;
}>;

type SyncQueue = {
  events: QueuedEvent[];
  progress: Record<string, QueuedProgress>;
  feedback: QueuedFeedback[];
  evidence: QueuedEvidence[];
  attempts: QueuedAttempt[];
  syncedEvidence: string[];
};

function emptyQueue(): SyncQueue {
  return { events: [], progress: {}, feedback: [], evidence: [], attempts: [], syncedEvidence: [] };
}

function loadQueue(): SyncQueue {
  try {
    const parsed = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? 'null') as Partial<SyncQueue> | null;
    if (!parsed || !Array.isArray(parsed.events) || !parsed.progress || !Array.isArray(parsed.feedback)) return emptyQueue();
    return {
      events: parsed.events.slice(-MAX_EVENTS),
      progress: parsed.progress,
      feedback: parsed.feedback.slice(-100),
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence.slice(-300) : [],
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts.slice(-100) : [],
      syncedEvidence: Array.isArray(parsed.syncedEvidence) ? parsed.syncedEvidence.slice(-500) : [],
    };
  } catch {
    return emptyQueue();
  }
}

function saveQueue(queue: SyncQueue): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

let flushTimer: ReturnType<typeof setTimeout> | undefined;
let flushScheduledAt = 0;
let activeFlush: Promise<boolean> | undefined;
let retryAttempt = 0;

function notify(status: 'syncing' | 'synced' | 'queued'): void {
  window.dispatchEvent(new CustomEvent('aula-learning-sync', { detail: { status } }));
}

function scheduleFlush(delayMs = 900): void {
  const scheduledAt = Date.now() + delayMs;
  if (flushTimer !== undefined && flushScheduledAt <= scheduledAt) return;
  if (flushTimer !== undefined) clearTimeout(flushTimer);
  flushScheduledAt = scheduledAt;
  flushTimer = setTimeout(() => {
    flushTimer = undefined;
    flushScheduledAt = 0;
    void flushLearningQueue();
  }, delayMs);
}

async function flushEvents(queue: SyncQueue): Promise<void> {
  if (queue.events.length === 0) return;
  const batch = queue.events.slice(0, 100);
  const response = await learningApiRequest('/v1/events/batch', { method: 'POST', body: JSON.stringify({ events: batch }) });
  if (!response.ok) throw new Error(`events HTTP ${response.status}`);
  queue.events.splice(0, batch.length);
  saveQueue(queue);
}

async function flushProgress(queue: SyncQueue): Promise<void> {
  for (const progress of Object.values(queue.progress).slice(0, 20)) {
    const response = await learningApiRequest(`/v1/progress/${encodeURIComponent(progress.lessonKey)}`, {
      method: 'PUT',
      body: JSON.stringify({ status: progress.status, playbackMs: progress.playbackMs, ...(progress.score !== undefined ? { score: progress.score } : {}) }),
    });
    if (!response.ok) throw new Error(`progress HTTP ${response.status}`);
    delete queue.progress[progress.lessonKey];
    saveQueue(queue);
  }
}

async function flushFeedback(queue: SyncQueue): Promise<void> {
  for (const feedback of queue.feedback.slice(0, 10)) {
    const response = await learningApiRequest('/v1/feedback', {
      method: 'POST',
      body: JSON.stringify({
        id: feedback.id,
        courseSlug: feedback.courseSlug,
        ...(feedback.lessonKey ? { lessonKey: feedback.lessonKey } : {}),
        kind: feedback.kind,
        ...(feedback.message ? { message: feedback.message } : {}),
      }),
    });
    if (!response.ok) throw new Error(`feedback HTTP ${response.status}`);
    queue.feedback = queue.feedback.filter((candidate) => candidate.id !== feedback.id);
    saveQueue(queue);
  }
}

async function flushEvidence(queue: SyncQueue): Promise<void> {
  if (queue.evidence.length === 0) return;
  const batch = queue.evidence.slice(0, 100);
  const response = await learningApiRequest('/v1/me/evidence/batch', {
    method: 'POST',
    body: JSON.stringify({
      evidence: batch.map(({ fingerprint: _fingerprint, ...event }) => event),
    }),
  });
  if (!response.ok) throw new Error(`evidence HTTP ${response.status}`);
  const fingerprints = new Set(batch.map((entry) => entry.fingerprint));
  queue.evidence = queue.evidence.filter((entry) => !fingerprints.has(entry.fingerprint));
  queue.syncedEvidence = [...new Set([...queue.syncedEvidence, ...fingerprints])].slice(-500);
  saveQueue(queue);
}

async function flushAttempts(queue: SyncQueue): Promise<void> {
  if (queue.attempts.length === 0) return;
  const batch = queue.attempts.slice(0, 50);
  const response = await learningApiRequest('/v1/me/attempts/batch', {
    method: 'POST', body: JSON.stringify({ attempts: batch }),
  });
  if (!response.ok) throw new Error(`attempts HTTP ${response.status}`);
  const ids = new Set(batch.map((attempt) => attempt.id));
  queue.attempts = queue.attempts.filter((attempt) => !ids.has(attempt.id));
  saveQueue(queue);
}

export async function flushLearningQueue(): Promise<boolean> {
  if (activeFlush) return activeFlush;
  activeFlush = (async () => {
    const queue = loadQueue();
    if (queue.events.length === 0 && Object.keys(queue.progress).length === 0 && queue.feedback.length === 0 && queue.evidence.length === 0 && queue.attempts.length === 0) return true;
    notify('syncing');
    try {
      await flushEvents(queue);
      await flushProgress(queue);
      await flushFeedback(queue);
      await flushEvidence(queue);
      await flushAttempts(queue);
      retryAttempt = 0;
      notify('synced');
      return true;
    } catch {
      retryAttempt += 1;
      notify('queued');
      if (retryAttempt <= 5 && navigator.onLine) scheduleFlush(Math.min(30_000, 1000 * 2 ** retryAttempt));
      return false;
    }
  })().finally(() => {
    activeFlush = undefined;
  });
  return activeFlush;
}

export function queueLearningEvent(courseSlug: string, lessonKey: string | undefined, type: string, payload?: Record<string, unknown>): void {
  const queue = loadQueue();
  queue.events.push({ id: crypto.randomUUID(), courseSlug, ...(lessonKey ? { lessonKey } : {}), type, occurredAt: new Date().toISOString(), ...(payload ? { payload } : {}) });
  queue.events = queue.events.slice(-MAX_EVENTS);
  saveQueue(queue);
  scheduleFlush();
}

export function queueLessonProgress(courseSlug: string, lessonKey: string, status: ProgressStatus, playbackMs: number, score?: number): void {
  const queue = loadQueue();
  const current = queue.progress[lessonKey];
  queue.progress[lessonKey] = {
    courseSlug,
    lessonKey,
    status: current?.status === 'completed' ? 'completed' : status,
    playbackMs: Math.max(current?.playbackMs ?? 0, Math.max(0, Math.round(playbackMs))),
    ...(score !== undefined ? { score } : current?.score !== undefined ? { score: current.score } : {}),
  };
  saveQueue(queue);
  scheduleFlush(status === 'completed' ? 100 : 15_000);
}

export async function submitLessonFeedback(courseSlug: string, lessonKey: string, kind: FeedbackKind, message?: string): Promise<'sent' | 'queued'> {
  const queue = loadQueue();
  queue.feedback.push({ id: crypto.randomUUID(), courseSlug, lessonKey, kind, ...(message ? { message } : {}) });
  saveQueue(queue);
  return await flushLearningQueue() ? 'sent' : 'queued';
}

export function queueLearningProfileEvidence(profile: LearningProfile, courseSlugById: Record<string, string>): void {
  const queue = loadQueue();
  const known = new Set([...queue.syncedEvidence, ...queue.evidence.map((entry) => entry.fingerprint)]);
  for (const evidence of profile.evidence) {
    if (known.has(evidence.id)) continue;
    if (evidence.timestamp < Date.now() - 365 * 86_400_000 || evidence.timestamp > Date.now() + 5 * 60_000) continue;
    const courseSlug = courseSlugById[evidence.courseId] ?? evidence.courseId.replace(/^course-/, '');
    queue.evidence.push({
      fingerprint: evidence.id,
      id: crypto.randomUUID(),
      courseSlug,
      itemKey: evidence.itemId,
      skillKey: evidence.skillId,
      capability: evidence.capability,
      result: evidence.result,
      source: evidence.source,
      occurredAt: new Date(evidence.timestamp).toISOString(),
    });
    known.add(evidence.id);
  }
  queue.evidence = queue.evidence.slice(-300);
  saveQueue(queue);
  scheduleFlush(250);
}

export function queueExerciseAttempt(
  courseSlug: string,
  itemKey: string,
  kind: QueuedAttempt['kind'],
  result: QueuedAttempt['result'],
  completion: ExerciseCompletion = {},
): void {
  const queue = loadQueue();
  const safe = (value: Record<string, unknown> | undefined, maximum: number): Record<string, unknown> | undefined => {
    if (!value) return undefined;
    try { return JSON.stringify(value).length <= maximum ? value : { omitted: true, reason: 'payload-too-large' }; }
    catch { return { omitted: true, reason: 'not-serializable' }; }
  };
  const safeResponse = safe(completion.response, 60_000);
  const safeDiagnostics = safe(completion.diagnostics, 28_000);
  queue.attempts.push({
    id: crypto.randomUUID(), courseSlug, itemKey, kind, result,
    ...(completion.score !== undefined ? { score: completion.score } : {}),
    ...(safeResponse ? { response: safeResponse } : {}),
    ...(safeDiagnostics ? { diagnostics: safeDiagnostics } : {}),
    occurredAt: new Date().toISOString(),
  });
  queue.attempts = queue.attempts.slice(-100);
  saveQueue(queue);
  scheduleFlush(100);
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => scheduleFlush(100));
  window.addEventListener('pagehide', () => void flushLearningQueue());
}
