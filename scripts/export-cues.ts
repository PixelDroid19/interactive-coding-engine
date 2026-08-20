import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FUNDAMENTOS_SCRIMS } from '../src/curriculum/fundamentos/course';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'audio');

mkdirSync(OUT, { recursive: true });

for (const lesson of Object.values(FUNDAMENTOS_SCRIMS)) {
  const cues = lesson.audioTrack?.narrationScript || [];
  const payload = {
    id: lesson.id,
    durationMs: lesson.durationMs,
    language: 'es',
    engine: 'pending',
    cues,
  };
  const dest = path.join(OUT, `${lesson.id}.json`);
  writeFileSync(dest, JSON.stringify(payload, null, 2));
  console.log(`Exported ${dest} (${cues.length} cues, ${(lesson.durationMs / 1000).toFixed(1)}s)`);
}
