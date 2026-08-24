import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Modality } from '@google/genai';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO = path.join(ROOT, 'public', 'audio');
const TMP = path.join(ROOT, '.tmp-gemini-audio');
const MODEL = 'gemini-3.1-flash-tts-preview';
const VOICE = 'Aoede';

interface ScriptData {
  id: string;
  number: string;
  title: string;
  transcript: string;
  sourceFile: string;
}

function parseArgs() {
  const courseArg = process.argv.find((arg) => arg.startsWith('--course='));
  const course = courseArg?.split('=', 2)[1] ?? 'fundamentos';
  const lessonArg = process.argv.find((arg) => arg.startsWith('--lesson='));
  const fromArg = process.argv.find((arg) => arg.startsWith('--from='));
  const lesson = lessonArg?.split('=', 2)[1]?.padStart(2, '0');
  const from = fromArg?.split('=', 2)[1]?.padStart(2, '0');
  if (process.argv.includes('--help')) {
    console.log('Uso: GEMINI_API_KEY=... npm run audio:gemini -- [--course=fundamentos|javascript] [--lesson=01 | --from=02]');
    process.exit(0);
  }
  if (lesson && !/^\d{2}$/.test(lesson)) {
    throw new Error('--lesson debe ser un número entre 01 y 24.');
  }
  if (from && !/^\d{2}$/.test(from)) {
    throw new Error('--from debe ser un número entre 01 y 24.');
  }
  if (lesson && from) throw new Error('Usa --lesson o --from, no ambos.');
  if (course !== 'fundamentos' && course !== 'javascript') throw new Error('--course debe ser fundamentos o javascript.');
  return { course, lesson, from };
}

function loadScripts(course: string, onlyLesson?: string, fromLesson?: string): ScriptData[] {
  const scriptsDir = course === 'javascript'
    ? path.join(ROOT, 'docs', 'guiones', 'javascript')
    : path.join(ROOT, 'docs', 'guiones');
  const files = execFileSync('find', [scriptsDir, '-maxdepth', '1', '-type', 'f', '-name', '[0-9][0-9]*.md'], {
    encoding: 'utf8',
  })
    .trim()
    .split('\n')
    .filter(Boolean)
    .sort();

  const scripts: ScriptData[] = [];
  for (const file of files) {
    const markdown = readFileSync(file, 'utf8');
    const lessonMatch = course === 'javascript'
      ? markdown.match(/^lesson:\s*javascript-(\d{2})$/m)
      : markdown.match(/^archivo:\s*fundamentos-(\d{2})\.mp3$/m);
    const titleMatch = markdown.match(/^(?:titulo|title):\s*"([^"]+)"$/m);
    const bodyMatch = markdown.match(/^---\n[\s\S]*?\n---\n+([\s\S]+)$/);
    if (!lessonMatch || !titleMatch || !bodyMatch) continue;
    if (onlyLesson && lessonMatch[1] !== onlyLesson) continue;
    if (fromLesson && lessonMatch[1] < fromLesson) continue;
    const transcript = bodyMatch[1].trim();
    if (!transcript) throw new Error(`El guion ${file} no tiene texto hablado.`);
    scripts.push({ id: `${course}-${lessonMatch[1]}`, number: lessonMatch[1], title: titleMatch[1], transcript, sourceFile: file });
  }
  if (onlyLesson && scripts.length !== 1) {
    throw new Error(`No se encontró el guion de la lección ${onlyLesson}.`);
  }
  if (!onlyLesson && !fromLesson && scripts.length !== 24) {
    throw new Error(`Se esperaban 24 guiones y se encontraron ${scripts.length}.`);
  }
  return scripts;
}

function wavHeader(dataLength: number, sampleRate: number, channels = 1, bitsPerSample = 16) {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * channels * bitsPerSample / 8;
  const blockAlign = channels * bitsPerSample / 8;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

function audioContainer(data: Buffer, mimeType: string): { buffer: Buffer; extension: string } {
  const normalized = mimeType.toLowerCase();
  if (normalized.includes('wav')) return { buffer: data, extension: 'wav' };
  if (normalized.includes('mpeg') || normalized.includes('mp3')) return { buffer: data, extension: 'mp3' };

  const rate = Number(mimeType.match(/rate=(\d+)/i)?.[1] ?? 24000);
  const bits = Number(mimeType.match(/audio\/L(\d+)/i)?.[1] ?? 16);
  return {
    buffer: Buffer.concat([wavHeader(data.length, rate, 1, bits), data]),
    extension: 'wav',
  };
}

function durationMs(file: string) {
  const seconds = Number(execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file],
    { encoding: 'utf8' },
  ).trim());
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error(`No se pudo medir ${file}.`);
  return Math.round(seconds * 1000);
}

async function withRetry<T>(operation: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === 4) break;
      const waitMs = 1500 * 2 ** (attempt - 1);
      console.warn(`${label}: intento ${attempt} falló; se reintentará en ${waitMs / 1000}s.`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}

function promptFor(script: ScriptData) {
  return `Lee el siguiente guion completo y respeta exactamente sus palabras. No añadas títulos ni comentarios.\n\nIndicaciones de dirección:\n- Voz cálida, paciente y cercana.\n- Español latino neutro.\n- Ritmo conversacional, claro para una persona que nunca ha programado.\n- Pausas breves entre párrafos.\n- Pronuncia los términos de código con naturalidad y sin dramatizar.\n\nGuion:\n${script.transcript}`;
}

function requestFor(script: ScriptData) {
  return {
    contents: [{ role: 'user', parts: [{ text: promptFor(script) }] }],
    config: {
      temperature: 0.8,
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: VOICE },
        },
      },
    },
  };
}

function saveAudio(script: ScriptData, data: Buffer, mimeType: string) {
  const label = script.id;
  const result = audioContainer(data, mimeType);
  mkdirSync(AUDIO, { recursive: true });
  mkdirSync(TMP, { recursive: true });
  const source = path.join(TMP, `${label}.${result.extension}`);
  const staged = path.join(TMP, `${label}.mp3`);
  const destination = path.join(AUDIO, `${label}.mp3`);
  writeFileSync(source, result.buffer);
  execFileSync('ffmpeg', [
    '-y', '-v', 'error', '-i', source,
    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
    '-codec:a', 'libmp3lame', '-qscale:a', '3', staged,
  ]);
  const measured = durationMs(staged);
  renameSync(staged, destination);
  rmSync(source, { force: true });
  writeFileSync(path.join(AUDIO, `${label}.json`), JSON.stringify({
    id: label,
    durationMs: measured,
    language: 'es',
    engine: MODEL,
    voice: VOICE,
    script: path.relative(ROOT, script.sourceFile),
  }, null, 2));
  console.log(`  ${path.relative(ROOT, destination)} · ${(measured / 1000).toFixed(1)}s`);
}

async function generateLesson(ai: GoogleGenAI, script: ScriptData) {
  const label = script.id;
  console.log(`[${script.number}/24] Generando ${script.title}…`);
  const result = await withRetry(async () => {
    const response = await ai.models.generateContentStream({ model: MODEL, ...requestFor(script) });

    const chunks: Buffer[] = [];
    let mimeType = '';
    for await (const chunk of response) {
      for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
        const inline = part.inlineData;
        if (!inline?.data) continue;
        mimeType ||= inline.mimeType ?? '';
        chunks.push(Buffer.from(inline.data, 'base64'));
      }
    }
    if (chunks.length === 0) throw new Error(`Gemini no devolvió audio para ${label}.`);
    return { data: Buffer.concat(chunks), mimeType };
  }, label);
  saveAudio(script, result.data, result.mimeType);
}

async function main() {
  const { course, lesson, from } = parseArgs();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Falta GEMINI_API_KEY en el entorno. La clave no debe guardarse en archivos.');
  const ai = new GoogleGenAI({ apiKey });
  const scripts = loadScripts(course, lesson, from);
  for (const script of scripts) await generateLesson(ai, script);
  if (course === 'javascript') {
    console.log('Ejecuta npm run audio:align:javascript para actualizar marcas y manifiesto.');
  }
  rmSync(TMP, { recursive: true, force: true });
  console.log(`Generación terminada: ${scripts.length} ${scripts.length === 1 ? 'lección' : 'lecciones'}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
