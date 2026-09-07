import { appHtml, browserTest, lesson, source, sourceTest } from './helpers';

const visualStateAndFocusTest = browserTest('lit28-behavior', 'La apariencia sigue el estado y el foco solo cambia al pedirlo', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('interactive-table');
  const el=document.createElement('interactive-table');
  const outside=document.createElement('button');outside.textContent='Fuera';
  const root=()=>el.shadowRoot||el;
  const focused=()=>el.shadowRoot?el.shadowRoot.activeElement:document.activeElement;
  const findVisuals=()=>{
    const nodes=Array.from(root().querySelectorAll('*'));
    return {
      input:root().querySelector('input'),
      selected:nodes.filter(node=>node.classList.contains('selected')),
      widths:nodes.filter(node=>node.style?.width).map(node=>({node,width:node.style.width})),
    };
  };
  try{
    document.body.append(outside);outside.focus();document.body.append(el);await el.updateComplete;
    let view=findVisuals();
    if(!view.input)return {passed:false,receivedValue:'No se encontró el input de búsqueda.'};
    if(focused()===view.input)return {passed:false,receivedValue:'El input tomó foco durante el render inicial.'};
    if(view.selected.length!==1)return {passed:false,receivedValue:'Con selected=true se observaron '+view.selected.length+' nodos con la clase selected.'};
    const row=view.selected[0],bar=view.widths.find(entry=>entry.width==='65%')?.node;
    if(!bar)return {passed:false,receivedValue:'Con width=65 no se encontró una barra con ancho 65%; anchos: '+view.widths.map(entry=>entry.width).join(', ')};
    el.selected=false;el.width=35;el.requestUpdate();await el.updateComplete;view=findVisuals();
    if(row.classList.contains('selected')||bar.style.width!=='35%')return {passed:false,receivedValue:'Con selected=false y width=35: clase='+row.className+', ancho='+bar.style.width};
    if(document.activeElement!==outside)return {passed:false,receivedValue:'Actualizar el estado quitó el foco del control externo.'};
    el.selected=true;el.width=80;el.requestUpdate();await el.updateComplete;
    if(!row.classList.contains('selected')||bar.style.width!=='80%')return {passed:false,receivedValue:'Con selected=true y width=80: clase='+row.className+', ancho='+bar.style.width};
    if(typeof el.focusSearch!=='function')return {passed:false,receivedValue:'Falta la acción focusSearch.'};
    el.focusSearch();
    if(focused()!==view.input)return {passed:false,receivedValue:'focusSearch no enfocó el input renderizado.'};
    outside.focus();el.requestUpdate();await el.updateComplete;
    return {passed:document.activeElement===outside,receivedValue:document.activeElement===outside?'El foco externo se conserva.':'Un update volvió a tomar el foco.'};
  }finally{el.remove();outside.remove();}
}`);

const focusOnDemandTest = browserTest('lit28-d0', 'El campo se enfoca solo cuando se solicita', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('search-toolbar');
  const el=document.createElement('search-toolbar');
  const outside=document.createElement('button');outside.textContent='Fuera';
  const root=()=>el.shadowRoot||el;
  const focused=()=>el.shadowRoot?el.shadowRoot.activeElement:document.activeElement;
  try{
    document.body.append(outside);outside.focus();document.body.append(el);await el.updateComplete;
    const input=root().querySelector('#q');
    if(!input)return {passed:false,receivedValue:'No existe el input #q después del render.'};
    if(focused()===input)return {passed:false,receivedValue:'El input tomó foco sin solicitarlo.'};
    outside.focus();el.requestUpdate();await el.updateComplete;
    if(document.activeElement!==outside)return {passed:false,receivedValue:'Un update tomó el foco del control externo.'};
    if(typeof el.focusSearch!=='function')return {passed:false,receivedValue:'Falta la acción focusSearch.'};
    el.focusSearch();
    if(focused()!==input)return {passed:false,receivedValue:'focusSearch no enfocó #q.'};
    outside.focus();el.requestUpdate();await el.updateComplete;el.requestUpdate();await el.updateComplete;
    return {passed:document.activeElement===outside,receivedValue:document.activeElement===outside?'El foco externo se conserva.':'Una actualización posterior recuperó el foco.'};
  }finally{el.remove();outside.remove();}
}`);

const catalogTaskBehaviorTest = browserTest('lit29-behavior', 'La consulta recorre sus estados y solo publica la respuesta vigente', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('remote-catalog');
  const el=document.createElement('remote-catalog');
  const root=()=>el.shadowRoot||el;
  const text=()=>root().textContent.replace(/\s+/g,' ').trim();
  const waitFor=async(expected,timeout=250)=>{
    const started=Date.now();
    while(Date.now()-started<timeout){if(text().includes(expected))return true;await new Promise(resolve=>setTimeout(resolve,5));}
    return false;
  };
  const change=async query=>{el.query=query;el.requestUpdate();await el.updateComplete;};
  try{
    document.body.append(el);await el.updateComplete;
    if(!text().includes('Cargando'))return {passed:false,receivedValue:'La consulta inicial no mostró Cargando: '+text()};
    if(!await waitFor('Teclado'))return {passed:false,receivedValue:'La consulta teclado no terminó con Teclado: '+text()};
    await change('');
    if(!text().includes('Cargando'))return {passed:false,receivedValue:'La consulta vacía no pasó por Cargando: '+text()};
    if(!await waitFor('Sin resultados'))return {passed:false,receivedValue:'La consulta vacía terminó en: '+text()};
    await change('error');
    if(!text().includes('Cargando'))return {passed:false,receivedValue:'La consulta con error no pasó por Cargando: '+text()};
    if(!await waitFor('Error'))return {passed:false,receivedValue:'La consulta con error terminó en: '+text()};
    await change('lento');
    if(!text().includes('Cargando'))return {passed:false,receivedValue:'La consulta lenta no mostró Cargando: '+text()};
    await change('cable');
    if(!await waitFor('Cable'))return {passed:false,receivedValue:'La consulta vigente cable terminó en: '+text()};
    await new Promise(resolve=>setTimeout(resolve,90));
    const finalText=text();
    return {passed:finalText.includes('Cable')&&!finalText.includes('Lento'),receivedValue:'Tras completar la respuesta obsoleta se ve: '+finalText};
  }finally{el.remove();}
}`);

const stableWeatherTaskTest = browserTest('lit29-d0', 'La tarea conserva identidad entre renders y no reinicia al actualizar', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('weather-panel');
  const el=document.createElement('weather-panel');
  const root=()=>el.shadowRoot||el;
  const text=()=>root().textContent.replace(/\s+/g,' ').trim();
  const waitFor=async(expected,timeout=250)=>{
    const started=Date.now();
    while(Date.now()-started<timeout){if(text().includes(expected))return true;await new Promise(resolve=>setTimeout(resolve,5));}
    return false;
  };
  try{
    document.body.append(el);await el.updateComplete;
    if(!text().includes('Cargando'))return {passed:false,receivedValue:'La primera ejecución no mostró Cargando: '+text()};
    if(!await waitFor('20'))return {passed:false,receivedValue:'La tarea no completó con 20: '+text()};
    for(let i=0;i<3;i++){
      el.requestUpdate();await el.updateComplete;
      if(text().includes('Cargando')||!text().includes('20'))return {passed:false,receivedValue:'El render '+(i+1)+' reinició o perdió la tarea: '+text()};
    }
    await new Promise(resolve=>setTimeout(resolve,40));
    return {passed:text().includes('20')&&!text().includes('Task se recreó'),receivedValue:'Salida final: '+text()};
  }finally{el.remove();}
}`);

const networkControllerLifecycleTest = browserTest('lit30-behavior', 'El controlador sigue la conexión y respeta el ciclo del host', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('network-panel');
  const win=document.defaultView,nav=win.navigator;
  const previous=Object.getOwnPropertyDescriptor(nav,'onLine');
  const setOnline=value=>Object.defineProperty(nav,'onLine',{configurable:true,value});
  const root=el=>el.shadowRoot||el;
  const text=el=>root(el).textContent.replace(/\s+/g,' ').trim();
  let el;
  try{
    setOnline(true);
    el=document.createElement('network-panel');
    const requestUpdate=el.requestUpdate.bind(el);
    let requests=0;
    el.requestUpdate=(...args)=>{requests+=1;return requestUpdate(...args);};
    document.body.append(el);await el.updateComplete;
    if(!text(el).includes('En línea'))return {passed:false,receivedValue:'Estado inicial: '+text(el)};

    requests=0;setOnline(false);win.dispatchEvent(new Event('offline'));await el.updateComplete;
    if(!text(el).includes('Sin conexión')||requests!==1)return {passed:false,receivedValue:'Tras offline: vista='+text(el)+', updates='+requests};

    el.remove();requests=0;setOnline(true);win.dispatchEvent(new Event('online'));await Promise.resolve();
    if(requests!==0)return {passed:false,receivedValue:'Desconectado todavía pidió '+requests+' updates.'};

    document.body.append(el);await el.updateComplete;requests=0;win.dispatchEvent(new Event('online'));await el.updateComplete;
    if(!text(el).includes('En línea')||requests!==1)return {passed:false,receivedValue:'Tras reconectar: vista='+text(el)+', updates='+requests};
    return {passed:true,receivedValue:'Offline, limpieza y reconexión conservaron un único update por evento.'};
  }catch(error){return {passed:false,receivedValue:'No se pudo recorrer el ciclo: '+(error?.message||String(error))};}
  finally{
    el?.remove();
    if(previous)Object.defineProperty(nav,'onLine',previous);else delete nav.onLine;
  }
}`);

const counterControllerUpdateTest = browserTest('lit30-d0', 'Cada controlador actualiza su host desde su propia API', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('counter-panel');
  const first=document.createElement('counter-panel'),second=document.createElement('counter-panel');
  const root=el=>el.shadowRoot||el;
  const value=el=>root(el).querySelector('button')?.textContent.trim();
  const controller=el=>Object.values(el).find(candidate=>candidate&&typeof candidate.increment==='function'&&typeof candidate.value==='number');
  try{
    document.body.append(first,second);await Promise.all([first.updateComplete,second.updateComplete]);
    const firstButton=root(first).querySelector('button'),secondController=controller(second);
    if(!firstButton||!secondController)return {passed:false,receivedValue:'Falta el botón o la API increment del controlador.'};
    if(value(first)!=='0'||value(second)!=='0')return {passed:false,receivedValue:'Valores iniciales: '+value(first)+' y '+value(second)};
    firstButton.click();await first.updateComplete;firstButton.click();await first.updateComplete;
    if(value(first)!=='2'||value(second)!=='0')return {passed:false,receivedValue:'Tras dos clics: '+value(first)+' y '+value(second)};
    secondController.increment();await second.updateComplete;secondController.increment();await second.updateComplete;
    return {passed:value(first)==='2'&&value(second)==='2',receivedValue:'Tras usar la API del segundo: '+value(first)+' y '+value(second)};
  }finally{first.remove();second.remove();}
}`);

const libraryButtonPublicContractTest = browserTest('lit31-public', 'La API reactiva, el bloqueo y el evento conservan el contrato público', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('library-button');
  const el=document.createElement('library-button');
  const root=()=>el.shadowRoot||el;
  const button=()=>root().querySelector('button');
  let events=0,lastEvent;
  const onAction=event=>{events+=1;lastEvent=event;};
  try{
    document.addEventListener('library-action',onAction);
    document.body.append(el);await el.updateComplete;
    if(!button()||button().textContent.trim()!=='Guardar')return {passed:false,receivedValue:'El estado inicial no expone un botón Guardar.'};

    el.label='Publicar';await el.updateComplete;
    if(button().textContent.trim()!=='Publicar')return {passed:false,receivedValue:'Al cambiar label se mostró: '+button().textContent.trim()};

    el.disabled=true;await el.updateComplete;
    if(!el.hasAttribute('disabled')||button().disabled!==true)return {passed:false,receivedValue:'Con disabled=true: host='+el.hasAttribute('disabled')+', botón='+button().disabled};
    button().click();await el.updateComplete;
    if(events!==0)return {passed:false,receivedValue:'El botón deshabilitado emitió '+events+' eventos.'};

    el.disabled=false;await el.updateComplete;button().click();await el.updateComplete;
    if(events!==1)return {passed:false,receivedValue:'Una activación habilitada emitió '+events+' eventos.'};
    return {passed:!el.hasAttribute('disabled')&&button().disabled===false&&lastEvent?.bubbles===true&&lastEvent?.composed===true,receivedValue:'Host disabled='+el.hasAttribute('disabled')+', botón disabled='+button().disabled+', bubbles='+lastEvent?.bubbles+', composed='+lastEvent?.composed};
  }finally{document.removeEventListener('library-action',onAction);el.remove();}
}`);

const statusChipRegistrationTest = browserTest('lit31-d0', 'La etiqueta registra la clase pública que conserva la vista', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('status-chip');
  const PublicClass=customElements.get('status-chip');
  if(!PublicClass||PublicClass.name!=='StatusChip')return {passed:false,receivedValue:'La etiqueta quedó registrada con '+(PublicClass?.name||'una clase anónima')+'.'};
  const el=new PublicClass();
  try{
    document.body.append(el);await el.updateComplete;
    const root=el.shadowRoot||el;
    return {passed:root.textContent.includes('Listo'),receivedValue:'Vista registrada: '+root.textContent.trim()};
  }finally{el.remove();}
}`);

const issueAppVerticalSliceTest = browserTest('lit32-vertical-slice', 'Crear, filtrar y cerrar forman un corte vertical observable', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('issue-app');
  const el=document.createElement('issue-app');
  const root=()=>el.shadowRoot||el;
  const text=()=>root().textContent.replace(/\s+/g,' ').trim();
  const rows=()=>[...root().querySelectorAll('li')];
  const submit=async(title,priority)=>{
    const form=root().querySelector('form'),titleInput=root().querySelector('[name="title"]'),priorityInput=root().querySelector('[name="priority"]');
    if(!form||!titleInput||!priorityInput)return {found:false};
    titleInput.value=title;priorityInput.value=String(priority);
    const event=new Event('submit',{bubbles:true,cancelable:true});
    const dispatched=form.dispatchEvent(event);await el.updateComplete;
    return {found:true,prevented:event.defaultPrevented,dispatched};
  };
  try{
    document.body.append(el);await el.updateComplete;
    const form=root().querySelector('form'),title=root().querySelector('[name="title"]'),priority=root().querySelector('[name="priority"]');
    if(!form||!title||!priority||!title.closest('label')||!priority.closest('label'))return {passed:false,receivedValue:'Falta el formulario o una etiqueta accesible para sus controles.'};
    if(!text().includes('Sin incidencias'))return {passed:false,receivedValue:'Estado inicial: '+text()};

    const before=el.issues;
    el.createIssue('   ',2);el.createIssue('Fuera de rango',4);await el.updateComplete;
    if(el.issues!==before||el.issues.length!==0)return {passed:false,receivedValue:'Las entradas inválidas cambiaron el estado.'};

    const firstSubmit=await submit('  Error de acceso  ',2);
    if(!firstSubmit.found||!firstSubmit.prevented||firstSubmit.dispatched!==false)return {passed:false,receivedValue:'El envío no quedó integrado o no evitó la navegación.'};
    if(el.issues.length!==1||el.issues===before||el.issues[0].title!=='Error de acceso'||el.issues[0].priority!==2||el.issues[0].status!=='open')return {passed:false,receivedValue:'Primera incidencia: '+JSON.stringify(el.issues)};
    const firstIssue=el.issues[0],firstId=firstIssue.id,afterFirst=el.issues;

    el.createIssue('Pantalla rota',3);await el.updateComplete;
    if(el.issues===afterFirst||el.issues.length!==2||el.issues[0]!==firstIssue||el.issues[1].id===firstId)return {passed:false,receivedValue:'La segunda creación no conservó copias, orden e ids únicos.'};
    if(!text().includes('2 incidencias')||rows().length!==2)return {passed:false,receivedValue:'Resumen o lista tras crear: '+text()};

    const secondIssue=el.issues[1],beforeClose=el.issues;
    const firstRow=rows().find(row=>row.textContent.includes('Error de acceso'));
    const closeButton=[...(firstRow?.querySelectorAll('button')||[])].find(button=>button.textContent.includes('Cerrar'));
    if(!closeButton)return {passed:false,receivedValue:'La primera fila no ofrece su acción Cerrar.'};
    closeButton.click();await el.updateComplete;
    if(el.issues===beforeClose||el.issues[0]===firstIssue||el.issues[0].status!=='closed'||el.issues[1]!==secondIssue||el.issues[1].status!=='open')return {passed:false,receivedValue:'Cerrar no reemplazó solo la incidencia elegida: '+JSON.stringify(el.issues)};

    el.filter='open';await el.updateComplete;
    if(rows().length!==1||!rows()[0].textContent.includes('Pantalla rota'))return {passed:false,receivedValue:'Filtro open: '+text()};
    el.filter='closed';await el.updateComplete;
    if(rows().length!==1||!rows()[0].textContent.includes('Error de acceso'))return {passed:false,receivedValue:'Filtro closed: '+text()};
    el.filter='all';await el.updateComplete;
    return {passed:rows().length===2,receivedValue:'Vista final: '+text()};
  }catch(error){return {passed:false,receivedValue:'No se pudo recorrer el corte: '+(error?.message||String(error))};}
  finally{el.remove();}
}`);

const supportBoardImmutableCloseTest = browserTest('lit32-d0', 'Cerrar reemplaza solo el ticket indicado y actualiza su vista', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('support-board');
  const el=document.createElement('support-board');
  const root=()=>el.shadowRoot||el;
  const text=()=>root().textContent.replace(/\s+/g,' ').trim();
  try{
    document.body.append(el);await el.updateComplete;
    const first={id:'t1',title:'Acceso',status:'open'},second={id:'t2',title:'Pago',status:'open'};
    el.tickets=[first,second];await el.updateComplete;
    const before=el.tickets;
    el.close('t2');await el.updateComplete;
    if(el.tickets===before||el.tickets.length!==2||el.tickets[0]!==first||el.tickets[1]===second||el.tickets[1].status!=='closed')return {passed:false,receivedValue:'Tras close(t2): '+JSON.stringify(el.tickets)};
    if(!text().includes('Acceso: open')||!text().includes('Pago: closed'))return {passed:false,receivedValue:'Vista tras cerrar: '+text()};
    const after=el.tickets;el.close('desconocido');await el.updateComplete;
    return {passed:el.tickets===after,receivedValue:'Vista final: '+text()};
  }catch(error){return {passed:false,receivedValue:'No se pudo cerrar por identidad: '+(error?.message||String(error))};}
  finally{el.remove();}
}`);

export const COMPONENT_SPECS_27_TO_32 = [
  lesson({
    number: 27, module: 9, title: 'repeat, when y choose según el problema', appName: 'una bandeja de pedidos con identidad estable',
    summary: 'Selecciona directivas por identidad y claridad en vez de añadirlas por costumbre.',
    concepts: [{ label: 'repeat', desc: 'Render de listas con función de clave estable.' }, { label: 'when/choose', desc: 'Directivas para expresar ramas legibles.' }],
    skillsRequired: ['lit-slots', 'css-parts'], skillsIntroduced: ['lit-repeat', 'lit-branch-directives'],
    reasoningSteps: ['orders conserva ids', 'repeat relaciona id y DOM', 'El estado elige una rama', 'Lit mueve o actualiza los nodos correctos'],
    html: appHtml('Pedidos', '<order-tray></order-tray>'),
    example: `import { LitElement, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { when } from 'lit/directives/when.js';
class QueueView extends LitElement {
  static properties = { jobs: { state: true } };
  constructor() {
    super();
    this.jobs = [{ id: 'a', name: 'Compilar' }];
  }
  render() {
    return when(
      this.jobs.length > 0,
      () =>
        html\`<ul>
          \${repeat(
            this.jobs,
            (j) => j.id,
            (j) => html\`<li>\${j.name}</li>\`,
          )}
        </ul>\`,
      () => html\`<p>Sin trabajos</p>\`,
    );
  }
}
customElements.define('queue-view', QueueView);`,
    starter: `import { LitElement, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { when } from 'lit/directives/when.js';
class OrderTray extends LitElement {
  static properties = { orders: { state: true } };
  constructor() {
    super();
    this.orders = [
      { id: 'p2', name: 'Teclado' },
      { id: 'p1', name: 'Cable' },
    ];
  }
  remove(id) {
    this.orders = this.orders.filter((order) => order.id !== id);
  }
  render() {
    /* muestra la rama vacía o una fila estable con su acción Quitar */
  }
}
customElements.define('order-tray', OrderTray);`,
    challengeTitle: 'App: bandeja con identidad', challengeInstructions: 'Muestra una fila y un botón Quitar por pedido. La fila debe conservar su nodo al reordenar, insertar o quitar pedidos aunque los objetos se recreen; cada botón quita el pedido de su propia fila. Solo cuando la lista quede vacía muestra “Sin pedidos”. Usa repeat con una identidad estable y expresa la rama vacía con when o un condicional equivalente.',
    tests: [browserTest('lit27-list-behavior', 'Las filas conservan identidad, cada acción quita su pedido y el vacío aparece a tiempo', `async ({document,customElements})=>{
      await customElements.whenDefined('order-tray');
      const el=document.createElement('order-tray');
      const data=[{id:'r7',name:'Nota'},{id:'r2',name:'Nota'},{id:'r9',name:'Otro'}];
      const root=()=>el.shadowRoot||el;
      const buttons=()=>Array.from(root().querySelectorAll('button'));
      const update=async(items)=>{el.orders=items.map(item=>({...item}));el.requestUpdate();await el.updateComplete;};
      const rows=()=>buttons().map(button=>button.parentElement);
      try{
        el.orders=data.map(item=>({...item}));document.body.append(el);await el.updateComplete;
        let actions=buttons(),nodes=rows();
        if(actions.length!==3||root().textContent.includes('Sin pedidos'))return {passed:false,actual:'La lista inicial debe mostrar tres acciones y no la rama vacía.'};
        if(nodes.some((node,index)=>!node||!node.textContent.includes(data[index].name)))return {passed:false,actual:'Cada acción debe compartir una fila con el nombre de su pedido.'};
        const saved=new Map(data.map((item,index)=>[item.id,nodes[index]]));
        const reordered=[data[2],data[1],data[0]];
        await update(reordered);nodes=rows();
        if(nodes.some((node,index)=>node!==saved.get(reordered[index].id)))return {passed:false,actual:'Al reordenar copias de los pedidos, una fila perdió su nodo.'};
        const added={id:'r4',name:'Nota'},expanded=[added,data[1],data[2],data[0]];
        await update(expanded);nodes=rows();
        if(nodes.length!==4||nodes.slice(1).some((node,index)=>node!==saved.get(expanded[index+1].id))||Array.from(saved.values()).includes(nodes[0]))return {passed:false,actual:'Insertar un pedido debe crear solo su fila y conservar las existentes.'};
        actions=buttons();actions[1].click();await el.updateComplete;
        if(el.orders.map(item=>item.id).join(',')!=='r4,r9,r7')return {passed:false,actual:'Quitar en la segunda fila dejó estos ids: '+el.orders.map(item=>item.id).join(',')};
        nodes=rows();
        if(nodes.length!==3||nodes[1]!==saved.get('r9')||nodes[2]!==saved.get('r7'))return {passed:false,actual:'Quitar una fila no debe reemplazar las demás.'};
        while(buttons().length){buttons()[0].click();await el.updateComplete;}
        return {passed:el.orders.length===0&&buttons().length===0&&root().textContent.includes('Sin pedidos'),actual:'Estado final: '+root().textContent.trim()};
      }finally{el.remove();}
    }`)],
    hints: ['Reordena mentalmente la lista: ¿qué dato sigue nombrando al mismo pedido cuando cambia de posición?', 'El nombre puede repetirse y los objetos pueden recrearse; busca una identidad que sobreviva a ambos cambios.', 'La acción vive dentro de una fila: debe usar la identidad de esa fila, y la rama vacía solo corresponde a longitud cero.'],
    model: 'repeat entrega una cédula estable a cada fila; cuando cambia el orden, Lit reconoce quién se movió en vez de confundirlo con su posición.',
    whenToUse: 'Usa repeat cuando la lista cambia de orden, inserta o elimina y el DOM de cada fila tiene identidad; map basta para listas simples.',
    bestPractices: 'Elige claves únicas y duraderas; usa directivas solo cuando expresan mejor la intención que JavaScript normal.',
    commonErrors: 'índice como clave, claves duplicadas, choose para dos ramas simples o directivas que ocultan una regla de negocio.',
    transfer: 'Decide entre map y repeat para etiquetas, filas editables, resultados de búsqueda y pasos fijos.',
    sources: [source('Built-in directives', 'https://lit.dev/docs/templates/directives/', 'Compara repeat, when y choose.', 'Lit'), source('Lists', 'https://lit.dev/docs/templates/lists/', 'Comprende identidad.', 'Lit')],
    debug: { title: 'La lista usa índice y conserva el input equivocado', expected: 'editable-list muestra un input por item, en el orden de items. Al reordenar, insertar o quitar elementos, cada id conserva su input y el texto que la persona escribió en él, aunque items contenga copias nuevas de los objetos. Dos elementos pueden tener el mismo nombre. Usa repeat con una identidad estable.', observed: 'Al cambiar el orden, el texto editado queda asociado a otra posición.',
      starter: `import { LitElement, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
class EditableList extends LitElement {
  constructor() {
    super();
    this.items = [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ];
  }
  render() {
    return html\`\${repeat(
      this.items,
      (_item, index) => index,
      (item) => html\`<input .value=\${item.name} />\`,
    )}\`;
  }
}
customElements.define('editable-list', EditableList);`,
      tests: [browserTest('lit27-d0', 'Cada elemento conserva su input y su edición al cambiar la lista', `async ({document,customElements})=>{
        await customElements.whenDefined('editable-list');
        const el=document.createElement('editable-list');
        const data=[{id:'r7',name:'Nota'},{id:'r2',name:'Nota'},{id:'r9',name:'Otro'}];
        const saved=new Map();
        const inputs=()=>Array.from((el.shadowRoot||el).querySelectorAll('input'));
        const update=async(items)=>{el.items=items.map(item=>({...item}));el.requestUpdate();await el.updateComplete;};
        try{
          el.items=data.map(item=>({...item}));document.body.append(el);await el.updateComplete;
          let nodes=inputs();
          if(nodes.length!==3||nodes.some((node,index)=>node.value!==data[index].name))return {passed:false,actual:'La lista inicial no muestra un input con el nombre de cada elemento.'};
          for(let i=0;i<data.length;i++){nodes[i].value='Edición '+data[i].id;nodes[i].dispatchEvent(new Event('input',{bubbles:true,composed:true}));saved.set(data[i].id,{node:nodes[i],value:nodes[i].value});}
          const added={id:'r4',name:'Nota'};
          for(const [stage,items] of [
            ['reordenar',[data[2],data[1],data[0]]],
            ['insertar',[added,data[1],data[2],data[0]]],
            ['quitar',[added,data[0],data[1]]]
          ]){
            await update(items);nodes=inputs();
            if(nodes.length!==items.length)return {passed:false,actual:'Al '+stage+' hay '+nodes.length+' inputs; se esperaban '+items.length+'.'};
            for(let i=0;i<items.length;i++){
              const item=items[i],previous=saved.get(item.id);
              if(previous){
                if(nodes[i]!==previous.node)return {passed:false,actual:'Al '+stage+', '+item.id+' perdió su input o quedó en otra posición.'};
                if(nodes[i].value!==previous.value)return {passed:false,actual:'Al '+stage+', '+item.id+' perdió su texto editado: '+nodes[i].value};
              }else{
                if(nodes[i].value!==item.name||Array.from(saved.values()).some(entry=>entry.node===nodes[i]))return {passed:false,actual:'El elemento nuevo reutilizó el input de otro o no mostró su nombre.'};
                nodes[i].value='Edición '+item.id;nodes[i].dispatchEvent(new Event('input',{bubbles:true,composed:true}));saved.set(item.id,{node:nodes[i],value:nodes[i].value});
              }
            }
          }
          await update([]);
          if(inputs().length!==0)return {passed:false,actual:'La lista vacía todavía conserva inputs.'};
          await update([{id:'r8',name:'Nuevo'}]);nodes=inputs();
          return {passed:nodes.length===1&&nodes[0].value==='Nuevo',actual:'Tras vaciar y añadir, valores observados: '+nodes.map(node=>node.value).join(', ')};
        }finally{el.remove();}
      }`)],
      hints: ['La posición cambia cuando insertas o quitas una fila. Observa a qué elemento pertenece el texto editado.', 'El nombre puede repetirse y una copia del objeto sigue representando al mismo elemento.', 'Busca el dato que permanece estable entre versiones de la lista y úsalo como identidad de la fila.'] },
  }),
  lesson({
    number: 28, module: 9, title: 'classMap, styleMap y ref con intención', appName: 'una tabla interactiva con estado visual y foco',
    summary: 'Aplica clases, estilos y referencias DOM con directivas específicas sin volver imperativo todo el componente.',
    concepts: [{ label: 'classMap/styleMap', desc: 'Bindings declarativos para mapas de clase o estilo.' }, { label: 'ref', desc: 'Referencia a un nodo cuando una API imperativa la necesita.' }],
    skillsRequired: ['lit-repeat', 'lit-branch-directives'], skillsIntroduced: ['lit-style-directives', 'lit-ref'],
    reasoningSteps: ['El estado define selección y ancho', 'classMap/styleMap describen apariencia', 'ref captura el input', 'Una acción justificada usa focus'],
    html: appHtml('Tabla', '<interactive-table></interactive-table>'),
    example: `import { LitElement, html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
class StatusRow extends LitElement {
  constructor() {
    super();
    this.active = true;
  }
  render() {
    return html\`<p class=\${classMap({ active: this.active, muted: !this.active })}>
      Estado
    </p>\`;
  }
}
customElements.define('status-row', StatusRow);`,
    starter: `import { LitElement, html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { createRef, ref } from 'lit/directives/ref.js';
class InteractiveTable extends LitElement {
  constructor() {
    super();
    this.selected = true;
    this.width = 65;
    this.searchRef = createRef();
  }
  focusSearch() {
    /* usa la referencia */
  }
  render() {
    /* input con ref, fila classMap y barra styleMap width porcentual */
  }
}
customElements.define('interactive-table', InteractiveTable);`,
    challengeTitle: 'App: tabla declarativa', challengeInstructions: 'Renderiza un input, una fila cuya clase selected siga el booleano selected y una barra cuyo ancho porcentual siga width (65% al inicio). focusSearch debe enfocar ese input solo cuando se llama; cambiar selected o width y volver a renderizar no debe robar el foco. Practica classMap, styleMap y ref para expresar esas tres responsabilidades.',
    tests: [visualStateAndFocusTest],
    hints: ['createRef se conserva en la instancia.', 'ref(this.searchRef) conecta el input.', 'value contiene el nodo después de render.'],
    model: 'Las directivas son adaptadores estrechos: expresan una operación DOM concreta sin abandonar el flujo declarativo del template.',
    whenToUse: 'Usa classMap/styleMap con mapas dinámicos y ref para foco, medición o bibliotecas imperativas; no para leer datos que ya están en estado.',
    bestPractices: 'Mantén mapas pequeños, valores CSS controlados y acceso DOM encapsulado en métodos con nombre.',
    commonErrors: 'styleMap con datos no validados, ref como sustituto de estado o classMap para una sola clase ternaria.',
    transfer: 'Elige directiva o sintaxis normal para tooltip, progreso, tema, autofocus y selección múltiple.',
    sources: [source('classMap', 'https://lit.dev/docs/templates/directives/#classmap', 'Consulta clases dinámicas.', 'Lit'), source('ref', 'https://lit.dev/docs/templates/directives/#ref', 'Usa referencias justificadas.', 'Lit')],
    debug: { title: 'focus corre durante render', expected: 'search-toolbar conserva el foco de la persona durante el render y las actualizaciones; solo focusSearch enfoca el input #q.', observed: 'Una actualización ejecuta focus() como efecto de render y recupera el foco sin que la persona lo pida.',
      starter: `import { LitElement, html } from 'lit';
class SearchToolbar extends LitElement {
  render() {
    return html\`<input id="q" />\${this.renderRoot.querySelector('#q')?.focus()}\`;
  }
}
customElements.define('search-toolbar', SearchToolbar);`,
      tests: [focusOnDemandTest],
      hints: ['render debe describir el input, no ejecutar foco.', 'Captura el nodo después de renderizar; ref es una opción directa para hacerlo.', 'Mueve focus a focusSearch y comprueba que una actualización posterior respete el foco externo.'] },
  }),
  lesson({
    number: 29, module: 9, title: 'Tareas asíncronas con estados y carreras', appName: 'un catálogo remoto con Task',
    summary: 'Modela argumentos, cancelación y estados de una tarea mediante @lit/task sin esconder reglas de red.',
    concepts: [{ label: 'Task', desc: 'Controlador para trabajo asíncrono ligado a argumentos reactivos.' }, { label: 'Race safety', desc: 'Solo el resultado de los argumentos vigentes llega a la vista.' }],
    skillsRequired: ['lit-style-directives', 'lit-ref'], skillsIntroduced: ['lit-task', 'lit-async-render'],
    reasoningSteps: ['query cambia', 'Task recibe argumentos y signal', 'pending/complete/error seleccionan UI', 'Solo la ejecución vigente completa'],
    html: appHtml('Catálogo', '<remote-catalog></remote-catalog>'),
    example: `import { LitElement, html } from 'lit';
import { Task } from '@lit/task';
class DemoTask extends LitElement {
  constructor() {
    super();
    this.query = 'web';
    this._task = new Task(this, {
      task: async ([query]) => query.toUpperCase(),
      args: () => [this.query],
    });
  }
  render() {
    return this._task.render({
      pending: () => html\`<p>Cargando</p>\`,
      complete: (value) => html\`<p>\${value}</p>\`,
      error: () => html\`<p>Error</p>\`,
    });
  }
}
customElements.define('demo-task', DemoTask);`,
    starter: `import { LitElement, html } from 'lit';
import { Task } from '@lit/task';
class RemoteCatalog extends LitElement {
  static properties = { query: { type: String } };
  constructor() {
    super();
    this.query = 'teclado';
    this._catalogTask = new Task(this, {
      task: async ([query], { signal }) => {
        /* simula y devuelve [] para vacio o [{name:'Teclado'}] */
      },
      args: () => [this.query],
    });
  }
  render() {
    /* pending, complete con empty/ready y error */
  }
}
customElements.define('remote-catalog', RemoteCatalog);`,
    challengeTitle: 'App: catálogo asíncrono', challengeInstructions: 'Crea una Task ligada a query. Cada consulta debe mostrar Cargando antes de completar: “teclado” devuelve Teclado, una query vacía muestra Sin resultados y “error” muestra Error. Simula una espera cancelable con signal; “lento” tarda más que las demás, de modo que si enseguida se consulta “cable”, la vista debe terminar y permanecer en Cable aunque la respuesta anterior llegue después.',
    tests: [catalogTaskBehaviorTest],
    hints: ['Task vive en la instancia; args debe devolver la query actual para iniciar una ejecución nueva.', 'El callback task recibe la query y un signal. Conecta ese signal a la espera o al API para cancelar trabajo superado.', 'pending explica la espera; complete distingue el array vacío; error explica el fallo. La vista solo debe conservar el resultado de los argumentos vigentes.'],
    model: 'Task coordina el calendario de la operación; tu servicio conserva el contrato de datos y tu template decide cómo explicar cada estado.',
    whenToUse: 'Úsalo cuando una operación depende de propiedades reactivas y necesitas coordinación de estados; una promesa puntual puede ser suficiente en casos simples.',
    bestPractices: 'Pasa signal a operaciones cancelables, separa normalización del componente y cubre vacío además de error.',
    commonErrors: 'crear Task dentro de render, omitir args, ignorar signal o meter fetch, normalización y presentación en una sola función.',
    transfer: 'Diseña Task para detalle por id y para sugerencias por query; identifica argumentos y estados.',
    sources: [source('Async tasks', 'https://lit.dev/docs/data/task/', 'Aprende Task, args y render de estados.', 'Lit'), source('@lit/task API', 'https://lit.dev/docs/api/task/', 'Consulta opciones.', 'Lit')],
    debug: { title: 'Se crea una tarea en cada render', expected: 'weather-panel conserva una única Task durante la vida de la instancia. La primera ejecución muestra Cargando y luego 20; pedir nuevos renders conserva ese resultado sin reiniciar la espera.', observed: 'render vuelve a instanciar Task; un tope de seguridad detiene la cadena para que puedas depurarla.',
      starter: `import { LitElement, html } from 'lit';
import { Task } from '@lit/task';
class WeatherPanel extends LitElement {
  _renderAttempts = 0;
  render() {
    this._renderAttempts += 1;
    // Este tope evita congelar el laboratorio, pero no corrige la identidad de Task.
    if (this._renderAttempts > 2) {
      return html\`<p>Task se recreó durante render.</p>\`;
    }
    const task = new Task(this, { task: async () => ({ temp: 20 }), args: () => [] });
    return task.render({ complete: (data) => html\`<p>\${data.temp}</p>\` });
  }
}
customElements.define('weather-panel', WeatherPanel);`,
      tests: [stableWeatherTaskTest],
      hints: ['render puede ejecutarse muchas veces; todo lo que construyas allí vuelve a nacer.', 'Task tiene estado y ciclo propios: debe conservar la misma identidad entre actualizaciones.', 'Crea una Task una vez en la instancia y deja que render solo elija la vista de su estado. Incluye pending y complete.'] },
  }),
  lesson({
    number: 30, module: 10, title: 'Controladores, contexto y servicios compartidos', appName: 'un panel de conectividad con lógica reutilizable',
    summary: 'Extrae estado con ciclo propio a un Reactive Controller y usa contexto solo para dependencias realmente transversales.',
    concepts: [{ label: 'Reactive Controller', desc: 'Objeto que participa en el ciclo del host sin ser un componente.' }, { label: 'Context', desc: 'Canal para datos transversales a través de un árbol de componentes.' }],
    skillsRequired: ['lit-task', 'lit-async-render'], skillsIntroduced: ['lit-controllers', 'lit-context'],
    reasoningSteps: ['El host crea NetworkController', 'El controlador se registra', 'Eventos externos cambian su estado', 'requestUpdate actualiza al host'],
    html: appHtml('Conectividad', '<network-panel></network-panel>'),
    example: `import { LitElement, html } from 'lit';
class ClockController {
  constructor(host) {
    this.host = host;
    host.addController(this);
    this.value = new Date();
  }
  hostConnected() {
    this.timer = setInterval(() => {
      this.value = new Date();
      this.host.requestUpdate();
    }, 1000);
  }
  hostDisconnected() {
    clearInterval(this.timer);
  }
}
class ClockPanel extends LitElement {
  constructor() {
    super();
    this.clock = new ClockController(this);
  }
  render() {
    return html\`<time>\${this.clock.value.toLocaleTimeString()}</time>\`;
  }
}
customElements.define('clock-panel', ClockPanel);`,
    starter: `import { LitElement, html } from 'lit';
class NetworkController {
  constructor(host) {
    this.host = host;
    this.online = true; /* registra el controlador */
  }
  hostConnected() {
    /* escucha online/offline con referencia estable */
  }
  hostDisconnected() {
    /* limpia */
  }
}
class NetworkPanel extends LitElement {
  constructor() {
    super();
    this.network = new NetworkController(this);
  }
  render() {
    return html\`<p>\${this.network.online ? 'En línea' : 'Sin conexión'}</p>\`;
  }
}
customElements.define('network-panel', NetworkPanel);`,
    challengeTitle: 'App: estado reutilizable por composición', challengeInstructions: 'Haz que NetworkController se registre en el host y muestre “En línea” o “Sin conexión” según navigator.onLine. Mientras el panel está conectado, los eventos online/offline deben actualizar la vista una sola vez; desconectado no debe reaccionar, y al reconectarlo debe volver a escuchar sin duplicados. Conserva una referencia estable para poder limpiar y pide la actualización desde el controlador.',
    tests: [networkControllerLifecycleTest],
    hints: ['El controlador necesita registrarse para que Lit llame sus callbacks cuando el host entra o sale del documento.', 'La misma referencia que se entrega a addEventListener debe llegar a removeEventListener.', 'Cuando el evento cambie online, actualiza el dato del controlador y notifica a su host.'],
    model: 'Un controller es un órgano reusable con su propio ciclo; el contexto es una red de distribución. Ninguno debe convertirse en un almacén global para cualquier dato.',
    whenToUse: 'Usa controller para lógica reusable con ciclo; usa contexto para tema, sesión o servicio compartido por ramas profundas.',
    bestPractices: 'Mantén API estrecha, limpia recursos y prefiere propiedades/eventos cuando solo hay relación padre-hijo.',
    commonErrors: 'mixins que contaminan prototipos, contexto para estado local, listeners sin cleanup o controller que renderiza DOM.',
    transfer: 'Elige propiedades, contexto o controller para locale, carrito, tamaño del viewport y datos de una fila.',
    sources: [source('Reactive Controllers', 'https://lit.dev/docs/composition/controllers/', 'Diseña composición con ciclo.', 'Lit'), source('Context', 'https://lit.dev/docs/data/context/', 'Comprende provider y consumer.', 'Lit')],
    debug: { title: 'El controlador actualiza datos pero no la vista', expected: 'Cada counter-panel empieza en 0. Tanto el clic como llamar increment() directamente actualizan el número visible de esa instancia, sin modificar otra. La notificación pertenece al controlador, no al botón.', observed: 'Incrementa value sin avisar, así que el dato cambia pero el host conserva la vista anterior.',
      starter: `import { LitElement, html } from 'lit';
class CounterController {
  constructor(host) {
    this.host = host;
    host.addController(this);
    this.value = 0;
  }
  increment() {
    this.value += 1;
  }
}
class CounterPanel extends LitElement {
  constructor() {
    super();
    this.counter = new CounterController(this);
  }
  render() {
    return html\`<button @click=\${() => this.counter.increment()}>
      \${this.counter.value}
    </button>\`;
  }
}
customElements.define('counter-panel', CounterPanel);`,
      tests: [counterControllerUpdateTest],
      hints: ['value vive en el controlador y no es una propiedad reactiva del host.', 'Comprueba qué objeto conoce al host incluso cuando increment se invoca fuera del botón.', 'Después de cambiar value, el controlador debe solicitar la actualización de su propio host.'] },
  }),
  lesson({
    number: 31, module: 10, title: 'Testing, accesibilidad, paquetes y producción', appName: 'una biblioteca de componentes con contrato verificable',
    summary: 'Prepara componentes para trabajo real: pruebas en navegador, documentación, exportaciones, accesibilidad y build de producción.',
    concepts: [{ label: 'Paquete', desc: 'Módulo versionado con exports y contratos públicos.' }, { label: 'Matriz de pruebas', desc: 'Casos de API, interacción, ciclo y accesibilidad.' }],
    skillsRequired: ['lit-controllers', 'lit-context'], skillsIntroduced: ['lit-production-testing', 'component-packaging'],
    reasoningSteps: ['Define contrato público', 'Prueba en navegador y accesibilidad', 'Empaqueta exports estables', 'Build/minificación producen artefacto consumible'],
    html: appHtml('Biblioteca', '<library-button></library-button>'),
    example: `import { LitElement, html } from 'lit';
export class LibraryBadge extends LitElement {
  static properties = { label: { type: String } };
  constructor() {
    super();
    this.label = 'Nuevo';
  }
  render() {
    return html\`<span role="status">\${this.label}</span>\`;
  }
}
customElements.define('library-badge', LibraryBadge);`,
    starter: `import { LitElement, html } from 'lit';
export class LibraryButton extends LitElement {
  static properties = {
    label: { type: String },
    disabled: { type: Boolean, reflect: true },
  };
  constructor() {
    super();
    this.label = 'Guardar';
    this.disabled = false;
  }
  render() {
    /* botón nativo, binding booleano y evento library-action al activar */
  }
}
customElements.define('library-button', LibraryButton);`,
    challengeTitle: 'App: componente listo para biblioteca', challengeInstructions: 'Completa el botón nativo de LibraryButton. Su texto debe seguir label; disabled debe reflejarse en el host, bloquear el botón y evitar acciones. Cada activación habilitada emite exactamente un evento library-action que burbujea y cruza Shadow DOM para que una aplicación consumidora pueda escucharlo.',
    tests: [libraryButtonPublicContractTest],
    hints: ['Empieza por la frontera nativa: texto y bloqueo deben responder a las dos propiedades públicas.', 'Un botón deshabilitado ya aporta semántica, teclado y bloqueo de activación; enlaza la propiedad booleana, no el texto “false”.', 'El evento público nace una vez por activación y necesita llegar más allá de la raíz del componente.'],
    model: 'Producción es mantener una promesa: API, semántica, pruebas, versión y artefacto deben contar la misma historia a otro equipo.',
    whenToUse: 'Empaqueta cuando varios proyectos o equipos consumen el componente; una app única puede conservar módulos internos.',
    bestPractices: 'Prueba en navegador, documenta propiedades/eventos/slots/parts, usa semver y publica artefactos sin fuentes accidentales.',
    commonErrors: 'tests DOM simulados, exports ambiguos, breaking changes sin versión, CSS hooks sin documentar o bundle duplicando Lit.',
    transfer: 'Escribe checklist de publicación para una tarjeta: API, a11y, tests, package exports, build y ejemplo de consumo.',
    sources: [source('Testing', 'https://lit.dev/docs/tools/testing/', 'Prueba en navegador.', 'Lit'), source('Publishing', 'https://lit.dev/docs/tools/publishing/', 'Prepara paquetes.', 'Lit'), source('Production', 'https://lit.dev/docs/tools/production/', 'Optimiza build.', 'Lit')],
    debug: { title: 'El paquete solo tiene export default anónimo', expected: 'El módulo ofrece StatusChip como export nombrado y registra esa misma clase en status-chip; una instancia creada desde la clase registrada muestra “Listo”.', observed: 'El consumidor no puede importar un nombre estable y la etiqueta se registra con otra clase.',
      starter: `import { LitElement, html } from 'lit';
export default class extends LitElement {
  render() {
    return html\`<span>Listo</span>\`;
  }
}
customElements.define(
  'status-chip',
  customElements.get('status-chip') || class extends LitElement {},
);`,
      tests: [statusChipRegistrationTest, sourceTest('lit31-d1', 'Ofrece StatusChip como export nombrado', String.raw`(?:export\s+(?:class|const|let|var)\s+StatusChip\b|export\s*\{[^}]*\bStatusChip\b[^}]*\})`) ],
      hints: ['La clase pública necesita un nombre que el consumidor pueda importar entre llaves.', 'La etiqueta y el export deben apuntar a la misma identidad, no a dos clases con una vista parecida.', 'Después del refactor, conserva el render de “Listo” en la clase que registras.'] },
  }),
  lesson({
    number: 32, module: 11, title: 'Proyecto final por cortes verticales', appName: 'un gestor de incidencias operativo',
    summary: 'Integra reglas, componentes, eventos, tareas, accesibilidad y pruebas construyendo una capacidad completa cada vez.',
    concepts: [{ label: 'Corte vertical', desc: 'Capacidad completa desde dato y regla hasta interacción visible.' }, { label: 'Arquitectura de componentes', desc: 'Fronteras con dueño de estado y dependencias dirigidas.' }],
    skillsRequired: ['lit-production-testing', 'component-packaging'], skillsIntroduced: ['lit-vertical-slices', 'component-system-design'],
    reasoningSteps: ['Formulario emite issue-create', 'IssueApp valida y posee issues', 'Lista recibe datos por propiedad', 'Fila emite cambios y el dueño actualiza'],
    html: appHtml('Incidencias', '<issue-app></issue-app>'),
    example: `import { LitElement, html } from 'lit';
class NoteApp extends LitElement {
  static properties = { notes: { state: true } };
  constructor() {
    super();
    this.notes = [];
  }
  add(text) {
    const clean = text.trim();
    if (clean) this.notes = [...this.notes, { id: crypto.randomUUID(), text: clean }];
  }
  render() {
    return html\`<button @click=\${() => this.add('Revisar')}>Añadir</button>
      <ul>
        \${this.notes.map((n) => html\`<li>\${n.text}</li>\`)}
      </ul>\`;
  }
}
customElements.define('note-app', NoteApp);`,
    starter: `import { LitElement, html } from 'lit';
class IssueApp extends LitElement {
  static properties = { issues: { state: true }, filter: { state: true } };
  constructor() {
    super();
    this.issues = [];
    this.filter = 'all';
  }
  createIssue(title, priority) {
    /* valida título y prioridad 1..3; agrega {id,title,priority,status:'open'} */
  }
  closeIssue(id) {
    /* reemplaza solo la incidencia indicada */
  }
  get visibleIssues() {
    /* aplica filter */
  }
  render() {
    /* formulario accesible + resumen + lista con botones cerrar; estados vacío y ready */
  }
}
customElements.define('issue-app', IssueApp);`,
    challengeTitle: 'Proyecto: primer sistema de incidencias', challengeInstructions: 'Entrega un corte completo: un formulario etiquetado crea incidencias sin navegar, recorta el título, acepta prioridades enteras del 1 al 3 y asigna ids únicos. Conserva issues como copias, muestra el total, una fila con Cerrar por incidencia y “Sin incidencias” cuando corresponda. Cerrar reemplaza solo la incidencia elegida. El filtro all/open/closed determina exactamente qué filas se ven. No uses valores fijos.',
    tests: [issueAppVerticalSliceTest],
    hints: ['Empieza por el contrato observable de una incidencia válida y deja las entradas inválidas sin cambios.', 'El formulario solo traduce controles a la API; IssueApp sigue siendo el único dueño del array.', 'Crea copias al añadir o cerrar, conserva intactos los elementos no elegidos y deriva la lista visible desde filter.'],
    model: 'Un corte vertical es una rebanada que se puede usar y probar: dato, regla, interacción y vista viajan juntos antes de abrir otra capacidad.',
    whenToUse: 'Construye por cortes siempre que una aplicación combine varias capas y el riesgo de integrar tarde sea alto.',
    bestPractices: 'Define requisitos observables, separa reglas puras, integra pronto y conserva eventos/propiedades como contratos entre piezas.',
    commonErrors: 'crear todos los componentes vacíos primero, compartir estado mutable, probar solo helpers o esconder requisitos incompletos detrás de UI bonita.',
    transfer: 'Planifica tres cortes para museo, clima o inventario y especifica la evidencia de cada uno.',
    sources: [source('Components overview', 'https://lit.dev/docs/components/overview/', 'Repasa arquitectura de un componente.', 'Lit'), source('Tools and workflows', 'https://lit.dev/docs/tools/overview/', 'Conecta desarrollo, pruebas y producción.', 'Lit')],
    debug: { title: 'Cerrar muta una incidencia y la vista no cambia', expected: 'close(id) reemplaza el array y solo el objeto del ticket indicado; conserva los demás objetos, ignora ids desconocidos y la vista refleja cada estado.', observed: 'Modifica status sobre la misma referencia.',
      starter: `import { LitElement, html } from 'lit';
class SupportBoard extends LitElement {
  static properties = { tickets: { state: true } };
  constructor() {
    super();
    this.tickets = [{ id: 't1', title: 'Acceso', status: 'open' }];
  }
  close(id) {
    const ticket = this.tickets.find((t) => t.id === id);
    ticket.status = 'closed';
  }
  render() {
    return html\`\${this.tickets.map((t) => html\`<p>\${t.title}: \${t.status}</p>\`)}\`;
  }
}
customElements.define('support-board', SupportBoard);`,
      tests: [supportBoardImmutableCloseTest],
      hints: ['Comprueba primero si el id pertenece a algún ticket; un id desconocido no necesita cambiar el estado.', 'Construye una colección nueva conservando la referencia de las filas que no seleccionaste.', 'El ticket elegido necesita otro objeto para que su nuevo estado llegue al render.'] },
  }),
];
