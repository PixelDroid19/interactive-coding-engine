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
          className="reading-canvas mx-auto min-h-0 w-full flex-1 overflow-y-auto px-4 py-5 select-text sm:px-6 sm:py-7 lg:px-8"
          aria-label="Contenido de la lectura"
        >
          <header className="reading-hero relative overflow-hidden rounded-2xl border-2 border-zinc-700 bg-[#101218] px-6 py-7 shadow-[6px_6px_0_#000] sm:px-9 sm:py-9">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-yellow-300" aria-hidden="true" />
            <div className="reading-hero-copy">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-yellow-300">Lectura de preparación</p>
              <h1
                ref={titleRef}
                tabIndex={-1}
                className="mt-2 max-w-5xl text-2xl font-bold leading-tight text-zinc-100 outline-none sm:text-3xl"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {reading.title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-300 sm:text-[17px]">
                {reading.summary}
              </p>
            </div>
            <div className="reading-hero-meta" aria-label="Duración y recorrido">
              <span><strong>{reading.estimatedMinutes}</strong> min</span>
              <span><strong>{reading.sections.length}</strong> ideas</span>
              {reading.interactiveLab && <span><strong>1</strong> laboratorio</span>}
            </div>
          </header>

          <section className="reading-overview mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]" aria-label="Mapa de la lectura">
            <section aria-labelledby="reading-concepts-title" className="rounded-2xl border border-zinc-700 bg-zinc-950/70 p-4 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">Mapa mental</p>
                  <h2 id="reading-concepts-title" className="mt-1 text-xl font-bold text-zinc-100">Conceptos de la lectura</h2>
                </div>
                <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-bold text-zinc-400">
                  {reading.sections.length} bloques
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {reading.sections.map((section, index) => section.kind === 'curiosity' ? (
                  <details
                    key={section.title}
                    className="group rounded-xl border border-cyan-800 bg-cyan-950/25 open:border-cyan-500 md:col-span-2"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-zinc-100 marker:content-none">
                      <span className="text-lg font-bold leading-snug" style={{ fontFamily: 'Patrick Hand, cursive' }}>
                        {section.title}
                      </span>
                      <span className="shrink-0 rounded-full border border-cyan-700 bg-zinc-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-200">
                        Opcional
                      </span>
                    </summary>
                    <div className="border-t border-cyan-900 px-5 pb-5 pt-4">
                      <p className="text-[15px] leading-relaxed text-zinc-300">{section.content}</p>
                      {section.example && <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-lg bg-[#12151e] p-4 font-mono text-xs leading-relaxed text-slate-200">{section.example}</pre>}
                      {section.exampleCaption && <p className="mt-3 text-xs italic text-zinc-400">{section.exampleCaption}</p>}
                      <p className="mt-4 text-xs font-medium text-cyan-200">Contenido opcional: no necesitas memorizarlo para continuar</p>
                    </div>
                  </details>
                ) : (
                  <article key={section.title} className="relative min-h-48 overflow-hidden rounded-xl border border-zinc-700 bg-[#15171d] p-5 shadow-[3px_3px_0_#050505]">
                    <span className="absolute right-4 top-3 font-mono text-3xl font-black text-zinc-800" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                    <h2 className="relative max-w-[85%] text-xl font-bold leading-snug text-zinc-100" style={{ fontFamily: 'Patrick Hand, cursive' }}>
                      {section.title}
                    </h2>
                    <p className="relative mt-3 text-[15px] leading-relaxed text-zinc-300">{section.content}</p>
                    {section.example && <pre className="relative mt-4 overflow-x-auto whitespace-pre-wrap rounded-lg bg-[#0c0e13] p-4 font-mono text-xs leading-relaxed text-slate-200">{section.example}</pre>}
                    {section.exampleCaption && <p className="relative mt-3 text-xs italic text-zinc-400">{section.exampleCaption}</p>}
                  </article>
                ))}
              </div>
            </section>

            <aside className="rounded-2xl border-2 border-yellow-400 bg-[#26180d] p-6 shadow-[5px_5px_0_#000] lg:sticky lg:top-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-yellow-300 bg-zinc-950 text-yellow-300">
                <Lightbulb size={18} />
              </div>
              <h2 className="mt-4 text-xl font-bold text-amber-100" style={{ fontFamily: 'Patrick Hand, cursive' }}>
                Lo esencial antes de practicar
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-200">
                {reading.keyPoints.map((point) => (
                  <li key={point} className="flex gap-3 border-t border-amber-900/70 pt-3 first:border-0 first:pt-0">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-yellow-300" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </section>

          {reading.interactiveLab && (
            <section className="reading-lab-zone mt-9" aria-label="Laboratorio interactivo">
              <div className="reading-zone-heading">
                <span>02</span>
                <div>
                  <p>Ahora hazlo tú</p>
                  <h2>Laboratorio interactivo</h2>
                </div>
              </div>
              <AIInteractivePractice lab={reading.interactiveLab} />
            </section>
          )}

          {(reading.frequentQuestions?.length || reading.transferPrompt) && (
            <div className="mt-7 grid gap-5 lg:grid-cols-2">
              {reading.frequentQuestions && reading.frequentQuestions.length > 0 && (
                <section className="rounded-2xl border border-sky-800 bg-sky-950/25 p-6" aria-labelledby="reading-faq-title">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">Aclara antes de seguir</p>
                  <h2 id="reading-faq-title" className="mt-1 text-xl font-bold text-sky-100" style={{ fontFamily: 'Patrick Hand, cursive' }}>Dudas frecuentes de quien empieza</h2>
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
                <aside className="rounded-2xl border border-violet-800 bg-violet-950/25 p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">Transfiere lo aprendido</p>
                  <h2 className="mt-1 text-xl font-bold text-violet-100" style={{ fontFamily: 'Patrick Hand, cursive' }}>Llévalo a otro problema</h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-zinc-200">{reading.transferPrompt}</p>
                  <p className="mt-4 border-t border-violet-900 pt-4 text-xs text-zinc-400">Respóndelo con palabras o un diagrama antes de abrir el editor.</p>
                </aside>
              )}
            </div>
          )}

          {reading.sources && reading.sources.length > 0 && (
            <section className="reading-library-zone mt-9" aria-label="Biblioteca de campo">
              <div className="max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">Biblioteca de campo</p>
                <h2 id="reading-sources-title" className="mt-1 text-xl font-bold text-emerald-100" style={{ fontFamily: 'Patrick Hand, cursive' }}>Documentación para explorar</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">No memorices las páginas. Localiza tarea, parámetros, retorno, compatibilidad y límites.</p>
              </div>
              <ul aria-label="Fuentes recomendadas" className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {reading.sources.map((source, index) => (
                  <li key={source.url} className="group flex min-h-44 flex-col rounded-xl border border-emerald-900 bg-[#101412] p-5 transition hover:-translate-y-0.5 hover:border-emerald-500">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-500">{source.publisher}</p>
                      <span className="font-mono text-xs text-zinc-600">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <a className="mt-3 inline-flex items-start gap-2 text-base font-bold leading-snug text-emerald-200 underline decoration-emerald-800 underline-offset-4 group-hover:text-emerald-100" href={source.url} target="_blank" rel="noreferrer">
                      {source.title} <ExternalLink size={14} className="mt-1 shrink-0" />
                    </a>
                    <p className="mt-auto pt-4 text-sm leading-relaxed text-zinc-400">{source.purpose}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <footer className="mt-7 flex flex-col gap-3 rounded-2xl border border-zinc-700 bg-[#101218] p-5 sm:flex-row sm:items-center sm:justify-between">
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
