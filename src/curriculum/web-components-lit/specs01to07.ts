import { appHtml, browserTest, lesson, source, sourceTest } from './helpers';

const textTest = (id: string, description: string, tag: string, selector: string, expected: string) => browserTest(id, description, `async ({ document, customElements }) => {
  await customElements.whenDefined('${tag}');
  const host = document.querySelector('${tag}');
  if (host?.updateComplete) await host.updateComplete;
  const target = '${selector}' === ':host' ? host : (host?.shadowRoot?.querySelector('${selector}') || host?.querySelector('${selector}'));
  return { passed: Boolean(target?.textContent?.includes('${expected}')), receivedValue: target?.textContent || '' };
}`);

export const COMPONENT_SPECS_01_TO_07 = [
  lesson({
    number: 1, module: 1, title: 'Un componente es un contrato HTML', appName: 'una insignia de estado reutilizable',
    summary: 'Distingue una etiqueta reutilizable de HTML repetido y registra un custom element con un nombre válido.',
    concepts: [{ label: 'Custom element', desc: 'Etiqueta con comportamiento definido por la aplicación.' }, { label: 'Registro', desc: 'Asociación única entre nombre HTML y clase.' }],
    skillsRequired: [], skillsIntroduced: ['component-contract', 'custom-element-registry'],
    reasoningSteps: ['La página encuentra <status-badge>', 'El registro relaciona nombre y clase', 'El navegador crea la instancia', 'La instancia muestra su estado'],
    html: appHtml('Estado del servicio', '<status-badge></status-badge>'),
    example: `class SyncIndicator extends HTMLElement {
  connectedCallback() { this.textContent = 'Sincronizado'; this.setAttribute('role', 'status'); }
}
customElements.define('sync-indicator', SyncIndicator);`,
    starter: `class StatusBadge extends HTMLElement {
  connectedCallback() {
    // Muestra "Operativo" y expón un estado accesible.
  }
}
// Registra status-badge sin cambiar la etiqueta del HTML.`,
    challengeTitle: 'App: estado del servicio', challengeInstructions: 'Registra status-badge y haz que muestre “Operativo” con role="status".',
    tests: [textTest('wc01-text', 'La insignia muestra el estado', 'status-badge', ':host', 'Operativo'), sourceTest('wc01-role', 'Expone un estado accesible', String.raw`setAttribute\s*\(\s*['"]role['"]\s*,\s*['"]status['"]`)],
    hints: ['El nombre público debe coincidir con la etiqueta y contener un guion.', 'El contenido puede escribirse cuando el elemento entra al documento.', 'Comprueba la etiqueta completa, no una clase aislada.'],
    model: 'La etiqueta es una toma pública y el registro conecta esa toma con la clase que conoce el comportamiento.',
    whenToUse: 'Úsalo cuando una pieza tenga nombre de dominio, se repita y necesite un contrato que funcione desde HTML normal.',
    bestPractices: 'Elige nombres con guion, específicos y estables; registra una vez y conserva pequeño el contrato público.',
    commonErrors: 'usar un nombre sin guion, registrar dos veces o convertir cada div pequeño en un componente.',
    transfer: 'Decide si un precio, una tarjeta y una página completa merecen ser componentes y justifica cada frontera.',
    sources: [source('Usar custom elements', 'https://developer.mozilla.org/es/docs/Web/API/Web_components/Using_custom_elements', 'Revisa nombres, registro y upgrade.')],
    debug: { title: 'La alerta nunca se actualiza', expected: 'alerta-app muestra “Revisión pendiente”.', observed: 'El registro usa un nombre inválido.',
      starter: `class AppAlert extends HTMLElement { connectedCallback() { this.textContent = 'Revisión pendiente'; } }
customElements.define('alerta', AppAlert);`,
      tests: [textTest('wc01-d1', 'La alerta se registra', 'alerta-app', ':host', 'Revisión pendiente'), sourceTest('wc01-d2', 'Usa la etiqueta pública', String.raw`customElements\.define\s*\(\s*['"]alerta-app['"]`)],
      hints: ['Lee el error de la consola.', 'Un nombre personalizado necesita guion.', 'El registro debe usar alerta-app.'] },
  }),
  lesson({
    number: 2, module: 1, title: 'HTMLElement y por qué llamamos a super()', appName: 'una tarjeta de perfil con Shadow DOM',
    summary: 'Extiende HTMLElement sin romper la construcción nativa y explica qué inicializa super() antes de usar this.',
    concepts: [{ label: 'Herencia', desc: 'Una clase especializada conserva capacidades de su base.' }, { label: 'super()', desc: 'Ejecuta el constructor base antes de acceder a la instancia derivada.' }],
    skillsRequired: ['component-contract', 'custom-element-registry'], skillsIntroduced: ['html-element-subclass', 'super-constructor'],
    reasoningSteps: ['new crea ProfileCard', 'super() inicializa HTMLElement', 'La subclase puede usar this', 'La tarjeta prepara su DOM'],
    html: appHtml('Equipo', '<profile-card></profile-card>'),
    example: `class TeamMember extends HTMLElement {
  constructor() { super(); const root = this.attachShadow({ mode: 'open' }); root.innerHTML = '<strong>Mar</strong><span>Frontend</span>'; }
}
customElements.define('team-member', TeamMember);`,
    starter: `class ProfileCard extends HTMLElement {
  constructor() {
    // Primero permite que HTMLElement inicialice la instancia.
    // Después crea un shadow root abierto con "Dana" y "UI Engineer".
  }
}
customElements.define('profile-card', ProfileCard);`,
    challengeTitle: 'App: perfil del equipo', challengeInstructions: 'Construye profile-card con Shadow DOM abierto y muestra “Dana” y “UI Engineer”.',
    tests: [textTest('wc02-name', 'La tarjeta muestra el nombre', 'profile-card', ':host', 'Dana'), sourceTest('wc02-super', 'Inicializa la clase base antes de this', String.raw`constructor\s*\([^)]*\)\s*\{\s*super\s*\(\s*\)`)],
    hints: ['La instancia derivada todavía no está disponible al iniciar su constructor.', 'super() debe ocurrir antes del primer this.', 'Después crea y llena la raíz interna.'],
    model: 'super() construye los cimientos de HTMLElement; solo después la subclase puede usar this sobre una instancia válida.',
    whenToUse: 'Todo constructor de una clase derivada debe llamar super(); si no tienes inicialización propia, omite el constructor.',
    bestPractices: 'Mantén el constructor pequeño: inicializa estado y estructura estable; deja red y recursos vivos para el ciclo adecuado.',
    commonErrors: 'usar this antes de super(), olvidar super() o iniciar trabajo externo durante la construcción.',
    transfer: 'Explica qué cambia si ProfileCard omite constructor y solo implementa connectedCallback.',
    sources: [source('super', 'https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Operators/super', 'Comprende constructores derivados.')],
    debug: { title: 'La tarjeta falla antes de aparecer', expected: 'user-summary muestra “Cuenta activa”.', observed: 'Usa this antes de inicializar HTMLElement.',
      starter: `class UserSummary extends HTMLElement {
  constructor() { this.attachShadow({ mode: 'open' }); super(); this.shadowRoot.textContent = 'Cuenta activa'; }
}
customElements.define('user-summary', UserSummary);`,
      tests: [textTest('wc02-d1', 'El resumen renderiza', 'user-summary', ':host', 'Cuenta activa'), sourceTest('wc02-d2', 'super ocurre primero', String.raw`constructor\s*\([^)]*\)\s*\{\s*super\s*\(\s*\)`) ],
      hints: ['El fallo ocurre antes de attachShadow.', 'this depende del constructor base.', 'Mueve super() antes del primer acceso.'] },
  }),
  lesson({
    number: 3, module: 1, title: 'Conectar, desconectar y limpiar', appName: 'un reloj desmontable sin fugas',
    summary: 'Asocia recursos externos con connectedCallback y libéralos simétricamente en disconnectedCallback.',
    concepts: [{ label: 'Conexión', desc: 'Entrada del elemento al documento.' }, { label: 'Limpieza', desc: 'Liberación de recursos que sobrevivirían al elemento.' }],
    skillsRequired: ['html-element-subclass', 'super-constructor'], skillsIntroduced: ['native-lifecycle', 'lifecycle-cleanup'],
    reasoningSteps: ['El elemento se conecta', 'Inicia un recurso', 'El elemento se desconecta', 'Libera el mismo recurso'],
    html: appHtml('Reloj de sesión', '<session-clock></session-clock>'),
    example: `class PulseIndicator extends HTMLElement {
  connectedCallback() { this._timer = setInterval(() => { this.textContent = 'Pulso'; }, 1000); }
  disconnectedCallback() { clearInterval(this._timer); }
}
customElements.define('pulse-indicator', PulseIndicator);`,
    starter: `class SessionClock extends HTMLElement {
  connectedCallback() {
    // Muestra "Sesión" con la hora y guarda el intervalo.
  }
  disconnectedCallback() {
    // Detén exactamente el recurso que iniciaste.
  }
}
customElements.define('session-clock', SessionClock);`,
    challengeTitle: 'App: reloj limpio', challengeInstructions: 'Muestra “Sesión”, actualiza la hora y limpia el intervalo al desconectar.',
    tests: [textTest('wc03-visible', 'El reloj muestra la sesión', 'session-clock', ':host', 'Sesión'), sourceTest('wc03-clean', 'Libera el intervalo', String.raw`disconnectedCallback\s*\([^)]*\)[\s\S]*clearInterval\s*\(`)],
    hints: ['Una instancia puede conectarse varias veces.', 'Guarda el id del intervalo en this.', 'La limpieza debe nombrar el mismo recurso.'],
    model: 'Conectar y desconectar son abrir y cerrar: timer, window, observer o red necesitan una operación simétrica.',
    whenToUse: 'Usa el ciclo para trabajo que solo tiene sentido mientras el elemento está en el documento.',
    bestPractices: 'Conserva referencias, evita duplicados y prueba montar, desmontar y reconectar la misma instancia.',
    commonErrors: 'crear intervalos duplicados, listeners anónimos imposibles de retirar o creer que desconectar destruye para siempre.',
    transfer: 'Dibuja el ciclo de un ResizeObserver y de una petición cancelable.',
    sources: [source('Lifecycle callbacks', 'https://developer.mozilla.org/es/docs/Web/API/Web_components/Using_custom_elements#using_the_lifecycle_callbacks', 'Revisa conexión y desconexión.')],
    debug: { title: 'El listener sobrevive al componente', expected: 'resize-watch retira la misma referencia.', observed: 'add y remove reciben funciones diferentes.',
      starter: `class ResizeWatch extends HTMLElement {
  connectedCallback() { window.addEventListener('resize', () => this.textContent = 'Cambió'); this.textContent = 'Escuchando'; }
  disconnectedCallback() { window.removeEventListener('resize', () => this.textContent = 'Cambió'); }
}
customElements.define('resize-watch', ResizeWatch);`,
      tests: [textTest('wc03-d1', 'El indicador se conecta', 'resize-watch', ':host', 'Escuchando'), sourceTest('wc03-d2', 'Conserva el manejador', String.raw`this\._[\w$]+\s*=\s*(?:\([^)]*\)|[\w$]+)\s*=>|\.bind\s*\(\s*this\s*\)`) ],
      hints: ['Funciones con el mismo texto no son el mismo objeto.', 'Guarda una referencia en this.', 'Usa esa referencia al añadir y retirar.'] },
  }),
  lesson({
    number: 4, module: 1, title: 'Shadow DOM como frontera', appName: 'un aviso con estructura y estilos encapsulados',
    summary: 'Encapsula estructura y CSS con Shadow DOM y decide conscientemente qué permanece público.',
    concepts: [{ label: 'Shadow DOM', desc: 'Subárbol con frontera de consultas y selectores.' }, { label: 'Encapsulación', desc: 'Separación entre implementación y API pública.' }],
    skillsRequired: ['native-lifecycle', 'lifecycle-cleanup'], skillsIntroduced: ['shadow-dom', 'style-encapsulation'],
    reasoningSteps: ['La página crea notice-card', 'El host crea shadowRoot', 'Renderiza CSS y estructura internos', 'El exterior usa la API pública'],
    html: appHtml('Avisos', '<notice-card></notice-card>'),
    example: `class PrivateBanner extends HTMLElement {
  constructor() { super(); const root=this.attachShadow({mode:'open'}); root.innerHTML='<style>.box{border:2px solid #ffe600;padding:12px}</style><div class="box">Actualización disponible</div>'; }
}
customElements.define('private-banner', PrivateBanner);`,
    starter: `class NoticeCard extends HTMLElement {
  constructor() {
    super();
    // Crea una raíz abierta con una .box que diga "Mantenimiento a las 18:00" y estilos internos.
  }
}
customElements.define('notice-card', NoticeCard);`,
    challengeTitle: 'App: aviso encapsulado', challengeInstructions: 'Renderiza el aviso y sus estilos dentro de un Shadow DOM abierto.',
    tests: [textTest('wc04-text', 'El aviso vive dentro del shadow root', 'notice-card', '.box', 'Mantenimiento'), sourceTest('wc04-root', 'Crea la frontera explícita', String.raw`attachShadow\s*\(\s*\{\s*mode\s*:\s*['"]open['"]`)],
    hints: ['Host y shadowRoot son nodos distintos.', 'Renderiza en la raíz devuelta por attachShadow.', 'Los estilos internos no dependen de style.css.'],
    model: 'Shadow DOM es una pared con puertas diseñadas: protege detalles, no secretos, y obliga a decidir atributos, eventos, slots y parts públicos.',
    whenToUse: 'Úsalo cuando estructura y estilos necesiten una frontera reusable; evítalo si ocultar el DOM rompe una integración que debía ser pública.',
    bestPractices: 'Prefiere mode open, evita innerHTML con datos externos y ofrece puntos de extensión deliberados.',
    commonErrors: 'pensar que closed protege secretos, bloquear toda personalización o renderizar datos externos como HTML.',
    transfer: 'Compara una tabla, un icono y un editor. Decide dónde aporta más la frontera.',
    sources: [source('Usar Shadow DOM', 'https://developer.mozilla.org/es/docs/Web/API/Web_components/Using_shadow_DOM', 'Comprende host, árbol y encapsulación.')],
    debug: { title: 'El CSS global invade la nota', expected: 'secure-note mueve .box al shadow root.', observed: 'Renderiza la implementación en light DOM.',
      starter: `class SecureNote extends HTMLElement { connectedCallback() { this.innerHTML='<div class="box">Nota interna</div>'; } }
customElements.define('secure-note', SecureNote);`,
      tests: [textTest('wc04-d1', 'La nota queda en su árbol interno', 'secure-note', '.box', 'Nota interna'), sourceTest('wc04-d2', 'Crea Shadow DOM', String.raw`attachShadow\s*\(`)],
      hints: ['El problema es el árbol, no solo el nombre box.', 'Crea la frontera una vez.', 'Renderiza en shadowRoot.'] },
  }),
  lesson({
    number: 5, module: 2, title: 'Atributos, propiedades y conversión', appName: 'un medidor configurable desde HTML',
    summary: 'Separa atributos de texto de propiedades JavaScript y convierte datos en la frontera.',
    concepts: [{ label: 'Atributo', desc: 'Configuración serializada en HTML.' }, { label: 'Propiedad', desc: 'Dato JavaScript de cualquier tipo.' }],
    skillsRequired: ['shadow-dom', 'style-encapsulation'], skillsIntroduced: ['attributes-properties', 'attribute-conversion'],
    reasoningSteps: ['HTML cambia value="72"', 'El callback recibe texto', 'Convierte y valida', 'Renderiza el número'],
    html: appHtml('Progreso', '<progress-meter value="25"></progress-meter>'),
    example: `class TemperatureBadge extends HTMLElement {
  static observedAttributes=['value'];
  attributeChangedCallback(_n,_o,value){const n=Number(value);this.textContent=Number.isFinite(n)?n+' °C':'Sin dato';}
}
customElements.define('temperature-badge',TemperatureBadge);`,
    starter: `class ProgressMeter extends HTMLElement {
  static observedAttributes = [/* atributo público */];
  attributeChangedCallback(name, oldValue, newValue) {
    // Convierte, limita entre 0 y 100 y muestra "Progreso: N%".
  }
}
customElements.define('progress-meter', ProgressMeter);`,
    challengeTitle: 'App: progreso configurable', challengeInstructions: 'Observa value, conviértelo, limita 0–100 y renderiza “Progreso: N%”.',
    tests: [browserTest('wc05-change', 'Reacciona a otro valor', `async ({document,customElements})=>{await customElements.whenDefined('progress-meter');const el=document.querySelector('progress-meter');el.setAttribute('value','72');await Promise.resolve();return el.textContent.includes('72%');}`), sourceTest('wc05-observe', 'Observa value', String.raw`observedAttributes\s*=\s*\[[^\]]*['"]value['"]`)],
    hints: ['Los atributos llegan como strings.', 'Convierte, valida y solo después renderiza.', 'Prueba -10 y 140 además de 72.'],
    model: 'El atributo es una etiqueta escrita; la propiedad es el dato real. La frontera convierte entre HTML y JavaScript.',
    whenToUse: 'Ofrece atributos para configuración declarativa simple y propiedades para objetos, arrays o funciones.',
    bestPractices: 'Documenta tipos, convierte una vez y define qué ocurre con entradas inválidas.',
    commonErrors: 'sumar strings, serializar objetos en atributos o crear ciclos de sincronización.',
    transfer: 'Diseña la API de un selector con options como array y disabled desde HTML.',
    sources: [source('Cambios de atributos', 'https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#responding_to_attribute_changes', 'Estudia observedAttributes.')],
    debug: { title: 'El medidor concatena', expected: 'score-meter muestra 15 para value="10" más cinco.', observed: 'Muestra 105.',
      starter: `class ScoreMeter extends HTMLElement { static observedAttributes=['value']; attributeChangedCallback(_n,_o,value){this.textContent=value+5;} }
customElements.define('score-meter',ScoreMeter);`,
      tests: [browserTest('wc05-d1', 'Calcula con números', `async ({document,customElements})=>{await customElements.whenDefined('score-meter');const el=document.querySelector('score-meter');el.setAttribute('value','10');return el.textContent==='15';}`), sourceTest('wc05-d2', 'Convierte la entrada', String.raw`Number\s*\(|parse(?:Int|Float)\s*\(`)],
      hints: ['Inspecciona typeof value.', 'La apariencia no cambia el tipo.', 'Convierte antes de sumar.'] },
  }),
  lesson({
    number: 6, module: 2, title: 'Reflexión y estados observables', appName: 'un interruptor accesible sincronizado',
    summary: 'Refleja solo estados que el exterior necesita observar y evita ciclos entre propiedad, atributo y render.',
    concepts: [{ label: 'Reflexión', desc: 'Escribir una propiedad de vuelta a un atributo.' }, { label: 'Booleano HTML', desc: 'Estado expresado por presencia o ausencia.' }],
    skillsRequired: ['attributes-properties', 'attribute-conversion'], skillsIntroduced: ['property-reflection', 'boolean-attribute'],
    reasoningSteps: ['La persona pulsa', 'Cambia active', 'Refleja el atributo', 'Actualiza ARIA y texto'],
    html: appHtml('Preferencias', '<setting-toggle></setting-toggle>'),
    example: `class FavoriteToggle extends HTMLElement {
  connectedCallback(){this._render();this.addEventListener('click',()=>this.active=!this.active);}
  get active(){return this.hasAttribute('active');}
  set active(value){this.toggleAttribute('active',Boolean(value));this._render();}
  _render(){this.textContent=this.active?'Favorito':'Añadir';this.setAttribute('aria-pressed',String(this.active));}
}
customElements.define('favorite-toggle',FavoriteToggle);`,
    starter: `class SettingToggle extends HTMLElement {
  connectedCallback() { this.tabIndex=0; /* renderiza y alterna active al hacer clic */ }
  // Diseña getter/setter active y sincroniza texto con aria-pressed.
}
customElements.define('setting-toggle',SettingToggle);`,
    challengeTitle: 'App: interruptor observable', challengeInstructions: 'Alterna active, aria-pressed y texto “Activado”/“Desactivado”.',
    tests: [browserTest('wc06-toggle', 'Un clic sincroniza el estado', `async ({document,customElements})=>{await customElements.whenDefined('setting-toggle');const el=document.querySelector('setting-toggle');el.click();return el.hasAttribute('active')&&el.getAttribute('aria-pressed')==='true'&&el.textContent.includes('Activado');}`), sourceTest('wc06-api', 'Expone active como propiedad', String.raw`(?:get|set)\s+active\s*\(`)],
    hints: ['Un booleano HTML usa presencia/ausencia.', 'Elige una sola fuente de verdad.', 'Actualiza texto y aria-pressed juntos.'],
    model: 'Reflejar coloca un indicador en la puerta: solo merece existir si CSS, accesibilidad o integradores necesitan observarlo.',
    whenToUse: 'Refleja estados simples y públicos; conserva detalles internos como propiedades no reflejadas.',
    bestPractices: 'Una fuente de verdad, sin recursión, y ARIA sincronizado con el estado visual.',
    commonErrors: 'usar active="false", reflejar objetos o crear setter→atributo→callback→setter.',
    transfer: 'Diseña expanded para un acordeón y loading para un botón.',
    sources: [source('toggleAttribute()', 'https://developer.mozilla.org/en-US/docs/Web/API/Element/toggleAttribute', 'Consulta presencia booleana.')],
    debug: { title: 'false sigue contando como activo', expected: 'privacy-toggle no tiene active y muestra Inactivo.', observed: 'Escribe active="false".',
      starter: `class PrivacyToggle extends HTMLElement { connectedCallback(){this.setAttribute('active','false');this.textContent=this.hasAttribute('active')?'Activo':'Inactivo';} }
customElements.define('privacy-toggle',PrivacyToggle);`,
      tests: [browserTest('wc06-d1', 'El falso elimina el atributo', `async ({document,customElements})=>{await customElements.whenDefined('privacy-toggle');const el=document.querySelector('privacy-toggle');return !el.hasAttribute('active')&&el.textContent.includes('Inactivo');}`), sourceTest('wc06-d2', 'Controla presencia', String.raw`(?:removeAttribute|toggleAttribute)\s*\(\s*['"]active['"]`)],
      hints: ['hasAttribute no lee el texto.', 'false significa ausencia.', 'Quita o alterna el atributo.'] },
  }),
  lesson({
    number: 7, module: 2, title: 'Eventos públicos con CustomEvent', appName: 'un selector de cantidad desacoplado',
    summary: 'Diseña eventos con nombre, detail, bubbles y composed para comunicar decisiones sin controlar al padre.',
    concepts: [{ label: 'Evento público', desc: 'Notificación observable de algo ocurrido.' }, { label: 'detail', desc: 'Datos propios de un CustomEvent.' }],
    skillsRequired: ['property-reflection', 'boolean-attribute'], skillsIntroduced: ['custom-events', 'event-contract'],
    reasoningSteps: ['La persona pulsa +', 'El hijo calcula cantidad', 'Emite quantity-change', 'El padre decide'],
    html: appHtml('Cantidad', '<quantity-picker></quantity-picker>'),
    example: `class RatingPicker extends HTMLElement {
  connectedCallback(){this.innerHTML='<button>Valorar con 5</button>';this.querySelector('button').onclick=()=>this.dispatchEvent(new CustomEvent('rating-change',{detail:{value:5},bubbles:true,composed:true}));}
}
customElements.define('rating-picker',RatingPicker);`,
    starter: `class QuantityPicker extends HTMLElement {
  connectedCallback(){
    this.quantity=1;this.innerHTML='<button>Aumentar</button><output>1</output>';
    this.querySelector('button').addEventListener('click',()=>{ /* aumenta, renderiza y emite quantity-change */ });
  }
}
customElements.define('quantity-picker',QuantityPicker);`,
    challengeTitle: 'App: selector desacoplado', challengeInstructions: 'Incrementa, actualiza output y emite quantity-change con detail.value, bubbles y composed.',
    tests: [browserTest('wc07-event', 'Emite el contrato completo', `async ({document,customElements})=>{await customElements.whenDefined('quantity-picker');const el=document.querySelector('quantity-picker');let event=null;document.addEventListener('quantity-change',e=>event=e,{once:true});el.querySelector('button').click();return event?.detail?.value===2&&event.bubbles&&event.composed;}`), sourceTest('wc07-name', 'Usa un evento de dominio', String.raw`CustomEvent\s*\(\s*['"]quantity-change['"]`)],
    hints: ['El hijo informa; no busca ni modifica al padre.', 'detail lleva el dato estable.', 'bubbles y composed permiten que el aviso viaje.'],
    model: 'Un evento es una carta: nombre dice qué ocurrió, detail lleva datos y las opciones deciden hasta dónde viaja.',
    whenToUse: 'Usa eventos para decisiones nacidas dentro del componente; usa propiedades para datos que entran.',
    bestPractices: 'Nombra hechos, documenta detail y prueba desde la API pública.',
    commonErrors: 'emitir órdenes al padre, omitir composed tras Shadow DOM o filtrar nodos internos.',
    transfer: 'Diseña eventos para un modal que se cierra y un campo que valida.',
    sources: [source('CustomEvent', 'https://developer.mozilla.org/es/docs/Web/API/CustomEvent', 'Consulta detail.'), source('Event composed', 'https://developer.mozilla.org/en-US/docs/Web/API/Event/composed', 'Comprende Shadow DOM.')],
    debug: { title: 'El evento queda atrapado', expected: 'document recibe line-remove.', observed: 'No usa bubbles ni composed.',
      starter: `class CartLine extends HTMLElement { constructor(){super();this.attachShadow({mode:'open'});} connectedCallback(){this.shadowRoot.innerHTML='<button>Quitar</button>';this.shadowRoot.querySelector('button').onclick=()=>this.dispatchEvent(new CustomEvent('line-remove',{detail:{id:'a1'}}));} }
customElements.define('cart-line',CartLine);`,
      tests: [browserTest('wc07-d1', 'El documento recibe el evento', `async ({document,customElements})=>{await customElements.whenDefined('cart-line');const el=document.querySelector('cart-line');let event=null;document.addEventListener('line-remove',e=>event=e,{once:true});el.shadowRoot.querySelector('button').click();return event?.detail?.id==='a1';}`), sourceTest('wc07-d2', 'Atraviesa la frontera', String.raw`bubbles\s*:\s*true[\s\S]*composed\s*:\s*true|composed\s*:\s*true[\s\S]*bubbles\s*:\s*true`)],
      hints: ['El botón vive detrás de una frontera.', 'El evento debe ascender y atravesarla.', 'Corrige opciones, no detail.'] },
  }),
];
