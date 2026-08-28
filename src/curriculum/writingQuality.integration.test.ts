import { describe, expect, it } from 'vitest';
import type { Course, ReadingItem } from '../types/curriculum';
import { FUNDAMENTOS_COURSE } from './fundamentos/course';
import { JAVASCRIPT_COURSE } from './javascript/course';
import { COMPONENT_COURSE } from './web-components-lit/course';

const TARGET_COURSES = [FUNDAMENTOS_COURSE, JAVASCRIPT_COURSE, COMPONENT_COURSE];
const ROBOTIC_FILLER = [
  'trabaja con una lista de control: define entradas y salidas públicas',
  'esta lectura conecta el concepto con decisiones de arquitectura',
  'simplemente copia',
  'solo tienes que',
  'como ia',
];

function readings(course: Course): ReadingItem[] {
  return course.modules.flatMap((module) => module.items).filter((item): item is ReadingItem => item.type === 'reading');
}

describe.each(TARGET_COURSES)('calidad editorial: $title', (course) => {
  it('mantiene bloques legibles, concretos y sin relleno repetido', () => {
    for (const reading of readings(course)) {
      expect(reading.summary.trim().split(/\s+/).length, `${reading.id}: resumen demasiado corto`).toBeGreaterThanOrEqual(8);
      expect(reading.sections.length, `${reading.id}: lectura sin desarrollo`).toBeGreaterThanOrEqual(3);
      expect(new Set(reading.sections.map((section) => section.title)).size, `${reading.id}: títulos repetidos`).toBe(reading.sections.length);
      for (const section of reading.sections) {
        const words = section.content.trim().split(/\s+/).length;
        expect(words, `${reading.id}/${section.title}: explicación demasiado breve`).toBeGreaterThanOrEqual(10);
        expect(words, `${reading.id}/${section.title}: bloque monolítico`).toBeLessThanOrEqual(190);
        expect(/[.!?]$/.test(section.content.trim()), `${reading.id}/${section.title}: falta cierre`).toBe(true);
        for (const filler of ROBOTIC_FILLER) expect(section.content.toLowerCase(), `${reading.id}/${section.title}: copy robótico`).not.toContain(filler);
      }
    }
  });

  it('formula dudas y transferencia como acciones comprensibles', () => {
    for (const reading of readings(course)) {
      for (const faq of reading.frequentQuestions ?? []) {
        expect(faq.question.trim().endsWith('?'), `${reading.id}: pregunta sin signo`).toBe(true);
        expect(faq.answer.trim().split(/\s+/).length, `${reading.id}: respuesta superficial`).toBeGreaterThanOrEqual(8);
      }
      if (reading.transferPrompt) expect(reading.transferPrompt.trim().split(/\s+/).length, `${reading.id}: transferencia vaga`).toBeGreaterThanOrEqual(7);
    }
  });
});

it('asocia exactamente siete diagramas útiles y accesibles', () => {
  const diagrams = TARGET_COURSES.flatMap(readings).flatMap((reading) => reading.sections.flatMap((section) => section.diagram ? [section.diagram] : []));
  expect(diagrams).toHaveLength(7);
  expect(new Set(diagrams.map((diagram) => diagram.src)).size).toBe(7);
  for (const diagram of diagrams) {
    expect(diagram.alt.split(/\s+/).length).toBeGreaterThanOrEqual(6);
    expect(diagram.caption.split(/\s+/).length).toBeGreaterThanOrEqual(10);
    expect(diagram.readingQuestion.endsWith('?')).toBe(true);
  }
});
