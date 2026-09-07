import { appHtml, browserTest, lesson, source } from './helpers';

const shadowText = (id: string, description: string, tag: string, selector: string, expected: string) => browserTest(id, description, `async ({document,customElements})=>{await customElements.whenDefined('${tag}');const el=document.querySelector('${tag}');const node=el?.shadowRoot?.querySelector('${selector}')||el?.querySelector('${selector}');return {passed:Boolean(node?.textContent?.includes('${expected}')),receivedValue:node?.textContent||''};}`);

export const COMPONENT_SPECS_08_TO_14 = [
  lesson({
    number: 8, module: 2, title: 'Slots y composición', appName: 'un panel compuesto por contenido del consumidor',
    summary: 'Compone contenido externo mediante slots sin apropiarte de los datos ni duplicar markup.',
    concepts: [{ label: 'Slot', desc: 'Punto donde el consumidor proyecta contenido.' }, { label: 'Composición', desc: 'Construcción de una interfaz combinando contratos pequeños.' }],
    skillsRequired: ['custom-events', 'event-contract'], skillsIntroduced: ['slots', 'content-composition'],
    reasoningSteps: ['El consumidor escribe contenido', 'slot clasifica por nombre', 'Shadow DOM define la estructura', 'El navegador proyecta el contenido'],
    html: appHtml('Resumen', '<summary-panel><strong slot="title">Pedido #42</strong><p>Dos artículos listos</p><button slot="actions">Abrir</button></summary-panel>'),
    example: `class MessageBox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).innerHTML =
      '<article><header><slot name="title"></slot></header><div><slot></slot></div></article>';
  }
}
customElements.define('message-box', MessageBox);`,
    starter: `class SummaryPanel extends HTMLElement {
  constructor() {
    super();
    // Crea una estructura con slot title, slot por defecto y slot actions.
  }
}
customElements.define('summary-panel', SummaryPanel);`,
    challengeTitle: 'App: panel componible', challengeInstructions: 'Construye la estructura de SummaryPanel con los tres slots sin copiar el contenido del consumidor.',
    tests: [browserTest('wc08-slots', 'Expone los tres puntos de composición', `async ({document,customElements})=>{await customElements.whenDefined('summary-panel');const root=document.querySelector('summary-panel')?.shadowRoot;return Boolean(root?.querySelector('slot[name="title"]')&&Array.from(root.querySelectorAll('slot')).some(slot=>slot.name==='')&&root.querySelector('slot[name="actions"]'));}`), browserTest('wc08-no-copy', 'Proyecta los nodos del consumidor sin reemplazarlos', `async ({document,customElements})=>{
      await customElements.whenDefined('summary-panel');
      const container=document.createElement('div');container.style.display='none';
      const el=document.createElement('summary-panel');
      const title=document.createElement('strong');title.slot='title';title.textContent='Pedido de prueba';
      const body=document.createElement('p');body.textContent='Contenido externo';
      const action=document.createElement('button');action.slot='actions';action.textContent='Consultar';
      el.append(title,body,action);container.append(el);
      try {
        document.body.append(container);
        const root=el.shadowRoot;if(!root)return false;
        const projected=(name,node)=>Array.from(root.querySelectorAll('slot')).some(slot=>slot.name===name&&slot.assignedElements().includes(node));
        if(title.parentNode!==el||body.parentNode!==el||action.parentNode!==el||!projected('title',title)||!projected('',body)||!projected('actions',action))return false;
        const replacement=document.createElement('p');replacement.textContent='Contenido actualizado';body.replaceWith(replacement);
        return projected('',replacement)&&!projected('',body)&&projected('actions',action);
      } finally {container.remove();}
    }`)],
    hints: ['La estructura pertenece al componente; el contenido pertenece al consumidor.', 'Un slot sin name recibe el contenido por defecto.', 'Los nombres title y actions son parte de la API.'],
    model: 'El componente pone estantes con etiquetas; quien lo usa decide qué objetos coloca en cada estante.',
    whenToUse: 'Usa slots cuando el consumidor debe aportar DOM, semántica o controles que el componente no debería serializar.',
    bestPractices: 'Nombra slots por función, ofrece fallback útil y no dependas de la estructura privada del contenido proyectado.',
    commonErrors: 'copiar innerHTML, crear demasiados slots, estilizar profundamente contenido ajeno o cambiar nombres sin tratarlo como ruptura.',
    transfer: 'Diseña slots para un modal y una tarjeta. Decide qué contenido es dato y cuál es composición.',
    sources: [source('Usar templates y slots', 'https://developer.mozilla.org/es/docs/Web/API/Web_components/Using_templates_and_slots', 'Comprende proyección y slots con nombre.')],
    debug: { title: 'Las acciones aparecen en el cuerpo', expected: 'dialog-shell proyecta el botón en footer.', observed: 'El slot del footer no tiene nombre.',
      starter: `class DialogShell extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).innerHTML =
      '<section><slot></slot><footer><slot></slot></footer></section>';
  }
}
customElements.define('dialog-shell', DialogShell);`,
      tests: [browserTest('wc08-d1', 'El footer tiene slot actions', `async ({document,customElements})=>{await customElements.whenDefined('dialog-shell');return Boolean(document.querySelector('dialog-shell').shadowRoot.querySelector('footer slot[name="actions"]'));}`), browserTest('wc08-d2', 'Proyecta el cuerpo y las acciones en destinos distintos', `async ({document,customElements})=>{
        await customElements.whenDefined('dialog-shell');
        const container=document.createElement('div');container.style.display='none';
        const el=document.createElement('dialog-shell');const body=document.createElement('p');body.textContent='Mensaje';
        const action=document.createElement('button');action.slot='actions';action.textContent='Cerrar';el.append(body,action);container.append(el);
        try {document.body.append(container);const root=el.shadowRoot;if(!root)return false;
          const footer=root.querySelector('footer slot[name="actions"]');
          const bodySlot=Array.from(root.querySelectorAll('slot')).find(slot=>slot.name===''&&slot.assignedElements().includes(body));
          return Boolean(bodySlot&&!bodySlot.closest('footer')&&footer?.assignedElements().includes(action)&&body.parentNode===el&&action.parentNode===el);
        } finally {container.remove();}
      }`) ],
      hints: ['El botón externo usa slot="actions".', 'El receptor debe declarar el mismo nombre.', 'Solo uno de los slots queda sin nombre.'] },
  }),
  lesson({
    number: 9, module: 3, title: 'Render predecible desde estado', appName: 'una lista de compras con una sola fuente de verdad',
    summary: 'Reconstruye la vista desde estado y evita parches DOM que dejan datos e interfaz en desacuerdo.',
    concepts: [{ label: 'Estado', desc: 'Datos mínimos que explican la interfaz actual.' }, { label: 'Render', desc: 'Transformación repetible de estado a DOM.' }],
    skillsRequired: ['slots', 'content-composition'], skillsIntroduced: ['native-state-render', 'single-source-truth'],
    reasoningSteps: ['Una acción produce datos nuevos', 'La instancia reemplaza su estado', 'render lee todo el estado', 'El DOM vuelve a coincidir'],
    html: appHtml('Compras', '<shopping-list></shopping-list>'),
    example: `class TagList extends HTMLElement {
  connectedCallback() {
    this.tags = ['web', 'ui'];
    this.render();
  }
  render() {
    this.innerHTML =
      '<ul>' + this.tags.map((tag) => '<li>' + tag + '</li>').join('') + '</ul>';
  }
}
customElements.define('tag-list', TagList);`,
    starter: `class ShoppingList extends HTMLElement {
  connectedCallback() {
    this.items = ['Pan'];
    this.render();
  }
  addItem(name) {
    // Crea un array nuevo y vuelve a renderizar.
  }
  render() {
    // Construye la lista completa desde this.items.
  }
}
customElements.define('shopping-list', ShoppingList);`,
    challengeTitle: 'App: lista desde estado', challengeInstructions: 'Renderiza Pan, permite addItem y reconstruye la lista desde un array nuevo.',
    tests: [browserTest('wc09-state', 'Agregar actualiza estado y vista', `async ({document,customElements})=>{await customElements.whenDefined('shopping-list');const el=document.querySelector('shopping-list');el.addItem('Café');return el.items.length===2&&el.querySelectorAll('li').length===2&&el.textContent.includes('Café');}`), browserTest('wc09-render', 'Usa un array nuevo y reconstruye la vista desde el estado', `async ({document,customElements})=>{
      await customElements.whenDefined('shopping-list');const container=document.createElement('div');container.style.display='none';
      const el=document.createElement('shopping-list');container.append(el);
      try {document.body.append(container);if(!Array.isArray(el.items)||typeof el.render!=='function'||typeof el.addItem!=='function')return false;
        const original=el.items;const before=[...original];el.addItem('Tomate');
        if(el.items===original||JSON.stringify(original)!==JSON.stringify(before)||JSON.stringify(el.items)!==JSON.stringify([...before,'Tomate']))return false;
        el.items=['Arroz','Limón','Sal'];el.render();el.render();
        if(JSON.stringify(Array.from(el.querySelectorAll('li'),node=>node.textContent.trim()))!==JSON.stringify(el.items))return false;
        el.items=[];el.render();return el.querySelectorAll('li').length===0;
      } finally {container.remove();}
    }`) ],
    hints: ['El array es la fuente; los li son una representación descartable.', 'No hagas push y appendChild por caminos separados.', 'Después de reemplazar el array llama un único render.'],
    model: 'El estado es la receta y el DOM es el plato. Si cambias el plato sin cambiar la receta, ya no puedes reconstruirlo.',
    whenToUse: 'Usa render desde estado cuando varias acciones pueden cambiar la misma vista y necesitas resultados repetibles.',
    bestPractices: 'Guarda datos mínimos, produce referencias nuevas y mantén render sin efectos externos.',
    commonErrors: 'duplicar estado en el DOM, mezclar mutaciones con parches o guardar nodos derivados como fuente principal.',
    transfer: 'Modela el estado mínimo de pestañas, carrito y buscador; elimina todo dato que pueda derivarse.',
    sources: [source('Estado de una aplicación', 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Client-side_tools/React_getting_started#state_and_props', 'Contrasta fuente de verdad y representación.')],
    debug: { title: 'La lista se duplica al renderizar', expected: 'task-list vuelve a producir exactamente dos filas.', observed: 'render agrega sin limpiar la representación anterior.',
      starter: `class TaskList extends HTMLElement {
  connectedCallback() {
    this.tasks = ['Uno', 'Dos'];
    this.render();
    this.render();
  }
  render() {
    this.tasks.forEach((task) =>
      this.insertAdjacentHTML('beforeend', '<p>' + task + '</p>'),
    );
  }
}
customElements.define('task-list', TaskList);`,
      tests: [browserTest('wc09-d1', 'Render es idempotente', `async ({document,customElements})=>{await customElements.whenDefined('task-list');const el=document.querySelector('task-list');el.render();return el.querySelectorAll('p').length===2;}`), browserTest('wc09-d2', 'Reconstruye filas cuando el estado cambia o queda vacío', `async ({document,customElements})=>{
        await customElements.whenDefined('task-list');const container=document.createElement('div');container.style.display='none';
        const el=document.createElement('task-list');container.append(el);
        try {document.body.append(container);if(typeof el.render!=='function')return false;
          for(const tasks of [['Tres'],['Cuatro','Cinco','Seis'],[]]) {el.tasks=tasks;el.render();el.render();
            if(JSON.stringify(Array.from(el.querySelectorAll('p'),node=>node.textContent.trim()))!==JSON.stringify(tasks))return false;}
          return true;
        } finally {container.remove();}
      }`) ],
      hints: ['Llamar render dos veces debe dar el mismo DOM.', 'Elimina o reemplaza antes de crear filas.', 'El estado ya contiene la lista completa.'] },
  }),
  lesson({
    number: 10, module: 3, title: 'Padre, hijos y flujo unidireccional', appName: 'un carrito compuesto sin estado duplicado',
    summary: 'Envía datos hacia abajo por propiedades y decisiones hacia arriba por eventos.',
    concepts: [{ label: 'Flujo unidireccional', desc: 'Datos bajan; eventos suben.' }, { label: 'Propietario del estado', desc: 'Componente responsable de actualizar el dato canónico.' }],
    skillsRequired: ['native-state-render', 'single-source-truth'], skillsIntroduced: ['parent-child-flow', 'state-ownership'],
    reasoningSteps: ['CartApp posee items', 'Pasa item a cart-line', 'El hijo emite line-remove', 'El padre actualiza items y renderiza'],
    html: appHtml('Carrito', '<cart-app></cart-app>'),
    example: `class ProductRow extends HTMLElement {
  set product(value) {
    this._product = value;
    this.textContent = value.name;
  }
}
customElements.define('product-row', ProductRow);
class ProductList extends HTMLElement {
  connectedCallback() {
    const row = document.createElement('product-row');
    row.product = { name: 'Libro' };
    this.append(row);
  }
}
customElements.define('product-list', ProductList);`,
    starter: `class CartLine extends HTMLElement {
  set item(value) {
    this._item = value;
    this.render();
  }
  render() {
    this.innerHTML = this._item
      ? '<span>' + this._item.name + '</span><button>Quitar</button>'
      : ''; /* emite line-remove con id */
  }
}
customElements.define('cart-line', CartLine);
class CartApp extends HTMLElement {
  connectedCallback() {
    this.items = [
      { id: 'a', name: 'Libro' },
      { id: 'b', name: 'Lápiz' },
    ];
    this.addEventListener('line-remove', (event) => {
      /* actualiza estado */
    });
    this.render();
  }
  render() {
    /* crea cart-line y asigna item como propiedad */
  }
}
customElements.define('cart-app', CartApp);`,
    challengeTitle: 'App: carrito con dueño claro', challengeInstructions: 'Haz que CartApp pase items por propiedad, escuche line-remove y elimine solo el id recibido.',
    tests: [browserTest('wc10-flow', 'El evento de un hijo actualiza al padre', `async ({document,customElements})=>{await Promise.all([customElements.whenDefined('cart-app'),customElements.whenDefined('cart-line')]);const app=document.querySelector('cart-app');const button=app?.querySelector('cart-line button');if(!button)return false;button.click();return app.items.length===1&&app.querySelectorAll('cart-line').length===1;}`), browserTest('wc10-property', 'Los objetos y el id solicitado conservan su contrato', `async ({document,customElements,CustomEvent})=>{
      await Promise.all([customElements.whenDefined('cart-app'),customElements.whenDefined('cart-line')]);
      const container=document.createElement('div');container.style.display='none';const app=document.createElement('cart-app');container.append(app);
      try {document.body.append(container);if(typeof app.render!=='function')return false;
        const probe=document.createElement('cart-line');probe.item={id:'probe',name:'Producto externo'};container.append(probe);
        if(!probe.textContent.includes('Producto externo'))return false;
        app.items=[{id:'c',name:'Cuaderno'},{id:'d',name:'Regla'},{id:'e',name:'Goma'}];app.render();
        const lines=Array.from(app.querySelectorAll('cart-line'));
        if(lines.length!==3||lines.some((line,index)=>line.hasAttribute('item')||!line.textContent.includes(app.items[index].name)))return false;
        const button=lines[1].querySelector('button');if(!button)return false;button.click();
        const correct=()=>JSON.stringify(app.items.map(item=>item.id))==='["c","e"]'&&app.querySelectorAll('cart-line').length===2&&app.textContent.includes('Cuaderno')&&app.textContent.includes('Goma')&&!app.textContent.includes('Regla');
        if(!correct())return false;
        app.querySelector('cart-line').dispatchEvent(new CustomEvent('line-remove',{detail:{id:'ausente'},bubbles:true}));
        return correct();
      } finally {container.remove();}
    }`) ],
    hints: ['CartApp es el único dueño de items.', 'CartLine recibe un objeto por propiedad y solo emite el id.', 'El padre reemplaza el array y vuelve a renderizar.'],
    model: 'El padre lleva el libro contable; los hijos leen una página y envían recibos, pero no reescriben el libro por su cuenta.',
    whenToUse: 'Úsalo cuando varios componentes representan o modifican partes del mismo estado.',
    bestPractices: 'Coloca el estado en el ancestro común más cercano y define eventos de dominio, no referencias al padre.',
    commonErrors: 'duplicar items en cada hijo, pasar objetos por atributos o permitir que el hijo mute el objeto recibido.',
    transfer: 'Dibuja el dueño del estado en una tabla con filtros y un editor de fila.',
    sources: [source('Eventos en componentes', 'https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#custom_events', 'Aplica eventos a fronteras públicas.')],
    debug: { title: 'El hijo borra el DOM pero no el estado', expected: 'inventory-app elimina el producto de products.', observed: 'La fila llama remove() y el próximo render lo revive.',
      starter: `class InventoryApp extends HTMLElement {
  connectedCallback() {
    this.products = [{ id: 'x', name: 'Teclado' }];
    this.innerHTML = '<button>Quitar</button>';
    this.querySelector('button').onclick = () => this.querySelector('button').remove();
  }
}
customElements.define('inventory-app', InventoryApp);`,
      tests: [browserTest('wc10-d1', 'La acción cambia la fuente de verdad', `async ({document,customElements})=>{await customElements.whenDefined('inventory-app');const el=document.querySelector('inventory-app');el.querySelector('button').click();return el.products.length===0;}`), browserTest('wc10-d2', 'La eliminación deja datos y representación de acuerdo', `async ({document,customElements})=>{
        await customElements.whenDefined('inventory-app');const container=document.createElement('div');container.style.display='none';
        const el=document.createElement('inventory-app');container.append(el);
        try {document.body.append(container);const button=el.querySelector('button');if(!button||!Array.isArray(el.products)||el.products.length!==1)return false;
          button.click();if(typeof el.render==='function')el.render();
          return el.products.length===0&&!el.querySelector('button');
        } finally {container.remove();}
      }`) ],
      hints: ['El botón no es la fuente de verdad.', 'Cambia products usando el id.', 'Después representa el nuevo estado.'] },
  }),
  lesson({
    number: 11, module: 3, title: 'Accesibilidad, teclado y foco', appName: 'un menú de acciones operable sin ratón',
    summary: 'Conserva semántica nativa, administra foco y ofrece teclado sin inventar controles incompletos.',
    concepts: [{ label: 'Semántica', desc: 'Significado que navegador y tecnología asistiva comparten.' }, { label: 'Gestión de foco', desc: 'Movimiento predecible del punto de interacción.' }],
    skillsRequired: ['parent-child-flow', 'state-ownership'], skillsIntroduced: ['component-accessibility', 'keyboard-focus'],
    reasoningSteps: ['El usuario enfoca el botón', 'Enter abre el menú', 'El foco pasa a una opción', 'Escape cierra y devuelve el foco'],
    html: appHtml('Acciones', '<action-menu></action-menu>'),
    example: `class HelpDisclosure extends HTMLElement {
  connectedCallback() {
    this.innerHTML =
      '<button aria-expanded="false">Ayuda</button><p hidden>Contenido</p>';
    const b = this.querySelector('button');
    b.onclick = () => {
      const open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', String(open));
      this.querySelector('p').hidden = !open;
    };
  }
}
customElements.define('help-disclosure', HelpDisclosure);`,
    starter: `class ActionMenu extends HTMLElement {
  connectedCallback() {
    this.innerHTML = \`
      <button aria-expanded="false">Acciones</button>
      <div role="menu" hidden>
        <button role="menuitem">Editar</button>
        <button role="menuitem">Archivar</button>
      </div>
    \`;
    // Implementa clic, foco y Escape.
  }
}
customElements.define('action-menu', ActionMenu);`,
    challengeTitle: 'App: menú accesible', challengeInstructions: 'Abre/cierra el menú, sincroniza aria-expanded, enfoca la primera opción y cierra con Escape devolviendo foco.',
    tests: [browserTest('wc11-a11y', 'Clic abre y actualiza ARIA', `async ({document,customElements})=>{await customElements.whenDefined('action-menu');const el=document.querySelector('action-menu');const trigger=el.querySelector('button');trigger.click();return trigger.getAttribute('aria-expanded')==='true'&&!el.querySelector('[role="menu"]').hidden;}`), browserTest('wc11-key', 'Abrir y Escape mantienen el estado y el foco', `async ({window,document,customElements})=>{
      await customElements.whenDefined('action-menu');const previousFocus=document.activeElement;
      const container=document.createElement('div');container.style.cssText='position:fixed;left:-10000px;top:0';
      const el=document.createElement('action-menu');container.append(el);
      try {document.body.append(container);const trigger=el.querySelector('button');const menu=el.querySelector('[role="menu"]');const first=menu?.querySelector('[role="menuitem"]');
        if(!trigger||!menu||!first||!menu.hidden||trigger.getAttribute('aria-expanded')!=='false')return false;
        trigger.click();if(menu.hidden||trigger.getAttribute('aria-expanded')!=='true'||document.activeElement!==first)return false;
        first.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
        if(!menu.hidden||trigger.getAttribute('aria-expanded')!=='false'||document.activeElement!==trigger)return false;
        trigger.click();trigger.click();return menu.hidden&&trigger.getAttribute('aria-expanded')==='false';
      } finally {container.remove();if(previousFocus?.isConnected&&typeof previousFocus.focus==='function')previousFocus.focus({preventScroll:true});}
    }`) ],
    hints: ['Empieza con button nativo, no div con role.', 'ARIA describe el mismo estado que hidden.', 'Guarda trigger para devolverle el foco.'],
    model: 'La accesibilidad es parte del contrato de interacción: nombre, rol, estado, teclado y foco deben contar la misma historia.',
    whenToUse: 'Diseña teclado y foco cuando el componente abre superficies, selecciona opciones o cambia contexto.',
    bestPractices: 'Prefiere elementos nativos, prueba solo con teclado y no añadas ARIA que contradiga al HTML.',
    commonErrors: 'divs clicables sin teclado, foco perdido al cerrar o aria-expanded desincronizado.',
    transfer: 'Especifica el recorrido de foco de un modal y de una lista seleccionable.',
    sources: [source('Accesibilidad del teclado', 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Keyboard', 'Revisa operación por teclado.'), source('ARIA menu role', 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/menu_role', 'Comprende el patrón y sus costes.')],
    debug: { title: 'El botón de div no responde al teclado', expected: 'save-control usa semántica button.', observed: 'Solo escucha click sobre un div.',
      starter: `class SaveControl extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<div class="save">Guardar</div>';
    this.querySelector('.save').onclick = () => this.setAttribute('saved', '');
  }
}
customElements.define('save-control', SaveControl);`,
      tests: [browserTest('wc11-d1', 'Usa un botón nativo', `async ({document,customElements})=>{await customElements.whenDefined('save-control');return Boolean(document.querySelector('save-control')?.querySelector('button')?.textContent.includes('Guardar'));}`), browserTest('wc11-d2', 'Activar el botón guarda realmente', `async ({document,customElements})=>{
        await customElements.whenDefined('save-control');const container=document.createElement('div');container.style.display='none';const el=document.createElement('save-control');container.append(el);
        try {document.body.append(container);const button=el.querySelector('button');if(!button||button.disabled||el.hasAttribute('saved'))return false;
          button.click();return el.hasAttribute('saved');
        } finally {container.remove();}
      }`) ],
      hints: ['No repares el div añadiendo muchos atributos.', 'El navegador ya trae un control correcto.', 'Cambia la etiqueta y conserva la acción.'] },
  }),
  lesson({
    number: 12, module: 3, title: 'Componentes asociados a formularios', appName: 'un campo de cantidad que participa en FormData',
    summary: 'Integra un custom element con formularios mediante ElementInternals, validación y estados disabled.',
    concepts: [{ label: 'ElementInternals', desc: 'API interna para semántica, formulario y validación.' }, { label: 'Form-associated', desc: 'Elemento que participa en el contrato de un form.' }],
    skillsRequired: ['component-accessibility', 'keyboard-focus'], skillsIntroduced: ['form-associated-elements', 'element-internals'],
    reasoningSteps: ['El formulario contiene quantity-field', 'El campo calcula un valor válido', 'ElementInternals publica el valor', 'FormData recoge el contrato'],
    html: appHtml('Pedido', '<form id="order"><quantity-field name="quantity"></quantity-field><button>Enviar</button></form>'),
    example: `class CodeField extends HTMLElement {
  static formAssociated = true;
  constructor() {
    super();
    this._internals = this.attachInternals();
  }
  connectedCallback() {
    this.innerHTML = '<input aria-label="Código">';
    this.querySelector('input').oninput = (e) =>
      this._internals.setFormValue(e.target.value);
  }
}
customElements.define('code-field', CodeField);`,
    starter: `class QuantityField extends HTMLElement {
  static formAssociated = true;
  constructor() {
    super(); /* guarda attachInternals */
  }
  connectedCallback() {
    this.innerHTML =
      '<input type="number" min="1" value="1" aria-label="Cantidad">'; /* publica cada valor en el formulario */
  }
}
customElements.define('quantity-field', QuantityField);`,
    challengeTitle: 'App: campo que sí pertenece al formulario', challengeInstructions: 'Conecta el input con ElementInternals para que FormData entregue quantity y valida valores menores que uno.',
    tests: [browserTest('wc12-form', 'FormData recibe el valor', `async ({document,customElements})=>{await customElements.whenDefined('quantity-field');const el=document.querySelector('quantity-field');const input=el.querySelector('input');input.value='3';input.dispatchEvent(new Event('input',{bubbles:true}));return new FormData(document.querySelector('form')).get('quantity')==='3';}`), browserTest('wc12-internals', 'Publica el valor inicial y valida la cantidad en el host', `async ({window,document,customElements,Event})=>{
      await customElements.whenDefined('quantity-field');const form=document.createElement('form');form.style.display='none';
      const el=document.createElement('quantity-field');el.setAttribute('name','cantidad-prueba');form.append(el);
      try {document.body.append(form);const input=el.querySelector('input');
        if(!input||!Array.from(form.elements).includes(el)||new window.FormData(form).get('cantidad-prueba')!=='1')return false;
        for(const value of ['0','-2']) {input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));
          if(!el.matches(':invalid')||form.checkValidity())return false;}
        for(const value of ['1','4']) {input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));
          if(!el.matches(':valid')||!form.checkValidity()||new window.FormData(form).get('cantidad-prueba')!==value)return false;}
        return true;
      } finally {form.remove();}
    }`)],
    hints: ['El form no descubre automáticamente el input interno.', 'attachInternals conecta el host con el formulario.', 'setFormValue publica el valor actual.'],
    model: 'ElementInternals es el adaptador entre tu implementación interna y el protocolo de formularios del navegador.',
    whenToUse: 'Úsalo para controles reutilizables que deban enviar, validar, resetearse o respetar disabled como un input nativo.',
    bestPractices: 'No reemplaces controles nativos simples; implementa nombre accesible, validación, reset y disabled.',
    commonErrors: 'ocultar un input sin sincronizar, olvidar name, no implementar reset o construir un control menos accesible que el nativo.',
    transfer: 'Decide si fecha, selector de color y etiquetas múltiples necesitan un form-associated custom element.',
    sources: [source('ElementInternals', 'https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals', 'Consulta integración y validación.'), source('Form-associated custom elements', 'https://html.spec.whatwg.org/multipage/custom-elements.html#custom-elements-face-example', 'Amplía el contrato.', 'WHATWG HTML')],
    debug: { title: 'El formulario no recibe el código', expected: 'coupon-field publica coupon=SAVE10.', observed: 'El input visual cambia, pero el host no participa en FormData.',
      starter: `class CouponField extends HTMLElement {
  static formAssociated = true;
  constructor() {
    super();
  }
  connectedCallback() {
    this.innerHTML = '<input value="SAVE10">';
  }
}
customElements.define('coupon-field', CouponField);`,
      tests: [browserTest('wc12-d0', 'FormData recibe un código elegido por la persona', `async ({window,document,customElements,Event})=>{
        await customElements.whenDefined('coupon-field');const form=document.createElement('form');form.style.display='none';
        const el=document.createElement('coupon-field');el.setAttribute('name','coupon');form.append(el);
        try {document.body.append(form);const input=el.querySelector('input');if(!input)return false;
          input.value='MIO25';input.dispatchEvent(new Event('input',{bubbles:true}));return new window.FormData(form).get('coupon')==='MIO25';
        } finally {form.remove();}
      }`), browserTest('wc12-d1', 'El host participa y publica el cupón inicial', `async ({window,document,customElements})=>{
        await customElements.whenDefined('coupon-field');const form=document.createElement('form');form.style.display='none';
        const el=document.createElement('coupon-field');el.setAttribute('name','coupon');form.append(el);
        try {document.body.append(form);return Array.from(form.elements).includes(el)&&JSON.stringify(new window.FormData(form).getAll('coupon'))==='["SAVE10"]';}
        finally {form.remove();}
      }`), browserTest('wc12-d2', 'Publica cambios, vacío y el nombre del consumidor', `async ({window,document,customElements,Event})=>{
        await customElements.whenDefined('coupon-field');const form=document.createElement('form');form.style.display='none';
        const el=document.createElement('coupon-field');el.setAttribute('name','descuento');form.append(el);
        try {document.body.append(form);const input=el.querySelector('input');if(!input||!Array.from(form.elements).includes(el))return false;
          for(const value of ['OTRO40','']) {input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));
            if(JSON.stringify(new window.FormData(form).getAll('descuento'))!==JSON.stringify([value]))return false;}
          el.setAttribute('name','promocion');const data=new window.FormData(form);return data.get('promocion')===''&&!data.has('descuento');
        } finally {form.remove();}
      }`)],
      hints: ['formAssociated solo anuncia capacidad.', 'La instancia necesita su objeto internals.', 'Publica el valor inicial y cambios.'] },
  }),
  lesson({
    number: 13, module: 4, title: 'Asincronía, estados y cancelación', appName: 'un buscador con carga, vacío, error y carreras controladas',
    summary: 'Modela todos los estados de una operación asíncrona y cancela resultados que ya no pertenecen a la consulta actual.',
    concepts: [{ label: 'Estado asíncrono', desc: 'idle, loading, success, empty o error.' }, { label: 'Cancelación', desc: 'Evitar que trabajo obsoleto actualice el componente.' }],
    skillsRequired: ['form-associated-elements', 'element-internals'], skillsIntroduced: ['component-async-states', 'abort-cleanup'],
    reasoningSteps: ['Nueva consulta crea AbortController', 'Cambia a loading', 'Respuesta vigente cambia estado', 'Render muestra success/empty/error'],
    html: appHtml('Buscar', '<user-search></user-search>'),
    example: `class DemoLoader extends HTMLElement {
  async load() {
    this.textContent = 'Cargando…';
    try {
      const data = await Promise.resolve(['Ana']);
      this.textContent = data.length ? data.join(', ') : 'Sin resultados';
    } catch {
      this.textContent = 'No se pudo cargar';
    }
  }
  connectedCallback() {
    this.load();
  }
}
customElements.define('demo-loader', DemoLoader);`,
    starter: `class UserSearch extends HTMLElement {
  connectedCallback() {
    this.state = 'idle';
    this.render();
  }
  async search(query) {
    // Cancela la búsqueda anterior, cambia a loading y simula una respuesta con Promise.resolve.
    // query "nadie" devuelve []; otro texto devuelve [{name:'Ana'}].
  }
  disconnectedCallback() {
    /* cancela trabajo pendiente */
  }
  render() {
    /* muestra Cargando, Sin resultados, error o nombres según state */
  }
}
customElements.define('user-search', UserSearch);`,
    challengeTitle: 'App: buscador resistente', challengeInstructions: 'Implementa search y render con loading, success, empty y cancelación al desconectar.',
    tests: [browserTest('wc13-success', 'Muestra una respuesta vigente', `async ({document,customElements})=>{await customElements.whenDefined('user-search');const el=document.querySelector('user-search');await el.search('ana');return el.textContent.includes('Ana');}`), browserTest('wc13-empty', 'Distingue una respuesta vacía', `async ({document,customElements})=>{const el=document.querySelector('user-search');await el.search('nadie');return el.textContent.includes('Sin resultados');}`), browserTest('wc13-cancel', 'Muestra carga e invalida trabajo al desconectar', `async ({document,customElements})=>{
      await customElements.whenDefined('user-search');const container=document.createElement('div');container.style.display='none';
      const el=document.createElement('user-search');container.append(el);
      try {document.body.append(container);if(typeof el.search!=='function')return false;
        const pending=el.search('ana');const loading=el.textContent.includes('Cargando');
        el.remove();const detachedText=el.textContent;await pending;
        if(!loading||el.textContent!==detachedText||el.textContent.includes('Ana'))return false;
        container.append(el);await el.search('nadie');if(!el.textContent.includes('Sin resultados'))return false;
        await el.search('ana');return el.textContent.includes('Ana');
      } finally {container.remove();}
    }`)],
    hints: ['Loading no es ausencia de datos; es un estado propio.', 'Cada búsqueda nueva invalida la anterior.', 'Render debe poder explicar cualquier valor de state.'],
    model: 'Una promesa no es una pantalla: el componente traduce el tiempo en estados observables y protege la vista contra respuestas atrasadas.',
    whenToUse: 'Úsalo en búsqueda, carga remota, validación de servidor y cualquier tarea cuyo resultado llegue después.',
    bestPractices: 'Modela estados explícitos, conserva AbortController y prueba respuesta vacía, fallo, desconexión y carrera.',
    commonErrors: 'mostrar spinner para siempre, tratar [] como error, permitir que una respuesta vieja pise una nueva o actualizar tras desconexión.',
    transfer: 'Dibuja estados y transiciones de autocompletado y subida de archivos.',
    sources: [source('AbortController', 'https://developer.mozilla.org/es/docs/Web/API/AbortController', 'Comprende cancelación.'), source('Uso de Fetch', 'https://developer.mozilla.org/es/docs/Web/API/Fetch_API/Using_Fetch', 'Revisa respuesta y errores.')],
    debug: { title: 'La respuesta lenta pisa la nueva', expected: 'latest-result conserva Segundo.', observed: 'La primera promesa termina después y reemplaza el texto.',
      starter: `class LatestResult extends HTMLElement {
  async load(label, delay) {
    await new Promise((r) => setTimeout(r, delay));
    this.textContent = label;
  }
  connectedCallback() {
    this.load('Primero', 50);
    this.load('Segundo', 5);
  }
}
customElements.define('latest-result', LatestResult);`,
      tests: [browserTest('wc13-d1', 'Conserva solo el resultado vigente', `async ({document,customElements})=>{await customElements.whenDefined('latest-result');await new Promise(r=>setTimeout(r,70));return document.querySelector('latest-result').textContent==='Segundo';}`), browserTest('wc13-d2', 'Protege también búsquedas nuevas y resultados vacíos', `async ({document,customElements})=>{
        await customElements.whenDefined('latest-result');const container=document.createElement('div');container.style.display='none';
        const el=document.createElement('latest-result');container.append(el);
        try {document.body.append(container);if(typeof el.load!=='function')return false;
          await new Promise(resolve=>setTimeout(resolve,70));
          await Promise.all([el.load('Anterior',30),el.load('Actual',0)]);if(el.textContent!=='Actual')return false;
          await Promise.all([el.load('Pendiente',0),el.load('',20)]);return el.textContent==='';
        } finally {container.remove();}
      }`) ],
      hints: ['El orden de inicio no garantiza el orden de fin.', 'Asigna identidad a cada solicitud o cancela la anterior.', 'Antes de renderizar comprueba que el resultado sigue vigente.'] },
  }),
  lesson({
    number: 14, module: 4, title: 'Pruebas de navegador y contrato publicable', appName: 'un diálogo reutilizable probado desde su API pública',
    summary: 'Prueba el componente como lo usa una aplicación: etiqueta, propiedades, eventos, accesibilidad y ciclos reales de navegador.',
    concepts: [{ label: 'Prueba de componente', desc: 'Verificación en navegador de una instancia real.' }, { label: 'Contrato publicable', desc: 'API documentada que puede evolucionar sin filtrar internals.' }],
    skillsRequired: ['component-async-states', 'abort-cleanup'], skillsIntroduced: ['browser-component-testing', 'publishable-contract'],
    reasoningSteps: ['La prueba crea el elemento', 'Configura API pública', 'Ejecuta interacción observable', 'Comprueba DOM/evento/accesibilidad'],
    html: appHtml('Confirmación', '<confirm-dialog></confirm-dialog>'),
    example: `class ToastMessage extends HTMLElement {
  show(message) {
    this.textContent = message;
    this.setAttribute('role', 'status');
    this.hidden = false;
  }
}
customElements.define('toast-message', ToastMessage);`,
    starter: `class ConfirmDialog extends HTMLElement {
  connectedCallback() {
    this.hidden = true;
    this.innerHTML = \`
      <section role="dialog" aria-modal="true">
        <p></p>
        <button data-action="confirm">Confirmar</button>
        <button data-action="cancel">Cancelar</button>
      </section>
    \`;
    // Conecta los controles con el contrato público.
  }
  open(message) {
    /* muestra, escribe el mensaje y enfoca Confirmar */
  }
  close() {
    /* oculta y emite dialog-close */
  }
}
customElements.define('confirm-dialog', ConfirmDialog);`,
    challengeTitle: 'App: diálogo con contrato comprobable', challengeInstructions: 'Implementa open/close, foco y dialog-close sin exponer métodos privados.',
    tests: [browserTest('wc14-open', 'open muestra mensaje y diálogo', `async ({document,customElements})=>{await customElements.whenDefined('confirm-dialog');const el=document.querySelector('confirm-dialog');el.open('Eliminar archivo');return !el.hidden&&el.querySelector('p').textContent.includes('Eliminar');}`), browserTest('wc14-event', 'Cancelar emite el evento público', `async ({document})=>{const el=document.querySelector('confirm-dialog');let closed=false;el.addEventListener('dialog-close',()=>closed=true,{once:true});el.querySelector('[data-action="cancel"]').click();return closed&&el.hidden;}`), browserTest('wc14-contract', 'El contrato público conserva mensaje, foco y cierre', `async ({document,customElements})=>{
      await customElements.whenDefined('confirm-dialog');const previousFocus=document.activeElement;
      const container=document.createElement('div');container.style.cssText='position:fixed;left:-10000px;top:0';
      const el=document.createElement('confirm-dialog');container.append(el);
      try {document.body.append(container);if(typeof el.open!=='function'||typeof el.close!=='function'||!el.hidden)return false;
        const surface=el.querySelector('[role="dialog"]');const confirm=el.querySelector('[data-action="confirm"]');
        if(!surface||surface.getAttribute('aria-modal')!=='true'||!confirm)return false;
        let closed=0;el.addEventListener('dialog-close',()=>closed++);
        for(const message of ['Archivar pedido','Cambiar nombre']) {el.open(message);
          if(el.hidden||el.querySelector('p')?.textContent!==message||document.activeElement!==confirm)return false;
          const before=closed;el.close();if(!el.hidden||closed!==before+1)return false;}
        el.open('Confirmar envío');const before=closed;confirm.click();return el.hidden&&closed===before+1;
      } finally {container.remove();if(previousFocus?.isConnected&&typeof previousFocus.focus==='function')previousFocus.focus({preventScroll:true});}
    }`)],
    hints: ['La prueba solo debe conocer open, close y dialog-close.', 'El mensaje se configura por método público, no buscando internals desde fuera.', 'Al abrir mueve foco a un control útil.'],
    model: 'Una prueba pública entra por la puerta del componente y observa sus salidas; si necesita desmontar paredes, el contrato está incompleto o la prueba está acoplada.',
    whenToUse: 'Prueba en navegador todo componente que dependa de DOM, Shadow DOM, foco, eventos o ciclo de vida.',
    bestPractices: 'Comprueba resultados, no métodos privados; incluye teclado, estados, reconexión y más de una entrada.',
    commonErrors: 'testear innerHTML exacto, llamar métodos privados, simular HTMLElement en Node o publicar sin documentar eventos y CSS hooks.',
    transfer: 'Escribe una matriz de contrato para un date-picker: entradas, salidas, errores, accesibilidad y estilos.',
    sources: [source('Testing de Lit', 'https://lit.dev/docs/tools/testing/', 'Aunque se usará después con Lit, aplica el requisito de navegador a componentes web.', 'Lit'), source('Web Test Runner', 'https://modern-web.dev/docs/test-runner/overview/', 'Consulta pruebas modernas en navegador.', 'Modern Web')],
    debug: { title: 'La prueba depende de un método privado', expected: 'notification-box muestra mensajes con show y se oculta con close, emitiendo notification-close.', observed: 'Solo existe _renderMessage y el consumidor debe conocerlo.',
      starter: `class NotificationBox extends HTMLElement {
  connectedCallback() {
    this.hidden = true;
  }
  _renderMessage(text) {
    this.hidden = false;
    this.textContent = text;
  }
}
customElements.define('notification-box', NotificationBox);`,
      tests: [browserTest('wc14-d1', 'Expone un método show estable', `async ({document,customElements})=>{await customElements.whenDefined('notification-box');const el=document.querySelector('notification-box');if(typeof el.show!=='function')return false;el.show('Guardado');return !el.hidden&&el.textContent.includes('Guardado');}`), browserTest('wc14-d2', 'show y close funcionan en otra instancia y notifican el cierre', `async ({document,customElements})=>{
        await customElements.whenDefined('notification-box');const container=document.createElement('div');container.style.display='none';
        const el=document.createElement('notification-box');container.append(el);
        try {document.body.append(container);if(typeof el.show!=='function'||typeof el.close!=='function')return false;
          let closed=0;el.addEventListener('notification-close',()=>closed++);
          for(const message of ['Pedido enviado','Cambios pendientes']) {el.show(message);if(el.hidden||!el.textContent.includes(message))return false;
            const before=closed;el.close();if(!el.hidden||closed!==before+1)return false;}
          return true;
        } finally {container.remove();}
      }`)],
      hints: ['El consumidor no debería conocer _renderMessage.', 'La API pública separa mostrar un mensaje de cerrar la notificación.', 'La implementación privada puede seguir detrás; el cierre debe ocultar y emitir el evento documentado.'] },
  }),
];
