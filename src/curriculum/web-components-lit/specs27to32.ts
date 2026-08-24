import { appHtml, browserTest, lesson, source, sourceTest } from './helpers';

export const COMPONENT_SPECS_27_TO_32 = [
  lesson({
    number: 27, module: 9, title: 'repeat, when y choose según el problema', appName: 'una bandeja de pedidos con identidad estable',
    summary: 'Selecciona directivas por identidad y claridad en vez de añadirlas por costumbre.',
    concepts: [{ label: 'repeat', desc: 'Render de listas con función de clave estable.' }, { label: 'when/choose', desc: 'Directivas para expresar ramas legibles.' }],
    skillsRequired: ['lit-slots', 'css-parts'], skillsIntroduced: ['lit-repeat', 'lit-branch-directives'],
    reasoningSteps: ['orders conserva ids', 'repeat relaciona id y DOM', 'El estado elige una rama', 'Lit mueve o actualiza los nodos correctos'],
    html: appHtml('Pedidos', '<order-tray></order-tray>'),
    example: `import{LitElement,html}from'lit';import{repeat}from'lit/directives/repeat.js';import{when}from'lit/directives/when.js';class QueueView extends LitElement{static properties={jobs:{state:true}};constructor(){super();this.jobs=[{id:'a',name:'Compilar'}];}render(){return when(this.jobs.length>0,()=>html\`<ul>\${repeat(this.jobs,j=>j.id,j=>html\`<li>\${j.name}</li>\`)}</ul>\`,()=>html\`<p>Sin trabajos</p>\`);}}customElements.define('queue-view',QueueView);`,
    starter: `import{LitElement,html}from'lit';import{repeat}from'lit/directives/repeat.js';import{when}from'lit/directives/when.js';
class OrderTray extends LitElement{static properties={orders:{state:true}};constructor(){super();this.orders=[{id:'p2',name:'Teclado'},{id:'p1',name:'Cable'}];}
  remove(id){this.orders=this.orders.filter(order=>order.id!==id);}
  render(){/* usa when para vacío y repeat con id para filas que puedan quitarse */}
}customElements.define('order-tray',OrderTray);`,
    challengeTitle: 'App: bandeja con identidad', challengeInstructions: 'Renderiza pedidos con repeat(order.id), botón Quitar y rama “Sin pedidos” mediante when.',
    tests: [sourceTest('lit27-repeat', 'repeat usa la identidad del pedido', String.raw`repeat\s*\(\s*this\.orders\s*,\s*(?:\([^)]*\)|\w+)\s*=>\s*(?:\w+\.)?id`), browserTest('lit27-empty', 'Quitar todos llega a la rama vacía', `async ({document,customElements})=>{await customElements.whenDefined('order-tray');const el=document.querySelector('order-tray');el.remove('p2');el.remove('p1');await el.updateComplete;return el.shadowRoot.textContent.includes('Sin pedidos');}`)],
    hints: ['La clave es order.id, no el índice.', 'when separa ready y empty.', 'El botón llama remove con el id de esa fila.'],
    model: 'repeat entrega una cédula estable a cada fila; cuando cambia el orden, Lit reconoce quién se movió en vez de confundirlo con su posición.',
    whenToUse: 'Usa repeat cuando la lista cambia de orden, inserta o elimina y el DOM de cada fila tiene identidad; map basta para listas simples.',
    bestPractices: 'Elige claves únicas y duraderas; usa directivas solo cuando expresan mejor la intención que JavaScript normal.',
    commonErrors: 'índice como clave, claves duplicadas, choose para dos ramas simples o directivas que ocultan una regla de negocio.',
    transfer: 'Decide entre map y repeat para etiquetas, filas editables, resultados de búsqueda y pasos fijos.',
    sources: [source('Built-in directives', 'https://lit.dev/docs/templates/directives/', 'Compara repeat, when y choose.', 'Lit'), source('Lists', 'https://lit.dev/docs/templates/lists/', 'Comprende identidad.', 'Lit')],
    debug: { title: 'La lista usa índice y conserva el input equivocado', expected: 'editable-list identifica cada fila por item.id.', observed: 'repeat usa el índice.',
      starter: `import{LitElement,html}from'lit';import{repeat}from'lit/directives/repeat.js';class EditableList extends LitElement{constructor(){super();this.items=[{id:'a',name:'A'},{id:'b',name:'B'}];}render(){return html\`\${repeat(this.items,(_item,index)=>index,item=>html\`<input .value=\${item.name}>\`)}\`;}}customElements.define('editable-list',EditableList);`,
      tests: [sourceTest('lit27-d1', 'La clave usa id', String.raw`repeat\s*\(\s*this\.items\s*,\s*(?:\([^)]*\)|\w+)\s*=>\s*(?:\w+\.)?id`), sourceTest('lit27-d2', 'Conserva repeat', String.raw`repeat\s*\(`)],
      hints: ['La posición cambia cuando insertas.', 'El objeto ya tiene identidad.', 'Devuelve item.id en la función de clave.'] },
  }),
  lesson({
    number: 28, module: 9, title: 'classMap, styleMap y ref con intención', appName: 'una tabla interactiva con estado visual y foco',
    summary: 'Aplica clases, estilos y referencias DOM con directivas específicas sin volver imperativo todo el componente.',
    concepts: [{ label: 'classMap/styleMap', desc: 'Bindings declarativos para mapas de clase o estilo.' }, { label: 'ref', desc: 'Referencia a un nodo cuando una API imperativa la necesita.' }],
    skillsRequired: ['lit-repeat', 'lit-branch-directives'], skillsIntroduced: ['lit-style-directives', 'lit-ref'],
    reasoningSteps: ['El estado define selección y ancho', 'classMap/styleMap describen apariencia', 'ref captura el input', 'Una acción justificada usa focus'],
    html: appHtml('Tabla', '<interactive-table></interactive-table>'),
    example: `import{LitElement,html}from'lit';import{classMap}from'lit/directives/class-map.js';class StatusRow extends LitElement{constructor(){super();this.active=true;}render(){return html\`<p class=\${classMap({active:this.active,muted:!this.active})}>Estado</p>\`;}}customElements.define('status-row',StatusRow);`,
    starter: `import{LitElement,html}from'lit';import{classMap}from'lit/directives/class-map.js';import{styleMap}from'lit/directives/style-map.js';import{createRef,ref}from'lit/directives/ref.js';
class InteractiveTable extends LitElement{constructor(){super();this.selected=true;this.width=65;this.searchRef=createRef();}
  focusSearch(){/* usa la referencia */}
  render(){/* input con ref, fila classMap y barra styleMap width porcentual */}
}customElements.define('interactive-table',InteractiveTable);`,
    challengeTitle: 'App: tabla declarativa', challengeInstructions: 'Renderiza input ref, clase selected y barra width:65%; focusSearch debe enfocar el input.',
    tests: [sourceTest('lit28-directives', 'Usa las tres directivas apropiadas', String.raw`classMap\s*\([\s\S]*styleMap\s*\([\s\S]*ref\s*\(`), browserTest('lit28-ref', 'focusSearch usa el nodo real', `async ({document,customElements})=>{await customElements.whenDefined('interactive-table');const el=document.querySelector('interactive-table');await el.updateComplete;el.focusSearch();return el.shadowRoot.activeElement?.tagName==='INPUT';}`)],
    hints: ['createRef se conserva en la instancia.', 'ref(this.searchRef) conecta el input.', 'value contiene el nodo después de render.'],
    model: 'Las directivas son adaptadores estrechos: expresan una operación DOM concreta sin abandonar el flujo declarativo del template.',
    whenToUse: 'Usa classMap/styleMap con mapas dinámicos y ref para foco, medición o bibliotecas imperativas; no para leer datos que ya están en estado.',
    bestPractices: 'Mantén mapas pequeños, valores CSS controlados y acceso DOM encapsulado en métodos con nombre.',
    commonErrors: 'styleMap con datos no validados, ref como sustituto de estado o classMap para una sola clase ternaria.',
    transfer: 'Elige directiva o sintaxis normal para tooltip, progreso, tema, autofocus y selección múltiple.',
    sources: [source('classMap', 'https://lit.dev/docs/templates/directives/#classmap', 'Consulta clases dinámicas.', 'Lit'), source('ref', 'https://lit.dev/docs/templates/directives/#ref', 'Usa referencias justificadas.', 'Lit')],
    debug: { title: 'focus corre durante render', expected: 'search-toolbar enfoca solo al llamar focusSearch.', observed: 'Ejecuta focus() como parte de la expresión.',
      starter: `import{LitElement,html}from'lit';class SearchToolbar extends LitElement{render(){return html\`<input id="q">\${this.renderRoot.querySelector('#q')?.focus()}\`;}}customElements.define('search-toolbar',SearchToolbar);`,
      tests: [sourceTest('lit28-d1', 'Usa la directiva ref', String.raw`from\s*['"]lit/directives/ref\.js['"]`), sourceTest('lit28-d2', 'Expone una acción de foco', String.raw`focusSearch\s*\(`)],
      hints: ['render debe describir, no ejecutar foco.', 'Captura el nodo con ref.', 'Mueve focus a un método público o interno con intención.'] },
  }),
  lesson({
    number: 29, module: 9, title: 'Tareas asíncronas con estados y carreras', appName: 'un catálogo remoto con Task',
    summary: 'Modela argumentos, cancelación y estados de una tarea mediante @lit/task sin esconder reglas de red.',
    concepts: [{ label: 'Task', desc: 'Controlador para trabajo asíncrono ligado a argumentos reactivos.' }, { label: 'Race safety', desc: 'Solo el resultado de los argumentos vigentes llega a la vista.' }],
    skillsRequired: ['lit-style-directives', 'lit-ref'], skillsIntroduced: ['lit-task', 'lit-async-render'],
    reasoningSteps: ['query cambia', 'Task recibe argumentos y signal', 'pending/complete/error seleccionan UI', 'Solo la ejecución vigente completa'],
    html: appHtml('Catálogo', '<remote-catalog></remote-catalog>'),
    example: `import{LitElement,html}from'lit';import{Task}from'@lit/task';class DemoTask extends LitElement{constructor(){super();this.query='web';this._task=new Task(this,{task:async([query])=>query.toUpperCase(),args:()=>[this.query]});}render(){return this._task.render({pending:()=>html\`<p>Cargando</p>\`,complete:value=>html\`<p>\${value}</p>\`,error:()=>html\`<p>Error</p>\`});}}customElements.define('demo-task',DemoTask);`,
    starter: `import{LitElement,html}from'lit';import{Task}from'@lit/task';class RemoteCatalog extends LitElement{
  static properties={query:{type:String}};
  constructor(){super();this.query='teclado';this._catalogTask=new Task(this,{task:async([query],{signal})=>{/* simula y devuelve [] para vacio o [{name:'Teclado'}] */},args:()=>[this.query]});}
  render(){/* pending, complete con empty/ready y error */}
}customElements.define('remote-catalog',RemoteCatalog);`,
    challengeTitle: 'App: catálogo asíncrono', challengeInstructions: 'Configura Task con query y signal; renderiza Cargando, Sin resultados, producto o error.',
    tests: [browserTest('lit29-runtime', 'El catálogo crea una tarea ligada al host', `async ({document,customElements})=>{await customElements.whenDefined('remote-catalog');const el=document.querySelector('remote-catalog');await el.updateComplete;return Boolean(el._catalogTask)&&Boolean(el.shadowRoot);}`), sourceTest('lit29-states', 'La tarea usa signal y cubre estados', String.raw`signal[\s\S]*pending\s*:[\s\S]*complete\s*:[\s\S]*error\s*:`)],
    hints: ['Task pertenece a la instancia y recibe this como host.', 'args define cuándo ejecutar otra tarea.', 'complete todavía debe distinguir array vacío.'],
    model: 'Task coordina el calendario de la operación; tu servicio conserva el contrato de datos y tu template decide cómo explicar cada estado.',
    whenToUse: 'Úsalo cuando una operación depende de propiedades reactivas y necesitas coordinación de estados; una promesa puntual puede ser suficiente en casos simples.',
    bestPractices: 'Pasa signal a operaciones cancelables, separa normalización del componente y cubre vacío además de error.',
    commonErrors: 'crear Task dentro de render, omitir args, ignorar signal o meter fetch, normalización y presentación en una sola función.',
    transfer: 'Diseña Task para detalle por id y para sugerencias por query; identifica argumentos y estados.',
    sources: [source('Async tasks', 'https://lit.dev/docs/data/task/', 'Aprende Task, args y render de estados.', 'Lit'), source('@lit/task API', 'https://lit.dev/docs/api/task/', 'Consulta opciones.', 'Lit')],
    debug: { title: 'Se crea una tarea en cada render', expected: 'weather-panel conserva una Task en constructor.', observed: 'render instancia Task y programa trabajo sin fin.',
      starter: `import{LitElement,html}from'lit';import{Task}from'@lit/task';class WeatherPanel extends LitElement{render(){const task=new Task(this,{task:async()=>({temp:20}),args:()=>[]});return task.render({complete:data=>html\`<p>\${data.temp}</p>\`});}}customElements.define('weather-panel',WeatherPanel);`,
      tests: [sourceTest('lit29-d1', 'La tarea se crea fuera de render', String.raw`constructor\s*\([^)]*\)[\s\S]*new\s+Task`), sourceTest('lit29-d2', 'render reutiliza la tarea', String.raw`this\._[\w$]*task\.render\s*\(`)],
      hints: ['render puede ejecutarse muchas veces.', 'Task tiene ciclo propio y necesita identidad estable.', 'Créala una vez en la instancia.'] },
  }),
  lesson({
    number: 30, module: 10, title: 'Controladores, contexto y servicios compartidos', appName: 'un panel de conectividad con lógica reutilizable',
    summary: 'Extrae estado con ciclo propio a un Reactive Controller y usa contexto solo para dependencias realmente transversales.',
    concepts: [{ label: 'Reactive Controller', desc: 'Objeto que participa en el ciclo del host sin ser un componente.' }, { label: 'Context', desc: 'Canal para datos transversales a través de un árbol de componentes.' }],
    skillsRequired: ['lit-task', 'lit-async-render'], skillsIntroduced: ['lit-controllers', 'lit-context'],
    reasoningSteps: ['El host crea NetworkController', 'El controlador se registra', 'Eventos externos cambian su estado', 'requestUpdate actualiza al host'],
    html: appHtml('Conectividad', '<network-panel></network-panel>'),
    example: `import{LitElement,html}from'lit';class ClockController{constructor(host){this.host=host;host.addController(this);this.value=new Date();}hostConnected(){this.timer=setInterval(()=>{this.value=new Date();this.host.requestUpdate();},1000);}hostDisconnected(){clearInterval(this.timer);}}class ClockPanel extends LitElement{constructor(){super();this.clock=new ClockController(this);}render(){return html\`<time>\${this.clock.value.toLocaleTimeString()}</time>\`;}}customElements.define('clock-panel',ClockPanel);`,
    starter: `import{LitElement,html}from'lit';class NetworkController{
  constructor(host){this.host=host;this.online=true;/* registra el controlador */}
  hostConnected(){/* escucha online/offline con referencia estable */}
  hostDisconnected(){/* limpia */}
}
class NetworkPanel extends LitElement{constructor(){super();this.network=new NetworkController(this);}render(){return html\`<p>\${this.network.online?'En línea':'Sin conexión'}</p>\`;}}
customElements.define('network-panel',NetworkPanel);`,
    challengeTitle: 'App: estado reutilizable por composición', challengeInstructions: 'Completa NetworkController con addController, ciclo, limpieza y requestUpdate.',
    tests: [browserTest('lit30-runtime', 'El host usa una instancia del controlador', `async ({document,customElements})=>{await customElements.whenDefined('network-panel');const el=document.querySelector('network-panel');await el.updateComplete;return Boolean(el.network)&&el.shadowRoot.textContent.includes('En línea');}`), sourceTest('lit30-cycle', 'Se registra e implementa ciclo, limpieza y update', String.raw`addController\s*\([\s\S]*hostConnected\s*\([\s\S]*hostDisconnected\s*\([\s\S]*requestUpdate\s*\(`)],
    hints: ['El controlador tiene identidad propia y conoce su host.', 'Guarda un mismo manejador para ambos ciclos.', 'Al cambiar online pide update al host.'],
    model: 'Un controller es un órgano reusable con su propio ciclo; el contexto es una red de distribución. Ninguno debe convertirse en un almacén global para cualquier dato.',
    whenToUse: 'Usa controller para lógica reusable con ciclo; usa contexto para tema, sesión o servicio compartido por ramas profundas.',
    bestPractices: 'Mantén API estrecha, limpia recursos y prefiere propiedades/eventos cuando solo hay relación padre-hijo.',
    commonErrors: 'mixins que contaminan prototipos, contexto para estado local, listeners sin cleanup o controller que renderiza DOM.',
    transfer: 'Elige propiedades, contexto o controller para locale, carrito, tamaño del viewport y datos de una fila.',
    sources: [source('Reactive Controllers', 'https://lit.dev/docs/composition/controllers/', 'Diseña composición con ciclo.', 'Lit'), source('Context', 'https://lit.dev/docs/data/context/', 'Comprende provider y consumer.', 'Lit')],
    debug: { title: 'El controlador actualiza datos pero no la vista', expected: 'counter-panel pide update al host.', observed: 'Incrementa value sin avisar.',
      starter: `import{LitElement,html}from'lit';class CounterController{constructor(host){this.host=host;host.addController(this);this.value=0;}increment(){this.value+=1;}}class CounterPanel extends LitElement{constructor(){super();this.counter=new CounterController(this);}render(){return html\`<button @click=\${()=>this.counter.increment()}>\${this.counter.value}</button>\`;}}customElements.define('counter-panel',CounterPanel);`,
      tests: [sourceTest('lit30-d1', 'El controlador solicita update', String.raw`increment\s*\([^)]*\)[\s\S]*requestUpdate\s*\(`), sourceTest('lit30-d2', 'Conserva addController', String.raw`addController\s*\(`)],
      hints: ['value no es propiedad reactiva del host.', 'El controller conoce al host.', 'Después del cambio llama host.requestUpdate().'] },
  }),
  lesson({
    number: 31, module: 10, title: 'Testing, accesibilidad, paquetes y producción', appName: 'una biblioteca de componentes con contrato verificable',
    summary: 'Prepara componentes para trabajo real: pruebas en navegador, documentación, exportaciones, accesibilidad y build de producción.',
    concepts: [{ label: 'Paquete', desc: 'Módulo versionado con exports y contratos públicos.' }, { label: 'Matriz de pruebas', desc: 'Casos de API, interacción, ciclo y accesibilidad.' }],
    skillsRequired: ['lit-controllers', 'lit-context'], skillsIntroduced: ['lit-production-testing', 'component-packaging'],
    reasoningSteps: ['Define contrato público', 'Prueba en navegador y accesibilidad', 'Empaqueta exports estables', 'Build/minificación producen artefacto consumible'],
    html: appHtml('Biblioteca', '<library-button></library-button>'),
    example: `import{LitElement,html}from'lit';export class LibraryBadge extends LitElement{static properties={label:{type:String}};constructor(){super();this.label='Nuevo';}render(){return html\`<span role="status">\${this.label}</span>\`;}}customElements.define('library-badge',LibraryBadge);`,
    starter: `import{LitElement,html}from'lit';export class LibraryButton extends LitElement{
  static properties={label:{type:String},disabled:{type:Boolean,reflect:true}};
  constructor(){super();this.label='Guardar';this.disabled=false;}
  render(){/* botón nativo, binding booleano y evento library-action al activar */}
}
customElements.define('library-button',LibraryButton);`,
    challengeTitle: 'App: componente listo para biblioteca', challengeInstructions: 'Implementa API label/disabled y emite library-action desde un botón nativo habilitado.',
    tests: [browserTest('lit31-public', 'La API pública funciona en navegador', `async ({document,customElements})=>{await customElements.whenDefined('library-button');const el=document.querySelector('library-button');await el.updateComplete;let fired=false;el.addEventListener('library-action',()=>fired=true,{once:true});el.shadowRoot.querySelector('button').click();return fired&&el.shadowRoot.querySelector('button').textContent.includes('Guardar');}`), sourceTest('lit31-export', 'Exporta la clase pública', String.raw`export\s+class\s+LibraryButton`) ],
    hints: ['El paquete exporta una clase y registra una etiqueta.', 'El control interno sigue siendo button.', 'El evento describe la acción pública.'],
    model: 'Producción es mantener una promesa: API, semántica, pruebas, versión y artefacto deben contar la misma historia a otro equipo.',
    whenToUse: 'Empaqueta cuando varios proyectos o equipos consumen el componente; una app única puede conservar módulos internos.',
    bestPractices: 'Prueba en navegador, documenta propiedades/eventos/slots/parts, usa semver y publica artefactos sin fuentes accidentales.',
    commonErrors: 'tests DOM simulados, exports ambiguos, breaking changes sin versión, CSS hooks sin documentar o bundle duplicando Lit.',
    transfer: 'Escribe checklist de publicación para una tarjeta: API, a11y, tests, package exports, build y ejemplo de consumo.',
    sources: [source('Testing', 'https://lit.dev/docs/tools/testing/', 'Prueba en navegador.', 'Lit'), source('Publishing', 'https://lit.dev/docs/tools/publishing/', 'Prepara paquetes.', 'Lit'), source('Production', 'https://lit.dev/docs/tools/production/', 'Optimiza build.', 'Lit')],
    debug: { title: 'El paquete solo tiene export default anónimo', expected: 'StatusChip ofrece export nombrado.', observed: 'El consumidor no puede importar un nombre estable.',
      starter: `import{LitElement,html}from'lit';export default class extends LitElement{render(){return html\`<span>Listo</span>\`;}}customElements.define('status-chip',customElements.get('status-chip')||class extends LitElement{});`,
      tests: [sourceTest('lit31-d1', 'Exporta StatusChip por nombre', String.raw`export\s+class\s+StatusChip`), sourceTest('lit31-d2', 'Registra la misma clase', String.raw`customElements\.define\s*\(\s*['"]status-chip['"]\s*,\s*StatusChip`) ],
      hints: ['La clase pública necesita identidad.', 'Export y registro deben referir la misma clase.', 'No escondas el contrato detrás de default anónimo.'] },
  }),
  lesson({
    number: 32, module: 11, title: 'Proyecto final por cortes verticales', appName: 'un gestor de incidencias operativo',
    summary: 'Integra reglas, componentes, eventos, tareas, accesibilidad y pruebas construyendo una capacidad completa cada vez.',
    concepts: [{ label: 'Corte vertical', desc: 'Capacidad completa desde dato y regla hasta interacción visible.' }, { label: 'Arquitectura de componentes', desc: 'Fronteras con dueño de estado y dependencias dirigidas.' }],
    skillsRequired: ['lit-production-testing', 'component-packaging'], skillsIntroduced: ['lit-vertical-slices', 'component-system-design'],
    reasoningSteps: ['Formulario emite issue-create', 'IssueApp valida y posee issues', 'Lista recibe datos por propiedad', 'Fila emite cambios y el dueño actualiza'],
    html: appHtml('Incidencias', '<issue-app></issue-app>'),
    example: `import{LitElement,html}from'lit';class NoteApp extends LitElement{static properties={notes:{state:true}};constructor(){super();this.notes=[];}add(text){const clean=text.trim();if(clean)this.notes=[...this.notes,{id:crypto.randomUUID(),text:clean}];}render(){return html\`<button @click=\${()=>this.add('Revisar')}>Añadir</button><ul>\${this.notes.map(n=>html\`<li>\${n.text}</li>\`)}</ul>\`;}}customElements.define('note-app',NoteApp);`,
    starter: `import{LitElement,html}from'lit';
class IssueApp extends LitElement{
  static properties={issues:{state:true},filter:{state:true}};
  constructor(){super();this.issues=[];this.filter='all';}
  createIssue(title,priority){/* valida título y prioridad 1..3; agrega {id,title,priority,status:'open'} */}
  closeIssue(id){/* reemplaza solo la incidencia indicada */}
  get visibleIssues(){/* aplica filter */}
  render(){/* formulario accesible + resumen + lista con botones cerrar; estados vacío y ready */}
}
customElements.define('issue-app',IssueApp);`,
    challengeTitle: 'Proyecto: primer sistema de incidencias', challengeInstructions: 'Completa el corte crear/listar/cerrar con validación, estado inmutable, filtro y controles accesibles. No uses valores fijos.',
    tests: [browserTest('lit32-create', 'Crear una incidencia produce una fila', `async ({document,customElements})=>{await customElements.whenDefined('issue-app');const el=document.querySelector('issue-app');el.createIssue('Error de acceso',2);await el.updateComplete;return el.issues.length===1&&el.shadowRoot.textContent.includes('Error de acceso');}`), browserTest('lit32-close', 'Cerrar conserva identidad y actualiza estado', `async ({document})=>{const el=document.querySelector('issue-app');const id=el.issues[0].id;const before=el.issues[0];el.closeIssue(id);await el.updateComplete;return before!==el.issues[0]&&el.issues[0].status==='closed';}`), browserTest('lit32-invalid', 'Rechaza una entrada inválida', `async ({document})=>{const el=document.querySelector('issue-app');const count=el.issues.length;el.createIssue('  ',9);await el.updateComplete;return el.issues.length===count;}`)],
    hints: ['Empieza por reglas puras de validación y creación.', 'IssueApp es el único dueño del array.', 'Cuando el primer corte pase, añade filtro sin reescribir creación.'],
    model: 'Un corte vertical es una rebanada que se puede usar y probar: dato, regla, interacción y vista viajan juntos antes de abrir otra capacidad.',
    whenToUse: 'Construye por cortes siempre que una aplicación combine varias capas y el riesgo de integrar tarde sea alto.',
    bestPractices: 'Define requisitos observables, separa reglas puras, integra pronto y conserva eventos/propiedades como contratos entre piezas.',
    commonErrors: 'crear todos los componentes vacíos primero, compartir estado mutable, probar solo helpers o esconder requisitos incompletos detrás de UI bonita.',
    transfer: 'Planifica tres cortes para museo, clima o inventario y especifica la evidencia de cada uno.',
    sources: [source('Components overview', 'https://lit.dev/docs/components/overview/', 'Repasa arquitectura de un componente.', 'Lit'), source('Tools and workflows', 'https://lit.dev/docs/tools/overview/', 'Conecta desarrollo, pruebas y producción.', 'Lit')],
    debug: { title: 'Cerrar muta una incidencia y la vista no cambia', expected: 'support-board reemplaza array y objeto.', observed: 'Modifica status sobre la misma referencia.',
      starter: `import{LitElement,html}from'lit';class SupportBoard extends LitElement{static properties={tickets:{state:true}};constructor(){super();this.tickets=[{id:'t1',title:'Acceso',status:'open'}];}close(id){const ticket=this.tickets.find(t=>t.id===id);ticket.status='closed';}render(){return html\`\${this.tickets.map(t=>html\`<p>\${t.title}: \${t.status}</p>\`)}\`;}}customElements.define('support-board',SupportBoard);`,
      tests: [sourceTest('lit32-d1', 'Reemplaza tickets', String.raw`this\.tickets\s*=\s*this\.tickets\.map`), browserTest('lit32-d2', 'La vista refleja closed', `async ({document,customElements})=>{await customElements.whenDefined('support-board');const el=document.querySelector('support-board');el.close('t1');await el.updateComplete;return el.shadowRoot.textContent.includes('closed');}`)],
      hints: ['Lit compara la referencia de tickets.', 'map permite reemplazar solo el ticket elegido.', 'Crea también un objeto nuevo para esa fila.'] },
  }),
];
