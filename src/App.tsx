import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Course, CurriculumItem, UserProgressRecord } from './types/curriculum';
import { type CourseLanguage, ScrimLessonData } from './types/scrim';
import { FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS } from './curriculum/fundamentos/course';
import { JAVASCRIPT_COURSE, JAVASCRIPT_SCRIMS } from './curriculum/javascript/course';
import { COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS } from './curriculum/web-components-lit/course';
import { AI_ENGINEER_COURSE, AI_ENGINEER_SCRIMS } from './curriculum/ai-engineer/course';
import { OPEN_CELLS_COURSE, OPEN_CELLS_SCRIMS } from './curriculum/open-cells/course';
import { AppNavigationState, loadAppNavigationState, loadUserProgress, loadCustomCourses, loadCustomScrims, loadCourseLanguage, markItemCompleted, saveAppNavigationState, saveCourseLanguage, saveCustomCourse, saveUserProgress, updateRecentPosition } from './engine/persistence';
import { resolveDebuggingLanguage, resolveLessonLanguage, resolveProjectLanguage, resolveStandaloneChallengeLanguage } from './engine/runtime/languageVariants';
import { getNavigationState } from './engine/navigation';
import { RoadmapHome } from './components/curriculum/RoadmapHome';
import { ReadingView } from './components/curriculum/ReadingView';
import { ScrimPlayer } from './components/player/ScrimPlayer';
import { DebuggingView } from './components/challenges/DebuggingView';
import { SoloProjectView } from './components/challenges/SoloProjectView';
import { PlaygroundView } from './components/playground/PlaygroundView';
import { CreatorStudio } from './components/studio/CreatorStudio';
import { ReasoningPracticeView } from './components/reasoning/ReasoningPracticeView';
import { CourseCatalog } from './components/curriculum/CourseCatalog';
import { SocraticTutor } from './components/tutor/SocraticTutor';
import type { TutorActivityContext } from './learning/tutor/tutorContext';
import { createEmptyLearningProfile } from './learning/mastery';
import type { LearningProfile } from './learning/types';
import { getItemReadiness, type ItemReadiness } from './learning/unlockPolicy';
import { getCurriculumSkillIndex, loadLearningProfile } from './learning/curriculumEvidence';
import { X } from 'lucide-react';
import { fetchPublishedLesson, PublishedLessonError } from './services/learningApi';
import { fetchPublishedCourses, getCachedPublishedCourses, type PublishedCourseSummary } from './services/courseCatalogApi';
import { applyPublishedManifest, fetchPublishedManifest, getCachedPublishedManifest } from './services/courseManifestApi';
import { fetchCourseProgress, getCachedCourseProgress, mergeRemoteProgress } from './services/courseProgressApi';
import { flushLearningQueue, queueExerciseAttempt, queueLearningEvent, queueLearningProfileEvidence, queueLessonProgress, submitLessonFeedback } from './services/learningSync';

const COURSE_SLUG_BY_ID: Record<string, string> = Object.fromEntries(
  [FUNDAMENTOS_COURSE, JAVASCRIPT_COURSE, COMPONENT_COURSE, OPEN_CELLS_COURSE, AI_ENGINEER_COURSE]
    .flatMap((candidate) => [[candidate.id, candidate.slug], [candidate.slug, candidate.slug]]),
);

type AppView = 'catalog' | 'home' | 'scrim' | 'debugging' | 'solo-project' | 'reading' | 'reasoning' | 'playground' | 'studio';
type CanonicalDataSource = 'catalog' | 'manifest' | 'progress';

interface InitialAppState {
  view: AppView;
  item: CurriculumItem | null;
  moduleId: string;
  timestampMs: number;
}

function viewForItem(item: CurriculumItem): AppView {
  if (item.type === 'scrim' || item.type === 'challenge') return 'scrim';
  if (item.type === 'reading') return 'reading';
  return item.type;
}

function getInitialCourses(): Course[] {
  const savedCourses = loadCustomCourses();
  return [FUNDAMENTOS_COURSE, JAVASCRIPT_COURSE, COMPONENT_COURSE, OPEN_CELLS_COURSE, AI_ENGINEER_COURSE].map((baseCourse) => {
    const savedCourse = savedCourses.find((candidate) => candidate.id === baseCourse.id);
    return savedCourse ? mergeSavedCourseItems(baseCourse, savedCourse) : baseCourse;
  });
}

function applyPublishedCatalog(localCourses: Course[], published: PublishedCourseSummary[]): Course[] {
  const publishedBySlug = new Map(published.map((remote) => [remote.slug, remote]));
  return localCourses.map((local) => {
    const remote = publishedBySlug.get(local.slug);
    if (!remote) return local;
    const metadata = remote.metadata ?? {};
    return {
      ...local,
      title: remote.title,
      description: remote.description,
      tagline: metadata.tagline ?? local.tagline,
      level: metadata.level ?? local.level,
      tags: metadata.tags ?? local.tags,
      instructor: metadata.instructor ?? local.instructor,
      thumbnailGradient: metadata.thumbnailGradient ?? local.thumbnailGradient,
      availability: remote.availability,
      availabilityReason: remote.availabilityReason ?? undefined,
    };
  });
}

function findCourseByIdOrSlug(courses: Course[], identifier?: string): Course | undefined {
  if (!identifier) return undefined;
  const normalized = identifier.trim().toLowerCase();
  const withoutPrefix = normalized.replace(/^course-/, '');
  return courses.find((c) =>
    c.id.toLowerCase() === normalized ||
    c.slug.toLowerCase() === normalized ||
    c.id.toLowerCase().replace(/^course-/, '') === withoutPrefix ||
    c.slug.toLowerCase().replace(/^course-/, '') === withoutPrefix ||
    c.title.toLowerCase() === normalized
  );
}

function chooseInitialCourse(courses: Course[]): Course {
  const persisted = loadAppNavigationState();
  if (persisted?.courseId) {
    const found = findCourseByIdOrSlug(courses, persisted.courseId);
    if (found) return found;
  }
  const progress = loadUserProgress();
  if (progress.lastAccessedCourseId) {
    const found = findCourseByIdOrSlug(courses, progress.lastAccessedCourseId);
    if (found) return found;
  }
  if (progress.recentActivity && progress.recentActivity.length > 0) {
    for (const act of progress.recentActivity) {
      const found = findCourseByIdOrSlug(courses, act.courseId);
      if (found) return found;
    }
  }
  return courses[0];
}

function getInitialAppState(course: Course): InitialAppState {
  const persisted = loadAppNavigationState();
  const defaultState: InitialAppState = {
    view: 'catalog',
    item: null,
    moduleId: course.modules[0]?.id || 'mod-primeros-pasos',
    timestampMs: 0,
  };

  if (!persisted) {
    const progress = loadUserProgress();
    if (progress.lastAccessedCourseId) {
      return {
        ...defaultState,
        view: 'home',
      };
    }
    return defaultState;
  }
  if (persisted.view === 'catalog' || persisted.view === 'playground' || persisted.view === 'studio') {
    return { ...defaultState, view: persisted.view };
  }
  if (persisted.view === 'home') {
    return { ...defaultState, view: 'home' };
  }
  if (!persisted.itemId) return { ...defaultState, view: 'home' };
  if (persisted.courseId) {
    const matchesCurrent =
      persisted.courseId === course.id ||
      persisted.courseId === course.slug ||
      persisted.courseId === course.title ||
      persisted.courseId.replace(/^course-/, '') === course.id.replace(/^course-/, '');
    if (!matchesCurrent) {
      return { ...defaultState, view: 'home' };
    }
  }

  const module = course.modules.find((candidate) =>
    candidate.id === persisted.moduleId && candidate.items.some((item) => item.id === persisted.itemId)
  ) || course.modules.find((candidate) => candidate.items.some((item) => item.id === persisted.itemId));
  const item = module?.items.find((candidate) => candidate.id === persisted.itemId);
  if (!module || !item || viewForItem(item) !== persisted.view) {
    return { ...defaultState, view: 'home' };
  }

  return {
    view: persisted.view,
    item,
    moduleId: module.id,
    timestampMs: persisted.timestampMs || 0,
  };
}

function saveRoute(route: AppNavigationState): void {
  saveAppNavigationState({
    ...route,
    ...(route.view === 'catalog' || route.view === 'playground' || route.view === 'studio'
      ? { courseId: undefined, moduleId: undefined, itemId: undefined, timestampMs: undefined }
      : route.view === 'home'
      ? { moduleId: undefined, itemId: undefined, timestampMs: undefined }
      : {}),
  });
}

function mergeSavedCourseItems(baseCourse: Course, savedCourse: Course): Course {
  const builtInItemIds = new Set(baseCourse.modules.flatMap((module) => module.items.map((item) => item.id)));
  const mergedModules = baseCourse.modules.map((baseModule) => {
    const savedModule = savedCourse.modules.find((module) => module.id === baseModule.id);
    const customItems = savedModule?.items.filter((item) => !builtInItemIds.has(item.id)) ?? [];
    return customItems.length > 0
      ? { ...baseModule, items: [...baseModule.items, ...customItems] }
      : baseModule;
  });
  const builtInModuleIds = new Set(baseCourse.modules.map((module) => module.id));
  const customModules = savedCourse.modules.filter((module) => !builtInModuleIds.has(module.id));
  return { ...baseCourse, modules: [...mergedModules, ...customModules] };
}

function appendPublishedLesson(course: Course, lesson: ScrimLessonData): Course {
  if (course.modules.some((module) => module.items.some((item) => item.id === lesson.id))) return course;
  const modules = course.modules.map((module, index) => index === 0
    ? {
        ...module,
        items: [
          ...module.items,
          {
            id: lesson.id,
            title: lesson.title,
            type: 'scrim' as const,
            estimatedMinutes: Math.max(1, Math.ceil(lesson.durationMs / 60000)),
            scrimDataId: lesson.id,
          },
        ],
      }
    : module);
  return { ...course, modules };
}

function buildTutorActivity(
  course: Course,
  item: CurriculumItem | null,
  scrims: Record<string, ScrimLessonData>,
): TutorActivityContext | null {
  if (!item) return null;
  const relatedLessonId = item.type === 'scrim'
    ? item.scrimDataId
    : 'relatedLessonId' in item
      ? item.relatedLessonId
      : undefined;
  const lesson = relatedLessonId ? scrims[relatedLessonId] : undefined;
  const description = item.description
    || (item.type === 'reading' ? item.summary : undefined)
    || (item.type === 'debugging' ? `Esperado: ${item.expectedBehavior}. Ahora ocurre: ${item.observedBehavior}.` : undefined)
    || (item.type === 'solo-project' ? item.brief : undefined)
    || lesson?.description;
  return {
    courseId: course.id,
    courseTitle: course.title,
    itemId: item.id,
    itemTitle: item.title,
    itemType: item.type,
    description,
    mentalModel: lesson?.mentalModel,
    skillsRequired: lesson?.skillsRequired,
    skillsIntroduced: lesson?.skillsIntroduced,
    commonMistakes: lesson?.commonMistakes,
  };
}

export default function App() {
  const [initialCourses] = useState(getInitialCourses);
  const [initialCourse] = useState(() => chooseInitialCourse(initialCourses));
  const [initialAppState] = useState(() => getInitialAppState(initialCourse));
  const [currentView, setCurrentView] = useState<AppView>(initialAppState.view);
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [course, setCourse] = useState<Course>(initialCourse);
  const [courseLanguage, setCourseLanguage] = useState<CourseLanguage>(() => loadCourseLanguage(initialCourse.id));
  const [activeItem, setActiveItem] = useState<CurriculumItem | null>(initialAppState.item);
  const [activeModuleId, setActiveModuleId] = useState<string>(initialAppState.moduleId);
  const [scrimsMap, setScrimsMap] = useState<Record<string, ScrimLessonData>>({ ...FUNDAMENTOS_SCRIMS, ...JAVASCRIPT_SCRIMS, ...COMPONENT_COURSE_SCRIMS, ...OPEN_CELLS_SCRIMS, ...AI_ENGINEER_SCRIMS });
  const [customScrimsStatus, setCustomScrimsStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [customScrimsError, setCustomScrimsError] = useState('');
  const [progress, setProgress] = useState<UserProgressRecord>(() => loadUserProgress());
  const [learningProfile, setLearningProfile] = useState<LearningProfile>(() => createEmptyLearningProfile());
  const [scrimInitialTimeMs, setScrimInitialTimeMs] = useState(initialAppState.timestampMs);
  const [playgroundReturnView, setPlaygroundReturnView] = useState<'catalog' | 'home'>(initialAppState.view === 'playground' ? 'catalog' : 'home');
  const [navigationBlocker, setNavigationBlocker] = useState<ItemReadiness | null>(null);
  const [remoteLessonState, setRemoteLessonState] = useState<{ id: string; status: 'loading' | 'ready' | 'offline' | 'unavailable'; message?: string } | null>(null);
  const [identityRevision, setIdentityRevision] = useState(0);
  const [canonicalDataIssues, setCanonicalDataIssues] = useState<Record<CanonicalDataSource, string | null>>({ catalog: null, manifest: null, progress: null });
  const activitySession = useRef<{ id: string; courseSlug: string; itemId: string; itemType: string; openedAt: number; playbackMs: number } | null>(null);

  const closeActivitySession = (reason: string) => {
    const active = activitySession.current;
    if (!active) return;
    activitySession.current = null;
    queueLearningEvent(active.courseSlug, active.itemId, 'item_left', {
      sessionId: active.id,
      itemType: active.itemType,
      reason,
      activeMs: Math.max(0, Date.now() - active.openedAt),
      playbackMs: active.playbackMs,
    });
  };

  // Sync custom scrims and progress from storage on mount
  useEffect(() => {
    let isMounted = true;
    const savedProgress = loadUserProgress();
    setProgress(savedProgress);
    void import('./learning/curriculumEvidence').then(async ({ curriculumEvidence }) => {
      if (!isMounted) return;
      const migrated = await curriculumEvidence.migrate(savedProgress);
      if (isMounted) setLearningProfile(migrated);
    });

    loadCustomScrims()
      .then((customScrims) => {
        if (!isMounted) return;
        setScrimsMap((prev) => ({ ...prev, ...customScrims }));
        setCustomScrimsStatus('ready');
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setCustomScrimsError(error instanceof Error ? error.message : 'No se pudieron recuperar las clases guardadas.');
        setCustomScrimsStatus('error');
      });

    void flushLearningQueue();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleIdentityChange = () => {
      setProgress(loadUserProgress());
      void loadLearningProfile().then(setLearningProfile);
      setIdentityRevision((revision) => revision + 1);
    };
    window.addEventListener('aula-auth-session', handleIdentityChange);
    return () => window.removeEventListener('aula-auth-session', handleIdentityChange);
  }, []);

  useEffect(() => {
    const applyRemoteProgress = (items: Parameters<typeof mergeRemoteProgress>[1]) => {
      setProgress((current) => {
        const merged = mergeRemoteProgress(current, items);
        saveUserProgress(merged);
        return merged;
      });
    };
    const cached = getCachedCourseProgress();
    setCanonicalDataIssues((current) => ({ ...current, progress: null }));
    if (cached) {
      applyRemoteProgress(cached.snapshot.items);
      if (cached.fresh) return;
    }
    const controller = new AbortController();
    void fetchCourseProgress(controller.signal)
      .then((snapshot) => {
        if (controller.signal.aborted) return;
        applyRemoteProgress(snapshot.items);
        setCanonicalDataIssues((current) => ({ ...current, progress: null }));
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setCanonicalDataIssues((current) => ({
          ...current,
          progress: cached
            ? 'No pudimos actualizar tu progreso desde el servidor. Estás viendo una copia guardada que puede estar desactualizada.'
            : 'No pudimos actualizar tu progreso desde el servidor. Se conserva el progreso de este dispositivo.',
        }));
      });
    return () => controller.abort();
  }, [identityRevision]);

  useEffect(() => {
    const applyManifest = (manifest: Parameters<typeof applyPublishedManifest>[1]): boolean => {
      const base = initialCourses.find((candidate) => candidate.slug === manifest.slug);
      if (!base) return false;
      const currentPublished = courses.find((candidate) => candidate.slug === manifest.slug) ?? base;
      const application = applyPublishedManifest({ ...base, ...currentPublished, modules: base.modules }, manifest);
      if (application.status === 'rejected') {
        setCanonicalDataIssues((current) => ({
          ...current,
          manifest: `${application.issue} Se conserva el contenido local y el acceso puede estar desactualizado.`,
        }));
        return false;
      }
      const { course: hydrated } = application;
      setCourses((current) => current.map((candidate) => candidate.slug === hydrated.slug ? hydrated : candidate));
      setCourse((current) => current.slug === hydrated.slug ? hydrated : current);
      return true;
    };
    const cached = identityRevision === 0 ? getCachedPublishedManifest(course.slug) : null;
    setCanonicalDataIssues((current) => ({ ...current, manifest: null }));
    if (cached) {
      if (applyManifest(cached.manifest) && cached.fresh) return;
    }
    const controller = new AbortController();
    void fetchPublishedManifest(course.slug, controller.signal)
      .then((manifest) => {
        if (controller.signal.aborted) return;
        if (applyManifest(manifest)) {
          setCanonicalDataIssues((current) => ({ ...current, manifest: null }));
        }
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setCanonicalDataIssues((current) => ({
          ...current,
          manifest: cached
            ? 'No pudimos actualizar la estructura publicada de este curso. Estás viendo una copia guardada que puede estar desactualizada.'
            : 'No pudimos actualizar la estructura publicada de este curso. Estás viendo el contenido local y el acceso puede estar desactualizado.',
        }));
      });
    return () => controller.abort();
  // La fuente base conserva el contenido ejecutable; el manifiesto remoto decide estructura y acceso.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.slug, identityRevision]);

  useEffect(() => {
    if (!activeItem || ['catalog', 'home', 'playground', 'studio'].includes(currentView)) return;
    const publishedItem = course.modules.flatMap((module) => module.items).find((item) => item.id === activeItem.id);
    if (!publishedItem) {
      setActiveItem(null);
      saveRoute({ view: 'home', courseId: course.id });
      setCurrentView('home');
      return;
    }
    if (publishedItem !== activeItem) setActiveItem(publishedItem);
  }, [activeItem, course, currentView]);

  useEffect(() => {
    const applyCatalog = (published: PublishedCourseSummary[]) => {
      setCourses((current) => applyPublishedCatalog(current, published));
      setCourse((current) => applyPublishedCatalog([current], published)[0] ?? current);
    };
    const cachedCatalog = identityRevision === 0 ? getCachedPublishedCourses() : null;
    setCanonicalDataIssues((current) => ({ ...current, catalog: null }));
    if (cachedCatalog) {
      applyCatalog(cachedCatalog.catalog.items);
      if (cachedCatalog.fresh && cachedCatalog.complete) return;
    }
    const controller = new AbortController();
    void fetchPublishedCourses(controller.signal).then((catalog) => {
      if (controller.signal.aborted) return;
      applyCatalog(catalog.items);
      setCanonicalDataIssues((current) => ({ ...current, catalog: null }));
    }).catch(() => {
      if (controller.signal.aborted) return;
      setCanonicalDataIssues((current) => ({
        ...current,
        catalog: cachedCatalog
          ? cachedCatalog.complete
            ? 'No pudimos actualizar el catálogo publicado. Estás viendo una copia guardada que puede estar desactualizada.'
            : 'No pudimos actualizar el catálogo publicado. Estás viendo una copia guardada que puede estar incompleta o desactualizada.'
          : 'No pudimos consultar el catálogo publicado. Se muestra el contenido local y su disponibilidad puede estar desactualizada.',
      }));
    });
    return () => controller.abort();
  }, [identityRevision]);

  useEffect(() => {
    if (learningProfile.evidence.length === 0) return;
    queueLearningProfileEvidence(learningProfile, COURSE_SLUG_BY_ID);
  }, [learningProfile]);

  useEffect(() => {
    if (!activeItem || ['catalog', 'home', 'playground', 'studio'].includes(currentView)) return;
    closeActivitySession('navigation');
    activitySession.current = {
      id: crypto.randomUUID(),
      courseSlug: course.slug,
      itemId: activeItem.id,
      itemType: activeItem.type,
      openedAt: Date.now(),
      playbackMs: scrimInitialTimeMs,
    };
    queueLearningEvent(course.slug, activeItem.id, 'item_opened', {
      itemType: activeItem.type,
      moduleId: activeModuleId,
      sessionId: activitySession.current.id,
    });
    return () => closeActivitySession('navigation');
  // La sesión cambia únicamente al cambiar de actividad; la posición se actualiza mediante la referencia.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItem?.id, course.slug, currentView]);

  useEffect(() => {
    const leave = () => closeActivitySession('page_hidden');
    window.addEventListener('pagehide', leave);
    return () => window.removeEventListener('pagehide', leave);
  }, []);

  useEffect(() => {
    if (currentView !== 'scrim' || activeItem?.type !== 'scrim' || activeItem.availability === undefined) return;
    const lessonId = activeItem.scrimDataId;
    const controller = new AbortController();
    setRemoteLessonState({ id: lessonId, status: 'loading' });
    void fetchPublishedLesson(lessonId, controller.signal)
      .then((lesson) => {
        if (controller.signal.aborted) return;
        setScrimsMap((current) => ({ ...current, [lessonId]: lesson }));
        setRemoteLessonState({ id: lessonId, status: 'ready' });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const publishedError = error instanceof PublishedLessonError ? error : null;
        const denied = publishedError?.status === 403;
        const details = error instanceof Error ? error.message : 'No se pudo consultar el backend.';
        setRemoteLessonState({
          id: lessonId,
          status: denied ? 'unavailable' : 'offline',
          message: denied
            ? details
            : publishedError?.status === 404
              ? 'La revisión publicada aún no está disponible. Estás usando el contenido guardado en este dispositivo.'
              : 'No pudimos comprobar la revisión publicada. Estás usando el contenido local de esta lección; su disponibilidad puede estar desactualizada.',
        });
      });
    return () => controller.abort();
  }, [activeItem, course.slug, currentView]);

  const refreshProgress = () => {
    setProgress(loadUserProgress());
    void import('./learning/curriculumEvidence').then(async ({ loadLearningProfile }) => {
      setLearningProfile(await loadLearningProfile());
    });
  };

  const handleSelectItem = (item: CurriculumItem, moduleId: string, initialTimeMs = 0) => {
    if (item.availability === 'locked') {
      setNavigationBlocker({ unlocked: false, missing: [], message: item.availabilityReason ?? 'Esta actividad no está disponible por ahora.' });
      return;
    }
    const nextView = viewForItem(item);
    setActiveItem(item);
    setActiveModuleId(moduleId);
    setScrimInitialTimeMs(initialTimeMs);

    updateRecentPosition(course.id, moduleId, item.id, item.title, item.type, initialTimeMs);
    saveRoute({
      view: nextView,
      courseId: course.id,
      moduleId,
      itemId: item.id,
      timestampMs: initialTimeMs,
    });
    refreshProgress();
    setCurrentView(nextView);
  };

  const handleBackToRoadmap = () => {
    refreshProgress();
    saveRoute({ view: 'home', courseId: course.id });
    setCurrentView('home');
  };

  const handleBackToCourses = () => {
    refreshProgress();
    setActiveItem(null);
    saveRoute({ view: 'catalog', courseId: course.id });
    setCurrentView('catalog');
  };

  const handleOpenCourse = (courseId: string) => {
    const selected = courses.find((candidate) => candidate.id === courseId);
    if (!selected || selected.availability === 'locked') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    setCourse(selected);
    setCourseLanguage(loadCourseLanguage(selected.id));
    setActiveItem(null);
    setActiveModuleId(selected.modules[0]?.id || '');
    setScrimInitialTimeMs(0);
    saveRoute({ view: 'home', courseId: selected.id });
    refreshProgress();
    setCurrentView('home');
  };

  // Linear navigation using real curriculum order
  const getNav = () => getNavigationState(course, activeItem?.id || null);

  const handlePrevious = () => {
    const nav = getNav();
    if (!nav.hasPrevious || !nav.previous) return;
    // Preserve recent position before leaving
    if (activeItem) {
      updateRecentPosition(course.id, activeModuleId, activeItem.id, activeItem.title, activeItem.type, scrimInitialTimeMs);
    }
    handleSelectItem(nav.previous.item, nav.previous.moduleId, 0);
  };

  const handleNext = async () => {
    if (activeItem?.type === 'reading') {
      markItemCompleted(activeItem.id);
      queueLessonProgress(course.slug, activeItem.id, 'completed', 0);
      queueLearningEvent(course.slug, activeItem.id, 'item_completed', { itemType: activeItem.type });
      const { curriculumEvidence } = await import('./learning/curriculumEvidence');
      await curriculumEvidence.record(activeItem.id);
    }
    const nav = getNav();
    if (!nav.hasNext || !nav.next) {
      // Last element: coherent finalization
      refreshProgress();
      saveRoute({ view: 'home', courseId: course.id });
      setCurrentView('home');
      return;
    }
    if (nav.next.item.availability === 'locked') {
      setNavigationBlocker({
        unlocked: false,
        missing: [],
        message: nav.next.item.availabilityReason ?? 'La siguiente actividad no está disponible por ahora.',
      });
      return;
    }
    const latestProfile = await loadLearningProfile();
    setLearningProfile(latestProfile);
    const readiness = getItemReadiness(course, nav.next.item.id, latestProfile, getCurriculumSkillIndex());
    if (!readiness.unlocked) {
      setNavigationBlocker(readiness);
      return;
    }
    if (activeItem) {
      updateRecentPosition(course.id, activeModuleId, activeItem.id, activeItem.title, activeItem.type, scrimInitialTimeMs);
    }
    handleSelectItem(nav.next.item, nav.next.moduleId, 0);
  };

  const handleLessonPublished = (newLesson: ScrimLessonData) => {
    setScrimsMap((prev) => ({ ...prev, [newLesson.id]: newLesson }));

    const updatedCourse = appendPublishedLesson(course, newLesson);
    saveCustomCourse(updatedCourse);
    setCourse(updatedCourse);
    setCourses((current) => current.map((candidate) => candidate.id === updatedCourse.id ? updatedCourse : candidate));

    refreshProgress();
    saveRoute({ view: 'home', courseId: updatedCourse.id });
    setCurrentView('home');
  };

  const navigationState = getNavigationState(course, activeItem?.id || null);
  const activeScrimData = activeItem?.type === 'scrim' ? scrimsMap[activeItem.scrimDataId] : undefined;
  const resolvedScrimData = useMemo(
    () => activeScrimData ? resolveLessonLanguage(activeScrimData, courseLanguage) : undefined,
    [activeScrimData, courseLanguage],
  );
  const resolvedChallengeItem = useMemo(
    () => activeItem?.type === 'challenge' ? resolveStandaloneChallengeLanguage(activeItem, courseLanguage) : undefined,
    [activeItem, courseLanguage],
  );
  const resolvedDebuggingItem = useMemo(
    () => activeItem?.type === 'debugging' ? resolveDebuggingLanguage(activeItem, courseLanguage) : undefined,
    [activeItem, courseLanguage],
  );
  const resolvedProjectItem = useMemo(
    () => activeItem?.type === 'solo-project' ? resolveProjectLanguage(activeItem, courseLanguage) : undefined,
    [activeItem, courseLanguage],
  );
  const handleCourseLanguageChange = (language: CourseLanguage) => {
    saveCourseLanguage(course.id, language);
    setCourseLanguage(language);
  };
  const activeScrimIsUnavailable = currentView === 'scrim' && activeItem?.type === 'scrim' && !activeScrimData;
  const activeScrimError = activeScrimData?.audioTrack?.audioError;
  const remoteLessonIsLoading = activeItem?.type === 'scrim'
    && remoteLessonState?.id === activeItem.scrimDataId
    && remoteLessonState.status === 'loading';
  const remoteLessonIsUnavailable = activeItem?.type === 'scrim'
    && remoteLessonState?.id === activeItem.scrimDataId
    && remoteLessonState.status === 'unavailable';
  const activeScrimCannotPlay = activeScrimIsUnavailable || Boolean(activeScrimError) || remoteLessonIsUnavailable;
  const activeScrimUnavailableMessage = activeScrimError
    ?? (remoteLessonIsUnavailable
      ? remoteLessonState?.message ?? 'Esta clase no está disponible por ahora.'
      : remoteLessonIsLoading
        ? 'Cargando la revisión publicada de esta clase…'
        : customScrimsStatus === 'loading'
          ? 'Cargando la clase guardada…'
          : customScrimsError || 'No se encontró el contenido de esta clase.');
  const tutorActivity = useMemo(
    () => buildTutorActivity(course, activeItem, scrimsMap),
    [activeItem, course, scrimsMap],
  );
  const tutorEnabled = Boolean(
    tutorActivity
    && course.id !== AI_ENGINEER_COURSE.id
    && ['scrim', 'debugging', 'solo-project', 'reading', 'reasoning'].includes(currentView),
  );
  const canonicalDataMessages = Object.values(canonicalDataIssues).filter((message): message is string => Boolean(message));

  return (
    <div className={currentView === 'scrim' ? 'app-screen' : undefined}>
      {canonicalDataMessages.length > 0 && (
        <aside
          className="fixed bottom-3 right-3 z-[120] w-[min(22rem,calc(100vw-1.5rem))] border-2 border-amber-700 bg-amber-50 text-xs text-amber-950 shadow-[3px_3px_0_#111]"
          role="alert"
          aria-label="Estado de datos publicados"
        >
          <details>
            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800">
              <span>Modo local · datos sin actualizar</span>
              <span className="rounded-full border border-amber-700 px-2 py-0.5" aria-label={`${canonicalDataMessages.length} avisos`}>
                {canonicalDataMessages.length}
              </span>
            </summary>
            <div className="max-h-44 overflow-y-auto border-t border-amber-700 px-3 py-2">
              <p className="font-bold">Datos publicados sin actualizar</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {canonicalDataMessages.map((message) => <li key={message}>{message}</li>)}
              </ul>
            </div>
          </details>
        </aside>
      )}
      {currentView === 'catalog' && (
        <CourseCatalog
          courses={courses}
          progress={progress}
          onOpenCourse={handleOpenCourse}
          onPlayground={() => {
            setPlaygroundReturnView('catalog');
            saveRoute({ view: 'playground' });
            setCurrentView('playground');
          }}
        />
      )}
      {currentView === 'home' && (
        <RoadmapHome
          course={course}
          progress={progress}
          learningProfile={learningProfile}
          scrims={scrimsMap}
          onEnterLesson={(item, modId, timeMs) => handleSelectItem(item, modId, timeMs ?? 0)}
          onPlayground={() => {
            setPlaygroundReturnView('home');
            saveRoute({ view: 'playground' });
            setCurrentView('playground');
          }}
          onBackToCourses={handleBackToCourses}
          onLearningProfileChange={setLearningProfile}
        />
      )}

      {navigationBlocker && (
        <div className="rm-concept-backdrop app-mastery-gate" role="presentation" onClick={() => setNavigationBlocker(null)}>
          <section className="rm-concept-pop rm-mastery-blocker" role="dialog" aria-modal="true" aria-label="Comprensión pendiente" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="rm-briefing-close" onClick={() => setNavigationBlocker(null)} aria-label="Cerrar"><X size={15} /></button>
            <span className="rm-pill">Antes de avanzar</span>
            <h2>Las pruebas no son el último paso</h2>
            <p>{navigationBlocker.message ?? 'Explica y aplica el concepto actual para continuar.'}</p>
            <ul>{navigationBlocker.missing.slice(0, 3).map((gap) => <li key={`${gap.skillId}:${gap.capability}`}>{gap.skillId.replace(/-/g, ' ')} · {gap.capability}</li>)}</ul>
            <button type="button" className="rm-enter-btn" onClick={() => setNavigationBlocker(null)}>Volver a la actividad</button>
          </section>
        </div>
      )}

      {activeScrimCannotPlay && (
        <main className="app-screen flex items-center justify-center bg-[var(--bg-main)] p-6">
          <section
            className="max-w-lg border-2 border-black bg-[var(--paper)] p-6 shadow-[6px_6px_0_#111]"
            aria-live="polite"
            role={activeScrimError || customScrimsStatus === 'error' ? 'alert' : 'status'}
          >
            <h1 className="text-xl font-bold">{activeItem?.title ?? 'Clase'}</h1>
            <p className="mt-3 text-sm">
              {activeScrimUnavailableMessage}
            </p>
            {(activeScrimError || customScrimsStatus !== 'loading') && (
              <button type="button" className="neu-pill-btn mt-5" onClick={handleBackToRoadmap}>
                Volver al roadmap
              </button>
            )}
          </section>
        </main>
      )}

      {currentView === 'scrim' && activeItem && !activeScrimCannotPlay && (
        <>
        {activeItem.type === 'scrim' && remoteLessonState?.id === activeItem.scrimDataId && remoteLessonState.status === 'offline' && (
          <div className="fixed left-1/2 top-20 z-[110] -translate-x-1/2 border-2 border-amber-500 bg-amber-50 px-4 py-2 text-sm text-amber-950 shadow-[4px_4px_0_#111]" role="status">
            {remoteLessonState.message}
          </div>
        )}
        <ScrimPlayer
          key={`${activeItem.id}:${courseLanguage}`}
          lessonData={
            activeItem.type === 'scrim' && resolvedScrimData
              ? resolvedScrimData
              : activeItem.type === 'challenge' && resolvedChallengeItem
              ? {
                  id: resolvedChallengeItem.id,
                  title: resolvedChallengeItem.title,
                  description: resolvedChallengeItem.description || '',
                  templateId: resolvedChallengeItem.templateId,
                  durationMs: 8000,
                  initialWorkspace: resolvedChallengeItem.initialWorkspace,
                  languageVariants: resolvedChallengeItem.languageVariants,
                  events: [],
                  snapshots: [],
                  challenges: [resolvedChallengeItem.challenge],
                  skillsIntroduced: [],
                  skillsRequired: [],
                  learningObjectives: [activeItem.description || activeItem.title],
                  commonMistakes: [],
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                }
              : Object.values(scrimsMap)[0]
          }
          courseTitle={course.title}
          moduleTitle={course.modules.find((m) => m.id === activeModuleId)?.title || ''}
          onBack={handleBackToRoadmap}
          onBackToRoadmap={handleBackToRoadmap}
          onPrevious={navigationState.hasPrevious ? handlePrevious : undefined}
          onNext={navigationState.hasNext ? handleNext : undefined}
          onNextLesson={handleNext}
          initialTimeMs={scrimInitialTimeMs}
          navigationState={navigationState}
          language={courseLanguage}
          onLanguageChange={handleCourseLanguageChange}
          onPositionChange={(timeMs) => {
            saveRoute({
              view: 'scrim',
              courseId: course.id,
              moduleId: activeModuleId,
              itemId: activeItem.id,
              timestampMs: timeMs,
            });
            if (activeItem.type === 'scrim') {
              if (activitySession.current?.itemId === activeItem.id) activitySession.current.playbackMs = timeMs;
              queueLessonProgress(course.slug, activeItem.id, 'in_progress', timeMs);
            }
          }}
          onCompleted={() => {
            const durationMs = activeItem.type === 'scrim' ? resolvedScrimData?.durationMs ?? 0 : 0;
            queueLessonProgress(course.slug, activeItem.id, 'completed', durationMs);
            queueLearningEvent(
              course.slug,
              activeItem.id,
              activeItem.type === 'scrim' ? 'lesson_completed' : 'item_completed',
              { itemType: activeItem.type, durationMs },
            );
          }}
          onFeedback={(kind) => submitLessonFeedback(course.slug, activeItem.id, kind)}
          liveHelpContext={{ courseSlug: course.slug, lessonKey: activeItem.id, surface: 'lesson' }}
        />
        </>
      )}

      {currentView === 'debugging' && resolvedDebuggingItem && (
        <DebuggingView
          key={`${resolvedDebuggingItem.id}:${courseLanguage}`}
          exercise={resolvedDebuggingItem}
          courseTitle={course.title}
          onBack={handleBackToRoadmap}
          onBackToRoadmap={handleBackToRoadmap}
          onPrevious={navigationState.hasPrevious ? handlePrevious : undefined}
          onNext={navigationState.hasNext ? handleNext : handleBackToRoadmap}
          navigationState={navigationState}
          language={courseLanguage}
          onLanguageChange={handleCourseLanguageChange}
          onCompleted={(completion) => {
            queueLessonProgress(course.slug, activeItem.id, 'completed', 0);
            queueLearningEvent(course.slug, activeItem.id, 'item_completed', { itemType: activeItem.type });
            queueExerciseAttempt(course.slug, activeItem.id, 'debugging', 'success', completion);
            refreshProgress();
          }}
          onAttempt={(result, completion) => queueExerciseAttempt(course.slug, activeItem.id, 'debugging', result, completion)}
          liveHelpContext={{ courseSlug: course.slug, lessonKey: activeItem.id, surface: 'debug' }}
        />
      )}

      {currentView === 'reading' && activeItem && activeItem.type === 'reading' && (
        <ReadingView
          reading={activeItem}
          onBack={handleBackToRoadmap}
          onBackToRoadmap={handleBackToRoadmap}
          onPrevious={navigationState.hasPrevious ? handlePrevious : undefined}
          onNext={navigationState.hasNext ? handleNext : handleBackToRoadmap}
          navigationState={navigationState}
        />
      )}

      {currentView === 'reasoning' && activeItem && activeItem.type === 'reasoning' && (
        <ReasoningPracticeView
          key={activeItem.id}
          item={activeItem}
          onBack={handleBackToRoadmap}
          onBackToRoadmap={handleBackToRoadmap}
          onPrevious={navigationState.hasPrevious ? handlePrevious : undefined}
          onNext={navigationState.hasNext ? handleNext : handleBackToRoadmap}
          navigationState={navigationState}
          onCompleted={(completion) => {
            queueLessonProgress(course.slug, activeItem.id, 'completed', 0);
            queueLearningEvent(course.slug, activeItem.id, 'item_completed', { itemType: activeItem.type });
            queueExerciseAttempt(course.slug, activeItem.id, 'challenge', 'success', completion);
            refreshProgress();
          }}
          onAttempt={(result, completion) => queueExerciseAttempt(course.slug, activeItem.id, 'challenge', result, completion)}
        />
      )}

      {currentView === 'solo-project' && resolvedProjectItem && (
        <SoloProjectView
          key={`${resolvedProjectItem.id}:${courseLanguage}`}
          project={resolvedProjectItem}
          courseTitle={course.title}
          onBack={handleBackToRoadmap}
          onBackToRoadmap={handleBackToRoadmap}
          onPrevious={navigationState.hasPrevious ? handlePrevious : undefined}
          onNext={navigationState.hasNext ? handleNext : handleBackToRoadmap}
          navigationState={navigationState}
          language={courseLanguage}
          onLanguageChange={handleCourseLanguageChange}
          onCompleted={(completion) => {
            queueLessonProgress(course.slug, activeItem.id, 'completed', 0);
            queueLearningEvent(course.slug, activeItem.id, 'item_completed', { itemType: activeItem.type });
            queueExerciseAttempt(course.slug, activeItem.id, 'project', 'success', completion);
            refreshProgress();
          }}
          onAttempt={(result, completion) => queueExerciseAttempt(course.slug, activeItem.id, 'project', result, completion)}
          liveHelpContext={{ courseSlug: course.slug, lessonKey: activeItem.id, surface: 'challenge' }}
        />
      )}

      {currentView === 'playground' && (
        <PlaygroundView
          liveHelpContext={{ courseSlug: course.slug, lessonKey: 'playground', surface: 'editor' }}
          onBack={() => {
            refreshProgress();
            if (playgroundReturnView === 'home') {
              saveRoute({ view: 'home', courseId: course.id });
              setCurrentView('home');
            } else {
              saveRoute({ view: 'catalog', courseId: course.id });
              setCurrentView('catalog');
            }
          }}
        />
      )}

      {currentView === 'studio' && (
        <CreatorStudio
          onBack={() => {
            refreshProgress();
            saveRoute({ view: 'home', courseId: course.id });
            setCurrentView('home');
          }}
          onLessonPublished={handleLessonPublished}
        />
      )}

      {tutorActivity && (
        <SocraticTutor enabled={tutorEnabled} activity={tutorActivity} />
      )}
    </div>
  );
}
