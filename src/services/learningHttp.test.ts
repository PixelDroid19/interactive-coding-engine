// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { learningApiRequest, setLearningCsrfToken } from './learningHttp';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('aula_anonymous_actor_v1', '30000000-0000-4000-8000-000000000003');
  setLearningCsrfToken(null);
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('cliente HTTP de aprendizaje', () => {
  it('envía la cookie HttpOnly y conserva el actor anónimo para reclamar su progreso', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));

    await learningApiRequest('/v1/me/progress');

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/v1/me/progress'), expect.objectContaining({
      credentials: 'include',
      headers: expect.objectContaining({ 'x-anonymous-id': '30000000-0000-4000-8000-000000000003' }),
    }));
  });

  it('añade CSRF solo a las operaciones que modifican datos', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
    setLearningCsrfToken('csrf-recibido-desde-la-sesion');

    await learningApiRequest('/v1/me/progress');
    await learningApiRequest('/v1/progress/open-cells-01', { method: 'PUT', body: '{}' });

    expect(fetchMock.mock.calls[0]?.[1]?.headers).not.toEqual(expect.objectContaining({ 'x-csrf-token': expect.anything() }));
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toEqual(expect.objectContaining({
      'x-csrf-token': 'csrf-recibido-desde-la-sesion',
    }));
  });

  it('explica en español cuando el backend no está disponible', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(learningApiRequest('/v1/staff/dashboard/overview'))
      .rejects.toThrow('No pudimos conectar con el servicio. Conservamos los datos que ya estaban cargados.');
  });

  it('usa el proxy del mismo origen durante el desarrollo local', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));

    await learningApiRequest('/v1/courses');

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/courses', expect.any(Object));
  });

  it('mantiene el actor anónimo de la página cuando localStorage no está disponible', async () => {
    vi.resetModules();
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('Storage bloqueado');
      },
      setItem: () => {
        throw new Error('Storage bloqueado');
      },
    });
    const { getLearningActorId, learningApiRequest: requestWithUnavailableStorage } = await import('./learningHttp');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));

    const actor = getLearningActorId();
    expect(getLearningActorId()).toBe(actor);

    await requestWithUnavailableStorage('/v1/me/progress');
    await requestWithUnavailableStorage('/v1/courses');

    expect((fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>)['x-anonymous-id']).toBe(actor);
    expect((fetchMock.mock.calls[1]?.[1]?.headers as Record<string, string>)['x-anonymous-id']).toBe(actor);
  });
});
