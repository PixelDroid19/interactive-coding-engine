import { ChallengeTest, ScrimChallenge, WorkspaceSnapshot } from '../types/scrim';
import { ChallengeValidationResult, TestResultItem } from '../types/runtime';
import { buildPreviewDocument } from './previewDocument';
import { runPythonChallengeValidation } from './python/pythonChallengeValidator';
import { evaluationValuesEqual } from './evaluationEquality';

function normalizeForMatch(str: string, opts: { caseInsensitive?: boolean; normalizeSpaces?: boolean; ignorePunctuation?: boolean }): string {
  let s = str;
  if (opts.normalizeSpaces) {
    s = s.replace(/\s+/g, ' ').trim();
  }
  if (opts.ignorePunctuation) {
    // Remove punctuation except letters, numbers, spaces
    s = s.replace(/[.,/#!$%^&*;:{}=\-_`~()¿?¡!"']/g, '');
    if (opts.normalizeSpaces) s = s.replace(/\s+/g, ' ').trim();
  }
  if (opts.caseInsensitive) {
    s = s.toLowerCase();
  }
  return s;
}

function stringContainsAll(result: string, expectedContains: string[], opts: { caseInsensitive?: boolean; normalizeSpaces?: boolean; ignorePunctuation?: boolean }): boolean {
  const normResult = normalizeForMatch(result, opts);
  return expectedContains.every((exp) => {
    const normExp = normalizeForMatch(exp, opts);
    return normResult.includes(normExp);
  });
}

function createEvaluationElement(): any {
  const children: any[] = [];
  const classes = new Set<string>();
  const element: any = {
    textContent: '',
    innerText: '',
    innerHTML: '',
    value: '',
    className: '',
    style: {},
    dataset: {},
    children,
    classList: {
      add: (...names: string[]) => names.forEach((name) => classes.add(name)),
      remove: (...names: string[]) => names.forEach((name) => classes.delete(name)),
      contains: (name: string) => classes.has(name),
      toggle(name: string) {
        if (classes.has(name)) {
          classes.delete(name);
          return false;
        }
        classes.add(name);
        return true;
      },
    },
    addEventListener() {},
    removeEventListener() {},
    appendChild(child: any) {
      children.push(child);
      return child;
    },
    removeChild(child: any) {
      const index = children.indexOf(child);
      if (index >= 0) children.splice(index, 1);
      return child;
    },
    setAttribute(name: string, value: unknown) {
      element[name] = String(value);
    },
    getAttribute(name: string) {
      return element[name] ?? null;
    },
  };
  return element;
}

function createEvaluationDocument(): any {
  const elements: Record<string, any> = {};
  const documentStub: any = {
    body: createEvaluationElement(),
    head: createEvaluationElement(),
    getElementById(id: string) {
      if (!elements[id]) elements[id] = createEvaluationElement();
      return elements[id];
    },
    querySelector(selector: string) {
      const idMatch = selector.match(/#([\w-]+)/);
      return idMatch ? documentStub.getElementById(idMatch[1]) : createEvaluationElement();
    },
    querySelectorAll: () => [],
    createElement: () => createEvaluationElement(),
    addEventListener() {},
    removeEventListener() {},
  };
  return documentStub;
}

function isStringMatch(result: any, test: ChallengeTest): { passed: boolean; error?: string } {
  if (typeof result !== 'string') {
    return { passed: false, error: `Se esperaba texto pero se obtuvo ${typeof result}: ${JSON.stringify(result)}` };
  }
  const expectedContains = test.expectedContains || [];
  const requireArg = test.requireArgInResult;
  let toCheck: string[] = [...expectedContains];
  // If requireArgInResult true or number, add the arg value
  if (requireArg !== undefined && requireArg !== false) {
    const argIndex = typeof requireArg === 'number' ? requireArg : 0;
    const args = test.args || [];
    const argVal = args[argIndex];
    if (argVal !== undefined) {
      toCheck.push(String(argVal));
    }
  }
  // If expectedReturn is string and matcher is contains-all, use it
  if (test.expectedReturn !== undefined && typeof test.expectedReturn === 'string' && (test.matcher === 'contains-all' || test.matcher === 'string-contains-all' || test.matcher === 'contains')) {
    toCheck.push(test.expectedReturn);
  }
  // If toCheck empty, fallback to expectedReturn string
  if (toCheck.length === 0 && typeof test.expectedReturn === 'string') {
    toCheck = [test.expectedReturn];
  }
  if (toCheck.length === 0) {
    return { passed: true };
  }
  const opts = {
    caseInsensitive: test.caseInsensitive ?? true,
    normalizeSpaces: test.normalizeSpaces ?? true,
    ignorePunctuation: test.ignorePunctuation ?? true,
  };
  const passed = stringContainsAll(result, toCheck, opts);
  if (!passed) {
    const missing = toCheck.filter((exp) => !normalizeForMatch(result, opts).includes(normalizeForMatch(exp, opts)));
    return { passed: false, error: `Falta "${missing.join('", "')}" en "${result}"` };
  }
  return { passed: true };
}

function cloneEvaluationValue<T>(value: T, seen = new Map<object, unknown>()): T {
  if (typeof value === 'function' || value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value) as T;
  if (Array.isArray(value)) {
    const copy: unknown[] = [];
    seen.set(value, copy);
    value.forEach((item) => copy.push(cloneEvaluationValue(item, seen)));
    return copy as T;
  }
  if (Object.getPrototypeOf(value) === Object.prototype) {
    const copy: Record<string, unknown> = {};
    seen.set(value, copy);
    for (const [key, item] of Object.entries(value)) copy[key] = cloneEvaluationValue(item, seen);
    return copy as T;
  }
  try {
    return structuredClone(value);
  } catch {
    return value;
  }
}

function cloneEvaluationArgs(args: unknown[] | undefined): unknown[] {
  return args ? cloneEvaluationValue(args) : [];
}

function prepareExecutableJavaScript(source: string): string {
  let anonymousDefaultClassIndex = 0;
  return source
    .replace(/^\s*import\s+[^;]+;?\s*$/gm, '')
    .replace(/\bexport\s+default\s+class(?=\s*(?:extends|\{))/g, () =>
      `class __DefaultExport${anonymousDefaultClassIndex++}`)
    .replace(/\bexport\s+default\s+/g, '')
    .replace(/\bexport\s+(?=(?:async\s+)?(?:function|class|const|let|var)\b)/g, '');
}

export async function runChallengeValidation(
  challenge: ScrimChallenge,
  workspace: WorkspaceSnapshot,
  iframeElement?: HTMLIFrameElement | null,
  generation?: number
): Promise<ChallengeValidationResult> {
  const hasPython = Object.values(workspace.files).some(
    (file) => file.language === 'python' || file.path.endsWith('.py'),
  );
  if (hasPython) return runPythonChallengeValidation(challenge, workspace);

  const testResults: TestResultItem[] = [];
  let passedCount = 0;
  let evaluationErrors = 0;

  // Chequeo previo de sintaxis: si el programa no compila, no lo evaluamos.
  // Así un error de sintaxis se reporta como "no pudimos evaluar" y no como
  // "tu respuesta es incorrecta".
  const jsFilesPre = Object.values(workspace.files).filter(
    (f) => f.language === 'javascript' || f.language === 'typescript' || f.name.endsWith('.js') || f.name.endsWith('.jsx')
  );
  const combinedJsPre = jsFilesPre.map((f) => f.content).join('\n\n');
  const syntaxProbe = prepareExecutableJavaScript(combinedJsPre);
  let syntaxError: string | null = null;
  if (combinedJsPre.trim().length > 0) {
    try {
      new Function(syntaxProbe);
    } catch (e: any) {
      syntaxError = e.message || 'Error de sintaxis';
    }
  }

  for (const test of challenge.tests) {
    if (syntaxError) {
      testResults.push({
        id: test.id,
        description: test.description,
        passed: false,
        status: 'evaluation-error',
        isEvaluationError: true,
        errorMessage: `No pudimos evaluar el código: hay un error de sintaxis (${syntaxError}). Corrígelo y vuelve a pulsar Comprobar.`,
        hint: test.hintTip,
      });
      evaluationErrors++;
      continue;
    }
    try {
      const result = await evaluateSingleTest(test, workspace, iframeElement, generation);
      testResults.push(result);
      if (result.passed) {
        passedCount++;
      }
      if (result.isEvaluationError) evaluationErrors++;
    } catch (err: any) {
      testResults.push({
        id: test.id,
        description: test.description,
        passed: false,
        status: 'evaluation-error',
        isEvaluationError: true,
        errorMessage: err.message || 'Error interno al evaluar',
        hint: test.hintTip,
      });
      evaluationErrors++;
    }
  }

  const allPassed = passedCount === challenge.tests.length && challenge.tests.length > 0 && evaluationErrors === 0;

  let feedbackMessage = '';
  if (evaluationErrors > 0) {
    const evaluationLabel = evaluationErrors === 1 ? 'comprobación' : 'comprobaciones';
    feedbackMessage = `No pudimos evaluar el código en ${evaluationErrors} ${evaluationLabel}. Corrige el error indicado y vuelve a pulsar Comprobar.`;
  } else if (allPassed) {
    feedbackMessage = 'Muy bien. Pasaste las pruebas. Sigue con la lección.';
  } else {
    const failedTests = testResults.filter((t) => !t.passed && !t.isEvaluationError);
    const firstFailed = failedTests[0];
    if (firstFailed?.errorMessage) {
      feedbackMessage = `${firstFailed.description}: ${firstFailed.errorMessage}`;
      if (firstFailed.receivedValue !== undefined) {
        feedbackMessage += ` (recibido: ${JSON.stringify(firstFailed.receivedValue)})`;
      }
    } else if (firstFailed?.hint) {
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

async function evaluateSingleTest(
  test: ChallengeTest,
  workspace: WorkspaceSnapshot,
  iframeElement?: HTMLIFrameElement | null,
  generation?: number
): Promise<TestResultItem> {
  const jsFiles = Object.values(workspace.files).filter(
    (f) => f.language === 'javascript' || f.language === 'typescript' || f.name.endsWith('.js') || f.name.endsWith('.jsx')
  );
  const combinedJs = jsFiles.map((f) => f.content).join('\n\n');
  const htmlFiles = Object.values(workspace.files).filter((f) => f.language === 'html' || f.name.endsWith('.html'));
  const combinedHtml = htmlFiles.map((f) => f.content).join('\n\n');

  switch (test.validatorType) {
    case 'browser-script': {
      if (!test.customValidatorScript) {
        return {
          id: test.id,
          description: test.description,
          passed: false,
          status: 'evaluation-error',
          isEvaluationError: true,
          errorMessage: 'Prueba mal configurada: falta la comprobación del navegador.',
          hint: test.hintTip,
        };
      }
      const frameDocument = iframeElement?.contentDocument;
      const frameWindow = iframeElement?.contentWindow;
      if (!frameDocument || !frameWindow) {
        return {
          id: test.id,
          description: test.description,
          passed: false,
          status: 'evaluation-error',
          isEvaluationError: true,
          errorMessage: 'La vista previa todavía no está lista. Ejecútala y vuelve a pulsar Comprobar.',
          hint: test.hintTip,
        };
      }
      if (generation !== undefined) {
        const iframeGeneration = (iframeElement as HTMLIFrameElement & { __generation?: number }).__generation;
        if (iframeGeneration !== undefined && iframeGeneration !== generation) {
          return {
            id: test.id,
            description: test.description,
            passed: false,
            status: 'evaluation-error',
            isEvaluationError: true,
            errorMessage: 'La vista previa corresponde a una edición anterior. Vuelve a pulsar Comprobar.',
            hint: test.hintTip,
          };
        }
      }
      const awaitedTags = [...test.customValidatorScript.matchAll(
        /(?:\bcustomElements|\.customElements)\.whenDefined\s*\(\s*['"]([^'"]+)['"]/g,
      )].map((match) => match[1]);
      const missingTag = awaitedTags.find((tag) => !frameWindow.customElements.get(tag));
      if (missingTag) {
        return {
          id: test.id,
          description: test.description,
          passed: false,
          status: 'failed',
          errorMessage: `Aún no registraste la etiqueta <${missingTag}> en la vista previa.`,
          hint: test.hintTip,
        };
      }
      try {
        const validator = new Function(`return (${test.customValidatorScript});`)();
        if (typeof validator !== 'function') throw new Error('la comprobación no es una función');
        const rawResult = await Promise.race([
          Promise.resolve(validator({
            window: frameWindow,
            document: frameDocument,
            customElements: frameWindow.customElements,
          HTMLElement: (frameWindow as any).HTMLElement,
          Event: (frameWindow as any).Event,
          CustomEvent: (frameWindow as any).CustomEvent,
          })),
          new Promise((_, reject) => setTimeout(
            () => reject(new Error('la comprobación superó el tiempo de espera; revisa que el elemento se registre y termine de actualizar')),
            1200,
          )),
        ]);
        const normalized = typeof rawResult === 'boolean' ? { passed: rawResult } : rawResult;
        if (!normalized || typeof normalized.passed !== 'boolean') {
          throw new Error('la comprobación no devolvió true, false ni un resultado con passed');
        }
        return {
          id: test.id,
          description: test.description,
          passed: normalized.passed,
          status: normalized.passed ? 'passed' : 'failed',
          receivedValue: normalized.receivedValue,
          expectedValue: normalized.expectedValue,
          errorMessage: normalized.passed ? undefined : (normalized.errorMessage || test.errorMessage || 'El componente ejecutado no cumple el comportamiento esperado.'),
          hint: test.hintTip,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          id: test.id,
          description: test.description,
          passed: false,
          status: 'evaluation-error',
          isEvaluationError: true,
          errorMessage: `No pudimos comprobar el componente en la vista previa: ${message}`,
          hint: test.hintTip,
        };
      }
    }

    case 'source-regex': {
      if (!test.regexPattern) {
        return { id: test.id, description: test.description, passed: false, status: 'failed', errorMessage: 'Prueba mal configurada: falta patrón.', hint: test.hintTip };
      }
      const regex = new RegExp(test.regexPattern, 'i');
      const passed = regex.test(combinedJs) || regex.test(combinedHtml);
      return {
        id: test.id,
        description: test.description,
        passed,
        status: passed ? 'passed' : 'failed',
        errorMessage: passed ? undefined : (test.errorMessage || 'No se encontró el patrón esperado en el código.'),
        hint: test.hintTip,
      };
    }

    case 'function-call': {
      if (!test.targetFunction) {
        return { id: test.id, description: test.description, passed: false, status: 'evaluation-error', isEvaluationError: true, errorMessage: 'Prueba mal configurada: falta función objetivo.', hint: test.hintTip };
      }
      let targetFn: any;
      try {
        // Deterministic: always evaluate current workspace via Function, not iframe
        const stubDocument = createEvaluationDocument();
        const evalScope = new Function(
          'document',
          'window',
          `${prepareExecutableJavaScript(combinedJs)}\n; return typeof ${test.targetFunction} === "function" ? ${test.targetFunction} : null;`
        );
        targetFn = evalScope(stubDocument, { document: stubDocument });
      } catch (e: any) {
        return {
          id: test.id,
          description: test.description,
          passed: false,
          status: 'evaluation-error',
          isEvaluationError: true,
          errorMessage: `No se pudo evaluar '${test.targetFunction}': ${e.message}`,
          hint: test.hintTip,
        };
      }

      if (typeof targetFn !== 'function') {
        return {
          id: test.id,
          description: test.description,
          passed: false,
          status: 'failed',
          errorMessage: `No encontramos la función '${test.targetFunction}'. Revisa el nombre y que esté definida.`,
          hint: test.hintTip,
        };
      }

      try {
        if (test.callSequence) {
          if (test.callSequence.length === 0) {
            return {
              id: test.id,
              description: test.description,
              passed: false,
              status: 'evaluation-error',
              isEvaluationError: true,
              errorMessage: 'Prueba mal configurada: la secuencia de llamadas está vacía.',
              hint: test.hintTip,
            };
          }

          const received: unknown[] = [];
          const expected: unknown[] = [];
          for (const step of test.callSequence) {
            const value = await targetFn(...cloneEvaluationArgs(step.args));
            received.push(value);
            expected.push(step.expectedReturn);
          }
          const passed = evaluationValuesEqual(received, expected);
          return {
            id: test.id,
            description: test.description,
            passed,
            status: passed ? 'passed' : 'failed',
            receivedValue: received,
            expectedValue: expected,
            errorMessage: passed ? undefined : (test.errorMessage || `Esperábamos la secuencia '${JSON.stringify(expected)}' pero obtuvimos '${JSON.stringify(received)}'.`),
            hint: test.hintTip,
          };
        }

        if (test.returnedFunctionCallCounts) {
          const counts = test.returnedFunctionCallCounts;
          if (
            counts.length === 0
            || counts.some((count) => !Number.isInteger(count) || count < 0)
            || test.expectedReturn === undefined
          ) {
            return {
              id: test.id,
              description: test.description,
              passed: false,
              status: 'evaluation-error',
              isEvaluationError: true,
              errorMessage: 'Prueba mal configurada: la secuencia de llamadas no es válida.',
              hint: test.hintTip,
            };
          }

          const sequences: unknown[][] = [];
          for (const count of counts) {
            const args = cloneEvaluationArgs(test.args);
            const returnedFunction = targetFn(...args);
            if (typeof returnedFunction !== 'function') {
              return {
                id: test.id,
                description: test.description,
                passed: false,
                status: 'failed',
                receivedValue: returnedFunction,
                expectedValue: test.expectedReturn,
                errorMessage: test.errorMessage || `'${test.targetFunction}' debe devolver una función.`,
                hint: test.hintTip,
              };
            }
            const values: unknown[] = [];
            for (let call = 0; call < count; call++) values.push(returnedFunction());
            sequences.push(values);
          }

          const isMatch = evaluationValuesEqual(sequences, test.expectedReturn);
          return {
            id: test.id,
            description: test.description,
            passed: isMatch,
            status: isMatch ? 'passed' : 'failed',
            receivedValue: sequences,
            expectedValue: test.expectedReturn,
            errorMessage: isMatch ? undefined : (test.errorMessage || `Esperábamos '${JSON.stringify(test.expectedReturn)}' pero obtuvimos '${JSON.stringify(sequences)}'.`),
            hint: test.hintTip,
          };
        }

        // Special handling for semantic string matchers
        if (test.matcher === 'contains-all' || test.matcher === 'string-contains-all' || test.matcher === 'contains' || test.expectedContains || test.requireArgInResult !== undefined) {
          const args = cloneEvaluationArgs(test.args);
          let result: any;
          try {
            result = await targetFn(...args);
          } catch (e: any) {
            return {
              id: test.id,
              description: test.description,
              passed: false,
              status: 'evaluation-error',
              isEvaluationError: true,
              errorMessage: `La función '${test.targetFunction}' lanzó un error: ${e.message}`,
              hint: test.hintTip,
            };
          }
          const match = isStringMatch(result, test);
          return {
            id: test.id,
            description: test.description,
            passed: match.passed,
            status: match.passed ? 'passed' : 'failed',
            receivedValue: result,
            expectedValue: test.expectedContains || test.expectedReturn,
            errorMessage: match.passed ? undefined : (test.errorMessage || match.error || `El resultado "${result}" no contiene lo esperado.`),
            hint: test.hintTip,
          };
        }

        const args = cloneEvaluationArgs(test.args);
        const argsBefore = cloneEvaluationArgs(args);
        let result: any;
        try {
          result = await targetFn(...args);
        } catch (e: any) {
          if (test.expectedErrorContains !== undefined) {
            const message = e instanceof Error ? e.message : String(e);
            const passed = message.includes(test.expectedErrorContains);
            return {
              id: test.id,
              description: test.description,
              passed,
              status: passed ? 'passed' : 'failed',
              receivedValue: message,
              expectedValue: test.expectedErrorContains,
              errorMessage: passed ? undefined : (test.errorMessage || `El error debe incluir "${test.expectedErrorContains}", pero recibimos "${message}".`),
              hint: test.hintTip,
            };
          }
          return {
            id: test.id,
            description: test.description,
            passed: false,
            status: 'evaluation-error',
            isEvaluationError: true,
            errorMessage: `La función '${test.targetFunction}' lanzó un error: ${e.message}`,
            hint: test.hintTip,
          };
        }

        if (test.expectedErrorContains !== undefined) {
          return {
            id: test.id,
            description: test.description,
            passed: false,
            status: 'failed',
            receivedValue: result,
            expectedValue: test.expectedErrorContains,
            errorMessage: test.errorMessage || `Esperábamos un error que incluyera "${test.expectedErrorContains}", pero la función no lanzó ninguno.`,
            hint: test.hintTip,
          };
        }

        if (test.expectArgsUnchanged && JSON.stringify(args) !== JSON.stringify(argsBefore)) {
          return {
            id: test.id,
            description: test.description,
            passed: false,
            status: 'failed',
            receivedValue: args,
            expectedValue: argsBefore,
            errorMessage: test.errorMessage || 'La función cambió el dato original. Conserva los argumentos recibidos y construye el resultado aparte.',
            hint: test.hintTip,
          };
        }

        if (test.expectNewReferenceFromArg !== undefined && result === args[test.expectNewReferenceFromArg]) {
          return {
            id: test.id,
            description: test.description,
            passed: false,
            status: 'failed',
            receivedValue: result,
            errorMessage: test.errorMessage || 'La función debe devolver un objeto nuevo, no la misma referencia que recibió.',
            hint: test.hintTip,
          };
        }

        if (test.expectedReturn !== undefined) {
          // For strings, if no explicit matcher, use exact/deep-equal for numbers/booleans/arrays, but for strings be a bit lenient? Keep exact for now unless matcher specified
          const isMatch = evaluationValuesEqual(result, test.expectedReturn);
          return {
            id: test.id,
            description: test.description,
            passed: isMatch,
            status: isMatch ? 'passed' : 'failed',
            receivedValue: result,
            expectedValue: test.expectedReturn,
            errorMessage: isMatch ? undefined : (test.errorMessage || `Esperábamos '${JSON.stringify(test.expectedReturn)}' pero obtuvimos '${JSON.stringify(result)}'.`),
            hint: test.hintTip,
          };
        }

        return { id: test.id, description: test.description, passed: true, status: 'passed' };
      } catch (e: any) {
        return {
          id: test.id,
          description: test.description,
          passed: false,
          status: 'evaluation-error',
          isEvaluationError: true,
          errorMessage: `La función '${test.targetFunction}' lanzó un error: ${e.message}`,
          hint: test.hintTip,
        };
      }
    }

    case 'dom-check': {
      if (!test.domSelector) {
        return { id: test.id, description: test.description, passed: false, status: 'evaluation-error', isEvaluationError: true, errorMessage: 'Prueba mal configurada: falta selector del DOM.', hint: test.hintTip };
      }

      // For deterministic evaluation, build preview document from current workspace and simulate, not iframe
      // If iframe is provided and generation matches, we could use it, but to avoid race, prefer workspace evaluation
      // However for preview that requires JS execution, we simulate via building document and running JS in stub
      let doc: Document | null = null;
      let runtimeError: Error | null = null;
      let missingLookup: string | null = null;
      if (iframeElement && iframeElement.contentDocument && generation !== undefined) {
        // La generación solo confirma que no estamos validando una edición anterior.
        // La evaluación se reconstruye desde el workspace para evitar carreras con el iframe.
        const iframeGen = (iframeElement as any).__generation;
        if (iframeGen !== undefined && iframeGen !== generation) {
          return {
            id: test.id,
            description: test.description,
            passed: false,
            status: 'evaluation-error',
            isEvaluationError: true,
            errorMessage: 'Vista previa no lista. Vuelve a pulsar Comprobar.',
            hint: test.hintTip,
          };
        }
      }

      if (!doc) {
        // Deterministic fallback: build preview document and simulate
        try {
          const html = buildPreviewDocument(workspace);
          // Use DOMParser if available, else mock
          if (typeof DOMParser !== 'undefined') {
            const parser = new DOMParser();
            doc = parser.parseFromString(html, 'text/html');
            // Execute JS in a sandboxed way to populate DOM where needed
            // For simple cases, the HTML already contains the JS execution result? But JS in preview is not executed by DOMParser.
            // We simulate by running the JS with a stub document that writes to the parsed doc
            try {
              const jsFiles = Object.values(workspace.files).filter(f => f.language === 'javascript' || f.name.endsWith('.js'));
              const combinedJs = jsFiles.map(f => f.content).join('\n\n');
              // Create a stub that mirrors the parsed doc's getElementById
              const stubDoc: any = {
                getElementById: (id: string) => {
                  const element = doc!.getElementById(id);
                  if (!element) missingLookup = `#${id}`;
                  return element;
                },
                querySelector: (sel: string) => {
                  const element = doc!.querySelector(sel);
                  if (!element) missingLookup = sel;
                  return element;
                },
                querySelectorAll: (sel: string) => doc!.querySelectorAll(sel),
                createElement: (tag: string) => doc!.createElement(tag),
              };
              try {
                new Function('document', combinedJs)(stubDoc);
              } catch (error) {
                runtimeError = error instanceof Error ? error : new Error(String(error));
              }
            } catch {}
          } else {
            // Node env fallback: create mock
            const ids = [...combinedHtml.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
            const elements = new Map<string, any>();
            const makeEl = (id: string, initial: string = '') => {
              const el: any = {
                textContent: initial,
                innerText: initial,
                innerHTML: '',
                value: '',
                id,
                className: '',
                _handlers: {} as Record<string, Function>,
                addEventListener: function (evt: string, fn: Function) {
                  this._handlers[evt] = fn;
                },
                click: function () {
                  if (this._handlers['click']) {
                    try { this._handlers['click'](); } catch {}
                  }
                },
                dispatchEvent: function (e: any) {
                  const h = this._handlers[e.type];
                  if (h) try { h(e); } catch {}
                },
              };
              return el;
            };
            for (const id of ids) elements.set(id, makeEl(id, ''));
            for (const id of ['saludo', 'salida', 'boton', 'val-nombre', 'val-edad', 'val-ciudad', 'val-listo', 'tipos', 'celsius', 'ops', 'mensaje', 'extra']) {
              if (!elements.has(id)) elements.set(id, makeEl(id, '—'));
            }
            doc = {
              querySelector: (sel: string) => {
                const m = sel.match(/#([\w-]+)/);
                if (m) return elements.get(m[1]) || null;
                return null;
              },
              querySelectorAll: (sel: string) => {
                const m = sel.match(/#([\w-]+)/);
                if (m && elements.has(m[1])) return [elements.get(m[1])];
                return [] as any;
              },
              getElementById: (id: string) => elements.get(id) || null,
            } as unknown as Document;
            // Simulate via stub
            try {
              const stub: any = {
                _els: elements,
                getElementById: (id: string) => {
                  const element = elements.get(id) ?? null;
                  if (!element) missingLookup = `#${id}`;
                  return element;
                },
                querySelector: (sel: string) => {
                  const m = sel.match(/#([\w-]+)/);
                  if (m) {
                    const element = elements.get(m[1]) ?? null;
                    if (!element) missingLookup = sel;
                    return element;
                  }
                  return null;
                },
                querySelectorAll: () => [],
                createElement: () => makeEl('__created', ''),
              };
              try {
                new Function('document', combinedJs)(stub);
              } catch (error) {
                runtimeError = error instanceof Error ? error : new Error(String(error));
              }
            } catch {}
          }
        } catch (e: any) {
          return { id: test.id, description: test.description, passed: false, status: 'evaluation-error', isEvaluationError: true, errorMessage: 'No se pudo preparar la vista previa.', hint: test.hintTip };
        }
      }

      if (!doc) {
        return { id: test.id, description: test.description, passed: false, status: 'evaluation-error', isEvaluationError: true, errorMessage: 'No se pudo acceder a la vista previa.', hint: test.hintTip };
      }

      if (runtimeError) {
        return {
          id: test.id,
          description: test.description,
          passed: false,
          status: 'evaluation-error',
          isEvaluationError: true,
          errorMessage: `El programa se detuvo antes de completar la comprobación: ${missingLookup ? `no se encontró ${missingLookup}. ` : ''}${runtimeError.message}`,
          hint: test.hintTip,
        };
      }

      // Handle triggerClick for tests that need to simulate a click before checking
      if (test.triggerClick) {
        const triggerEl = doc.querySelector(test.triggerClick) as any;
        if (triggerEl) {
          try {
            const EventCtor = (globalThis as any).Event;
            let clickEvent: any = null;
            if (typeof EventCtor === 'function') {
              clickEvent = new EventCtor('click', { bubbles: true });
            }
            if (typeof triggerEl.click === 'function') {
              triggerEl.click();
            } else if (clickEvent && typeof triggerEl.dispatchEvent === 'function') {
              triggerEl.dispatchEvent(clickEvent);
            }
            // For mock with stored handler
            if (triggerEl.__clickHandler) {
              try { triggerEl.__clickHandler(); } catch {}
            }
            if (triggerEl._clickHandler) {
              try { triggerEl._clickHandler(); } catch {}
            }
          } catch {}
        }
      }

      const el = doc.querySelector(test.domSelector);
      if (!el) {
        return {
          id: test.id,
          description: test.description,
          passed: false,
          status: 'failed',
          errorMessage: `No encontramos el elemento '${test.domSelector}' en la página. ¿Lo borraste o cambiaste el id?`,
          hint: test.hintTip,
        };
      }

      if (test.domProperty === 'exists') {
        return { id: test.id, description: test.description, passed: true, status: 'passed' };
      }

      if (test.domProperty === 'count') {
        const count = doc.querySelectorAll(test.domSelector).length;
        const passed = count === test.expectedValue;
        return {
          id: test.id,
          description: test.description,
          passed,
          status: passed ? 'passed' : 'failed',
          receivedValue: count,
          expectedValue: test.expectedValue,
          errorMessage: passed ? undefined : (test.errorMessage || `Esperábamos ${test.expectedValue} elementos con '${test.domSelector}', encontramos ${count}.`),
          hint: test.hintTip,
        };
      }

      const propKey = test.domProperty || 'innerText';
      if (['innerText', 'innerHTML', 'value', 'textContent', 'className'].includes(propKey)) {
        let rawVal: any = (el as any)[propKey];
        if (typeof rawVal === 'string' && rawVal.trim() === '' && typeof (el as any).textContent === 'string' && (el as any).textContent.trim() !== '') {
          rawVal = (el as any).textContent;
        }
        if (typeof rawVal === 'string' && rawVal.trim() === '' && typeof (el as any).innerText === 'string' && (el as any).innerText.trim() !== '') {
          rawVal = (el as any).innerText;
        }
        rawVal = rawVal ?? '';
        const propVal = String(rawVal).trim();

        if (test.regexPattern) {
          try {
            const re = new RegExp(test.regexPattern, 'i');
            const passed = re.test(propVal);
            return {
              id: test.id,
              description: test.description,
              passed,
              status: passed ? 'passed' : 'failed',
              receivedValue: propVal,
              errorMessage: passed ? undefined : (test.errorMessage || `El contenido "${propVal}" no cumple el patrón esperado.`),
              hint: test.hintTip,
            };
          } catch {}
        }

        if (test.expectedContains?.length) {
          const opts = {
            caseInsensitive: test.caseInsensitive ?? true,
            normalizeSpaces: test.normalizeSpaces ?? true,
            ignorePunctuation: test.ignorePunctuation ?? true,
          };
          const passed = stringContainsAll(propVal, test.expectedContains, opts);
          return {
            id: test.id,
            description: test.description,
            passed,
            status: passed ? 'passed' : 'failed',
            receivedValue: propVal,
            expectedValue: test.expectedContains.join('", "'),
            errorMessage: passed ? undefined : (test.errorMessage || `Esperábamos que "${test.domSelector}" contuviera "${test.expectedContains.join('", "')}" pero tiene "${propVal}".`),
            hint: test.hintTip,
          };
        }

        if (test.expectedValue !== undefined) {
          const expectedStr = String(test.expectedValue);
          if (expectedStr.startsWith('!')) {
            const notVal = expectedStr.slice(1);
            const isMatch = !propVal.toLowerCase().includes(notVal.toLowerCase());
            return {
              id: test.id,
              description: test.description,
              passed: isMatch,
              status: isMatch ? 'passed' : 'failed',
              receivedValue: propVal,
              expectedValue: test.expectedValue,
              errorMessage: isMatch ? undefined : `No debería contener "${notVal}" pero encontramos "${propVal}".`,
              hint: test.hintTip,
            };
          }
          // Use matcher if specified
          if (test.matcher === 'contains-all' || test.matcher === 'string-contains-all' || test.matcher === 'contains') {
            const expectedContains = test.expectedContains || [expectedStr];
            const opts = {
              caseInsensitive: test.caseInsensitive ?? true,
              normalizeSpaces: test.normalizeSpaces ?? true,
              ignorePunctuation: test.ignorePunctuation ?? true,
            };
            const passed = stringContainsAll(propVal, expectedContains, opts);
            return {
              id: test.id,
              description: test.description,
              passed,
              status: passed ? 'passed' : 'failed',
              receivedValue: propVal,
              expectedValue: test.expectedValue,
              errorMessage: passed ? undefined : (test.errorMessage || `Esperábamos que "${test.domSelector}" contuviera "${expectedContains.join('", "')}" pero tiene "${propVal}".`),
              hint: test.hintTip,
            };
          }
          const isMatch = typeof test.expectedValue === 'string'
            ? propVal.toLowerCase().includes(expectedStr.toLowerCase())
            : propVal === expectedStr;

          return {
            id: test.id,
            description: test.description,
            passed: isMatch,
            status: isMatch ? 'passed' : 'failed',
            receivedValue: propVal,
            expectedValue: test.expectedValue,
            errorMessage: isMatch ? undefined : (test.errorMessage || `Esperábamos que "${test.domSelector}" contuviera "${expectedStr}" pero tiene "${propVal}".`),
            hint: test.hintTip,
          };
        }
        if (propVal.length === 0) {
          return { id: test.id, description: test.description, passed: false, status: 'failed', errorMessage: `El elemento "${test.domSelector}" está vacío.`, hint: test.hintTip };
        }
      }

      return { id: test.id, description: test.description, passed: true, status: 'passed' };
    }

    case 'console-check': {
      if (test.expectedValue === undefined && !test.expectedContains?.length) {
        return {
          id: test.id,
          description: test.description,
          passed: false,
          status: 'evaluation-error',
          isEvaluationError: true,
          errorMessage: 'Prueba mal configurada: falta el resultado esperado de la consola.',
          hint: test.hintTip,
        };
      }

      const output: string[] = [];
      const formatConsoleValue = (value: unknown) => {
        if (typeof value === 'string') return value;
        if (value === undefined) return 'undefined';
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      };
      const capturedConsole = {
        log: (...values: unknown[]) => output.push(values.map(formatConsoleValue).join(' ')),
        warn: (...values: unknown[]) => output.push(values.map(formatConsoleValue).join(' ')),
        error: (...values: unknown[]) => output.push(values.map(formatConsoleValue).join(' ')),
      };

      try {
        const stubDocument = createEvaluationDocument();
        new Function('document', 'window', 'console', combinedJs)(
          stubDocument,
          { document: stubDocument },
          capturedConsole,
        );
      } catch (e: any) {
        return {
          id: test.id,
          description: test.description,
          passed: false,
          status: 'evaluation-error',
          isEvaluationError: true,
          receivedValue: output,
          errorMessage: `El programa produjo un error al ejecutarse: ${e.message}`,
          hint: test.hintTip,
        };
      }

      let passed = false;
      if (Array.isArray(test.expectedValue)) {
        passed = JSON.stringify(output) === JSON.stringify(test.expectedValue.map(String));
      } else {
        const joined = output.join('\n');
        if (test.expectedContains?.length || test.matcher === 'contains' || test.matcher === 'contains-all') {
          passed = stringContainsAll(joined, test.expectedContains ?? [String(test.expectedValue)], {
            caseInsensitive: test.caseInsensitive ?? true,
            normalizeSpaces: test.normalizeSpaces ?? true,
            ignorePunctuation: test.ignorePunctuation ?? false,
          });
        } else {
          passed = joined === String(test.expectedValue);
        }
      }

      return {
        id: test.id,
        description: test.description,
        passed,
        status: passed ? 'passed' : 'failed',
        receivedValue: output,
        expectedValue: test.expectedValue ?? test.expectedContains,
        errorMessage: passed ? undefined : (test.errorMessage || 'La salida de la consola no coincide con el orden o los valores esperados.'),
        hint: test.hintTip,
      };
    }
    default: {
      return { id: test.id, description: test.description, passed: false, status: 'evaluation-error', isEvaluationError: true, errorMessage: 'Tipo de validador no soportado.', hint: test.hintTip };
    }
  }
}
