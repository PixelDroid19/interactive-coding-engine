import React, { useCallback, useEffect, useRef, useState } from 'react';
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap, type CompletionSource } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { python } from '@codemirror/lang-python';
import { bracketMatching, foldGutter, indentOnInput, indentUnit } from '@codemirror/language';
import { Compartment, EditorState, Transaction, type Extension } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view';
import { abbreviationTracker, EmmetKnownSyntax } from '@emmetio/codemirror6-plugin';
import { color } from '@uiw/codemirror-extensions-color';
import {
  createSemanticCompletionSource,
  createSemanticHover,
  createSemanticLintExtensions,
  createSignatureHelpExtension,
  type EditorDiagnosticStatus,
  type SemanticLanguageClient,
} from '../../editor/codeMirrorLanguageExtensions';
import { createSpanishCompletionSource, createSpanishHoverTooltip } from '../../editor/spanishLsp';
import { spanishEditorPhrases } from '../../editor/spanishEditorPhrases';
import { TypeScriptWorkerClient } from '../../editor/typeScriptWorkerClient';
import type { WorkspaceFile } from '../../types/scrim';
import { clearTutorWorkspace, publishTutorWorkspace } from '../../learning/tutor/tutorContext';
import { InstructorCursor } from '../player/InstructorCursor';

export interface EditorLanguageClient extends SemanticLanguageClient {
  replaceWorkspace(files: Array<Pick<WorkspaceFile, 'path' | 'content' | 'language'>>): void;
  updateFile(path: string, content: string): void;
  dispose(): void;
}

interface CodeEditorProps {
  file: WorkspaceFile | null;
  workspaceFiles?: Record<string, WorkspaceFile>;
  readOnly?: boolean;
  onCodeChange?: (newContent: string, changes: { from: number; to: number; text: string }[]) => void;
  onWorkspaceFileChange?: (path: string, content: string) => void;
  onTutorRunChecks?: () => Promise<string>;
  tutorRecentResult?: string;
  onCursorMove?: (position: { line: number; ch: number }) => void;
  onSelectionChange?: (from: number, to: number) => void;
  instructorCursor?: { line: number; ch: number };
  lessonId?: string;
  /** Ajusta líneas largas al ancho disponible; útil en laboratorios con varios paneles. */
  lineWrapping?: boolean;
  /** Inyección para pruebas de integración; en producto se usa el Web Worker real. */
  languageClient?: EditorLanguageClient;
}

interface DiagnosticDisplay extends Omit<EditorDiagnosticStatus, 'state'> {
  state: EditorDiagnosticStatus['state'] | 'loading';
}

interface EditorCompartments {
  accessibility: Compartment;
  language: Compartment;
  readOnly: Compartment;
  fileFeatures: Compartment;
  intelligence: Compartment;
}

const initialDiagnostics: DiagnosticDisplay = { errors: 0, warnings: 0, state: 'loading' };

const unavailableLanguageClient: EditorLanguageClient = {
  replaceWorkspace: () => {},
  updateFile: () => {},
  dispose: () => {},
  completions: async () => [],
  diagnostics: async () => Promise.reject(new Error('Este navegador no ofrece Web Workers.')),
  hover: async () => null,
  signatureHelp: async () => null,
};

function createEditorLanguageClient(): EditorLanguageClient {
  return typeof Worker === 'undefined' ? unavailableLanguageClient : new TypeScriptWorkerClient();
}

function isJavaScriptLike(file: WorkspaceFile): boolean {
  return file.language === 'javascript'
    || file.language === 'typescript'
    || /\.(?:js|jsx|ts|tsx)$/i.test(file.name);
}

function isHtml(file: WorkspaceFile): boolean {
  return file.language === 'html' || /\.html?$/i.test(file.name);
}

function isCss(file: WorkspaceFile): boolean {
  return file.language === 'css' || /\.(?:css|scss)$/i.test(file.name);
}

function isJson(file: WorkspaceFile): boolean {
  return file.language === 'json' || /\.json$/i.test(file.name);
}

function isPython(file: WorkspaceFile): boolean {
  return file.language === 'python' || /\.py$/i.test(file.name);
}

function supportsSyntaxDiagnostics(file: WorkspaceFile): boolean {
  return isJavaScriptLike(file) || isHtml(file) || isCss(file) || isJson(file) || isPython(file);
}

function languageExtension(file: WorkspaceFile): Extension {
  if (isHtml(file)) return html();
  if (isCss(file)) return css();
  if (isJson(file)) return json();
  if (isPython(file)) return python();
  if (/\.(?:tsx|jsx)$/i.test(file.name)) {
    return javascript({ jsx: true, typescript: file.name.endsWith('.tsx') });
  }
  if (isJavaScriptLike(file)) return javascript({ typescript: /\.ts$/i.test(file.name) });
  return [];
}

function fileFeatureExtensions(file: WorkspaceFile, readOnly: boolean): Extension[] {
  const htmlFile = isHtml(file);
  const cssFile = isCss(file);
  const extensions: Extension[] = [];
  if ((htmlFile || cssFile) && !readOnly) {
    extensions.push(abbreviationTracker({
      syntax: cssFile ? EmmetKnownSyntax.css : EmmetKnownSyntax.html,
    }));
  }
  if (htmlFile || cssFile) extensions.push(color);
  return extensions;
}

function readOnlyExtensions(readOnly: boolean): Extension[] {
  return [EditorView.editable.of(!readOnly), EditorState.readOnly.of(readOnly)];
}

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    backgroundColor: '#1e1e1e',
  },
  '.cm-scroller': { overflow: 'auto', fontFamily: 'inherit', paddingBottom: '30px' },
  '.cm-gutters': { backgroundColor: '#151515', color: '#64748b', borderRight: '1px solid #27272a' },
  '.cm-activeLine': { backgroundColor: '#26262655' },
  '.cm-activeLineGutter': { backgroundColor: '#262626', color: '#cbd5e1' },
  '.cm-foldGutter span': { color: '#64748b' },
  '.cm-lintRange-error': {
    backgroundImage: 'none',
    textDecoration: 'underline wavy #fb7185 1.5px',
    textUnderlineOffset: '3px',
  },
  '.cm-lintRange-warning': {
    backgroundImage: 'none',
    textDecoration: 'underline wavy #facc15 1.5px',
    textUnderlineOffset: '3px',
  },
  '.cm-tooltip.cm-tooltip-autocomplete': {
    border: '1px solid #3f3f46',
    backgroundColor: '#18181b',
    borderRadius: '7px',
    overflow: 'hidden',
    boxShadow: '0 12px 30px rgba(0,0,0,.42)',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': {
    maxHeight: '280px',
    fontFamily: 'inherit',
    fontSize: '13px',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li': { padding: '4px 10px' },
  '.cm-completionDetail': {
    color: '#94a3b8',
    fontStyle: 'normal',
    fontSize: '11px',
    marginLeft: '10px',
  },
  '.cm-completionInfo, .cm-semantic-doc, .cm-signature-help, .cm-tooltip-lint': {
    backgroundColor: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: '7px',
    color: '#e4e4e7',
    fontFamily: 'inherit',
    fontSize: '12px',
    lineHeight: '1.5',
    maxWidth: '420px',
    padding: '9px 11px',
    whiteSpace: 'pre-wrap',
    boxShadow: '0 12px 30px rgba(0,0,0,.42)',
  },
  '.cm-semantic-doc strong': { color: '#f8fafc', display: 'block', marginBottom: '5px' },
  '.cm-semantic-doc p': { color: '#cbd5e1', margin: '0', whiteSpace: 'pre-wrap' },
  '.cm-signature-label': { color: '#f8fafc', fontWeight: '700' },
  '.cm-signature-parameter': { color: '#fde047', marginTop: '4px' },
  '.cm-signature-documentation': { color: '#cbd5e1', marginTop: '5px' },
  '.cm-diagnosticText': { color: '#e4e4e7' },
  '.cm-diagnosticSource': { color: '#94a3b8' },
});

export const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  workspaceFiles,
  readOnly = false,
  onCodeChange,
  onWorkspaceFileChange,
  onTutorRunChecks,
  tutorRecentResult,
  onCursorMove,
  onSelectionChange,
  instructorCursor,
  lessonId,
  lineWrapping = false,
  languageClient,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const internalChangeRef = useRef(false);
  const mountedRef = useRef(true);
  const fileRef = useRef(file);
  const workspaceFilesRef = useRef(workspaceFiles);
  const readOnlyRef = useRef(readOnly);
  const lessonIdRef = useRef(lessonId);
  const callbacksRef = useRef({ onCodeChange, onCursorMove, onSelectionChange });
  const onWorkspaceFileChangeRef = useRef(onWorkspaceFileChange);
  const onTutorRunChecksRef = useRef(onTutorRunChecks);
  const tutorUndoRef = useRef<Array<{ path: string; content: string }>>([]);
  const providedClientRef = useRef(languageClient);
  const ownedClientRef = useRef<EditorLanguageClient | null>(null);
  const compartmentsRef = useRef<EditorCompartments | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticDisplay>(initialDiagnostics);
  const tutorSourceIdRef = useRef(`editor-${Math.random().toString(36).slice(2)}`);

  fileRef.current = file;
  workspaceFilesRef.current = workspaceFiles;
  readOnlyRef.current = readOnly;
  lessonIdRef.current = lessonId;
  callbacksRef.current = { onCodeChange, onCursorMove, onSelectionChange };
  onWorkspaceFileChangeRef.current = onWorkspaceFileChange;
  onTutorRunChecksRef.current = onTutorRunChecks;
  providedClientRef.current = languageClient;

  useEffect(() => {
    if (!file) return;
    const currentFiles = workspaceFiles ?? { [file.path]: file };
    const replaceFile = (path: string, content: string) => {
      const previous = currentFiles[path];
      if (!previous || previous.content === content) return;
      tutorUndoRef.current.push({ path, content: previous.content });
      if (onWorkspaceFileChangeRef.current) {
        onWorkspaceFileChangeRef.current(path, content);
        return;
      }
      if (path === file.path) callbacksRef.current.onCodeChange?.(content, [{ from: 0, to: file.content.length, text: content }]);
    };
    publishTutorWorkspace({
      snapshot: {
        lessonId,
        activeFilePath: file.path,
        files: Object.fromEntries(Object.entries(currentFiles).map(([path, workspaceFile]) => [path, workspaceFile.content])),
        diagnostics: diagnostics.state === 'ready'
          ? diagnostics.errors || diagnostics.warnings
            ? `${diagnostics.errors} errores y ${diagnostics.warnings} advertencias`
            : 'Sin errores detectados'
          : undefined,
        recentResult: tutorRecentResult,
      },
      actions: {
        replaceFile,
        runChecks: onTutorRunChecksRef.current,
        undoLastChange: () => {
          const previous = tutorUndoRef.current.pop();
          if (!previous) return;
          if (onWorkspaceFileChangeRef.current) onWorkspaceFileChangeRef.current(previous.path, previous.content);
          else if (previous.path === file.path) callbacksRef.current.onCodeChange?.(previous.content, [{ from: 0, to: file.content.length, text: previous.content }]);
        },
      },
    }, tutorSourceIdRef.current);
    return () => clearTutorWorkspace(tutorSourceIdRef.current);
  }, [diagnostics.errors, diagnostics.state, diagnostics.warnings, file, lessonId, tutorRecentResult, workspaceFiles]);

  if (!compartmentsRef.current) {
    compartmentsRef.current = {
      accessibility: new Compartment(),
      language: new Compartment(),
      readOnly: new Compartment(),
      fileFeatures: new Compartment(),
      intelligence: new Compartment(),
    };
  }

  const getClient = useCallback((): EditorLanguageClient => {
    if (providedClientRef.current) return providedClientRef.current;
    if (!ownedClientRef.current) {
      ownedClientRef.current = createEditorLanguageClient();
    }
    return ownedClientRef.current;
  }, []);

  const reportDiagnostics = useCallback((status: EditorDiagnosticStatus) => {
    if (mountedRef.current) setDiagnostics(status);
  }, []);

  const intelligenceExtensions = useCallback((activeFile: WorkspaceFile): Extension[] => {
    const client = getClient();
    const getPath = () => fileRef.current?.path ?? null;
    const semantic = isJavaScriptLike(activeFile);
    const completionSources: CompletionSource[] = [createSpanishCompletionSource(lessonIdRef.current)];
    if (semantic && !readOnlyRef.current) {
      completionSources.unshift(createSemanticCompletionSource(client, getPath, lessonIdRef.current));
    }
    return [
      ...(semantic
        ? [autocompletion({
            activateOnTyping: true,
            icons: true,
            maxRenderedOptions: 80,
            override: completionSources,
          })]
        : [
            EditorState.languageData.of(() => completionSources.map((autocomplete) => ({ autocomplete }))),
            autocompletion({ activateOnTyping: true, icons: true, maxRenderedOptions: 80 }),
          ]),
      createSpanishHoverTooltip(lessonIdRef.current),
      ...(!readOnlyRef.current && supportsSyntaxDiagnostics(activeFile)
        ? createSemanticLintExtensions(client, getPath, reportDiagnostics)
        : []),
      ...(semantic && !readOnlyRef.current
        ? [
            createSemanticHover(client, getPath, lessonIdRef.current),
            createSignatureHelpExtension(client, getPath),
          ]
        : []),
    ];
  }, [getClient, reportDiagnostics]);

  const configurationEffects = useCallback((activeFile: WorkspaceFile) => {
    const compartments = compartmentsRef.current!;
    return [
      compartments.accessibility.reconfigure(
        EditorView.contentAttributes.of({ 'aria-label': `Editor de ${activeFile.name}` }),
      ),
      compartments.language.reconfigure(languageExtension(activeFile)),
      compartments.readOnly.reconfigure(readOnlyExtensions(readOnlyRef.current)),
      compartments.fileFeatures.reconfigure(fileFeatureExtensions(activeFile, readOnlyRef.current)),
      compartments.intelligence.reconfigure(intelligenceExtensions(activeFile)),
    ];
  }, [intelligenceExtensions]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const initialFile = fileRef.current;
    if (!container || !initialFile) return;
    const compartments = compartmentsRef.current!;
    const startState = EditorState.create({
      doc: initialFile.content,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        foldGutter(),
        history(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentUnit.of('  '),
        indentOnInput(),
        bracketMatching(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        ...(lineWrapping ? [EditorView.lineWrapping] : []),
        keymap.of([...closeBracketsKeymap, ...completionKeymap, ...defaultKeymap, ...historyKeymap]),
        compartments.accessibility.of(
          EditorView.contentAttributes.of({ 'aria-label': `Editor de ${initialFile.name}` }),
        ),
        compartments.language.of(languageExtension(initialFile)),
        compartments.readOnly.of(readOnlyExtensions(readOnlyRef.current)),
        compartments.fileFeatures.of(fileFeatureExtensions(initialFile, readOnlyRef.current)),
        compartments.intelligence.of(intelligenceExtensions(initialFile)),
        spanishEditorPhrases,
        closeBrackets(),
        oneDark,
        editorTheme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !internalChangeRef.current) {
            const newDoc = update.state.doc.toString();
            const changes: { from: number; to: number; text: string }[] = [];
            update.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
              changes.push({ from: fromA, to: toA, text: inserted.toString() });
            });
            const activeFile = fileRef.current;
            if (activeFile && isJavaScriptLike(activeFile)) {
              getClient().updateFile(activeFile.path, newDoc);
            }
            callbacksRef.current.onCodeChange?.(newDoc, changes);
          }
          if (update.selectionSet) {
            const selection = update.state.selection.main;
            const line = update.state.doc.lineAt(selection.head);
            callbacksRef.current.onCursorMove?.({ line: line.number, ch: selection.head - line.from });
            if (selection.from !== selection.to) {
              callbacksRef.current.onSelectionChange?.(selection.from, selection.to);
            }
          }
        }),
      ],
    });
    const view = new EditorView({ state: startState, parent: container });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [Boolean(file), getClient, intelligenceExtensions]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !file) return;
    const current = view.state.doc.toString();
    setDiagnostics(initialDiagnostics);
    internalChangeRef.current = true;
    view.dispatch({
      changes: current === file.content ? undefined : { from: 0, to: current.length, insert: file.content },
      effects: configurationEffects(file),
      annotations: Transaction.addToHistory.of(false),
    });
    internalChangeRef.current = false;
  }, [file?.path, readOnly, lessonId, configurationEffects]);

  useEffect(() => {
    if (!file || readOnly || !isJavaScriptLike(file)) return;
    const files = Object.values(workspaceFilesRef.current ?? { [file.path]: file });
    getClient().replaceWorkspace(files);
    setDiagnostics(initialDiagnostics);
  }, [file?.path, readOnly, getClient]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !file) return;
    const current = view.state.doc.toString();
    if (current === file.content) return;
    internalChangeRef.current = true;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: file.content },
      annotations: Transaction.addToHistory.of(false),
    });
    internalChangeRef.current = false;
    if (!readOnly && isJavaScriptLike(file)) getClient().updateFile(file.path, file.content);
  }, [file?.content, file?.path, readOnly, getClient]);

  useEffect(() => () => {
    ownedClientRef.current?.dispose();
    ownedClientRef.current = null;
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !instructorCursor) return;
    try {
      const lineNumber = Math.max(1, Math.min(instructorCursor.line, view.state.doc.lines));
      const line = view.state.doc.line(lineNumber);
      const position = Math.min(line.from + instructorCursor.ch, line.to);
      view.dispatch({ selection: { anchor: position }, scrollIntoView: true });
    } catch {
      // La cinta puede apuntar a una línea que todavía no se ha escrito.
    }
  }, [instructorCursor]);

  const mapEditorPointer = useCallback((x: number, y: number) => {
    const wrap = containerRef.current;
    if (!wrap) return { x, y };
    const scroller = wrap.querySelector('.cm-scroller') as HTMLElement | null;
    const gutter = wrap.querySelector('.cm-gutters') as HTMLElement | null;
    const width = (scroller?.clientWidth || wrap.clientWidth) || 1;
    const height = (scroller?.clientHeight || wrap.clientHeight) || 1;
    const gutterWidth = gutter?.getBoundingClientRect().width ?? 32;
    const codeWidth = Math.max(180, Math.min(width - gutterWidth - 16, 520));
    const codeHeight = Math.min(height, 400);
    return {
      x: ((gutterWidth + 10 + (x / 100) * codeWidth) / width) * 100,
      y: Math.min(88, Math.max(8, (y / 100) * (codeHeight / height) * 100)),
    };
  }, []);

  if (!file) {
    return (
      <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-slate-500 font-mono text-sm">
        Ningún archivo seleccionado
      </div>
    );
  }

  const semantic = isJavaScriptLike(file);
  const pythonFile = isPython(file);
  const emmetAvailable = isHtml(file) || isCss(file);
  const syntaxOnly = supportsSyntaxDiagnostics(file) && !semantic;
  const languageLabel = file.language === 'json'
    ? 'JSON'
    : file.language === 'python'
      ? 'Python'
      : file.language.toUpperCase();
  const statusText = readOnly
    ? 'Solo lectura durante la reproducción'
    : emmetAvailable
      ? `${languageLabel} · Emmet disponible con Tab`
      : syntaxOnly
        ? diagnostics.state === 'loading'
          ? `${languageLabel} · verificando sintaxis…`
          : diagnostics.state === 'error'
            ? `${languageLabel} · análisis no disponible`
            : diagnostics.errors === 0 && diagnostics.warnings === 0
              ? `${languageLabel} · sintaxis válida${pythonFile ? ' · sugerencias activas' : ''}`
              : `${diagnostics.errors} ${diagnostics.errors === 1 ? 'error' : 'errores'} · ${diagnostics.warnings} ${diagnostics.warnings === 1 ? 'advertencia' : 'advertencias'}`
        : !semantic
          ? `${languageLabel} · edición de texto`
      : diagnostics.state === 'loading'
        ? 'Preparando inteligencia de código…'
        : diagnostics.state === 'error'
          ? 'Análisis semántico no disponible · sintaxis activa'
          : diagnostics.errors === 0 && diagnostics.warnings === 0
            ? 'Sin errores'
            : `${diagnostics.errors} ${diagnostics.errors === 1 ? 'error' : 'errores'} · ${diagnostics.warnings} ${diagnostics.warnings === 1 ? 'advertencia' : 'advertencias'}`;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1e1e1e]">
      <div ref={containerRef} className="h-full w-full" />
      <div
        role="status"
        aria-live="polite"
        className={`editor-language-status ${diagnostics.errors > 0 ? 'has-errors' : diagnostics.warnings > 0 ? 'has-warnings' : ''}`}
        title="Ctrl/Cmd + Espacio abre las sugerencias de código"
      >
        <span className="editor-language-status-dot" aria-hidden="true" />
        <span>{statusText}</span>
        {!readOnly && semantic && <kbd>Ctrl + Espacio</kbd>}
      </div>
      <InstructorCursor containerType="editor" mapPosition={mapEditorPointer} />
    </div>
  );
};
