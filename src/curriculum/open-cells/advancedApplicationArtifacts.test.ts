import { posix } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createOpenCellsLessonWorkspace } from './lessonWorkspaces';

describe('diseño técnico del proyecto avanzado', () => {
  it('enlaza los propietarios reales y conserva contratos comprobables del proyecto', () => {
    const { files } = createOpenCellsLessonWorkspace(74).snapshot;
    const document = files['docs/architecture.md'].content;
    const links = [...document.matchAll(/\]\((\.\.\/[^)]+)\)/g)].map((match) => posix.normalize(posix.join('docs', match[1])));
    for (const path of [
      'app/scripts/app.js',
      'app/scripts/app-routes.js',
      'app/pages/academy-home-page/academy-home-page.js',
      'app/pages/academy-product-detail-page/academy-product-detail-page.js',
      'app/components/academy-product-card/academy-product-card.js',
      'app/data/academy-product-data-manager.js',
      'app/scripts/channels.js',
      'test/unit/app.test.js',
    ]) expect(links, path).toContain(path);
    for (const path of links) expect(files[path], `Enlace roto: ${path}`).toBeDefined();
    expect(document).toContain('academy:studio:project:selected');
    expect(files['app/scripts/channels.js'].content).toContain('academy:studio:project:selected');
    expect(document).toContain('academy-product-card-select');
    expect(document).toContain('product-detail');
  });
});
