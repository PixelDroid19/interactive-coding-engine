import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { runChallengeValidation } from '../../engine/testRunner';
import { evaluationValuesEqual } from '../../engine/evaluationEquality';
import { AI_ENGINEER_PROJECTS } from './projects';

// Soluciones de referencia de los siete proyectos de fase. Se usan solo en
// pruebas: los starters nunca las incluyen y las pistas no las revelan.
const REFERENCE_JAVASCRIPT: Record<string, string> = {
  'ai-project-eco-reglas': `function responder_eco(entrada) {
  const texto = entrada.texto.trim();
  if (texto.length === 0) return 'Escribe algo para empezar.';
  if (texto.endsWith('?')) return 'Todavía pienso con reglas: reformula tu pregunta.';
  return 'Has dicho: ' + texto;
}`,
  'ai-project-parametros-chat': `function validar_parametros(entrada) {
  const temperatura = Math.min(2, Math.max(0, entrada.temperatura ?? 0.7));
  const top_p = Math.min(1, Math.max(0, entrada.top_p ?? 1));
  return { temperatura, top_p };
}`,
  'ai-project-motor-local': `function diagnostico_local(entrada) {
  if (!entrada.webgpu) return 'sin_webgpu';
  return entrada.modeloEncontrado ? 'listo' : 'sin_modelo';
}`,
  'ai-project-buscador-notas': `function score_consulta(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  if (a.length !== b.length || a.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < a.length; i++) total += a[i] * b[i];
  return total;
}

function buscar_filtrado(entrada) {
  const validos = entrada.fragmentos.filter((item) => item.categoria === entrada.categoria);
  const puntuados = validos.map((item) => ({ id: item.id, puntos: score_consulta(entrada.consulta, item.vector) }));
  puntuados.sort((a, b) => b.puntos - a.puntos);
  return puntuados.slice(0, entrada.k).map((item) => item.id);
}`,
  'ai-project-rag-citas': `function evaluar_recuperacion(entrada) {
  if (entrada.relevantes.length === 0) return 0;
  const encontrados = entrada.relevantes.filter((id) => entrada.recuperados.includes(id)).length;
  return encontrados / entrada.relevantes.length;
}`,
  'ai-project-guardian': `function decision_publicacion(entrada) {
  return entrada.valida && entrada.citada && entrada.riesgoBajo ? 'publicar' : 'revisar';
}`,
  'ai-project-entrega-final': `function estado_final(entrada) {
  if (!entrada.webgpuOk) return 'sin_webgpu';
  if (!entrada.modeloEnCache) return 'falta_modelo';
  return entrada.hayDocumento ? 'preparado' : 'falta_documento';
}`,
};

const REFERENCE_PYTHON: Record<string, string> = {
  'ai-project-eco-reglas': `def responder_eco(entrada):
    texto = entrada['texto'].strip()
    if len(texto) == 0:
        return 'Escribe algo para empezar.'
    if texto.endswith('?'):
        return 'Todavía pienso con reglas: reformula tu pregunta.'
    return 'Has dicho: ' + texto`,
  'ai-project-parametros-chat': `def validar_parametros(entrada):
    temperatura = min(2, max(0, entrada.get('temperatura', 0.7)))
    top_p = min(1, max(0, entrada.get('top_p', 1)))
    return {'temperatura': temperatura, 'top_p': top_p}`,
  'ai-project-motor-local': `def diagnostico_local(entrada):
    if not entrada['webgpu']:
        return 'sin_webgpu'
    return 'listo' if entrada['modeloEncontrado'] else 'sin_modelo'`,
  'ai-project-buscador-notas': `def score_consulta(a, b):
    if not isinstance(a, list) or not isinstance(b, list):
        return 0
    if len(a) != len(b) or len(a) == 0:
        return 0
    return sum(x * y for x, y in zip(a, b))

def buscar_filtrado(entrada):
    validos = [item for item in entrada['fragmentos'] if item['categoria'] == entrada['categoria']]
    puntuados = [{'id': item['id'], 'puntos': score_consulta(entrada['consulta'], item['vector'])} for item in validos]
    puntuados.sort(key=lambda item: item['puntos'], reverse=True)
    return [item['id'] for item in puntuados[:entrada['k']]]`,
  'ai-project-rag-citas': `def evaluar_recuperacion(entrada):
    relevantes = entrada['relevantes']
    if len(relevantes) == 0:
        return 0
    encontrados = sum(1 for identificador in relevantes if identificador in entrada['recuperados'])
    return encontrados / len(relevantes)`,
  'ai-project-guardian': `def decision_publicacion(entrada):
    if entrada['valida'] and entrada['citada'] and entrada['riesgoBajo']:
        return 'publicar'
    return 'revisar'`,
  'ai-project-entrega-final': `def estado_final(entrada):
    if not entrada['webgpuOk']:
        return 'sin_webgpu'
    if not entrada['modeloEnCache']:
        return 'falta_modelo'
    return 'preparado' if entrada['hayDocumento'] else 'falta_documento'`,
};

function executePython(source: string, functionName: string, args: unknown[][]) {
  const cases = JSON.stringify(args).replaceAll('\\', '\\\\').replaceAll("'", "\\'");
  const harness = `\nimport json as __json\n__values = [globals()['${functionName}'](*args) for args in __json.loads('${cases}')]\nprint(__json.dumps(__values, ensure_ascii=False))`;
  const result = spawnSync('python3', ['-c', `${source}${harness}`], { encoding: 'utf8', timeout: 4_000 });
  if (result.status !== 0) throw new Error(result.stderr.trim());
  return JSON.parse(result.stdout.trim().split('\n').at(-1) ?? '[]') as unknown[];
}

describe('proyectos de AI Engineer', () => {
  it('incluye un proyecto de integración por cada fase', () => {
    expect(AI_ENGINEER_PROJECTS).toHaveLength(7);
    expect(new Set(AI_ENGINEER_PROJECTS.map((item) => item.id)).size).toBe(7);
    expect(new Set(AI_ENGINEER_PROJECTS.map((item) => item.module))).toEqual(new Set([0, 1, 2, 3, 4, 5, 6]));
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
      expect(project.brief, `${project.id} no menciona el producto del curso`).toMatch(/TutorLocal|chat/i);
    }
  });

  it('no entrega soluciones terminadas ni permite valores fijos', () => {
    for (const project of AI_ENGINEER_PROJECTS) {
      const javascript = project.languageVariants?.javascript.workspace.files['app.js']?.content ?? '';
      const python = project.languageVariants?.python.workspace.files['main.py']?.content ?? '';
      expect(javascript).toContain('TODO');
      expect(python).toContain('TODO');
      expect(javascript).not.toContain('return responder_eco');
      expect(project.requirements.some((requirement) => requirement.id === 'variacion')).toBe(true);
      expect(project.requirements.some((requirement) => requirement.id === 'integracion')).toBe(true);
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

  it('los siete contratos aceptan una solución general en JavaScript y Python', async () => {
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
