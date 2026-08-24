import { describe, expect, it } from 'vitest';
import { compileLesson, file, workspaceOf } from './lessonCompiler';

describe('compileLesson instructor movement', () => {
  it('creates a visible, continuous route from explanation through code and preview', () => {
    const lesson = compileLesson({
      id: 'pointer-route',
      title: 'Ruta del instructor',
      description: 'Prueba de integración del movimiento.',
      initialWorkspace: workspaceOf('app.js', {
        'index.html': file('index.html', '<main></main>'),
        'app.js': file('app.js', ''),
      }),
      skillsIntroduced: ['seguir una demostración'],
      skillsRequired: [],
      learningObjectives: ['Observar el recorrido.'],
      commonMistakes: [],
      durationMs: 12_000,
      beats: [
        { at: 1_000, type: 'speak', text: 'Primero entendemos la idea.' },
        { at: 4_000, type: 'write', filePath: 'index.html', content: '<main>Listo</main>', mode: 'replace' },
        { at: 4_300, type: 'write', filePath: 'app.js', content: 'const listo = true;', mode: 'replace' },
        { at: 8_000, type: 'run' },
      ],
    });

    const pointers = lesson.events.filter((event) => event.type === 'pointer-move');
    expect(pointers.length).toBeGreaterThan(4);
    expect(pointers[0]).toMatchObject({ timestamp: 0 });
    expect(new Set(pointers.map((event) => event.targetArea))).toEqual(
      new Set(['files', 'editor', 'preview']),
    );
    expect(
      pointers.slice(1).every((event, index) => event.timestamp - pointers[index].timestamp <= 3_200),
    ).toBe(true);
    expect(
      pointers.slice(1).every((event, index) => {
        const previous = pointers[index];
        return previous.targetArea === event.targetArea || event.timestamp - previous.timestamp >= 1_600;
      }),
    ).toBe(true);
  });
});
