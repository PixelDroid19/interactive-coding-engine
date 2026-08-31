// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LiveHelpSocket } from './socket';

class FakeSocket {
  static instances: FakeSocket[] = [];
  readonly sent: string[] = [];
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState = 0;

  constructor(readonly url: string, readonly protocols: string[]) {
    FakeSocket.instances.push(this);
  }

  send(data: string) { this.sent.push(data); }
  close() { this.readyState = 3; this.onclose?.(new CloseEvent('close')); }
  open() { this.readyState = 1; this.onopen?.(new Event('open')); }
  message(value: unknown) { this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(value) })); }
  disconnect() { this.readyState = 3; this.onclose?.(new CloseEvent('close')); }
}

afterEach(() => {
  FakeSocket.instances = [];
  vi.useRealTimers();
});

describe('socket de ayuda en vivo', () => {
  it('usa tickets efímeros, solicita replay tras ready y detiene reintentos después del límite', async () => {
    vi.useFakeTimers();
    const getTicket = vi.fn().mockResolvedValue({
      ticket: 'ticket-efímero', expiresAt: '2026-08-30T12:10:00.000Z', protocol: 'live-help-v1' as const,
    });
    const states: string[] = [];
    const socket = new LiveHelpSocket({
      sessionId: 'session-1',
      lastSeq: 7,
      getTicket,
      webSocketFactory: (url, protocols) => new FakeSocket(url, protocols) as unknown as WebSocket,
      onState: (state) => states.push(state),
    });

    await socket.connect();
    expect(FakeSocket.instances[0]?.protocols).toEqual(['live-help-v1', 'lht.ticket-efímero']);
    FakeSocket.instances[0]?.open();
    FakeSocket.instances[0]?.message({ type: 'ready', session: { id: 'session-1', status: 'active', role: 'student' }, heartbeatMs: 15000 });
    expect(FakeSocket.instances[0]?.sent.map((frame) => JSON.parse(frame))).toContainEqual({ type: 'replay', lastSeq: 7 });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      FakeSocket.instances.at(-1)?.disconnect();
      await vi.advanceTimersByTimeAsync(2_000);
      const next = FakeSocket.instances.at(-1);
      next?.open();
      next?.message({ type: 'ready', session: { id: 'session-1', status: 'active', role: 'student' }, heartbeatMs: 15000 });
    }
    FakeSocket.instances.at(-1)?.disconnect();
    await vi.advanceTimersByTimeAsync(5_000);

    expect(FakeSocket.instances).toHaveLength(4);
    expect(getTicket).toHaveBeenCalledTimes(4);
    expect(states).toContain('reconnecting');
    expect(states.at(-1)).toBe('offline');
  });

  it('no autentica ni reproduce un canal cuyo ready pertenece a otra sesión', async () => {
    const onError = vi.fn();
    const socket = new LiveHelpSocket({
      sessionId: 'session-1',
      getTicket: vi.fn().mockResolvedValue({ ticket: 'ticket-efímero', expiresAt: '2026-08-30T12:10:00.000Z', protocol: 'live-help-v1' as const }),
      webSocketFactory: (url, protocols) => new FakeSocket(url, protocols) as unknown as WebSocket,
      onError,
    });

    await socket.connect();
    FakeSocket.instances[0]?.open();
    FakeSocket.instances[0]?.message({ type: 'ready', session: { id: 'session-ajena', status: 'active', role: 'student' }, heartbeatMs: 15000 });

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('sesión') }));
    expect(FakeSocket.instances[0]?.sent).toEqual([]);
    expect(FakeSocket.instances[0]?.readyState).toBe(3);
  });

  it('drena páginas de replay sin reutilizar una secuencia anterior', async () => {
    const received: number[] = [];
    const socket = new LiveHelpSocket({
      sessionId: 'session-1',
      lastSeq: 7,
      getTicket: vi.fn().mockResolvedValue({ ticket: 'ticket-efímero', expiresAt: '2026-08-30T12:10:00.000Z', protocol: 'live-help-v1' as const }),
      webSocketFactory: (url, protocols) => new FakeSocket(url, protocols) as unknown as WebSocket,
      onEvents: (events) => received.push(...events.map((event) => event.seq)),
    });

    await socket.connect();
    const channel = FakeSocket.instances[0]!;
    channel.open();
    channel.message({ type: 'ready', session: { id: 'session-1', status: 'active', role: 'student' }, heartbeatMs: 15000 });
    channel.message({
      type: 'replay', lastSeq: 8, hasMore: true,
      items: [{ seq: 8, type: 'chat', actorRole: 'student', createdAt: '2026-08-30T12:01:00.000Z', payload: { body: 'primero' } }],
    });
    channel.message({
      type: 'replay', lastSeq: 9, hasMore: false,
      items: [{ seq: 9, type: 'chat', actorRole: 'tutor', createdAt: '2026-08-30T12:02:00.000Z', payload: { body: 'segundo' } }],
    });

    expect(channel.sent.map((frame) => JSON.parse(frame))).toEqual([
      { type: 'replay', lastSeq: 7 },
      { type: 'replay', lastSeq: 8 },
    ]);
    expect(received).toEqual([8, 9]);
    expect(socket.getLastSeq()).toBe(9);
  });

  it('no permite enviar antes del ready ni cruzar las acciones reservadas de cada rol', async () => {
    const student = new LiveHelpSocket({
      sessionId: 'session-1',
      actorRole: 'student',
      getTicket: vi.fn().mockResolvedValue({ ticket: 'ticket-estudiante', expiresAt: '2026-08-30T12:10:00.000Z', protocol: 'live-help-v1' as const }),
      webSocketFactory: (url, protocols) => new FakeSocket(url, protocols) as unknown as WebSocket,
    });
    await student.connect();
    const studentChannel = FakeSocket.instances[0]!;
    studentChannel.open();
    expect(() => student.send({ type: 'chat', body: 'Aún no hay ready' })).toThrow('no está disponible');
    studentChannel.message({ type: 'ready', session: { id: 'session-1', status: 'active', role: 'student' }, heartbeatMs: 15_000 });
    expect(() => student.send({
      type: 'patch-proposal', proposalId: '30000000-0000-4000-8000-000000000003', summary: 'No corresponde',
      patch: { baseRevision: 0, files: [{ path: 'app.js', content: 'const x = 1;' }] },
    })).toThrow('frame');

    const tutor = new LiveHelpSocket({
      sessionId: 'session-2',
      actorRole: 'tutor',
      getTicket: vi.fn().mockResolvedValue({ ticket: 'ticket-tutor', expiresAt: '2026-08-30T12:10:00.000Z', protocol: 'live-help-v1' as const }),
      webSocketFactory: (url, protocols) => new FakeSocket(url, protocols) as unknown as WebSocket,
    });
    await tutor.connect();
    const tutorChannel = FakeSocket.instances[1]!;
    tutorChannel.open();
    tutorChannel.message({ type: 'ready', session: { id: 'session-2', status: 'active', role: 'tutor' }, heartbeatMs: 15_000 });
    expect(() => tutor.send({ type: 'snapshot', revision: 0, files: [{ path: 'app.js', content: 'const x = 1;' }] })).toThrow('frame');
  });

  it('cierra un intento que no entrega ready ni señales dentro de los límites de tiempo', async () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const socket = new LiveHelpSocket({
      sessionId: 'session-1',
      getTicket: vi.fn().mockResolvedValue({ ticket: 'ticket-efímero', expiresAt: '2026-08-30T12:10:00.000Z', protocol: 'live-help-v1' as const }),
      webSocketFactory: (url, protocols) => new FakeSocket(url, protocols) as unknown as WebSocket,
      onError,
    });

    await socket.connect();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('confirmar') }));
    expect(FakeSocket.instances[0]?.readyState).toBe(3);
  });

  it('cierra el canal confirmado cuando deja de recibir heartbeats', async () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const socket = new LiveHelpSocket({
      sessionId: 'session-1',
      getTicket: vi.fn().mockResolvedValue({ ticket: 'ticket-efímero', expiresAt: '2026-08-30T12:10:00.000Z', protocol: 'live-help-v1' as const }),
      webSocketFactory: (url, protocols) => new FakeSocket(url, protocols) as unknown as WebSocket,
      onError,
    });

    await socket.connect();
    const channel = FakeSocket.instances[0]!;
    channel.open();
    channel.message({ type: 'ready', session: { id: 'session-1', status: 'active', role: 'student' }, heartbeatMs: 1_000 });
    await vi.advanceTimersByTimeAsync(2_000);

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('señales') }));
    expect(channel.readyState).toBe(3);
  });
});
