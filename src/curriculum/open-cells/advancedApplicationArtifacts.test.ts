import { posix } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createOpenCellsLessonWorkspace } from './lessonWorkspaces';
import { advancedApplicationArtifactForLesson } from './advancedApplicationArtifacts';

describe('catalog migration boundary', () => {
  async function normalizer() {
    const source = advancedApplicationArtifactForLesson(84)!.source;
    return (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).normalizeCatalogItem;
  }

  it('accepts both contracts while warning only for the legacy property', async () => {
    const normalize = await normalizer();
    const warnings: string[] = [];
    expect(normalize({ id: 'first', title: 'Museo' }, (warning: string) => warnings.push(warning))).toEqual({ id: 'first', name: 'Museo' });
    expect(warnings).toEqual([]);
    expect(normalize({ id: 'first', name: 'Museo' }, (warning: string) => warnings.push(warning))).toEqual({ id: 'first', name: 'Museo' });
    expect(warnings).toHaveLength(1);
    expect(normalize({ id: 'first', title: 'Nuevo', name: 'Antiguo' })).toEqual({ id: 'first', name: 'Nuevo' });
  });

  it('rejects malformed inputs without disguising an invalid new contract as legacy', async () => {
    const normalize = await normalizer();
    for (const input of [null, undefined, [], {}, { id: '', title: 'Museo' }, { id: {}, title: 'Museo' }, { id: 'first', title: {}, name: 'Museo' }, { id: 'first', title: '' }, { id: 'first', name: 42 }]) {
      expect(normalize(input)).toBeUndefined();
    }
  });
});

describe('release evidence', () => {
  async function releaseContract() {
    const source = advancedApplicationArtifactForLesson(83)!.source;
    return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  }

  it('requires passing evidence from one run and one exact artifact', async () => {
    const { QUALITY_GATES, canPromote } = await releaseContract();
    expect(QUALITY_GATES.map((gate: { name: string }) => gate.name)).toContain('format');
    const evidence = { runId: 'run-1', sourceHash: 'a'.repeat(64), artifactHash: 'b'.repeat(64), results: {} as Record<string, unknown> };
    for (const gate of QUALITY_GATES) evidence.results[gate.name] = { status: 'passed', exitCode: 0, runId: evidence.runId, sourceHash: evidence.sourceHash, artifactHash: evidence.artifactHash };
    expect(canPromote(evidence)).toBe(true);
    evidence.results['consumer-smoke'] = { status: 'passed', exitCode: 0, runId: 'older-run', sourceHash: evidence.sourceHash, artifactHash: 'c'.repeat(64) };
    expect(canPromote(evidence)).toBe(false);
  });

  it('does not promote bare status labels or missing evidence', async () => {
    const { QUALITY_GATES, canPromote } = await releaseContract();
    expect(canPromote(Object.fromEntries(QUALITY_GATES.map((gate: { name: string }) => [gate.name, 'passed'])))).toBe(false);
    expect(canPromote(null)).toBe(false);
    expect(canPromote({})).toBe(false);
  });
});

describe('analytics event contract', () => {
  it('connects selection to a bounded local adapter', async () => {
    const files = createOpenCellsLessonWorkspace(81).snapshot.files;
    expect(files['app/analytics/adapter.js']).toBeDefined();
    const eventSource = files['app/analytics/events.js'].content;
    const eventUrl = `data:text/javascript;base64,${Buffer.from(eventSource).toString('base64')}`;
    const source = files['app/analytics/adapter.js'].content.replace('./events.js', eventUrl);
    const { createAnalyticsAdapter } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
    const adapter = createAnalyticsAdapter();
    expect(adapter.track('unknown', {})).toBe(false);
    for (let index = 0; index < 30; index++) adapter.track('catalog:item-selected', { itemId: 'first', source: 'home', secret: 'synthetic' });
    expect(adapter.getEvents()).toHaveLength(25);
    expect(adapter.getEvents()[0].properties).toEqual({ itemId: 'first', source: 'home' });
    adapter.getEvents().pop();
    expect(adapter.getEvents()).toHaveLength(25);
    adapter.clear();
    expect(adapter.getEvents()).toEqual([]);
    expect(files['app/pages/academy-home-page/academy-home-page.js'].content).toContain("analytics.track('catalog:item-selected'");
  });

  async function eventFactory() {
    const source = advancedApplicationArtifactForLesson(81)!.source;
    return (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).createAnalyticsEvent;
  }

  it('rejects unknown names and malformed property values', async () => {
    const createEvent = await eventFactory();
    for (const name of ['unknown', 'toString', '__proto__', null]) {
      expect(createEvent(name, {})).toBeUndefined();
    }
    for (const properties of [undefined, null, [], {}, { itemId: {}, source: 'home' }, { itemId: 'first', source: {} }, { itemId: '', source: 'home' }]) {
      expect(createEvent('catalog:item-selected', properties)).toBeUndefined();
    }
  });

  it('returns an immutable versioned event without extra properties', async () => {
    const createEvent = await eventFactory();
    const result = createEvent('catalog:item-selected', { itemId: 'first', source: 'home', secret: 'synthetic' });
    expect(result).toEqual({ name: 'catalog:item-selected', version: 1, properties: { itemId: 'first', source: 'home' } });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.properties)).toBe(true);
  });
});

describe('trace completion', () => {
  async function traceFactory() {
    const source = advancedApplicationArtifactForLesson(80)!.source;
    return (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).createTrace;
  }

  it('finishes once with immutable timing metadata', async () => {
    const createTrace = await traceFactory();
    const trace = createTrace('data', 'action-1', 10);
    const result = trace.finish('ok', 25);
    expect(result).toEqual({ name: 'data', correlationId: 'action-1', status: 'ok', durationMs: 15 });
    expect(trace.finish('error', 90)).toBe(result);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('rejects invalid clocks and unrecognized outcomes', async () => {
    const createTrace = await traceFactory();
    expect(() => createTrace('data', 'action-1', NaN)).toThrow(RangeError);
    expect(() => createTrace('data', 'action-1', 10).finish('ok', 5)).toThrow(RangeError);
    expect(() => createTrace('data', 'action-1', 10).finish('pending', 15)).toThrow(TypeError);
  });

  it('rejects object payloads in metadata fields', async () => {
    const createTrace = await traceFactory();
    expect(() => createTrace({ content: 'private' }, 'action-1', 0)).toThrow(TypeError);
    expect(() => createTrace('data', { token: 'private' }, 0)).toThrow(TypeError);
    expect(() => createTrace('', 'action-1', 0)).toThrow(TypeError);
  });
});

describe('feature flag resolution', () => {
  it('enables only explicit booleans and safely defaults malformed inputs', async () => {
    const source = advancedApplicationArtifactForLesson(78)!.source;
    const { resolveFeatureFlags } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
    expect(resolveFeatureFlags({ compactCatalog: true })).toEqual({ compactCatalog: true });
    for (const input of [undefined, null, {}, { compactCatalog: false }, { compactCatalog: 'true' }, { compactCatalog: 1 }]) {
      expect(resolveFeatureFlags(input)).toEqual({ compactCatalog: false });
    }
  });
});

describe('contrato de retención de páginas', () => {
  async function retention() {
    const source = advancedApplicationArtifactForLesson(77)!.source;
    return (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).PageRetention;
  }

  it('libera la instancia montada más antigua sin renovar su turno al volver', async () => {
    const PageRetention = await retention();
    const cache = new PageRetention(2);
    const released: string[] = [];
    let departures = 0;
    const first = { cleanup: () => released.push('first'), onPageLeave: () => departures++ };
    const second = { cleanup: () => released.push('second'), onPageLeave: () => departures++ };
    cache.keep('first', first);
    cache.keep('second', second);
    cache.keep('first', first);
    cache.keep('third', {});
    expect(released).toEqual(['first']);
    expect(departures).toBe(0);
    expect([...cache.pages.keys()]).toEqual(['second', 'third']);
  });

  it('rechaza límites que no pueden garantizar una retención finita', async () => {
    const PageRetention = await retention();
    for (const limit of [-1, 0, 1.5, NaN, Infinity, '2', null]) {
      expect(() => new PageRetention(limit)).toThrow(RangeError);
    }
  });

  it('libera al desmontar una sola vez y no retira otra instancia con el mismo nombre', async () => {
    const PageRetention = await retention();
    const cache = new PageRetention(2);
    let releases = 0;
    const page = { cleanup: () => releases++ };
    cache.keep('home', page);
    cache.release('home', {});
    expect(cache.pages.size).toBe(1);
    cache.release('home', page);
    cache.release('home', page);
    expect(cache.pages.size).toBe(0);
    expect(releases).toBe(1);
  });
});

describe('frontera de rutas delegadas', () => {
  async function resolver() {
    const source = advancedApplicationArtifactForLesson(76)!.source;
    return (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).delegateRoute;
  }

  it('reconoce el catálogo completo y decodifica un único identificador', async () => {
    const resolve = await resolver();
    expect(resolve('/catalogo')).toStrictEqual({ module: 'catalogo', route: 'home', params: {} });
    expect(resolve('/catalogo/?orden=nombre')).toEqual({ module: 'catalogo', route: 'home', params: {} });
    expect(resolve('/catalogo/proyecto%20uno#resumen')).toEqual({ module: 'catalogo', route: 'detail', params: { id: 'proyecto uno' } });
  });

  it('no delega prefijos parecidos, segmentos sobrantes ni identificadores ambiguos', async () => {
    const resolve = await resolver();
    for (const url of ['/catalogos', '/catalogo-extra', '/catalogo/a/b', '/catalogo//', '/catalogo/%2F', '/catalogo/%5C', '/catalogo/%20', '/catalogo/%ZZ', '/catalogo/..', '/catalogo/%00', 'https://example.com/catalogo/a', null, {}]) {
      expect(resolve(url), String(url)).toBeUndefined();
    }
  });
});

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
