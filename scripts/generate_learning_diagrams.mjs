import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outputDir = new URL('../public/diagrams/', import.meta.url).pathname;
mkdirSync(outputDir, { recursive: true });

const diagrams = {
  variable: {
    title: 'Una variable conecta un nombre con un valor',
    desc: 'El nombre edad apunta al valor numérico 25. Una nota aclara que JavaScript administra la memoria y oculta las direcciones físicas.',
    nodes: [
      { x: 110, y: 180, w: 220, h: 100, label: 'edad', sub: 'nombre del programa' },
      { x: 630, y: 170, w: 140, h: 120, label: '25', sub: 'number', focal: true, round: true },
    ],
    edges: [{ from: 0, to: 1, label: 'asocia' }],
    note: 'Reasignar cambia el valor asociado. El motor se ocupa de la memoria interna.',
  },
  conditional: {
    title: 'Una condición abre caminos exclusivos',
    desc: 'El dato edad igual a 18 llega a una decisión. El camino sí termina en Puede entrar y el camino no termina en Todavía no.',
    nodes: [
      { x: 40, y: 190, w: 170, h: 82, label: 'edad = 18', sub: 'entrada' },
      { x: 300, y: 175, w: 210, h: 112, label: '¿edad ≥ 18?', sub: 'pregunta booleana', focal: true, decision: true },
      { x: 675, y: 85, w: 200, h: 82, label: 'Puede entrar', sub: 'salida si: sí' },
      { x: 675, y: 310, w: 200, h: 82, label: 'Todavía no', sub: 'salida si: no' },
    ],
    edges: [{ from: 0, to: 1 }, { from: 1, to: 2, label: 'sí' }, { from: 1, to: 3, label: 'no' }],
  },
  function: {
    title: 'Llamar una función activa su contrato',
    desc: 'La llamada doble de cuatro entrega el argumento al parámetro numero, multiplica por dos y devuelve ocho.',
    nodes: [
      { x: 30, y: 190, w: 180, h: 86, label: 'doble(4)', sub: 'llamada' },
      { x: 270, y: 190, w: 180, h: 86, label: 'numero = 4', sub: 'parámetro local', focal: true },
      { x: 510, y: 190, w: 170, h: 86, label: '4 × 2', sub: 'transformación' },
      { x: 750, y: 190, w: 150, h: 86, label: '8', sub: 'return' },
    ],
    edges: [{ from: 0, to: 1, label: 'argumento' }, { from: 1, to: 2 }, { from: 2, to: 3, label: 'devuelve' }],
  },
  eventloop: {
    title: 'El temporizador espera; no interrumpe',
    desc: 'La tarea actual registra A, programa B y registra C. El temporizador del entorno coloca B en un siguiente turno.',
    lanes: ['Tarea actual', 'Entorno', 'Siguiente turno'],
    nodes: [
      { x: 205, y: 118, w: 170, h: 68, label: 'Mostrar A', sub: 'síncrono' },
      { x: 420, y: 118, w: 190, h: 68, label: 'Programar B', sub: 'setTimeout' },
      { x: 655, y: 118, w: 170, h: 68, label: 'Mostrar C', sub: 'síncrono' },
      { x: 420, y: 246, w: 190, h: 68, label: 'Temporizador', sub: 'espera mínima', focal: true },
      { x: 655, y: 374, w: 170, h: 68, label: 'Mostrar B', sub: 'pila libre' },
    ],
    edges: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 3, to: 4, label: 'nuevo turno' }],
  },
  domevents: {
    title: 'Un evento conecta interacción, regla y vista',
    desc: 'Un clic llega al manejador, que lee el estado actual, aplica una regla y actualiza el DOM.',
    nodes: [
      { x: 25, y: 190, w: 165, h: 86, label: 'Clic', sub: 'evento' },
      { x: 245, y: 190, w: 185, h: 86, label: 'Manejador', sub: 'lee ahora', focal: true },
      { x: 485, y: 190, w: 185, h: 86, label: 'Cambia estado', sub: 'regla' },
      { x: 725, y: 190, w: 185, h: 86, label: 'Actualiza DOM', sub: 'salida visible' },
    ],
    edges: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }],
  },
  shadow: {
    title: 'Shadow DOM crea una frontera de implementación',
    desc: 'La página consumidora usa la etiqueta y su API pública. La plantilla y los estilos internos permanecen dentro del shadow root.',
    zones: [
      { x: 35, y: 105, w: 390, h: 330, label: 'Página consumidora' },
      { x: 535, y: 105, w: 390, h: 330, label: 'Shadow root', focal: true },
    ],
    nodes: [
      { x: 90, y: 195, w: 280, h: 82, label: '<status-note>', sub: 'atributos y propiedades' },
      { x: 590, y: 175, w: 280, h: 82, label: 'Plantilla interna', sub: 'estructura encapsulada', focal: true },
      { x: 590, y: 305, w: 280, h: 82, label: 'Estilos internos', sub: 'responsabilidad propia' },
    ],
    edges: [{ from: 0, to: 1, label: 'API pública' }],
    note: 'Los eventos con composed pueden cruzar hacia la página; los selectores globales no atraviesan la frontera.',
  },
  litcycle: {
    title: 'Una propiedad reactiva programa una actualización',
    desc: 'El cambio de count programa una actualización. Lit ejecuta render, actualiza el DOM y después ejecuta updated.',
    nodes: [
      { x: 20, y: 190, w: 170, h: 86, label: 'count = 2', sub: 'cambio reactivo' },
      { x: 230, y: 190, w: 190, h: 86, label: 'Actualización', sub: 'Lit agrupa', focal: true },
      { x: 460, y: 190, w: 150, h: 86, label: 'render()', sub: 'template' },
      { x: 650, y: 190, w: 155, h: 86, label: 'DOM listo', sub: 'updateComplete' },
      { x: 845, y: 190, w: 100, h: 86, label: 'updated()', sub: 'después' },
    ],
    edges: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 }],
  },
};

const palettes = {
  normal: { paper: '#f5f2eb', surface: '#fffdf7', ink: '#17191f', muted: '#596171', rule: '#b9b5aa', accent: '#ffe600', link: '#147b82', shadow: '#111111' },
  cyber: { paper: '#07090e', surface: '#10141c', ink: '#f1f6ff', muted: '#aab5c8', rule: '#354157', accent: '#00e7f1', link: '#dfff00', shadow: '#d629ff' },
};

const escapeXml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const center = (node) => ({ x: node.x + node.w / 2, y: node.y + node.h / 2 });

function renderDiagram(key, spec, theme) {
  const p = palettes[theme];
  const cyber = theme === 'cyber';
  const zones = (spec.zones ?? []).map((zone) => `<g><rect x="${zone.x}" y="${zone.y}" width="${zone.w}" height="${zone.h}" rx="${cyber ? 2 : 12}" fill="${zone.focal ? p.surface : 'none'}" stroke="${zone.focal ? p.link : p.rule}" stroke-width="${zone.focal ? 2 : 1}"/><text x="${zone.x + 20}" y="${zone.y + 30}" class="zone">${escapeXml(zone.label)}</text></g>`).join('');
  const lanes = (spec.lanes ?? []).map((lane, index) => `<g><text x="26" y="${155 + index * 128}" class="lane">${escapeXml(lane)}</text><line x1="175" y1="${160 + index * 128}" x2="925" y2="${160 + index * 128}" stroke="${p.rule}" stroke-width="1" stroke-dasharray="5 6"/></g>`).join('');
  const edges = (spec.edges ?? []).map((edge) => {
    const from = spec.nodes[edge.from]; const to = spec.nodes[edge.to];
    const a = center(from); const b = center(to);
    const horizontal = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
    const x1 = horizontal ? (b.x >= a.x ? from.x + from.w : from.x) : a.x;
    const y1 = horizontal ? a.y : (b.y >= a.y ? from.y + from.h : from.y);
    const x2 = horizontal ? (b.x >= a.x ? to.x : to.x + to.w) : b.x;
    const y2 = horizontal ? b.y : (b.y >= a.y ? to.y : to.y + to.h);
    const label = edge.label ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 8}" class="edge-label">${escapeXml(edge.label)}</text>` : '';
    return `<g><path d="M${x1} ${y1} C${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}" fill="none" stroke="${p.link}" stroke-width="2" marker-end="url(#${key}-${theme}-arrow)"/>${label}</g>`;
  }).join('');
  const nodes = (spec.nodes ?? []).map((node) => {
    const fill = node.focal ? `color-mix(in srgb, ${p.accent} 14%, ${p.surface})` : p.surface;
    const stroke = node.focal ? p.link : p.ink;
    const rx = node.round ? node.h / 2 : cyber ? 2 : 8;
    const shape = node.decision
      ? `<path d="M${node.x + 18} ${node.y} H${node.x + node.w - 18} L${node.x + node.w} ${node.y + node.h / 2} L${node.x + node.w - 18} ${node.y + node.h} H${node.x + 18} L${node.x} ${node.y + node.h / 2} Z" fill="${fill}" stroke="${stroke}" stroke-width="${node.focal ? 2 : 1.2}"/>`
      : `<rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${node.focal ? 2 : 1.2}" filter="url(#${key}-${theme}-shadow)"/>`;
    return `<g>${shape}<text x="${node.x + node.w / 2}" y="${node.y + node.h / 2 - 5}" class="node-label">${escapeXml(node.label)}</text><text x="${node.x + node.w / 2}" y="${node.y + node.h / 2 + 18}" class="node-sub">${escapeXml(node.sub)}</text></g>`;
  }).join('');
  const note = spec.note ? `<g><rect x="150" y="462" width="660" height="48" rx="${cyber ? 2 : 7}" fill="${p.accent}" opacity=".14"/><rect x="150" y="462" width="5" height="48" fill="${p.accent}"/><text x="172" y="491" class="note">${escapeXml(spec.note)}</text></g>` : '';
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeXml(spec.title)}</title><style>html,body{margin:0;min-height:100%;background:${p.paper};color:${p.ink}}body{display:grid;place-items:center;overflow:hidden}svg{width:100%;height:auto;display:block}.title{fill:${p.ink};font:700 29px/1.1 Inter,system-ui,sans-serif;letter-spacing:-.02em}.eyebrow,.lane,.zone,.edge-label{fill:${p.link};font:700 10px/1 ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase}.desc{fill:${p.muted};font:500 13px/1.4 Inter,system-ui,sans-serif}.node-label{fill:${p.ink};font:700 15px/1 Inter,system-ui,sans-serif;text-anchor:middle}.node-sub{fill:${p.muted};font:500 10px/1 ui-monospace,monospace;text-anchor:middle}.note{fill:${p.ink};font:600 12px/1 Inter,system-ui,sans-serif}</style></head><body><svg viewBox="0 0 960 540" role="img" aria-labelledby="${key}-${theme}-title ${key}-${theme}-desc"><title id="${key}-${theme}-title">${escapeXml(spec.title)}</title><desc id="${key}-${theme}-desc">${escapeXml(spec.desc)}</desc><defs><marker id="${key}-${theme}-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${p.link}"/></marker><filter id="${key}-${theme}-shadow" x="-20%" y="-20%" width="150%" height="160%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-color="${p.shadow}" flood-opacity=".7"/></filter></defs><text x="32" y="38" class="eyebrow">MODELO MENTAL · ${theme === 'cyber' ? 'CYBER' : 'CODESILK'}</text><text x="32" y="78" class="title">${escapeXml(spec.title)}</text><text x="32" y="103" class="desc">Sigue las flechas y nombra qué cambia en cada paso.</text>${lanes}${zones}${edges}${nodes}${note}</svg></body></html>`;
}

for (const [key, spec] of Object.entries(diagrams)) {
  for (const theme of Object.keys(palettes)) {
    const suffix = theme === 'cyber' ? '-cyber' : '';
    writeFileSync(join(outputDir, `${key}${suffix}.html`), renderDiagram(key, spec, theme), 'utf8');
  }
}

console.log(`Generated ${Object.keys(diagrams).length * 2} accessible diagrams in ${outputDir}`);
