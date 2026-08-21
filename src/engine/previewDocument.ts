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
})();
</script>
`;

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

  const referencesLocalAsset = (reference: string) => {
    const normalized = normalizeLocalAssetPath(reference);
    return normalized !== null && localAssetPaths.has(normalized);
  };

  return html
    .replace(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\/?>/gi, (tag, href: string) =>
      referencesLocalAsset(href) ? '' : tag)
    .replace(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (tag, src: string) =>
      referencesLocalAsset(src) ? '' : tag);
}

function hasModuleSyntax(source: string): boolean {
  return /(?:^|\n)\s*(?:import(?:\s|\{|\*)|export\s)/m.test(source);
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
  const jsContent = jsFiles.map((file) => file.content).join('\n\n');
  const useJsx = shouldTranspileJsx(workspace);
  const useModules = !useJsx && hasModuleSyntax(jsContent);
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
    const headInject = `${CONSOLE_BRIDGE}${reactCdns}${styleTag}`;
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
