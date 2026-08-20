import React from 'react';
import { UserProgressRecord } from '../../types/curriculum';
import { Play, Clock } from 'lucide-react';

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
    <div className="continue-card">
      <div>
        <div className="module-kicker" style={{ marginBottom: 8 }}>Seguir aprendiendo</div>
        <h3 className="topbar-app-name" style={{ fontSize: 22, margin: 0, lineHeight: 1.15 }}>{itemTitle}</h3>
        <div style={{ marginTop: 8, color: 'var(--color-text-muted)', fontSize: 13, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span>{courseTitle}</span>
          {timeMs > 0 && (
            <span className="timestamp-text" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Clock size={13} />
              Pausado en {formatTime(timeMs)}
            </span>
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
        className="btn-next-lesson neu-pill-btn"
        style={{ alignSelf: 'flex-start' }}
      >
        <Play size={15} />
        Reanudar
      </button>
    </div>
  );
};
