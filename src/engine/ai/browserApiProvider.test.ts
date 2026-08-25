import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserApiProvider, ProviderSessionStore } from './browserApiProvider';

const secret = 'clave-super-secreta';

describe('BrowserApiProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['openai-compatible', 'https://api.openai.com/v1/chat/completions', 'Authorization'],
    ['gemini', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', 'x-goog-api-key'],
    ['anthropic', 'https://api.anthropic.com/v1/messages', 'x-api-key'],
  ] as const)('envía la clave de %s solo en un encabezado', async (kind, endpoint, headerName) => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify(
      kind === 'gemini'
        ? { candidates: [{ content: { parts: [{ text: 'respuesta' }] } }] }
        : kind === 'anthropic'
          ? { content: [{ type: 'text', text: 'respuesta' }] }
          : { choices: [{ message: { content: 'respuesta' } }] },
    ), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    const localWrite = vi.spyOn(Storage.prototype, 'setItem');
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const provider = new BrowserApiProvider({ kind, apiKey: secret, model: kind === 'gemini' ? 'gemini-2.5-flash' : 'modelo' }, fetcher);

    const result = await provider.generate({ messages: [{ role: 'user', content: 'Explícame RAG' }] });

    expect(result.text).toBe('respuesta');
    const [url, init] = fetcher.mock.calls[0];
    expect(String(url)).toBe(endpoint);
    expect(String(url)).not.toContain(secret);
    expect(String(init?.body)).not.toContain(secret);
    expect(new Headers(init?.headers).get(headerName)).toContain(secret);
    expect(localWrite).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it('rechaza endpoints inseguros salvo localhost', () => {
    expect(() => new BrowserApiProvider({
      kind: 'openai-compatible',
      apiKey: secret,
      model: 'modelo',
      endpoint: 'http://servidor-remoto.test/v1/chat/completions',
    })).toThrow(/HTTPS/);

    expect(() => new BrowserApiProvider({
      kind: 'openai-compatible',
      apiKey: secret,
      model: 'modelo',
      endpoint: 'http://localhost:11434/v1/chat/completions',
    })).not.toThrow();
  });

  it('borra las claves de la sesión sin usar almacenamiento persistente', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const store = new ProviderSessionStore();

    store.set('curso-ai', { kind: 'gemini', apiKey: secret, model: 'gemini-2.5-flash' });
    expect(store.get('curso-ai')?.apiKey).toBe(secret);
    store.clear('curso-ai');

    expect(store.get('curso-ai')).toBeNull();
    expect(setItem).not.toHaveBeenCalled();
  });

  it('elimina la clave incluso de errores producidos por fetch', async () => {
    const provider = new BrowserApiProvider(
      { kind: 'openai-compatible', apiKey: secret, model: 'modelo' },
      vi.fn(async () => { throw new Error(`falló ${secret}`); }),
    );

    await expect(provider.generate({ messages: [{ role: 'user', content: 'hola' }] }))
      .rejects.not.toThrow(secret);
  });
});
