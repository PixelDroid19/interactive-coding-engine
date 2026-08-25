import type { WorkspaceFile } from '../types/scrim';

export const WORKSPACE_DOM_TYPES_PATH = '/__aula_dom__.d.ts';

const TAG_INTERFACE: Record<string, string> = {
  a: 'HTMLAnchorElement',
  audio: 'HTMLAudioElement',
  button: 'HTMLButtonElement',
  canvas: 'HTMLCanvasElement',
  form: 'HTMLFormElement',
  iframe: 'HTMLIFrameElement',
  img: 'HTMLImageElement',
  input: 'HTMLInputElement',
  label: 'HTMLLabelElement',
  option: 'HTMLOptionElement',
  select: 'HTMLSelectElement',
  textarea: 'HTMLTextAreaElement',
  video: 'HTMLVideoElement',
};

function typeForTag(tagName: string): string {
  const tag = tagName.toLowerCase();
  if (TAG_INTERFACE[tag]) return TAG_INTERFACE[tag];
  if (tag.includes('-')) return 'HTMLElement';
  return `HTMLElementTagNameMap["${tag}"]`;
}

function escapeTypeScriptString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function buildWorkspaceDomDeclarations(
  files: Array<Pick<WorkspaceFile, 'path' | 'content' | 'language'>>,
): string | null {
  const elements = new Map<string, string>();

  for (const file of files) {
    if (file.language !== 'html' && !file.path.endsWith('.html')) continue;
    const pattern = /<([A-Za-z][\w:-]*)\b[^>]*\bid\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>/g;
    for (const match of file.content.matchAll(pattern)) {
      const id = match[2] ?? match[3] ?? match[4];
      if (id && !elements.has(id)) elements.set(id, typeForTag(match[1]));
    }
  }

  if (elements.size === 0) return null;
  const overloads = [...elements.entries()].flatMap(([rawId, elementType]) => {
    const id = escapeTypeScriptString(rawId);
    return [
      `  getElementById(elementId: "${id}"): ${elementType} | null;`,
      `  querySelector(selectors: "#${id}"): ${elementType} | null;`,
      `  querySelectorAll(selectors: "#${id}"): NodeListOf<${elementType}>;`,
    ];
  });

  return [
    '// Tipos generados desde el HTML visible del ejercicio.',
    'interface Document {',
    ...overloads,
    '}',
  ].join('\n');
}
