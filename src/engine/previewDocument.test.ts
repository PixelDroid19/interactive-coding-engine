import { describe, expect, it } from 'vitest';
import { STARTER_TEMPLATES } from '../templates/starterTemplates';
import { WorkspaceSnapshot } from '../types/scrim';
import { buildPreviewDocument } from './previewDocument';

function templateWorkspace(templateId: keyof typeof STARTER_TEMPLATES): WorkspaceSnapshot {
  const template = STARTER_TEMPLATES[templateId];
  return {
    activeFilePath: template.entrypoint,
    files: template.files,
  };
}

describe('buildPreviewDocument', () => {
  it('mantiene en español los documentos iniciales que ve el estudiante', () => {
    for (const templateId of ['vanilla-js', 'lit', 'react'] as const) {
      const document = buildPreviewDocument(templateWorkspace(templateId));
      expect(document).toMatch(/<html lang="es">/);
    }
  });

  it('ejecuta los módulos de Lit como módulos ES', () => {
    const document = buildPreviewDocument(templateWorkspace('lit'));

    expect(document).toMatch(/<script type="module">\s*import \{ LitElement/);
    expect(document).not.toMatch(/<script type="text\/javascript">[\s\S]*?import \{ LitElement/);
  });

  it('conserva dependencias externas y solo sustituye archivos locales', () => {
    const workspace: WorkspaceSnapshot = {
      activeFilePath: 'index.html',
      files: {
        'index.html': {
          name: 'index.html',
          path: 'index.html',
          language: 'html',
          content: `<!doctype html><html><head>
            <link rel="stylesheet" href="https://cdn.example.com/theme.css">
            <link rel="stylesheet" href="style.css">
          </head><body>
            <script src="https://cdn.example.com/library.js"></script>
            <script src="app.js"></script>
          </body></html>`,
        },
        'style.css': { name: 'style.css', path: 'style.css', language: 'css', content: 'body { color: black; }' },
        'app.js': { name: 'app.js', path: 'app.js', language: 'javascript', content: 'console.log("local");' },
      },
    };

    const document = buildPreviewDocument(workspace);

    expect(document).toContain('href="https://cdn.example.com/theme.css"');
    expect(document).toContain('src="https://cdn.example.com/library.js"');
    expect(document).not.toContain('href="style.css"');
    expect(document).not.toContain('src="app.js"');
    expect(document).toContain('body { color: black; }');
    expect(document).toContain('console.log("local");');
  });

  it('no duplica las dependencias que ya declara la plantilla React', () => {
    const document = buildPreviewDocument(templateWorkspace('react'));

    expect(document.match(/react@18\/umd\/react\.development\.js/g)).toHaveLength(1);
    expect(document.match(/react-dom@18\/umd\/react-dom\.development\.js/g)).toHaveLength(1);
    expect(document.match(/@babel\/standalone\/babel\.min\.js/g)).toHaveLength(1);
  });
});
