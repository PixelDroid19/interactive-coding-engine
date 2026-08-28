import { describe, expect, it, vi } from 'vitest';
import type { LocalGenerationResult } from '../../engine/ai/localGenerationProtocol';
import type { LocalGenerationService } from '../../engine/ai/localGenerationService';
import type { TutorWorkspaceContext } from './tutorContext';
import { runTutorTurn } from './tutorAgent';

const activity = {
  courseId: 'course-javascript',
  courseTitle: 'JavaScript',
  itemId: 'javascript-05',
  itemTitle: 'Funciones como contratos',
  itemType: 'scrim' as const,
  description: 'Separa entrada, cálculo y retorno.',
  mentalModel: 'Una función recibe datos y devuelve un resultado.',
  skillsIntroduced: ['functions', 'return-values'],
  commonMistakes: ['Confundir imprimir con devolver.'],
};

function result(text: string): LocalGenerationResult {
  return { text, model: 'local', engine: 'WebLLM', device: 'webgpu', elapsedMs: 1 };
}

function service(...responses: string[]): LocalGenerationService {
  return { generate: vi.fn(async () => result(responses.shift() ?? 'Respuesta final.')) } as unknown as LocalGenerationService;
}

function workspace(): TutorWorkspaceContext {
  return {
    snapshot: {
      lessonId: activity.itemId,
      activeFilePath: 'app.js',
      files: {
        'app.js': 'function doble(valor) { console.log(valor * 2); }',
        'index.html': '<main></main>',
      },
      diagnostics: 'Sin errores de sintaxis',
      recentResult: '0 de 2 comprobaciones superadas',
    },
    actions: {
      replaceFile: vi.fn(),
      undoLastChange: vi.fn(),
      runChecks: vi.fn(async () => '1 de 2 comprobaciones superadas'),
    },
  };
}

describe('agente pedagógico local', () => {
  it('deja que el modelo consulte la lección y el workspace antes de explicar', async () => {
    const local = service(
      JSON.stringify({ calls: [{ tool: 'read_lesson', args: {} }, { tool: 'read_workspace', args: { paths: ['app.js'] } }], replyStrategy: 'Explica la diferencia entre imprimir y devolver.' }),
      'Tu función calcula el doble, pero lo imprime. ¿Qué debería recibir quien llama a doble?',
    );

    const turn = await runTutorTurn({ mode: 'auto', question: '¿Por qué no recibo el resultado?', attemptCount: 1, activity, conversation: [] }, local, workspace());

    expect(turn.activities.map((entry) => entry.tool)).toEqual(['read_lesson', 'read_workspace']);
    expect(turn.response).toMatch(/función calcula/i);
  });

  it('permite modificar un archivo existente cuando la petición autoriza la escritura', async () => {
    const current = workspace();
    const replacement = 'function doble(valor) { return valor * 2; }';
    const local = service(
      JSON.stringify({ calls: [{ tool: 'write_file', args: { path: 'app.js' } }, { tool: 'run_checks', args: {} }], replyStrategy: 'Explica el cambio y la prueba.' }),
      replacement,
      'Cambié app.js y ejecuté las comprobaciones. Revisa por qué return entrega el dato.',
    );

    const turn = await runTutorTurn({ mode: 'auto', question: 'Corrige el ejercicio y comprueba el resultado.', attemptCount: 2, activity, conversation: [] }, local, current);

    expect(current.actions.replaceFile).toHaveBeenCalledWith('app.js', replacement);
    expect(current.actions.runChecks).toHaveBeenCalledTimes(1);
    expect(turn.changedFiles).toEqual(['app.js']);
  });

  it('pide al modelo reparar el plan cuando una orden explícita de edición no incluyó escritura', async () => {
    const current = workspace();
    const replacement = 'function doble(valor) { return valor * 2; }';
    const local = service(
      JSON.stringify({ calls: [{ tool: 'read_workspace', args: { paths: ['app.js'] } }], replyStrategy: 'Explica el archivo.' }),
      JSON.stringify({ calls: [{ tool: 'write_file', args: { path: 'app.js' } }, { tool: 'run_checks', args: {} }], replyStrategy: 'Explica la corrección aplicada.' }),
      replacement,
      'Corregí app.js y ejecuté las comprobaciones.',
    );

    const turn = await runTutorTurn({ mode: 'auto', question: 'Corrige el ejercicio y déjalo funcionando.', attemptCount: 1, activity, conversation: [] }, local, current);

    expect(current.actions.replaceFile).toHaveBeenCalledWith('app.js', replacement);
    expect(turn.changedFiles).toEqual(['app.js']);
    expect(local.generate).toHaveBeenCalledTimes(4);
  });

  it('rechaza una escritura elegida por el modelo cuando la persona solo pidió explicación', async () => {
    const current = workspace();
    const local = service(
      JSON.stringify({ calls: [{ tool: 'write_file', args: { path: 'app.js', content: 'return 8;' } }], replyStrategy: 'Explica.' }),
      'No modifiqué el ejercicio. Primero revisemos la diferencia entre mostrar y devolver.',
    );

    const turn = await runTutorTurn({ mode: 'explain', question: 'Explícame por qué falla.', attemptCount: 1, activity, conversation: [] }, local, current);

    expect(current.actions.replaceFile).not.toHaveBeenCalled();
    expect(turn.activities[0]).toMatchObject({ tool: 'write_file', status: 'denied' });
  });

  it('acepta un concepto de refuerzo solo después de errores reiterados', async () => {
    const local = service(
      JSON.stringify({ calls: [{ tool: 'save_reinforcement', args: { skillId: 'return-values', note: 'Distingue console.log de return.', evidence: 'Tres intentos sin devolver el valor.' } }], replyStrategy: 'Da feedback.' }),
      'Vamos a reforzar la diferencia entre mostrar y devolver.',
    );

    const turn = await runTutorTurn({ mode: 'review', question: 'Dame feedback.', attemptCount: 3, activity, conversation: [] }, local, workspace());
    expect(turn.reinforcement).toMatchObject({ skillId: 'return-values' });
  });

  it('falla de forma explícita cuando el modelo no produce un plan válido', async () => {
    await expect(runTutorTurn(
      { mode: 'auto', question: 'Ayúdame.', attemptCount: 0, activity, conversation: [] },
      service('esto no es JSON', 'tampoco es JSON'),
      workspace(),
    )).rejects.toThrow(/no pudo reparar el plan/i);
  });

  it('repara una salida mal formada antes de ejecutar herramientas y no escribe durante la reparación', async () => {
    const current = workspace();
    const local = service(
      'Voy a ayudarte. {calls: [}',
      JSON.stringify({ calls: [{ tool: 'read_workspace', args: { paths: ['app.js'] } }], replyStrategy: 'Explica con la evidencia.' }),
      'La función imprime el valor en lugar de devolverlo.',
    );

    const turn = await runTutorTurn({ mode: 'auto', question: '¿Por qué falla?', attemptCount: 1, activity, conversation: [] }, local, current);

    expect(turn.activities.map((entry) => entry.tool)).toEqual(['read_workspace']);
    expect(current.actions.replaceFile).not.toHaveBeenCalled();
    expect(local.generate).toHaveBeenCalledTimes(3);
  });

  it('acepta un plan JSON cercado y genera el archivo fuera del JSON de herramientas', async () => {
    const current = workspace();
    const replacement = 'function doble(valor) {\n  return valor * 2;\n}';
    const local = service(
      `Plan:\n\`\`\`json\n${JSON.stringify({ calls: [{ tool: 'write_file', args: { path: 'app.js' } }], replyStrategy: 'Explica el cambio.' })}\n\`\`\``,
      `\`\`\`js\n${replacement}\n\`\`\``,
      'Corregí la función para que devuelva el resultado.',
    );

    const turn = await runTutorTurn({ mode: 'collaborate', question: 'Corrige la función.', attemptCount: 1, activity, conversation: [] }, local, current);

    expect(current.actions.replaceFile).toHaveBeenCalledWith('app.js', replacement);
    expect(turn.changedFiles).toEqual(['app.js']);
  });

  it('limita la recuperación a un intento si el modelo insiste en devolver un plan inválido', async () => {
    const current = workspace();
    const local = service('sin JSON', 'todavía sin JSON', 'no debería consumirse');

    await expect(runTutorTurn(
      { mode: 'collaborate', question: 'Corrige app.js.', attemptCount: 1, activity, conversation: [] },
      local,
      current,
    )).rejects.toThrow(/no pudo reparar el plan/i);
    expect(local.generate).toHaveBeenCalledTimes(2);
    expect(current.actions.replaceFile).not.toHaveBeenCalled();
  });
});
