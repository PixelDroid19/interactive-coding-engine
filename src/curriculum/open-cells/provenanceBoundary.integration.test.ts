import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOTS = [
  'src/curriculum/open-cells',
  'src/engine/cells',
  'docs/guiones/open-cells',
];

function filesBelow(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

describe('frontera neutral del curso Open Cells', () => {
  it('no publica procedencia, rutas externas ni tarjetas de fuentes', () => {
    const findings = ROOTS.flatMap(filesBelow)
      .filter((path) => !path.endsWith('provenanceBoundary.integration.test.ts'))
      .flatMap((path) => {
        const source = readFileSync(path, 'utf8');
        const isLearningContent = path.startsWith('src/curriculum/open-cells') || path.startsWith('docs/guiones/open-cells');
        return [
          isLearningContent && /https?:\/\//i.test(source) && 'URL externa',
          /\/run\/media\//i.test(source) && 'ruta externa',
          /\bsources\s*:/i.test(source) && 'tarjeta de fuentes',
          /from\s+['"]\.\/sources['"]/i.test(source) && 'módulo de procedencia',
        ].filter(Boolean).map((reason) => `${relative('.', path)}: ${reason}`);
      });

    expect(findings).toEqual([]);
  });
});
