import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { format } from 'prettier';
import ts from 'typescript';
import { COMPONENT_SPECS_01_TO_07 } from '../src/curriculum/web-components-lit/specs01to07';
import { COMPONENT_SPECS_08_TO_14 } from '../src/curriculum/web-components-lit/specs08to14';
import { COMPONENT_SPECS_15_TO_20 } from '../src/curriculum/web-components-lit/specs15to20';
import { COMPONENT_SPECS_21_TO_26 } from '../src/curriculum/web-components-lit/specs21to26';
import { COMPONENT_SPECS_27_TO_32 } from '../src/curriculum/web-components-lit/specs27to32';
import { COMPONENT_SPECS_33_TO_40 } from '../src/curriculum/web-components-lit/specs33to40';
import { COMPONENT_SPECS_41_TO_45 } from '../src/curriculum/web-components-lit/specs41to45';
import { ComponentCourseLessonSpec } from '../src/curriculum/web-components-lit/types';

const groups: Array<[string, ComponentCourseLessonSpec[]]> = [
  ['specs01to07.ts', COMPONENT_SPECS_01_TO_07],
  ['specs08to14.ts', COMPONENT_SPECS_08_TO_14],
  ['specs15to20.ts', COMPONENT_SPECS_15_TO_20],
  ['specs21to26.ts', COMPONENT_SPECS_21_TO_26],
  ['specs27to32.ts', COMPONENT_SPECS_27_TO_32],
  ['specs33to40.ts', COMPONENT_SPECS_33_TO_40],
  ['specs41to45.ts', COMPONENT_SPECS_41_TO_45],
];

function propertyName(node: ts.PropertyAssignment): string | undefined {
  if (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) return node.name.text;
  return undefined;
}

function collectCodeLiterals(sourceFile: ts.SourceFile): ts.NoSubstitutionTemplateLiteral[] {
  const nodes: ts.NoSubstitutionTemplateLiteral[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isPropertyAssignment(node)
      && ['example', 'starter'].includes(propertyName(node) || '')
      && ts.isNoSubstitutionTemplateLiteral(node.initializer)
    ) {
      nodes.push(node.initializer);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return nodes;
}

function encodeTemplateLiteral(value: string): string {
  const escaped = value
    .trimEnd()
    .replaceAll('\\', '\\\\')
    .replaceAll('`', '\\`')
    .replaceAll('${', '\\${');
  return `\`${escaped}\``;
}

for (const [fileName, specs] of groups) {
  const path = resolve(process.cwd(), 'src/curriculum/web-components-lit', fileName);
  const source = await readFile(path, 'utf8');
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const nodes = collectCodeLiterals(sourceFile);
  const runtimeCode = specs.flatMap((spec) => [spec.example, spec.starter, spec.debug.starter]);

  if (nodes.length !== runtimeCode.length) {
    throw new Error(`${fileName}: se esperaban ${runtimeCode.length} bloques de código y se encontraron ${nodes.length}`);
  }

  const replacements = await Promise.all(nodes.map(async (node, index) => {
    try {
      return {
        start: node.getStart(sourceFile),
        end: node.getEnd(),
        content: encodeTemplateLiteral(await format(runtimeCode[index], {
          parser: 'babel',
          printWidth: 88,
          singleQuote: true,
          semi: true,
          tabWidth: 2,
        })),
      };
    } catch (error) {
      const lesson = specs[Math.floor(index / 3)];
      const kind = ['example', 'starter', 'debug starter'][index % 3];
      const message = error instanceof Error ? error.message.split('\n')[0] : String(error);
      console.warn(`${fileName} · lección ${lesson.number} · ${kind}: ${message}`);
      return {
        start: node.getStart(sourceFile),
        end: node.getEnd(),
        content: encodeTemplateLiteral(runtimeCode[index]),
      };
    }
  }));

  let next = source;
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    next = `${next.slice(0, replacement.start)}${replacement.content}${next.slice(replacement.end)}`;
  }
  await writeFile(path, next, 'utf8');
}
