import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { AI_SPECS } from './modules';

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
});
