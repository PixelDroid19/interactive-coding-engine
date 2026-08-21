import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronLeft, Lightbulb } from 'lucide-react';
import { ReadingItem } from '../../types/curriculum';
import { NavigationState } from '../../engine/navigation';

interface ReadingViewProps {
  reading: ReadingItem;
  onBack: () => void;
  onBackToRoadmap?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  navigationState?: NavigationState;
}

export const ReadingView: React.FC<ReadingViewProps> = ({
  reading,
  onBack,
  onBackToRoadmap,
  onPrevious,
  onNext,
  navigationState,
}) => {
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    continueButtonRef.current?.focus();
  }, [reading.id]);

  return (
    <div className="app-screen">
      <div className="studio-card">
        <header className="window-topbar">
          <div className="window-titlebar-left min-w-0">
            <button
              type="button"
              onClick={onBackToRoadmap || onBack}
              className="neu-pill-btn shrink-0"
              aria-label="Volver al roadmap"
            >
              <ArrowLeft size={15} />
              <span>Roadmap</span>
            </button>
            {onPrevious && (
              <button
                type="button"
                onClick={onPrevious}
                disabled={!navigationState?.hasPrevious}
                className="neu-pill-btn shrink-0 disabled:opacity-40"
                aria-label="Anterior"
              >
                <ChevronLeft size={15} />
                <span className="hidden sm:inline">Anterior</span>
              </button>
            )}
            <div className="topbar-divider hidden sm:block" />
            <span className="category-tag">
              <BookOpen size={12} style={{ display: 'inline', marginRight: 4 }} />
              Lectura
            </span>
            <span className="topbar-lesson-title truncate">{reading.title}</span>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-5 py-6">
          <section className="rounded-xl border-2 border-black bg-white p-5 shadow-[5px_5px_0_#000]">
            <h1
              className="text-2xl font-bold text-zinc-900"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              {reading.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">{reading.summary}</p>
          </section>

          <div className="space-y-4">
            {reading.sections.map((section) => (
              <article
                key={section.title}
                className="rounded-xl border-2 border-black bg-white p-5 shadow-[4px_4px_0_#000]"
              >
                <h2
                  className="text-lg font-bold text-zinc-900"
                  style={{ fontFamily: 'Patrick Hand, cursive' }}
                >
                  {section.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-700">{section.content}</p>
                {section.example && (
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg border border-zinc-300 bg-[#12151e] p-3 font-mono text-xs leading-relaxed text-slate-200">
                    {section.example}
                  </pre>
                )}
                {section.exampleCaption && (
                  <p className="mt-2 text-xs italic text-zinc-500">{section.exampleCaption}</p>
                )}
              </article>
            ))}
          </div>

          <section className="rounded-xl border-2 border-yellow-400 bg-[#fffbe6] p-5 shadow-[4px_4px_0_#000]">
            <h2
              className="flex items-center gap-2 text-base font-bold text-zinc-900"
              style={{ fontFamily: 'Patrick Hand, cursive' }}
            >
              <Lightbulb size={16} />
              Lo esencial antes de practicar
            </h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-zinc-800">
              {reading.keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>

          <footer className="flex flex-col gap-3 rounded-xl border-2 border-black bg-white p-4 shadow-[4px_4px_0_#000] sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-600">
              Cuando lo tengas claro, pasa al ejercicio. Puedes volver a esta lectura cuando quieras.
            </p>
            <button
              ref={continueButtonRef}
              type="button"
              onClick={onNext}
              disabled={!navigationState?.hasNext}
              className="neu-pill-btn justify-center bg-[#ffe600] px-4 py-2 text-sm font-bold disabled:opacity-40"
              aria-label="Ir a la práctica"
            >
              Ir a la práctica
              <ArrowRight size={14} />
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
};
