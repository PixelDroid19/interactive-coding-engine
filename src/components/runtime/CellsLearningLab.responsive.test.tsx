// @vitest-environment happy-dom
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CellsLearningLab } from './CellsLearningLab';

vi.mock('../../engine/cells/cellsRuntimeClient', () => ({
  CellsRuntimeClientError: class CellsRuntimeClientError extends Error {},
  CellsRuntimeClient: class CellsRuntimeClient {
    async loadProject(snapshot: unknown, generation: number) {
      return { type: 'workspace:updated', generation, payload: { workspace: snapshot } };
    }
    dispose() {}
  },
}));

vi.mock('../../engine/cells/cellsWorkspaceRepository', () => ({
  CellsWorkspaceRepository: class CellsWorkspaceRepository {
    async load() { return { status: 'missing' }; }
    async loadSession() { return null; }
    async save() {}
    async saveSession() {}
    async remove() {}
    async removeSession() {}
    async close() {}
  },
}));

vi.mock('../editor/CodeEditor', () => ({
  CodeEditor: () => <div data-testid="cells-code-editor">Editor</div>,
}));

vi.mock('../editor/WorkspaceTree', () => ({
  WorkspaceTree: () => <div data-testid="cells-workspace-tree">Archivos</div>,
}));

describe('CellsLearningLab responsive', () => {
  beforeEach(() => localStorage.clear());

  it('permite alternar entre archivos, editor y resultados desde el navegador móvil', async () => {
    render(<CellsLearningLab componentStage="styles" />);

    const workbench = await screen.findByTestId('cells-workbench');
    expect(workbench.getAttribute('data-mobile-panel')).toBe('editor');

    fireEvent.click(screen.getByRole('tab', { name: 'Archivos' }));
    expect(workbench.getAttribute('data-mobile-panel')).toBe('files');

    fireEvent.click(screen.getByRole('tab', { name: 'Resultados' }));
    expect(workbench.getAttribute('data-mobile-panel')).toBe('results');
    expect(screen.getByRole('tab', { name: 'Resultados' }).getAttribute('aria-selected')).toBe('true');
  });
});
