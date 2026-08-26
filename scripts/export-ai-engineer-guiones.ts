import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AI_SPECS } from '../src/curriculum/ai-engineer/modules';

const outputDir = resolve(process.cwd(), 'docs/guiones/ai-engineer');
await mkdir(outputDir, { recursive: true });

// Elimina guiones de clases que ya no existen para evitar restos huérfanos.
const existing = await readdir(outputDir);
for (const name of existing) {
  if (!name.endsWith('.md')) continue;
  const number = Number.parseInt(name, 10);
  if (Number.isNaN(number) || !AI_SPECS.some((spec) => spec.number === number)) {
    await rm(resolve(outputDir, name));
  }
}

const faseTitles: Record<number, string> = {
  0: 'Fase 1 · Pensamiento y fundamentos',
  1: 'Fase 2 · Conversación con modelos',
  2: 'Fase 3 · Modelo local en el navegador',
  3: 'Fase 4 · Embeddings y búsqueda semántica',
  4: 'Fase 5 · Documentos y RAG',
  5: 'Fase 6 · Un sistema más confiable',
  6: 'Fase 7 · La aplicación completa',
};

await Promise.all(AI_SPECS.map(async (spec) => {
  const number = String(spec.number).padStart(2, '0');
  const body = [
    '---',
    `lesson: ai-engineer-${number}`,
    `title: "${spec.title.replaceAll('"', '\\"')}"`,
    'mode: silent',
    '---',
    '',
    ...spec.script.flatMap((paragraph) => [paragraph, '']),
  ].join('\n');

  await writeFile(resolve(outputDir, `${number}.md`), body, 'utf8');
}));

const index = [
  '# Guiones de AI Engineer',
  '',
  'Texto hablado solamente. Cada archivo corresponde a una clase y debe coincidir palabra por palabra con el audio que se genere más adelante.',
  '',
  'El curso construye un único producto, el TutorLocal: un chat educativo local que crece por capacidades a lo largo de siete fases.',
  '',
  ...Object.entries(faseTitles).map(([moduleIndex, title]) => {
    const specs = AI_SPECS.filter((spec) => spec.module === Number(moduleIndex));
    return [
      `## ${title}`,
      '',
      ...specs.map((spec) => `- ${String(spec.number).padStart(2, '0')}. ${spec.title}`),
      '',
    ].join('\n');
  }),
].join('\n');

await writeFile(resolve(outputDir, 'README.md'), index, 'utf8');
