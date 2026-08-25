import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { AI_SPECS } from './modules';

const BANNED_AI_WORDS = /\b(?:delve|tapestry|testament|underscore|pivotal|intricate|intricacies|meticulous|garner|vibrant|bolster|bolstered|enduring|interplay|crucial|valuable|exemplify|renowned|groundbreaking|boast|boasts|nestled|landscape|realm|embark|leverage|elevate|unlock|unleash|harness|robust|seamless|holistic|myriad|plethora|cornerstone|beacon|game-changer|paradigm|synergy|additionally|moreover|furthermore|notably|importantly)\b/i;
const CANNED_PHRASES = /\b(?:in today's world|in the heart of|when it comes to|it's important to note|it's worth noting|needless to say|in conclusion|in summary|no solo|no únicamente)\b/i;
const COPY_ARTIFACTS = /contentReference|oaicite|oai_citation|turn\d+(?:search|view)\d+|utm_source=|:::/i;

function proseFor(spec: (typeof AI_SPECS)[number]) {
  return [
    spec.title,
    spec.summary,
    spec.mentalModel,
    ...spec.concepts.flatMap((concept) => [concept.label, concept.desc]),
    ...spec.script,
    spec.practice.title,
    spec.practice.instructions,
    ...spec.practice.hints,
    ...spec.reading.sections.flatMap((section) => [section.title, section.content]),
    ...spec.reading.keyPoints,
    ...spec.reading.questions.flatMap((question) => [question.question, question.answer]),
    spec.reading.transfer,
    spec.reasoning.explanation,
    ...spec.reasoning.hints,
    spec.debug.title,
    spec.debug.expected,
    spec.debug.observed,
    ...spec.debug.hints,
  ];
}

function spokenMarkdown(markdown: string) {
  return markdown.split('\n').filter((line) => line.trim() && line !== '---' && !/^(lesson|title|mode):/.test(line)).join('\n');
}

describe('calidad editorial de AI Engineer', () => {
  it('mantiene guion y subtítulos con las mismas palabras', async () => {
    for (const spec of AI_SPECS) {
      const filename = `${String(spec.number).padStart(2, '0')}.md`;
      const markdown = await readFile(path.resolve('docs/guiones/ai-engineer', filename), 'utf8');
      expect(spokenMarkdown(markdown), filename).toBe(spec.script.join('\n'));
    }
  });

  it('evita copy de producto prohibido, párrafos duplicados y pistas-solución', () => {
    const paragraphs = new Set<string>();
    for (const spec of AI_SPECS) {
      for (const text of [...spec.script, ...spec.reading.sections.map((section) => section.content)]) {
        expect(text, `${spec.number} menciona una marca interna`).not.toMatch(/scrimba|sc aula viva/i);
        const key = text.trim().toLocaleLowerCase('es');
        expect(paragraphs.has(key), `${spec.number} repite un párrafo completo`).toBe(false);
        paragraphs.add(key);
      }
      expect(spec.practice.hints.join('\n'), `${spec.number} revela el archivo terminado`).not.toContain(spec.javascript.solution);
      expect(spec.practice.hints.join('\n'), `${spec.number} revela el archivo terminado`).not.toContain(spec.python.solution);
    }
  });

  it('cumple las reglas de escritura humana del archivo adjunto', () => {
    for (const spec of AI_SPECS) {
      for (const text of proseFor(spec)) {
        expect(text, `${spec.number} usa vocabulario de redacción artificial`).not.toMatch(BANNED_AI_WORDS);
        expect(text, `${spec.number} usa una frase prefabricada`).not.toMatch(CANNED_PHRASES);
        expect(text, `${spec.number} contiene puntuación tipográfica prohibida`).not.toMatch(/[—“”‘’]/);
        expect(text, `${spec.number} contiene un artefacto de copia`).not.toMatch(COPY_ARTIFACTS);
        for (const sentence of text.split(/(?<=[.!?])\s+/)) {
          const words = sentence.trim().split(/\s+/).filter(Boolean).length;
          expect(words, `${spec.number} tiene una oración de ${words} palabras: ${sentence}`).toBeLessThanOrEqual(38);
        }
      }
    }
  });
});
