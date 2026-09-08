// @vitest-environment happy-dom
import { posix } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createOpenCellsLessonWorkspace } from './lessonWorkspaces';

describe('recursos de las páginas retenidas de la clase 77', () => {
  it('conserva recursos al ocultar y los libera al desmontar, sin borrar la nota de sesión', async () => {
    const { files } = createOpenCellsLessonWorkspace(77).snapshot;
    const entry = 'app/runtime/retained-page-mixin.js';
    expect(files[entry], 'La política necesita un consumidor en el ciclo de vida').toBeDefined();
    const urls = new Map<string, string>();
    const moduleUrl = (path: string): string => {
      if (urls.has(path)) return urls.get(path)!;
      const source = files[path].content.replace(/from '([^']+)'/g, (_, specifier: string) =>
        `from '${moduleUrl(posix.normalize(posix.join(posix.dirname(path), specifier)))}'`);
      const url = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
      urls.set(path, url);
      return url;
    };
    const { RetainedPageMixin, pageRetention, retainedListeners, sessionNote } = await import(moduleUrl(entry));
    class RetainedLessonPage extends (RetainedPageMixin(HTMLElement) as typeof HTMLElement) {}
    customElements.define('retained-lesson-page', RetainedLessonPage);
    const page = document.createElement('retained-lesson-page') as HTMLElement & { retentionPulses: number };
    try {
      document.body.append(page);
      sessionNote.value = 'Nota fuera de la instancia';
      page.hidden = true;
      globalThis.dispatchEvent(new Event('academy-retention-ping'));
      expect(page.retentionPulses).toBe(1);
      expect(pageRetention.pages.size).toBe(1);
      expect(retainedListeners.size).toBe(1);
      page.remove();
      globalThis.dispatchEvent(new Event('academy-retention-ping'));
      expect(page.retentionPulses).toBe(1);
      expect(pageRetention.pages.size).toBe(0);
      expect(retainedListeners.size).toBe(0);
      expect(sessionNote.value).toBe('Nota fuera de la instancia');
      document.body.append(page);
      globalThis.dispatchEvent(new Event('academy-retention-ping'));
      expect(page.retentionPulses).toBe(2);
      expect(retainedListeners.size).toBe(1);
    } finally {
      page.remove();
    }
  });
});
