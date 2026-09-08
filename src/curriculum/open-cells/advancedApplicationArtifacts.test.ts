import { posix } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createOpenCellsLessonWorkspace } from './lessonWorkspaces';
import { advancedApplicationArtifactForLesson } from './advancedApplicationArtifacts';

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

describe('decisión de salida con cambios pendientes', () => {
  async function policy() {
    const source = advancedApplicationArtifactForLesson(75)!.source;
    return (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).pendingChangesInterceptor;
  }

  it('permite una salida limpia sin pedir confirmación', async () => {
    const decide = await policy();
    const target = { page: 'product-detail', params: { id: 'second' } };
    const result = await decide({ target, hasPendingChanges: false, confirmLeave: () => { throw new Error('No debe confirmar'); } });
    expect(result).toEqual({ action: 'allow', target });
  });

  it('espera la decisión y no confunde rechazo con permiso', async () => {
    const decide = await policy();
    const target = { page: 'favorites', params: {} };
    let answer!: (value: boolean) => void;
    let settled = false;
    const decision = Promise.resolve(decide({ target, hasPendingChanges: true, confirmLeave: () => new Promise<boolean>((resolve) => { answer = resolve; }) })).then((result) => { settled = true; return result; });
    await Promise.resolve();
    expect(settled).toBe(false);
    answer(false);
    expect(await decision).toEqual({ action: 'cancel', target, reason: 'pending-changes' });
    expect(await decide({ target, hasPendingChanges: true, confirmLeave: async () => true })).toEqual({ action: 'allow', target });
  });

  it('conserva los cambios cuando falta la confirmación o falla su proveedor', async () => {
    const decide = await policy();
    const target = { page: 'home', params: {} };
    expect(await decide({ target, hasPendingChanges: true })).toEqual({ action: 'cancel', target, reason: 'confirmation-unavailable' });
    expect(await decide({ target, hasPendingChanges: true, confirmLeave: async () => { throw new Error('Proveedor desconectado'); } })).toEqual({ action: 'cancel', target, reason: 'confirmation-unavailable' });
    expect(await decide({ target, hasPendingChanges: true, confirmLeave: async () => 'false' })).toEqual({ action: 'cancel', target, reason: 'pending-changes' });
  });
});
