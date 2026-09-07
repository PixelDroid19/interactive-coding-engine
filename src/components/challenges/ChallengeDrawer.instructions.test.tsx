// @vitest-environment happy-dom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ChallengeDrawer } from './ChallengeDrawer';
import type { ScrimChallenge } from '../../types/scrim';

const challenge: ScrimChallenge = {
  id: 'visible-instructions', title: 'Editor de perfil', timestamp: 0,
  instructions: 'Conecta el formulario. Rechaza los nombres vacíos y muestra un mensaje antes de emitir el evento público del componente. Entrega detail.name limpio y retira el error al corregir la entrada.',
  tests: [], hints: [
    { level: 1, title: 'Pista', text: 'Observa el evento submit.' },
    { level: 2, title: 'Otra pista', text: 'Compara dos entradas.' },
  ],
};

function show(instructions = challenge.instructions) {
  render(<ChallengeDrawer challenge={{ ...challenge, instructions }} validationResult={null}
    onValidate={() => {}} onReset={() => {}} onContinue={() => {}} isOpen />);
  return screen.getByRole('region', { name: 'Instrucciones de la práctica' });
}

describe('Enunciado visible del reto', () => {
  afterEach(cleanup);

  it('muestra todo el contrato sin pedir una pista ni alterar nombres de propiedades', () => {
    const region = show();
    expect(region.textContent).toContain('Entrega detail.name limpio');
    for (const folded of region.querySelectorAll('details:not([open])')) {
      expect(folded.textContent).not.toContain('Rechaza los nombres vacíos');
      expect(folded.textContent).not.toContain('Entrega detail.name');
    }
    expect(screen.getByText('Observa el evento submit.').closest('details')?.open).toBe(false);
  });

  it('mantiene los pasos y la forma de comprobar visibles, plegando solo la ayuda explícita', () => {
    const region = show('Corrige la cuenta.\n\nPunto de partida: conserva la lista recibida.\n\nCómo comprobarlo: prueba una lista vacía y otra con datos.\n\nSi te atascas: compara las referencias.');
    for (const text of ['conserva la lista recibida.', 'prueba una lista vacía y otra con datos.']) {
      expect(region.textContent).toContain(text);
      expect(screen.getByText(text).closest('details')).toBeNull();
    }
    expect(screen.getByText('compara las referencias.').closest('details')?.open).toBe(false);
  });

  it('mantiene el recordatorio teórico aparte del contrato visible', () => {
    show('Valida el nombre.\n\nAntes de empezar: recuerda el modelo de eventos de la clase.\n\nPunto de partida: edita el formulario existente.');
    expect(screen.getByText('recuerda el modelo de eventos de la clase.').closest('details')?.open).toBe(false);
    expect(screen.getByText('edita el formulario existente.').closest('details')).toBeNull();
  });
});
