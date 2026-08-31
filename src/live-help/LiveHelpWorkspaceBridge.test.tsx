// @vitest-environment happy-dom
import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../themes/ThemeProvider';
import type { WorkspaceSnapshot } from '../types/scrim';
import type { LiveHelpWorkspaceAdapter } from './LiveHelpProvider';
import { LiveHelpWorkspaceBridge } from './LiveHelpWorkspaceBridge';

const liveHelp = vi.hoisted(() => ({
  registrations: [] as unknown[],
  registerWorkspace: vi.fn(),
  unregister: vi.fn(),
}));

vi.mock('./LiveHelpProvider', () => ({
  useOptionalLiveHelp: () => ({
    canUseLiveHelp: true,
    session: null,
    openPanel: vi.fn(),
    registerWorkspace: liveHelp.registerWorkspace,
  }),
}));

function workspace(content: string): WorkspaceSnapshot {
  return {
    activeFilePath: 'app.js',
    files: {
      'app.js': { name: 'app.js', path: 'app.js', content, language: 'javascript' },
    },
  };
}

beforeEach(() => {
  liveHelp.registrations.length = 0;
  liveHelp.unregister.mockReset();
  liveHelp.registerWorkspace.mockReset().mockImplementation((adapter: LiveHelpWorkspaceAdapter) => {
    liveHelp.registrations.push(adapter);
    return liveHelp.unregister;
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('puente de espacio de trabajo para ayuda en vivo', () => {
  it('vuelve a registrar el mismo adaptador y reinicia la revisión al cambiar de actividad sin desmontarse', async () => {
    const onWorkspaceChange = vi.fn();
    const contextA = { courseSlug: 'fundamentos', lessonKey: 'fundamentos-01', surface: 'lesson' as const };
    const contextB = { courseSlug: 'fundamentos', lessonKey: 'fundamentos-02', surface: 'lesson' as const };
    const view = render(
      <ThemeProvider><LiveHelpWorkspaceBridge context={contextA} workspace={workspace('const actividad = "A";')} onWorkspaceChange={onWorkspaceChange} /></ThemeProvider>,
    );

    await waitFor(() => expect(liveHelp.registerWorkspace).toHaveBeenCalledTimes(1));
    const adapter = liveHelp.registrations[0] as LiveHelpWorkspaceAdapter;
    expect(adapter.captureSnapshot()).toMatchObject({ revision: 0, files: [{ path: 'app.js', content: 'const actividad = "A";' }] });

    view.rerender(
      <ThemeProvider><LiveHelpWorkspaceBridge context={contextA} workspace={workspace('const actividad = "A2";')} onWorkspaceChange={onWorkspaceChange} /></ThemeProvider>,
    );
    await waitFor(() => expect(adapter.captureSnapshot().revision).toBe(1));

    view.rerender(
      <ThemeProvider><LiveHelpWorkspaceBridge context={contextB} workspace={workspace('const actividad = "B";')} onWorkspaceChange={onWorkspaceChange} /></ThemeProvider>,
    );

    await waitFor(() => expect(liveHelp.registerWorkspace).toHaveBeenCalledTimes(2));
    expect(liveHelp.unregister).toHaveBeenCalledTimes(1);
    expect(liveHelp.registrations[1]).toBe(adapter);
    expect(adapter.getContext()).toEqual(contextB);
    expect(adapter.captureSnapshot()).toMatchObject({ revision: 0, files: [{ path: 'app.js', content: 'const actividad = "B";' }] });
  });
});
