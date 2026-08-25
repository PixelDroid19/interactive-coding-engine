import {
  ReasoningActivity,
  ReasoningAttempt,
  ReasoningConnection,
} from '../types/curriculum';

export interface ReasoningCheckResult {
  id: string;
  label: string;
  passed: boolean;
  message: string;
}

export interface ReasoningValidationResult {
  allPassed: boolean;
  checks: ReasoningCheckResult[];
  feedbackMessage: string;
  isEvaluationError?: boolean;
}

export function createInitialReasoningAttempt(activity: ReasoningActivity): ReasoningAttempt {
  if (activity.kind === 'sequence') {
    const order = activity.steps.map((step) => step.id);
    const startsSolved = JSON.stringify(order) === JSON.stringify(activity.expectedOrder);
    return { kind: 'sequence', order: startsSolved ? [...order.slice(1), ...order.slice(0, 1)] : order };
  }
  if (activity.kind === 'trace-table') return { kind: 'trace-table', cells: {} };
  if (activity.kind === 'decision-table') return { kind: 'decision-table', outcomes: {} };
  if (activity.kind === 'flowchart') return { kind: 'flowchart', connections: [] };
  if (activity.kind === 'vector-ranking') {
    const order = activity.candidates.map((candidate) => candidate.id);
    const startsSolved = JSON.stringify(order) === JSON.stringify(activity.expectedOrder);
    return { kind: 'vector-ranking', order: startsSolved ? [...order.slice(1), ...order.slice(0, 1)] : order };
  }
  if (activity.kind === 'context-budget') {
    const selected = activity.blocks.filter((block) => block.required).map((block) => block.id);
    const expected = [...new Set(activity.expectedSelected)].sort();
    const startsSolved = JSON.stringify([...new Set(selected)].sort()) === JSON.stringify(expected);
    return { kind: 'context-budget', selected: startsSolved ? [] : selected };
  }
  return { kind: 'dependency-map', dependencies: [] };
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
}

function connectionKey(connection: ReasoningConnection): string {
  return `${connection.from}->${connection.to}:${normalize(connection.label ?? '')}`;
}

function compareConnections(
  expected: ReasoningConnection[],
  received: ReasoningConnection[],
  label: string,
  nodeLabels: Record<string, string>,
): ReasoningCheckResult {
  const expectedKeys = [...new Set(expected.map(connectionKey))].sort();
  const receivedKeys = [...new Set(received.map(connectionKey))].sort();
  const passed = JSON.stringify(expectedKeys) === JSON.stringify(receivedKeys);
  const missing = expected.filter((connection) => !receivedKeys.includes(connectionKey(connection)));
  return {
    id: 'connections',
    label,
    passed,
    message: passed
      ? 'Las conexiones representan el flujo esperado.'
      : `Falta conectar ${missing.map((item) => `${nodeLabels[item.from] ?? item.from} con ${nodeLabels[item.to] ?? item.to}`).join(', ') || 'los nodos correctos'}.`,
  };
}

export function validateReasoningAttempt(
  activity: ReasoningActivity,
  attempt: ReasoningAttempt,
): ReasoningValidationResult {
  if (activity.kind !== attempt.kind) {
    return {
      allPassed: false,
      checks: [],
      isEvaluationError: true,
      feedbackMessage: 'La actividad y la respuesta no usan el mismo tipo de razonamiento.',
    };
  }

  let checks: ReasoningCheckResult[] = [];

  switch (activity.kind) {
    case 'sequence': {
      const received = (attempt as Extract<ReasoningAttempt, { kind: 'sequence' }>).order;
      checks = activity.expectedOrder.map((expectedId, index) => {
        const expectedStep = activity.steps.find((step) => step.id === expectedId);
        const passed = received[index] === expectedId;
        return {
          id: `step-${index}`,
          label: `Paso ${index + 1}`,
          passed,
          message: passed
            ? `${expectedStep?.label ?? expectedId} está en su lugar.`
            : `En el paso ${index + 1} debería aparecer ${expectedStep?.label ?? expectedId}.`,
        };
      });
      break;
    }
    case 'trace-table': {
      const received = (attempt as Extract<ReasoningAttempt, { kind: 'trace-table' }>).cells;
      checks = Object.entries(activity.expectedCells).map(([cellId, expected]) => {
        const passed = normalize(received[cellId] ?? '') === normalize(expected);
        return {
          id: cellId,
          label: cellId,
          passed,
          message: passed
            ? `La celda ${cellId} sigue correctamente el estado.`
            : `Revisa ${cellId}: el valor debe surgir de la vuelta anterior.`,
        };
      });
      break;
    }
    case 'flowchart':
      checks = [compareConnections(
        activity.expectedConnections,
        (attempt as Extract<ReasoningAttempt, { kind: 'flowchart' }>).connections,
        'Conexiones del diagrama',
        Object.fromEntries(activity.nodes.map((node) => [node.id, node.label])),
      )];
      break;
    case 'decision-table': {
      const received = (attempt as Extract<ReasoningAttempt, { kind: 'decision-table' }>).outcomes;
      checks = Object.entries(activity.expectedOutcomes).map(([caseId, expected]) => {
        const currentCase = activity.cases.find((candidate) => candidate.id === caseId);
        const passed = normalize(received[caseId] ?? '') === normalize(expected);
        return {
          id: caseId,
          label: currentCase?.label ?? caseId,
          passed,
          message: passed
            ? 'La condición conduce al resultado correcto.'
            : `Vuelve a evaluar ${currentCase?.label ?? caseId} desde la primera condición.`,
        };
      });
      break;
    }
    case 'dependency-map':
      checks = [compareConnections(
        activity.expectedDependencies,
        (attempt as Extract<ReasoningAttempt, { kind: 'dependency-map' }>).dependencies,
        'Dependencias entre módulos',
        Object.fromEntries(activity.modules.map((module) => [module.id, module.label])),
      )];
      break;
    case 'vector-ranking': {
      const received = (attempt as Extract<ReasoningAttempt, { kind: 'vector-ranking' }>).order;
      checks = activity.expectedOrder.map((expectedId, index) => ({
        id: `rank-${index}`,
        label: `Posición ${index + 1}`,
        passed: received[index] === expectedId,
        message: received[index] === expectedId
          ? `${activity.candidates.find((item) => item.id === expectedId)?.label ?? expectedId} está bien ubicado.`
          : `Revisa la posición ${index + 1}: ordena de mayor a menor puntuación.`,
      }));
      break;
    }
    case 'context-budget': {
      const selected = (attempt as Extract<ReasoningAttempt, { kind: 'context-budget' }>).selected;
      const uniqueSelected = [...new Set(selected)].sort();
      const expected = [...new Set(activity.expectedSelected)].sort();
      const used = activity.blocks.filter((block) => uniqueSelected.includes(block.id)).reduce((sum, block) => sum + block.tokens, 0);
      const required = activity.blocks.filter((block) => block.required).every((block) => uniqueSelected.includes(block.id));
      checks = [
        { id: 'budget', label: 'Presupuesto', passed: used <= activity.budget, message: used <= activity.budget ? `Usas ${used} de ${activity.budget} tokens.` : `Usas ${used}; supera el presupuesto de ${activity.budget}.` },
        { id: 'required', label: 'Bloques obligatorios', passed: required, message: required ? 'Conservaste los bloques obligatorios.' : 'Falta un bloque obligatorio.' },
        { id: 'selection', label: 'Selección útil', passed: JSON.stringify(uniqueSelected) === JSON.stringify(expected), message: JSON.stringify(uniqueSelected) === JSON.stringify(expected) ? 'La selección coincide con el contrato.' : 'Revisa qué bloque opcional aporta más valor dentro del espacio restante.' },
      ];
      break;
    }
  }

  const allPassed = checks.length > 0 && checks.every((check) => check.passed);
  return {
    allPassed,
    checks,
    feedbackMessage: allPassed
      ? 'Bien. La representación coincide con el comportamiento del programa.'
      : checks.find((check) => !check.passed)?.message ?? 'Revisa la representación e inténtalo otra vez.',
  };
}
