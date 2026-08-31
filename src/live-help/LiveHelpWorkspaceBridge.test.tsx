// @vitest-environment happy-dom
import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../themes/ThemeProvider';
import type { WorkspaceSnapshot } from '../types/scrim';
import type { LiveHelpWorkspaceAdapter } from './LiveHelpProvider';
import { serializeClientFrame, type LiveHelpProposalEvent, type LiveHelpWorkspaceFile } from './protocol';
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

function workspaceWithFiles(count: number): WorkspaceSnapshot {
  const files = Object.fromEntries(Array.from({ length: count }, (_, index) => {
    const path = `src/archivo-${index}.js`;
    return [path, { name: `archivo-${index}.js`, path, content: `export const valor${index} = ${index};`, language: 'javascript' as const }];
  }));
  return { activeFilePath: 'src/archivo-0.js', files };
}

function proposal(baseRevision: number, files: readonly LiveHelpWorkspaceFile[], proposalId = '30000000-0000-4000-8000-000000000001'): LiveHelpProposalEvent {
  return {
    seq: 1,
    type: 'patch-proposal',
    proposalId,
    actorRole: 'tutor',
    createdAt: '2026-08-30T12:00:00.000Z',
    payload: { summary: 'Actualizar el proyecto', patch: { baseRevision, files } },
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
  it('rechaza una propuesta anterior después de remontar la misma actividad con un borrador distinto', async () => {
    const onWorkspaceChange = vi.fn();
    const context = { courseSlug: 'open-cells', lessonKey: 'open-cells-18', surface: 'lesson' as const };
    const firstView = render(
      <ThemeProvider><LiveHelpWorkspaceBridge context={context} workspace={workspace('export const version = 1;')} onWorkspaceChange={onWorkspaceChange} /></ThemeProvider>,
    );
    await waitFor(() => expect(liveHelp.registerWorkspace).toHaveBeenCalledTimes(1));
    const firstAdapter = liveHelp.registrations[0] as LiveHelpWorkspaceAdapter;
    const staleRevision = firstAdapter.captureSnapshot().revision;
    firstView.unmount();

    render(
      <ThemeProvider><LiveHelpWorkspaceBridge context={context} workspace={workspace('export const version = 2;')} onWorkspaceChange={onWorkspaceChange} /></ThemeProvider>,
    );
    await waitFor(() => expect(liveHelp.registerWorkspace).toHaveBeenCalledTimes(2));
    const remountedAdapter = liveHelp.registrations[1] as LiveHelpWorkspaceAdapter;
    const event = proposal(staleRevision, [{ path: 'app.js', content: 'export const version = 3;' }], '30000000-0000-4000-8000-000000000002');

    expect(remountedAdapter.applyProposal(event)).toEqual({ outcome: 'conflict' });
    expect(onWorkspaceChange).not.toHaveBeenCalled();
  });

  it('no crea una revisión falsa cuando el runtime entrega una copia semánticamente idéntica', async () => {
    const onWorkspaceChange = vi.fn();
    const context = { courseSlug: 'open-cells', lessonKey: 'open-cells-18', surface: 'lesson' as const };
    const initial = workspace('export const valor = 1;');
    const view = render(
      <ThemeProvider><LiveHelpWorkspaceBridge context={context} workspace={initial} onWorkspaceChange={onWorkspaceChange} /></ThemeProvider>,
    );

    await waitFor(() => expect(liveHelp.registerWorkspace).toHaveBeenCalledTimes(1));
    const adapter = liveHelp.registrations[0] as LiveHelpWorkspaceAdapter;
    const firstRevision = adapter.captureSnapshot().revision;
    view.rerender(
      <ThemeProvider><LiveHelpWorkspaceBridge context={context} workspace={workspace('export const valor = 1;')} onWorkspaceChange={onWorkspaceChange} /></ThemeProvider>,
    );

    expect(adapter.captureSnapshot().revision).toBe(firstRevision);
  });

  it('bloquea una propuesta con el guard actual sin pausar, mutar ni incrementar la revisión', async () => {
    const onWorkspaceChange = vi.fn();
    const pause = vi.fn();
    const context = { courseSlug: 'fundamentos', lessonKey: 'fundamentos-01', surface: 'lesson' as const };
    const currentWorkspace = workspace('console.log("actual")');
    const view = render(
      <ThemeProvider><LiveHelpWorkspaceBridge context={context} workspace={currentWorkspace} onWorkspaceChange={onWorkspaceChange} pause={pause} proposalGuard={() => null} /></ThemeProvider>,
    );

    await waitFor(() => expect(liveHelp.registerWorkspace).toHaveBeenCalledTimes(1));
    const adapter = liveHelp.registrations[0] as LiveHelpWorkspaceAdapter;
    const initialRevision = adapter.captureSnapshot().revision;
    const event = proposal(initialRevision, [{ path: 'app.js', content: 'console.log("nuevo")' }]);
    view.rerender(
      <ThemeProvider><LiveHelpWorkspaceBridge context={context} workspace={currentWorkspace} onWorkspaceChange={onWorkspaceChange} pause={pause} proposalGuard={() => 'El entorno está ocupado.'} /></ThemeProvider>,
    );

    expect(adapter.applyProposal(event)).toEqual({ outcome: 'blocked', message: 'El entorno está ocupado.' });
    expect(pause).not.toHaveBeenCalled();
    expect(onWorkspaceChange).not.toHaveBeenCalled();
    expect(adapter.captureSnapshot().revision).toBe(initialRevision);
  });

  it('no pausa ni confirma una propuesta que no cambia el workspace', async () => {
    const onWorkspaceChange = vi.fn();
    const pause = vi.fn();
    const context = { courseSlug: 'fundamentos', lessonKey: 'fundamentos-01', surface: 'lesson' as const };
    render(
      <ThemeProvider><LiveHelpWorkspaceBridge context={context} workspace={workspace('const igual = true;')} onWorkspaceChange={onWorkspaceChange} pause={pause} /></ThemeProvider>,
    );

    await waitFor(() => expect(liveHelp.registerWorkspace).toHaveBeenCalledTimes(1));
    const adapter = liveHelp.registrations[0] as LiveHelpWorkspaceAdapter;
    const initialRevision = adapter.captureSnapshot().revision;

    expect(adapter.applyProposal(proposal(initialRevision, [{ path: 'app.js', content: 'const igual = true;' }]))).toEqual({
      outcome: 'blocked', message: 'La propuesta no cambia el código actual.',
    });
    expect(pause).not.toHaveBeenCalled();
    expect(onWorkspaceChange).not.toHaveBeenCalled();
    expect(adapter.captureSnapshot().revision).toBe(initialRevision);
  });

  it('rechaza antes de mutar una propuesta que dejaría un snapshot Cells no compartible', async () => {
    const onWorkspaceChange = vi.fn();
    const pause = vi.fn();
    const context = { courseSlug: 'open-cells', lessonKey: 'playground:cells-application', surface: 'editor' as const };
    render(
      <ThemeProvider><LiveHelpWorkspaceBridge context={context} workspace={workspaceWithFiles(35)} onWorkspaceChange={onWorkspaceChange} pause={pause} /></ThemeProvider>,
    );

    await waitFor(() => expect(liveHelp.registerWorkspace).toHaveBeenCalledTimes(1));
    const adapter = liveHelp.registrations[0] as LiveHelpWorkspaceAdapter;
    const snapshot = adapter.captureSnapshot();
    const additions = Array.from({ length: 6 }, (_, index) => ({ path: `src/nuevo-${index}.js`, content: '' }));

    expect(adapter.applyProposal(proposal(snapshot.revision, additions))).toEqual({
      outcome: 'blocked', message: 'La propuesta dejaría un proyecto demasiado grande para compartir de forma segura.',
    });
    expect(onWorkspaceChange).not.toHaveBeenCalled();
    expect(pause).not.toHaveBeenCalled();
    expect(() => serializeClientFrame({ type: 'snapshot', ...adapter.captureSnapshot() })).not.toThrow();
  });

  it('ejecuta la validación del runtime antes de pausar o cambiar el workspace', async () => {
    const onWorkspaceChange = vi.fn();
    const pause = vi.fn();
    const validateProposal = vi.fn(() => 'La propuesta crea una colisión entre un archivo y una carpeta de Cells.');
    const context = { courseSlug: 'open-cells', lessonKey: 'open-cells-18', surface: 'lesson' as const };
    const current: WorkspaceSnapshot = {
      activeFilePath: 'package.json',
      files: {
        'package.json': { path: 'package.json', name: 'package.json', language: 'json', content: '{}' },
      },
    };
    render(
      <ThemeProvider><LiveHelpWorkspaceBridge context={context} workspace={current} onWorkspaceChange={onWorkspaceChange} pause={pause} validateProposal={validateProposal} /></ThemeProvider>,
    );

    await waitFor(() => expect(liveHelp.registerWorkspace).toHaveBeenCalledTimes(1));
    const adapter = liveHelp.registrations[0] as LiveHelpWorkspaceAdapter;
    const before = adapter.captureSnapshot();

    expect(adapter.applyProposal(proposal(before.revision, [{ path: 'package.json/nuevo.js', content: '' }]))).toEqual({
      outcome: 'blocked', message: 'La propuesta crea una colisión entre un archivo y una carpeta de Cells.',
    });
    expect(validateProposal).toHaveBeenCalledOnce();
    expect(pause).not.toHaveBeenCalled();
    expect(onWorkspaceChange).not.toHaveBeenCalled();
    expect(adapter.captureSnapshot()).toEqual(before);
  });

  it('restaura el snapshot privado y bloquea la decisión si el consumidor rechaza el commit', async () => {
    const pause = vi.fn();
    const context = { courseSlug: 'fundamentos', lessonKey: 'fundamentos-01', surface: 'lesson' as const };
    render(
      <ThemeProvider><LiveHelpWorkspaceBridge context={context} workspace={workspace('const antes = true;')} onWorkspaceChange={() => { throw new Error('commit falló'); }} pause={pause} /></ThemeProvider>,
    );

    await waitFor(() => expect(liveHelp.registerWorkspace).toHaveBeenCalledTimes(1));
    const adapter = liveHelp.registrations[0] as LiveHelpWorkspaceAdapter;
    const before = adapter.captureSnapshot();

    expect(adapter.applyProposal(proposal(before.revision, [{ path: 'app.js', content: 'const después = true;' }]))).toEqual({
      outcome: 'blocked', message: 'No pudimos aplicar la propuesta al editor. El código se conserva sin cambios.',
    });
    expect(pause).not.toHaveBeenCalled();
    expect(adapter.captureSnapshot()).toEqual(before);
  });

  it('vuelve a registrar el mismo adaptador con la revisión propia de la actividad nueva', async () => {
    const onWorkspaceChange = vi.fn();
    const contextA = { courseSlug: 'fundamentos', lessonKey: 'fundamentos-01', surface: 'lesson' as const };
    const contextB = { courseSlug: 'fundamentos', lessonKey: 'fundamentos-02', surface: 'lesson' as const };
    const view = render(
      <ThemeProvider><LiveHelpWorkspaceBridge context={contextA} workspace={workspace('const actividad = "A";')} onWorkspaceChange={onWorkspaceChange} /></ThemeProvider>,
    );

    await waitFor(() => expect(liveHelp.registerWorkspace).toHaveBeenCalledTimes(1));
    const adapter = liveHelp.registrations[0] as LiveHelpWorkspaceAdapter;
    const revisionA = adapter.captureSnapshot().revision;
    expect(adapter.captureSnapshot()).toMatchObject({ revision: revisionA, files: [{ path: 'app.js', content: 'const actividad = "A";' }] });

    view.rerender(
      <ThemeProvider><LiveHelpWorkspaceBridge context={contextA} workspace={workspace('const actividad = "A2";')} onWorkspaceChange={onWorkspaceChange} /></ThemeProvider>,
    );
    await waitFor(() => expect(adapter.captureSnapshot().revision).not.toBe(revisionA));

    view.rerender(
      <ThemeProvider><LiveHelpWorkspaceBridge context={contextB} workspace={workspace('const actividad = "B";')} onWorkspaceChange={onWorkspaceChange} /></ThemeProvider>,
    );

    await waitFor(() => expect(liveHelp.registerWorkspace).toHaveBeenCalledTimes(2));
    expect(liveHelp.unregister).toHaveBeenCalledTimes(1);
    expect(liveHelp.registrations[1]).toBe(adapter);
    expect(adapter.getContext()).toEqual(contextB);
    expect(adapter.captureSnapshot()).toMatchObject({ files: [{ path: 'app.js', content: 'const actividad = "B";' }] });
    expect(adapter.captureSnapshot().revision).not.toBe(revisionA);
  });
});
