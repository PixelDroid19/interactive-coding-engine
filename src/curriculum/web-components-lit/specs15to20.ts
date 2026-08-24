import { appHtml, browserTest, lesson, source, sourceTest } from './helpers';

const litText = (id: string, description: string, tag: string, selector: string, expected: string) => browserTest(id, description, `async ({document,customElements})=>{await customElements.whenDefined('${tag}');const el=document.querySelector('${tag}');if(el.updateComplete)await el.updateComplete;const node=el.shadowRoot?.querySelector('${selector}')||el.querySelector('${selector}');return {passed:Boolean(node?.textContent?.includes('${expected}')),receivedValue:node?.textContent||''};}`);

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
  render(){return html\`<article><h2>Bienvenida</h2><p>Tu espacio está listo.</p></article>\`;}
}
customElements.define('welcome-card',WelcomeCard);`,
    starter: `import { LitElement, html } from 'lit';
class ProductCard extends LitElement {
  render(){
    // Devuelve un template con "Teclado" y "$80".
  }
}
customElements.define('product-card',ProductCard);`,
    challengeTitle: 'App: primera tarjeta Lit', challengeInstructions: 'Renderiza un article con nombre “Teclado” y precio “$80” usando html.',
    tests: [litText('lit15-name', 'La tarjeta renderiza el producto', 'product-card', 'article', 'Teclado'), sourceTest('lit15-template', 'Usa un template Lit', String.raw`return\s+html\s*\``)],
    hints: ['LitElement sigue registrándose con customElements.define.', 'render describe la vista y devuelve html, no modifica innerHTML.', 'La salida aparecerá en el shadow root que Lit prepara.'],
    model: 'Lit es una capa de automatización sobre la casa ya construida: sigue usando clases, custom elements, Shadow DOM, propiedades y eventos del navegador.',
    whenToUse: 'Úsalo cuando render y actualización reactiva reducirán código repetido; un custom element pequeño puede seguir siendo nativo.',
    bestPractices: 'Conserva contratos de plataforma, importa módulos explícitos y entiende el comportamiento nativo antes de atribuírselo a Lit.',
    commonErrors: 'creer que Lit reemplaza Web Components, llamar render a mano o copiar patrones de frameworks que contradicen atributos y eventos estándar.',
    transfer: 'Compara la implementación nativa y Lit de una tarjeta; enumera qué contrato externo permanece idéntico.',
    sources: [source('Qué es Lit', 'https://lit.dev/docs/', 'Relaciona Lit con Web Components.', 'Lit'), source('LitElement API', 'https://lit.dev/docs/api/LitElement/', 'Consulta la clase base.', 'Lit')],
    debug: { title: 'render modifica innerHTML y no devuelve template', expected: 'account-card renderiza con html.', observed: 'render devuelve undefined y escribe en el host equivocado.',
      starter: `import { LitElement, html } from 'lit';
class AccountCard extends LitElement { render(){this.innerHTML='<p>Cuenta activa</p>';} }
customElements.define('account-card',AccountCard);`,
      tests: [litText('lit15-d1', 'La cuenta aparece en Shadow DOM', 'account-card', 'p', 'Cuenta activa'), sourceTest('lit15-d2', 'render devuelve html', String.raw`render\s*\([^)]*\)\s*\{\s*return\s+html`) ],
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
  constructor(){super();this.name='Ana';this.disabled=false;}
  render(){return html\`<button ?disabled=\${this.disabled} title=\${'Abrir '+this.name}>Hola, \${this.name}</button>\`;}
}
customElements.define('user-greeting',UserGreeting);`,
    starter: `import { LitElement, html } from 'lit';
class OrderSummary extends LitElement {
  constructor(){super();this.customer='Luis';this.total=42;this.locked=true;}
  render(){
    // Muestra cliente y total; enlaza locked a disabled como booleano.
  }
}
customElements.define('order-summary',OrderSummary);`,
    challengeTitle: 'App: bindings del pedido', challengeInstructions: 'Muestra “Luis” y “$42” y desactiva el botón con un binding booleano.',
    tests: [browserTest('lit16-bindings', 'Texto y booleano llegan a destinos correctos', `async ({document,customElements})=>{await customElements.whenDefined('order-summary');const el=document.querySelector('order-summary');await el.updateComplete;const b=el.shadowRoot.querySelector('button');return el.shadowRoot.textContent.includes('Luis')&&el.shadowRoot.textContent.includes('$42')&&b.disabled;}`), sourceTest('lit16-boolean', 'Usa binding booleano', String.raw`\?disabled\s*=\s*\$\{`) ],
    hints: ['El texto usa una expresión en el contenido.', 'disabled no necesita el string "true".', 'El prefijo ? controla presencia booleana.'],
    model: 'Cada expresión tiene un enchufe distinto: texto llena contenido, .propiedad entrega datos ricos, ?booleano controla presencia, @evento conecta comportamiento.',
    whenToUse: 'Elige el binding por la API del nodo receptor, no por cómo luce el valor en JavaScript.',
    bestPractices: 'Deja que Lit escape texto, evita unsafeHTML con datos externos y mantén cálculos complejos fuera del template.',
    commonErrors: 'usar atributo para objetos, escribir disabled="false", interpolar listeners como texto o construir HTML con strings no confiables.',
    transfer: 'Clasifica bindings para input.value, aria-label, disabled, click y una propiedad items.',
    sources: [source('Templates', 'https://lit.dev/docs/templates/overview/', 'Aprende posiciones y expresiones.', 'Lit'), source('Expressions', 'https://lit.dev/docs/templates/expressions/', 'Compara bindings.', 'Lit')],
    debug: { title: 'false deja el botón desactivado', expected: 'permission-button queda habilitado cuando locked=false.', observed: 'Usa disabled="false" como atributo presente.',
      starter: `import {LitElement,html} from 'lit';
class PermissionButton extends LitElement { constructor(){super();this.locked=false;} render(){return html\`<button disabled="\${this.locked}">Continuar</button>\`;} }
customElements.define('permission-button',PermissionButton);`,
      tests: [browserTest('lit16-d1', 'El botón refleja el booleano', `async ({document,customElements})=>{await customElements.whenDefined('permission-button');const el=document.querySelector('permission-button');await el.updateComplete;return !el.shadowRoot.querySelector('button').disabled;}`), sourceTest('lit16-d2', 'Usa ?disabled', String.raw`\?disabled\s*=`)],
      hints: ['Un atributo presente activa disabled.', 'No serialices false.', 'Usa el binding booleano de Lit.'] },
  }),
  lesson({
    number: 17, module: 5, title: 'Condicionales, listas y ausencia', appName: 'un panel de sesión con estados completos',
    summary: 'Renderiza ramas y colecciones desde datos sin confundir vacío, carga, error y contenido ausente.',
    concepts: [{ label: 'Render condicional', desc: 'Elegir un template según estado.' }, { label: 'nothing', desc: 'Valor que indica que no debe renderizarse contenido.' }],
    skillsRequired: ['lit-templates', 'lit-bindings'], skillsIntroduced: ['lit-conditionals', 'lit-lists'],
    reasoningSteps: ['El estado selecciona una rama', 'La rama produce un template', 'map produce templates de filas', 'nothing evita nodos innecesarios'],
    html: appHtml('Sesión', '<session-panel></session-panel>'),
    example: `import {LitElement,html,nothing} from 'lit';
class InboxPreview extends LitElement { constructor(){super();this.messages=['Hola'];this.showTitle=true;} render(){return html\`\${this.showTitle?html\`<h2>Bandeja</h2>\`:nothing}<ul>\${this.messages.map(m=>html\`<li>\${m}</li>\`)}</ul>\`;} }
customElements.define('inbox-preview',InboxPreview);`,
    starter: `import {LitElement,html,nothing} from 'lit';
class SessionPanel extends LitElement {
  constructor(){super();this.user=null;this.notifications=[];}
  render(){
    // Sin user muestra "Inicia sesión"; con user muestra su nombre y una lista o "Sin notificaciones".
  }
}
customElements.define('session-panel',SessionPanel);`,
    challengeTitle: 'App: panel con ramas completas', challengeInstructions: 'Renderiza los estados sin sesión, sesión vacía y sesión con notificaciones.',
    tests: [litText('lit17-empty', 'Sin usuario ofrece iniciar sesión', 'session-panel', ':host', 'Inicia sesión'), browserTest('lit17-list', 'Con usuario renderiza la colección', `async ({document,customElements})=>{await customElements.whenDefined('session-panel');const el=document.querySelector('session-panel');el.user={name:'Mara'};el.notifications=['Pago','Envío'];el.requestUpdate();await el.updateComplete;return el.shadowRoot.querySelectorAll('li').length===2&&el.shadowRoot.textContent.includes('Mara');}`)],
    hints: ['Decide primero la rama de sesión.', 'Dentro de la sesión decide vacío o lista.', 'map devuelve un template por elemento.'],
    model: 'El template es una tabla de decisiones visible: cada estado válido necesita una salida, incluida la ausencia intencional.',
    whenToUse: 'Usa ternarios para dos ramas locales, funciones para decisiones con nombre y map para listas pequeñas sin identidad compleja.',
    bestPractices: 'Modela estados exhaustivos, añade claves con repeat cuando importe identidad y evita cadenas largas de operadores en el template.',
    commonErrors: 'tratar [] como falsy, mostrar nada durante errores o usar && con valores como 0 que terminan visibles.',
    transfer: 'Diseña ramas para carrito: loading, error, empty y ready con artículos.',
    sources: [source('Conditionals', 'https://lit.dev/docs/templates/conditionals/', 'Compara ternario, nothing y when.', 'Lit'), source('Lists', 'https://lit.dev/docs/templates/lists/', 'Renderiza colecciones.', 'Lit')],
    debug: { title: 'El cero aparece como contenido extraño', expected: 'cart-count muestra “Sin artículos” cuando count=0.', observed: 'Usa count && template y deja 0 en pantalla.',
      starter: `import{LitElement,html}from'lit';class CartCount extends LitElement{constructor(){super();this.count=0;}render(){return html\`<div>\${this.count&&html\`<strong>\${this.count} artículos</strong>\`}</div>\`;}}customElements.define('cart-count',CartCount);`,
      tests: [litText('lit17-d1', 'Cero tiene una rama humana', 'cart-count', 'div', 'Sin artículos'), sourceTest('lit17-d2', 'Usa una decisión explícita', String.raw`\?\s*html\s*\``)],
      hints: ['0 es un dato válido, no ausencia.', 'Escribe las dos salidas.', 'Un ternario hace explícito el caso vacío.'] },
  }),
  lesson({
    number: 18, module: 6, title: 'Propiedades reactivas y atributos', appName: 'una ficha configurable desde HTML y JavaScript',
    summary: 'Declara propiedades públicas en JavaScript, entiende conversión de atributos y diseña opciones sin decoradores.',
    concepts: [{ label: 'Propiedad reactiva', desc: 'Propiedad cuyo cambio programa una actualización.' }, { label: 'static properties', desc: 'Declaración JavaScript del contrato reactivo.' }],
    skillsRequired: ['lit-conditionals', 'lit-lists'], skillsIntroduced: ['lit-reactive-properties', 'lit-attribute-conversion'],
    reasoningSteps: ['El consumidor cambia una propiedad', 'El setter reactivo detecta diferencia', 'Lit programa una actualización', 'render recibe el nuevo valor'],
    html: appHtml('Ficha', '<user-chip name="Ada" online></user-chip>'),
    example: `import{LitElement,html}from'lit';
class StockBadge extends LitElement{static properties={count:{type:Number},label:{type:String}};constructor(){super();this.count=0;this.label='Stock';}render(){return html\`<span>\${this.label}: \${this.count}</span>\`;}}
customElements.define('stock-badge',StockBadge);`,
    starter: `import{LitElement,html}from'lit';
class UserChip extends LitElement{
  static properties={/* name String y online Boolean */};
  constructor(){super();/* valores por defecto */}
  render(){return html\`<span>\${/* nombre */} — \${/* estado */}</span>\`;}
}
customElements.define('user-chip',UserChip);`,
    challengeTitle: 'App: ficha reactiva', challengeInstructions: 'Declara name y online, inicializa defaults y muestra “Ada — En línea” desde los atributos.',
    tests: [litText('lit18-attr', 'Convierte atributos al contrato', 'user-chip', 'span', 'Ada — En línea'), sourceTest('lit18-properties', 'Declara ambas propiedades', String.raw`static\s+properties\s*=\s*\{[\s\S]*name[\s\S]*online`) ],
    hints: ['En JavaScript del curso usamos static properties, no decoradores.', 'El tipo Boolean interpreta presencia del atributo.', 'Inicializa defaults después de super().'],
    model: 'Lit instala sensores en propiedades declaradas: al cambiar una referencia, programa una actualización y render vuelve a describir la vista.',
    whenToUse: 'Declara como pública la entrada que el consumidor debe controlar; no publiques detalles internos solo para hacerlos reactivos.',
    bestPractices: 'Usa tipos simples para atributos, defaults en constructor y nombres de atributo estables.',
    commonErrors: 'usar campos de clase que ocultan accessors, reflejar sin necesidad o tratar objetos como atributos strings.',
    transfer: 'Diseña propiedades de product-card: product objeto, selected booleano y currency string.',
    sources: [source('Reactive properties', 'https://lit.dev/docs/components/properties/', 'Revisa JavaScript static properties y conversores.', 'Lit')],
    debug: { title: 'El contador cambia pero no actualiza', expected: 'live-counter muestra 2 después de increment.', observed: 'count no está declarado como reactivo.',
      starter: `import{LitElement,html}from'lit';class LiveCounter extends LitElement{constructor(){super();this.count=1;}increment(){this.count+=1;}render(){return html\`<span>\${this.count}</span>\`;}}customElements.define('live-counter',LiveCounter);`,
      tests: [browserTest('lit18-d1', 'El método produce una actualización', `async ({document,customElements})=>{await customElements.whenDefined('live-counter');const el=document.querySelector('live-counter');el.increment();await el.updateComplete;return el.shadowRoot.textContent.includes('2');}`), sourceTest('lit18-d2', 'count es reactiva', String.raw`static\s+properties\s*=\s*\{[\s\S]*count`) ],
      hints: ['Cambiar una propiedad común no avisa a Lit.', 'Declara el contrato reactivo.', 'No llames render manualmente.'] },
  }),
  lesson({
    number: 19, module: 6, title: 'Estado interno y fronteras de API', appName: 'un contador de inventario con entradas y detalles separados',
    summary: 'Distingue propiedades públicas de estado interno reactivo y evita convertir cada detalle en API.',
    concepts: [{ label: 'API pública', desc: 'Entradas que controla quien consume el componente.' }, { label: 'Estado interno', desc: 'Dato reactivo que solo administra la implementación.' }],
    skillsRequired: ['lit-reactive-properties', 'lit-attribute-conversion'], skillsIntroduced: ['lit-internal-state', 'api-boundaries'],
    reasoningSteps: ['El consumidor fija capacity', 'El componente administra _reserved', 'Ambos cambios programan render', 'Solo capacity aparece como API'],
    html: appHtml('Inventario', '<inventory-counter capacity="5"></inventory-counter>'),
    example: `import{LitElement,html}from'lit';class DownloadButton extends LitElement{static properties={url:{type:String},_progress:{state:true}};constructor(){super();this.url='';this._progress=0;}render(){return html\`<button>\${this._progress}%</button>\`;}}customElements.define('download-button',DownloadButton);`,
    starter: `import{LitElement,html}from'lit';class InventoryCounter extends LitElement{
  static properties={capacity:{type:Number},/* _reserved como estado */};
  constructor(){super();this.capacity=0;this._reserved=0;}
  reserve(){/* aumenta sin superar capacity */}
  render(){return html\`<button @click=\${()=>this.reserve()}>Reservar</button><span>\${/* disponible */}</span>\`;}
}customElements.define('inventory-counter',InventoryCounter);`,
    challengeTitle: 'App: inventario con frontera clara', challengeInstructions: 'Mantén capacity pública y _reserved interna; muestra “Disponibles: N” y limita reservas.',
    tests: [browserTest('lit19-state', 'La acción actualiza estado interno', `async ({document,customElements})=>{await customElements.whenDefined('inventory-counter');const el=document.querySelector('inventory-counter');await el.updateComplete;el.shadowRoot.querySelector('button').click();await el.updateComplete;return el.shadowRoot.textContent.includes('Disponibles: 4')&&!el.hasAttribute('_reserved');}`), sourceTest('lit19-private', 'Declara state interno', String.raw`_reserved\s*:\s*\{\s*state\s*:\s*true`) ],
    hints: ['capacity llega de fuera; _reserved nace y cambia dentro.', 'state:true actualiza sin crear atributo.', 'Disponible se deriva, no necesita otra propiedad.'],
    model: 'La API pública es el tablero que usa el conductor; el estado interno es el mecanismo bajo el capó. Ambos reaccionan, pero solo uno se promete al consumidor.',
    whenToUse: 'Usa estado interno para interacción, caché visual y datos derivados que el consumidor no debe configurar.',
    bestPractices: 'Minimiza API, marca estado con state:true y evita reflejar nombres internos.',
    commonErrors: 'publicar todo, guardar datos derivados duplicados o permitir que el componente sobrescriba entradas sin avisar.',
    transfer: 'Clasifica query, results, loading, selectedId y pageSize como entrada, salida, interno o derivado.',
    sources: [source('Public properties and internal state', 'https://lit.dev/docs/components/properties/#public-properties-and-internal-state', 'Diseña fronteras.', 'Lit')],
    debug: { title: 'El spinner expone loading como atributo', expected: 'data-panel mantiene _loading interno.', observed: 'loading se refleja y el exterior parece dueño.',
      starter: `import{LitElement,html}from'lit';class DataPanel extends LitElement{static properties={loading:{type:Boolean,reflect:true}};constructor(){super();this.loading=true;}render(){return html\`<p>\${this.loading?'Cargando':'Listo'}</p>\`;}}customElements.define('data-panel',DataPanel);`,
      tests: [sourceTest('lit19-d1', 'Usa estado interno', String.raw`_loading\s*:\s*\{\s*state\s*:\s*true`), sourceTest('lit19-d2', 'No refleja loading público', String.raw`this\._loading`) ],
      hints: ['La carga pertenece al proceso interno.', 'Renombra y declara state:true.', 'Actualiza render para leer la misma fuente.'] },
  }),
  lesson({
    number: 20, module: 6, title: 'Arrays inmutables y actualización por referencia', appName: 'un tablero de tareas que siempre se actualiza',
    summary: 'Reemplaza arrays y objetos al cambiar estado para que Lit detecte nuevas referencias y mantenga identidad.',
    concepts: [{ label: 'Inmutabilidad', desc: 'Crear un valor nuevo en vez de alterar el recibido.' }, { label: 'Detección de cambio', desc: 'Comparación que decide si se programa update.' }],
    skillsRequired: ['lit-internal-state', 'api-boundaries'], skillsIntroduced: ['lit-immutable-data', 'lit-change-detection'],
    reasoningSteps: ['Una acción describe el cambio', 'Crea un array nuevo', 'El setter detecta nueva referencia', 'Lit renderiza la colección'],
    html: appHtml('Tareas', '<task-board></task-board>'),
    example: `import{LitElement,html}from'lit';class TagEditor extends LitElement{static properties={tags:{state:true}};constructor(){super();this.tags=['web'];}add(tag){this.tags=[...this.tags,tag];}render(){return html\`<ul>\${this.tags.map(t=>html\`<li>\${t}</li>\`)}</ul>\`;}}customElements.define('tag-editor',TagEditor);`,
    starter: `import{LitElement,html}from'lit';class TaskBoard extends LitElement{
  static properties={tasks:{state:true}};constructor(){super();this.tasks=[{id:1,text:'Leer'}];}
  addTask(text){/* crea array nuevo con id y texto */}
  complete(id){/* crea array nuevo cambiando solo esa tarea */}
  render(){return html\`<ul>\${this.tasks.map(task=>html\`<li>\${task.text} \${task.done?'✓':''}</li>\`)}</ul>\`;}
}customElements.define('task-board',TaskBoard);`,
    challengeTitle: 'App: tablero inmutable', challengeInstructions: 'Implementa addTask y complete sin push ni mutar la tarea existente.',
    tests: [browserTest('lit20-add', 'Agregar crea una fila nueva', `async ({document,customElements})=>{await customElements.whenDefined('task-board');const el=document.querySelector('task-board');const before=el.tasks;el.addTask('Practicar');await el.updateComplete;return before!==el.tasks&&el.shadowRoot.querySelectorAll('li').length===2;}`), browserTest('lit20-complete', 'Completar reemplaza la tarea', `async ({document})=>{const el=document.querySelector('task-board');const before=el.tasks[0];el.complete(1);await el.updateComplete;return before!==el.tasks[0]&&el.shadowRoot.textContent.includes('✓');}`)],
    hints: ['Lit compara la referencia del array.', 'spread agrega sin mutar; map reemplaza un elemento por id.', 'También crea un objeto nuevo para la tarea modificada.'],
    model: 'Una referencia nueva es un sobre nuevo que avisa del cambio. Editar silenciosamente el contenido del mismo sobre puede pasar desapercibido.',
    whenToUse: 'Prefiere actualizaciones inmutables en estado reactivo, especialmente cuando datos pasan entre componentes.',
    bestPractices: 'Usa identidad estable, operaciones puras y evita requestUpdate como parche habitual para mutaciones.',
    commonErrors: 'push seguido de ninguna actualización, mutar objetos compartidos o usar índice como identidad duradera.',
    transfer: 'Implementa mentalmente editar y eliminar una fila conservando referencias de las filas no afectadas.',
    sources: [source('Mutating object and array properties', 'https://lit.dev/docs/components/properties/#mutating-object-and-array-properties', 'Compara estrategias.', 'Lit')],
    debug: { title: 'push no despierta el render', expected: 'note-list muestra Segunda.', observed: 'Muta el mismo array.',
      starter: `import{LitElement,html}from'lit';class NoteList extends LitElement{static properties={notes:{state:true}};constructor(){super();this.notes=['Primera'];}add(){this.notes.push('Segunda');}render(){return html\`\${this.notes.map(n=>html\`<p>\${n}</p>\`)}\`;}}customElements.define('note-list',NoteList);`,
      tests: [browserTest('lit20-d1', 'add produce un render', `async ({document,customElements})=>{await customElements.whenDefined('note-list');const el=document.querySelector('note-list');el.add();await el.updateComplete;return el.shadowRoot.textContent.includes('Segunda');}`), sourceTest('lit20-d2', 'Reemplaza notes', String.raw`this\.notes\s*=\s*\[\.\.\.this\.notes`) ],
      hints: ['push conserva la referencia.', 'Asigna un array nuevo.', 'No llames requestUpdate para ocultar la mutación.'] },
  }),
];
