import { COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS } from '../../src/curriculum/web-components-lit/course';
import { reconstructWorkspaceAt } from '../../src/engine/eventLog';
import type { ScrimChallenge } from '../../src/types/scrim';
import { mountRegressions, type RegressionCase } from './regressionRunner';

function activity(number: number, kind: 'class' | 'debug') {
  const id = `componentes-lit-${number}`;
  if (kind === 'class') {
    const lesson = COMPONENT_COURSE_SCRIMS[id];
    const challenge = lesson.challenges[0];
    return { challenge, workspace: reconstructWorkspaceAt(lesson.initialWorkspace, lesson.events, lesson.snapshots, challenge.timestamp).workspace };
  }
  const debug = COMPONENT_COURSE.modules.flatMap(module => module.items).find(item => item.id === `${id}-debug`);
  if (!debug || debug.type !== 'debugging') throw new Error(`Falta ${id}-debug`);
  return {
    challenge: { id: debug.id, title: debug.title, instructions: debug.description, timestamp: 0, tests: debug.tests, hints: [] } satisfies ScrimChallenge,
    workspace: debug.initialWorkspace,
  };
}

const session = activity(17, 'class');
const cart = activity(17, 'debug');
const account = activity(15, 'debug');
const order = activity(16, 'class');
const permission = activity(16, 'debug');
const product = activity(15, 'class');
const chip = activity(18, 'class');
const counter = activity(18, 'debug');
const inventory = activity(19, 'class');
const loading = activity(19, 'debug');
const board = activity(20, 'class');
const notes = activity(20, 'debug');
const profile = activity(21, 'class');
const invite = activity(21, 'debug');
const monitor = { ...activity(22, 'class'), rendered: true };
const clock = activity(22, 'debug');
const filters = activity(23, 'class');
const taxes = activity(23, 'debug');
const focusedSearch = activity(24, 'class');
const searchBox = activity(24, 'debug');
const brand = { ...activity(25, 'debug'), rendered: true };
const theme = { ...activity(25, 'class'), rendered: true };
const panel = { ...activity(26, 'class'), rendered: true };
const report = { ...activity(26, 'debug'), rendered: true };
const editable = activity(27, 'debug');
const tray = activity(27, 'class');
const table = { ...activity(28, 'class'), rendered: true };
const toolbar = { ...activity(28, 'debug'), rendered: true };
const catalog = { ...activity(29, 'class'), rendered: true };
const weather = { ...activity(29, 'debug'), rendered: true };
const network = { ...activity(30, 'class'), rendered: true };
const controlledCounter = activity(30, 'debug');
const libraryButton = activity(31, 'class');
const statusChip = activity(31, 'debug');
const issueApp = activity(32, 'class');
const supportBoard = activity(32, 'debug');
const validationForm = activity(33, 'class');
const liveLabel = activity(33, 'debug');
const noticeStack = activity(34, 'class');
const detailPanel = activity(34, 'debug');
const metricsBoard = activity(35, 'class');
const feedView = activity(35, 'debug');
const paymentPanel = activity(36, 'class');
const shippingCard = activity(36, 'debug');
const museumRoom = activity(37, 'class');
const artCard = activity(37, 'debug');
const weatherDashboard = activity(38, 'class');
const cityBoard = activity(38, 'debug');
const ssrProductCard = activity(39, 'class');
const viewportCard = activity(39, 'debug');
const supportCenter = activity(40, 'class');
const projectBoard = activity(40, 'debug');
const viewportPanel = activity(41, 'class');
const presenceCard = activity(41, 'debug');
const dependencyPlanner = activity(42, 'class');
const safeGraph = activity(42, 'debug');
const relayCalculator = activity(43, 'class');
const formulaView = activity(43, 'debug');
const relayBoard = activity(44, 'class');
const relayCanvas = activity(44, 'debug');
const relayStudio = activity(45, 'class');
const clockStudio = activity(45, 'debug');

const noticeStackProgram = `import {LitElement,html} from 'lit';
class NoticeStack extends LitElement {
  static properties={notices:{state:true}};
  constructor(){super();this.notices=[];this.nextId=1;}
  async add(message){
    const notice={id:'n'+this.nextId++,message};
    this.notices=[...this.notices,notice];
    await this.updateComplete;
    const card=this.renderRoot.querySelector('[data-id="'+notice.id+'"]');
    if(card&&!matchMedia('(prefers-reduced-motion: reduce)').matches)card.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:180});
  }
  remove(id){this.notices=this.notices.filter(notice=>notice.id!==id);}
  render(){return html\`<button @click=\${()=>this.add('Guardado')}>Avisar</button><section aria-live="polite">\${this.notices.map(notice=>html\`<article data-id=\${notice.id}><span>\${notice.message}</span><button @click=\${()=>this.remove(notice.id)}>Cerrar</button></article>\`)}</section>\`;}
}
customElements.define('notice-stack',NoticeStack);`;

const alternateNoticeStackProgram = noticeStackProgram
  .replace("this.nextId=1;", '')
  .replace("id:'n'+this.nextId++", 'id:crypto.randomUUID()')
  .replace('this.renderRoot.querySelector', '(this.shadowRoot||this).querySelector');

const detailPanelProgram = `import {LitElement,html} from 'lit';
class DetailPanel extends LitElement {
  static properties={open:{state:true}};
  constructor(){super();this.open=false;}
  async show(){this.open=true;await this.updateComplete;const card=this.renderRoot.querySelector('article');card?.animate([{opacity:0},{opacity:1}],{duration:150});}
  render(){return this.open?html\`<article>Detalle</article>\`:html\`<button @click=\${()=>this.show()}>Abrir</button>\`;}
}
customElements.define('detail-panel',DetailPanel);`;

const metricsBoardProgram = `import {LitElement,html} from 'lit';
class MetricSource {
  constructor(){this.listeners=new Set();}
  subscribe(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  publish(metric){for(const listener of this.listeners)listener({...metric});}
}
const metrics=new MetricSource();
class MetricsBoard extends LitElement {
  static properties={latest:{state:true}};
  constructor(){super();this.latest=null;this.onMetric=metric=>{this.latest=metric;};}
  connectedCallback(){super.connectedCallback();this.stop?.();this.stop=metrics.subscribe(this.onMetric);}
  disconnectedCallback(){this.stop?.();this.stop=undefined;super.disconnectedCallback();}
  render(){return html\`<button @click=\${()=>metrics.publish({name:'latencia',value:42})}>Medir</button><p>\${this.latest?this.latest.name+': '+this.latest.value:'Sin mediciones'}</p>\`;}
}
customElements.define('metrics-board',MetricsBoard);`;

const feedViewProgram = `import {LitElement,html} from 'lit';
const feed=new EventTarget();
class FeedView extends LitElement {
  constructor(){super();this.feed=feed;this.onMessage=event=>{this.message=event.detail;this.requestUpdate();};}
  connectedCallback(){super.connectedCallback();this.feed.addEventListener('message',this.onMessage);}
  disconnectedCallback(){this.feed.removeEventListener('message',this.onMessage);super.disconnectedCallback();}
  render(){return html\`<p>\${this.message??'Vacío'}</p>\`;}
}
customElements.define('feed-view',FeedView);`;

const feedViewObjectProgram = feedViewProgram
  .replace("this.onMessage=event=>{this.message=event.detail;this.requestUpdate();};", "this.listener={handleEvent:event=>{this.message=event.detail;this.requestUpdate();}};")
  .replaceAll('this.onMessage', 'this.listener');

const paymentPanelProgram = `import {LitElement,html} from 'lit';
class PaymentAdapter {
  constructor(provider){this.provider=provider;}
  async charge(amount){
    const cents=Number(amount);
    if(!Number.isFinite(cents)||cents<=0)return {success:false,message:'Monto inválido',id:null};
    try{
      const raw=await this.provider.pay(cents);
      return {success:Boolean(raw.ok),message:String(raw.note??(raw.ok?'Pago aprobado':'Pago rechazado')),id:raw.transaction??null};
    }catch{return {success:false,message:'No se pudo procesar el pago',id:null};}
  }
}
const demoProvider={pay:async cents=>({ok:true,transaction:'tx-1',note:cents+' centavos'})};
class PaymentPanel extends LitElement {
  static properties={result:{state:true},pending:{state:true}};
  constructor(){super();this.service=new PaymentAdapter(demoProvider);this.result=null;this.pending=false;}
  async submit(amount){this.pending=true;this.result=null;try{this.result=await this.service.charge(amount);}finally{this.pending=false;}}
  render(){return html\`<button ?disabled=\${this.pending} @click=\${()=>this.submit(1250)}>Pagar</button><p role="status">\${this.pending?'Procesando':(this.result?.message??'Sin pago')}</p>\`;}
}
customElements.define('payment-panel',PaymentPanel);`;

const alternatePaymentPanelProgram = paymentPanelProgram
  .replaceAll('PaymentAdapter', 'GatewayBridge')
  .replaceAll('this.provider', 'this.client')
  .replaceAll('demoProvider', 'sandboxGateway');

const shippingCardProgram = `import {LitElement,html} from 'lit';
const provider={quote:async()=>({total_cents:950,currency_code:'USD'})};
class ShippingAdapter {
  constructor(provider){this.provider=provider;}
  async quote(){const raw=await this.provider.quote();return {cost:Number(raw.total_cents)/100,currency:String(raw.currency_code)};}
}
class ShippingCard extends LitElement {
  constructor(){super();this.service=new ShippingAdapter(provider);this.result=null;}
  async load(){this.result=await this.service.quote();this.requestUpdate();}
  render(){return html\`<button @click=\${()=>this.load()}>Cotizar</button><p>\${this.result?this.result.cost+' '+this.result.currency:'--'}</p>\`;}
}
customElements.define('shipping-card',ShippingCard);`;

const shippingFactoryProgram = shippingCardProgram
  .replace("class ShippingAdapter {\n  constructor(provider){this.provider=provider;}\n  async quote(){const raw=await this.provider.quote();return {cost:Number(raw.total_cents)/100,currency:String(raw.currency_code)};}\n}", "const shippingPort=provider=>({quote:async()=>{const raw=await provider.quote();return {cost:Number(raw.total_cents)/100,currency:String(raw.currency_code)};}});")
  .replace('new ShippingAdapter(provider)', 'shippingPort(provider)');

const viewportPanelProgram = `import {LitElement,html} from 'lit';
/** @param {typeof LitElement} Base */
const WithViewport=Base=>class extends Base{
  static properties={viewportWidth:{state:true}};
  constructor(){super();this.viewportWidth=0;this.measureViewport=()=>{this.viewportWidth=window.innerWidth;};}
  connectedCallback(){super.connectedCallback();window.addEventListener('resize',this.measureViewport);this.measureViewport();}
  disconnectedCallback(){window.removeEventListener('resize',this.measureViewport);super.disconnectedCallback();}
};
class ViewportPanel extends WithViewport(LitElement){render(){return html\`<p>\${this.viewportWidth} px</p>\`;}}
customElements.define('viewport-panel',ViewportPanel);`;

const viewportPanelAliasesProgram = viewportPanelProgram
  .replaceAll('measureViewport', 'syncLayout')
  .replaceAll('viewportWidth', 'viewportWidth');

const presenceCardProgram = `import {LitElement,html} from 'lit';
/** @param {typeof LitElement} Base */
const WithPresence=Base=>class extends Base{
  connectedCallback(){super.connectedCallback();this.presence='Disponible';}
};
class PresenceCard extends WithPresence(LitElement){render(){return html\`<p>\${this.presence??'Sin estado'}</p>\`;}}
customElements.define('presence-card',PresenceCard);`;

const dependencyPlannerProgram = `import {LitElement,html} from 'lit';
class RelayGraph{
  constructor(nodeIds){this.nodes=new Set(nodeIds);this.edges=[];}
  hasPath(from,to){
    const pending=[from];
    const visited=new Set();
    while(pending.length){
      const current=pending.pop();
      if(current===to)return true;
      if(visited.has(current))continue;
      visited.add(current);
      for(const edge of this.edges)if(edge.from===current)pending.push(edge.to);
    }
    return false;
  }
  canConnect(from,to){
    if(!this.nodes.has(from)||!this.nodes.has(to)||from===to)return false;
    if(this.edges.some(edge=>edge.from===from&&edge.to===to))return false;
    return !this.hasPath(to,from);
  }
  connect(from,to){
    if(!this.canConnect(from,to))return false;
    this.edges=[...this.edges,{from,to}];
    return true;
  }
}
class DependencyPlanner extends LitElement{
  constructor(){super();this.graph=new RelayGraph(['a','b','c']);this.graph.connect('a','b');this.graph.connect('b','c');this.message='Listo';}
  connect(from,to){const accepted=this.graph.connect(from,to);this.message=accepted?'Conectado':'Rechazado: ciclo o conexión inválida';this.requestUpdate();return accepted;}
  render(){return html\`<p role="status">\${this.message}</p><p>Aristas: \${this.graph.edges.length}</p>\`;}
}
customElements.define('dependency-planner',DependencyPlanner);`;

const dependencyPlannerAliasesProgram = dependencyPlannerProgram
  .replaceAll('RelayGraph', 'RouteNetwork')
  .replaceAll('hasPath', 'reaches')
  .replaceAll('canConnect', 'allows');

const safeGraphProgram = `class SafeGraph extends HTMLElement{
  constructor(){super();this.edges=[{from:'a',to:'b'},{from:'b',to:'c'}];}
  hasPath(from,to){
    const pending=[from];
    const visited=new Set();
    while(pending.length){
      const current=pending.pop();
      if(current===to)return true;
      if(visited.has(current))continue;
      visited.add(current);
      for(const edge of this.edges)if(edge.from===current)pending.push(edge.to);
    }
    return false;
  }
  connect(from,to){
    if(from===to||this.edges.some(edge=>edge.from===from&&edge.to===to)||this.hasPath(to,from))return false;
    this.edges=[...this.edges,{from,to}];
    return true;
  }
}
customElements.define('safe-graph',SafeGraph);`;

const relayCalculatorProgram = `import {LitElement,html} from 'lit';
const evaluators={number:node=>node.value,add:(_node,inputs)=>inputs.a+inputs.b,display:(_node,inputs)=>inputs.value};
function topologicalOrder(graph){
  const indegree=new Map(graph.nodes.map(node=>[node.id,0]));
  for(const edge of graph.edges){
    if(!indegree.has(edge.from)||!indegree.has(edge.to))throw new Error('Arista desconocida');
    indegree.set(edge.to,indegree.get(edge.to)+1);
  }
  const pending=graph.nodes.filter(node=>indegree.get(node.id)===0).map(node=>node.id);
  const order=[];
  while(pending.length){
    const id=pending.shift();order.push(id);
    for(const edge of graph.edges.filter(edge=>edge.from===id)){
      const next=indegree.get(edge.to)-1;indegree.set(edge.to,next);if(next===0)pending.push(edge.to);
    }
  }
  if(order.length!==graph.nodes.length)throw new Error('El grafo contiene un ciclo');
  return order;
}
function evaluateGraph(graph,implementations=evaluators){
  const order=topologicalOrder(graph);
  const nodes=new Map(graph.nodes.map(node=>[node.id,node]));
  const outputs=new Map();
  for(const id of order){
    const node=nodes.get(id);const evaluate=implementations[node.kind];
    if(typeof evaluate!=='function')throw new Error('Sin evaluador');
    const inputs={};
    for(const edge of graph.edges.filter(edge=>edge.to===id)){
      if(!outputs.has(edge.from)||!edge.port)throw new Error('Entrada incompleta');
      inputs[edge.port]=outputs.get(edge.from);
    }
    outputs.set(id,evaluate(node,inputs));
  }
  return {outputs,order};
}
class RelayCalculator extends LitElement{
  constructor(){
    super();
    this.graph={nodes:[{id:'slider',kind:'number',value:36},{id:'fixed',kind:'number',value:14},{id:'sum',kind:'add'},{id:'screen',kind:'display'}],edges:[{from:'slider',to:'sum',port:'a'},{from:'fixed',to:'sum',port:'b'},{from:'sum',to:'screen',port:'value'}]};
    this.snapshot={outputs:new Map(),order:[]};this.evaluate=evaluateGraph;this.implementations=evaluators;
  }
  run(){this.snapshot=this.evaluate(this.graph,this.implementations);this.requestUpdate();return this.snapshot;}
  render(){return html\`<button @click=\${()=>this.run()}>Evaluar</button><output>\${this.snapshot.outputs.get('screen')??'--'}</output><p>Orden: \${this.snapshot.order.join(' → ')}</p>\`;}
}
customElements.define('relay-calculator',RelayCalculator);`;

const relayCalculatorAliasesProgram = relayCalculatorProgram
  .replaceAll('topologicalOrder', 'scheduleNodes')
  .replaceAll('evaluateGraph', 'runNetwork')
  .replaceAll('indegree', 'incoming');

const formulaViewProgram = `import {LitElement,html} from 'lit';
class FormulaView extends LitElement{
  constructor(){super();this.nodes=[{id:'add',kind:'add',deps:['a','b']},{id:'a',kind:'number',value:2},{id:'b',kind:'number',value:3}];this.values=new Map();}
  calculate(){
    const nodes=new Map(this.nodes.map(node=>[node.id,node]));
    const pending=new Set(nodes.keys());
    const values=new Map();
    while(pending.size){
      let progressed=false;
      for(const id of [...pending]){
        const node=nodes.get(id);
        if(node.kind==='number'){values.set(id,node.value);pending.delete(id);progressed=true;continue;}
        if(node.deps.every(dep=>values.has(dep))){values.set(id,values.get(node.deps[0])+values.get(node.deps[1]));pending.delete(id);progressed=true;}
      }
      if(!progressed)throw new Error('Dependencias imposibles');
    }
    this.values=values;this.requestUpdate();return values;
  }
  render(){return html\`<p>\${this.values.get('add')??'--'}</p>\`;}
}
customElements.define('formula-view',FormulaView);`;

const formulaViewQueueProgram = formulaViewProgram.replace(/  calculate\(\)\{[\s\S]*?\n  \}\n  render/, `  calculate(){
    const pending=[...this.nodes];const values=new Map();let deferred=0;
    while(pending.length){
      const node=pending.shift();
      if(node.kind==='number'){values.set(node.id,node.value);deferred=0;continue;}
      if(node.deps.every(dep=>values.has(dep))){values.set(node.id,values.get(node.deps[0])+values.get(node.deps[1]));deferred=0;continue;}
      pending.push(node);deferred+=1;if(deferred>pending.length)throw new Error('Dependencias imposibles');
    }
    this.values=values;this.requestUpdate();return values;
  }
  render`);

const relayBoardProgram = `import {LitElement,html} from 'lit';
/** @param {typeof LitElement} Base */
const MoveIntentMixin=Base=>class extends Base{
  /** @type {{id:string,label:string,x:number,y:number}} */ node={id:'',label:'',x:0,y:0};
  moveTo(x,y,live=false){return this.dispatchEvent(new CustomEvent('node-move',{detail:{nodeId:this.node.id,x,y,live},bubbles:true,composed:true}));}
  beginPointerDrag(event){
    const target=/** @type {HTMLElement} */(event.currentTarget);const pointerId=event.pointerId;
    const cleanup=()=>{target.removeEventListener('pointermove',move);target.removeEventListener('pointerup',finish);target.removeEventListener('pointercancel',cancel);target.releasePointerCapture(pointerId);};
    const move=next=>{if(next.pointerId===pointerId)this.moveTo(next.clientX,next.clientY,true);};
    const finish=next=>{if(next.pointerId!==pointerId)return;this.moveTo(next.clientX,next.clientY,false);cleanup();};
    const cancel=next=>{if(next.pointerId===pointerId)cleanup();};
    target.setPointerCapture(pointerId);target.addEventListener('pointermove',move);target.addEventListener('pointerup',finish);target.addEventListener('pointercancel',cancel);
  }
};
class RelayNode extends MoveIntentMixin(LitElement){static properties={node:{attribute:false}};render(){return html\`<button @pointerdown=\${event=>this.beginPointerDrag(event)}>\${this.node.label}</button>\`;}}
class RelayBoard extends LitElement{
  static properties={nodes:{state:true}};
  constructor(){super();this.nodes=[{id:'n1',label:'Fuente',x:0,y:0}];this.addEventListener('node-move',event=>this.applyMove(event.detail));}
  applyMove(detail){if(!detail||!Number.isFinite(detail.x)||!Number.isFinite(detail.y)||!this.nodes.some(node=>node.id===detail.nodeId))return false;this.nodes=this.nodes.map(node=>node.id===detail.nodeId?{...node,x:detail.x,y:detail.y}:node);return true;}
  render(){return html\`\${this.nodes.map(node=>html\`<relay-node .node=\${node}></relay-node>\`)}<p>\${this.nodes[0].x}, \${this.nodes[0].y}</p>\`;}
}
customElements.define('relay-node',RelayNode);customElements.define('relay-board',RelayBoard);`;

const relayBoardAliasesProgram = relayBoardProgram
  .replaceAll('MoveIntentMixin','WithPointerIntent');

const relayCanvasProgram = `import {LitElement,html} from 'lit';
class BrokenNode extends LitElement{
  move(x=10,y=5){this.dispatchEvent(new CustomEvent('node-move',{detail:{x,y},bubbles:true,composed:true}));}
  render(){return html\`<button @click=\${()=>this.move()}>Mover</button>\`;}
}
class RelayCanvas extends LitElement{
  constructor(){super();this.position='0, 0';this.addEventListener('node-move',event=>{this.position=\`\${event.detail.x}, \${event.detail.y}\`;this.requestUpdate();});}
  render(){return html\`<broken-node></broken-node><p>\${this.position}</p>\`;}
}
customElements.define('broken-node',BrokenNode);customElements.define('relay-canvas',RelayCanvas);`;

const relayStudioProgram = `import {LitElement,html} from 'lit';
import {evaluateRelay} from './relay-engine.js';
class RelayStudio extends LitElement{
  static properties={graph:{state:true},clockValue:{state:true},output:{state:true}};
  constructor(){
    super();
    this.graph={nodes:[{id:'slider',kind:'number',value:36},{id:'fixed',kind:'number',value:14},{id:'sum',kind:'add'},{id:'screen',kind:'display'}],edges:[{from:'slider',to:'sum',port:'a'},{from:'fixed',to:'sum',port:'b'},{from:'sum',to:'screen',port:'value'}]};
    this.history=[];this.clockValue=0;this.output=evaluateRelay(this.graph);this.intervalHandle=null;
    this.scheduler={setInterval:(callback,delay)=>globalThis.setInterval(callback,delay),clearInterval:handle=>globalThis.clearInterval(handle)};
  }
  connectedCallback(){super.connectedCallback();if(this.intervalHandle===null)this.intervalHandle=this.scheduler.setInterval(()=>this.tickClock(),1000);}
  disconnectedCallback(){if(this.intervalHandle!==null){this.scheduler.clearInterval(this.intervalHandle);this.intervalHandle=null;}super.disconnectedCallback();}
  hasPath(from,to,edges=this.graph.edges){
    const pending=[from];const visited=new Set();
    while(pending.length){const current=pending.pop();if(current===to)return true;if(visited.has(current))continue;visited.add(current);for(const edge of edges)if(edge.from===current)pending.push(edge.to);}
    return false;
  }
  connect(from,to,port='value'){
    const ids=new Set(this.graph.nodes.map(node=>node.id));
    if(!ids.has(from)||!ids.has(to)||from===to||!port||this.graph.edges.some(edge=>edge.from===from&&edge.to===to&&edge.port===port)||this.hasPath(to,from))return false;
    const previous=structuredClone(this.graph);const candidate=structuredClone(this.graph);candidate.edges=[...candidate.edges,{from,to,port}];
    let output;try{output=evaluateRelay(candidate);}catch{return false;}
    this.history=[...this.history,previous];this.graph=candidate;this.output=output;return true;
  }
  tickClock(){this.clockValue=this.clockValue===0?1:0;}
  evaluate(){this.output=evaluateRelay(this.graph);return this.output;}
  undo(){if(this.history.length===0)return false;const next=structuredClone(this.history.at(-1));const output=evaluateRelay(next);this.history=this.history.slice(0,-1);this.graph=next;this.output=output;return true;}
  render(){return html\`<p role="status">Salida: \${this.output}</p><p>Reloj: \${this.clockValue}</p><p>Comandos: \${this.history.length}</p>\`;}
}
customElements.define('relay-studio',RelayStudio);`;

const relayStudioAliasesProgram = relayStudioProgram
  .replaceAll('hasPath','reaches')
  .replaceAll('intervalHandle','timerToken')
  .replaceAll('scheduler','clockPort');

const clockStudioProgram = `import {LitElement,html} from 'lit';
class ClockStudio extends LitElement{
  static properties={pulse:{state:true},history:{state:true}};
  constructor(){super();this.pulse=0;this.history=[];}
  commit(value){this.history=[...this.history,this.pulse];this.pulse=value;}
  tick(){this.pulse=this.pulse===0?1:0;}
  render(){return html\`<p>Pulso: \${this.pulse}</p><p>Comandos: \${this.history.length}</p>\`;}
}
customElements.define('clock-studio',ClockStudio);`;

const museumRoomProgram = `import {LitElement,html} from 'lit';
import {Task} from '@lit/task';
class MuseumService {
  constructor(client){this.client=client;}
  async search(query,{signal}={}){
    const response=await this.client(query,{signal});
    const rows=Array.isArray(response?.items)?response.items:[];
    return rows.map(row=>({
      id:String(row.objectID),
      title:String(row.title||'').trim()||'Sin título',
      artist:String(row.artistDisplayName||'').trim()||'Autor desconocido',
      year:String(row.objectDate||'').trim()||'Fecha desconocida',
      imageUrl:String(row.primaryImageSmall||''),
    }));
  }
}
const fixtureClient=async query=>query?{items:[{objectID:7,title:'Jardín',artistDisplayName:'Ana',objectDate:'1920',primaryImageSmall:''}]}:{items:[]};
class MuseumRoom extends LitElement {
  static properties={query:{state:true},favorites:{state:true}};
  constructor(){
    super();this.query='jardín';this.favorites=[];this.service=new MuseumService(fixtureClient);
    this.searchTask=new Task(this,{task:([query],options)=>this.service.search(query,options),args:()=>[this.query]});
  }
  search(event){event.preventDefault();const data=new FormData(event.currentTarget);this.query=String(data.get('query')??'').trim();}
  toggleFavorite(id){this.favorites=this.favorites.includes(id)?this.favorites.filter(value=>value!==id):[...this.favorites,id];}
  renderArt(art){const favorite=this.favorites.includes(art.id);return html\`<article data-id=\${art.id}><h2>\${art.title}</h2><p>\${art.artist} · \${art.year}</p>\${art.imageUrl?html\`<img src=\${art.imageUrl} alt=\${art.title}>\`:html\`<p>Imagen no disponible</p>\`}<button aria-pressed=\${favorite} @click=\${()=>this.toggleFavorite(art.id)}>\${favorite?'Quitar de favoritos':'Añadir a favoritos'}</button></article>\`;}
  render(){return html\`<form @submit=\${event=>this.search(event)}><label>Buscar obras <input name="query" .value=\${this.query}></label><button>Buscar</button></form>\${this.searchTask.render({pending:()=>html\`<p>Cargando</p>\`,complete:arts=>arts.length?html\`<section>\${arts.map(art=>this.renderArt(art))}</section>\`:html\`<p>Sin obras</p>\`,error:()=>html\`<p>No se pudo cargar</p>\`})}\`;}
}
customElements.define('museum-room',MuseumRoom);`;

const museumAliasesProgram = museumRoomProgram
  .replaceAll('MuseumService', 'GalleryPort')
  .replaceAll('renderArt', 'artTemplate');

const artCardProgram = `import {LitElement,html} from 'lit';
class ArtCard extends LitElement {
  static properties={art:{attribute:false}};
  constructor(){super();this.art=null;}
  render(){
    const title=String(this.art?.title||'').trim()||'Sin título';
    const imageUrl=String(this.art?.imageUrl||'');
    return html\`<article>\${imageUrl?html\`<img src=\${imageUrl} alt=\${title}>\`:html\`<p>Imagen no disponible</p>\`}<h2>\${title}</h2></article>\`;
  }
}
customElements.define('art-card',ArtCard);`;

const weatherDashboardProgram = `import {LitElement,html} from 'lit';
class WeatherService {
  constructor(client){this.client=client;}
  async current(city,unit){
    const raw=await this.client(city);
    const celsius=Number(raw.tempC);
    return {id:String(city),city:String(raw.name||city),temperature:unit==='F'?(celsius*9/5)+32:celsius,unit,condition:String(raw.condition||'Sin dato')};
  }
}
const fixture=async city=>{if(city==='Error')throw new Error('No disponible');return {name:city,tempC:20,condition:'Claro'};};
class WeatherDashboard extends LitElement {
  static properties={cities:{state:true},results:{state:true},unit:{state:true}};
  constructor(){super();this.cities=['Bogotá','Error','Lima'];this.results=[];this.unit='C';this.service=new WeatherService(fixture);}
  async refresh(){
    const cities=[...this.cities],unit=this.unit;
    const settled=await Promise.allSettled(cities.map(city=>this.service.current(city,unit)));
    this.results=settled.map((result,index)=>result.status==='fulfilled'?{...result.value,status:'ready'}:{id:String(cities[index]),city:String(cities[index]),status:'error'});
  }
  render(){return html\`<label>Unidad <select .value=\${this.unit} @change=\${event=>this.unit=event.target.value}><option value="C">C</option><option value="F">F</option></select></label><button @click=\${()=>this.refresh()}>Actualizar</button><section>\${this.results.map(row=>html\`<article data-id=\${row.id}>\${row.status==='ready'?html\`<strong>\${row.city}</strong><span>\${row.temperature} °\${row.unit}</span><span>\${row.condition}</span>\`:html\`<strong>\${row.city}</strong><span>No disponible</span>\`}</article>\`)}</section>\`;}
}
customElements.define('weather-dashboard',WeatherDashboard);`;

const weatherAliasesProgram = weatherDashboardProgram
  .replaceAll('WeatherService', 'ForecastPort')
  .replaceAll('settled', 'outcomes');

const cityBoardProgram = `import {LitElement,html} from 'lit';
class CityBoard extends LitElement {
  constructor(){super();this.loaders=[()=>Promise.resolve('Bogotá'),()=>Promise.reject(new Error('fallo'))];this.rows=[];}
  async load(){const outcomes=await Promise.allSettled(this.loaders.map(loader=>loader()));this.rows=outcomes.map((outcome,index)=>outcome.status==='fulfilled'?{id:String(index),status:'ready',city:outcome.value}:{id:String(index),status:'error'});this.requestUpdate();}
  render(){return html\`<section>\${this.rows.map(row=>html\`<p data-id=\${row.id}>\${row.status==='ready'?row.city:'No disponible'}</p>\`)}</section>\`;}
}
customElements.define('city-board',CityBoard);`;

const ssrProductCardProgram = `import {LitElement,html} from 'lit';
class SsrProductCard extends LitElement {
  static properties={name:{type:String},price:{type:Number},saved:{state:true}};
  constructor(){super();this.name='';this.price=0;this.saved=false;this.clientEnvironment=null;this.onRefresh=()=>this.requestUpdate();}
  connectClient(environment){
    this.disconnectClient();
    if(!environment?.addEventListener)return false;
    this.clientEnvironment=environment;
    environment.addEventListener('product-refresh',this.onRefresh);
    return true;
  }
  disconnectClient(){this.clientEnvironment?.removeEventListener?.('product-refresh',this.onRefresh);this.clientEnvironment=null;}
  connectedCallback(){super.connectedCallback();this.connectClient(typeof window==='undefined'?undefined:window);}
  disconnectedCallback(){this.disconnectClient();super.disconnectedCallback();}
  toggleSaved(){this.saved=!this.saved;}
  render(){return html\`<article><h2>\${this.name||'Producto'}</h2><p>Precio: \${this.price}</p><button aria-pressed=\${this.saved} @click=\${()=>this.toggleSaved()}>\${this.saved?'Guardado':'Guardar'}</button></article>\`;}
}
customElements.define('ssr-product-card',SsrProductCard);`;

const ssrAliasesProgram = ssrProductCardProgram
  .replaceAll('clientEnvironment', 'platform')
  .replaceAll('onRefresh', 'refreshListener');

const viewportCardProgram = `import {LitElement,html} from 'lit';
class ViewportCard extends LitElement {
  static properties={width:{state:true}};
  constructor(){super();this.width=0;this.environment=null;this.onResize=()=>{this.width=this.readWidth(this.environment);};}
  readWidth(environment){const value=Number(environment?.innerWidth);return Number.isFinite(value)&&value>=0?value:0;}
  start(environment){this.stop();this.environment=environment??null;this.width=this.readWidth(this.environment);this.environment?.addEventListener?.('resize',this.onResize);}
  stop(){this.environment?.removeEventListener?.('resize',this.onResize);this.environment=null;}
  connectedCallback(){super.connectedCallback();this.start(typeof window==='undefined'?undefined:window);}
  disconnectedCallback(){this.stop();super.disconnectedCallback();}
  render(){return html\`<p aria-live="polite">Ancho: \${this.width}</p>\`;}
}
customElements.define('viewport-card',ViewportCard);`;

const supportCenterProgram = `import {LitElement,html} from 'lit';
class TicketService {
  constructor(storage){this.storage=storage;}
  async load(){const rows=await this.storage.load();return (Array.isArray(rows)?rows:[]).map(row=>({id:String(row.ticket_id),title:String(row.title||'').trim()||'Sin título',priority:Number(row.priority),status:row.state==='closed'?'closed':'open'}));}
  async save(tickets){const snapshot=tickets.map(ticket=>({...ticket}));await this.storage.save(snapshot);}
}
const demoStorage={load:async()=>[],save:async()=>{}};
class SupportCenter extends LitElement {
  static properties={tickets:{state:true},filter:{state:true},status:{state:true}};
  constructor(){super();this.tickets=[];this.filter='all';this.status='idle';this.service=new TicketService(demoStorage);}
  async connectedCallback(){super.connectedCallback();await this.load();}
  async load(){this.status='loading';try{this.tickets=await this.service.load();this.status=this.tickets.length?'ready':'empty';return true;}catch{this.tickets=[];this.status='error';return false;}}
  async createTicket(title,priority){
    const clean=String(title??'').trim(),level=Number(priority);
    if(!clean||!Number.isInteger(level)||level<1||level>3)return false;
    const next=[...this.tickets,{id:crypto.randomUUID(),title:clean,priority:level,status:'open'}];
    this.status='saving';try{await this.service.save(next);this.tickets=next;this.status='ready';return true;}catch{this.status='error';return false;}
  }
  async closeTicket(id){
    if(!this.tickets.some(ticket=>ticket.id===id))return false;
    const next=this.tickets.map(ticket=>ticket.id===id?{...ticket,status:'closed'}:ticket);
    this.status='saving';try{await this.service.save(next);this.tickets=next;this.status='ready';return true;}catch{this.status='error';return false;}
  }
  get visibleTickets(){return this.filter==='all'?this.tickets:this.tickets.filter(ticket=>ticket.status===this.filter);}
  submit(event){event.preventDefault();const data=new FormData(event.currentTarget);void this.createTicket(data.get('title'),data.get('priority'));}
  render(){const message={idle:'Sin cargar',loading:'Cargando',saving:'Guardando',empty:'Sin tickets',ready:this.tickets.length+' tickets',error:'No se pudo completar'}[this.status];return html\`<form @submit=\${event=>this.submit(event)}><label>Título <input name="title"></label><label>Prioridad <select name="priority"><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></label><button ?disabled=\${this.status==='saving'}>Crear</button></form><label>Filtro <select .value=\${this.filter} @change=\${event=>this.filter=event.target.value}><option value="all">Todos</option><option value="open">Abiertos</option><option value="closed">Cerrados</option></select></label><p role="status">\${message}</p>\${this.visibleTickets.length?html\`<ul>\${this.visibleTickets.map(ticket=>html\`<li data-id=\${ticket.id}><strong>\${ticket.title}</strong><span>Prioridad \${ticket.priority}</span><span>\${ticket.status}</span><button ?disabled=\${ticket.status==='closed'} @click=\${()=>this.closeTicket(ticket.id)}>Cerrar \${ticket.title}</button></li>\`)}</ul>\`:html\`<p>Sin resultados</p>\`}\`;}
}
customElements.define('support-center',SupportCenter);`;

const supportCenterAliasesProgram = supportCenterProgram
  .replaceAll('TicketService', 'IssueRepository')
  .replaceAll('demoStorage', 'memoryPort');

const projectBoardProgram = `import {LitElement,html} from 'lit';
class ProjectBoard extends LitElement {
  static properties={cards:{state:true},status:{state:true}};
  constructor(){super();this.cards=[];this.status='idle';this.storage={save:async(_cards)=>{}};}
  async add(title){const clean=String(title??'').trim();if(!clean)return false;const next=[...this.cards,{id:crypto.randomUUID(),title:clean}];this.status='saving';try{await this.storage.save(next);this.cards=next;this.status='ready';return true;}catch{this.status='error';return false;}}
  render(){return html\`<p>\${this.cards.length}</p><p role="status">\${this.status==='error'?'No se pudo guardar':this.status}</p>\`;}
}
customElements.define('project-board',ProjectBoard);`;

const validationFormProgram = `import {LitElement,html} from 'lit';
import {Directive,directive,PartType} from 'lit/directive.js';
class InvalidFieldDirective extends Directive {
  constructor(partInfo){super(partInfo);if(partInfo.type!==PartType.CHILD)throw new Error('invalidField requiere una ChildPart');}
  update(part,[invalid,message]){
    const input=part.parentNode.previousElementSibling?.querySelector('input');
    if(input)input.setAttribute('aria-invalid',invalid?'true':'false');
    return this.render(invalid,message);
  }
  render(invalid,message){return invalid?message:'';}
}
const invalidField=directive(InvalidFieldDirective);
class ValidationForm extends LitElement {
  static properties={email:{state:true}};
  constructor(){super();this.email='';}
  render(){const invalid=this.email.length>0&&!this.email.includes('@');return html\`<label>Correo <input .value=\${this.email} @input=\${event=>this.email=event.target.value}></label><p role="alert">\${invalidField(invalid,'Escribe un correo válido')}</p>\`;}
}
customElements.define('validation-form',ValidationForm);`;

const localValidationFormProgram = validationFormProgram
  .replace("const input=part.parentNode.previousElementSibling?.querySelector('input');", "const input=part.parentNode.parentNode.querySelector('input');")
  .replace("import {Directive,directive,PartType} from 'lit/directive.js';", "import {Directive,directive} from 'lit/directive.js';")
  .replace("  constructor(partInfo){super(partInfo);if(partInfo.type!==PartType.CHILD)throw new Error('invalidField requiere una ChildPart');}\n", '');

const liveLabelProgram = `import {LitElement,html} from 'lit';
import {Directive,directive} from 'lit/directive.js';
class CurrentLabel extends Directive {render(value){return value;}}
const currentLabel=directive(CurrentLabel);
class LiveLabel extends LitElement {
  static properties={label:{type:String}};
  constructor(){super();this.label='Uno';}
  render(){return html\`<p>\${currentLabel(this.label)}</p>\`;}
}
customElements.define('live-label',LiveLabel);`;

const issueAppProgram = `import {LitElement,html} from 'lit';
class IssueApp extends LitElement {
  static properties={issues:{state:true},filter:{state:true}};
  constructor(){super();this.issues=[];this.filter='all';this.nextId=1;}
  createIssue(title,priority){
    const clean=title.trim(),level=Number(priority);
    if(!clean||level<1||level>3||!Number.isInteger(level))return;
    this.issues=[...this.issues,{id:'i'+this.nextId++,title:clean,priority:level,status:'open'}];
  }
  closeIssue(id){if(!this.issues.some(issue=>issue.id===id))return;this.issues=this.issues.map(issue=>issue.id===id?{...issue,status:'closed'}:issue);}
  get visibleIssues(){return this.filter==='all'?this.issues:this.issues.filter(issue=>issue.status===this.filter);}
  submit(event){event.preventDefault();const data=new FormData(event.currentTarget);this.createIssue(data.get('title'),data.get('priority'));event.currentTarget.reset();}
  render(){return html\`<form @submit=\${this.submit}><label>Título <input name="title"></label><label>Prioridad <select name="priority"><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></label><button>Crear</button></form><p>\${this.issues.length} incidencias</p>\${this.visibleIssues.length?html\`<ul>\${this.visibleIssues.map(issue=>html\`<li>\${issue.title} · \${issue.status}<button @click=\${()=>this.closeIssue(issue.id)} ?disabled=\${issue.status==='closed'}>Cerrar \${issue.title}</button></li>\`)}</ul>\`:html\`<p>Sin incidencias</p>\`}\`;}
}customElements.define('issue-app',IssueApp);`;

const supportBoardProgram = `import {LitElement,html} from 'lit';
class SupportBoard extends LitElement {
  static properties={tickets:{state:true}};
  constructor(){super();this.tickets=[{id:'t1',title:'Acceso',status:'open'}];}
  close(id){if(!this.tickets.some(ticket=>ticket.id===id))return;this.tickets=this.tickets.map(ticket=>ticket.id===id?{...ticket,status:'closed'}:ticket);}
  render(){return html\`\${this.tickets.map(ticket=>html\`<p>\${ticket.title}: \${ticket.status}</p>\`)}\`;}
}customElements.define('support-board',SupportBoard);`;

const libraryButtonProgram = `import {LitElement,html} from 'lit';
export class LibraryButton extends LitElement {
  static properties={label:{type:String},disabled:{type:Boolean,reflect:true}};
  constructor(){super();this.label='Guardar';this.disabled=false;}
  activate(){if(this.disabled)return;this.dispatchEvent(new CustomEvent('library-action',{bubbles:true,composed:true}));}
  render(){return html\`<button ?disabled=\${this.disabled} @click=\${this.activate}>\${this.label}</button>\`;}
}
customElements.define('library-button',LibraryButton);`;

const statusChipProgram = `import {LitElement,html} from 'lit';
class StatusChip extends LitElement {
  render(){return html\`<span>Listo</span>\`;}
}
export {StatusChip};
customElements.define('status-chip',StatusChip);`;

const networkProgram = `import {LitElement,html} from 'lit';
class NetworkController {
  constructor(host){
    this.host=host;
    this.online=navigator.onLine;
    this._sync=()=>{this.online=navigator.onLine;this.host.requestUpdate();};
    host.addController(this);
  }
  hostConnected(){window.addEventListener('online',this._sync);window.addEventListener('offline',this._sync);}
  hostDisconnected(){window.removeEventListener('online',this._sync);window.removeEventListener('offline',this._sync);}
}
class NetworkPanel extends LitElement {
  constructor(){super();this.network=new NetworkController(this);}
  render(){return html\`<p>\${this.network.online?'En línea':'Sin conexión'}</p>\`;}
}
customElements.define('network-panel',NetworkPanel);`;

const eventObjectNetworkProgram = `import {LitElement,html} from 'lit';
class ConnectionState {
  constructor(host){this.host=host;this.online=navigator.onLine;host.addController(this);}
  handleEvent(){this.online=navigator.onLine;this.host.requestUpdate();}
  hostConnected(){window.addEventListener('online',this);window.addEventListener('offline',this);}
  hostDisconnected(){window.removeEventListener('online',this);window.removeEventListener('offline',this);}
}
class NetworkPanel extends LitElement {
  constructor(){super();this.connection=new ConnectionState(this);}
  render(){return html\`<p>\${this.connection.online?'En línea':'Sin conexión'}</p>\`;}
}
customElements.define('network-panel',NetworkPanel);`;

const leakingNetworkProgram = networkProgram
  .replace("this._sync=()=>{this.online=navigator.onLine;this.host.requestUpdate();};", '')
  .replaceAll("this._sync)", "()=>{this.online=navigator.onLine;this.host.requestUpdate();})");

const counterControllerProgram = `import {LitElement,html} from 'lit';
class CounterController {
  constructor(host){this.host=host;this.value=0;host.addController(this);}
  increment(){this.value+=1;this.host.requestUpdate();}
}
class CounterPanel extends LitElement {
  constructor(){super();this.counter=new CounterController(this);}
  render(){return html\`<button @click=\${()=>this.counter.increment()}>\${this.counter.value}</button>\`;}
}
customElements.define('counter-panel',CounterPanel);`;

const catalogProgram = `import {LitElement,html} from 'lit';
import {Task} from '@lit/task';
class RemoteCatalog extends LitElement {
  static properties={query:{type:String}};
  constructor(){
    super();this.query='teclado';
    this._catalogTask=new Task(this,{
      args:()=>[this.query],
      task:async([query],{signal})=>{
        const normalized=query.trim().toLowerCase();
        await new Promise((resolve,reject)=>{
          const timer=setTimeout(resolve,normalized==='lento'?70:25);
          signal.addEventListener('abort',()=>{clearTimeout(timer);reject(signal.reason);},{once:true});
        });
        if(normalized==='error')throw new Error('Catálogo no disponible');
        if(!normalized)return [];
        return [{name:normalized[0].toUpperCase()+normalized.slice(1)}];
      },
    });
  }
  render(){return this._catalogTask.render({
    pending:()=>html\`<p>Cargando</p>\`,
    complete:(products)=>products.length?html\`<p>\${products[0].name}</p>\`:html\`<p>Sin resultados</p>\`,
    error:()=>html\`<p>Error</p>\`,
  });}
}customElements.define('remote-catalog',RemoteCatalog);`;

const weatherProgram = `import {LitElement,html} from 'lit';
import {Task} from '@lit/task';
class WeatherPanel extends LitElement {
  constructor(){super();this._weatherTask=new Task(this,{args:()=>[],task:async()=>{await new Promise(resolve=>setTimeout(resolve,20));return {temp:20};}});}
  render(){return this._weatherTask.render({pending:()=>html\`<p>Cargando</p>\`,complete:data=>html\`<p>\${data.temp} °C</p>\`});}
}customElements.define('weather-panel',WeatherPanel);`;

const staleCatalogProgram = `import {LitElement,html} from 'lit';
class RemoteCatalog extends LitElement {
  static properties={query:{type:String},loading:{state:true},result:{state:true},failed:{state:true}};
  constructor(){super();this.query='teclado';this.loading=false;this.result=[];this.failed=false;}
  updated(changed){if(changed.has('query'))this.load(this.query);}
  async load(query){
    this.loading=true;this.failed=false;this.requestUpdate();
    const normalized=query.trim().toLowerCase();
    await new Promise(resolve=>setTimeout(resolve,normalized==='lento'?70:25));
    this.loading=false;
    if(normalized==='error'){this.failed=true;this.result=[];}
    else this.result=normalized?[{name:normalized[0].toUpperCase()+normalized.slice(1)}]:[];
  }
  render(){if(this.loading)return html\`<p>Cargando</p>\`;if(this.failed)return html\`<p>Error</p>\`;return this.result.length?html\`<p>\${this.result[0].name}</p>\`:html\`<p>Sin resultados</p>\`;}
}customElements.define('remote-catalog',RemoteCatalog);`;

const tableProgram = `import {LitElement,html} from 'lit';
import {classMap} from 'lit/directives/class-map.js';
import {styleMap} from 'lit/directives/style-map.js';
import {createRef,ref} from 'lit/directives/ref.js';
class InteractiveTable extends LitElement {
  static properties={selected:{state:true},width:{state:true}};
  constructor(){super();this.selected=true;this.width=65;this.searchRef=createRef();}
  focusSearch(){this.searchRef.value?.focus();}
  render(){return html\`<input aria-label="Buscar" \${ref(this.searchRef)}><article class=\${classMap({selected:this.selected})}><div class="bar" style=\${styleMap({width:this.width+'%'})}></div></article>\`;}
}customElements.define('interactive-table',InteractiveTable);`;

const toolbarProgram = `import {LitElement,html} from 'lit';
import {createRef,ref} from 'lit/directives/ref.js';
class SearchToolbar extends LitElement {
  constructor(){super();this.searchRef=createRef();}
  focusSearch(){this.searchRef.value?.focus();}
  render(){return html\`<input id="q" \${ref(this.searchRef)}>\`;}
}customElements.define('search-toolbar',SearchToolbar);`;

const trayProgram = `import {LitElement,html} from 'lit';
import {repeat} from 'lit/directives/repeat.js';
import {when} from 'lit/directives/when.js';
class OrderTray extends LitElement {
  static properties={orders:{state:true}};
  constructor(){super();this.orders=[{id:'p2',name:'Teclado'},{id:'p1',name:'Cable'}];}
  remove(id){this.orders=this.orders.filter(order=>order.id!==id);}
  render(){return when(this.orders.length>0,()=>html\`<div>\${repeat(this.orders,order=>order.id,order=>html\`<article><span>\${order.name}</span><button @click=\${()=>this.remove(order.id)}>Quitar</button></article>\`)}</div>\`,()=>html\`<p>Sin pedidos</p>\`);}
}customElements.define('order-tray',OrderTray);`;

const editableProgram = `import {LitElement,html} from 'lit';
import {repeat} from 'lit/directives/repeat.js';
class EditableList extends LitElement {
  constructor(){super();this.items=[{id:'a',name:'A'},{id:'b',name:'B'}];}
  render(){return html\`\${repeat(this.items,item=>item.id,item=>html\`<input .value=\${item.name}>\`)}\`;}
}customElements.define('editable-list',EditableList);`;

const panelProgram = `import {LitElement,html,css} from 'lit';
  class AppPanel extends LitElement {
    static styles=css\`:host{display:block}::slotted([slot="header"]){font-weight:700}\`;
    render(){return html\`<section part="surface"><header><slot name="header"></slot></header><main><slot></slot></main><footer><slot name="actions"></slot></footer></section>\`;}
  }customElements.define('app-panel',AppPanel);`;

const reportProgram = `import {LitElement,html} from 'lit';
  class ReportCard extends LitElement {
    render(){return html\`<section part="surface"><slot></slot></section>\`;}
  }customElements.define('report-card',ReportCard);`;

const themeProgram = `import {LitElement,html,css} from 'lit';
  class ThemeCard extends LitElement {
    static styles=css\`:host{display:block;border-left:4px solid var(--card-accent,#2563eb)}\`;
    render(){return html\`<article><h2>Panel personal</h2><p>Tema configurable</p></article>\`;}
  }customElements.define('theme-card',ThemeCard);`;

const brandProgram = `import {LitElement,html,css} from 'lit';
  class BrandChip extends LitElement {
    static styles=css\`span{color:var(--brand-color,blue)}\`;
    render(){return html\`<span>Marca</span>\`;}
  }customElements.define('brand-chip',BrandChip);`;

const focusedSearchProgram = `import {LitElement,html} from 'lit';
  class FocusSearch extends LitElement {
    static properties={results:{state:true}};
    constructor(){super();this.results=[];}
    render(){return html\`<input aria-label="Buscar"><button @click=\${()=>this.search()}>Buscar</button><p role="status">\${this.results.length} resultados</p>\`;}
    firstUpdated(){this.renderRoot.querySelector('input').focus();}
    async search(){this.results=['Uno','Dos'];await this.updateComplete;this.dispatchEvent(new CustomEvent('results-ready',{detail:{count:this.results.length}}));}
  }customElements.define('focus-search',FocusSearch);`;

const searchBoxProgram = `import {LitElement,html} from 'lit';
  class SearchBox extends LitElement {
    render(){return html\`<input aria-label="Consulta">\`;}
    firstUpdated(){this.renderRoot.querySelector('input').focus();}
  }customElements.define('search-box',SearchBox);`;

function filterProgram({ alias = false, light = false, fixed = false, queryOnly = false, itemsOnly = false, everyUpdate = false, staleView = false, caseSensitive = false } = {}) {
  const parameter = alias ? 'properties' : 'changed';
  const condition = everyUpdate ? 'true' : queryOnly ? `${parameter}.has('query')` : itemsOnly ? `${parameter}.has('items')` : `${parameter}.has('items') || ${parameter}.has('query')`;
  return `import {LitElement,html} from 'lit';
    class FilterSummary extends LitElement {
      static properties={items:{type:Array},query:{type:String},visible:{state:true}};
      constructor(){super();this.items=['Pan','Café','Arroz'];this.query='';this.visible=[];}
      ${light ? 'createRenderRoot(){return this;}' : ''}
      ${alias ? "['willUpdate']" : 'willUpdate'}(${parameter}){if(${condition})this.visible=${fixed ? "['Pan','Arroz']" : `this.items.filter(item=>${caseSensitive ? 'item.includes(this.query)' : 'item.toLowerCase().includes(this.query.toLowerCase())'})`};}
      render(){return html\`<p>Coincidencias: \${${staleView ? '2' : 'this.visible.length'}}</p>\`;}
    }customElements.define('filter-summary',FilterSummary);`;
}

function taxProgram({ getter = false, alias = false, light = false, fixed = false, late = false, initialOnly = false, staleView = false, skipZero = false } = {}) {
  return `import {LitElement,html} from 'lit';
    class TaxTotal extends LitElement {
      static properties={subtotal:{type:Number}${getter ? '' : ',total:{state:true}'}};
      constructor(){super();this.subtotal=100;${getter ? '' : 'this.total=0;'}}
      ${light ? 'createRenderRoot(){return this;}' : ''}
      ${getter ? 'get total(){return this.subtotal*1.1;}' : `${late ? 'updated' : alias ? "['willUpdate']" : 'willUpdate'}(properties){
        ${initialOnly ? 'if(this.didCompute)return;this.didCompute=true;' : ''}
        ${skipZero ? 'if(!this.subtotal)return;' : ''}
        this.total=${fixed ? '44' : 'this.subtotal*1.1'};
      }`}
      render(){return html\`<p>Total: \${${staleView ? '44' : 'this.total'}}</p>\`;}
    }customElements.define('tax-total',TaxTotal);
    // willUpdate(changed) { this.total = this.subtotal + impuesto; }
  `;
}

function monitorProgram({ noTimer = false, leak = false, reverse = false, noDisconnectSuper = false, once = false, light = false, period = 100, fixed = false } = {}) {
  const connect = `connectedCallback(){super.connectedCallback();${once ? 'if(this._timer)return;' : ''}${noTimer ? '' : `this._timer=setInterval(()=>this.ticks++,${period});`}}`;
  const disconnect = `disconnectedCallback(){${leak ? '' : 'clearInterval(this._timer);'}${noDisconnectSuper ? '' : 'super.disconnectedCallback();'}}`;
  return `import {LitElement,html} from 'lit';
    class ConnectionMonitor extends LitElement {
      static properties={ticks:{state:true}};
      constructor(){super();this.ticks=0;}
      ${light ? 'createRenderRoot(){return this;}' : ''}
      ${reverse ? disconnect+connect : connect+disconnect}
      render(){return html\`<p>Monitor: \${${fixed ? '0' : 'this.ticks'}}</p>\`;}
    }customElements.define('connection-monitor',ConnectionMonitor);`;
}

function clockProgram({ inherited = false, commentsOnly = false, light = false } = {}) {
  return `import {LitElement,html} from 'lit';
    ${inherited ? 'class ClockBase extends LitElement {connectedCallback(){super.connectedCallback();this.started=true;}}' : ''}
    class BrokenClock extends ${inherited ? 'ClockBase' : 'LitElement'} {
      ${inherited ? '' : `connectedCallback(){${commentsOnly ? '/* super.connectedCallback(); */ this.attachShadow({mode:"open"}).innerHTML="<p>Reloj iniciado</p>";' : 'super.connectedCallback();'}this.started=true;}`}
      ${light ? 'createRenderRoot(){return this;}' : ''}
      render(){return html\`<p>Reloj iniciado</p>\`;}
    }customElements.define('broken-clock',BrokenClock);`;
}

function profileProgram({ arrow = false, light = false, noPrevent = false, noValidation = false, noMessage = false, fixed = false, untrimmed = false, duplicate = false, clickOnly = false } = {}) {
  return `import {LitElement,html} from 'lit';
    class ProfileEditor extends LitElement {
      static properties={error:{state:true}};
      constructor(){super();this.error='';}
      ${light ? 'createRenderRoot(){return this;}' : ''}
      render(){return html\`<form ${clickOnly ? '' : '@submit=${'+(arrow ? '(event)=>this._submit(event)' : 'this._submit')+'}'}>
        <label>Nombre <input name="name"></label><button ${clickOnly ? '@click=${this._submit}' : ''}>Guardar</button><p>\${this.error}</p></form>\`;}
      _submit(event){
        ${noPrevent ? '' : 'event.preventDefault();'}
        const name=${fixed ? "'Ana'" : `new FormData(${clickOnly ? "this.renderRoot.querySelector('form')" : 'event.currentTarget'}).get('name')${untrimmed ? '' : '.trim()'}`};
        ${noValidation ? '' : `if(!name){${noMessage ? '' : "this.error='Escribe tu nombre';"}return;}`}
        this.error='';
        this.dispatchEvent(new CustomEvent('profile-save',{detail:{name},bubbles:true,composed:true}));
        ${duplicate ? "this.dispatchEvent(new CustomEvent('profile-save',{detail:{name},bubbles:true,composed:true}));" : ''}
      }
    }customElements.define('profile-editor',ProfileEditor);
    ${clickOnly ? '// @submit=${this._submit}' : ''}`;
}

function inviteProgram({ binding = 'this._submit', noPrevent = false, noSend = false, premature = false, light = false, once = false } = {}) {
  return `import {LitElement,html} from 'lit';
    class InviteForm extends LitElement {
      ${light ? 'createRenderRoot(){return this;}' : ''}
      render(){${premature ? "this.setAttribute('sent','');" : ''}return html\`<form @submit=\${${binding}}><input name="email"><button>Invitar</button></form>\`;}
      _submit(event){${once ? "if(this.hasAttribute('sent'))return;" : ''}${noPrevent ? '' : 'event.preventDefault();'}${noSend ? '' : "this.setAttribute('sent','');"}}
    }customElements.define('invite-form',InviteForm);`;
}

function boardProgram({ concat = false, clonePush = false, mutateAdd = false, wrongText = false, duplicateId = false, mutateObject = false, sameArray = false, firstOnly = false, allDone = false } = {}) {
  const task = `{id:${duplicateId ? '1' : 'this.tasks.length+1'},text:${wrongText ? "'Fijo'" : 'text'}}`;
  const add = mutateAdd ? `this.tasks.push(${task});this.tasks=this.tasks.slice();` : clonePush ? `const next=this.tasks.slice();next.push(${task});this.tasks=next;` : concat ? `this.tasks=this.tasks.concat(${task});` : `this.tasks=[...this.tasks,${task}];`;
  const condition = allDone ? 'true' : firstOnly ? 'index===0' : 'task.id===id';
  const complete = sameArray ? "const index=this.tasks.findIndex(task=>task.id===id);if(index>=0)this.tasks[index]={...this.tasks[index],done:true};this.requestUpdate();" : `this.tasks=this.tasks.map((task,index)=>{if(${condition}){${mutateObject ? 'task.done=true;' : ''}return {...task,done:true};}return task;});`;
  return `import { LitElement, html } from 'lit';
    class TaskBoard extends LitElement {
      static properties={tasks:{state:true}};
      constructor(){super();this.tasks=[{id:1,text:'Leer'}];}
      addTask(text){${add}}
      complete(id){${complete}}
      render(){return html\`<ul>\${this.tasks.map(task=>html\`<li>\${task.text} \${task.done?'✓':''}</li>\`)}</ul>\`;}
    }customElements.define('task-board',TaskBoard);`;
}

function notesProgram({ concat = false, clonePush = false, mutate = false, forced = false, wrongText = false } = {}) {
  const text = wrongText ? 'Otra' : 'Segunda';
  const add = forced ? `this.notes.push('${text}');this.requestUpdate();` : mutate ? `this.notes.push('${text}');this.notes=this.notes.slice();` : concat ? `this.notes=this.notes.concat('${text}');` : clonePush ? `const next=this.notes.slice();next.push('${text}');this.notes=next;` : `this.notes=[...this.notes,'${text}'];`;
  return `import { LitElement, html } from 'lit';
    class NoteList extends LitElement {
      static properties={notes:{state:true}};
      constructor(){super();this.notes=['Primera'];}
      add(){${add}}
      render(){return html\`\${this.notes.map(note=>html\`<p>\${note}</p>\`)}\`;}
    }customElements.define('note-list',NoteList);
    ${mutate || forced ? '// this.notes = [...this.notes]' : ''}`;
}

function inventoryProgram({ reordered = false, variable = false, unlimited = false, fixed = false, publicState = false, decrementsCapacity = false } = {}) {
  const options = publicState ? '{type:Number}' : reordered ? '{type:Number,state:true}' : '{state:true}';
  return `import { LitElement, html } from 'lit';
    ${variable ? `const stateOptions=${options};` : ''}
    class InventoryCounter extends LitElement {
      static properties={capacity:{type:Number},_reserved:${variable ? 'stateOptions' : options}};
      constructor(){super();this.capacity=0;this._reserved=0;}
      reserve(){${decrementsCapacity ? 'if(this.capacity>0)this.capacity--;' : unlimited ? 'this._reserved++;' : 'if(this._reserved<this.capacity)this._reserved++;'}}
      render(){return html\`<button @click=\${()=>this.reserve()}>Reservar</button><span>Disponibles: \${${fixed ? '4' : 'this.capacity-this._reserved'}}</span>\`;}
    }
    customElements.define('inventory-counter',InventoryCounter);
    ${publicState ? '// _reserved: {state:true}' : ''}`;
}

function loadingProgram({ reordered = false, variable = false, fixed = false, publicState = false, unusedPublic = false } = {}) {
  const options = publicState ? '{type:Boolean}' : reordered ? '{type:Boolean,state:true}' : '{state:true}';
  return `import { LitElement, html } from 'lit';
    ${variable ? `const stateOptions=${options};` : ''}
    class DataPanel extends LitElement {
      static properties={_loading:${variable ? 'stateOptions' : options}${unusedPublic ? ',loading:{type:Boolean}' : ''}};
      constructor(){super();this._loading=true;}
      render(){return html\`<p>\${${fixed ? 'true' : 'this._loading'}?'Cargando':'Listo'}</p>\`;}
    }
    customElements.define('data-panel',DataPanel);
    ${publicState ? '// _loading: {state:true}' : ''}`;
}

function chipProgram({ getter = false, reversed = false, inherited = false, fixed = false, stringBoolean = false, noDefaults = false, defaultOnline = false, plainName = false, plainOnline = false, shadowed = false } = {}) {
  const properties = [!plainName && 'name: { type: String }', !plainOnline && `online: { type: ${stringBoolean ? 'String' : 'Boolean'} }`].filter(Boolean);
  if (reversed) properties.reverse();
  const declaration = getter ? `static get properties(){return {${properties.join(',')}};}` : `static properties = {${properties.join(',')}};`;
  return `import { LitElement, html } from 'lit';
    ${inherited ? `class Base extends LitElement { ${declaration} }` : ''}
    class UserChip extends ${inherited ? 'Base' : 'LitElement'} {
      ${inherited ? '' : declaration}
      ${shadowed ? "name=''; online=false;" : ''}
      constructor(){super();${noDefaults ? '' : `this.name='';this.online=${defaultOnline};`}}
      render(){return html\`<span>\${${fixed ? "'Ada'" : 'this.name'}} — \${${fixed ? 'true' : 'this.online'} ? 'En línea' : 'Sin conexión'}</span>\`;}
    }
    customElements.define('user-chip',UserChip);
    ${fixed ? '// static properties = { name, online }' : ''}`;
}

function counterProgram({ getter = false, inherited = false, fixed = false, wrongIncrement = false, forced = false, noReactive = false } = {}) {
  const declaration = getter ? 'static get properties(){return {count:{type:Number}};}' : 'static properties = {count:{type:Number}};';
  return `import { LitElement, html } from 'lit';
    ${inherited ? `class Base extends LitElement { ${declaration} }` : ''}
    class LiveCounter extends ${inherited ? 'Base' : 'LitElement'} {
      ${inherited || noReactive ? '' : declaration}
      constructor(){super();this.count=1;}
      increment(){this.count+=${wrongIncrement ? '20' : '1'};${forced ? 'this.requestUpdate();' : ''}}
      render(){return html\`<span>\${${fixed ? '2' : 'this.count'}}</span>\`;}
    }
    customElements.define('live-counter',LiveCounter);
    // static properties = { count }
  `;
}

function cardProgram(kind: 'product' | 'account', { alias = false, local = false, array = false, price = '80', outside = false, imperative = false, emptyTemplate = false, light = false } = {}) {
  const factory = alias ? 'view' : 'html';
  const markup = kind === 'product'
    ? `<article><h2>Teclado</h2>${!outside && price ? `<p>$${price}</p>` : ''}</article>${outside ? `<p>$${price}</p>` : ''}`
    : '<p>Cuenta activa</p>';
  const value = `${factory}\`${markup}\``;
  return `import { LitElement, html${alias ? ' as view' : ''} } from 'lit';
    class Card extends LitElement {
      ${light ? 'createRenderRoot(){return this;}' : ''}
      render(){${imperative ? `this.shadowRoot.innerHTML=${JSON.stringify(markup)};${emptyTemplate ? 'return html``;' : ''}` : local ? `const result=${value}; return result;` : `return ${array ? '['+value+']' : value};`}}
    }
    customElements.define('${kind}-card',Card);
    ${imperative ? '// render(){ return html`' : ''}`;
}

function orderProgram({ property = false, fixedText = false, unsafe = false, fixedLock = false, attribute = false, wrongTotal = false } = {}) {
  return `import { LitElement, html } from 'lit';
    ${unsafe ? "import { unsafeHTML } from 'lit/directives/unsafe-html.js';" : ''}
    class OrderSummary extends LitElement {
      constructor(){super();this.customer='Luis';this.total=42;this.locked=true;}
      render(){return html\`<p>\${${fixedText ? "'Luis'" : unsafe ? 'unsafeHTML(this.customer)' : 'this.customer'}}: $\${${fixedText ? '42' : wrongTotal ? 'this.total * 10' : 'this.total'}}</p>
        <button ${attribute ? '' : property ? '.' : '?'}disabled=\${${fixedLock ? 'true' : 'this.locked'}}>Continuar</button>\`;}
    }
    customElements.define('order-summary',OrderSummary);
    // ?disabled=\${this.locked}
  `;
}

function permissionProgram({ property = false, fixed = false } = {}) {
  return `import { LitElement, html } from 'lit';
    class PermissionButton extends LitElement {
      constructor(){super();this.locked=false;}
      render(){return html\`<button ${property ? '.' : '?'}disabled=\${${fixed ? 'false' : 'this.locked'}}>Continuar</button>\`;}
    }
    customElements.define('permission-button',PermissionButton);`;
}

// Independent known answers and mutations. These never enter the student catalog.
function sessionProgram({ empty = true, rows = true, name = true, reset = true } = {}) {
  return `import { LitElement, html } from 'lit';
    class SessionPanel extends LitElement {
      constructor() { super(); this.user=null; this.notifications=[]; }
      render() {
        ${reset ? '' : 'if(this.user)this.lastUser=this.user; this.user=this.user||this.lastUser;'}
        if(!this.user)return html\`<p>Inicia sesión</p>\`;
        return html\`<h2>\${${name ? 'this.user.name' : "'Mara'"}}</h2>
          \${this.notifications.length ? html\`<ul>\${this.notifications.map(item=>html\`<li>\${${rows ? 'item' : "'Aviso'"}}</li>\`)}</ul>\` : ${empty ? "html`<p>Sin notificaciones</p>`" : "''"}}\`;
      }
    }
    customElements.define('session-panel',SessionPanel);`;
}

function cartProgram({ alternate = false, positive = true, returnsToEmpty = true } = {}) {
  const branch = alternate
    ? "if(!this.count) return html`<div>Sin artículos</div>`; return html`<div><strong>${this.count} artículos</strong></div>`;"
    : "return html`<div>${this.count ? html`<strong>${this.count} artículos</strong>` : html`Sin artículos`}</div>`;";
  return `import { LitElement, html } from 'lit';
    class CartCount extends LitElement {
      constructor(){super();this.count=0;}
      render(){
        ${returnsToEmpty ? '' : 'if(this.count)this.previous=this.count;this.count=this.count||this.previous||0;'}
        ${positive ? branch : "return html`<div>Sin artículos</div>`; // ? html`"}
      }
    }
    customElements.define('cart-count',CartCount);`;
}

const lit40Cases: RegressionCase[] = [
  { ...supportCenter, name:'40 clase: el inicio no aprueba nada', source:supportCenter.workspace.files['app.js'].content, accept:false },
  { ...supportCenter, name:'40 clase: acepta el corte vertical completo', source:supportCenterProgram, accept:true },
  { ...supportCenter, name:'40 clase: acepta nombres internos alternativos', source:supportCenterAliasesProgram, accept:true },
  { ...supportCenter, name:'40 clase: acepta renderizar el centro en el host', source:supportCenterProgram.replace('class SupportCenter extends LitElement {', 'class SupportCenter extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...supportCenter, name:'40 clase: rechaza filtrar campos crudos del almacenamiento', source:supportCenterProgram.replace("return (Array.isArray(rows)?rows:[]).map(row=>({", "return (Array.isArray(rows)?rows:[]).map(row=>({...row,"), accept:false },
  { ...supportCenter, name:'40 clase: rechaza no recortar títulos', source:supportCenterProgram.replace("const clean=String(title??'').trim()", "const clean=String(title??'')"), accept:false },
  { ...supportCenter, name:'40 clase: rechaza prioridades fuera de rango', source:supportCenterProgram.replace("||level<1||level>3", ''), accept:false },
  { ...supportCenter, name:'40 clase: rechaza mutar antes de persistir', source:supportCenterProgram.replace("const next=[...this.tickets,{id:crypto.randomUUID(),title:clean,priority:level,status:'open'}];", "this.tickets.push({id:crypto.randomUUID(),title:clean,priority:level,status:'open'});const next=this.tickets;"), accept:false },
  { ...supportCenter, name:'40 clase: rechaza confirmar una creación fallida', source:supportCenterProgram.replace("catch{this.status='error';return false;}", "catch{this.tickets=next;this.status='error';return false;}"), accept:false },
  { ...supportCenter, name:'40 clase: rechaza cerrar siempre el primer ticket', source:supportCenterProgram.replace("ticket.id===id?{...ticket,status:'closed'}:ticket", "ticket===this.tickets[0]?{...ticket,status:'closed'}:ticket"), accept:false },
  { ...supportCenter, name:'40 clase: rechaza reemplazar tickets ajenos al cerrar', source:supportCenterProgram.replace("ticket.id===id?{...ticket,status:'closed'}:ticket", "{...ticket,status:ticket.id===id?'closed':ticket.status}"), accept:false },
  { ...supportCenter, name:'40 clase: rechaza ignorar el filtro', source:supportCenterProgram.replace("return this.filter==='all'?this.tickets:this.tickets.filter(ticket=>ticket.status===this.filter);", 'return this.tickets;'), accept:false },
  { ...supportCenter, name:'40 clase: rechaza un formulario sin etiquetas', source:supportCenterProgram.replace('<label>Título <input name="title"></label>', '<input name="title">').replace('<label>Prioridad <select', '<select').replace('</select></label><button>Crear', '</select><button>Crear'), accept:false },
  { ...supportCenter, name:'40 clase: rechaza no prevenir navegación', source:supportCenterProgram.replace('submit(event){event.preventDefault();', 'submit(event){'), accept:false },
  { ...supportCenter, name:'40 clase: rechaza ocultar los estados remotos', source:supportCenterProgram.replace('<p role="status">${message}</p>', '<p role="status"></p>'), accept:false },
  { ...supportCenter, name:'40 clase: rechaza una lista sin acción de cierre', source:supportCenterProgram.replace('<button ?disabled=${ticket.status===\'closed\'} @click=${()=>this.closeTicket(ticket.id)}>Cerrar ${ticket.title}</button>', ''), accept:false },
  { ...projectBoard, name:'40 depuración: el inicio no aprueba nada', source:projectBoard.workspace.files['app.js'].content, accept:false },
  { ...projectBoard, name:'40 depuración: acepta una única versión persistida', source:projectBoardProgram, accept:true },
  { ...projectBoard, name:'40 depuración: acepta renderizar el tablero en el host', source:projectBoardProgram.replace('class ProjectBoard extends LitElement {', 'class ProjectBoard extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...projectBoard, name:'40 depuración: rechaza guardar la lista anterior', source:projectBoardProgram.replace('await this.storage.save(next)', 'await this.storage.save(this.cards)'), accept:false },
  { ...projectBoard, name:'40 depuración: rechaza reconstruir otra versión después de guardar', source:projectBoardProgram.replace('this.cards=next', 'this.cards=[...next]'), accept:false },
  { ...projectBoard, name:'40 depuración: rechaza confirmar una escritura fallida', source:projectBoardProgram.replace("catch{this.status='error';return false;}", "catch{this.cards=next;this.status='error';return false;}"), accept:false },
  { ...projectBoard, name:'40 depuración: rechaza títulos vacíos', source:projectBoardProgram.replace("if(!clean)return false;", ''), accept:false },
  { ...projectBoard, name:'40 depuración: rechaza una vista de conteo fija', source:projectBoardProgram.replace('${this.cards.length}', '1'), accept:false },
];

const lit41Cases: RegressionCase[] = [
  { ...viewportPanel, name:'41 clase: el inicio no aprueba nada', source:viewportPanel.workspace.files['app.js'].content, accept:false },
  { ...viewportPanel, name:'41 clase: acepta el ciclo completo del mixin', source:viewportPanelProgram, accept:true },
  { ...viewportPanel, name:'41 clase: acepta nombres internos alternativos', source:viewportPanelAliasesProgram, accept:true },
  { ...viewportPanel, name:'41 clase: acepta renderizar el ancho en el host', source:viewportPanelProgram.replace('class ViewportPanel extends WithViewport(LitElement){', 'class ViewportPanel extends WithViewport(LitElement){createRenderRoot(){return this;}'), accept:true },
  { ...viewportPanel, name:'41 clase: rechaza cortar la conexión heredada', source:viewportPanelProgram.replace('connectedCallback(){super.connectedCallback();', 'connectedCallback(){'), accept:false },
  { ...viewportPanel, name:'41 clase: rechaza cortar la desconexión heredada', source:viewportPanelProgram.replace('super.disconnectedCallback();', ''), accept:false },
  { ...viewportPanel, name:'41 clase: rechaza un listener anónimo imposible de limpiar', source:viewportPanelProgram.replace("window.addEventListener('resize',this.measureViewport)", "window.addEventListener('resize',()=>this.measureViewport())"), accept:false },
  { ...viewportPanel, name:'41 clase: rechaza retirar otra referencia', source:viewportPanelProgram.replace("window.removeEventListener('resize',this.measureViewport)", "window.removeEventListener('resize',()=>this.measureViewport())"), accept:false },
  { ...viewportPanel, name:'41 clase: rechaza omitir la primera medición', source:viewportPanelProgram.replace('this.measureViewport();}', '/* sin medida inicial */}'), accept:false },
  { ...viewportPanel, name:'41 clase: rechaza omitir la reactividad', source:viewportPanelProgram.replace('static properties={viewportWidth:{state:true}};', ''), accept:false },
  { ...viewportPanel, name:'41 clase: rechaza una medida fija', source:viewportPanelProgram.replace('this.viewportWidth=window.innerWidth', 'this.viewportWidth=1024'), accept:false },
  { ...viewportPanel, name:'41 clase: rechaza una vista fija', source:viewportPanelProgram.replace('${this.viewportWidth} px', '1024 px'), accept:false },
  { ...presenceCard, name:'41 depuración: el inicio no aprueba nada', source:presenceCard.workspace.files['app.js'].content, accept:false },
  { ...presenceCard, name:'41 depuración: acepta continuar la cadena', source:presenceCardProgram, accept:true },
  { ...presenceCard, name:'41 depuración: acepta renderizar en el host', source:presenceCardProgram.replace('class PresenceCard extends WithPresence(LitElement){', 'class PresenceCard extends WithPresence(LitElement){createRenderRoot(){return this;}'), accept:true },
  { ...presenceCard, name:'41 depuración: rechaza omitir super', source:presenceCardProgram.replace('super.connectedCallback();', ''), accept:false },
  { ...presenceCard, name:'41 depuración: rechaza super solo en un comentario', source:presenceCardProgram.replace('super.connectedCallback();', '/* super.connectedCallback(); */'), accept:false },
  { ...presenceCard, name:'41 depuración: rechaza un estado fijo distinto', source:presenceCardProgram.replace("this.presence='Disponible'", "this.presence='Ausente'"), accept:false },
  { ...presenceCard, name:'41 depuración: rechaza una vista Disponible fija', source:presenceCardProgram.replace("${this.presence??'Sin estado'}", 'Disponible'), accept:false },
];

const lit42Cases: RegressionCase[] = [
  { ...dependencyPlanner, name:'42 clase: el inicio no aprueba nada', source:dependencyPlanner.workspace.files['app.js'].content, accept:false },
  { ...dependencyPlanner, name:'42 clase: acepta el grafo dirigido protegido', source:dependencyPlannerProgram, accept:true },
  { ...dependencyPlanner, name:'42 clase: acepta nombres internos alternativos', source:dependencyPlannerAliasesProgram, accept:true },
  { ...dependencyPlanner, name:'42 clase: acepta renderizar el planificador en el host', source:dependencyPlannerProgram.replace('class DependencyPlanner extends LitElement{', 'class DependencyPlanner extends LitElement{createRenderRoot(){return this;}'), accept:true },
  { ...dependencyPlanner, name:'42 clase: rechaza nodos ausentes', source:dependencyPlannerProgram.replace("if(!this.nodes.has(from)||!this.nodes.has(to)||from===to)return false;", "if(from===to)return false;"), accept:false },
  { ...dependencyPlanner, name:'42 clase: rechaza conexiones consigo mismo', source:dependencyPlannerProgram.replace('||from===to', '').replace('if(current===to)return true;', 'if(current===to&&current!==from)return true;'), accept:false },
  { ...dependencyPlanner, name:'42 clase: rechaza aristas duplicadas', source:dependencyPlannerProgram.replace("if(this.edges.some(edge=>edge.from===from&&edge.to===to))return false;", ''), accept:false },
  { ...dependencyPlanner, name:'42 clase: rechaza comprobar solo el regreso directo', source:dependencyPlannerProgram.replace('return !this.hasPath(to,from);', 'return !this.edges.some(edge=>edge.from===to&&edge.to===from);'), accept:false },
  { ...dependencyPlanner, name:'42 clase: rechaza alterar edges durante un rechazo', source:dependencyPlannerProgram.replace("if(!this.canConnect(from,to))return false;", "if(!this.canConnect(from,to)){this.edges.push({from,to});this.edges.pop();return false;}"), accept:false },
  { ...dependencyPlanner, name:'42 clase: rechaza mutar el array al aceptar', source:dependencyPlannerProgram.replace("this.edges=[...this.edges,{from,to}];", "this.edges.push({from,to});"), accept:false },
  { ...dependencyPlanner, name:'42 clase: rechaza una vista de estado fija', source:dependencyPlannerProgram.replace("this.message=accepted?'Conectado':'Rechazado: ciclo o conexión inválida';", "this.message='Listo';"), accept:false },
  { ...dependencyPlanner, name:'42 clase: rechaza un conteo de aristas fijo', source:dependencyPlannerProgram.replace('${this.graph.edges.length}', '2'), accept:false },
  { ...safeGraph, name:'42 depuración: el inicio conserva la mutación ilegal', source:safeGraph.workspace.files['app.js'].content, accept:false },
  { ...safeGraph, name:'42 depuración: acepta detectar ciclos antes de insertar', source:safeGraphProgram, accept:true },
  { ...safeGraph, name:'42 depuración: acepta otros nombres internos', source:safeGraphProgram.replaceAll('hasPath', 'reaches').replaceAll('pending', 'frontier'), accept:true },
  { ...safeGraph, name:'42 depuración: rechaza comprobar solo c hacia a', source:safeGraphProgram.replace('this.hasPath(to,from)', "from==='c'&&to==='a'"), accept:false },
  { ...safeGraph, name:'42 depuración: rechaza insertar duplicados', source:safeGraphProgram.replace("this.edges.some(edge=>edge.from===from&&edge.to===to)||", ''), accept:false },
  { ...safeGraph, name:'42 depuración: rechaza ciclos de un nodo', source:safeGraphProgram.replace('from===to||', '').replace('if(current===to)return true;', 'if(current===to&&current!==from)return true;'), accept:false },
  { ...safeGraph, name:'42 depuración: rechaza alterar edges antes de devolver false', source:safeGraphProgram.replace("if(from===to||this.edges.some(edge=>edge.from===from&&edge.to===to)||this.hasPath(to,from))return false;", "if(from===to||this.edges.some(edge=>edge.from===from&&edge.to===to)||this.hasPath(to,from)){this.edges.push({from,to});this.edges.pop();return false;}"), accept:false },
  { ...safeGraph, name:'42 depuración: rechaza mutar el array aceptado', source:safeGraphProgram.replace("this.edges=[...this.edges,{from,to}];", "this.edges.push({from,to});"), accept:false },
];

const lit43Cases: RegressionCase[] = [
  { ...relayCalculator, name:'43 clase: el inicio no aprueba nada', source:relayCalculator.workspace.files['app.js'].content, accept:false },
  { ...relayCalculator, name:'43 clase: acepta orden topológico y Bridge intercambiable', source:relayCalculatorProgram, accept:true },
  { ...relayCalculator, name:'43 clase: acepta nombres internos alternativos', source:relayCalculatorAliasesProgram, accept:true },
  { ...relayCalculator, name:'43 clase: acepta renderizar el cálculo en el host', source:relayCalculatorProgram.replace('class RelayCalculator extends LitElement{', 'class RelayCalculator extends LitElement{createRenderRoot(){return this;}'), accept:true },
  { ...relayCalculator, name:'43 clase: rechaza usar el orden visual de nodes', source:relayCalculatorProgram.replace(/function topologicalOrder\(graph\)\{[\s\S]*?\n\}/, 'function topologicalOrder(graph){return graph.nodes.map(node=>node.id);}'), accept:false },
  { ...relayCalculator, name:'43 clase: rechaza fijar la tabla predeterminada', source:relayCalculatorProgram.replace('const evaluate=implementations[node.kind];', 'const evaluate=evaluators[node.kind]; // implementations[node.kind]'), accept:false },
  { ...relayCalculator, name:'43 clase: rechaza ignorar los nombres de puerto', source:relayCalculatorProgram.replace('inputs[edge.port]=outputs.get(edge.from);', "inputs[Object.keys(inputs).length?'b':'a']=outputs.get(edge.from);"), accept:false },
  { ...relayCalculator, name:'43 clase: rechaza omitir la detección de ciclos', source:relayCalculatorProgram.replace("if(order.length!==graph.nodes.length)throw new Error('El grafo contiene un ciclo');", ''), accept:false },
  { ...relayCalculator, name:'43 clase: rechaza tolerar evaluadores ausentes', source:relayCalculatorProgram.replace("if(typeof evaluate!=='function')throw new Error('Sin evaluador');", "if(typeof evaluate!=='function')continue;"), accept:false },
  { ...relayCalculator, name:'43 clase: rechaza aristas hacia nodos ausentes', source:relayCalculatorProgram
    .replace("if(!indegree.has(edge.from)||!indegree.has(edge.to))throw new Error('Arista desconocida');", "if(!indegree.has(edge.from)||!indegree.has(edge.to))continue;")
    .replace("if(!outputs.has(edge.from)||!edge.port)throw new Error('Entrada incompleta');", "if(!outputs.has(edge.from))continue;if(!edge.port)throw new Error('Entrada incompleta');"), accept:false },
  { ...relayCalculator, name:'43 clase: rechaza puertos ausentes', source:relayCalculatorProgram.replace("if(!outputs.has(edge.from)||!edge.port)throw new Error('Entrada incompleta');", "if(!outputs.has(edge.from))throw new Error('Entrada incompleta');"), accept:false },
  { ...relayCalculator, name:'43 clase: rechaza contaminar un snapshot anterior', source:relayCalculatorProgram.replace('const outputs=new Map();', 'const outputs=globalThis.sharedOutputs??=new Map();'), accept:false },
  { ...relayCalculator, name:'43 clase: rechaza una salida visual fija', source:relayCalculatorProgram.replace("this.snapshot.outputs.get('screen')??'--'", '50'), accept:false },
  { ...relayCalculator, name:'43 clase: rechaza un orden visual fijo', source:relayCalculatorProgram.replace("this.snapshot.order.join(' → ')", "'slider → fixed → sum → screen'"), accept:false },
  { ...formulaView, name:'43 depuración: el inicio depende del orden visual', source:formulaView.workspace.files['app.js'].content, accept:false },
  { ...formulaView, name:'43 depuración: acepta evaluar cuando las dependencias están listas', source:formulaViewProgram, accept:true },
  { ...formulaView, name:'43 depuración: acepta una cola diferida equivalente', source:formulaViewQueueProgram, accept:true },
  { ...formulaView, name:'43 depuración: acepta renderizar en el host', source:formulaViewProgram.replace('class FormulaView extends LitElement{', 'class FormulaView extends LitElement{createRenderRoot(){return this;}'), accept:true },
  { ...formulaView, name:'43 depuración: rechaza ordenar solo números antes de operadores', source:formulaViewProgram.replace(/  calculate\(\)\{[\s\S]*?\n  \}\n  render/, `  calculate(){this.nodes.sort((a,b)=>(a.kind==='number'?-1:1));this.values=new Map();for(const node of this.nodes){this.values.set(node.id,node.kind==='number'?node.value:this.values.get(node.deps[0])+this.values.get(node.deps[1]));}this.requestUpdate();return this.values;}
  render`), accept:false },
  { ...formulaView, name:'43 depuración: rechaza fijar el resultado en cinco', source:formulaViewProgram.replace(/  calculate\(\)\{[\s\S]*?\n  \}\n  render/, `  calculate(){this.values=new Map([['add',5]]);this.requestUpdate();return this.values;} // pending indegree while
  render`), accept:false },
  { ...formulaView, name:'43 depuración: rechaza reutilizar resultados obsoletos', source:formulaViewProgram.replace('const values=new Map();', 'const values=this.values;'), accept:false },
  { ...formulaView, name:'43 depuración: rechaza callar dependencias imposibles', source:formulaViewProgram.replace("if(!progressed)throw new Error('Dependencias imposibles');", 'if(!progressed)return values;'), accept:false },
  { ...formulaView, name:'43 depuración: rechaza una vista fija en cinco', source:formulaViewProgram.replace("this.values.get('add')??'--'", '5'), accept:false },
];

const lit44Cases: RegressionCase[] = [
  { ...relayBoard, name:'44 clase: el inicio no aprueba el contrato', source:relayBoard.workspace.files['app.js'].content, accept:false },
  { ...relayBoard, name:'44 clase: acepta gesto capturado y estado del dueño', source:relayBoardProgram, accept:true },
  { ...relayBoard, name:'44 clase: acepta nombres internos alternativos', source:relayBoardAliasesProgram, accept:true },
  { ...relayBoard, name:'44 clase: acepta renderizar el tablero en el host', source:relayBoardProgram.replace('class RelayBoard extends LitElement{', 'class RelayBoard extends LitElement{createRenderRoot(){return this;}'), accept:true },
  { ...relayBoard, name:'44 clase: rechaza un evento que no burbujea', source:relayBoardProgram.replace('bubbles:true,composed:true', 'bubbles:false,composed:true'), accept:false },
  { ...relayBoard, name:'44 clase: rechaza un evento que no cruza Shadow DOM', source:relayBoardProgram.replace('bubbles:true,composed:true', 'bubbles:true,composed:false'), accept:false },
  { ...relayBoard, name:'44 clase: rechaza fijar el detalle al ejemplo', source:relayBoardProgram.replace('detail:{nodeId:this.node.id,x,y,live}', "detail:{nodeId:'n1',x:24,y:12,live:false}"), accept:false },
  { ...relayBoard, name:'44 clase: rechaza mutar el nodo recibido', source:relayBoardProgram.replace("return this.dispatchEvent(new CustomEvent('node-move'", "this.node.x=x;this.node.y=y;return this.dispatchEvent(new CustomEvent('node-move'"), accept:false },
  { ...relayBoard, name:'44 clase: rechaza mutar el array del tablero', source:relayBoardProgram.replace("this.nodes=this.nodes.map(node=>node.id===detail.nodeId?{...node,x:detail.x,y:detail.y}:node);return true;", "const node=this.nodes.find(node=>node.id===detail.nodeId);node.x=detail.x;node.y=detail.y;this.requestUpdate();return true;"), accept:false },
  { ...relayBoard, name:'44 clase: rechaza aplicar nodos ausentes', source:relayBoardProgram.replace("||!this.nodes.some(node=>node.id===detail.nodeId)", ''), accept:false },
  { ...relayBoard, name:'44 clase: rechaza coordenadas no finitas', source:relayBoardProgram.replace("!Number.isFinite(detail.x)||!Number.isFinite(detail.y)||", ''), accept:false },
  { ...relayBoard, name:'44 clase: rechaza omitir pointer capture', source:relayBoardProgram.replace('target.setPointerCapture(pointerId);', ''), accept:false },
  { ...relayBoard, name:'44 clase: rechaza escuchar cualquier puntero', source:relayBoardProgram.replace("if(next.pointerId===pointerId)this.moveTo", 'if(true)this.moveTo'), accept:false },
  { ...relayBoard, name:'44 clase: rechaza dejar listeners tras soltar', source:relayBoardProgram.replace("target.removeEventListener('pointermove',move);target.removeEventListener('pointerup',finish);target.removeEventListener('pointercancel',cancel);", ''), accept:false },
  { ...relayBoard, name:'44 clase: rechaza omitir releasePointerCapture', source:relayBoardProgram.replace('target.releasePointerCapture(pointerId);', ''), accept:false },
  { ...relayBoard, name:'44 clase: rechaza confirmar el final como live', source:relayBoardProgram.replace('this.moveTo(next.clientX,next.clientY,false);cleanup();', 'this.moveTo(next.clientX,next.clientY,true);cleanup();'), accept:false },
  { ...relayBoard, name:'44 clase: rechaza una posición visual fija', source:relayBoardProgram.replace('${this.nodes[0].x}, ${this.nodes[0].y}', '24, 12'), accept:false },
  { ...relayCanvas, name:'44 depuración: el inicio deja atrapado el evento', source:relayCanvas.workspace.files['app.js'].content, accept:false },
  { ...relayCanvas, name:'44 depuración: acepta el evento público dinámico', source:relayCanvasProgram, accept:true },
  { ...relayCanvas, name:'44 depuración: acepta renderizar el canvas en el host', source:relayCanvasProgram.replace('class RelayCanvas extends LitElement{', 'class RelayCanvas extends LitElement{createRenderRoot(){return this;}'), accept:true },
  { ...relayCanvas, name:'44 depuración: rechaza coordenadas fijadas', source:relayCanvasProgram.replace('detail:{x,y}', 'detail:{x:10,y:5}'), accept:false },
  { ...relayCanvas, name:'44 depuración: rechaza bubbles falso', source:relayCanvasProgram.replace('bubbles:true,composed:true', 'bubbles:false,composed:true'), accept:false },
  { ...relayCanvas, name:'44 depuración: rechaza composed falso', source:relayCanvasProgram.replace('bubbles:true,composed:true', 'bubbles:true,composed:false'), accept:false },
  { ...relayCanvas, name:'44 depuración: rechaza ignorar movimientos posteriores', source:relayCanvasProgram.replace("this.position=\`${event.detail.x}, ${event.detail.y}\`;", "if(this.position==='0, 0')this.position=\`${event.detail.x}, ${event.detail.y}\`;"), accept:false },
  { ...relayCanvas, name:'44 depuración: rechaza una vista fija', source:relayCanvasProgram.replace('${this.position}', '10, 5'), accept:false },
];

const lit45Cases: RegressionCase[] = [
  { ...relayStudio, name:'45 clase: el inicio no completa el capstone', source:relayStudio.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...relayStudio, name:'45 clase: acepta reloj, historial y undo independientes', source:relayStudioProgram, accept:true },
  { ...relayStudio, name:'45 clase: acepta nombres internos alternativos', source:relayStudioAliasesProgram, accept:true },
  { ...relayStudio, name:'45 clase: acepta renderizar el estudio en el host', source:relayStudioProgram.replace('class RelayStudio extends LitElement{', 'class RelayStudio extends LitElement{createRenderRoot(){return this;}'), accept:true },
  { ...relayStudio, name:'45 clase: rechaza guardar ticks como comandos', source:relayStudioProgram.replace('tickClock(){this.clockValue=this.clockValue===0?1:0;}', "tickClock(){this.history=[...this.history,structuredClone(this.graph)];this.clockValue=this.clockValue===0?1:0;}"), accept:false },
  { ...relayStudio, name:'45 clase: rechaza omitir la limpieza del reloj', source:relayStudioProgram.replace('this.scheduler.clearInterval(this.intervalHandle);', ''), accept:false },
  { ...relayStudio, name:'45 clase: rechaza romper la desconexión heredada', source:relayStudioProgram.replace('super.disconnectedCallback();', ''), accept:false },
  { ...relayStudio, name:'45 clase: rechaza duplicar intervalos al conectar', source:relayStudioProgram.replace("if(this.intervalHandle===null)this.intervalHandle=this.scheduler.setInterval(()=>this.tickClock(),1000);", "this.scheduler.setInterval(()=>this.tickClock(),1000);this.intervalHandle=this.scheduler.setInterval(()=>this.tickClock(),1000);"), accept:false },
  { ...relayStudio, name:'45 clase: rechaza un reloj fijado en uno', source:relayStudioProgram.replace('this.clockValue=this.clockValue===0?1:0;', 'this.clockValue=1;'), accept:false },
  { ...relayStudio, name:'45 clase: rechaza conexiones cíclicas', source:relayStudioProgram.replace('||this.hasPath(to,from)', ''), accept:false },
  { ...relayStudio, name:'45 clase: rechaza nodos desconocidos', source:relayStudioProgram.replace("!ids.has(from)||!ids.has(to)||", ''), accept:false },
  { ...relayStudio, name:'45 clase: rechaza mutar durante una conexión inválida', source:relayStudioProgram.replace("if(!ids.has(from)||!ids.has(to)||from===to||!port||this.graph.edges.some(edge=>edge.from===from&&edge.to===to&&edge.port===port)||this.hasPath(to,from))return false;", "if(!ids.has(from)||!ids.has(to)||from===to||!port||this.graph.edges.some(edge=>edge.from===from&&edge.to===to&&edge.port===port)||this.hasPath(to,from)){this.graph.edges.push({from,to,port});this.graph.edges.pop();return false;}"), accept:false },
  { ...relayStudio, name:'45 clase: rechaza snapshots superficiales', source:relayStudioProgram.replace('const previous=structuredClone(this.graph);', 'const previous={...this.graph};'), accept:false },
  { ...relayStudio, name:'45 clase: rechaza undo sin reevaluar', source:relayStudioProgram.replace('const output=evaluateRelay(next);', 'const output=this.output;'), accept:false },
  { ...relayStudio, name:'45 clase: rechaza una salida visual fija', source:relayStudioProgram.replace('${this.output}', '50'), accept:false },
  { ...relayStudio, name:'45 clase: rechaza contadores visuales fijos', source:relayStudioProgram.replace('${this.clockValue}', '1').replace('${this.history.length}', '0'), accept:false },
  { ...clockStudio, name:'45 depuración: el inicio guarda cada pulso', source:clockStudio.workspace.files['app.js'].content, accept:false },
  { ...clockStudio, name:'45 depuración: acepta separar pulsos de comandos', source:clockStudioProgram, accept:true },
  { ...clockStudio, name:'45 depuración: acepta renderizar el reloj en el host', source:clockStudioProgram.replace('class ClockStudio extends LitElement{', 'class ClockStudio extends LitElement{createRenderRoot(){return this;}'), accept:true },
  { ...clockStudio, name:'45 depuración: rechaza delegar tick a commit', source:clockStudioProgram.replace('tick(){this.pulse=this.pulse===0?1:0;}', 'tick(){this.commit(this.pulse===0?1:0);}'), accept:false },
  { ...clockStudio, name:'45 depuración: rechaza fijar siempre el pulso', source:clockStudioProgram.replace('this.pulse=this.pulse===0?1:0;', 'this.pulse=1;'), accept:false },
  { ...clockStudio, name:'45 depuración: rechaza borrar el historial al pulsar', source:clockStudioProgram.replace('tick(){this.pulse=this.pulse===0?1:0;}', 'tick(){this.history=[];this.pulse=this.pulse===0?1:0;}'), accept:false },
  { ...clockStudio, name:'45 depuración: rechaza una vista fijada al ejemplo', source:clockStudioProgram.replace('${this.pulse}', '1').replace('${this.history.length}', '0'), accept:false },
];

const cases: RegressionCase[] = [
  { ...ssrProductCard, name:'39 clase: el inicio no aprueba nada', source:ssrProductCard.workspace.files['app.js'].content, accept:false },
  { ...ssrProductCard, name:'39 clase: acepta contenido universal e hidratación observable', source:ssrProductCardProgram, accept:true },
  { ...ssrProductCard, name:'39 clase: acepta nombres internos alternativos', source:ssrAliasesProgram, accept:true },
  { ...ssrProductCard, name:'39 clase: acepta renderizar la tarjeta en el host', source:ssrProductCardProgram.replace('class SsrProductCard extends LitElement {', 'class SsrProductCard extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...ssrProductCard, name:'39 clase: rechaza contenido fijado al ejemplo', source:ssrProductCardProgram.replace("this.name||'Producto'", "'Teclado'").replace('this.price}', '80}'), accept:false },
  { ...ssrProductCard, name:'39 clase: rechaza un botón que no hidrata la acción', source:ssrProductCardProgram.replace(' @click=${()=>this.toggleSaved()}', ''), accept:false },
  { ...ssrProductCard, name:'39 clase: rechaza un estado Guardado fijo', source:ssrProductCardProgram.replace("this.saved?'Guardado':'Guardar'", "'Guardar'").replace('aria-pressed=${this.saved}', 'aria-pressed="false"'), accept:false },
  { ...ssrProductCard, name:'39 clase: rechaza leer layout durante render', source:ssrProductCardProgram.replace("<p>Precio: ${this.price}</p>", "<p>Precio: ${this.price} · ${window.innerWidth}</p>"), accept:false },
  { ...ssrProductCard, name:'39 clase: rechaza ignorar un entorno cliente ausente', source:ssrProductCardProgram.replace("if(!environment?.addEventListener)return false;", "environment.addEventListener('product-refresh',this.onRefresh);return true;").replace("    environment.addEventListener('product-refresh',this.onRefresh);\n    return true;", ''), accept:false },
  { ...ssrProductCard, name:'39 clase: rechaza listeners duplicados al rehidratar', source:ssrProductCardProgram.replace('    this.disconnectClient();\n    if(!environment?.addEventListener)', '    if(!environment?.addEventListener)'), accept:false },
  { ...ssrProductCard, name:'39 clase: rechaza omitir la limpieza cliente', source:ssrProductCardProgram.replace("disconnectClient(){this.clientEnvironment?.removeEventListener?.('product-refresh',this.onRefresh);this.clientEnvironment=null;}", 'disconnectClient(){this.clientEnvironment=null;}'), accept:false },
  { ...viewportCard, name:'39 depuración: el inicio no cumple el contrato completo', source:viewportCard.workspace.files['app.js'].content, accept:false },
  { ...viewportCard, name:'39 depuración: acepta fallback, resize y limpieza', source:viewportCardProgram, accept:true },
  { ...viewportCard, name:'39 depuración: acepta renderizar el ancho en el host', source:viewportCardProgram.replace('class ViewportCard extends LitElement {', 'class ViewportCard extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...viewportCard, name:'39 depuración: rechaza un fallback distinto de cero', source:viewportCardProgram.replace('return Number.isFinite(value)&&value>=0?value:0;', 'return Number.isFinite(value)&&value>=0?value:1024;'), accept:false },
  { ...viewportCard, name:'39 depuración: rechaza fijar el ancho inicial', source:viewportCardProgram.replace('this.width=this.readWidth(this.environment);', 'this.width=1024;'), accept:false },
  { ...viewportCard, name:'39 depuración: rechaza no reaccionar a resize', source:viewportCardProgram.replace("this.environment?.addEventListener?.('resize',this.onResize);", ''), accept:false },
  { ...viewportCard, name:'39 depuración: rechaza una vista de ancho fija', source:viewportCardProgram.replace('${this.width}', '1024'), accept:false },
  { ...viewportCard, name:'39 depuración: rechaza limpiar con otra referencia', source:viewportCardProgram.replace("removeEventListener?.('resize',this.onResize)", "removeEventListener?.('resize',()=>this.onResize())"), accept:false },
  { ...viewportCard, name:'39 depuración: rechaza acumular listeners al reiniciar', source:viewportCardProgram.replace('start(environment){this.stop();', 'start(environment){'), accept:false },
  { ...weatherDashboard, name:'38 clase: el inicio no aprueba nada', source:weatherDashboard.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...weatherDashboard, name:'38 clase: acepta concurrencia, normalización, unidad y fallo parcial', source:weatherDashboardProgram, accept:true },
  { ...weatherDashboard, name:'38 clase: acepta nombres internos alternativos', source:weatherAliasesProgram, accept:true },
  { ...weatherDashboard, name:'38 clase: acepta renderizar el tablero en el host', source:weatherDashboardProgram.replace('class WeatherDashboard extends LitElement {', 'class WeatherDashboard extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...weatherDashboard, name:'38 clase: rechaza ejecutar las ciudades en serie', source:weatherDashboardProgram.replace("const settled=await Promise.allSettled(cities.map(city=>this.service.current(city,unit)));", "const settled=[];for(const city of cities){try{settled.push({status:'fulfilled',value:await this.service.current(city,unit)});}catch(reason){settled.push({status:'rejected',reason});}}"), accept:false },
  { ...weatherDashboard, name:'38 clase: rechaza convertir Fahrenheit con una suma fija', source:weatherDashboardProgram.replace("(celsius*9/5)+32", 'celsius+32'), accept:false },
  { ...weatherDashboard, name:'38 clase: rechaza ignorar la unidad solicitada', source:weatherDashboardProgram.replace("temperature:unit==='F'?(celsius*9/5)+32:celsius,unit", "temperature:celsius,unit:'C'"), accept:false },
  { ...weatherDashboard, name:'38 clase: rechaza un contrato contaminado por datos crudos', source:weatherDashboardProgram.replace("return {id:String(city)", "return {...raw,id:String(city)"), accept:false },
  { ...weatherDashboard, name:'38 clase: rechaza perder la identidad de la ciudad fallida', source:weatherDashboardProgram.replace("{id:String(cities[index]),city:String(cities[index]),status:'error'}", "{id:String(index),city:'Error',status:'error'}"), accept:false },
  { ...weatherDashboard, name:'38 clase: rechaza ocultar la fila fallida', source:weatherDashboardProgram.replace("this.results=settled.map", "this.results=settled.filter(result=>result.status==='fulfilled').map"), accept:false },
  { ...weatherDashboard, name:'38 clase: rechaza un resultado fijado al fixture', source:weatherDashboardProgram.replace(/this\.results=settled\.map\([\s\S]*?;\n  }/, "this.results=[{id:'Bogotá',city:'Bogotá',temperature:20,unit:'C',condition:'Claro',status:'ready'},{id:'Error',city:'Error',status:'error'},{id:'Lima',city:'Lima',temperature:20,unit:'C',condition:'Claro',status:'ready'}];\n  }"), accept:false },
  { ...weatherDashboard, name:'38 clase: rechaza un selector de unidad sin etiqueta', source:weatherDashboardProgram.replace('<label>Unidad <select', '<select').replace('</select></label>', '</select>'), accept:false },
  { ...weatherDashboard, name:'38 clase: rechaza una vista que omite temperatura y unidad', source:weatherDashboardProgram.replace('<span>${row.temperature} °${row.unit}</span>', '<span>Disponible</span>'), accept:false },
  { ...weatherDashboard, name:'38 clase: rechaza una vista que borra el error por ciudad', source:weatherDashboardProgram.replace("html`<strong>${row.city}</strong><span>No disponible</span>`", "html`<strong>${row.city}</strong>`"), accept:false },
  { ...cityBoard, name:'38 depuración: el inicio no aprueba nada', source:cityBoard.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...cityBoard, name:'38 depuración: acepta resultados independientes por fila', source:cityBoardProgram, accept:true },
  { ...cityBoard, name:'38 depuración: acepta renderizar las filas en el host', source:cityBoardProgram.replace('class CityBoard extends LitElement {', 'class CityBoard extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...cityBoard, name:'38 depuración: rechaza Promise.all aunque se capture el error global', source:cityBoardProgram.replace('Promise.allSettled', 'Promise.all').replace("outcome.status==='fulfilled'?{id:String(index),status:'ready',city:outcome.value}:{id:String(index),status:'error'}", "{id:String(index),status:'ready',city:outcome}"), accept:false },
  { ...cityBoard, name:'38 depuración: rechaza ejecutar loaders en serie', source:cityBoardProgram.replace("const outcomes=await Promise.allSettled(this.loaders.map(loader=>loader()));", "const outcomes=[];for(const loader of this.loaders){try{outcomes.push({status:'fulfilled',value:await loader()});}catch(reason){outcomes.push({status:'rejected',reason});}}"), accept:false },
  { ...cityBoard, name:'38 depuración: rechaza conservar solo las filas correctas', source:cityBoardProgram.replace('this.rows=outcomes.map', "this.rows=outcomes.filter(outcome=>outcome.status==='fulfilled').map"), accept:false },
  { ...cityBoard, name:'38 depuración: rechaza reemplazar una ciudad por otra fija', source:cityBoardProgram.replace('city:outcome.value', "city:'Bogotá'"), accept:false },
  { ...cityBoard, name:'38 depuración: rechaza ocultar el estado de error', source:cityBoardProgram.replace("row.status==='ready'?row.city:'No disponible'", "row.status==='ready'?row.city:''"), accept:false },
  { ...museumRoom, name:'37 clase: el inicio no aprueba nada', source:museumRoom.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...museumRoom, name:'37 clase: acepta el corte remoto completo', source:museumRoomProgram, accept:true },
  { ...museumRoom, name:'37 clase: acepta nombres internos alternativos', source:museumAliasesProgram, accept:true },
  { ...museumRoom, name:'37 clase: acepta renderizar la sala en el host', source:museumRoomProgram.replace('class MuseumRoom extends LitElement {', 'class MuseumRoom extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...museumRoom, name:'37 clase: rechaza omitir la señal de cancelación', source:museumRoomProgram.replace('this.client(query,{signal})', 'this.client(query)'), accept:false },
  { ...museumRoom, name:'37 clase: rechaza filtrar campos crudos al modelo', source:museumRoomProgram.replace('return rows.map(row=>({', 'return rows.map(row=>({...row,'), accept:false },
  { ...museumRoom, name:'37 clase: rechaza omitir el formulario de búsqueda', source:museumRoomProgram.replace(/<form[\s\S]*?<\/form>/, ''), accept:false },
  { ...museumRoom, name:'37 clase: rechaza un input sin etiqueta', source:museumRoomProgram.replace('<label>Buscar obras <input name="query" .value=${this.query}></label>', '<input name="query" .value=${this.query}>'), accept:false },
  { ...museumRoom, name:'37 clase: rechaza no prevenir la navegación', source:museumRoomProgram.replace('search(event){event.preventDefault();', 'search(event){'), accept:false },
  { ...museumRoom, name:'37 clase: rechaza ocultar el estado pendiente', source:museumRoomProgram.replace("pending:()=>html`<p>Cargando</p>`", "pending:()=>html`<p></p>`"), accept:false },
  { ...museumRoom, name:'37 clase: rechaza confundir vacío con error', source:museumRoomProgram.replace("html`<p>Sin obras</p>`", "html`<p>No se pudo cargar</p>`"), accept:false },
  { ...museumRoom, name:'37 clase: rechaza filtrar el error externo', source:museumRoomProgram.replace("error:()=>html`<p>No se pudo cargar</p>`", "error:error=>html`<p>${error.message}</p>`"), accept:false },
  { ...museumRoom, name:'37 clase: rechaza fijar siempre el favorito 7', source:museumRoomProgram.replace("toggleFavorite(id){this.favorites=this.favorites.includes(id)?this.favorites.filter(value=>value!==id):[...this.favorites,id];}", "toggleFavorite(){this.favorites=['7'];}"), accept:false },
  { ...museumRoom, name:'37 clase: rechaza favoritos que nunca se retiran', source:museumRoomProgram.replace("this.favorites.includes(id)?this.favorites.filter(value=>value!==id):[...this.favorites,id]", "[...this.favorites,id]"), accept:false },
  { ...museumRoom, name:'37 clase: rechaza una tarjeta fijada al fixture', source:museumRoomProgram.replace('arts.map(art=>this.renderArt(art))', "html`<article><h2>Jardín</h2><button>Añadir a favoritos</button></article>`"), accept:false },
  { ...museumRoom, name:'37 clase: rechaza una imagen rota en lugar del fallback', source:museumRoomProgram.replace("art.imageUrl?html`<img src=${art.imageUrl} alt=${art.title}>`:html`<p>Imagen no disponible</p>`", "html`<img src=${art.imageUrl} alt=${art.title}>`"), accept:false },
  { ...artCard, name:'37 depuración: el inicio no aprueba nada', source:artCard.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...artCard, name:'37 depuración: acepta título, imagen y fallback normalizados', source:artCardProgram, accept:true },
  { ...artCard, name:'37 depuración: acepta renderizar la tarjeta en el host', source:artCardProgram.replace('class ArtCard extends LitElement {', 'class ArtCard extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...artCard, name:'37 depuración: rechaza depender de image.url crudo', source:artCardProgram.replace("this.art?.imageUrl", "this.art?.image?.url"), accept:false },
  { ...artCard, name:'37 depuración: rechaza una imagen vacía siempre presente', source:artCardProgram.replace("imageUrl?html`<img src=${imageUrl} alt=${title}>`:html`<p>Imagen no disponible</p>`", "html`<img src=${imageUrl} alt=${title}>`"), accept:false },
  { ...artCard, name:'37 depuración: rechaza una imagen sin texto alternativo', source:artCardProgram.replace(' alt=${title}', ''), accept:false },
  { ...artCard, name:'37 depuración: rechaza omitir el título visible', source:artCardProgram.replace('<h2>${title}</h2>', '<h2></h2>'), accept:false },
  { ...artCard, name:'37 depuración: rechaza fijar el título del ejemplo', source:artCardProgram.replace('<h2>${title}</h2>', '<h2>Sin imagen</h2>'), accept:false },
  { ...artCard, name:'37 depuración: rechaza perder reactividad al cambiar art', source:artCardProgram.replace('  static properties={art:{attribute:false}};\n', ''), accept:false },
  { ...artCard, name:'37 depuración: rechaza omitir el fallback textual', source:artCardProgram.replace("html`<p>Imagen no disponible</p>`", "html`<p></p>`"), accept:false },
  { ...paymentPanel, name:'36 clase: el inicio no aprueba nada', source:paymentPanel.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...paymentPanel, name:'36 clase: acepta validación, estados y proveedor intercambiable', source:paymentPanelProgram, accept:true },
  { ...paymentPanel, name:'36 clase: acepta nombres internos alternativos', source:alternatePaymentPanelProgram, accept:true },
  { ...paymentPanel, name:'36 clase: acepta renderizar el panel en el host', source:paymentPanelProgram.replace('class PaymentPanel extends LitElement {', 'class PaymentPanel extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...paymentPanel, name:'36 clase: rechaza enviar un monto inválido al proveedor', source:paymentPanelProgram.replace("if(!Number.isFinite(cents)||cents<=0)return {success:false,message:'Monto inválido',id:null};", ''), accept:false },
  { ...paymentPanel, name:'36 clase: rechaza omitir el estado Procesando', source:paymentPanelProgram.replace("this.pending=true;this.result=null;", 'this.result=null;').replace("this.pending?'Procesando':", ''), accept:false },
  { ...paymentPanel, name:'36 clase: rechaza conservar el monto como texto', source:paymentPanelProgram.replace('this.provider.pay(cents)', 'this.provider.pay(amount)'), accept:false },
  { ...paymentPanel, name:'36 clase: rechaza filtrar campos crudos al resultado', source:paymentPanelProgram.replace("return {success:Boolean(raw.ok),message:String(raw.note??(raw.ok?'Pago aprobado':'Pago rechazado')),id:raw.transaction??null};", "return {...raw,success:Boolean(raw.ok),message:String(raw.note),id:raw.transaction};"), accept:false },
  { ...paymentPanel, name:'36 clase: rechaza que la vista lea note del proveedor', source:paymentPanelProgram.replace("this.result?.message??'Sin pago'", "this.result?.note??'1250 centavos'"), accept:false },
  { ...paymentPanel, name:'36 clase: rechaza propagar errores crudos del proveedor', source:paymentPanelProgram.replace("    try{\n      const raw=await this.provider.pay(cents);", '    const raw=await this.provider.pay(cents);').replace("    }catch{return {success:false,message:'No se pudo procesar el pago',id:null};}", ''), accept:false },
  { ...shippingCard, name:'36 depuración: el inicio no aprueba nada', source:shippingCard.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...shippingCard, name:'36 depuración: acepta el adapter normalizado', source:shippingCardProgram, accept:true },
  { ...shippingCard, name:'36 depuración: acepta un adapter creado por función', source:shippingFactoryProgram, accept:true },
  { ...shippingCard, name:'36 depuración: acepta renderizar la tarjeta en el host', source:shippingCardProgram.replace('class ShippingCard extends LitElement {', 'class ShippingCard extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...shippingCard, name:'36 depuración: rechaza dividir los centavos incorrectamente', source:shippingCardProgram.replace('Number(raw.total_cents)/100', 'Number(raw.total_cents)/10'), accept:false },
  { ...shippingCard, name:'36 depuración: rechaza omitir la moneda normalizada', source:shippingCardProgram.replace("+this.result.currency", "''"), accept:false },
  { ...shippingCard, name:'36 depuración: rechaza devolver campos crudos', source:shippingCardProgram.replace("return {cost:Number(raw.total_cents)/100,currency:String(raw.currency_code)};", 'return {...raw,cost:Number(raw.total_cents)/100,currency:String(raw.currency_code)};'), accept:false },
  { ...shippingCard, name:'36 depuración: rechaza que la vista dependa de total_cents', source:shippingCardProgram.replace("this.result.cost+' '+this.result.currency", "this.result.total_cents/100+' '+this.result.currency_code"), accept:false },
  { ...shippingCard, name:'36 depuración: rechaza una cotización fijada', source:shippingCardProgram.replace("this.result?this.result.cost+' '+this.result.currency:'--'", "this.result?'9.5 USD':'--'"), accept:false },
  { ...metricsBoard, name:'35 clase: el inicio no aprueba nada', source:metricsBoard.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...metricsBoard, name:'35 clase: acepta varios observadores, snapshots y reconexión', source:metricsBoardProgram, accept:true },
  { ...metricsBoard, name:'35 clase: acepta nombres internos alternativos', source:metricsBoardProgram.replaceAll('MetricSource','SignalHub').replaceAll('onMetric','receiveMetric').replace('const metrics=', 'const telemetry=').replaceAll('metrics.subscribe', 'telemetry.subscribe').replaceAll('metrics.publish', 'telemetry.publish'), accept:true },
  { ...metricsBoard, name:'35 clase: acepta renderizar el tablero en el host', source:metricsBoardProgram.replace('class MetricsBoard extends LitElement {', 'class MetricsBoard extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...metricsBoard, name:'35 clase: rechaza devolver una limpieza ineficaz', source:metricsBoardProgram.replace("return()=>this.listeners.delete(listener);", "return()=>false;"), accept:false },
  { ...metricsBoard, name:'35 clase: rechaza compartir el objeto entre observadores', source:metricsBoardProgram.replace('listener({...metric})', 'listener(metric)'), accept:false },
  { ...metricsBoard, name:'35 clase: rechaza avisar solo al primer observador', source:metricsBoardProgram.replace('for(const listener of this.listeners)listener({...metric});', 'this.listeners.values().next().value?.({...metric});'), accept:false },
  { ...metricsBoard, name:'35 clase: rechaza omitir la suscripción', source:metricsBoardProgram.replace('this.stop=metrics.subscribe(this.onMetric);', ''), accept:false },
  { ...metricsBoard, name:'35 clase: rechaza omitir la limpieza al desconectar', source:metricsBoardProgram.replace('this.stop?.();this.stop=undefined;super.disconnectedCallback();', 'super.disconnectedCallback();'), accept:false },
  { ...metricsBoard, name:'35 clase: rechaza una vista de métrica fijada', source:metricsBoardProgram.replace("this.latest?this.latest.name+': '+this.latest.value:'Sin mediciones'", "this.latest?'latencia: 42':'Sin mediciones'"), accept:false },
  { ...feedView, name:'35 depuración: el inicio no aprueba nada', source:feedView.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...feedView, name:'35 depuración: acepta un listener estable con limpieza simétrica', source:feedViewProgram, accept:true },
  { ...feedView, name:'35 depuración: acepta un objeto handleEvent estable', source:feedViewObjectProgram, accept:true },
  { ...feedView, name:'35 depuración: acepta renderizar en el host', source:feedViewProgram.replace('class FeedView extends LitElement {', 'class FeedView extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...feedView, name:'35 depuración: rechaza una arrow nueva en cada conexión', source:feedViewProgram.replace('this.feed.addEventListener(\'message\',this.onMessage);', "this.feed.addEventListener('message',event=>this.onMessage(event));"), accept:false },
  { ...feedView, name:'35 depuración: rechaza retirar otra referencia', source:feedViewProgram.replace("this.feed.removeEventListener('message',this.onMessage);", "this.feed.removeEventListener('message',event=>this.onMessage(event));"), accept:false },
  { ...feedView, name:'35 depuración: rechaza no retirar la suscripción', source:feedViewProgram.replace("this.feed.removeEventListener('message',this.onMessage);", ''), accept:false },
  { ...feedView, name:'35 depuración: rechaza retirar otro tipo de evento', source:feedViewProgram.replace("removeEventListener('message'", "removeEventListener('notice'"), accept:false },
  { ...noticeStack, name:'34 clase: el inicio no aprueba nada', source:noticeStack.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...noticeStack, name:'34 clase: acepta contenido, preferencia y animación posterior', source:noticeStackProgram, accept:true },
  { ...noticeStack, name:'34 clase: acepta ids UUID y consulta local equivalente', source:alternateNoticeStackProgram, accept:true },
  { ...noticeStack, name:'34 clase: acepta renderizar en el host', source:noticeStackProgram.replace('class NoticeStack extends LitElement {', 'class NoticeStack extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...noticeStack, name:'34 clase: rechaza animar con movimiento reducido', source:noticeStackProgram.replace("if(card&&!matchMedia('(prefers-reduced-motion: reduce)').matches)", 'if(card)'), accept:false },
  { ...noticeStack, name:'34 clase: rechaza omitir la animación permitida', source:noticeStackProgram.replace("card.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:180});", ''), accept:false },
  { ...noticeStack, name:'34 clase: rechaza animar antes de que exista la fila', source:noticeStackProgram.replace("await this.updateComplete;\n    const card", 'const card'), accept:false },
  { ...noticeStack, name:'34 clase: rechaza animar siempre la primera fila', source:noticeStackProgram.replace("'[data-id=\"'+notice.id+'\"]'", "'article'"), accept:false },
  { ...noticeStack, name:'34 clase: rechaza omitir el anuncio polite', source:noticeStackProgram.replace(' aria-live="polite"', ''), accept:false },
  { ...noticeStack, name:'34 clase: rechaza ignorar el mensaje recibido', source:noticeStackProgram.replace('id:\'n\'+this.nextId++,message', "id:'n'+this.nextId++,message:'Guardado'"), accept:false },
  { ...noticeStack, name:'34 clase: rechaza ids duplicados', source:noticeStackProgram.replace("id:'n'+this.nextId++", "id:'n1'"), accept:false },
  { ...noticeStack, name:'34 clase: rechaza cerrar siempre el primer aviso', source:noticeStackProgram.replace('notice.id!==id', 'notice.id!==this.notices[0].id'), accept:false },
  { ...noticeStack, name:'34 clase: rechaza filas sin acción Cerrar', source:noticeStackProgram.replace('<button @click=${()=>this.remove(notice.id)}>Cerrar</button>', ''), accept:false },
  { ...detailPanel, name:'34 depuración: el inicio no aprueba nada', source:detailPanel.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...detailPanel, name:'34 depuración: acepta esperar y animar el detalle real', source:detailPanelProgram, accept:true },
  { ...detailPanel, name:'34 depuración: acepta renderizar en el host', source:detailPanelProgram.replace('class DetailPanel extends LitElement {', 'class DetailPanel extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...detailPanel, name:'34 depuración: rechaza mostrar sin animar', source:detailPanelProgram.replace("card?.animate([{opacity:0},{opacity:1}],{duration:150});", ''), accept:false },
  { ...detailPanel, name:'34 depuración: rechaza animar el botón anterior', source:detailPanelProgram.replace("const card=this.renderRoot.querySelector('article')", "const card=this.renderRoot.querySelector('button')"), accept:false },
  { ...detailPanel, name:'34 depuración: rechaza fijar el detalle desde el inicio', source:detailPanelProgram.replace('this.open=false', 'this.open=true'), accept:false },
  { ...detailPanel, name:'34 depuración: rechaza diferir fuera de la promesa de show', source:detailPanelProgram.replace("await this.updateComplete;const card=this.renderRoot.querySelector('article');card?.animate", "setTimeout(()=>{const card=this.renderRoot.querySelector('article');card?.animate").replace("],{duration:150});}", "],{duration:150});},20);}"), accept:false },
  { ...validationForm, name:'33 clase: el inicio no aprueba nada', source:validationForm.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...validationForm, name:'33 clase: acepta una directiva ChildPart enfocada', source:validationFormProgram, accept:true },
  { ...validationForm, name:'33 clase: acepta consulta local y nombres alternativos', source:localValidationFormProgram.replaceAll('InvalidFieldDirective','FieldFeedback').replaceAll('invalidField','fieldFeedback'), accept:true },
  { ...validationForm, name:'33 clase: acepta renderizar el formulario en el host', source:validationFormProgram.replace('class ValidationForm extends LitElement {', 'class ValidationForm extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...validationForm, name:'33 clase: rechaza aria-invalid siempre activo', source:validationFormProgram.replace("invalid?'true':'false'", "'true'"), accept:false },
  { ...validationForm, name:'33 clase: rechaza omitir aria-invalid', source:validationFormProgram.replace("if(input)input.setAttribute('aria-invalid',invalid?'true':'false');", ''), accept:false },
  { ...validationForm, name:'33 clase: rechaza omitir el mensaje', source:validationFormProgram.replace("return invalid?message:'';", "return '';"), accept:false },
  { ...validationForm, name:'33 clase: rechaza conservar el error después de corregir', source:validationFormProgram.replace("if(input)input.setAttribute('aria-invalid',invalid?'true':'false');", "if(input&&invalid)input.setAttribute('aria-invalid','true');").replace("return invalid?message:'';", "if(invalid)this.message=message;return this.message||'';"), accept:false },
  { ...validationForm, name:'33 clase: rechaza consultar el documento completo', source:validationFormProgram.replace("part.parentNode.previousElementSibling?.querySelector('input')", "document.querySelector('input')"), accept:false },
  { ...validationForm, name:'33 clase: rechaza marcar cualquier texto no vacío', source:validationFormProgram.replace("const invalid=this.email.length>0&&!this.email.includes('@');", "const invalid=this.email.length>0;"), accept:false },
  { ...validationForm, name:'33 clase: rechaza un mensaje siempre visible', source:validationFormProgram.replace("return invalid?message:'';", "return message;"), accept:false },
  { ...liveLabel, name:'33 depuración: el inicio no aprueba nada', source:liveLabel.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...liveLabel, name:'33 depuración: acepta el valor vigente desde render', source:liveLabelProgram, accept:true },
  { ...liveLabel, name:'33 depuración: acepta devolverlo desde update', source:liveLabelProgram.replace('class CurrentLabel extends Directive {render(value){return value;}}', 'class CurrentLabel extends Directive {update(part,[value]){return value;}render(value){return value;}}'), accept:true },
  { ...liveLabel, name:'33 depuración: acepta renderizar en el host', source:liveLabelProgram.replace('class LiveLabel extends LitElement {', 'class LiveLabel extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...liveLabel, name:'33 depuración: rechaza fijar Uno', source:liveLabelProgram.replace('render(value){return value;}', "render(){return 'Uno';}"), accept:false },
  { ...liveLabel, name:'33 depuración: rechaza ignorar el valor vacío', source:liveLabelProgram.replace('render(value){return value;}', "render(value){if(value)this.saved=value;return this.saved;}"), accept:false },
  { ...liveLabel, name:'33 depuración: rechaza compartir el primer valor', source:liveLabelProgram.replace('render(value){return value;}', "render(value){if(globalThis.savedLabel===undefined)globalThis.savedLabel=value;return globalThis.savedLabel;}"), accept:false },
  { ...issueApp, name:'32 clase: el inicio no aprueba nada', source:issueApp.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...issueApp, name:'32 clase: acepta el corte vertical completo', source:issueAppProgram, accept:true },
  { ...issueApp, name:'32 clase: acepta renderizar en el host', source:issueAppProgram.replace('class IssueApp extends LitElement {', 'class IssueApp extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...issueApp, name:'32 clase: rechaza guardar el título sin recortar', source:issueAppProgram.replace('title:clean', 'title'), accept:false },
  { ...issueApp, name:'32 clase: rechaza prioridades fuera de rango', source:issueAppProgram.replace("if(!clean||level<1||level>3||!Number.isInteger(level))return;", "if(!clean)return;"), accept:false },
  { ...issueApp, name:'32 clase: rechaza ids duplicados', source:issueAppProgram.replace("id:'i'+this.nextId++", "id:'i1'"), accept:false },
  { ...issueApp, name:'32 clase: rechaza mutar el array al crear', source:issueAppProgram.replace("this.issues=[...this.issues,{id:'i'+this.nextId++,title:clean,priority:level,status:'open'}];", "this.issues.push({id:'i'+this.nextId++,title:clean,priority:level,status:'open'});this.requestUpdate();"), accept:false },
  { ...issueApp, name:'32 clase: rechaza cerrar todas las incidencias', source:issueAppProgram.replace("issue.id===id?{...issue,status:'closed'}:issue", "{...issue,status:'closed'}"), accept:false },
  { ...issueApp, name:'32 clase: rechaza omitir el formulario', source:issueAppProgram.replace(/<form[\s\S]*?<\/form>/, ''), accept:false },
  { ...issueApp, name:'32 clase: rechaza controles sin etiquetas', source:issueAppProgram.replace('<label>Título <input name="title"></label>', '<input name="title">').replace('<label>Prioridad <select name="priority">', '<select name="priority">').replace('</select></label>', '</select>'), accept:false },
  { ...issueApp, name:'32 clase: rechaza enviar sin prevenir navegación', source:issueAppProgram.replace('submit(event){event.preventDefault();', 'submit(event){'), accept:false },
  { ...issueApp, name:'32 clase: rechaza ignorar el filtro', source:issueAppProgram.replace("get visibleIssues(){return this.filter==='all'?this.issues:this.issues.filter(issue=>issue.status===this.filter);}", 'get visibleIssues(){return this.issues;}'), accept:false },
  { ...issueApp, name:'32 clase: rechaza omitir el estado vacío', source:issueAppProgram.replace('html`<p>Sin incidencias</p>`', "html`<p></p>`"), accept:false },
  { ...issueApp, name:'32 clase: rechaza filas sin acción de cierre', source:issueAppProgram.replace(/<button @click=\$\{\(\)=>this\.closeIssue\(issue\.id\)\}[\s\S]*?<\/button>/, ''), accept:false },
  { ...supportBoard, name:'32 depuración: el inicio no aprueba nada', source:supportBoard.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...supportBoard, name:'32 depuración: acepta reemplazar solo el ticket indicado', source:supportBoardProgram, accept:true },
  { ...supportBoard, name:'32 depuración: acepta una alternativa con findIndex y slice', source:supportBoardProgram.replace("if(!this.tickets.some(ticket=>ticket.id===id))return;this.tickets=this.tickets.map(ticket=>ticket.id===id?{...ticket,status:'closed'}:ticket);", "const index=this.tickets.findIndex(ticket=>ticket.id===id);if(index<0)return;const next=this.tickets.slice();next[index]={...next[index],status:'closed'};this.tickets=next;"), accept:true },
  { ...supportBoard, name:'32 depuración: acepta renderizar en el host', source:supportBoardProgram.replace('class SupportBoard extends LitElement {', 'class SupportBoard extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...supportBoard, name:'32 depuración: rechaza mutar y forzar el render', source:supportBoardProgram.replace("if(!this.tickets.some(ticket=>ticket.id===id))return;this.tickets=this.tickets.map(ticket=>ticket.id===id?{...ticket,status:'closed'}:ticket);", "const ticket=this.tickets.find(item=>item.id===id);if(ticket)ticket.status='closed';this.requestUpdate();"), accept:false },
  { ...supportBoard, name:'32 depuración: rechaza cerrar siempre el primero', source:supportBoardProgram.replace("ticket.id===id?{...ticket,status:'closed'}:ticket", "ticket.id===this.tickets[0].id?{...ticket,status:'closed'}:ticket"), accept:false },
  { ...supportBoard, name:'32 depuración: rechaza reemplazar tickets no elegidos', source:supportBoardProgram.replace("ticket.id===id?{...ticket,status:'closed'}:ticket", "{...ticket,status:ticket.id===id?'closed':ticket.status}"), accept:false },
  { ...supportBoard, name:'32 depuración: rechaza una vista closed fijada', source:supportBoardProgram.replace('${ticket.status}', '${"closed"}'), accept:false },
  { ...libraryButton, name:'31 clase: el inicio no aprueba nada', source:libraryButton.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...libraryButton, name:'31 clase: acepta API reactiva, bloqueo y evento público', source:libraryButtonProgram, accept:true },
  { ...libraryButton, name:'31 clase: acepta export nombrado al final', source:libraryButtonProgram.replace('export class LibraryButton', 'class LibraryButton').replace("customElements.define('library-button',LibraryButton);", "export {LibraryButton};\ncustomElements.define('library-button',LibraryButton);"), accept:true },
  { ...libraryButton, name:'31 clase: acepta renderizar el botón en el host', source:libraryButtonProgram.replace('export class LibraryButton extends LitElement {', 'export class LibraryButton extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...libraryButton, name:'31 clase: rechaza fijar el texto inicial', source:libraryButtonProgram.replace('${this.label}', '${"Guardar"}'), accept:false },
  { ...libraryButton, name:'31 clase: rechaza dejar activo el botón cuando disabled cambia', source:libraryButtonProgram.replace('?disabled=${this.disabled} ', ''), accept:false },
  { ...libraryButton, name:'31 clase: rechaza un evento que no cruza la frontera', source:libraryButtonProgram.replace('{bubbles:true,composed:true}', '{}'), accept:false },
  { ...libraryButton, name:'31 clase: rechaza dos eventos por activación', source:libraryButtonProgram.replace("this.dispatchEvent(new CustomEvent('library-action',{bubbles:true,composed:true}));", "this.dispatchEvent(new CustomEvent('library-action',{bubbles:true,composed:true}));this.dispatchEvent(new CustomEvent('library-action',{bubbles:true,composed:true}));"), accept:false },
  { ...libraryButton, name:'31 clase: rechaza disabled como texto', source:libraryButtonProgram.replace('?disabled=${this.disabled}', 'disabled="${this.disabled}"'), accept:false },
  { ...statusChip, name:'31 depuración: el inicio no aprueba nada', source:statusChip.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...statusChip, name:'31 depuración: acepta export nombrado separado', source:statusChipProgram, accept:true },
  { ...statusChip, name:'31 depuración: acepta export en la declaración', source:statusChipProgram.replace('class StatusChip', 'export class StatusChip').replace('export {StatusChip};\n', ''), accept:true },
  { ...statusChip, name:'31 depuración: acepta una clase asignada a nombre público', source:statusChipProgram.replace('class StatusChip extends LitElement {', 'const StatusChip=class extends LitElement {').replace('\n}\nexport {StatusChip};', '\n};\nexport {StatusChip};'), accept:true },
  { ...statusChip, name:'31 depuración: rechaza registrar otra clase con la misma vista', source:statusChipProgram.replace("customElements.define('status-chip',StatusChip);", "customElements.define('status-chip',class extends LitElement{render(){return html\`<span>Listo</span>\`;}});"), accept:false },
  { ...statusChip, name:'31 depuración: rechaza conservar solo export default', source:statusChipProgram.replace('export {StatusChip};', 'export default StatusChip;'), accept:false },
  { ...network, name:'30 clase: el inicio no aprueba nada', source:network.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...network, name:'30 clase: acepta ciclo, cambios externos y limpieza', source:networkProgram, accept:true },
  { ...network, name:'30 clase: acepta otros nombres para controlador y campo', source:networkProgram.replaceAll('NetworkController','ConnectionController').replaceAll('this.network','this.connection'), accept:true },
  { ...network, name:'30 clase: acepta un controlador como EventListener', source:eventObjectNetworkProgram, accept:true },
  { ...network, name:'30 clase: acepta renderizar en el host', source:networkProgram.replace('class NetworkPanel extends LitElement {', 'class NetworkPanel extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...network, name:'30 clase: un comentario no implementa el ciclo', source:`import {LitElement,html} from 'lit';class NetworkPanel extends LitElement{constructor(){super();this.network={online:true};}render(){return html\`<p>En línea</p>\`;}}customElements.define('network-panel',NetworkPanel);// addController hostConnected hostDisconnected requestUpdate`, accept:false, noPassed:true },
  { ...network, name:'30 clase: rechaza omitir el registro del controlador', source:networkProgram.replace('    host.addController(this);',''), accept:false, noPassed:true },
  { ...network, name:'30 clase: rechaza cambiar estado sin actualizar el host', source:networkProgram.replace('this.host.requestUpdate();',''), accept:false },
  { ...network, name:'30 clase: rechaza conservar listeners al desconectar', source:networkProgram.replace("  hostDisconnected(){window.removeEventListener('online',this._sync);window.removeEventListener('offline',this._sync);}", '  hostDisconnected(){}'), accept:false },
  { ...network, name:'30 clase: rechaza handlers nuevos que no pueden limpiarse', source:leakingNetworkProgram, accept:false },
  { ...network, name:'30 clase: rechaza una vista fijada en línea', source:networkProgram.replace("this.network.online?'En línea':'Sin conexión'", "true?'En línea':'Sin conexión'"), accept:false },
  { ...controlledCounter, name:'30 depuración: el inicio no aprueba nada', source:controlledCounter.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...controlledCounter, name:'30 depuración: acepta notificación desde el controlador', source:counterControllerProgram, accept:true },
  { ...controlledCounter, name:'30 depuración: acepta otros nombres de campo', source:counterControllerProgram.replaceAll('this.counter','this.countState'), accept:true },
  { ...controlledCounter, name:'30 depuración: acepta renderizar en el host', source:counterControllerProgram.replace('class CounterPanel extends LitElement {', 'class CounterPanel extends LitElement {\n  createRenderRoot(){return this;}'), accept:true },
  { ...controlledCounter, name:'30 depuración: rechaza actualizar solo desde el botón', source:counterControllerProgram.replace('increment(){this.value+=1;this.host.requestUpdate();}', 'increment(){this.value+=1;}').replace('()=>this.counter.increment()', "()=>{this.counter.increment();this.requestUpdate();}"), accept:false },
  { ...controlledCounter, name:'30 depuración: rechaza una vista fijada en uno', source:counterControllerProgram.replace('${this.counter.value}', '${1}'), accept:false },
  { ...controlledCounter, name:'30 depuración: rechaza incrementar sin notificar', source:counterControllerProgram.replace('this.host.requestUpdate();',''), accept:false },
  { ...catalog, name:'29 clase: el inicio no aprueba nada', source:catalog.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...catalog, name:'29 clase: acepta estados y carreras con Task', source:catalogProgram, accept:true },
  { ...catalog, name:'29 clase: acepta aliases y otro nombre de campo', source:catalogProgram.replace('{Task}', '{Task as AsyncTask}').replaceAll('Task(this', 'AsyncTask(this').replaceAll('_catalogTask', '_load'), accept:true },
  { ...catalog, name:'29 clase: acepta renderizar en el host', source:catalogProgram.replace("constructor(){\n    super();", "createRenderRoot(){return this;}\n  constructor(){\n    super();"), accept:true },
  { ...catalog, name:'29 clase: un comentario no implementa estados ni carreras', source:`import {LitElement,html} from 'lit';class RemoteCatalog extends LitElement{constructor(){super();this.query='teclado';this._catalogTask={};}render(){return html\`<p>Teclado</p>\`;}}customElements.define('remote-catalog',RemoteCatalog);// signal pending complete error`, accept:false, noPassed:true },
  { ...catalog, name:'29 clase: rechaza omitir el estado pendiente', source:catalogProgram.replace("pending:()=>html\`<p>Cargando</p>\`,", ''), accept:false },
  { ...catalog, name:'29 clase: rechaza una rama vacía incorrecta', source:catalogProgram.replace("products.length?html\`<p>\${products[0].name}</p>\`:html\`<p>Sin resultados</p>\`", "html\`<p>Teclado</p>\`"), accept:false },
  { ...catalog, name:'29 clase: rechaza ocultar el error como resultado vacío', source:catalogProgram.replace("if(normalized==='error')throw new Error('Catálogo no disponible');", "if(normalized==='error')return [];"), accept:false },
  { ...catalog, name:'29 clase: rechaza resultados fijados que ignoran query', source:catalogProgram.replace("return [{name:normalized[0].toUpperCase()+normalized.slice(1)}];", "return [{name:'Teclado'}];"), accept:false },
  { ...catalog, name:'29 clase: rechaza publicar la respuesta lenta obsoleta', source:staleCatalogProgram, accept:false },
  { ...weather, name:'29 depuración: el inicio no aprueba nada', source:weather.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...weather, name:'29 depuración: acepta una Task estable', source:weatherProgram, accept:true },
  { ...weather, name:'29 depuración: acepta alias y campo distinto', source:weatherProgram.replace('{Task}', '{Task as AsyncTask}').replaceAll('Task(this', 'AsyncTask(this').replaceAll('_weatherTask', '_forecast'), accept:true },
  { ...weather, name:'29 depuración: acepta renderizar en el host', source:weatherProgram.replace('constructor(){', 'createRenderRoot(){return this;}constructor(){'), accept:true },
  { ...weather, name:'29 depuración: rechaza fijar 20 sin trabajo asíncrono', source:`import {LitElement,html} from 'lit';class WeatherPanel extends LitElement{render(){return html\`<p>20 °C</p>\`;}}customElements.define('weather-panel',WeatherPanel);// new Task en constructor`, accept:false, noPassed:true },
  { ...weather, name:'29 depuración: rechaza recrear Task durante render', source:weatherProgram.replace("constructor(){super();this._weatherTask=new Task(this,{args:()=>[],task:async()=>{await new Promise(resolve=>setTimeout(resolve,20));return {temp:20};}});}", '').replace('render(){return this._weatherTask.render({', "render(){const task=new Task(this,{args:()=>[],task:async()=>{await new Promise(resolve=>setTimeout(resolve,20));return {temp:20};}});return task.render({"), accept:false },
  { ...weather, name:'29 depuración: rechaza una vista que nunca muestra pendiente', source:weatherProgram.replace("pending:()=>html\`<p>Cargando</p>\`,", ''), accept:false },
  { ...table, name:'28 clase: el inicio no aprueba nada', source:table.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...table, name:'28 clase: acepta estado visual y foco declarativos', source:tableProgram, accept:true },
  { ...table, name:'28 clase: acepta aliases de las directivas', source:tableProgram.replace('{classMap}', '{classMap as classes}').replace('{styleMap}', '{styleMap as styles}').replace('{createRef,ref}', '{createRef as makeRef,ref as bindRef}').replace('createRef()', 'makeRef()').replace('ref(this.searchRef)', 'bindRef(this.searchRef)').replace('classMap({', 'classes({').replace('styleMap({', 'styles({'), accept:true },
  { ...table, name:'28 clase: acepta bindings equivalentes y consulta encapsulada', source:`import {LitElement,html} from 'lit';class InteractiveTable extends LitElement{static properties={selected:{state:true},width:{state:true}};constructor(){super();this.selected=true;this.width=65;}focusSearch(){this.renderRoot.querySelector('input').focus();}render(){return html\`<input aria-label="Buscar"><article class=\${this.selected?'selected':''}><div style="width:\${this.width}%"></div></article>\`;}}customElements.define('interactive-table',InteractiveTable);`, accept:true },
  { ...table, name:'28 clase: comentarios no implementan el contrato', source:`import {LitElement,html} from 'lit';class InteractiveTable extends LitElement{constructor(){super();this.selected=true;this.width=65;}focusSearch(){}render(){return html\`<input><article><div></div></article>\`;}}customElements.define('interactive-table',InteractiveTable);// classMap({selected:true}) styleMap({width:'65%'}) ref(createRef())`, accept:false, noPassed:true },
  { ...table, name:'28 clase: rechaza apariencia fija que no sigue el estado', source:tableProgram.replace('classMap({selected:this.selected})', "'selected'").replace("styleMap({width:this.width+'%'})", "'width:65%'"), accept:false },
  { ...table, name:'28 clase: rechaza ancho fijo aunque la clase cambie', source:tableProgram.replace("styleMap({width:this.width+'%'})", "styleMap({width:'65%'})"), accept:false },
  { ...table, name:'28 clase: rechaza enfocar durante cada render', source:tableProgram.replace("render(){return html", "render(){this.searchRef.value?.focus();return html"), accept:false },
  { ...table, name:'28 clase: rechaza enfocar otro control', source:tableProgram.replace('<input aria-label="Buscar"', '<button>Otro</button><input aria-label="Buscar"').replace('this.searchRef.value?.focus()', "this.renderRoot.querySelector('button').focus()"), accept:false },
  { ...toolbar, name:'28 depuración: el inicio no aprueba nada', source:toolbar.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...toolbar, name:'28 depuración: enfoca únicamente bajo petición', source:toolbarProgram, accept:true },
  { ...toolbar, name:'28 depuración: acepta consulta encapsulada sin ref', source:toolbarProgram.replace("import {createRef,ref} from 'lit/directives/ref.js';", '').replace('constructor(){super();this.searchRef=createRef();}', '').replace('this.searchRef.value?.focus()', "this.renderRoot.querySelector('#q').focus()").replace(' ${ref(this.searchRef)}', ''), accept:true },
  { ...toolbar, name:'28 depuración: acepta render en el host', source:toolbarProgram.replace("constructor(){super();", "createRenderRoot(){return this;}constructor(){super();"), accept:true },
  { ...toolbar, name:'28 depuración: un comentario no crea la acción', source:toolbarProgram.replace('focusSearch(){this.searchRef.value?.focus();}', '')+'\n// focusSearch(){ ref(this.searchRef); }', accept:false, noPassed:true },
  { ...toolbar, name:'28 depuración: rechaza una acción que no enfoca', source:toolbarProgram.replace('this.searchRef.value?.focus();', ''), accept:false, noPassed:true },
  { ...toolbar, name:'28 depuración: rechaza recuperar foco en updated', source:toolbarProgram.replace('render(){', 'updated(){this.searchRef.value?.focus();}render(){'), accept:false },
  { ...toolbar, name:'28 depuración: rechaza enfocar el control equivocado', source:toolbarProgram.replace('<input id="q"', '<button id="other">Otro</button><input id="q"').replace('this.searchRef.value?.focus()', "this.renderRoot.querySelector('#other').focus()"), accept:false },
  { ...tray, name:'27 clase: el inicio no aprueba nada', source:tray.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...tray, name:'27 clase: acepta lista, identidad, quitar y vacío', source:trayProgram, accept:true },
  { ...tray, name:'27 clase: acepta aliases y función de clave separada', source:trayProgram.replace('{repeat}', '{repeat as rows}').replace('{when}', '{when as branch}').replace('class OrderTray', 'const key=({id})=>id;\nclass OrderTray').replace('when(this.orders.length', 'branch(this.orders.length').replace('repeat(this.orders,order=>order.id', 'rows(this.orders,key'), accept:true },
  { ...tray, name:'27 clase: acepta condicional JavaScript equivalente', source:trayProgram.replace("import {when} from 'lit/directives/when.js';",'').replace("return when(this.orders.length>0,()=>html`<div>${repeat(this.orders,order=>order.id,order=>html`<article><span>${order.name}</span><button @click=${()=>this.remove(order.id)}>Quitar</button></article>`)}</div>`,()=>html`<p>Sin pedidos</p>`);", "if(!this.orders.length)return html`<p>Sin pedidos</p>`;return html`<div>${repeat(this.orders,order=>order.id,order=>html`<article><span>${order.name}</span><button @click=${()=>this.remove(order.id)}>Quitar</button></article>`)}</div>`;"), accept:true },
  { ...tray, name:'27 clase: comentarios no corrigen clave por índice', source:trayProgram.replace('order=>order.id,order=>html', '(order,index)=>index,order=>html')+'\n// repeat(this.orders, order => order.id)', accept:false, noPassed:true },
  { ...tray, name:'27 clase: rechaza clave por referencia al copiar objetos', source:trayProgram.replace('order=>order.id,order=>html', 'order=>order,order=>html'), accept:false, noPassed:true },
  { ...tray, name:'27 clase: rechaza map posicional', source:trayProgram.replace('repeat(this.orders,order=>order.id,order=>', 'this.orders.map(order=>'), accept:false, noPassed:true },
  { ...tray, name:'27 clase: rechaza quitar siempre el primer pedido', source:trayProgram.replace('this.remove(order.id)', 'this.remove(this.orders[0].id)'), accept:false, noPassed:true },
  { ...tray, name:'27 clase: rechaza mostrar siempre la rama vacía', source:trayProgram.replace('render(){return when', "render(){return html`<p>Sin pedidos</p>`;}unused(){return when"), accept:false, noPassed:true },
  { ...tray, name:'27 clase: rechaza filas sin acción Quitar', source:trayProgram.replace('<button @click=${()=>this.remove(order.id)}>Quitar</button>',''), accept:false, noPassed:true },
  { ...editable, name:'27 depuración: inicio sin crédito por importar repeat', source:editable.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...editable, name:'27 depuración: conserva identidad y edición con clave id', source:editableProgram, accept:true },
  { ...editable, name:'27 depuración: acepta alias de repeat', source:editableProgram.replace('{repeat}', '{repeat as rows}').replace('repeat(this.items','rows(this.items'), accept:true },
  { ...editable, name:'27 depuración: acepta clave declarada como función', source:editableProgram.replace('item=>item.id', 'function key(item){return item.id}'), accept:true },
  { ...editable, name:'27 depuración: acepta destructuring y alias de la lista', source:editableProgram.replace('return html', 'const list=this.items;return html').replace('repeat(this.items,item=>item.id', 'repeat(list,({id})=>id'), accept:true },
  { ...editable, name:'27 depuración: admite render en el host', source:editableProgram.replace('render(){','createRenderRoot(){return this;}render(){'), accept:true },
  { ...editable, name:'27 depuración: comentarios no corrigen una clave por índice', source:editableProgram.replace('item=>item.id','(item,index)=>index')+'\n// repeat(this.items,item=>item.id)', accept:false, noPassed:true },
  { ...editable, name:'27 depuración: rechaza identidad del objeto al recibir copias', source:editableProgram.replace('item=>item.id','item=>item'), accept:false, noPassed:true },
  { ...editable, name:'27 depuración: rechaza map posicional', source:editableProgram.replace('repeat(this.items,item=>item.id,item=>', 'this.items.map(item=>'), accept:false, noPassed:true },
  { ...editable, name:'27 depuración: rechaza vista fija', source:editableProgram.replace('repeat(this.items,', "repeat([{id:'a',name:'A'},{id:'b',name:'B'}],"), accept:false, noPassed:true },
  { ...editable, name:'27 depuración: rechaza reiniciar el valor editado en cada actualización', source:editableProgram.replace('render(){', "updated(){this.renderRoot.querySelectorAll('input').forEach((input,index)=>input.value=this.items[index].name);}render(){"), accept:false, noPassed:true },
  { ...panel, name:'26 clase: el inicio no aprueba nada', source:panel.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...panel, name:'26 clase: acepta composición y estilo públicos', source:panelProgram, accept:true },
  { ...panel, name:'26 clase: acepta varios nombres en part', source:panelProgram.replace('part="surface"','part="panel surface"'), accept:true },
  { ...panel, name:'26 clase: acepta part enlazado desde Lit', source:panelProgram.replace('part="surface"','part=${"surface"}'), accept:true },
  { ...panel, name:'26 clase: acepta selector equivalente sin comillas', source:panelProgram.replace('[slot="header"]','[slot=header]'), accept:true },
  { ...panel, name:'26 clase: rechaza un comentario sin estilo', source:panelProgram.replace('::slotted([slot="header"]){font-weight:700}','/* ::slotted([slot="header"]) */'), accept:false },
  { ...panel, name:'26 clase: rechaza depender de h2 para el encabezado', source:panelProgram.replace('::slotted([slot="header"])','::slotted(h2)')+'\n// ::slotted([slot="header"])', accept:false },
  { ...panel, name:'26 clase: rechaza perder el contenido sin nombre', source:panelProgram.replace('<slot></slot>',''), accept:false },
  { ...panel, name:'26 clase: rechaza poner en negrita todo el contenido', source:panelProgram.replace('::slotted([slot="header"])','::slotted(*)'), accept:false },
  { ...panel, name:'26 clase: rechaza reemplazar los nodos del consumidor por copias', source:panelProgram.replace('render(){', 'firstUpdated(){this.replaceChildren(...[...this.children].map(node=>node.cloneNode(true)));} render(){'), accept:false },
  { ...panel, name:'26 clase: rechaza surface sin la composición', source:panelProgram.replace('section part="surface"','section').replace('<header>','<aside part="surface"></aside><header>'), accept:false },
  { ...panel, name:'26 clase: rechaza bloquear el estilo exterior', source:panelProgram.replace(':host{display:block}',':host{display:block}section{background-color:white!important}'), accept:false },
  { ...report, name:'26 depuración: el inicio no aprueba nada', source:report.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...report, name:'26 depuración: acepta la superficie real', source:reportProgram, accept:true },
  { ...report, name:'26 depuración: acepta part con varios nombres', source:reportProgram.replace('part="surface"','part="card surface"'), accept:true },
  { ...report, name:'26 depuración: acepta part enlazado desde Lit', source:reportProgram.replace('part="surface"','part=${"surface"}'), accept:true },
  { ...report, name:'26 depuración: un comentario no expone la superficie', source:reportProgram.replace(' part="surface"','')+'\n// part="surface"', accept:false, noPassed:true },
  { ...report, name:'26 depuración: rechaza perder el slot', source:reportProgram.replace('<slot></slot>',''), accept:false, noPassed:true },
  { ...report, name:'26 depuración: no basta con otra pieza vacía', source:reportProgram.replace('part="surface"','').replace('<slot>','<aside part="surface"></aside><slot>'), accept:false, noPassed:true },
  { ...report, name:'26 depuración: rechaza bloquear el CSS externo', source:reportProgram.replace('<section','<style>section{background-color:white!important}</style><section'), accept:false, noPassed:true },
  { ...theme, name:'25 clase: el inicio no aprueba nada', source:theme.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...theme, name:'25 clase: acepta el borde configurable', source:themeProgram, accept:true },
  { ...theme, name:'25 clase: acepta un getter de estilos', source:themeProgram.replace('static styles=css','static get styles(){return css').replace('#2563eb)}\`;','#2563eb)}\`;}'), accept:true },
  { ...theme, name:'25 clase: acepta un array de estilos', source:themeProgram.replace('static styles=css','static styles=[css').replace('#2563eb)}\`;','#2563eb)}\`];'), accept:true },
  { ...theme, name:'25 clase: acepta un alias de css', source:themeProgram.replace('html,css}', 'html,css as sheet}').replace('styles=css','styles=sheet'), accept:true },
  { ...theme, name:'25 clase: un comentario no aplica el tema', source:themeProgram.replace('var(--card-accent,#2563eb)','blue;/* var(--card-accent,#2563eb) */'), accept:false, noPassed:true },
  { ...theme, name:'25 clase: una regla inexistente no crea el borde', source:themeProgram.replace(':host{', ':host .missing{'), accept:false, noPassed:true },
  { ...theme, name:'25 clase: no basta con el color de un borde invisible', source:themeProgram.replace('4px solid','0px solid'), accept:false, noPassed:true },
  { ...theme, name:'25 clase: rechaza omitir el fallback', source:themeProgram.replace(',#2563eb',''), accept:false },
  { ...theme, name:'25 clase: rechaza bloquear el tema heredado', source:themeProgram.replace('display:block;', 'display:block;--card-accent:#2563eb;'), accept:false },
  { ...theme, name:'25 clase: el texto en estilos no sustituye al contenido', source:themeProgram.replace('display:block;', '/* Panel personal */display:block;').replace('<article><h2>Panel personal</h2><p>Tema configurable</p></article>',''), accept:false, noPassed:true },
  { ...brand, name:'25 depuración: el inicio no aprueba nada', source:brand.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...brand, name:'25 depuración: acepta el token en el span', source:brandProgram, accept:true },
  { ...brand, name:'25 depuración: acepta heredar el color desde host', source:brandProgram.replace('span{color:', ':host{color:'), accept:true },
  { ...brand, name:'25 depuración: acepta un getter de estilos', source:brandProgram.replace('static styles=css', 'static get styles(){return css').replace('blue)}\`;', 'blue)}\`;}'), accept:true },
  { ...brand, name:'25 depuración: un comentario no aplica el tema', source:brandProgram.replace('color:var(--brand-color,blue)', 'color:blue;/* var(--brand-color) */'), accept:false, noPassed:true },
  { ...brand, name:'25 depuración: una regla sin elementos no aplica el tema', source:brandProgram.replace('span{color:', '.missing{color:'), accept:false, noPassed:true },
  { ...brand, name:'25 depuración: conservar el token sin contenido no basta', source:brandProgram.replace('<span>Marca</span>', '<span></span>'), accept:false, noPassed:true },
  { ...brand, name:'25 depuración: leer el token solo al inicio deja el color desactualizado', source:brandProgram.replace('color:var(--brand-color,blue)', 'color:blue').replace('render(){', "firstUpdated(){this.renderRoot.querySelector('span').style.color=getComputedStyle(this).getPropertyValue('--brand-color');} render(){"), accept:false, noPassed:true },
  { ...brand, name:'25 depuración: un valor fijo en host no debe bloquear el tema heredado', source:brandProgram.replace('span{color:', ':host{--brand-color:blue}span{color:'), accept:false, noPassed:true },
  { ...focusedSearch, name:'24 clase: el inicio no aprueba nada', source:focusedSearch.workspace.files['app.js'].content, accept:false, noPassed:true, rendered:true },
  { ...focusedSearch, name:'24 clase: acepta foco y anuncio posterior al render', source:focusedSearchProgram, accept:true, rendered:true },
  { ...focusedSearch, name:'24 clase: rechaza anunciar antes del render', source:focusedSearchProgram.replace('await this.updateComplete;', ''), accept:false, rendered:true },
  { ...focusedSearch, name:'24 clase: rechaza omitir el anuncio', source:focusedSearchProgram.replace("this.dispatchEvent(new CustomEvent('results-ready',{detail:{count:this.results.length}}));", ''), accept:false, rendered:true },
  { ...focusedSearch, name:'24 clase: rechaza dos anuncios por búsqueda', source:focusedSearchProgram.replace("this.dispatchEvent(new CustomEvent", "for(let n=0;n<2;n++)this.dispatchEvent(new CustomEvent"), accept:false, rendered:true },
  { ...focusedSearch, name:'24 clase: rechaza anunciar solo la primera búsqueda', source:focusedSearchProgram.replace('async search(){', 'async search(){if(this.searched)return;this.searched=true;'), accept:false, rendered:true },
  { ...focusedSearch, name:'24 clase: acepta una continuación then', source:focusedSearchProgram.replace('await this.updateComplete;this.dispatchEvent', 'return this.updateComplete.then(()=>this.dispatchEvent').replace("count:this.results.length}}));}", "count:this.results.length}})));}"), accept:true, rendered:true },
  { ...focusedSearch, name:'24 clase: acepta renderizar en el host', source:focusedSearchProgram.replace('render(){', 'createRenderRoot(){return this;} render(){'), accept:true, rendered:true },
  { ...focusedSearch, name:'24 clase: rechaza el foco presente solo en comentarios', source:focusedSearchProgram.replace("this.renderRoot.querySelector('input').focus();", "/* this.renderRoot.querySelector('input').focus(); */"), accept:false, rendered:true },
  { ...searchBox, name:'24 depuración: el inicio no aprueba nada', source:searchBox.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...searchBox, name:'24 depuración: acepta el foco nativo tras el primer render', source:searchBoxProgram, accept:true, rendered:true },
  { ...searchBox, name:'24 depuración: acepta una referencia local al input', source:searchBoxProgram.replace("this.renderRoot.querySelector('input').focus();", "const field=this.renderRoot.querySelector('input');field.focus();"), accept:true, rendered:true },
  { ...searchBox, name:'24 depuración: acepta renderizar en el host', source:searchBoxProgram.replace('render(){', 'createRenderRoot(){return this;} render(){'), accept:true, rendered:true },
  { ...searchBox, name:'24 depuración: los comentarios no enfocan', source:searchBoxProgram.replace("this.renderRoot.querySelector('input').focus();", "/* this.renderRoot.querySelector('input').focus(); */"), accept:false, noPassed:true, rendered:true },
  { ...searchBox, name:'24 depuración: no roba el foco en cada actualización', source:searchBoxProgram.replace('firstUpdated(){', 'updated(){'), accept:false, noPassed:true, rendered:true },
  { ...filters, name:'23 clase: el inicio no aprueba nada', source:filters.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...filters, name:'23 clase: acepta el filtro correcto incluido Café', source:filterProgram(), accept:true },
  { ...filters, name:'23 clase: acepta otro nombre del Map y método calculado', source:filterProgram({alias:true}), accept:true },
  { ...filters, name:'23 clase: acepta renderizar en el host', source:filterProgram({light:true}), accept:true },
  { ...filters, name:'23 clase: acepta otro texto junto al número de resultados', source:filterProgram().replace('Coincidencias:', 'Resultados disponibles:'), accept:true },
  { ...filters, name:'23 clase: rechaza dos coincidencias fijadas al ejemplo', source:filterProgram({fixed:true}), accept:false },
  { ...filters, name:'23 clase: responde a items además de query', source:filterProgram({queryOnly:true}), accept:false },
  { ...filters, name:'23 clase: responde a query además de items', source:filterProgram({itemsOnly:true}), accept:false },
  { ...filters, name:'23 clase: no recalcula ante un update sin nuevas entradas', source:filterProgram({everyUpdate:true}), accept:false },
  { ...filters, name:'23 clase: rechaza fijar la vista', source:filterProgram({staleView:true}), accept:false },
  { ...filters, name:'23 clase: distingue mayúsculas de una entrada nueva', source:filterProgram({caseSensitive:true}), accept:false },
  { ...taxes, name:'23 depuración: el inicio no aprueba nada', source:taxes.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...taxes, name:'23 depuración: acepta multiplicar por 1.1', source:taxProgram().replace('// willUpdate(changed) { this.total = this.subtotal + impuesto; }',''), accept:true },
  { ...taxes, name:'23 depuración: acepta método calculado', source:taxProgram({alias:true}).replace('// willUpdate(changed) { this.total = this.subtotal + impuesto; }',''), accept:true },
  { ...taxes, name:'23 depuración: acepta un getter puro', source:taxProgram({getter:true}).replace('// willUpdate(changed) { this.total = this.subtotal + impuesto; }',''), accept:true },
  { ...taxes, name:'23 depuración: acepta renderizar en el host', source:taxProgram({light:true}), accept:true },
  { ...taxes, name:'23 depuración: rechaza total fijo con comentarios válidos', source:taxProgram({fixed:true}), accept:false },
  { ...taxes, name:'23 depuración: rechaza derivar después del render', source:taxProgram({late:true}), accept:false },
  { ...taxes, name:'23 depuración: rechaza calcular solo al inicio', source:taxProgram({initialOnly:true}), accept:false },
  { ...taxes, name:'23 depuración: rechaza una vista desactualizada', source:taxProgram({staleView:true}), accept:false },
  { ...taxes, name:'23 depuración: rechaza ignorar cero como subtotal nuevo', source:taxProgram({skipZero:true}), accept:false },
  { ...monitor, name:'22 clase: el inicio no aprueba nada', source:monitor.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...monitor, name:'22 clase: acepta el ciclo completo', source:monitorProgram(), accept:true },
  { ...monitor, name:'22 clase: acepta el intervalo de un segundo', source:monitorProgram({period:1000}), accept:true },
  { ...monitor, name:'22 clase: rechaza una vista fija con contador activo', source:monitorProgram({fixed:true}), accept:false },
  { ...monitor, name:'22 clase: acepta callbacks en otro orden', source:monitorProgram({reverse:true}), accept:true },
  { ...monitor, name:'22 clase: acepta renderizar en el host', source:monitorProgram({light:true}), accept:true },
  { ...monitor, name:'22 clase: rechaza omitir el intervalo', source:monitorProgram({noTimer:true}), accept:false },
  { ...monitor, name:'22 clase: rechaza el intervalo sin limpieza', source:monitorProgram({leak:true}), accept:false },
  { ...monitor, name:'22 clase: rechaza no reiniciar al reconectar', source:monitorProgram({once:true}), accept:false },
  { ...monitor, name:'22 clase: rechaza perder la desconexión heredada', source:monitorProgram({noDisconnectSuper:true}), accept:false },
  { ...clock, name:'22 depuración: acepta delegación directa', source:clockProgram(), accept:true },
  { ...clock, name:'22 depuración: acepta callback heredado', source:clockProgram({inherited:true}), accept:true },
  { ...clock, name:'22 depuración: acepta renderizar en el host', source:clockProgram({light:true}), accept:true },
  { ...clock, name:'22 depuración: rechaza super solo en un comentario', source:clockProgram({commentsOnly:true}), accept:false },
  { ...profile, name:'21 clase: el inicio no aprueba nada', source:profile.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...profile, name:'21 clase: acepta validación y evento limpio', source:profileProgram(), accept:true },
  { ...profile, name:'21 clase: acepta función flecha', source:profileProgram({arrow:true}), accept:true },
  { ...profile, name:'21 clase: acepta renderizar en el host', source:profileProgram({light:true}), accept:true },
  { ...profile, name:'21 clase: rechaza no prevenir navegación', source:profileProgram({noPrevent:true}), accept:false },
  { ...profile, name:'21 clase: rechaza emitir nombres vacíos', source:profileProgram({noValidation:true}), accept:false },
  { ...profile, name:'21 clase: rechaza errores silenciosos', source:profileProgram({noMessage:true}), accept:false },
  { ...profile, name:'21 clase: rechaza un nombre fijo', source:profileProgram({fixed:true}), accept:false },
  { ...profile, name:'21 clase: rechaza espacios sin limpiar', source:profileProgram({untrimmed:true}), accept:false },
  { ...profile, name:'21 clase: rechaza dos emisiones por envío', source:profileProgram({duplicate:true}), accept:false },
  { ...profile, name:'21 clase: un comentario no conecta submit', source:profileProgram({clickOnly:true}), accept:false, noPassed:true },
  { ...invite, name:'21 depuración: el inicio no aprueba nada', source:invite.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...invite, name:'21 depuración: acepta referencia', source:inviteProgram(), accept:true },
  { ...invite, name:'21 depuración: acepta función flecha', source:inviteProgram({binding:'event=>this._submit(event)'}), accept:true },
  { ...invite, name:'21 depuración: acepta bind', source:inviteProgram({binding:'this._submit.bind(this)'}), accept:true },
  { ...invite, name:'21 depuración: acepta handleEvent', source:inviteProgram({binding:'{handleEvent:event=>this._submit(event)}'}), accept:true },
  { ...invite, name:'21 depuración: acepta renderizar en el host', source:inviteProgram({light:true}), accept:true },
  { ...invite, name:'21 depuración: rechaza enviar al renderizar', source:inviteProgram({premature:true}), accept:false },
  { ...invite, name:'21 depuración: rechaza no prevenir navegación', source:inviteProgram({noPrevent:true}), accept:false },
  { ...invite, name:'21 depuración: rechaza un manejador vacío', source:inviteProgram({noSend:true}), accept:false },
  { ...invite, name:'21 depuración: también funciona en el segundo envío', source:inviteProgram({once:true}), accept:false },
  { ...chip, name:'18 clase: admite renderizar en el host', source:chipProgram().replace('constructor(){','createRenderRoot(){return this;} constructor(){'), accept:true },
  { ...counter, name:'18 depuración: admite renderizar en el host', source:counterProgram().replace('constructor(){','createRenderRoot(){return this;} constructor(){'), accept:true },
  { ...inventory, name:'19 clase: el estado interno no depende de Shadow DOM', source:inventoryProgram().replace('constructor(){','createRenderRoot(){return this;} constructor(){'), accept:true },
  { ...loading, name:'19 depuración: el estado interno no depende de Shadow DOM', source:loadingProgram().replace('constructor(){','createRenderRoot(){return this;} constructor(){'), accept:true },
  { ...board, name:'20 clase: la inmutabilidad no depende de Shadow DOM', source:boardProgram().replace('constructor(){','createRenderRoot(){return this;} constructor(){'), accept:true },
  { ...notes, name:'20 depuración: la inmutabilidad no depende de Shadow DOM', source:notesProgram().replace('constructor(){','createRenderRoot(){return this;} constructor(){'), accept:true },
  { ...board, name:'20 clase: el programa inicial no aprueba nada', source:board.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...board, name:'20 clase: acepta spread y map inmutables', source:boardProgram(), accept:true },
  { ...board, name:'20 clase: acepta concat', source:boardProgram({concat:true}), accept:true },
  { ...board, name:'20 clase: acepta push sobre una copia nueva', source:boardProgram({clonePush:true}), accept:true },
  { ...board, name:'20 clase: rechaza mutar y después copiar el array', source:boardProgram({mutateAdd:true}), accept:false },
  { ...board, name:'20 clase: rechaza ignorar el texto recibido', source:boardProgram({wrongText:true}), accept:false },
  { ...board, name:'20 clase: rechaza repetir identificadores', source:boardProgram({duplicateId:true}), accept:false },
  { ...board, name:'20 clase: rechaza mutar y después copiar la tarea', source:boardProgram({mutateObject:true}), accept:false },
  { ...board, name:'20 clase: completar debe reemplazar el array', source:boardProgram({sameArray:true}), accept:false },
  { ...board, name:'20 clase: completar no siempre modifica la primera', source:boardProgram({firstOnly:true}), accept:false },
  { ...board, name:'20 clase: completar no marca todas las tareas', source:boardProgram({allDone:true}), accept:false },
  { ...notes, name:'20 depuración: el programa inicial no aprueba nada', source:notes.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...notes, name:'20 depuración: acepta spread', source:notesProgram(), accept:true },
  { ...notes, name:'20 depuración: acepta concat', source:notesProgram({concat:true}), accept:true },
  { ...notes, name:'20 depuración: acepta push sobre una copia', source:notesProgram({clonePush:true}), accept:true },
  { ...notes, name:'20 depuración: rechaza mutar antes de copiar', source:notesProgram({mutate:true}), accept:false },
  { ...notes, name:'20 depuración: un comentario y requestUpdate no reparan la mutación', source:notesProgram({forced:true}), accept:false },
  { ...notes, name:'20 depuración: rechaza añadir otro texto', source:notesProgram({wrongText:true}), accept:false },
  { ...inventory, name: '19 clase: el programa inicial no aprueba nada', source: inventory.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...inventory, name: '19 clase: acepta reservas limitadas', source:inventoryProgram(), accept:true },
  { ...inventory, name: '19 clase: acepta opciones en otro orden', source:inventoryProgram({reordered:true}), accept:true },
  { ...inventory, name: '19 clase: acepta opciones en una variable', source:inventoryProgram({variable:true}), accept:true },
  { ...inventory, name: '19 clase: rechaza reservas sin límite', source:inventoryProgram({unlimited:true}), accept:false },
  { ...inventory, name: '19 clase: rechaza disponibilidad fijada en cuatro', source:inventoryProgram({fixed:true}), accept:false },
  { ...inventory, name: '19 clase: rechaza publicar el estado interno', source:inventoryProgram({publicState:true}), accept:false },
  { ...inventory, name: '19 clase: no modifica la capacidad del consumidor', source:inventoryProgram({decrementsCapacity:true}), accept:false },
  { ...loading, name: '19 depuración: el programa inicial no aprueba nada', source:loading.workspace.files['app.js'].content, accept:false, noPassed:true },
  { ...loading, name: '19 depuración: acepta estado interno reactivo', source:loadingProgram(), accept:true },
  { ...loading, name: '19 depuración: acepta opciones en otro orden', source:loadingProgram({reordered:true}), accept:true },
  { ...loading, name: '19 depuración: acepta opciones en una variable', source:loadingProgram({variable:true}), accept:true },
  { ...loading, name: '19 depuración: rechaza un spinner fijo', source:loadingProgram({fixed:true}), accept:false },
  { ...loading, name: '19 depuración: un comentario no vuelve privado el estado', source:loadingProgram({publicState:true}), accept:false },
  { ...loading, name: '19 depuración: rechaza conservar loading público sin usar', source:loadingProgram({unusedPublic:true}), accept:false },
  { ...chip, name: '18 clase: el programa inicial no aprueba nada', source: chip.workspace.files['app.js'].content, accept: false, noPassed: true },
  { ...chip, name: '18 clase: acepta propiedades reactivas declaradas', source: chipProgram(), accept: true },
  { ...chip, name: '18 clase: acepta static get properties', source: chipProgram({getter:true}), accept: true },
  { ...chip, name: '18 clase: acepta propiedades en otro orden', source: chipProgram({reversed:true}), accept: true },
  { ...chip, name: '18 clase: acepta propiedades heredadas', source: chipProgram({getter:true,inherited:true}), accept: true },
  { ...chip, name: '18 clase: rechaza una vista fija', source: chipProgram({fixed:true}), accept: false },
  { ...chip, name: '18 clase: rechaza Boolean convertido en texto', source: chipProgram({stringBoolean:true}), accept: false },
  { ...chip, name: '18 clase: rechaza omitir los valores por defecto', source: chipProgram({noDefaults:true}), accept: false },
  { ...chip, name: '18 clase: online ausente empieza desactivado', source: chipProgram({defaultOnline:true}), accept: false },
  { ...chip, name: '18 clase: rechaza name no reactivo', source: chipProgram({plainName:true}), accept: false, noPassed: true },
  { ...chip, name: '18 clase: rechaza online no reactivo', source: chipProgram({plainOnline:true}), accept: false, noPassed: true },
  { ...chip, name: '18 clase: rechaza campos que ocultan accessors', source: chipProgram({shadowed:true}), accept: false },
  { ...counter, name: '18 depuración: el programa inicial no aprueba nada', source: counter.workspace.files['app.js'].content, accept: false, noPassed: true },
  { ...counter, name: '18 depuración: acepta la declaración reactiva', source: counterProgram(), accept: true },
  { ...counter, name: '18 depuración: acepta un getter estático', source: counterProgram({getter:true}).replace('// static properties = { count }',''), accept: true },
  { ...counter, name: '18 depuración: acepta la reactividad heredada', source: counterProgram({getter:true,inherited:true}).replace('// static properties = { count }',''), accept: true },
  { ...counter, name: '18 depuración: rechaza fijar el texto en 2', source: counterProgram({fixed:true}), accept: false },
  { ...counter, name: '18 depuración: no confunde 21 con 2', source: counterProgram({wrongIncrement:true}), accept: false },
  { ...counter, name: '18 depuración: requestUpdate en increment no vuelve reactiva count', source: counterProgram({forced:true,noReactive:true}), accept: false },
  { ...product, name: '15 clase: el programa inicial no aprueba nada', source: product.workspace.files['app.js'].content, accept: false, noPassed: true },
  { ...product, name: '15 clase: acepta un template directo completo', source: cardProgram('product'), accept: true },
  { ...product, name: '15 clase: acepta un alias de html', source: cardProgram('product', { alias: true }), accept: true },
  { ...product, name: '15 clase: acepta un template en una variable', source: cardProgram('product', { local: true }), accept: true },
  { ...product, name: '15 clase: acepta un array de templates', source: cardProgram('product', { array: true }), accept: true },
  { ...product, name: '15 clase: el evaluador no llama render fuera del ciclo de Lit', source: cardProgram('product', { alias: true }).replace('render(){', "render(){if(this.rendered)throw new Error('Render adicional inesperado');this.rendered=true;"), accept: true },
  { ...product, name: '15 clase: rechaza omitir el precio', source: cardProgram('product', { price: '' }), accept: false },
  { ...product, name: '15 clase: rechaza confundir 800 con 80', source: cardProgram('product', { price: '800' }), accept: false },
  { ...product, name: '15 clase: rechaza dejar el precio fuera del artículo', source: cardProgram('product', { outside: true }), accept: false },
  { ...product, name: '15 clase: un comentario no convierte innerHTML en template', source: cardProgram('product', { imperative: true }), accept: false },
  { ...product, name: '15 clase: un template vacío no acredita el artículo imperativo', source: cardProgram('product', { imperative: true, emptyTemplate: true }), accept: false },
  { ...product, name: '15 clase: un elemento nativo se rechaza sin error del evaluador', source: "class Card extends HTMLElement { connectedCallback(){this.attachShadow({mode:'open'}).innerHTML='<article>Teclado $80</article>';} } customElements.define('product-card',Card); // return html`", accept: false },
  { ...account, name: '15 depuración: acepta un alias de html', source: cardProgram('account', { alias: true }), accept: true },
  { ...account, name: '15 depuración: acepta variables antes de devolver el template', source: cardProgram('account', { local: true }), accept: true },
  { ...account, name: '15 depuración: acepta un array de templates', source: cardProgram('account', { array: true }), accept: true },
  { ...account, name: '15 depuración: rechaza sustituir Shadow DOM por el host', source: cardProgram('account', { light: true }), accept: false },
  { ...account, name: '15 depuración: un comentario no corrige el render imperativo', source: cardProgram('account', { imperative: true }), accept: false },
  { ...account, name: '15 depuración: un template vacío no acredita la cuenta imperativa', source: cardProgram('account', { imperative: true, emptyTemplate: true }), accept: false },
  { ...order, name: '16 clase: el programa inicial no aprueba nada', source: order.workspace.files['app.js'].content, accept: false, noPassed: true },
  { ...order, name: '16 clase: acepta bindings de texto y booleano', source: orderProgram(), accept: true },
  { ...order, name: '16 clase: acepta la propiedad booleana disabled', source: orderProgram({ property: true }).replace('// ?disabled=${this.locked}', ''), accept: true },
  { ...order, name: '16 clase: rechaza textos fijados al ejemplo', source: orderProgram({ fixedText: true }), accept: false },
  { ...order, name: '16 clase: rechaza interpretar el cliente como HTML', source: orderProgram({ unsafe: true }), accept: false },
  { ...order, name: '16 clase: rechaza dejar el bloqueo siempre activo', source: orderProgram({ fixedLock: true }), accept: false },
  { ...order, name: '16 clase: rechaza disabled como atributo de texto', source: orderProgram({ attribute: true }), accept: false },
  { ...order, name: '16 clase: rechaza confundir 420 con 42', source: orderProgram({ wrongTotal: true }), accept: false },
  { ...permission, name: '16 depuración: el programa inicial no aprueba nada', source: permission.workspace.files['app.js'].content, accept: false, noPassed: true },
  { ...permission, name: '16 depuración: acepta ?disabled', source: permissionProgram(), accept: true },
  { ...permission, name: '16 depuración: acepta .disabled booleano', source: permissionProgram({ property: true }), accept: true },
  { ...permission, name: '16 depuración: rechaza habilitar siempre', source: permissionProgram({ fixed: true }), accept: false },
  { ...session, name: '17 clase: el programa inicial no aprueba nada', source: session.workspace.files['app.js'].content, accept: false, noPassed: true },
  { ...session, name: '17 clase: acepta ramas y listas con if/else', source: sessionProgram(), accept: true },
  { ...session, name: '17 clase: rechaza omitir la sesión vacía', source: sessionProgram({ empty: false }), accept: false },
  { ...session, name: '17 clase: rechaza filas con textos incorrectos', source: sessionProgram({ rows: false }), accept: false },
  { ...session, name: '17 clase: rechaza fijar el nombre inicial', source: sessionProgram({ name: false }), accept: false },
  { ...session, name: '17 clase: rechaza conservar sesión tras cerrar', source: sessionProgram({ reset: false }), accept: false },
  { ...cart, name: '17 depuración: el programa inicial no aprueba nada', source: cart.workspace.files['app.js'].content, accept: false, noPassed: true },
  { ...cart, name: '17 depuración: acepta un ternario completo', source: cartProgram(), accept: true },
  { ...cart, name: '17 depuración: acepta ramas if con returns', source: cartProgram({ alternate: true }), accept: true },
  { ...cart, name: '17 depuración: acepta un encabezado adicional', source: cartProgram().replace('<div>', '<h2>Carrito</h2><div>'), accept: true },
  { ...cart, name: '17 depuración: rechaza cantidades numéricas incorrectas', source: cartProgram().replaceAll('${this.count} artículos', '${this.count+10} artículos'), accept: false },
  { ...cart, name: '17 depuración: rechaza fijar el texto vacío', source: cartProgram({ positive: false }), accept: false },
  { ...cart, name: '17 depuración: rechaza no volver a cero', source: cartProgram({ returnsToEmpty: false }), accept: false },
  { ...account, name: '15 depuración: escribir en el host no aprueba Shadow DOM', source: account.workspace.files['app.js'].content, accept: false, noPassed: true },
  { ...account, name: '15 depuración: acepta el template en Shadow DOM', source: "import { LitElement, html } from 'lit'; class AccountCard extends LitElement { render(){ return html`<p>Cuenta activa</p>`; } } customElements.define('account-card',AccountCard);", accept: true },
];

mountRegressions([...lit45Cases, ...lit44Cases, ...cases, ...lit40Cases, ...lit41Cases, ...lit42Cases, ...lit43Cases]);
