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
        {
          title: 'Lo esencial',
          content: 'Una variable une un nombre y un valor.',
        },
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

  it('separa conceptos, laboratorio y fuentes en superficies independientes', () => {
    const reading: ReadingItem = {
      id: 'ai-engineer-26-lectura',
      relatedLessonId: 'ai-engineer-26',
      title: 'Lectura: Transformers.js',
      type: 'reading',
      estimatedMinutes: 9,
      summary: 'Aprende a ejecutar un modelo local.',
      sections: [
        { title: 'La idea central', content: 'El Hub distribuye artefactos.' },
        { title: 'Cómo funciona', content: 'El modelo corre en un Worker.' },
        { title: 'Cómo decidir', content: 'Compara tamaño y compatibilidad.' },
        {
          title: 'Errores comunes',
          content: 'No ocultes una salida corrupta.',
        },
      ],
      keyPoints: ['Inspecciona antes de descargar', 'Mide en el equipo real'],
      frequentQuestions: [
        {
          question: '¿Se descarga cada vez?',
          answer: 'Puede conservarse en caché.',
        },
      ],
      transferPrompt: 'Compara dos model cards.',
      sources: [
        {
          title: 'Transformers.js',
          publisher: 'Hugging Face',
          url: 'https://huggingface.co/docs/transformers.js/index',
          purpose: 'Documentación del runtime.',
        },
        {
          title: 'Transformers.js v4',
          publisher: 'Hugging Face',
          url: 'https://huggingface.co/blog/transformersjs-v4',
          purpose: 'Cambios de WebGPU.',
        },
      ],
      interactiveLab: {
        title: 'WebGPU en acción',
        description: 'Ejecuta un modelo local.',
        defaultMode: 'prompt',
        allowedModes: ['prompt'],
        systemPrompt: 'Responde en español.',
        promptA: 'Explica.',
        promptB: 'Explica con un ejemplo.',
        input: 'Una función recibe una entrada y puede devolver un resultado.',
        observationPrompt: '¿Qué cambió?',
      },
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

    const concepts = screen.getByRole('region', {
      name: 'Conceptos de la lectura',
    });
    expect(concepts.querySelectorAll('article')).toHaveLength(4);

    const lab = screen.getByRole('region', { name: 'WebGPU en acción' });
    expect(lab.closest('article')).toBeNull();

    const sources = screen.getByRole('list', { name: 'Fuentes recomendadas' });
    expect(sources.querySelectorAll('li')).toHaveLength(2);
  });

  it('presenta la lectura como zonas amplias y no como una unica columna anidada', () => {
    const reading: ReadingItem = {
      id: 'ai-engineer-26-lectura',
      relatedLessonId: 'ai-engineer-26',
      title: 'Lectura: Transformers.js',
      type: 'reading',
      estimatedMinutes: 9,
      summary: 'Aprende a ejecutar un modelo local.',
      sections: [
        { title: 'La idea central', content: 'El Hub distribuye artefactos.' },
        { title: 'Cómo funciona', content: 'El modelo corre en un Worker.' },
        { title: 'Cómo decidir', content: 'Compara tamaño y compatibilidad.' },
        {
          title: 'Errores comunes',
          content: 'No ocultes una salida corrupta.',
        },
      ],
      keyPoints: ['Inspecciona antes de descargar'],
      sources: [
        {
          title: 'Transformers.js',
          publisher: 'Hugging Face',
          url: 'https://huggingface.co/docs/transformers.js/index',
          purpose: 'Documentación del runtime.',
        },
      ],
      interactiveLab: {
        title: 'WebGPU en acción',
        description: 'Ejecuta un modelo local.',
        defaultMode: 'prompt',
        allowedModes: ['prompt'],
        systemPrompt: 'Responde en español.',
        promptA: 'Explica.',
        promptB: 'Explica con un ejemplo.',
        input: 'Una función recibe una entrada y puede devolver un resultado.',
        observationPrompt: '¿Qué cambió?',
      },
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

    expect(screen.getByRole('main').classList.contains('reading-canvas')).toBe(true);
    expect(screen.getByRole('region', { name: 'Mapa de la lectura' }).classList.contains('reading-overview')).toBe(true);
    expect(screen.getByRole('region', { name: 'Laboratorio interactivo' }).classList.contains('reading-lab-zone')).toBe(true);
    expect(screen.getByRole('region', { name: 'Biblioteca de campo' }).classList.contains('reading-library-zone')).toBe(true);
    expect(screen.getByRole('navigation', { name: 'Secciones de la lectura' })).toBeTruthy();
    expect(screen.getByRole('main').querySelector('.reading-page-grid')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Conceptos de la lectura' }).classList.contains('reading-concepts-zone')).toBe(true);
    expect(screen.getByRole('list', { name: 'Fuentes recomendadas' }).classList.contains('reading-source-grid')).toBe(true);
  });
});
