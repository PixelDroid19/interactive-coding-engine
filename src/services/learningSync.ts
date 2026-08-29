const DEFAULT_API_URL = 'https://api-production-df85c.up.railway.app';
const API_URL = (import.meta.env.VITE_LEARNING_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
const ACTOR_KEY = 'aula_anonymous_actor_v1';
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

type SyncQueue = {
  events: QueuedEvent[];
  progress: Record<string, QueuedProgress>;
  feedback: QueuedFeedback[];
};

function emptyQueue(): SyncQueue {
  return { events: [], progress: {}, feedback: [] };
}

function actorId(): string {
  const existing = localStorage.getItem(ACTOR_KEY);
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(ACTOR_KEY, created);
  return created;
}

function loadQueue(): SyncQueue {
  try {
    const parsed = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? 'null') as Partial<SyncQueue> | null;
    if (!parsed || !Array.isArray(parsed.events) || !parsed.progress || !Array.isArray(parsed.feedback)) return emptyQueue();
    return { events: parsed.events.slice(-MAX_EVENTS), progress: parsed.progress, feedback: parsed.feedback.slice(-100) };
  } catch {
    return emptyQueue();
  }
}

function saveQueue(queue: SyncQueue): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

let flushTimer: ReturnType<typeof setTimeout> | undefined;
let activeFlush: Promise<boolean> | undefined;
let retryAttempt = 0;

function notify(status: 'syncing' | 'synced' | 'queued'): void {
  window.dispatchEvent(new CustomEvent('aula-learning-sync', { detail: { status } }));
}

function scheduleFlush(delayMs = 900): void {
  if (flushTimer !== undefined) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = undefined;
    void flushLearningQueue();
  }, delayMs);
}

async function apiRequest(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-anonymous-id': actorId(),
      ...init.headers,
    },
    signal: AbortSignal.timeout(10_000),
  });
}

async function flushEvents(queue: SyncQueue): Promise<void> {
  if (queue.events.length === 0) return;
  const batch = queue.events.slice(0, 100);
  const response = await apiRequest('/v1/events/batch', { method: 'POST', body: JSON.stringify({ events: batch }) });
  if (!response.ok) throw new Error(`events HTTP ${response.status}`);
  queue.events.splice(0, batch.length);
  saveQueue(queue);
}

async function flushProgress(queue: SyncQueue): Promise<void> {
  for (const progress of Object.values(queue.progress).slice(0, 20)) {
    const response = await apiRequest(`/v1/progress/${encodeURIComponent(progress.lessonKey)}`, {
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
    const response = await apiRequest('/v1/feedback', {
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

export async function flushLearningQueue(): Promise<boolean> {
  if (activeFlush) return activeFlush;
  activeFlush = (async () => {
    const queue = loadQueue();
    if (queue.events.length === 0 && Object.keys(queue.progress).length === 0 && queue.feedback.length === 0) return true;
    notify('syncing');
    try {
      await flushEvents(queue);
      await flushProgress(queue);
      await flushFeedback(queue);
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
  scheduleFlush(status === 'completed' ? 100 : 1000);
}

export async function submitLessonFeedback(courseSlug: string, lessonKey: string, kind: FeedbackKind, message?: string): Promise<'sent' | 'queued'> {
  const queue = loadQueue();
  queue.feedback.push({ id: crypto.randomUUID(), courseSlug, lessonKey, kind, ...(message ? { message } : {}) });
  saveQueue(queue);
  return await flushLearningQueue() ? 'sent' : 'queued';
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => scheduleFlush(100));
  window.addEventListener('pagehide', () => void flushLearningQueue());
}
