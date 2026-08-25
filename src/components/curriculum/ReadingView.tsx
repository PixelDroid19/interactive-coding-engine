import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronLeft, ExternalLink, Lightbulb } from 'lucide-react';
import { ReadingItem } from '../../types/curriculum';
import { NavigationState } from '../../engine/navigation';
import { AIInteractivePractice } from '../runtime/AIInteractivePractice';

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
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
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

        <main
          className={`mx-auto min-h-0 w-full flex-1 overflow-y-auto px-5 py-6 select-text ${reading.interactiveLab ? 'max-w-6xl' : 'max-w-3xl'}`}
          aria-label="Contenido de la lectura"
        >
          <article className="overflow-hidden rounded-xl border-2 border-zinc-700 bg-zinc-950 shadow-[5px_5px_0_#000]">
            <header className="border-b-2 border-dashed border-zinc-700 bg-zinc-950 px-5 py-5 sm:px-7 sm:py-6">
            <h1
              ref={titleRef}
              tabIndex={-1}
                className="text-2xl font-bold leading-tight text-zinc-100"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              {reading.title}
            </h1>
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-zinc-300">
                {reading.summary}
              </p>
            </header>

            <div className="divide-y divide-dashed divide-zinc-800">
            {reading.sections.map((section) => section.kind === 'curiosity' ? (
              <details
                key={section.title}
                className="group mx-5 my-5 rounded-xl border border-cyan-800 bg-cyan-950/25 open:border-cyan-600 sm:mx-7 sm:my-6"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-zinc-100 marker:content-none">
                  <span className="text-base font-bold leading-snug" style={{ fontFamily: 'Patrick Hand, cursive' }}>
                    {section.title}
                  </span>
                  <span className="shrink-0 rounded-full border border-cyan-700 bg-zinc-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-200">
                    Opcional
                  </span>
                </summary>
                <div className="border-t border-cyan-900 px-4 pb-4 pt-4">
                  <p className="text-[15px] leading-relaxed text-zinc-300">{section.content}</p>
                  {section.example && (
                    <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-lg bg-[#12151e] p-4 font-mono text-xs leading-relaxed text-slate-200">
                      {section.example}
                    </pre>
                  )}
                  {section.exampleCaption && (
                    <p className="mt-3 text-xs italic text-zinc-400">{section.exampleCaption}</p>
                  )}
                  <p className="mt-4 text-xs font-medium text-cyan-200">
                    Contenido opcional: no necesitas memorizarlo para continuar
                  </p>
                </div>
              </details>
            ) : (
              <article key={section.title} className="px-5 py-5 sm:px-7 sm:py-6">
                <h2
                  className="text-lg font-bold leading-snug text-zinc-100"
                  style={{ fontFamily: 'Patrick Hand, cursive' }}
                >
                  {section.title}
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-zinc-300">{section.content}</p>
                {section.example && (
                  <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-lg bg-[#12151e] p-4 font-mono text-xs leading-relaxed text-slate-200">
                    {section.example}
                  </pre>
                )}
                {section.exampleCaption && (
                  <p className="mt-3 text-xs italic text-zinc-400">{section.exampleCaption}</p>
                )}
              </article>
            ))}

              <aside className="border-t-2 border-yellow-400 bg-amber-950/40 px-5 py-5 sm:px-7 sm:py-6">
            <h2
              className="flex items-center gap-2 text-base font-bold text-amber-100"
              style={{ fontFamily: 'Patrick Hand, cursive' }}
            >
              <Lightbulb size={16} />
              Lo esencial antes de practicar
            </h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-zinc-200">
              {reading.keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
              </aside>
              {reading.interactiveLab && (
                <div className="px-4 py-5 sm:px-6 sm:py-6">
                  <AIInteractivePractice lab={reading.interactiveLab} />
                </div>
              )}
              {reading.frequentQuestions && reading.frequentQuestions.length > 0 && (
                <section className="border-t-2 border-sky-900 bg-sky-950/30 px-5 py-5 sm:px-7 sm:py-6" aria-labelledby="reading-faq-title">
                  <h2 id="reading-faq-title" className="text-lg font-bold text-sky-100" style={{ fontFamily: 'Patrick Hand, cursive' }}>
                    Dudas frecuentes de quien empieza
                  </h2>
                  <div className="mt-4 grid gap-3">
                    {reading.frequentQuestions.map((entry) => (
                      <details key={entry.question} className="rounded-lg border border-sky-900 bg-zinc-950 px-4 py-3">
                        <summary className="cursor-pointer font-bold text-zinc-100">{entry.question}</summary>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{entry.answer}</p>
                      </details>
                    ))}
                  </div>
                </section>
              )}
              {reading.transferPrompt && (
                <aside className="border-t-2 border-violet-900 bg-violet-950/30 px-5 py-5 sm:px-7 sm:py-6">
                  <h2 className="text-base font-bold text-violet-100">Llévalo a otro problema</h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-200">{reading.transferPrompt}</p>
                  <p className="mt-2 text-xs text-zinc-400">Respóndelo con palabras o un diagrama antes de abrir el editor.</p>
                </aside>
              )}
              {reading.sources && reading.sources.length > 0 && (
                <section className="border-t-2 border-emerald-900 bg-emerald-950/25 px-5 py-5 sm:px-7 sm:py-6" aria-labelledby="reading-sources-title">
                  <h2 id="reading-sources-title" className="text-lg font-bold text-emerald-100" style={{ fontFamily: 'Patrick Hand, cursive' }}>
                    Aprende a consultar la documentación
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                    No intentes memorizar la página. Busca el receptor, los parámetros, el retorno y si la operación modifica el valor original.
                  </p>
                  <ul className="mt-4 grid gap-3">
                    {reading.sources.map((source) => (
                      <li key={source.url} className="rounded-lg border border-emerald-900 bg-zinc-950 p-4">
                        <a className="inline-flex items-center gap-2 font-bold text-emerald-200 underline decoration-emerald-700 underline-offset-4" href={source.url} target="_blank" rel="noreferrer">
                          {source.title} <ExternalLink size={13} />
                        </a>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">{source.publisher}</p>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{source.purpose}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </article>

          <footer className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-300">
              Cuando lo tengas claro, pasa al ejercicio. Puedes volver a esta lectura cuando quieras.
            </p>
            <button
              type="button"
              onClick={onNext}
              disabled={!navigationState?.hasNext}
              className="neu-pill-btn btn-brand justify-center px-4 py-2 text-sm font-bold disabled:opacity-40"
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
