import { Course, ItemType, ReasoningAttempt, UserProgressRecord } from '../types/curriculum';
import { ChallengeTest, ScrimLessonData, LearnerBranch, WorkspaceSnapshot } from '../types/scrim';
import { TemplateDefinition } from '../types/runtime';

const STORAGE_KEYS = {
  USER_PROGRESS: 'aula_user_progress_v1',
  APP_NAVIGATION: 'aula_app_navigation_v1',
  CUSTOM_COURSES: 'aula_custom_courses_v1',
  CUSTOM_SCRIMS: 'aula_custom_scrims_v1',
  STUDIO_DRAFT: 'aula_studio_draft_v1',
  PLAYGROUND_DRAFT: 'aula_playground_draft_v1',
  DEBUGGING_DRAFTS: 'aula_debugging_drafts_v1',
  REASONING_DRAFTS: 'aula_reasoning_drafts_v1',
  LEARNER_BRANCHES: 'aula_learner_branches_v1',
  VOICE_VOLUME: 'aula_voice_volume_v1',
  CHALLENGE_STATES: 'aula_challenge_states_v1',
};

const CUSTOM_AUDIO_DATABASE = 'aula_custom_audio_v1';
const CUSTOM_AUDIO_STORE = 'recordings';

export interface PlaygroundDraft {
  templateId: TemplateDefinition['id'];
  workspace: WorkspaceSnapshot;
  showFileTree: boolean;
}

export interface DebuggingDraft {
  workspace: WorkspaceSnapshot;
  revealedHints: number;
  exerciseVersion: string;
}

export interface ReasoningDraft {
  attempt: ReasoningAttempt;
  revealedHints: number;
  activityVersion: string;
}

export function createReasoningActivityVersion(activity: unknown): string {
  const serialized = JSON.stringify(activity);
  let hash = 2166136261;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `reasoning-${(hash >>> 0).toString(36)}`;
}

export function loadReasoningDraft(exerciseId: string, expectedVersion: string): ReasoningDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REASONING_DRAFTS);
    if (!raw) return null;
    const draft = (JSON.parse(raw) as Record<string, ReasoningDraft>)[exerciseId];
    if (!draft || draft.activityVersion !== expectedVersion || typeof draft.revealedHints !== 'number' || !draft.attempt) {
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function saveReasoningDraft(exerciseId: string, draft: ReasoningDraft): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REASONING_DRAFTS);
    const parsed = raw ? JSON.parse(raw) : {};
    const drafts = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    drafts[exerciseId] = draft;
    localStorage.setItem(STORAGE_KEYS.REASONING_DRAFTS, JSON.stringify(drafts));
  } catch {
    // Draft persistence is best-effort and must not interrupt learning.
  }
}

const PLAYGROUND_TEMPLATE_IDS: TemplateDefinition['id'][] = ['vanilla-js', 'js-only', 'lit', 'react'];
const WORKSPACE_LANGUAGES = ['javascript', 'html', 'css', 'typescript', 'json'];

function isWorkspaceSnapshot(value: unknown): value is WorkspaceSnapshot {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<WorkspaceSnapshot>;
  if (!candidate.files || typeof candidate.files !== 'object' || typeof candidate.activeFilePath !== 'string') return false;
  const files = Object.values(candidate.files);
  if (files.length === 0 || !candidate.files[candidate.activeFilePath]) return false;
  return files.every((file) =>
    Boolean(
      file
      && typeof file === 'object'
      && typeof file.name === 'string'
      && typeof file.path === 'string'
      && typeof file.content === 'string'
      && WORKSPACE_LANGUAGES.includes(file.language),
    ),
  );
}

export function loadPlaygroundDraft(): PlaygroundDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYGROUND_DRAFT);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlaygroundDraft>;
    if (
      !PLAYGROUND_TEMPLATE_IDS.includes(parsed.templateId as TemplateDefinition['id'])
      || typeof parsed.showFileTree !== 'boolean'
      || !isWorkspaceSnapshot(parsed.workspace)
    ) {
      return null;
    }
    return parsed as PlaygroundDraft;
  } catch {
    return null;
  }
}

export function savePlaygroundDraft(draft: PlaygroundDraft): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYGROUND_DRAFT, JSON.stringify(draft));
  } catch {
    // Draft persistence is best-effort and must not interrupt editing.
  }
}

export function createDebuggingDraftVersion(workspace: WorkspaceSnapshot, tests: ChallengeTest[]): string {
  const files = Object.keys(workspace.files)
    .sort()
    .map((path) => ({ path, language: workspace.files[path].language, content: workspace.files[path].content }));
  const serialized = JSON.stringify({ files, tests });
  let hash = 2166136261;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `debug-${(hash >>> 0).toString(36)}`;
}

export function loadDebuggingDraft(exerciseId: string, expectedVersion?: string): DebuggingDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEBUGGING_DRAFTS);
    if (!raw) return null;
    const drafts = JSON.parse(raw) as Record<string, Partial<DebuggingDraft>>;
    const draft = drafts?.[exerciseId];
    if (
      !draft
      || !isWorkspaceSnapshot(draft.workspace)
      || typeof draft.revealedHints !== 'number'
      || !Number.isInteger(draft.revealedHints)
      || draft.revealedHints < 0
      || typeof draft.exerciseVersion !== 'string'
      || (expectedVersion !== undefined && draft.exerciseVersion !== expectedVersion)
    ) {
      return null;
    }
    return draft as DebuggingDraft;
  } catch {
    return null;
  }
}

export function saveDebuggingDraft(exerciseId: string, draft: DebuggingDraft): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEBUGGING_DRAFTS);
    let drafts: Record<string, DebuggingDraft> = {};
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          drafts = parsed as Record<string, DebuggingDraft>;
        }
      } catch {
        // A valid edit replaces a corrupted draft store.
      }
    }
    drafts[exerciseId] = draft;
    localStorage.setItem(STORAGE_KEYS.DEBUGGING_DRAFTS, JSON.stringify(drafts));
  } catch {
    // Draft persistence is best-effort and must not interrupt the exercise.
  }
}

export type AppNavigationView = 'catalog' | 'home' | 'scrim' | 'debugging' | 'solo-project' | 'reading' | 'reasoning' | 'playground' | 'studio';

export interface AppNavigationState {
  view: AppNavigationView;
  courseId?: string;
  moduleId?: string;
  itemId?: string;
  timestampMs?: number;
}

const APP_NAVIGATION_VIEWS: AppNavigationView[] = [
  'catalog',
  'home',
  'scrim',
  'debugging',
  'solo-project',
  'reading',
  'reasoning',
  'playground',
  'studio',
];

export const DEFAULT_VOICE_VOLUME = 0.5;

export function loadAppNavigationState(): AppNavigationState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APP_NAVIGATION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppNavigationState>;
    if (!parsed || typeof parsed !== 'object' || !APP_NAVIGATION_VIEWS.includes(parsed.view as AppNavigationView)) {
      return null;
    }
    if (parsed.courseId !== undefined && typeof parsed.courseId !== 'string') return null;
    if (parsed.moduleId !== undefined && typeof parsed.moduleId !== 'string') return null;
    if (parsed.itemId !== undefined && typeof parsed.itemId !== 'string') return null;
    if (parsed.timestampMs !== undefined && (typeof parsed.timestampMs !== 'number' || !Number.isFinite(parsed.timestampMs))) {
      return null;
    }
    return {
      view: parsed.view as AppNavigationView,
      ...(parsed.courseId ? { courseId: parsed.courseId } : {}),
      ...(parsed.moduleId ? { moduleId: parsed.moduleId } : {}),
      ...(parsed.itemId ? { itemId: parsed.itemId } : {}),
      ...(parsed.timestampMs !== undefined ? { timestampMs: Math.max(0, parsed.timestampMs) } : {}),
    };
  } catch {
    return null;
  }
}

export function saveAppNavigationState(state: AppNavigationState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.APP_NAVIGATION, JSON.stringify(state));
  } catch {
    // Navigation persistence is best-effort; it must never interrupt the lesson.
  }
}

export function loadVoiceVolume(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VOICE_VOLUME);
    if (raw == null) return DEFAULT_VOICE_VOLUME;
    const value = Number(raw);
    if (!Number.isFinite(value)) return DEFAULT_VOICE_VOLUME;
    return Math.min(1, Math.max(0, value));
  } catch {
    return DEFAULT_VOICE_VOLUME;
  }
}

export function saveVoiceVolume(volume: number): void {
  try {
    const value = Math.min(1, Math.max(0, volume));
    localStorage.setItem(STORAGE_KEYS.VOICE_VOLUME, String(value));
  } catch {
    // ignore quota errors
  }
}

const DEFAULT_PROGRESS: UserProgressRecord = {
  completedItemIds: [],
  completedChallenges: [],
  passedSoloProjects: [],
  savedLearnerBranches: {},
  recentActivity: [],
};

/**
 * Loads stored user progress from LocalStorage
 */
export function loadUserProgress(): UserProgressRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROGRESS);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      completedItemIds: parsed.completedItemIds || [],
      completedChallenges: parsed.completedChallenges || [],
      passedSoloProjects: parsed.passedSoloProjects || [],
      recentActivity: parsed.recentActivity || [],
    };
  } catch (e) {
    console.error('Error reading user progress:', e);
    return { ...DEFAULT_PROGRESS };
  }
}

/**
 * Saves user progress to LocalStorage
 */
export function saveUserProgress(progress: UserProgressRecord): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(progress));
  } catch (e) {
    console.error('Error saving user progress:', e);
  }
}

/**
 * Updates recent activity and bookmarks current position
 */
export function updateRecentPosition(
  courseId: string,
  moduleId: string,
  itemId: string,
  itemTitle: string,
  type: ItemType,
  timestampMs?: number
): UserProgressRecord {
  const current = loadUserProgress();
  current.lastAccessedCourseId = courseId;
  current.lastAccessedModuleId = moduleId;
  current.lastAccessedItemId = itemId;
  current.lastAccessedTimestamp = timestampMs;

  const alreadyHead = current.recentActivity[0]?.itemId === itemId;
  if (!alreadyHead) {
    const filtered = current.recentActivity.filter((a) => a.itemId !== itemId);
    filtered.unshift({
      timestamp: Date.now(),
      courseId,
      moduleId,
      itemId,
      itemTitle,
      type,
    });
    current.recentActivity = filtered.slice(0, 10);
  }

  saveUserProgress(current);
  return current;
}

/**
 * Marks an item as completed
 */
export function markItemCompleted(itemId: string): UserProgressRecord {
  const current = loadUserProgress();
  if (!current.completedItemIds.includes(itemId)) {
    current.completedItemIds.push(itemId);
    saveUserProgress(current);
  }
  return current;
}

/**
 * Marks a challenge as completed
 */
export function markChallengeCompleted(challengeId: string): UserProgressRecord {
  const current = loadUserProgress();
  if (!current.completedChallenges.includes(challengeId)) {
    current.completedChallenges.push(challengeId);
    saveUserProgress(current);
  }
  // Also update detailed state
  setChallengeState(challengeId, 'completed');
  return current;
}

export type ChallengeStateValue = 'completed' | 'skipped' | 'solutionViewed' | 'in_progress';

export interface ChallengeStateRecord {
  status: ChallengeStateValue;
  updatedAt: number;
}

export function getChallengeStates(): Record<string, ChallengeStateRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHALLENGE_STATES);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed;
  } catch {
    return {};
  }
}

export function getChallengeState(challengeId: string): ChallengeStateRecord | null {
  const all = getChallengeStates();
  return all[challengeId] || null;
}

export function setChallengeState(challengeId: string, status: ChallengeStateValue): void {
  try {
    const all = getChallengeStates();
    all[challengeId] = { status, updatedAt: Date.now() };
    localStorage.setItem(STORAGE_KEYS.CHALLENGE_STATES, JSON.stringify(all));
  } catch {}
}

export function markChallengeSkipped(challengeId: string): void {
  // Skip should not overwrite completed
  const existing = getChallengeState(challengeId);
  if (existing?.status === 'completed') return;
  setChallengeState(challengeId, 'skipped');
}

export function markChallengeSolutionViewed(challengeId: string): void {
  const existing = getChallengeState(challengeId);
  if (existing?.status === 'completed') return;
  setChallengeState(challengeId, 'solutionViewed');
}

export function clearChallengeState(challengeId: string): void {
  try {
    const all = getChallengeStates();
    if (all[challengeId]) {
      delete all[challengeId];
      localStorage.setItem(STORAGE_KEYS.CHALLENGE_STATES, JSON.stringify(all));
    }
  } catch {}
}

/**
 * Saves or updates a LearnerBranch — clones deeply, no mutation, coherent timestamps
 */
export function saveLearnerBranch(branch: LearnerBranch): void {
  try {
    const clone: LearnerBranch = {
      ...branch,
      workspace: {
        ...branch.workspace,
        files: Object.fromEntries(Object.entries(branch.workspace.files).map(([k, v]) => [k, { ...v }])),
        cursorPosition: branch.workspace.cursorPosition ? { ...branch.workspace.cursorPosition } : undefined,
        selection: branch.workspace.selection ? { ...branch.workspace.selection } : undefined,
      },
      lastSavedAt: Date.now(),
    };
    const raw = localStorage.getItem(STORAGE_KEYS.LEARNER_BRANCHES);
    let branches: Record<string, LearnerBranch> = {};
    try {
      branches = raw ? JSON.parse(raw) : {};
      if (typeof branches !== 'object' || branches === null) branches = {};
    } catch {
      branches = {};
    }
    branches[clone.id] = clone;
    localStorage.setItem(STORAGE_KEYS.LEARNER_BRANCHES, JSON.stringify(branches));
  } catch (e) {
    console.error('Error saving learner branch:', e);
  }
}

/**
 * Loads a LearnerBranch by ID — safe against corruption
 */
export function loadLearnerBranch(branchId: string): LearnerBranch | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEARNER_BRANCHES);
    if (!raw) return null;
    let branches: Record<string, LearnerBranch> = {};
    try {
      branches = JSON.parse(raw);
    } catch {
      return null;
    }
    if (typeof branches !== 'object' || branches === null) return null;
    const found = branches[branchId];
    if (!found || typeof found !== 'object') return null;
    // Basic validation
    if (!found.id || !found.lessonId || !found.workspace || typeof found.baseTime !== 'number') return null;
    return found;
  } catch {
    return null;
  }
}

/**
 * Latest branch for a lesson — deterministic recovery, safe against corruption
 */
export function loadLastBranchForLesson(lessonId: string): LearnerBranch | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEARNER_BRANCHES);
    if (!raw) return null;
    let branches: Record<string, LearnerBranch>;
    try {
      branches = JSON.parse(raw);
    } catch {
      return null;
    }
    if (typeof branches !== 'object' || branches === null) return null;
    const candidates = Object.values(branches).filter(
      (b: any) => b && b.lessonId === lessonId && b.workspace && typeof b.baseTime === 'number'
    ) as LearnerBranch[];
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => (b.lastSavedAt || 0) - (a.lastSavedAt || 0));
    return candidates[0] || null;
  } catch {
    return null;
  }
}

export function loadAllBranchesForLesson(lessonId: string): LearnerBranch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEARNER_BRANCHES);
    if (!raw) return [];
    let branches: Record<string, LearnerBranch>;
    try {
      branches = JSON.parse(raw);
    } catch {
      return [];
    }
    if (typeof branches !== 'object' || branches === null) return [];
    return Object.values(branches).filter((b: any) => b && b.lessonId === lessonId) as LearnerBranch[];
  } catch {
    return [];
  }
}

export function clearBranch(branchId: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEARNER_BRANCHES);
    if (!raw) return;
    let branches: Record<string, LearnerBranch> = {};
    try {
      branches = JSON.parse(raw);
    } catch {
      return;
    }
    if (branches[branchId]) {
      delete branches[branchId];
      localStorage.setItem(STORAGE_KEYS.LEARNER_BRANCHES, JSON.stringify(branches));
    }
  } catch {}
}

export function clearBranchesForLesson(lessonId: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEARNER_BRANCHES);
    if (!raw) return;
    let branches: Record<string, LearnerBranch> = {};
    try {
      branches = JSON.parse(raw);
    } catch {
      return;
    }
    let changed = false;
    for (const key of Object.keys(branches)) {
      if ((branches[key] as any)?.lessonId === lessonId) {
        delete branches[key];
        changed = true;
      }
    }
    if (changed) localStorage.setItem(STORAGE_KEYS.LEARNER_BRANCHES, JSON.stringify(branches));
  } catch {}
}

// Debounce helper for branch saves — avoids excessive writes per keystroke
const branchDebounceTimers = new Map<string, number>();
const pendingBranches = new Map<string, LearnerBranch>();

export function saveLearnerBranchDebounced(branch: LearnerBranch, delayMs = 400): void {
  const key = branch.lessonId;
  pendingBranches.set(key, branch);
  const existing = branchDebounceTimers.get(key);
  if (existing) clearTimeout(existing as unknown as NodeJS.Timeout);
  const timer = setTimeout(() => {
    branchDebounceTimers.delete(key);
    const pending = pendingBranches.get(key);
    if (pending) {
      pendingBranches.delete(key);
      saveLearnerBranch(pending);
    }
  }, delayMs);
  branchDebounceTimers.set(key, timer as unknown as number);
}

export function flushBranchSave(lessonId: string): void {
  const timer = branchDebounceTimers.get(lessonId);
  if (timer) {
    clearTimeout(timer as unknown as NodeJS.Timeout);
    branchDebounceTimers.delete(lessonId);
  }
  const pending = pendingBranches.get(lessonId);
  if (pending) {
    pendingBranches.delete(lessonId);
    saveLearnerBranch(pending);
  }
}

/**
 * Saves Creator Studio Draft
 */
export function saveStudioDraft(draftData: any): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDIO_DRAFT, JSON.stringify(draftData));
  } catch (e) {
    console.error('Error saving studio draft:', e);
  }
}

/**
 * Loads Creator Studio Draft
 */
export function loadStudioDraft(): any | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDIO_DRAFT);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Clears Creator Studio Draft
 */
export function clearStudioDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.STUDIO_DRAFT);
  } catch (e) {}
}

/**
 * Custom Courses Persistence
 */
export function loadCustomCourses(): Course[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_COURSES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveCustomCourse(course: Course): void {
  try {
    const existing = loadCustomCourses();
    const index = existing.findIndex((c) => c.id === course.id);
    if (index >= 0) {
      existing[index] = course;
    } else {
      existing.push(course);
    }
    localStorage.setItem(STORAGE_KEYS.CUSTOM_COURSES, JSON.stringify(existing));
  } catch (e) {
    console.error('Error saving custom course:', e);
  }
}

/**
 * Custom Scrims Persistence
 */
function loadCustomScrimMetadata(): Record<string, ScrimLessonData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_SCRIMS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function openCustomAudioDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CUSTOM_AUDIO_DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(CUSTOM_AUDIO_STORE)) {
        request.result.createObjectStore(CUSTOM_AUDIO_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('No se pudo abrir el almacenamiento de audio.'));
  });
}

async function writeCustomAudio(key: string, blob: Blob): Promise<void> {
  const database = await openCustomAudioDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(CUSTOM_AUDIO_STORE, 'readwrite');
      transaction.objectStore(CUSTOM_AUDIO_STORE).put(blob, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo guardar el audio.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló el guardado del audio.'));
    });
  } finally {
    database.close();
  }
}

async function readCustomAudio(key: string): Promise<Blob | null> {
  const database = await openCustomAudioDatabase();
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const transaction = database.transaction(CUSTOM_AUDIO_STORE, 'readonly');
      const request = transaction.objectStore(CUSTOM_AUDIO_STORE).get(key);
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
      request.onerror = () => reject(request.error ?? new Error('No se pudo recuperar el audio.'));
    });
  } finally {
    database.close();
  }
}

export async function loadCustomScrims(): Promise<Record<string, ScrimLessonData>> {
  const scrims = loadCustomScrimMetadata();
  await Promise.all(Object.values(scrims).map(async (scrim) => {
    const storageKey = scrim.audioTrack?.audioStorageKey;
    if (!storageKey) {
      if (scrim.audioTrack?.audioBlob !== undefined && !(scrim.audioTrack.audioBlob instanceof Blob)) {
        scrim.audioTrack = {
          ...scrim.audioTrack,
          audioBlob: undefined,
          audioError: 'El audio de esta grabación antigua no se puede recuperar. Vuelve a grabar la clase para publicarla con audio.',
        };
      }
      return;
    }
    try {
      const audioBlob = await readCustomAudio(storageKey);
      const audioTrack = scrim.audioTrack;
      if (!audioTrack) return;
      scrim.audioTrack = audioBlob
        ? { ...audioTrack, audioBlob, audioError: undefined }
        : { ...audioTrack, audioError: 'El audio guardado no se encontró. Vuelve a grabar la clase para recuperar la narración.' };
    } catch {
      const audioTrack = scrim.audioTrack;
      if (!audioTrack) return;
      scrim.audioTrack = {
        ...audioTrack,
        audioError: 'No se pudo acceder al almacenamiento del audio. Recarga la aplicación e inténtalo de nuevo.',
      };
    }
  }));
  return scrims;
}

export async function saveCustomScrim(scrim: ScrimLessonData): Promise<void> {
  const audioBlob = scrim.audioTrack?.audioBlob;
  const audioStorageKey = audioBlob ? scrim.id : scrim.audioTrack?.audioStorageKey;

  if (audioBlob) await writeCustomAudio(audioStorageKey!, audioBlob);

  try {
    const existing = loadCustomScrimMetadata();
    existing[scrim.id] = {
      ...scrim,
      audioTrack: scrim.audioTrack
        ? { ...scrim.audioTrack, audioBlob: undefined, audioStorageKey }
        : undefined,
    };
    localStorage.setItem(STORAGE_KEYS.CUSTOM_SCRIMS, JSON.stringify(existing));
  } catch (error) {
    throw new Error('No se pudo guardar la clase personalizada.', { cause: error });
  }
}
