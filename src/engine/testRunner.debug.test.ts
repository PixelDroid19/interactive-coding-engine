import { describe, it, expect } from 'vitest';
import { runChallengeValidation } from './testRunner';
import { file, workspaceOf } from './lessonCompiler';
import { DEBUG_EXERCISES } from '../curriculum/fundamentos/debugExercises';

function wsFromJs(js: string) {
  return workspaceOf('app.js', {
    'index.html': file('index.html', '<!DOCTYPE html><html><body><p id="linea1"></p><p id="linea2"></p></body></html>'),
    'style.css': file('style.css', '*{}'),
    'app.js': file('app.js', js),
  });
}

function run(exerciseJs: string) {
  const exercise = DEBUG_EXERCISES.find(e => e.id === 'fundamentos-01-debug')!;
  return runChallengeValidation(
    {
      id: exercise.id,
      title: exercise.title,
      timestamp: 0,
      instructions: exercise.description,
      tests: exercise.tests as any,
      hints: [],
    },
    wsFromJs(exerciseJs),
    null
  );
}

describe('fundamentos-01-debug (busca-y-escribe)', () => {
  it('el starter roto falla: linea2 vacía y falta el recuadro correcto', async () => {
    const starter = DEBUG_EXERCISES.find(e => e.id === 'fundamentos-01-debug')!.initialWorkspace;
    const result = await runChallengeValidation(
      {
        id: 'fundamentos-01-debug',
        title: 't',
        timestamp: 0,
        instructions: '',
        tests: DEBUG_EXERCISES.find(e => e.id === 'fundamentos-01-debug')!.tests as any,
        hints: [],
      },
      starter,
      null
    );
    expect(result.allPassed).toBe(false);
    expect(result.passedCount).toBeLessThan(3);
  });

  it('la corrección canónica pasa: segunda línea apunta a linea2', async () => {
    const result = await run(
      `document.getElementById("linea1").textContent = "Me llamo Ana";
document.getElementById("linea2").textContent = "Y me gusta el helado";`
    );
    expect(result.allPassed).toBe(true);
    expect(result.passedCount).toBe(3);
  });

  it('una corrección alternativa razonable también pasa (orden de líneas invertido)', async () => {
    const result = await run(
      `document.getElementById("linea2").textContent = "Y me gusta el helado";
document.getElementById("linea1").textContent = "Me llamo Ana";`
    );
    expect(result.allPassed).toBe(true);
  });

  it('escribir ambos textos en linea1 sigue fallando', async () => {
    const result = await run(
      `document.getElementById("linea1").textContent = "Me llamo Ana";
document.getElementById("linea1").textContent = "Y me gusta el helado";`
    );
    expect(result.allPassed).toBe(false);
    const linea2 = result.tests.find(t => t.id === 'linea2-con-helado');
    expect(linea2?.passed).toBe(false);
  });

  it('borrar una instrucción falla', async () => {
    const result = await run(
      `document.getElementById("linea1").textContent = "Me llamo Ana";`
    );
    expect(result.allPassed).toBe(false);
  });

  it('error de sintaxis produce evaluation-error con mensaje claro', async () => {
    // Código válido: sin errores de evaluación
    const ok = await run(
      `document.getElementById("linea1").textContent = "Me llamo Ana";
document.getElementById("linea2").textContent = "Y me gusta el helado";`
    );
    expect(ok.tests.every(t => !t.isEvaluationError)).toBe(true);
    // Código con error de sintaxis: no se presenta como respuesta incorrecta
    const broken = await run(`document.getElementById("linea1".textContent = ;`);
    expect(broken.tests.some(t => t.isEvaluationError)).toBe(true);
    expect(broken.feedbackMessage).toContain('No pudimos evaluar');
  });
});

describe('contrato genérico string-contains-all', () => {
  it('caseInsensitive, normalizeSpaces e ignorePunctuation funcionan juntos', async () => {
    const ws = wsFromJs(`document.getElementById("linea1").textContent = "  ¡Hola   MUNDO!  ";`);
    const result = await runChallengeValidation(
      {
        id: 'test',
        title: 't',
        timestamp: 0,
        instructions: '',
        tests: [
          {
            id: 't1',
            description: 'contiene hola y mundo',
            validatorType: 'dom-check' as const,
            domSelector: '#linea1',
            domProperty: 'innerText' as const,
            expectedContains: ['hola', 'mundo'],
            matcher: 'contains-all' as const,
            caseInsensitive: true,
            normalizeSpaces: true,
            ignorePunctuation: true,
          } as any,
        ],
        hints: [],
      },
      ws,
      null
    );
    expect(result.allPassed).toBe(true);
  });
});
