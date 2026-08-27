// @vitest-environment happy-dom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CellsLearningLab } from './CellsLearningLab';

const runtime = vi.hoisted(() => {
  const builds: Array<{ resolve: (value: unknown) => void }> = [];
  return { builds, failLoad: false };
});

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
    async load() { return null; }
    async loadSession() { return null; }
    async save() {}
    async saveSession() {}
    async remove() {}
    async removeSession() {}
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
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
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
    expect(screen.queryByText('Todo ocurre en este navegador')).toBeNull();
  });
});
