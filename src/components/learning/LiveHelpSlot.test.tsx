// @vitest-environment happy-dom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LiveHelpSlot } from './LiveHelpSlot';

describe('LiveHelpSlot', () => {
  it('no renderiza una tarjeta ni una acción cuando no existe una integración real', () => {
    const { container } = render(<LiveHelpSlot />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Ayuda en vivo' })).toBeNull();
  });

  it('muestra las acciones que aporta una integración activa', () => {
    const join = vi.fn();
    render(<LiveHelpSlot integration={{
      status: 'available',
      statusLabel: 'Disponible',
      description: 'Una formadora puede ayudarte ahora.',
      primaryAction: { label: 'Unirme a la sesión', onAction: join },
    }} />);

    screen.getByRole('button', { name: 'Unirme a la sesión' }).click();
    expect(join).toHaveBeenCalledOnce();
  });
});
