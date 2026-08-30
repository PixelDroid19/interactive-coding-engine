import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, MailCheck, X } from 'lucide-react';
import { useTheme } from '../themes/ThemeProvider';
import { useAuthSession } from './AuthSessionProvider';

export function EmailVerificationDialog() {
  const auth = useAuthSession();
  const { themeId } = useTheme();
  const [code, setCode] = useState('');
  const [now, setNow] = useState(Date.now());
  const input = useRef<HTMLInputElement>(null);
  const { verification } = auth;

  useEffect(() => {
    if (!verification.open) return;
    input.current?.focus();
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [verification.open]);

  if (!verification.open) return null;
  const seconds = Math.max(0, Math.ceil((verification.resendReadyAt - now) / 1000));

  return (
    <div className="email-verification" role="presentation">
      <section
        className="email-verification__panel"
        data-augmented-ui={themeId === 'cyber' ? 'verify-email-panel tl-clip tr-clip br-clip bl-clip border inlay' : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-verification-title"
      >
        <button type="button" className="email-verification__close" onClick={auth.dismissVerification} aria-label="Continuar sin iniciar sesión"><X size={20} /></button>
        <span className="email-verification__eyebrow"><MailCheck size={17} /> Correo protegido</span>
        <h2 id="email-verification-title">Confirma que eres tú</h2>
        <p>{verification.deliveryFailed
          ? <>La verificación de <strong>{verification.emailHint}</strong> sigue pendiente. La cuenta todavía no está abierta.</>
          : <>Enviamos un código de seis cifras a <strong>{verification.emailHint}</strong>. La cuenta todavía no está abierta.</>}</p>
        <form onSubmit={(event) => { event.preventDefault(); if (code.length === 6) void auth.verifyEmail(code); }}>
          <label htmlFor="email-code">Código de verificación</label>
          <input
            ref={input}
            id="email-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            aria-invalid={Boolean(verification.error)}
          />
          {verification.error && <p className="email-verification__error" role="alert">{verification.error}</p>}
          <button type="submit" className="email-verification__submit" disabled={verification.busy || code.length !== 6}>
            {verification.busy ? 'Comprobando…' : <>Confirmar y entrar <ArrowRight size={18} /></>}
          </button>
        </form>
        <div className="email-verification__footer">
          <button type="button" disabled={verification.busy || seconds > 0} onClick={() => void auth.resendCode()}>
            {seconds > 0 ? `Reenviar en ${seconds} s` : 'Reenviar código'}
          </button>
          <button type="button" onClick={auth.dismissVerification}>Seguir sin cuenta</button>
        </div>
      </section>
    </div>
  );
}
