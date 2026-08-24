import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Route, Terminal, X } from 'lucide-react';
import { Course, CurriculumItem, UserProgressRecord } from '../../types/curriculum';
import { ScrimLessonData } from '../../types/scrim';
import {
  buildRoadmap,
  explainConcept,
  findCourseItem,
  RoadmapNode,
} from '../../curriculum/fundamentos/roadmap';

interface RoadmapHomeProps {
  course: Course;
  progress: UserProgressRecord;
  scrims: Record<string, ScrimLessonData>;
  onEnterLesson: (item: CurriculumItem, moduleId: string, timeMs?: number) => void;
  onPlayground: () => void;
}

export const RoadmapHome: React.FC<RoadmapHomeProps> = ({
  course,
  progress,
  scrims,
  onEnterLesson,
  onPlayground,
}) => {
  const [openConcept, setOpenConcept] = useState<RoadmapNode | null>(null);
  const phases = useMemo(() => buildRoadmap(course, scrims), [course, scrims]);
  const lessonCount = course.modules.reduce(
    (sum, mod) => sum + mod.items.filter((item) => item.type === 'scrim').length,
    0
  );
  const practiceCount = course.modules.reduce(
    (sum, mod) => sum + mod.items.filter((item) => item.type === 'debugging' || item.type === 'reasoning').length,
    0
  );

  const enterLesson = (lessonId: string) => {
    const found = findCourseItem(course, lessonId);
    if (found) onEnterLesson(found.item, found.moduleId, 0);
  };

  const conceptCopy = openConcept
    ? explainConcept(openConcept.lessonId, openConcept.focusTerm || openConcept.label)
    : null;

  useEffect(() => {
    const draw = () => {
      const svg = document.getElementById('rm-connectors');
      const tree = document.getElementById('rm-tree');
      if (!svg || !tree) return;
      svg.replaceChildren();
      const box = tree.getBoundingClientRect();

      const mains = phases.flatMap((phase) => phase.rows.map((row) => row.main.id));
      const links: { from: string; to: string; dotted?: boolean }[] = [];
      for (let i = 0; i < mains.length - 1; i++) links.push({ from: mains[i], to: mains[i + 1] });
      for (const phase of phases) {
        for (const row of phase.rows) {
          if (row.checkpoint) links.push({ from: row.main.id, to: row.checkpoint.id, dotted: true });
          if (row.reading) links.push({ from: row.main.id, to: row.reading.id, dotted: true });
          if (row.reasoning) links.push({ from: row.main.id, to: row.reasoning.id, dotted: true });
          if (row.concepts[0]) links.push({ from: row.main.id, to: row.concepts[0].id, dotted: true });
        }
      }

      for (const link of links) {
        const a = document.getElementById(link.from);
        const b = document.getElementById(link.to);
        if (!a || !b) continue;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const x1 = ra.left + ra.width / 2 - box.left;
        const y1 = ra.top + ra.height / 2 - box.top;
        const x2 = rb.left + rb.width / 2 - box.left;
        const y2 = rb.top + rb.height / 2 - box.top;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const cy = (y1 + y2) / 2;
        path.setAttribute('d', `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`);
        path.setAttribute('class', link.dotted ? 'rm-line-dot' : 'rm-line');
        svg.appendChild(path);
      }
    };

    draw();
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    const timer = window.setTimeout(draw, 40);
    return () => {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
    };
  }, [phases, openConcept]);

  const isDone = (lessonId: string) => progress.completedItemIds.includes(lessonId);
  const isCurrent = (lessonId: string) => progress.lastAccessedItemId === lessonId;

  return (
    <div className="roadmap-home">
      <header className="rm-nav">
        <div className="rm-nav-inner">
          <div className="rm-brand">
            <span className="rm-logo">
              <Route size={15} />
            </span>
            <span className="rm-wordmark">
              Aprende<span>Código</span>
            </span>
          </div>
          <button type="button" className="rm-play-btn" onClick={onPlayground}>
            <Terminal size={13} /> Playground
          </button>
        </div>
      </header>

      <main className="rm-main">
        <section className="rm-hero">
          <div>
            <div className="rm-hero-meta">
              <span className="rm-pill">Fundamentos</span>
              <span className="rm-time">{lessonCount} lecciones · {practiceCount} prácticas</span>
            </div>
            <h1>{course.title}</h1>
            <p>{course.description}</p>
          </div>
          <div className="rm-legend">
            <span>
              <i className="rm-swatch rm-swatch-yellow" /> Abre la clase
            </span>
            <span>
              <i className="rm-swatch rm-swatch-dark" /> Encuentra el error
            </span>
            <span>
              <i className="rm-swatch rm-swatch-reading" /> Lee antes de practicar
            </span>
            <span>
              <i className="rm-swatch rm-swatch-reasoning" /> Construye el modelo
            </span>
            <span>
              <i className="rm-swatch rm-swatch-white" /> Explica un concepto
            </span>
          </div>
        </section>

        <div className="rm-canvas">
          <div id="rm-tree" className="rm-tree">
            <svg id="rm-connectors" className="rm-svg" />
            {phases.map((phase, phaseIndex) => (
              <section key={phase.id} className="rm-phase">
                <div className={`rm-phase-badge rm-tone-${phase.tone}`}>
                  Fase {phaseIndex + 1}: {phase.title}
                </div>
                {phase.rows.map((row) => (
                  <div key={row.main.id} className="rm-row">
                    <div className="rm-col rm-col-left">
                      {row.reading && (
                        <button
                          id={row.reading.id}
                          type="button"
                          className={`rm-node-cp is-reading ${isCurrent(row.reading.lessonId) ? 'is-current' : ''} ${
                            isDone(row.reading.lessonId) ? 'is-done' : ''
                          }`}
                          onClick={() => enterLesson(row.reading!.lessonId)}
                        >
                          <em className="rm-cp-tag">Lee</em>
                          <span>{row.reading.label}</span>
                        </button>
                      )}
                      {row.reasoning && (
                        <button
                          id={row.reasoning.id}
                          type="button"
                          className={`rm-node-cp is-reasoning ${isCurrent(row.reasoning.lessonId) ? 'is-current' : ''} ${
                            isDone(row.reasoning.lessonId) ? 'is-done' : ''
                          }`}
                          onClick={() => enterLesson(row.reasoning!.lessonId)}
                        >
                          <em className="rm-cp-tag">Piensa</em>
                          <span>{row.reasoning.label}</span>
                        </button>
                      )}
                      {row.checkpoint && (
                        <button
                          id={row.checkpoint.id}
                          type="button"
                          className={`rm-node-cp ${isCurrent(row.checkpoint.lessonId) ? 'is-current' : ''} ${
                            isDone(row.checkpoint.lessonId) ? 'is-done' : ''
                          } ${row.checkpoint.itemType === 'reading' ? 'is-reading' : ''}`}
                          onClick={() => enterLesson(row.checkpoint!.lessonId)}
                        >
                          <em className="rm-cp-tag">{row.checkpoint.itemType === 'reading' ? 'Lee' : 'Depura'}</em>
                          <span>{row.checkpoint.label}</span>
                        </button>
                      )}
                    </div>
                    <div className="rm-col rm-col-mid">
                      <button
                        id={row.main.id}
                        type="button"
                        className={`rm-node-main ${isCurrent(row.main.lessonId) ? 'is-current' : ''} ${
                          isDone(row.main.lessonId) ? 'is-done' : ''
                        }`}
                        onClick={() => enterLesson(row.main.lessonId)}
                      >
                        <span>{row.main.label}</span>
                        {row.hasChallenge && <em className="rm-reto-flag">Reto</em>}
                        <ChevronRight size={14} />
                      </button>
                    </div>
                    <div className="rm-col rm-col-right">
                      {row.concepts.map((concept) => (
                        <button
                          id={concept.id}
                          key={concept.id}
                          type="button"
                          className={`rm-node-tag ${openConcept?.id === concept.id ? 'is-open' : ''}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenConcept((current) => (current?.id === concept.id ? null : concept));
                          }}
                        >
                          {concept.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </div>
      </main>

      {openConcept && conceptCopy && (
        <div className="rm-concept-backdrop" onClick={() => setOpenConcept(null)}>
          <aside className="rm-concept-pop" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="rm-briefing-close" onClick={() => setOpenConcept(null)} aria-label="Cerrar">
              <X size={14} />
            </button>
            <span className="rm-pill">Concepto</span>
            <h2>{conceptCopy.term}</h2>
            <p>{conceptCopy.desc}</p>
            <button
              type="button"
              className="rm-enter-btn"
              onClick={() => enterLesson(openConcept.lessonId)}
            >
              Verlo en la clase <ChevronRight size={14} />
            </button>
          </aside>
        </div>
      )}
    </div>
  );
};
