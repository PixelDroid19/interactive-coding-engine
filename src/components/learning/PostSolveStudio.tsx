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
  const [error, setError] = useState('');

  const readingLen = readingAnswer.trim().length;
  const variationLen = variationAnswer.trim().length;
  const readingReady = readingLen > 0;
  const variationReady = variationLen > 0;
  const ready = readingReady && variationReady;

  const handleSubmit = async (skip = false) => {
    if ((!ready && !skip) || saving) return;
    setSaving(true);
    setError('');
    try {
      await onComplete(skip ? '' : readingAnswer.trim(), skip ? '' : variationAnswer.trim());
    } catch {
      setError('No se pudo guardar. Tus respuestas siguen aquí; inténtalo otra vez.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="post-solve-studio"
      aria-label="Reflexiona sobre tu solución"
      data-augmented-ui={isCyber ? 'post-solve-panel tl-clip tr-clip br-clip bl-clip border inlay' : undefined}
    >
      <header className="post-solve-header">
        <span className="post-solve-eyebrow">
          <ShieldCheck size={12} aria-hidden="true" />
          UNA PAUSA PARA EXPLICAR
        </span>
        <h3>Explícalo y piensa en otro caso</h3>
        <p>Si te ayuda, explica lo que hiciste en una frase. Esta reflexión es opcional y no se califica automáticamente.</p>
      </header>

      <div className="post-solve-fields">
        <label className="post-solve-field">
          <span className="post-solve-field-title">
            <ScanSearch size={14} aria-hidden="true" />
            Lectura mental
          </span>
          <small>{variation.readingPrompt}</small>
          <textarea
            rows={3}
            maxLength={2000}
            value={readingAnswer}
            onChange={(event) => setReadingAnswer(event.target.value)}
            placeholder={variation.readingPlaceholder}
            aria-label="Respuesta de lectura mental"
            aria-describedby={`post-solve-reading-help-${itemId}`}
          />
          <span id={`post-solve-reading-help-${itemId}`} className="post-solve-help">
            No necesitas una explicación larga. También puedes decir «no lo sé todavía».
          </span>
        </label>

        <label className="post-solve-field">
          <span className="post-solve-field-title">
            <GitBranch size={14} aria-hidden="true" />
            Cambio de requisito
          </span>
          <small>{variation.changedRequirement}</small>
          <textarea
            rows={3}
            maxLength={2000}
            value={variationAnswer}
            onChange={(event) => setVariationAnswer(event.target.value)}
            placeholder={variation.verificationPrompt}
            aria-label="Respuesta de cambio de requisito"
            aria-describedby={`post-solve-variation-help-${itemId}`}
          />
          <span id={`post-solve-variation-help-${itemId}`} className="post-solve-help">
            Basta con un caso y el resultado que esperas.
          </span>
        </label>
      </div>

      <UiButton
        variant="primary"
        disabled={!ready || saving}
        onClick={() => void handleSubmit()}
        className="post-solve-submit"
        aria-label={saving ? 'Guardando evidencia' : continueLabel}
      >
        {saving ? 'Guardando evidencia…' : continueLabel} <ArrowRight size={15} aria-hidden="true" />
      </UiButton>

      <UiButton variant="quiet" disabled={saving} onClick={() => void handleSubmit(true)}>Continuar sin escribir</UiButton>
      {error && <p role="alert">{error}</p>}
    </section>
  );
};
