import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Lightbulb, X } from 'lucide-react';
import { useAuthSession } from '../../auth/AuthSessionProvider';
import { getLearningActorId } from '../../services/learningHttp';
import { queueExerciseAttempt } from '../../services/learningSync';
import { GUIDED_TOPICS, buildGuidedExercise, checkGuidedCode, createGuidedDraft, finishGuidedDraft, nextGuidedTopic, runGuidedPrediction,
  type GuidedConfidence, type GuidedDraft, type GuidedTopicId } from '../../learning/guidedPractice';
import { guidedStorageKey, loadGuidedDraft, saveGuidedDraft } from '../../learning/guidedPracticeStorage';
import { CodeEditor } from '../editor/CodeEditor';
import { useModalDialog } from '../useModalDialog';
import { UiButton } from '../ui/UiButton';
import { UiField } from '../ui/UiField';
import { UiSurface } from '../ui/UiSurface';

export function GuidedPractice({ courseSlug, onClose }: { courseSlug: string; onClose: () => void }) {
  const auth = useAuthSession();
  const userId = auth.status === 'ready' && auth.session.authenticated ? auth.session.user.id : null;
  const scope = userId ? `user:${userId}` : `guest:${getLearningActorId()}`;
  return <GuidedSession key={`${scope}:${courseSlug}`} storageKey={guidedStorageKey(scope, courseSlug)} courseSlug={courseSlug} shareWithTutor={Boolean(userId)} onClose={onClose} />;
}

function GuidedSession({ storageKey, courseSlug, shareWithTutor, onClose }: {
  storageKey: string; courseSlug: string; shareWithTutor: boolean; onClose: () => void;
}) {
  const [loaded] = useState(() => loadGuidedDraft(storageKey));
  const [draft, setDraft] = useState(loaded.draft);
  const [saved, setSaved] = useState(loaded.writable);
  const [error, setError] = useState('');
  const [syncError, setSyncError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const operation = useRef(0);
  const working = useRef(false);
  const topicDrafts = useRef(new Map<GuidedTopicId, GuidedDraft>());
  const heading = useRef<HTMLHeadingElement>(null);
  const dialog = useModalDialog<HTMLElement>({ open: true, onClose });
  const exercise = useMemo(() => buildGuidedExercise(draft.topicId, draft.round), [draft.topicId, draft.round]);
  const topic = GUIDED_TOPICS.find(entry => entry.id === draft.topicId)!;
  const allPassed = Boolean(draft.checks?.length && draft.checks.every(check => check.passed));
  const editorFile = useMemo(() => ({ name: 'practica.js', path: 'practica.js', language: 'javascript' as const, content: draft.code }), [draft.code]);

  useEffect(() => {
    setSaved(loaded.writable && saveGuidedDraft(storageKey, draft));
  }, [draft, loaded.writable, storageKey]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; operation.current++; };
  }, []);
  useEffect(() => { heading.current?.focus(); }, [draft.stage, draft.topicId, draft.round]);

  const update = (patch: Partial<GuidedDraft>) => {
    operation.current++;
    working.current = false;
    setBusy(false);
    setError('');
    setDraft(current => ({ ...current, ...patch }));
  };
  const recordAttempt = (state: GuidedDraft, stage: 'predict' | 'modify' | 'explain', result: 'success' | 'partial' | 'failure' | 'ungraded', confidence?: GuidedConfidence) => {
    if (!shareWithTutor) return;
    try {
      queueExerciseAttempt(courseSlug, exercise.id, 'challenge', result, {
        response: { prediction: state.prediction, predictionResult: state.predictionResult, code: state.code,
          checks: state.checks, explanation: state.explanation, confidence },
        diagnostics: { mode: 'guided-practice', topicId: topic.id, topicTitle: topic.title, title: exercise.title, stage,
          round: state.round, usedHelp: state.usedHelp, hintCount: state.hintCount, codeAttempts: state.codeAttempts,
          evaluation: stage === 'explain' || result === 'ungraded' ? 'ungraded' : 'executed' },
      });
    } catch { setSyncError(true); }
  };
  const predict = async (unsure = false) => {
    if (working.current || (!unsure && !draft.prediction.trim())) return;
    working.current = true;
    setBusy(true);
    setError('');
    const token = ++operation.current;
    try {
      const actual = await runGuidedPrediction(exercise);
      if (token !== operation.current) return;
      const correct = !unsure && draft.prediction.trim().replace(/^(['"])(.*)\1$/, '$2') === actual;
      const next = { ...draft, prediction: unsure ? '' : draft.prediction, predictionResult: { actual, correct }, usedHelp: draft.usedHelp || unsure };
      setDraft(next);
      recordAttempt(next, 'predict', correct ? 'success' : 'partial');
    } catch (cause) {
      if (token === operation.current) setError(cause instanceof Error ? cause.message : 'No se pudo ejecutar. Inténtalo de nuevo.');
    } finally {
      if (token === operation.current) { working.current = false; setBusy(false); }
    }
  };
  const check = async () => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError('');
    const token = ++operation.current;
    const next = { ...draft, codeAttempts: draft.codeAttempts + 1, checks: null };
    setDraft(next);
    try {
      const checks = await checkGuidedCode(exercise, draft.code);
      if (token !== operation.current) return;
      const checked = { ...next, checks };
      setDraft(checked);
      recordAttempt(checked, 'modify', checks.every(entry => entry.passed) ? 'success' : 'failure');
    } catch (cause) {
      if (token === operation.current) {
        setError(cause instanceof Error ? cause.message : 'No se pudo comprobar. Inténtalo de nuevo.');
        recordAttempt(next, 'modify', 'ungraded');
      }
    } finally {
      if (token === operation.current) { working.current = false; setBusy(false); }
    }
  };
  const finish = (confidence: GuidedConfidence) => {
    const next = finishGuidedDraft(draft, confidence);
    if (next === draft) return;
    recordAttempt(next, 'explain', 'partial', confidence);
    update(next);
  };
  const chooseTopic = (id: GuidedTopicId) => {
    // A topic switch preserves the unfinished code separately from the current shortcut.
    if (draft.stage !== 'done') {
      topicDrafts.current.set(draft.topicId, draft);
      if (!saveGuidedDraft(`${storageKey}:${draft.topicId}`, draft)) setSaved(false);
    }
    const previous = topicDrafts.current.get(id) ?? loadGuidedDraft(`${storageKey}:${id}`).draft;
    const lastRound = draft.history.filter(entry => entry.topicId === id).reduce((max, entry) => Math.max(max, entry.round), -1);
    const next = previous.topicId === id && previous.stage !== 'done' && previous.round > lastRound
      ? { ...previous, history: draft.history }
      : createGuidedDraft(id, lastRound + 1, draft.history);
    update(next);
    setShowExample(false);
  };
  const nextTopic = nextGuidedTopic(draft.history);
  const latest = draft.history.at(-1);
  const trace = exercise.trace[draft.traceIndex];
  const sample = <pre className="guided-code" aria-label="Código del ejemplo"><code>{exercise.sample.split('\n').map((line, index) => (
    <span className={trace?.line === index + 1 ? 'is-current' : undefined} key={index}><i aria-hidden="true">{index + 1}</i>{line}{'\n'}</span>
  ))}</code></pre>;

  return <div className="guided-backdrop">
    <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="guided-title" className="guided-dialog" tabIndex={-1}>
      <UiSurface as="div" className="guided-shell">
        <header className="guided-header">
          <div><span className="guided-eyebrow">PRÁCTICA GUIADA · BASES DE JAVASCRIPT</span><h1 id="guided-title">Un paso a la vez</h1><p>Lee, prueba y cambia algo pequeño. Puedes parar cuando lo necesites.</p></div>
          <UiButton variant="icon" onClick={onClose} aria-label="Cerrar práctica guiada"><X size={20} /></UiButton>
        </header>
        <div className="guided-scroll">
          <details className="guided-topics"><summary>Tema: {topic.title} · Cambiar</summary>
            <div>{GUIDED_TOPICS.map(entry => <UiButton key={entry.id} variant={entry.id === draft.topicId ? 'primary' : 'secondary'} onClick={() => chooseTopic(entry.id)} disabled={busy || entry.id === draft.topicId}>
              {entry.title}
            </UiButton>)}</div>
            <small>Conservamos tu intento si cambias de tema.</small>
          </details>
          <ol className="guided-steps" aria-label="Pasos de la práctica">
            {(['predict', 'modify', 'explain'] as const).map((stage, index) => <li key={stage} aria-current={draft.stage === stage ? 'step' : undefined}>{index + 1} · {['Leer', 'Cambiar', 'Explicar'][index]}</li>)}
          </ol>
          <h2 ref={heading} tabIndex={-1}>{draft.stage === 'done' ? 'Un paso más, a tu ritmo' : exercise.title}</h2>
          {loaded.notice && (!loaded.writable || (draft.stage === 'modify' && !draft.checks && draft.topicId === loaded.draft.topicId && draft.round === loaded.draft.round)) && <p className="guided-notice">{loaded.notice}</p>}

          {draft.stage === 'predict' && <div className="guided-grid">
            <div><p>{exercise.situation}</p>{sample}
              <UiButton variant="quiet" onClick={() => update({ traceIndex: draft.traceIndex < 0 ? 0 : -1, usedHelp: true })}><BookOpen size={16} />{trace ? 'Ocultar recorrido' : 'Ver línea por línea'}</UiButton>
              {trace && <UiSurface tone="soft" className="guided-trace"><strong>Paso {draft.traceIndex + 1} de {exercise.trace.length}</strong><p>{trace.explanation}</p><code>{trace.memory}</code>
                <div className="guided-actions"><UiButton variant="quiet" disabled={draft.traceIndex <= 0} onClick={() => update({ traceIndex: draft.traceIndex - 1 })}>Anterior</UiButton><UiButton variant="secondary" disabled={draft.traceIndex >= exercise.trace.length - 1} onClick={() => update({ traceIndex: draft.traceIndex + 1 })}>Siguiente línea</UiButton></div>
              </UiSurface>}
            </div>
            <div className="guided-task"><h3>¿Qué mostrará la consola?</h3><p>Prueba una respuesta. No pasa nada si aún no lo ves.</p>
              <UiField label="Mi predicción"><input value={draft.prediction} maxLength={160} onChange={event => update({ prediction: event.target.value, predictionResult: null })} onKeyDown={event => { if (event.key === 'Enter') void predict(); }} /></UiField>
              <div className="guided-actions"><UiButton variant="primary" disabled={busy || !draft.prediction.trim()} onClick={() => void predict()}>{busy ? 'Ejecutando…' : 'Ejecutar y comparar'}</UiButton><UiButton variant="quiet" disabled={busy} onClick={() => void predict(true)}>No lo sé todavía</UiButton></div>
              {draft.predictionResult && <UiSurface tone="soft" className="guided-feedback" role="status"><strong>{draft.predictionResult.correct ? 'Tu predicción coincide.' : 'Miremos qué ocurrió.'}</strong><p>La salida real es:</p><pre>{draft.predictionResult.actual}</pre>
                <p>{draft.predictionResult.correct ? 'Ahora prueba con otros datos.' : 'Puedes recorrer las líneas y observar qué dato cambia.'}</p>
                <UiButton variant="primary" onClick={() => update({ stage: 'modify' })}>Ahora lo intento <ArrowRight size={16} /></UiButton>
              </UiSurface>}
            </div>
          </div>}

          {draft.stage === 'modify' && <div className="guided-grid">
            <div><p>{exercise.task}</p><p className="guided-muted">La función ya está creada. Los nombres entre paréntesis reciben los datos de cada prueba; <code>return</code> entrega tu resultado.</p>
              <div className="guided-editor"><CodeEditor file={editorFile} lessonId={exercise.id} lineWrapping onCodeChange={code => update({ code, checks: null })} /></div>
              <div className="guided-actions"><UiButton variant="primary" disabled={busy} onClick={() => void check()}>{busy ? 'Comprobando…' : 'Comprobar mi código'}</UiButton><UiButton variant="quiet" onClick={() => { setShowExample(current => !current); update({ usedHelp: true }); }}>{showExample ? 'Ocultar ejemplo' : 'Volver al ejemplo'}</UiButton></div>
              {showExample && sample}
            </div>
            <div className="guided-task"><h3>Una ayuda, si la necesitas</h3><p>No tienes que resolverlo de memoria.</p>
              {exercise.hints.slice(0, draft.hintCount).map((hint, index) => <p className="guided-hint" key={hint}><strong>Pista {index + 1}.</strong> {hint}</p>)}
              <UiButton variant="secondary" disabled={draft.hintCount >= exercise.hints.length} onClick={() => update({ hintCount: draft.hintCount + 1, usedHelp: true })}><Lightbulb size={16} />{draft.hintCount ? 'Otra pista' : 'Dame una pista'}</UiButton>
              {draft.checks && <section className="guided-results" aria-label="Resultados de las pruebas"><h3 role="status">{allPassed ? 'Tu código pasó los 3 casos.' : 'Revisa el caso marcado y vuelve a probar.'}</h3>
                {draft.checks.map(check => <div key={check.input} className={check.passed ? 'is-passed' : 'is-pending'}><strong>{check.passed ? '✓ Correcto' : 'Por revisar'}</strong><code>{check.input}</code><small>Esperado: {check.expected}</small><small>Obtenido: {check.actual}</small></div>)}
              </section>}
              <UiButton variant="primary" disabled={!allPassed || busy} onClick={() => update({ stage: 'explain' })}>Explicar lo que hice <ArrowRight size={16} /></UiButton>
            </div>
          </div>}

          {draft.stage === 'explain' && <div className="guided-reflection">
            <p>{exercise.explainPrompt}</p>
            <UiField label="Mi explicación (opcional)" hint="Una frase basta. También puedes explicarlo en voz alta; no grabamos tu voz."><textarea rows={3} maxLength={2000} value={draft.explanation} onChange={event => update({ explanation: event.target.value })} /></UiField>
            <UiButton variant="quiet" onClick={() => update({ showReference: !draft.showReference, usedHelp: true })}>{draft.showReference ? 'Ocultar explicación' : 'Ver una explicación para comparar'}</UiButton>
            {draft.showReference && <UiSurface tone="soft" className="guided-feedback"><p>{exercise.reference}</p></UiSurface>}
            <h3>¿Cómo te sentiste con esta práctica?</h3><p>Es tu valoración, no una nota. Nos sirve para sugerir cuándo volver.</p>
            <div className="guided-actions"><UiButton variant="secondary" onClick={() => finish('again')}>Quiero repetir</UiButton><UiButton variant="secondary" onClick={() => finish('supported')}>Con ayuda</UiButton><UiButton variant="primary" onClick={() => finish('independent')}>Pude hacerlo por mi cuenta</UiButton></div>
            <UiButton variant="quiet" onClick={() => update({ stage: 'modify' })}>Volver a mi código</UiButton>
          </div>}

          {draft.stage === 'done' && <div className="guided-reflection">
            <CheckCircle2 size={28} aria-hidden="true" /><p>Comprobaste tu código con tres casos{latest?.usedHelp ? ' y usaste apoyo para avanzar' : ''}. No hace falta reiniciar todo el curso.</p>
            {latest && <p>Te proponemos volver a este tema el {new Date(latest.dueAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}, con otros datos.</p>}
            <p className="guided-muted">Resolver una práctica no demuestra por sí solo que ya domines el tema. El siguiente ejemplo te ayudará a comprobarlo.</p>
            <div className="guided-actions"><UiButton variant="primary" onClick={() => chooseTopic(draft.topicId)}>Otro ejemplo de este tema</UiButton><UiButton variant="secondary" onClick={() => chooseTopic(nextTopic)}>Siguiente: {GUIDED_TOPICS.find(entry => entry.id === nextTopic)?.title}</UiButton><UiButton variant="quiet" onClick={onClose}>Terminar por ahora</UiButton></div>
          </div>}
          {error && <p className="guided-error" role="alert">{error}</p>}
        </div>
        <footer className="guided-footer"><span>{saved ? 'Guardado en este navegador · puedes cerrar y retomar.' : 'No se pudo guardar en este navegador. No cierres si quieres conservar este intento.'}</span>
          <small>{syncError ? 'No pudimos poner el intento en la cola de envío al instructor.' : shareWithTutor ? 'Tus intentos se envían al instructor cuando hay conexión. Cerrar sesión borra el borrador privado de este dispositivo.' : 'Sin cuenta también puedes practicar. Este intento no se envía a un instructor.'}</small>
        </footer>
      </UiSurface>
    </section>
  </div>;
}
