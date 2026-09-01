import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Course, ReadingItem, ReasoningAttempt, ReasoningExerciseItem } from '../types/curriculum';
import type { ScrimEvent, ScrimLessonData, WorkspaceSnapshot } from '../types/scrim';
import { reconstructWorkspaceAt } from '../engine/eventLog';
import { validateReasoningAttempt } from '../engine/reasoningRunner';
import { R2_AUDIO_BY_LESSON } from '../config/r2Audio';
import { FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS } from './fundamentos/course';
import { JAVASCRIPT_COURSE, JAVASCRIPT_SCRIMS } from './javascript/course';
import { COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS } from './web-components-lit/course';
import { OPEN_CELLS_COURSE, OPEN_CELLS_SCRIMS } from './open-cells/course';

type ScrimCatalog = Record<string, ScrimLessonData>;

const CATALOGS: Array<[Course, ScrimCatalog]> = [
  [FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS],
  [JAVASCRIPT_COURSE, JAVASCRIPT_SCRIMS],
  [COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS],
  [OPEN_CELLS_COURSE, OPEN_CELLS_SCRIMS],
];

const EXPECTED_LESSONS = new Map([
  [FUNDAMENTOS_COURSE.id, 24],
  [JAVASCRIPT_COURSE.id, 24],
  [COMPONENT_COURSE.id, 45],
  [OPEN_CELLS_COURSE.id, 84],
]);

function allItems(course: Course) {
  return course.modules.flatMap((module) => module.items);
}

function expectWorkspace(id: string, workspace: WorkspaceSnapshot) {
  const entries = Object.entries(workspace.files);
  expect(entries.length, `${id} no tiene archivos`).toBeGreaterThan(0);
  expect(workspace.files[workspace.activeFilePath], `${id} abre un archivo inexistente`).toBeDefined();
  for (const [key, file] of entries) {
    expect(file.path, `${id}/${key} no conserva la ruta como clave`).toBe(key);
    expect(file.name.trim(), `${id}/${key} no tiene nombre`).toBeTruthy();
    expect(file.content, `${id}/${key} contiene bytes nulos`).not.toContain('\0');
  }
}

function expectedReasoningAttempt(item: ReasoningExerciseItem): ReasoningAttempt {
  const activity = item.activity;
  if (activity.kind === 'sequence') return { kind: 'sequence', order: activity.expectedOrder };
  if (activity.kind === 'trace-table') return { kind: 'trace-table', cells: activity.expectedCells };
  if (activity.kind === 'decision-table') return { kind: 'decision-table', outcomes: activity.expectedOutcomes };
  if (activity.kind === 'flowchart') return { kind: 'flowchart', connections: activity.expectedConnections };
  if (activity.kind === 'dependency-map') return { kind: 'dependency-map', dependencies: activity.expectedDependencies };
  if (activity.kind === 'vector-ranking') return { kind: 'vector-ranking', order: activity.expectedOrder };
  return { kind: 'context-budget', selected: activity.expectedSelected };
}

function eventFilePath(event: ScrimEvent): string | undefined {
  if ('filePath' in event) return event.filePath;
  return undefined;
}

describe('auditoría exhaustiva de las clases fuera de AI Engineer', () => {
  it('recorre exactamente las 177 clases publicadas de los cuatro cursos solicitados', () => {
    const lessonIds: string[] = [];
    const itemIds: string[] = [];

    for (const [course, scrims] of CATALOGS) {
      const scrimItems = allItems(course).filter((item) => item.type === 'scrim');
      expect(scrimItems, `${course.id} no coincide con su catálogo`).toHaveLength(EXPECTED_LESSONS.get(course.id));
      expect(Object.keys(scrims), `${course.id} tiene cintas huérfanas`).toHaveLength(scrimItems.length);
      expect(new Set(scrimItems.map((item) => item.scrimDataId))).toEqual(new Set(Object.keys(scrims)));
      lessonIds.push(...Object.keys(scrims));
      itemIds.push(...allItems(course).map((item) => item.id));
    }

    expect(lessonIds).toHaveLength(177);
    expect(new Set(lessonIds).size, 'hay identificadores de clase repetidos').toBe(lessonIds.length);
    expect(new Set(itemIds).size, 'hay identificadores curriculares repetidos').toBe(itemIds.length);
    expect(lessonIds.some((id) => id.startsWith('ai-engineer-'))).toBe(false);
  });

  it('valida metadatos, archivos y progresión temporal de cada cinta', () => {
    for (const [, scrims] of CATALOGS) {
      for (const [catalogId, lesson] of Object.entries(scrims)) {
        expect(lesson.id, `${catalogId} no coincide con la cinta`).toBe(catalogId);
        expect(lesson.title.trim().length, `${lesson.id} no tiene título`).toBeGreaterThan(4);
        expect(lesson.description.trim().length, `${lesson.id} no tiene descripción`).toBeGreaterThan(20);
        expect(lesson.durationMs, `${lesson.id} tiene una duración inválida`).toBeGreaterThan(1_000);
        expectWorkspace(lesson.id, lesson.initialWorkspace);
        expect(lesson.skillsIntroduced.length, `${lesson.id} no introduce una capacidad`).toBeGreaterThan(0);
        expect(lesson.learningObjectives.length, `${lesson.id} no declara objetivos`).toBeGreaterThanOrEqual(2);
        expect(lesson.commonMistakes.length, `${lesson.id} no anticipa errores`).toBeGreaterThanOrEqual(2);

        const eventIds = lesson.events.map((event) => event.id);
        const timestamps = lesson.events.map((event) => event.timestamp);
        expect(new Set(eventIds).size, `${lesson.id} repite eventos`).toBe(eventIds.length);
        expect(timestamps, `${lesson.id} tiene eventos desordenados`).toEqual([...timestamps].sort((a, b) => a - b));
        expect(Math.min(...timestamps), `${lesson.id} empieza antes de cero`).toBeGreaterThanOrEqual(0);
        expect(Math.max(...timestamps), `${lesson.id} termina después del audio`).toBeLessThanOrEqual(lesson.durationMs);
        expect(lesson.events.some((event) => event.type === 'code-change'), `${lesson.id} no modifica código`).toBe(true);
        expect(lesson.events.some((event) => event.type === 'run-code'), `${lesson.id} no ejecuta el resultado`).toBe(true);

        for (const event of lesson.events) {
          const path = eventFilePath(event);
          if (!path || event.type === 'file-create' || event.type === 'file-delete') continue;
          const workspace = reconstructWorkspaceAt(lesson.initialWorkspace, lesson.events, lesson.snapshots, event.timestamp).workspace;
          expect(workspace.files[path], `${lesson.id}/${event.id} usa un archivo inexistente: ${path}`).toBeDefined();
        }

        const snapshotTimes = lesson.snapshots.map((snapshot) => snapshot.timestamp);
        expect(snapshotTimes, `${lesson.id} tiene snapshots desordenados`).toEqual([...snapshotTimes].sort((a, b) => a - b));
        for (const snapshot of lesson.snapshots) {
          expect(snapshot.timestamp, `${lesson.id} tiene un snapshot fuera de la cinta`).toBeLessThanOrEqual(lesson.durationMs);
          expect(snapshot.eventIndex, `${lesson.id} apunta fuera del log`).toBeLessThanOrEqual(lesson.events.length);
          expectWorkspace(`${lesson.id}@${snapshot.timestamp}`, snapshot.workspace);
        }

        const chapterTimes = (lesson.chapters ?? []).map((chapter) => chapter.timestamp);
        expect(chapterTimes, `${lesson.id} tiene capítulos desordenados`).toEqual([...chapterTimes].sort((a, b) => a - b));
        expect(new Set((lesson.chapters ?? []).map((chapter) => chapter.title)).size, `${lesson.id} repite capítulos`)
          .toBe(lesson.chapters?.length ?? 0);
        for (const chapter of lesson.chapters ?? []) {
          expect(chapter.timestamp, `${lesson.id}/${chapter.title} queda fuera del audio`).toBeLessThan(lesson.durationMs);
        }
      }
    }
  });

  it('comprueba que cada audio y cada guion pertenecen a su clase', () => {
    for (const [, scrims] of CATALOGS) {
      for (const lesson of Object.values(scrims)) {
        const published = R2_AUDIO_BY_LESSON[lesson.id];
        const metadataPath = resolve(process.cwd(), 'public', 'audio', `${lesson.id}.json`);
        expect(existsSync(metadataPath), `${lesson.id} no tiene descriptor de audio`).toBe(true);
        const metadata = JSON.parse(readFileSync(metadataPath, 'utf8')) as { durationMs: number; script: string };
        expect(published, `${lesson.id} no está publicado en R2`).toBeDefined();
        expect(lesson.narrationMode ?? 'audio', `${lesson.id} no usa audio real`).toBe('audio');
        expect(lesson.audioTrack?.url, `${lesson.id} no resuelve al objeto publicado`).toBe(published.url);
        expect(lesson.audioTrack?.durationMs, `${lesson.id} no conserva la duración del audio`).toBe(lesson.durationMs);
        expect(metadata.durationMs, `${lesson.id} difiere del descriptor local`).toBe(lesson.durationMs);
        expect(published.objectKey, `${lesson.id} usa una clave opaca`).toMatch(/audio\/[a-z0-9-]+\/\d{2}-[a-z0-9-]+--[a-f0-9]{12}\.mp3$/);
        expect(published.objectKey, `${lesson.id} no incluye su hash`).toContain(published.sha256.slice(0, 12));

        const cues = lesson.audioTrack?.narrationScript ?? [];
        expect(cues.length, `${lesson.id} no tiene subtítulos`).toBeGreaterThanOrEqual(4);
        expect(cues.map((cue) => cue.timestamp), `${lesson.id} tiene subtítulos desordenados`)
          .toEqual(cues.map((cue) => cue.timestamp).sort((a, b) => a - b));
        expect(cues.at(-1)!.timestamp, `${lesson.id} tiene subtítulos fuera del audio`).toBeLessThan(lesson.durationMs);
        expect(cues.every((cue) => cue.text.trim().split(/\s+/).length >= 3), `${lesson.id} tiene subtítulos vacíos o rotos`).toBe(true);

        const scriptPath = resolve(process.cwd(), metadata.script);
        expect(existsSync(scriptPath), `${lesson.id} no tiene guion`).toBe(true);
        const script = readFileSync(scriptPath, 'utf8');
        expect(script, `${lesson.id} tiene un guion asignado a otra clase`)
          .toMatch(new RegExp(`(?:lesson:\\s*${lesson.id}|archivo:\\s*${lesson.id}\\.mp3)`));
        for (const cue of cues) expect(script, `${lesson.id} no contiene el subtítulo “${cue.text}”`).toContain(cue.text);
      }
    }
  });

  it('revisa todas las lecturas y actividades de razonamiento vinculadas', () => {
    for (const [course, scrims] of CATALOGS) {
      const items = allItems(course);
      const lessonIds = new Set(Object.keys(scrims));
      const readings = items.filter((item): item is ReadingItem => item.type === 'reading');
      const reasoning = items.filter((item): item is ReasoningExerciseItem => item.type === 'reasoning');

      expect(readings, `${course.id} no tiene una lectura por clase`).toHaveLength(Object.keys(scrims).length);
      for (const reading of readings) {
        expect(lessonIds.has(reading.relatedLessonId ?? ''), `${reading.id} apunta a una clase inexistente`).toBe(true);
        expect(reading.summary.trim().length, `${reading.id} no orienta al estudiante`).toBeGreaterThan(50);
        expect(reading.sections.length, `${reading.id} desarrolla poco el concepto`).toBeGreaterThanOrEqual(3);
        expect(reading.sections.some((section) => Boolean(section.example?.trim())), `${reading.id} no ofrece ejemplo`).toBe(true);
        expect(reading.keyPoints.length, `${reading.id} no resume lo esencial`).toBeGreaterThanOrEqual(3);
        expect(reading.frequentQuestions?.length, `${reading.id} no aclara dudas`).toBeGreaterThanOrEqual(2);
      }

      for (const item of reasoning) {
        expect(lessonIds.has(item.relatedLessonId), `${item.id} apunta a una clase inexistente`).toBe(true);
        expect(item.hints.map((hint) => hint.level), `${item.id} no gradúa sus pistas`).toEqual([1, 2, 3]);
        expect(item.explanation.trim().length, `${item.id} no explica la respuesta`).toBeGreaterThan(60);
        expect(validateReasoningAttempt(item.activity, expectedReasoningAttempt(item)).allPassed, `${item.id} no se puede resolver`).toBe(true);
      }

      expect(new Set(reasoning.map((item) => item.explanation)).size, `${course.id} repite feedback genérico`)
        .toBe(reasoning.length);
    }
  });
});
