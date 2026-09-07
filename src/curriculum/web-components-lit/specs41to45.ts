import { appHtml, browserTest, lesson, source } from './helpers';

const viewportMixinLifecycleTest = browserTest('lit41-viewport-lifecycle', 'El mixin mide, reacciona, se limpia y conserva la conexión heredada', String.raw`async ({window,document,customElements,Event})=>{
  await customElements.whenDefined('viewport-panel');
  const panel=document.querySelector('viewport-panel');
  if(!panel)return false;
  const widthDescriptor=Object.getOwnPropertyDescriptor(window,'innerWidth');
  if(!widthDescriptor?.configurable)return false;
  const originalRequestUpdate=panel.requestUpdate;
  let widthRequests=0;
  let inheritedConnects=0;
  let inheritedDisconnects=0;
  panel.addController?.({hostConnected(){inheritedConnects+=1;},hostDisconnected(){inheritedDisconnects+=1;}});
  panel.requestUpdate=function(name,...args){if(name==='viewportWidth')widthRequests+=1;return originalRequestUpdate.call(this,name,...args);};
  const view=()=>panel.renderRoot?.textContent??'';
  const settle=()=>Promise.race([Promise.resolve(panel.updateComplete).then(()=>true,()=>false),new Promise(resolve=>setTimeout(()=>resolve(false),180))]);
  try{
    if(!await settle())return false;
    inheritedConnects=0;
    inheritedDisconnects=0;
    Object.defineProperty(window,'innerWidth',{configurable:true,value:641,writable:true});
    window.dispatchEvent(new Event('resize'));
    if(!await settle())return false;
    if(panel.viewportWidth!==641||!view().includes('641 px'))return false;

    panel.remove();
    if(inheritedDisconnects!==1)return false;
    window.innerWidth=702;
    window.dispatchEvent(new Event('resize'));
    await Promise.resolve();
    if(panel.viewportWidth!==641)return false;

    document.body.append(panel);
    if(!await settle())return false;
    if(inheritedConnects!==1||panel.viewportWidth!==702||!view().includes('702 px'))return false;
    widthRequests=0;
    window.innerWidth=733;
    window.dispatchEvent(new Event('resize'));
    if(!await settle())return false;
    return panel.viewportWidth===733&&view().includes('733 px')&&widthRequests===1;
  }catch{return false;}
  finally{
    panel.requestUpdate=originalRequestUpdate;
    if(widthDescriptor)Object.defineProperty(window,'innerWidth',widthDescriptor);
    panel.remove();
  }
}`);

const presenceMixinConnectionTest = browserTest('lit41-presence-chain', 'El mixin conserva la conexión y la vista sigue al estado', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('presence-card');
  const card=document.querySelector('presence-card');
  if(!card)return false;
  const view=()=>card.renderRoot?.textContent??'';
  const settle=()=>Promise.race([Promise.resolve(card.updateComplete).then(()=>true,()=>false),new Promise(resolve=>setTimeout(()=>resolve(false),180))]);
  try{
    if(!await settle())return false;
    if(card.presence!=='Disponible'||!view().includes('Disponible'))return false;
    card.remove();
    card.presence='Fuera';
    document.body.append(card);
    if(!await settle())return false;
    if(card.presence!=='Disponible'||!view().includes('Disponible'))return false;
    card.presence='Ocupada';
    card.requestUpdate();
    if(!await settle())return false;
    return view().includes('Ocupada')&&!view().includes('Disponible');
  }catch{return false;}
  finally{card.remove();}
}`);

const dependencyGraphInvariantTest = browserTest('lit42-graph-invariants', 'El grafo valida rutas, conserva rechazos y actualiza la interfaz', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('dependency-planner');
  const planner=document.querySelector('dependency-planner');
  const Graph=planner?.graph?.constructor;
  if(!planner||typeof Graph!=='function')return false;
  const view=()=>planner.renderRoot?.textContent??planner.textContent??'';
  const settle=()=>Promise.race([Promise.resolve(planner.updateComplete).then(()=>true,()=>false),new Promise(resolve=>setTimeout(()=>resolve(false),180))]);
  try{
    const graph=new Graph(['uno','dos','tres','cuatro']);
    if(!Array.isArray(graph.edges)||graph.edges.length!==0)return false;
    const empty=graph.edges;
    if(graph.connect('uno','dos')!==true||graph.edges===empty||graph.edges.length!==1)return false;
    const firstEdge=graph.edges[0];
    const oneEdge=graph.edges;
    if(graph.connect('dos','tres')!==true||graph.edges===oneEdge||graph.edges[0]!==firstEdge)return false;
    const beforeLongCycle=graph.edges;
    if(graph.connect('tres','uno')!==false||graph.edges!==beforeLongCycle)return false;
    for(const pair of [['uno','dos'],['uno','uno'],['uno','ausente'],['ausente','dos']]){
      const before=graph.edges;
      if(graph.connect(pair[0],pair[1])!==false||graph.edges!==before)return false;
    }
    if(graph.connect('tres','cuatro')!==true)return false;
    let rejectedWrites=0;
    graph.edges=new Proxy(graph.edges,{set(){rejectedWrites+=1;return false;},deleteProperty(){rejectedWrites+=1;return false;}});
    const protectedEdges=graph.edges;
    if(graph.connect('cuatro','uno')!==false||graph.edges!==protectedEdges||rejectedWrites!==0)return false;
    const initialCount=planner.graph.edges.length;
    if(planner.connect('c','a')!==false||planner.graph.edges.length!==initialCount||!await settle())return false;
    if(!view().includes('Rechazado')||!view().includes('Aristas: '+initialCount))return false;
    planner.graph=new Graph(['x','y']);
    if(planner.connect('x','y')!==true||!await settle())return false;
    return view().includes('Conectado')&&view().includes('Aristas: 1');
  }catch{return false;}
  finally{planner.remove();}
}`);

const safeGraphInvariantTest = browserTest('lit42-safe-graph', 'El motor rechaza cualquier ciclo sin tocar el estado', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('safe-graph');
  const graph=document.querySelector('safe-graph');
  if(!graph||!Array.isArray(graph.edges))return false;
  try{
    const initial=graph.edges;
    if(graph.connect('d','e')!==true||graph.edges===initial||graph.edges.length!==3)return false;
    const accepted=graph.edges;
    if(graph.connect('d','e')!==false||graph.edges!==accepted)return false;
    if(graph.connect('solo','solo')!==false||graph.edges!==accepted)return false;
    if(graph.connect('c','a')!==false||graph.edges!==accepted)return false;
    graph.edges=[{from:'x',to:'y'},{from:'y',to:'z'},{from:'z',to:'w'}];
    let rejectedWrites=0;
    graph.edges=new Proxy(graph.edges,{set(){rejectedWrites+=1;return false;},deleteProperty(){rejectedWrites+=1;return false;}});
    const protectedEdges=graph.edges;
    if(graph.connect('w','x')!==false||graph.edges!==protectedEdges||rejectedWrites!==0)return false;
    if(graph.connect('w','q')!==true||graph.edges===protectedEdges||graph.edges.length!==4)return false;
    const extended=graph.edges;
    return graph.connect('q','x')===false&&graph.edges===extended;
  }catch{return false;}
  finally{graph.remove();}
}`);

const relayEvaluationContractTest = browserTest('lit43-relay-evaluation', 'El motor ordena por dependencias, usa el Bridge y aísla cada snapshot', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('relay-calculator');
  const calculator=document.querySelector('relay-calculator');
  if(!calculator||typeof calculator.run!=='function')return false;
  const view=()=>calculator.renderRoot?.textContent??calculator.textContent??'';
  const settle=()=>Promise.race([Promise.resolve(calculator.updateComplete).then(()=>true,()=>false),new Promise(resolve=>setTimeout(()=>resolve(false),180))]);
  const throwsWithoutPublishing=(graph,implementations,snapshot)=>{
    calculator.graph=graph;calculator.implementations=implementations;
    try{calculator.run();return false;}catch{return calculator.snapshot===snapshot;}
  };
  try{
    const initial=calculator.run();
    if(initial?.outputs?.get('screen')!==50||!await settle()||!view().includes('50'))return false;
    const initialOrder=initial.order;
    if(!Array.isArray(initialOrder)||initialOrder.indexOf('slider')>initialOrder.indexOf('sum')||initialOrder.indexOf('fixed')>initialOrder.indexOf('sum')||initialOrder.indexOf('sum')>initialOrder.indexOf('screen'))return false;

    const calls=[];
    const implementations={
      constant:node=>{calls.push(['constant',node.id]);return node.value;},
      multiply:(node,inputs)=>{calls.push(['multiply',node.id,Object.keys(inputs).sort().join(',')]);return inputs.left*inputs.right;},
      show:(node,inputs)=>{calls.push(['show',node.id,Object.keys(inputs).join(',')]);return inputs.value;},
    };
    const graph={
      nodes:[{id:'screen',kind:'show'},{id:'right',kind:'constant',value:7},{id:'product',kind:'multiply'},{id:'left',kind:'constant',value:6}],
      edges:[{from:'product',to:'screen',port:'value'},{from:'right',to:'product',port:'right'},{from:'left',to:'product',port:'left'}],
    };
    const nodesBefore=graph.nodes.slice();const edgesBefore=graph.edges.slice();
    calculator.graph=graph;calculator.implementations=implementations;
    const first=calculator.run();
    if(first?.outputs?.get('screen')!==42||first.outputs.size!==4||!await settle())return false;
    if(graph.nodes.some((node,index)=>node!==nodesBefore[index])||graph.edges.some((edge,index)=>edge!==edgesBefore[index]))return false;
    const position=id=>first.order.indexOf(id);
    if(position('left')>position('product')||position('right')>position('product')||position('product')>position('screen'))return false;
    if(calls.filter(call=>call[0]==='constant').length!==2||calls.filter(call=>call[0]==='multiply').length!==1||calls.filter(call=>call[0]==='show').length!==1)return false;
    if(!calls.some(call=>call[0]==='multiply'&&call[2]==='left,right')||!view().includes('42')||!view().includes('product'))return false;

    graph.nodes=graph.nodes.map(node=>node.id==='left'?{...node,value:8}:node);
    calls.length=0;
    const second=calculator.run();
    if(second===first||second.outputs===first.outputs||second.order===first.order||second.outputs.get('screen')!==56||first.outputs.get('screen')!==42||!await settle()||!view().includes('56'))return false;

    const stable=calculator.snapshot;
    const constantOnly={constant:implementations.constant};
    if(!throwsWithoutPublishing({nodes:[{id:'a',kind:'constant',value:1},{id:'b',kind:'constant',value:2}],edges:[{from:'a',to:'b',port:'value'},{from:'b',to:'a',port:'value'}]},constantOnly,stable))return false;
    if(!throwsWithoutPublishing({nodes:[{id:'mystery',kind:'missing'}],edges:[]},{},stable))return false;
    if(!throwsWithoutPublishing({nodes:[{id:'a',kind:'constant',value:1}],edges:[{from:'ghost',to:'a',port:'value'}]},constantOnly,stable))return false;
    if(!throwsWithoutPublishing({nodes:[{id:'a',kind:'constant',value:1},{id:'screen',kind:'show'}],edges:[{from:'a',to:'screen'}]},{...constantOnly,show:implementations.show},stable))return false;
    return true;
  }catch{return false;}
  finally{calculator.remove();}
}`);

const formulaDependencyOrderTest = browserTest('lit43-formula-order', 'La fórmula espera dependencias anidadas y publica solo resultados completos', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('formula-view');
  const formula=document.querySelector('formula-view');
  if(!formula||typeof formula.calculate!=='function')return false;
  const view=()=>formula.renderRoot?.textContent??formula.textContent??'';
  const settle=()=>Promise.race([Promise.resolve(formula.updateComplete).then(()=>true,()=>false),new Promise(resolve=>setTimeout(()=>resolve(false),180))]);
  try{
    const initial=formula.calculate();
    if(initial?.get('add')!==5||!await settle()||!view().includes('5'))return false;
    const nodes=[{id:'add',kind:'add',deps:['middle','c']},{id:'c',kind:'number',value:4},{id:'middle',kind:'add',deps:['a','b']},{id:'b',kind:'number',value:3},{id:'a',kind:'number',value:2}];
    const originalOrder=nodes.slice();formula.nodes=nodes;
    const first=formula.calculate();
    if(first?.get('middle')!==5||first.get('add')!==9||formula.values!==first||!await settle()||!view().includes('9'))return false;
    if(nodes.some((node,index)=>node!==originalOrder[index]))return false;
    formula.nodes=[{id:'middle',kind:'add',deps:['a','b']},{id:'add',kind:'add',deps:['middle','c']},{id:'a',kind:'number',value:5},{id:'c',kind:'number',value:4},{id:'b',kind:'number',value:1}];
    const second=formula.calculate();
    if(second===first||second.get('add')!==10||first.get('add')!==9||!await settle()||!view().includes('10'))return false;
    const stable=formula.values;
    formula.nodes=[{id:'add',kind:'add',deps:['middle','b']},{id:'middle',kind:'add',deps:['add','a']},{id:'a',kind:'number',value:1},{id:'b',kind:'number',value:2}];
    try{formula.calculate();return false;}catch{return formula.values===stable&&formula.values.get('add')===10;}
  }catch{return false;}
  finally{formula.remove();}
}`);

const relayDragOwnershipTest = browserTest('lit44-drag-ownership', 'El nodo publica el gesto completo y el tablero conserva la propiedad del estado', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('relay-board');
  const board=document.querySelector('relay-board');
  if(!board)return false;
  const settle=()=>Promise.race([Promise.resolve(board.updateComplete).then(()=>true,()=>false),new Promise(resolve=>setTimeout(()=>resolve(false),180))]);
  const view=()=>board.renderRoot?.textContent??board.textContent??'';
  try{
    if(!await settle())return false;
    const node=board.renderRoot?.querySelector('relay-node');
    if(!node||typeof node.moveTo!=='function'||typeof node.beginPointerDrag!=='function'||!await Promise.resolve(node.updateComplete))return false;
    const observed=[];
    board.addEventListener('node-move',event=>observed.push(event));
    const before=board.nodes;const beforeNode=before[0];
    node.moveTo(24,12,true);
    if(!await settle())return false;
    const first=observed.at(-1);
    if(!first?.bubbles||!first?.composed||first.detail?.nodeId!=='n1'||first.detail?.x!==24||first.detail?.y!==12||first.detail?.live!==true)return false;
    if(board.nodes===before||board.nodes[0]===beforeNode||beforeNode.x!==0||beforeNode.y!==0||board.nodes[0].x!==24||board.nodes[0].y!==12||!view().includes('24, 12'))return false;
    const listeners=new Map();const captures=[];const releases=[];
    const target={setPointerCapture:id=>captures.push(id),releasePointerCapture:id=>releases.push(id),addEventListener:(type,listener)=>listeners.set(type,listener),removeEventListener:(type,listener)=>{if(listeners.get(type)===listener)listeners.delete(type);}};
    node.beginPointerDrag({pointerId:7,clientX:30,clientY:40,currentTarget:target});
    if(captures.join(',')!=='7'||typeof listeners.get('pointermove')!=='function'||typeof listeners.get('pointerup')!=='function'||typeof listeners.get('pointercancel')!=='function')return false;
    const beforeForeign=observed.length;
    listeners.get('pointermove')({pointerId:8,clientX:99,clientY:99});
    if(observed.length!==beforeForeign||board.nodes[0].x!==24||board.nodes[0].y!==12)return false;
    listeners.get('pointermove')({pointerId:7,clientX:31,clientY:42});
    if(observed.at(-1)?.detail?.x!==31||observed.at(-1)?.detail?.y!==42||observed.at(-1)?.detail?.live!==true)return false;
    listeners.get('pointerup')({pointerId:7,clientX:35,clientY:45});
    if(!await settle())return false;
    const final=observed.at(-1);
    if(final?.detail?.x!==35||final?.detail?.y!==45||final?.detail?.live!==false||releases.join(',')!=='7'||listeners.size!==0)return false;
    if(board.nodes[0].x!==35||board.nodes[0].y!==45||!view().includes('35, 45'))return false;
    const stable=board.nodes;const stableNode=stable[0];
    board.applyMove({nodeId:'ausente',x:1,y:2,live:false});
    board.applyMove({nodeId:'n1',x:Number.NaN,y:2,live:false});
    return board.nodes===stable&&board.nodes[0]===stableNode;
  }catch{return false;}
  finally{board.remove();}
}`);

const nodeMoveBoundaryTest = browserTest('lit44-event-boundary', 'El canvas recibe movimientos dinámicos a través de Shadow DOM', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('relay-canvas');
  const canvas=document.querySelector('relay-canvas');
  if(!canvas)return false;
  const settle=()=>Promise.race([Promise.resolve(canvas.updateComplete).then(()=>true,()=>false),new Promise(resolve=>setTimeout(()=>resolve(false),180))]);
  const view=()=>canvas.renderRoot?.textContent??canvas.textContent??'';
  try{
    if(!await settle())return false;
    const node=canvas.renderRoot?.querySelector('broken-node');
    if(!node||typeof node.move!=='function'||!await Promise.resolve(node.updateComplete))return false;
    let observed;
    canvas.addEventListener('node-move',event=>{observed=event;},{once:true});
    node.move(17,9);
    if(!await settle())return false;
    if(!observed?.bubbles||!observed?.composed||observed.detail?.x!==17||observed.detail?.y!==9||canvas.position!=='17, 9'||!view().includes('17, 9'))return false;
    node.move(-4,28);
    if(!await settle())return false;
    return canvas.position==='-4, 28'&&view().includes('-4, 28')&&!view().includes('17, 9');
  }catch{return false;}
  finally{canvas.remove();}
}`);

const relayStudioCapstoneTest = browserTest('lit45-capstone-contract', 'El capstone separa reloj, comandos, validación, undo y ciclo de vida', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('relay-studio');
  const Studio=customElements.get('relay-studio');
  if(typeof Studio!=='function')return false;
  const studio=new Studio();
  const scheduled=[];const cleared=[];
  const fakeClock={setInterval(callback,delay){const token={callback,delay,index:scheduled.length};scheduled.push(token);return token;},clearInterval(token){cleared.push(token);}};
  const clockEntry=Object.entries(studio).find(([,value])=>value&&typeof value.setInterval==='function'&&typeof value.clearInterval==='function');
  if(!clockEntry)return false;
  studio[clockEntry[0]]=fakeClock;
  let inheritedConnects=0;let inheritedDisconnects=0;
  studio.addController?.({hostConnected(){inheritedConnects+=1;},hostDisconnected(){inheritedDisconnects+=1;}});
  const root=()=>studio.renderRoot??studio;
  const view=()=>root().textContent??'';
  const settle=()=>Promise.race([Promise.resolve(studio.updateComplete).then(()=>true,()=>false),new Promise(resolve=>setTimeout(()=>resolve(false),220))]);
  try{
    document.body.append(studio);
    if(!await settle()||studio.output!==50||!view().includes('Salida: 50'))return false;
    if(scheduled.length!==1||scheduled[0].delay<=0||inheritedConnects!==1)return false;
    const originalGraph=studio.graph;const originalEdges=studio.graph.edges;const originalHistory=studio.history;
    scheduled[0].callback();if(!await settle())return false;
    scheduled[0].callback();if(!await settle())return false;
    if(studio.clockValue!==0||studio.graph!==originalGraph||studio.history!==originalHistory||studio.history.length!==0||!view().includes('Reloj: 0'))return false;

    let rejectedWrites=0;
    const guardedEdges=new Proxy(originalEdges,{set(){rejectedWrites+=1;return false;},deleteProperty(){rejectedWrites+=1;return false;}});
    studio.graph={...originalGraph,edges:guardedEdges};
    const guardedGraph=studio.graph;const guardedOutput=studio.output;
    for(const request of [['sum','slider','cycle'],['ausente','screen','value'],['slider','slider','value'],['slider','sum','a']]){
      if(studio.connect(...request)!==false||studio.graph!==guardedGraph||studio.history.length!==0||studio.output!==guardedOutput)return false;
    }
    if(rejectedWrites!==0)return false;
    studio.graph=originalGraph;

    if(studio.connect('slider','screen','preview')!==true||!await settle())return false;
    if(studio.graph===originalGraph||studio.graph.edges===originalEdges||studio.graph.edges.length!==originalEdges.length+1||studio.history.length!==1)return false;
    const snapshot=studio.history[0];
    if(snapshot===originalGraph||snapshot.nodes===originalGraph.nodes||snapshot.edges===originalEdges||snapshot.edges.length!==originalEdges.length)return false;
    if(!view().includes('Comandos: 1'))return false;
    studio.graph={...studio.graph,nodes:studio.graph.nodes.map(node=>node.id==='slider'?{...node,value:8}:node)};
    if(studio.evaluate()!==22||!await settle()||!view().includes('Salida: 22'))return false;
    if(studio.undo()!==true||!await settle())return false;
    const restoredSlider=studio.graph.nodes.find(node=>node.id==='slider');
    if(restoredSlider?.value!==36||studio.graph.edges.length!==originalEdges.length||studio.output!==50||studio.history.length!==0||!view().includes('Salida: 50')||!view().includes('Comandos: 0'))return false;

    studio.remove();
    if(inheritedDisconnects!==1||cleared.length!==1||cleared[0]!==scheduled[0])return false;
    document.body.append(studio);
    if(!await settle()||inheritedConnects!==2||scheduled.length!==2)return false;
    studio.remove();
    return inheritedDisconnects===2&&cleared.length===2&&cleared[1]===scheduled[1];
  }catch{return false;}
  finally{studio.remove();}
}`);

const clockHistoryBoundaryTest = browserTest('lit45-clock-history-boundary', 'Los pulsos cambian la vista sin pasar por el historial humano', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('clock-studio');
  const studio=document.querySelector('clock-studio');
  if(!studio||!Array.isArray(studio.history)||typeof studio.tick!=='function'||typeof studio.commit!=='function')return false;
  const root=()=>studio.renderRoot??studio;
  const view=()=>root().textContent??'';
  const settle=()=>Promise.race([Promise.resolve(studio.updateComplete).then(()=>true,()=>false),new Promise(resolve=>setTimeout(()=>resolve(false),180))]);
  try{
    if(!await settle())return false;
    const originalCommit=studio.commit;
    studio.commit=()=>{throw new Error('tick no debe delegar en commit');};
    const emptyHistory=studio.history;
    studio.tick();if(!await settle())return false;
    if(studio.pulse!==1||studio.history!==emptyHistory||studio.history.length!==0||!view().includes('1'))return false;
    studio.tick();if(!await settle())return false;
    if(studio.pulse!==0||studio.history!==emptyHistory||studio.history.length!==0||!view().includes('0'))return false;
    studio.commit=originalCommit;
    studio.commit(7);if(!await settle())return false;
    if(studio.pulse!==7||studio.history.length!==1||studio.history[0]!==0||!view().includes('7')||!view().includes('1'))return false;
    const humanHistory=studio.history;
    studio.commit=()=>{throw new Error('tick no debe delegar en commit');};
    studio.tick();if(!await settle())return false;
    return studio.pulse===0&&studio.history===humanHistory&&studio.history.length===1&&view().includes('0')&&view().includes('1');
  }catch{return false;}
  finally{studio.remove();}
}`);

export const COMPONENT_SPECS_41_TO_45 = [
  lesson({
    number: 41,
    module: 16,
    title: 'Mixins heredados y composición moderna',
    appName: 'un panel de viewport reutilizable que conserva toda la cadena de ciclo de vida',
    summary: 'Comprende los mixins de clases que encontrarás en proyectos existentes y decide cuándo reemplazarlos por controllers o composición.',
    concepts: [
      { label: 'Class mixin', desc: 'Función que recibe una clase base y devuelve otra clase que la extiende.' },
      { label: 'Cadena de super', desc: 'Secuencia de callbacks heredados que cada capa debe continuar.' },
    ],
    skillsRequired: ['lit-controllers', 'lit-super-callbacks'],
    skillsIntroduced: ['lit-class-mixins', 'mixin-super-chain'],
    reasoningSteps: ['LitElement entra al mixin', 'El mixin añade estado y ciclo', 'ViewportPanel hereda la nueva clase', 'Cada callback llama a super y mantiene la cadena'],
    html: appHtml('Viewport', '<viewport-panel></viewport-panel>'),
    example: `import { LitElement, html } from 'lit';

/** @param {typeof LitElement} Base */
const WithLocale = (Base) =>
  class extends Base {
    static properties = { locale: { type: String } };

    constructor() {
      super();
      this.locale = 'es-CO';
    }

    formatNumber(value) {
      return new Intl.NumberFormat(this.locale).format(value);
    }
  };

class PriceLabel extends WithLocale(LitElement) {
  render() {
    return html\`<p>\${this.formatNumber(1250)}</p>\`;
  }
}

customElements.define('price-label', PriceLabel);`,
    starter: `import { LitElement, html } from 'lit';

/** @param {typeof LitElement} Base */
const WithViewport = (Base) =>
  class extends Base {
    static properties = {};

    constructor() {
      super();
      this.viewportWidth = 0;
      // Conserva un manejador estable para conectar y limpiar.
    }

    connectedCallback() {
      // Continúa la cadena, escucha resize y toma la primera medida.
    }

    disconnectedCallback() {
      // Retira el mismo listener y continúa la cadena.
    }
  };

class ViewportPanel extends WithViewport(LitElement) {
  render() {
    return html\`<p>\${this.viewportWidth} px</p>\`;
  }
}

customElements.define('viewport-panel', ViewportPanel);`,
    challengeTitle: 'App: mixin de viewport sin romper Lit',
    challengeInstructions: 'Completa WithViewport: declara viewportWidth reactivo, conserva un manejador estable, continúa ambos callbacks con super, mide al conectar y redimensionar, y limpia al desconectar. Debe sobrevivir una reconexión.',
    tests: [viewportMixinLifecycleTest],
    hints: ['El mixin devuelve una clase; declara viewportWidth en static properties sin depender del nombre de la clase final.', 'Guarda una función en la instancia que lea window.innerWidth; usa esa misma referencia al añadir y retirar resize.', 'Al conectar: super, listener y primera medida. Al desconectar: retira el listener y continúa la cadena con super.'],
    model: 'Un mixin añade una capa a la cadena de herencia. Esa capa puede ofrecer estado y métodos, pero también hereda la obligación de no cortar los callbacks que LitElement necesita para conectarse, actualizar y limpiar.',
    whenToUse: 'Mantén un mixin cuando debes ampliar varias clases y el contrato heredado ya es estable; prefiere Reactive Controller para lógica con ciclo que no necesita modificar la clase ni participar en super.',
    bestPractices: 'Documenta propiedades y callbacks añadidos, conserva super en cada capa, evita colisiones de nombres y no apiles mixins cuyo orden cambie silenciosamente el resultado.',
    commonErrors: 'confundir mezcla de objetos con class mixin, omitir super, crear listeners anónimos, sobrescribir static properties de otra capa o esconder demasiadas responsabilidades en herencia.',
    transfer: 'Compara un mixin de viewport, un controller de red y una función de formato; decide cuál necesita herencia, ciclo o solo datos.',
    sources: [
      source('Mixins', 'https://lit.dev/docs/composition/mixins/', 'Comprende el patrón de clases y sus límites.', 'Lit'),
      source('Reactive Controllers', 'https://lit.dev/docs/composition/controllers/', 'Compara composición con herencia.', 'Lit'),
      source('super', 'https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/super', 'Revisa la cadena heredada.'),
    ],
    debug: {
      title: 'El mixin corta connectedCallback y Lit deja de actualizar',
      expected: 'presence-card continúa la conexión heredada, vuelve a funcionar tras reconectarse y su vista sigue el estado actual.',
      observed: 'El callback del mixin nunca continúa la clase base.',
      starter: `import { LitElement, html } from 'lit';

/** @param {typeof LitElement} Base */
const WithPresence = (Base) =>
  class extends Base {
    connectedCallback() {
      this.presence = 'Disponible';
    }
  };

class PresenceCard extends WithPresence(LitElement) {
  render() {
    return html\`<p>\${this.presence ?? 'Sin estado'}</p>\`;
  }
}

customElements.define('presence-card', PresenceCard);`,
      tests: [presenceMixinConnectionTest],
      hints: ['PresenceCard todavía depende del ciclo de LitElement.', 'El mixin está entre ambas clases.', 'Continúa el callback antes de añadir el comportamiento de presencia.'],
    },
  }),
  lesson({
    number: 42,
    module: 17,
    title: 'Grafos, dependencias y ciclos antes de la interfaz',
    appName: 'un planificador de dependencias que rechaza ciclos antes de mutar su grafo',
    summary: 'Modela nodos y aristas en JavaScript puro y protege el estado comprobando si una conexión cerraría un ciclo.',
    concepts: [
      { label: 'Grafo dirigido', desc: 'Conjunto de nodos unidos por aristas que tienen dirección.' },
      { label: 'Detección de ciclo', desc: 'Comprobación de si una nueva dependencia crea un camino de regreso.' },
    ],
    skillsRequired: ['professional-capstone', 'integration-evidence'],
    skillsIntroduced: ['relay-graph-model', 'cycle-rejection'],
    reasoningSteps: ['El usuario propone origen → destino', 'El motor busca destino → origen', 'Si existe camino, rechaza sin mutar', 'Si no existe, crea una nueva lista de aristas'],
    html: appHtml('Dependencias', '<dependency-planner></dependency-planner>'),
    example: `function hasRoute(edges, start, target) {
  const pending = [start];
  const visited = new Set();

  while (pending.length > 0) {
    const current = pending.pop();
    if (current === target) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const edge of edges) {
      if (edge.from === current) pending.push(edge.to);
    }
  }
  return false;
}

console.log(hasRoute([{ from: 'datos', to: 'vista' }], 'datos', 'vista'));`,
    starter: `import { LitElement, html } from 'lit';

class RelayGraph {
  constructor(nodeIds) {
    this.nodes = new Set(nodeIds);
    this.edges = [];
  }

  hasPath(from, to) {
    // Recorre las aristas sin quedar atrapado en nodos repetidos.
  }

  canConnect(from, to) {
    // Valida nodos, mismo nodo, duplicados y posible ciclo.
  }

  connect(from, to) {
    // Solo crea una arista nueva cuando el contrato lo permite.
    return false;
  }
}

class DependencyPlanner extends LitElement {
  constructor() {
    super();
    this.graph = new RelayGraph(['a', 'b', 'c']);
    this.graph.connect('a', 'b');
    this.graph.connect('b', 'c');
    this.message = 'Listo';
  }

  connect(from, to) {
    const accepted = this.graph.connect(from, to);
    this.message = accepted ? 'Conectado' : 'Rechazado: ciclo o conexión inválida';
    this.requestUpdate();
    return accepted;
  }

  render() {
    return html\`<p role="status">\${this.message}</p>
      <p>Aristas: \${this.graph.edges.length}</p>\`;
  }
}

customElements.define('dependency-planner', DependencyPlanner);`,
    challengeTitle: 'App: grafo que se protege antes de cambiar',
    challengeInstructions: 'Implementa hasPath, canConnect y connect. El grafo solo acepta ids registrados, rechaza auto-conexiones, duplicados y ciclos de cualquier longitud, y no toca edges cuando rechaza. Al aceptar, crea un array nuevo. El planificador debe mostrar el resultado y el conteo vigentes.',
    tests: [dependencyGraphInvariantTest],
    hints: ['Para saber si from→to cierra un ciclo, investiga si ya existe un camino to→from; no basta con mirar la arista inversa inmediata.', 'Recorre con una pila o cola y un Set visited. canConnect también valida ambos nodos, from === to y duplicados.', 'connect primero decide. Si rechaza, devuelve false sin escribir; si acepta, asigna un array nuevo con la arista y devuelve true.'],
    model: 'El grafo es el estado de dominio; el componente solo publica intención y representa el resultado. Rechazar antes de mutar conserva una invariante: el estado almacenado siempre sigue siendo legal.',
    whenToUse: 'Usa un grafo cuando las relaciones son parte del problema y no existe un único padre lineal; una lista o árbol es más sencillo si cada elemento tiene una sola relación predecible.',
    bestPractices: 'Mantén el motor sin DOM, usa ids estables, separa validación de mutación, devuelve motivos de rechazo y prueba ciclos cortos, largos, duplicados y nodos ausentes.',
    commonErrors: 'calcular por posición visual, mutar y luego intentar deshacer un ciclo, recorrer sin visited, confundir arista dirigida con relación simétrica o devolver NaN ante una entrada incompleta.',
    transfer: 'Modela dependencias de tareas, módulos y celdas de una hoja; explica qué conexión sería ilegal en cada caso.',
    sources: [
      source('Graph data structure', 'https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Map', 'Usa Map y Set como piezas del modelo.'),
      source('Set', 'https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set', 'Controla nodos visitados.'),
    ],
    debug: {
      title: 'El motor inserta la arista y después descubre el ciclo',
      expected: 'safe-graph rechaza duplicados, auto-conexiones y ciclos de cualquier longitud sin tocar edges; una conexión válida crea un array nuevo.',
      observed: 'Conserva la conexión ilegal aunque devuelve false.',
      starter: `class SafeGraph extends HTMLElement {
  constructor() {
    super();
    this.edges = [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
    ];
  }

  connect(from, to) {
    this.edges.push({ from, to });
    const illegal = from === 'c' && to === 'a';
    return !illegal;
  }
}

customElements.define('safe-graph', SafeGraph);`,
      tests: [safeGraphInvariantTest],
      hints: ['El valor de retorno no repara el estado: el camino rechazado termina antes de cualquier escritura.', 'Busca si ya existe una ruta desde el destino hasta el origen; usa visited para ciclos o rutas largas.', 'Rechaza también from === to y duplicados. Solo el camino aceptado reemplaza edges por un array nuevo.'],
    },
  }),
  lesson({
    number: 43,
    module: 17,
    title: 'Orden topológico y evaluadores como Bridge',
    appName: 'un circuito que calcula fuentes y operadores en el orden real de sus dependencias',
    summary: 'Evalúa un grafo acíclico por dependencias y desacopla cada tipo de nodo mediante una tabla de implementaciones.',
    concepts: [
      { label: 'Orden topológico', desc: 'Orden donde cada nodo aparece después de todas sus dependencias.' },
      { label: 'Bridge de evaluadores', desc: 'Tabla que separa el tipo de nodo de la implementación que calcula su salida.' },
    ],
    skillsRequired: ['relay-graph-model', 'cycle-rejection', 'bridge-pattern'],
    skillsIntroduced: ['topological-evaluation', 'relay-evaluator-bridge'],
    reasoningSteps: ['Calcula indegree por nodo', 'Encola fuentes sin entradas', 'Evalúa y libera sus destinos', 'El Bridge elige la función sin cambiar el motor'],
    html: appHtml('Circuito', '<relay-calculator></relay-calculator>'),
    example: `const formatters = {
  text: (value) => String(value),
  percent: (value) => \`\${Math.round(value * 100)}%\`,
};

function present(kind, value, implementations = formatters) {
  const formatter = implementations[kind];
  if (!formatter) throw new Error(\`Sin implementación para \${kind}\`);
  return formatter(value);
}

console.log(present('percent', 0.42));`,
    starter: `import { LitElement, html } from 'lit';

const evaluators = {
  number: (node) => node.value,
  add: (_node, inputs) => inputs.a + inputs.b,
  display: (_node, inputs) => inputs.value,
};

function topologicalOrder(graph) {
  // Devuelve ids: toda dependencia debe aparecer antes que su destino.
  return [];
}

function evaluateGraph(graph, implementations = evaluators) {
  // Recorre el orden, reúne entradas por puerto y calcula outputs por id.
  return { outputs: new Map(), order: [] };
}

class RelayCalculator extends LitElement {
  constructor() {
    super();
    this.graph = {
      nodes: [
        { id: 'slider', kind: 'number', value: 36 },
        { id: 'fixed', kind: 'number', value: 14 },
        { id: 'sum', kind: 'add' },
        { id: 'screen', kind: 'display' },
      ],
      edges: [
        { from: 'slider', to: 'sum', port: 'a' },
        { from: 'fixed', to: 'sum', port: 'b' },
        { from: 'sum', to: 'screen', port: 'value' },
      ],
    };
    this.snapshot = { outputs: new Map(), order: [] };
    this.evaluate = evaluateGraph;
    this.implementations = evaluators;
  }

  run() {
    this.snapshot = this.evaluate(this.graph, this.implementations);
    this.requestUpdate();
    return this.snapshot;
  }

  render() {
    return html\`<button @click=\${() => this.run()}>Evaluar</button>
      <output>\${this.snapshot.outputs.get('screen') ?? '--'}</output>
      <p>Orden: \${this.snapshot.order.join(' → ')}</p>\`;
  }
}

customElements.define('relay-calculator', RelayCalculator);`,
    challengeTitle: 'App: motor de evaluación independiente de Lit',
    challengeInstructions: 'Implementa topologicalOrder y evaluateGraph. Deben respetar dependencias aunque nodes y edges estén desordenados, reunir cada entrada por su port y elegir el evaluador desde la tabla recibida. Cada ejecución devuelve Maps y arrays nuevos; ciclos, aristas desconocidas, puertos ausentes o kinds sin evaluador lanzan un error sin reemplazar el último snapshot válido.',
    tests: [relayEvaluationContractTest],
    hints: ['indegree cuenta entradas pendientes por id. Encola los ceros, libera destinos y, si no procesaste todos los nodos, existe un ciclo.', 'En el orden obtenido, reúne en inputs[edge.port] la salida ya calculada de cada origen. Valida nodos y port antes de usarla.', 'Consulta implementations[node.kind]. Crea outputs y order dentro de cada llamada; lanza un error para contratos incompletos antes de publicar el snapshot.'],
    model: 'El orden topológico responde cuándo puede calcularse un nodo; el Bridge responde cómo se calcula ese tipo. Separar ambas preguntas permite añadir operadores sin reescribir el recorrido del grafo.',
    whenToUse: 'Usa orden topológico para dependencias acíclicas como builds, fórmulas y circuitos; un recorrido lineal basta cuando el orden ya está fijado por el contrato.',
    bestPractices: 'Devuelve order, outputs y errores como snapshot, detecta si quedan nodos sin procesar, nombra puertos faltantes y pasa la tabla de evaluadores como dependencia.',
    commonErrors: 'evaluar de izquierda a derecha, usar la posición del array, mezclar render con cálculo, devolver NaN por puertos ausentes o codificar cada kind dentro de un switch gigante.',
    transfer: 'Añade mentalmente nodos multiply y compare sin modificar topologicalOrder; explica qué función nueva entra al Bridge.',
    sources: [
      source('Map', 'https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Map', 'Conserva outputs por identidad.'),
      source('Design patterns and Lit', 'https://lit.dev/docs/composition/overview/', 'Relaciona composición e implementaciones.', 'Lit'),
    ],
    debug: {
      title: 'El motor calcula según el orden visual del array',
      expected: 'formula-view calcula dependencias anidadas en cualquier orden, reemplaza values solo al terminar y conserva el último resultado válido si el grafo es imposible.',
      observed: 'add se evalúa antes de sus fuentes y produce NaN.',
      starter: `import { LitElement, html } from 'lit';

class FormulaView extends LitElement {
  constructor() {
    super();
    this.nodes = [
      { id: 'add', kind: 'add', deps: ['a', 'b'] },
      { id: 'a', kind: 'number', value: 2 },
      { id: 'b', kind: 'number', value: 3 },
    ];
    this.values = new Map();
  }

  calculate() {
    for (const node of this.nodes) {
      const value =
        node.kind === 'number'
          ? node.value
          : this.values.get(node.deps[0]) + this.values.get(node.deps[1]);
      this.values.set(node.id, value);
    }
    this.requestUpdate();
  }

  render() {
    return html\`<p>\${this.values.get('add') ?? '--'}</p>\`;
  }
}

customElements.define('formula-view', FormulaView);`,
      tests: [formulaDependencyOrderTest],
      hints: ['El primer operador todavía no tiene entradas; conserva pendientes y resultados en colecciones separadas.', 'En cada vuelta evalúa números y operadores cuyas deps ya estén en el Map. Debe soportar más de una capa.', 'Construye un Map local y asígnalo a values solo al completar todo. Si una vuelta no avanza, lanza un error: hay un ciclo o una dependencia ausente.'],
    },
  }),
  lesson({
    number: 44,
    module: 18,
    title: 'Relé visual: eventos públicos y arrastre desacoplado',
    appName: 'un tablero de nodos donde los hijos publican intención y el estudio conserva las posiciones',
    summary: 'Conecta componentes visuales mediante eventos compuestos y encapsula el gesto de arrastre sin trasladar la propiedad del grafo a los nodos.',
    concepts: [
      { label: 'Evento de intención', desc: 'Mensaje que describe lo solicitado sin mutar el estado del dueño.' },
      { label: 'Pointer capture', desc: 'Mecanismo que mantiene el flujo de puntero aunque salga del elemento.' },
    ],
    skillsRequired: ['lit-class-mixins', 'mixin-super-chain', 'relay-evaluator-bridge'],
    skillsIntroduced: ['relay-event-contracts', 'pointer-drag-mixin'],
    reasoningSteps: ['relay-node captura el puntero', 'El mixin calcula la nueva posición', 'node-move cruza Shadow DOM', 'relay-board reemplaza el nodo y vuelve a renderizar'],
    html: appHtml('Tablero Relé', '<relay-board></relay-board>'),
    example: `import { LitElement, html } from 'lit';

class QuantityControl extends LitElement {
  changeBy(delta) {
    this.dispatchEvent(
      new CustomEvent('quantity-change', {
        detail: { delta },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html\`<button @click=\${() => this.changeBy(1)}>Aumentar</button>\`;
  }
}

customElements.define('quantity-control', QuantityControl);`,
    starter: `import { LitElement, html } from 'lit';

/** @param {typeof LitElement} Base */
const MoveIntentMixin = (Base) =>
  class extends Base {
    /** @type {{ id: string, label: string, x: number, y: number }} */
    node = { id: '', label: '', x: 0, y: 0 };

    moveTo(x, y, live = false) {
      // Emite node-move con id, coordenadas, live, bubbles y composed.
      return false;
    }

    beginPointerDrag(event) {
      // Captura este pointerId; publica clientX/clientY en move y al terminar.
      return false;
    }
  };

class RelayNode extends MoveIntentMixin(LitElement) {
  static properties = { node: { attribute: false } };
  render() {
    return html\`<button @pointerdown=\${(event) => this.beginPointerDrag(event)}>
      \${this.node.label}
    </button>\`;
  }
}

class RelayBoard extends LitElement {
  static properties = { nodes: { state: true } };
  constructor() {
    super();
    this.nodes = [{ id: 'n1', label: 'Fuente', x: 0, y: 0 }];
    this.addEventListener('node-move', (event) => this.applyMove(event.detail));
  }

  applyMove(detail) {
    // Valida detail y reemplaza solo el nodo indicado sin mutar el anterior.
    return false;
  }

  render() {
    return html\`\${this.nodes.map(
        (node) => html\`<relay-node .node=\${node}></relay-node>\`,
      )}
      <p>\${this.nodes[0].x}, \${this.nodes[0].y}</p>\`;
  }
}

customElements.define('relay-node', RelayNode);
customElements.define('relay-board', RelayBoard);`,
    challengeTitle: 'App: nodo arrastrable con dueño de estado',
    challengeInstructions: 'Completa moveTo, beginPointerDrag y applyMove. El evento público incluye nodeId, x, y y live; burbujea y cruza Shadow DOM. Captura solo el pointerId iniciado, publica clientX/clientY en cada movimiento (live: true), confirma al soltar (live: false), libera la captura y limpia los tres listeners. El tablero acepta únicamente coordenadas finitas para un nodo existente y reemplaza array y nodo sin alterar snapshots anteriores.',
    tests: [relayDragOwnershipTest],
    hints: ['moveTo emite un CustomEvent nuevo con detail mínimo: nodeId, x, y y live; usa bubbles y composed.', 'Guarda move, finish y cancel como closures del gesto. Ignora otros pointerId; finish publica una última posición, libera la captura y retira pointermove, pointerup y pointercancel.', 'applyMove valida Number.isFinite y que exista nodeId antes de asignar un map con un objeto nuevo para el nodo elegido.'],
    model: 'El nodo conoce el gesto y publica intención; el tablero conoce el grafo y decide la transición. Esta separación permite cambiar ratón por teclado o touch sin duplicar el estado.',
    whenToUse: 'Usa eventos para intención ascendente y propiedades para datos descendentes; un callback directo puede bastar dentro de una sola implementación sin Shadow DOM.',
    bestPractices: 'Define detail mínimo, bubbles/composed intencionales, pointer capture, coordenadas normalizadas, un solo commit al soltar y una alternativa de teclado para mover.',
    commonErrors: 'mutar el nodo recibido, emitir toda la colección, perder pointerup fuera del elemento, guardar cada pixel en undo o usar eventos globales sin dueño.',
    transfer: 'Diseña contratos para conectar puertos, seleccionar cable, borrar nodo y cancelar con Escape sin exponer métodos privados.',
    sources: [
      source('Pointer capture', 'https://developer.mozilla.org/docs/Web/API/Element/setPointerCapture', 'Mantén una secuencia de arrastre.'),
      source('CustomEvent', 'https://developer.mozilla.org/docs/Web/API/CustomEvent', 'Publica intención con detail.'),
      source('Events', 'https://lit.dev/docs/components/events/', 'Integra eventos con templates Lit.', 'Lit'),
    ],
    debug: {
      title: 'node-move queda atrapado dentro del nodo',
      expected: 'relay-canvas observa cualquier posición publicada por su hijo y actualiza la vista.',
      observed: 'El evento no burbujea ni atraviesa Shadow DOM.',
      starter: `import { LitElement, html } from 'lit';

class BrokenNode extends LitElement {
  move(x = 10, y = 5) {
    this.dispatchEvent(new CustomEvent('node-move', { detail: { x, y } }));
  }
  render() {
    return html\`<button @click=\${() => this.move()}>Mover</button>\`;
  }
}

class RelayCanvas extends LitElement {
  constructor() {
    super();
    this.position = '0, 0';
    this.addEventListener('node-move', (event) => {
      this.position = \`\${event.detail.x}, \${event.detail.y}\`;
      this.requestUpdate();
    });
  }
  render() {
    return html\`<broken-node></broken-node>
      <p>\${this.position}</p>\`;
  }
}

customElements.define('broken-node', BrokenNode);
customElements.define('relay-canvas', RelayCanvas);`,
      tests: [nodeMoveBoundaryTest],
      hints: ['El listener vive fuera del shadow root del nodo.', 'Conserva x e y recibidos: la prueba también llama move con valores distintos del ejemplo.', 'bubbles recorre ancestros y composed autoriza cruzar la frontera de Shadow DOM.'],
    },
  }),
  lesson({
    number: 45,
    module: 19,
    title: 'Proyecto Relé: reloj, historial y entrega profesional',
    appName: 'un estudio de circuitos que calcula 50, rechaza ciclos y separa pulsos automáticos del undo humano',
    summary: 'Integra el motor puro y los componentes Lit cuidando que recursos temporales, historial y pruebas representen contratos distintos.',
    concepts: [
      { label: 'Historial de comandos', desc: 'Secuencia de cambios intencionales que el usuario puede deshacer.' },
      { label: 'Estado efímero', desc: 'Dato temporal como un tick que cambia la vista pero no representa un comando humano.' },
    ],
    skillsRequired: ['topological-evaluation', 'relay-evaluator-bridge', 'relay-event-contracts', 'pointer-drag-mixin'],
    skillsIntroduced: ['relay-capstone', 'ephemeral-vs-command-state'],
    reasoningSteps: ['Un comando humano clona y guarda el grafo', 'El motor valida y evalúa', 'El reloj cambia solo su salida efímera', 'disconnectedCallback detiene el intervalo y undo conserva intención'],
    html: appHtml('Estudio Relé', '<relay-studio></relay-studio>'),
    example: `class CommandHistory {
  constructor(initial) {
    this.past = [];
    this.present = structuredClone(initial);
  }

  commit(next) {
    this.past = [...this.past, structuredClone(this.present)];
    this.present = structuredClone(next);
  }

  undo() {
    if (this.past.length === 0) return this.present;
    this.present = this.past.at(-1);
    this.past = this.past.slice(0, -1);
    return structuredClone(this.present);
  }
}

const history = new CommandHistory({ volume: 20 });
history.commit({ volume: 35 });
console.log(history.undo());`,
    supportFiles: {
      'relay-engine.js': `export function evaluateRelay(graph) {
  const indegree = new Map(graph.nodes.map((node) => [node.id, 0]));
  for (const edge of graph.edges) indegree.set(edge.to, indegree.get(edge.to) + 1);
  const pending = graph.nodes
    .filter((node) => indegree.get(node.id) === 0)
    .map((node) => node.id);
  const outputs = new Map();

  while (pending.length > 0) {
    const id = pending.shift();
    const node = graph.nodes.find((candidate) => candidate.id === id);
    const inputs = Object.fromEntries(
      graph.edges
        .filter((edge) => edge.to === id)
        .map((edge) => [edge.port, outputs.get(edge.from)]),
    );
    const value =
      node.kind === 'number'
        ? node.value
        : node.kind === 'add'
          ? inputs.a + inputs.b
          : inputs.value;
    outputs.set(id, value);
    for (const edge of graph.edges.filter((candidate) => candidate.from === id)) {
      indegree.set(edge.to, indegree.get(edge.to) - 1);
      if (indegree.get(edge.to) === 0) pending.push(edge.to);
    }
  }
  return outputs.get('screen');
}`,
    },
    starter: `import { LitElement, html } from 'lit';
import { evaluateRelay } from './relay-engine.js';

class RelayStudio extends LitElement {
  static properties = {
    graph: { state: true },
    clockValue: { state: true },
    output: { state: true },
  };

  constructor() {
    super();
    this.graph = {
      nodes: [
        { id: 'slider', kind: 'number', value: 36 },
        { id: 'fixed', kind: 'number', value: 14 },
        { id: 'sum', kind: 'add' },
        { id: 'screen', kind: 'display' },
      ],
      edges: [
        { from: 'slider', to: 'sum', port: 'a' },
        { from: 'fixed', to: 'sum', port: 'b' },
        { from: 'sum', to: 'screen', port: 'value' },
      ],
    };
    this.history = [];
    this.clockValue = 0;
    this.output = evaluateRelay(this.graph);
    this.intervalHandle = null;
    this.scheduler = {
      setInterval: (callback, delay) => globalThis.setInterval(callback, delay),
      clearInterval: (handle) => globalThis.clearInterval(handle),
    };
  }

  connectedCallback() {
    super.connectedCallback();
    // Inicia un solo reloj mediante scheduler y guarda su handle.
  }

  disconnectedCallback() {
    // Limpia el handle con scheduler y conserva la cadena de Lit.
  }

  hasPath(from, to, edges = this.graph.edges) {
    // Recorre edges desde from y responde si alcanza to.
    return false;
  }

  connect(from, to, port = 'value') {
    // Valida nodos, puerto, duplicado y ciclo antes de mutar.
    return false;
  }

  tickClock() {
    // Alterna 0/1 sin modificar graph ni history.
  }

  evaluate() {
    this.output = evaluateRelay(this.graph);
    this.requestUpdate();
    return this.output;
  }

  undo() {
    // Restaura un clon del último grafo humano y vuelve a evaluar; devuelve boolean.
    return false;
  }

  render() {
    return html\`<p role="status">Salida: \${this.output}</p>
      <p>Reloj: \${this.clockValue}</p>
      <p>Comandos: \${this.history.length}</p>\`;
  }
}

customElements.define('relay-studio', RelayStudio);`,
    challengeTitle: 'Capstone: circuito con tiempo e historial correctos',
    challengeInstructions: 'Termina el capstone completo. El scheduler inyectable debe crear un solo intervalo por conexión y limpiarlo al salir. connect valida nodos, puerto, duplicados y cualquier ciclo antes de publicar un grafo nuevo; guarda un snapshot profundo solo al aceptar. tickClock alterna 0/1 sin tocar graph ni history. undo restaura una copia, reevalúa y responde true; sin historial responde false. La salida, el reloj y el número de comandos deben seguir el estado real.',
    tests: [relayStudioCapstoneTest],
    hints: ['En connectedCallback crea el intervalo solo si el handle es null; en disconnectedCallback límpialo, vuelve a null y llama la cadena de Lit.', 'Para conectar from→to, confirma que ambos IDs existen, que el puerto no esté vacío, que no sea un duplicado y que to no alcance from. Haz toda la validación antes de cambiar graph o history.', 'Guarda structuredClone(graph) como pasado. Publica otro clon con la arista; undo clona el último snapshot, reevalúa y recorta history. El reloj solo alterna clockValue entre 0 y 1 sin tocar graph ni history.'],
    model: 'El historial cuenta decisiones humanas; el reloj cuenta tiempo. Aunque ambos cambian la interfaz, mezclarlos haría que deshacer recorriera pulsos automáticos en vez del último comando que la persona recuerda.',
    whenToUse: 'Separa estado efímero de comandos cuando sensores, relojes, red o animaciones cambian sin representar intención del usuario; una app sin undo puede mantener un modelo más simple.',
    bestPractices: 'Mantén motor puro, snapshots clonados, ticks sin commit, intervalos con cleanup, eventos públicos, pruebas de invariantes y README que explique arquitectura y decisiones.',
    commonErrors: 'guardar cada pointermove o tick, evaluar dentro de render, dejar intervalos vivos, permitir ciclos temporalmente, testear métodos privados o afirmar entrega solo porque se dibujan nodos.',
    transfer: 'Diseña qué entra al historial en editor de texto colaborativo, reproductor y tablero con datos en vivo.',
    sources: [
      source('Lifecycle', 'https://lit.dev/docs/components/lifecycle/', 'Asocia recursos al ciclo del host.', 'Lit'),
      source('structuredClone', 'https://developer.mozilla.org/docs/Web/API/Window/structuredClone', 'Crea snapshots independientes.'),
      source('Testing', 'https://lit.dev/docs/tools/testing/', 'Prueba contratos en navegador.', 'Lit'),
    ],
    debug: {
      title: 'Cada pulso del reloj crea un paso de deshacer',
      expected: 'clock-studio alterna cualquier pulso a 0/1 sin llamar commit ni reemplazar o modificar history; commit sigue registrando las acciones humanas y la vista refleja ambos valores.',
      observed: 'tick llama commit y llena el historial sin acciones humanas.',
      starter: `import { LitElement, html } from 'lit';

class ClockStudio extends LitElement {
  static properties = { pulse: { state: true } };
  constructor() {
    super();
    this.pulse = 0;
    this.history = [];
  }
  commit(value) {
    this.history = [...this.history, this.pulse];
    this.pulse = value;
  }
  tick() {
    this.commit(this.pulse === 0 ? 1 : 0);
  }
  render() {
    return html\`<p>\${this.pulse}</p>
      <p>\${this.history.length}</p>\`;
  }
}

customElements.define('clock-studio', ClockStudio);`,
      tests: [clockHistoryBoundaryTest],
      hints: ['Un pulso no es una orden humana: tick cambia pulse directamente y conserva la misma referencia de history.', 'Alterna con una condición que también funcione después de un valor humano distinto de 0 o 1.', 'Reserva commit para acciones que deban aparecer en undo; su comportamiento sigue formando parte del contrato.'],
    },
  }),
];
