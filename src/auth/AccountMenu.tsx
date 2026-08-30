import React, { useEffect, useRef, useState } from 'react';
import { UserRound } from 'lucide-react';
import type { AuthProvider, UserRole } from '../services/authSessionApi';
import { useAuthSession } from './AuthSessionProvider';

const ROLE_LABEL: Record<UserRole, string> = {
  student: 'Estudiante',
  tutor: 'Tutor',
  admin: 'Administrador',
};

const PROVIDER_LABEL: Record<AuthProvider, string> = {
  microsoft: 'Continuar con EPAM',
  google: 'Continuar con Google',
};

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'ID';
}

export function AccountMenu() {
  const auth = useAuthSession();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  if (auth.status === 'loading') {
    return <span className="account-trigger account-trigger--loading" role="status" aria-label="Comprobando sesión"><i /></span>;
  }

  if (auth.status === 'error') {
    return (
      <button type="button" className="account-trigger account-trigger--error" onClick={() => void auth.refresh()} title={auth.error}>
        Reintentar sesión
      </button>
    );
  }

  const session = auth.session;
  const authenticated = session.authenticated;
  const providers = 'providers' in session ? session.providers : [];
  const signedInSession = session.authenticated ? session : null;
  const noProviders = !authenticated && providers.length === 0;
  const displayName = signedInSession ? signedInSession.user.displayName || signedInSession.user.email.split('@')[0]! : '';
  const triggerLabel = authenticated ? `Cuenta de ${displayName}` : noProviders ? 'Sesión local' : 'Entrar';

  return (
    <div className="account-control" ref={root}>
      <button
        type="button"
        className={`account-trigger${authenticated ? ' is-authenticated' : ''}`}
        aria-label={triggerLabel}
        aria-expanded={noProviders ? undefined : open}
        disabled={noProviders}
        title={noProviders ? 'El acceso se habilitará cuando exista un proveedor OIDC configurado.' : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        {authenticated && <span className="account-monogram" aria-hidden="true">{initials(displayName)}</span>}
        {!authenticated && <UserRound size={15} aria-hidden="true" />}
        <span className="account-trigger__label">{authenticated ? displayName : triggerLabel}</span>
      </button>

      {open && !noProviders && (
        <section className="account-menu" aria-label={authenticated ? 'Cuenta' : 'Acceso'}>
          {authenticated ? (
            <>
              <div className="account-menu__identity">
                <span>Cuenta verificada</span>
                <strong>{displayName}</strong>
                <p>{signedInSession!.user.email}</p>
              </div>
              <div className="account-menu__roles" aria-label="Roles">
                {signedInSession!.user.roles.map((role) => <span key={role}>{ROLE_LABEL[role]}</span>)}
              </div>
              <button type="button" className="account-menu__action" disabled={auth.busy} onClick={() => void auth.logout()}>
                {auth.busy ? 'Cerrando…' : 'Cerrar sesión'}
              </button>
            </>
          ) : (
            <>
              <div className="account-menu__identity">
                <span>Guarda tu recorrido</span>
                <strong>Continúa en cualquier dispositivo</strong>
                <p>Tu progreso local se conservará al vincular la cuenta.</p>
              </div>
              <div className="account-menu__providers">
                {providers.map((provider) => (
                  <button type="button" key={provider} onClick={() => auth.login(provider)}>{PROVIDER_LABEL[provider]}</button>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
