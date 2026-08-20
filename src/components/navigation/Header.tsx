import React from 'react';
import { Code2, PlusCircle, BookOpen, CheckCircle2, Pencil } from 'lucide-react';
import { UserProgressRecord } from '../../types/curriculum';

interface HeaderProps {
  currentView: 'home' | 'playground' | 'studio' | 'scrim' | 'debugging' | 'solo-project';
  onNavigate: (view: 'home' | 'playground' | 'studio') => void;
  progress: UserProgressRecord;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  progress,
}) => {
  const completedCount = progress.completedItemIds.length;

  return (
    <header className="window-topbar">
      <div className="window-titlebar-left">
        <nav className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('home')}
            className={`neu-pill-btn ${currentView === 'home' ? 'rail-btn-active' : ''}`}
          >
            <BookOpen size={15} />
            <span>Curso</span>
          </button>
          <button
            onClick={() => onNavigate('playground')}
            className={`neu-pill-btn ${currentView === 'playground' ? 'rail-btn-active' : ''}`}
          >
            <Code2 size={15} />
            <span>Playground</span>
          </button>
          <button
            onClick={() => onNavigate('studio')}
            className={`neu-pill-btn ${currentView === 'studio' ? 'rail-btn-active' : ''}`}
          >
            <PlusCircle size={15} />
            <span>Grabar</span>
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {completedCount > 0 && (
          <span className="category-tag" style={{ transform: 'rotate(1deg)' }}>
            <CheckCircle2 size={13} style={{ display: 'inline', marginRight: 4 }} />
            {completedCount} hechas
          </span>
        )}
        <button onClick={() => onNavigate('studio')} className="neu-pill-btn">
          <Pencil size={14} />
          <span>Nueva grabación</span>
        </button>
      </div>
    </header>
  );
};
