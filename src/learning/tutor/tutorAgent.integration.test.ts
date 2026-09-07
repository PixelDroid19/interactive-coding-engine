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
  it('reformula una explicación cortada una sola vez sin publicar el fragmento ni repetir herramientas', async () => {
    const local = service();
    const current = workspace();
    const onChunk = vi.fn();
    vi.mocked(local.generate)
      .mockResolvedValueOnce(result(JSON.stringify({ calls: [{ tool: 'read_workspace', args: {} }], replyStrategy: 'Explica.' })))
      .mockImplementationOnce(async (_request, options) => {
        options?.onChunk?.('La función devuelve porque');
        return { ...result('La función devuelve porque'), finishReason: 'length' };
      })
      .mockResolvedValueOnce({ ...result('La función imprime el cálculo, pero no lo devuelve. ¿Qué recibe quien la llama?'), finishReason: 'stop' });
    const turn = await runTutorTurn({ mode: 'explain', question: 'Explica mi función.', attemptCount: 1, activity,
      conversation: [], generationOptions: { onChunk } }, local, current);
    expect(turn.response).toBe('La función imprime el cálculo, pero no lo devuelve. ¿Qué recibe quien la llama?');
    expect(turn.activities.filter(entry => entry.tool === 'read_workspace')).toHaveLength(1);
    expect(local.generate).toHaveBeenCalledTimes(3);
    expect(onChunk.mock.calls.flat().join('')).not.toContain('devuelve porque');
    expect(onChunk.mock.calls.flat().join('')).toBe(turn.response);
    expect(current.actions.replaceFile).not.toHaveBeenCalled();
  });

  it('no acepta como explicación dos respuestas consecutivas cortadas', async () => {
    const local = service();
    vi.mocked(local.generate)
      .mockResolvedValueOnce(result(JSON.stringify({ calls: [], replyStrategy: 'Explica.' })))
      .mockResolvedValue({ ...result('La función devuelve porque'), finishReason: 'length' });
    await expect(runTutorTurn({ mode: 'explain', question: 'Explica mi función.', attemptCount: 1, activity,
      conversation: [] }, local, workspace())).rejects.toThrow(/completa/);
    expect(local.generate).toHaveBeenCalledTimes(3);
  });

  it('no reformula una respuesta cortada cuando el alumno ya canceló la ayuda', async () => {
    const local = service();
    const controller = new AbortController();
    vi.mocked(local.generate)
      .mockResolvedValueOnce(result(JSON.stringify({ calls: [], replyStrategy: 'Explica.' })))
      .mockImplementationOnce(async () => {
        controller.abort();
        return { ...result('La función devuelve porque'), finishReason: 'length' };
      });
    await expect(runTutorTurn({ mode: 'explain', question: 'Explica mi función.', attemptCount: 1, activity,
      conversation: [], generationOptions: { signal: controller.signal } }, local, workspace())).rejects.toMatchObject({ name: 'AbortError' });
    expect(local.generate).toHaveBeenCalledTimes(2);
  });

  it('repara la copia exacta de una pregunta del alumno en vez de presentarla como pista', async () => {
    const question = 'Veo que total cambia varias veces aunque no cambio subtotal. ¿Qué debería observar primero para encontrar la causa? No escribas la solución.';
    const echoed = '¿Qué debería observar primero para encontrar la causa?';
    const useful = '¿Qué propiedad cambia dentro de updated y qué provoca ese cambio en el siguiente ciclo?';
    const local = service(JSON.stringify({ question: echoed }), JSON.stringify({ question: useful }));
    const current = workspace();
    const before = structuredClone(current.snapshot);
    const turn = await runTutorTurn({ mode: 'hint', question, attemptCount: 1, activity, conversation: [] }, local, current);
    expect(turn.response).toBe(useful);
    expect(local.generate).toHaveBeenCalledTimes(2);
    expect(turn.changedFiles).toEqual([]);
    expect(current.snapshot).toEqual(before);
    expect(current.actions.replaceFile).not.toHaveBeenCalled();
    expect(current.actions.runChecks).not.toHaveBeenCalled();
  });

  it('rechaza la pista si ambos borradores solo repiten la pregunta del alumno', async () => {
    const question = '¿Qué debería observar primero para encontrar la causa?';
    const local = service(JSON.stringify({ question }), JSON.stringify({ question }));
    await expect(runTutorTurn({ mode: 'hint', question, attemptCount: 1, activity, conversation: [] }, local, workspace()))
      .rejects.toThrow(/pista fiable/);
    expect(local.generate).toHaveBeenCalledTimes(2);
  });

  it('consulta el módulo enlazado y conserva los fallos observados sin duplicar el HTML ni ejecutar código', async () => {
    const current = workspace();
    current.snapshot = {
      activeFilePath: 'index.html',
      files: {
        'index.html': '<script type="module" src="./app.js"></script><alerta-app></alerta-app>' + '<!-- relleno -->'.repeat(500),
        'app.js': 'customElements.define("alertas-app", AlertaApp);',
      },
      recentResult: '0 de 2 comprobaciones: falta la etiqueta pública.',
    };
    const before = structuredClone(current.snapshot);
    const local = service(JSON.stringify({ question: '¿Quién registra la etiqueta <alerta-app> y qué salida debe haber para confirmar que se registró?' }));
    const turn = await runTutorTurn({ mode: 'hint', question: 'Dame una pista sobre el registro.', attemptCount: 1, activity, conversation: [] }, local, current);
    const prompt = vi.mocked(local.generate).mock.calls[0][0].messages.at(-1)!.content;
    expect(prompt).toContain('customElements.define("alertas-app", AlertaApp);');
    expect(prompt).toContain('0 de 2 comprobaciones: falta la etiqueta pública.');
    expect(prompt.match(/<alerta-app>/g)).toHaveLength(1);
    expect(turn.activities).toContainEqual(expect.objectContaining({ tool: 'read_workspace', status: 'completed', detail: '2 archivos' }));
    expect(current.snapshot).toEqual(before);
    expect(current.actions.runChecks).not.toHaveBeenCalled();
    expect(current.actions.replaceFile).not.toHaveBeenCalled();
    expect(turn.changedFiles).toEqual([]);
  });

  it('repara una pista que entrega código sin transmitir el borrador rechazado', async () => {
    const drafts = [
      JSON.stringify({ question: '¿Ya añadiste `return valor * 2;`?' }),
      JSON.stringify({ question: '¿Mostrar un valor en la consola y devolverlo a quien llama a la función tienen el mismo efecto?' }),
    ];
    const onChunk = vi.fn();
    const local = { generate: vi.fn(async (_request, options) => {
      const text = drafts.shift()!;
      options?.onChunk?.(text);
      return result(text);
    }) } as unknown as LocalGenerationService;
    const current = workspace();
    const turn = await runTutorTurn({ mode: 'hint', question: 'Dame una pista.', attemptCount: 1, activity,
      conversation: [{ role: 'assistant', content: 'Llama a read_diagnostics().' }], generationOptions: { onChunk } }, local, current);
    expect(turn.response).toBe('¿Mostrar un valor en la consola y devolverlo a quien llama a la función tienen el mismo efecto?');
    expect(onChunk.mock.calls.flat().join('')).not.toContain('return valor');
    expect(local.generate).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(vi.mocked(local.generate).mock.calls[0][0].messages)).not.toContain('Llama a read_diagnostics()');
    expect(current.actions.replaceFile).not.toHaveBeenCalled();
    expect(current.actions.runChecks).not.toHaveBeenCalled();
  });

  it('rechaza una pista que sigue inventando herramientas tras un único intento de reparación', async () => {
    const bad = JSON.stringify({ question: '¿Has llamado a read_diagnostics para arreglar el archivo?' });
    const local = service(bad, bad);
    await expect(runTutorTurn({ mode: 'hint', question: 'Dame una pista.', attemptCount: 0, activity, conversation: [] }, local, workspace()))
      .rejects.toThrow(/pista.*no.*código/i);
    expect(local.generate).toHaveBeenCalledTimes(2);
  });

  it('no sobrescribe una edición hecha mientras el modelo generaba el archivo', async () => {
    const current = workspace();
    let live = current;
    const local = { generate: vi.fn()
      .mockResolvedValueOnce(result(JSON.stringify({ calls: [{ tool: 'write_file', args: { path: 'app.js' } }], replyStrategy: 'Corrige.' })))
      .mockImplementationOnce(async () => {
        live = { ...current, snapshot: { ...current.snapshot, files: { 'app.js': '// Mi intento nuevo' } } };
        return result('function doble(valor) { return valor * 2; }');
      }),
    } as unknown as LocalGenerationService;
    await expect(runTutorTurn({ mode: 'auto', question: 'Corrige el código', attemptCount: 1, activity, conversation: [], getCurrentWorkspace: () => live }, local, current)).rejects.toThrow(/editor cambió/i);
    expect(current.actions.replaceFile).not.toHaveBeenCalled();
    expect(live.snapshot.files['app.js']).toBe('// Mi intento nuevo');
  });
  it.each([
    'Explícame cómo corregir esto sin escribir la solución',
    'No escribas nada: dime cómo modificar la función',
    '¿Qué significa «crea una función» en este ejercicio?',
  ])('no transforma una pregunta en permiso de escritura: %s', async (question) => {
    const current = workspace();
    const original = current.snapshot.files['app.js'];
    const local = service(
      JSON.stringify({ calls: [{ tool: 'write_file', args: { path: 'app.js' } }], replyStrategy: 'Explica el contrato.' }),
      'La función muestra el dato. Sigue la llamada y observa lo que recibe.',
    );
    const turn = await runTutorTurn({ mode: 'auto', question, attemptCount: 1, activity, conversation: [] }, local, current);
    expect(current.snapshot.files['app.js']).toBe(original);
    expect(current.actions.replaceFile).not.toHaveBeenCalled();
    expect(turn.changedFiles).toEqual([]);
    expect(turn.activities[0]).toMatchObject({ tool: 'write_file', status: 'denied' });
    expect(local.generate).toHaveBeenCalledTimes(2);
  });

  it('cancelar durante la generación impide una escritura tardía aunque el proveedor ignore la señal', async () => {
    const current = workspace();
    const controller = new AbortController();
    const original = current.snapshot.files['app.js'];
    const local = { generate: vi.fn()
      .mockResolvedValueOnce(result(JSON.stringify({ calls: [{ tool: 'write_file', args: { path: 'app.js' } }], replyStrategy: 'Corrige.' })))
      .mockImplementationOnce(async () => { controller.abort(); return result('function doble(valor) { return valor * 2; }'); }),
    } as unknown as LocalGenerationService;
    await expect(runTutorTurn({ mode: 'auto', question: 'Corrige el código', attemptCount: 1, activity, conversation: [], generationOptions: { signal: controller.signal } }, local, current)).rejects.toMatchObject({ name: 'AbortError' });
    expect(current.snapshot.files['app.js']).toBe(original);
    expect(current.actions.replaceFile).not.toHaveBeenCalled();
  });
  it('deja que el modelo consulte la lección y el workspace antes de explicar', async () => {
    const local = service(
      JSON.stringify({ calls: [{ tool: 'read_lesson', args: {} }, { tool: 'read_workspace', args: { paths: ['app.js'] } }], replyStrategy: 'Explica la diferencia entre imprimir y devolver.' }),
      'Tu función calcula el doble, pero lo imprime. ¿Qué debería recibir quien llama a doble?',
    );

    const turn = await runTutorTurn({ mode: 'auto', question: '¿Por qué no recibo el resultado?', attemptCount: 1, activity, conversation: [] }, local, workspace());

    expect(turn.activities.map((entry) => entry.tool)).toEqual(['read_lesson', 'read_workspace']);
    expect(turn.response).toMatch(/función calcula/i);
  });

  it('entrega una sola copia de los archivos leídos y conserva el módulo relacionado', async () => {
    const current = workspace();
    current.snapshot.files['app.js'] = "import { doble } from './math.js';\nconsole.log(doble(4));";
    current.snapshot.files['math.js'] = 'export function doble(valor) { console.log(valor * 2); }';
    const local = service(
      JSON.stringify({ calls: [{ tool: 'read_workspace', args: { paths: ['app.js', 'math.js'] } }] }),
      'La función imprime el cálculo. ¿Qué valor recibe console.log en app.js?',
    );

    await runTutorTurn({ mode: 'explain', question: 'Explica por qué no puedo reutilizar el resultado.', attemptCount: 1, activity, conversation: [] }, local, current);

    const responsePrompt = vi.mocked(local.generate).mock.calls[1][0].messages.at(-1)?.content ?? '';
    expect(responsePrompt.match(/import \{ doble \}/g)).toHaveLength(1);
    expect(responsePrompt.match(/export function doble/g)).toHaveLength(1);
    expect(responsePrompt).toContain('Archivo real del estudiante: math.js');
    expect(responsePrompt).not.toContain('--- app.js');
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

  it('interpreta crea como una orden de edición aunque el primer plan solo consulte diagnósticos', async () => {
    const current = workspace();
    const fibonacci = 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}';
    const local = service(
      JSON.stringify({ calls: [{ tool: 'read_diagnostics', args: {} }], replyStrategy: 'Revisa primero el estado.' }),
      JSON.stringify({ calls: [{ tool: 'write_file', args: { path: 'app.js' } }], replyStrategy: 'Explica la edición aplicada.' }),
      fibonacci,
      'Añadí fibonacci a app.js.',
    );

    const turn = await runTutorTurn({ mode: 'auto', question: 'crea una funcion fibonnaci', attemptCount: 1, activity, conversation: [] }, local, current);

    expect(current.actions.replaceFile).toHaveBeenCalledWith('app.js', fibonacci);
    expect(turn.activities).toEqual(expect.arrayContaining([
      expect.objectContaining({ tool: 'read_diagnostics', status: 'completed' }),
      expect.objectContaining({ tool: 'write_file', status: 'completed' }),
    ]));
    expect(turn.changedFiles).toEqual(['app.js']);
  });

  it('aplica la edición solicitada si el segundo plan válido insiste en usar solo herramientas de lectura', async () => {
    const current = workspace();
    const fibonacci = 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}';
    const local = service(
      JSON.stringify({ calls: [{ tool: 'read_diagnostics', args: {} }], replyStrategy: 'Consulta el estado.' }),
      JSON.stringify({ calls: [{ tool: 'read_workspace', args: { paths: ['app.js'] } }], replyStrategy: 'Sigue revisando.' }),
      fibonacci,
      'Añadí fibonacci al archivo activo.',
    );

    const turn = await runTutorTurn({ mode: 'auto', question: 'crea una funcion fibonnaci en el editor', attemptCount: 1, activity, conversation: [] }, local, current);

    expect(current.actions.replaceFile).toHaveBeenCalledWith('app.js', fibonacci);
    expect(turn.changedFiles).toEqual(['app.js']);
  });

  it('rechaza una edición que ignora la función solicitada y la regenera antes de escribir', async () => {
    const current = workspace();
    const fibonacci = 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}';
    const local = service(
      JSON.stringify({ calls: [{ tool: 'write_file', args: { path: 'app.js' } }], replyStrategy: 'Explica la edición.' }),
      'console.log("Hola, este es mi primer programa");',
      fibonacci,
      'Añadí fibonacci al archivo activo.',
    );

    const turn = await runTutorTurn({ mode: 'auto', question: 'crea una función fibonacci en el editor', attemptCount: 1, activity, conversation: [] }, local, current);

    expect(current.actions.replaceFile).toHaveBeenCalledTimes(1);
    expect(current.actions.replaceFile).toHaveBeenCalledWith('app.js', fibonacci);
    expect(local.generate).toHaveBeenCalledTimes(4);
    expect(turn.changedFiles).toEqual(['app.js']);
  });

  it('sustituye una respuesta final degenerada por un resumen verificable de la acción', async () => {
    const current = workspace();
    const fibonacci = 'function fibonacci(n) { return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2); }';
    const local = service(
      JSON.stringify({ calls: [{ tool: 'write_file', args: { path: 'app.js' } }], replyStrategy: 'Resume el cambio.' }),
      fibonacci,
      '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!',
    );

    const turn = await runTutorTurn({ mode: 'auto', question: 'crea una función fibonacci en el editor', attemptCount: 1, activity, conversation: [] }, local, current);

    expect(turn.response).toContain('Actualicé app.js');
    expect(turn.response).not.toContain('!!!!!!!!!!');
  });

  it('confirma una edición ya aplicada aunque la explicación final falle por una salida degenerada', async () => {
    const current = workspace();
    const fibonacci = 'function fibonacci(n) { return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2); }';
    const outputs = [
      result(JSON.stringify({ calls: [{ tool: 'write_file', args: { path: 'app.js' } }], replyStrategy: 'Resume el cambio.' })),
      result(fibonacci),
    ];
    const local = {
      generate: vi.fn(async () => {
        const next = outputs.shift();
        if (next) return next;
        throw new Error('La inferencia local produjo una salida numéricamente inestable.');
      }),
    } as unknown as LocalGenerationService;

    const turn = await runTutorTurn({ mode: 'auto', question: 'crea una función fibonacci en el editor', attemptCount: 1, activity, conversation: [] }, local, current);

    expect(current.actions.replaceFile).toHaveBeenCalledWith('app.js', fibonacci);
    expect(turn.changedFiles).toEqual(['app.js']);
    expect(turn.response).toContain('Actualicé app.js');
  });

  it('reserva una escritura final aunque el primer plan haya consumido tres lecturas', async () => {
    const current = workspace();
    const replacement = 'function doble(valor) { return valor * 2; }';
    const local = service(
      JSON.stringify({ calls: [
        { tool: 'read_lesson', args: {} },
        { tool: 'read_workspace', args: { paths: ['app.js'] } },
        { tool: 'read_diagnostics', args: {} },
      ], replyStrategy: 'Revisa antes de editar.' }),
      JSON.stringify({ calls: [{ tool: 'write_file', args: { path: 'app.js' } }], replyStrategy: 'Explica la edición.' }),
      replacement,
      'Actualicé app.js.',
    );

    const turn = await runTutorTurn({ mode: 'auto', question: 'Crea una versión correcta en el editor.', attemptCount: 1, activity, conversation: [] }, local, current);

    expect(current.actions.replaceFile).toHaveBeenCalledWith('app.js', replacement);
    expect(turn.changedFiles).toEqual(['app.js']);
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

  it('repara un plan marcado como truncado aunque el JSON alcanzara a cerrar', async () => {
    const current = workspace();
    const local = service();
    vi.mocked(local.generate)
      .mockResolvedValueOnce({ ...result(JSON.stringify({ calls: [{ tool: 'run_checks', args: {} }], replyStrategy: 'Termina.' })), finishReason: 'length' })
      .mockResolvedValueOnce({ ...result(JSON.stringify({ calls: [{ tool: 'read_workspace', args: { paths: ['app.js'] } }], replyStrategy: 'Explica la evidencia.' })), finishReason: 'stop' })
      .mockResolvedValueOnce(result('La función imprime el resultado. ¿Qué recibe quien llama a doble?'));

    const turn = await runTutorTurn({ mode: 'explain', question: 'Explica mi función.', attemptCount: 1, activity, conversation: [] }, local, current);

    expect(turn.activities.map((entry) => entry.tool)).toEqual(['read_workspace']);
    expect(current.actions.runChecks).not.toHaveBeenCalled();
    expect(local.generate).toHaveBeenCalledTimes(3);
  });

  it('no escribe un archivo marcado como truncado aunque contenga el identificador pedido', async () => {
    const current = workspace();
    const local = service();
    vi.mocked(local.generate)
      .mockResolvedValueOnce(result(JSON.stringify({ calls: [{ tool: 'write_file', args: { path: 'app.js' } }], replyStrategy: 'Explica.' })))
      .mockResolvedValueOnce({ ...result('function fibonacci(n) { return n <= 1 ? n : fibonacci(n - 1)'), finishReason: 'length' });

    await expect(runTutorTurn({ mode: 'auto', question: 'Crea una función fibonacci en el editor.', attemptCount: 1, activity, conversation: [] }, local, current))
      .rejects.toThrow(/archivo.*cort/u);
    expect(current.actions.replaceFile).not.toHaveBeenCalled();
    expect(current.snapshot.files['app.js']).toContain('function doble');
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

  it('limita la reparación del plan a un intento antes de recuperar una edición explícita', async () => {
    const current = workspace();
    const replacement = 'function doble(valor) { return valor * 2; }';
    const local = service('sin JSON', 'todavía sin JSON', replacement, 'Actualicé el archivo activo.');

    const turn = await runTutorTurn(
      { mode: 'collaborate', question: 'Corrige app.js.', attemptCount: 1, activity, conversation: [] },
      local,
      current,
    );
    expect(local.generate).toHaveBeenCalledTimes(4);
    expect(current.actions.replaceFile).toHaveBeenCalledWith('app.js', replacement);
    expect(turn.changedFiles).toEqual(['app.js']);
  });

  it('recupera una edición explícita usando el archivo activo si el modelo pequeño no logra formar el plan', async () => {
    const current = workspace();
    const fibonacci = 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}';
    const local = service(
      'Voy a escribir la función en el editor.',
      'Claro, aquí está el código que necesitas.',
      `\`\`\`javascript\n${fibonacci}\n\`\`\``,
      'Añadí la función al archivo activo.',
    );

    const turn = await runTutorTurn({ mode: 'auto', question: 'crea una funcion fibonnaci en el editor', attemptCount: 1, activity, conversation: [] }, local, current);

    expect(current.actions.replaceFile).toHaveBeenCalledWith('app.js', fibonacci);
    expect(turn.changedFiles).toEqual(['app.js']);
  });
});
