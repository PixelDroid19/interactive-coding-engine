import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearTutorWorkspace,
  getTutorWorkspace,
  publishTutorWorkspace,
} from './tutorContext';

describe('workspace compartido con el tutor', () => {
  beforeEach(() => clearTutorWorkspace('editor-test'));

  it('expone todos los archivos y delega escrituras al workspace real', () => {
    const replaceFile = vi.fn();
    const undoLastChange = vi.fn();

    publishTutorWorkspace({
      snapshot: {
        lessonId: 'javascript-05',
        activeFilePath: 'app.js',
        files: {
          'app.js': 'export function doble(valor) { return valor * 2; }',
          'index.html': '<main></main>',
        },
        diagnostics: 'Sin errores detectados',
      },
      actions: { replaceFile, undoLastChange },
    }, 'editor-test');

    const workspace = getTutorWorkspace();
    expect(workspace?.snapshot.files['index.html']).toBe('<main></main>');

    workspace?.actions.replaceFile('app.js', 'export const doble = (valor) => valor * 2;');
    workspace?.actions.undoLastChange();

    expect(replaceFile).toHaveBeenCalledWith('app.js', 'export const doble = (valor) => valor * 2;');
    expect(undoLastChange).toHaveBeenCalledTimes(1);
  });

  it('solo permite limpiar la instancia que publicó el contexto', () => {
    publishTutorWorkspace({
      snapshot: { activeFilePath: 'app.js', files: { 'app.js': '' } },
      actions: { replaceFile: vi.fn(), undoLastChange: vi.fn() },
    }, 'editor-test');

    clearTutorWorkspace('otro-editor');
    expect(getTutorWorkspace()).not.toBeNull();
    clearTutorWorkspace('editor-test');
    expect(getTutorWorkspace()).toBeNull();
  });
});
