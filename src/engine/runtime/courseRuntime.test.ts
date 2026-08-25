import { describe, expect, it } from 'vitest';
import { selectPracticeVariant, type LanguageVariants } from './courseRuntime';

const variants: LanguageVariants = {
  javascript: {
    workspace: {
      activeFilePath: 'app.js',
      files: {
        'app.js': { name: 'app.js', path: 'app.js', language: 'javascript', content: 'console.log(2 + 3);' },
      },
    },
    tests: [],
  },
  python: {
    workspace: {
      activeFilePath: 'main.py',
      files: {
        'main.py': { name: 'main.py', path: 'main.py', language: 'python', content: 'print(2 + 3)' },
      },
    },
    tests: [],
  },
};

describe('runtime de cursos por lenguaje', () => {
  it('selecciona una variante completa por lenguaje', () => {
    expect(selectPracticeVariant(variants, 'python').workspace.activeFilePath).toBe('main.py');
    expect(selectPracticeVariant(variants, 'javascript').workspace.activeFilePath).toBe('app.js');
  });

  it('devuelve copias para que un borrador no modifique la definición del curso', () => {
    const selected = selectPracticeVariant(variants, 'python');
    selected.workspace.files['main.py'].content = 'print("cambio")';

    expect(variants.python.workspace.files['main.py'].content).toBe('print(2 + 3)');
  });
});
