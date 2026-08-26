import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OPEN_CELLS_SCRIMS } from '../src/curriculum/open-cells/course';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(root, 'docs/guiones/open-cells');
mkdirSync(outputDirectory, { recursive: true });

for (const lesson of Object.values(OPEN_CELLS_SCRIMS).sort((left, right) => left.id.localeCompare(right.id))) {
  const number = lesson.id.replace('open-cells-', '');
  const spoken = (lesson.audioTrack.narrationScript ?? []).map((cue) => cue.text.trim()).filter(Boolean);
  const document = [
    '---',
    `lesson: ${lesson.id}`,
    `title: ${JSON.stringify(lesson.title)}`,
    'status: pendiente-de-voz',
    '---',
    '',
    ...spoken.flatMap((paragraph) => [paragraph, '']),
  ].join('\n');
  writeFileSync(path.join(outputDirectory, `${number}.md`), document, 'utf8');
}

console.log(`Sincronizados ${Object.keys(OPEN_CELLS_SCRIMS).length} guiones Open Cells.`);
