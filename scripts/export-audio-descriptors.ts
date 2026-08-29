import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS } from '../src/curriculum/fundamentos/course';
import { JAVASCRIPT_COURSE, JAVASCRIPT_SCRIMS } from '../src/curriculum/javascript/course';
import { COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS } from '../src/curriculum/web-components-lit/course';
import { OPEN_CELLS_COURSE, OPEN_CELLS_SCRIMS } from '../src/curriculum/open-cells/course';
import type { Course } from '../src/types/curriculum';
import type { ScrimLessonData } from '../src/types/scrim';

type AudioDescriptor = Readonly<{
  courseSlug: string;
  courseTitle: string;
  lessonId: string;
  lessonNumber: number;
  lessonTitle: string;
  sourceName: string;
  durationMs: number;
}>;

const catalogs: ReadonlyArray<Readonly<{ course: Course; scrims: Record<string, ScrimLessonData> }>> = [
  { course: FUNDAMENTOS_COURSE, scrims: FUNDAMENTOS_SCRIMS },
  { course: JAVASCRIPT_COURSE, scrims: JAVASCRIPT_SCRIMS },
  { course: COMPONENT_COURSE, scrims: COMPONENT_COURSE_SCRIMS },
  { course: OPEN_CELLS_COURSE, scrims: OPEN_CELLS_SCRIMS },
];

const { values } = parseArgs({
  args: process.argv.slice(2).filter((argument) => argument !== '--'),
  options: { output: { type: 'string' } },
});
const output = resolve(values.output ?? '../learning-platform-backend/content/audio-descriptors.json');
const entries: AudioDescriptor[] = [];

for (const { course, scrims } of catalogs) {
  for (const lesson of Object.values(scrims).sort((left, right) => left.id.localeCompare(right.id, 'en', { numeric: true }))) {
    if (!lesson.audioTrack?.url) throw new Error(`${lesson.id} no declara una fuente de audio.`);
    const number = Number(lesson.id.match(/(\d+)$/)?.[1]);
    if (!Number.isInteger(number) || number < 1) throw new Error(`${lesson.id} no contiene un número de lección válido.`);
    entries.push({
      courseSlug: course.slug,
      courseTitle: course.title,
      lessonId: lesson.id,
      lessonNumber: number,
      lessonTitle: lesson.title,
      sourceName: `${lesson.id}.mp3`,
      durationMs: lesson.audioTrack.durationMs,
    });
  }
}

const duplicated = entries.find((entry, index) => entries.findIndex((candidate) => candidate.lessonId === entry.lessonId) !== index);
if (duplicated) throw new Error(`Lección duplicada en el inventario: ${duplicated.lessonId}.`);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ generatedAt: new Date().toISOString(), entries }, null, 2)}\n`);
console.log(JSON.stringify({ output, audios: entries.length, courses: catalogs.map(({ course, scrims }) => ({ slug: course.slug, lessons: Object.keys(scrims).length })) }, null, 2));
