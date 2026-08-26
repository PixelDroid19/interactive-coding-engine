import ts from 'typescript';

interface Insertion {
  at: number;
  text: string;
  order: number;
}

interface Location {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

function locationOf(sourceFile: ts.SourceFile, node: ts.Node): Location {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const end = sourceFile.getLineAndCharacterOfPosition(node.end);
  return {
    start: { line: start.line + 1, column: start.character },
    end: { line: end.line + 1, column: end.character },
  };
}

function functionName(node: ts.FunctionLikeDeclaration): string {
  if ('name' in node && node.name) return node.name.getText();
  return '(anónima)';
}

function isCountableStatement(node: ts.Statement): boolean {
  const parentCanAcceptAnotherStatement = ts.isSourceFile(node.parent)
    || ts.isBlock(node.parent)
    || ts.isCaseClause(node.parent)
    || ts.isDefaultClause(node.parent);
  return parentCanAcceptAnotherStatement
    && !ts.isImportDeclaration(node)
    && !ts.isExportDeclaration(node)
    && !ts.isEmptyStatement(node)
    && !ts.isInterfaceDeclaration(node)
    && !ts.isTypeAliasDeclaration(node);
}

/** Instrumenta módulos ES en el Worker sin dependencias de Node. */
export function instrumentCellsSource(source: string, path: string): string {
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const insertions: Insertion[] = [];
  const statementMap: Record<string, Location> = {};
  const fnMap: Record<string, { name: string; loc: Location }> = {};
  const branchMap: Record<string, { type: string; locations: Location[] }> = {};
  const statementCounts: Record<string, number> = {};
  const functionCounts: Record<string, number> = {};
  const branchCounts: Record<string, number[]> = {};
  let statementId = 0;
  let functionId = 0;
  let branchId = 0;

  const insert = (at: number, text: string, order = 0) => insertions.push({ at, text, order });
  const visit = (node: ts.Node) => {
    if (ts.isStatement(node) && isCountableStatement(node)) {
      const id = String(statementId++);
      statementMap[id] = locationOf(sourceFile, node);
      statementCounts[id] = 0;
      insert(node.getStart(sourceFile), `__cellsFile.s[${JSON.stringify(id)}]++;`, 20);
    }
    const functionNode = ts.isFunctionLike(node) ? node as ts.FunctionLikeDeclaration : null;
    if (functionNode?.body && ts.isBlock(functionNode.body)) {
      const id = String(functionId++);
      fnMap[id] = { name: functionName(functionNode), loc: locationOf(sourceFile, functionNode) };
      functionCounts[id] = 0;
      insert(functionNode.body.getStart(sourceFile) + 1, `__cellsFile.f[${JSON.stringify(id)}]++;`, 10);
    }
    if (ts.isIfStatement(node)) {
      const id = String(branchId++);
      const conditionLocation = locationOf(sourceFile, node.expression);
      branchMap[id] = { type: 'if', locations: [conditionLocation, conditionLocation] };
      branchCounts[id] = [0, 0];
      insert(node.expression.getStart(sourceFile), `__cellsBranch(${JSON.stringify(id)},(`, 30);
      insert(node.expression.end, '))', -30);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  const coverage = { path, statementMap, fnMap, branchMap, s: statementCounts, f: functionCounts, b: branchCounts };
  const prefix = `const __cellsCoverage__ = globalThis.__cellsCoverage__ ||= {};\n`
    + `const __cellsFile = __cellsCoverage__[${JSON.stringify(path)}] ||= ${JSON.stringify(coverage)};\n`
    + `const __cellsBranch = (id, value) => { __cellsFile.b[id][value ? 0 : 1]++; return value; };\n`;
  const ordered = insertions.sort((left, right) => right.at - left.at || left.order - right.order);
  let result = source;
  for (const insertion of ordered) result = `${result.slice(0, insertion.at)}${insertion.text}${result.slice(insertion.at)}`;
  return prefix + result;
}
