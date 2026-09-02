// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountMenu } from './AccountMenu';
import { AuthSessionProvider } from './AuthSessionProvider';

const mocks = vi.hoisted(() => ({
  fetchAuthSession: vi.fn(),
  logoutAuthSession: vi.fn(),
  getAuthLoginUrl: vi.fn((provider: string) => `https://api.example.test/v1/auth/login/${provider}`),
  verifyAuthEmailCode: vi.fn(),
  resendAuthEmailCode: vi.fn(),
  privateAccessStatus: vi.fn(),
  unlockPrivateAccess: vi.fn(),
  list: vi.fn(),
  listCycles: vi.fn(),
}));

vi.mock('../services/authSessionApi', async () => {
  const actual = await vi.importActual('../services/authSessionApi');
  return { ...actual, ...mocks };
});

vi.mock('../services/improvementApi', async () => ({
  ...(await vi.importActual('../services/improvementApi')),
  improvementApi: {
    privateAccessStatus: mocks.privateAccessStatus,
    unlockPrivateAccess: mocks.unlockPrivateAccess,
    list: mocks.list,
    listCycles: mocks.listCycles,
    create: vi.fn(),
    vote: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState({}, '', '/');
  mocks.privateAccessStatus.mockResolvedValue({ enabled: true, authorized: false });
  mocks.list.mockResolvedValue([]);
  mocks.listCycles.mockResolvedValue([]);
});

afterEach(() => cleanup());

describe('cuenta de la plataforma', () => {
  it('ofrece el acceso privado a mejoras aunque no haya proveedor configurado', async () => {
    mocks.fetchAuthSession.mockResolvedValue({ authenticated: false, providers: [] });
    mocks.unlockPrivateAccess.mockResolvedValue({
      enabled: true, authorized: true, csrfToken: 'private-csrf-token-with-enough-length-123',
      expiresAt: '2026-09-02T12:15:00.000Z',
    });
    render(<AuthSessionProvider><AccountMenu /></AuthSessionProvider>);

    fireEvent.click(await screen.findByRole('button', { name: 'Acceso privado' }));
    fireEvent.click(screen.getByRole('button', { name: 'Acceso privado a mejoras' }));
    expect(await screen.findByRole('dialog', { name: 'Acceso privado a mejoras' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Código privado'), {
      target: { value: 'private-code-with-at-least-32-characters' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Centro de mejoras' }));

    await waitFor(() => expect(mocks.unlockPrivateAccess)
      .toHaveBeenCalledWith('private-code-with-at-least-32-characters'));
    expect(await screen.findByRole('dialog', { name: 'Mejorar la plataforma' })).toBeTruthy();
    expect(screen.getByText('Mejoras de la comunidad')).toBeTruthy();
  });

  it('muestra solo los proveedores habilitados por el backend', async () => {
    mocks.fetchAuthSession.mockResolvedValue({ authenticated: false, providers: ['microsoft', 'google'] });
    render(<AuthSessionProvider><AccountMenu /></AuthSessionProvider>);

    fireEvent.click(await screen.findByRole('button', { name: 'Entrar' }));
    expect(screen.getByRole('button', { name: 'Continuar con EPAM' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continuar con Google' })).toBeTruthy();
  });

  it('presenta la identidad validada, sus roles y cierra la sesión', async () => {
    mocks.fetchAuthSession
      .mockResolvedValueOnce({
        authenticated: true,
        user: { id: 'user-1', email: 'persona@epam.com', displayName: 'Persona EPAM', roles: ['student', 'tutor'] },
        csrfToken: 'csrf-token-seguro',
      })
      .mockResolvedValueOnce({ authenticated: false, providers: ['microsoft'] });
    mocks.logoutAuthSession.mockResolvedValue(undefined);
    render(<AuthSessionProvider><AccountMenu /></AuthSessionProvider>);

    fireEvent.click(await screen.findByRole('button', { name: 'Cuenta de Persona EPAM' }));
    expect(screen.getByText('persona@epam.com')).toBeTruthy();
    expect(screen.getByText('Tutor')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    await waitFor(() => expect(mocks.logoutAuthSession).toHaveBeenCalledOnce());
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeTruthy();
  });

  it('conserva el error del callback aunque la comprobación anónima termine después', async () => {
    window.history.replaceState({}, '', '/?auth=error&code=IDENTITY_ACCESS_DENIED');
    mocks.fetchAuthSession.mockResolvedValue({ authenticated: false, providers: ['google'] });
    render(<AuthSessionProvider><AccountMenu /></AuthSessionProvider>);

    expect((await screen.findByRole('button', { name: 'Reintentar sesión' })).getAttribute('title'))
      .toBe('Esta cuenta no está autorizada para acceder.');
    expect(window.location.search).toBe('');
  });

  it('bloquea la sesión hasta confirmar el código recibido por correo', async () => {
    window.history.replaceState({}, '', '/?auth=verify&email=p*******%40gmail.com');
    mocks.fetchAuthSession.mockResolvedValue({ authenticated: false, providers: ['google'] });
    mocks.verifyAuthEmailCode.mockResolvedValue({
      returnTo: '/',
      session: {
        authenticated: true,
        user: { id: 'user-verified', email: 'persona@gmail.com', displayName: 'Persona', roles: ['student'] },
        csrfToken: 'csrf-token-confirmado-y-seguro',
      },
    });
    render(<AuthSessionProvider><AccountMenu /></AuthSessionProvider>);

    expect(await screen.findByRole('dialog', { name: 'Confirma que eres tú' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Código de verificación'), { target: { value: '482901' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar y entrar' }));

    await waitFor(() => expect(mocks.verifyAuthEmailCode).toHaveBeenCalledWith('482901'));
    expect(await screen.findByRole('button', { name: 'Cuenta de Persona' })).toBeTruthy();
    expect(window.location.search).toBe('');
  });

  it('no vuelve a pedir el código cuando ya existe una sesión válida', async () => {
    window.history.replaceState({}, '', '/?auth=verify&email=p*******%40gmail.com');
    mocks.fetchAuthSession.mockResolvedValue({
      authenticated: true,
      user: { id: 'user-verified', email: 'persona@gmail.com', displayName: 'Persona', roles: ['student'] },
      csrfToken: 'csrf-token-confirmado-y-seguro',
    });
    render(<AuthSessionProvider><AccountMenu /></AuthSessionProvider>);

    expect(await screen.findByRole('button', { name: 'Cuenta de Persona' })).toBeTruthy();
    expect(screen.queryByRole('dialog', { name: 'Confirma que eres tú' })).toBeNull();
    expect(window.location.search).toBe('');
  });

  it('conserva parámetros code ajenos al callback de verificación', async () => {
    window.history.replaceState({}, '', '/?code=curso-01');
    mocks.fetchAuthSession.mockResolvedValue({
      authenticated: true,
      user: { id: 'user-verified', email: 'persona@gmail.com', displayName: 'Persona', roles: ['student'] },
      csrfToken: 'csrf-token-confirmado-y-seguro',
    });
    render(<AuthSessionProvider><AccountMenu /></AuthSessionProvider>);

    expect(await screen.findByRole('button', { name: 'Cuenta de Persona' })).toBeTruthy();
    expect(window.location.search).toBe('?code=curso-01');
  });

  it('conserva la verificación y explica cómo recuperarla si falla el primer envío', async () => {
    window.history.replaceState({}, '', '/?auth=verify&email=p*******%40gmail.com&delivery=failed');
    mocks.fetchAuthSession.mockResolvedValue({ authenticated: false, providers: ['google'] });
    render(<AuthSessionProvider><AccountMenu /></AuthSessionProvider>);

    expect(await screen.findByRole('dialog', { name: 'Confirma que eres tú' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('No pudimos entregar el primer correo');
    expect(screen.queryByText(/Enviamos un código de seis cifras/)).toBeNull();
    expect((screen.getByRole('button', { name: /Reenviar en/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});
