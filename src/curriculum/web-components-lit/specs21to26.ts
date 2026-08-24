import { appHtml, browserTest, lesson, source, sourceTest } from './helpers';

const litText = (id: string, description: string, tag: string, selector: string, expected: string) => browserTest(id, description, `async ({document,customElements})=>{await customElements.whenDefined('${tag}');const el=document.querySelector('${tag}');if(!el)return false;await Promise.race([Promise.resolve(el.updateComplete).catch(()=>false),new Promise(resolve=>setTimeout(resolve,150))]);const node=el.shadowRoot?.querySelector('${selector}');return {passed:Boolean(node?.textContent?.includes('${expected}')),receivedValue:node?.textContent||''};}`);

export const COMPONENT_SPECS_21_TO_26 = [
  lesson({
    number: 21, module: 7, title: 'Eventos y formularios en Lit', appName: 'un editor de perfil con envío y validación',
    summary: 'Conecta eventos declarativamente, lee valores en el momento correcto y emite resultados de dominio.',
    concepts: [{ label: '@event', desc: 'Binding declarativo que registra un manejador.' }, { label: 'Submit', desc: 'Evento del formulario que representa una intención completa.' }],
    skillsRequired: ['lit-immutable-data', 'lit-change-detection'], skillsIntroduced: ['lit-events', 'lit-forms'],
    reasoningSteps: ['La persona envía el form', 'El manejador evita navegación', 'Lee y valida FormData', 'Emite profile-save'],
    html: appHtml('Perfil', '<profile-editor></profile-editor>'),
    example: `import { LitElement, html } from 'lit';
class SearchForm extends LitElement {
  render() {
    return html\`<form @submit=\${this._submit}>
      <input name="query" /><button>Buscar</button>
    </form>\`;
  }
  _submit(event) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get('query');
    this.dispatchEvent(
      new CustomEvent('search', { detail: { query }, bubbles: true, composed: true }),
    );
  }
}
customElements.define('search-form', SearchForm);`,
    starter: `import { LitElement, html } from 'lit';
class ProfileEditor extends LitElement {
  render() {
    return html\`<form>
      <label>Nombre <input name="name" /></label><button>Guardar</button>
      <p></p>
    </form>\`;
  }
  _submit(event) {
    /* evita navegación, valida nombre y emite profile-save */
  }
}
customElements.define('profile-editor', ProfileEditor);`,
    challengeTitle: 'App: editor de perfil', challengeInstructions: 'Conecta submit, rechaza nombre vacío con mensaje y emite profile-save con detail.name limpio.',
    tests: [browserTest('lit21-submit', 'El formulario emite un nombre válido', `async ({document,customElements})=>{await customElements.whenDefined('profile-editor');const el=document.querySelector('profile-editor');await el.updateComplete;const form=el.shadowRoot.querySelector('form');form.querySelector('input').value='  Ana  ';let event=null;el.addEventListener('profile-save',e=>event=e,{once:true});form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));return event?.detail?.name==='Ana';}`), sourceTest('lit21-binding', 'Conecta submit declarativamente', String.raw`@submit\s*=\s*\$\{`) ],
    hints: ['El submit pertenece al form, no solo al clic del botón.', 'FormData lee controles con name.', 'El evento público contiene el dato validado, no el nodo input.'],
    model: 'El template conecta el cable; el manejador traduce un evento DOM en una decisión de dominio y la publica.',
    whenToUse: 'Usa eventos declarativos para nodos del template y submit para acciones completas de formulario.',
    bestPractices: 'Usa event.currentTarget, valida en la frontera y emite datos serializables y estables.',
    commonErrors: 'llamar el manejador durante render, leer target equivocado, olvidar preventDefault o emitir el evento nativo como API.',
    transfer: 'Diseña el flujo de login con validación local, estado loading y evento auth-submit.',
    sources: [source('Events', 'https://lit.dev/docs/components/events/', 'Aprende bindings y eventos públicos.', 'Lit'), source('FormData', 'https://developer.mozilla.org/es/docs/Web/API/FormData', 'Lee datos del formulario.')],
    debug: { title: 'El manejador se ejecuta al renderizar', expected: 'invite-form llama _submit solo al enviar.', observed: 'Usa @submit=${this._submit()}.',
      starter: `import { LitElement, html } from 'lit';
class InviteForm extends LitElement {
  render() {
    return html\`<form @submit=\${this._submit()}>
      <input name="email" /><button>Invitar</button>
    </form>\`;
  }
  _submit(event) {
    event.preventDefault();
    this.setAttribute('sent', '');
  }
}
customElements.define('invite-form', InviteForm);`,
      tests: [sourceTest('lit21-d1', 'Pasa la referencia del manejador', String.raw`@submit\s*=\s*\$\{this\._submit\}`), browserTest('lit21-d2', 'El formulario puede renderizar', `async ({document,customElements})=>{await customElements.whenDefined('invite-form');const el=document.querySelector('invite-form');await Promise.race([Promise.resolve(el.updateComplete).catch(()=>false),new Promise(resolve=>setTimeout(resolve,150))]);return Boolean(el.shadowRoot?.querySelector('form'));}`)],
      hints: ['Los paréntesis ejecutan ahora.', 'Lit necesita una función para llamar después.', 'Quita la llamada del binding.'] },
  }),
  lesson({
    number: 22, module: 7, title: 'El ciclo nativo dentro de Lit y super()', appName: 'un monitor que se conecta y limpia correctamente',
    summary: 'Sobrescribe callbacks nativos de LitElement sin cortar la maquinaria reactiva heredada.',
    concepts: [{ label: 'Ciclo heredado', desc: 'LitElement implementa callbacks nativos para iniciar y pausar su sistema.' }, { label: 'super.callback()', desc: 'Delega a la implementación base además de ejecutar trabajo propio.' }],
    skillsRequired: ['lit-events', 'lit-forms'], skillsIntroduced: ['lit-native-lifecycle', 'lit-super-callbacks'],
    reasoningSteps: ['El elemento entra al DOM', 'super.connectedCallback activa Lit', 'El componente conecta su recurso', 'Al salir limpia y delega a super'],
    html: appHtml('Monitor', '<connection-monitor></connection-monitor>'),
    example: `import { LitElement, html } from 'lit';
class OnlineStatus extends LitElement {
  static properties = { online: { state: true } };
  constructor() {
    super();
    this.online = navigator.onLine;
    this._sync = () => (this.online = navigator.onLine);
  }
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('online', this._sync);
    window.addEventListener('offline', this._sync);
  }
  disconnectedCallback() {
    window.removeEventListener('online', this._sync);
    window.removeEventListener('offline', this._sync);
    super.disconnectedCallback();
  }
  render() {
    return html\`<p>\${this.online ? 'En línea' : 'Sin conexión'}</p>\`;
  }
}
customElements.define('online-status', OnlineStatus);`,
    starter: `import { LitElement, html } from 'lit';
class ConnectionMonitor extends LitElement {
  static properties = { ticks: { state: true } };
  constructor() {
    super();
    this.ticks = 0;
  }
  connectedCallback() {
    /* deja que Lit se conecte y comienza un intervalo */
  }
  disconnectedCallback() {
    /* limpia el intervalo y deja que Lit se desconecte */
  }
  render() {
    return html\`<p>Monitor: \${this.ticks}</p>\`;
  }
}
customElements.define('connection-monitor', ConnectionMonitor);`,
    challengeTitle: 'App: monitor con herencia intacta', challengeInstructions: 'Llama los callbacks super correspondientes, inicia el intervalo al conectar y límpialo al desconectar.',
    tests: [browserTest('lit22-render', 'Lit conserva su actualización', `async ({document,customElements})=>{await customElements.whenDefined('connection-monitor');const el=document.querySelector('connection-monitor');await Promise.race([el.updateComplete,new Promise(resolve=>setTimeout(resolve,150))]);return Boolean(el.shadowRoot?.querySelector('p'));}`), sourceTest('lit22-super', 'Delega ambos callbacks', String.raw`super\.connectedCallback\s*\([\s\S]*super\.disconnectedCallback\s*\(`)],
    hints: ['LitElement ya tiene trabajo en esos métodos.', 'Llama super.connectedCallback antes de depender del render.', 'Limpia tu recurso y llama también super.disconnectedCallback.'],
    model: 'Tu clase añade una estación a una línea existente. super permite que el tren de Lit siga recorriendo sus estaciones antes o después de tu trabajo.',
    whenToUse: 'Sobrescribe callbacks nativos solo para recursos ligados a conexión; no los uses para observar cualquier propiedad.',
    bestPractices: 'Llama super, conserva simetría de recursos y evita repetir listeners internos declarativos que Lit ya gestiona.',
    commonErrors: 'omitir super.connectedCallback y perder el primer update, limpiar con otra referencia o usar ciclo nativo para cálculos reactivos.',
    transfer: 'Explica por qué super() del constructor y super.connectedCallback() resuelven problemas distintos.',
    sources: [source('Lifecycle', 'https://lit.dev/docs/components/lifecycle/', 'Revisa comportamiento Lit de callbacks estándar.', 'Lit')],
    debug: { title: 'El componente se conecta pero nunca renderiza', expected: 'broken-clock muestra su template.', observed: 'connectedCallback reemplaza el de Lit sin llamar super.',
      starter: `import { LitElement, html } from 'lit';
class BrokenClock extends LitElement {
  connectedCallback() {
    this.started = true;
  }
  render() {
    return html\`<p>Reloj iniciado</p>\`;
  }
}
customElements.define('broken-clock', BrokenClock);`,
      tests: [litText('lit22-d1', 'El primer render ocurre', 'broken-clock', 'p', 'Reloj iniciado'), sourceTest('lit22-d2', 'Conserva el callback base', String.raw`connectedCallback\s*\([^)]*\)\s*\{[\s\S]*super\.connectedCallback\s*\(`)],
      hints: ['Lit inicia su primera actualización al conectar.', 'Tu override reemplazó esa implementación.', 'Delega al método base.'] },
  }),
  lesson({
    number: 23, module: 7, title: 'Ciclo reactivo y changedProperties', appName: 'un comparador de filtros que calcula una sola vez',
    summary: 'Ubica cálculos antes del render y efectos posteriores según el ciclo de actualización de Lit.',
    concepts: [{ label: 'willUpdate', desc: 'Hook para derivar valores antes del render.' }, { label: 'changedProperties', desc: 'Mapa de propiedades que iniciaron la actualización.' }],
    skillsRequired: ['lit-native-lifecycle', 'lit-super-callbacks'], skillsIntroduced: ['lit-update-cycle', 'changed-properties'],
    reasoningSteps: ['Cambia una propiedad reactiva', 'Lit agrupa cambios', 'willUpdate deriva datos', 'render usa el resultado coherente'],
    html: appHtml('Filtros', '<filter-summary></filter-summary>'),
    example: `import { LitElement, html } from 'lit';
class PriceSummary extends LitElement {
  static properties = { items: { type: Array }, total: { state: true } };
  constructor() {
    super();
    this.items = [];
    this.total = 0;
  }
  willUpdate(changed) {
    if (changed.has('items')) this.total = this.items.reduce((s, i) => s + i.price, 0);
  }
  render() {
    return html\`<p>Total: \${this.total}</p>\`;
  }
}
customElements.define('price-summary', PriceSummary);`,
    starter: `import { LitElement, html } from 'lit';
class FilterSummary extends LitElement {
  static properties = {
    items: { type: Array },
    query: { type: String },
    visible: { state: true },
  };
  constructor() {
    super();
    this.items = ['Pan', 'Café', 'Arroz'];
    this.query = '';
    this.visible = [];
  }
  willUpdate(changed) {
    /* recalcula visible solo si cambia items o query */
  }
  render() {
    return html\`<p>Coincidencias: \${this.visible.length}</p>\`;
  }
}
customElements.define('filter-summary', FilterSummary);`,
    challengeTitle: 'App: cálculo en el ciclo correcto', challengeInstructions: 'Usa changedProperties en willUpdate para recalcular visible cuando cambien items o query.',
    tests: [browserTest('lit23-filter', 'Cambiar query actualiza el resumen', `async ({document,customElements})=>{await customElements.whenDefined('filter-summary');const el=document.querySelector('filter-summary');el.query='a';await el.updateComplete;return el.shadowRoot.textContent.includes('Coincidencias: 2');}`), sourceTest('lit23-changed', 'Consulta las propiedades cambiadas', String.raw`willUpdate\s*\(\s*changed[\s\S]*changed\.has\s*\(`)],
    hints: ['willUpdate recibe un Map.', 'Recalcula si cambió cualquiera de las dos entradas.', 'render solo consume visible.'],
    model: 'El ciclo es una cadena: setter programa, willUpdate prepara, render describe, update escribe y updated observa el DOM ya cambiado.',
    whenToUse: 'Usa willUpdate para derivados costosos compartidos por render; usa getters para derivados baratos y puros.',
    bestPractices: 'Mira changedProperties, evita efectos externos antes del render y no cambies sin condición la propiedad que disparó el ciclo.',
    commonErrors: 'crear bucles en updated, medir DOM antes de actualizar o almacenar cada valor derivable.',
    transfer: 'Ubica validación, ordenamiento, analytics y medición DOM en el hook correcto.',
    sources: [source('Reactive update cycle', 'https://lit.dev/docs/components/lifecycle/#reactive-update-cycle', 'Sigue cada fase.', 'Lit')],
    debug: { title: 'updated crea un bucle de actualizaciones', expected: 'tax-total calcula total sin programarse infinitamente.', observed: 'updated incrementa la misma propiedad en cada ciclo.',
      starter: `import { LitElement, html } from 'lit';
class TaxTotal extends LitElement {
  static properties = { subtotal: { type: Number }, total: { state: true } };
  constructor() {
    super();
    this.subtotal = 100;
    this.total = 0;
  }
  updated() {
    this.total = this.total + this.subtotal * 0.1;
  }
  render() {
    return html\`<p>\${this.total}</p>\`;
  }
}
customElements.define('tax-total', TaxTotal);`,
      tests: [sourceTest('lit23-d1', 'Deriva antes del render', String.raw`willUpdate\s*\(`), sourceTest('lit23-d2', 'No acumula sobre total anterior', String.raw`this\.total\s*=\s*this\.subtotal\s*\+`) ],
      hints: ['updated ocurre después y cambiar total programa otro ciclo.', 'El total depende solo de subtotal.', 'Calcula de forma idempotente antes de render.'] },
  }),
  lesson({
    number: 24, module: 7, title: 'firstUpdated, updated y updateComplete', appName: 'un buscador que enfoca y anuncia resultados',
    summary: 'Accede al DOM renderizado solo cuando existe y espera updateComplete cuando una tarea depende del update.',
    concepts: [{ label: 'firstUpdated', desc: 'Hook posterior al primer render.' }, { label: 'updateComplete', desc: 'Promesa que resuelve cuando el update actual termina.' }],
    skillsRequired: ['lit-update-cycle', 'changed-properties'], skillsIntroduced: ['lit-post-render', 'update-complete'],
    reasoningSteps: ['Primer render crea input', 'firstUpdated enfoca una vez', 'Una búsqueda cambia results', 'updateComplete permite leer el DOM nuevo'],
    html: appHtml('Buscador', '<focus-search></focus-search>'),
    example: `import { LitElement, html } from 'lit';
class AutoFocusField extends LitElement {
  render() {
    return html\`<input aria-label="Buscar" />\`;
  }
  firstUpdated() {
    this.renderRoot.querySelector('input').focus();
  }
}
customElements.define('auto-focus-field', AutoFocusField);`,
    starter: `import { LitElement, html } from 'lit';
class FocusSearch extends LitElement {
  static properties = { results: { state: true } };
  constructor() {
    super();
    this.results = [];
  }
  render() {
    return html\`<input aria-label="Buscar" /><button @click=\${() => this.search()}>
        Buscar
      </button>
      <p role="status">\${this.results.length} resultados</p>\`;
  }
  firstUpdated() {
    /* enfoca el input */
  }
  async search() {
    this.results = [
      'Uno',
      'Dos',
    ]; /* espera updateComplete y marca status como anunciado */
  }
}
customElements.define('focus-search', FocusSearch);`,
    challengeTitle: 'App: DOM en el momento correcto', challengeInstructions: 'Enfoca tras el primer render y espera updateComplete después de cambiar results.',
    tests: [sourceTest('lit24-first', 'Usa firstUpdated para el foco', String.raw`firstUpdated\s*\([^)]*\)[\s\S]*focus\s*\(`), browserTest('lit24-complete', 'La búsqueda espera y actualiza el status', `async ({document,customElements})=>{await customElements.whenDefined('focus-search');const el=document.querySelector('focus-search');await el.search();return el.shadowRoot.querySelector('[role="status"]').textContent.includes('2 resultados');}`)],
    hints: ['El input no existe en constructor.', 'firstUpdated corre una sola vez tras crearlo.', 'Después de asignar results, await this.updateComplete.'],
    model: 'render hace una promesa de DOM; updateComplete confirma que esa promesa ya se materializó antes de medir, enfocar o integrar otra API.',
    whenToUse: 'Usa firstUpdated para inicialización DOM única, updated para efectos posteriores condicionados y updateComplete en flujos asíncronos.',
    bestPractices: 'Prefiere bindings y refs; toca DOM solo cuando una API imperativa realmente lo requiere.',
    commonErrors: 'consultar shadowRoot en constructor, enfocar en cada updated o asumir que una asignación reactiva actualiza DOM de forma síncrona.',
    transfer: 'Diseña la secuencia para medir una lista después de filtrar y para inicializar una gráfica externa.',
    sources: [source('firstUpdated y updated', 'https://lit.dev/docs/components/lifecycle/#firstupdated', 'Distingue hooks.', 'Lit'), source('updateComplete', 'https://lit.dev/docs/components/lifecycle/#updatecomplete', 'Espera updates.', 'Lit')],
    debug: { title: 'El input es null en constructor', expected: 'search-box enfoca tras render.', observed: 'Consulta renderRoot antes de que render produzca el input.',
      starter: `import { LitElement, html } from 'lit';
class SearchBox extends LitElement {
  constructor() {
    super();
    this.renderRoot.querySelector('input').focus();
  }
  render() {
    return html\`<input aria-label="Consulta" />\`;
  }
}
customElements.define('search-box', SearchBox);`,
      tests: [sourceTest('lit24-d1', 'Mueve el foco a firstUpdated', String.raw`firstUpdated\s*\(`), sourceTest('lit24-d2', 'Conserva focus', String.raw`querySelector\s*\(\s*['"]input['"]\s*\)\.focus\s*\(`)],
      hints: ['constructor ocurre antes del primer template.', 'El hook posterior al primer render existe para este caso.', 'Mueve la consulta completa.'] },
  }),
  lesson({
    number: 25, module: 8, title: 'Estilos, :host y temas públicos', appName: 'una tarjeta tematizable sin romper encapsulación',
    summary: 'Define CSS encapsulado y una API de tema pequeña mediante :host y custom properties.',
    concepts: [{ label: 'static styles', desc: 'Estilos compartidos y encapsulados de la clase.' }, { label: 'CSS custom property', desc: 'Valor configurable que cruza la frontera por cascada.' }],
    skillsRequired: ['lit-post-render', 'update-complete'], skillsIntroduced: ['lit-styles', 'css-theming'],
    reasoningSteps: ['El consumidor define --card-accent', ':host recibe el valor', 'static styles lo aplica internamente', 'La estructura privada permanece estable'],
    html: appHtml('Tema', '<theme-card style="--card-accent:#ffe600"></theme-card>'),
    example: `import { LitElement, html, css } from 'lit';
class StatusCard extends LitElement {
  static styles = css\`
    :host {
      display: block;
      border-left: 4px solid var(--status-color, #38bdf8);
      padding: 16px;
    }
    h2 {
      margin: 0;
    }
  \`;
  render() {
    return html\`<h2>Servicio</h2>
      <p>Operativo</p>\`;
  }
}
customElements.define('status-card', StatusCard);`,
    starter: `import { LitElement, html, css } from 'lit';
class ThemeCard extends LitElement {
  static styles = css\`
    /* estiliza :host y usa --card-accent con fallback */
  \`;
  render() {
    return html\`<article>
      <h2>Panel personal</h2>
      <p>Tema configurable</p>
    </article>\`;
  }
}
customElements.define('theme-card', ThemeCard);`,
    challengeTitle: 'App: tarjeta tematizable', challengeInstructions: 'Usa static styles, :host y --card-accent con un fallback legible.',
    tests: [browserTest('lit25-render', 'La tarjeta conserva su contenido real', `async ({document,customElements})=>{await customElements.whenDefined('theme-card');const el=document.querySelector('theme-card');await el.updateComplete;return el.shadowRoot.textContent.includes('Panel personal');}`), sourceTest('lit25-theme', 'Expone host y una variable con fallback', String.raw`static\s+styles\s*=\s*css\s*\`[\s\S]*:host[\s\S]*var\s*\(\s*--card-accent\s*,`) ],
    hints: ['Los estilos pertenecen a la clase, no a cada render.', ':host selecciona el elemento personalizado.', 'var necesita un valor seguro si el consumidor no define tema.'],
    model: 'El tema es una perilla pública, no una ventana a todos los selectores internos.',
    whenToUse: 'Expón custom properties para decisiones de valor —color, espacio, tamaño— que consumidores realmente necesiten ajustar.',
    bestPractices: 'Ofrece fallbacks, conserva contraste y evita convertir cada regla CSS en API.',
    commonErrors: 'estilos dentro de render, variables sin fallback, nombres genéricos que colisionan o temas que rompen accesibilidad.',
    transfer: 'Diseña tres tokens públicos para un botón y descarta cinco detalles que deben seguir internos.',
    sources: [source('Styles', 'https://lit.dev/docs/components/styles/', 'Revisa static styles, :host y theming.', 'Lit')],
    debug: { title: 'El tema no cruza el shadow root', expected: 'brand-chip usa --brand-color.', observed: 'Intenta seleccionar .brand-chip desde la página.',
      starter: `import { LitElement, html, css } from 'lit';
class BrandChip extends LitElement {
  static styles = css\`
    span {
      color: blue;
    }
  \`;
  render() {
    return html\`<span>Marca</span>\`;
  }
}
customElements.define('brand-chip', BrandChip);`,
      tests: [sourceTest('lit25-d1', 'Consume el token público', String.raw`var\s*\(\s*--brand-color`), litText('lit25-d2', 'Conserva el contenido', 'brand-chip', 'span', 'Marca')],
      hints: ['El exterior no alcanza span.', 'La cascada sí lleva custom properties.', 'Usa el token dentro de static styles.'] },
  }),
  lesson({
    number: 26, module: 8, title: 'Slots, parts y contratos de composición', appName: 'un panel de aplicación personalizable',
    summary: 'Combina contenido proyectado, variables de valor y parts estructurales sin exponer toda la implementación.',
    concepts: [{ label: 'part', desc: 'Nombre público de una pieza interna que puede estilizarse.' }, { label: '::slotted', desc: 'Selector limitado para contenido proyectado.' }],
    skillsRequired: ['lit-styles', 'css-theming'], skillsIntroduced: ['lit-slots', 'css-parts'],
    reasoningSteps: ['El consumidor proyecta header/body/actions', 'Lit coloca slots', 'part expone una pieza interna', 'El tema ajusta sin conocer selectores privados'],
    html: appHtml('Aplicación', '<app-panel><h2 slot="header">Reportes</h2><p>Contenido del equipo</p><button slot="actions">Exportar</button></app-panel>'),
    example: `import { LitElement, html, css } from 'lit';
class InfoPanel extends LitElement {
  static styles = css\`
    :host {
      display: block;
    }
    ::slotted([slot='title']) {
      font-weight: 800;
    }
  \`;
  render() {
    return html\`<section part="surface">
      <header><slot name="title"></slot></header>
      <slot></slot>
    </section>\`;
  }
}
customElements.define('info-panel', InfoPanel);`,
    starter: `import { LitElement, html, css } from 'lit';
class AppPanel extends LitElement {
  static styles = css\`
    :host {
      display: block;
    } /* estiliza slotted header sin depender de h2 */
  \`;
  render() {
    return html\`<section part="surface">
      <header><slot name="header"></slot></header>
      <main><slot></slot></main>
      <footer><slot name="actions"></slot></footer>
    </section>\`;
  }
}
customElements.define('app-panel', AppPanel);`,
    challengeTitle: 'App: panel con extensiones deliberadas', challengeInstructions: 'Conserva los slots, expón surface como part y aplica estilo al slot header.',
    tests: [browserTest('lit26-slots', 'Expone composición completa', `async ({document,customElements})=>{await customElements.whenDefined('app-panel');const root=document.querySelector('app-panel')?.shadowRoot;return Boolean(root?.querySelector('slot[name="header"]')&&root.querySelector('slot[name="actions"]')&&root.querySelector('[part="surface"]'));}`), sourceTest('lit26-slotted', 'Estiliza contenido proyectado sin asumir su etiqueta', String.raw`::slotted\s*\(\s*\[slot\s*=\s*['"]header['"]\]`) ],
    hints: ['Los slots ya son parte del contrato; no copies su contenido.', 'part nombra una pieza interna concreta.', 'Selecciona por slot, no por h2.'],
    model: 'Variables ajustan perillas, parts permiten pintar una pieza y slots dejan traer contenido; cada puerta tiene un alcance diferente.',
    whenToUse: 'Usa slots para DOM aportado, custom properties para valores y parts para personalización estructural excepcional.',
    bestPractices: 'Expón pocos nombres semánticos, documenta su estabilidad y evita que el consumidor reconstruya internals.',
    commonErrors: 'parts para cada nodo, ::slotted profundo que no funciona o cambiar nombres públicos como refactor interno.',
    transfer: 'Diseña la personalización de date-picker con tokens, parts y slots mínimos.',
    sources: [source('Styles: theming', 'https://lit.dev/docs/components/styles/#theming', 'Compara mecanismos.', 'Lit'), source('CSS shadow parts', 'https://developer.mozilla.org/en-US/docs/Web/CSS/::part', 'Consulta part y ::part.')],
    debug: { title: 'El consumidor no puede tematizar la superficie', expected: 'report-card expone part="surface".', observed: 'La sección interna no tiene una puerta pública.',
      starter: `import { LitElement, html } from 'lit';
class ReportCard extends LitElement {
  render() {
    return html\`<section><slot></slot></section>\`;
  }
}
customElements.define('report-card', ReportCard);`,
      tests: [sourceTest('lit26-d1', 'Expone surface', String.raw`part\s*=\s*['"]surface['"]`), browserTest('lit26-d2', 'La superficie existe', `async ({document,customElements})=>{await customElements.whenDefined('report-card');const el=document.querySelector('report-card');if(!el)return false;await Promise.race([Promise.resolve(el.updateComplete).catch(()=>false),new Promise(resolve=>setTimeout(resolve,150))]);return Boolean(el.shadowRoot?.querySelector('[part="surface"]'));}`)],
      hints: ['El slot resuelve contenido, no estilo de section.', 'Nombra solo la superficie estable.', 'Añade part a la pieza interna.'] },
  }),
];
