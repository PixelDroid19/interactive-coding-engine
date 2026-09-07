import { describe, expect, it } from 'vitest';
import { Window } from 'happy-dom';
import { COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS } from './course';
import { runChallengeValidation } from '../../engine/testRunner';
import { reconstructWorkspaceAt } from '../../engine/eventLog';
import type { DebuggingExerciseItem } from '../../types/curriculum';

function debugExercise(number: number): DebuggingExerciseItem {
  return COMPONENT_COURSE.modules.flatMap(module => module.items)
    .find(item => item.id === `componentes-lit-${String(number).padStart(2, '0')}-debug`) as DebuggingExerciseItem;
}
const exercise = debugExercise(1);

describe('asincronía y contratos públicos nativos', () => {
  const search = (cancel = true, loading = true) => `
    class UserSearch extends HTMLElement {
      connectedCallback() {this.state='idle';this.render();}
      async search(query) {const ticket={};this.ticket=ticket;this.state='loading';this.render();
        const data=await Promise.resolve(query==='nadie'?[]:[{name:'Ana'}]);
        ${cancel ? 'if(this.ticket!==ticket)return;' : ''}
        this.data=data;this.state=data.length?'success':'empty';this.render();}
      disconnectedCallback() {this.ticket=null;}
      render() {this.textContent=this.state==='loading'?${loading ? "'Cargando…'" : "''"}:this.state==='empty'?'Sin resultados':this.state==='success'?this.data.map(row=>row.name).join(', '):'';}
    }
    customElements.define('user-search',UserSearch);
  `;
  const latest = (guard = true, hardcoded = false) => `
    class LatestResult extends HTMLElement {
      async load(label,delay) {const ticket={};this.ticket=ticket;await new Promise(resolve=>setTimeout(resolve,delay));
        ${guard ? 'if(this.ticket!==ticket)return;' : ''}this.textContent=${hardcoded ? "'Segundo'" : 'label'};}
      connectedCallback(){this.load('Primero',50);this.load('Segundo',5);}
    }
    customElements.define('latest-result',LatestResult);
  `;
  const dialog = (focus = true, confirm = true) => `
    class ConfirmDialog extends HTMLElement {
      connectedCallback(){this.hidden=true;this.innerHTML='<section role="dialog" aria-modal="true"><p></p><button data-action="confirm">Confirmar</button><button data-action="cancel">Cancelar</button></section>';
        this.querySelector('[data-action="cancel"]').onclick=()=>this.close();
        ${confirm ? "this.querySelector('[data-action=\"confirm\"]').onclick=()=>this.close();" : ''}}
      open(message){this.querySelector('p').textContent=message;this.hidden=false;${focus ? "this.querySelector('[data-action=\"confirm\"]').focus();" : ''}}
      close(){this.hidden=true;this.dispatchEvent(new CustomEvent('dialog-close'));}
    }
    customElements.define('confirm-dialog',ConfirmDialog);
  `;
  const notification = (close = true) => `
    class NotificationBox extends HTMLElement {
      connectedCallback(){this.hidden=true;}
      ['show'](message){this.textContent=message;this.hidden=false;}
      close(){this.hidden=true;${close ? "this.dispatchEvent(new CustomEvent('notification-close'));" : ''}}
    }
    customElements.define('notification-box',NotificationBox);
  `;
  it('acepta invalidar trabajo mediante un objeto de identidad', async () => {
    expect(await checkNativeProgram(classChallenge(13), search())).toEqual({allPassed:true,failedIds:[]});
  });
  it('rechaza publicar una búsqueda después de desconectar', async () => {
    expect(await checkNativeProgram(classChallenge(13), search(false))).toMatchObject({allPassed:false});
  });
  it('rechaza una búsqueda que oculta el estado de carga', async () => {
    expect(await checkNativeProgram(classChallenge(13), search(true,false))).toMatchObject({allPassed:false});
  });
  it('acepta una identidad de solicitud sin nombres de variable impuestos', async () => {
    expect(await checkNativeProgram(debugExercise(13), latest())).toEqual({allPassed:true,failedIds:[]});
  });
  it('rechaza fijar Segundo aunque mencione requestId en un comentario', async () => {
    expect(await checkNativeProgram(debugExercise(13), latest(true,true)+'\n// requestId')).toMatchObject({allPassed:false});
  });
  it('rechaza carreras posteriores aunque la primera demostración parezca correcta', async () => {
    expect(await checkNativeProgram(debugExercise(13), latest(false)+'\n// requestId')).toMatchObject({allPassed:false});
  });
  it('acepta el diálogo a través de open, close y sus controles', async () => {
    expect(await checkNativeProgram(classChallenge(14), dialog())).toEqual({allPassed:true,failedIds:[]});
  });
  it('rechaza abrir sin mover el foco a Confirmar', async () => {
    expect(await checkNativeProgram(classChallenge(14), dialog(false))).toMatchObject({allPassed:false});
  });
  it('rechaza un control Confirmar sin acción', async () => {
    expect(await checkNativeProgram(classChallenge(14), dialog(true,false))).toMatchObject({allPassed:false});
  });
  it('acepta show con nombre calculado y el cierre público', async () => {
    expect(await checkNativeProgram(debugExercise(14), notification())).toEqual({allPassed:true,failedIds:[]});
  });
  it('rechaza cerrar sin emitir notification-close', async () => {
    expect(await checkNativeProgram(debugExercise(14), notification(false)+'\n// show(message)')).toMatchObject({allPassed:false});
  });
});

describe.each([8, 9, 10, 11])('programas iniciales de la unidad %i', number => {
  it.each(['clase', 'depuración'])('no entrega comprobaciones resueltas en %s', async kind => {
    const activity = kind === 'clase' ? classChallenge(number) : debugExercise(number);
    const result = await checkNativeProgram(activity, activity.initialWorkspace.files['app.js'].content);
    expect(result).toEqual({ allPassed: false, failedIds: activity.tests.map(test => test.id) });
  });
});

describe('flujo de datos, teclado y acciones públicas', () => {
  const cart = (wrongRemoval = false) => `
    class CartLine extends HTMLElement {
      set item(entry) { this.textContent=''; const label=document.createElement('span');label.textContent=entry.name;
        const button=document.createElement('button');button.textContent='Quitar';
        button.onclick=()=>this.dispatchEvent(new CustomEvent('line-remove',{detail:{id:entry.id},bubbles:true}));this.append(label,button); }
    }
    customElements.define('cart-line',CartLine);
    class CartApp extends HTMLElement {
      connectedCallback() { this.items=[{id:'a',name:'Libro'},{id:'b',name:'Lápiz'}];
        this.addEventListener('line-remove',event=>{this.items=${wrongRemoval ? 'this.items.slice(1)' : 'this.items.filter(entry=>entry.id!==event.detail.id)'};this.render();});this.render(); }
      render() { this.textContent=''; for(const entry of this.items) {const row=document.createElement('cart-line');row['item']=entry;this.append(row);} }
    }
    customElements.define('cart-app',CartApp);
  `;
  const menu = (focus = true) => `
    class ActionMenu extends HTMLElement {
      connectedCallback() { this.innerHTML='<button aria-expanded="false">Acciones</button><div role="menu" hidden><button role="menuitem">Editar</button><button role="menuitem">Archivar</button></div>';
        const trigger=this.querySelector('button');const menu=this.querySelector('[role="menu"]');
        const close=()=>{menu.hidden=true;trigger.setAttribute('aria-expanded','false');${focus ? 'trigger.focus();' : ''}};
        trigger.onclick=()=>{if(!menu.hidden){close();return;}menu.hidden=false;trigger.setAttribute('aria-expanded','true');${focus ? "menu.querySelector('button').focus();" : ''}};
        this.onkeydown=event=>{if(['Escape'].includes(event.key))close();};
      }
    }
    customElements.define('action-menu',ActionMenu);
  `;
  it('acepta pasar objetos mediante una propiedad calculada y quitar el id solicitado', async () => {
    expect(await checkNativeProgram(classChallenge(10), cart())).toEqual({ allPassed: true, failedIds: [] });
  });
  it('rechaza quitar siempre la primera fila aunque cambie el número de filas', async () => {
    expect(await checkNativeProgram(classChallenge(10), cart(true) + '\n// row.item = item')).toMatchObject({ allPassed: false });
  });
  it('acepta actualizar products con splice sin imponer filter o slice', async () => {
    expect(await checkNativeProgram(debugExercise(10), `
      class InventoryApp extends HTMLElement {
        connectedCallback() {this.products=[{id:'x',name:'Teclado'}];this.innerHTML='<button>Quitar</button>';
          this.querySelector('button').onclick=()=>{this.products.splice(this.products.findIndex(p=>p.id==='x'),1);this.querySelector('button').remove();};}
      }
      customElements.define('inventory-app',InventoryApp);
    `)).toEqual({ allPassed: true, failedIds: [] });
  });
  it('acepta Escape comparado con una colección de teclas', async () => {
    expect(await checkNativeProgram(classChallenge(11), menu())).toEqual({ allPassed: true, failedIds: [] });
  });
  it('rechaza abrir y cerrar sin mover el foco al control indicado', async () => {
    expect(await checkNativeProgram(classChallenge(11), menu(false) + '\n// key === "Escape"')).toMatchObject({ allPassed: false });
  });
  it('acepta que el botón guarde mediante toggleAttribute', async () => {
    expect(await checkNativeProgram(debugExercise(11), `
      class SaveControl extends HTMLElement { connectedCallback() {this.innerHTML='<button>Guardar</button>';this.querySelector('button').onclick=()=>this.toggleAttribute('saved',true);} }
      customElements.define('save-control',SaveControl);
    `)).toEqual({ allPassed: true, failedIds: [] });
  });
  it('rechaza un botón sin acción aunque una función sin usar mencione saved', async () => {
    expect(await checkNativeProgram(debugExercise(11), `
      class SaveControl extends HTMLElement { connectedCallback() {this.innerHTML='<button>Guardar</button>';} unused() {this.setAttribute('saved','');} }
      customElements.define('save-control',SaveControl);
    `)).toMatchObject({ allPassed: false });
  });
});

describe('composición y representación desde estado', () => {
  const summary = (connected = '') => `
    class SummaryPanel extends HTMLElement {
      constructor() {
        super(); const root = this.attachShadow({mode:'open'});
        for (const name of ['title', '', 'actions']) {
          const slot = document.createElement('slot'); if (name) slot.name = name; root.append(slot);
        }
      }
      connectedCallback() { ${connected} }
    }
    customElements.define('summary-panel', SummaryPanel);
  `;
  const dialog = (withDefault: boolean) => `
    class DialogShell extends HTMLElement {
      constructor() {
        super(); const root=this.attachShadow({mode:'open'});
        ${withDefault ? "root.append(document.createElement('slot'));" : ''}
        const footer=document.createElement('footer'); const slot=document.createElement('slot');
        slot.name='actions'; footer.append(slot); root.append(footer);
      }
    }
    customElements.define('dialog-shell',DialogShell);
  `;
  const shopping = (mutate: boolean) => `
    class ShoppingList extends HTMLElement {
      connectedCallback() { this.items=['Pan']; this.render(); }
      addItem(name) { ${mutate ? 'this.items.push(name);' : 'this.items=this.items.concat(name);'} this.render(); }
      ['render']() { this.textContent=''; for (const item of this.items) { const li=document.createElement('li'); li.textContent=item; this.append(li); } }
    }
    customElements.define('shopping-list',ShoppingList);
  `;
  const tasks = (stale: boolean) => `
    class TaskList extends HTMLElement {
      connectedCallback() { this.tasks=['Uno','Dos']; this.render(); this.render(); }
      render() { this.textContent=''; for (const task of ${stale ? "['Uno','Dos']" : 'this.tasks'}) { const p=document.createElement('p'); p.textContent=task; this.append(p); } }
    }
    customElements.define('task-list',TaskList);
  `;
  it.each([
    { number: 8, program: summary(), description: 'crea slots mediante nodos' },
    { number: 9, program: shopping(false), description: 'usa un método render de nombre calculado' },
  ])('acepta el reto $number: $description', async ({ number, program }) => {
    expect(await checkNativeProgram(classChallenge(number), program)).toEqual({ allPassed: true, failedIds: [] });
  });
  it.each([
    { number: 8, program: dialog(true), description: 'proyecta contenido sin plantillas de texto' },
    { number: 9, program: tasks(false), description: 'vacía mediante textContent y reconstruye filas' },
  ])('acepta depuración $number: $description', async ({ number, program }) => {
    expect(await checkNativeProgram(debugExercise(number), program)).toEqual({ allPassed: true, failedIds: [] });
  });
  it('rechaza slots presentes si el componente reemplaza los nodos del consumidor', async () => {
    expect(await checkNativeProgram(classChallenge(8), summary('this.innerHTML=this.innerHTML;') + '\n// <slot name="actions"></slot>')).toEqual({ allPassed: false, failedIds: ['wc08-no-copy'] });
  });
  it('rechaza eliminar la proyección del cuerpo conservando solo el footer', async () => {
    expect(await checkNativeProgram(debugExercise(8), dialog(false) + '\n// <slot>')).toMatchObject({ allPassed: false });
  });
  it('rechaza mutar el array anterior aunque la lista visible parezca correcta', async () => {
    expect(await checkNativeProgram(classChallenge(9), shopping(true) + '\n// render()')).toMatchObject({ allPassed: false });
  });
  it('rechaza filas fijas que ignoran el estado nuevo aunque no se dupliquen', async () => {
    expect(await checkNativeProgram(debugExercise(9), tasks(true) + '\n// replaceChildren(')).toMatchObject({ allPassed: false });
  });
});

function classChallenge(number: number) {
  const lesson = COMPONENT_COURSE_SCRIMS[`componentes-lit-${String(number).padStart(2, '0')}`];
  const challenge = lesson.challenges[0];
  return {
    id: challenge.id, title: challenge.title, description: challenge.instructions, tests: challenge.tests,
    initialWorkspace: reconstructWorkspaceAt(lesson.initialWorkspace, lesson.events, lesson.snapshots, challenge.timestamp).workspace,
  };
}

/** Native components and the published predicates run for real; no ESM/network fixture. */
async function checkNativeProgram(
  exercise: Pick<DebuggingExerciseItem, 'id' | 'title' | 'description' | 'initialWorkspace' | 'tests'>,
  source: string,
  inspectAfterChecks?: (page: Window) => void,
) {
  const page = new Window({ settings: { disableCSSFileLoading: true, disableJavaScriptFileLoading: true } });
  const workspace = structuredClone(exercise.initialWorkspace);
  workspace.files['app.js'].content = source;
  try {
    page.document.body.innerHTML = workspace.files['index.html'].content;
    try { page.eval(source); } catch { return { allPassed: false, failedIds: ['runtime'] }; }
    const results: Array<{ id: string; passed: boolean }> = [];
    for (const test of exercise.tests) {
      if (test.validatorType === 'browser-script') {
        const predicate = page.eval(`(${test.customValidatorScript})`);
        const outcome = await predicate({ window: page, document: page.document, customElements: page.customElements,
          HTMLElement: page.HTMLElement, Event: page.Event, CustomEvent: page.CustomEvent });
        results.push({ id: test.id, passed: typeof outcome === 'boolean' ? outcome : outcome.passed });
      } else {
        const result = await runChallengeValidation({
          id: exercise.id, title: exercise.title, instructions: exercise.description,
          timestamp: 0, tests: [test], hints: [],
        }, workspace);
        results.push({ id: test.id, passed: result.allPassed });
      }
    }
    inspectAfterChecks?.(page);
    return { allPassed: results.length > 0 && results.every(result => result.passed), failedIds: results.filter(result => !result.passed).map(result => result.id) };
  } finally { await page.happyDOM.close(); }
}

describe('depuración de registro por contrato público', () => {
  it('rechaza el registro inválido que recibe el estudiante', async () => {
    expect(await checkNativeProgram(exercise, exercise.initialWorkspace.files['app.js'].content)).toMatchObject({ allPassed: false });
  });

  it.each([
    ['una variable', "const publicTag = 'alerta-app'; customElements.define(publicTag, AppAlert);"],
    ['un nombre compuesto', "customElements.define(['alerta', 'app'].join('-'), AppAlert);"],
    ['un literal', "customElements.define('alerta-app', AppAlert);"],
  ])('acepta resolver el nombre de la etiqueta con %s', async (_label, registration) => {
    expect(await checkNativeProgram(exercise, `
      class AppAlert extends HTMLElement {
        connectedCallback() { this.textContent = 'Revisión pendiente'; }
      }
      ${registration}
    `)).toEqual({ allPassed: true, failedIds: [] });
  });

  it('no confunde rellenar una sola etiqueta con construir un componente reutilizable', async () => {
    expect(await checkNativeProgram(exercise, `
      customElements.define('alerta-app', class extends HTMLElement {});
      document.querySelector('alerta-app').textContent = 'Revisión pendiente';
    `)).toEqual({ allPassed: false, failedIds: ['wc01-d2'] });
  });

  it('rechaza un componente registrado que no cumple la salida visible', async () => {
    expect(await checkNativeProgram(exercise, `
      customElements.define('alerta-app', class extends HTMLElement {
        connectedCallback() { this.textContent = 'Otra cosa'; }
      });
    `)).toMatchObject({ allPassed: false });
  });
});

describe('retos de clase: contrato de registro y construcción', () => {
  it('acepta configurar el rol mediante argumentos calculados', async () => {
    expect(await checkNativeProgram(classChallenge(1), `
      class StatusBadge extends HTMLElement {
        connectedCallback() { this.textContent = 'Operativo'; this.setAttribute(...['role', 'status']); }
      }
      customElements.define('status-badge', StatusBadge);
    `)).toEqual({ allPassed: true, failedIds: [] });
  });

  it('no confunde una llamada sin ejecutar con el rol accesible', async () => {
    expect(await checkNativeProgram(classChallenge(1), `
      class StatusBadge extends HTMLElement {
        connectedCallback() { this.textContent = 'Operativo'; }
        unused() { this.setAttribute('role', 'status'); }
      }
      customElements.define('status-badge', StatusBadge);
    `)).toMatchObject({ allPassed: false });
  });

  it('acepta un constructor válido sin penalizar un comentario antes de super', async () => {
    expect(await checkNativeProgram(classChallenge(2), `
      class ProfileCard extends HTMLElement {
        constructor() {
          // La inicialización nativa precede al uso de la instancia.
          super();
          this.attachShadow({ mode: 'open' }).textContent = 'Dana · UI Engineer';
        }
      }
      customElements.define('profile-card', ProfileCard);
    `)).toEqual({ allPassed: true, failedIds: [] });
  });

  it.each([
    ['sin el puesto solicitado', "this.attachShadow({ mode: 'open' }).textContent = 'Dana';"],
    ['sin la frontera solicitada', ''],
  ])('rechaza el perfil %s', async (_label, initialize) => {
    expect(await checkNativeProgram(classChallenge(2), `
      class ProfileCard extends HTMLElement {
        constructor() { super(); ${initialize} }
        connectedCallback() { if (!this.shadowRoot) this.textContent = 'Dana · UI Engineer'; }
      }
      customElements.define('profile-card', ProfileCard);
    `)).toMatchObject({ allPassed: false });
  });
});

describe('retos de clase: comportamiento de ciclo, atributos e interacción', () => {
  it('comprueba otro reloj sin desmontar la instancia que observa el estudiante', async () => {
    expect(await checkNativeProgram(classChallenge(3), `
      let firstClock;
      document.body.dataset.initialDetaches = '0';
      class SessionClock extends HTMLElement {
        connectedCallback() {
          firstClock ??= this;
          this.textContent = 'Sesión ' + new Date().toLocaleTimeString();
          this.timer = setInterval(() => { this.textContent = 'Sesión ' + new Date().toLocaleTimeString(); }, 1000);
        }
        disconnectedCallback() {
          clearInterval(this.timer);
          if (this === firstClock) document.body.dataset.initialDetaches = String(+document.body.dataset.initialDetaches + 1);
        }
      }
      customElements.define('session-clock', SessionClock);
    `, page => {
      expect(page.document.body.dataset.initialDetaches).toBe('0');
      expect(page.document.querySelectorAll('session-clock')).toHaveLength(1);
    })).toEqual({ allPassed: true, failedIds: [] });
  });

  it.each([2, 3, 4, 5, 6, 7])('el starter del reto %i todavía necesita completarse', async number => {
    const challenge = classChallenge(number);
    expect(await checkNativeProgram(challenge, challenge.initialWorkspace.files['app.js'].content))
      .toMatchObject({ allPassed: false });
  });

  it.each([
    { number: 3, label: 'limpieza mediante acceso calculado', source: `
      class SessionClock extends HTMLElement {
        connectedCallback() {
          this.textContent = 'Sesión ' + new Date().toLocaleTimeString();
          this.timer = window.setInterval(() => { this.textContent = 'Sesión ' + new Date().toLocaleTimeString(); }, 1000);
        }
        disconnectedCallback() { window['clearInterval'](this.timer); }
      }
      customElements.define('session-clock', SessionClock);` },
    { number: 4, label: 'raíz creada mediante acceso calculado', source: `
      class NoticeCard extends HTMLElement {
        constructor() {
          super();
          this['attachShadow']({ mode: 'open' });
        }
        connectedCallback() {
          this.shadowRoot.innerHTML =
            '<style>.box { padding: 12px; }</style><div class="box">Mantenimiento a las 18:00</div>';
        }
      }
      customElements.define('notice-card', NoticeCard);` },
    { number: 5, label: 'atributos observados con un getter', source: `
      class ProgressMeter extends HTMLElement {
        static get observedAttributes() { return ['value']; }
        attributeChangedCallback(_n, _o, value) {
          this.textContent = 'Progreso: ' + Math.min(100, Math.max(0, +value)) + '%';
        }
      }
      customElements.define('progress-meter', ProgressMeter);` },
    { number: 6, label: 'propiedad pública declarada con nombre calculado', source: `
      class SettingToggle extends HTMLElement {
        get ['active']() { return this.hasAttribute('active'); }
        set ['active'](value) { this.toggleAttribute('active', Boolean(value)); this.render(); }
        render() {
          this.textContent = this.active ? 'Activado' : 'Desactivado';
          this.setAttribute('aria-pressed', String(this.active));
        }
        connectedCallback() { this.active = false; this.onclick = () => { this.active = !this.active; }; }
      }
      customElements.define('setting-toggle', SettingToggle);` },
    { number: 7, label: 'nombre del evento calculado', source: `
      class QuantityPicker extends HTMLElement {
        connectedCallback() {
          this.quantity = 1;
          this.innerHTML = '<button>Aumentar</button><output>1</output>';
          this.querySelector('button').onclick = () => {
            this.querySelector('output').textContent = String(++this.quantity);
            this.dispatchEvent(new CustomEvent(['quantity', 'change'].join('-'),
              { detail: { value: this.quantity }, bubbles: true, composed: true }));
          };
        }
      }
      customElements.define('quantity-picker', QuantityPicker);` },
  ])('acepta $label', async ({ number, source }) => {
    expect(await checkNativeProgram(classChallenge(number), source)).toEqual({ allPassed: true, failedIds: [] });
  });

  it.each([
    { number: 3, label: 'un reloj estático con limpieza decorativa', source: `
      class SessionClock extends HTMLElement {
        connectedCallback() { this.textContent = 'Sesión'; }
        disconnectedCallback() { clearInterval(this.timer); }
      }
      customElements.define('session-clock', SessionClock);` },
    { number: 3, label: 'un reloj que sigue escribiendo después de retirarlo', source: `
      class SessionClock extends HTMLElement {
        connectedCallback() {
          this.textContent = 'Sesión ' + new Date().toLocaleTimeString();
          this.timer = window.setInterval(() => { this.textContent = 'Sesión ' + new Date().toLocaleTimeString(); }, 1000);
        }
        disconnectedCallback() { clearInterval(undefined); }
      }
      customElements.define('session-clock', SessionClock);` },
    { number: 4, label: 'un aviso fuera de la raíz vacía', source: `
      class NoticeCard extends HTMLElement {
        constructor() { super(); this.attachShadow({ mode: 'open' }); }
        connectedCallback() { this.innerHTML = '<div class="box">Mantenimiento a las 18:00</div>'; }
      }
      customElements.define('notice-card', NoticeCard);` },
    { number: 4, label: 'contenido encapsulado sin estilos internos', source: `
      class NoticeCard extends HTMLElement {
        constructor() { super(); this.attachShadow({ mode: 'open' }); }
        connectedCallback() { this.shadowRoot.innerHTML = '<div class="box">Mantenimiento a las 18:00</div>'; }
      }
      customElements.define('notice-card', NoticeCard);` },
    { number: 5, label: 'progreso sin limitar los extremos', source: `
      class ProgressMeter extends HTMLElement {
        static observedAttributes = ['value'];
        attributeChangedCallback(_n, _o, value) { this.textContent = 'Progreso: ' + value + '%'; }
      }
      customElements.define('progress-meter', ProgressMeter);` },
    { number: 6, label: 'un interruptor que solo se activa una vez', source: `
      class SettingToggle extends HTMLElement {
        get active() { return true; }
        connectedCallback() { this.onclick = () => {
          this.setAttribute('active', ''); this.setAttribute('aria-pressed', 'true'); this.textContent = 'Activado';
        }; }
      }
      customElements.define('setting-toggle', SettingToggle);` },
    { number: 7, label: 'un evento correcto con una salida que no cambia', source: `
      class QuantityPicker extends HTMLElement {
        connectedCallback() {
          this.innerHTML = '<button>Aumentar</button><output>1</output>';
          this.querySelector('button').onclick = () => this.dispatchEvent(new CustomEvent('quantity-change',
            { detail: { value: 2 }, bubbles: true, composed: true }));
        }
      }
      customElements.define('quantity-picker', QuantityPicker);` },
  ])('rechaza $label', async ({ number, source }) => {
    expect(await checkNativeProgram(classChallenge(number), source)).toMatchObject({ allPassed: false });
  });
});

describe('depuración del constructor y su salida encapsulada', () => {
  const summary = debugExercise(2);

  it('el constructor roto sigue fallando', async () => {
    expect(await checkNativeProgram(summary, summary.initialWorkspace.files['app.js'].content)).toMatchObject({ allPassed: false });
  });

  it.each([
    ['constructor con un comentario', `constructor() {
      // La clase base prepara la instancia antes de acceder a ella.
      super();
      this.attachShadow({ mode: 'open' }).textContent = 'Cuenta activa';
    }`],
    ['constructor heredado', `connectedCallback() {
      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
      this.shadowRoot.textContent = 'Cuenta activa';
    }`],
  ])('acepta %s cuando produce el mismo contrato público', async (_label, body) => {
    expect(await checkNativeProgram(summary, `
      class UserSummary extends HTMLElement { ${body} }
      customElements.define('user-summary', UserSummary);
    `)).toEqual({ allPassed: true, failedIds: [] });
  });

  it('lee la salida del Shadow DOM cuando el constructor ya está corregido', async () => {
    expect(await checkNativeProgram(summary, `
      class UserSummary extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' });
          this.shadowRoot.textContent = 'Cuenta activa';
        }
      }
      customElements.define('user-summary', UserSummary);
    `)).toEqual({ allPassed: true, failedIds: [] });
  });
});

describe('contratos nativos sin una receta de sintaxis obligatoria', () => {
  it.each([
    { number: 3, label: 'una limpieza que retira otra función', source: `
      class ResizeWatch extends HTMLElement {
        handler = () => { this.textContent = 'Cambió'; };
        connectedCallback() { this.textContent = 'Escuchando'; window.addEventListener('resize', this.handler); }
        disconnectedCallback() { window.removeEventListener('resize', () => {}); }
      }
      customElements.define('resize-watch', ResizeWatch);` },
    { number: 4, label: 'una raíz vacía con la implementación todavía fuera', source: `
      class SecureNote extends HTMLElement {
        constructor() { super(); this.attachShadow({ mode: 'open' }); }
        connectedCallback() { this.innerHTML = '<div class="box">Nota interna</div>'; }
      }
      customElements.define('secure-note', SecureNote);` },
    { number: 5, label: 'un resultado fijo aunque aparezca Number en el código', source: `
      class ScoreMeter extends HTMLElement {
        static observedAttributes = ['value'];
        attributeChangedCallback(_n, _o, value) { Number(value); this.textContent = '15'; }
      }
      customElements.define('score-meter', ScoreMeter);` },
    { number: 6, label: 'texto inactivo con el atributo falso presente', source: `
      class PrivacyToggle extends HTMLElement {
        connectedCallback() { this.setAttribute('active', 'false'); this.textContent = 'Inactivo'; }
      }
      customElements.define('privacy-toggle', PrivacyToggle);` },
    { number: 7, label: 'un evento que asciende pero no cruza otra raíz', source: `
      class CartLine extends HTMLElement {
        constructor() { super(); this.attachShadow({ mode: 'open' }); }
        connectedCallback() {
          this.shadowRoot.innerHTML = '<button>Quitar</button>';
          this.shadowRoot.querySelector('button').onclick = () => this.dispatchEvent(
            new CustomEvent('line-remove', { detail: { id: 'a1' }, bubbles: true, composed: false }));
        }
      }
      customElements.define('cart-line', CartLine);` },
  ])('rechaza $label', async ({ number, source }) => {
    expect(await checkNativeProgram(debugExercise(number), source)).toMatchObject({ allPassed: false });
  });

  it.each([3, 4, 5, 6, 7])('el código inicial de la práctica %i sigue fallando', async number => {
    const exercise = debugExercise(number);
    expect(await checkNativeProgram(exercise, exercise.initialWorkspace.files['app.js'].content)).toMatchObject({ allPassed: false });
  });

  it.each([
    { number: 3, description: 'limpia un manejador guardado en una propiedad pública', source: `
      class ResizeWatch extends HTMLElement {
        onResize = () => { this.textContent = 'Cambió'; };
        connectedCallback() {
          this.textContent = 'Escuchando';
          window.addEventListener('resize', this.onResize);
        }
        disconnectedCallback() { window.removeEventListener('resize', this.onResize); }
      }
      customElements.define('resize-watch', ResizeWatch);` },
    { number: 4, description: 'encapsula la nota sin imponer cómo se accede al método', source: `
      class SecureNote extends HTMLElement {
        constructor() {
          super();
          const root = this['attachShadow']({ mode: 'open' });
          root.innerHTML = '<div class="box">Nota interna</div>';
        }
      }
      customElements.define('secure-note', SecureNote);` },
    { number: 5, description: 'convierte con el operador unario', source: `
      class ScoreMeter extends HTMLElement {
        static get observedAttributes() { return ['value']; }
        attributeChangedCallback(_name, _old, value) { this.textContent = String(+value + 5); }
      }
      customElements.define('score-meter', ScoreMeter);` },
    { number: 6, description: 'representa falso sin añadir un atributo innecesario', source: `
      class PrivacyToggle extends HTMLElement {
        connectedCallback() { this.textContent = this.hasAttribute('active') ? 'Activo' : 'Inactivo'; }
      }
      customElements.define('privacy-toggle', PrivacyToggle);` },
    { number: 7, description: 'configura las opciones del evento mediante un valor', source: `
      class CartLine extends HTMLElement {
        constructor() { super(); this.attachShadow({ mode: 'open' }); }
        connectedCallback() {
          this.shadowRoot.innerHTML = '<button>Quitar</button>';
          this.shadowRoot.querySelector('button').onclick = () => {
            const travels = true;
            this.dispatchEvent(new CustomEvent('line-remove', { detail: { id: 'a1' }, bubbles: travels, composed: travels }));
          };
        }
      }
      customElements.define('cart-line', CartLine);` },
  ])('$description', async ({ number, source }) => {
    expect(await checkNativeProgram(debugExercise(number), source)).toEqual({ allPassed: true, failedIds: [] });
  });
});
