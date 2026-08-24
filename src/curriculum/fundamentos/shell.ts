import { file, workspaceOf } from '../../engine/lessonCompiler';
import { WorkspaceSnapshot } from '../../types/scrim';

export function vanillaWorkspace(opts: {
  title: string;
  eyebrow: string;
  body: string;
  js: string;
  extraCss?: string;
  width?: string;
}): WorkspaceSnapshot {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${opts.title}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main>
    <header>
      <p class="eyebrow">${opts.eyebrow}</p>
      <h1>${opts.title}</h1>
    </header>
    ${opts.body}
  </main>
  <script src="app.js"></script>
</body>
</html>
`;

  const css = `* { box-sizing: border-box; }
html, body {
  margin: 0;
  background: #12151e;
  color: #f8fafc;
}
body {
  min-height: 100vh;
  padding: 28px 24px 40px;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
main { width: min(${opts.width ?? '440px'}, 100%); }
header {
  padding-bottom: 16px;
  margin-bottom: 20px;
  border-bottom: 1px solid #343a49;
}
.eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #aab3c4;
}
h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 1.15;
}
p, .label {
  margin: 0 0 14px;
  color: #cbd5e1;
  font-size: 15px;
  line-height: 1.5;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0 28px;
  margin: 4px 0 18px;
}
.box {
  padding: 10px 0;
  border-bottom: 1px solid #2c3240;
}
.box span, .label {
  display: block;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #aab3c4;
  margin: 0 0 4px;
}
.box strong, .mono, .value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 16px;
  font-weight: 600;
  color: #f8fafc;
}
.panel {
  margin: 18px 0 0;
  padding: 14px 0 0;
  border-top: 1px solid #343a49;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 14px;
  color: #f8fafc;
  min-height: 1.4em;
}
.row { display: flex; flex-wrap: wrap; gap: 12px 16px; margin: 12px 0; align-items: baseline; }
.chip {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 600;
  padding: 4px 0;
  border-bottom: 1px solid transparent;
}
.chip.on { border-bottom-color: #ffe600; }
.chip.dim { color: #717b8f; }
button, .btn {
  display: inline-block;
  margin: 4px 8px 4px 0;
  padding: 8px 14px;
  border: 1px solid #ffe600;
  background: #ffe600;
  color: #12151e;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
button:hover, .btn:hover { background: #fff04d; }
button.ghost {
  border-color: #596174;
  background: transparent;
  font-weight: 500;
  color: #cbd5e1;
}
.cells { display: flex; flex-wrap: wrap; gap: 4px 0; margin: 8px 0 16px; }
.cell {
  min-width: 2.25rem;
  padding: 8px 10px 8px 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 2px solid #343a49;
}
.cell.mark { border-bottom-color: #ffe600; }
.cell.gone { color: #717b8f; border-bottom-color: transparent; }
.stack { display: grid; gap: 6px; margin: 4px 0 16px; }
.plate {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 600;
  padding: 4px 0;
  border-bottom: 1px solid #2c3240;
}
table { width: 100%; border-collapse: collapse; font-size: 14px; margin: 4px 0 16px; }
th, td {
  text-align: left;
  padding: 8px 10px 8px 0;
  border-bottom: 1px solid #2c3240;
}
th { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: #aab3c4; }
tr.hot td { font-weight: 700; }
${opts.extraCss ?? ''}
`;

  return workspaceOf('app.js', {
    'index.html': file('index.html', html),
    'style.css': file('style.css', css),
    'app.js': file('app.js', opts.js),
  });
}
