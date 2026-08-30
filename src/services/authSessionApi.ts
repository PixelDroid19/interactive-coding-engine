import { getLearningActorId, LEARNING_API_URL, learningApiRequest, readApiJson, rotateLearningActorId, setLearningCsrfToken } from './learningHttp';

export type AuthProvider = 'google' | 'microsoft';
export type UserRole = 'student' | 'tutor' | 'admin';

export type AuthSession =
  | Readonly<{ authenticated: false; providers: readonly AuthProvider[] }>
  | Readonly<{
      authenticated: true;
      user: Readonly<{
        id: string;
        email: string;
        displayName: string | null;
        roles: readonly UserRole[];
      }>;
      csrfToken: string;
    }>;

const PROVIDERS = new Set<AuthProvider>(['google', 'microsoft']);
const ROLES = new Set<UserRole>(['student', 'tutor', 'admin']);
const SAFE_RETURN_TO = /^\/(?!\/)(?!.*[\\\u0000-\u001f\u007f]).*$/;
const LAST_USER_KEY = 'aula_last_authenticated_user_v1';
const PRIVATE_KEYS = ['aula_user_progress_v1', 'aula_learning_profile_v1', 'aula_learning_sync_v1'] as const;
const PRIVATE_PREFIXES = ['aula_course_progress_cache_v1:', 'aula_learning_center_cache_v1:'] as const;

function clearPrivateDeviceState(): void {
  try {
    PRIVATE_KEYS.forEach((key) => localStorage.removeItem(key));
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key && PRIVATE_PREFIXES.some((prefix) => key.startsWith(prefix))) localStorage.removeItem(key);
    }
  } catch {
    // La separación remota sigue vigente aunque Storage no esté disponible.
  }
}

function reconcileDeviceIdentity(session: AuthSession): void {
  try {
    const previousUserId = localStorage.getItem(LAST_USER_KEY);
    if (session.authenticated) {
      if (previousUserId && previousUserId !== session.user.id) clearPrivateDeviceState();
      localStorage.setItem(LAST_USER_KEY, session.user.id);
      return;
    }
    if (previousUserId) {
      clearPrivateDeviceState();
      localStorage.removeItem(LAST_USER_KEY);
      rotateLearningActorId();
    }
  } catch {
    // La sesión del backend no depende del almacenamiento local.
  }
}

function parseSession(value: unknown): AuthSession {
  if (!value || typeof value !== 'object') throw new Error('La respuesta de sesión no es válida.');
  const payload = value as Record<string, unknown>;
  if (payload.authenticated === false && Array.isArray(payload.providers)) {
    const providers = payload.providers.filter((provider): provider is AuthProvider => typeof provider === 'string' && PROVIDERS.has(provider as AuthProvider));
    return { authenticated: false, providers };
  }
  const user = payload.user as Record<string, unknown> | undefined;
  if (payload.authenticated !== true || !user || typeof user.id !== 'string' || typeof user.email !== 'string'
    || !Array.isArray(user.roles) || typeof payload.csrfToken !== 'string' || payload.csrfToken.length < 16) {
    throw new Error('La respuesta de sesión no es válida.');
  }
  const roles = user.roles.filter((role): role is UserRole => typeof role === 'string' && ROLES.has(role as UserRole));
  return {
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      displayName: typeof user.displayName === 'string' ? user.displayName : null,
      roles,
    },
    csrfToken: payload.csrfToken,
  };
}

export async function fetchAuthSession(signal?: AbortSignal): Promise<AuthSession> {
  const response = await learningApiRequest('/v1/auth/session', { signal });
  const session = parseSession(await readApiJson<unknown>(response));
  reconcileDeviceIdentity(session);
  setLearningCsrfToken(session.authenticated ? session.csrfToken : null);
  return session;
}

export function getAuthLoginUrl(provider: AuthProvider, returnTo = '/'): string {
  if (!SAFE_RETURN_TO.test(returnTo)) throw new Error('El destino posterior al acceso no es válido.');
  const url = new URL(`/v1/auth/login/${provider}`, LEARNING_API_URL);
  url.searchParams.set('returnTo', returnTo);
  url.searchParams.set('anonymousId', getLearningActorId());
  return url.toString();
}

export async function logoutAuthSession(): Promise<void> {
  const response = await learningApiRequest('/v1/auth/logout', { method: 'POST' });
  if (!response.ok && response.status !== 204) await readApiJson(response);
  setLearningCsrfToken(null);
}

export async function verifyAuthEmailCode(code: string): Promise<{ session: Extract<AuthSession, { authenticated: true }>; returnTo: string }> {
  const response = await learningApiRequest('/v1/auth/email/verify', {
    method: 'POST',
    headers: { 'x-auth-intent': 'verify-email' },
    body: JSON.stringify({ code }),
  });
  const payload = await readApiJson<Record<string, unknown>>(response);
  const session = parseSession(payload);
  if (!session.authenticated) throw new Error('La sesión verificada no es válida.');
  reconcileDeviceIdentity(session);
  setLearningCsrfToken(session.csrfToken);
  const returnTo = typeof payload.returnTo === 'string' && SAFE_RETURN_TO.test(payload.returnTo) ? payload.returnTo : '/';
  return { session, returnTo };
}

export async function resendAuthEmailCode(): Promise<void> {
  const response = await learningApiRequest('/v1/auth/email/resend', {
    method: 'POST',
    headers: { 'x-auth-intent': 'resend-email' },
    body: JSON.stringify({}),
  });
  await readApiJson(response);
}
