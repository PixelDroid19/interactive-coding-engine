// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('aula_anonymous_actor_v1', '30000000-0000-4000-8000-000000000003');
  vi.resetModules();
  vi.restoreAllMocks();
});

describe('sesión de la plataforma', () => {
  it('hidrata una sesión validada y prepara CSRF para las escrituras posteriores', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({
        authenticated: true,
        user: { id: '10000000-0000-4000-8000-000000000001', email: 'persona@epam.com', displayName: 'Persona', roles: ['student'] },
        csrfToken: 'csrf-de-la-sesion-segura',
      }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));
    const auth = await import('./authSessionApi');
    const http = await import('./learningHttp');

    await expect(auth.fetchAuthSession()).resolves.toMatchObject({ authenticated: true, user: { email: 'persona@epam.com' } });
    await http.learningApiRequest('/v1/feedback', { method: 'POST', body: '{}' });

    expect(fetchMock.mock.calls[1]?.[1]?.headers).toEqual(expect.objectContaining({ 'x-csrf-token': 'csrf-de-la-sesion-segura' }));
  });

  it('construye el inicio OIDC con retorno relativo y el actor del dispositivo', async () => {
    const auth = await import('./authSessionApi');
    const url = new URL(auth.getAuthLoginUrl('microsoft', '/cursos/open-cells'));

    expect(url.pathname).toBe('/v1/auth/login/microsoft');
    expect(url.searchParams.get('returnTo')).toBe('/cursos/open-cells');
    expect(url.searchParams.get('anonymousId')).toBe('30000000-0000-4000-8000-000000000003');
  });

  it('separa los datos privados del dispositivo cuando termina una sesión anterior', async () => {
    localStorage.setItem('aula_last_authenticated_user_v1', 'user-anterior');
    localStorage.setItem('aula_user_progress_v1', '{"completedItemIds":["privado"]}');
    localStorage.setItem('aula_learning_profile_v1', '{"skills":{"privado":true}}');
    localStorage.setItem('aula_learning_sync_v1', '{"events":[{"privado":true}]}');
    localStorage.setItem('aula_learning_center_cache_v1:curso:actor', '{"privado":true}');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ authenticated: false, providers: [] }), {
      status: 200, headers: { 'content-type': 'application/json' },
    }));
    const auth = await import('./authSessionApi');

    await auth.fetchAuthSession();

    expect(localStorage.getItem('aula_last_authenticated_user_v1')).toBeNull();
    expect(localStorage.getItem('aula_user_progress_v1')).toBeNull();
    expect(localStorage.getItem('aula_learning_profile_v1')).toBeNull();
    expect(localStorage.getItem('aula_learning_sync_v1')).toBeNull();
    expect(localStorage.getItem('aula_learning_center_cache_v1:curso:actor')).toBeNull();
    expect(localStorage.getItem('aula_anonymous_actor_v1')).not.toBe('30000000-0000-4000-8000-000000000003');
  });

  it('confirma el código con una intención explícita y activa la nueva sesión', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      authenticated: true,
      returnTo: '/panel',
      user: { id: 'user-verified', email: 'persona@gmail.com', displayName: 'Persona', roles: ['admin', 'student'] },
      csrfToken: 'csrf-token-confirmado-y-seguro',
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const auth = await import('./authSessionApi');

    await expect(auth.verifyAuthEmailCode('482901')).resolves.toMatchObject({ returnTo: '/panel', session: { authenticated: true } });
    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.headers).toEqual(expect.objectContaining({ 'x-auth-intent': 'verify-email' }));
    expect(JSON.parse(String(init?.body))).toEqual({ code: '482901' });
  });
});
