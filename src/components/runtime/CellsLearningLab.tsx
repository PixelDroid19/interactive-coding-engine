import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Code2, Download, Eye, FileCode2, FlaskConical, Play, RotateCcw, TerminalSquare, XCircle } from 'lucide-react';
import type { WorkspaceFile, WorkspaceSnapshot } from '../../types/scrim';
import { CellsRuntimeClient, CellsRuntimeClientError } from '../../engine/cells/cellsRuntimeClient';
import type { CellsCoverageResult, CellsTestResult } from '../../engine/cells/cellsWorkerProtocol';
import { createCellsPracticeWorkspace } from '../../engine/cells/cellsRecipes';
import {
  createCellsProjectPracticeWorkspace,
  type CellsAppPracticeStage,
  type CellsAppProject,
} from '../../engine/cells/cellsAppRecipes';
import { CellsWorkspaceRepository } from '../../engine/cells/cellsWorkspaceRepository';
import { createVersionedCellsWorkspace } from '../../engine/cells/cellsVirtualFileSystem';
import { waitForCellsBrowserTests } from '../../engine/cells/cellsBrowserRunner';
import { createCellsCoverageReport, createIstanbulCoverageReport, mergeCellsCoverageReports } from '../../engine/cells/cellsCoverage';
import { CodeEditor } from '../editor/CodeEditor';

function messageFor(error: unknown): string {
  if (error instanceof CellsRuntimeClientError) {
    return [error.message, error.filePath, error.line ? `línea ${error.line}` : ''].filter(Boolean).join(' · ');
  }
  return error instanceof Error ? error.message : 'No se pudo completar la operación.';
}

interface CellsLearningLabProps {
  variant?: 'component' | 'application';
  stage?: CellsAppPracticeStage;
  project?: CellsAppProject;
}

const APP_MISSIONS: Record<CellsAppPracticeStage, string> = {
  lifecycle: 'La página conserva una suscripción al salir y tampoco navega al detalle. Completa cleanup y navegación por nombre sin acoplar la tarjeta al router.',
  channels: 'La tarjeta ya emite una intención, pero la página todavía no publica ni observa el canal de selección. Conecta ambos extremos con un nombre y un payload estables.',
  data: 'El data manager distingue estados, pero una respuesta antigua todavía puede ganar y disconnect no cancela el trabajo activo. Protege ambas fronteras sin cambiar su API pública.',
  delivery: 'La aplicación funciona en desarrollo, pero la ruta desconocida y la configuración de producción están incompletas. Deja el proyecto listo para una entrega reproducible.',
};

const PROJECT_NAMES: Record<CellsAppProject, string> = {
  store: 'academy-store-app',
  museum: 'academy-museum-app',
  climate: 'academy-climate-app',
  relay: 'academy-relay-app',
  capstone: 'academy-learning-studio-app',
};

function defaultCellsCommand(variant: 'component' | 'application'): string {
  return variant === 'application' ? 'cells app:test --coverage' : 'cells component:test --coverage';
}

export const CellsLearningLab: React.FC<CellsLearningLabProps> = ({ variant = 'component', stage = 'lifecycle', project = 'store' }) => {
  const runtimeRef = useRef<CellsRuntimeClient | null>(null);
  const repositoryRef = useRef<CellsWorkspaceRepository | null>(null);
  const dirtyPathsRef = useRef(new Set<string>());
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const ensureRuntime = () => {
    if (!runtimeRef.current) runtimeRef.current = new CellsRuntimeClient();
    return runtimeRef.current;
  };
  const ensureRepository = () => {
    if (!repositoryRef.current) repositoryRef.current = new CellsWorkspaceRepository();
    return repositoryRef.current;
  };
  const starter = useMemo(
    () => variant === 'application' ? createCellsProjectPracticeWorkspace(project, stage) : createCellsPracticeWorkspace(),
    [project, stage, variant],
  );
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot>(starter.snapshot);
  const [syncedWorkspace, setSyncedWorkspace] = useState<WorkspaceSnapshot>(starter.snapshot);
  const [generation, setGeneration] = useState(0);
  const [previewHtml, setPreviewHtml] = useState('');
  const [tests, setTests] = useState<CellsTestResult[]>([]);
  const [coverage, setCoverage] = useState<CellsCoverageResult | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'running' | 'error'>('loading');
  const [error, setError] = useState('');
  const [command, setCommand] = useState(defaultCellsCommand(variant));
  const [terminalOutput, setTerminalOutput] = useState('Runtime detenido. El Worker se iniciará al abrir el proyecto.');
  const [activePanel, setActivePanel] = useState<'code' | 'preview' | 'tests'>('code');
  const [fileQuery, setFileQuery] = useState('');
  const [previewLocale, setPreviewLocale] = useState<'es' | 'en'>('es');
  const [observedEvents, setObservedEvents] = useState<Array<{ name: string; detail: unknown }>>([]);
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const draftKey = `course-open-cells:${variant}:${variant === 'application' ? `${project}:${stage}` : 'first-component'}`;
  const workspaceRef = useRef(workspace);
  const generationRef = useRef(generation);
  workspaceRef.current = workspace;
  generationRef.current = generation;

  useEffect(() => {
    const onPreviewMessage = (event: MessageEvent) => {
      if (!event.data || event.data.source !== 'open-cells-preview') return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data.type === 'error') {
        setError(`Vista previa: ${String(event.data.message)}`);
        setStatus('error');
      } else if (event.data.type === 'ready') {
        setTerminalOutput('Componente renderizado dentro del iframe aislado.');
        iframeRef.current?.contentWindow?.postMessage({ source: 'open-cells-shell', type: 'locale:set', locale: previewLocale }, '*');
      } else if (event.data.type === 'business:event' && typeof event.data.name === 'string') {
        setObservedEvents((current) => [...current.slice(-3), { name: event.data.name, detail: event.data.detail }]);
      }
    };
    window.addEventListener('message', onPreviewMessage);
    return () => window.removeEventListener('message', onPreviewMessage);
  }, [previewLocale]);

  const activeFile = workspace.files[workspace.activeFilePath] ?? null;
  const dirty = activeFile?.content !== syncedWorkspace.files[workspace.activeFilePath]?.content;

  const applyWorkspace = (nextWorkspace: WorkspaceSnapshot, nextGeneration: number) => {
    setWorkspace(nextWorkspace);
    setSyncedWorkspace(nextWorkspace);
    setGeneration(nextGeneration);
    dirtyPathsRef.current.clear();
  };

  const loadStarter = async (removeSaved = true) => {
    setStatus('loading');
    setError('');
    setTests([]);
    setCoverage(null);
    try {
      const initial = variant === 'application' ? createCellsProjectPracticeWorkspace(project, stage) : createCellsPracticeWorkspace();
      if (removeSaved) {
        await Promise.all([
          ensureRepository().remove(draftKey),
          ensureRepository().removeSession(draftKey),
        ]);
      }
      const result = await ensureRuntime().loadProject(initial.snapshot, 0);
      if (result.type !== 'workspace:updated') throw new Error('El Worker no devolvió el proyecto inicial.');
      applyWorkspace(result.payload.workspace, 0);
      setPreviewHtml('');
      setActivePanel('code');
      setCommand(defaultCellsCommand(variant));
      setPreviewLocale('es');
      setTerminalOutput('Proyecto abierto en memoria. No se inició ningún servidor ni proceso Node.');
      setObservedEvents([]);
      setStatus('ready');
    } catch (caught) {
      setError(messageFor(caught));
      setStatus('error');
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadInitialWorkspace = async () => {
      setStatus('loading');
      try {
        const [saved, savedSession] = await Promise.all([
          ensureRepository().load(draftKey),
          ensureRepository().loadSession(draftKey),
        ]);
        const initial = saved ?? (variant === 'application' ? createCellsProjectPracticeWorkspace(project, stage) : createCellsPracticeWorkspace());
        const result = await ensureRuntime().loadProject(initial.snapshot, initial.generation);
        if (cancelled || result.type !== 'workspace:updated') return;
        applyWorkspace(result.payload.workspace, initial.generation);
        if (savedSession) {
          setActivePanel(savedSession.activePanel);
          setCommand(savedSession.command);
          setPreviewLocale(savedSession.previewLocale);
          setTests(savedSession.tests);
          setCoverage(savedSession.coverage);
          setTerminalOutput(savedSession.terminalOutput);
        }
        setTerminalOutput(saved
          ? savedSession?.terminalOutput ?? 'Continuaste desde el último cambio guardado en este navegador.'
          : 'Proyecto abierto en memoria. No se inició ningún servidor ni proceso Node.');
        setSessionHydrated(true);
        setStatus('ready');
      } catch (caught) {
        if (!cancelled) { setError(messageFor(caught)); setStatus('error'); }
      }
    };
    void loadInitialWorkspace();
    return () => {
      cancelled = true;
      runtimeRef.current?.dispose();
      runtimeRef.current = null;
      void repositoryRef.current?.close();
      repositoryRef.current = null;
    };
    // El runtime pertenece a esta única instancia del laboratorio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sessionHydrated) return;
    const timer = window.setTimeout(() => {
      void ensureRepository().saveSession(draftKey, {
        version: 1,
        activePanel,
        command,
        previewLocale,
        tests,
        coverage,
        terminalOutput,
        savedAt: Date.now(),
      }).catch((caught) => setError(messageFor(caught)));
    }, 120);
    return () => window.clearTimeout(timer);
  }, [activePanel, command, coverage, draftKey, previewLocale, sessionHydrated, terminalOutput, tests]);

  const syncDirtyFiles = async (): Promise<number> => {
    let currentGeneration = generationRef.current;
    let currentSnapshot = workspaceRef.current;
    for (const path of [...dirtyPathsRef.current]) {
      const file = workspaceRef.current.files[path];
      if (!file) continue;
      currentGeneration += 1;
      const result = await ensureRuntime().writeFile(path, file.content, currentGeneration);
      if (result.type !== 'workspace:updated') throw new Error(`No se pudo sincronizar ${path} con el Worker.`);
      currentSnapshot = { ...result.payload.workspace, activeFilePath: workspaceRef.current.activeFilePath };
      dirtyPathsRef.current.delete(path);
    }
    if (currentGeneration !== generationRef.current) {
      applyWorkspace(currentSnapshot, currentGeneration);
      await ensureRepository().save(draftKey, createVersionedCellsWorkspace(currentSnapshot, currentGeneration));
    }
    return currentGeneration;
  };

  const buildPreview = async () => {
    setStatus('running'); setError('');
    try {
      const currentGeneration = await syncDirtyFiles();
      const result = await ensureRuntime().buildPreview(currentGeneration);
      if (result.type !== 'preview:built') throw new Error('La vista previa no produjo un documento.');
      setPreviewHtml(result.payload.html);
      setObservedEvents([]);
      setActivePanel('preview');
      setTerminalOutput('Vista previa construida dentro del Worker. El iframe ejecuta solo el resultado aislado.');
      setStatus('ready');
    } catch (caught) { setError(messageFor(caught)); setStatus('error'); }
  };

  const runTests = async () => {
    setStatus('running'); setError('');
    try {
      const currentGeneration = await syncDirtyFiles();
      const structuralResult = await ensureRuntime().runTests(currentGeneration, false);
      if (structuralResult.type !== 'tests:completed') throw new Error('El runner estructural no devolvió resultados.');

      const testRunId = crypto.randomUUID();
      const browserResultPromise = waitForCellsBrowserTests(
        window,
        testRunId,
        () => iframeRef.current?.contentWindow ?? null,
      );
      const previewResult = await ensureRuntime().buildPreview(currentGeneration, true, testRunId);
      if (previewResult.type !== 'preview:built') throw new Error('No se pudo preparar el iframe de pruebas.');
      setPreviewHtml(previewResult.payload.html);
      // El runner vive dentro del iframe. Montarlo antes de esperar evita que
      // “Comprobar” dependa de que la persona haya abierto Vista previa antes.
      setActivePanel('preview');
      const browserResult = await browserResultPromise;
      const combined = [...structuralResult.payload.results, ...browserResult.results];
      setTests(combined);
      setActivePanel('tests');
      const passed = combined.filter((test) => test.passed).length;

      if (variant === 'component') {
        const sourcePath = Object.keys(workspaceRef.current.files).find((path) => (
          /^src\/[^/]+\.js$/.test(path) && /WidgetMixin\s*\(/.test(workspaceRef.current.files[path].content)
        ));
        const nextCoverage = sourcePath
          ? createIstanbulCoverageReport(browserResult.coverage ?? {}, [sourcePath])
            ?? createCellsCoverageReport(sourcePath, workspaceRef.current.files[sourcePath].content, browserResult.invokedMethods)
          : null;
        setCoverage(nextCoverage);
        setTerminalOutput(`${passed} de ${combined.length} contratos superados. El iframe cambió propiedades e idioma, pulsó el botón y observó el evento; coverage proviene de los métodos ejecutados.`);
      } else {
        const coveragePaths = [
          'app/pages/academy-home-page/academy-home-page.js',
          'app/data/academy-product-data-manager.js',
        ];
        const includedPaths = coveragePaths.filter((path) => Boolean(workspaceRef.current.files[path]));
        const instrumented = createIstanbulCoverageReport(browserResult.coverage ?? {}, includedPaths);
        const fallbackReports = includedPaths.map((path) => (
          createCellsCoverageReport(path, workspaceRef.current.files[path].content, browserResult.invokedMethods)
        ));
        setCoverage(instrumented ?? (fallbackReports.length ? mergeCellsCoverageReports(fallbackReports) : null));
        setTerminalOutput(`${passed} de ${combined.length} contratos superados. El iframe navegó por rutas reales, comprobó ausencia tras cleanup y ejecutó estados y cancelación del data manager.`);
      }
      setStatus('ready');
    } catch (caught) { setError(messageFor(caught)); setStatus('error'); }
  };

  const runCommand = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('running'); setError('');
    try {
      const currentGeneration = await syncDirtyFiles();
      const result = await ensureRuntime().runCommand(command, currentGeneration);
      if (result.type === 'tests:completed') {
        setTests(result.payload.results);
        setCoverage(result.payload.coverage ?? null);
        setActivePanel('tests');
        setTerminalOutput('Comprobaciones estructurales ejecutadas en el Worker. Usa “Comprobar” para ejecutar también el flujo conductual dentro del iframe.');
      } else if (result.type === 'preview:built') {
        setPreviewHtml(result.payload.html);
        setActivePanel('preview');
        setTerminalOutput('Vista previa actualizada.');
      } else if (result.type === 'command:completed') {
        if (result.payload.workspace) {
          applyWorkspace(result.payload.workspace, result.generation);
          await ensureRepository().save(draftKey, createVersionedCellsWorkspace(result.payload.workspace, result.generation));
        }
        setTerminalOutput(result.payload.output);
      } else {
        setTerminalOutput(`Comando completado: ${command}`);
      }
      setStatus('ready');
    } catch (caught) { setError(messageFor(caught)); setStatus('error'); }
  };

  const filteredFiles = Object.values(workspace.files).filter((file) => (
    file.path.toLocaleLowerCase('es').includes(fileQuery.trim().toLocaleLowerCase('es'))
  ));

  const exportProject = async () => {
    setStatus('running'); setError('');
    try {
      const currentGeneration = await syncDirtyFiles();
      const result = await ensureRuntime().exportProject(currentGeneration);
      if (result.type !== 'project:exported') throw new Error('El runtime no produjo el archivo ZIP.');
      const blob = new Blob([result.payload.bytes as BlobPart], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = result.payload.fileName; link.click();
      URL.revokeObjectURL(url);
      setTerminalOutput(`${result.payload.fileName} exportado. Puedes continuar el mismo proyecto fuera de la plataforma.`);
      setStatus('ready');
    } catch (caught) { setError(messageFor(caught)); setStatus('error'); }
  };

  return (
    <div className="cells-lab" aria-label="Playground real de Open Cells">
      <header className="cells-lab__header">
        <div>
          <p>PROYECTO · {variant === 'application' ? 'APLICACIÓN' : 'COMPONENTE'}</p>
          <h3>{variant === 'application' ? PROJECT_NAMES[project] : 'academy-learning-card'}</h3>
          <span>{status === 'running' ? 'Worker ocupado…' : status === 'loading' ? 'Preparando Worker…' : 'Todo ocurre en este navegador'}</span>
        </div>
        <div className="cells-lab__actions">
          <button type="button" onClick={buildPreview} disabled={status === 'running'}><Play size={15} /> Vista previa</button>
          <button type="button" onClick={runTests} disabled={status === 'running'}><FlaskConical size={15} /> Comprobar</button>
          <button type="button" onClick={exportProject} disabled={status === 'running'}><Download size={15} /> Exportar ZIP</button>
          <button type="button" onClick={() => void loadStarter(true)} disabled={status === 'running'} aria-label="Reiniciar práctica"><RotateCcw size={15} /></button>
        </div>
      </header>

      <div className="cells-lab__brief">
        <strong>Tu misión</strong>
        <p>{variant === 'application'
          ? APP_MISSIONS[stage]
          : 'El botón está importado, pero no pertenece todavía al registro scoped. Además, la acción no comunica nada hacia fuera. Completa ambos contratos sin cambiar la API pública ni escribir un registro global.'}</p>
      </div>

      <div className="cells-lab__mode-tabs" role="tablist" aria-label="Área de trabajo Cells">
        <button type="button" role="tab" aria-selected={activePanel === 'code'} onClick={() => setActivePanel('code')}><Code2 size={15} /> Código</button>
        <button type="button" role="tab" aria-selected={activePanel === 'preview'} onClick={() => setActivePanel('preview')}><Eye size={15} /> Vista previa</button>
        <button type="button" role="tab" aria-selected={activePanel === 'tests'} onClick={() => setActivePanel('tests')}><FlaskConical size={15} /> Pruebas {tests.length ? `(${tests.filter((test) => test.passed).length}/${tests.length})` : ''}</button>
      </div>

      {activePanel === 'code' && <div className="cells-lab__workspace cells-lab__workspace--code">
        <nav className="cells-lab__files" aria-label="Archivos del proyecto">
          <span><FileCode2 size={15} /> Archivos</span>
          <input aria-label="Buscar archivo" placeholder="Buscar archivo…" value={fileQuery} onChange={(event) => setFileQuery(event.target.value)} />
          {filteredFiles.map((file) => (
            <button key={file.path} type="button" aria-current={file.path === workspace.activeFilePath} onClick={() => setWorkspace((current) => {
              const next = { ...current, activeFilePath: file.path };
              void ensureRepository().save(draftKey, createVersionedCellsWorkspace(next, generationRef.current)).catch((caught) => setError(messageFor(caught)));
              return next;
            })}>
              {file.path}
            </button>
          ))}
        </nav>
        <section className="cells-lab__editor" aria-label="Editor Cells">
          <div className="cells-lab__editor-bar"><span>{activeFile?.path}</span>{dirty && <em>sin sincronizar</em>}</div>
          <CodeEditor
            file={activeFile}
            workspaceFiles={workspace.files}
            lessonId={`open-cells-${variant}-${project}-${stage}`}
            onCodeChange={(content) => activeFile && setWorkspace((current) => {
              const next = {
                ...current,
                files: { ...current.files, [activeFile.path]: { ...activeFile, content } },
              };
              dirtyPathsRef.current.add(activeFile.path);
              void ensureRepository().save(draftKey, createVersionedCellsWorkspace(next, generationRef.current)).catch((caught) => setError(messageFor(caught)));
              return next;
            })}
          />
        </section>
      </div>}

      {activePanel === 'preview' && <section className="cells-lab__result cells-lab__result--focused" aria-label="Vista previa del proyecto">
        <div className="cells-lab__result-tabs">
          <span>Vista previa aislada</span>
          <div className="cells-lab__preview-tools">
            <span>{previewHtml ? 'Proyecto ejecutado' : 'Todavía no construida'}</span>
            <div role="group" aria-label="Idioma de la demo">
              {(['es', 'en'] as const).map((locale) => (
                <button
                  key={locale}
                  type="button"
                  aria-pressed={previewLocale === locale}
                  onClick={() => {
                    setPreviewLocale(locale);
                    iframeRef.current?.contentWindow?.postMessage({ source: 'open-cells-shell', type: 'locale:set', locale }, '*');
                  }}
                >{locale.toUpperCase()}</button>
              ))}
            </div>
          </div>
        </div>
        {previewHtml ? (
          <iframe
            ref={iframeRef}
            title={`Vista previa ${variant === 'application' ? 'de la aplicación' : 'del componente'} Cells`}
            sandbox="allow-scripts"
            srcDoc={previewHtml}
            onLoad={() => iframeRef.current?.contentWindow?.postMessage({ source: 'open-cells-shell', type: 'locale:set', locale: previewLocale }, '*')}
          />
        ) : (
          <div className="cells-lab__empty"><Play size={24} /><p>Usa “Vista previa” para construir el proyecto dentro del Worker.</p></div>
        )}
        {variant === 'component' && (
          <aside className="cells-lab__event-inspector" aria-label="Eventos públicos observados">
            <strong>Eventos públicos</strong>
            {observedEvents.length === 0
              ? <span>Pulsa el botón de la demo para observar nombre y detail.</span>
              : observedEvents.map((event, index) => <code key={`${event.name}:${index}`}>{event.name} · {JSON.stringify(event.detail)}</code>)}
          </aside>
        )}
      </section>}

      {activePanel === 'tests' && <section className="cells-lab__result cells-lab__result--focused" aria-label="Pruebas y coverage del proyecto">
          <div className="cells-lab__result-tabs">
            <span>Resultado</span>
            <span>
              {coverage === null
                ? 'Sin coverage dinámico'
                : `S ${coverage.statements.percentage}% · R ${coverage.branches?.percentage ?? 0}% · F ${coverage.functions?.percentage ?? 0}% · L ${coverage.lines?.percentage ?? 0}%`}
            </span>
          </div>
          {tests.length > 0 && (
            <ul className="cells-lab__tests">
              {tests.map((test) => <li key={test.id} data-passed={test.passed}>{test.passed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}<span><strong>{test.title}</strong><small>{test.message}</small></span></li>)}
            </ul>
          )}
          {coverage?.files?.map((fileCoverage) => (
            <div className="cells-lab__coverage" key={fileCoverage.path}>
              <strong>Coverage real · {fileCoverage.path}</strong>
              {fileCoverage.available ? (
                <>
                  <dl>
                    <div><dt>Sentencias</dt><dd>{fileCoverage.statements.covered}/{fileCoverage.statements.total} · {fileCoverage.statements.percentage}%</dd></div>
                    <div><dt>Ramas</dt><dd>{fileCoverage.branches.covered}/{fileCoverage.branches.total} · {fileCoverage.branches.percentage}%</dd></div>
                    <div><dt>Funciones</dt><dd>{fileCoverage.functions.covered}/{fileCoverage.functions.total} · {fileCoverage.functions.percentage}%</dd></div>
                    <div><dt>Líneas</dt><dd>{fileCoverage.lines.covered}/{fileCoverage.lines.total} · {fileCoverage.lines.percentage}%</dd></div>
                  </dl>
                  <small>{fileCoverage.uncoveredLines.length ? `Líneas no cubiertas: ${fileCoverage.uncoveredLines.join(', ')}` : 'No quedan líneas ejecutables sin cubrir en este archivo.'}</small>
                </>
              ) : <small>{fileCoverage.unavailableReason}</small>}
            </div>
          ))}
          {tests.length === 0 && <div className="cells-lab__empty"><FlaskConical size={24} /><p>Usa “Comprobar” para ejecutar los contratos del Worker y del iframe.</p></div>}
      </section>}

      <details className="cells-lab__terminal">
        <summary><TerminalSquare size={15} /> Terminal Cells del navegador</summary>
        <form onSubmit={runCommand}>
          <label className="sr-only" htmlFor="cells-command">Comando Cells</label>
          <div><span>$</span><input id="cells-command" value={command} onChange={(event) => setCommand(event.target.value)} spellCheck={false} /><button disabled={status === 'running'}>Ejecutar</button></div>
          <output>{error || terminalOutput}</output>
        </form>
      </details>
    </div>
  );
};
