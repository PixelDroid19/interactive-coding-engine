import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Code2, Download, Eye, FileCode2, FlaskConical, Play, RotateCcw, TerminalSquare, XCircle } from 'lucide-react';
import type { WorkspaceFile, WorkspaceSnapshot } from '../../types/scrim';
import { CellsRuntimeClient, CellsRuntimeClientError } from '../../engine/cells/cellsRuntimeClient';
import type { CellsCoverageResult, CellsTestResult } from '../../engine/cells/cellsWorkerProtocol';
import type { CellsComponentPracticeStage } from '../../engine/cells/cellsRecipes';
import { createCellsCurriculumPracticeWorkspace } from '../../engine/cells/cellsCurriculumRecipes';
import { OPEN_CELLS_ARTIFACTS, type OpenCellsArtifact } from '../../curriculum/open-cells/lessonProjects';
import {
  createCellsProjectPracticeWorkspace,
  type CellsAppPracticeStage,
  type CellsAppProject,
} from '../../engine/cells/cellsAppRecipes';
import { CellsWorkspaceRepository, type CellsWorkspaceRecovery } from '../../engine/cells/cellsWorkspaceRepository';
import { createVersionedCellsWorkspace } from '../../engine/cells/cellsVirtualFileSystem';
import { waitForCellsBrowserTests } from '../../engine/cells/cellsBrowserRunner';
import { createCellsCoverageReport, createIstanbulCoverageReport, mergeCellsCoverageReports } from '../../engine/cells/cellsCoverage';
import { CodeEditor } from '../editor/CodeEditor';
import { WorkspaceTree } from '../editor/WorkspaceTree';
import { CellsPreviewWorkbench } from './CellsPreviewWorkbench';
import type { CellsPreviewBuild } from '../../engine/cells/cellsPreviewCompiler';

function messageFor(error: unknown): string {
  if (error instanceof CellsRuntimeClientError) {
    return [error.message, error.filePath, error.line ? `línea ${error.line}` : ''].filter(Boolean).join(' · ');
  }
  return error instanceof Error ? error.message : 'No se pudo completar la operación.';
}

interface CellsLearningLabProps {
  variant?: 'component' | 'application';
  stage?: CellsAppPracticeStage;
  componentStage?: CellsComponentPracticeStage;
  componentArtifactId?: string;
  project?: CellsAppProject;
  lessonId?: string;
}

const APP_MISSIONS: Record<CellsAppPracticeStage, string> = {
  lifecycle: 'La página conserva una suscripción al salir y tampoco navega al detalle. Completa cleanup y navegación por nombre sin acoplar la tarjeta al router.',
  channels: 'Conecta el canal de selección y completa la frontera externa: valida el mensaje del shell y traduce el ciclo de vida a un canal interno sin filtrar objetos nativos hacia los componentes.',
  data: 'El data manager distingue estados, pero una respuesta antigua todavía puede ganar y disconnect no cancela el trabajo activo. Protege ambas fronteras sin cambiar su API pública.',
  delivery: 'La aplicación funciona en desarrollo, pero la ruta desconocida y la configuración de producción están incompletas. Deja el proyecto listo para una entrega reproducible.',
};

function componentMission(stage: CellsComponentPracticeStage, artifact: OpenCellsArtifact): string {
  const subject = `${artifact.label} (${artifact.tagName})`;
  return ({
    scaffold: `${subject} todavía no expone su entrada pública ni el comando de documentación. Completa package.json y comprueba cómo lo consumirían la demo, las pruebas y otra aplicación.`,
    api: `${subject} perdió parte de su API pública y dejó de comunicar su acción. Reconstruye el contrato descrito en custom-elements.json sin obligar al consumidor a llamar métodos internos.`,
    composition: `${subject} importa una dependencia local que no está registrada y su acción no cruza el Shadow DOM. Repara ambas fronteras y compruébalas desde la demo.`,
    styles: `${subject} consume su css.js, pero ese artefacto quedó desactualizado respecto al SCSS. Regenera el estilo runtime desde la fuente y comprueba que ambos describen la misma interfaz.`,
    i18n: `Los catálogos de ${subject} ya no tienen la misma API ni los mismos placeholders. Restaura la paridad EN/ES sin esconder la clave que falla.`,
    demo: `La demo de ${subject} entra por un archivo interno y dejó de conectar su control con la propiedad pública. Haz que vuelva a comportarse como un consumidor externo real.`,
    tests: `La suite de ${subject} comprueba detail y bubbles, pero dejó de demostrar que el evento cruza Shadow DOM. Completa la prueba pública sin inspeccionar miembros privados.`,
    delivery: `La metadata de ${subject} contradice el tag real y la documentación no explica cómo consumir ni verificar el paquete. Alinea el contrato antes de exportarlo.`,
  } satisfies Record<CellsComponentPracticeStage, string>)[stage];
}

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

export const CellsLearningLab: React.FC<CellsLearningLabProps> = ({
  variant = 'component',
  stage = 'lifecycle',
  componentStage = 'composition',
  componentArtifactId = 'action-button',
  project = 'store',
  lessonId,
}) => {
  const componentArtifact = OPEN_CELLS_ARTIFACTS[componentArtifactId] ?? OPEN_CELLS_ARTIFACTS['action-button'];
  const runtimeRef = useRef<CellsRuntimeClient | null>(null);
  const repositoryRef = useRef<CellsWorkspaceRepository | null>(null);
  const dirtyPathsRef = useRef(new Set<string>());
  const previewRequestRef = useRef(0);
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
    () => variant === 'application'
      ? createCellsProjectPracticeWorkspace(project, stage)
      : createCellsCurriculumPracticeWorkspace(componentArtifact, componentStage),
    [componentArtifact, componentStage, project, stage, variant],
  );
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot>(starter.snapshot);
  const [syncedWorkspace, setSyncedWorkspace] = useState<WorkspaceSnapshot>(starter.snapshot);
  const [generation, setGeneration] = useState(0);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewDemo, setPreviewDemo] = useState<CellsPreviewBuild['componentDemo']>();
  const [previewState, setPreviewState] = useState<'idle' | 'building' | 'fresh' | 'stale' | 'error'>('idle');
  const [tests, setTests] = useState<CellsTestResult[]>([]);
  const [coverage, setCoverage] = useState<CellsCoverageResult | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'running' | 'error'>('loading');
  const [error, setError] = useState('');
  const [workspaceRecovery, setWorkspaceRecovery] = useState<CellsWorkspaceRecovery | null>(null);
  const [command, setCommand] = useState(defaultCellsCommand(variant));
  const [terminalOutput, setTerminalOutput] = useState('Runtime detenido. El Worker se iniciará al abrir el proyecto.');
  const [activeInspectorTab, setActiveInspectorTab] = useState<'preview' | 'tests' | 'terminal'>('preview');
  const [activeMobilePanel, setActiveMobilePanel] = useState<'files' | 'editor' | 'results'>('editor');
  const [fileQuery, setFileQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [previewLocale, setPreviewLocale] = useState<'es' | 'en'>('es');
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const labIdentity = lessonId ?? (variant === 'application' ? `${project}:${stage}` : componentStage);
  const draftKey = `course-open-cells:v2:${variant}:${labIdentity}`;
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
        setPreviewState('error');
        setStatus('error');
      } else if (event.data.type === 'ready') {
        setPreviewState('fresh');
        setTerminalOutput('Componente renderizado dentro del iframe aislado.');
        iframeRef.current?.contentWindow?.postMessage({ source: 'open-cells-shell', type: 'locale:set', locale: previewLocale }, '*');
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

  const beginPreviewBuild = (): number => {
    const request = previewRequestRef.current + 1;
    previewRequestRef.current = request;
    setPreviewState('building');
    return request;
  };

  const applyPreviewBuild = (request: number, build: CellsPreviewBuild): boolean => {
    if (request !== previewRequestRef.current) return false;
    setPreviewHtml(build.html);
    setPreviewDemo(build.componentDemo);
    setPreviewState('fresh');
    return true;
  };

  const loadStarter = async (removeSaved = true) => {
    setStatus('loading');
    setError('');
    setTests([]);
    setCoverage(null);
    try {
      const initial = variant === 'application'
        ? createCellsProjectPracticeWorkspace(project, stage)
        : createCellsCurriculumPracticeWorkspace(componentArtifact, componentStage);
      if (removeSaved) {
        await Promise.all([
          ensureRepository().remove(draftKey),
          ensureRepository().removeSession(draftKey),
        ]);
      }
      const result = await ensureRuntime().loadProject(initial.snapshot, 0);
      if (result.type !== 'workspace:updated') throw new Error('El Worker no devolvió el proyecto inicial.');
      applyWorkspace(result.payload.workspace, 0);
      previewRequestRef.current += 1;
      setPreviewHtml('');
      setPreviewDemo(undefined);
      setPreviewState('idle');
      setActiveInspectorTab('preview');
      setActiveMobilePanel('editor');
      setCommand(defaultCellsCommand(variant));
      setPreviewLocale('es');
      setTerminalOutput('Proyecto abierto en memoria. No se inició ningún servidor ni proceso Node.');
      setExpandedFolders([]);

      const request = beginPreviewBuild();
      const previewResult = await ensureRuntime().buildPreview(0);
      if (previewResult.type !== 'preview:built') {
        throw new Error('El runtime no pudo reconstruir la vista previa inicial.');
      }
      applyPreviewBuild(request, previewResult.payload);
      setWorkspaceRecovery(null);
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
        const [savedResult, savedSession] = await Promise.all([
          ensureRepository().load(draftKey),
          ensureRepository().loadSession(draftKey),
        ]);
        if (cancelled) return;
        if (savedResult.status === 'corrupt') {
          setWorkspaceRecovery(savedResult.recovery);
          setError('No pudimos abrir el proyecto Cells guardado porque sus datos son inválidos. No se reemplazó por el proyecto inicial.');
          setStatus('error');
          return;
        }
        const saved = savedResult.status === 'loaded' ? savedResult.workspace : null;
        const initial = saved ?? (variant === 'application'
          ? createCellsProjectPracticeWorkspace(project, stage)
          : createCellsCurriculumPracticeWorkspace(componentArtifact, componentStage));
        const result = await ensureRuntime().loadProject(initial.snapshot, initial.generation);
        if (cancelled || result.type !== 'workspace:updated') return;
        applyWorkspace(result.payload.workspace, initial.generation);
        if (savedSession) {
          const tab = ['preview', 'tests', 'terminal'].includes(savedSession.activePanel)
            ? savedSession.activePanel as 'preview' | 'tests' | 'terminal'
            : 'preview';
          setActiveInspectorTab(tab);
          setExpandedFolders(savedSession.expandedFolders);
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

        // Auto-build preview immediately on load so the student sees the live component without clicking
        try {
          const request = beginPreviewBuild();
          const previewRes = await ensureRuntime().buildPreview(initial.generation);
          if (!cancelled && previewRes.type === 'preview:built') {
            applyPreviewBuild(request, previewRes.payload);
          }
        } catch {
          if (!cancelled) setPreviewState('error');
        }
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

  // Debounced auto-sync and live preview re-build when code is edited
  useEffect(() => {
    if (!sessionHydrated) return;
    if (dirtyPathsRef.current.size === 0) return;
    const timer = window.setTimeout(async () => {
      const request = beginPreviewBuild();
      try {
        const currentGeneration = await syncDirtyFiles();
        const result = await ensureRuntime().buildPreview(currentGeneration);
        if (result.type === 'preview:built') {
          applyPreviewBuild(request, result.payload);
        }
      } catch (caught) {
        if (request === previewRequestRef.current) {
          setPreviewState('error');
          setError(`Vista previa desactualizada: ${messageFor(caught)}`);
        }
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [workspace, sessionHydrated]);

  useEffect(() => {
    if (!sessionHydrated) return;
    const timer = window.setTimeout(() => {
      void ensureRepository().saveSession(draftKey, {
        version: 1,
        activePanel: activeInspectorTab,
        expandedFolders,
        command,
        previewLocale,
        tests,
        coverage,
        terminalOutput,
        savedAt: Date.now(),
      }).catch((caught) => setError(messageFor(caught)));
    }, 120);
    return () => window.clearTimeout(timer);
  }, [activeInspectorTab, command, coverage, draftKey, expandedFolders, previewLocale, sessionHydrated, terminalOutput, tests]);

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
    const request = beginPreviewBuild();
    try {
      const currentGeneration = await syncDirtyFiles();
      const result = await ensureRuntime().buildPreview(currentGeneration);
      if (result.type !== 'preview:built') throw new Error('La vista previa no produjo un documento.');
      applyPreviewBuild(request, result.payload);
      setActiveInspectorTab('preview');
      setActiveMobilePanel('results');
      setTerminalOutput('Vista previa construida dentro del Worker. El iframe ejecuta solo el resultado aislado.');
      setStatus('ready');
    } catch (caught) {
      if (request === previewRequestRef.current) setPreviewState('error');
      setError(messageFor(caught)); setStatus('error');
    }
  };

  const runTests = async () => {
    setStatus('running'); setError('');
    try {
      const currentGeneration = await syncDirtyFiles();
      const structuralResult = await ensureRuntime().runTests(currentGeneration, false);
      if (structuralResult.type !== 'tests:completed') throw new Error('El runner estructural no devolvió resultados.');

      const testRunId = crypto.randomUUID();
      const request = beginPreviewBuild();
      const browserResultPromise = waitForCellsBrowserTests(
        window,
        testRunId,
        () => iframeRef.current?.contentWindow ?? null,
      );
      const previewResult = await ensureRuntime().buildPreview(currentGeneration, true, testRunId);
      if (previewResult.type !== 'preview:built') throw new Error('No se pudo preparar el iframe de pruebas.');
      applyPreviewBuild(request, previewResult.payload);
      setActiveInspectorTab('tests');
      setActiveMobilePanel('results');
      const browserResult = await browserResultPromise;
      const combined = [...structuralResult.payload.results, ...browserResult.results];
      setTests(combined);
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
      return `${passed} de ${combined.length} comprobaciones Cells superadas.`;
    } catch (caught) {
      setPreviewState('error');
      const detail = messageFor(caught);
      setError(detail); setStatus('error');
      return `Las comprobaciones Cells fallaron: ${detail}`;
    }
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
        setActiveInspectorTab('tests');
        setActiveMobilePanel('results');
        setTerminalOutput('Comprobaciones estructurales ejecutadas en el Worker. Usa “Comprobar” para ejecutar también el flujo conductual dentro del iframe.');
      } else if (result.type === 'preview:built') {
        const request = beginPreviewBuild();
        applyPreviewBuild(request, result.payload);
        setActiveInspectorTab('preview');
        setActiveMobilePanel('results');
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

  const passedTestsCount = tests.filter((test) => test.passed).length;
  const allTestsPassed = tests.length > 0 && passedTestsCount === tests.length;

  if (workspaceRecovery) {
    return (
      <div className="cells-lab" aria-label="Playground real de Open Cells">
        <header className="cells-lab__header">
          <div className="cells-lab__header-info">
            <p>PROYECTO · RECUPERACIÓN</p>
            <h3>Proyecto guardado necesita atención</h3>
            <span className="cells-lab__status-indicator is-error">
              <span className="cells-lab__status-dot" />
              El laboratorio necesita atención
            </span>
          </div>
        </header>
        <section className="cells-lab__empty" role="alert">
          <XCircle size={28} />
          <h4>No pudimos abrir tu proyecto guardado</h4>
          <p>No se reemplazó por el proyecto inicial. La copia inválida queda preservada para que puedas recuperarla.</p>
          <small>{workspaceRecovery.message}</small>
          <button
            type="button"
            className="cells-lab__empty-btn"
            onClick={() => void loadStarter(true)}
            disabled={status === 'running' || status === 'loading'}
          >
            <RotateCcw size={14} /> Crear un proyecto nuevo
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="cells-lab" aria-label="Playground real de Open Cells">
      <header className="cells-lab__header">
        <div className="cells-lab__header-info">
          <p>PROYECTO · {variant === 'application' ? 'APLICACIÓN' : 'COMPONENTE'}</p>
          <h3>{variant === 'application' ? PROJECT_NAMES[project] : componentArtifact.tagName}</h3>
          <span className={`cells-lab__status-indicator is-${status}`}>
            <span className="cells-lab__status-dot" />
            {status === 'running'
              ? 'Worker ocupado…'
              : status === 'loading'
                ? 'Preparando Worker…'
                : status === 'error'
                  ? 'El laboratorio necesita atención'
                  : 'Todo ocurre en este navegador'}
          </span>
        </div>
        <div className="cells-lab__actions">
          <button type="button" className="cells-lab__btn-preview" onClick={buildPreview} disabled={status === 'running'}>
            <Play size={15} /> Vista previa
          </button>
          <button type="button" className="cells-lab__btn-test" onClick={runTests} disabled={status === 'running'}>
            <FlaskConical size={15} /> Comprobar {tests.length > 0 ? `(${passedTestsCount}/${tests.length})` : ''}
          </button>
          <button type="button" onClick={exportProject} disabled={status === 'running'}>
            <Download size={15} /> Exportar ZIP
          </button>
          <button type="button" onClick={() => void loadStarter(true)} disabled={status === 'running'} aria-label="Reiniciar práctica">
            <RotateCcw size={15} />
          </button>
        </div>
      </header>

      <div className="cells-lab__brief">
        <span className="cells-lab__brief-badge">Tu misión</span>
        <p>{variant === 'application'
          ? APP_MISSIONS[stage]
          : componentMission(componentStage, componentArtifact)}</p>
      </div>

      <nav className="cells-lab__mobile-nav" role="tablist" aria-label="Área de trabajo en móvil">
        {([
          ['files', FileCode2, 'Archivos'],
          ['editor', Code2, 'Editor'],
          ['results', Eye, 'Resultados'],
        ] as const).map(([panel, Icon, label]) => (
          <button
            key={panel}
            type="button"
            role="tab"
            aria-selected={activeMobilePanel === panel}
            className={activeMobilePanel === panel ? 'is-active' : ''}
            onClick={() => setActiveMobilePanel(panel)}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      <div className="cells-lab__workbench" data-testid="cells-workbench" data-mobile-panel={activeMobilePanel}>
        {/* PANEL IZQUIERDO: ESTUDIO DE CÓDIGO (Archivos + Editor) */}
        <div className="cells-lab__studio">
          <nav className="cells-lab__files" aria-label="Archivos del proyecto">
            <div className="cells-lab__files-header">
              <span><FileCode2 size={13} /> Archivos ({Object.keys(workspace.files).length})</span>
            </div>
            <input
              aria-label="Buscar archivo"
              placeholder="Buscar archivo…"
              value={fileQuery}
              onChange={(event) => setFileQuery(event.target.value)}
            />
            <div className="cells-lab__files-list">
              <WorkspaceTree
                files={workspace.files}
                activeFilePath={workspace.activeFilePath}
                query={fileQuery}
                expandedPaths={expandedFolders}
                onExpandedPathsChange={setExpandedFolders}
                onFileSelect={(path) => setWorkspace((current) => {
                  setActiveMobilePanel('editor');
                  const next = { ...current, activeFilePath: path };
                  void ensureRepository().save(draftKey, createVersionedCellsWorkspace(next, generationRef.current)).catch((caught) => setError(messageFor(caught)));
                  return next;
                })}
                renderFileActions={(file) => file.path === activeFile?.path && dirty
                  ? <span className="cells-lab__file-dot" title="Sin guardar" />
                  : null}
              />
            </div>
          </nav>

          <section className="cells-lab__editor" aria-label="Editor Cells">
            <div className="cells-lab__editor-bar">
              <div className="cells-lab__editor-file">
                <Code2 size={14} />
                <span>{activeFile?.path}</span>
              </div>
              {dirty ? <em className="cells-lab__dirty-tag">● sin sincronizar</em> : <span className="cells-lab__synced-tag">✓ sincronizado</span>}
            </div>
            <div className="cells-lab__editor-canvas">
              <CodeEditor
                file={activeFile}
                workspaceFiles={workspace.files}
                lessonId={lessonId ?? `open-cells-${variant}-${variant === 'application' ? `${project}-${stage}` : componentStage}`}
                lineWrapping
                onCodeChange={(content) => activeFile && setWorkspace((current) => {
                  const next = {
                    ...current,
                    files: { ...current.files, [activeFile.path]: { ...activeFile, content } },
                  };
                  dirtyPathsRef.current.add(activeFile.path);
                  previewRequestRef.current += 1;
                  setPreviewState('stale');
                  void ensureRepository().save(draftKey, createVersionedCellsWorkspace(next, generationRef.current)).catch((caught) => setError(messageFor(caught)));
                  return next;
                })}
                onWorkspaceFileChange={(path, content) => setWorkspace((current) => {
                  const target = current.files[path];
                  if (!target) return current;
                  const next = { ...current, files: { ...current.files, [path]: { ...target, content } } };
                  dirtyPathsRef.current.add(path);
                  previewRequestRef.current += 1;
                  setPreviewState('stale');
                  void ensureRepository().save(draftKey, createVersionedCellsWorkspace(next, generationRef.current)).catch((caught) => setError(messageFor(caught)));
                  return next;
                })}
                onTutorRunChecks={async () => {
                  return await runTests();
                }}
                tutorRecentResult={tests.length > 0 ? `${tests.filter((test) => test.passed).length} de ${tests.length} comprobaciones Cells superadas.` : undefined}
              />
            </div>
          </section>
        </div>

        {/* PANEL DERECHO: INSPECTOR DE RESULTADOS (Vista previa / Pruebas / Terminal) */}
        <div className="cells-lab__inspector">
          <div className="cells-lab__inspector-tabs" role="tablist" aria-label="Panel de resultados Cells">
            <div className="cells-lab__inspector-tabgroup">
              <button
                type="button"
                role="tab"
                aria-selected={activeInspectorTab === 'preview'}
                onClick={() => setActiveInspectorTab('preview')}
                className={`cells-lab__tab-btn ${activeInspectorTab === 'preview' ? 'is-active' : ''}`}
              >
                <Eye size={14} />
                <span>Vista previa</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeInspectorTab === 'tests'}
                onClick={() => setActiveInspectorTab('tests')}
                className={`cells-lab__tab-btn ${activeInspectorTab === 'tests' ? 'is-active' : ''}`}
              >
                <FlaskConical size={14} />
                <span>Pruebas</span>
                {tests.length > 0 && (
                  <span className={`cells-lab__tab-counter ${allTestsPassed ? 'is-pass' : 'is-fail'}`}>
                    {passedTestsCount}/{tests.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeInspectorTab === 'terminal'}
                onClick={() => setActiveInspectorTab('terminal')}
                className={`cells-lab__tab-btn ${activeInspectorTab === 'terminal' ? 'is-active' : ''}`}
              >
                <TerminalSquare size={14} />
                <span>Terminal</span>
              </button>
            </div>

            <div className="cells-lab__inspector-tabtools">
          {activeInspectorTab === 'preview' && variant === 'application' && (
                <div className="cells-lab__preview-tools">
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
                      >
                        {locale.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {activeInspectorTab === 'tests' && tests.length > 0 && (
                <button
                  type="button"
                  className="cells-lab__tab-retest"
                  onClick={runTests}
                  disabled={status === 'running'}
                  title="Volver a comprobar"
                >
                  <FlaskConical size={13} />
                  <span>Comprobar</span>
                </button>
              )}
            </div>
          </div>

          <div className="cells-lab__inspector-body">
            {activeInspectorTab === 'preview' && (
              <div className="cells-lab__preview-state" data-state={previewState} role="status" aria-live="polite">
                <span aria-hidden="true" />
                {previewState === 'building' && 'Actualizando desde el código…'}
                {previewState === 'fresh' && 'Vista sincronizada con el proyecto'}
                {previewState === 'stale' && 'Cambios pendientes de recompilar'}
                {previewState === 'error' && 'La última edición no pudo renderizarse'}
                {previewState === 'idle' && 'Vista previa pendiente'}
              </div>
            )}
            {/* VISTA PREVIA */}
            <div className={`cells-lab__pane cells-lab__pane--preview ${activeInspectorTab === 'preview' ? 'is-visible' : 'is-hidden'}`}>
              {previewHtml ? (
                variant === 'component' && previewDemo ? (
                  <CellsPreviewWorkbench
                    html={previewHtml}
                    demo={previewDemo}
                    iframeRef={iframeRef}
                    title="Vista previa del componente Cells"
                  />
                ) : (
                  <iframe
                    ref={iframeRef}
                    title="Vista previa de la aplicación Cells"
                    sandbox="allow-scripts"
                    srcDoc={previewHtml}
                    onLoad={() => iframeRef.current?.contentWindow?.postMessage({ source: 'open-cells-shell', type: 'locale:set', locale: previewLocale }, '*')}
                  />
                )
              ) : (
                <div className="cells-lab__empty">
                  <Play size={28} />
                  <h4>Vista previa no construida</h4>
                  <p>Usa “Vista previa” o “Comprobar” para construir el proyecto dentro del Worker.</p>
                  <button type="button" className="cells-lab__empty-btn" onClick={buildPreview} disabled={status === 'running'}>
                    <Play size={14} /> Construir vista previa
                  </button>
                </div>
              )}
            </div>

            {/* IFRAME OCULTO PARA PRUEBAS CUANDO NO ESTÁ EN TAB PREVIEW */}
            {activeInspectorTab !== 'preview' && previewHtml && (
              <iframe
                ref={iframeRef}
                title="Iframe de pruebas Cells"
                sandbox="allow-scripts"
                srcDoc={previewHtml}
                className="cells-lab__hidden-iframe"
                onLoad={() => iframeRef.current?.contentWindow?.postMessage({ source: 'open-cells-shell', type: 'locale:set', locale: previewLocale }, '*')}
              />
            )}

            {/* PRUEBAS */}
            {activeInspectorTab === 'tests' && (
              <div className="cells-lab__pane cells-lab__pane--tests">
                {tests.length > 0 ? (
                  <>
                    <div className="cells-lab__tests-header">
                      <div className="cells-lab__tests-headline">
                        <strong>Resultado de contratos</strong>
                        <span className={`cells-lab__tests-badge ${allTestsPassed ? 'is-pass' : 'is-fail'}`}>
                          {passedTestsCount} de {tests.length} superados
                        </span>
                      </div>
                      {coverage && (
                        <div className="cells-lab__coverage-pills">
                          <span>S <b>{coverage.statements.percentage}%</b></span>
                          <span>R <b>{coverage.branches?.percentage ?? 0}%</b></span>
                          <span>F <b>{coverage.functions?.percentage ?? 0}%</b></span>
                          <span>L <b>{coverage.lines?.percentage ?? 0}%</b></span>
                        </div>
                      )}
                    </div>

                    <ul className="cells-lab__tests">
                      {tests.map((test) => (
                        <li key={test.id} data-passed={test.passed} className="cells-lab__test-item">
                          <div className="cells-lab__test-icon">
                            {test.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                          </div>
                          <div className="cells-lab__test-body">
                            <strong>{test.title}</strong>
                            <small>{test.message}</small>
                          </div>
                        </li>
                      ))}
                    </ul>

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
                  </>
                ) : (
                  <div className="cells-lab__empty">
                    <FlaskConical size={28} />
                    <h4>Sin comprobaciones ejecutadas</h4>
                    <p>Usa “Comprobar” para ejecutar los contratos del Worker y del navegador.</p>
                    <button type="button" className="cells-lab__empty-btn" onClick={runTests} disabled={status === 'running'}>
                      <FlaskConical size={14} /> Ejecutar comprobaciones
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TERMINAL */}
            {activeInspectorTab === 'terminal' && (
              <div className="cells-lab__pane cells-lab__pane--terminal">
                <form onSubmit={runCommand} className="cells-lab__terminal-form">
                  <label className="sr-only" htmlFor="cells-command">Comando Cells</label>
                  <div className="cells-lab__terminal-prompt">
                    <span>$</span>
                    <input
                      id="cells-command"
                      value={command}
                      onChange={(event) => setCommand(event.target.value)}
                      spellCheck={false}
                      placeholder="cells app:test --coverage"
                    />
                    <button type="submit" disabled={status === 'running'}>Ejecutar</button>
                  </div>
                </form>
                <div className="cells-lab__terminal-screen">
                  <output>{error || terminalOutput}</output>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
