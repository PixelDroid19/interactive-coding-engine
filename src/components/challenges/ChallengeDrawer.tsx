import React, { useEffect, useState } from 'react';
import { ScrimChallenge } from '../../types/scrim';
import { ChallengeValidationResult } from '../../types/runtime';
import { CheckCircle2, XCircle, Lightbulb, Play, RotateCcw, ChevronRight, HelpCircle, Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChallengeDrawerProps {
  challenge: ScrimChallenge;
  validationResult: ChallengeValidationResult | null;
  onValidate: () => void;
  onReset: () => void;
  onSkip?: () => void;
  onContinue: () => void;
  onClose?: () => void;
  isOpen: boolean;
}

export const ChallengeDrawer: React.FC<ChallengeDrawerProps> = ({
  challenge,
  validationResult,
  onValidate,
  onReset,
  onSkip,
  onContinue,
  onClose,
  isOpen,
}) => {
  const [hintIndex, setHintIndex] = useState(0);
  const [showAiHelp, setShowAiHelp] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) return null;

  useEffect(() => {
    if (validationResult?.allPassed) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  }, [validationResult?.allPassed]);

  const handleRunSubmit = () => {
    onValidate();
  };

  const currentHint = challenge.hints && challenge.hints[hintIndex] ? challenge.hints[hintIndex] : null;

  return (
    <div className={`modal-dialog fixed bottom-16 right-5 z-50 w-96 max-w-[calc(100vw-32px)] ${isMinimized ? 'h-12' : 'max-h-[80vh] flex flex-col'}`} style={{ position: 'fixed', maxWidth: 420 }}>
      <div className="modal-header">
        <div className="flex items-center gap-2" style={{ fontFamily: 'Patrick Hand, cursive', fontWeight: 700 }}>
          <span className="truncate">{challenge.title}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-white/5"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-white/5"
              title="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans text-zinc-200">
          {/* Instructions */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">Instrucciones</h4>
            <div className="rounded-lg bg-zinc-900/90 p-3 border border-zinc-800 text-zinc-300 whitespace-pre-line leading-relaxed font-mono text-[12px]">
              {challenge.instructions}
            </div>
          </div>

          {/* Test verification checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">Pruebas</h4>
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

          {/* Progressive Hints */}
          {challenge.hints && challenge.hints.length > 0 && (
            <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-zinc-300 font-semibold text-xs">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                  <span>Pistas ({hintIndex + 1} de {challenge.hints.length})</span>
                </div>
                {hintIndex < challenge.hints.length - 1 && (
                  <button
                    onClick={() => setHintIndex(hintIndex + 1)}
                    className="text-[11px] text-zinc-300 hover:text-white font-medium underline"
                  >
                    Siguiente pista
                  </button>
                )}
              </div>

              {currentHint && (
                <div className="text-zinc-300 text-xs leading-relaxed">
                  <div className="font-semibold text-zinc-200 mb-1">{currentHint.title}</div>
                  <p>{currentHint.text}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
            {validationResult?.allPassed ? (
              <button
                onClick={onContinue}
                className="w-full flex items-center justify-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 py-2 text-white font-bold text-xs shadow-sm transition-colors"
              >
                <span>Seguir la lección</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunSubmit}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded bg-zinc-100 hover:bg-white py-2 text-zinc-900 font-bold text-xs shadow-sm transition-colors"
                >
                  <Play className="h-3.5 w-3.5 fill-zinc-900" />
                  <span>Comprobar</span>
                </button>

                <button
                  onClick={onReset}
                  className="rounded bg-zinc-800 hover:bg-zinc-700 p-2 text-zinc-300 border border-zinc-700/60 transition-colors"
                  title="Reset code to challenge start"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {onSkip && (
              <button
                onClick={onSkip}
                className="text-center text-[11px] text-zinc-500 hover:text-zinc-400 py-0.5 transition-colors"
              >
                Saltar y ver la solución
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
