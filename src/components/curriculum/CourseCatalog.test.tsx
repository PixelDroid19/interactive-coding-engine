// @vitest-environment happy-dom
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FUNDAMENTOS_COURSE } from '../../curriculum/fundamentos/course';
import type { UserProgressRecord } from '../../types/curriculum';
import { CourseCatalog } from './CourseCatalog';

vi.mock('../../auth/AccountMenu', () => ({
  AccountMenu: () => <button type="button" aria-label="Cuenta">Cuenta</button>,
}));

vi.mock('../ThemeToggle', () => ({
  ThemeToggle: () => <button type="button" aria-label="Cambiar tema">Tema</button>,
}));

const progress: UserProgressRecord = {
  completedItemIds: [],
  completedChallenges: [],
  passedSoloProjects: [],
  savedLearnerBranches: {},
  recentActivity: [],
};

describe('CourseCatalog', () => {
  it('ofrece una etiqueta compacta y un nombre accesible para abrir el Playground', () => {
    const onPlayground = vi.fn();

    render(
      <CourseCatalog
        courses={[]}
        progress={progress}
        onOpenCourse={() => undefined}
        onPlayground={onPlayground}
      />,
    );

    const playground = screen.getByRole('button', { name: 'Abrir Playground' });
    expect(screen.getByText('Abrir')).toBeTruthy();

    fireEvent.click(playground);
    expect(onPlayground).toHaveBeenCalledTimes(1);
  });

  it('expone el avance de cada curso como una barra de progreso semántica', () => {
    render(
      <CourseCatalog
        courses={[FUNDAMENTOS_COURSE]}
        progress={progress}
        onOpenCourse={() => undefined}
        onPlayground={() => undefined}
      />,
    );

    const courseProgress = screen.getByRole('progressbar', { name: '0% completado' });
    expect(courseProgress.getAttribute('aria-valuemin')).toBe('0');
    expect(courseProgress.getAttribute('aria-valuemax')).toBe('100');
    expect(courseProgress.getAttribute('aria-valuenow')).toBe('0');
  });
});
