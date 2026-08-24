import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { JAVASCRIPT_SPECS } from '../src/curriculum/javascript/course';

const outputDir = resolve(process.cwd(), 'docs/guiones/javascript');
await mkdir(outputDir, { recursive: true });

await Promise.all(JAVASCRIPT_SPECS.map(async (spec) => {
  const number = String(spec.number).padStart(2, '0');
  const body = [
    '---',
    `lesson: javascript-${number}`,
    `title: "${spec.title.replaceAll('"', '\\"')}"`,
    'status: guion_aprobado',
    '---',
    '',
    ...spec.script.flatMap((paragraph) => [paragraph, '']),
  ].join('\n');
  await writeFile(resolve(outputDir, `${number}.md`), body, 'utf8');
}));

const index = ['# Guiones del curso de JavaScript', '', 'Texto hablado solamente. El audio debe coincidir palabra por palabra con estos guiones.', '', ...JAVASCRIPT_SPECS.map((spec) => `- ${String(spec.number).padStart(2, '0')}. ${spec.title}`), ''].join('\n');
await writeFile(resolve(outputDir, 'README.md'), index, 'utf8');
