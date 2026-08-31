import { describe, expect, it } from 'vitest';
import viteConfig from './vite.config';

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
