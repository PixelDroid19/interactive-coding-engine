import { describe, expect, it, vi } from 'vitest';
import type { WorkspaceSnapshot } from '../types/scrim';
import { applyLiveHelpPatch, applyPatchProposal } from './workspace';

const workspace: WorkspaceSnapshot = {
  activeFilePath: 'app.js',
  files: {
    'app.js': { path: 'app.js', name: 'app.js', language: 'javascript', content: 'console.log("antes")' },
  },
};

const patch = {
  baseRevision: 3,
  files: [{ path: 'app.js', content: 'console.log("después")' }],
};

describe('propuestas de ayuda en vivo', () => {
  it('rechaza una propuesta de otra revisión sin pausar ni mutar el código actual', () => {
    const commit = vi.fn();
    const pause = vi.fn();

    const result = applyPatchProposal({ workspace, revision: 4, patch, commit, pause });

    expect(result).toEqual({ outcome: 'conflict' });
    expect(commit).not.toHaveBeenCalled();
    expect(pause).not.toHaveBeenCalled();
  });

  it('aplica una propuesta aceptada de forma explícita y pausa la lección antes de escribir', () => {
    const commit = vi.fn();
    const pause = vi.fn();

    const result = applyPatchProposal({ workspace, revision: 3, patch, commit, pause });

    expect(result).toEqual({ outcome: 'applied', revision: 4 });
    expect(pause).toHaveBeenCalledOnce();
    expect(commit).toHaveBeenCalledWith(expect.objectContaining({
      files: expect.objectContaining({
        'app.js': expect.objectContaining({ content: 'console.log("después")' }),
      }),
    }));
  });

  it('no permite contaminar el prototipo aunque un consumidor invoque el aplicador fuera del parser', () => {
    expect(() => applyLiveHelpPatch(workspace, {
      baseRevision: 3,
      files: [{ path: '__proto__', content: '{"contaminated":true}' }],
    })).toThrow('Ruta de archivo');
    expect(({} as { contaminated?: boolean }).contaminated).toBeUndefined();
  });
});
