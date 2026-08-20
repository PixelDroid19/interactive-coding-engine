import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FUNDAMENTOS_SCRIMS } from '../src/curriculum/fundamentos/course';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_AUDIO = path.join(ROOT, 'public', 'audio');
const TMP = path.join(ROOT, '.tmp-audio');
const PIPER_DIR = path.join(ROOT, 'tools', 'piper');
const PIPER_BIN = path.join(PIPER_DIR, 'piper');
const PIPER_VOICE = path.join(PIPER_DIR, 'voices', 'es_MX-claude-high.onnx');

function run(cmd: string, args: string[], options: { input?: string; cwd?: string } = {}) {
  return execFileSync(cmd, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    input: options.input,
    cwd: options.cwd,
  });
}

function probeDurationSec(filePath: string): number {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', filePath],
    { encoding: 'utf8' }
  );
  return Math.max(0.2, Number(out.trim()) || 0.2);
}

function synthesizePiper(text: string, wavPath: string) {
  if (!existsSync(PIPER_BIN) || !existsSync(PIPER_VOICE)) {
    throw new Error('Piper neural voice is not installed. Run the generate script after downloading tools/piper.');
  }
  run(
    PIPER_BIN,
    [
      '--model',
      PIPER_VOICE,
      '--output_file',
      wavPath,
      '--length_scale',
      '1.02',
      '--sentence_silence',
      '0.22',
    ],
    { input: `${text.trim()}\n`, cwd: PIPER_DIR }
  );
}

function synthesizeDia(text: string, wavPath: string): boolean {
  if (process.env.USE_DIA !== '1') return false;
  try {
    run('python3', [path.join(ROOT, 'scripts', 'tts_dia.py'), '--text', text, '--out', wavPath]);
    return existsSync(wavPath);
  } catch {
    return false;
  }
}

function fitClip(srcWav: string, destWav: string, maxSec: number) {
  const duration = probeDurationSec(srcWav);
  if (duration <= maxSec + 0.05) {
    run('ffmpeg', ['-y', '-i', srcWav, destWav]);
    return;
  }
  const tempo = Math.min(1.18, Math.max(1.0, duration / Math.max(0.4, maxSec)));
  run('ffmpeg', ['-y', '-i', srcWav, '-filter:a', `atempo=${tempo.toFixed(3)}`, destWav]);
}

function mixLesson(
  lessonId: string,
  durationMs: number,
  cues: { timestamp: number; text: string }[]
) {
  mkdirSync(TMP, { recursive: true });
  mkdirSync(PUBLIC_AUDIO, { recursive: true });

  const durationSec = Math.max(1, durationMs / 1000);
  const bed = path.join(TMP, `${lessonId}-bed.wav`);
  run('ffmpeg', [
    '-y',
    '-f',
    'lavfi',
    '-i',
    'anullsrc=r=22050:cl=mono',
    '-t',
    durationSec.toFixed(3),
    bed,
  ]);

  const cueFiles: { file: string; delayMs: number }[] = [];

  cues.forEach((cue, index) => {
    const rawPath = path.join(TMP, `${lessonId}-raw-${index}.wav`);
    const wavPath = path.join(TMP, `${lessonId}-cue-${index}.wav`);
    if (!synthesizeDia(cue.text, rawPath)) {
      synthesizePiper(cue.text, rawPath);
    }
    const nextTs = index + 1 < cues.length ? cues[index + 1].timestamp : durationMs - 400;
    const maxSec = Math.max(0.8, (nextTs - cue.timestamp - 120) / 1000);
    fitClip(rawPath, wavPath, maxSec);
    cueFiles.push({ file: wavPath, delayMs: Math.max(0, Math.round(cue.timestamp)) });
  });

  const inputs = ['-y', '-i', bed];
  cueFiles.forEach((cue) => {
    inputs.push('-i', cue.file);
  });

  const filters = cueFiles
    .map((cue, index) => `[${index + 1}]adelay=${cue.delayMs}:all=1[a${index}]`)
    .join(';');
  const mixInputs = ['[0]', ...cueFiles.map((_, index) => `[a${index}]`)].join('');
  const filterComplex = `${filters}${filters ? ';' : ''}${mixInputs}amix=inputs=${cueFiles.length + 1}:duration=first:dropout_transition=0:normalize=0[mix]`;

  const mixed = path.join(TMP, `${lessonId}-mixed.wav`);
  run('ffmpeg', [
    ...inputs,
    '-filter_complex',
    filterComplex,
    '-map',
    '[mix]',
    '-ac',
    '1',
    '-ar',
    '22050',
    mixed,
  ]);

  const normalized = path.join(TMP, `${lessonId}-norm.wav`);
  run('ffmpeg', ['-y', '-i', mixed, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', normalized]);

  const mp3 = path.join(PUBLIC_AUDIO, `${lessonId}.mp3`);
  run('ffmpeg', ['-y', '-i', normalized, '-codec:a', 'libmp3lame', '-qscale:a', '4', mp3]);
  console.log(`Wrote ${mp3} (${cues.length} neural cues, ${(durationMs / 1000).toFixed(1)}s)`);
}

function main() {
  if (!existsSync(PIPER_BIN) || !existsSync(PIPER_VOICE)) {
    throw new Error(
      `Missing Piper voice at ${PIPER_VOICE}. Neural TTS was not installed.`
    );
  }
  mkdirSync(PUBLIC_AUDIO, { recursive: true });
  for (const lesson of Object.values(FUNDAMENTOS_SCRIMS)) {
    const cues = lesson.audioTrack?.narrationScript || [];
    if (cues.length === 0) continue;
    mixLesson(lesson.id, lesson.durationMs, cues);
    writeFileSync(
      path.join(PUBLIC_AUDIO, `${lesson.id}.json`),
      JSON.stringify(
        {
          id: lesson.id,
          durationMs: lesson.durationMs,
          language: lesson.audioTrack?.language || 'es',
          engine: 'piper-es_MX-claude-high',
          cues,
        },
        null,
        2
      )
    );
  }
  if (existsSync(TMP)) {
    rmSync(TMP, { recursive: true, force: true });
  }
}

main();
