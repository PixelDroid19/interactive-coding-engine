import React from 'react';
import { Code2, PlusCircle, BookOpen, CheckCircle2 } from 'lucide-react';
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
    <header className="sticky top-0 z-40 flex h-12 w-full items-center justify-between border-b border-zinc-800/80 bg-[#121214] px-6">
      <div className="flex items-center gap-6">
        <nav className="flex items-center gap-1 text-xs">
          <button
            onClick={() => onNavigate('home')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
              currentView === 'home'
                ? 'bg-zinc-800 text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Curso</span>
          </button>

          <button
            onClick={() => onNavigate('playground')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
              currentView === 'playground'
                ? 'bg-zinc-800 text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Playground</span>
          </button>

          <button
            onClick={() => onNavigate('studio')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
              currentView === 'studio'
                ? 'bg-zinc-800 text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Record Scrim</span>
          </button>
        </nav>
      </div>

      {/* Progress & Clean User Actions */}
      <div className="flex items-center gap-3">
        {completedCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>{completedCount} hechas</span>
          </div>
        )}

        <button
          onClick={() => onNavigate('studio')}
          className="hidden sm:inline-flex text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 rounded border border-zinc-700/60 transition-colors"
        >
          New Recording
        </button>

        <div
          title="Learner Profile"
          className="w-7 h-7 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-[11px] font-bold text-zinc-200"
        >
          JS
        </div>
      </div>
    </header>
  );
};

