import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { COMPONENT_COURSE_SPECS } from '../src/curriculum/web-components-lit/course';

const outputDir = resolve(process.cwd(), 'docs/guiones/web-components-lit');
await mkdir(outputDir, { recursive: true });

await Promise.all(COMPONENT_COURSE_SPECS.map(async (spec) => {
  const number = String(spec.number).padStart(2, '0');
  const body = [
    '---',
    `lesson: componentes-lit-${number}`,
    `title: "${spec.title.replaceAll('"', '\\"')}"`,
    'status: listo_para_grabar',
    '---',
    '',
    ...spec.script.flatMap((paragraph) => [paragraph, '']),
  ].join('\n');

  await writeFile(resolve(outputDir, `${number}.md`), body, 'utf8');
}));

const index = [
  '# Guiones de Web Components y Lit',
  '',
  'Texto hablado solamente. Cada archivo corresponde a una clase y debe coincidir palabra por palabra con el audio que se genere más adelante.',
  '',
  'El curso no tiene un límite artificial de lecciones. Esta versión contiene las siguientes 40 unidades:',
  '',
  ...COMPONENT_COURSE_SPECS.map((spec) => `- ${String(spec.number).padStart(2, '0')}. ${spec.title}`),
  '',
].join('\n');

await writeFile(resolve(outputDir, 'README.md'), index, 'utf8');
