import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('cabeceras de producción en Vercel', () => {
  it('protege todas las rutas sin bloquear los workers, WebGPU ni la vista previa', async () => {
    const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8')) as {
      headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
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
});
