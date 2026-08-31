import { describe, expect, it, vi } from 'vitest';
import type { WorkspaceSnapshot } from '../types/scrim';
import { applyLiveHelpPatch, applyPatchProposal, liveHelpWorkspaceRevision } from './workspace';

const workspace: WorkspaceSnapshot = {
  activeFilePath: 'app.js',
  files: {
    'app.js': { path: 'app.js', name: 'app.js', language: 'javascript', content: 'console.log("antes")' },
  },
};

const revision = liveHelpWorkspaceRevision(workspace);
const patch = {
  baseRevision: revision,
  files: [{ path: 'app.js', content: 'console.log("después")' }],
};

describe('propuestas de ayuda en vivo', () => {
  it('rechaza una propuesta de otra revisión sin pausar ni mutar el código actual', () => {
    const commit = vi.fn();
    const pause = vi.fn();

    const result = applyPatchProposal({ workspace, revision: revision + 1, patch, commit, pause });

    expect(result).toEqual({ outcome: 'conflict' });
    expect(commit).not.toHaveBeenCalled();
    expect(pause).not.toHaveBeenCalled();
  });

  it('aplica una propuesta aceptada de forma explícita y pausa la lección', () => {
    const commit = vi.fn();
    const pause = vi.fn();

    const result = applyPatchProposal({ workspace, revision, patch, commit, pause });

    const committed = commit.mock.calls[0]?.[0] as WorkspaceSnapshot;
    expect(result).toEqual({ outcome: 'applied', revision: liveHelpWorkspaceRevision(committed) });
    expect(pause).toHaveBeenCalledOnce();
    expect(commit).toHaveBeenCalledWith(expect.objectContaining({
      files: expect.objectContaining({
        'app.js': expect.objectContaining({ content: 'console.log("después")' }),
      }),
    }));
  });

  it('rechaza una propuesta sin cambios sin pausar, guardar ni alterar la revisión', () => {
    const commit = vi.fn();
    const pause = vi.fn();

    const result = applyPatchProposal({
      workspace,
      revision,
      patch: { baseRevision: revision, files: [{ path: 'app.js', content: workspace.files['app.js'].content }] },
      commit,
      pause,
    });

    expect(result).toEqual({ outcome: 'blocked', message: 'La propuesta no cambia el código actual.' });
    expect(commit).not.toHaveBeenCalled();
    expect(pause).not.toHaveBeenCalled();
    expect(liveHelpWorkspaceRevision(workspace)).toBe(revision);
  });

  it('calcula la misma revisión para el mismo contenido y otra al cambiar código o archivo activo', () => {
    const semanticCopy: WorkspaceSnapshot = {
      ...workspace,
      files: { 'app.js': { ...workspace.files['app.js'] } },
    };
    const changed = applyLiveHelpPatch(workspace, {
      baseRevision: revision,
      files: [{ path: 'otro.js', content: 'export const otro = true;' }],
      activeFile: 'otro.js',
    });

    expect(liveHelpWorkspaceRevision(semanticCopy)).toBe(revision);
    expect(liveHelpWorkspaceRevision(changed)).not.toBe(revision);
  });

  it('no permite contaminar el prototipo aunque un consumidor invoque el aplicador fuera del parser', () => {
    expect(() => applyLiveHelpPatch(workspace, {
      baseRevision: revision,
      files: [{ path: '__proto__', content: '{"contaminated":true}' }],
    })).toThrow('Ruta de archivo');
    expect(({} as { contaminated?: boolean }).contaminated).toBeUndefined();
  });
});
