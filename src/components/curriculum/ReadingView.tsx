import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronLeft, ExternalLink, FlaskConical, Library, Lightbulb, ListTree } from 'lucide-react';
import { ReadingItem } from '../../types/curriculum';
import { NavigationState } from '../../engine/navigation';
import { AIInteractivePractice } from '../runtime/AIInteractivePractice';
import { AILearningLab } from '../runtime/AILearningLab';
import { CellsLearningLab } from '../runtime/CellsLearningLab';
import type { CellsAppPracticeStage, CellsAppProject } from '../../engine/cells/cellsAppRecipes';
import type { CellsComponentPracticeStage } from '../../engine/cells/cellsRecipes';
import { ThemeToggle } from '../ThemeToggle';

interface ReadingViewProps {
  reading: ReadingItem;
  onBack: () => void;
  onBackToRoadmap?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  navigationState?: NavigationState;
}

export const ReadingView: React.FC<ReadingViewProps> = ({ reading, onBack, onBackToRoadmap, onPrevious, onNext, navigationState }) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cellsAppLab: { stage: CellsAppPracticeStage; project: CellsAppProject; title: string } | null = ({
    'open-cells-app-playground': { stage: 'lifecycle', project: 'museum', title: 'Proyecto Museo Cells' },
    'open-cells-channels-playground': { stage: 'channels', project: 'relay', title: 'Proyecto Relé Cells' },
    'open-cells-data-playground': { stage: 'data', project: 'climate', title: 'Proyecto Clima Cells' },
    'open-cells-delivery-playground': { stage: 'delivery', project: 'capstone', title: 'Capstone Cells completo' },
  } as const)[reading.handsOnLab as string] ?? null;
  const cellsComponentLab: { stage: CellsComponentPracticeStage; title: string } | null = ({
    'open-cells-component-scaffold-playground': { stage: 'scaffold', title: 'Proyecto · manifiesto y entradas' },
    'open-cells-component-api-playground': { stage: 'api', title: 'Proyecto · API pública' },
    'open-cells-component-styles-playground': { stage: 'styles', title: 'Proyecto · SCSS y css.js generado' },
    'open-cells-playground': { stage: 'composition', title: 'Proyecto · composición scoped' },
    'open-cells-component-i18n-playground': { stage: 'i18n', title: 'Proyecto · traducciones' },
    'open-cells-component-demo-playground': { stage: 'demo', title: 'Proyecto · demo consumidora' },
    'open-cells-component-tests-playground': { stage: 'tests', title: 'Proyecto · pruebas públicas' },
    'open-cells-component-delivery-playground': { stage: 'delivery', title: 'Proyecto · entrega del paquete' },
  } as const)[reading.handsOnLab as string] ?? null;

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, [reading.id]);

  return (
    <div className="app-screen">
      <div className="studio-card">
        <header className="window-topbar reading-topbar">
          <div className="window-titlebar-left min-w-0">
            <button type="button" onClick={onBackToRoadmap || onBack} className="neu-pill-btn shrink-0" aria-label="Volver al roadmap">
              <ArrowLeft size={15} />
              <span>Roadmap</span>
            </button>
            {onPrevious && (
              <button type="button" onClick={onPrevious} disabled={!navigationState?.hasPrevious} className="neu-pill-btn shrink-0 disabled:opacity-40" aria-label="Anterior">
                <ChevronLeft size={15} />
                <span className="hidden sm:inline">Anterior</span>
              </button>
            )}
            <div className="topbar-divider hidden sm:block" />
            <div className="reading-topbar__context">
              <span className="category-tag">
                <BookOpen size={12} style={{ display: 'inline', marginRight: 4 }} />
                Lectura
              </span>
              <span className="topbar-lesson-title truncate">{reading.title}</span>
            </div>
          </div>
          <ThemeToggle compact />
        </header>

        <main className="reading-canvas min-h-0 w-full flex-1 overflow-y-auto px-4 py-5 select-text sm:px-6 sm:py-7 lg:px-8" aria-label="Contenido de la lectura">
          <div className="reading-page-grid">
            <nav className="reading-rail" aria-label="Secciones de la lectura">
              <div className="reading-rail-inner">
                <p className="reading-rail-label">En esta lectura</p>
                <a href="#reading-concepts-title">
                  <ListTree size={16} /> Conceptos
                </a>
                {(reading.interactiveLab || reading.handsOnLab) && (
                  <a href="#reading-lab-title">
                    <FlaskConical size={16} /> Laboratorio
                  </a>
                )}
                {(reading.frequentQuestions?.length || reading.transferPrompt) && (
                  <a href="#reading-apply-title">
                    <CheckCircle2 size={16} /> Aclara y aplica
                  </a>
                )}
                {reading.sources && reading.sources.length > 0 && (
                  <a href="#reading-sources-title">
                    <Library size={16} /> Recursos
                  </a>
                )}
                <aside className="reading-keypoints">
                  <div className="reading-keypoints-icon">
                    <Lightbulb size={18} />
                  </div>
                  <h2>Antes de practicar</h2>
                  <ul>
                    {reading.keyPoints.map((point) => (
                      <li key={point}>
                        <CheckCircle2 size={15} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </aside>
              </div>
            </nav>

            <div className="reading-content-flow">
              <header className="reading-hero relative overflow-hidden border border-zinc-700 bg-[#101218] px-6 py-7 sm:px-9 sm:py-9">
                <div className="absolute inset-y-0 left-0 w-1.5 bg-yellow-300" aria-hidden="true" />
                <div className="reading-hero-copy">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-yellow-300">Lectura de preparación</p>
                  <h1 ref={titleRef} tabIndex={-1} className="mt-2 max-w-5xl text-2xl font-bold leading-tight text-zinc-100 outline-none sm:text-3xl lg:text-4xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {reading.title}
                  </h1>
                  <p className="mt-4 max-w-4xl text-base leading-relaxed text-zinc-300 sm:text-[17px]">{reading.summary}</p>
                </div>
                <div className="reading-hero-meta" aria-label="Contenido y recorrido">
                  <span>
                    <strong>{reading.sections.length}</strong> {reading.sections.length === 1 ? 'idea' : 'ideas'}
                  </span>
                  {(reading.interactiveLab || reading.handsOnLab || cellsAppLab) && (
                    <span>
                      <strong>1</strong> laboratorio
                    </span>
                  )}
                  {reading.frequentQuestions && reading.frequentQuestions.length > 0 ? (
                    <span>
                      <strong>{reading.frequentQuestions.length}</strong> {reading.frequentQuestions.length === 1 ? 'duda' : 'dudas'}
                    </span>
                  ) : reading.sources && reading.sources.length > 0 ? (
                    <span>
                      <strong>{reading.sources.length}</strong> {reading.sources.length === 1 ? 'fuente' : 'fuentes'}
                    </span>
                  ) : (
                    <span>
                      <strong>1</strong> práctica
                    </span>
                  )}
                </div>
              </header>

              <section className="reading-overview" aria-label="Mapa de la lectura">
                <section aria-labelledby="reading-concepts-title" className="reading-concepts-zone">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-yellow-300">01 · Comprende</p>
                      <h2 id="reading-concepts-title" className="mt-1 text-2xl font-bold text-zinc-100">
                        Conceptos de la lectura
                      </h2>
                    </div>
                    <span className="border border-zinc-700 px-3 py-1 text-xs font-bold text-zinc-400">{reading.sections.length} bloques</span>
                  </div>

                  <div className="reading-concept-grid">
                    {reading.sections.map((section, index) =>
                      section.kind === 'curiosity' ? (
                        <details key={section.title} className="reading-curiosity group open:border-cyan-500">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-zinc-100 marker:content-none">
                            <span className="text-base font-bold leading-snug" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                              {section.title}
                            </span>
                            <span className="shrink-0 rounded border border-cyan-700 bg-zinc-950 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-200">Opcional</span>
                          </summary>
                          <div className="border-t border-cyan-900 px-6 pb-6 pt-4">
                            <p className="text-[15px] leading-relaxed text-zinc-300">{section.content}</p>
                            {section.example && (
                              <div className="mt-3 overflow-hidden rounded border border-zinc-700 bg-[#0c0e14]">
                                <pre className="whitespace-pre-wrap break-words p-3.5 font-mono text-xs leading-relaxed text-slate-200">{section.example}</pre>
                              </div>
                            )}
                            {section.exampleCaption && <p className="mt-2 text-xs italic text-zinc-400">{section.exampleCaption}</p>}
                            <p className="mt-3 text-xs font-medium text-cyan-300">Contenido opcional: no necesitas memorizarlo para continuar</p>
                          </div>
                        </details>
                      ) : (
                        <article key={section.title} className="reading-concept-block">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <h2 className="text-base sm:text-lg font-bold leading-snug text-zinc-100" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                              {section.title}
                            </h2>
                            <span className="reading-concept-number font-mono text-xs font-bold text-zinc-500 shrink-0" aria-hidden="true">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                          </div>
                          <p className="text-sm sm:text-[15px] leading-relaxed text-zinc-300">{section.content}</p>
                          {section.example && (
                            <div className="mt-3 overflow-hidden rounded border border-zinc-700 bg-[#0c0e14]">
                              <pre className="whitespace-pre-wrap break-words p-3.5 font-mono text-xs leading-relaxed text-slate-200">{section.example}</pre>
                            </div>
                          )}
                          {section.exampleCaption && <p className="mt-2 text-xs italic text-zinc-400">{section.exampleCaption}</p>}
                        </article>
                      ),
                    )}
                  </div>
                </section>
              </section>

              {reading.interactiveLab && (
                <section className="reading-lab-zone" aria-label="Laboratorio interactivo">
                  <div className="reading-zone-heading">
                    <span>02</span>
                    <div>
                      <p>Ahora hazlo tú</p>
                      <h2 id="reading-lab-title">Laboratorio interactivo</h2>
                    </div>
                  </div>
                  <AIInteractivePractice lab={reading.interactiveLab} />
                </section>
              )}

              {reading.handsOnLab === 'embeddings-webgpu' && (
                <section className="reading-lab-zone" aria-label="Laboratorio interactivo">
                  <div className="reading-zone-heading">
                    <span>02</span>
                    <div>
                      <p>Ahora hazlo tú</p>
                      <h2 id="reading-lab-title">Laboratorio interactivo</h2>
                    </div>
                  </div>
                  <AILearningLab />
                </section>
              )}

              {cellsComponentLab && (
                <section className="reading-lab-zone reading-lab-zone--wide" aria-label="Laboratorio Open Cells">
                  <div className="reading-zone-heading">
                    <span>02</span>
                    <div>
                      <p>Ahora construye tú</p>
                      <h2 id="reading-lab-title">{cellsComponentLab.title}</h2>
                    </div>
                  </div>
                  <CellsLearningLab componentStage={cellsComponentLab.stage} />
                </section>
              )}

              {cellsAppLab && (
                <section className="reading-lab-zone reading-lab-zone--wide" aria-label="Laboratorio de aplicación Open Cells">
                  <div className="reading-zone-heading">
                    <span>02</span>
                    <div>
                      <p>Ahora integra tú</p>
                      <h2 id="reading-lab-title">{cellsAppLab.title}</h2>
                    </div>
                  </div>
                  <CellsLearningLab variant="application" stage={cellsAppLab.stage} project={cellsAppLab.project} />
                </section>
              )}

              {(reading.frequentQuestions?.length || reading.transferPrompt) && (
                <section className="reading-apply-zone" aria-labelledby="reading-apply-title">
                  <div className="reading-zone-heading">
                    <span>03</span>
                    <div>
                      <p>Comprueba tu modelo mental</p>
                      <h2 id="reading-apply-title">Aclara y aplica</h2>
                    </div>
                  </div>
                  <div className="reading-apply-grid">
                    {reading.frequentQuestions && reading.frequentQuestions.length > 0 && (
                      <section className="reading-faq-zone" aria-labelledby="reading-faq-title">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">Aclara antes de seguir</p>
                        <h2 id="reading-faq-title" className="mt-1 text-xl font-bold text-sky-100" style={{ fontFamily: 'Patrick Hand, cursive' }}>
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
                      <aside className="reading-transfer-zone">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-yellow-300">Transfiere lo aprendido</p>
                        <h2 className="mt-1 text-xl font-bold text-amber-100" style={{ fontFamily: 'Patrick Hand, cursive' }}>
                          Llévalo a otro problema
                        </h2>
                        <p className="mt-4 text-[15px] leading-relaxed text-zinc-200">{reading.transferPrompt}</p>
                        <p className="mt-4 border-t border-amber-900 pt-4 text-xs text-zinc-400">Respóndelo con palabras o un diagrama antes de abrir el editor.</p>
                      </aside>
                    )}
                  </div>
                </section>
              )}

              {reading.sources && reading.sources.length > 0 && (
                <section className="reading-library-zone" aria-label="Biblioteca de campo">
                  <div className="max-w-3xl">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-yellow-300">04 · Biblioteca de campo</p>
                    <h2 id="reading-sources-title" className="mt-1 text-2xl font-bold text-zinc-100" style={{ fontFamily: 'Patrick Hand, cursive' }}>
                      Documentación para explorar
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-300">No memorices las páginas. Localiza tarea, parámetros, retorno, compatibilidad y límites.</p>
                  </div>
                  <ul aria-label="Fuentes recomendadas" className="reading-source-grid">
                    {reading.sources.map((source, index) => (
                      <li key={source.url} className="group">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-yellow-500">{source.publisher}</p>
                          <span className="font-mono text-xs text-zinc-600">{String(index + 1).padStart(2, '0')}</span>
                        </div>
                        <a className="mt-3 inline-flex items-start gap-2 text-base font-bold leading-snug text-zinc-100 underline decoration-yellow-700 underline-offset-4 group-hover:text-yellow-100" href={source.url} target="_blank" rel="noreferrer">
                          {source.title} <ExternalLink size={14} className="mt-1 shrink-0" />
                        </a>
                        <p className="mt-auto pt-4 text-sm leading-relaxed text-zinc-400">{source.purpose}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <footer className="reading-footer">
                <p className="text-sm text-zinc-300">Cuando lo tengas claro, pasa al ejercicio. Puedes volver a esta lectura cuando quieras.</p>
                <button type="button" onClick={onNext} disabled={!navigationState?.hasNext} className="neu-pill-btn btn-brand justify-center px-4 py-2 text-sm font-bold disabled:opacity-40" aria-label="Ir a la práctica">
                  Ir a la práctica
                  <ArrowRight size={14} />
                </button>
              </footer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
