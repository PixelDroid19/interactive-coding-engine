import React, { useState, useEffect } from 'react';
import { Course, CurriculumItem, UserProgressRecord } from './types/curriculum';
import { ScrimLessonData } from './types/scrim';
import { FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS } from './curriculum/fundamentos/course';
import { JAVASCRIPT_COURSE, JAVASCRIPT_SCRIMS } from './curriculum/javascript/course';
import { COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS } from './curriculum/web-components-lit/course';
import { AppNavigationState, loadAppNavigationState, loadUserProgress, loadCustomCourses, loadCustomScrims, markItemCompleted, saveAppNavigationState, saveCustomCourse, updateRecentPosition } from './engine/persistence';
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

type AppView = 'catalog' | 'home' | 'scrim' | 'debugging' | 'solo-project' | 'reading' | 'reasoning' | 'playground' | 'studio';

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
  return [FUNDAMENTOS_COURSE, JAVASCRIPT_COURSE, COMPONENT_COURSE].map((baseCourse) => {
    const savedCourse = savedCourses.find((candidate) => candidate.id === baseCourse.id);
    return savedCourse ? mergeSavedCourseItems(baseCourse, savedCourse) : baseCourse;
  });
}

function chooseInitialCourse(courses: Course[]): Course {
  const persisted = loadAppNavigationState();
  return courses.find((course) => course.id === persisted?.courseId) ?? courses[0];
}

function getInitialAppState(course: Course): InitialAppState {
  const persisted = loadAppNavigationState();
  const defaultState: InitialAppState = {
    view: 'catalog',
    item: null,
    moduleId: course.modules[0]?.id || 'mod-primeros-pasos',
    timestampMs: 0,
  };

  if (!persisted) return defaultState;
  if (persisted.view === 'catalog' || persisted.view === 'playground' || persisted.view === 'studio') {
    return { ...defaultState, view: persisted.view };
  }
  if (persisted.view === 'home') {
    return { ...defaultState, view: persisted.courseId === course.id ? 'home' : 'catalog' };
  }
  if (!persisted.itemId) return defaultState;
  if (persisted.courseId && persisted.courseId !== course.id && persisted.courseId !== course.title) {
    return defaultState;
  }

  const module = course.modules.find((candidate) =>
    candidate.id === persisted.moduleId && candidate.items.some((item) => item.id === persisted.itemId)
  ) || course.modules.find((candidate) => candidate.items.some((item) => item.id === persisted.itemId));
  const item = module?.items.find((candidate) => candidate.id === persisted.itemId);
  if (!module || !item || viewForItem(item) !== persisted.view) return defaultState;

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

export default function App() {
  const [initialCourses] = useState(getInitialCourses);
  const [initialCourse] = useState(() => chooseInitialCourse(initialCourses));
  const [initialAppState] = useState(() => getInitialAppState(initialCourse));
  const [currentView, setCurrentView] = useState<AppView>(initialAppState.view);
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [course, setCourse] = useState<Course>(initialCourse);
  const [activeItem, setActiveItem] = useState<CurriculumItem | null>(initialAppState.item);
  const [activeModuleId, setActiveModuleId] = useState<string>(initialAppState.moduleId);
  const [scrimsMap, setScrimsMap] = useState<Record<string, ScrimLessonData>>({ ...FUNDAMENTOS_SCRIMS, ...JAVASCRIPT_SCRIMS, ...COMPONENT_COURSE_SCRIMS });
  const [customScrimsStatus, setCustomScrimsStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [customScrimsError, setCustomScrimsError] = useState('');
  const [progress, setProgress] = useState<UserProgressRecord>(() => loadUserProgress());
  const [scrimInitialTimeMs, setScrimInitialTimeMs] = useState(initialAppState.timestampMs);
  const [playgroundReturnView, setPlaygroundReturnView] = useState<'catalog' | 'home'>(initialAppState.view === 'playground' ? 'catalog' : 'home');

  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
    // HUD/Cyber theme — usa localStorage (default es tema estándar a menos que haya sido activado)
    const params = new URLSearchParams(window.location.search);
    const themeParam = params.get('theme');
    const hudParam = themeParam === 'hud' || params.get('hud') === '1';
    const defaultParam = themeParam === 'default' || themeParam === 'paper' || themeParam === 'classic';

    if (hudParam) {
      try { localStorage.setItem('theme', 'hud'); } catch {}
    } else if (defaultParam) {
      try { localStorage.setItem('theme', 'default'); } catch {}
    }

    const hudStored = (() => {
      try {
        return localStorage.getItem('theme') === 'hud';
      } catch {
        return false;
      }
    })();

    const applyHudAugs = () => {
      const isHud = document.documentElement.classList.contains('hud');
      const map: Array<[string, string, boolean?]> = [
        ['.editor-window-wrapper', 'hud-editor tl-clip tr-clip br-clip bl-clip border inlay'],
        ['.browser-window', 'hud-browser tl-clip tr-clip br-clip bl-clip border inlay'],
        ['.files-sidebar', 'hud-sidebar tl-clip br-clip bl-clip border inlay'],
        ['.player-bar', 'hud-player tl-clip tr-clip border inlay'],
        ['.caption-chip', 'hud-narration tl-clip tr-clip br-clip bl-clip border inlay', true],
        ['.window-topbar .window-titlebar-left > button:first-child', 'hud-roadmap tr-clip bl-clip border inlay', true],
        ['.window-topbar .window-titlebar-left > button:nth-child(2)', 'hud-prev tl-clip br-clip border inlay', true],
        ['.window-topbar .btn-explain', 'hud-explain tr-clip bl-clip border inlay', true],
        ['.window-topbar button[aria-label*="flotante" i], .window-topbar button[aria-label*="lado" i]', 'hud-floating tl-clip br-clip border inlay', true],
        ['.window-topbar .btn-next-lesson, .window-topbar button[aria-label="Siguiente"]', 'hud-next tl-clip br-clip border inlay', true],
        ['.window-topbar .neu-pill-btn:not(:first-child):not(.btn-explain):not(.btn-next-lesson)', 'hud-action tl-clip br-clip border inlay', true],
        ['.file-item-btn', 'hud-file tl-clip br-clip border inlay', true],
        ['.tab-btn', 'hud-tab tl-clip tr-clip border inlay', true],
        ['.browser-url-box', 'hud-url tl-clip br-clip border inlay', true],
        ['button[aria-label="Abrir conceptos"]', 'hud-concepts tl-clip tr-clip border inlay', true],
        ['.console-trigger-btn', 'hud-console br-clip border inlay', true],
        ['.editor-action-btn, .round-icon-btn', 'hud-control tl-clip br-clip border inlay', true],
        ['.play-main-btn', 'hud-play tl-clip br-clip border inlay', true],
        ['.logic-runner-panel, .modal-dialog, [role="dialog"] > div', 'hud-panel tl-clip tr-clip br-clip bl-clip border inlay'],
        ['.modal-dialog button.btn-brand, [role="dialog"] button.btn-brand', 'hud-primary tl-clip br-clip border inlay', true],
        ['.modal-dialog button.neu-pill-btn:not(.btn-brand), [role="dialog"] button.neu-pill-btn:not(.btn-brand)', 'hud-action tl-clip br-clip border inlay', true],
        ['.course-card', 'hud-card tl-clip br-clip border inlay'],
        ['.course-card > button', 'hud-primary tl-clip br-clip border inlay', true],
        ['.rm-hero', 'hud-hero tl-clip tr-clip br-clip bl-clip border inlay'],
      ];
      map.forEach(([sel, aug, reset]) => {
        document.querySelectorAll(sel).forEach((el) => {
          if (isHud) {
            el.setAttribute('data-augmented-ui', aug);
            if (reset) el.setAttribute('data-augmented-ui-reset', '');
          } else {
            el.removeAttribute('data-augmented-ui');
            el.removeAttribute('data-augmented-ui-reset');
          }
        });
      });
    };

    if (hudParam || (!defaultParam && hudStored)) {
      document.documentElement.classList.add('hud');
    } else {
      document.documentElement.classList.remove('hud');
    }
    applyHudAugs();
    // Observar cambios de clase hud para aplicar/quitar augs
    const mo = new MutationObserver(applyHudAugs);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    // Aplicar augs también en mutaciones del DOM (navegación)
    const domMo = new MutationObserver(() => {
      if (document.documentElement.classList.contains('hud')) applyHudAugs();
    });
    domMo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      domMo.disconnect();
    };
  }, []);

  // Sync custom scrims and progress from storage on mount
  useEffect(() => {
    let isMounted = true;
    const savedProgress = loadUserProgress();
    setProgress(savedProgress);

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

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshProgress = () => {
    setProgress(loadUserProgress());
  };

  const handleSelectItem = (item: CurriculumItem, moduleId: string, initialTimeMs = 0) => {
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
    saveRoute({ view: 'catalog' });
    setCurrentView('catalog');
  };

  const handleOpenCourse = (courseId: string) => {
    const selected = courses.find((candidate) => candidate.id === courseId);
    if (!selected) return;
    setCourse(selected);
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

  const handleNext = () => {
    if (activeItem?.type === 'reading') {
      markItemCompleted(activeItem.id);
      refreshProgress();
    }
    const nav = getNav();
    if (!nav.hasNext || !nav.next) {
      // Last element: coherent finalization
      refreshProgress();
      saveRoute({ view: 'home', courseId: course.id });
      setCurrentView('home');
      return;
    }
    if (activeItem) {
      updateRecentPosition(course.id, activeModuleId, activeItem.id, activeItem.title, activeItem.type, scrimInitialTimeMs);
    }
    handleSelectItem(nav.next.item, nav.next.moduleId, 0);
  };

  const handleResumeRecent = (courseId: string, moduleId: string, itemId: string, timeMs?: number) => {
    // Find item across modules
    for (const mod of course.modules) {
      const found = mod.items.find((i) => i.id === itemId);
      if (found) {
        handleSelectItem(found, mod.id, timeMs || 0);
        return;
      }
    }
    // Fallback to first item
    if (course.modules[0]?.items[0]) {
      handleSelectItem(course.modules[0].items[0], course.modules[0].id, 0);
    }
  };

  const handleNextLesson = () => {
    // Keep for backward compat, delegate to handleNext
    handleNext();
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
  const activeScrimIsUnavailable = currentView === 'scrim' && activeItem?.type === 'scrim' && !activeScrimData;
  const activeScrimError = activeScrimData?.audioTrack?.audioError;
  const activeScrimCannotPlay = activeScrimIsUnavailable || Boolean(activeScrimError);

  return (
    <div className={currentView === 'scrim' ? 'app-screen' : undefined}>
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
          scrims={scrimsMap}
          onEnterLesson={(item, modId, timeMs) => handleSelectItem(item, modId, timeMs ?? 0)}
          onPlayground={() => {
            setPlaygroundReturnView('home');
            saveRoute({ view: 'playground' });
            setCurrentView('playground');
          }}
          onBackToCourses={handleBackToCourses}
        />
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
              {activeScrimError
                || (customScrimsStatus === 'loading'
                ? 'Cargando la clase guardada…'
                : customScrimsError || 'No se encontró el contenido de esta clase.')}
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
        <ScrimPlayer
          key={activeItem.id}
          lessonData={
            activeItem.type === 'scrim' && activeScrimData
              ? activeScrimData
              : activeItem.type === 'challenge'
              ? {
                  id: activeItem.id,
                  title: activeItem.title,
                  description: activeItem.description || '',
                  templateId: activeItem.templateId,
                  durationMs: 8000,
                  initialWorkspace: activeItem.initialWorkspace,
                  events: [],
                  snapshots: [],
                  challenges: [activeItem.challenge],
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
          onPositionChange={(timeMs) => {
            saveRoute({
              view: 'scrim',
              courseId: course.id,
              moduleId: activeModuleId,
              itemId: activeItem.id,
              timestampMs: timeMs,
            });
          }}
        />
      )}

      {currentView === 'debugging' && activeItem && activeItem.type === 'debugging' && (
        <DebuggingView
          exercise={activeItem}
          courseTitle={course.title}
          onBack={handleBackToRoadmap}
          onBackToRoadmap={handleBackToRoadmap}
          onPrevious={navigationState.hasPrevious ? handlePrevious : undefined}
          onNext={navigationState.hasNext ? handleNext : handleBackToRoadmap}
          navigationState={navigationState}
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
          onCompleted={refreshProgress}
        />
      )}

      {currentView === 'solo-project' && activeItem && activeItem.type === 'solo-project' && (
        <SoloProjectView
          project={activeItem}
          courseTitle={course.title}
          onBack={handleBackToRoadmap}
          onBackToRoadmap={handleBackToRoadmap}
          onPrevious={navigationState.hasPrevious ? handlePrevious : undefined}
          onNext={navigationState.hasNext ? handleNext : handleBackToRoadmap}
          navigationState={navigationState}
        />
      )}

      {currentView === 'playground' && (
        <PlaygroundView
          onBack={() => {
            refreshProgress();
            if (playgroundReturnView === 'home') {
              saveRoute({ view: 'home', courseId: course.id });
              setCurrentView('home');
            } else {
              saveRoute({ view: 'catalog' });
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
    </div>
  );
}
