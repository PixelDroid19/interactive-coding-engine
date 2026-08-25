import { describe, expect, it } from 'vitest';
import { runChallengeValidation } from '../../engine/testRunner';
import { AI_ENGINEER_PROJECTS } from './projects';

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
});
