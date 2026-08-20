import React from 'react';
import { UserProgressRecord } from '../../types/curriculum';
import { Play, Sparkles, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

interface ContinueLearningCardProps {
  progress: UserProgressRecord;
  onResume: (courseId: string, moduleId: string, itemId: string, timeMs?: number) => void;
}

export const ContinueLearningCard: React.FC<ContinueLearningCardProps> = ({
  progress,
  onResume,
}) => {
  if (!progress.lastAccessedItemId) return null;

  const formatTime = (ms?: number) => {
    if (!ms) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const recent = progress.recentActivity[0];
  const itemTitle = recent?.itemTitle || '1. Qué es programar';
  const courseTitle = recent?.courseId || 'Fundamentos de programación';
  const timeMs = progress.lastAccessedTimestamp || 0;

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#141416] border border-zinc-800/80 p-5 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-mono font-medium uppercase tracking-wider">
            <Sparkles className="h-3 w-3 text-zinc-300" />
            <span>Seguir aprendiendo</span>
          </div>

          <h3 className="text-lg font-semibold text-zinc-100 tracking-tight">
            {itemTitle}
          </h3>

          <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-mono">
            <span>{courseTitle}</span>
            {timeMs > 0 && (
              <>
                <span>&bull;</span>
                <span className="flex items-center gap-1 text-zinc-300">
                  <Clock className="h-3 w-3 text-zinc-400" />
                  Pausado en {formatTime(timeMs)}
                </span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() =>
            onResume(
              progress.lastAccessedCourseId || 'course-fundamentos',
              progress.lastAccessedModuleId || 'mod-primeros-pasos',
              progress.lastAccessedItemId!,
              progress.lastAccessedTimestamp
            )
          }
          className="flex items-center justify-center gap-2 rounded bg-zinc-100 hover:bg-white px-5 py-2 text-xs font-semibold text-zinc-900 shadow-sm transition-colors shrink-0"
        >
          <Play className="h-3.5 w-3.5 fill-zinc-900" />
          <span>Reanudar lección</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
