import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, CheckCircle2, Download, Send, Square, Undo2, X } from 'lucide-react';
import type { LocalModelOption } from '../../engine/ai/localGenerationProtocol';
import { LocalGenerationService } from '../../engine/ai/localGenerationService';
import { getLocalGenerationSession } from '../../engine/ai/localGenerationSession';
import { isTutorResponseUsable, runTutorTurn } from '../../learning/tutor/tutorAgent';
import { type TutorMode } from '../../learning/tutor/tutorPrompt';
import { type TutorActivityContext, useTutorWorkspace } from '../../learning/tutor/tutorContext';
import type { TutorToolActivity } from '../../learning/tutor/tutorTools';
import { loadLearningProfile, saveTutorConversation, saveTutorModelPreference, saveTutorReinforcement } from '../../learning/curriculumEvidence';

interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

interface SocraticTutorProps {
  enabled: boolean;
  activity: TutorActivityContext;
  service?: LocalGenerationService;
  initialModelReady?: boolean;
}

const MODE_OPTIONS: Array<{ id: TutorMode; label: string; description: string }> = [
  { id: 'auto', label: 'Automático', description: 'El agente decide qué consultar o comprobar.' },
  { id: 'explain', label: 'Explícame', description: 'Aclara el concepto sin modificar el ejercicio.' },
  { id: 'hint', label: 'Dame una pista', description: 'Orienta sin revelar la solución.' },
  { id: 'review', label: 'Revisa mi trabajo', description: 'Lee el ejercicio completo y ofrece feedback.' },
  { id: 'collaborate', label: 'Trabaja conmigo', description: 'Puede aplicar los cambios que le pidas.' },
];

const PROFILE_LABELS: Record<LocalModelOption['profile'], string> = {
  light: 'Ligero',
  recommended: 'Recomendado',
  deep: 'Más capaz',
  custom: 'Personalizado',
};

function messageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function renderMessageContent(content: string): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  const fence = /```([^\n`]*)\n([\s\S]*?)```/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  const addText = (text: string, key: string) => {
    const clean = text.trim();
    if (clean) nodes.push(<p key={key}>{clean}</p>);
  };
  while ((match = fence.exec(content)) !== null) {
    addText(content.slice(cursor, match.index), `text-${cursor}`);
    const language = match[1].trim();
    nodes.push(<pre key={`code-${match.index}`} data-language={language || undefined}><code>{match[2].trim()}</code></pre>);
    cursor = fence.lastIndex;
  }
  const tail = content.slice(cursor);
  const openFence = tail.match(/```([^\n`]*)\n?/);
  if (openFence?.index !== undefined) {
    addText(tail.slice(0, openFence.index), `text-${cursor}`);
    const code = tail.slice(openFence.index + openFence[0].length).replace(/```\s*$/, '').trim();
    if (code) nodes.push(<pre key={`code-${cursor + openFence.index}`} data-language={openFence[1].trim() || undefined}><code>{code}</code></pre>);
  } else {
    addText(tail, `text-${cursor}`);
  }
  return nodes.length ? <div className="socratic-tutor__message-content">{nodes}</div> : <p>Pensando…</p>;
}

export const SocraticTutor: React.FC<SocraticTutorProps> = ({
  enabled,
  activity,
  service = getLocalGenerationSession(),
  initialModelReady = false,
}) => {
  const workspace = useTutorWorkspace();
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<LocalModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState('Qwen2.5-0.5B-Instruct-q4f16_1-MLC');
  const [modelReady, setModelReady] = useState(initialModelReady);
  const [loadingModels, setLoadingModels] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [progressLabel, setProgressLabel] = useState('');
  const [progress, setProgress] = useState<number | undefined>();
  const [mode, setMode] = useState<TutorMode>('auto');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [toolActivities, setToolActivities] = useState<TutorToolActivity[]>([]);
  const [hasAgentChanges, setHasAgentChanges] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const prepareAbortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const preferredModelRef = useRef(selectedModel);
  const conversationKey = `${activity.courseId}:${activity.itemId}`;

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void loadLearningProfile().then((profile) => {
      if (!active) return;
      preferredModelRef.current = profile.tutor.selectedModel;
      setSelectedModel(profile.tutor.selectedModel);
      const stored = profile.tutor.conversations[conversationKey] ?? [];
      const saved = stored
        .filter((message) => message.role === 'user' || isTutorResponseUsable(message.content))
        .map((message) => ({ ...message }));
      if (saved.length !== stored.length) void saveTutorConversation(conversationKey, saved);
      setMessages((current) => current.length > 0 ? current : saved);
    });
    return () => { active = false; };
  }, [conversationKey, enabled]);

  useEffect(() => {
    if (!open || models.length > 0 || loadingModels) return;
    let active = true;
    setLoadingModels(true);
    service.listModels().then((available) => {
      if (!active) return;
      setModels(available);
      const recommended = available.find((candidate) => candidate.id === preferredModelRef.current)
        ?? available.find((candidate) => candidate.profile === 'recommended')
        ?? available[0];
      if (recommended) setSelectedModel(recommended.id);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'No se pudo consultar el catálogo local.');
    }).finally(() => {
      if (active) setLoadingModels(false);
    });
    return () => { active = false; };
  }, [modelReady, models.length, open, service]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => (modelReady ? inputRef.current : closeRef.current)?.focus(), 20);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        window.setTimeout(() => launcherRef.current?.focus(), 0);
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => { window.clearTimeout(timer); document.removeEventListener('keydown', closeOnEscape); };
  }, [modelReady, open]);

  useEffect(() => {
    setDraft('');
    setError('');
    setToolActivities([]);
    setHasAgentChanges(false);
  }, [activity.itemId]);

  const selected = useMemo(
    () => models.find((model) => model.id === selectedModel),
    [models, selectedModel],
  );

  if (!enabled) return null;

  const prepare = async () => {
    setPreparing(true);
    setError('');
    setProgressLabel('Preparando el modelo local…');
    const controller = new AbortController();
    prepareAbortRef.current = controller;
    try {
      await service.prepareModel(selectedModel, {
        signal: controller.signal,
        onProgress: (report) => {
          setProgressLabel(report.label);
          setProgress(report.progress);
        },
      });
      setModelReady(true);
      setProgress(1);
      setProgressLabel('Modelo listo');
      preferredModelRef.current = selectedModel;
      await saveTutorModelPreference(selectedModel, true);
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
        setError(reason instanceof Error ? reason.message : 'No se pudo preparar el modelo local.');
      }
    } finally {
      prepareAbortRef.current = null;
      setPreparing(false);
    }
  };

  const send = async () => {
    const question = draft.trim();
    if (!question || generating) return;
    const userMessage: TutorMessage = { id: messageId('user'), role: 'user', content: question, createdAt: Date.now() };
    const assistantId = messageId('assistant');
    const previous = [...messages, userMessage];
    setMessages([...previous, { id: assistantId, role: 'assistant', content: '', createdAt: Date.now() }]);
    setDraft('');
    setGenerating(true);
    setError('');
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const turn = await runTutorTurn({
        mode,
        question,
        attemptCount: messages.filter((message) => message.role === 'user').length,
        activity,
        conversation: messages.map(({ role, content }) => ({ role, content })),
        generationOptions: {
          model: selectedModel,
          signal: controller.signal,
        },
      }, service, workspace);
      setToolActivities(turn.activities);
      setHasAgentChanges(turn.changedFiles.length > 0);
      if (turn.reinforcement) {
        await saveTutorReinforcement({
          courseId: activity.courseId,
          itemId: activity.itemId,
          ...turn.reinforcement,
        });
      }
      setMessages((current) => {
        const next = current.map((message) => message.id === assistantId ? { ...message, content: turn.response } : message);
        void saveTutorConversation(conversationKey, next);
        return next;
      });
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
        setError(reason instanceof Error ? reason.message : 'La ayuda local no pudo responder.');
      }
      setMessages((current) => {
        const next = current.filter((message) => message.id !== assistantId || message.content.trim());
        void saveTutorConversation(conversationKey, next);
        return next;
      });
    } finally {
      abortRef.current = null;
      setGenerating(false);
    }
  };

  return (
    <div className={`socratic-tutor ${open ? 'is-open' : ''}`}>
      {!open && (
        <button ref={launcherRef} type="button" className="socratic-tutor__launcher" onClick={() => setOpen(true)} aria-label="Abrir ayuda de IA">
          <Bot size={19} aria-hidden="true" />
          <span>Ayuda IA</span>
        </button>
      )}

      {open && (
        <aside ref={panelRef} className="socratic-tutor__panel" role="dialog" aria-modal="true" aria-label="Ayuda de la lección">
          <header className="socratic-tutor__header">
            <div>
              <span className="socratic-tutor__eyebrow">LOCAL · WEBGPU</span>
              <h2>{activity.itemTitle}</h2>
              <p>{activity.courseTitle}</p>
            </div>
            <button ref={closeRef} type="button" onClick={() => { setOpen(false); window.setTimeout(() => launcherRef.current?.focus(), 0); }} aria-label="Cerrar ayuda"><X size={18} /></button>
          </header>

          {!modelReady ? (
            <section className="socratic-tutor__setup" aria-live="polite">
              <h3>Elige cuánto quieres descargar</h3>
              <p>El modelo se guarda en este navegador. Tu código y tus preguntas no salen del dispositivo.</p>
              {loadingModels ? <p>Consultando modelos compatibles…</p> : (
                <label>
                  Modelo local
                  <select value={selectedModel} onChange={(event) => {
                    const next = event.target.value;
                    setSelectedModel(next);
                    preferredModelRef.current = next;
                    void saveTutorModelPreference(next);
                  }}>
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {PROFILE_LABELS[model.profile]} · {model.label} · {Math.round(model.estimatedVramMB)} MB{model.cached ? ' · guardado' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {selected && <p className="socratic-tutor__model-note">{selected.specialty}. Contexto: {selected.contextWindowSize || 'variable'} tokens.</p>}
              {progressLabel && (
                <div className="socratic-tutor__progress">
                  <span>{progressLabel}</span>
                  <progress max={1} value={progress ?? 0} />
                </div>
              )}
              {error && <p className="socratic-tutor__error" role="alert">{error}</p>}
              <button type="button" className="socratic-tutor__primary" onClick={() => preparing ? prepareAbortRef.current?.abort() : void prepare()} disabled={loadingModels || models.length === 0}>
                {preparing ? <Square size={16} /> : <Download size={16} />} {preparing ? 'Cancelar preparación' : 'Preparar modelo'}
              </button>
            </section>
          ) : (
            <>
              <div className="socratic-tutor__ready" role="status"><span /> Modelo listo · trabaja en este dispositivo</div>
              <div className="socratic-tutor__controls">
                <label>Tipo de ayuda
                  <select aria-label="Tipo de ayuda" value={mode} onChange={(event) => setMode(event.target.value as TutorMode)}>
                    {MODE_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                  <small>{MODE_OPTIONS.find((option) => option.id === mode)?.description}</small>
                </label>
                <label>Modelo local
                  <select aria-label="Modelo local" value={selectedModel} onChange={(event) => {
                    const next = event.target.value;
                    if (next === selectedModel) return;
                    setSelectedModel(next);
                    preferredModelRef.current = next;
                    setModelReady(false);
                    void saveTutorModelPreference(next);
                  }}>
                    {models.length === 0 && <option value={selectedModel}>Modelo activo</option>}
                    {models.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.cached ? 'Guardado' : 'Descargar'} · {candidate.label} · {Math.round(candidate.estimatedVramMB)} MB</option>)}
                  </select>
                </label>
              </div>
              {toolActivities.length > 0 && (
                <div className="socratic-tutor__activity" aria-label="Acciones del agente">
                  <div><strong>Qué consultó el agente</strong>{hasAgentChanges && <button type="button" onClick={() => { workspace?.actions.undoLastChange(); setHasAgentChanges(false); }} aria-label="Deshacer cambios del agente"><Undo2 size={13} /> Deshacer</button>}</div>
                  <ul>{toolActivities.map((entry, index) => <li key={`${entry.tool}-${index}`} className={`is-${entry.status}`}><CheckCircle2 size={13} /><span><strong>{entry.label}</strong><small>{entry.detail}</small></span></li>)}</ul>
                </div>
              )}
              <div className="socratic-tutor__conversation" aria-live="polite">
                {messages.length === 0 && (
                  <div className="socratic-tutor__empty">
                    <strong>No voy a darte una respuesta para copiar.</strong>
                    <p>Cuéntame qué esperabas que ocurriera o dónde dejaste de entender el flujo.</p>
                  </div>
                )}
                {messages.map((message) => (
                  <div key={message.id} className={`socratic-tutor__message is-${message.role}`}>
                    <span>{message.role === 'user' ? 'Tú' : 'Ayuda'}</span>
                    {renderMessageContent(message.content)}
                  </div>
                ))}
              </div>
              {error && <p className="socratic-tutor__error" role="alert">{error}</p>}
              <div className="socratic-tutor__composer">
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void send();
                    }
                  }}
                  aria-label="Pregunta para la ayuda de IA"
                  placeholder="Ejemplo: esperaba que devolviera 8, pero solo lo imprime…"
                  rows={3}
                />
                {generating ? (
                  <button type="button" onClick={() => abortRef.current?.abort()} aria-label="Detener respuesta" title="Detener respuesta"><Square size={16} /></button>
                ) : (
                  <button type="button" onClick={() => void send()} disabled={!draft.trim()} aria-label="Enviar pregunta" title="Enviar pregunta"><Send size={16} /></button>
                )}
              </div>
            </>
          )}
        </aside>
      )}
    </div>
  );
};
