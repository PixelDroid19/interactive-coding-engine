import { appHtml, browserTest, lesson, source } from './helpers';

const litText = (id: string, description: string, tag: string, selector: string, expected: string) => browserTest(id, description, `async ({document,customElements})=>{await customElements.whenDefined('${tag}');const el=document.querySelector('${tag}');if(el.updateComplete)await el.updateComplete;const root=el.shadowRoot??el;const node='${selector}'===':host'?root:root.querySelector('${selector}');return {passed:Boolean(node?.textContent?.includes('${expected}')),receivedValue:node?.textContent||''};}`);

const litDisabled = (id: string, tag: string) => browserTest(id, 'El botón se habilita y deshabilita según locked', `async ({document,customElements})=>{
  await customElements.whenDefined('${tag}');const el=document.createElement('${tag}');document.body.append(el);
  try {await el.updateComplete;
    for(const locked of [false,true,false]){el.locked=locked;el.requestUpdate();await el.updateComplete;const button=(el.shadowRoot??el).querySelector('button');
      if(!button||button.disabled!==locked||button.hasAttribute('disabled')!==locked)return false;
    }return true;
  } finally {el.remove();}
}`);

const litTemplate = (id: string, tag: string, selector: string, expected: string, price?: number) => browserTest(id, 'El template devuelto produce el contenido solicitado', `async ({document,customElements})=>{
  await customElements.whenDefined('${tag}');
  const current=document.querySelector('${tag}');if(!current||typeof current.render!=='function'||typeof current.requestUpdate!=='function'||typeof current.updateComplete?.then!=='function')return false;
  const [{LitElement,render:renderTemplate},{isTemplateResult,TemplateResultType}]=await Promise.all([import('lit'),import('lit/directive-helpers.js')]);
  const el=document.createElement('${tag}');if(!(el instanceof LitElement)||typeof el.render!=='function')return false;
  const render=el.render;let returnedValue;let part;
  const containsHtml=value=>isTemplateResult(value,TemplateResultType.HTML)||(Array.isArray(value)&&value.some(containsHtml));
  el.render=function(...args){returnedValue=render.apply(this,args);return returnedValue;};
  try {document.body.append(el);await el.updateComplete;if(!containsHtml(returnedValue))return false;
    const output=document.createDocumentFragment();part=renderTemplate(returnedValue,output,{host:el,isConnected:false});
    const text=output.querySelector('${selector}')?.textContent||'';if(!text.includes(${JSON.stringify(expected)}))return false;
    const price=${price ?? 'null'};if(price===null)return true;
    const amounts=[...text.matchAll(/\\$\\s*(\\d+(?:[.,]\\d+)?)/g)].map(match=>Number(match[1].replace(',','.')));
    return amounts.length===1&&amounts[0]===price;
  } finally {el.render=render;try{part?.setConnected(false);}finally{el.remove();}}
}`);

export const COMPONENT_SPECS_15_TO_20 = [
  lesson({
    number: 15, module: 5, title: 'Lit automatiza trabajo, no la plataforma', appName: 'una tarjeta de producto declarativa',
    summary: 'Relaciona LitElement con HTMLElement y reconoce qué tareas de actualización, template y estilo automatiza Lit.',
    concepts: [{ label: 'LitElement', desc: 'Clase base que añade reactividad y render declarativo a un custom element.' }, { label: 'Interoperabilidad', desc: 'El resultado sigue siendo una etiqueta HTML estándar.' }],
    skillsRequired: ['browser-component-testing', 'publishable-contract'], skillsIntroduced: ['lit-platform-bridge', 'lit-element-basics'],
    reasoningSteps: ['HTML crea product-card', 'El registro usa una subclase LitElement', 'Lit ejecuta render', 'El navegador muestra Shadow DOM estándar'],
    html: appHtml('Producto', '<product-card></product-card>'),
    example: `import { LitElement, html } from 'lit';
class WelcomeCard extends LitElement {
  render() {
    return html\`<article>
      <h2>Bienvenida</h2>
      <p>Tu espacio está listo.</p>
    </article>\`;
  }
}
customElements.define('welcome-card', WelcomeCard);`,
    starter: `import { LitElement, html } from 'lit';
class ProductCard extends LitElement {
  render() {
    // Devuelve un template con "Teclado" y "$80".
  }
}
customElements.define('product-card', ProductCard);`,
    challengeTitle: 'App: primera tarjeta Lit', challengeInstructions: 'Renderiza un article con nombre “Teclado” y precio “$80” usando html.',
    tests: [
      litText('lit15-name', 'La tarjeta renderiza el producto', 'product-card', 'article', 'Teclado'),
      browserTest('lit15-price', 'El mismo artículo contiene el precio de 80 dólares', `async ({document,customElements})=>{
        await customElements.whenDefined('product-card');const el=document.querySelector('product-card');await el.updateComplete;
        const article=(el.shadowRoot??el).querySelector('article');const text=article?.textContent||'';
        const amounts=[...text.matchAll(/\\$\\s*(\\d+(?:[.,]\\d+)?)/g)].map(match=>Number(match[1].replace(',','.')));
        return text.includes('Teclado')&&amounts.length===1&&amounts[0]===80;
      }`),
      litTemplate('lit15-template', 'product-card', 'article', 'Teclado', 80),
    ],
    hints: ['LitElement sigue registrándose con customElements.define.', 'render describe la vista y devuelve html, no modifica innerHTML.', 'La salida aparecerá en el shadow root que Lit prepara.'],
    model: 'Lit es una capa de automatización sobre la casa ya construida: sigue usando clases, custom elements, Shadow DOM, propiedades y eventos del navegador.',
    whenToUse: 'Úsalo cuando render y actualización reactiva reducirán código repetido; un custom element pequeño puede seguir siendo nativo.',
    bestPractices: 'Conserva contratos de plataforma, importa módulos explícitos y entiende el comportamiento nativo antes de atribuírselo a Lit.',
    commonErrors: 'creer que Lit reemplaza Web Components, llamar render a mano o copiar patrones de frameworks que contradicen atributos y eventos estándar.',
    transfer: 'Compara la implementación nativa y Lit de una tarjeta; enumera qué contrato externo permanece idéntico.',
    sources: [source('Qué es Lit', 'https://lit.dev/docs/', 'Relaciona Lit con Web Components.', 'Lit'), source('LitElement API', 'https://lit.dev/docs/api/LitElement/', 'Consulta la clase base.', 'Lit')],
    debug: { title: 'render modifica innerHTML y no devuelve template', expected: 'account-card renderiza con html.', observed: 'render devuelve undefined y escribe en el host equivocado.',
      starter: `import { LitElement, html } from 'lit';
class AccountCard extends LitElement {
  render() {
    this.innerHTML = '<p>Cuenta activa</p>';
  }
}
customElements.define('account-card', AccountCard);`,
      tests: [browserTest('lit15-d1', 'La cuenta aparece en Shadow DOM', `async ({document,customElements})=>{
        await customElements.whenDefined('account-card');const el=document.querySelector('account-card');await el.updateComplete;
        return Boolean(el.shadowRoot?.querySelector('p')?.textContent?.includes('Cuenta activa'));
      }`), litTemplate('lit15-d2', 'account-card', 'p', 'Cuenta activa')],
      hints: ['Lit llama render y espera un resultado.', 'No escribas el host con innerHTML.', 'Devuelve un template html.'] },
  }),
  lesson({
    number: 16, module: 5, title: 'Templates, bindings y seguridad', appName: 'un resumen de pedido con bindings correctos',
    summary: 'Elige binding de texto, atributo, booleano, propiedad o evento según el contrato del destino.',
    concepts: [{ label: 'Template expression', desc: 'Valor JavaScript insertado en una posición concreta del template.' }, { label: 'Binding', desc: 'Regla que conecta un valor con texto, atributo, propiedad o evento.' }],
    skillsRequired: ['lit-platform-bridge', 'lit-element-basics'], skillsIntroduced: ['lit-templates', 'lit-bindings'],
    reasoningSteps: ['render evalúa una expresión', 'La posición define el tipo de binding', 'Lit actualiza solo esa parte', 'El navegador conserva nodos estables'],
    html: appHtml('Pedido', '<order-summary></order-summary>'),
    example: `import { LitElement, html } from 'lit';
class UserGreeting extends LitElement {
  constructor() {
    super();
    this.name = 'Ana';
    this.disabled = false;
  }
  render() {
    return html\`<button ?disabled=\${this.disabled} title=\${'Abrir ' + this.name}>
      Hola, \${this.name}
    </button>\`;
  }
}
customElements.define('user-greeting', UserGreeting);`,
    starter: `import { LitElement, html } from 'lit';
class OrderSummary extends LitElement {
  constructor() {
    super();
    this.customer = 'Luis';
    this.total = 42;
    this.locked = true;
  }
  render() {
    // Muestra cliente y total; enlaza locked a disabled como booleano.
  }
}
customElements.define('order-summary', OrderSummary);`,
    challengeTitle: 'App: bindings del pedido', challengeInstructions: 'Muestra customer y total como texto: al inicio, “Luis” y “$42”. Enlaza locked al estado disabled del botón. Al cambiar los datos, la vista debe actualizarse sin interpretar el nombre como HTML.',
    tests: [
      browserTest('lit16-bindings', 'El pedido inicial muestra cliente, total y bloqueo', `async ({document,customElements})=>{
        await customElements.whenDefined('order-summary');const el=document.querySelector('order-summary');await el.updateComplete;const root=el.shadowRoot??el;const text=root.textContent||'';
        const amounts=[...text.matchAll(/\\$\\s*(\\d+(?:[.,]\\d+)?)/g)].map(match=>Number(match[1].replace(',','.')));
        return text.includes('Luis')&&amounts.length===1&&amounts[0]===42&&root.querySelector('button')?.disabled===true;
      }`),
      litDisabled('lit16-boolean', 'order-summary'),
      browserTest('lit16-text', 'Actualiza cliente y total sin interpretar el nombre como HTML', `async ({document,customElements})=>{
        await customElements.whenDefined('order-summary');const el=document.createElement('order-summary');document.body.append(el);
        try {await el.updateComplete;
          for(const state of [{customer:'Ada',total:0},{customer:'<em data-customer-probe>Nora</em>',total:73.5},{customer:'Sol & Mar',total:9}]){
            el.customer=state.customer;el.total=state.total;el.requestUpdate();await el.updateComplete;const root=el.shadowRoot??el;const text=root.textContent||'';
            const amounts=[...text.matchAll(/\\$\\s*(\\d+(?:[.,]\\d+)?)/g)].map(match=>Number(match[1].replace(',','.')));
            if(!text.includes(state.customer)||amounts.length!==1||amounts[0]!==state.total||root.querySelector('[data-customer-probe]'))return false;
          }return true;
        } finally {el.remove();}
      }`),
    ],
    hints: ['El texto usa una expresión en el contenido.', 'disabled no necesita el string "true".', 'El prefijo ? controla presencia booleana.'],
    model: 'Cada expresión tiene un enchufe distinto: texto llena contenido, .propiedad entrega datos ricos, ?booleano controla presencia, @evento conecta comportamiento.',
    whenToUse: 'Elige el binding por la API del nodo receptor, no por cómo luce el valor en JavaScript.',
    bestPractices: 'Deja que Lit escape texto, evita unsafeHTML con datos externos y mantén cálculos complejos fuera del template.',
    commonErrors: 'usar atributo para objetos, escribir disabled="false", interpolar listeners como texto o construir HTML con strings no confiables.',
    transfer: 'Clasifica bindings para input.value, aria-label, disabled, click y una propiedad items.',
    sources: [source('Templates', 'https://lit.dev/docs/templates/overview/', 'Aprende posiciones y expresiones.', 'Lit'), source('Expressions', 'https://lit.dev/docs/templates/expressions/', 'Compara bindings.', 'Lit')],
    debug: { title: 'false deja el botón desactivado', expected: 'permission-button queda habilitado cuando locked=false y se desactiva cuando locked=true, también después de cambiar el valor.', observed: 'Usa disabled="false" como atributo presente.',
      starter: `import { LitElement, html } from 'lit';
class PermissionButton extends LitElement {
  constructor() {
    super();
    this.locked = false;
  }
  render() {
    return html\`<button disabled="\${this.locked}">Continuar</button>\`;
  }
}
customElements.define('permission-button', PermissionButton);`,
      tests: [browserTest('lit16-d1', 'El botón comienza habilitado con locked=false', `async ({document,customElements})=>{await customElements.whenDefined('permission-button');const el=document.querySelector('permission-button');await el.updateComplete;const button=(el.shadowRoot??el).querySelector('button');return Boolean(button)&&!button.disabled;}`), litDisabled('lit16-d2', 'permission-button')],
      hints: ['Un atributo presente activa disabled.', 'No serialices false.', 'Usa el binding booleano de Lit.'] },
  }),
  lesson({
    number: 17, module: 5, title: 'Condicionales, listas y ausencia', appName: 'un panel de sesión con estados completos',
    summary: 'Renderiza ramas y colecciones desde datos sin confundir vacío, carga, error y contenido ausente.',
    concepts: [{ label: 'Render condicional', desc: 'Elegir un template según estado.' }, { label: 'nothing', desc: 'Valor que indica que no debe renderizarse contenido.' }],
    skillsRequired: ['lit-templates', 'lit-bindings'], skillsIntroduced: ['lit-conditionals', 'lit-lists'],
    reasoningSteps: ['El estado selecciona una rama', 'La rama produce un template', 'map produce templates de filas', 'nothing evita nodos innecesarios'],
    html: appHtml('Sesión', '<session-panel></session-panel>'),
    example: `import { LitElement, html, nothing } from 'lit';
class InboxPreview extends LitElement {
  constructor() {
    super();
    this.messages = ['Hola'];
    this.showTitle = true;
  }
  render() {
    return html\`\${this.showTitle ? html\`<h2>Bandeja</h2>\` : nothing}
      <ul>
        \${this.messages.map((m) => html\`<li>\${m}</li>\`)}
      </ul>\`;
  }
}
customElements.define('inbox-preview', InboxPreview);`,
    starter: `import { LitElement, html, nothing } from 'lit';
class SessionPanel extends LitElement {
  constructor() {
    super();
    this.user = null;
    this.notifications = [];
  }
  render() {
    // Sin user muestra "Inicia sesión"; con user muestra su nombre y una lista o "Sin notificaciones".
  }
}
customElements.define('session-panel', SessionPanel);`,
    challengeTitle: 'App: panel con ramas completas', challengeInstructions: 'Renderiza los estados sin sesión, sesión vacía y sesión con notificaciones.',
    tests: [
      litText('lit17-empty', 'Sin usuario ofrece iniciar sesión', 'session-panel', ':host', 'Inicia sesión'),
      browserTest('lit17-session-empty', 'Con sesión y sin avisos explica el estado vacío', `async ({document,customElements})=>{
        await customElements.whenDefined('session-panel');const el=document.createElement('session-panel');document.body.append(el);
        try {await el.updateComplete;el.user={name:'Mara'};el.notifications=[];el.requestUpdate();await el.updateComplete;
          const root=el.shadowRoot??el;const text=root.textContent||'';
          return text.includes('Mara')&&text.includes('Sin notificaciones')&&!text.includes('Inicia sesión')&&root.querySelectorAll('li').length===0;
        } finally {el.remove();}
      }`),
      browserTest('lit17-list', 'Actualiza nombre, avisos y ramas al cambiar la sesión', `async ({document,customElements})=>{
        await customElements.whenDefined('session-panel');const el=document.createElement('session-panel');document.body.append(el);
        try {await el.updateComplete;
          for(const state of [{user:{name:'Mara'},notifications:['Pago','Envío']},{user:{name:'Nora'},notifications:['Entrega confirmada']},{user:{name:'Nora'},notifications:[]},{user:null,notifications:[]}]){
            el.user=state.user;el.notifications=state.notifications;el.requestUpdate();await el.updateComplete;
            const root=el.shadowRoot??el;const text=root.textContent||'';const rows=[...root.querySelectorAll('li')].map(row=>row.textContent.trim());
            if(!state.user){if(!text.includes('Inicia sesión')||text.includes('Nora')||text.includes('Sin notificaciones')||rows.length)return false;}
            else {if(!text.includes(state.user.name)||text.includes('Inicia sesión')||(state.user.name==='Nora'&&text.includes('Mara')))return false;
              if(rows.length!==state.notifications.length||rows.some((row,index)=>row!==state.notifications[index]))return false;
              if(state.notifications.length?text.includes('Sin notificaciones'):!text.includes('Sin notificaciones'))return false;}
          }return true;
        } finally {el.remove();}
      }`),
    ],
    hints: ['Decide primero la rama de sesión.', 'Dentro de la sesión decide vacío o lista.', 'map devuelve un template por elemento.'],
    model: 'El template es una tabla de decisiones visible: cada estado válido necesita una salida, incluida la ausencia intencional.',
    whenToUse: 'Usa ternarios para dos ramas locales, funciones para decisiones con nombre y map para listas pequeñas sin identidad compleja.',
    bestPractices: 'Modela estados exhaustivos, añade claves con repeat cuando importe identidad y evita cadenas largas de operadores en el template.',
    commonErrors: 'tratar [] como falsy, mostrar nada durante errores o usar && con valores como 0 que terminan visibles.',
    transfer: 'Diseña ramas para carrito: loading, error, empty y ready con artículos.',
    sources: [source('Conditionals', 'https://lit.dev/docs/templates/conditionals/', 'Compara ternario, nothing y when.', 'Lit'), source('Lists', 'https://lit.dev/docs/templates/lists/', 'Renderiza colecciones.', 'Lit')],
    debug: { title: 'El cero aparece como contenido extraño', expected: 'cart-count muestra “Sin artículos” cuando count=0.', observed: 'Usa count && template y deja 0 en pantalla.',
      starter: `import { LitElement, html } from 'lit';
class CartCount extends LitElement {
  constructor() {
    super();
    this.count = 0;
  }
  render() {
    return html\`<div>
      \${this.count && html\`<strong>\${this.count} artículos</strong>\`}
    </div>\`;
  }
}
customElements.define('cart-count', CartCount);`,
      tests: [litText('lit17-d1', 'Cero tiene una rama humana', 'cart-count', 'div', 'Sin artículos'), browserTest('lit17-d2', 'La vista cambia entre cantidad y ausencia de artículos', `async ({document,customElements})=>{
        await customElements.whenDefined('cart-count');const el=document.createElement('cart-count');document.body.append(el);
        try {await el.updateComplete;
          for(const count of [2,5,0]){el.count=count;el.requestUpdate();await el.updateComplete;const root=el.shadowRoot??el;const text=(root.textContent||'').replace(/\\s+/g,' ').trim();
            const quantities=[...text.matchAll(/(\\d+)\\s+artículos\\b/g)].map(match=>Number(match[1]));
            if(count===0){if(!text.includes('Sin artículos')||quantities.length||/\\b0\\b/.test(text))return false;}
            else if(quantities.length!==1||quantities[0]!==count||text.includes('Sin artículos'))return false;
          }return true;
        } finally {el.remove();}
      }`)],
      hints: ['0 es un dato válido, no ausencia.', 'Escribe las dos salidas.', 'Un ternario hace explícito el caso vacío.'] },
  }),
  lesson({
    number: 18, module: 6, title: 'Propiedades reactivas y atributos', appName: 'una ficha configurable desde HTML y JavaScript',
    summary: 'Declara propiedades públicas en JavaScript, entiende conversión de atributos y diseña opciones sin decoradores.',
    concepts: [{ label: 'Propiedad reactiva', desc: 'Propiedad cuyo cambio programa una actualización.' }, { label: 'static properties', desc: 'Declaración JavaScript del contrato reactivo.' }],
    skillsRequired: ['lit-conditionals', 'lit-lists'], skillsIntroduced: ['lit-reactive-properties', 'lit-attribute-conversion'],
    reasoningSteps: ['El consumidor cambia una propiedad', 'El setter reactivo detecta diferencia', 'Lit programa una actualización', 'render recibe el nuevo valor'],
    html: appHtml('Ficha', '<user-chip name="Ada" online></user-chip>'),
    example: `import { LitElement, html } from 'lit';
class StockBadge extends LitElement {
  static properties = { count: { type: Number }, label: { type: String } };
  constructor() {
    super();
    this.count = 0;
    this.label = 'Stock';
  }
  render() {
    return html\`<span>\${this.label}: \${this.count}</span>\`;
  }
}
customElements.define('stock-badge', StockBadge);`,
    starter: `import { LitElement, html } from 'lit';
class UserChip extends LitElement {
  static properties = {};
  constructor() {
    super();
    // Declara e inicializa el contrato público.
  }
  render() {
    return html\`<span>Completa la ficha</span>\`;
  }
}
customElements.define('user-chip', UserChip);`,
    challengeTitle: 'App: ficha reactiva', challengeInstructions: 'Declara name y online, inicializa un nombre por defecto y online en false, y muestra “Ada — En línea” desde los atributos. La ficha debe actualizar el nombre y el estado al cambiar las propiedades o añadir/quitar atributos, sin llamar render manualmente.',
    tests: [browserTest('lit18-attr', 'Los atributos actualizan nombre y presencia de online', `async ({document,customElements})=>{
      await customElements.whenDefined('user-chip');const el=document.createElement('user-chip');
      if(typeof el.updateComplete?.then!=='function')return false;
      try {el.setAttribute('name','Ada');el.setAttribute('online','');document.body.append(el);await el.updateComplete;
        const text=()=>(el.shadowRoot??el).querySelector('span')?.textContent?.replace(/\\s+/g,' ').trim()||'';
        if(el.name!=='Ada'||el.online!==true||text()!=='Ada — En línea')return false;
        el.setAttribute('name','Mara');el.removeAttribute('online');await el.updateComplete;
        if(el.name!=='Mara'||el.online!==false||!text().includes('Mara')||text().includes('En línea'))return false;
        el.setAttribute('name','Sol');el.setAttribute('online','false');await el.updateComplete;
        return el.name==='Sol'&&el.online===true&&text()==='Sol — En línea';
      } finally {el.remove();}
    }`), browserTest('lit18-properties', 'Los defaults y cambios de propiedades llegan a la vista', `async ({document,customElements})=>{
      await customElements.whenDefined('user-chip');const el=document.createElement('user-chip');
      if(typeof el.updateComplete?.then!=='function')return false;
      try {document.body.append(el);await el.updateComplete;if(typeof el.name!=='string'||el.online!==false)return false;
        for(const [name,online] of [['Nora',true],['Leo',true],['Leo',false],['Inés',false],['Inés',true]]){
          el.name=name;el.online=online;await el.updateComplete;
          const text=(el.shadowRoot??el).querySelector('span')?.textContent?.replace(/\\s+/g,' ').trim()||'';
          if(online?text!==name+' — En línea':!text.includes(name)||text.includes('En línea'))return false;
        }return true;
      } finally {el.remove();}
    }`) ],
    hints: ['En JavaScript del curso usamos static properties, no decoradores.', 'El tipo Boolean interpreta presencia del atributo.', 'Inicializa defaults después de super().'],
    model: 'Lit instala sensores en propiedades declaradas: al cambiar una referencia, programa una actualización y render vuelve a describir la vista.',
    whenToUse: 'Declara como pública la entrada que el consumidor debe controlar; no publiques detalles internos solo para hacerlos reactivos.',
    bestPractices: 'Usa tipos simples para atributos, defaults en constructor y nombres de atributo estables.',
    commonErrors: 'usar campos de clase que ocultan accessors, reflejar sin necesidad o tratar objetos como atributos strings.',
    transfer: 'Diseña propiedades de product-card: product objeto, selected booleano y currency string.',
    sources: [source('Reactive properties', 'https://lit.dev/docs/components/properties/', 'Revisa JavaScript static properties y conversores.', 'Lit')],
    debug: { title: 'El contador cambia pero no actualiza', expected: 'live-counter muestra 2 después de increment.', observed: 'count no está declarado como reactivo.',
      starter: `import { LitElement, html } from 'lit';
class LiveCounter extends LitElement {
  constructor() {
    super();
    this.count = 1;
  }
  increment() {
    this.count += 1;
  }
  render() {
    return html\`<span>\${this.count}</span>\`;
  }
}
customElements.define('live-counter', LiveCounter);`,
      tests: [browserTest('lit18-d1', 'Cada incremento actualiza el número exacto', `async ({document,customElements})=>{
        await customElements.whenDefined('live-counter');const el=document.createElement('live-counter');
        if(typeof el.updateComplete?.then!=='function'||typeof el.increment!=='function')return false;
        try {document.body.append(el);await el.updateComplete;
          const matches=value=>el.count===value&&(el.shadowRoot??el).querySelector('span')?.textContent?.trim()===String(value);
          if(!matches(1))return false;
          for(const value of [2,3,4]){el.increment();await el.updateComplete;if(!matches(value))return false;}return true;
        } finally {el.remove();}
      }`), browserTest('lit18-d2', 'Cambiar count directamente también actualiza la vista', `async ({document,customElements})=>{
        await customElements.whenDefined('live-counter');const el=document.createElement('live-counter');
        if(typeof el.updateComplete?.then!=='function')return false;
        try {document.body.append(el);await el.updateComplete;
          for(const count of [7,0,12]){el.count=count;await el.updateComplete;
            if((el.shadowRoot??el).querySelector('span')?.textContent?.trim()!==String(count))return false;
          }return true;
        } finally {el.remove();}
      }`) ],
      hints: ['Cambiar una propiedad común no avisa a Lit.', 'Declara el contrato reactivo.', 'No llames render manualmente.'] },
  }),
  lesson({
    number: 19, module: 6, title: 'Estado interno y fronteras de API', appName: 'un contador de inventario con entradas y detalles separados',
    summary: 'Distingue propiedades públicas de estado interno reactivo y evita convertir cada detalle en API.',
    concepts: [{ label: 'API pública', desc: 'Entradas que controla quien consume el componente.' }, { label: 'Estado interno', desc: 'Dato reactivo que solo administra la implementación.' }],
    skillsRequired: ['lit-reactive-properties', 'lit-attribute-conversion'], skillsIntroduced: ['lit-internal-state', 'api-boundaries'],
    reasoningSteps: ['El consumidor fija capacity', 'El componente administra _reserved', 'Ambos cambios programan render', 'Solo capacity aparece como API'],
    html: appHtml('Inventario', '<inventory-counter capacity="5"></inventory-counter>'),
    example: `import { LitElement, html } from 'lit';
class DownloadButton extends LitElement {
  static properties = { url: { type: String }, _progress: { state: true } };
  constructor() {
    super();
    this.url = '';
    this._progress = 0;
  }
  render() {
    return html\`<button>\${this._progress}%</button>\`;
  }
}
customElements.define('download-button', DownloadButton);`,
    starter: `import { LitElement, html } from 'lit';
class InventoryCounter extends LitElement {
  static properties = { capacity: { type: Number } };
  constructor() {
    super();
    this.capacity = 0;
    // Inicializa aquí el estado que solo pertenece al componente.
  }
  reserve() {
    // Cambia el estado interno sin superar capacity.
  }
  render() {
    return html\`<button @click=\${() => this.reserve()}>Reservar</button>
      <span>Disponibilidad pendiente</span>\`;
  }
}
customElements.define('inventory-counter', InventoryCounter);`,
    challengeTitle: 'App: inventario con frontera clara', challengeInstructions: 'Mantén capacity pública y _reserved interna; muestra “Disponibles: N” y limita reservas.',
    tests: [browserTest('lit19-state', 'Las reservas se actualizan y respetan el límite', `async ({document,customElements})=>{
      await customElements.whenDefined('inventory-counter');
      for(const capacity of [0,2,5]){const el=document.createElement('inventory-counter');if(typeof el.updateComplete?.then!=='function')return false;
        try {el.setAttribute('capacity',String(capacity));document.body.append(el);await el.updateComplete;
          const matches=reserved=>el.capacity===capacity&&el._reserved===reserved&&!el.hasAttribute('_reserved')&&(el.shadowRoot??el).querySelector('span')?.textContent?.trim()==='Disponibles: '+(capacity-reserved);
          if(!matches(0))return false;
          for(let attempt=1;attempt<=capacity+2;attempt++){const button=(el.shadowRoot??el).querySelector('button');if(!button)return false;button.click();await el.updateComplete;if(!matches(Math.min(attempt,capacity)))return false;}
        } finally {el.remove();}
      }return true;
    }`), browserTest('lit19-private', 'Solo capacity es una entrada y las reservas son estado interno', `async ({document,customElements})=>{
      await customElements.whenDefined('inventory-counter');const el=document.createElement('inventory-counter');
      if(typeof el.updateComplete?.then!=='function'||typeof el.reserve!=='function')return false;
      try {el.setAttribute('capacity','2');document.body.append(el);await el.updateComplete;
        if(el.constructor.getPropertyOptions?.('_reserved')?.state!==true||(el.constructor.observedAttributes||[]).includes('_reserved'))return false;
        const matches=available=>(el.shadowRoot??el).querySelector('span')?.textContent?.trim()==='Disponibles: '+available;
        if(el._reserved!==0||!matches(2))return false;
        el.setAttribute('_reserved','99');await el.updateComplete;if(el._reserved!==0||!matches(2))return false;
        el.removeAttribute('_reserved');await el.updateComplete;
        el.capacity=4;await el.updateComplete;if(el.capacity!==4||!matches(4))return false;
        el.reserve();await el.updateComplete;if(el.capacity!==4||el._reserved!==1||!matches(3)||el.hasAttribute('_reserved'))return false;
        el.setAttribute('capacity','5');await el.updateComplete;return el.capacity===5&&el._reserved===1&&matches(4);
      } finally {el.remove();}
    }`) ],
    hints: ['capacity llega de fuera; _reserved nace y cambia dentro.', 'state:true actualiza sin crear atributo.', 'Disponible se deriva, no necesita otra propiedad.'],
    model: 'La API pública es el tablero que usa el conductor; el estado interno es el mecanismo bajo el capó. Ambos reaccionan, pero solo uno se promete al consumidor.',
    whenToUse: 'Usa estado interno para interacción, caché visual y datos derivados que el consumidor no debe configurar.',
    bestPractices: 'Minimiza API, marca estado con state:true y evita reflejar nombres internos.',
    commonErrors: 'publicar todo, guardar datos derivados duplicados o permitir que el componente sobrescriba entradas sin avisar.',
    transfer: 'Clasifica query, results, loading, selectedId y pageSize como entrada, salida, interno o derivado.',
    sources: [source('Public properties and internal state', 'https://lit.dev/docs/components/properties/#public-properties-and-internal-state', 'Diseña fronteras.', 'Lit')],
    debug: { title: 'El spinner expone loading como atributo', expected: 'data-panel mantiene _loading interno.', observed: 'loading se refleja y el exterior parece dueño.',
      starter: `import { LitElement, html } from 'lit';
class DataPanel extends LitElement {
  static properties = { loading: { type: Boolean, reflect: true } };
  constructor() {
    super();
    this.loading = true;
  }
  render() {
    return html\`<p>\${this.loading ? 'Cargando' : 'Listo'}</p>\`;
  }
}
customElements.define('data-panel', DataPanel);`,
      tests: [browserTest('lit19-d0', 'La carga empieza sin publicar un atributo', `async ({document,customElements})=>{
        await customElements.whenDefined('data-panel');const el=document.createElement('data-panel');if(typeof el.updateComplete?.then!=='function')return false;
        try {document.body.append(el);await el.updateComplete;return el._loading===true&&!el.hasAttribute('loading')&&!el.hasAttribute('_loading')&&(el.shadowRoot??el).querySelector('p')?.textContent?.trim()==='Cargando';}finally{el.remove();}
      }`), browserTest('lit19-d1', 'El estado interno cambia entre Cargando y Listo', `async ({document,customElements})=>{
        await customElements.whenDefined('data-panel');const el=document.createElement('data-panel');if(typeof el.updateComplete?.then!=='function')return false;
        try {document.body.append(el);await el.updateComplete;if(el.constructor.getPropertyOptions?.('_loading')?.state!==true)return false;
          for(const loading of [false,true,false]){el._loading=loading;await el.updateComplete;
            if((el.shadowRoot??el).querySelector('p')?.textContent?.trim()!==(loading?'Cargando':'Listo')||el.hasAttribute('loading')||el.hasAttribute('_loading'))return false;
          }return true;
        }finally{el.remove();}
      }`), browserTest('lit19-d2', 'Los atributos no controlan el proceso de carga', `async ({document,customElements})=>{
        await customElements.whenDefined('data-panel');const el=document.createElement('data-panel');if(typeof el.updateComplete?.then!=='function')return false;
        try {document.body.append(el);await el.updateComplete;
          const observed=el.constructor.observedAttributes||[];if(observed.includes('loading')||observed.includes('_loading'))return false;
          for(const attribute of ['loading','_loading']){el.setAttribute(attribute,'false');await el.updateComplete;
            if(el._loading!==true||(el.shadowRoot??el).querySelector('p')?.textContent?.trim()!=='Cargando')return false;
            el.removeAttribute(attribute);await el.updateComplete;if(el._loading!==true)return false;
          }return true;
        }finally{el.remove();}
      }`) ],
      hints: ['La carga pertenece al proceso interno.', 'Renombra y declara state:true.', 'Actualiza render para leer la misma fuente.'] },
  }),
  lesson({
    number: 20, module: 6, title: 'Arrays inmutables y actualización por referencia', appName: 'un tablero de tareas que siempre se actualiza',
    summary: 'Reemplaza arrays y objetos al cambiar estado para que Lit detecte nuevas referencias y mantenga identidad.',
    concepts: [{ label: 'Inmutabilidad', desc: 'Crear un valor nuevo en vez de alterar el recibido.' }, { label: 'Detección de cambio', desc: 'Comparación que decide si se programa update.' }],
    skillsRequired: ['lit-internal-state', 'api-boundaries'], skillsIntroduced: ['lit-immutable-data', 'lit-change-detection'],
    reasoningSteps: ['Una acción describe el cambio', 'Crea un array nuevo', 'El setter detecta nueva referencia', 'Lit renderiza la colección'],
    html: appHtml('Tareas', '<task-board></task-board>'),
    example: `import { LitElement, html } from 'lit';
class TagEditor extends LitElement {
  static properties = { tags: { state: true } };
  constructor() {
    super();
    this.tags = ['web'];
  }
  add(tag) {
    this.tags = [...this.tags, tag];
  }
  render() {
    return html\`<ul>
      \${this.tags.map((t) => html\`<li>\${t}</li>\`)}
    </ul>\`;
  }
}
customElements.define('tag-editor', TagEditor);`,
    starter: `import { LitElement, html } from 'lit';
class TaskBoard extends LitElement {
  static properties = { tasks: { state: true } };
  constructor() {
    super();
    this.tasks = [{ id: 1, text: 'Leer' }];
  }
  addTask(text) {
    /* crea array nuevo con id y texto */
  }
  complete(id) {
    /* crea array nuevo cambiando solo esa tarea */
  }
  render() {
    return html\`<ul>
      \${this.tasks.map((task) => html\`<li>\${task.text} \${task.done ? '✓' : ''}</li>\`)}
    </ul>\`;
  }
}
customElements.define('task-board', TaskBoard);`,
    challengeTitle: 'App: tablero inmutable', challengeInstructions: 'Implementa addTask y complete creando un array nuevo, sin modificar el array anterior ni sus objetos. Cada tarea nueva debe conservar el texto recibido y tener un id propio. Al completar, reemplaza solo la tarea del id indicado y conserva las referencias de las demás; un id inexistente no cambia las tareas.',
    tests: [browserTest('lit20-add', 'Agregar conserva los datos anteriores y añade el texto recibido', `async ({document,customElements})=>{
      await customElements.whenDefined('task-board');const el=document.createElement('task-board');
      if(typeof el.updateComplete?.then!=='function'||typeof el.addTask!=='function')return false;
      try {document.body.append(el);await el.updateComplete;
        if(!Array.isArray(el.tasks)||el.tasks.length!==1||el.tasks[0]?.text!=='Leer')return false;
        for(const text of ['Practicar','Repasar y enseñar']){
          const before=el.tasks;const saved=before.map(task=>({ref:task,id:task.id,text:task.text,done:task.done}));
          el.addTask(text);await el.updateComplete;const after=el.tasks;
          if(!Array.isArray(after)||after===before||after.length!==saved.length+1||before.length!==saved.length)return false;
          if(saved.some((task,index)=>before[index]!==task.ref||task.ref.id!==task.id||task.ref.text!==task.text||task.ref.done!==task.done||after[index]!==task.ref))return false;
          const added=after[after.length-1];if(!added||added.text!==text||added.done)return false;
          const ids=after.map(task=>task?.id);if(ids.some(id=>!(typeof id==='string'&&id.length>0)&&!(typeof id==='number'&&Number.isFinite(id)))||new Set(ids).size!==ids.length)return false;
          const rows=[...(el.shadowRoot??el).querySelectorAll('li')].map(row=>row.textContent.trim());
          if(rows.length!==after.length||rows.some((row,index)=>row!==after[index].text))return false;
        }return true;
      } finally {el.remove();}
    }`), browserTest('lit20-complete', 'Completar cambia solo el id pedido sin mutar datos anteriores', `async ({document,customElements})=>{
      await customElements.whenDefined('task-board');const el=document.createElement('task-board');
      if(typeof el.updateComplete?.then!=='function'||typeof el.complete!=='function')return false;
      try {document.body.append(el);await el.updateComplete;
        el.tasks=[{id:11,text:'Leer'},{id:23,text:'Practicar'},{id:37,text:'Revisar'}];await el.updateComplete;
        for(const id of [23,11,999]){
          const before=el.tasks;const saved=before.map(task=>({ref:task,id:task.id,text:task.text,done:task.done}));
          const target=saved.findIndex(task=>task.id===id);el.complete(id);await el.updateComplete;const after=el.tasks;
          if(!Array.isArray(after)||after.length!==saved.length||before.length!==saved.length||(target>=0&&after===before))return false;
          if(saved.some((task,index)=>before[index]!==task.ref||task.ref.id!==task.id||task.ref.text!==task.text||task.ref.done!==task.done))return false;
          for(let index=0;index<saved.length;index++){const current=after[index],previous=saved[index];
            if(!current||current.id!==previous.id||current.text!==previous.text)return false;
            if(index===target){if(current===previous.ref||current.done!==true)return false;}
            else if(current!==previous.ref||current.done!==previous.done)return false;
          }
          const rows=[...(el.shadowRoot??el).querySelectorAll('li')].map(row=>row.textContent.replace(/\\s+/g,' ').trim());
          if(rows.length!==after.length||rows.some((row,index)=>row!==after[index].text+(after[index].done?' ✓':'')))return false;
        }return true;
      } finally {el.remove();}
    }`)],
    hints: ['Lit compara la referencia del array.', 'spread agrega sin mutar; map reemplaza un elemento por id.', 'También crea un objeto nuevo para la tarea modificada.'],
    model: 'Una referencia nueva es un sobre nuevo que avisa del cambio. Editar silenciosamente el contenido del mismo sobre puede pasar desapercibido.',
    whenToUse: 'Prefiere actualizaciones inmutables en estado reactivo, especialmente cuando datos pasan entre componentes.',
    bestPractices: 'Usa identidad estable, operaciones puras y evita requestUpdate como parche habitual para mutaciones.',
    commonErrors: 'push seguido de ninguna actualización, mutar objetos compartidos o usar índice como identidad duradera.',
    transfer: 'Implementa mentalmente editar y eliminar una fila conservando referencias de las filas no afectadas.',
    sources: [source('Mutating object and array properties', 'https://lit.dev/docs/components/properties/#mutating-object-and-array-properties', 'Compara estrategias.', 'Lit')],
    debug: { title: 'push no despierta el render', expected: 'note-list muestra Segunda.', observed: 'Muta el mismo array.',
      starter: `import { LitElement, html } from 'lit';
class NoteList extends LitElement {
  static properties = { notes: { state: true } };
  constructor() {
    super();
    this.notes = ['Primera'];
  }
  add() {
    this.notes.push('Segunda');
  }
  render() {
    return html\`\${this.notes.map((n) => html\`<p>\${n}</p>\`)}\`;
  }
}
customElements.define('note-list', NoteList);`,
      tests: [browserTest('lit20-d1', 'Cada llamada añade Segunda y actualiza las filas', `async ({document,customElements})=>{
        await customElements.whenDefined('note-list');const el=document.createElement('note-list');
        if(typeof el.updateComplete?.then!=='function'||typeof el.add!=='function')return false;
        try {document.body.append(el);await el.updateComplete;const expected=['Primera'];
          const matches=()=>{const rows=[...(el.shadowRoot??el).querySelectorAll('p')].map(row=>row.textContent.trim());return rows.length===expected.length&&rows.every((row,index)=>row===expected[index]);};
          if(!matches())return false;for(let count=0;count<2;count++){el.add();await el.updateComplete;expected.push('Segunda');if(!matches())return false;}return true;
        }finally{el.remove();}
      }`), browserTest('lit20-d2', 'Agregar reemplaza notes sin modificar el array anterior', `async ({document,customElements})=>{
        await customElements.whenDefined('note-list');const el=document.createElement('note-list');
        if(typeof el.updateComplete?.then!=='function'||typeof el.add!=='function')return false;
        try {document.body.append(el);await el.updateComplete;if(!Array.isArray(el.notes))return false;
          for(let count=0;count<2;count++){const before=el.notes;const saved=before.slice();el.add();await el.updateComplete;
            if(!Array.isArray(el.notes)||el.notes===before||before.length!==saved.length||before.some((note,index)=>note!==saved[index])||el.notes.length!==saved.length+1)return false;
            if(saved.some((note,index)=>el.notes[index]!==note)||el.notes[el.notes.length-1]!=='Segunda')return false;
          }return true;
        }finally{el.remove();}
      }`) ],
      hints: ['push conserva la referencia.', 'Asigna un array nuevo.', 'No llames requestUpdate para ocultar la mutación.'] },
  }),
];
