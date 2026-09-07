import { buildPreviewDocument } from '../../src/engine/previewDocument';
import { runChallengeValidation } from '../../src/engine/testRunner';
import type { ScrimChallenge, WorkspaceSnapshot } from '../../src/types/scrim';

export interface RegressionCase {
  name: string;
  challenge: ScrimChallenge;
  workspace: WorkspaceSnapshot;
  source: string;
  accept: boolean;
  noPassed?: boolean;
  rendered?: boolean;
}

async function validateInNativeFrame(challenge: ScrimChallenge, workspace: WorkspaceSnapshot, rendered = false) {
  const frame = document.createElement('iframe');
  const previousFocus = document.activeElement;
  frame.title = 'Vista previa aislada de regresión';
  frame.hidden = !rendered;
  if (rendered) Object.assign(frame.style, { position: 'fixed', left: '16px', top: '96px', width: '640px', height: '360px', zIndex: '10', background: 'white' });
  frame.setAttribute('sandbox', 'allow-scripts');
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error('La vista previa no cargó.')), 5000);
      frame.onload = () => { window.clearTimeout(timeout); resolve(); };
      frame.srcdoc = buildPreviewDocument(workspace);
      document.body.append(frame);
      // Cada caso de foco tiene su propio documento activo, como al entrar al laboratorio.
      if (rendered) frame.focus();
    });
    return await runChallengeValidation(challenge, workspace, frame);
  } finally {
    frame.remove();
    if (rendered && previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
  }
}

export function mountRegressions(cases: readonly RegressionCase[]) {
  const run = document.querySelector<HTMLButtonElement>('#run')!;
  const summary = document.querySelector<HTMLElement>('#summary')!;
  const results = document.querySelector<HTMLOListElement>('#results')!;
  run.addEventListener('click', async () => {
    run.disabled = true;
    results.replaceChildren();
    summary.textContent = 'Ejecutando…';
    let passed = 0;
    try {
      for (const test of cases) {
        const item = document.createElement('li');
        results.append(item);
        try {
          const workspace = structuredClone(test.workspace);
          workspace.files['app.js'].content = test.source;
          const result = await validateInNativeFrame(test.challenge, workspace, test.rendered);
          const evaluationError = result.tests.some(check => check.isEvaluationError);
          const matches = !evaluationError && result.allPassed === test.accept && (!test.noPassed || result.passedCount === 0);
          if (matches) passed++;
          item.dataset.result = matches ? 'passed' : 'failed';
          item.textContent = `${matches ? 'PASA' : 'FALLA'} — ${test.name} (${result.passedCount}/${result.totalCount})`;
          if (!matches) {
            const errors = result.tests.filter(check => check.isEvaluationError).map(check => check.errorMessage).filter(Boolean);
            item.append(document.createTextNode(`: ${result.feedbackMessage}${errors.length ? ` (${errors.join('; ')})` : ''}`));
          }
        } catch (error) {
          item.dataset.result = 'failed';
          item.textContent = `ERROR — ${test.name}: ${String(error)}`;
        }
      }
    } finally {
      summary.textContent = `${passed}/${cases.length} regresiones correctas`;
      summary.dataset.result = passed === cases.length ? 'passed' : 'failed';
      run.disabled = false;
    }
  });
}
