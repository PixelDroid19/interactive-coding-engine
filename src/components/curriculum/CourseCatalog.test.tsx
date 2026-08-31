// @vitest-environment happy-dom
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
});
