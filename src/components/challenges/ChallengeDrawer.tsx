import React, { useEffect, useState, useRef } from 'react';
import { ScrimChallenge } from '../../types/scrim';
import { ChallengeValidationResult } from '../../types/runtime';
import { CheckCircle2, XCircle, Lightbulb, Play, RotateCcw, X, ChevronDown, ChevronUp, Eye, BookOpen, Undo2, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { markChallengeSolutionViewed, markChallengeSkipped } from '../../engine/persistence';

interface ChallengeDrawerProps {
  challenge: ScrimChallenge;
  validationResult: ChallengeValidationResult | null;
  onValidate: () => void;
  onReset: () => void;
  onSkip?: () => void;
  onSkipForNow?: () => void;
  onViewSolution?: () => void;
  onReturnToAttempt?: () => void;
  onApplySolution?: () => void;
  onContinue: () => void;
  onClose?: () => void;
  isOpen: boolean;
  variant?: 'scrim' | 'debug';
  // For before/after display
  beforeCode?: string;
  afterCode?: string;
}

export function getResolutionContent(challenge: ScrimChallenge, variant: 'scrim' | 'debug') {
  // Generic resolution based on challenge id
  const id = challenge.id;
  if (variant === 'debug') {
    return {
      cause: 'El programa hace menos de lo que el problema pide o usa el operador equivocado.',
      locate: 'Relee el comportamiento esperado y compáralo con lo que hace ahora. Usa los casos de prueba como pistas.',
      concept: challenge.solutionExplanation || 'Revisa el concepto de la lección asociada.',
      verify: 'Pulsa Comprobar y verifica que todos los casos de prueba cambien a verde.',
      showCode: false,
    };
  }
  // Scrim retos: provide before/after for known challenges
  const map: Record<string, { before: string; after: string; why: string }> = {
    'reto-tu-nombre': {
      before: 'let nombre = "Alex";',
      after: 'let nombre = "Ana"; // tu nombre entre comillas',
      why: 'Solo el texto entre comillas debe cambiar. Las comillas indican que es texto.',
    },
    'reto-fahrenheit': {
      before: 'const fahrenheit = celsius;',
      after: 'const fahrenheit = celsius * 9 / 5 + 32;',
      why: 'Sin la cuenta, el programa copia el número. Con ella, convierte de verdad para cualquier valor.',
    },
    'reto-tres-datos': {
      before: '// falta nombre/edad/listo',
      after: 'const nombre = "Ana";\nlet edad = 25;\nconst listo = true;',
      why: 'Cada dato tiene su forma: texto con comillas, número sin, booleano true/false.',
    },
    'reto-espar-entrar': {
      before: 'function esPar(n){ return n; }',
      after: 'function esPar(n){ return n % 2 === 0; }',
      why: '% da el resto. Si es 0 al dividir entre 2, es par.',
    },
    'reto-letra': {
      before: 'if (nota >= 70) { letra = "C"; }',
      after: 'Pregunta primero por 90, después por 80 y al final por 70.',
      why: 'El primer sí gana. Pregunta de la nota más alta a la más baja.',
    },
    'reto-limite-bucle': {
      before: 'for (let i = 1; i < 5; i++)',
      after: 'Haz que la condición también acepte el valor cinco.',
      why: 'Menor que excluye el límite; menor o igual lo incluye.',
    },
    'reto-area': {
      before: 'return 3 * 4;',
      after: 'return ancho * alto;',
      why: 'La función debe usar los parámetros que recibe, no números fijos.',
    },
    'reto-suma': {
      before: 'for(...){}',
      after: 'let total=0;\nfor(let i=0;i<numeros.length;i++) total+=numeros[i];\nreturn total;',
      why: 'Un acumulador empieza en 0 y suma cada posición del array.',
    },
    'reto-producto': {
      before: 'return item[0] + " — " + item[1];',
      after: 'return item.nombre + " — " + item.precio;',
      why: 'Un objeto se lee con punto y nombre del campo, no con [0].',
    },
    'reto-contador': {
      before: 'n = 0;',
      after: 'let n = 0; // dentro de crearContador',
      why: 'Sin let, n es global y todos los contadores comparten el mismo número.',
    },
  };
  const entry = map[id];
  if (entry) {
    return {
      cause: `El código actual no produce el resultado visible esperado.`,
      locate: `Revisa el archivo y la línea que manipula ${id.includes('nombre') ? 'el nombre' : id.includes('fahrenheit') ? 'fahrenheit' : 'la función'}.`,
      concept: entry.why,
      verify: 'Pulsa Comprobar y verifica que la vista previa muestre el resultado correcto.',
      before: entry.before,
      after: entry.after,
      showCode: true,
    };
  }
  return {
    cause: 'El resultado no coincide con lo esperado.',
    locate: 'Revisa la instrucción y localiza la línea que debe cambiar.',
    concept: challenge.solutionExplanation || 'Aplica el concepto de la lección.',
    verify: 'Pulsa Comprobar para validar.',
    showCode: false,
  };
}

export const ChallengeDrawer: React.FC<ChallengeDrawerProps> = ({
  challenge,
  validationResult,
  onValidate,
  onReset,
  onSkip,
  onSkipForNow,
  onViewSolution,
  onReturnToAttempt,
  onApplySolution,
  onContinue,
  onClose,
  isOpen,
  variant = 'scrim',
  beforeCode,
  afterCode,
}) => {
  const [hintIndex, setHintIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showResolution, setShowResolution] = useState(false);
  const [hasViewedSolution, setHasViewedSolution] = useState(false);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleSkipForNow = onSkipForNow || onSkip;
  const effectiveOnViewSolution = onViewSolution || (() => {
    setHasViewedSolution(true);
    setShowResolution(true);
    markChallengeSolutionViewed(challenge.id);
  });

  // Reset hints when challenge changes
  useEffect(() => {
    setHintIndex(0);
    setIsMinimized(false);
    setShowResolution(false);
    setHasViewedSolution(false);
    setShowApplyConfirm(false);
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
    setShowResolution(false);
    onReset();
  };

  const handleSkipForNowClick = () => {
    if (handleSkipForNow) {
      markChallengeSkipped(challenge.id);
      handleSkipForNow();
    } else if (onSkip) {
      markChallengeSkipped(challenge.id);
      onSkip();
    }
  };

  const handleViewSolutionClick = () => {
    setHasViewedSolution(true);
    setShowResolution(true);
    markChallengeSolutionViewed(challenge.id);
    if (onViewSolution) onViewSolution();
  };

  const handleReturnToAttempt = () => {
    setShowResolution(false);
    if (onReturnToAttempt) onReturnToAttempt();
  };

  const handleApplySolution = () => {
    setShowApplyConfirm(true);
  };

  const confirmApply = () => {
    setShowApplyConfirm(false);
    setShowResolution(false);
    if (onApplySolution) onApplySolution();
    else if (onContinue) onContinue();
  };

  const currentHint = challenge.hints && challenge.hints[hintIndex] ? challenge.hints[hintIndex] : null;
  const canShowViewSolution = hintIndex >= challenge.hints.length - 1 || hasViewedSolution || challenge.hints.length === 0;
  const resolution = getResolutionContent(challenge, variant);

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
          {hasViewedSolution && !validationResult?.allPassed && (
            <span className="text-[10px] bg-amber-900/50 text-amber-200 border border-amber-700 px-1.5 py-0.5 rounded">Viste la resolución</span>
          )}
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
          {/* Resolution view */}
          {showResolution ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-amber-950/30 border border-amber-800 p-3 space-y-2">
                <h4 className="flex items-center gap-1.5 text-amber-200 font-bold text-xs">
                  <BookOpen className="h-3.5 w-3.5" />
                  Cómo se resuelve
                </h4>
                <p className="text-[11px] text-amber-100/80">Ver la solución no equivale a haber resuelto el reto. Tu código se conserva. Puedes volver a intentarlo.</p>
              </div>

              <div className="space-y-2">
                <h5 className="text-[11px] font-bold text-zinc-200">Paso a paso</h5>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-300">
                  <li><strong>Qué estaba mal:</strong> {resolution.cause}</li>
                  <li><strong>Dónde mirar:</strong> {resolution.locate}</li>
                  <li><strong>Concepto:</strong> {resolution.concept}</li>
                  <li><strong>Cómo verificar:</strong> {resolution.verify}</li>
                </ol>
              </div>

              {resolution.showCode && (resolution.before || beforeCode) && (resolution.after || afterCode) && (
                <div className="space-y-1.5">
                  <h5 className="text-[11px] font-bold text-zinc-200">Cambio relevante</h5>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="bg-rose-950/30 border border-rose-800 p-2 rounded">
                      <div className="text-rose-300 font-bold mb-1">Antes</div>
                      <pre className="whitespace-pre-wrap text-rose-200">{resolution.before || beforeCode}</pre>
                    </div>
                    <div className="bg-emerald-950/30 border border-emerald-800 p-2 rounded">
                      <div className="text-emerald-300 font-bold mb-1">Después</div>
                      <pre className="whitespace-pre-wrap text-emerald-200">{resolution.after || afterCode}</pre>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400">No se reemplaza automáticamente. Usa Volver a intentarlo para editar tú mismo.</p>
                </div>
              )}

              {variant === 'debug' && (
                <div className="rounded bg-zinc-900 border border-zinc-700 p-2 text-[11px] text-zinc-300">
                  <div className="font-bold">Guía sin copiar:</div>
                  <p>Causa del fallo → cómo localizarlo con la pista 1 → qué concepto aplicar (pista 2) → próximo paso (pista 3) → verifica con Comprobar. La resolución explica el razonamiento, no es una línea para pegar.</p>
                </div>
              )}

              <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
                <button
                  onClick={handleReturnToAttempt}
                  className="w-full flex items-center justify-center gap-1.5 rounded bg-zinc-100 hover:bg-white py-2 text-zinc-900 font-bold text-xs"
                  aria-label="Volver a intentarlo"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  <span>Volver a intentarlo</span>
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleSkipForNowClick}
                    className="flex-1 rounded border border-zinc-700 py-1.5 text-[11px] text-zinc-400 hover:text-zinc-200"
                    aria-label="Saltar por ahora"
                  >
                    Saltar por ahora
                  </button>
                  {onApplySolution && (
                    <button
                      onClick={handleApplySolution}
                      className="flex-1 rounded bg-amber-500 hover:bg-amber-400 py-1.5 text-[11px] font-bold text-zinc-900"
                      aria-label="Aplicar y continuar"
                    >
                      Aplicar y continuar
                    </button>
                  )}
                </div>
                {showApplyConfirm && (
                  <div className="rounded bg-zinc-900 border border-amber-700 p-2 space-y-1">
                    <p className="text-[11px] text-amber-200">¿Aplicar la resolución? Esto reemplazará tu código actual por el ejemplo resuelto.</p>
                    <div className="flex gap-1">
                      <button onClick={confirmApply} className="flex-1 py-1 text-[11px] bg-amber-500 text-zinc-900 font-bold rounded" aria-label="Confirmar aplicar">Confirmar</button>
                      <button onClick={() => setShowApplyConfirm(false)} className="flex-1 py-1 text-[11px] border border-zinc-700 rounded" aria-label="Cancelar aplicar">Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
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
                        aria-label="Mostrar siguiente pista"
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
                  {hintIndex >= challenge.hints.length - 1 && canShowViewSolution && !validationResult?.allPassed && (
                    <button
                      onClick={handleViewSolutionClick}
                      className="mt-1 w-full flex items-center justify-center gap-1.5 rounded border border-amber-700 bg-amber-950/30 hover:bg-amber-900/40 py-1.5 text-amber-200 text-[11px] font-bold"
                      aria-label="Ver cómo se resuelve"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Ver cómo se resuelve
                    </button>
                  )}
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
                {validationResult?.allPassed ? (
                  <button
                    onClick={onContinue}
                    className="w-full flex items-center justify-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 py-2 text-white font-bold text-xs shadow-sm transition-colors"
                    aria-label="Seguir la lección"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Seguir la lección</span>
                  </button>
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
                    {canShowViewSolution && (
                      <button
                        onClick={handleViewSolutionClick}
                        className="flex-1 text-center text-[11px] border border-amber-700 bg-amber-950/20 rounded py-1.5 text-amber-300 hover:bg-amber-900/30 transition-colors flex items-center justify-center gap-1"
                        aria-label="Ver cómo se resuelve"
                      >
                        <BookOpen className="h-3 w-3" />
                        Ver resolución
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
