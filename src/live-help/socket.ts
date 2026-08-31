import { LEARNING_API_URL } from '../services/learningHttp';
import {
  LIVE_HELP_PROTOCOL,
  advanceLiveHelpReplayCursor,
  assertCanSendLiveHelpFrame,
  parseServerFrame,
  serializeClientFrame,
  type ClientFrame,
  type LiveHelpActorRole,
  type LiveHelpEvent,
  type LiveHelpTicket,
  type ServerFrame,
} from './protocol';

export type LiveHelpConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'offline';

interface SocketLike {
  readyState: number;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent<string>) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  send(data: string): void;
  close(): void;
}

export interface LiveHelpSocketOptions {
  sessionId: string;
  lastSeq?: number;
  getTicket(): Promise<LiveHelpTicket>;
  onState?(state: LiveHelpConnectionState): void;
  onFrame?(frame: ServerFrame): void;
  onEvents?(events: readonly LiveHelpEvent[]): void;
  onError?(error: Error): void;
  actorRole?: LiveHelpActorRole;
  allowedReadyRoles?: readonly LiveHelpActorRole[];
  webSocketFactory?(url: string, protocols: string[]): SocketLike;
}

const RECONNECT_DELAYS_MS = [350, 900, 1_800];
const STABLE_CONNECTION_MS = 30_000;
const HANDSHAKE_TIMEOUT_MS = 10_000;
const HEARTBEAT_GRACE_MULTIPLIER = 2;

function socketUrl(): string {
  const development = (import.meta.env as { DEV?: boolean }).DEV === true;
  if (development && typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/v1/live-help/ws`;
  }
  return `${LEARNING_API_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')}/v1/live-help/ws`;
}

export class LiveHelpSocket {
  private socket: SocketLike | null = null;
  private readySocket: SocketLike | null = null;
  private reconnectTimer: number | null = null;
  private stableTimer: number | null = null;
  private handshakeTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private heartbeatDelayMs = 0;
  private stopped = true;
  private reconnectAttempts = 0;
  private lastSeq: number;

  constructor(private readonly options: LiveHelpSocketOptions) {
    this.lastSeq = options.lastSeq ?? 0;
  }

  async connect(): Promise<void> {
    this.stopped = false;
    this.reconnectAttempts = 0;
    this.clearTimers();
    await this.open();
  }

  disconnect(): void {
    this.stopped = true;
    this.clearTimers();
    const socket = this.socket;
    this.socket = null;
    this.readySocket = null;
    socket?.close();
    this.options.onState?.('idle');
  }

  send(frame: ClientFrame): void {
    if (!this.socket || this.socket.readyState !== 1 || this.readySocket !== this.socket) throw new Error('La conexión de ayuda en vivo no está disponible.');
    if (this.options.actorRole) assertCanSendLiveHelpFrame(this.options.actorRole, frame);
    this.socket.send(serializeClientFrame(frame));
  }

  getLastSeq(): number { return this.lastSeq; }

  private async open(): Promise<void> {
    if (this.stopped) return;
    this.options.onState?.(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');
    try {
      const ticket = await this.options.getTicket();
      if (this.stopped) return;
      const factory = this.options.webSocketFactory ?? ((url: string, protocols: string[]) => new WebSocket(url, protocols));
      const socket = factory(socketUrl(), [LIVE_HELP_PROTOCOL, `lht.${ticket.ticket}`]);
      this.socket = socket;
      this.readySocket = null;
      this.scheduleHandshakeTimeout(socket);
      socket.onopen = () => { /* ready confirms authentication and triggers replay. */ };
      socket.onmessage = (event) => {
        if (this.socket !== socket || this.stopped) return;
        this.handleMessage(socket, event.data);
      };
      socket.onerror = () => {
        if (this.socket === socket && !this.stopped) this.options.onError?.(new Error('La conexión de ayuda en vivo encontró un problema.'));
      };
      socket.onclose = () => {
        if (this.socket !== socket) return;
        this.clearSocketTimers();
        this.socket = null;
        this.readySocket = null;
        this.scheduleReconnect();
      };
    } catch (error) {
      this.options.onError?.(error instanceof Error ? error : new Error('No pudimos abrir la ayuda en vivo.'));
      this.scheduleReconnect();
    }
  }

  private handleMessage(socket: SocketLike, raw: string): void {
    let frame: ServerFrame;
    try { frame = parseServerFrame(raw); }
    catch (error) {
      this.failAndReconnect(socket, error instanceof Error ? error : new Error('Frame de ayuda en vivo inválido.'));
      return;
    }
    if (frame.type === 'ready') {
      if (frame.session.id !== this.options.sessionId) {
        this.terminate(socket, new Error('El canal de ayuda en vivo confirmó una sesión distinta.'));
        return;
      }
      if (this.options.allowedReadyRoles && !this.options.allowedReadyRoles.includes(frame.session.role)) {
        this.terminate(socket, new Error('El canal de ayuda en vivo confirmó un rol no autorizado.'));
        return;
      }
      this.clearHandshakeTimer();
      this.readySocket = socket;
      this.armHeartbeat(socket, frame.heartbeatMs);
      this.options.onFrame?.(frame);
      this.options.onState?.('connected');
      this.scheduleStableReset();
      this.send({ type: 'replay', lastSeq: this.lastSeq });
      return;
    }
    if (this.readySocket !== socket) {
      this.failAndReconnect(socket, new Error('El canal de ayuda en vivo envió datos antes de confirmar la sesión.'));
      return;
    }
    this.touchHeartbeat(socket);
    this.options.onFrame?.(frame);
    if (frame.type === 'ping') {
      this.send({ type: 'pong' });
      return;
    }
    try {
      if (frame.type === 'event') {
        this.acceptEvents([frame.event]);
        return;
      }
      if (frame.type === 'replay') {
        const cursor = advanceLiveHelpReplayCursor(this.lastSeq, frame);
        this.acceptEvents(frame.items);
        if (this.socket !== socket || this.stopped) return;
        if (this.lastSeq !== cursor) throw new Error('Replay de ayuda en vivo inválido.');
        if (frame.hasMore) this.send({ type: 'replay', lastSeq: cursor });
      }
    } catch (error) {
      this.failAndReconnect(socket, error instanceof Error ? error : new Error('Replay de ayuda en vivo inválido.'));
    }
    if (frame.type === 'error') this.options.onError?.(new Error(frame.message));
  }

  private acceptEvents(events: readonly LiveHelpEvent[]): void {
    if (events.length === 0) return;
    let next = this.lastSeq;
    for (const event of events) {
      if (event.seq <= next) throw new Error('La secuencia de ayuda en vivo retrocedió.');
      next = event.seq;
    }
    this.lastSeq = next;
    this.options.onEvents?.(events);
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.reconnectTimer !== null) return;
    if (this.reconnectAttempts >= RECONNECT_DELAYS_MS.length) {
      this.stopped = true;
      this.options.onState?.('offline');
      return;
    }
    const delay = RECONNECT_DELAYS_MS[this.reconnectAttempts] ?? RECONNECT_DELAYS_MS.at(-1) ?? 1_800;
    this.reconnectAttempts += 1;
    this.options.onState?.('reconnecting');
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      void this.open();
    }, delay);
  }

  private scheduleStableReset(): void {
    if (this.stableTimer !== null) window.clearTimeout(this.stableTimer);
    this.stableTimer = window.setTimeout(() => { this.reconnectAttempts = 0; }, STABLE_CONNECTION_MS);
  }

  private scheduleHandshakeTimeout(socket: SocketLike): void {
    this.clearHandshakeTimer();
    this.handshakeTimer = window.setTimeout(() => {
      if (this.socket !== socket || this.readySocket === socket || this.stopped) return;
      this.failAndReconnect(socket, new Error('No pudimos confirmar la sesión de ayuda en vivo a tiempo.'));
    }, HANDSHAKE_TIMEOUT_MS);
  }

  private armHeartbeat(socket: SocketLike, heartbeatMs: number): void {
    if (this.heartbeatTimer !== null) window.clearTimeout(this.heartbeatTimer);
    this.heartbeatDelayMs = heartbeatMs;
    this.heartbeatTimer = window.setTimeout(() => {
      if (this.socket !== socket || this.readySocket !== socket || this.stopped) return;
      this.failAndReconnect(socket, new Error('La sesión de ayuda en vivo dejó de enviar señales.'));
    }, heartbeatMs * HEARTBEAT_GRACE_MULTIPLIER);
  }

  private touchHeartbeat(socket: SocketLike): void {
    if (this.heartbeatTimer === null || this.readySocket !== socket) return;
    // El temporizador se rearma usando el último valor confirmado por ready.
    const timeout = this.heartbeatTimer;
    window.clearTimeout(timeout);
    this.heartbeatTimer = null;
    // La demora no se puede recuperar desde un timeout; `ready` siempre arma el
    // temporizador y todas las señales posteriores llaman a esta rutina vía
    // `heartbeatDelayMs`.
    this.armHeartbeat(socket, this.heartbeatDelayMs);
  }

  private clearHandshakeTimer(): void {
    if (this.handshakeTimer !== null) window.clearTimeout(this.handshakeTimer);
    this.handshakeTimer = null;
  }

  private clearSocketTimers(): void {
    this.clearHandshakeTimer();
    if (this.heartbeatTimer !== null) window.clearTimeout(this.heartbeatTimer);
    this.heartbeatTimer = null;
    this.heartbeatDelayMs = 0;
  }

  private failAndReconnect(socket: SocketLike, error: Error): void {
    if (this.socket !== socket || this.stopped) return;
    this.options.onError?.(error);
    this.clearSocketTimers();
    socket.close();
  }

  private terminate(socket: SocketLike, error: Error): void {
    if (this.socket !== socket) return;
    this.options.onError?.(error);
    this.stopped = true;
    this.clearTimers();
    this.socket = null;
    this.readySocket = null;
    socket.close();
    this.options.onState?.('offline');
  }

  private clearTimers(): void {
    if (this.reconnectTimer !== null) window.clearTimeout(this.reconnectTimer);
    if (this.stableTimer !== null) window.clearTimeout(this.stableTimer);
    this.clearSocketTimers();
    this.reconnectTimer = null;
    this.stableTimer = null;
  }
}
