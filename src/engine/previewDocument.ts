import { WorkspaceFile, WorkspaceSnapshot } from '../types/scrim';

const CONSOLE_BRIDGE = `
<script>
(function () {
  const send = (payload) => {
    try { window.parent.postMessage(Object.assign({ __preview_source: 'preview-sandbox' }, payload), '*'); } catch (e) {}
  };
  const serialize = (value) => {
    if (value instanceof Error) return value.message;
    if (typeof value === 'object' && value !== null) {
      try { return JSON.parse(JSON.stringify(value)); } catch (e) { return String(value); }
    }
    return value;
  };
  ['log', 'info', 'warn', 'error'].forEach((level) => {
    const original = console[level].bind(console);
    console[level] = function (...args) {
      original(...args);
      send({ type: 'console', level: level, args: args.map(serialize) });
    };
  });
  window.onerror = function (message, _source, lineno) {
    send({ type: 'error', message: String(message) + (lineno ? ' (línea ' + lineno + ')' : '') });
    return false;
  };
  window.onunhandledrejection = function (event) {
    send({ type: 'error', message: 'Promesa rechazada: ' + (event.reason && event.reason.message ? event.reason.message : event.reason) });
  };
  window.addEventListener('message', function (event) {
    const data = event.data;
    if (event.source !== window.parent || !data || data.source !== 'aula-validator' || data.type !== 'run') return;
    void (async function () {
      try {
        const waitForTag = async (tag) => {
          if (customElements.get(tag)) return true;
          return Promise.race([
            customElements.whenDefined(tag).then(() => true),
            new Promise((resolve) => setTimeout(resolve, 2500, false)),
          ]);
        };
        let missingTag;
        if (Array.isArray(data.awaitedTags)) {
          for (const tag of data.awaitedTags) {
            if (typeof tag === 'string' && !(await waitForTag(tag))) {
              missingTag = tag;
              break;
            }
          }
        }
        if (missingTag) {
          window.parent.postMessage({ source: 'aula-validator', type: 'missing-tag', validationId: data.validationId, tag: missingTag }, '*');
          return;
        }
        const validator = new Function('return (' + String(data.script || '') + ');')();
        if (typeof validator !== 'function') throw new Error('la comprobación no es una función');
        const raw = await validator({ window, document, customElements, HTMLElement, Event, CustomEvent });
        const normalized = typeof raw === 'boolean' ? { passed: raw } : raw;
        if (!normalized || typeof normalized.passed !== 'boolean') {
          throw new Error('la comprobación no devolvió true, false ni un resultado con passed');
        }
        const result = JSON.parse(JSON.stringify(normalized));
        window.parent.postMessage({ source: 'aula-validator', type: 'result', validationId: data.validationId, result }, '*');
      } catch (error) {
        window.parent.postMessage({
          source: 'aula-validator', type: 'error', validationId: data.validationId,
          message: error && error.message ? error.message : String(error),
        }, '*');
      }
    })();
  });
})();
</script>
`;

const LIT_IMPORT_MAP = `<script type="importmap">{"imports":{"lit":"https://esm.sh/lit@3.3.3","lit/":"https://esm.sh/lit@3.3.3/","@lit/task":"https://esm.sh/@lit/task@1.0.3","@lit/context":"https://esm.sh/@lit/context@1.1.6"}}</script>`;

export function shouldTranspileJsx(workspace: WorkspaceSnapshot): boolean {
  return Object.values(workspace.files).some((file) => {
    const path = file.path.toLowerCase();
    if (path.endsWith('.jsx') || path.endsWith('.tsx')) return true;
    const content = file.content;
    return (
      content.includes('ReactDOM.render') ||
      content.includes('ReactDOM.createRoot') ||
      /from\s+['"]react['"]/.test(content)
    );
  });
}

function collectByLanguage(files: WorkspaceFile[], language: WorkspaceFile['language'] | string): WorkspaceFile[] {
  return files.filter((file) => {
    const name = file.name.toLowerCase();
    if (language === 'css') return file.language === 'css' || name.endsWith('.css');
    if (language === 'html') return file.language === 'html' || name.endsWith('.html');
    if (language === 'javascript') {
      return (
        file.language === 'javascript' ||
        file.language === 'typescript' ||
        /\.(js|jsx|ts|tsx)$/.test(name)
      );
    }
    return false;
  });
}

function normalizeLocalAssetPath(path: string): string | null {
  const trimmed = path.trim();
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(trimmed)) return null;
  return trimmed
    .split(/[?#]/, 1)[0]
    .replace(/^\/+/, '')
    .replace(/^(?:\.\/)+/, '');
}

function stripLinkedAssets(html: string, files: WorkspaceFile[]): string {
  const localAssetPaths = new Set(
    files.flatMap((file) => {
      const path = normalizeLocalAssetPath(file.path);
      const name = normalizeLocalAssetPath(file.name);
      return [path, name].filter((value): value is string => Boolean(value));
    }),
  );

  const referencesBundledAsset = (reference: string, extension: RegExp) => {
    const normalized = normalizeLocalAssetPath(reference);
    return normalized !== null && (localAssetPaths.has(normalized) || extension.test(normalized));
  };

  return html
    .replace(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\/?>/gi, (tag, href: string) =>
      referencesBundledAsset(href, /\.css$/i) ? '' : tag)
    .replace(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (tag, src: string) =>
      referencesBundledAsset(src, /\.(?:js|jsx|ts|tsx)$/i) ? '' : tag);
}

function hasModuleSyntax(source: string): boolean {
  return /(?:^|\n)\s*(?:import(?:\s|\{|\*)|export\s)/m.test(source);
}

function normalizeWorkspaceModulePath(path: string): string {
  const parts: string[] = [];
  for (const part of path.replace(/\\/g, '/').replace(/^\/+/, '').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return parts.join('/');
}

function resolveLocalModulePath(fromPath: string, specifier: string, knownPaths: Set<string>): string | null {
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) return null;
  const base = specifier.startsWith('/')
    ? specifier
    : `${fromPath.split('/').slice(0, -1).join('/')}/${specifier}`;
  const normalized = normalizeWorkspaceModulePath(base);
  for (const candidate of [normalized, `${normalized}.js`, `${normalized}/index.js`]) {
    if (knownPaths.has(candidate)) return candidate;
  }
  return null;
}

const STATIC_IMPORT_PATTERN = /(^|\n)\s*import\s+(?:[^;'"`]+\s+from\s+)?['"]([^'"]+)['"]\s*;?/g;

function buildJavaScriptSource(files: WorkspaceFile[]): string {
  const byPath = new Map(files.map((file) => [normalizeWorkspaceModulePath(file.path), file]));
  const knownPaths = new Set(byPath.keys());
  const dependencies = new Map<string, string[]>();
  let hasLocalImports = false;

  for (const [path, file] of byPath) {
    const localDependencies: string[] = [];
    for (const match of file.content.matchAll(new RegExp(STATIC_IMPORT_PATTERN.source, 'g'))) {
      const resolved = resolveLocalModulePath(path, match[2], knownPaths);
      if (resolved) {
        localDependencies.push(resolved);
        hasLocalImports = true;
      }
    }
    dependencies.set(path, localDependencies);
  }

  if (!hasLocalImports) return files.map((file) => file.content).join('\n\n');

  const ordered: WorkspaceFile[] = [];
  const state = new Map<string, 'visiting' | 'done'>();
  const visit = (path: string) => {
    if (state.get(path) === 'done') return;
    if (state.get(path) === 'visiting') return;
    state.set(path, 'visiting');
    for (const dependency of dependencies.get(path) || []) visit(dependency);
    state.set(path, 'done');
    const file = byPath.get(path);
    if (file) ordered.push(file);
  };
  for (const path of byPath.keys()) visit(path);

  return ordered.map((file) => {
    const path = normalizeWorkspaceModulePath(file.path);
    return file.content
      .replace(new RegExp(STATIC_IMPORT_PATTERN.source, 'g'), (statement, prefix: string, specifier: string) =>
        resolveLocalModulePath(path, specifier, knownPaths) ? prefix : statement)
      .replace(/(^|\n)\s*export\s+\{[^}]*\}\s*;?/g, '$1')
      .replace(/\bexport\s+default\s+(?=(?:class|function)\s+[A-Za-z_$])/g, '')
      .replace(/\bexport\s+(?=(?:async\s+)?(?:function|class|const|let|var)\b)/g, '');
  }).join('\n\n');
}

function buildReactDependencies(html: string): string {
  const scriptSources = Array.from(html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi))
    .map((match) => match[1].toLowerCase());
  const hasReact = scriptSources.some((src) => /(?:^|\/)react(?:@|\/|\.(?:development|production(?:\.min)?)\.js)/.test(src));
  const hasReactDom = scriptSources.some((src) => /(?:^|\/)react-dom(?:@|\/|\.)/.test(src));
  const hasBabel = scriptSources.some((src) => src.includes('@babel/standalone') || /(?:^|\/)babel(?:\.min)?\.js/.test(src));

  return [
    hasReact ? '' : '<script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>',
    hasReactDom ? '' : '<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>',
    hasBabel ? '' : '<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>',
  ].filter(Boolean).join('\n');
}

export function buildPreviewDocument(workspace: WorkspaceSnapshot): string {
  const files = Object.values(workspace.files) as WorkspaceFile[];
  const htmlFile = collectByLanguage(files, 'html')[0];
  const cssContent = collectByLanguage(files, 'css').map((file) => file.content).join('\n\n');
  const jsFiles = collectByLanguage(files, 'javascript');
  const jsContent = buildJavaScriptSource(jsFiles);
  const useJsx = shouldTranspileJsx(workspace);
  const useModules = !useJsx && hasModuleSyntax(jsContent);
  const usesBareLitImport = /\bfrom\s+['"](?:lit(?:\/[^'"]*)?|@lit\/(?:task|context))['"]|\bimport\s*\(\s*['"](?:lit(?:\/[^'"]*)?|@lit\/(?:task|context))['"]\s*\)/.test(jsContent);
  const scriptType = useJsx ? 'text/babel' : useModules ? 'module' : 'text/javascript';

  const styleTag = cssContent ? `<style>\n${cssContent}\n</style>` : '';
  const sourceHtml = htmlFile?.content ?? '';
  const reactCdns = useJsx ? `\n${buildReactDependencies(sourceHtml)}` : '';

  const userScript = jsContent
    ? useModules
      ? `
<script type="${scriptType}">
${jsContent}
</script>`
      : `
<script type="${scriptType}">
try {
${jsContent}
} catch (err) {
  console.error(err && err.message ? err.message : err);
}
</script>`
    : '';

  if (htmlFile) {
    let html = stripLinkedAssets(htmlFile.content, files).trim();
    if (!/^<!doctype html>/i.test(html)) {
      html = `<!DOCTYPE html>\n${html}`;
    }
    if (!html.includes('<head>')) {
      html = html.replace(/<html([^>]*)>/i, `<html$1><head></head>`);
    }
    const headInject = `${CONSOLE_BRIDGE}${usesBareLitImport ? LIT_IMPORT_MAP : ''}${reactCdns}${styleTag}`;
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${headInject}</head>`);
    } else {
      html = headInject + html;
    }
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${userScript}</body>`);
    } else {
      html += userScript;
    }
    return html;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  ${CONSOLE_BRIDGE}
  ${usesBareLitImport ? LIT_IMPORT_MAP : ''}
  ${reactCdns}
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; background: #0f172a; color: #f8fafc; }
    ${cssContent}
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="output"></div>
  ${userScript}
</body>
</html>`;
}
