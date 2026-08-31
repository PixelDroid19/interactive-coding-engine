import React, { useMemo, useState } from 'react';
import { ArrowRight, GitBranch, ScanSearch } from 'lucide-react';
import { buildPostSolveVariation } from '../../learning/variation';
import { UiButton } from '../ui/UiButton';

interface PostSolveStudioProps {
  itemId: string;
  title: string;
  instructions?: string;
  kind: 'challenge' | 'debugging' | 'reasoning' | 'project';
  onComplete: (readingAnswer: string, variationAnswer: string) => Promise<void> | void;
  continueLabel?: string;
}

export const PostSolveStudio: React.FC<PostSolveStudioProps> = ({ itemId, title, instructions, kind, onComplete, continueLabel = 'Continuar' }) => {
  const variation = useMemo(() => buildPostSolveVariation({ itemId, title, instructions, kind }), [itemId, title, instructions, kind]);
  const [readingAnswer, setReadingAnswer] = useState('');
  const [variationAnswer, setVariationAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  const ready = readingAnswer.trim().length >= 35 && variationAnswer.trim().length >= 28;

  return (
    <section className="post-solve-studio" aria-label="Comprueba tu dominio">
      <header><span>NO FUE CASUALIDAD</span><h3>Explícalo y cambia una condición</h3><p>Las pruebas confirman el comportamiento. Este paso comprueba que puedes razonar sobre él.</p></header>
      <label>
        <span><ScanSearch size={15} /> Lectura mental</span>
        <small>{variation.readingPrompt}</small>
        <textarea rows={3} value={readingAnswer} onChange={(event) => setReadingAnswer(event.target.value)} placeholder="Primero entra…, después…, y puedo observar…" />
      </label>
      <label>
        <span><GitBranch size={15} /> Cambio de requisito</span>
        <small>{variation.changedRequirement}</small>
        <textarea rows={3} value={variationAnswer} onChange={(event) => setVariationAnswer(event.target.value)} placeholder={variation.verificationPrompt} />
      </label>
      <UiButton variant="primary" disabled={!ready || saving} onClick={async () => {
        setSaving(true);
        await onComplete(readingAnswer.trim(), variationAnswer.trim());
        setSaving(false);
      }}>
        {saving ? 'Guardando evidencia…' : continueLabel} <ArrowRight size={15} />
      </UiButton>
    </section>
  );
};
