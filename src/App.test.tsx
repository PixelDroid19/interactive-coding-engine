// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { loadAppNavigationState } from './engine/persistence';

describe('App navigation persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('restaura el Playground después de recargar la aplicación', () => {
    const firstRender = render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Playground' }));
    expect(screen.getByText('Playground independiente')).toBeTruthy();
    expect(loadAppNavigationState()).toEqual({ view: 'playground' });

    firstRender.unmount();
    render(<App />);

    expect(screen.getByText('Playground independiente')).toBeTruthy();
  });
});
