import { appHtml, browserTest, lesson, source, sourceTest } from './helpers';

export const COMPONENT_SPECS_33_TO_40 = [
  lesson({
    number: 33, module: 12, title: 'Directivas personalizadas: cuándo crear una abstracción', appName: 'un formulario que resalta campos inválidos sin duplicar lógica DOM',
    summary: 'Construye una directiva pequeña cuando una operación de render repetida necesita ciclo y acceso al elemento.',
    concepts: [{ label: 'Directiva personalizada', desc: 'Unidad de render reutilizable que participa en el ciclo de una parte del template.' }, { label: 'PartInfo', desc: 'Información sobre la clase de binding donde se usa una directiva.' }],
    skillsRequired: ['lit-repeat', 'lit-style-directives'], skillsIntroduced: ['lit-custom-directives', 'directive-lifecycle'],
    reasoningSteps: ['El template entrega valor y regla', 'La directiva valida su tipo de parte', 'update compara la entrada', 'El elemento recibe solo el efecto necesario'],
    html: appHtml('Validación', '<validation-form></validation-form>'),
    example: `import { LitElement, html } from 'lit';
import { Directive, directive } from 'lit/directive.js';
class AriaCurrentDirective extends Directive {
  update(part, [active]) {
    part.element.toggleAttribute('aria-current', active);
    return active ? 'Paso actual' : 'Paso';
  }
  render(active) {
    return active ? 'Paso actual' : 'Paso';
  }
}
const ariaCurrent = directive(AriaCurrentDirective);
class StepNav extends LitElement {
  render() {
    return html\`<button>\${ariaCurrent(true)}</button>\`;
  }
}
customElements.define('step-nav', StepNav);`,
    starter: `import { LitElement, html } from 'lit';
import { Directive, directive } from 'lit/directive.js';
class InvalidFieldDirective extends Directive {
  update(part, [invalid, message]) {
    /* verifica una ChildPart, actualiza aria-invalid del input anterior y devuelve el mensaje */
  }
  render(invalid, message) {
    /* devuelve mensaje o cadena vacía */
  }
}
const invalidField = directive(InvalidFieldDirective);
class ValidationForm extends LitElement {
  static properties = { email: { state: true } };
  constructor() {
    super();
    this.email = '';
  }
  render() {
    const invalid = this.email.length > 0 && !this.email.includes('@');
    return html\`<label
        >Correo
        <input
          .value=\${this.email}
          @input=\${(event) => (this.email = event.target.value)}
      /></label>
      <p role="alert">\${invalidField(invalid, 'Escribe un correo válido')}</p>\`;
  }
}
customElements.define('validation-form', ValidationForm);`,
    challengeTitle: 'App: directiva de validación enfocada', challengeInstructions: 'Completa invalidField para sincronizar aria-invalid y el mensaje sin convertir la directiva en dueña del formulario.',
    tests: [sourceTest('lit33-directive', 'La abstracción usa Directive y directive', String.raw`extends\s+Directive[\s\S]*directive\s*\(`), browserTest('lit33-invalid', 'Una entrada inválida produce mensaje y aria-invalid', `async ({document,customElements})=>{await customElements.whenDefined('validation-form');const el=document.querySelector('validation-form');el.email='sin-arroba';await el.updateComplete;const input=el.shadowRoot.querySelector('input');return input.getAttribute('aria-invalid')==='true'&&el.shadowRoot.textContent.includes('correo válido');}`)],
    hints: ['La directiva adapta el render; el formulario conserva email y la regla.', 'part.element es el nodo que contiene la ChildPart del mensaje.', 'Busca el input relacionado y alterna aria-invalid según invalid.'],
    model: 'Una directiva personalizada es un adaptador del render, no un componente escondido: recibe entradas, opera sobre una parte concreta y devuelve lo que esa parte debe mostrar.',
    whenToUse: 'Créala cuando el mismo comportamiento de binding aparece en varios componentes y necesita conocer su parte; usa una función normal si solo transformas datos.',
    bestPractices: 'Valida el tipo de parte, documenta dónde puede usarse, conserva responsabilidades estrechas y evita guardar estado de negocio dentro de la directiva.',
    commonErrors: 'crear directivas para formatear texto, asumir cualquier Part, consultar todo el documento o esconder validación de dominio dentro del render.',
    transfer: 'Decide si formato de moneda, autofocus condicional, tooltip y sanitización pertenecen a función, directiva o componente.',
    sources: [source('Custom directives', 'https://lit.dev/docs/templates/custom-directives/', 'Comprende Directive, Part y ciclo.', 'Lit'), source('Directive API', 'https://lit.dev/docs/api/directives/', 'Consulta contratos de directivas.', 'Lit')],
    debug: { title: 'La directiva conserva el primer valor para siempre', expected: 'live-label responde a cada cambio de label.', observed: 'render ignora actualizaciones después de la primera.',
      starter: `import { LitElement, html } from 'lit';
import { Directive, directive } from 'lit/directive.js';
class StickyLabel extends Directive {
  render(value) {
    if (this.saved === undefined) this.saved = value;
    return this.saved;
  }
}
const stickyLabel = directive(StickyLabel);
class LiveLabel extends LitElement {
  static properties = { label: { type: String } };
  constructor() {
    super();
    this.label = 'Uno';
  }
  render() {
    return html\`<p>\${stickyLabel(this.label)}</p>\`;
  }
}
customElements.define('live-label', LiveLabel);`,
      tests: [sourceTest('lit33-d1', 'La salida usa el valor vigente', String.raw`render\s*\(\s*value\s*\)\s*\{[^}]*return\s+value`), browserTest('lit33-d2', 'El texto cambia después de actualizar label', `async ({document,customElements})=>{await customElements.whenDefined('live-label');const el=document.querySelector('live-label');if(!el)return false;try{el.label='Dos';await el.updateComplete;}catch{return false;}return Boolean(el.shadowRoot?.textContent.includes('Dos'));}`)],
      hints: ['La entrada de render ya es la versión vigente.', 'No toda directiva necesita estado.', 'Devuelve el argumento actual en cada actualización.'] },
  }),
  lesson({
    number: 34, module: 12, title: 'Animación con propósito y movimiento reducido', appName: 'una bandeja de avisos que anima sin bloquear ni marear',
    summary: 'Coordina animaciones con el DOM actualizado y respeta preferencias de movimiento sin convertirlas en requisito funcional.',
    concepts: [{ label: 'Web Animations API', desc: 'API del navegador para animar y observar una secuencia.' }, { label: 'prefers-reduced-motion', desc: 'Preferencia que pide reducir movimiento no esencial.' }],
    skillsRequired: ['update-complete', 'lit-ref'], skillsIntroduced: ['lit-animation', 'reduced-motion'],
    reasoningSteps: ['Una acción cambia notices', 'Lit actualiza el DOM', 'updateComplete confirma el nodo', 'La preferencia decide animar o mostrar directamente'],
    html: appHtml('Avisos', '<notice-stack></notice-stack>'),
    example: `import { LitElement, html } from 'lit';
class RevealCard extends LitElement {
  async reveal() {
    this.open = true;
    await this.updateComplete;
    const card = this.shadowRoot.querySelector('article');
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
      card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180 });
  }
  render() {
    return html\`<button @click=\${() => this.reveal()}>Mostrar</button
      >\${this.open ? html\`<article>Contenido</article>\` : null}\`;
  }
}
customElements.define('reveal-card', RevealCard);`,
    starter: `import { LitElement, html } from 'lit';
class NoticeStack extends LitElement {
  static properties = { notices: { state: true } };
  constructor() {
    super();
    this.notices = [];
  }
  async add(message) {
    /* agrega con id, espera el render y anima solo si la preferencia lo permite */
  }
  remove(id) {
    this.notices = this.notices.filter((notice) => notice.id !== id);
  }
  render() {
    return html\`<button @click=\${() => this.add('Guardado')}>Avisar</button>
      <section aria-live="polite">
        \${this.notices.map(
          (n) => html\`
            <article data-id=\${n.id}>
              <span>\${n.message}</span>
              <button @click=\${() => this.remove(n.id)}>Cerrar</button>
            </article>
          \`,
        )}
      </section>\`;
  }
}
customElements.define('notice-stack', NoticeStack);`,
    challengeTitle: 'App: avisos accesibles y no bloqueantes', challengeInstructions: 'Añade avisos, espera updateComplete y anima la entrada solo cuando prefers-reduced-motion no solicita reducción.',
    tests: [sourceTest('lit34-sequence', 'Espera el DOM y consulta movimiento reducido', String.raw`await\s+this\.updateComplete[\s\S]*prefers-reduced-motion`), browserTest('lit34-notice', 'Añadir crea un aviso utilizable sin depender de la animación', `async ({document,customElements})=>{await customElements.whenDefined('notice-stack');const el=document.querySelector('notice-stack');await el.add('Sincronizado');await el.updateComplete;return el.notices.length===1&&el.shadowRoot.textContent.includes('Sincronizado')&&el.shadowRoot.querySelector('[aria-live]');}`)],
    hints: ['Primero cambia el estado; la animación nunca debe crear el contenido.', 'updateComplete permite consultar el article nuevo.', 'Si matchMedia coincide, termina sin llamar animate.'],
    model: 'La animación explica un cambio que ya ocurrió en el estado. La aplicación debe seguir siendo correcta si dura cero milisegundos o si el navegador decide no ejecutarla.',
    whenToUse: 'Anima para orientar atención o continuidad espacial; evita movimiento decorativo continuo y cualquier flujo que dependa de esperar una transición.',
    bestPractices: 'Respeta reduced motion, limita propiedades a transform/opacity, cancela animaciones obsoletas y mantiene foco y aria-live independientes.',
    commonErrors: 'animar antes de que exista el nodo, usar setTimeout como reloj del DOM, ocultar información hasta animationend o ignorar preferencias.',
    transfer: 'Diseña estados sin animación y luego decide qué movimiento ayuda en modal, acordeón, lista reordenada y carga.',
    sources: [source('Web Animations API', 'https://developer.mozilla.org/docs/Web/API/Web_Animations_API', 'Usa la API nativa de animación.'), source('prefers-reduced-motion', 'https://developer.mozilla.org/docs/Web/CSS/@media/prefers-reduced-motion', 'Respeta preferencias de movimiento.'), source('Lit animations', 'https://lit.dev/docs/components/styles/#animations', 'Coordina estilos y render.', 'Lit')],
    debug: { title: 'La tarjeta intenta animarse antes de existir', expected: 'detail-panel espera updateComplete antes de animate.', observed: 'querySelector devuelve null al abrir.',
      starter: `import { LitElement, html } from 'lit';
class DetailPanel extends LitElement {
  static properties = { open: { state: true } };
  constructor() {
    super();
    this.open = false;
  }
  show() {
    this.open = true;
    this.shadowRoot
      .querySelector('article')
      .animate([{ opacity: 0 }, { opacity: 1 }], 150);
  }
  render() {
    return this.open
      ? html\`<article>Detalle</article>\`
      : html\`<button @click=\${() => this.show()}>Abrir</button>\`;
  }
}
customElements.define('detail-panel', DetailPanel);`,
      tests: [sourceTest('lit34-d1', 'show es asíncrono y espera el render', String.raw`async\s+show\s*\([^)]*\)[\s\S]*await\s+this\.updateComplete`), browserTest('lit34-d2', 'Abrir muestra el detalle sin lanzar error', `async ({document,customElements})=>{await customElements.whenDefined('detail-panel');const el=document.querySelector('detail-panel');if(!el)return false;try{await el.show();}catch{return false;}return Boolean(el.shadowRoot?.textContent.includes('Detalle'));}`)],
      hints: ['Asignar open programa una actualización.', 'El article aparece después del render.', 'Haz show async y espera updateComplete antes de consultarlo.'] },
  }),
  lesson({
    number: 35, module: 12, title: 'Observer moderno: eventos, suscripciones y propietarios', appName: 'un tablero de métricas con una suscripción que se limpia correctamente',
    summary: 'Aplica Observer sin acoplar componentes: una fuente publica cambios, los dueños se suscriben y el ciclo controla la limpieza.',
    concepts: [{ label: 'Observer', desc: 'Relación uno-a-muchos basada en suscripción y notificación.' }, { label: 'Unsubscribe', desc: 'Operación que corta una suscripción y evita trabajo o memoria retenida.' }],
    skillsRequired: ['lit-controllers', 'lifecycle-cleanup'], skillsIntroduced: ['observer-pattern', 'subscription-ownership'],
    reasoningSteps: ['MetricSource conserva listeners', 'El panel se suscribe al conectar', 'Una emisión actualiza estado', 'Al desconectar ejecuta unsubscribe'],
    html: appHtml('Métricas', '<metrics-board></metrics-board>'),
    example: `import { LitElement, html } from 'lit';
class Store {
  listeners = new Set();
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  emit(value) {
    for (const fn of this.listeners) fn(value);
  }
}
const store = new Store();
class StoreView extends LitElement {
  connectedCallback() {
    super.connectedCallback();
    this.stop = store.subscribe((value) => {
      this.value = value;
      this.requestUpdate();
    });
  }
  disconnectedCallback() {
    this.stop?.();
    super.disconnectedCallback();
  }
  render() {
    return html\`<p>\${this.value ?? 'Sin datos'}</p>\`;
  }
}
customElements.define('store-view', StoreView);`,
    starter: `import { LitElement, html } from 'lit';
class MetricSource {
  constructor() {
    this.listeners = new Set();
  }
  subscribe(listener) {
    /* registra y devuelve unsubscribe */
  }
  publish(metric) {
    /* notifica una instantánea a cada listener */
  }
}
const metrics = new MetricSource();
class MetricsBoard extends LitElement {
  static properties = { latest: { state: true } };
  constructor() {
    super();
    this.latest = null;
  }
  connectedCallback() {
    super.connectedCallback(); /* suscribe y guarda cleanup */
  }
  disconnectedCallback() {
    /* limpia y llama super */
  }
  render() {
    return html\`<button
        @click=\${() => metrics.publish({ name: 'latencia', value: 42 })}
      >
        Medir
      </button>
      <p>
        \${this.latest ? \`\${this.latest.name}: \${this.latest.value}\` : 'Sin mediciones'}
      </p>\`;
  }
}
customElements.define('metrics-board', MetricsBoard);`,
    challengeTitle: 'App: tablero observable sin fugas', challengeInstructions: 'Completa subscribe, publish y el ciclo del panel. El componente debe dejar de observar al desconectarse.',
    tests: [sourceTest('lit35-cleanup', 'La suscripción devuelve y usa una limpieza', String.raw`return\s*\(\)\s*=>[\s\S]*disconnectedCallback[\s\S]*this\.[\w$]+\?\.\(`), browserTest('lit35-update', 'Una publicación actualiza el tablero', `async ({document,customElements})=>{await customElements.whenDefined('metrics-board');const el=document.querySelector('metrics-board');el.shadowRoot.querySelector('button').click();await el.updateComplete;return el.shadowRoot.textContent.includes('latencia: 42');}`)],
    hints: ['subscribe añade el callback al Set y devuelve una función que lo elimina.', 'El panel guarda esa función al conectar.', 'Limpia antes o después de super, pero llama siempre al ciclo base.'],
    model: 'Observer define quién anuncia y quién escucha; el ciclo de vida define quién es responsable de dejar de escuchar. Los eventos DOM son una forma de observación con propagación incorporada.',
    whenToUse: 'Úsalo para fuentes con múltiples consumidores y emisiones en el tiempo; propiedades y eventos bastan para relaciones locales entre componentes.',
    bestPractices: 'Devuelve unsubscribe, usa instantáneas inmutables, captura errores por observador y asigna un dueño claro a cada suscripción.',
    commonErrors: 'suscribir dentro de render, no limpiar, compartir objetos mutables o usar un bus global para comunicación padre-hijo.',
    transfer: 'Compara evento DOM, Observer, contexto y controller para red, sesión, carrito y telemetría.',
    sources: [source('Observer pattern', 'https://developer.mozilla.org/docs/Web/API/EventTarget', 'Relaciona suscripciones con EventTarget.'), source('Lifecycle', 'https://lit.dev/docs/components/lifecycle/', 'Integra limpieza con el ciclo de Lit.', 'Lit')],
    debug: { title: 'Cada conexión duplica las notificaciones', expected: 'feed-view conserva una sola suscripción y la cancela.', observed: 'connectedCallback añade listeners que nunca salen.',
      starter: `import { LitElement, html } from 'lit';
const feed = new EventTarget();
class FeedView extends LitElement {
  connectedCallback() {
    super.connectedCallback();
    feed.addEventListener('message', (event) => {
      this.message = event.detail;
      this.requestUpdate();
    });
  }
  render() {
    return html\`<p>\${this.message ?? 'Vacío'}</p>\`;
  }
}
customElements.define('feed-view', FeedView);`,
      tests: [sourceTest('lit35-d1', 'Guarda un manejador estable', String.raw`this\.[\w$]+\s*=\s*(?:\([^)]*\)|\w+)\s*=>`), sourceTest('lit35-d2', 'Retira el mismo listener al desconectar', String.raw`disconnectedCallback[\s\S]*removeEventListener\s*\(`)],
      hints: ['Una arrow inline no se puede retirar después.', 'Crea el manejador una vez y guárdalo.', 'disconnectedCallback retira exactamente esa referencia.'] },
  }),
  lesson({
    number: 36, module: 12, title: 'Bridge y Adapter: aislar servicios externos', appName: 'un panel de pagos que cambia de proveedor sin cambiar la interfaz',
    summary: 'Protege los componentes de APIs externas mediante un contrato propio y adaptadores intercambiables.',
    concepts: [{ label: 'Adapter', desc: 'Traduce una interfaz externa al contrato que usa la aplicación.' }, { label: 'Bridge', desc: 'Separa una abstracción de implementaciones que pueden variar.' }],
    skillsRequired: ['lit-context', 'observer-pattern'], skillsIntroduced: ['adapter-pattern', 'bridge-pattern'],
    reasoningSteps: ['PaymentPanel pide charge', 'El puerto define resultado normalizado', 'El adapter traduce proveedor A o B', 'La vista solo conoce success/message'],
    html: appHtml('Pagos', '<payment-panel></payment-panel>'),
    example: `import { LitElement, html } from 'lit';
class WeatherAdapter {
  constructor(client) {
    this.client = client;
  }
  async current(city) {
    const raw = await this.client.fetchCity(city);
    return { temperature: Number(raw.temp_c), label: raw.condition };
  }
}
class WeatherCard extends LitElement {
  constructor() {
    super();
    this.service = new WeatherAdapter({
      fetchCity: async () => ({ temp_c: '20', condition: 'Claro' }),
    });
  }
  async load() {
    this.weather = await this.service.current('Bogotá');
    this.requestUpdate();
  }
  render() {
    return html\`<button @click=\${() => this.load()}>Cargar</button>
      <p>\${this.weather?.temperature ?? '--'}</p>\`;
  }
}
customElements.define('weather-card', WeatherCard);`,
    starter: `import { LitElement, html } from 'lit';
class PaymentAdapter {
  constructor(provider) {
    this.provider = provider;
  }
  async charge(amount) {
    /* valida, llama provider.pay y normaliza a {success,message,id} */
  }
}
const demoProvider = {
  pay: async (cents) => ({ ok: true, transaction: 'tx-1', note: \`\${cents} centavos\` }),
};
class PaymentPanel extends LitElement {
  static properties = { result: { state: true }, pending: { state: true } };
  constructor() {
    super();
    this.service = new PaymentAdapter(demoProvider);
    this.result = null;
    this.pending = false;
  }
  async submit(amount) {
    /* estados y llamada al contrato propio */
  }
  render() {
    return html\`<button ?disabled=\${this.pending} @click=\${() => this.submit(1250)}>
        Pagar
      </button>
      <p role="status">
        \${this.pending ? 'Procesando' : (this.result?.message ?? 'Sin pago')}
      </p>\`;
  }
}
customElements.define('payment-panel', PaymentPanel);`,
    challengeTitle: 'App: proveedor intercambiable', challengeInstructions: 'Implementa el adaptador y el flujo de pago. PaymentPanel no debe leer ok, transaction ni note del proveedor.',
    tests: [sourceTest('lit36-normalize', 'El adaptador normaliza el proveedor', String.raw`success\s*:[\s\S]*message\s*:[\s\S]*id\s*:`), browserTest('lit36-payment', 'El panel consume el contrato normalizado', `async ({document,customElements})=>{await customElements.whenDefined('payment-panel');const el=document.querySelector('payment-panel');await el.submit(1250);await el.updateComplete;return el.result?.success===true&&el.result?.id==='tx-1'&&el.shadowRoot.textContent.includes('centavos');}`)],
    hints: ['PaymentAdapter es el único lugar que conoce los nombres externos.', 'Convierte amount a un número positivo antes de llamar.', 'submit solo alterna pending y guarda el resultado normalizado.'],
    model: 'El componente habla el idioma estable de la aplicación; cada adapter habla el idioma cambiante de un proveedor. Bridge aparece cuando puedes variar vista e implementación de servicio por separado.',
    whenToUse: 'Úsalo ante SDK, API o almacenamiento externo; evita una capa ceremonial si no existe una frontera cambiante.',
    bestPractices: 'Define el puerto desde las necesidades del consumidor, normaliza errores y datos, inyecta dependencias y prueba adapters con contratos comunes.',
    commonErrors: 'filtrar respuestas crudas a la UI, llamar fetch en render, adapters que contienen reglas visuales o interfaces enormes por copiar el SDK.',
    transfer: 'Diseña un contrato mínimo para clima, museo y autenticación con dos implementaciones posibles.',
    sources: [source('Dependency inversion', 'https://developer.mozilla.org/docs/Learn_web_development/Extensions/Client-side_APIs/Introduction', 'Ubica APIs externas como frontera.'), source('Context', 'https://lit.dev/docs/data/context/', 'Inyecta servicios cuando el árbol lo requiere.', 'Lit')],
    debug: { title: 'El componente depende de los campos crudos del proveedor', expected: 'shipping-card llama a un adapter que devuelve cost.', observed: 'render conoce total_cents y divide manualmente.',
      starter: `import { LitElement, html } from 'lit';
const provider = { quote: async () => ({ total_cents: 950, currency_code: 'USD' }) };
class ShippingCard extends LitElement {
  async load() {
    this.raw = await provider.quote();
    this.requestUpdate();
  }
  render() {
    return html\`<button @click=\${() => this.load()}>Cotizar</button>
      <p>\${this.raw ? this.raw.total_cents / 100 : '--'}</p>\`;
  }
}
customElements.define('shipping-card', ShippingCard);`,
      tests: [browserTest('lit36-d0', 'La tarjeta acepta otro adapter normalizado', `async ({document,customElements})=>{await customElements.whenDefined('shipping-card');const el=document.querySelector('shipping-card');const key=Object.keys(el).find(name=>typeof el[name]?.quote==='function');if(!key)return false;el[key]={quote:async()=>({cost:17,currency:'EUR'})};await el.load();await el.updateComplete;return el.shadowRoot?.textContent.includes('17')&&!el.shadowRoot?.textContent.includes('total_cents');}`), sourceTest('lit36-d1', 'Existe un adapter con quote', String.raw`class\s+ShippingAdapter[\s\S]*async\s+quote`), sourceTest('lit36-d2', 'Normaliza el costo', String.raw`cost\s*:`)],
      hints: ['La vista no debería conocer total_cents.', 'Crea ShippingAdapter alrededor del provider.', 'Devuelve {cost,currency} desde el adapter.'] },
  }),
  lesson({
    number: 37, module: 13, title: 'Proyecto API I: museo con estados y curaduría', appName: 'una sala de museo consultable con servicio, filtros y favoritos',
    summary: 'Construye una capacidad API completa con contrato de servicio, estados explícitos, transformación de datos y decisiones curatoriales.',
    concepts: [{ label: 'Service layer', desc: 'Frontera que consulta y normaliza datos externos.' }, { label: 'Estado remoto', desc: 'Máquina de idle, loading, empty, ready y error.' }],
    skillsRequired: ['adapter-pattern', 'lit-task'], skillsIntroduced: ['api-vertical-slice', 'remote-state-machine'],
    reasoningSteps: ['La búsqueda cambia query', 'El servicio normaliza obras', 'Task representa la operación', 'La sala filtra y conserva favoritos por id'],
    html: appHtml('Sala de museo', '<museum-room></museum-room>'),
    example: `import { LitElement, html } from 'lit';
class BookService {
  constructor(client) {
    this.client = client;
  }
  async search(term) {
    const rows = await this.client(term);
    return rows.map((row) => ({
      id: String(row.key),
      title: row.name || 'Sin título',
    }));
  }
}
class BookShelf extends LitElement {
  constructor() {
    super();
    this.service = new BookService(async () => [{ key: 1, name: 'Algoritmos' }]);
    this.books = [];
  }
  async load() {
    this.books = await this.service.search('web');
    this.requestUpdate();
  }
  render() {
    return html\`<button @click=\${() => this.load()}>Buscar</button
      >\${this.books.map((b) => html\`<p>\${b.title}</p>\`)}\`;
  }
}
customElements.define('book-shelf', BookShelf);`,
    starter: `import { LitElement, html } from 'lit';
import { Task } from '@lit/task';
class MuseumService {
  constructor(client) {
    this.client = client;
  }
  async search(query, { signal } = {}) {
    /* consulta client y devuelve {id,title,artist,year,imageUrl} normalizados */
  }
}
const fixtureClient = async (query) =>
  query
    ? {
        items: [
          {
            objectID: 7,
            title: 'Jardín',
            artistDisplayName: 'Ana',
            objectDate: '1920',
            primaryImageSmall: '',
          },
        ],
      }
    : { items: [] };
class MuseumRoom extends LitElement {
  static properties = { query: { state: true }, favorites: { state: true } };
  constructor() {
    super();
    this.query = 'jardín';
    this.favorites = [];
    this.service = new MuseumService(fixtureClient);
    this.searchTask = new Task(this, {
      task: ([query], options) => this.service.search(query, options),
      args: () => [this.query],
    });
  }
  toggleFavorite(id) {
    /* actualiza ids sin mutar */
  }
  render() {
    /* formulario de búsqueda + pending/empty/error/ready; tarjetas semánticas y favoritos */
  }
}
customElements.define('museum-room', MuseumRoom);`,
    challengeTitle: 'Proyecto: sala de museo resistente', challengeInstructions: 'Completa normalización, estados, búsqueda y favoritos. La vista solo puede usar el modelo normalizado.',
    tests: [sourceTest('lit37-service', 'El servicio devuelve el contrato interno', String.raw`id\s*:[\s\S]*title\s*:[\s\S]*artist\s*:[\s\S]*year\s*:[\s\S]*imageUrl\s*:`), browserTest('lit37-favorite', 'Favoritos alterna un id sin mutar', `async ({document,customElements})=>{await customElements.whenDefined('museum-room');const el=document.querySelector('museum-room');const before=el.favorites;el.toggleFavorite('7');await el.updateComplete;return before!==el.favorites&&el.favorites.includes('7');}`), sourceTest('lit37-states', 'La UI contempla estados remotos', String.raw`pending\s*:[\s\S]*complete\s*:[\s\S]*error\s*:`)],
    hints: ['Normaliza una obra dentro de MuseumService, no en render.', 'favorites contiene ids y se reemplaza con filter o spread.', 'complete distingue lista vacía antes de mapear tarjetas.'],
    model: 'Una interfaz API no es una lista bonita: es una máquina de estados alrededor de un contrato propio. Curar implica decidir qué dato importa y qué hacer cuando falta.',
    whenToUse: 'Aplica este corte a cualquier vista remota con búsqueda y acciones locales; reduce complejidad en demos estáticas sin red.',
    bestPractices: 'Inyecta cliente, cancela búsquedas, normaliza opcionales, ofrece vacíos útiles, conserva identidad y prueba con fixtures deterministas.',
    commonErrors: 'renderizar respuestas crudas, asumir imágenes, confundir cero resultados con error, fetch en render o favoritos por índice.',
    transfer: 'Diseña los cinco estados y el modelo normalizado de una API de películas o bibliotecas.',
    sources: [source('Async tasks', 'https://lit.dev/docs/data/task/', 'Coordina búsquedas y estados.', 'Lit'), source('Fetch API', 'https://developer.mozilla.org/docs/Web/API/Fetch_API', 'Comprende solicitud, respuesta y cancelación.')],
    debug: { title: 'La sala rompe cuando una obra no tiene imagen', expected: 'art-card conserva título y muestra un fallback.', observed: 'Accede a image.url sin comprobar image.',
      starter: `import { LitElement, html } from 'lit';
class ArtCard extends LitElement {
  static properties = { art: { attribute: false } };
  render() {
    return html\`<img src=\${this.art.image.url} alt=\${this.art.title} />
      <h2>\${this.art.title}</h2>\`;
  }
}
customElements.define('art-card', ArtCard);`,
      tests: [sourceTest('lit37-d1', 'La imagen ausente tiene fallback', String.raw`image\?\.|\?\?`), browserTest('lit37-d2', 'Renderiza una obra sin image', `async ({document,customElements})=>{await customElements.whenDefined('art-card');const el=document.createElement('art-card');el.art={title:'Sin imagen'};document.body.append(el);try{await el.updateComplete;}catch{return false;}return Boolean(el.shadowRoot?.textContent.includes('Sin imagen'));}`)],
      hints: ['Los datos remotos pueden omitir campos.', 'Decide un fallback antes del template.', 'El título debe seguir disponible aunque no haya imagen.'] },
  }),
  lesson({
    number: 38, module: 13, title: 'Proyecto API II: clima, concurrencia y decisiones', appName: 'un tablero climático multiciudad que sobrevive a respuestas fuera de orden',
    summary: 'Gestiona varias consultas, unidades, actualización parcial y errores por ciudad sin perder datos útiles.',
    concepts: [{ label: 'Concurrencia', desc: 'Operaciones que progresan sin un orden de finalización garantizado.' }, { label: 'Actualización parcial', desc: 'Una parte puede fallar sin borrar resultados válidos de las demás.' }],
    skillsRequired: ['api-vertical-slice', 'remote-state-machine'], skillsIntroduced: ['concurrent-ui', 'partial-failure'],
    reasoningSteps: ['Cada ciudad obtiene identidad', 'El servicio normaliza temperatura', 'Promise.allSettled conserva éxitos y fallos', 'La vista representa resultado por ciudad'],
    html: appHtml('Clima', '<weather-dashboard></weather-dashboard>'),
    example: `import { LitElement, html } from 'lit';
class PriceBoard extends LitElement {
  constructor() {
    super();
    this.results = [];
  }
  async load() {
    const settled = await Promise.allSettled([
      Promise.resolve({ id: 'a', value: 10 }),
      Promise.reject(new Error('Sin red')),
    ]);
    this.results = settled.map((result, index) =>
      result.status === 'fulfilled'
        ? { ...result.value, status: 'ready' }
        : { id: String(index), status: 'error' },
    );
    this.requestUpdate();
  }
  render() {
    return html\`<button @click=\${() => this.load()}>Cargar</button
      >\${this.results.map((r) => html\`<p>\${r.status}</p>\`)}\`;
  }
}
customElements.define('price-board', PriceBoard);`,
    starter: `import { LitElement, html } from 'lit';
class WeatherService {
  constructor(client) {
    this.client = client;
  }
  async current(city, unit) {
    /* normaliza a {id,city,temperature,unit,condition} */
  }
}
const fixture = async (city) => {
  if (city === 'Error') throw new Error('No disponible');
  return { name: city, tempC: 20, condition: 'Claro' };
};
class WeatherDashboard extends LitElement {
  static properties = {
    cities: { state: true },
    results: { state: true },
    unit: { state: true },
  };
  constructor() {
    super();
    this.cities = ['Bogotá', 'Error', 'Lima'];
    this.results = [];
    this.unit = 'C';
    this.service = new WeatherService(fixture);
  }
  async refresh() {
    /* allSettled y una fila ready/error por ciudad */
  }
  render() {
    /* control de unidad, actualizar y lista que no borra éxitos */
  }
}
customElements.define('weather-dashboard', WeatherDashboard);`,
    challengeTitle: 'Proyecto: clima con fallos parciales', challengeInstructions: 'Implementa normalización, allSettled y vista por ciudad. Un error no debe ocultar las ciudades correctas.',
    tests: [sourceTest('lit38-settled', 'La concurrencia conserva resultados parciales', String.raw`Promise\.allSettled\s*\(`), browserTest('lit38-partial', 'Una ciudad fallida no borra las correctas', `async ({document,customElements})=>{await customElements.whenDefined('weather-dashboard');const el=document.querySelector('weather-dashboard');await el.refresh();await el.updateComplete;return el.results.length===3&&el.results.some(r=>r.status==='error')&&el.results.filter(r=>r.status==='ready').length===2;}`), sourceTest('lit38-contract', 'El servicio normaliza unidad y temperatura', String.raw`temperature\s*:[\s\S]*unit\s*:`)],
    hints: ['Crea una promesa por ciudad y espera allSettled.', 'Mapea cada resultado junto a la ciudad original.', 'El error es estado de una fila, no de toda la pantalla.'],
    model: 'Concurrencia significa que el reloj de la red no respeta el orden visual. La identidad y el estado por recurso impiden que una respuesta lenta sobrescriba o borre información ajena.',
    whenToUse: 'Úsalo cuando varias fuentes son independientes; una sola operación atómica puede tener un error global.',
    bestPractices: 'Conserva ids, representa error por elemento, limita concurrencia si es necesario y separa unidades del dato base.',
    commonErrors: 'Promise.all cuando toleras fallos parciales, usar índice como identidad, borrar datos previos al refrescar o convertir unidades varias veces.',
    transfer: 'Diseña resultados parciales para precios, disponibilidad de tiendas y salud de servicios.',
    sources: [source('Promise.allSettled', 'https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled', 'Conserva éxito y rechazo por operación.'), source('Lists', 'https://lit.dev/docs/templates/lists/', 'Mantén identidad al renderizar resultados.', 'Lit')],
    debug: { title: 'Una ciudad fallida vacía todo el tablero', expected: 'city-board conserva resultados individuales.', observed: 'Promise.all rechaza el grupo completo.',
      starter: `import { LitElement, html } from 'lit';
class CityBoard extends LitElement {
  constructor() {
    super();
    this.loaders = [
      () => Promise.resolve('Bogotá'),
      () => Promise.reject(new Error('fallo')),
    ];
    this.rows = [];
  }
  async load() {
    try {
      this.rows = await Promise.all(this.loaders.map((fn) => fn()));
    } catch {
      this.rows = [];
    }
    this.requestUpdate();
  }
  render() {
    return html\`<p>\${this.rows.join(', ') || 'Sin datos'}</p>\`;
  }
}
customElements.define('city-board', CityBoard);`,
      tests: [sourceTest('lit38-d1', 'Usa allSettled para resultados independientes', String.raw`Promise\.allSettled\s*\(`), browserTest('lit38-d2', 'Conserva al menos la ciudad correcta', `async ({document,customElements})=>{await customElements.whenDefined('city-board');const el=document.querySelector('city-board');if(!el)return false;try{await el.load();}catch{return false;}return JSON.stringify(el.rows).includes('Bogotá');}`)],
      hints: ['Las operaciones son independientes.', 'allSettled no lanza por un rechazo individual.', 'Transforma fulfilled y rejected por separado.'] },
  }),
  lesson({
    number: 39, module: 14, title: 'SSR e hidratación: diseñar para dos entornos', appName: 'una ficha de producto segura para render de servidor e hidratación',
    summary: 'Distingue render de servidor, DOM disponible e hidratación para evitar componentes que solo funcionan después de cargar JavaScript.',
    concepts: [{ label: 'SSR', desc: 'Producción de HTML en servidor antes de ejecutar el cliente.' }, { label: 'Hidratación', desc: 'Conexión de lógica e interacción con un árbol ya renderizado.' }],
    skillsRequired: ['component-packaging', 'lit-native-lifecycle'], skillsIntroduced: ['lit-ssr', 'hydration-safety'],
    reasoningSteps: ['El servidor recibe datos serializables', 'Produce HTML significativo', 'El navegador conserva ese contenido', 'La hidratación conecta eventos sin cambiar el contrato'],
    html: appHtml('Producto', '<ssr-product-card name="Teclado" price="80"></ssr-product-card>'),
    example: `import { LitElement, html } from 'lit';
class UniversalGreeting extends LitElement {
  static properties = { name: { type: String } };
  constructor() {
    super();
    this.name = 'Visitante';
  }
  render() {
    return html\`<p>Hola, \${this.name}</p>\`;
  }
  connectedCallback() {
    super.connectedCallback();
    if (typeof window !== 'undefined') this.clientReady = true;
  }
}
customElements.define('universal-greeting', UniversalGreeting);`,
    starter: `import { LitElement, html } from 'lit';
class SsrProductCard extends LitElement {
  static properties = {
    name: { type: String },
    price: { type: Number },
    saved: { state: true },
  };
  constructor() {
    super();
    this.name = '';
    this.price = 0;
    this.saved = false;
  }
  connectedCallback() {
    super.connectedCallback(); /* trabajo exclusivo del navegador con guard explícito */
  }
  render() {
    /* contenido semántico completo desde propiedades y botón que hidrata la interacción */
  }
}
customElements.define('ssr-product-card', SsrProductCard);`,
    challengeTitle: 'App: componente universal por contrato', challengeInstructions: 'Renderiza nombre/precio sin depender de window y aísla el trabajo exclusivo del navegador detrás de un guard.',
    tests: [sourceTest('lit39-guard', 'El acceso de navegador está protegido', String.raw`typeof\s+window\s*!==\s*['"]undefined['"]`), browserTest('lit39-content', 'El contenido significativo existe antes de cualquier acción', `async ({document,customElements})=>{await customElements.whenDefined('ssr-product-card');const el=document.querySelector('ssr-product-card');await el.updateComplete;return el.shadowRoot.textContent.includes('Teclado')&&el.shadowRoot.textContent.includes('80')&&el.shadowRoot.querySelector('button');}`)],
    hints: ['render solo usa propiedades serializables.', 'window no existe en todos los entornos.', 'La acción saved mejora interacción, pero no entrega el contenido principal.'],
    model: 'SSR responde con significado; hidratación añade comportamiento. Un componente universal mantiene su render puro respecto al entorno y confina APIs del navegador al ciclo apropiado.',
    whenToUse: 'Considera SSR para contenido inicial, indexación o arranque; una herramienta interna totalmente cliente puede no justificarlo.',
    bestPractices: 'Usa datos serializables, evita efectos en render, protege globals, conserva HTML estable y mide si la hidratación aporta valor.',
    commonErrors: 'leer window en inicializadores, generar ids aleatorios durante render, depender de layout del cliente o producir HTML distinto entre entornos.',
    transfer: 'Audita un componente de fecha, ancho de pantalla y autenticación: marca qué puede renderizar el servidor.',
    sources: [source('Server-side rendering', 'https://lit.dev/docs/ssr/overview/', 'Comprende capacidades y límites de SSR.', 'Lit'), source('DOM environment', 'https://lit.dev/docs/ssr/dom-emulation/', 'Distingue APIs disponibles.', 'Lit'), source('Hydration', 'https://lit.dev/docs/ssr/client-usage/', 'Conecta el cliente.', 'Lit')],
    debug: { title: 'El componente lee window durante la definición de la clase', expected: 'viewport-card difiere la lectura y protege el entorno.', observed: 'Importar el módulo en servidor lanza ReferenceError.',
      starter: `import { LitElement, html } from 'lit';
const initialWidth = window.innerWidth;
class ViewportCard extends LitElement {
  constructor() {
    super();
    this.width = initialWidth;
  }
  render() {
    return html\`<p>Ancho: \${this.width}</p>\`;
  }
}
customElements.define('viewport-card', ViewportCard);`,
      tests: [browserTest('lit39-d0', 'En navegador muestra un ancho disponible', `async ({document,customElements})=>{await customElements.whenDefined('viewport-card');const el=document.querySelector('viewport-card');await el.updateComplete;return /Ancho:\s*\d+/.test(el.shadowRoot?.textContent||'');}`), sourceTest('lit39-d1', 'No lee window en el nivel del módulo', String.raw`typeof\s+window\s*!==\s*['"]undefined['"]`), sourceTest('lit39-d2', 'Conserva un fallback', String.raw`\?\?|\?\s*window\.`)],
      hints: ['El nivel del módulo también se ejecuta en servidor.', 'Comprueba si window existe antes de leerlo.', 'Define un valor seguro cuando no hay viewport.'] },
  }),
  lesson({
    number: 40, module: 15, title: 'Capstone profesional: sistema de soporte publicable', appName: 'un sistema de soporte accesible, probado y preparado para consumo externo',
    summary: 'Integra diseño de contratos, estado, servicios, asincronía, composición, accesibilidad, pruebas y empaquetado en cortes demostrables.',
    concepts: [{ label: 'Definition of Done', desc: 'Evidencia necesaria para considerar una capacidad usable y mantenible.' }, { label: 'Sistema de componentes', desc: 'Conjunto coherente de contratos, piezas y reglas de integración.' }],
    skillsRequired: ['lit-vertical-slices', 'lit-ssr', 'adapter-pattern', 'remote-state-machine'], skillsIntroduced: ['professional-capstone', 'integration-evidence'],
    reasoningSteps: ['SupportApp posee tickets', 'TicketService normaliza persistencia', 'Formulario y filas emiten intención', 'Pruebas recorren crear, filtrar, cerrar y recuperar error'],
    html: appHtml('Centro de soporte', '<support-center></support-center>'),
    example: `import { LitElement, html } from 'lit';
class InventoryApp extends LitElement {
  static properties = { items: { state: true } };
  constructor() {
    super();
    this.items = [];
  }
  add(name) {
    const clean = name.trim();
    if (!clean) return false;
    this.items = [
      ...this.items,
      { id: crypto.randomUUID(), name: clean, status: 'active' },
    ];
    return true;
  }
  render() {
    return html\`<button @click=\${() => this.add('Cable')}>Añadir</button>
      <p role="status">\${this.items.length} elementos</p>\`;
  }
}
customElements.define('inventory-app', InventoryApp);`,
    starter: `import { LitElement, html } from 'lit';
class TicketService {
  constructor(storage) {
    this.storage = storage;
  }
  async load() {
    /* normaliza y devuelve tickets */
  }
  async save(tickets) {
    /* persiste una copia */
  }
}
class SupportCenter extends LitElement {
  static properties = {
    tickets: { state: true },
    filter: { state: true },
    status: { state: true },
  };
  constructor() {
    super();
    this.tickets = [];
    this.filter = 'all';
    this.status = 'idle';
    this.service = new TicketService({ load: async () => [], save: async () => {} });
  }
  async connectedCallback() {
    super.connectedCallback(); /* carga con estados y recuperación */
  }
  async createTicket(title, priority) {
    /* valida, actualiza inmutable y persiste */
  }
  async closeTicket(id) {
    /* reemplaza ticket, persiste y conserva identidad */
  }
  get visibleTickets() {
    /* filtro derivado */
  }
  render() {
    /* formulario, filtros, estado remoto, resumen y lista accesible */
  }
}
customElements.define('support-center', SupportCenter);`,
    challengeTitle: 'Capstone: corte vertical listo para demostrar', challengeInstructions: 'Entrega crear/cerrar/filtrar/cargar con contratos, inmutabilidad, estados y semántica. Comprueba entradas inválidas y fallo del servicio.',
    tests: [browserTest('lit40-create', 'Crea y persiste un ticket válido', `async ({document,customElements})=>{await customElements.whenDefined('support-center');const el=document.querySelector('support-center');await el.createTicket('Acceso bloqueado',3);await el.updateComplete;return el.tickets.length===1&&el.tickets[0].priority===3&&el.shadowRoot?.textContent.includes('Acceso bloqueado');}`), browserTest('lit40-close', 'Cerrar reemplaza el ticket correcto', `async ({document})=>{const el=document.querySelector('support-center');const ticket=el.tickets[0];if(!ticket)return false;const before=ticket;await el.closeTicket(ticket.id);return before!==el.tickets[0]&&el.tickets[0].status==='closed';}`), browserTest('lit40-invalid', 'Rechaza títulos vacíos y prioridades inválidas', `async ({document})=>{const el=document.querySelector('support-center');const count=el.tickets.length;await el.createTicket(' ',8);return el.tickets.length===count;}`), sourceTest('lit40-ui', 'Expone filtros y estados accesibles', String.raw`role=['"]status['"][\s\S]*(?:select|radio|button)`)],
    hints: ['Termina primero el corte crear: regla, estado, persistencia y evidencia visible.', 'SupportCenter es dueño; el servicio solo carga y guarda el contrato normalizado.', 'Después añade cerrar y filtro sin romper el corte anterior.'],
    model: 'Un capstone profesional no es mucho código: es una cadena completa de decisiones que otra persona puede usar, probar, mantener y desplegar sin adivinar contratos ocultos.',
    whenToUse: 'Usa este enfoque para convertir requisitos amplios en incrementos verificables; un prototipo exploratorio puede aceptar evidencia más ligera, pero debe declararlo.',
    bestPractices: 'Escribe criterios observables, integra por cortes, prueba comportamiento público en navegador, documenta API y límites, y conserva estados de error accesibles.',
    commonErrors: 'construir todas las capas vacías, afirmar terminado por compilar, probar helpers sin interacción, ocultar errores o acoplar UI al almacenamiento.',
    transfer: 'Redacta la arquitectura y Definition of Done para museo, clima o inventario como proyecto de portafolio.',
    sources: [source('Components overview', 'https://lit.dev/docs/components/overview/', 'Revisa la arquitectura completa.', 'Lit'), source('Testing', 'https://lit.dev/docs/tools/testing/', 'Obtén evidencia en navegador.', 'Lit'), source('Publishing', 'https://lit.dev/docs/tools/publishing/', 'Prepara consumo externo.', 'Lit'), source('Accessibility', 'https://developer.mozilla.org/docs/Web/Accessibility', 'Verifica semántica e interacción.')],
    debug: { title: 'Guardar ocurre antes de actualizar y persiste la lista vieja', expected: 'project-board calcula next, asigna y guarda la misma versión.', observed: 'save recibe this.cards antes del cambio.',
      starter: `import { LitElement, html } from 'lit';
class ProjectBoard extends LitElement {
  constructor() {
    super();
    this.cards = [];
    this.storage = { save: async () => {} };
  }
  async add(title) {
    await this.storage.save(this.cards);
    this.cards = [...this.cards, { id: crypto.randomUUID(), title }];
  }
  render() {
    return html\`<p>\${this.cards.length}</p>\`;
  }
}
customElements.define('project-board', ProjectBoard);`,
      tests: [browserTest('lit40-d0', 'Guarda exactamente la colección que muestra', `async ({document,customElements})=>{await customElements.whenDefined('project-board');const el=document.querySelector('project-board');let saved=null;el.storage={save:async(cards)=>{saved=cards;}};await el.add('Mi tarjeta');await el.updateComplete;return saved===el.cards&&saved.length===1&&saved[0].title==='Mi tarjeta'&&el.shadowRoot?.textContent.includes('1');}`), sourceTest('lit40-d1', 'Calcula una próxima versión', String.raw`const\s+next\s*=`), sourceTest('lit40-d2', 'Guarda la misma versión asignada', String.raw`this\.cards\s*=\s*next[\s\S]*save\s*\(\s*next\s*\)|save\s*\(\s*next\s*\)[\s\S]*this\.cards\s*=\s*next`)],
      hints: ['Persistencia y UI deben referirse a la misma colección.', 'Calcula next una sola vez.', 'Usa next tanto para this.cards como para save.'] },
  }),
];
