// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { CodeEditor, type EditorLanguageClient } from './CodeEditor';
import type { WorkspaceFile } from '../../types/scrim';

const appFile: WorkspaceFile = {
  name: 'app.js',
  path: 'app.js',
  language: 'javascript',
  content: 'const total = valorDesconocido;',
};

const cssFile: WorkspaceFile = {
  name: 'style.css',
  path: 'style.css',
  language: 'css',
  content: 'body { color: red; }',
};

const pythonFile: WorkspaceFile = {
  name: 'main.py',
  path: 'main.py',
  language: 'python',
  content: 'def saludar(nombre):\n  return f"Hola, {nombre}"',
};

const jsonFile: WorkspaceFile = {
  name: 'package.json',
  path: 'package.json',
  language: 'json',
  content: '{\n  "name": "academy-learning-card",\n  "version": "0.1.0"\n}',
};

function languageClient(): EditorLanguageClient {
  return {
    replaceWorkspace: () => {},
    updateFile: () => {},
    dispose: () => {},
    completions: async () => [],
    hover: async () => null,
    signatureHelp: async () => null,
    diagnostics: async () => [{
      from: 14,
      to: 30,
      severity: 'error',
      message: "No se encuentra el nombre 'valorDesconocido'.",
      source: 'TypeScript',
      code: 2304,
    }],
  };
}

describe('CodeEditor', () => {
  afterEach(cleanup);

  it('explica en español cuando no hay un archivo seleccionado', () => {
    render(<CodeEditor file={null} onCodeChange={() => {}} />);

    expect(screen.getByText('Ningún archivo seleccionado')).toBeTruthy();
    expect(screen.queryByText('No file selected')).toBeNull();
  });

  it('aplica el modo de solo lectura al contenido real de CodeMirror', () => {
    const { container } = render(
      <CodeEditor
        file={appFile}
        workspaceFiles={{ 'app.js': appFile }}
        readOnly
        languageClient={languageClient()}
      />,
    );

    expect(container.querySelector('.cm-content')?.getAttribute('contenteditable')).toBe('false');
    expect(container.querySelector('.cm-scroller')?.getAttribute('tabindex')).toBe('0');
    expect(container.querySelector('.cm-scroller')?.getAttribute('aria-label')).toBe('Área desplazable del editor');
  });

  it('cambia de archivo sin destruir la instancia visible del editor', () => {
    const client = languageClient();
    const workspaceFiles = { 'app.js': appFile, 'style.css': cssFile };
    const { container, rerender } = render(
      <CodeEditor file={appFile} workspaceFiles={workspaceFiles} languageClient={client} />,
    );
    const firstEditor = container.querySelector('.cm-editor');
    expect(screen.getByRole('textbox', { name: 'Editor de app.js' })).toBeTruthy();

    rerender(<CodeEditor file={cssFile} workspaceFiles={workspaceFiles} languageClient={client} />);

    expect(container.querySelector('.cm-editor')).toBe(firstEditor);
    expect(container.querySelector('.cm-content')?.textContent).toContain('body { color: red; }');
    expect(screen.getByRole('textbox', { name: 'Editor de style.css' })).toBeTruthy();
  });

  it('muestra un contador accesible de errores semánticos', async () => {
    render(
      <CodeEditor
        file={appFile}
        workspaceFiles={{ 'app.js': appFile }}
        languageClient={languageClient()}
      />,
    );

    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('1 error'));
  });

  it('activa la sintaxis y el autocompletado propio de Python', async () => {
    const { container } = render(
      <CodeEditor file={pythonFile} workspaceFiles={{ 'main.py': pythonFile }} />,
    );

    expect(container.querySelector('.cm-line span')?.textContent).toBe('def');
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Python · sintaxis válida · sugerencias activas'));
    expect(screen.getByRole('status').textContent).not.toContain('Emmet');
  });

  it('reconoce package.json como JSON válido sin anunciar Emmet ni errores falsos', async () => {
    const { container } = render(
      <CodeEditor file={jsonFile} workspaceFiles={{ 'package.json': jsonFile }} />,
    );

    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('JSON · sintaxis válida'));
    expect(screen.getByRole('status').textContent).not.toContain('Emmet');
    expect(container.querySelectorAll('.cm-lintRange-error')).toHaveLength(0);
    expect(container.querySelectorAll('.cm-lint-marker-error')).toHaveLength(0);
  });
});
