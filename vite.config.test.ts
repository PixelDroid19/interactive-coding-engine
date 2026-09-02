import { describe, expect, it } from 'vitest';
import viteConfig, { buildIdentityPlugin, normalizeBuildSha } from './vite.config';

describe('proxy de desarrollo para el API de aprendizaje', () => {
  it('reenvía las rutas /api al backend sin conservar el prefijo local', async () => {
    const config = (await (
      viteConfig as (environment: { command: 'serve'; mode: 'test'; isSsrBuild: false; isPreview: false }) => unknown
    )({
      command: 'serve',
      mode: 'test',
      isSsrBuild: false,
      isPreview: false,
    })) as {
      server?: { proxy?: Record<string, unknown> };
    };
    const proxy = config.server?.proxy?.['/api'];

    expect(proxy).toBeDefined();
    if (!proxy || typeof proxy !== 'object') return;
    const options = proxy as {
      target?: unknown;
      changeOrigin?: unknown;
      rewrite?: (path: string) => string;
    };
    expect(typeof options.target).toBe('string');
    expect(options.changeOrigin).toBe(true);
    expect(options.rewrite?.('/api/v1/courses?limit=50')).toBe('/v1/courses?limit=50');
  });
});

describe('identidad verificable del despliegue', () => {
  it('solo publica un SHA completo de Git y evita inyectar valores arbitrarios', () => {
    expect(normalizeBuildSha('A'.repeat(40))).toBe('a'.repeat(40));
    expect(normalizeBuildSha('rama-main')).toBe('local');
    expect(normalizeBuildSha('\"/><script>alert(1)</script>')).toBe('local');
    expect(normalizeBuildSha(undefined)).toBe('local');
  });

  it('incluye el SHA verificable en el HTML que sirve Vite', () => {
    const plugin = buildIdentityPlugin('b'.repeat(40));
    expect(plugin.transformIndexHtml('<html><head><meta charset="UTF-8" /></head></html>'))
      .toContain(`<meta name="devt-build-sha" content="${'b'.repeat(40)}" />`);
  });
});
