// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FileTree } from './FileTree';

const files = {
  'index.html': {
    name: 'index.html',
    path: 'index.html',
    content: '<main></main>',
    language: 'html' as const,
  },
  'app.js': {
    name: 'app.js',
    path: 'app.js',
    content: 'console.log("hola")',
    language: 'javascript' as const,
  },
};

describe('FileTree', () => {
  afterEach(cleanup);

  it('permite seleccionar y administrar archivos con controles accesibles en español', () => {
    const onFileSelect = vi.fn();

    render(
      <FileTree
        files={files}
        activeFilePath="index.html"
        onFileSelect={onFileSelect}
        onFileRename={() => {}}
        onFileDelete={() => {}}
        dependencies={['lit']}
        onAddDependency={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir app.js' }));
    expect(onFileSelect).toHaveBeenCalledWith('app.js');
    expect(screen.getByRole('button', { name: 'Renombrar app.js' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Eliminar app.js' })).toBeTruthy();
    expect(screen.getByText('Dependencias')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Añadir dependencia' })).toBeTruthy();
  });

  it('crea un archivo con un formulario accesible', () => {
    const onFileCreate = vi.fn();
    render(
      <FileTree
        files={files}
        activeFilePath="index.html"
        onFileSelect={() => {}}
        onFileCreate={onFileCreate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Nuevo archivo' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre del archivo' }), { target: { value: 'datos.js' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear archivo' }));

    expect(onFileCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'datos.js', path: 'datos.js' }));
  });

  it('renombra un archivo con un formulario accesible', () => {
    const onFileRename = vi.fn();
    render(
      <FileTree
        files={files}
        activeFilePath="index.html"
        onFileSelect={() => {}}
        onFileRename={onFileRename}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Renombrar app.js' }));
    const input = screen.getByRole('textbox', { name: 'Nuevo nombre para app.js' });
    fireEvent.change(input, { target: { value: 'main.js' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar nombre' }));

    expect(onFileRename).toHaveBeenCalledWith('app.js', 'main.js');
  });

  it('añade una dependencia con un formulario accesible', () => {
    const onAddDependency = vi.fn();
    render(
      <FileTree
        files={files}
        activeFilePath="index.html"
        onFileSelect={() => {}}
        dependencies={['lit']}
        onAddDependency={onAddDependency}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Añadir dependencia' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre de la dependencia' }), { target: { value: 'zod@4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar dependencia' }));

    expect(onAddDependency).toHaveBeenCalledWith('zod@4');
  });
});
