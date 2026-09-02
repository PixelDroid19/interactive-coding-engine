import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('cabeceras de producción en Vercel', () => {
  it('protege todas las rutas sin bloquear los workers, WebGPU ni la vista previa', async () => {
    const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8')) as {
      headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
      rewrites?: Array<{ source: string; destination: string }>;
    };
    const global = config.headers.find((entry) => entry.source === '/(.*)');
    const headers = Object.fromEntries(global?.headers.map(({ key, value }) => [key.toLowerCase(), value]) ?? []);

    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toContain('camera=()');
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['content-security-policy']).not.toContain('script-src');
  });

  it('sirve index.html en rutas SPA sin convertir assets ausentes en HTML inmutable', async () => {
    const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8')) as {
      rewrites?: Array<{ source: string; destination: string }>;
    };

    expect(config.rewrites).toContainEqual({ source: '/((?!assets/).*)', destination: '/index.html' });
    expect(config.rewrites).not.toContainEqual({ source: '/(.*)', destination: '/index.html' });
  });

  it('no conserva HTML de rutas SPA entre despliegues y mantiene inmutables los assets versionados', async () => {
    const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8')) as {
      headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
    };
    const documents = config.headers.find((entry) => entry.source === '/((?!assets/).*)');
    const assets = config.headers.find((entry) => entry.source === '/assets/(.*)');
    const documentHeaders = Object.fromEntries(
      documents?.headers.map(({ key, value }) => [key.toLowerCase(), value]) ?? [],
    );
    const assetHeaders = Object.fromEntries(
      assets?.headers.map(({ key, value }) => [key.toLowerCase(), value]) ?? [],
    );

    expect(documentHeaders['cache-control']).toContain('no-store');
    expect(documentHeaders['vercel-cdn-cache-control']).toContain('no-store');
    expect(assetHeaders['cache-control']).toContain('immutable');
  });
});
