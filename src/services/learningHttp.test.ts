// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { learningApiRequest, setLearningCsrfToken } from './learningHttp';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('aula_anonymous_actor_v1', '30000000-0000-4000-8000-000000000003');
  setLearningCsrfToken(null);
  vi.restoreAllMocks();
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
});
