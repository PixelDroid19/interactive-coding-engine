// @vitest-environment happy-dom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LiveHelpContext } from '../../live-help/protocol';
import type { WorkspaceSnapshot } from '../../types/scrim';
import { CellsLearningLab } from './CellsLearningLab';

const runtime = vi.hoisted(() => {
  const builds: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];
  return { builds, failLoad: false };
});

const repository = vi.hoisted(() => ({
  loadResult: { status: 'missing' } as unknown,
  sessionResult: null as unknown,
  recoveryInfo: { exportable: true, restorable: false },
  save: vi.fn(),
  saveSession: vi.fn(),
  remove: vi.fn(),
  removeSession: vi.fn(),
  inspectRecovery: vi.fn(),
  exportRecovery: vi.fn(),
  restoreRecovery: vi.fn(),
  discardRecovery: vi.fn(),
}));

const liveHelpBridge = vi.hoisted(() => ({
  props: null as null | {
    context: LiveHelpContext;
    workspace: WorkspaceSnapshot;
    onWorkspaceChange(next: WorkspaceSnapshot): void;
    proposalGuard?(): string | null;
    validateProposal?(next: WorkspaceSnapshot): string | null;
  },
}));

vi.mock('../../live-help/LiveHelpWorkspaceBridge', () => ({
  LiveHelpWorkspaceBridge: (props: NonNullable<typeof liveHelpBridge.props>) => {
    liveHelpBridge.props = props;
    return <div data-testid="cells-live-help-bridge" />;
  },
}));

vi.mock('../../engine/cells/cellsRuntimeClient', () => ({
  CellsRuntimeClientError: class CellsRuntimeClientError extends Error {},
  CellsRuntimeClient: class CellsRuntimeClient {
    async loadProject(snapshot: unknown, generation: number) {
      if (runtime.failLoad) throw new Error('No se pudo preparar el proyecto.');
      return { type: 'workspace:updated', generation, payload: { workspace: snapshot } };
    }
    async writeFile(path: string, content: string, generation: number) {
      return {
        type: 'workspace:updated',
        generation,
        payload: {
          workspace: {
            files: { [path]: { path, name: path.split('/').at(-1), language: 'javascript', content } },
            activeFilePath: path,
          },
        },
      };
    }
    buildPreview() {
      return new Promise((resolve, reject) => runtime.builds.push({ resolve, reject }));
    }
    dispose() {}
  },
}));

vi.mock('../../engine/cells/cellsWorkspaceRepository', () => ({
  CellsWorkspaceRepository: class CellsWorkspaceRepository {
    async load() { return repository.loadResult; }
    async loadSession() { return repository.sessionResult; }
    async save(key: string, workspace: unknown) { return repository.save(key, workspace); }
    async saveSession(key: string, session: unknown) { return repository.saveSession(key, session); }
    async remove() { repository.remove(); }
    async removeSession() { repository.removeSession(); }
    async inspectRecovery() { return repository.inspectRecovery(); }
    async exportRecovery(recovery: unknown) { return repository.exportRecovery(recovery); }
    async restoreRecovery(recovery: unknown) { return repository.restoreRecovery(recovery); }
    async discardRecovery(recovery: unknown) { return repository.discardRecovery(recovery); }
    async close() {}
  },
}));

vi.mock('../editor/CodeEditor', () => ({
  CodeEditor: ({ onCodeChange }: { onCodeChange: (content: string) => void }) => (
    <button type="button" onClick={() => onCodeChange('// edición más reciente')}>Editar componente</button>
  ),
}));

vi.mock('../editor/WorkspaceTree', () => ({
  WorkspaceTree: () => <div>Árbol</div>,
}));

vi.mock('./CellsPreviewWorkbench', () => ({
  CellsPreviewWorkbench: ({ html }: { html: string }) => <output data-testid="compiled-preview">{html}</output>,
}));

describe('CellsLearningLab live preview', () => {
  beforeEach(() => {
    runtime.builds.length = 0;
    runtime.failLoad = false;
    repository.loadResult = { status: 'missing' };
    repository.sessionResult = null;
    repository.recoveryInfo = { exportable: true, restorable: false };
    repository.save.mockClear();
    repository.saveSession.mockClear();
    repository.remove.mockClear();
    repository.removeSession.mockClear();
    repository.inspectRecovery.mockResolvedValue(repository.recoveryInfo);
    repository.exportRecovery.mockResolvedValue({ fileName: 'cells-recovery.json', content: '{"workspace":{"generation":-1}}' });
    repository.restoreRecovery.mockReset();
    repository.discardRecovery.mockResolvedValue(undefined);
    liveHelpBridge.props = null;
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:cells-recovery');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('descarta una compilación anterior si termina después de la edición actual', async () => {
    render(<CellsLearningLab lessonId="cells-race" componentStage="composition" />);

    await waitFor(() => expect(runtime.builds).toHaveLength(1));
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Editar componente' }));
    expect(screen.getByText('Cambios pendientes de recompilar')).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(runtime.builds).toHaveLength(2);

    await act(async () => {
      runtime.builds[1].resolve({
        type: 'preview:built',
        payload: { html: 'PREVIEW NUEVA', warnings: [], componentDemo: { cases: [] } },
      });
    });
    expect(screen.getByTestId('compiled-preview').textContent).toBe('PREVIEW NUEVA');

    await act(async () => {
      runtime.builds[0].resolve({
        type: 'preview:built',
        payload: { html: 'PREVIEW ANTIGUA', warnings: [], componentDemo: { cases: [] } },
      });
    });
    expect(screen.getByTestId('compiled-preview').textContent).toBe('PREVIEW NUEVA');
    expect(screen.getByText('Vista sincronizada con el proyecto')).toBeTruthy();
  });

  it('invalida resultados y coverage guardados cuando cambia el código', async () => {
    repository.sessionResult = {
      version: 1,
      activePanel: 'tests',
      expandedFolders: [],
      command: 'cells component:test --coverage',
      previewLocale: 'es',
      tests: [{ id: 'saved-pass', title: 'Contrato guardado', passed: true, message: 'Superado antes de editar.' }],
      coverage: {
        statements: { covered: 1, total: 1, percentage: 100 },
        behaviors: { covered: 1, total: 1, percentage: 100 },
      },
      terminalOutput: '1 de 1 contratos superados.',
      savedAt: Date.now(),
    };

    render(<CellsLearningLab lessonId="cells-stale-tests" componentStage="composition" />);

    await waitFor(() => expect(runtime.builds).toHaveLength(1));
    expect(await screen.findByText('Contrato guardado')).toBeTruthy();
    expect(screen.getByText('S')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Editar componente' }));

    expect(screen.getByText('Sin comprobaciones ejecutadas')).toBeTruthy();
    expect(screen.queryByText('Contrato guardado')).toBeNull();
    expect(screen.queryByText('100%')).toBeNull();
  });

  it('reconstruye la vista previa al reiniciar sin exigir otro clic', async () => {
    render(<CellsLearningLab lessonId="cells-reset" componentStage="composition" />);

    await waitFor(() => expect(runtime.builds).toHaveLength(1));
    await act(async () => {
      runtime.builds[0].resolve({
        type: 'preview:built',
        payload: { html: 'PREVIEW INICIAL', warnings: [], componentDemo: { cases: [] } },
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar práctica' }));
    await waitFor(() => expect(runtime.builds).toHaveLength(2));
  });

  it('expone un workspace Cells persistente y bloquea propuestas mientras aún no está sincronizado', async () => {
    const context: LiveHelpContext = {
      courseSlug: 'open-cells',
      lessonKey: 'open-cells-18',
      surface: 'lesson',
    };
    render(<CellsLearningLab lessonId="open-cells-18" componentStage="composition" liveHelpContext={context} />);

    await waitFor(() => expect(runtime.builds).toHaveLength(1));
    expect(liveHelpBridge.props?.proposalGuard?.()).toContain('preparando');
    await act(async () => {
      runtime.builds[0].resolve({
        type: 'preview:built',
        payload: { html: 'PREVIEW INICIAL', warnings: [], componentDemo: { cases: [] } },
      });
    });
    await waitFor(() => expect(liveHelpBridge.props?.proposalGuard?.()).toBeNull());
    expect(liveHelpBridge.props?.context).toEqual(context);

    const current = liveHelpBridge.props!.workspace;
    const activePath = current.activeFilePath;
    const next: WorkspaceSnapshot = {
      ...current,
      files: {
        ...current.files,
        [activePath]: {
          ...current.files[activePath],
          content: 'export const cambioDelFormador = true;',
        },
      },
    };
    act(() => liveHelpBridge.props!.onWorkspaceChange(next));

    await waitFor(() => expect(repository.save).toHaveBeenCalledWith(
      'course-open-cells:v2:component:open-cells-18',
      expect.objectContaining({
        snapshot: expect.objectContaining({
          files: expect.objectContaining({
            [activePath]: expect.objectContaining({ content: 'export const cambioDelFormador = true;' }),
          }),
        }),
      }),
    ));
    expect(liveHelpBridge.props?.workspace.files[activePath].content).toBe('export const cambioDelFormador = true;');
    expect(liveHelpBridge.props?.proposalGuard?.()).toContain('sincronizando');
  });

  it('rechaza una propuesta con colisión archivo/carpeta antes de entregarla al runtime Cells', async () => {
    const context: LiveHelpContext = {
      courseSlug: 'open-cells',
      lessonKey: 'open-cells-19',
      surface: 'lesson',
    };
    render(<CellsLearningLab lessonId="open-cells-19" componentStage="composition" liveHelpContext={context} />);

    await waitFor(() => expect(runtime.builds).toHaveLength(1));
    await act(async () => {
      runtime.builds[0].resolve({
        type: 'preview:built',
        payload: { html: 'PREVIEW INICIAL', warnings: [], componentDemo: { cases: [] } },
      });
    });
    const current = liveHelpBridge.props!.workspace;
    expect(current.files['package.json']).toBeTruthy();
    const colliding: WorkspaceSnapshot = {
      ...current,
      files: {
        ...current.files,
        'package.json/nuevo.js': { path: 'package.json/nuevo.js', name: 'nuevo.js', language: 'javascript', content: '' },
      },
    };

    expect(liveHelpBridge.props?.validateProposal?.(colliding)).toContain('estructura de archivos');
  });

  it('mantiene bloqueada la propuesta durante la compilación automática aunque ya vació los archivos pendientes', async () => {
    const context: LiveHelpContext = {
      courseSlug: 'open-cells',
      lessonKey: 'open-cells-20',
      surface: 'lesson',
    };
    render(<CellsLearningLab lessonId="open-cells-20" componentStage="composition" liveHelpContext={context} />);

    await waitFor(() => expect(runtime.builds).toHaveLength(1));
    await act(async () => {
      runtime.builds[0].resolve({
        type: 'preview:built',
        payload: { html: 'PREVIEW INICIAL', warnings: [], componentDemo: { cases: [] } },
      });
    });
    await waitFor(() => expect(liveHelpBridge.props?.proposalGuard?.()).toBeNull());

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Editar componente' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(runtime.builds).toHaveLength(2);
    expect(liveHelpBridge.props?.proposalGuard?.()).toContain('ejecutando');

    await act(async () => {
      runtime.builds[1].resolve({
        type: 'preview:built',
        payload: { html: 'PREVIEW SINCRONIZADA', warnings: [], componentDemo: { cases: [] } },
      });
    });
    expect(liveHelpBridge.props?.proposalGuard?.()).toBeNull();
  });

  it('mantiene bloqueadas las propuestas si la sincronización automática termina en error', async () => {
    const context: LiveHelpContext = {
      courseSlug: 'open-cells',
      lessonKey: 'open-cells-21',
      surface: 'lesson',
    };
    render(<CellsLearningLab lessonId="open-cells-21" componentStage="composition" liveHelpContext={context} />);

    await waitFor(() => expect(runtime.builds).toHaveLength(1));
    await act(async () => {
      runtime.builds[0].resolve({
        type: 'preview:built',
        payload: { html: 'PREVIEW INICIAL', warnings: [], componentDemo: { cases: [] } },
      });
    });
    await waitFor(() => expect(liveHelpBridge.props?.proposalGuard?.()).toBeNull());

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Editar componente' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(runtime.builds).toHaveLength(2);

    await act(async () => {
      runtime.builds[1].reject(new Error('package.json inválido'));
    });

    expect(liveHelpBridge.props?.proposalGuard?.()).toContain('necesita atención');
    expect(screen.getByRole('alert').textContent).toContain('package.json inválido');
  });

  it('explica el estado de error en lugar de mostrar el mensaje de éxito', async () => {
    runtime.failLoad = true;
    render(<CellsLearningLab lessonId="cells-load-error" componentStage="composition" />);

    expect(await screen.findByText('El laboratorio necesita atención')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('No se pudo preparar el proyecto.');
    expect(screen.queryByText('Todo ocurre en este navegador')).toBeNull();
  });

  it('abre una plantilla sin borrar el borrador corrupto y permite descargar la copia preservada', async () => {
    repository.loadResult = {
      status: 'corrupt',
      recovery: {
        sourceKey: 'course-open-cells:v2:component:cells-corrupt',
        recoveryKey: 'recovery:workspace:cells-corrupt:1',
        preserved: true,
        message: 'La generación del workspace no es válida.',
      },
    };

    render(<CellsLearningLab lessonId="cells-corrupt" componentStage="composition" />);

    expect((await screen.findByRole('alert')).textContent).toContain('No se reemplazó por el proyecto inicial');
    expect(screen.queryByText('Árbol')).toBeNull();
    expect(repository.remove).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Restaurar copia válida' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Descargar copia preservada' }));
    await waitFor(() => expect(repository.exportRecovery).toHaveBeenCalledOnce());
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
    expect(repository.remove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Abrir plantilla sin borrar el borrador' }));
    await waitFor(() => expect(runtime.builds).toHaveLength(1));
    await act(async () => {
      runtime.builds[0].resolve({
        type: 'preview:built',
        payload: { html: 'PLANTILLA SEGURA', warnings: [], componentDemo: { cases: [] } },
      });
    });
    expect(await screen.findByText('Árbol')).toBeTruthy();
    expect(repository.remove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Editar componente' }));
    await waitFor(() => expect(repository.save).toHaveBeenCalledOnce());
    expect(repository.save).toHaveBeenCalledWith(
      'course-open-cells:v2:component:cells-corrupt:starter',
      expect.anything(),
    );
    expect(repository.save).not.toHaveBeenCalledWith(
      'course-open-cells:v2:component:cells-corrupt',
      expect.anything(),
    );
  });

  it('solicita una confirmación clara antes de descartar el borrador y su cuarentena', async () => {
    repository.loadResult = {
      status: 'corrupt',
      recovery: {
        sourceKey: 'course-open-cells:v2:component:cells-discard',
        recoveryKey: 'recovery:workspace:cells-discard:1',
        preserved: true,
        message: 'La generación del workspace no es válida.',
      },
    };

    render(<CellsLearningLab lessonId="cells-discard" componentStage="composition" />);

    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Descartar borrador y copia preservada' }));
    expect(screen.getByRole('alertdialog').textContent).toContain('no se puede deshacer');
    expect(repository.discardRecovery).not.toHaveBeenCalled();
    expect(repository.removeSession).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar definitivamente' }));
    await waitFor(() => expect(repository.discardRecovery).toHaveBeenCalledOnce());
    expect(repository.removeSession).not.toHaveBeenCalled();
    expect(repository.remove).not.toHaveBeenCalled();
  });

  it('solo ofrece restaurar cuando la copia pasó la inspección y la carga sin borrarla', async () => {
    repository.loadResult = {
      status: 'corrupt',
      recovery: {
        sourceKey: 'course-open-cells:v2:component:cells-restore',
        recoveryKey: 'recovery:workspace:cells-restore:1',
        preserved: true,
        message: 'Copia preservada.',
      },
    };
    repository.recoveryInfo = { exportable: true, restorable: true };
    repository.inspectRecovery.mockResolvedValue(repository.recoveryInfo);
    repository.restoreRecovery.mockResolvedValue({
      generation: 7,
      snapshot: {
        files: {
          'src/academy-action-button.js': {
            path: 'src/academy-action-button.js',
            name: 'academy-action-button.js',
            language: 'javascript',
            content: 'export const recovered = true;',
          },
        },
        activeFilePath: 'src/academy-action-button.js',
      },
    });

    render(<CellsLearningLab lessonId="cells-restore" componentStage="composition" />);

    expect(await screen.findByRole('button', { name: 'Restaurar copia válida' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar copia válida' }));
    await waitFor(() => expect(repository.restoreRecovery).toHaveBeenCalledOnce());
    await waitFor(() => expect(runtime.builds).toHaveLength(1));
    await act(async () => {
      runtime.builds[0].resolve({
        type: 'preview:built',
        payload: { html: 'COPIA RESTAURADA', warnings: [], componentDemo: { cases: [] } },
      });
    });
    expect(await screen.findByText('Árbol')).toBeTruthy();
    expect(repository.remove).not.toHaveBeenCalled();
  });
});
