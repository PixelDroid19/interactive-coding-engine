import { ChallengeTest, ScrimChallenge, WorkspaceSnapshot } from '../types/scrim';
import { ChallengeValidationResult, TestResultItem } from '../types/runtime';

/**
 * Validates a challenge against the student's current workspace state and runtime iframe
 */
export async function runChallengeValidation(
  challenge: ScrimChallenge,
  workspace: WorkspaceSnapshot,
  iframeElement?: HTMLIFrameElement | null
): Promise<ChallengeValidationResult> {
  const testResults: TestResultItem[] = [];
  let passedCount = 0;

  for (const test of challenge.tests) {
    try {
      const result = await evaluateSingleTest(test, workspace, iframeElement);
      testResults.push(result);
      if (result.passed) {
        passedCount++;
      }
    } catch (err: any) {
      testResults.push({
        id: test.id,
        description: test.description,
        passed: false,
        errorMessage: err.message || 'Execution error during test evaluation',
        hint: test.hintTip,
      });
    }
  }

  const allPassed = passedCount === challenge.tests.length && challenge.tests.length > 0;

  // Generate intelligent diagnostic feedback message
  let feedbackMessage = '';
  if (allPassed) {
    feedbackMessage = 'Muy bien. Pasaste las pruebas. Sigue con la lección.';
  } else {
    const failedTests = testResults.filter((t) => !t.passed);
    const firstFailed = failedTests[0];

    if (firstFailed.errorMessage) {
      feedbackMessage = `${firstFailed.description}: ${firstFailed.errorMessage}`;
    } else if (firstFailed.hint) {
      feedbackMessage = `${firstFailed.description} no coincide. Pista: ${firstFailed.hint}`;
    } else {
      feedbackMessage = `Sigue. ${passedCount} de ${challenge.tests.length} pruebas pasaron. Revisa lo que falta.`;
    }
  }

  return {
    allPassed,
    passedCount,
    totalCount: challenge.tests.length,
    tests: testResults,
    feedbackMessage,
  };
}

/**
 * Evaluates a single test rule against code source or runtime iframe document/window
 */
async function evaluateSingleTest(
  test: ChallengeTest,
  workspace: WorkspaceSnapshot,
  iframeElement?: HTMLIFrameElement | null
): Promise<TestResultItem> {
  // Combine all JavaScript source code
  const jsFiles = Object.values(workspace.files).filter(
    (f) => f.language === 'javascript' || f.language === 'typescript' || f.name.endsWith('.js') || f.name.endsWith('.jsx')
  );
  const combinedJs = jsFiles.map((f) => f.content).join('\n\n');

  // Combine HTML files
  const htmlFiles = Object.values(workspace.files).filter((f) => f.language === 'html' || f.name.endsWith('.html'));
  const combinedHtml = htmlFiles.map((f) => f.content).join('\n\n');

  switch (test.validatorType) {
    case 'source-regex': {
      if (!test.regexPattern) {
        return { id: test.id, description: test.description, passed: true };
      }
      const regex = new RegExp(test.regexPattern, 'i');
      const passed = regex.test(combinedJs) || regex.test(combinedHtml);
      return {
        id: test.id,
        description: test.description,
        passed,
        errorMessage: passed ? undefined : (test.errorMessage || 'Required syntax or pattern not found in code.'),
        hint: test.hintTip,
      };
    }

    case 'function-call': {
      if (!test.targetFunction) {
        return { id: test.id, description: test.description, passed: false, errorMessage: 'No target function specified.' };
      }

      // Check in iframe window if available, or evaluate in isolated Function sandbox
      let targetFn: any;
      if (iframeElement && iframeElement.contentWindow && (iframeElement.contentWindow as any)[test.targetFunction]) {
        targetFn = (iframeElement.contentWindow as any)[test.targetFunction];
      } else {
        try {
          const stubDocument = {
            getElementById: () => ({
              textContent: '',
              innerText: '',
              innerHTML: '',
              value: '',
              className: '',
              addEventListener() {},
            }),
            querySelector: () => ({
              textContent: '',
              innerText: '',
              innerHTML: '',
              value: '',
              addEventListener() {},
            }),
            querySelectorAll: () => [],
          };
          const evalScope = new Function(
            'document',
            `${combinedJs}\n; return typeof ${test.targetFunction} === "function" ? ${test.targetFunction} : null;`
          );
          targetFn = evalScope(stubDocument);
        } catch (e: any) {
          return {
            id: test.id,
            description: test.description,
            passed: false,
            errorMessage: `Function '${test.targetFunction}' error: ${e.message}`,
            hint: test.hintTip,
          };
        }
      }

      if (typeof targetFn !== 'function') {
        return {
          id: test.id,
          description: test.description,
          passed: false,
          errorMessage: `Function '${test.targetFunction}' is not defined or is not a function.`,
          hint: test.hintTip,
        };
      }

      const args = test.args || [];
      const result = targetFn(...args);

      if (test.expectedReturn !== undefined) {
        const isMatch = JSON.stringify(result) === JSON.stringify(test.expectedReturn) || result === test.expectedReturn;
        return {
          id: test.id,
          description: test.description,
          passed: isMatch,
          receivedValue: result,
          expectedValue: test.expectedReturn,
          errorMessage: isMatch
            ? undefined
            : `Expected '${JSON.stringify(test.expectedReturn)}', but received '${JSON.stringify(result)}'.`,
          hint: test.hintTip,
        };
      }

      return { id: test.id, description: test.description, passed: true };
    }

    case 'dom-check': {
      if (!test.domSelector) {
        return { id: test.id, description: test.description, passed: false, errorMessage: 'No DOM selector specified.' };
      }

      let iframeDoc: Document | null = null;
      if (iframeElement && iframeElement.contentDocument) {
        iframeDoc = iframeElement.contentDocument;
      }

      if (!iframeDoc) {
        // Fallback: parse HTML with DOMParser
        const parser = new DOMParser();
        iframeDoc = parser.parseFromString(combinedHtml, 'text/html');
      }

      const el = iframeDoc.querySelector(test.domSelector);
      if (!el) {
        return {
          id: test.id,
          description: test.description,
          passed: false,
          errorMessage: `Element matching '${test.domSelector}' was not found in the DOM.`,
          hint: test.hintTip,
        };
      }

      if (test.domProperty === 'exists') {
        return { id: test.id, description: test.description, passed: true };
      }

      if (test.domProperty === 'count') {
        const count = iframeDoc.querySelectorAll(test.domSelector).length;
        const passed = count === test.expectedValue;
        return {
          id: test.id,
          description: test.description,
          passed,
          receivedValue: count,
          expectedValue: test.expectedValue,
          errorMessage: passed ? undefined : `Expected ${test.expectedValue} elements, found ${count}.`,
          hint: test.hintTip,
        };
      }

      if (test.domProperty === 'innerText' || test.domProperty === 'innerHTML' || test.domProperty === 'value') {
        const propVal = (el as any)[test.domProperty]?.trim();
        if (test.expectedValue !== undefined) {
          const isMatch = typeof test.expectedValue === 'string'
            ? propVal.toLowerCase().includes(test.expectedValue.toLowerCase())
            : propVal === test.expectedValue;

          return {
            id: test.id,
            description: test.description,
            passed: isMatch,
            receivedValue: propVal,
            expectedValue: test.expectedValue,
            errorMessage: isMatch ? undefined : `Element text is '${propVal}', expected to contain '${test.expectedValue}'.`,
            hint: test.hintTip,
          };
        }
      }

      return { id: test.id, description: test.description, passed: true };
    }

    case 'console-check':
    default: {
      return { id: test.id, description: test.description, passed: true };
    }
  }
}
