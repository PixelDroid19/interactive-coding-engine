// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LanguageSelector } from './LanguageSelector';

describe('LanguageSelector', () => {
  afterEach(cleanup);

  it('expone el lenguaje activo y permite cambiarlo con botones reales', () => {
    const onChange = vi.fn();
    render(<LanguageSelector value="javascript" onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'JavaScript' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Python' }).getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: 'Python' }));
    expect(onChange).toHaveBeenCalledWith('python');
  });

  it('no dispara un cambio al pulsar el lenguaje ya activo', () => {
    const onChange = vi.fn();
    render(<LanguageSelector value="python" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Python' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
