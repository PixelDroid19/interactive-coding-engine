import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, KeyRound, X } from 'lucide-react';
import { improvementApi } from '../services/improvementApi';

export function PrivateImprovementAccessDialog({ onClose, onUnlocked }: {
  onClose(): void;
  onUnlocked(): void;
}) {
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void improvementApi.privateAccessStatus()
      .then((status) => {
        if (!active) return;
        setEnabled(status.enabled);
        if (status.authorized) onUnlocked();
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'No pudimos comprobar el acceso.');
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => { active = false; };
  }, [onUnlocked]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting || code.length < 32) return;
    setSubmitting(true);
    setError(null);
    try {
      const status = await improvementApi.unlockPrivateAccess(code);
      if (!status.authorized) throw new Error('El acceso privado no es válido.');
      setCode('');
      onUnlocked();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'El acceso privado no es válido.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="email-verification" role="presentation">
      <section className="email-verification__panel" role="dialog" aria-modal="true" aria-labelledby="private-improvement-title">
        <button type="button" className="email-verification__close" onClick={onClose} aria-label="Cerrar acceso privado"><X size={20} /></button>
        <span className="email-verification__eyebrow"><KeyRound size={17} /> Capacidad limitada</span>
        <h2 id="private-improvement-title">Acceso privado a mejoras</h2>
        <p>Abre únicamente el espacio para pedir mejoras a la IA. No inicia una cuenta ni concede permisos administrativos.</p>
        {checking ? <p role="status">Comprobando acceso…</p> : enabled ? (
          <form onSubmit={(event) => void submit(event)}>
            <label htmlFor="private-improvement-code">Código privado</label>
            <input
              id="private-improvement-code"
              type="password"
              autoComplete="current-password"
              minLength={32}
              maxLength={256}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              aria-invalid={Boolean(error)}
              autoFocus
            />
            {error && <p className="email-verification__error" role="alert">{error}</p>}
            <button type="submit" className="email-verification__submit" disabled={submitting || code.length < 32}>
              {submitting ? 'Comprobando…' : <>Abrir Centro de mejoras <ArrowRight size={18} /></>}
            </button>
          </form>
        ) : <p className="email-verification__error" role="alert">El acceso privado no está habilitado en el servidor.</p>}
      </section>
    </div>
  );
}
