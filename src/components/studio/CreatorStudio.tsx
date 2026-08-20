import React, { useState, useRef, useEffect } from 'react';
import { STARTER_TEMPLATES } from '../../templates/starterTemplates';
import { RecorderEngine, RecorderStatus } from '../../engine/recorderEngine';
import { cloneWorkspace } from '../../engine/eventLog';
import { saveCustomScrim, saveStudioDraft, loadStudioDraft, clearStudioDraft } from '../../engine/persistence';
import { ScrimChallenge, ScrimLessonData, WorkspaceSnapshot, WorkspaceFile } from '../../types/scrim';
import { CodeEditor } from '../editor/CodeEditor';
import { FileTree } from '../editor/FileTree';
import { PreviewPane, PreviewPaneRef } from '../preview/PreviewPane';
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
  const [selectedTemplateId, setSelectedTemplateId] = useState<'vanilla-js' | 'js-only' | 'lit' | 'react'>('vanilla-js');

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
  const [challengeTitle, setChallengeTitle] = useState('New In-Scrim Challenge');
  const [challengeInstructions, setChallengeInstructions] = useState('Implement the required function or event listener.');

  const [showFileTree, setShowFileTree] = useState(true);

  const recorderRef = useRef<RecorderEngine | null>(null);
  const previewRef = useRef<PreviewPaneRef | null>(null);

  // Switch template
  const handleSelectTemplate = (templateId: 'vanilla-js' | 'js-only' | 'lit' | 'react') => {
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
          description: 'Code contains required implementation',
          validatorType: 'source-regex',
          regexPattern: 'function|const|let|addEventListener',
        },
      ],
      hints: [
        {
          level: 1,
          title: 'Starter Hint',
          text: 'Review the instructor code written up to this point.',
        },
      ],
    };

    recorderRef.current.insertChallenge(newChallenge);
    setIsAddingChallenge(false);
    setChallengeTitle('New In-Scrim Challenge');
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
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="text-[11px]">Exit Studio</span>
          </button>

          <div className="h-3.5 w-px bg-zinc-800" />

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 px-2.5 py-0.5 text-xs font-semibold">
              <Radio className="h-3.5 w-3.5 text-rose-400" />
              <span>Creator Studio</span>
            </span>
            <input
              type="text"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
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
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border font-medium transition-colors ${
                  useMicrophone
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}
              >
                {useMicrophone ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                <span>Mic: {useMicrophone ? 'On' : 'Off'}</span>
              </button>

              <button
                onClick={handleStartRecording}
                className="flex items-center gap-2 rounded bg-rose-600 hover:bg-rose-500 px-3.5 py-1 text-white text-xs font-semibold shadow-sm transition-colors animate-pulse"
              >
                <div className="h-2 w-2 rounded-full bg-white" />
                <span>Start Recording</span>
              </button>
            </div>
          )}

          {step === 'recording' && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-800 px-2.5 py-0.5 rounded-full text-xs font-mono text-rose-200">
                <span className="flex h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                <span>{formatTime(recordedElapsedMs)}</span>
                <span className="text-rose-400 text-[10px]">({recordedEventsCount} events)</span>
              </div>

              <button
                onClick={() => setIsAddingChallenge(true)}
                className="flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-2.5 py-1 text-xs font-medium text-amber-300 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Challenge Marker (◆)</span>
              </button>

              <button
                onClick={handleTogglePause}
                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                title={recorderStatus === 'recording' ? 'Pause Recording' : 'Resume Recording'}
              >
                {recorderStatus === 'recording' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>

              <button
                onClick={handleStopRecording}
                className="flex items-center gap-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-900 px-3 py-1 text-xs font-semibold shadow-sm transition-colors"
              >
                <Square className="h-3 w-3 fill-zinc-900" />
                <span>Stop & Review</span>
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
                <span>Publish Lesson to Course</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Step 1: Template Selection Screen */}
      {step === 'template' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto" style={{ background: 'var(--bg-main)' }}>
          <div className="max-w-2xl w-full text-center space-y-2 mb-8">
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Create a New Interactive Scrim</h1>
            <p className="text-xs text-zinc-400">
              Select a starter template to prepare your workspace, then record voice and code simultaneously.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-w-2xl w-full">
            {Object.values(STARTER_TEMPLATES).map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => handleSelectTemplate(tpl.id as any)}
                className="group flex flex-col p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 cursor-pointer transition-all shadow-sm"
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
                  <span>Start Recording &rarr;</span>
                  <span className="text-[11px] text-zinc-400 font-mono">{Object.keys(tpl.files).length} files</span>
                </div>
              </div>
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
                  <span>Logging live events</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="font-semibold text-xs text-zinc-100 flex items-center gap-1.5">
                <span className="text-amber-400">◆</span> Insert Challenge Marker
              </h3>
              <span className="text-xs font-mono text-zinc-400">{formatTime(recordedElapsedMs)}</span>
            </div>

            <form onSubmit={handleInsertChallengeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Challenge Title</label>
                <input
                  type="text"
                  value={challengeTitle}
                  onChange={(e) => setChallengeTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-100 outline-none focus:border-zinc-500"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Instructions for Student</label>
                <textarea
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-900 font-semibold"
                >
                  Insert Marker (◆)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
