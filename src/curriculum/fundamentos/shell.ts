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
  background: #fff;
  color: #171717;
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
  border-bottom: 1px solid #e5e5e5;
}
.eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #737373;
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
  color: #404040;
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
  border-bottom: 1px solid #ececec;
}
.box span, .label {
  display: block;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #737373;
  margin: 0 0 4px;
}
.box strong, .mono, .value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 16px;
  font-weight: 600;
  color: #171717;
}
.panel {
  margin: 18px 0 0;
  padding: 14px 0 0;
  border-top: 1px solid #e5e5e5;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 14px;
  color: #171717;
  min-height: 1.4em;
}
.row { display: flex; flex-wrap: wrap; gap: 12px 16px; margin: 12px 0; align-items: baseline; }
.chip {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 600;
  padding: 4px 0;
  border-bottom: 1px solid transparent;
}
.chip.on { border-bottom-color: #171717; }
.chip.dim { color: #a3a3a3; }
button, .btn {
  display: inline-block;
  margin: 4px 8px 4px 0;
  padding: 8px 14px;
  border: 1px solid #171717;
  background: #fff;
  color: #171717;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
button:hover, .btn:hover { background: #f5f5f5; }
button.ghost {
  border-color: #d4d4d4;
  font-weight: 500;
  color: #404040;
}
.cells { display: flex; flex-wrap: wrap; gap: 4px 0; margin: 8px 0 16px; }
.cell {
  min-width: 2.25rem;
  padding: 8px 10px 8px 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 2px solid #e5e5e5;
}
.cell.mark { border-bottom-color: #171717; }
.cell.gone { color: #a3a3a3; border-bottom-color: transparent; }
.stack { display: grid; gap: 6px; margin: 4px 0 16px; }
.plate {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 600;
  padding: 4px 0;
  border-bottom: 1px solid #ececec;
}
table { width: 100%; border-collapse: collapse; font-size: 14px; margin: 4px 0 16px; }
th, td {
  text-align: left;
  padding: 8px 10px 8px 0;
  border-bottom: 1px solid #ececec;
}
th { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: #737373; }
tr.hot td { font-weight: 700; }
${opts.extraCss ?? ''}
`;

  return workspaceOf('app.js', {
    'index.html': file('index.html', html),
    'style.css': file('style.css', css),
    'app.js': file('app.js', opts.js),
  });
}
