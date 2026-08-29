import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { ScrimEvent } from '../../types/scrim';
import type { WorkspaceSnapshot } from '../../types/scrim';
import { buildCellsPreviewDocument } from '../../engine/cells/cellsPreviewCompiler';
import { auditCellsProject } from '../../engine/cells/cellsProjectAudit';
import { OPEN_CELLS_COURSE, OPEN_CELLS_SCRIMS } from './course';

function applyTape(workspace: WorkspaceSnapshot, events: ScrimEvent[]): WorkspaceSnapshot {
  const files = Object.fromEntries(Object.entries(workspace.files).map(([path, file]) => [path, { ...file }]));
  let activeFilePath = workspace.activeFilePath;
  for (const event of events) {
    if (event.type === 'file-switch') activeFilePath = event.filePath;
    if (event.type === 'file-create') files[event.file.path] = { ...event.file };
    if (event.type === 'file-delete') delete files[event.filePath];
    if (event.type === 'file-rename') {
      const source = files[event.oldPath];
      if (source) {
        files[event.newPath] = { ...source, path: event.newPath, name: event.newPath.split('/').at(-1) ?? source.name };
        delete files[event.oldPath];
      }
    }
    if (event.type === 'code-change') {
      const source = files[event.filePath];
      if (!source) throw new Error(`${event.filePath} no existe durante la cinta.`);
      let content = event.fullContent;
      if (content === undefined) {
        content = source.content;
        for (const change of [...event.changes].sort((left, right) => right.from - left.from)) {
          content = `${content.slice(0, change.from)}${change.text}${content.slice(change.to)}`;
        }
      }
      files[event.filePath] = { ...source, content };
    }
  }
  return { ...workspace, files, activeFilePath };
}

describe('recorrido guiado completo de Open Cells', () => {
  const lessons = Object.values(OPEN_CELLS_SCRIMS).sort((left, right) => left.id.localeCompare(right.id));

  it('registra 84 clases separadas con lectura, razonamiento y cierres de proyecto', () => {
    expect(lessons).toHaveLength(84);
    for (const module of OPEN_CELLS_COURSE.modules) {
      for (let index = 0; index < module.items.length; index += 3) {
        const block = module.items.slice(index, index + 3);
        expect(block.map((item) => item.type)).toEqual([
          'scrim', 'reading', 'reasoning',
        ]);
      }
    }
    expect(OPEN_CELLS_COURSE.modules.flatMap((module) => module.items)
      .filter((item) => item.type === 'reading' && item.handsOnLab)).toHaveLength(14);
  });

  it('las cintas no desvían la práctica hacia checkpoints genéricos', () => {
    for (const lesson of lessons) {
      expect(Object.keys(lesson.initialWorkspace.files).some((path) => path.includes('/checkpoints/'))).toBe(false);
      if (lesson.id !== 'open-cells-06') expect(lesson.challenges).toHaveLength(0);
    }
  });

  it('enseña sobre varios archivos reales antes del laboratorio de proyecto', () => {
    for (const lesson of lessons) {
      const projectEvents = lesson.events.filter((event): event is Extract<ScrimEvent, { type: 'file-switch' | 'code-change' }> => (
        (event.type === 'file-switch' || event.type === 'code-change')
        && !event.filePath.includes('/checkpoints/')
      ));
      const projectPaths = [...new Set(projectEvents.map((event) => event.filePath))];
      const projectWrites = projectEvents.filter((event) => event.type === 'code-change');
      expect(projectPaths.length, `${lesson.id} no recorre un grafo real`).toBeGreaterThanOrEqual(3);
      expect(projectWrites.length, `${lesson.id} no construye ningún archivo del proyecto`).toBeGreaterThan(0);
      expect(lesson.events.some((event) => event.type === 'run-code'), `${lesson.id} no ejecuta el proyecto`).toBe(true);
    }
  });

  it('las unidades clave construyen el componente, la demo y la aplicación archivo por archivo', () => {
    const pathsFor = (id: string) => new Set(OPEN_CELLS_SCRIMS[id].events.flatMap((event) => (
      (event.type === 'file-switch' || event.type === 'code-change') ? [event.filePath] : []
    )));
    expect([...pathsFor('open-cells-03')]).toEqual(expect.arrayContaining([
      'package.json', 'index.js', 'academy-state-panel.js', 'src/academy-state-panel.js',
    ]));
    expect([...pathsFor('open-cells-31')]).toEqual(expect.arrayContaining([
      'demo/index.html', 'demo/demo.js', 'demo/demo-build.js',
    ]));
    expect([...pathsFor('open-cells-39')]).toEqual(expect.arrayContaining([
      'index.html', 'app/scripts/app.js', 'app/scripts/app-routes.js', 'app/pages/academy-home-page/academy-home-page.js',
    ]));
    expect([...pathsFor('open-cells-69')]).toEqual(expect.arrayContaining([
      'src/academy-lifecycle-panel.js', 'demo/demo.js', 'test/unit/academy-lifecycle-panel.test.js',
    ]));
    expect([...pathsFor('open-cells-76')]).toEqual(expect.arrayContaining([
      'app/scripts/delegated-routes.js', 'app/scripts/app-routes.js', 'app/scripts/app.js',
    ]));
    expect([...pathsFor('open-cells-80')]).toContain('app/observability/trace.js');
    expect([...pathsFor('open-cells-84')]).toContain('app/migrations/catalog-contract.js');
  });

  it('cambia el artefacto visible y conserva dependencias construidas previamente', () => {
    const componentIds = ['open-cells-01', 'open-cells-02', 'open-cells-03', 'open-cells-06', 'open-cells-10', 'open-cells-13', 'open-cells-16', 'open-cells-21', 'open-cells-23', 'open-cells-37'];
    const tags = componentIds.map((id) => buildCellsPreviewDocument(
      applyTape(OPEN_CELLS_SCRIMS[id].initialWorkspace, OPEN_CELLS_SCRIMS[id].events),
    ).componentDemo?.tagName);
    expect(new Set(tags).size).toBe(componentIds.length);

    const productLesson = OPEN_CELLS_SCRIMS['open-cells-06'];
    const productSource = applyTape(productLesson.initialWorkspace, productLesson.events).files['src/academy-product-card.js']?.content;
    expect(productSource).toContain("from './components/academy-action-button.js'");
    expect(productSource).toContain("from './components/academy-status-badge.js'");
  });

  it('mantiene 84 guiones hablados sincronizados con los subtítulos', () => {
    for (const lesson of lessons) {
      const number = lesson.id.replace('open-cells-', '');
      const script = readFileSync(`docs/guiones/open-cells/${number}.md`, 'utf8');
      expect(script).toContain(`lesson: ${lesson.id}`);
      for (const cue of lesson.audioTrack.narrationScript ?? []) {
        expect(script, `${lesson.id} no contiene el subtítulo completo`).toContain(cue.text);
      }
    }
  });

  it('mantiene una narración legible y evita el guion mecánico repetido', () => {
    const boilerplate = [
      'Observa su entrada y busca qué otro archivo lo consume.',
      'Ejecutamos el proyecto después de conectar sus archivos.',
      'La lectura siguiente abre un laboratorio de proyecto',
    ];
    for (const lesson of lessons.filter((candidate) => candidate.id !== 'open-cells-06')) {
      const cues = lesson.audioTrack.narrationScript ?? [];
      for (const [index, cue] of cues.entries()) {
        expect(boilerplate.some((phrase) => cue.text.includes(phrase)), `${lesson.id} conserva una frase de plantilla`).toBe(false);
        const nextTimestamp = cues[index + 1]?.timestamp ?? lesson.durationMs;
        const spokenMilliseconds = Math.ceil(cue.text.trim().split(/\s+/).length * 60_000 / 195);
        expect(nextTimestamp - cue.timestamp, `${lesson.id} pisa el subtítulo “${cue.text}”`).toBeGreaterThanOrEqual(spokenMilliseconds);
      }
    }
  });

  it('cada cinta termina en un proyecto Cells que el runtime puede previsualizar', () => {
    for (const lesson of lessons) {
      const finalWorkspace = applyTape(lesson.initialWorkspace, lesson.events);
      const preview = buildCellsPreviewDocument(finalWorkspace);
      expect(preview.html, `${lesson.id} produjo un preview vacío`).toContain('<!doctype html>');
      if (lesson.templateId === 'cells-component') {
        expect(preview.componentDemo, `${lesson.id} no expuso el componente trabajado`).toBeDefined();
      } else {
        expect(preview.componentDemo, `${lesson.id} trató una aplicación como demo de componente`).toBeUndefined();
      }
    }
  });

  it('las clases generadas dejan completos los contratos públicos que enseñan', () => {
    for (const lesson of lessons.filter((candidate) => candidate.id !== 'open-cells-06')) {
      const finalWorkspace = applyTape(lesson.initialWorkspace, lesson.events);
      const failed = auditCellsProject(finalWorkspace).results.filter((result) => !result.passed);
      expect(failed, `${lesson.id} dejó contratos rotos: ${failed.map((result) => result.id).join(', ')}`).toEqual([]);
    }
  });

  it('no exige un concepto Cells antes de haberlo introducido', () => {
    const introduced = new Set<string>();
    for (const lesson of lessons) {
      for (const required of lesson.skillsRequired.filter((skill) => skill.startsWith('cells-'))) {
        expect(introduced.has(required), `${lesson.id} exige ${required} antes de enseñarlo`).toBe(true);
      }
      lesson.skillsIntroduced.filter((skill) => skill.startsWith('cells-')).forEach((skill) => introduced.add(skill));
    }
  });
});
