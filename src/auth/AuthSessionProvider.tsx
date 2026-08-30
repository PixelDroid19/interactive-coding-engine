import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchAuthSession,
  getAuthLoginUrl,
  logoutAuthSession,
  resendAuthEmailCode,
  verifyAuthEmailCode,
  type AuthProvider,
  type AuthSession,
} from '../services/authSessionApi';
import { EmailVerificationDialog } from './EmailVerificationDialog';
import { flushLearningQueue } from '../services/learningSync';

type AuthState =
  | Readonly<{ status: 'loading'; session: null; error: null }>
  | Readonly<{ status: 'ready'; session: AuthSession; error: null }>
  | Readonly<{ status: 'error'; session: null; error: string }>;

type AuthContextValue = AuthState & Readonly<{
  busy: boolean;
  login(provider: AuthProvider): void;
  logout(): Promise<void>;
  refresh(): Promise<void>;
  verification: Readonly<{ open: boolean; emailHint: string; error: string | null; busy: boolean; resendReadyAt: number }>;
  verifyEmail(code: string): Promise<void>;
  resendCode(): Promise<void>;
  dismissVerification(): void;
}>;

const AuthSessionContext = createContext<AuthContextValue | null>(null);

function authErrorMessage(code: string | null): string | null {
  if (!code) return null;
  if (code === 'IDENTITY_ACCESS_DENIED') return 'Esta cuenta no está autorizada para acceder.';
  if (code === 'IDENTITY_EMAIL_UNVERIFIED') return 'La cuenta debe tener el correo verificado.';
  if (code === 'USER_BLOCKED') return 'Esta cuenta está bloqueada.';
  if (code === 'PROVIDER_REJECTED') return 'El acceso fue cancelado en el proveedor.';
  return 'No se pudo completar el acceso. Inténtalo otra vez.';
}

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', session: null, error: null });
  const [busy, setBusy] = useState(false);
  const [verification, setVerification] = useState(() => {
    const url = new URL(window.location.href);
    return {
      open: url.searchParams.get('auth') === 'verify',
      emailHint: url.searchParams.get('email') || 'tu correo',
      error: null as string | null,
      busy: false,
      resendReadyAt: Date.now() + 60_000,
    };
  });
  const callbackError = useRef<string | null | undefined>(undefined);
  if (callbackError.current === undefined) {
    const url = new URL(window.location.href);
    callbackError.current = url.searchParams.get('auth') === 'error'
      ? authErrorMessage(url.searchParams.get('code'))
      : null;
  }

  const refresh = useCallback(async () => {
    const pendingCallbackError = callbackError.current;
    callbackError.current = null;
    try {
      const session = await fetchAuthSession();
      if (!session.authenticated && pendingCallbackError) {
        setState({ status: 'error', session: null, error: pendingCallbackError });
      } else {
        setState({ status: 'ready', session, error: null });
      }
      if (session.authenticated) void flushLearningQueue();
      window.dispatchEvent(new CustomEvent('aula-auth-session', { detail: { authenticated: session.authenticated } }));
    } catch {
      setState({ status: 'error', session: null, error: 'No se pudo comprobar la sesión. Puedes seguir trabajando en este dispositivo.' });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('auth') !== 'error') return;
    url.searchParams.delete('auth');
    url.searchParams.delete('code');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const login = useCallback((provider: AuthProvider) => {
    window.location.assign(getAuthLoginUrl(provider, '/'));
  }, []);

  const logout = useCallback(async () => {
    setBusy(true);
    try {
      await logoutAuthSession();
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const clearVerificationQuery = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('auth');
    url.searchParams.delete('email');
    url.searchParams.delete('code');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const verifyEmail = useCallback(async (code: string) => {
    setVerification((current) => ({ ...current, busy: true, error: null }));
    try {
      const { session, returnTo } = await verifyAuthEmailCode(code);
      setState({ status: 'ready', session, error: null });
      setVerification((current) => ({ ...current, open: false, busy: false }));
      clearVerificationQuery();
      void flushLearningQueue();
      window.dispatchEvent(new CustomEvent('aula-auth-session', { detail: { authenticated: true } }));
      if (returnTo !== '/' && returnTo !== window.location.pathname) window.location.assign(returnTo);
    } catch (error) {
      setVerification((current) => ({
        ...current, busy: false,
        error: error instanceof Error ? error.message : 'No pudimos comprobar el código.',
      }));
    }
  }, [clearVerificationQuery]);

  const resendCode = useCallback(async () => {
    if (Date.now() < verification.resendReadyAt) return;
    setVerification((current) => ({ ...current, busy: true, error: null }));
    try {
      await resendAuthEmailCode();
      setVerification((current) => ({ ...current, busy: false, resendReadyAt: Date.now() + 60_000 }));
    } catch (error) {
      setVerification((current) => ({
        ...current, busy: false,
        error: error instanceof Error ? error.message : 'No pudimos reenviar el código.',
      }));
    }
  }, [verification.resendReadyAt]);

  const dismissVerification = useCallback(() => {
    clearVerificationQuery();
    setVerification((current) => ({ ...current, open: false, error: null }));
  }, [clearVerificationQuery]);

  const value = useMemo<AuthContextValue>(() => ({
    ...state, busy, login, logout, refresh, verification, verifyEmail, resendCode, dismissVerification,
  }), [busy, dismissVerification, login, logout, refresh, resendCode, state, verification, verifyEmail]);
  return (
    <AuthSessionContext.Provider value={value}>
      {children}
      <EmailVerificationDialog />
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthContextValue {
  const value = useContext(AuthSessionContext);
  if (!value) throw new Error('useAuthSession debe usarse dentro de AuthSessionProvider.');
  return value;
}
