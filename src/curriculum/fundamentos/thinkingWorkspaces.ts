import { file, workspaceOf } from '../../engine/lessonCompiler';

export function thinkingWorkspace(title: string, starter: string) {
  return workspaceOf('app.js', {
    'index.html': file('index.html', `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="style.css">
    <title>${title}</title>
  </head>
  <body>
    <main>
      <p class="eyebrow">Fundamentos · Nivel 2</p>
      <h1>${title}</h1>
      <p>Predice el resultado, ejecuta y abre la consola para comparar.</p>
      <pre id="modelo">Entrada → regla → salida</pre>
    </main>
    <script src="app.js"></script>
  </body>
</html>`),
    'style.css': file('style.css', `html,
body {
  min-height: 100%;
  margin: 0;
  background: #12151e;
  color: #f8fafc;
  font-family: system-ui, sans-serif;
}

body {
  padding: 30px;
}

main {
  max-width: 620px;
}

h1 {
  padding-bottom: 16px;
  border-bottom: 1px solid #343a49;
  font-size: 28px;
}

.eyebrow {
  color: #7dd3fc;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

p {
  color: #cbd5e1;
  line-height: 1.6;
}

pre {
  margin-top: 22px;
  padding: 18px;
  border: 1px solid #475569;
  background: #090b10;
  color: #fde047;
  white-space: pre-wrap;
}`),
    'app.js': file('app.js', starter),
  });
}
