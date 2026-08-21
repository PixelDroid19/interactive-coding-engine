// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { CodeEditor } from './CodeEditor';

describe('CodeEditor', () => {
  afterEach(cleanup);

  it('explica en español cuando no hay un archivo seleccionado', () => {
    render(<CodeEditor file={null} onCodeChange={() => {}} />);

    expect(screen.getByText('Ningún archivo seleccionado')).toBeTruthy();
    expect(screen.queryByText('No file selected')).toBeNull();
  });
});
