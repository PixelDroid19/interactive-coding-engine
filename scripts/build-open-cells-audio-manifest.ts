import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO = path.join(ROOT, 'public', 'audio');
const OUTPUT = path.join(ROOT, 'src', 'curriculum', 'open-cells', 'audioManifest.ts');
const MODEL = 'gemini-3.1-flash-tts-preview';
const CACHE_VERSION = 'gemini-20260828';

const entries: string[] = [];
for (let number = 1; number <= 84; number += 1) {
  const suffix = String(number).padStart(2, '0');
  const id = `open-cells-${suffix}`;
  const mp3 = path.join(AUDIO, `${id}.mp3`);
  const metadataPath = path.join(AUDIO, `${id}.json`);
  if (!existsSync(mp3) || !existsSync(metadataPath)) {
    throw new Error(`Falta audio o metadata para ${id}.`);
  }
  const metadata = JSON.parse(readFileSync(metadataPath, 'utf8')) as {
    durationMs?: number;
    engine?: string;
    script?: string;
  };
  if (metadata.engine !== MODEL) throw new Error(`${id} no fue generado con ${MODEL}.`);
  if (!Number.isFinite(metadata.durationMs) || Number(metadata.durationMs) <= 0) throw new Error(`${id} no tiene duración válida.`);
  if (metadata.script !== `docs/guiones/open-cells/${suffix}.md`) throw new Error(`${id} no corresponde a su guion actual.`);
  entries.push(`  '${id}': { url: '/audio/${id}.mp3?v=${CACHE_VERSION}', durationMs: ${Math.round(Number(metadata.durationMs))} },`);
}

writeFileSync(OUTPUT, [
  '// Generado por scripts/build-open-cells-audio-manifest.ts. No edites duraciones a mano.',
  'export const OPEN_CELLS_AUDIO_BY_LESSON: Record<string, { url: string; durationMs: number }> = {',
  ...entries,
  '};',
  '',
].join('\n'));

console.log(`Manifiesto Open Cells actualizado con ${entries.length} audios.`);
