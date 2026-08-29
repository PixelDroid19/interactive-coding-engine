import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock,
  ExternalLink,
  FlaskConical,
  Library,
  Lightbulb,
  ListTree,
  Terminal,
  Sparkles,
} from 'lucide-react';
import { ReadingItem } from '../../types/curriculum';
import { NavigationState } from '../../engine/navigation';
import { AIInteractivePractice } from '../runtime/AIInteractivePractice';
import { AILearningLab } from '../runtime/AILearningLab';
import { CellsLearningLab } from '../runtime/CellsLearningLab';
import type { CellsAppPracticeStage, CellsAppProject } from '../../engine/cells/cellsAppRecipes';
import type { CellsComponentPracticeStage } from '../../engine/cells/cellsRecipes';
import { openCellsArtifactForLesson } from '../../curriculum/open-cells/lessonProjects';
import { ThemeToggle } from '../ThemeToggle';
import { useTheme } from '../../themes/ThemeProvider';
import { LearningDiagram } from './LearningDiagram';
import { highlightReadingCode } from './readingCodeHighlight';

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
  const mainRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { themeId } = useTheme();
  const isCyber = themeId === 'cyber';

  const cellsAppLab: { stage: CellsAppPracticeStage; project: CellsAppProject; title: string } | null =
    ({
      'open-cells-app-playground': { stage: 'lifecycle', project: 'museum', title: 'Proyecto Museo Cells' },
      'open-cells-channels-playground': { stage: 'channels', project: 'relay', title: 'Proyecto Relé Cells' },
      'open-cells-data-playground': { stage: 'data', project: 'climate', title: 'Proyecto Clima Cells' },
      'open-cells-delivery-playground': { stage: 'delivery', project: 'capstone', title: 'Capstone Cells completo' },
    } as const)[reading.handsOnLab as string] ?? null;

  const cellsComponentLab: { stage: CellsComponentPracticeStage; title: string } | null =
    ({
      'open-cells-component-scaffold-playground': { stage: 'scaffold', title: 'Proyecto · manifiesto y entradas' },
      'open-cells-component-api-playground': { stage: 'api', title: 'Proyecto · API pública' },
      'open-cells-component-styles-playground': { stage: 'styles', title: 'Proyecto · SCSS y css.js generado' },
      'open-cells-playground': { stage: 'composition', title: 'Proyecto · composición scoped' },
      'open-cells-component-i18n-playground': { stage: 'i18n', title: 'Proyecto · traducciones' },
      'open-cells-component-demo-playground': { stage: 'demo', title: 'Proyecto · demo consumidora' },
      'open-cells-component-tests-playground': { stage: 'tests', title: 'Proyecto · pruebas públicas' },
      'open-cells-component-delivery-playground': { stage: 'delivery', title: 'Proyecto · entrega del paquete' },
    } as const)[reading.handsOnLab as string] ?? null;

  const openCellsLessonNumber = Number(reading.id.match(/^open-cells-(\d+)-lectura$/)?.[1]);
  const componentArtifact =
    cellsComponentLab && Number.isInteger(openCellsLessonNumber)
      ? openCellsArtifactForLesson(openCellsLessonNumber)
      : null;

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, [reading.id]);

  useEffect(() => {
    const mainEl = mainRef.current;
    if (!mainEl) return;

    const updateProgress = () => {
      const { scrollTop, scrollHeight, clientHeight } = mainEl;
      const maxScroll = scrollHeight - clientHeight;
      if (maxScroll <= 0) {
        setScrollProgress(100);
        return;
      }
      const percent = Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100)));
      setScrollProgress(percent);
    };

    mainEl.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
    return () => mainEl.removeEventListener('scroll', updateProgress);
  }, [reading.id]);

  const rawLessonNumber = reading.id.match(/\d+/)?.[0] ?? '01';
  const displayDeckNumber = String(rawLessonNumber).padStart(2, '0');

  return (
    <div className="app-screen reading-screen">
      <div className="studio-card">
        <header className="window-topbar reading-topbar">
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
            <div className="reading-topbar__context">
              <span className="category-tag">
                <BookOpen size={12} style={{ display: 'inline', marginRight: 4 }} />
                Lectura
              </span>
              <span className="topbar-lesson-title truncate">{reading.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="reading-time-pill hidden md:flex items-center gap-1.5 font-mono text-[11px]">
              <Clock size={12} className="reading-time-icon" />
              <span>~{reading.estimatedMinutes || 4} min</span>
              <span className="reading-time-divider">·</span>
              <span className="reading-progress-text">{scrollProgress}%</span>
            </div>
            <ThemeToggle compact />
          </div>
        </header>

        {/* Dynamic reading telemetry progress bar */}
        <div className="reading-progress-track" aria-hidden="true">
          <div className="reading-progress-fill" style={{ width: `${scrollProgress}%` }} />
        </div>

        <main
          ref={mainRef}
          className="reading-canvas min-h-0 w-full flex-1 overflow-y-auto px-5 py-6 select-text sm:px-8 sm:py-8 lg:px-12 lg:py-10"
          aria-label="Contenido de la lectura"
        >
          <div className="reading-page-grid">
            <nav className="reading-rail" aria-label="Secciones de la lectura">
              <div className="reading-rail-inner">
                <div className="reading-rail-header flex items-center justify-between">
                  <p className="reading-rail-label">En esta lectura</p>
                  <span className="reading-rail-pill font-mono text-[10px]">SYS.INDEX</span>
                </div>
                <a href="#reading-concepts-title" className="reading-rail-link">
                  <ListTree size={16} /> <span>Conceptos</span>
                </a>
                {(reading.interactiveLab || reading.handsOnLab) && (
                  <a href="#reading-lab-title" className="reading-rail-link">
                    <FlaskConical size={16} /> <span>Laboratorio</span>
                  </a>
                )}
                {(reading.frequentQuestions?.length || reading.transferPrompt) && (
                  <a href="#reading-apply-title" className="reading-rail-link">
                    <CheckCircle2 size={16} /> <span>Aclara y aplica</span>
                  </a>
                )}
                {reading.sources && reading.sources.length > 0 && (
                  <a href="#reading-sources-title" className="reading-rail-link">
                    <Library size={16} /> <span>Recursos</span>
                  </a>
                )}

                <aside
                  className="reading-keypoints"
                  data-augmented-ui={isCyber ? "reading-keypoints tl-clip br-clip border inlay" : undefined}
                >
                  <div className="reading-keypoints-header flex items-center gap-2.5">
                    <div className="reading-keypoints-icon">
                      <Lightbulb size={18} />
                    </div>
                    <div>
                      <span className="reading-keypoints-eyebrow">PROTOCOLO</span>
                      <h2 className="reading-keypoints-title">Antes de practicar</h2>
                    </div>
                  </div>
                  <ul>
                    {reading.keyPoints.map((point) => (
                      <li key={point} className="reading-keypoint-item">
                        <CheckCircle2 size={15} className="reading-keypoint-check" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </aside>
              </div>
            </nav>

            <div className="reading-content-flow">
              <header
                className="reading-hero relative overflow-hidden border border-zinc-700 bg-[#101218] px-6 py-7 sm:px-9 sm:py-8"
                data-augmented-ui={isCyber ? "reading-hero tl-clip tr-clip br-clip bl-clip border inlay" : undefined}
              >
                <div className="reading-hero-accent-bar absolute inset-y-0 left-0 w-1.5 bg-yellow-300" aria-hidden="true" />
                <div className="reading-hero-copy">
                  <div className="reading-hero-eyebrow-row flex items-center gap-2.5 flex-wrap">
                    <span className="reading-pulse-dot" aria-hidden="true" />
                    <p className="reading-hero-eyebrow text-[11px] font-black uppercase tracking-[0.2em] text-yellow-300">
                      Lectura de preparación
                    </p>
                    <span className="reading-hero-sys-badge font-mono text-[10px]">
                      DECK_{displayDeckNumber} // READY
                    </span>
                    <span className="reading-hero-stat-chip font-mono text-[11px] text-zinc-400">
                      · {reading.sections.length} {reading.sections.length === 1 ? 'idea' : 'ideas'}
                    </span>
                    {reading.frequentQuestions && reading.frequentQuestions.length > 0 && (
                      <span className="reading-hero-stat-chip font-mono text-[11px] text-zinc-400">
                        · {reading.frequentQuestions.length} {reading.frequentQuestions.length === 1 ? 'duda' : 'dudas'}
                      </span>
                    )}
                  </div>
                  <h1
                    ref={titleRef}
                    tabIndex={-1}
                    className="reading-hero-title mt-2 max-w-5xl text-2xl font-bold leading-tight text-zinc-100 outline-none sm:text-3xl lg:text-4xl"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    {reading.title}
                  </h1>
                  <p className="reading-hero-summary mt-3 max-w-4xl text-base leading-relaxed text-zinc-300 sm:text-[16.5px]">
                    {reading.summary}
                  </p>
                </div>
              </header>

              <section className="reading-overview" aria-label="Mapa de la lectura">
                <section aria-labelledby="reading-concepts-title" className="reading-concepts-zone">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="reading-zone-dot" aria-hidden="true" />
                        <p className="reading-zone-tag text-[10px] font-black uppercase tracking-[0.18em] text-yellow-300">
                          01 · Comprende
                        </p>
                      </div>
                      <h2 id="reading-concepts-title" className="reading-zone-title mt-1 text-2xl font-bold text-zinc-100">
                        Conceptos de la lectura
                      </h2>
                    </div>
                    <span className="reading-blocks-badge border border-zinc-700 px-3 py-1 text-xs font-bold text-zinc-400">
                      {reading.sections.length} bloques
                    </span>
                  </div>

                  <div className="reading-concept-grid">
                    {reading.sections.map((section, index) =>
                      section.kind === 'curiosity' ? (
                        <details
                          key={section.title}
                          className="reading-curiosity group open:border-cyan-500"
                          data-augmented-ui={isCyber ? "reading-concept tl-clip br-clip border inlay" : undefined}
                        >
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-zinc-100 marker:content-none">
                            <span
                              className="reading-curiosity-title text-base font-bold leading-snug"
                              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                            >
                              {section.title}
                            </span>
                            <span className="reading-curiosity-badge shrink-0 rounded border border-cyan-700 bg-zinc-950 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-200">
                              Opcional
                            </span>
                          </summary>
                          <div className="reading-curiosity-body border-t border-cyan-900 px-6 pb-6 pt-4">
                            <p className="text-[15px] leading-relaxed text-zinc-300">{section.content}</p>
                            {section.example && (
                              <div
                                className="reading-code-terminal mt-3 overflow-hidden rounded border border-zinc-700 bg-[#0c0e14]"
                                data-augmented-ui={isCyber ? "reading-terminal tl-clip br-clip border inlay" : undefined}
                              >
                                <div className="reading-code-terminal__header" aria-hidden="true">
                                  <div className="reading-code-dots">
                                    <span className="dot dot--red" />
                                    <span className="dot dot--yellow" />
                                    <span className="dot dot--green" />
                                  </div>
                                  <span className="reading-code-label">TERMINAL // JS</span>
                                </div>
                                <pre className="reading-code-pre whitespace-pre-wrap break-words p-3.5 font-mono text-xs leading-relaxed text-slate-200">
                                  {highlightReadingCode(section.example)}
                                </pre>
                              </div>
                            )}
                            {section.exampleCaption && (
                              <div className="reading-caption-row mt-2 flex items-center gap-1.5 text-xs italic text-zinc-400">
                                <span className="reading-caption-arrow" aria-hidden="true">↳</span>
                                <span>{section.exampleCaption}</span>
                              </div>
                            )}
                            <p className="reading-curiosity-note mt-3 text-xs font-medium text-cyan-300">
                              Contenido opcional: no necesitas memorizarlo para continuar
                            </p>
                          </div>
                        </details>
                      ) : (
                        <article
                          key={section.title}
                          className="reading-concept-block"
                          data-augmented-ui={isCyber ? "reading-concept tl-clip br-clip border inlay" : undefined}
                        >
                          <div className="reading-concept-header flex items-center justify-between gap-3 mb-2">
                            <h2
                              className="reading-concept-title text-base sm:text-lg font-bold leading-snug text-zinc-100"
                              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                            >
                              {section.title}
                            </h2>
                            <span
                              className="reading-concept-number font-mono text-xs font-bold text-zinc-500 shrink-0"
                              aria-hidden="true"
                            >
                              {String(index + 1).padStart(2, '0')}
                            </span>
                          </div>
                          <p className="reading-concept-text text-sm sm:text-[15.5px] leading-relaxed text-zinc-300">
                            {section.content}
                          </p>
                          {section.diagram && <LearningDiagram diagram={section.diagram} />}
                          {section.example && (
                            <div
                              className="reading-code-terminal mt-3 overflow-hidden rounded border border-zinc-700 bg-[#0c0e14]"
                              data-augmented-ui={isCyber ? "reading-terminal tl-clip br-clip border inlay" : undefined}
                            >
                              <div className="reading-code-terminal__header" aria-hidden="true">
                                <div className="reading-code-dots">
                                  <span className="dot dot--red" />
                                  <span className="dot dot--yellow" />
                                  <span className="dot dot--green" />
                                </div>
                                <span className="reading-code-label">TERMINAL // JS</span>
                              </div>
                              <pre className="reading-code-pre whitespace-pre-wrap break-words p-3.5 font-mono text-xs leading-relaxed text-slate-200">
                                {highlightReadingCode(section.example)}
                              </pre>
                            </div>
                          )}
                          {section.exampleCaption && (
                            <div className="reading-caption-row mt-2 flex items-center gap-1.5 text-xs italic text-zinc-400">
                              <span className="reading-caption-arrow" aria-hidden="true">↳</span>
                              <span>{section.exampleCaption}</span>
                            </div>
                          )}
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
                  <CellsLearningLab
                    key={reading.id}
                    componentStage={cellsComponentLab.stage}
                    componentArtifactId={componentArtifact?.id}
                    lessonId={reading.relatedLessonId ?? reading.id.replace(/-lectura$/, '')}
                  />
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
                  <CellsLearningLab
                    key={reading.id}
                    variant="application"
                    stage={cellsAppLab.stage}
                    project={cellsAppLab.project}
                    lessonId={reading.relatedLessonId ?? reading.id.replace(/-lectura$/, '')}
                  />
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
                        <p className="reading-faq-eyebrow text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">
                          Aclara antes de seguir
                        </p>
                        <h2
                          id="reading-faq-title"
                          className="reading-cursive-heading mt-1 text-xl font-bold text-sky-100"
                        >
                          Dudas frecuentes de quien empieza
                        </h2>
                        <div className="reading-faq-list mt-4 grid gap-3">
                          {reading.frequentQuestions.map((entry) => (
                            <details
                              key={entry.question}
                              className="reading-faq-card group rounded-lg border border-sky-900 bg-zinc-950 px-4 py-3"
                              data-augmented-ui={isCyber ? "reading-faq tl-clip br-clip border inlay" : undefined}
                            >
                              <summary className="reading-faq-summary flex items-center justify-between cursor-pointer font-bold text-zinc-100">
                                <span>{entry.question}</span>
                                <ChevronDown size={16} className="reading-faq-chevron shrink-0 transition-transform duration-200 group-open:rotate-180" />
                              </summary>
                              <p className="reading-faq-answer mt-2.5 text-sm leading-relaxed text-zinc-300 border-t border-sky-950/60 pt-2.5">
                                {entry.answer}
                              </p>
                            </details>
                          ))}
                        </div>
                      </section>
                    )}
                    {reading.transferPrompt && (
                      <aside
                        className="reading-transfer-zone"
                        data-augmented-ui={isCyber ? "reading-transfer tl-clip tr-clip br-clip bl-clip border inlay" : undefined}
                      >
                        <p className="reading-transfer-eyebrow text-[10px] font-black uppercase tracking-[0.18em] text-yellow-300">
                          Transfiere lo aprendido
                        </p>
                        <h2
                          className="reading-cursive-heading mt-1 text-xl font-bold text-amber-100"
                        >
                          Llévalo a otro problema
                        </h2>
                        <p className="reading-transfer-prompt mt-4 text-[15px] leading-relaxed text-zinc-200">
                          {reading.transferPrompt}
                        </p>
                        <div className="reading-transfer-footer mt-4 border-t border-amber-900/60 pt-4 flex items-center gap-2 text-xs text-zinc-400">
                          <span className="reading-transfer-icon font-mono text-yellow-400">↳</span>
                          <span>Respóndelo con palabras o un diagrama antes de abrir el editor.</span>
                        </div>
                      </aside>
                    )}
                  </div>
                </section>
              )}

              {reading.sources && reading.sources.length > 0 && (
                <section className="reading-library-zone" aria-label="Biblioteca de campo">
                  <div className="max-w-3xl">
                    <p className="reading-sources-eyebrow text-[10px] font-black uppercase tracking-[0.18em] text-yellow-300">
                      04 · Biblioteca de campo
                    </p>
                    <h2
                      id="reading-sources-title"
                      className="reading-cursive-heading mt-1 text-2xl font-bold text-zinc-100"
                    >
                      Documentación para explorar
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                      No memorices las páginas. Localiza tarea, parámetros, retorno, compatibilidad y límites.
                    </p>
                  </div>
                  <ul aria-label="Fuentes recomendadas" className="reading-source-grid">
                    {reading.sources.map((source, index) => (
                      <li
                        key={source.url}
                        className="reading-source-card group"
                        data-augmented-ui={isCyber ? "reading-source tl-clip br-clip border inlay" : undefined}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="reading-source-publisher text-[10px] font-black uppercase tracking-[0.14em] text-yellow-500">
                            {source.publisher}
                          </p>
                          <span className="reading-source-number font-mono text-xs text-zinc-600">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <a
                          className="reading-source-link mt-3 inline-flex items-start gap-2 text-base font-bold leading-snug text-zinc-100 underline decoration-yellow-700 underline-offset-4 group-hover:text-yellow-100"
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span>{source.title}</span>
                          <ExternalLink size={14} className="mt-1 shrink-0 reading-source-arrow" />
                        </a>
                        <p className="reading-source-purpose mt-auto pt-4 text-sm leading-relaxed text-zinc-400">
                          {source.purpose}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <footer className="reading-footer">
                <p className="reading-footer-text text-sm text-zinc-300">
                  Cuando lo tengas claro, pasa al ejercicio. Puedes volver a esta lectura cuando quieras.
                </p>
                <button
                  type="button"
                  onClick={onNext}
                  disabled={!navigationState?.hasNext}
                  className="reading-cta-btn neu-pill-btn btn-brand justify-center px-5 py-2.5 text-sm font-bold disabled:opacity-40"
                  aria-label="Ir a la práctica"
                  data-augmented-ui={isCyber ? "reading-cta tr-clip bl-clip border inlay" : undefined}
                >
                  <span>Ir a la práctica</span>
                  <ArrowRight size={14} className="reading-cta-arrow" />
                </button>
              </footer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

