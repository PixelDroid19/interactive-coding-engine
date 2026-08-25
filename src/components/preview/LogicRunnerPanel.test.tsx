// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CourseRuntime } from '../../engine/runtime/courseRuntime';
import type { WorkspaceSnapshot } from '../../types/scrim';
import { LogicRunnerPanel } from './LogicRunnerPanel';

const pythonWorkspace: WorkspaceSnapshot = {
  activeFilePath: 'main.py',
  files: {
    'main.py': { name: 'main.py', path: 'main.py', language: 'python', content: 'print("hola")' },
  },
};

describe('LogicRunnerPanel', () => {
  afterEach(cleanup);

  it('ejecuta Python con el runtime aislado y muestra print', async () => {
    const run = vi.fn(async () => ({
      success: true,
      consoleLogs: [{ id: '1', type: 'log' as const, args: ['hola'], timestamp: 1, sourceLine: 1 }],
      executionTimeMs: 9,
    }));
    const runtime: CourseRuntime = { run, dispose: vi.fn() };

    render(
      <LogicRunnerPanel
        workspace={pythonWorkspace}
        language="python"
        runtimeFactory={() => runtime}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ejecutar Python' }));

    await waitFor(() => expect(screen.getByText('hola')).toBeTruthy());
    expect(run).toHaveBeenCalledWith(pythonWorkspace, { packages: [] });
  });
});
