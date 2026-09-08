// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCellsAppWorkspace } from './cellsAppRecipes';
import { buildCellsPreviewDocument } from './cellsPreviewCompiler';

afterEach(() => { vi.useRealTimers(); document.body.replaceChildren(); });

async function runtime() {
  const { html } = buildCellsPreviewDocument(createCellsAppWorkspace({ name: 'academy-navigation-app' }).snapshot);
  const map = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)![1]);
  return import(`${map.imports['@open-cells/core']}#${Math.random()}`);
}

describe('navegación interceptada en el playground', () => {
  it('aplica una redirección síncrona sin montar la página rechazada', async () => {
    const core = await runtime();
    document.body.innerHTML = '<main id="app"></main>';
    let rejectedLoads = 0;
    await core.startApp({ mainNode: 'app', initialTemplate: 'home', routes: [
      { name: 'home', path: '/', component: 'section', action: async () => {} },
      { name: 'detail', path: '/detail', component: 'article', action: async () => { rejectedLoads += 1; } },
      { name: 'login', path: '/login', component: 'form', action: async () => {} },
    ], interceptor: ({ to }: { to: { page: string } }) => to.page === 'detail'
      ? { intercept: true, redirect: { page: 'login', params: {} } }
      : { intercept: false } });
    await core.navigate('detail');
    expect(document.querySelector('#app')!.firstElementChild?.tagName).toBe('FORM');
    expect(rejectedLoads).toBe(0);
  });

  it('conserva el outlet y publica la intención cancelada antes de una reanudación explícita', async () => {
    const core = await runtime();
    document.body.innerHTML = '<main id="app"></main>';
    const events: unknown[] = [];
    let blocked = true;
    await core.startApp({ mainNode: 'app', initialTemplate: 'home', routes: [
      { name: 'home', path: '/', component: 'section', action: async () => {} },
      { name: 'detail', path: '/detail/:id', component: 'article', action: async () => {} },
    ], interceptor: () => ({ intercept: blocked }) });
    const original = document.querySelector('#app')!.firstElementChild;
    core.subscribe('__oc_intercepted_navigation', document.body, (value: unknown) => events.push(value));
    vi.useFakeTimers();
    await core.navigate('detail', { id: 'second' });
    expect(document.querySelector('#app')!.firstElementChild).toBe(original);
    expect(events).toEqual([]);
    await vi.runAllTimersAsync();
    expect(events).toEqual([{ value: { intercept: true, from: { page: 'home', params: {} }, to: { page: 'detail', path: '/detail/:id', params: { id: 'second' } } } }]);
    blocked = false;
    await core.navigate('detail', { id: 'second' });
    expect(document.querySelector('#app')!.firstElementChild?.tagName).toBe('ARTICLE');
  });
});
