const DEFAULT_API_URL = 'https://api-production-df85c.up.railway.app';
export const LEARNING_API_URL = (import.meta.env.VITE_LEARNING_API_URL || DEFAULT_API_URL).replace(/\/$/, '');

const ACTOR_KEY = 'aula_anonymous_actor_v1';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getLearningActorId(): string {
  try {
    const existing = localStorage.getItem(ACTOR_KEY);
    if (existing && UUID.test(existing)) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem(ACTOR_KEY, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

export async function learningApiRequest(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${LEARNING_API_URL}${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      'x-anonymous-id': getLearningActorId(),
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
    signal: init.signal ?? AbortSignal.timeout(10_000),
  });
}

export async function readApiJson<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  let message = `La solicitud falló (HTTP ${response.status}).`;
  try {
    const payload = await response.json() as { error?: { message?: string } };
    if (payload.error?.message) message = payload.error.message;
  } catch {
    // El cuerpo puede estar vacío en fallos de red intermedios.
  }
  throw new Error(message);
}
