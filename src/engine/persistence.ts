import { Course, ItemType, ReasoningAttempt, UserProgressRecord } from '../types/curriculum';
import { ChallengeTest, ScrimLessonData, LearnerBranch, WorkspaceSnapshot, type CourseLanguage } from '../types/scrim';
import { TemplateDefinition } from '../types/runtime';
import {
  getPersistenceStatus,
  quarantineStoredValue,
  readJsonStorage,
  recordPersistenceReadFailure,
  recordPersistenceWriteFailure,
  writeJsonStorage,
} from './persistenceIntegrity';

export { getPersistenceStatus } from './persistenceIntegrity';

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
  COURSE_LANGUAGE: 'aula_course_language_v1',
  LANGUAGE_WORKSPACE_DRAFTS: 'aula_language_workspace_drafts_v1',
};

const CUSTOM_AUDIO_DATABASE = 'aula_custom_audio_v1';
const CUSTOM_AUDIO_STORE = 'recordings';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readStoredJson(key: string) {
  return readJsonStorage(key, localStorage);
}

function quarantineInvalidStoredValue(key: string, raw: string, message: string): void {
  quarantineStoredValue(key, raw, localStorage, new Error(message));
}

function saveStoredJson(key: string, value: unknown): boolean {
  return writeJsonStorage(key, value, localStorage);
}

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
  const result = readStoredJson(STORAGE_KEYS.REASONING_DRAFTS);
  if (result.state !== 'loaded') return null;
  if (!isRecord(result.value)) {
    quarantineInvalidStoredValue(STORAGE_KEYS.REASONING_DRAFTS, result.raw, 'Los borradores de razonamiento no tienen una estructura válida.');
    return null;
  }
  const draft = result.value[exerciseId] as Partial<ReasoningDraft> | undefined;
  if (!draft || draft.activityVersion !== expectedVersion) return null;
  if (typeof draft.revealedHints !== 'number' || !draft.attempt) {
    quarantineInvalidStoredValue(STORAGE_KEYS.REASONING_DRAFTS, result.raw, 'El borrador de razonamiento no tiene una estructura válida.');
    return null;
  }
  return draft as ReasoningDraft;
}

export function saveReasoningDraft(exerciseId: string, draft: ReasoningDraft): void {
  const result = readStoredJson(STORAGE_KEYS.REASONING_DRAFTS);
  if (result.state === 'unavailable') return;
  const drafts = result.state === 'loaded' && isRecord(result.value)
    ? result.value
    : {};
  if (result.state === 'loaded' && !isRecord(result.value)) {
    quarantineInvalidStoredValue(STORAGE_KEYS.REASONING_DRAFTS, result.raw, 'Los borradores de razonamiento no tienen una estructura válida.');
  }
  drafts[exerciseId] = draft;
  saveStoredJson(STORAGE_KEYS.REASONING_DRAFTS, drafts);
}

const PLAYGROUND_TEMPLATE_IDS: TemplateDefinition['id'][] = [
  'vanilla-js',
  'js-only',
  'lit',
  'react',
  'cells-component',
  'cells-application',
];
const WORKSPACE_LANGUAGES = ['javascript', 'html', 'css', 'typescript', 'json', 'python', 'markdown'];

export function loadCourseLanguage(courseId: string): CourseLanguage {
  const result = readStoredJson(STORAGE_KEYS.COURSE_LANGUAGE);
  if (result.state !== 'loaded') return 'javascript';
  if (!isRecord(result.value)) {
    quarantineInvalidStoredValue(STORAGE_KEYS.COURSE_LANGUAGE, result.raw, 'Las preferencias de lenguaje no tienen una estructura válida.');
    return 'javascript';
  }
  const language = result.value[courseId];
  if (language !== undefined && language !== 'python' && language !== 'javascript') {
    quarantineInvalidStoredValue(STORAGE_KEYS.COURSE_LANGUAGE, result.raw, 'La preferencia de lenguaje guardada no es válida.');
  }
  return language === 'python' ? 'python' : 'javascript';
}

export function saveCourseLanguage(courseId: string, language: CourseLanguage): void {
  const result = readStoredJson(STORAGE_KEYS.COURSE_LANGUAGE);
  if (result.state === 'unavailable') return;
  const preferences = result.state === 'loaded' && isRecord(result.value)
    ? result.value as Record<string, CourseLanguage>
    : {};
  if (result.state === 'loaded' && !isRecord(result.value)) {
    quarantineInvalidStoredValue(STORAGE_KEYS.COURSE_LANGUAGE, result.raw, 'Las preferencias de lenguaje no tienen una estructura válida.');
  }
  preferences[courseId] = language;
  saveStoredJson(STORAGE_KEYS.COURSE_LANGUAGE, preferences);
}

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

function languageDraftKey(itemId: string, language: CourseLanguage) {
  return `${itemId}:${language}`;
}

export function loadLanguageWorkspaceDraft(
  itemId: string,
  language: CourseLanguage,
): WorkspaceSnapshot | null {
  const result = readStoredJson(STORAGE_KEYS.LANGUAGE_WORKSPACE_DRAFTS);
  if (result.state !== 'loaded') return null;
  if (!isRecord(result.value)) {
    quarantineInvalidStoredValue(STORAGE_KEYS.LANGUAGE_WORKSPACE_DRAFTS, result.raw, 'Los borradores de workspace no tienen una estructura válida.');
    return null;
  }
  const workspace = result.value[languageDraftKey(itemId, language)];
  if (workspace === undefined) return null;
  if (!isWorkspaceSnapshot(workspace)) {
    quarantineInvalidStoredValue(STORAGE_KEYS.LANGUAGE_WORKSPACE_DRAFTS, result.raw, 'El borrador de workspace no es válido.');
    return null;
  }
  return structuredClone(workspace);
}

export function saveLanguageWorkspaceDraft(
  itemId: string,
  language: CourseLanguage,
  workspace: WorkspaceSnapshot,
): void {
  const result = readStoredJson(STORAGE_KEYS.LANGUAGE_WORKSPACE_DRAFTS);
  if (result.state === 'unavailable') return;
  const drafts = result.state === 'loaded' && isRecord(result.value) ? result.value : {};
  if (result.state === 'loaded' && !isRecord(result.value)) {
    quarantineInvalidStoredValue(STORAGE_KEYS.LANGUAGE_WORKSPACE_DRAFTS, result.raw, 'Los borradores de workspace no tienen una estructura válida.');
  }
  drafts[languageDraftKey(itemId, language)] = structuredClone(workspace);
  saveStoredJson(STORAGE_KEYS.LANGUAGE_WORKSPACE_DRAFTS, drafts);
}

export function loadPlaygroundDraft(): PlaygroundDraft | null {
  const result = readStoredJson(STORAGE_KEYS.PLAYGROUND_DRAFT);
  if (result.state !== 'loaded') return null;
  const parsed = result.value as Partial<PlaygroundDraft>;
  if (
    !isRecord(parsed)
    || !PLAYGROUND_TEMPLATE_IDS.includes(parsed.templateId as TemplateDefinition['id'])
    || typeof parsed.showFileTree !== 'boolean'
    || !isWorkspaceSnapshot(parsed.workspace)
  ) {
    quarantineInvalidStoredValue(STORAGE_KEYS.PLAYGROUND_DRAFT, result.raw, 'El borrador del playground no tiene una estructura válida.');
    return null;
  }
  return parsed as PlaygroundDraft;
}

export function savePlaygroundDraft(draft: PlaygroundDraft): void {
  saveStoredJson(STORAGE_KEYS.PLAYGROUND_DRAFT, draft);
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
  const result = readStoredJson(STORAGE_KEYS.DEBUGGING_DRAFTS);
  if (result.state !== 'loaded') return null;
  if (!isRecord(result.value)) {
    quarantineInvalidStoredValue(STORAGE_KEYS.DEBUGGING_DRAFTS, result.raw, 'Los borradores de depuración no tienen una estructura válida.');
    return null;
  }
  const draft = result.value[exerciseId] as Partial<DebuggingDraft> | undefined;
  if (!draft) return null;
  if (expectedVersion !== undefined && draft.exerciseVersion !== expectedVersion) return null;
  if (
    !isWorkspaceSnapshot(draft.workspace)
    || typeof draft.revealedHints !== 'number'
    || !Number.isInteger(draft.revealedHints)
    || draft.revealedHints < 0
    || typeof draft.exerciseVersion !== 'string'
  ) {
    quarantineInvalidStoredValue(STORAGE_KEYS.DEBUGGING_DRAFTS, result.raw, 'El borrador de depuración no es válido.');
    return null;
  }
  return draft as DebuggingDraft;
}

export function saveDebuggingDraft(exerciseId: string, draft: DebuggingDraft): void {
  const result = readStoredJson(STORAGE_KEYS.DEBUGGING_DRAFTS);
  if (result.state === 'unavailable') return;
  const drafts = result.state === 'loaded' && isRecord(result.value) ? result.value : {};
  if (result.state === 'loaded' && !isRecord(result.value)) {
    quarantineInvalidStoredValue(STORAGE_KEYS.DEBUGGING_DRAFTS, result.raw, 'Los borradores de depuración no tienen una estructura válida.');
  }
  drafts[exerciseId] = draft;
  saveStoredJson(STORAGE_KEYS.DEBUGGING_DRAFTS, drafts);
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
  const result = readStoredJson(STORAGE_KEYS.APP_NAVIGATION);
  if (result.state !== 'loaded') return null;
  const parsed = result.value as Partial<AppNavigationState>;
  if (!isRecord(parsed) || !APP_NAVIGATION_VIEWS.includes(parsed.view as AppNavigationView)) {
    quarantineInvalidStoredValue(STORAGE_KEYS.APP_NAVIGATION, result.raw, 'La navegación guardada no tiene una estructura válida.');
    return null;
  }
  if (parsed.courseId !== undefined && typeof parsed.courseId !== 'string') {
    quarantineInvalidStoredValue(STORAGE_KEYS.APP_NAVIGATION, result.raw, 'El curso de la navegación guardada no es válido.');
    return null;
  }
  if (parsed.moduleId !== undefined && typeof parsed.moduleId !== 'string') {
    quarantineInvalidStoredValue(STORAGE_KEYS.APP_NAVIGATION, result.raw, 'El módulo de la navegación guardada no es válido.');
    return null;
  }
  if (parsed.itemId !== undefined && typeof parsed.itemId !== 'string') {
    quarantineInvalidStoredValue(STORAGE_KEYS.APP_NAVIGATION, result.raw, 'El elemento de la navegación guardada no es válido.');
    return null;
  }
  if (parsed.timestampMs !== undefined && (typeof parsed.timestampMs !== 'number' || !Number.isFinite(parsed.timestampMs))) {
    quarantineInvalidStoredValue(STORAGE_KEYS.APP_NAVIGATION, result.raw, 'La marca de tiempo de la navegación guardada no es válida.');
    return null;
  }
  return {
    view: parsed.view as AppNavigationView,
    ...(parsed.courseId ? { courseId: parsed.courseId } : {}),
    ...(parsed.moduleId ? { moduleId: parsed.moduleId } : {}),
    ...(parsed.itemId ? { itemId: parsed.itemId } : {}),
    ...(parsed.timestampMs !== undefined ? { timestampMs: Math.max(0, parsed.timestampMs) } : {}),
  };
}

export function saveAppNavigationState(state: AppNavigationState): void {
  saveStoredJson(STORAGE_KEYS.APP_NAVIGATION, state);
}

export function loadVoiceVolume(): number {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEYS.VOICE_VOLUME);
  } catch (error) {
    recordPersistenceReadFailure(STORAGE_KEYS.VOICE_VOLUME, error);
    return DEFAULT_VOICE_VOLUME;
  }
  if (raw == null) return DEFAULT_VOICE_VOLUME;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    quarantineInvalidStoredValue(STORAGE_KEYS.VOICE_VOLUME, raw, 'El volumen guardado no es válido.');
    return DEFAULT_VOICE_VOLUME;
  }
  return Math.min(1, Math.max(0, value));
}

export function saveVoiceVolume(volume: number): void {
  const value = Math.min(1, Math.max(0, volume));
  try {
    localStorage.setItem(STORAGE_KEYS.VOICE_VOLUME, String(value));
  } catch (error) {
    recordPersistenceWriteFailure(STORAGE_KEYS.VOICE_VOLUME, error);
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
  const result = readStoredJson(STORAGE_KEYS.USER_PROGRESS);
  if (result.state !== 'loaded') return { ...DEFAULT_PROGRESS };
  if (!isRecord(result.value)
    || (result.value.completedItemIds !== undefined && !Array.isArray(result.value.completedItemIds))
    || (result.value.completedChallenges !== undefined && !Array.isArray(result.value.completedChallenges))
    || (result.value.passedSoloProjects !== undefined && !Array.isArray(result.value.passedSoloProjects))
    || (result.value.recentActivity !== undefined && !Array.isArray(result.value.recentActivity))) {
    quarantineInvalidStoredValue(STORAGE_KEYS.USER_PROGRESS, result.raw, 'El progreso guardado no tiene una estructura válida.');
    return { ...DEFAULT_PROGRESS };
  }
  return {
    ...DEFAULT_PROGRESS,
    ...result.value,
    completedItemIds: result.value.completedItemIds ?? [],
    completedChallenges: result.value.completedChallenges ?? [],
    passedSoloProjects: result.value.passedSoloProjects ?? [],
    recentActivity: result.value.recentActivity ?? [],
  } as UserProgressRecord;
}

/**
 * Saves user progress to LocalStorage
 */
export function saveUserProgress(progress: UserProgressRecord): void {
  saveStoredJson(STORAGE_KEYS.USER_PROGRESS, progress);
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
    void import('../learning/curriculumEvidence').then(({ curriculumEvidence }) => curriculumEvidence.record(itemId));
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
    void import('../learning/curriculumEvidence').then(({ curriculumEvidence }) => curriculumEvidence.record(challengeId));
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

function isChallengeStateRecord(value: unknown): value is ChallengeStateRecord {
  return isRecord(value)
    && ['completed', 'skipped', 'solutionViewed', 'in_progress'].includes(value.status as ChallengeStateValue)
    && typeof value.updatedAt === 'number'
    && Number.isFinite(value.updatedAt);
}

export function getChallengeStates(): Record<string, ChallengeStateRecord> {
  const result = readStoredJson(STORAGE_KEYS.CHALLENGE_STATES);
  if (result.state !== 'loaded') return {};
  if (!isRecord(result.value)) {
    quarantineInvalidStoredValue(STORAGE_KEYS.CHALLENGE_STATES, result.raw, 'Los estados de retos no tienen una estructura válida.');
    return {};
  }
  if (Object.values(result.value).some((state) => !isChallengeStateRecord(state))) {
    quarantineInvalidStoredValue(STORAGE_KEYS.CHALLENGE_STATES, result.raw, 'Un estado de reto guardado no es válido.');
    return {};
  }
  return result.value as Record<string, ChallengeStateRecord>;
}

export function getChallengeState(challengeId: string): ChallengeStateRecord | null {
  const all = getChallengeStates();
  return all[challengeId] || null;
}

export function setChallengeState(challengeId: string, status: ChallengeStateValue): void {
  const all = getChallengeStates();
  all[challengeId] = { status, updatedAt: Date.now() };
  saveStoredJson(STORAGE_KEYS.CHALLENGE_STATES, all);
}

export function markChallengeSkipped(challengeId: string): void {
  // Skip should not overwrite completed
  const existing = getChallengeState(challengeId);
  if (existing?.status === 'completed') return;
  setChallengeState(challengeId, 'skipped');
  void import('../learning/curriculumEvidence').then(({ curriculumEvidence }) => curriculumEvidence.record(challengeId, 'failure'));
}

export function markChallengeSolutionViewed(challengeId: string): void {
  const existing = getChallengeState(challengeId);
  if (existing?.status === 'completed') return;
  setChallengeState(challengeId, 'solutionViewed');
  void import('../learning/curriculumEvidence').then(({ curriculumEvidence }) => curriculumEvidence.record(challengeId, 'failure'));
}

export function clearChallengeState(challengeId: string): void {
  const all = getChallengeStates();
  if (all[challengeId]) {
    delete all[challengeId];
    saveStoredJson(STORAGE_KEYS.CHALLENGE_STATES, all);
  }
}

/**
 * Saves or updates a LearnerBranch — clones deeply, no mutation, coherent timestamps
 */
function isLearnerBranch(value: unknown): value is LearnerBranch {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && typeof value.lessonId === 'string'
    && typeof value.baseTime === 'number'
    && isWorkspaceSnapshot(value.workspace);
}

function readLearnerBranchesForWrite(): Record<string, LearnerBranch> | null {
  const result = readStoredJson(STORAGE_KEYS.LEARNER_BRANCHES);
  if (result.state === 'missing' || result.state === 'corrupt') return {};
  if (result.state === 'unavailable') return null;
  if (!isRecord(result.value)) {
    quarantineInvalidStoredValue(STORAGE_KEYS.LEARNER_BRANCHES, result.raw, 'Las ramas del estudiante no tienen una estructura válida.');
    return {};
  }
  return result.value as Record<string, LearnerBranch>;
}

function readLearnerBranches(): { branches: Record<string, LearnerBranch>; raw: string } | null {
  const result = readStoredJson(STORAGE_KEYS.LEARNER_BRANCHES);
  if (result.state !== 'loaded') return null;
  if (!isRecord(result.value)) {
    quarantineInvalidStoredValue(STORAGE_KEYS.LEARNER_BRANCHES, result.raw, 'Las ramas del estudiante no tienen una estructura válida.');
    return null;
  }
  return { branches: result.value as Record<string, LearnerBranch>, raw: result.raw };
}

export function saveLearnerBranch(branch: LearnerBranch): void {
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
  const branches = readLearnerBranchesForWrite();
  if (!branches) return;
  branches[clone.id] = clone;
  saveStoredJson(STORAGE_KEYS.LEARNER_BRANCHES, branches);
}

/**
 * Loads a LearnerBranch by ID — safe against corruption
 */
export function loadLearnerBranch(branchId: string): LearnerBranch | null {
  const stored = readLearnerBranches();
  if (!stored) return null;
  const found = stored.branches[branchId];
  if (!found) return null;
  if (!isLearnerBranch(found)) {
    quarantineInvalidStoredValue(STORAGE_KEYS.LEARNER_BRANCHES, stored.raw, 'La rama guardada no es válida.');
    return null;
  }
  return found;
}

/**
 * Latest branch for a lesson — deterministic recovery, safe against corruption
 */
export function loadLastBranchForLesson(lessonId: string): LearnerBranch | null {
  const stored = readLearnerBranches();
  if (!stored) return null;
  const branches = Object.values(stored.branches);
  if (branches.some((branch) => !isLearnerBranch(branch))) {
    quarantineInvalidStoredValue(STORAGE_KEYS.LEARNER_BRANCHES, stored.raw, 'Una rama guardada no es válida.');
    return null;
  }
  const candidates = branches.filter((branch) => branch.lessonId === lessonId);
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => (b.lastSavedAt || 0) - (a.lastSavedAt || 0));
  return candidates[0] || null;
}

export function loadAllBranchesForLesson(lessonId: string): LearnerBranch[] {
  const stored = readLearnerBranches();
  if (!stored) return [];
  const branches = Object.values(stored.branches);
  if (branches.some((branch) => !isLearnerBranch(branch))) {
    quarantineInvalidStoredValue(STORAGE_KEYS.LEARNER_BRANCHES, stored.raw, 'Una rama guardada no es válida.');
    return [];
  }
  return branches.filter((branch) => branch.lessonId === lessonId);
}

export function clearBranch(branchId: string): void {
  const branches = readLearnerBranchesForWrite();
  if (!branches || !branches[branchId]) return;
  delete branches[branchId];
  saveStoredJson(STORAGE_KEYS.LEARNER_BRANCHES, branches);
}

export function clearBranchesForLesson(lessonId: string): void {
  const branches = readLearnerBranchesForWrite();
  if (!branches) return;
  let changed = false;
  for (const key of Object.keys(branches)) {
    if (branches[key]?.lessonId === lessonId) {
      delete branches[key];
      changed = true;
    }
  }
  if (changed) saveStoredJson(STORAGE_KEYS.LEARNER_BRANCHES, branches);
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
  saveStoredJson(STORAGE_KEYS.STUDIO_DRAFT, draftData);
}

/**
 * Loads Creator Studio Draft
 */
export function loadStudioDraft(): any | null {
  const result = readStoredJson(STORAGE_KEYS.STUDIO_DRAFT);
  return result.state === 'loaded' ? result.value : null;
}

/**
 * Clears Creator Studio Draft
 */
export function clearStudioDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.STUDIO_DRAFT);
  } catch (error) {
    recordPersistenceWriteFailure(STORAGE_KEYS.STUDIO_DRAFT, error);
  }
}

/**
 * Custom Courses Persistence
 */
export function loadCustomCourses(): Course[] {
  const result = readStoredJson(STORAGE_KEYS.CUSTOM_COURSES);
  if (result.state !== 'loaded') return [];
  if (!Array.isArray(result.value)) {
    quarantineInvalidStoredValue(STORAGE_KEYS.CUSTOM_COURSES, result.raw, 'Los cursos personalizados no tienen una estructura válida.');
    return [];
  }
  return result.value as Course[];
}

export function saveCustomCourse(course: Course): void {
  const result = readStoredJson(STORAGE_KEYS.CUSTOM_COURSES);
  if (result.state === 'unavailable') return;
  const existing = result.state === 'loaded' && Array.isArray(result.value)
    ? result.value as Course[]
    : [];
  if (result.state === 'loaded' && !Array.isArray(result.value)) {
    quarantineInvalidStoredValue(STORAGE_KEYS.CUSTOM_COURSES, result.raw, 'Los cursos personalizados no tienen una estructura válida.');
  }
  const index = existing.findIndex((candidate) => candidate.id === course.id);
  if (index >= 0) existing[index] = course;
  else existing.push(course);
  saveStoredJson(STORAGE_KEYS.CUSTOM_COURSES, existing);
}

/**
 * Custom Scrims Persistence
 */
function loadCustomScrimMetadata(): Record<string, ScrimLessonData> {
  const result = readStoredJson(STORAGE_KEYS.CUSTOM_SCRIMS);
  if (result.state !== 'loaded') return {};
  if (!isRecord(result.value)) {
    quarantineInvalidStoredValue(STORAGE_KEYS.CUSTOM_SCRIMS, result.raw, 'Las clases personalizadas no tienen una estructura válida.');
    return {};
  }
  return result.value as Record<string, ScrimLessonData>;
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
    if (!saveStoredJson(STORAGE_KEYS.CUSTOM_SCRIMS, existing)) {
      throw new Error('No se pudo persistir la clase personalizada.');
    }
  } catch (error) {
    throw new Error('No se pudo guardar la clase personalizada.', { cause: error });
  }
}
