import React, { useState, useEffect } from 'react';
import { Course, CurriculumItem, UserProgressRecord } from './types/curriculum';
import { ScrimLessonData } from './types/scrim';
import { FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS } from './curriculum/fundamentos/course';
import { loadUserProgress, loadCustomCourses, loadCustomScrims, updateRecentPosition } from './engine/persistence';
import { getOrderedItems, getNavigationState } from './engine/navigation';
import { RoadmapHome } from './components/curriculum/RoadmapHome';
import { ScrimPlayer } from './components/player/ScrimPlayer';
import { DebuggingView } from './components/challenges/DebuggingView';
import { SoloProjectView } from './components/challenges/SoloProjectView';
import { PlaygroundView } from './components/playground/PlaygroundView';
import { CreatorStudio } from './components/studio/CreatorStudio';

type AppView = 'home' | 'scrim' | 'debugging' | 'solo-project' | 'playground' | 'studio';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [course, setCourse] = useState<Course>(FUNDAMENTOS_COURSE);
  const [activeItem, setActiveItem] = useState<CurriculumItem | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string>('mod-primeros-pasos');
  const [scrimsMap, setScrimsMap] = useState<Record<string, ScrimLessonData>>(FUNDAMENTOS_SCRIMS);
  const [progress, setProgress] = useState<UserProgressRecord>(() => loadUserProgress());
  const [scrimInitialTimeMs, setScrimInitialTimeMs] = useState(0);

  // Sync custom scrims and progress from storage on mount
  useEffect(() => {
    const savedProgress = loadUserProgress();
    setProgress(savedProgress);

    const customScrims = loadCustomScrims();
    setScrimsMap((prev) => ({ ...prev, ...customScrims }));

    const customCourses = loadCustomCourses();
    if (customCourses.length > 0) {
      // Merge custom courses if available
    }
  }, []);

  const refreshProgress = () => {
    setProgress(loadUserProgress());
  };

  const handleSelectItem = (item: CurriculumItem, moduleId: string, initialTimeMs = 0) => {
    setActiveItem(item);
    setActiveModuleId(moduleId);
    setScrimInitialTimeMs(initialTimeMs);

    updateRecentPosition(course.title, moduleId, item.id, item.title, item.type, initialTimeMs);
    refreshProgress();

    if (item.type === 'scrim') {
      setCurrentView('scrim');
    } else if (item.type === 'debugging') {
      setCurrentView('debugging');
    } else if (item.type === 'solo-project') {
      setCurrentView('solo-project');
    } else if (item.type === 'challenge') {
      // Standalone challenge can open in scrim player or direct test runner
      setCurrentView('scrim');
    }
  };

  const handleBackToRoadmap = () => {
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
      updateRecentPosition(course.title, activeModuleId, activeItem.id, activeItem.title, activeItem.type, scrimInitialTimeMs);
    }
    handleSelectItem(nav.previous.item, nav.previous.moduleId, 0);
  };

  const handleNext = () => {
    const nav = getNav();
    if (!nav.hasNext || !nav.next) {
      // Last element: coherent finalization
      refreshProgress();
      setCurrentView('home');
      return;
    }
    if (activeItem) {
      updateRecentPosition(course.title, activeModuleId, activeItem.id, activeItem.title, activeItem.type, scrimInitialTimeMs);
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

    // Append new lesson to first module of course
    setCourse((prevCourse) => {
      const updatedModules = [...prevCourse.modules];
      if (updatedModules[0]) {
        updatedModules[0] = {
          ...updatedModules[0],
          items: [
            ...updatedModules[0].items,
            {
              id: newLesson.id,
              title: newLesson.title,
              type: 'scrim',
              estimatedMinutes: Math.max(1, Math.ceil(newLesson.durationMs / 60000)),
              scrimDataId: newLesson.id,
            },
          ],
        };
      }
      return { ...prevCourse, modules: updatedModules };
    });

    refreshProgress();
    setCurrentView('home');
  };

  const navigationState = getNavigationState(course, activeItem?.id || null);

  return (
    <div className={currentView === 'scrim' ? 'app-screen' : undefined}>
      {currentView === 'home' && (
        <RoadmapHome
          course={course}
          progress={progress}
          scrims={scrimsMap}
          onEnterLesson={(item, modId, timeMs) => handleSelectItem(item, modId, timeMs ?? 0)}
          onPlayground={() => setCurrentView('playground')}
        />
      )}

      {currentView === 'scrim' && activeItem && (
        <ScrimPlayer
          key={activeItem.id}
          lessonData={
            activeItem.type === 'scrim' && scrimsMap[activeItem.scrimDataId]
              ? scrimsMap[activeItem.scrimDataId]
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
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                }
              : scrimsMap['fundamentos-01'] || Object.values(scrimsMap)[0]
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
            setCurrentView('home');
          }}
        />
      )}

      {currentView === 'studio' && (
        <CreatorStudio
          onBack={() => {
            refreshProgress();
            setCurrentView('home');
          }}
          onLessonPublished={handleLessonPublished}
        />
      )}
    </div>
  );
}
