import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { ChallengeDrawer, splitChallengeInstructions } from './ChallengeDrawer';
import { markChallengeCompleted, markChallengeSkipped, markChallengeSolutionViewed, getChallengeState, clearChallengeState } from '../../engine/persistence';

const makeChallenge = () => ({
  id: 'reto-tu-nombre',
  title: 'Reto: pon tu nombre',
  timestamp: 109400,
  instructions: 'Cambia Alex',
  tests: [{ id: 't1', description: 'test', validatorType: 'source-regex' as const, regexPattern: 'a' }],
  hints: [{ level: 1, title: 'Pista 1', text: 'texto pista' }],
});

describe('ChallengeDrawer', () => {
  it('convierte instrucciones largas etiquetadas en pasos escaneables', () => {
    const parts = splitChallengeInstructions(
      'Antes de empezar: recuerda el contrato. Punto de partida: abre app.js. Cómo comprobarlo: ejecuta las pruebas. Si te atascas, abre una pista.',
    );

    expect(parts).toEqual([
      { heading: 'Antes de empezar', body: 'recuerda el contrato.' },
      { heading: 'Punto de partida', body: 'abre app.js.' },
      { heading: 'Cómo comprobarlo', body: 'ejecuta las pruebas.' },
      { heading: 'Si te atascas', body: 'abre una pista.' },
    ]);
  });

  it('reconoce los encabezados reales aunque no lleven dos puntos', () => {
    const parts = splitChallengeInstructions(
      'Corrige total().\n\nAntes de empezar\nRecuerda el contrato.\n\nCómo comprobarlo\nEjecuta las pruebas.',
    );

    expect(parts).toEqual([
      { body: 'Corrige total().' },
      { heading: 'Antes de empezar', body: 'Recuerda el contrato.' },
      { heading: 'Cómo comprobarlo', body: 'Ejecuta las pruebas.' },
    ]);
  });

  it('conserva como párrafo las instrucciones breves sin secciones', () => {
    expect(splitChallengeInstructions('Cambia Alex')).toEqual([{ body: 'Cambia Alex' }]);
  });

  it('respeta orden de hooks: no falla al cerrar y reabrir', () => {
    const challenge = makeChallenge();
    const closed = renderToStaticMarkup(
      <ChallengeDrawer challenge={challenge as any} validationResult={null} onValidate={() => {}} onReset={() => {}} onContinue={() => {}} isOpen={false} />
    );
    expect(closed).toBe('');
    const open = renderToStaticMarkup(
      <ChallengeDrawer challenge={challenge as any} validationResult={null} onValidate={() => {}} onReset={() => {}} onContinue={() => {}} isOpen={true} />
    );
    expect(open).toContain('Reto: pon tu nombre');
    // Re-close
    const closed2 = renderToStaticMarkup(
      <ChallengeDrawer challenge={challenge as any} validationResult={null} onValidate={() => {}} onReset={() => {}} onContinue={() => {}} isOpen={false} />
    );
    expect(closed2).toBe('');
  });

  it('minimizar mantiene estructura y botón accesible', () => {
    const challenge = makeChallenge();
    const markup = renderToStaticMarkup(
      <ChallengeDrawer challenge={challenge as any} validationResult={null} onValidate={() => {}} onReset={() => {}} onClose={() => {}} onContinue={() => {}} isOpen={true} />
    );
    expect(markup).toContain('Minimizar reto');
    expect(markup).toContain('Cerrar panel del reto');
  });

  it('saltar usa texto veraz Saltar por ahora', () => {
    const challenge = makeChallenge();
    const markup = renderToStaticMarkup(
      <ChallengeDrawer challenge={challenge as any} validationResult={null} onValidate={() => {}} onReset={() => {}} onSkip={() => {}} onContinue={() => {}} isOpen={true} />
    );
    expect(markup).toContain('Saltar por ahora');
    expect(markup).not.toContain('Saltar y ver la solución');
  });

  it('no ofrece una resolución ni código para copiar al agotar las pistas', () => {
    const challenge = makeChallenge();
    const markup = renderToStaticMarkup(
      <ChallengeDrawer challenge={challenge as any} validationResult={null} onValidate={() => {}} onReset={() => {}} onSkip={() => {}} onContinue={() => {}} isOpen={true} />
    );
    expect(markup).toContain('Ya tienes todas las pistas');
    expect(markup).not.toContain('Ver cómo se resuelve');
    expect(markup).not.toContain('Ver resolución');
    expect(markup).not.toContain('Aplicar y continuar');
  });

  it('textos en español y aria-labels', () => {
    const challenge = makeChallenge();
    const markup = renderToStaticMarkup(
      <ChallengeDrawer challenge={challenge as any} validationResult={null} onValidate={() => {}} onReset={() => {}} onContinue={() => {}} isOpen={true} />
    );
    expect(markup).toContain('Haz esto');
    expect(markup).toContain('Resultado esperado');
    expect(markup).toContain('Necesito ayuda');
    expect(markup).toContain('Comprueba');
    expect(markup).toContain('Pistas');
    expect(markup).toContain('Comprobar');
    expect(markup).toContain('Reiniciar reto');
    expect(markup).toContain('aria-label="Minimizar reto"');
  });

  it('aclara que las funciones pueden probarse con valores propios', () => {
    const challenge = {
      ...makeChallenge(),
      tests: [{
        id: 'funcion-general',
        description: 'Funciona con datos distintos',
        validatorType: 'function-call' as const,
        targetFunction: 'etiqueta',
        args: [{ nombre: 'Control', precio: 1 }],
        expectedReturn: 'Control — 1',
      }],
    };
    const markup = renderToStaticMarkup(
      <ChallengeDrawer challenge={challenge as any} validationResult={null} onValidate={() => {}} onReset={() => {}} onContinue={() => {}} isOpen={true} />
    );

    expect(markup).toContain('Puedes usar tus propios valores');
    expect(markup).toContain('datos distintos');
    expect(markup).toContain('console.log');
  });

  it('tras validación fallida muestra mensaje útil', () => {
    const challenge = makeChallenge();
    const validation = {
      allPassed: false,
      passedCount: 0,
      totalCount: 1,
      tests: [{ id: 't1', description: 'test', passed: false, errorMessage: 'Falta', hint: 'pista' }],
      feedbackMessage: 'Sigue',
    };
    const markup = renderToStaticMarkup(
      <ChallengeDrawer challenge={challenge as any} validationResult={validation as any} onValidate={() => {}} onReset={() => {}} onContinue={() => {}} isOpen={true} />
    );
    expect(markup).toContain('Pista');
  });

  it('distingue skipped, solutionViewed y completed', () => {
    const store: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { for (const k in store) delete store[k]; },
    } as any;
    clearChallengeState('reto-a');
    clearChallengeState('reto-b');
    clearChallengeState('reto-c');
    markChallengeCompleted('reto-a');
    expect(getChallengeState('reto-a')?.status).toBe('completed');
    markChallengeSkipped('reto-b');
    expect(getChallengeState('reto-b')?.status).toBe('skipped');
    markChallengeSolutionViewed('reto-c');
    expect(getChallengeState('reto-c')?.status).toBe('solutionViewed');
    // ver solución no marca como completado
    expect(getChallengeState('reto-c')?.status).not.toBe('completed');
  });

  it('saltar por ahora no muestra solución', () => {
    const challenge = makeChallenge();
    const markup = renderToStaticMarkup(
      <ChallengeDrawer challenge={challenge as any} validationResult={null} onValidate={() => {}} onReset={() => {}} onSkip={() => {}} onContinue={() => {}} isOpen={true} />
    );
    // Saltar por ahora debe estar, pero la resolución "Cómo se resuelve" no debe estar visible inicialmente como contenido expandido
    expect(markup).toContain('Saltar por ahora');
    // La resolución detallada solo aparece tras clicar Ver cómo se resuelve, no en markup inicial
    expect(markup).not.toContain('Volver a intentarlo');
  });

  it('anuncia el resultado del reto de forma accesible sin interrumpir', () => {
    const challenge = makeChallenge();
    const failing = {
      allPassed: false,
      passedCount: 0,
      totalCount: 1,
      tests: [{ id: 't1', description: 'test', passed: false, errorMessage: 'Falta', hint: 'pista' }],
      feedbackMessage: 'Sigue intentando',
    };
    const passing = {
      allPassed: true,
      passedCount: 1,
      totalCount: 1,
      tests: [{ id: 't1', description: 'test', passed: true }],
      feedbackMessage: '¡Bien hecho!',
    };
    const markupFail = renderToStaticMarkup(
      <ChallengeDrawer challenge={challenge as any} validationResult={failing as any} onValidate={() => {}} onReset={() => {}} onContinue={() => {}} isOpen={true} />
    );
    expect(markupFail).toContain('role="status"');
    expect(markupFail).toContain('aria-live="polite"');
    expect(markupFail).toContain('aria-atomic="true"');
    const markupPass = renderToStaticMarkup(
      <ChallengeDrawer challenge={challenge as any} validationResult={passing as any} onValidate={() => {}} onReset={() => {}} onContinue={() => {}} isOpen={true} />
    );
    expect(markupPass).toContain('role="status"');
    expect(markupPass).toContain('aria-live="polite"');
    expect(markupPass).toContain('aria-atomic="true"');
    const markupNone = renderToStaticMarkup(
      <ChallengeDrawer challenge={challenge as any} validationResult={null} onValidate={() => {}} onReset={() => {}} onContinue={() => {}} isOpen={true} />
    );
    expect(markupNone).not.toContain('role="status"');
  });
});
