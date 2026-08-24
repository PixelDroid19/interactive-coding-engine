import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, Lightbulb, Network, RotateCcw } from 'lucide-react';
import { ReasoningAttempt, ReasoningConnection, ReasoningExerciseItem } from '../../types/curriculum';
import { NavigationState } from '../../engine/navigation';
import { validateReasoningAttempt } from '../../engine/reasoningRunner';
import { createReasoningActivityVersion, loadReasoningDraft, markItemCompleted, saveReasoningDraft } from '../../engine/persistence';
import { SequenceDiagram } from './diagrams/SequenceDiagram';
import { TraceTable } from './diagrams/TraceTable';
import { FlowchartDiagram } from './diagrams/FlowchartDiagram';
import { ModuleDependencyDiagram } from './diagrams/ModuleDependencyDiagram';

interface Props {
  item: ReasoningExerciseItem;
  onBack: () => void;
  onBackToRoadmap?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  navigationState?: NavigationState;
  onCompleted?: () => void;
}

function initialAttempt(item: ReasoningExerciseItem): ReasoningAttempt {
  const activity = item.activity;
  if (activity.kind === 'sequence') return { kind: 'sequence', order: activity.steps.map((step) => step.id) };
  if (activity.kind === 'trace-table') return { kind: 'trace-table', cells: {} };
  if (activity.kind === 'decision-table') return { kind: 'decision-table', outcomes: {} };
  if (activity.kind === 'flowchart') return { kind: 'flowchart', connections: [] };
  return { kind: 'dependency-map', dependencies: [] };
}

function sameConnection(left: ReasoningConnection, right: ReasoningConnection) {
  return left.from === right.from && left.to === right.to && (left.label ?? '') === (right.label ?? '');
}

export function ReasoningPracticeView({ item, onBack, onBackToRoadmap, onPrevious, onNext, navigationState, onCompleted }: Props) {
  const version = useMemo(() => createReasoningActivityVersion(item.activity), [item.activity]);
  const restored = useMemo(() => loadReasoningDraft(item.id, version), [item.id, version]);
  const [attempt, setAttempt] = useState<ReasoningAttempt>(() => restored?.attempt ?? initialAttempt(item));
  const [revealedHints, setRevealedHints] = useState(restored?.revealedHints ?? 0);
  const [result, setResult] = useState<ReturnType<typeof validateReasoningAttempt> | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { titleRef.current?.focus({ preventScroll: true }); }, [item.id]);
  useEffect(() => { saveReasoningDraft(item.id, { attempt, revealedHints, activityVersion: version }); }, [attempt, item.id, revealedHints, version]);

  const moveStep = (id: string, delta: number) => {
    if (attempt.kind !== 'sequence') return;
    const index = attempt.order.indexOf(id);
    const target = index + delta;
    if (target < 0 || target >= attempt.order.length) return;
    const order = [...attempt.order];
    [order[index], order[target]] = [order[target], order[index]];
    setAttempt({ kind: 'sequence', order });
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
    if (next.allPassed) {
      markItemCompleted(item.id);
      onCompleted?.();
    }
  };

  const activity = item.activity;
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
      </header>
      <main className="reasoning-main">
        <section className="reasoning-card">
          <header><span>Práctica de razonamiento</span><h1 ref={titleRef} tabIndex={-1}>{item.title}</h1><p>{activity.prompt}</p></header>
          <div className="reasoning-workspace">
            {activity.kind === 'sequence' && attempt.kind === 'sequence' && (
              <div>
                <SequenceDiagram steps={attempt.order.map((id) => activity.steps.find((step) => step.id === id)!)} />
                <div className="reasoning-order-controls">
                  {attempt.order.map((id, index) => {
                    const step = activity.steps.find((candidate) => candidate.id === id)!;
                    return <div key={id}><strong>{step.label}</strong><button type="button" onClick={() => moveStep(id, -1)} disabled={index === 0}>Subir</button><button type="button" onClick={() => moveStep(id, 1)} disabled={index === attempt.order.length - 1}>Bajar</button></div>;
                  })}
                </div>
              </div>
            )}
            {activity.kind === 'trace-table' && attempt.kind === 'trace-table' && <TraceTable columns={activity.columns} rows={activity.rows} cells={attempt.cells} onChange={(cellId, value) => { setAttempt({ kind: 'trace-table', cells: { ...attempt.cells, [cellId]: value } }); setResult(null); }} />}
            {activity.kind === 'decision-table' && attempt.kind === 'decision-table' && <div className="reasoning-decisions">{activity.cases.map((currentCase) => <label key={currentCase.id}><span>{currentCase.label}</span><select aria-label={currentCase.label} value={attempt.outcomes[currentCase.id] ?? ''} onChange={(event) => { setAttempt({ kind: 'decision-table', outcomes: { ...attempt.outcomes, [currentCase.id]: event.target.value } }); setResult(null); }}><option value="">Elige un resultado</option>{currentCase.options.map((option) => <option key={option}>{option}</option>)}</select></label>)}</div>}
            {activity.kind === 'flowchart' && <><FlowchartDiagram nodes={activity.nodes} connections={selectedConnections} /><ConnectionChoices choices={activity.connectionOptions} selected={selectedConnections} labels={Object.fromEntries(activity.nodes.map((node) => [node.id, node.label]))} onToggle={toggleConnection} /></>}
            {activity.kind === 'dependency-map' && <><ModuleDependencyDiagram modules={activity.modules} dependencies={selectedConnections} /><ConnectionChoices choices={activity.dependencyOptions} selected={selectedConnections} labels={Object.fromEntries(activity.modules.map((module) => [module.id, module.label]))} onToggle={toggleConnection} /></>}
          </div>
          <div className="reasoning-actions">
            <button type="button" className="reasoning-check" onClick={check}><CheckCircle2 size={18} /> Comprobar mi razonamiento</button>
            <button type="button" onClick={() => { setAttempt(initialAttempt(item)); setResult(null); }}><RotateCcw size={16} /> Reiniciar</button>
          </div>
          {result && <section className={`reasoning-feedback ${result.allPassed ? 'is-success' : 'is-error'}`} aria-live="polite"><h2>{result.allPassed ? 'Resuelto' : 'Todavía no'}</h2><p>{result.feedbackMessage}</p><ul>{result.checks.map((entry) => <li key={entry.id}>{entry.passed ? '✓' : '○'} {entry.label}: {entry.message}</li>)}</ul></section>}
          <aside className="reasoning-hints"><h2><Lightbulb size={16} /> Pistas graduadas</h2>{item.hints.slice(0, revealedHints).map((hint) => <p key={hint.level}>{hint.level}. {hint.text}</p>)}{revealedHints < item.hints.length && <button type="button" onClick={() => setRevealedHints((value) => value + 1)}>Mostrar una pista</button>}{revealedHints === item.hints.length && <details><summary>Ver explicación completa</summary><p>{item.explanation}</p></details>}</aside>
        </section>
      </main>
      <footer className="reasoning-footer"><button type="button" onClick={onPrevious} disabled={!onPrevious}><ChevronLeft size={16} /> Anterior</button><span>{result?.allPassed ? 'Actividad completada' : 'Comprueba el modelo antes de continuar'}</span><button type="button" onClick={onNext} disabled={!onNext || !result?.allPassed}>Siguiente <ArrowRight size={16} /></button></footer>
    </div>
  );
}

function ConnectionChoices({ choices, selected, labels, onToggle }: { choices: ReasoningConnection[]; selected: ReasoningConnection[]; labels: Record<string, string>; onToggle: (edge: ReasoningConnection) => void }) {
  return <fieldset className="reasoning-connection-choices"><legend>Elige las conexiones que forman el modelo correcto</legend>{choices.map((edge) => { const checked = selected.some((candidate) => sameConnection(candidate, edge)); return <label key={`${edge.from}-${edge.to}-${edge.label ?? ''}`}><input type="checkbox" checked={checked} onChange={() => onToggle(edge)} /><span>{labels[edge.from] ?? edge.from} → {labels[edge.to] ?? edge.to}{edge.label ? ` (${edge.label})` : ''}</span></label>; })}</fieldset>;
}
