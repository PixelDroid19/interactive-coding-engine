import { describe, expect, it } from 'vitest';
import { runChallengeValidation } from '../../engine/testRunner';
import { buildRoadmap } from '../fundamentos/roadmap';
import { AI_ENGINEER_COURSE, AI_ENGINEER_SCRIMS } from './course';
import { buildAiLessonBundle } from './factory';
import { AI_SPECS } from './modules';
import { AI_ENGINEER_PROJECTS } from './projects';

describe('auditoría integral de AI Engineer', () => {
  const items = AI_ENGINEER_COURSE.modules.flatMap((module) => module.items);

  it('entrega el inventario completo sin ids duplicados', () => {
    expect(AI_ENGINEER_COURSE.modules).toHaveLength(14);
    expect(AI_SPECS).toHaveLength(79);
    expect(Object.keys(AI_ENGINEER_SCRIMS)).toHaveLength(79);
    expect(items.filter((item) => item.type === 'scrim')).toHaveLength(79);
    expect(items.filter((item) => item.type === 'reading')).toHaveLength(79);
    expect(items.filter((item) => item.type === 'reasoning')).toHaveLength(79);
    expect(items.filter((item) => item.type === 'debugging')).toHaveLength(79);
    expect(items.filter((item) => item.type === 'solo-project')).toHaveLength(9);
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
    expect(AI_ENGINEER_PROJECTS).toHaveLength(9);
  });

  it('publica los nueve proyectos como destinos accesibles en el roadmap', () => {
    const projectRows = buildRoadmap(AI_ENGINEER_COURSE, AI_ENGINEER_SCRIMS)
      .flatMap((phase) => phase.rows)
      .filter((row) => row.main.itemType === 'solo-project');

    expect(projectRows).toHaveLength(9);
    expect(projectRows.map((row) => row.main.label)).toEqual([
      'Proyecto: simulador visual de sampling',
      'Proyecto: extractor de incidencias',
      'Proyecto: constructor de contexto',
      'Proyecto: enrutador de proveedores',
      'Proyecto: buscador semántico local',
      'Proyecto: asistente RAG de manuales',
      'Proyecto: agente de soporte limitado',
      'Proyecto: laboratorio de ataques',
      'Proyecto: tablero local de evaluaciones',
    ]);
  });

  it('mantiene todas las clases visuales, silenciosas y sin audio heredado', () => {
    for (const lesson of Object.values(AI_ENGINEER_SCRIMS)) {
      expect(lesson.narrationMode, lesson.id).toBe('silent');
      expect(lesson.audioTrack?.url, lesson.id).toBeUndefined();
      expect(lesson.audioTrack?.narrationScript.length, lesson.id).toBe(4);
      expect(lesson.languageVariants?.javascript.lessonTape).toBeDefined();
      expect(lesson.languageVariants?.python.lessonTape).toBeDefined();
    }
  });

  it('usa fuentes HTTPS y material suficiente en cada lectura', () => {
    for (const item of items) {
      if (item.type !== 'reading') continue;
      expect(item.sections.length, item.id).toBeGreaterThanOrEqual(4);
      expect(item.keyPoints.length, item.id).toBeGreaterThanOrEqual(2);
      expect(item.frequentQuestions?.length, item.id).toBeGreaterThanOrEqual(1);
      expect(item.sources?.length, item.id).toBeGreaterThanOrEqual(2);
      item.sources?.forEach((source) => expect(source.url, item.id).toMatch(/^https:\/\//));
    }
  });

  it('hace fallar cada starter JavaScript y aprobar sus 79 soluciones con entradas variadas', async () => {
    for (const spec of AI_SPECS) {
      const bundle = buildAiLessonBundle(spec);
      const challenge = bundle.lesson.languageVariants!.javascript.lessonTape!.challenges[0];
      const starter = bundle.lesson.languageVariants!.javascript.workspace;
      const starterResult = await runChallengeValidation(challenge, starter);
      expect(starterResult.allPassed, `${spec.number} entrega la solución en el starter`).toBe(false);

      const solution = structuredClone(starter);
      solution.files['app.js'].content = bundle.solutions.javascript;
      const solutionResult = await runChallengeValidation(challenge, solution);
      expect(solutionResult.allPassed, `${spec.number} tiene una solución de referencia inválida: ${solutionResult.feedbackMessage}`).toBe(true);
      expect(challenge.tests.length, `${spec.number} solo prueba un valor`).toBeGreaterThanOrEqual(2);
    }
  });
});
