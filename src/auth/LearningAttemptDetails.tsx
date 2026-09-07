import React from 'react';
import type { LearnerAttempt } from '../services/staffDashboardApi';

function text(source: Record<string, unknown> | undefined, key: string, maximum = 6000): string {
  const value = source?.[key];
  return typeof value === 'string' ? value.slice(0, maximum) : '';
}

export function learningAttemptLabel(attempt: LearnerAttempt): { title: string; result: string } {
  const guided = attempt.diagnostics?.mode === 'guided-practice';
  const ungraded = attempt.result === 'ungraded' || attempt.diagnostics?.evaluation === 'ungraded';
  return {
    title: guided ? text(attempt.diagnostics, 'topicTitle', 100) || attempt.itemKey : attempt.itemKey,
    result: ungraded ? attempt.diagnostics?.mode === 'self-reflection' || attempt.diagnostics?.stage === 'explain' ? 'Reflexión sin calificar' : 'Sin calificar' : guided
      ? attempt.result === 'success' ? attempt.diagnostics.stage === 'predict' ? 'Predicción correcta' : 'Pruebas aprobadas' : 'Por acompañar'
      : attempt.score === null ? attempt.result : `${attempt.score}/100`,
  };
}

export function LearningAttemptDetails({ attempt }: { attempt: LearnerAttempt }) {
  const guided = attempt.diagnostics?.mode === 'guided-practice';
  if (!guided && attempt.diagnostics?.mode !== 'self-reflection') return null;
  const response = attempt.response;
  const confidence = text(response, 'confidence');
  const selfRating = confidence === 'again' ? 'Quiere repetir' : confidence === 'supported' ? 'Con ayuda' : confidence === 'independent' ? 'Indica que pudo hacerlo por su cuenta' : '';
  const checks = Array.isArray(response?.checks) ? response.checks.filter((value): value is Record<string, unknown> => value !== null && typeof value === 'object').slice(0, 8) : [];
  return <details className="staff-attempt-details">
    <summary>Ver el intento y orientar el siguiente paso</summary>
    {guided && <>
      <p><strong>{text(attempt.diagnostics, 'title', 120)}</strong></p>
      <p>{attempt.diagnostics.usedHelp === true ? 'Utilizó apoyos durante la práctica.' : 'No abrió los apoyos de esta práctica.'}</p>
      {text(response, 'prediction') && <p>Predicción: {text(response, 'prediction', 160)}</p>}
      {text(response, 'code') && <pre><code>{text(response, 'code')}</code></pre>}
      {checks.map((check, index) => <p key={index}><code>{text(check, 'input', 300)}</code><br />Esperado: {text(check, 'expected', 300)} · Obtenido: {text(check, 'actual', 300)}</p>)}
      {text(response, 'explanation') && <><strong>En sus palabras</strong><p>{text(response, 'explanation', 2000)}</p></>}
      {selfRating && <p>Autoevaluación: {selfRating}. No equivale a una calificación de dominio.</p>}
    </>}
    {text(response, 'readingAnswer') && <><strong>Explicación de la solución</strong><p>{text(response, 'readingAnswer', 2000)}</p></>}
    {text(response, 'variationAnswer') && <><strong>Otro caso que propone</strong><p>{text(response, 'variationAnswer', 2000)}</p></>}
  </details>;
}
