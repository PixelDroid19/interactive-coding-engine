import React, { useState, useEffect } from 'react';
import { Course, CurriculumItem, UserProgressRecord } from './types/curriculum';
import { ScrimLessonData } from './types/scrim';
import { FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS } from './curriculum/fundamentos/course';
import { loadUserProgress, loadCustomCourses, loadCustomScrims, updateRecentPosition } from './engine/persistence';
import { Header } from './components/navigation/Header';
import { CourseOverview } from './components/curriculum/CourseOverview';
import { ContinueLearningCard } from './components/curriculum/ContinueLearningCard';
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
    if (!activeItem) return;
    refreshProgress();

    // Flatten all items across modules
    const allItems: { item: CurriculumItem; moduleId: string }[] = [];
    course.modules.forEach((mod) => {
      mod.items.forEach((it) => allItems.push({ item: it, moduleId: mod.id }));
    });

    const currentIndex = allItems.findIndex((x) => x.item.id === activeItem.id);
    if (currentIndex >= 0 && currentIndex < allItems.length - 1) {
      const next = allItems[currentIndex + 1];
      handleSelectItem(next.item, next.moduleId, 0);
    } else {
      setCurrentView('home');
    }
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

  return (
    <div className="min-h-screen w-full bg-[#0d0d0d] text-slate-200 font-sans selection:bg-blue-600/30 selection:text-white">
      {/* Show header on top-level views */}
      {currentView === 'home' && (
        <Header
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          progress={progress}
        />
      )}

      {/* View Router */}
      {currentView === 'home' && (
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <ContinueLearningCard
              progress={progress}
              onResume={handleResumeRecent}
            />

            <CourseOverview
              course={course}
              progress={progress}
              onSelectItem={(item, modId) => handleSelectItem(item, modId, 0)}
            />
          </div>
        </main>
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
          onBack={() => {
            refreshProgress();
            setCurrentView('home');
          }}
          onNextLesson={handleNextLesson}
          initialTimeMs={scrimInitialTimeMs}
        />
      )}

      {currentView === 'debugging' && activeItem && activeItem.type === 'debugging' && (
        <DebuggingView
          exercise={activeItem}
          courseTitle={course.title}
          onBack={() => {
            refreshProgress();
            setCurrentView('home');
          }}
          onNext={handleNextLesson}
        />
      )}

      {currentView === 'solo-project' && activeItem && activeItem.type === 'solo-project' && (
        <SoloProjectView
          project={activeItem}
          courseTitle={course.title}
          onBack={() => {
            refreshProgress();
            setCurrentView('home');
          }}
          onNext={handleNextLesson}
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
