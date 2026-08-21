import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { FloatingBrowser } from './FloatingBrowser';
import { workspaceOf, file } from '../../engine/lessonCompiler';

const ws = workspaceOf('app.js', {
  'index.html': file('index.html', '<!DOCTYPE html><html><body><p id="saludo">Hola</p></body></html>'),
  'style.css': file('style.css', '*{}'),
  'app.js': file('app.js', 'let x=1'),
});

describe('FloatingBrowser', () => {
  it('badge traducido refleja estado real', () => {
    const markupLive = renderToStaticMarkup(<FloatingBrowser workspace={ws} isFloating={true} autoReload={true} onToggleFloating={() => {}} />);
    expect(markupLive).toContain('En vivo');
    expect(markupLive).not.toContain('>live<');

    const markupExec = renderToStaticMarkup(<FloatingBrowser workspace={ws} isFloating={true} autoReload={false} onToggleFloating={() => {}} />);
    expect(markupExec).toContain('Ejecutado');
  });

  it('botones Atrás/Adelante deshabilitados semánticamente', () => {
    const markup = renderToStaticMarkup(<FloatingBrowser workspace={ws} isFloating={true} autoReload={false} onToggleFloating={() => {}} />);
    expect(markup).toContain('aria-disabled="true"');
    expect(markup).toContain('Navegación no disponible');
    expect(markup).toContain('disabled');
  });

  it('URL no es input editable, es texto', () => {
    const markup = renderToStaticMarkup(<FloatingBrowser workspace={ws} isFloating={true} autoReload={false} onToggleFloating={() => {}} />);
    expect(markup).toContain('/index.html');
    expect(markup).not.toContain('browser-url-input');
    expect(markup).toContain('browser-url-text');
  });

  it('botones de icono tienen aria-label en español', () => {
    const markup = renderToStaticMarkup(<FloatingBrowser workspace={ws} isFloating={true} autoReload={false} onToggleFloating={() => {}} />);
    expect(markup).toContain('aria-label="Recargar vista previa"');
    expect(markup).toContain('aria-label="Ejecutar código"');
    expect(markup).toContain('aria-label="Minimizar vista previa"');
  });

  it('título Vista previa visible', () => {
    const markup = renderToStaticMarkup(<FloatingBrowser workspace={ws} isFloating={true} autoReload={false} onToggleFloating={() => {}} />);
    expect(markup).toContain('Vista previa');
  });
});
