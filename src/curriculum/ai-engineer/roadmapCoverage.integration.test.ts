import { describe, expect, it } from 'vitest';
import { AI_SPECS } from './modules';
import { AI_ENGINEER_ROADMAP_TOPICS } from './roadmapCoverage';

const corpus = AI_SPECS.map((spec) => [
  spec.title,
  spec.summary,
  spec.mentalModel,
  ...spec.concepts.flatMap((concept) => [concept.label, concept.desc]),
  ...spec.script,
  ...spec.reading.sections.flatMap((section) => [section.title, section.content]),
  ...spec.reading.keyPoints,
  ...spec.reading.questions.flatMap((question) => [question.question, question.answer]),
  spec.reading.transfer,
].join('\n')).join('\n').toLocaleLowerCase('es');

describe('cobertura del roadmap AI Engineer', () => {
  it('mantiene una matriz concreta para todos los nodos de las siete capturas', () => {
    expect(AI_ENGINEER_ROADMAP_TOPICS.length).toBeGreaterThanOrEqual(50);
    expect(new Set(AI_ENGINEER_ROADMAP_TOPICS.map((topic) => topic.id)).size).toBe(AI_ENGINEER_ROADMAP_TOPICS.length);
  });

  it('cada tema aparece con todos sus conceptos necesarios en el material', () => {
    for (const topic of AI_ENGINEER_ROADMAP_TOPICS) {
      for (const alias of topic.aliases) {
        expect(corpus, `${topic.area}/${topic.label} no cubre "${alias}"`).toContain(alias.toLocaleLowerCase('es'));
      }
    }
  });

  it('cada clase mantiene práctica dual, refuerzo y dos fuentes', () => {
    for (const spec of AI_SPECS) {
      expect(spec.javascript.starter.trim(), `${spec.number} no tiene práctica JavaScript`).not.toBe('');
      expect(spec.python.starter.trim(), `${spec.number} no tiene práctica Python`).not.toBe('');
      expect(spec.practice.cases.length, `${spec.number} prueba un solo valor`).toBeGreaterThanOrEqual(2);
      expect(spec.reasoning.activity, `${spec.number} no tiene diagrama o actividad`).toBeDefined();
      expect(spec.reading.sourceIds.length, `${spec.number} tiene pocas fuentes`).toBeGreaterThanOrEqual(2);
    }
  });
});
