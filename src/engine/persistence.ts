import { Course, UserProgressRecord } from '../types/curriculum';
import { ScrimLessonData, LearnerBranch } from '../types/scrim';

const STORAGE_KEYS = {
  USER_PROGRESS: 'aula_user_progress_v1',
  CUSTOM_COURSES: 'aula_custom_courses_v1',
  CUSTOM_SCRIMS: 'aula_custom_scrims_v1',
  STUDIO_DRAFT: 'aula_studio_draft_v1',
  LEARNER_BRANCHES: 'aula_learner_branches_v1',
  VOICE_VOLUME: 'aula_voice_volume_v1',
};

export const DEFAULT_VOICE_VOLUME = 0.5;

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
  type: 'scrim' | 'challenge' | 'debugging' | 'solo-project',
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
  return current;
}

/**
 * Saves or updates a LearnerBranch
 */
export function saveLearnerBranch(branch: LearnerBranch): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEARNER_BRANCHES);
    const branches: Record<string, LearnerBranch> = raw ? JSON.parse(raw) : {};
    branches[branch.id] = branch;
    localStorage.setItem(STORAGE_KEYS.LEARNER_BRANCHES, JSON.stringify(branches));
  } catch (e) {
    console.error('Error saving learner branch:', e);
  }
}

/**
 * Loads a LearnerBranch by ID
 */
export function loadLearnerBranch(branchId: string): LearnerBranch | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEARNER_BRANCHES);
    if (!raw) return null;
    const branches: Record<string, LearnerBranch> = JSON.parse(raw);
    return branches[branchId] || null;
  } catch (e) {
    return null;
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
export function loadCustomScrims(): Record<string, ScrimLessonData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_SCRIMS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveCustomScrim(scrim: ScrimLessonData): void {
  try {
    const existing = loadCustomScrims();
    existing[scrim.id] = scrim;
    localStorage.setItem(STORAGE_KEYS.CUSTOM_SCRIMS, JSON.stringify(existing));
  } catch (e) {
    console.error('Error saving custom scrim:', e);
  }
}
