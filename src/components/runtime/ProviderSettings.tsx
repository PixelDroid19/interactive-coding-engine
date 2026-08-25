import React, { useState } from 'react';
import { ShieldAlert, Trash2 } from 'lucide-react';
import { ProviderSessionStore } from '../../engine/ai/browserApiProvider';
import type { BrowserProviderConfig } from '../../engine/ai/learningProvider';

interface ProviderSettingsProps {
  scope: string;
  store: ProviderSessionStore;
  onConfigured?: (config: BrowserProviderConfig | null) => void;
}

const DEFAULT_MODELS: Record<BrowserProviderConfig['kind'], string> = {
  'openai-compatible': '',
  gemini: 'gemini-2.5-flash',
  anthropic: 'claude-sonnet-4-5',
};

export function ProviderSettings({ scope, store, onConfigured }: ProviderSettingsProps) {
  const previous = store.get(scope);
  const [kind, setKind] = useState<BrowserProviderConfig['kind']>(previous?.kind ?? 'openai-compatible');
  const [model, setModel] = useState(previous?.model ?? '');
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState(previous?.endpoint ?? '');
  const [saved, setSaved] = useState(Boolean(previous));

  const handleKind = (next: BrowserProviderConfig['kind']) => {
    setKind(next);
    setModel(DEFAULT_MODELS[next]);
    setEndpoint('');
    setSaved(false);
  };

  const save = () => {
    const config: BrowserProviderConfig = {
      kind,
      model: model.trim(),
      apiKey,
      ...(endpoint.trim() ? { endpoint: endpoint.trim() } : {}),
    };
    store.set(scope, config);
    setApiKey('');
    setSaved(true);
    onConfigured?.(config);
  };

  const clear = () => {
    store.clear(scope);
    setApiKey('');
    setSaved(false);
    onConfigured?.(null);
  };

  return (
    <section className="provider-settings" aria-labelledby="provider-settings-title">
      <div className="provider-settings-heading">
        <div>
          <span className="provider-settings-kicker">API opcional</span>
          <h2 id="provider-settings-title">Probar con un proveedor real</h2>
        </div>
        {saved && <span className="provider-session-badge">Activa en esta pestaña</span>}
      </div>

      <div className="provider-security-note" role="note">
        <ShieldAlert size={18} />
        <p>
          La clave solo vive en la memoria de esta pestaña. No se guarda ni se añade a la URL.
          Para producción se debe usar un backend seguro que controle permisos, cuotas y secretos.
        </p>
      </div>

      <div className="provider-settings-grid">
        <label>
          <span>Proveedor</span>
          <select aria-label="Proveedor" value={kind} onChange={(event) => handleKind(event.target.value as BrowserProviderConfig['kind'])}>
            <option value="openai-compatible">Compatible con OpenAI</option>
            <option value="gemini">Gemini</option>
            <option value="anthropic">Anthropic</option>
          </select>
        </label>
        <label>
          <span>Modelo</span>
          <input aria-label="Modelo" value={model} onChange={(event) => setModel(event.target.value)} placeholder="Nombre exacto del modelo" />
        </label>
        <label>
          <span>Clave de API</span>
          <input aria-label="Clave de API" type="password" autoComplete="off" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Se borra al recargar" />
        </label>
        {kind === 'openai-compatible' && (
          <label>
            <span>Endpoint opcional</span>
            <input aria-label="Endpoint opcional" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder="https://…/v1/chat/completions" />
          </label>
        )}
      </div>

      <div className="provider-settings-actions">
        <button type="button" className="provider-save" disabled={!apiKey.trim() || !model.trim()} onClick={save}>
          Usar durante esta sesión
        </button>
        {saved && (
          <button type="button" className="provider-clear" onClick={clear}>
            <Trash2 size={14} /> Borrar clave de la sesión
          </button>
        )}
      </div>
    </section>
  );
}
