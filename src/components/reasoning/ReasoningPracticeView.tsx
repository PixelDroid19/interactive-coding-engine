import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, ChevronLeft, HelpCircle, Lightbulb, Network, RotateCcw, Sparkles } from 'lucide-react';
import { ReasoningAttempt, ReasoningConnection, ReasoningExerciseItem } from '../../types/curriculum';
import { NavigationState } from '../../engine/navigation';
import { createInitialReasoningAttempt, validateReasoningAttempt } from '../../engine/reasoningRunner';
import { createReasoningActivityVersion, loadReasoningDraft, markItemCompleted, saveReasoningDraft } from '../../engine/persistence';
import { SequenceDiagram } from './diagrams/SequenceDiagram';
import { TraceTable } from './diagrams/TraceTable';
import { FlowchartDiagram } from './diagrams/FlowchartDiagram';
import { ModuleDependencyDiagram } from './diagrams/ModuleDependencyDiagram';
import { VectorRankingDiagram } from './diagrams/VectorRankingDiagram';
import { ContextBudgetDiagram } from './diagrams/ContextBudgetDiagram';
import { ThemeToggle } from '../ThemeToggle';
import { PostSolveStudio } from '../learning/PostSolveStudio';
import { recordPostSolveEvidence } from '../../learning/curriculumEvidence';
import { PracticeBrief } from '../practice/PracticeBrief';
import { splitPracticeCopy } from '../practice/practiceCopy';
import type { ExerciseCompletion } from '../../services/learningSync';

interface Props {
  item: ReasoningExerciseItem;
  onBack: () => void;
  onBackToRoadmap?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  navigationState?: NavigationState;
  onCompleted?: (completion?: ExerciseCompletion) => void;
  onAttempt?: (result: 'success' | 'partial' | 'failure', completion: ExerciseCompletion) => void;
}

function sameConnection(left: ReasoningConnection, right: ReasoningConnection) {
  return left.from === right.from && left.to === right.to && (left.label ?? '') === (right.label ?? '');
}

export function ReasoningPracticeView({ item, onBack, onBackToRoadmap, onPrevious, onNext, navigationState, onCompleted, onAttempt }: Props) {
  const version = useMemo(() => createReasoningActivityVersion(item.activity), [item.activity]);
  const restored = useMemo(() => loadReasoningDraft(item.id, version), [item.id, version]);
  const [attempt, setAttempt] = useState<ReasoningAttempt>(() => restored?.attempt ?? createInitialReasoningAttempt(item.activity));
  const [revealedHints, setRevealedHints] = useState(restored?.revealedHints ?? 0);
  const [result, setResult] = useState<ReturnType<typeof validateReasoningAttempt> | null>(null);
  const [postSolveComplete, setPostSolveComplete] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { titleRef.current?.focus({ preventScroll: true }); setPostSolveComplete(false); }, [item.id]);
  useEffect(() => { saveReasoningDraft(item.id, { attempt, revealedHints, activityVersion: version }); }, [attempt, item.id, revealedHints, version]);

  const moveStep = (id: string, delta: number) => {
    if (attempt.kind !== 'sequence' && attempt.kind !== 'vector-ranking') return;
    const index = attempt.order.indexOf(id);
    const target = index + delta;
    if (target < 0 || target >= attempt.order.length) return;
    const order = [...attempt.order];
    [order[index], order[target]] = [order[target], order[index]];
    setAttempt(attempt.kind === 'sequence' ? { kind: 'sequence', order } : { kind: 'vector-ranking', order });
    setResult(null);
  };

  const toggleConnection = (connection: ReasoningConnection) => {
    if (attempt.kind !== 'flowchart' && attempt.kind !== 'dependency-map') return;
    const current = attempt.kind === 'flowchart' ? attempt.connections : attempt.dependencies;
    const next = current.some((edge) => sameConnection(edge, connection))
      ? current.filter((edge) => !sameConnection(edge, connection))
      : [...current, connection];
    setAttempt(attempt.kind === 'flowchart' ? { kind: 'flowchart', connections: next } : { kind: 'dependency-map', dependencies: next });
    setResult(null);
  };

  const check = () => {
    const next = validateReasoningAttempt(item.activity, attempt);
    setResult(next);
    const passed = next.checks.filter((check) => check.passed).length;
    onAttempt?.(next.allPassed ? 'success' : passed > 0 ? 'partial' : 'failure', {
      score: next.checks.length > 0 ? Math.round((passed / next.checks.length) * 100) : 0,
      response: { attempt }, diagnostics: { result: next, revealedHints },
    });
    if (next.allPassed) {
      markItemCompleted(item.id);
      onCompleted?.({
        score: next.checks.length > 0 ? Math.round((next.checks.filter((check) => check.passed).length / next.checks.length) * 100) : 100,
        response: { attempt },
        diagnostics: { result: next, revealedHints },
      });
    }
  };

  const activity = item.activity;
  const reasoningPracticeCopy = splitPracticeCopy(activity.prompt, 'last');
  const expectedResult = activity.kind === 'sequence'
    ? 'Los pasos quedan en un orden que se puede ejecutar.'
    : activity.kind === 'trace-table'
      ? 'Cada celda muestra el valor correcto después de ese paso.'
      : activity.kind === 'decision-table'
        ? 'Cada caso termina en el resultado que define la regla.'
        : activity.kind === 'flowchart'
          ? 'Las conexiones forman todos los caminos válidos.'
          : activity.kind === 'dependency-map'
            ? 'Las dependencias apuntan en la dirección correcta.'
            : activity.kind === 'vector-ranking'
              ? 'Las opciones quedan ordenadas según el criterio.'
              : 'La selección cabe en el presupuesto y conserva lo esencial.';
  const selectedConnections = attempt.kind === 'flowchart' ? attempt.connections : attempt.kind === 'dependency-map' ? attempt.dependencies : [];

  return (
    <div className="reasoning-screen app-screen">
      <header className="window-topbar">
        <div className="window-titlebar-left min-w-0">
          <button type="button" className="neu-pill-btn" onClick={onBackToRoadmap || onBack}><ArrowLeft size={15} /> Roadmap</button>
          {onPrevious && <button type="button" className="neu-pill-btn" onClick={onPrevious} disabled={!navigationState?.hasPrevious}><ChevronLeft size={15} /> Anterior</button>}
          <span className="category-tag"><Network size={13} /> Piensa</span>
          <span className="topbar-lesson-title truncate">{item.title}</span>
        </div>
        <ThemeToggle compact />
      </header>
      <main className="reasoning-main">
        <section className="reasoning-card">
          <header className="reasoning-header">
            <span className="reasoning-badge"><Sparkles size={13} /> Práctica de razonamiento</span>
            <h1 ref={titleRef} tabIndex={-1} className="reasoning-title outline-none focus:outline-none">{item.title}</h1>
            <PracticeBrief
              action={reasoningPracticeCopy.action}
              expected={expectedResult}
              help={item.hints.length > 0 ? (
                <div className="reasoning-hints-compact">
                  {reasoningPracticeCopy.context && <p>{reasoningPracticeCopy.context}</p>}
                  <header className="reasoning-hints-header">
                    <h2><Lightbulb size={18} className="reasoning-hint-icon" /> Pistas graduadas</h2>
                    <span className="reasoning-hints-count">{revealedHints} / {item.hints.length}</span>
                  </header>
                  {revealedHints > 0 && (
                    <div className="reasoning-hints-list">
                      {item.hints.slice(0, revealedHints).map((hint) => (
                        <div key={hint.level} className="reasoning-hint-card">
                          <span className="reasoning-hint-tag">Pista {hint.level}</span>
                          <p>{hint.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {revealedHints < item.hints.length && (
                    <button type="button" className="reasoning-hint-btn" onClick={() => setRevealedHints((value) => value + 1)}>
                      <HelpCircle size={15} /> Mostrar una pista
                    </button>
                  )}
                  {revealedHints === item.hints.length && (
                    <details className="reasoning-explanation-details">
                      <summary>Ver explicación completa</summary>
                      <p>{item.explanation}</p>
                    </details>
                  )}
                </div>
              ) : undefined}
            />
          </header>

          <div className="reasoning-workspace">
            {activity.kind === 'sequence' && attempt.kind === 'sequence' && (
              <SequenceDiagram
                steps={attempt.order.map((id) => activity.steps.find((step) => step.id === id)!)}
                onMove={moveStep}
                onReorder={(fromIndex, toIndex) => {
                  const order = [...attempt.order];
                  const [moved] = order.splice(fromIndex, 1);
                  order.splice(toIndex, 0, moved);
                  setAttempt({ kind: 'sequence', order });
                  setResult(null);
                }}
              />
            )}
            {activity.kind === 'trace-table' && attempt.kind === 'trace-table' && <TraceTable columns={activity.columns} rows={activity.rows} cells={attempt.cells} onChange={(cellId, value) => { setAttempt({ kind: 'trace-table', cells: { ...attempt.cells, [cellId]: value } }); setResult(null); }} />}
            
            {activity.kind === 'decision-table' && attempt.kind === 'decision-table' && (
              <div className="reasoning-decisions">
                {activity.cases.map((currentCase, idx) => {
                  const selectedVal = attempt.outcomes[currentCase.id] ?? '';
                  const isAnswered = Boolean(selectedVal);
                  return (
                    <div key={currentCase.id} className={`reasoning-decision-card ${isAnswered ? 'is-answered' : ''}`}>
                      <div className="reasoning-decision-label">
                        <span className="reasoning-decision-badge">0{idx + 1}</span>
                        <span className="reasoning-decision-title">{currentCase.label}</span>
                      </div>
                      <div className="reasoning-decision-select-wrapper">
                        <select
                          aria-label={currentCase.label}
                          value={selectedVal}
                          onChange={(event) => {
                            setAttempt({ kind: 'decision-table', outcomes: { ...attempt.outcomes, [currentCase.id]: event.target.value } });
                            setResult(null);
                          }}
                        >
                          <option value="">Elige un resultado...</option>
                          {currentCase.options.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="reasoning-select-icon" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activity.kind === 'flowchart' && <><FlowchartDiagram nodes={activity.nodes} connections={selectedConnections} /><ConnectionChoices choices={activity.connectionOptions} selected={selectedConnections} labels={Object.fromEntries(activity.nodes.map((node) => [node.id, node.label]))} onToggle={toggleConnection} /></>}
            {activity.kind === 'dependency-map' && <><ModuleDependencyDiagram modules={activity.modules} dependencies={selectedConnections} /><ConnectionChoices choices={activity.dependencyOptions} selected={selectedConnections} labels={Object.fromEntries(activity.modules.map((module) => [module.id, module.label]))} onToggle={toggleConnection} /></>}
            {activity.kind === 'vector-ranking' && attempt.kind === 'vector-ranking' && (
              <VectorRankingDiagram
                candidates={activity.candidates}
                order={attempt.order}
                onMove={moveStep}
                onReorder={(fromIndex, toIndex) => {
                  const order = [...attempt.order];
                  const [moved] = order.splice(fromIndex, 1);
                  order.splice(toIndex, 0, moved);
                  setAttempt({ kind: 'vector-ranking', order });
                  setResult(null);
                }}
              />
            )}
            {activity.kind === 'context-budget' && attempt.kind === 'context-budget' && <ContextBudgetDiagram budget={activity.budget} blocks={activity.blocks} selected={attempt.selected} onToggle={(id) => { const selected = attempt.selected.includes(id) ? attempt.selected.filter((item) => item !== id) : [...attempt.selected, id]; setAttempt({ kind: 'context-budget', selected }); setResult(null); }} />}
          </div>

          <div className="reasoning-actions">
            <button type="button" className="reasoning-check" onClick={check}>
              <CheckCircle2 size={18} /> Comprobar mi razonamiento
            </button>
            <button type="button" className="reasoning-reset-btn" onClick={() => { setAttempt(createInitialReasoningAttempt(item.activity)); setResult(null); }}>
              <RotateCcw size={16} /> Reiniciar
            </button>
          </div>

          {result && (
            <section className={`reasoning-feedback ${result.allPassed ? 'is-success' : 'is-error'}`} aria-live="polite">
              <div className="reasoning-feedback-header">
                <CheckCircle2 size={20} />
                <h2>{result.allPassed ? 'Resuelto' : 'Todavía no'}</h2>
              </div>
              <p>{result.feedbackMessage}</p>
              <ul>
                {result.checks.map((entry) => (
                  <li key={entry.id} className={entry.passed ? 'check-pass' : 'check-fail'}>
                    <span>{entry.passed ? '✓' : '✕'}</span>
                    <strong>{entry.label}:</strong> {entry.message}
                  </li>
                ))}
              </ul>
            </section>
          )}

        </section>
        {result?.allPassed && !postSolveComplete && (
          <PostSolveStudio
            itemId={item.id}
            title={item.title}
            instructions={activity.prompt}
            kind="reasoning"
            continueLabel="Registrar comprensión"
            onComplete={async (readingAnswer, variationAnswer) => {
              await recordPostSolveEvidence(item.id, readingAnswer, variationAnswer);
              setPostSolveComplete(true);
            }}
          />
        )}
      </main>

      <footer className="reasoning-footer">
        <button type="button" onClick={onPrevious} disabled={!onPrevious}><ChevronLeft size={16} /> Anterior</button>
        <span>{postSolveComplete ? '✓ Actividad comprendida' : result?.allPassed ? 'Explica el modelo antes de continuar' : 'Comprueba el modelo antes de continuar'}</span>
        <button type="button" onClick={onNext} disabled={!onNext || !result?.allPassed || !postSolveComplete}>Siguiente <ArrowRight size={16} /></button>
      </footer>
    </div>
  );
}

function ConnectionChoices({ choices, selected, labels, onToggle }: { choices: ReasoningConnection[]; selected: ReasoningConnection[]; labels: Record<string, string>; onToggle: (edge: ReasoningConnection) => void }) {
  return <fieldset className="reasoning-connection-choices"><legend>Elige las conexiones que forman el modelo correcto</legend>{choices.map((edge) => { const checked = selected.some((candidate) => sameConnection(candidate, edge)); return <label key={`${edge.from}-${edge.to}-${edge.label ?? ''}`}><input type="checkbox" checked={checked} onChange={() => onToggle(edge)} /><span>{labels[edge.from] ?? edge.from} → {labels[edge.to] ?? edge.to}{edge.label ? ` (${edge.label})` : ''}</span></label>; })}</fieldset>;
}
