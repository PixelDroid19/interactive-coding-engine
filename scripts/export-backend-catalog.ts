import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { OPEN_CELLS_COURSE, OPEN_CELLS_SCRIMS } from '../src/curriculum/open-cells/course';

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
  options: { manifest: { type: 'string' }, output: { type: 'string' } },
});
const manifestPath = resolve(values.manifest ?? '../learning-platform-backend/content/media-manifest.json');
const outputPath = resolve(values.output ?? '../learning-platform-backend/content/open-cells.json');
const media = JSON.parse(await readFile(manifestPath, 'utf8')) as { entries: MediaEntry[] };
const mediaByLesson = new Map(media.entries.map((entry) => [entry.lessonId, entry]));
const items = OPEN_CELLS_COURSE.modules.flatMap((module) => module.items);

const lessons = Object.values(OPEN_CELLS_SCRIMS)
  .sort((left, right) => left.id.localeCompare(right.id))
  .map((scrim) => {
    const audio = mediaByLesson.get(scrim.id);
    if (!audio) throw new Error(`Falta el audio inventariado de ${scrim.id}.`);
    const relatedItems = items.filter((item) => item.id === scrim.id || item.id.startsWith(`${scrim.id}-`));
    if (relatedItems.length < 3) throw new Error(`El bloque pedagógico ${scrim.id} está incompleto.`);
    const { snapshots: _derivedSnapshots, ...portableScrim } = scrim;
    return {
      key: scrim.id,
      title: scrim.title,
      payload: {
        scrim: portableScrim,
        snapshotIntervalMs: 4000,
        curriculumItems: relatedItems,
        moduleId: OPEN_CELLS_COURSE.modules.find((module) => module.items.some((item) => item.id === scrim.id))?.id,
      },
      audio: {
        sha256: audio.sha256,
        objectKey: audio.objectKey,
        contentType: audio.contentType,
        byteSize: audio.byteSize,
        durationMs: audio.durationMs,
      },
    };
  });

const release = {
  course: {
    slug: OPEN_CELLS_COURSE.slug,
    title: OPEN_CELLS_COURSE.title,
    description: OPEN_CELLS_COURSE.description,
  },
  lessons,
};

await writeFile(outputPath, `${JSON.stringify(release, null, 2)}\n`);
console.log(`Catálogo exportado: ${lessons.length} lecciones en ${outputPath}.`);
