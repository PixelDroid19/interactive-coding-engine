import { describe, expect, it } from 'vitest';
import { typeScriptLibraries } from 'virtual:typescript-libraries';
import { TypeScriptLanguageService } from './typeScriptLanguageService';
import { buildWorkspaceSemanticFiles } from './workspaceSemanticFiles';
import { COMPONENT_COURSE_SCRIMS } from '../curriculum/web-components-lit/course';
import { reconstructWorkspaceAt } from '../engine/eventLog';

function analyze(content: string) {
  const service = new TypeScriptLanguageService(typeScriptLibraries);
  service.replaceWorkspace(buildWorkspaceSemanticFiles([
    { path: 'app.js', language: 'javascript', content },
  ]));
  return service.diagnostics('app.js');
}

describe('tipos publicados de Lit en el editor del estudiante', () => {
  it.each([
    "render() { const template = view`<article><h2>Teclado</h2><p>$80</p></article>`; return template; }",
    "render() { return view`<button .disabled=${true}>Comprar</button>`; }",
    "render() { if (this.items.length === 0) return null; return this.items.map(item => view`<p>${item}</p>`); }",
  ])('acepta una solución válida y la herencia DOM: %s', (render) => {
    expect(analyze(`import { LitElement, html as view } from 'lit';
      class ProductCard extends LitElement {
        constructor() { super(); this.items = ['Teclado']; }
        ${render}
      }
      customElements.define('product-card', ProductCard);
      new ProductCard().requestUpdate();
    `)).toEqual([]);
  });

  it('conserva el diagnóstico de un miembro inexistente del componente', () => {
    const diagnostics = analyze(`import { LitElement } from 'lit';
      class ProductCard extends LitElement {}
      new ProductCard().metodoInexistente();`);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain('metodoInexistente');
  });

  it('conserva el diagnóstico de una exportación inexistente', () => {
    const diagnostics = analyze("import { exportacionInexistente } from 'lit'; exportacionInexistente();");
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain('exportacionInexistente');
  });

  it('resuelve directivas y controladores publicados junto con Lit', () => {
    expect(analyze(`import { LitElement, html } from 'lit';
      import { repeat } from 'lit/directives/repeat.js';
      import { Task } from '@lit/task';
      import { createContext, ContextProvider } from '@lit/context';
      class Catalog extends LitElement {
        constructor() {
          super();
          this.task = new Task(this, { task: async () => ['Teclado'], args: () => [] });
          this.provider = new ContextProvider(this, { context: createContext('catalog'), initialValue: 'listo' });
        }
        render() { return repeat(['Teclado'], item => item, item => html\`<p>\${item}</p>\`); }
      }
      customElements.define('product-catalog', Catalog);`)).toEqual([]);
  });

  it('acepta un class mixin de Lit con estado y callbacks heredados', () => {
    expect(analyze(`import { LitElement, html } from 'lit';
      /** @param {typeof LitElement} Base */
      const WithViewport = (Base) => class extends Base {
        static properties = { viewportWidth: { state: true } };
        constructor() {
          super();
          this.viewportWidth = 0;
          this.measureViewport = () => { this.viewportWidth = window.innerWidth; };
        }
        connectedCallback() {
          super.connectedCallback();
          window.addEventListener('resize', this.measureViewport);
          this.measureViewport();
        }
        disconnectedCallback() {
          window.removeEventListener('resize', this.measureViewport);
          super.disconnectedCallback();
        }
      };
      class ViewportPanel extends WithViewport(LitElement) {
        render() { return html\`<p>\${this.viewportWidth} px</p>\`; }
      }
      customElements.define('viewport-panel', ViewportPanel);`)).toEqual([]);
  });

  it('mantiene limpio el starter de grafos que recibe la alumna en el reto 42', () => {
    const lesson = COMPONENT_COURSE_SCRIMS['componentes-lit-42'];
    const challenge = lesson.challenges[0];
    const workspace = reconstructWorkspaceAt(
      lesson.initialWorkspace,
      lesson.events,
      lesson.snapshots,
      challenge.timestamp,
    ).workspace;

    expect(analyze(workspace.files['app.js'].content)).toEqual([]);
  });

  it('mantiene limpio el starter de arrastre que recibe la alumna en el reto 44', () => {
    const lesson = COMPONENT_COURSE_SCRIMS['componentes-lit-44'];
    const challenge = lesson.challenges[0];
    const workspace = reconstructWorkspaceAt(
      lesson.initialWorkspace,
      lesson.events,
      lesson.snapshots,
      challenge.timestamp,
    ).workspace;
    const diagnostics = analyze(workspace.files['app.js'].content);

    expect(diagnostics, diagnostics.map(({ code, message }) => `TS${code}: ${message}`).join('\n')).toEqual([]);
  });

  it('acepta un destino de pointer tipado para una solución de arrastre', () => {
    const diagnostics = analyze(`/** @param {PointerEvent} event */
      function beginPointerDrag(event) {
        const target = /** @type {HTMLElement} */ (event.currentTarget);
        target.setPointerCapture(event.pointerId);
        target.releasePointerCapture(event.pointerId);
      }`);

    expect(diagnostics, diagnostics.map(({ code, message }) => `TS${code}: ${message}`).join('\n')).toEqual([]);
  });

  it('no convierte las declaraciones de dependencias en globals de otros cursos', () => {
    const diagnostics = analyze('const element = new LitElement();');
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({ code: 2552 });
    expect(diagnostics[0].message).toContain('LitElement');
  });

  it('no acepta módulos o subrutas inexistentes', () => {
    expect(analyze("import { html } from 'lit/no-existe.js'; html``;"))
      .toEqual([expect.objectContaining({ code: 2307 })]);
  });
});
