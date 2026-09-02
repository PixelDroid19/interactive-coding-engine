import React, { useEffect, useState, useRef } from 'react';
import { ScrimChallenge } from '../../types/scrim';
import { ChallengeValidationResult } from '../../types/runtime';
import { CheckCircle2, XCircle, Play, RotateCcw, X, ChevronDown, ChevronUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { markChallengeSkipped } from '../../engine/persistence';
import { PostSolveStudio } from '../learning/PostSolveStudio';
import { recordPostSolveEvidence } from '../../learning/curriculumEvidence';
import { learnerHintText } from '../../learning/learnerHints';
import { PracticeBrief } from '../practice/PracticeBrief';
import { splitPracticeCopy } from '../practice/practiceCopy';

interface ChallengeDrawerProps {
  challenge: ScrimChallenge;
  validationResult: ChallengeValidationResult | null;
  onValidate: () => void;
  onReset: () => void;
  onSkip?: () => void;
  onSkipForNow?: () => void;
  onContinue: () => void;
  onClose?: () => void;
  isOpen: boolean;
}

const INSTRUCTION_HEADINGS = ['Antes de empezar', 'Punto de partida', 'Cómo comprobarlo', 'Si te atascas'] as const;

export function splitChallengeInstructions(instructions: string): Array<{ heading?: string; body: string }> {
  const parts = instructions
    .trim()
    .split(new RegExp(`(?=(?:${INSTRUCTION_HEADINGS.join('|')})(?::|,|\n|$))`, 'g'))
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) return [{ body: instructions.trim() }];

  return parts.map((part) => {
    const heading = INSTRUCTION_HEADINGS.find((candidate) => (
      part === candidate || part.startsWith(`${candidate}:`) || part.startsWith(`${candidate},`) || part.startsWith(`${candidate}\n`)
    ));
    return heading
      ? { heading, body: part.slice(heading.length).replace(/^[:,]\s*/, '').trim() }
      : { body: part };
  });
}

export const ChallengeDrawer: React.FC<ChallengeDrawerProps> = ({
  challenge,
  validationResult,
  onValidate,
  onReset,
  onSkip,
  onSkipForNow,
  onContinue,
  onClose,
  isOpen,
}) => {
  const [hintIndex, setHintIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const testsFunctionDirectly = challenge.tests.some((test) => test.validatorType === 'function-call');
  const instructionParts = splitChallengeInstructions(challenge.instructions);
  const primaryInstructionParagraphs = (instructionParts[0]?.body ?? challenge.instructions)
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  const primaryInstructionCopy = splitPracticeCopy(primaryInstructionParagraphs[0] ?? challenge.instructions.trim());
  const primaryInstruction = primaryInstructionCopy.action;
  const extraInstructionParts: Array<{ heading?: string; body: string }> = [
    ...(primaryInstructionCopy.context ? [{ body: primaryInstructionCopy.context }] : []),
    ...primaryInstructionParagraphs.slice(1).map((body) => ({ body })),
    ...instructionParts.slice(1),
  ];

  const handleSkipForNow = onSkipForNow || onSkip;
  // Reset hints when challenge changes
  useEffect(() => {
    setHintIndex(0);
    setIsMinimized(false);
  }, [challenge.id]);

  useEffect(() => {
    if (validationResult?.allPassed) {
      const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReduced) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          disableForReducedMotion: true,
        });
      }
    }
  }, [validationResult?.allPassed]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      const t = setTimeout(() => closeButtonRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [isOpen, isMinimized]);

  const handleRunSubmit = () => {
    onValidate();
  };

  const handleReset = () => {
    setHintIndex(0);
    onReset();
  };

  const handleSkipForNowClick = () => {
    if (handleSkipForNow) {
      markChallengeSkipped(challenge.id);
      (onSkipForNow ?? onSkip)?.();
    }
  };

  const currentHint = challenge.hints && challenge.hints[hintIndex] ? challenge.hints[hintIndex] : null;
  const currentHintText = currentHint ? learnerHintText({
    text: currentHint.text,
    index: hintIndex,
    total: challenge.hints.length,
    criteria: challenge.tests.map((test) => test.description),
  }) : null;

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="false"
      aria-label={`Reto: ${challenge.title}`}
      className={`modal-dialog fixed bottom-16 right-5 z-50 w-96 max-w-[calc(100vw-32px)] ${isMinimized ? 'h-12' : 'max-h-[80vh] flex flex-col'}`}
      style={{ position: 'fixed', maxWidth: 420 }}
    >
      <div className="modal-header">
        <div className="flex items-center gap-2" style={{ fontFamily: 'Patrick Hand, cursive', fontWeight: 700 }}>
          <span className="truncate">{challenge.title}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-white/5"
            aria-label={isMinimized ? 'Ampliar reto' : 'Minimizar reto'}
            title={isMinimized ? 'Ampliar' : 'Minimizar'}
          >
            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {onClose && (
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-white/5"
              aria-label="Cerrar panel del reto"
              title="Cerrar panel"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans text-zinc-200">
          <>
              <PracticeBrief
                action={<p className="whitespace-pre-line">{primaryInstruction}</p>}
                expected={challenge.tests.length === 1
                  ? challenge.tests[0].description
                  : `Las ${challenge.tests.length} comprobaciones pasan sin errores.`}
                help={(
                  <>
                    {extraInstructionParts.length > 0 && (
                      <ol aria-label="Ayuda del reto">
                        {extraInstructionParts.map((part, index) => (
                          <li key={`${part.heading ?? 'ayuda'}-${index}`}>
                            {part.heading && <strong>{part.heading}: </strong>}
                            <span className="whitespace-pre-line">{part.body}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                    {testsFunctionDirectly && (
                      <p>
                        Puedes usar tus propios valores y <code>console.log</code> para investigar. Las comprobaciones usarán datos distintos para confirmar que la regla sea general.
                      </p>
                    )}
                    {challenge.hints && challenge.hints.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <strong>Pistas ({hintIndex + 1} de {challenge.hints.length})</strong>
                          {hintIndex < challenge.hints.length - 1 && (
                            <button
                              onClick={() => setHintIndex(hintIndex + 1)}
                              className="text-[11px] underline"
                              aria-label="Mostrar siguiente pista"
                            >
                              Siguiente pista
                            </button>
                          )}
                        </div>
                        {currentHint && (
                          <div>
                            <strong>{currentHint.title}</strong>
                            <p>{currentHintText}</p>
                          </div>
                        )}
                        {hintIndex >= challenge.hints.length - 1 && !validationResult?.allPassed && (
                          <p>Ya tienes todas las pistas. Cambia una sola causa y vuelve a comprobar.</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              />

              {/* Test verification checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">Comprueba</h4>
                  {validationResult && (
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                        validationResult.allPassed
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                          : 'bg-rose-950/80 text-rose-300 border border-rose-700'
                      }`}
                    >
                      {validationResult.passedCount} / {validationResult.totalCount} ok
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {challenge.tests.map((test) => {
                    const res = validationResult?.tests.find((t) => t.id === test.id);
                    const hasRun = validationResult !== null;
                    const isPassed = res?.passed;

                    return (
                      <div
                        key={test.id}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border text-[12px] leading-snug transition-colors ${
                          hasRun
                            ? isPassed
                              ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-200'
                              : 'bg-rose-950/20 border-rose-800/50 text-rose-200'
                            : 'bg-zinc-900/70 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {hasRun ? (
                          isPassed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                          )
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-full border border-zinc-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{test.description}</div>
                          {res && !res.passed && res.errorMessage && (
                            <div className="mt-1 text-[11px] text-rose-300/90 font-mono bg-rose-950/40 p-1.5 rounded">
                              {res.errorMessage}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Diagnostic feedback */}
              {validationResult && (
                <div
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  className={`p-3 rounded-lg border text-xs leading-relaxed ${
                    validationResult.allPassed
                      ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-200'
                  }`}
                >
                  <div className="font-semibold mb-0.5">{validationResult.allPassed ? '✓ Listo' : 'Pista'}</div>
                  <div>{validationResult.feedbackMessage}</div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
                {validationResult?.allPassed ? (
                  <PostSolveStudio
                    itemId={challenge.id}
                    title={challenge.title}
                    instructions={challenge.instructions}
                    kind="challenge"
                    continueLabel="Registrar y seguir la lección"
                    onComplete={async (readingAnswer, variationAnswer) => {
                      await recordPostSolveEvidence(challenge.id, readingAnswer, variationAnswer);
                      onContinue();
                    }}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRunSubmit}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded bg-zinc-100 hover:bg-white py-2 text-zinc-900 font-bold text-xs shadow-sm transition-colors"
                      aria-label="Comprobar reto"
                    >
                      <Play className="h-3.5 w-3.5 fill-zinc-900" />
                      <span>Comprobar</span>
                    </button>

                    <button
                      onClick={handleReset}
                      className="rounded bg-zinc-800 hover:bg-zinc-700 p-2 text-zinc-300 border border-zinc-700/60 transition-colors"
                      aria-label="Reiniciar reto"
                      title="Reiniciar reto"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {!validationResult?.allPassed && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSkipForNowClick}
                      className="flex-1 text-center text-[11px] border border-zinc-700 rounded py-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                      aria-label="Saltar por ahora"
                    >
                      Saltar por ahora
                    </button>
                  </div>
                )}
              </div>
            </>
        </div>
      )}
    </div>
  );
};
