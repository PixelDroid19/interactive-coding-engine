import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS } from '../fundamentos/course';
import { reconstructWorkspaceAt } from '../../engine/eventLog';
import { runChallengeValidation } from '../../engine/testRunner';
import { JAVASCRIPT_COURSE, JAVASCRIPT_SCRIMS, JAVASCRIPT_SPECS } from './course';
import { JAVASCRIPT_AUDIO_BY_LESSON } from './audioManifest';

describe('curso de JavaScript independiente y progresivo', () => {
  const ordered = JAVASCRIPT_COURSE.modules.flatMap((module) => module.items.filter((item) => item.type === 'scrim'));

  it('mantiene Fundamentos separado y sin sustituir sus clases', () => {
    expect(JAVASCRIPT_COURSE.id).not.toBe(FUNDAMENTOS_COURSE.id);
    expect(Object.keys(FUNDAMENTOS_SCRIMS)).toHaveLength(24);
    expect(Object.keys(JAVASCRIPT_SCRIMS)).toHaveLength(24);
    expect(ordered.map((item) => item.id)).toEqual(Array.from({ length: 24 }, (_, index) => `javascript-${String(index + 1).padStart(2, '0')}`));
  });

  it('enseña todos los requisitos antes de utilizarlos', () => {
    const learned = new Set<string>();
    for (const item of ordered) {
      const lesson = JAVASCRIPT_SCRIMS[item.scrimDataId];
      expect(lesson.skillsRequired.filter((skill) => !learned.has(skill)), lesson.id).toEqual([]);
      lesson.skillsIntroduced.forEach((skill) => learned.add(skill));
    }
  });

  it('coloca lectura, razonamiento y laboratorio distintos después de cada clase', () => {
    for (const module of JAVASCRIPT_COURSE.modules) {
      for (let index = 0; index < module.items.length; index += 1) {
        const item = module.items[index];
        if (item.type !== 'scrim') continue;
        const reading = module.items[index + 1];
        const reasoning = module.items[index + 2];
        const debug = module.items[index + 3];
        expect(reading?.type, `${item.id} no tiene lectura`).toBe('reading');
        expect(reasoning?.type, `${item.id} no tiene práctica de razonamiento`).toBe('reasoning');
        expect(debug?.type, `${item.id} no tiene laboratorio`).toBe('debugging');
        if (reading?.type === 'reading') {
          expect(reading.relatedLessonId).toBe(item.id);
          expect(reading.sources?.length, `${reading.id} no tiene documentación`).toBeGreaterThan(0);
          expect(reading.sources?.every((entry) => /developer\.mozilla\.org|tc39\.es/.test(entry.url))).toBe(true);
        }
        if (reasoning?.type === 'reasoning') {
          expect(reasoning.relatedLessonId).toBe(item.id);
          expect(reasoning.hints.length).toBe(3);
        }
        if (debug?.type === 'debugging') {
          expect(debug.relatedLessonId).toBe(item.id);
          expect('solutionFiles' in debug).toBe(false);
          expect(debug.tests.length).toBeGreaterThanOrEqual(2);
          expect(debug.hints.length).toBe(3);
        }
      }
    }
  });

  it('no entrega un starter que ya supere el reto de la clase', async () => {
    for (const item of ordered) {
      const lesson = JAVASCRIPT_SCRIMS[item.scrimDataId];
      const challenge = lesson.challenges[0];
      expect(challenge, `${lesson.id} no tiene reto`).toBeTruthy();
      expect(challenge.solutionFiles).toBeUndefined();
      const workspace = reconstructWorkspaceAt(lesson.initialWorkspace, lesson.events, lesson.snapshots, challenge.timestamp).workspace;
      const result = await runChallengeValidation(challenge, workspace);
      expect(result.allPassed, `${lesson.id} ya trae resuelto el reto`).toBe(false);
    }
  });

  it('entrega los 24 laboratorios realmente rotos y sin una solución incluida', async () => {
    const labs = JAVASCRIPT_COURSE.modules
      .flatMap((module) => module.items)
      .filter((item) => item.type === 'debugging');

    expect(labs).toHaveLength(24);
    for (const lab of labs) {
      expect('solutionFiles' in lab, `${lab.id} incluye una solución`).toBe(false);
      const result = await runChallengeValidation({
        id: lab.id,
        title: lab.title,
        timestamp: 0,
        instructions: lab.description,
        tests: lab.tests,
        hints: [],
      }, lab.initialWorkspace);
      expect(result.allPassed, `${lab.id} ya llega resuelto`).toBe(false);
    }
  });

  it('mantiene el guion hablado humano como fuente de subtítulos y documento', () => {
    for (const spec of JAVASCRIPT_SPECS) {
      const id = `javascript-${String(spec.number).padStart(2, '0')}`;
      const lesson = JAVASCRIPT_SCRIMS[id];
      const spoken = lesson.audioTrack?.narrationScript.map((cue) => cue.text) ?? [];
      expect(spoken).toEqual(spec.script);
      const guion = readFileSync(resolve(process.cwd(), `docs/guiones/javascript/${String(spec.number).padStart(2, '0')}.md`), 'utf8');
      for (const paragraph of spec.script) expect(guion).toContain(paragraph);
    }
  });

  it('reserva APIs avanzadas hasta su explicación', () => {
    const sourceUntil = (last: number) => JAVASCRIPT_SPECS.slice(0, last).map((spec) => [spec.example, spec.starter, spec.debug.starter].join('\n')).join('\n');
    expect(sourceUntil(8)).not.toMatch(/\[[^\]]*,[^\]]*\]|\.map\s*\(|\.filter\s*\(/);
    expect(sourceUntil(12)).not.toMatch(/document\.|addEventListener|createElement/);
    expect(sourceUntil(17)).not.toMatch(/\bawait\b|\bfetch\s*\(/);
    expect(sourceUntil(21)).not.toMatch(/\bclass\s+|customElements|attachShadow/);
  });

  it('acepta sintaxis de módulo al validar una exportación nombrada', async () => {
    const lesson = JAVASCRIPT_SCRIMS['javascript-21'];
    const challenge = lesson.challenges[0];
    const workspace = reconstructWorkspaceAt(lesson.initialWorkspace, lesson.events, lesson.snapshots, challenge.timestamp).workspace;
    workspace.files['app.js'].content = 'export function esPrioridadValida(prioridad) {\n  return prioridad >= 1 && prioridad <= 3;\n}\n';

    const result = await runChallengeValidation(challenge, workspace);
    expect(result.allPassed, result.feedbackMessage).toBe(true);
  });

  it('usa los 24 MP3 de Gemini 3.1 TTS con su duración real', () => {
    expect(Object.keys(JAVASCRIPT_AUDIO_BY_LESSON)).toHaveLength(24);
    for (const item of ordered) {
      const lesson = JAVASCRIPT_SCRIMS[item.scrimDataId];
      const audio = JAVASCRIPT_AUDIO_BY_LESSON[lesson.id];
      const mp3 = resolve(process.cwd(), `public/audio/${lesson.id}.mp3`);
      const metadata = JSON.parse(readFileSync(resolve(process.cwd(), `public/audio/${lesson.id}.json`), 'utf8')) as {
        engine: string;
        durationMs: number;
        voice: string;
        cues: { timestamp: number; end: number; text: string }[];
      };

      expect(statSync(mp3).size, `${lesson.id} no contiene audio`).toBeGreaterThan(10_000);
      expect(metadata.engine).toBe('gemini-3.1-flash-tts-preview');
      expect(metadata.voice).toBe('Aoede');
      expect(metadata.durationMs).toBe(audio.durationMs);
      expect(lesson.audioTrack?.url).toBe(audio.url);
      expect(lesson.durationMs).toBe(audio.durationMs);
      expect(metadata.cues.map((cue) => cue.timestamp)).toEqual(audio.cues);
      expect(metadata.cues.map((cue) => cue.end)).toEqual(audio.ends);
      expect(lesson.audioTrack?.narrationScript.map((cue) => cue.timestamp)).toEqual(audio.cues);
      expect(lesson.challenges[0].timestamp).toBeGreaterThan(metadata.cues[3].end);
      expect(lesson.challenges[0].timestamp).toBeLessThan(lesson.durationMs);
    }
  });

  it('usa grabaciones propias y no copia audios de Fundamentos', () => {
    const digest = (filePath: string) => createHash('sha256').update(readFileSync(filePath)).digest('hex');
    const fundamentosHashes = new Set(Array.from({ length: 24 }, (_, index) => {
      const number = String(index + 1).padStart(2, '0');
      return digest(resolve(process.cwd(), `public/audio/fundamentos-${number}.mp3`));
    }));

    const javascriptHashes = ordered.map((item) => digest(resolve(process.cwd(), `public/audio/${item.id}.mp3`)));
    expect(new Set(javascriptHashes)).toHaveLength(24);
    expect(javascriptHashes.filter((hash) => fundamentosHashes.has(hash))).toEqual([]);
  });
});
