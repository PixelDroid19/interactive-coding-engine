// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('aula_anonymous_actor_v1', '30000000-0000-4000-8000-000000000003');
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('improvementApi', () => {
  it('conserva la capacidad solo en memoria y la usa como CSRF al crear', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({
        enabled: true, authorized: true, csrfToken: 'private-csrf-token-with-enough-length-123',
        expiresAt: '2026-09-02T12:15:00.000Z',
      }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 'proposal-1', title: 'Aclarar la práctica', description: 'Descripción suficientemente clara.',
        targetArea: 'practice', status: 'open', votes: 0,
      }), { status: 201, headers: { 'content-type': 'application/json' } }));
    const { improvementApi } = await import('./improvementApi');

    await improvementApi.unlockPrivateAccess('private-code-with-at-least-32-characters');
    await improvementApi.create({
      title: 'Aclarar la práctica', description: 'Descripción suficientemente clara.', targetArea: 'practice',
    });

    const unlockHeaders = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    const createHeaders = new Headers(fetchMock.mock.calls[1]?.[1]?.headers);
    expect(unlockHeaders.get('x-auth-intent')).toBe('private-improvement-access');
    expect(createHeaders.get('x-improvement-csrf-token')).toBe('private-csrf-token-with-enough-length-123');
    expect(localStorage.getItem('improvement_private_access')).toBeNull();
  });

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

  it('consulta la evidencia pública de ciclos sin depender del panel administrativo', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      items: [{
        id: 'cycle-1', closedAt: '2026-09-02T13:30:00.000Z', candidateCount: 2, clusterCount: 1,
        winningScore: 2, rationale: 'Gana el grupo.', clusters: [{ targetArea: 'practice', score: 2 }],
        winner: { id: 'proposal-1', title: 'Instrucciones claras', status: 'published' },
      }],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const { improvementApi } = await import('./improvementApi');

    await expect(improvementApi.listCycles()).resolves.toHaveLength(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/v1/improvements/cycles?limit=10');
  });
});
