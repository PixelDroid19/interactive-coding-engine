import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { transform } from 'esbuild';
import { COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS, COMPONENT_COURSE_SPECS } from './course';
import { LEGACY_LIT_MIGRATION } from './legacyMigration';
import { COMPONENT_AUDIO_BY_LESSON } from './audioManifest';

describe('curso profesional de Web Components y Lit', () => {
  const items = COMPONENT_COURSE.modules.flatMap((module) => module.items);
  const lessons = items.filter((item) => item.type === 'scrim');

  it('ofrece 45 unidades completas y separadas de los otros cursos', () => {
    expect(COMPONENT_COURSE.id).toBe('course-web-components-lit');
    expect(COMPONENT_COURSE_SPECS).toHaveLength(45);
    expect(Object.keys(COMPONENT_COURSE_SCRIMS)).toHaveLength(45);
    expect(lessons).toHaveLength(45);
    expect(items.filter((item) => item.type === 'reading')).toHaveLength(45);
    expect(items.filter((item) => item.type === 'reasoning')).toHaveLength(45);
    expect(items.filter((item) => item.type === 'debugging')).toHaveLength(45);
  });

  it('enseña Web Components antes de importar Lit', () => {
    const nativeSource = COMPONENT_COURSE_SPECS.slice(0, 14).map((spec) => `${spec.example}\n${spec.starter}`).join('\n');
    const litSource = COMPONENT_COURSE_SPECS.slice(14).map((spec) => `${spec.example}\n${spec.starter}`).join('\n');
    expect(nativeSource).not.toMatch(/from\s+['"]lit/);
    expect(litSource).toMatch(/from\s+['"]lit/);
  });

  it('usa solamente JavaScript en los workspaces del estudiante', () => {
    for (const lesson of Object.values(COMPONENT_COURSE_SCRIMS)) {
      expect(Object.values(lesson.initialWorkspace.files).some((file) => /\.tsx?$/.test(file.path))).toBe(false);
      expect(lesson.templateId).toBe('lit');
    }
  });

  it('enseña todos los requisitos antes de pedirlos', () => {
    const learned = new Set<string>();
    for (const spec of COMPONENT_COURSE_SPECS) {
      expect(spec.skillsRequired.filter((skill) => !learned.has(skill)), spec.title).toEqual([]);
      spec.skillsIntroduced.forEach((skill) => learned.add(skill));
    }
  });

  it('cada unidad construye, lee, razona y depura sin entregar la solución', () => {
    for (const module of COMPONENT_COURSE.modules) {
      for (let index = 0; index < module.items.length; index += 4) {
        const group = module.items.slice(index, index + 4);
        expect(group.map((item) => item.type)).toEqual(['scrim', 'reading', 'reasoning', 'debugging']);
        const lessonItem = group[0];
        if (lessonItem?.type !== 'scrim') continue;
        const lessonData = COMPONENT_COURSE_SCRIMS[lessonItem.scrimDataId];
        expect(lessonData.challenges).toHaveLength(1);
        expect(lessonData.challenges[0].solutionFiles).toBeUndefined();
        expect(lessonData.challenges[0].tests.some((test) => test.validatorType === 'browser-script')).toBe(true);
        expect(lessonData.challenges[0].hints.map((hint) => hint.text).join(' ')).not.toMatch(/soluci[oó]n\s*:/i);
        const reading = group[1];
        if (reading?.type === 'reading') {
          expect(reading.sections.length).toBeGreaterThanOrEqual(7);
          expect(reading.sources?.length).toBeGreaterThan(0);
          expect(reading.sources?.every((entry) => /developer\.mozilla\.org|lit\.dev|html\.spec\.whatwg\.org|modern-web\.dev/.test(entry.url))).toBe(true);
        }
        const debug = group[3];
        if (debug?.type === 'debugging') expect('solutionFiles' in debug).toBe(false);
      }
    }
  });

  it('explica super antes del ciclo de Lit y vuelve a conectarlo causalmente', () => {
    expect(COMPONENT_COURSE_SPECS[1].title).toContain('super');
    expect(COMPONENT_COURSE_SPECS[1].script.join(' ')).toMatch(/clase base|HTMLElement|cimientos/i);
    expect(COMPONENT_COURSE_SPECS[21].title).toContain('super');
    expect(COMPONENT_COURSE_SPECS[21].script.join(' ')).toMatch(/LitElement|heredad|base/i);
  });

  it('mantiene una voz humana sin repetir las mismas transiciones en todo el curso', () => {
    expect(new Set(COMPONENT_COURSE_SPECS.map((spec) => spec.script[2])).size).toBeGreaterThanOrEqual(8);
    expect(new Set(COMPONENT_COURSE_SPECS.map((spec) => spec.script[5])).size).toBeGreaterThanOrEqual(8);
  });

  it('impide explicaciones superficiales y código ilegible', () => {
    const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
    for (const spec of COMPONENT_COURSE_SPECS) {
      const readingText = [
        spec.reading.mentalModel,
        spec.reading.walkthrough,
        spec.reading.whenToUse,
        spec.reading.bestPractices,
        spec.reading.investigation,
        spec.reading.commonErrors,
        spec.reading.diagram,
      ].join(' ');
      expect(countWords(spec.script.join(' ')), `guion ${spec.number}`).toBeGreaterThanOrEqual(500);
      expect(countWords(readingText), `lectura ${spec.number}`).toBeGreaterThanOrEqual(650);
      for (const code of [spec.example, spec.starter, spec.debug.starter, ...Object.values(spec.supportFiles || {})]) {
        expect(Math.max(...code.split('\n').map((line) => line.length)), `código ${spec.number}`).toBeLessThanOrEqual(120);
      }
    }
  });

  it('mantiene ejemplos y starters como JavaScript válido aunque estén incompletos', async () => {
    for (const spec of COMPONENT_COURSE_SPECS) {
      const codeBlocks = [
        ['ejemplo', spec.example],
        ['starter', spec.starter],
        ['debug', spec.debug.starter],
        ...Object.entries(spec.supportFiles || {}).map(([path, code]) => [`soporte ${path}`, code]),
      ] as const;
      for (const [kind, code] of codeBlocks) {
        await expect(transform(code, { loader: 'js', format: 'esm' }), `${kind} ${spec.number}`).resolves.toBeDefined();
      }
    }
  });

  it('mantiene trazabilidad explícita de las 27 clases heredadas', () => {
    expect(LEGACY_LIT_MIGRATION).toHaveLength(27);
    expect(new Set(LEGACY_LIT_MIGRATION.map((entry) => entry.legacyId)).size).toBe(27);
    const available = new Set(COMPONENT_COURSE_SPECS.map((spec) => spec.number));
    for (const entry of LEGACY_LIT_MIGRATION) {
      expect(entry.migratedTo.length, entry.legacyId).toBeGreaterThan(0);
      expect(entry.migratedTo.every((number) => available.has(number)), entry.legacyId).toBe(true);
      expect(entry.improvement.length, entry.legacyId).toBeGreaterThan(40);
    }
    expect(LEGACY_LIT_MIGRATION.find((entry) => entry.legacyId === '19-mixins')?.migratedTo).toContain(41);
    expect(LEGACY_LIT_MIGRATION.find((entry) => entry.legacyId === '27-proyecto-rele')?.migratedTo).toEqual([41, 42, 43, 44, 45]);
  });

  it('practica arquitectura multifichero en el proyecto Relé', () => {
    const relay = COMPONENT_COURSE_SPECS.find((spec) => spec.number === 45);
    expect(relay?.supportFiles?.['relay-engine.js']).toContain('export function evaluateRelay');
    expect(relay?.starter).toContain("import { evaluateRelay } from './relay-engine.js'");
    const workspace = COMPONENT_COURSE_SCRIMS['componentes-lit-45'].initialWorkspace;
    expect(workspace.files['relay-engine.js']).toBeDefined();
  });

  it('cada laboratorio monta el componente roto que realmente debe depurarse', () => {
    const debuggingItems = items.filter((item) => item.type === 'debugging');
    for (const [index, debugItem] of debuggingItems.entries()) {
      if (debugItem.type !== 'debugging') continue;
      const registeredTags = [...COMPONENT_COURSE_SPECS[index].debug.starter.matchAll(
        /customElements\.define\s*\(\s*['"]([^'"]+)/g,
      )].map((match) => match[1]);
      const browserContract = COMPONENT_COURSE_SPECS[index].debug.tests
        .find((test) => test.validatorType === 'browser-script')
        ?.customValidatorScript;
      const mountedTag = browserContract?.match(/whenDefined\s*\(\s*['"]([^'"]+)/)?.[1]
        ?? registeredTags.at(-1);
      expect(mountedTag, `laboratorio ${index + 1}`).toBeDefined();
      expect(
        debugItem.initialWorkspace.files['index.html'].content,
        `laboratorio ${index + 1} debe montar <${mountedTag}>`,
      ).toContain(`<${mountedTag}`);
    }
  });

  it('cada demostración monta su propia etiqueta o deja una salida observable en consola', () => {
    for (const spec of COMPONENT_COURSE_SPECS) {
      const lesson = COMPONENT_COURSE_SCRIMS[`componentes-lit-${String(spec.number).padStart(2, '0')}`];
      const tags = [...spec.example.matchAll(/customElements\.define\s*\(\s*['"]([^'"]+)/g)]
        .map((match) => match[1]);
      const exampleTag = tags.at(-1);
      if (!exampleTag) {
        expect(spec.example, `demostración ${spec.number} no produce evidencia`).toMatch(/console\.(?:log|table)\s*\(/);
        continue;
      }
      const htmlChanges = lesson.events.flatMap((event) =>
        event.type === 'code-change' && event.filePath === 'index.html' ? [event] : [],
      );
      expect(htmlChanges.length, `demostración ${spec.number} no cambia la página`).toBeGreaterThanOrEqual(2);
      expect(htmlChanges[0].fullContent, `demostración ${spec.number} no monta <${exampleTag}>`).toContain(`<${exampleTag}`);
      expect(htmlChanges.at(-1)?.fullContent, `reto ${spec.number} no recupera su HTML`).toBe(spec.html);
    }
  });

  it('mantiene válidas todas las expresiones de comprobación curricular', () => {
    for (const spec of COMPONENT_COURSE_SPECS) {
      for (const test of [...spec.tests, ...spec.debug.tests]) {
        if (test.validatorType === 'source-regex') {
          expect(() => new RegExp(test.regexPattern || '', 'i'), `${spec.number}: ${test.description}`).not.toThrow();
        } else if (test.validatorType === 'browser-script') {
          expect(
            () => new Function(`return (${test.customValidatorScript});`)(),
            `${spec.number}: ${test.description}`,
          ).not.toThrow();
        }
      }
    }
  });

  it('cada laboratorio conserva una condición incumplida o una comprobación conductual', () => {
    for (const spec of COMPONENT_COURSE_SPECS) {
      const sourceChecks = spec.debug.tests.filter((test) => test.validatorType === 'source-regex');
      expect(sourceChecks.length, `laboratorio ${spec.number} no tiene comprobación de código`).toBeGreaterThan(0);
      const hasUnfulfilledSourceCheck = sourceChecks.some(
        (test) => !new RegExp(test.regexPattern || '', 'i').test(spec.debug.starter),
      );
      if (!hasUnfulfilledSourceCheck) {
        expect(
          spec.debug.tests.some((test) => test.validatorType === 'browser-script'),
          `laboratorio ${spec.number} entrega el código resuelto sin comprobar su comportamiento`,
        ).toBe(true);
      }
    }
  });

  it('cada laboratorio ejecuta comportamiento en navegador salvo el contrato puro de suscripción', () => {
    const sourceOnlyByDesign = new Set([35]);

    for (const spec of COMPONENT_COURSE_SPECS) {
      if (sourceOnlyByDesign.has(spec.number)) continue;
      expect(
        spec.debug.tests.some((test) => test.validatorType === 'browser-script'),
        `laboratorio ${spec.number} solo revisa texto del código`,
      ).toBe(true);
    }
  });

  it('mantiene acotado el ciclo roto del laboratorio 23 para no congelar la práctica', () => {
    const debugStarter = COMPONENT_COURSE_SPECS.find((spec) => spec.number === 23)?.debug.starter ?? '';
    const updatedBody = debugStarter.match(/updated\s*\(\s*\)\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';

    expect(updatedBody).toMatch(/\bif\s*\(/);
    expect(debugStarter).toContain('evita congelar el laboratorio');
  });

  it('mantiene acotada la recreación rota de Task para no congelar el laboratorio 29', () => {
    const debugStarter = COMPONENT_COURSE_SPECS.find((spec) => spec.number === 29)?.debug.starter ?? '';

    expect(debugStarter).toMatch(/if\s*\([^)]*(?:render|creation|intento)/i);
    expect(debugStarter).toContain('evita congelar el laboratorio');
  });

  it('usa 45 audios Gemini 3.1 TTS propios, completos y sincronizados', () => {
    const digest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
    const foreignHashes = new Set<string>();
    for (const prefix of ['fundamentos', 'javascript']) {
      for (let number = 1; number <= 24; number += 1) {
        const path = resolve(process.cwd(), 'public', 'audio', `${prefix}-${String(number).padStart(2, '0')}.mp3`);
        if (existsSync(path)) foreignHashes.add(digest(path));
      }
    }

    for (const spec of COMPONENT_COURSE_SPECS) {
      const number = String(spec.number).padStart(2, '0');
      const id = `componentes-lit-${number}`;
      const audio = COMPONENT_AUDIO_BY_LESSON[id];
      const lesson = COMPONENT_COURSE_SCRIMS[id];
      const mp3 = resolve(process.cwd(), 'public', 'audio', `${id}.mp3`);
      const metadataPath = resolve(process.cwd(), 'public', 'audio', `${id}.json`);
      expect(audio, `${id} no aparece en el manifiesto`).toBeDefined();
      expect(existsSync(mp3), `${id} no tiene MP3`).toBe(true);
      expect(statSync(mp3).size, `${id} contiene un audio vacío`).toBeGreaterThan(100_000);
      expect(foreignHashes.has(digest(mp3)), `${id} reutiliza el audio de otro curso`).toBe(false);

      const metadata = JSON.parse(readFileSync(metadataPath, 'utf8')) as {
        durationMs: number;
        engine: string;
        voice: string;
        transcriptCoverage: number;
        cues: { timestamp: number; end: number; text: string }[];
      };
      expect(metadata.engine).toBe('gemini-3.1-flash-tts-preview');
      expect(metadata.voice).toBe('Aoede');
      expect(metadata.transcriptCoverage, `${id} no cubre el guion`).toBeGreaterThanOrEqual(0.82);
      expect(metadata.cues.map((cue) => cue.text)).toEqual(spec.script);
      expect(audio.durationMs).toBe(metadata.durationMs);
      expect(audio.cues).toEqual(metadata.cues.map((cue) => cue.timestamp));
      expect(audio.ends).toEqual(metadata.cues.map((cue) => cue.end));
      expect(lesson.audioTrack?.url).toBe(audio.url);
      expect(lesson.durationMs).toBe(audio.durationMs);
      expect(lesson.audioTrack?.narrationScript?.map((cue) => cue.timestamp)).toEqual(audio.cues);
      expect(lesson.challenges[0].timestamp).toBeGreaterThanOrEqual(
        Math.min(audio.ends[5], audio.durationMs - 20),
      );
      expect(lesson.challenges[0].timestamp).toBeLessThan(lesson.durationMs);
    }
  });

  it('exporta un guion hablado completo por cada clase', () => {
    for (const spec of COMPONENT_COURSE_SPECS) {
      const number = String(spec.number).padStart(2, '0');
      const guion = readFileSync(resolve(process.cwd(), 'docs/guiones/web-components-lit', `${number}.md`), 'utf8');
      expect(guion).toContain(`lesson: componentes-lit-${number}`);
      for (const paragraph of spec.script) expect(guion).toContain(paragraph);
    }
  });
});
