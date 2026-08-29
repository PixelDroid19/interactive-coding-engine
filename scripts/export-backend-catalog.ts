import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS } from '../src/curriculum/fundamentos/course';
import { JAVASCRIPT_COURSE, JAVASCRIPT_SCRIMS } from '../src/curriculum/javascript/course';
import { COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS } from '../src/curriculum/web-components-lit/course';
import { OPEN_CELLS_COURSE, OPEN_CELLS_SCRIMS } from '../src/curriculum/open-cells/course';
import { AI_ENGINEER_COURSE, AI_ENGINEER_SCRIMS } from '../src/curriculum/ai-engineer/course';
import type { Course } from '../src/types/curriculum';
import type { ScrimLessonData } from '../src/types/scrim';

type MediaEntry = Readonly<{
  lessonId: string;
  sha256: string;
  objectKey: string;
  contentType: 'audio/mpeg';
  byteSize: number;
  durationMs: number;
}>;

const { values } = parseArgs({
  args: process.argv.slice(2).filter((argument) => argument !== '--'),
  options: { manifest: { type: 'string' }, output: { type: 'string' }, course: { type: 'string' } },
});
const manifestPath = resolve(values.manifest ?? '../learning-platform-backend/content/media-manifest.json');
const outputDir = resolve(values.output ?? '../learning-platform-backend/content/catalog');
const media = JSON.parse(await readFile(manifestPath, 'utf8')) as { entries: MediaEntry[] };
const mediaByLesson = new Map(media.entries.map((entry) => [entry.lessonId, entry]));

const catalogs: Array<{ course: Course; scrims: Record<string, ScrimLessonData> }> = [
  { course: FUNDAMENTOS_COURSE, scrims: FUNDAMENTOS_SCRIMS },
  { course: JAVASCRIPT_COURSE, scrims: JAVASCRIPT_SCRIMS },
  { course: COMPONENT_COURSE, scrims: COMPONENT_COURSE_SCRIMS },
  { course: OPEN_CELLS_COURSE, scrims: OPEN_CELLS_SCRIMS },
  { course: AI_ENGINEER_COURSE, scrims: AI_ENGINEER_SCRIMS },
].filter(({ course }) => !values.course || course.slug === values.course);

if (catalogs.length === 0) throw new Error(`No existe el curso ${values.course}.`);
await mkdir(outputDir, { recursive: true });

const exported: Array<{ slug: string; file: string; lessons: number }> = [];
for (const { course, scrims } of catalogs) {
  const items = course.modules.flatMap((module) => module.items);
  const lessons = Object.values(scrims)
    .sort((left, right) => left.id.localeCompare(right.id, undefined, { numeric: true }))
    .map((scrim) => {
      const audio = mediaByLesson.get(scrim.id);
      if (course.slug !== 'ai-engineer' && !audio) throw new Error(`Falta el audio inventariado de ${scrim.id}.`);
      const relatedItems = items.filter((item) => item.id === scrim.id || item.id.startsWith(`${scrim.id}-`));
      const module = course.modules.find((candidate) => candidate.items.some((item) => item.id === scrim.id));
      const { snapshots: _derivedSnapshots, ...portableScrim } = scrim;
      return {
        key: scrim.id,
        title: scrim.title,
        payload: {
          scrim: portableScrim,
          snapshotIntervalMs: 4000,
          curriculumItems: relatedItems,
          moduleId: module?.id,
          moduleTitle: module?.title,
        },
        ...(audio ? {
          audio: {
            sha256: audio.sha256,
            objectKey: audio.objectKey,
            contentType: audio.contentType,
            byteSize: audio.byteSize,
            durationMs: audio.durationMs,
          },
        } : {}),
      };
    });

  const release = {
    course: {
      slug: course.slug,
      title: course.title,
      description: course.description,
      metadata: {
        id: course.id,
        tagline: course.tagline,
        level: course.level,
        tags: course.tags,
        instructor: course.instructor,
        thumbnailGradient: course.thumbnailGradient,
        modules: course.modules.map((module) => ({ id: module.id, title: module.title, description: module.description })),
      },
    },
    lessons,
  };
  const file = resolve(outputDir, `${course.slug}.json`);
  await writeFile(file, `${JSON.stringify(release, null, 2)}\n`);
  exported.push({ slug: course.slug, file, lessons: lessons.length });
}

await writeFile(resolve(outputDir, 'index.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), courses: exported }, null, 2)}\n`);
for (const entry of exported) console.log(`Catálogo ${entry.slug}: ${entry.lessons} lecciones en ${entry.file}.`);
