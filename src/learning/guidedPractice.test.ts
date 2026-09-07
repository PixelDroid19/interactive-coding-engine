// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { GUIDED_TOPICS, buildGuidedExercise, checkGuidedCode, createGuidedDraft, finishGuidedDraft, nextGuidedTopic, runGuidedPrediction } from './guidedPractice';

const outputs = [['6', '10', '7'], ['15', '24', '16'], ['Puede entrar', 'Aún no', 'Puede entrar'], ['9', '8', '11'], ['15', '24', '10'], ['probar', 'cocinar', 'elegir']];
describe('prácticas guiadas con ejecución real', () => {
  it('no ejecuta código en el hilo principal si falta el aislamiento en producción', async () => {
    vi.stubEnv('MODE', 'production');
    vi.stubGlobal('Worker', undefined);
    try {
      await expect(checkGuidedCode(buildGuidedExercise('variables'), 'function agregarReservas(a,b){return a+b}')).rejects.toThrow(/aislado/i);
    } finally { vi.unstubAllEnvs(); vi.unstubAllGlobals(); }
  });
  for (const [index, topic] of GUIDED_TOPICS.entries()) {
    for (let variant = 0; variant < 3; variant++) {
      it(`${topic.id}, variante ${variant}: el ejemplo funciona y el inicio no entrega la solución`, async () => {
        const exercise = buildGuidedExercise(topic.id, variant);
        expect(await runGuidedPrediction(exercise)).toBe(outputs[index][variant]);
        expect((await checkGuidedCode(exercise, exercise.starter)).some(check => !check.passed)).toBe(true);
      });
    }
  }
  it('admite soluciones distintas y rechaza un resultado fijo', async () => {
    const exercise = buildGuidedExercise('variables');
    for (const code of ['function agregarReservas(a,b) { return a+b; }', 'function agregarReservas(a,b) { let total=a; total+=b; return total; }']) {
      expect((await checkGuidedCode(exercise, code)).every(check => check.passed)).toBe(true);
    }
    expect((await checkGuidedCode(exercise, 'function agregarReservas(){ return 9; }')).some(check => !check.passed)).toBe(true);
  });
  it('comprueba el límite de una condición y la lista vacía', async () => {
    const checks = await checkGuidedCode(buildGuidedExercise('condiciones'), 'function puedeEntrar(edad){ return edad>18; }');
    expect(checks.map(check => check.passed)).toEqual([true, false, true]);
    expect((await checkGuidedCode(buildGuidedExercise('bucles'), 'function sumarCompra(precios){ return precios.reduce((a,b)=>a+b); }')).length).toBe(3);
  });
  it('no completa ni programa repaso sin comprobar el código', () => {
    const draft = { ...createGuidedDraft(), stage: 'explain' as const, explanation: 'x'.repeat(2000) };
    expect(finishGuidedDraft(draft, 'independent', 1000).history).toEqual([]);
  });
  it('separa autoevaluación y pruebas, y prioriza un repaso vencido', () => {
    const draft = { ...createGuidedDraft(), stage: 'explain' as const, usedHelp: true, checks: [{ input: 'f()', expected: '3', actual: '3', passed: true }] };
    const result = finishGuidedDraft(draft, 'supported', 1000);
    expect(result.history[0]).toMatchObject({ confidence: 'supported', dueAt: 86401000, usedHelp: true });
    expect(nextGuidedTopic(result.history, 1001)).toBe('operaciones');
    expect(nextGuidedTopic(result.history, 86401001)).toBe('variables');
  });
});
