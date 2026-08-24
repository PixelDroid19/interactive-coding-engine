// @vitest-environment happy-dom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReadingView } from './ReadingView';
import { ReadingItem } from '../../types/curriculum';

describe('ReadingView', () => {
  afterEach(cleanup);

  it('mantiene las ampliaciones Para curiosos cerradas y separadas del contenido obligatorio', () => {
    const reading: ReadingItem = {
      id: 'fundamentos-03-lectura',
      relatedLessonId: 'fundamentos-03',
      title: 'Lectura: variables y tipos',
      type: 'reading',
      estimatedMinutes: 5,
      summary: 'Primero lo esencial.',
      sections: [
        { title: 'Lo esencial', content: 'Una variable une un nombre y un valor.' },
        {
          title: 'Para curiosos: ¿dónde vive el dato?',
          content: 'El motor administra la memoria.',
          kind: 'curiosity',
        },
      ],
      keyPoints: ['Una variable une un nombre y un valor'],
    };

    render(
      <ReadingView
        reading={reading}
        onBack={vi.fn()}
        onNext={vi.fn()}
        navigationState={{
          hasPrevious: false,
          hasNext: true,
          isFirst: true,
          isLast: false,
          previous: null,
          next: null,
          current: null,
        }}
      />,
    );

    const curiosity = screen.getByText('Para curiosos: ¿dónde vive el dato?').closest('details');
    expect(curiosity).toBeTruthy();
    expect(curiosity?.hasAttribute('open')).toBe(false);
    expect(screen.getByText('Lo esencial').closest('details')).toBeNull();
    expect(screen.getByText('Contenido opcional: no necesitas memorizarlo para continuar')).toBeTruthy();
  });
});
