import React, { useMemo, useState } from 'react';
import { ArrowRight, GitBranch, ScanSearch, ShieldCheck } from 'lucide-react';
import { buildPostSolveVariation } from '../../learning/variation';
import { UiButton } from '../ui/UiButton';
import { useTheme } from '../../themes/ThemeProvider';

interface PostSolveStudioProps {
  itemId: string;
  title: string;
  instructions?: string;
  kind: 'challenge' | 'debugging' | 'reasoning' | 'project';
  onComplete: (readingAnswer: string, variationAnswer: string) => Promise<void> | void;
  continueLabel?: string;
}

export const PostSolveStudio: React.FC<PostSolveStudioProps> = ({ itemId, title, instructions, kind, onComplete, continueLabel = 'Continuar' }) => {
  const { themeId } = useTheme();
  const isCyber = themeId === 'cyber';
  const variation = useMemo(() => buildPostSolveVariation({ itemId, title, instructions, kind }), [itemId, title, instructions, kind]);
  const [readingAnswer, setReadingAnswer] = useState('');
  const [variationAnswer, setVariationAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  const readingLen = readingAnswer.trim().length;
  const variationLen = variationAnswer.trim().length;
  const readingReady = readingLen >= 35;
  const variationReady = variationLen >= 28;
  const ready = readingReady && variationReady;

  const handleSubmit = async () => {
    if (!ready || saving) return;
    setSaving(true);
    try {
      await onComplete(readingAnswer.trim(), variationAnswer.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="post-solve-studio"
      aria-label="Comprueba tu dominio"
      data-augmented-ui={isCyber ? 'post-solve-panel tl-clip tr-clip br-clip bl-clip border inlay' : undefined}
    >
      <header className="post-solve-header">
        <span className="post-solve-eyebrow">
          <ShieldCheck size={12} aria-hidden="true" />
          NO FUE CASUALIDAD
        </span>
        <h3>Explícalo y cambia una condición</h3>
        <p>Las pruebas confirman el comportamiento. Este paso comprueba que puedes razonar sobre él.</p>
      </header>

      <div className="post-solve-fields">
        <label className="post-solve-field">
          <span className="post-solve-field-title">
            <ScanSearch size={14} aria-hidden="true" />
            Lectura mental
            <span className={`post-solve-counter ${readingReady ? 'is-ok' : ''}`} aria-live="polite">
              {readingLen}/35
            </span>
          </span>
          <small>{variation.readingPrompt}</small>
          <textarea
            rows={3}
            value={readingAnswer}
            onChange={(event) => setReadingAnswer(event.target.value)}
            placeholder="Primero entra…, después…, y puedo observar…"
            aria-label="Respuesta de lectura mental"
            aria-describedby={`post-solve-reading-help-${itemId}`}
          />
          <span id={`post-solve-reading-help-${itemId}`} className="post-solve-help">
            {readingReady ? '✓ Mínimo alcanzado' : `Faltan ${35 - readingLen} caracteres`}
          </span>
        </label>

        <label className="post-solve-field">
          <span className="post-solve-field-title">
            <GitBranch size={14} aria-hidden="true" />
            Cambio de requisito
            <span className={`post-solve-counter ${variationReady ? 'is-ok' : ''}`} aria-live="polite">
              {variationLen}/28
            </span>
          </span>
          <small>{variation.changedRequirement}</small>
          <textarea
            rows={3}
            value={variationAnswer}
            onChange={(event) => setVariationAnswer(event.target.value)}
            placeholder={variation.verificationPrompt}
            aria-label="Respuesta de cambio de requisito"
            aria-describedby={`post-solve-variation-help-${itemId}`}
          />
          <span id={`post-solve-variation-help-${itemId}`} className="post-solve-help">
            {variationReady ? '✓ Mínimo alcanzado' : `Faltan ${28 - variationLen} caracteres`}
          </span>
        </label>
      </div>

      <UiButton
        variant="primary"
        disabled={!ready || saving}
        onClick={handleSubmit}
        className="post-solve-submit"
        aria-label={saving ? 'Guardando evidencia' : continueLabel}
      >
        {saving ? 'Guardando evidencia…' : continueLabel} <ArrowRight size={15} aria-hidden="true" />
      </UiButton>

      {!ready && !saving && (
        <p className="post-solve-hint" aria-live="polite">
          Completa ambas reflexiones para habilitar el registro.
        </p>
      )}
    </section>
  );
};
