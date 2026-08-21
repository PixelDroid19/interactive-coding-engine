import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { RuntimeConsole } from './RuntimeConsole';

describe('RuntimeConsole', () => {
  it('textos en español y aria-labels', () => {
    const markup = renderToStaticMarkup(<RuntimeConsole logs={[]} onClearLogs={() => {}} isOpen={true} onToggle={() => {}} />);
    expect(markup).toContain('Consola');
    expect(markup).toContain('Todo');
    expect(markup).toContain('Mensajes');
    expect(markup).toContain('Avisos');
    expect(markup).toContain('Errores');
    expect(markup).toContain('aria-label="Limpiar consola"');
    expect(markup).toContain('Limpiar consola');
    expect(markup).not.toContain('>Console<');
    expect(markup).not.toContain('Clear console');
  });

  it('estado vacío traducido', () => {
    const markup = renderToStaticMarkup(<RuntimeConsole logs={[]} onClearLogs={() => {}} isOpen={true} onToggle={() => {}} />);
    expect(markup).toContain('Sin salida aún');
    expect(markup).not.toContain('No console output');
  });

  it('muestra errores y avisos traducidos', () => {
    const logs = [
      { id: '1', type: 'error' as const, args: ['fallo'], timestamp: Date.now() },
      { id: '2', type: 'warn' as const, args: ['cuidado'], timestamp: Date.now() },
    ];
    const markup = renderToStaticMarkup(<RuntimeConsole logs={logs} onClearLogs={() => {}} isOpen={false} onToggle={() => {}} />);
    expect(markup).toContain('error');
    expect(markup).toContain('aviso');
  });

  it('filtros tienen aria-pressed', () => {
    const markup = renderToStaticMarkup(<RuntimeConsole logs={[]} onClearLogs={() => {}} isOpen={true} onToggle={() => {}} />);
    expect(markup).toContain('aria-pressed');
  });
});
