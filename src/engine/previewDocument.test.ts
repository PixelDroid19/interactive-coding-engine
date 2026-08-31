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
  it('incluye un puente de validación dentro del iframe aislado', () => {
    const document = buildPreviewDocument(templateWorkspace('vanilla-js'));
    expect(document).toContain("data.source !== 'aula-validator'");
    expect(document).toContain("source: 'aula-validator', type: 'result'");
  });

  it('espera de forma acotada a que Lit registre el custom element antes de declararlo ausente', () => {
    const document = buildPreviewDocument(templateWorkspace('lit'));

    expect(document).toContain('customElements.whenDefined(tag)');
    expect(document).toContain('setTimeout(resolve, 2500, false)');
    expect(document).not.toContain("data.awaitedTags.find((tag) => typeof tag === 'string' && !customElements.get(tag))");
  });

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

  it('resuelve imports profesionales de Lit mediante un import map fijado', () => {
    const workspace: WorkspaceSnapshot = {
      activeFilePath: 'app.js',
      files: {
        'index.html': {
          name: 'index.html',
          path: 'index.html',
          language: 'html',
          content: '<!doctype html><html lang="es"><head></head><body><curso-tarjeta></curso-tarjeta><script type="module" src="app.js"></script></body></html>',
        },
        'app.js': {
          name: 'app.js',
          path: 'app.js',
          language: 'javascript',
          content: "import { LitElement, html } from 'lit';\nimport { repeat } from 'lit/directives/repeat.js';\nimport { Task } from '@lit/task';\nimport { ContextProvider } from '@lit/context';",
        },
      },
    };

    const document = buildPreviewDocument(workspace);

    expect(document).toContain('<script type="importmap">');
    expect(document).toContain('"lit":"https://esm.sh/lit@3.3.3"');
    expect(document).toContain('"lit/":"https://esm.sh/lit@3.3.3/"');
    expect(document).toContain('"@lit/task":"https://esm.sh/@lit/task@1.0.3"');
    expect(document).toContain('"@lit/context":"https://esm.sh/@lit/context@1.1.6"');
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

  it('elimina referencias locales obsoletas después de renombrar JavaScript o CSS', () => {
    const workspace: WorkspaceSnapshot = {
      activeFilePath: 'main.js',
      files: {
        'index.html': {
          name: 'index.html',
          path: 'index.html',
          language: 'html',
          content: `<!doctype html><html><head>
            <link rel="stylesheet" href="styles.css">
            <link rel="stylesheet" href="https://cdn.example.com/theme.css">
          </head><body>
            <script src="app.js"></script>
            <script src="https://cdn.example.com/library.js"></script>
          </body></html>`,
        },
        'theme.css': { name: 'theme.css', path: 'theme.css', language: 'css', content: 'body { color: rebeccapurple; }' },
        'main.js': { name: 'main.js', path: 'main.js', language: 'javascript', content: 'document.body.dataset.ready = "sí";' },
      },
    };

    const document = buildPreviewDocument(workspace);

    expect(document).not.toContain('href="styles.css"');
    expect(document).not.toContain('src="app.js"');
    expect(document).toContain('href="https://cdn.example.com/theme.css"');
    expect(document).toContain('src="https://cdn.example.com/library.js"');
    expect(document).toContain('body { color: rebeccapurple; }');
    expect(document).toContain('document.body.dataset.ready = "sí";');
  });

  it('ejecuta módulos locales en orden de dependencia dentro del playground', () => {
    const workspace: WorkspaceSnapshot = {
      activeFilePath: 'src/main.js',
      files: {
        'index.html': {
          name: 'index.html',
          path: 'index.html',
          language: 'html',
          content: '<!doctype html><html><head></head><body><output id="result"></output><script type="module" src="src/main.js"></script></body></html>',
        },
        'src/main.js': {
          name: 'main.js',
          path: 'src/main.js',
          language: 'javascript',
          content: `import { sum } from './math.js';\ndocument.querySelector('#result').textContent = sum(2, 3);`,
        },
        'src/math.js': {
          name: 'math.js',
          path: 'src/math.js',
          language: 'javascript',
          content: 'export function sum(a, b) { return a + b; }',
        },
      },
    };

    const document = buildPreviewDocument(workspace);

    expect(document).not.toContain("from './math.js'");
    expect(document.indexOf('function sum')).toBeLessThan(document.indexOf("querySelector('#result')"));
    expect(document).toContain('document.querySelector');
  });

  it('no duplica las dependencias que ya declara la plantilla React', () => {
    const document = buildPreviewDocument(templateWorkspace('react'));

    expect(document.match(/react@18\/umd\/react\.development\.js/g)).toHaveLength(1);
    expect(document.match(/react-dom@18\/umd\/react-dom\.development\.js/g)).toHaveLength(1);
    expect(document.match(/@babel\/standalone\/babel\.min\.js/g)).toHaveLength(1);
  });
});
