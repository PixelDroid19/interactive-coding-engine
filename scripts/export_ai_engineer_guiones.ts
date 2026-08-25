import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { AI_SPECS_01_TO_27 } from '../src/curriculum/ai-engineer/modules';

const outputDirectory = path.resolve('docs/guiones/ai-engineer');
await mkdir(outputDirectory, { recursive: true });

for (const spec of AI_SPECS_01_TO_27) {
  const number = String(spec.number).padStart(2, '0');
  const header = [
    '---',
    `lesson: ai-engineer-${number}`,
    `title: ${JSON.stringify(spec.title)}`,
    'mode: silent',
    '---',
    '',
  ];
  const markdown = [...header, ...spec.script.flatMap((paragraph) => [paragraph, ''])].join('\n').trimEnd() + '\n';
  await writeFile(path.join(outputDirectory, `${number}.md`), markdown, 'utf8');
}
