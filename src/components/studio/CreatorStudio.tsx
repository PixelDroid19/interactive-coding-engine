import React, { useState, useRef, useEffect } from 'react';
import { STARTER_TEMPLATES } from '../../templates/starterTemplates';
import { RecorderEngine, RecorderStatus } from '../../engine/recorderEngine';
import { cloneWorkspace } from '../../engine/eventLog';
import { saveCustomScrim, saveStudioDraft, loadStudioDraft, clearStudioDraft } from '../../engine/persistence';
import { ScrimChallenge, ScrimLessonData, WorkspaceSnapshot, WorkspaceFile } from '../../types/scrim';
import { CodeEditor } from '../editor/CodeEditor';
import { FileTree } from '../editor/FileTree';
import { PreviewPane, PreviewPaneRef } from '../preview/PreviewPane';
import { TemplateDefinition } from '../../types/runtime';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Plus,
  Radio,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  FolderTree,
  Sliders,
  Send,
  Eye,
  FileCode,
  LayoutTemplate
} from 'lucide-react';

interface CreatorStudioProps {
  onBack: () => void;
  onLessonPublished: (lesson: ScrimLessonData) => void;
}

export const CreatorStudio: React.FC<CreatorStudioProps> = ({
  onBack,
  onLessonPublished,
}) => {
  // Step: 1. choose-template, 2. prepare-workspace, 3. recording, 4. review-publish
  const [step, setStep] = useState<'template' | 'prepare' | 'recording' | 'review'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateDefinition['id']>('vanilla-js');

  // Metadata
  const [lessonTitle, setLessonTitle] = useState('Nueva lección');
  const [lessonDescription, setLessonDescription] = useState('Grabada en el estudio');

  // Workspace
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot>(() => {
    const tpl = STARTER_TEMPLATES['vanilla-js'];
    return {
      activeFilePath: tpl.entrypoint,
      files: { ...tpl.files },
    };
  });

  // Recorder engine
  const [recorderStatus, setRecorderStatus] = useState<RecorderStatus>('idle');
  const [recordedElapsedMs, setRecordedElapsedMs] = useState(0);
  const [recordedEventsCount, setRecordedEventsCount] = useState(0);
  const [useMicrophone, setUseMicrophone] = useState(true);
  const [finishedLessonData, setFinishedLessonData] = useState<ScrimLessonData | null>(null);

  // New challenge creation modal
  const [isAddingChallenge, setIsAddingChallenge] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState('Nuevo reto durante la clase');
  const [challengeInstructions, setChallengeInstructions] = useState('Implementa la función o el evento solicitado.');

  const [showFileTree, setShowFileTree] = useState(true);

  const recorderRef = useRef<RecorderEngine | null>(null);
  const previewRef = useRef<PreviewPaneRef | null>(null);

  useEffect(() => () => {
    recorderRef.current?.cancelRecording();
  }, []);

  // Switch template
  const handleSelectTemplate = (templateId: TemplateDefinition['id']) => {
    setSelectedTemplateId(templateId);
    const tpl = STARTER_TEMPLATES[templateId];
    setWorkspace({
      activeFilePath: tpl.entrypoint,
      files: { ...tpl.files },
    });
    setStep('prepare');
  };

  // Start recording
  const handleStartRecording = async () => {
    const recorder = new RecorderEngine(workspace, {
      onStatusChange: (status) => setRecorderStatus(status),
      onTimeTick: (elapsed) => setRecordedElapsedMs(elapsed),
      onEventRecorded: () => setRecordedEventsCount((c) => c + 1),
    });

    recorderRef.current = recorder;
    setStep('recording');
    await recorder.startRecording(useMicrophone);
  };

  // Pause / Resume recording
  const handleTogglePause = () => {
    if (recorderStatus === 'recording') {
      recorderRef.current?.pauseRecording();
    } else if (recorderStatus === 'paused') {
      recorderRef.current?.resumeRecording();
    }
  };

  // Stop recording
  const handleStopRecording = async () => {
    if (!recorderRef.current) return;
    const lesson = await recorderRef.current.stopRecording();
    lesson.title = lessonTitle;
    lesson.description = lessonDescription;
    lesson.templateId = selectedTemplateId;

    setFinishedLessonData(lesson);
    setStep('review');
    clearStudioDraft();
  };

  // Insert challenge marker at current timestamp
  const handleInsertChallengeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recorderRef.current) return;

    const newChallenge: ScrimChallenge = {
      id: `ch-studio-${Date.now()}`,
      title: challengeTitle,
      timestamp: recorderRef.current.getCurrentTimeMs(),
      instructions: challengeInstructions,
      tests: [
        {
          id: 't-studio-1',
          description: 'El código contiene la implementación solicitada',
          validatorType: 'source-regex',
          regexPattern: 'function|const|let|addEventListener',
        },
      ],
      hints: [
        {
          level: 1,
          title: 'Primera pista',
          text: 'Revisa el código que el instructor escribió hasta este punto.',
        },
      ],
    };

    recorderRef.current.insertChallenge(newChallenge);
    setIsAddingChallenge(false);
    setChallengeTitle('Nuevo reto durante la clase');
  };

  // Track code changes during preparation or recording
  const handleCodeChange = (newContent: string, changes: { from: number; to: number; text: string }[]) => {
    const activePath = workspace.activeFilePath;

    setWorkspace((prev) => ({
      ...prev,
      files: {
        ...prev.files,
        [activePath]: {
          ...prev.files[activePath],
          content: newContent,
        },
      },
    }));

    if (recorderStatus === 'recording') {
      recorderRef.current?.recordCodeChange(activePath, changes, newContent);
    }
  };

  const handleFileSelect = (path: string) => {
    setWorkspace((prev) => ({ ...prev, activeFilePath: path }));
    if (recorderStatus === 'recording') {
      recorderRef.current?.recordFileSwitch(path);
    }
  };

  const handlePublish = () => {
    if (!finishedLessonData) return;
    saveCustomScrim(finishedLessonData);
    onLessonPublished(finishedLessonData);
  };

  const formatTime = (ms: number) => {
    const sec = Math.floor(ms / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeFile = workspace.files[workspace.activeFilePath] || Object.values(workspace.files)[0] || null;

  return (
    <div className="app-screen">
      {/* Studio Navigation Header */}
      <header className="flex h-11 items-center justify-between px-4 bg-[#141416] border-b border-zinc-800/80 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-xs text-zinc-300 font-medium transition-colors"
            aria-label="Salir del estudio"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="text-[11px]">Salir del estudio</span>
          </button>

          <div className="h-3.5 w-px bg-zinc-800" />

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 px-2.5 py-0.5 text-xs font-semibold">
              <Radio className="h-3.5 w-3.5 text-rose-400" />
              <span>Estudio de creación</span>
            </span>
            <input
              type="text"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              aria-label="Título de la lección"
              className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-zinc-500 text-xs font-semibold text-zinc-100 px-1 py-0.5 outline-none"
            />
          </div>
        </div>

        {/* Studio State Actions */}
        <div className="flex items-center gap-3">
          {step === 'prepare' && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setUseMicrophone(!useMicrophone)}
                aria-label={useMicrophone ? 'Desactivar micrófono' : 'Activar micrófono'}
                aria-pressed={useMicrophone}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border font-medium transition-colors ${
                  useMicrophone
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}
              >
                {useMicrophone ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                <span>Micrófono: {useMicrophone ? 'activado' : 'desactivado'}</span>
              </button>

              <button
                onClick={handleStartRecording}
                aria-label="Empezar grabación"
                className="flex items-center gap-2 rounded bg-rose-600 hover:bg-rose-500 px-3.5 py-1 text-white text-xs font-semibold shadow-sm transition-colors animate-pulse"
              >
                <div className="h-2 w-2 rounded-full bg-white" />
                <span>Empezar grabación</span>
              </button>
            </div>
          )}

          {step === 'recording' && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-800 px-2.5 py-0.5 rounded-full text-xs font-mono text-rose-200">
                <span className="flex h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                <span>{formatTime(recordedElapsedMs)}</span>
                <span className="text-rose-400 text-[10px]">({recordedEventsCount} eventos)</span>
              </div>

              <button
                onClick={() => setIsAddingChallenge(true)}
                className="flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-2.5 py-1 text-xs font-medium text-amber-300 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Añadir marcador de reto (◆)</span>
              </button>

              <button
                onClick={handleTogglePause}
                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                aria-label={recorderStatus === 'recording' ? 'Pausar grabación' : 'Reanudar grabación'}
                title={recorderStatus === 'recording' ? 'Pausar grabación' : 'Reanudar grabación'}
              >
                {recorderStatus === 'recording' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>

              <button
                onClick={handleStopRecording}
                className="flex items-center gap-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-900 px-3 py-1 text-xs font-semibold shadow-sm transition-colors"
              >
                <Square className="h-3 w-3 fill-zinc-900" />
                <span>Detener y revisar</span>
              </button>
            </div>
          )}

          {step === 'review' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePublish}
                className="flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Publicar lección en el curso</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Step 1: Template Selection Screen */}
      {step === 'template' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto" style={{ background: 'var(--bg-main)' }}>
          <div className="max-w-2xl w-full text-center space-y-2 mb-8">
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Crear una clase interactiva</h1>
            <p className="text-xs text-zinc-400">
              Elige una plantilla, prepara el espacio de trabajo y graba la voz junto con los cambios de código.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-w-2xl w-full">
            {Object.values(STARTER_TEMPLATES).map((tpl) => (
              <button
                type="button"
                key={tpl.id}
                onClick={() => handleSelectTemplate(tpl.id)}
                aria-label={`Usar plantilla ${tpl.name}`}
                className="group flex flex-col p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 cursor-pointer transition-all shadow-sm text-left"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 font-semibold text-zinc-100 text-xs">
                    <LayoutTemplate className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{tpl.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    {tpl.entrypoint}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{tpl.description}</p>
                <div className="mt-3.5 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-300 font-medium group-hover:text-white transition-colors">
                  <span>Usar plantilla &rarr;</span>
                  <span className="text-[11px] text-zinc-400 font-mono">{Object.keys(tpl.files).length} archivos</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Step 2, 3, 4: Studio Workspace */
        <div className="flex flex-1 w-full overflow-hidden">
          {/* File Tree Explorer */}
          {showFileTree && (
            <div className="w-48 shrink-0 h-full border-r border-zinc-800/80 bg-[#121214]">
              <FileTree
                files={workspace.files}
                activeFilePath={workspace.activeFilePath}
                onFileSelect={handleFileSelect}
                onFileCreate={(file) => {
                  setWorkspace((prev) => ({
                    ...prev,
                    files: { ...prev.files, [file.path]: file },
                    activeFilePath: file.path,
                  }));
                  if (recorderStatus === 'recording') {
                    recorderRef.current?.recordFileCreate(file);
                  }
                }}
                onFileDelete={(path) => {
                  setWorkspace((prev) => {
                    const copy = { ...prev.files };
                    delete copy[path];
                    const remaining = Object.keys(copy);
                    return { ...prev, files: copy, activeFilePath: remaining[0] || '' };
                  });
                  if (recorderStatus === 'recording') {
                    recorderRef.current?.recordFileDelete(path);
                  }
                }}
                readOnly={false}
              />
            </div>
          )}

          {/* Code Editor */}
          <div className="flex-1 flex flex-col h-full bg-[#18181b] border-r border-zinc-800/80">
            <div className="flex h-8 items-center justify-between bg-[#141416] border-b border-zinc-800/80 px-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowFileTree(!showFileTree)}
                  aria-label={showFileTree ? 'Ocultar archivos' : 'Mostrar archivos'}
                  aria-expanded={showFileTree}
                  className={`p-1 rounded text-zinc-400 hover:text-zinc-200 ${
                    showFileTree ? 'bg-zinc-800 text-zinc-200' : ''
                  }`}
                >
                  <FolderTree className="h-3.5 w-3.5" />
                </button>

                {(Object.values(workspace.files) as WorkspaceFile[]).map((f) => (
                  <button
                    key={f.path}
                    onClick={() => handleFileSelect(f.path)}
                    className={`px-3 py-1 text-xs font-mono transition-colors ${
                      f.path === workspace.activeFilePath
                        ? 'bg-[#18181b] text-zinc-100 font-semibold border-t-2 border-zinc-400'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              {recorderStatus === 'recording' && (
                <span className="text-[11px] font-mono text-rose-400 animate-pulse flex items-center gap-1 pr-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  <span>Registrando eventos</span>
                </span>
              )}
            </div>

            <div className="flex-1 w-full h-full bg-[#18181b]">
              <CodeEditor
                file={activeFile}
                readOnly={false}
                onCodeChange={handleCodeChange}
                onCursorMove={(pos) => {
                  if (recorderStatus === 'recording') {
                    recorderRef.current?.recordCursorMove(workspace.activeFilePath, pos);
                  }
                }}
                onSelectionChange={(from, to) => {
                  if (recorderStatus === 'recording') {
                    recorderRef.current?.recordSelectionChange(workspace.activeFilePath, from, to);
                  }
                }}
              />
            </div>
          </div>

          {/* Sandbox Preview */}
          <div className="w-[45%] shrink-0 h-full flex flex-col">
            <PreviewPane
              ref={previewRef}
              workspace={workspace}
              onRunClick={() => {
                if (recorderStatus === 'recording') {
                  recorderRef.current?.recordRunCode();
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Insert Challenge Modal */}
      {isAddingChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4" role="dialog" aria-modal="true" aria-label="Añadir reto">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="font-semibold text-xs text-zinc-100 flex items-center gap-1.5">
                <span className="text-amber-400">◆</span> Añadir marcador de reto
              </h3>
              <span className="text-xs font-mono text-zinc-400">{formatTime(recordedElapsedMs)}</span>
            </div>

            <form onSubmit={handleInsertChallengeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1" htmlFor="studio-challenge-title">Título del reto</label>
                <input
                  id="studio-challenge-title"
                  type="text"
                  value={challengeTitle}
                  onChange={(e) => setChallengeTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-100 outline-none focus:border-zinc-500"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1" htmlFor="studio-challenge-instructions">Instrucciones para el estudiante</label>
                <textarea
                  id="studio-challenge-instructions"
                  rows={4}
                  value={challengeInstructions}
                  onChange={(e) => setChallengeInstructions(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-100 outline-none focus:border-zinc-500 font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingChallenge(false)}
                  className="px-3 py-1.5 rounded text-zinc-400 hover:text-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-900 font-semibold"
                >
                  Añadir marcador (◆)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
