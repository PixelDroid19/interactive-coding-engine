// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('aula_anonymous_actor_v1', '30000000-0000-4000-8000-000000000003');
  vi.restoreAllMocks();
});

describe('improvementApi', () => {
  it('crea una propuesta real sin inventar datos locales', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      id: 'proposal-1', title: 'Aclarar la práctica', description: 'Descripción suficientemente clara.',
      targetArea: 'practice', status: 'open', votes: 0,
    }), { status: 201, headers: { 'content-type': 'application/json' } }));
    const { improvementApi } = await import('./improvementApi');

    await improvementApi.create({
      title: 'Aclarar la práctica', description: 'Descripción suficientemente clara.', targetArea: 'practice',
    });

    expect(fetchMock.mock.calls[0]?.[0]).toContain('/v1/improvements');
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(expect.objectContaining({ method: 'POST' }));
  });

  it('expone el fallo del backend y no muestra propuestas falsas', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      error: { message: 'Servicio temporalmente no disponible.' },
    }), { status: 503, headers: { 'content-type': 'application/json' } }));
    const { improvementApi } = await import('./improvementApi');

    await expect(improvementApi.list()).rejects.toThrow('Servicio temporalmente no disponible.');
  });
});
