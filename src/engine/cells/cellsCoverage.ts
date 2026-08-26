import type { CellsCoverageMetric, CellsCoverageResult } from './cellsWorkerProtocol';

interface MethodRange {
  name: string;
  lines: number[];
  branchCount: number;
}

interface IstanbulLocation { start: { line: number }; end: { line: number } }

export interface IstanbulFileCoverage {
  path: string;
  statementMap: Record<string, IstanbulLocation>;
  fnMap: Record<string, { loc: IstanbulLocation }>;
  branchMap: Record<string, { locations: IstanbulLocation[] }>;
  s: Record<string, number>;
  f: Record<string, number>;
  b: Record<string, number[]>;
}

export type IstanbulCoverageMap = Record<string, IstanbulFileCoverage>;

function metric(covered: number, total: number): CellsCoverageMetric {
  return {
    covered,
    total,
    percentage: total === 0 ? 100 : Math.round((covered / total) * 100),
  };
}

function braceDelta(line: string): number {
  let delta = 0;
  let quote = '';
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (escaped) { escaped = false; continue; }
    if (char === '\\') { escaped = true; continue; }
    if (quote) {
      if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === '{') delta += 1;
    if (char === '}') delta -= 1;
  }
  return delta;
}

function executableLines(lines: string[], start: number, end: number): number[] {
  const result: number[] = [];
  let insideTemplate = false;
  for (let index = start + 1; index < end; index += 1) {
    const value = lines[index].trim();
    if (!value || value.startsWith('//') || value === '}' || value === '};') continue;
    if (insideTemplate) {
      if (value.includes('`;')) insideTemplate = false;
      continue;
    }
    if (/return\s+html`/.test(value)) {
      result.push(index + 1);
      if (!value.slice(value.indexOf('`') + 1).includes('`')) insideTemplate = true;
      continue;
    }
    if (value.startsWith('<') || value.startsWith('>') || value.startsWith('text=')) continue;
    result.push(index + 1);
  }
  return result;
}

function methodRanges(source: string): MethodRange[] {
  const lines = source.split('\n');
  const methods: MethodRange[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^\s*(?:static\s+get\s+)?(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
    if (!match) continue;
    let depth = braceDelta(lines[index]);
    let end = index;
    while (depth > 0 && end + 1 < lines.length) {
      end += 1;
      depth += braceDelta(lines[end]);
    }
    const body = lines.slice(index, end + 1).join('\n');
    methods.push({
      name: match[1],
      lines: executableLines(lines, index, end),
      branchCount: (body.match(/\bif\s*\(/g) ?? []).length,
    });
    index = end;
  }
  return methods;
}

export function createCellsCoverageReport(
  path: string,
  source: string,
  invokedMethods: string[],
): CellsCoverageResult {
  const methods = methodRanges(source);
  if (methods.length === 0) {
    const empty = metric(0, 0);
    return {
      statements: empty,
      branches: empty,
      functions: empty,
      lines: empty,
      behaviors: empty,
      files: [{
        path,
        available: false,
        unavailableReason: 'coverage no disponible para este archivo: no contiene funciones analizables por el runtime del navegador.',
        statements: empty,
        branches: empty,
        functions: empty,
        lines: empty,
        uncoveredLines: [],
      }],
    };
  }
  const invoked = new Set(invokedMethods);
  const allLines = methods.flatMap((method) => method.lines);
  const coveredLines = methods.filter((method) => invoked.has(method.name)).flatMap((method) => method.lines);
  const branchTotal = methods.reduce((sum, method) => sum + method.branchCount * 2, 0);
  const branchCovered = methods
    .filter((method) => invoked.has(method.name))
    .reduce((sum, method) => sum + method.branchCount, 0);
  const statements = metric(coveredLines.length, allLines.length);
  const branches = metric(branchCovered, branchTotal);
  const functions = metric(methods.filter((method) => invoked.has(method.name)).length, methods.length);
  const linesMetric = metric(new Set(coveredLines).size, new Set(allLines).size);
  return {
    statements,
    branches,
    functions,
    lines: linesMetric,
    behaviors: functions,
    files: [{
      path,
      available: true,
      statements,
      branches,
      functions,
      lines: linesMetric,
      uncoveredLines: [...new Set(allLines.filter((line) => !coveredLines.includes(line)))].sort((left, right) => left - right),
    }],
  };
}

export function mergeCellsCoverageReports(reports: CellsCoverageResult[]): CellsCoverageResult {
  const files = reports.flatMap((report) => report.files ?? []);
  const mergeMetric = (select: (report: CellsCoverageResult) => CellsCoverageMetric | undefined): CellsCoverageMetric => {
    const metrics = reports.map(select).filter((value): value is CellsCoverageMetric => Boolean(value));
    const covered = metrics.reduce((sum, current) => sum + current.covered, 0);
    const total = metrics.reduce((sum, current) => sum + current.total, 0);
    return metric(covered, total);
  };
  return {
    statements: mergeMetric((report) => report.statements),
    branches: mergeMetric((report) => report.branches),
    functions: mergeMetric((report) => report.functions),
    lines: mergeMetric((report) => report.lines),
    behaviors: mergeMetric((report) => report.behaviors),
    files,
  };
}

export function createIstanbulCoverageReport(
  coverage: IstanbulCoverageMap,
  includedPaths?: string[],
): CellsCoverageResult | null {
  const allowed = includedPaths ? new Set(includedPaths) : null;
  const entries = Object.values(coverage).filter((entry) => !allowed || allowed.has(entry.path));
  if (entries.length === 0) return null;

  const files = entries.map((entry) => {
    const statementKeys = Object.keys(entry.statementMap);
    const functionKeys = Object.keys(entry.fnMap);
    const branchCounts = Object.values(entry.b).flat();
    const statementLines = new Map<number, boolean>();
    for (const key of statementKeys) {
      const line = entry.statementMap[key].start.line;
      statementLines.set(line, (statementLines.get(line) ?? false) || (entry.s[key] ?? 0) > 0);
    }
    const lines = [...statementLines.entries()];
    return {
      path: entry.path,
      available: true,
      statements: metric(statementKeys.filter((key) => (entry.s[key] ?? 0) > 0).length, statementKeys.length),
      branches: metric(branchCounts.filter((count) => count > 0).length, branchCounts.length),
      functions: metric(functionKeys.filter((key) => (entry.f[key] ?? 0) > 0).length, functionKeys.length),
      lines: metric(lines.filter(([, covered]) => covered).length, lines.length),
      uncoveredLines: lines.filter(([, covered]) => !covered).map(([line]) => line).sort((left, right) => left - right),
    };
  });

  const reports = files.map((file) => ({
    statements: file.statements,
    branches: file.branches,
    functions: file.functions,
    lines: file.lines,
    behaviors: file.functions,
    files: [file],
  }));
  return mergeCellsCoverageReports(reports);
}
