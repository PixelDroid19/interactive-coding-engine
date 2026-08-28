// @vitest-environment happy-dom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TechnologyPath } from './TechnologyPath';

describe('TechnologyPath', () => {
  it('explica la relación completa y señala el curso actual', () => {
    render(<TechnologyPath currentCourseId="course-open-cells" />);

    expect(screen.getByRole('heading', { name: 'De una instrucción a una aplicación Cells' })).toBeTruthy();
    expect(screen.getByRole('list', { name: /Relación entre/ }).children).toHaveLength(4);
    expect(screen.getByText('Cells').closest('li')?.className).toContain('is-current');
    expect(screen.getByText('Estás aquí')).toBeTruthy();
    expect(screen.getByText(/Cells no reemplaza Lit/)).toBeTruthy();
  });
});
