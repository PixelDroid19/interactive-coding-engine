import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserRound, LogIn } from 'lucide-react';
import { type AuthProvider, type UserRole, getDevMockRole, setDevMockRole } from '../services/authSessionApi';
import { useAuthSession } from './AuthSessionProvider';
import { useTheme } from '../themes/ThemeProvider';
import { StaffDashboard } from './StaffDashboard';
import { LearnerSupportPanel } from './LearnerSupportPanel';

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
  const { themeId } = useTheme();
  const isCyber = themeId === 'cyber';
  const [open, setOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const staffIdentityRef = useRef<string | null>(null);

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

  const staffSession = auth.status === 'ready' && auth.session.authenticated ? auth.session : null;
  const staffIdentity = staffSession?.user.roles.some((role) => role === 'tutor' || role === 'admin')
    ? { userId: staffSession.user.id, roles: staffSession.user.roles }
    : null;
  const staffIdentityKey = staffIdentity ? `${staffIdentity.userId}\u0000${staffIdentity.roles.slice().sort().join(',')}` : null;
  useEffect(() => {
    const previousIdentity = staffIdentityRef.current;
    staffIdentityRef.current = staffIdentityKey;
    if (staffOpen && (!staffIdentityKey || (previousIdentity !== null && previousIdentity !== staffIdentityKey))) setStaffOpen(false);
  }, [staffIdentityKey, staffOpen]);

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
  const canOpenMenu = !noProviders || import.meta.env.DEV;
  const displayName = signedInSession ? signedInSession.user.displayName || signedInSession.user.email.split('@')[0]! : '';
  const triggerLabel = authenticated ? `Cuenta de ${displayName}` : noProviders ? 'Sesión local' : 'Entrar';
  const isStaff = Boolean(staffIdentity);
  const isAdmin = Boolean(signedInSession?.user.roles.includes('admin'));

  return (
    <div className="account-control" ref={root}>
      <button
        type="button"
        className={`account-trigger${authenticated ? ' is-authenticated' : ''}`}
        data-augmented-ui={isCyber ? "hud-account-btn tl-clip br-clip border inlay" : undefined}
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

      {open && canOpenMenu && (
        <section
          className="account-menu"
          data-augmented-ui={isCyber ? "hud-account-menu tl-clip tr-clip br-clip bl-clip border inlay" : undefined}
          aria-label={authenticated ? 'Cuenta' : 'Acceso'}
        >
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
              <button type="button" className="account-menu__action account-menu__action--primary" onClick={() => { setOpen(false); setSupportOpen(true); }}>
                Mensajes y feedback
              </button>
              {isStaff && <button type="button" className="account-menu__action account-menu__action--primary" onClick={() => { setOpen(false); setStaffOpen(true); }}>
                Abrir panel de seguimiento
              </button>}
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
                  <button
                    type="button"
                    key={provider}
                    className={`account-provider-btn account-provider-btn--${provider}`}
                    onClick={() => auth.login(provider)}
                  >
                    <LogIn size={15} aria-hidden="true" className="account-provider-btn__icon" />
                    <span>{PROVIDER_LABEL[provider]}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {import.meta.env.DEV && (
            <div className="account-menu__dev-tools">
              <span>[DEV] Simular Rol Local</span>
              <div className="account-menu__dev-roles">
                <button
                  type="button"
                  className={getDevMockRole() === 'admin' ? 'is-active' : ''}
                  onClick={() => {
                    setDevMockRole('admin');
                    void auth.refresh();
                  }}
                >
                  Rol: Admin
                </button>
                <button
                  type="button"
                  className={getDevMockRole() === 'tutor' ? 'is-active' : ''}
                  onClick={() => {
                    setDevMockRole('tutor');
                    void auth.refresh();
                  }}
                >
                  Rol: Tutor
                </button>
                <button
                  type="button"
                  className={getDevMockRole() === 'student' ? 'is-active' : ''}
                  onClick={() => {
                    setDevMockRole('student');
                    void auth.refresh();
                  }}
                >
                  Rol: Alumno
                </button>
                <button
                  type="button"
                  className={!getDevMockRole() ? 'is-active' : ''}
                  onClick={() => {
                    setDevMockRole(null);
                    void auth.refresh();
                  }}
                >
                  Real / Reset
                </button>
              </div>
            </div>
          )}
        </section>
      )}
      {staffOpen && staffIdentity && createPortal(<StaffDashboard canAdmin={isAdmin} staffIdentity={staffIdentity} onClose={() => setStaffOpen(false)} />, document.body)}
      {supportOpen && signedInSession && createPortal(<LearnerSupportPanel userId={signedInSession.user.id} onClose={() => setSupportOpen(false)} />, document.body)}
    </div>
  );
}
