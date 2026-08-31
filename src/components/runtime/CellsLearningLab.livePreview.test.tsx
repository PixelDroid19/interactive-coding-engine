// @vitest-environment happy-dom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CellsLearningLab } from './CellsLearningLab';

const runtime = vi.hoisted(() => {
  const builds: Array<{ resolve: (value: unknown) => void }> = [];
  return { builds, failLoad: false };
});

const repository = vi.hoisted(() => ({
  loadResult: { status: 'missing' } as unknown,
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
      return new Promise((resolve) => runtime.builds.push({ resolve }));
    }
    dispose() {}
  },
}));

vi.mock('../../engine/cells/cellsWorkspaceRepository', () => ({
  CellsWorkspaceRepository: class CellsWorkspaceRepository {
    async load() { return repository.loadResult; }
    async loadSession() { return null; }
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
    repository.recoveryInfo = { exportable: true, restorable: false };
    repository.save.mockClear();
    repository.saveSession.mockClear();
    repository.remove.mockClear();
    repository.removeSession.mockClear();
    repository.inspectRecovery.mockResolvedValue(repository.recoveryInfo);
    repository.exportRecovery.mockResolvedValue({ fileName: 'cells-recovery.json', content: '{"workspace":{"generation":-1}}' });
    repository.restoreRecovery.mockReset();
    repository.discardRecovery.mockResolvedValue(undefined);
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
