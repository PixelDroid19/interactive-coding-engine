import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { runChallengeValidation } from '../../engine/testRunner';
import { evaluationValuesEqual } from '../../engine/evaluationEquality';
import { AI_ENGINEER_PROJECTS } from './projects';

const REFERENCE_JAVASCRIPT: Record<string, string> = {
  'ai-project-sampling': `function simular_sampling(entrada) { return [...entrada.probabilidades].sort((a, b) => b - a).slice(0, entrada.topK); }`,
  'ai-project-extractor-json': `function extraer_incidencia(entrada) { return { titulo: entrada.titulo ?? 'desconocido', prioridad: entrada.prioridad ?? 'desconocido', equipo: entrada.equipo ?? 'desconocido' }; }`,
  'ai-project-contexto': `function construir_contexto(entrada) { let usados = 0; const ids = []; for (const bloque of entrada.bloques.filter((item) => item.usuario === entrada.usuario).sort((a, b) => b.prioridad - a.prioridad)) { if (usados + bloque.tokens <= entrada.presupuesto) { usados += bloque.tokens; ids.push(bloque.id); } } return ids; }`,
  'ai-project-router': `function elegir_proveedor(entrada) { return entrada.online && !entrada.sensible && entrada.apiDisponible ? 'api' : 'local'; }`,
  'ai-project-busqueda-local': `function buscar_documentos(entrada) { return entrada.candidatos.filter((item) => item.categoria === entrada.categoria).sort((a, b) => b.score - a.score).slice(0, entrada.limite).map((item) => item.id); }`,
  'ai-project-rag-manuales': `function responder_con_fuentes(entrada) { return entrada.evidencias.filter((item) => item.score >= entrada.minimo).sort((a, b) => b.score - a.score).map((item) => item.id); }`,
  'ai-project-agente-soporte': `function siguiente_paso_soporte(entrada) { if (entrada.pasos >= entrada.maxPasos) return 'detener'; return entrada.intencion === 'modificar' ? 'confirmar' : 'leer'; }`,
  'ai-project-ataques': `function evaluar_ataque(entrada) { return entrada.permitidas.includes(entrada.accion); }`,
  'ai-project-tablero-evals': `function comparar_versiones(entrada) { if (entrada.fallosCriticos > 0) return 'bloquear'; if (entrada.latenciaP95 > entrada.presupuestoP95) return 'revisar'; return 'promover'; }`,
};

const REFERENCE_PYTHON: Record<string, string> = {
  'ai-project-sampling': `def simular_sampling(entrada):\n    return sorted(entrada['probabilidades'], reverse=True)[:entrada['topK']]`,
  'ai-project-extractor-json': `def extraer_incidencia(entrada):\n    return {'titulo': entrada.get('titulo', 'desconocido'), 'prioridad': entrada.get('prioridad', 'desconocido'), 'equipo': entrada.get('equipo', 'desconocido')}`,
  'ai-project-contexto': `def construir_contexto(entrada):\n    usados = 0\n    ids = []\n    bloques = sorted((b for b in entrada['bloques'] if b['usuario'] == entrada['usuario']), key=lambda b: b['prioridad'], reverse=True)\n    for bloque in bloques:\n        if usados + bloque['tokens'] <= entrada['presupuesto']:\n            usados += bloque['tokens']\n            ids.append(bloque['id'])\n    return ids`,
  'ai-project-router': `def elegir_proveedor(entrada):\n    return 'api' if entrada['online'] and not entrada['sensible'] and entrada['apiDisponible'] else 'local'`,
  'ai-project-busqueda-local': `def buscar_documentos(entrada):\n    candidatos = [item for item in entrada['candidatos'] if item['categoria'] == entrada['categoria']]\n    candidatos.sort(key=lambda item: item['score'], reverse=True)\n    return [item['id'] for item in candidatos[:entrada['limite']]]`,
  'ai-project-rag-manuales': `def responder_con_fuentes(entrada):\n    evidencias = [item for item in entrada['evidencias'] if item['score'] >= entrada['minimo']]\n    evidencias.sort(key=lambda item: item['score'], reverse=True)\n    return [item['id'] for item in evidencias]`,
  'ai-project-agente-soporte': `def siguiente_paso_soporte(entrada):\n    if entrada['pasos'] >= entrada['maxPasos']:\n        return 'detener'\n    return 'confirmar' if entrada['intencion'] == 'modificar' else 'leer'`,
  'ai-project-ataques': `def evaluar_ataque(entrada):\n    return entrada['accion'] in entrada['permitidas']`,
  'ai-project-tablero-evals': `def comparar_versiones(entrada):\n    if entrada['fallosCriticos'] > 0:\n        return 'bloquear'\n    if entrada['latenciaP95'] > entrada['presupuestoP95']:\n        return 'revisar'\n    return 'promover'`,
};

function executePython(source: string, functionName: string, args: unknown[][]) {
  const cases = JSON.stringify(args).replaceAll('\\', '\\\\').replaceAll("'", "\\'");
  const harness = `\nimport json as __json\n__values = [globals()['${functionName}'](*args) for args in __json.loads('${cases}')]\nprint(__json.dumps(__values, ensure_ascii=False))`;
  const result = spawnSync('python3', ['-c', `${source}${harness}`], { encoding: 'utf8', timeout: 4_000 });
  if (result.status !== 0) throw new Error(result.stderr.trim());
  return JSON.parse(result.stdout.trim().split('\n').at(-1) ?? '[]') as unknown[];
}

describe('proyectos de AI Engineer', () => {
  it('incluye nueve proyectos completos', () => {
    expect(AI_ENGINEER_PROJECTS).toHaveLength(9);
    expect(new Set(AI_ENGINEER_PROJECTS.map((item) => item.id)).size).toBe(9);
  });

  it('ofrece ambos lenguajes y criterios observables', () => {
    for (const project of AI_ENGINEER_PROJECTS) {
      expect(project.languageVariants?.javascript.workspace.activeFilePath).toBe('app.js');
      expect(project.languageVariants?.python.workspace.activeFilePath).toBe('main.py');
      expect(project.requirements.length).toBeGreaterThanOrEqual(5);
      expect(project.evaluationCases.length).toBeGreaterThanOrEqual(3);
      expect(project.securityChecklist.length).toBeGreaterThanOrEqual(3);
      expect(project.exportInstructions.length).toBeGreaterThanOrEqual(3);
      expect(project.suggestedSteps?.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('no entrega soluciones terminadas ni permite valores fijos', () => {
    for (const project of AI_ENGINEER_PROJECTS) {
      const javascript = project.languageVariants?.javascript.workspace.files['app.js']?.content ?? '';
      const python = project.languageVariants?.python.workspace.files['main.py']?.content ?? '';
      expect(javascript).toContain('TODO');
      expect(python).toContain('TODO');
      expect(project.requirements.some((requirement) => requirement.id === 'variacion')).toBe(true);
    }
  });

  it('cada lenguaje incluye comprobaciones ejecutables y la plantilla inicial no las supera', async () => {
    for (const project of AI_ENGINEER_PROJECTS) {
      for (const language of ['javascript', 'python'] as const) {
        const variant = project.languageVariants?.[language];
        expect(variant?.tests.length, `${project.id} (${language})`).toBeGreaterThanOrEqual(3);

        if (language === 'javascript') {
          const result = await runChallengeValidation({
            id: `${project.id}-${language}`,
            title: project.title,
            timestamp: 0,
            instructions: project.brief,
            tests: variant?.tests ?? [],
            hints: [],
          }, variant!.workspace);

          expect(result.allPassed, `${project.id} (${language}) debe comenzar sin resolver`).toBe(false);
        }
      }
    }
  });

  it('los nueve contratos aceptan una solución general en JavaScript y Python', async () => {
    for (const project of AI_ENGINEER_PROJECTS) {
      const javascript = project.languageVariants!.javascript;
      const jsWorkspace = structuredClone(javascript.workspace);
      jsWorkspace.files['app.js'].content = REFERENCE_JAVASCRIPT[project.id];
      const jsResult = await runChallengeValidation({ id: project.id, title: project.title, timestamp: 0, instructions: project.brief, tests: javascript.tests, hints: [] }, jsWorkspace);
      expect(jsResult.allPassed, `${project.id} no acepta una solución JavaScript general`).toBe(true);

      const python = project.languageVariants!.python;
      const functionName = python.tests[0].targetFunction!;
      const received = executePython(REFERENCE_PYTHON[project.id], functionName, python.tests.map((test) => test.args ?? []));
      python.tests.forEach((test, index) => {
        expect(evaluationValuesEqual(received[index], test.expectedReturn), `${project.id} no acepta una solución Python general en ${test.id}`).toBe(true);
      });
    }
  });
});
