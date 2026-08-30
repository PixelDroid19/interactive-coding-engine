// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('aula_anonymous_actor_v1', '30000000-0000-4000-8000-000000000003');
  vi.resetModules();
  vi.restoreAllMocks();
});

describe('cliente del panel administrativo', () => {
  it('consulta el catálogo administrativo para incluir cursos ocultos', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ items: [] }), {
      status: 200, headers: { 'content-type': 'application/json' },
    }));
    const { staffDashboardApi } = await import('./staffDashboardApi');

    await staffDashboardApi.courses();

    expect(fetchMock.mock.calls[0]?.[0]).toContain('/v1/admin/courses?limit=50');
  });

  it('envía cambios de estado y disponibilidad como escrituras JSON', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('{}', {
      status: 200, headers: { 'content-type': 'application/json' },
    }));
    const { staffDashboardApi } = await import('./staffDashboardApi');

    await staffDashboardApi.setUserStatus('10000000-0000-4000-8000-000000000001', 'blocked');
    await staffDashboardApi.setCourseAvailability('fundamentos', 'locked', 'Revisión programada');

    expect(fetchMock.mock.calls[0]?.[1]).toEqual(expect.objectContaining({
      method: 'PUT', body: JSON.stringify({ status: 'blocked' }),
    }));
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(expect.objectContaining({
      method: 'PUT', body: JSON.stringify({ availability: 'locked', reason: 'Revisión programada' }),
    }));
  });

  it('acepta la eliminación con respuesta vacía', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    const { staffDashboardApi } = await import('./staffDashboardApi');

    await expect(staffDashboardApi.deleteAccessRule('20000000-0000-4000-8000-000000000002')).resolves.toBeUndefined();
  });

  it('usa contratos separados para contenido versionado y acceso individual', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => new Response(
      init?.method === 'DELETE' ? null : JSON.stringify({ items: [] }),
      { status: init?.method === 'DELETE' ? 204 : 200, headers: { 'content-type': 'application/json' } },
    ));
    const { staffDashboardApi } = await import('./staffDashboardApi');
    const userId = '10000000-0000-4000-8000-000000000001';

    await staffDashboardApi.updateCourseContent('fundamentos', {
      title: 'Fundamentos', description: 'Aprende.', metadata: { tagline: 'Empieza aquí' },
    });
    await staffDashboardApi.lockCourseForUser(userId, 'fundamentos', 'Revisión pendiente.');
    await staffDashboardApi.unlockCourseForUser(userId, 'fundamentos');

    expect(fetchMock.mock.calls[0]?.[0]).toContain('/v1/admin/courses/fundamentos/content');
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(expect.objectContaining({ method: 'PUT' }));
    expect(fetchMock.mock.calls[1]?.[0]).toContain(`/v1/admin/users/${userId}/course-access/fundamentos`);
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(expect.objectContaining({
      method: 'PUT', body: JSON.stringify({ reason: 'Revisión pendiente.' }),
    }));
    expect(fetchMock.mock.calls[2]?.[1]).toEqual(expect.objectContaining({ method: 'DELETE' }));
  });
});
