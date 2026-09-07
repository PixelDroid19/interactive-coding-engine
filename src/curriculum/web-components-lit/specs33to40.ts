import { appHtml, browserTest, lesson, source } from './helpers';

const invalidFieldLifecycleTest = browserTest('lit33-validation-lifecycle', 'La directiva sincroniza cada formulario sin mezclar instancias', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('validation-form');
  const sentinel=document.createElement('input'),first=document.createElement('validation-form'),second=document.createElement('validation-form');
  sentinel.setAttribute('aria-invalid','sentinel');
  const root=el=>el.shadowRoot||el;
  const input=el=>root(el).querySelector('input');
  const alert=el=>root(el).querySelector('[role="alert"]');
  const state=el=>({aria:input(el)?.getAttribute('aria-invalid'),message:alert(el)?.textContent.trim()});
  const type=async(el,value)=>{const field=input(el);field.value=value;field.dispatchEvent(new Event('input',{bubbles:true,composed:true}));await el.updateComplete;};
  try{
    document.body.append(sentinel,first,second);await Promise.all([first.updateComplete,second.updateComplete]);
    const firstInput=input(first),secondInput=input(second);
    if(!firstInput||!secondInput||!alert(first)||!alert(second))return {passed:false,receivedValue:'Faltan el input o el aviso de uno de los formularios.'};
    if(state(first).aria==='true'||state(first).message||state(second).aria==='true'||state(second).message)return {passed:false,receivedValue:'Estado inicial: '+JSON.stringify([state(first),state(second)])};

    await type(first,'sin-arroba');
    if(state(first).aria!=='true'||state(first).message!=='Escribe un correo válido')return {passed:false,receivedValue:'Primer error: '+JSON.stringify(state(first))};
    if(state(second).aria==='true'||state(second).message)return {passed:false,receivedValue:'El primer cambio contaminó el segundo formulario: '+JSON.stringify(state(second))};

    await type(first,'persona@example.test');
    if(input(first)!==firstInput||state(first).aria==='true'||state(first).message!=='')return {passed:false,receivedValue:'Tras corregir: '+JSON.stringify(state(first))};

    await type(second,'otro-error');
    if(input(second)!==secondInput||state(second).aria!=='true'||state(second).message!=='Escribe un correo válido')return {passed:false,receivedValue:'Segundo formulario: '+JSON.stringify(state(second))};
    if(state(first).aria==='true'||state(first).message||sentinel.getAttribute('aria-invalid')!=='sentinel')return {passed:false,receivedValue:'La directiva modificó otra instancia o un control externo.'};

    await type(second,'otra@example.test');await type(first,'nuevo-error');
    return {passed:state(first).aria==='true'&&state(first).message==='Escribe un correo válido'&&state(second).aria!=='true'&&state(second).message==='',receivedValue:'Estados finales: '+JSON.stringify([state(first),state(second)])};
  }catch(error){return {passed:false,receivedValue:'No se pudo recorrer la validación: '+(error?.message||String(error))};}
  finally{sentinel.remove();first.remove();second.remove();}
}`);

const liveLabelCurrentValueTest = browserTest('lit33-d0', 'Cada instancia muestra el valor vigente, incluso vacío', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('live-label');
  const first=document.createElement('live-label'),second=document.createElement('live-label');
  const root=el=>el.shadowRoot||el;
  const value=el=>root(el).querySelector('p')?.textContent??'';
  try{
    document.body.append(first,second);await Promise.all([first.updateComplete,second.updateComplete]);
    const firstParagraph=root(first).querySelector('p'),secondParagraph=root(second).querySelector('p');
    if(value(first)!=='Uno'||value(second)!=='Uno')return {passed:false,receivedValue:'Valores iniciales: '+value(first)+' / '+value(second)};
    first.label='Dos';await first.updateComplete;
    if(value(first)!=='Dos'||value(second)!=='Uno')return {passed:false,receivedValue:'Después de Dos: '+value(first)+' / '+value(second)};
    first.label='';await first.updateComplete;
    if(value(first)!==''||value(second)!=='Uno')return {passed:false,receivedValue:'Después del vacío: '+JSON.stringify([value(first),value(second)])};
    second.label='B';await second.updateComplete;
    if(value(first)!==''||value(second)!=='B')return {passed:false,receivedValue:'Instancias independientes: '+JSON.stringify([value(first),value(second)])};
    first.label='Intermedio';first.label='Final';await first.updateComplete;
    return {passed:value(first)==='Final'&&value(second)==='B'&&root(first).querySelector('p')===firstParagraph&&root(second).querySelector('p')===secondParagraph,receivedValue:'Valores finales: '+value(first)+' / '+value(second)};
  }catch(error){return {passed:false,receivedValue:'No se pudo actualizar la etiqueta: '+(error?.message||String(error))};}
  finally{first.remove();second.remove();}
}`);

const noticeMotionPreferenceTest = browserTest('lit34-motion-lifecycle', 'Los avisos existen antes de animarse y respetan movimiento reducido', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('notice-stack');
  const win=document.defaultView,prototype=win.Element.prototype;
  const previousMatch=Object.getOwnPropertyDescriptor(win,'matchMedia');
  const previousAnimate=Object.getOwnPropertyDescriptor(prototype,'animate');
  let reduced=true;const calls=[];
  const media=query=>({matches:query.includes('prefers-reduced-motion')?reduced:false,media:query,onchange:null,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){},dispatchEvent(){return true;}});
  Object.defineProperty(win,'matchMedia',{configurable:true,writable:true,value:media});
  Object.defineProperty(prototype,'animate',{configurable:true,writable:true,value:function(keyframes,options){calls.push({element:this,keyframes,options,connected:this.isConnected});return {cancel(){},finished:Promise.resolve()};}});
  const el=document.createElement('notice-stack');
  const root=()=>el.shadowRoot||el;
  const articles=()=>[...root().querySelectorAll('article')];
  try{
    document.body.append(el);await el.updateComplete;
    const region=root().querySelector('[aria-live="polite"]');
    if(!region||articles().length!==0)return {passed:false,receivedValue:'Estado inicial: region='+Boolean(region)+', filas='+articles().length};

    await el.add('Duplicado');
    if(el.notices.length!==1||articles().length!==1||!articles()[0].textContent.includes('Duplicado'))return {passed:false,receivedValue:'El primer aviso no quedó utilizable: '+root().textContent.trim()};
    if(calls.length!==0)return {passed:false,receivedValue:'Con reducción se llamaron '+calls.length+' animaciones.'};
    const firstNotice=el.notices[0];

    reduced=false;await el.add('Duplicado');
    if(el.notices.length!==2||el.notices[0]!==firstNotice||el.notices[0].id===el.notices[1].id)return {passed:false,receivedValue:'Estado tras añadir dos: '+JSON.stringify(el.notices)};
    if(calls.length!==1)return {passed:false,receivedValue:'Sin reducción se llamaron '+calls.length+' animaciones.'};
    const animated=calls[0],secondArticle=articles()[1];
    const frames=Array.isArray(animated.keyframes)?animated.keyframes:[];
    const purposeful=frames.length>=2&&frames.some(frame=>frame&&('opacity'in frame||'transform'in frame));
    if(animated.element!==secondArticle||!animated.connected||!purposeful)return {passed:false,receivedValue:'La animación no empezó sobre la fila nueva ya conectada.'};

    const secondNotice=el.notices[1],secondButton=secondArticle.querySelector('button');
    if(!secondButton)return {passed:false,receivedValue:'La segunda fila no ofrece Cerrar.'};
    secondButton.click();await el.updateComplete;
    return {passed:el.notices.length===1&&el.notices[0]===firstNotice&&el.notices[0]!==secondNotice&&articles().length===1&&articles()[0].textContent.includes('Duplicado'),receivedValue:'Estado final: '+JSON.stringify(el.notices)};
  }catch(error){return {passed:false,receivedValue:'No se pudo recorrer los avisos: '+(error?.message||String(error))};}
  finally{
    el.remove();
    if(previousMatch)Object.defineProperty(win,'matchMedia',previousMatch);else delete win.matchMedia;
    if(previousAnimate)Object.defineProperty(prototype,'animate',previousAnimate);else delete prototype.animate;
  }
}`);

const detailAnimationOrderTest = browserTest('lit34-d0', 'El detalle se renderiza antes de animar su propio artículo', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('detail-panel');
  const win=document.defaultView,prototype=win.Element.prototype;
  const previousAnimate=Object.getOwnPropertyDescriptor(prototype,'animate');
  const calls=[];
  Object.defineProperty(prototype,'animate',{configurable:true,writable:true,value:function(keyframes,options){calls.push({element:this,connected:this.isConnected,keyframes,options});return {cancel(){},finished:Promise.resolve()};}});
  const first=document.createElement('detail-panel'),second=document.createElement('detail-panel');
  const root=el=>el.shadowRoot||el;
  try{
    document.body.append(first,second);await Promise.all([first.updateComplete,second.updateComplete]);
    if(root(first).querySelector('article')||root(second).querySelector('article')||!root(first).querySelector('button')||!root(second).querySelector('button'))return {passed:false,receivedValue:'El estado inicial no muestra únicamente Abrir.'};

    await Promise.resolve(second.show());
    const secondArticle=root(second).querySelector('article');
    if(!secondArticle||secondArticle.textContent.trim()!=='Detalle')return {passed:false,receivedValue:'El segundo panel no mostró Detalle.'};
    if(calls.length!==1||calls[0].element!==secondArticle||!calls[0].connected)return {passed:false,receivedValue:'La primera animación no apuntó al artículo ya conectado.'};
    if(root(first).querySelector('article'))return {passed:false,receivedValue:'Abrir el segundo alteró la primera instancia.'};

    root(first).querySelector('button').click();await first.updateComplete;await Promise.resolve();
    const firstArticle=root(first).querySelector('article');
    return {passed:Boolean(firstArticle)&&calls.length===2&&calls[1].element===firstArticle&&calls[1].connected&&root(second).querySelector('article')===secondArticle,receivedValue:'Artículos='+Boolean(firstArticle)+'/'+Boolean(secondArticle)+', animaciones='+calls.length};
  }catch(error){return {passed:false,receivedValue:'No se pudo abrir el detalle: '+(error?.message||String(error))};}
  finally{first.remove();second.remove();if(previousAnimate)Object.defineProperty(prototype,'animate',previousAnimate);else delete prototype.animate;}
}`);

const metricsSubscriptionLifecycleTest = browserTest('lit35-observer-lifecycle', 'Cada tablero recibe su snapshot y deja de observar al desconectarse', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('metrics-board');
  const first=document.createElement('metrics-board'),second=document.createElement('metrics-board');
  const root=el=>el.shadowRoot||el;
  const text=el=>root(el).querySelector('p')?.textContent.trim()??'';
  const originalRequest=first.requestUpdate.bind(first);let firstUpdates=0;
  first.requestUpdate=(...args)=>{firstUpdates+=1;return originalRequest(...args);};
  try{
    document.body.append(first,second);await Promise.all([first.updateComplete,second.updateComplete]);
    const firstButton=root(first).querySelector('button'),secondButton=root(second).querySelector('button');
    if(!firstButton||!secondButton||text(first)!=='Sin mediciones'||text(second)!=='Sin mediciones')return {passed:false,receivedValue:'Estado inicial: '+text(first)+' / '+text(second)};

    firstUpdates=0;firstButton.click();await Promise.all([first.updateComplete,second.updateComplete]);
    if(text(first)!=='latencia: 42'||text(second)!=='latencia: 42')return {passed:false,receivedValue:'Primera publicación: '+text(first)+' / '+text(second)};
    if(!first.latest||!second.latest||first.latest===second.latest)return {passed:false,receivedValue:'Los tableros no recibieron snapshots independientes.'};

    first.latest={name:'retenida',value:7};await first.updateComplete;first.remove();firstUpdates=0;
    secondButton.click();await second.updateComplete;
    if(firstUpdates!==0||first.latest.name!=='retenida'||text(first)!=='retenida: 7'||text(second)!=='latencia: 42')return {passed:false,receivedValue:'Tras desconectar: updates='+firstUpdates+', '+text(first)+' / '+text(second)};

    document.body.append(first);await first.updateComplete;first.remove();document.body.append(first);await first.updateComplete;
    firstUpdates=0;secondButton.click();await Promise.all([first.updateComplete,second.updateComplete]);
    if(firstUpdates!==1||text(first)!=='latencia: 42'||text(second)!=='latencia: 42')return {passed:false,receivedValue:'Tras reconectar: updates='+firstUpdates+', '+text(first)+' / '+text(second)};

    first.latest={name:'rendimiento',value:7};await first.updateComplete;
    return {passed:text(first)==='rendimiento: 7',receivedValue:'Vista alternativa: '+text(first)};
  }catch(error){return {passed:false,receivedValue:'No se pudo recorrer la suscripción: '+(error?.message||String(error))};}
  finally{first.remove();second.remove();}
}`);

const feedListenerLifecycleTest = browserTest('lit35-d0', 'Cada conexión conserva un solo listener y lo retira al salir', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('feed-view');
  const first=document.createElement('feed-view'),second=document.createElement('feed-view');
  const root=el=>el.shadowRoot||el;
  const text=el=>root(el).querySelector('p')?.textContent.trim()??'';
  const firstRequest=first.requestUpdate.bind(first),secondRequest=second.requestUpdate.bind(second);
  let firstUpdates=0,secondUpdates=0;
  first.requestUpdate=(...args)=>{firstUpdates+=1;return firstRequest(...args);};
  second.requestUpdate=(...args)=>{secondUpdates+=1;return secondRequest(...args);};
  const emit=value=>first.feed?.dispatchEvent(new document.defaultView.CustomEvent('message',{detail:value}));
  try{
    document.body.append(first,second);await Promise.all([first.updateComplete,second.updateComplete]);
    if(!first.feed||first.feed!==second.feed||text(first)!=='Vacío'||text(second)!=='Vacío')return {passed:false,receivedValue:'Estado inicial o fuente pública inválida: '+text(first)+' / '+text(second)};

    firstUpdates=0;secondUpdates=0;emit('Uno');await Promise.all([first.updateComplete,second.updateComplete]);
    if(text(first)!=='Uno'||text(second)!=='Uno'||firstUpdates!==1||secondUpdates!==1)return {passed:false,receivedValue:'Primera emisión: '+text(first)+'/'+text(second)+', updates='+firstUpdates+'/'+secondUpdates};

    first.remove();firstUpdates=0;secondUpdates=0;emit('Dos');await second.updateComplete;
    if(text(first)!=='Uno'||text(second)!=='Dos'||firstUpdates!==0||secondUpdates!==1)return {passed:false,receivedValue:'Desconectado: '+text(first)+'/'+text(second)+', updates='+firstUpdates+'/'+secondUpdates};

    document.body.append(first);await first.updateComplete;first.remove();document.body.append(first);await first.updateComplete;
    firstUpdates=0;secondUpdates=0;emit('Tres');await Promise.all([first.updateComplete,second.updateComplete]);
    return {passed:text(first)==='Tres'&&text(second)==='Tres'&&firstUpdates===1&&secondUpdates===1,receivedValue:'Reconectado: '+text(first)+'/'+text(second)+', updates='+firstUpdates+'/'+secondUpdates};
  }catch(error){return {passed:false,receivedValue:'No se pudo recorrer el feed: '+(error?.message||String(error))};}
  finally{first.remove();second.remove();}
}`);

const paymentAdapterBoundaryTest = browserTest('lit36-payment-boundary', 'El panel valida, normaliza y puede cambiar de proveedor sin conocer su formato', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('payment-panel');
  const panel=document.createElement('payment-panel');
  const root=element=>element.shadowRoot||element;
  const status=()=>root(panel).querySelector('[role="status"]')?.textContent.trim()??'';
  const button=()=>root(panel).querySelector('button');
  const contractKeys=result=>result&&Object.keys(result).sort().join(',')==='id,message,success';
  try{
    document.body.append(panel);await panel.updateComplete;
    if(status()!=='Sin pago'||button()?.disabled||panel.pending!==false)return {passed:false,receivedValue:'Estado inicial: '+status()+', pending='+panel.pending};
    const serviceKey=Object.keys(panel).find(key=>typeof panel[key]?.charge==='function');
    const service=serviceKey&&panel[serviceKey];
    const providerKey=service&&Object.keys(service).find(key=>typeof service[key]?.pay==='function');
    if(!serviceKey||!providerKey)return {passed:false,receivedValue:'El panel no expone un puerto charge con proveedor reemplazable.'};

    let calls=[];
    service[providerKey]={pay:async amount=>{calls.push(amount);return {ok:true,transaction:'no-debe-usarse',note:'No debe cobrarse'};}};
    await panel.submit(0);await panel.updateComplete;
    if(calls.length!==0||!contractKeys(panel.result)||panel.result.success!==false||panel.result.id!==null||!panel.result.message||status()!==panel.result.message)return {passed:false,receivedValue:'Monto inválido: calls='+calls.length+', result='+JSON.stringify(panel.result)+', vista='+status()};

    let resolvePayment;
    service[providerKey]={pay:amount=>{calls.push(amount);return new Promise(resolve=>{resolvePayment=resolve;});}};
    const payment=panel.submit('1250');await panel.updateComplete;
    if(panel.pending!==true||button()?.disabled!==true||status()!=='Procesando')return {passed:false,receivedValue:'Durante el pago: pending='+panel.pending+', disabled='+button()?.disabled+', vista='+status()};
    resolvePayment({ok:true,transaction:'a-9',note:'Aprobado por A'});await payment;await panel.updateComplete;
    if(calls.length!==1||calls[0]!==1250||!contractKeys(panel.result)||panel.result.success!==true||panel.result.id!=='a-9'||panel.result.message!=='Aprobado por A'||panel.pending!==false||button()?.disabled||status()!=='Aprobado por A')return {passed:false,receivedValue:'Pago A: calls='+JSON.stringify(calls)+', result='+JSON.stringify(panel.result)+', vista='+status()};

    service[providerKey]={pay:async()=>{throw new Error('secreto del proveedor');}};
    await panel.submit(300);await panel.updateComplete;
    if(!contractKeys(panel.result)||panel.result.success!==false||panel.result.id!==null||!panel.result.message||panel.result.message.includes('secreto')||panel.pending!==false||status()!==panel.result.message)return {passed:false,receivedValue:'Error externo: '+JSON.stringify(panel.result)+', vista='+status()};

    panel[serviceKey]={charge:async amount=>({success:amount===700,message:'Aprobado por B',id:'b-7'})};
    await panel.submit(700);await panel.updateComplete;
    return {passed:panel.result?.success===true&&panel.result?.id==='b-7'&&status()==='Aprobado por B'&&!('ok' in panel.result),receivedValue:'Proveedor B: '+JSON.stringify(panel.result)+', vista='+status()};
  }catch(error){return {passed:false,receivedValue:'No se pudo recorrer la frontera de pago: '+(error?.message||String(error))};}
  finally{panel.remove();}
}`);

const shippingAdapterBoundaryTest = browserTest('lit36-d0', 'La tarjeta solo consume cotizaciones normalizadas e intercambiables', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('shipping-card');
  const card=document.createElement('shipping-card');
  const root=element=>element.shadowRoot||element;
  const view=()=>root(card).querySelector('p')?.textContent.trim()??'';
  const contractKeys=result=>result&&Object.keys(result).sort().join(',')==='cost,currency';
  try{
    document.body.append(card);await card.updateComplete;
    if(view()!=='--')return {passed:false,receivedValue:'Estado inicial: '+view()};
    const serviceKey=Object.keys(card).find(key=>typeof card[key]?.quote==='function');
    if(!serviceKey)return {passed:false,receivedValue:'La tarjeta no conserva un puerto quote reemplazable.'};

    await card.load();await card.updateComplete;
    const first=Object.values(card).find(value=>contractKeys(value));
    if(!first||first.cost!==9.5||first.currency!=='USD'||view()!=='9.5 USD')return {passed:false,receivedValue:'Proveedor original: result='+JSON.stringify(first)+', vista='+view()};

    card[serviceKey]={quote:async()=>({cost:17,currency:'EUR'})};
    await card.load();await card.updateComplete;
    const second=Object.values(card).find(value=>contractKeys(value));
    if(!second||second.cost!==17||second.currency!=='EUR'||view()!=='17 EUR')return {passed:false,receivedValue:'Adapter alternativo: result='+JSON.stringify(second)+', vista='+view()};

    card[serviceKey]={quote:async()=>({cost:0,currency:'COP'})};
    await card.load();await card.updateComplete;
    const zero=Object.values(card).find(value=>contractKeys(value)&&value.currency==='COP');
    return {passed:zero?.cost===0&&view()==='0 COP',receivedValue:'Costo cero: result='+JSON.stringify(zero)+', vista='+view()};
  }catch(error){return {passed:false,receivedValue:'No se pudo recorrer la frontera de envío: '+(error?.message||String(error))};}
  finally{card.remove();}
}`);

const museumVerticalSliceTest = browserTest('lit37-museum-slice', 'La sala recorre búsqueda, estados, normalización y favoritos sin datos crudos', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('museum-room');
  const room=document.createElement('museum-room');
  const root=element=>element.shadowRoot||element;
  const text=()=>root(room).textContent.replace(/\s+/g,' ').trim();
  const waitFor=async predicate=>{for(let attempt=0;attempt<40;attempt+=1){await room.updateComplete;if(predicate())return true;await new Promise(resolve=>setTimeout(resolve,5));}return false;};
  try{
    document.body.append(room);await room.updateComplete;
    const form=root(room).querySelector('form');
    const input=form?.querySelector('input[name="query"]');
    const submitButton=form?.querySelector('button');
    if(!form||!input||!submitButton||!(input.labels?.length||input.getAttribute('aria-label')))return {passed:false,receivedValue:'Falta un formulario con búsqueda etiquetada y botón.'};
    const submit=async value=>{input.value=value;const event=new document.defaultView.Event('submit',{bubbles:true,cancelable:true});const dispatched=form.dispatchEvent(event);await room.updateComplete;return !dispatched;};
    const originalService=room.service;
    const clientKey=originalService&&Object.keys(originalService).find(key=>typeof originalService[key]==='function');
    if(typeof originalService?.search!=='function'||!clientKey)return {passed:false,receivedValue:'Falta un servicio search con cliente reemplazable.'};

    let resolveSlow;
    room.service={search:async query=>{
      if(query==='lento')return new Promise(resolve=>{resolveSlow=resolve;});
      if(query==='vacío')return [];
      if(query==='error')throw new Error('detalle secreto');
      return [{id:'ready',title:'Lista',artist:'Autora',year:'2026',imageUrl:''}];
    }};
    if(!(await submit('lento')))return {passed:false,receivedValue:'El formulario no previno la navegación.'};
    if(!(await waitFor(()=>text().includes('Cargando'))))return {passed:false,receivedValue:'Estado pendiente: '+text()};
    resolveSlow([]);
    if(!(await waitFor(()=>text().includes('Sin obras'))))return {passed:false,receivedValue:'Estado vacío: '+text()};

    await submit('error');
    if(!(await waitFor(()=>text().includes('No se pudo cargar')))||text().includes('detalle secreto'))return {passed:false,receivedValue:'Estado de error: '+text()};

    let receivedQuery,receivedSignal;
    originalService[clientKey]=async(query,options)=>{receivedQuery=query;receivedSignal=options?.signal;return {items:[{objectID:0,title:'',artistDisplayName:'',objectDate:'',primaryImageSmall:''}]};};
    room.service=originalService;
    await submit('  nueva  ');
    if(!(await waitFor(()=>text().includes('Sin título'))))return {passed:false,receivedValue:'Estado listo: '+text()};
    const art=Array.isArray(room.searchTask?.value)?room.searchTask.value[0]:undefined;
    const keys=art&&Object.keys(art).sort().join(',');
    if(receivedQuery!=='nueva'||!receivedSignal||typeof receivedSignal.aborted!=='boolean'||keys!=='artist,id,imageUrl,title,year'||JSON.stringify(art)!==JSON.stringify({id:'0',title:'Sin título',artist:'Autor desconocido',year:'Fecha desconocida',imageUrl:''}))return {passed:false,receivedValue:'Contrato listo: query='+receivedQuery+', signal='+Boolean(receivedSignal)+', art='+JSON.stringify(art)};
    const article=root(room).querySelector('article[data-id="0"]');
    const favoriteButton=article?.querySelector('button');
    if(!article||article.querySelector('img')||!article.textContent.includes('Imagen no disponible')||!article.textContent.includes('Autor desconocido')||!article.textContent.includes('Fecha desconocida')||!favoriteButton)return {passed:false,receivedValue:'Tarjeta normalizada: '+(article?.textContent??'ausente')};

    const beforeAdd=room.favorites;favoriteButton.click();await room.updateComplete;
    if(room.favorites===beforeAdd||JSON.stringify(room.favorites)!=='["0"]'||favoriteButton.getAttribute('aria-pressed')!=='true')return {passed:false,receivedValue:'Añadir favorito: '+JSON.stringify(room.favorites)+', pressed='+favoriteButton.getAttribute('aria-pressed')};
    const beforeRemove=room.favorites;favoriteButton.click();await room.updateComplete;
    return {passed:room.favorites!==beforeRemove&&room.favorites.length===0&&favoriteButton.getAttribute('aria-pressed')==='false',receivedValue:'Quitar favorito: '+JSON.stringify(room.favorites)+', pressed='+favoriteButton.getAttribute('aria-pressed')};
  }catch(error){return {passed:false,receivedValue:'No se pudo recorrer la sala: '+(error?.message||String(error))};}
  finally{room.remove();}
}`);

const artCardResilienceTest = browserTest('lit37-art-card', 'La tarjeta reacciona al modelo normalizado y representa imagen o fallback', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('art-card');
  const card=document.createElement('art-card');
  const root=element=>element.shadowRoot||element;
  const view=()=>root(card);
  try{
    document.body.append(card);await card.updateComplete;
    if(view().querySelector('img')||view().querySelector('h2')?.textContent.trim()!=='Sin título'||!view().textContent.includes('Imagen no disponible'))return {passed:false,receivedValue:'Sin datos: '+view().textContent.trim()};
    card.art={title:'Sin imagen',image:{url:'https://raw.example/art.jpg'}};await card.updateComplete;
    if(view().querySelector('img')||!view().textContent.includes('Sin imagen')||!view().textContent.includes('Imagen no disponible'))return {passed:false,receivedValue:'Campo crudo ausente: '+view().textContent.trim()};
    card.art={title:' Retrato ',imageUrl:'https://example.test/art.jpg'};await card.updateComplete;
    const image=view().querySelector('img');
    if(!image||image.getAttribute('src')!=='https://example.test/art.jpg'||image.getAttribute('alt')!=='Retrato'||view().querySelector('h2')?.textContent.trim()!=='Retrato'||view().textContent.includes('Imagen no disponible'))return {passed:false,receivedValue:'Con imagen: src='+image?.getAttribute('src')+', alt='+image?.getAttribute('alt')+', texto='+view().textContent.trim()};
    card.art={title:'',imageUrl:''};await card.updateComplete;
    return {passed:!view().querySelector('img')&&view().querySelector('h2')?.textContent.trim()==='Sin título'&&view().textContent.includes('Imagen no disponible'),receivedValue:'Actualización vacía: '+view().textContent.trim()};
  }catch(error){return {passed:false,receivedValue:'No se pudo renderizar la tarjeta: '+(error?.message||String(error))};}
  finally{card.remove();}
}`);

const weatherConcurrencyContractTest = browserTest('lit38-weather-contract', 'El tablero normaliza unidades y conserva cada resultado concurrente', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('weather-dashboard');
  const dashboard=document.createElement('weather-dashboard');
  const root=element=>element.shadowRoot||element;
  const rows=()=>[...root(dashboard).querySelectorAll('article')];
  const keys=value=>value&&Object.keys(value).sort().join(',');
  try{
    document.body.append(dashboard);await dashboard.updateComplete;
    const select=root(dashboard).querySelector('select'),button=root(dashboard).querySelector('button');
    if(!select||!button||!(select.labels?.length||select.getAttribute('aria-label'))||select.value!=='C')return {passed:false,receivedValue:'Falta un selector de unidad etiquetado, valor C y botón Actualizar.'};
    const originalService=dashboard.service;
    const clientKey=originalService&&Object.keys(originalService).find(key=>typeof originalService[key]==='function');
    if(typeof originalService?.current!=='function'||!clientKey)return {passed:false,receivedValue:'Falta un servicio current con cliente reemplazable.'};

    originalService[clientKey]=async city=>({name:city,tempC:10,condition:'Nublado',secret:'no publicar'});
    const celsius=await originalService.current('Pasto','C'),fahrenheit=await originalService.current('Pasto','F');
    const contract='city,condition,id,temperature,unit';
    if(keys(celsius)!==contract||JSON.stringify(celsius)!==JSON.stringify({id:'Pasto',city:'Pasto',temperature:10,unit:'C',condition:'Nublado'}))return {passed:false,receivedValue:'Contrato Celsius: '+JSON.stringify(celsius)};
    if(keys(fahrenheit)!==contract||fahrenheit.temperature!==50||fahrenheit.unit!=='F')return {passed:false,receivedValue:'Contrato Fahrenheit: '+JSON.stringify(fahrenheit)};

    select.value='F';select.dispatchEvent(new Event('change',{bubbles:true,composed:true}));await dashboard.updateComplete;
    if(dashboard.unit!=='F')return {passed:false,receivedValue:'El selector no actualizó la unidad: '+dashboard.unit};
    dashboard.cities=['Pasto','Quito','Cali'];
    const calls=[],pending=new Map();
    dashboard.service={current:(city,unit)=>{calls.push({city,unit});return new Promise((resolve,reject)=>pending.set(city,{resolve,reject}));}};
    const refresh=dashboard.refresh();await Promise.resolve();
    if(calls.length!==3||calls.map(call=>call.city).join('|')!=='Pasto|Quito|Cali'||calls.some(call=>call.unit!=='F'))return {passed:false,receivedValue:'Las consultas no empezaron juntas con identidad y unidad: '+JSON.stringify(calls)};
    pending.get('Cali').resolve({id:'Cali',city:'Cali',temperature:77,unit:'F',condition:'Sol'});
    pending.get('Pasto').resolve({id:'Pasto',city:'Pasto',temperature:50,unit:'F',condition:'Nublado'});
    pending.get('Quito').reject(new Error('detalle externo'));
    await refresh;await dashboard.updateComplete;
    const firstResults=dashboard.results;
    if(firstResults.length!==3||firstResults.map(row=>row.city).join('|')!=='Pasto|Quito|Cali'||firstResults.map(row=>row.status).join('|')!=='ready|error|ready')return {passed:false,receivedValue:'Resultados parciales: '+JSON.stringify(firstResults)};
    if(keys(firstResults[0])!=='city,condition,id,status,temperature,unit'||keys(firstResults[1])!=='city,id,status'||firstResults[1].id!=='Quito')return {passed:false,receivedValue:'Identidad o contrato de filas: '+JSON.stringify(firstResults)};
    const rendered=rows();
    if(rendered.length!==3||rendered.map(row=>row.getAttribute('data-id')).join('|')!=='Pasto|Quito|Cali'||!rendered[0].textContent.includes('50')||!rendered[0].textContent.includes('F')||!rendered[1].textContent.includes('Quito')||!rendered[1].textContent.includes('No disponible')||!rendered[2].textContent.includes('77'))return {passed:false,receivedValue:'Vista parcial: '+rendered.map(row=>row.textContent.trim()).join(' / ')};

    dashboard.cities=['Tunja'];dashboard.unit='C';dashboard.service={current:async(city,unit)=>({id:city,city,temperature:4,unit,condition:'Lluvia'})};
    await dashboard.refresh();await dashboard.updateComplete;
    return {passed:dashboard.results!==firstResults&&dashboard.results.length===1&&dashboard.results[0].city==='Tunja'&&rows().length===1&&rows()[0].textContent.includes('4')&&rows()[0].textContent.includes('C'),receivedValue:'Segundo refresco: '+JSON.stringify(dashboard.results)+' / '+rows().map(row=>row.textContent.trim()).join(' | ')};
  }catch(error){return {passed:false,receivedValue:'No se pudo recorrer el tablero climático: '+(error?.message||String(error))};}
  finally{dashboard.remove();}
}`);

const cityBoardPartialFailureTest = browserTest('lit38-city-board', 'El tablero inicia en paralelo y representa cada éxito o fallo por separado', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('city-board');
  const board=document.createElement('city-board');
  const root=element=>element.shadowRoot||element;
  const texts=()=>[...root(board).querySelectorAll('[data-id]')].map(row=>row.textContent.trim());
  try{
    document.body.append(board);await board.updateComplete;
    const calls=[],pending=[];
    board.loaders=['Bogotá','Error','Lima'].map((city,index)=>()=>{calls.push(city);return new Promise((resolve,reject)=>pending[index]={resolve,reject});});
    const load=board.load();await Promise.resolve();
    if(calls.join('|')!=='Bogotá|Error|Lima')return {passed:false,receivedValue:'Los loaders no comenzaron juntos: '+calls.join('|')};
    pending[2].resolve('Lima');pending[0].resolve('Bogotá');pending[1].reject(new Error('fallo externo'));
    await load;await board.updateComplete;
    const firstRows=board.rows;
    if(firstRows.length!==3||firstRows.map(row=>row.status).join('|')!=='ready|error|ready'||firstRows[0].city!=='Bogotá'||firstRows[2].city!=='Lima')return {passed:false,receivedValue:'Filas parciales: '+JSON.stringify(firstRows)};
    if(texts().join('|')!=='Bogotá|No disponible|Lima')return {passed:false,receivedValue:'Vista parcial: '+texts().join('|')};

    board.loaders=[()=>Promise.resolve('Cali'),()=>Promise.reject(new Error('otro'))];
    await board.load();await board.updateComplete;
    return {passed:board.rows!==firstRows&&board.rows.length===2&&board.rows[0].city==='Cali'&&board.rows[1].status==='error'&&texts().join('|')==='Cali|No disponible',receivedValue:'Segundo intento: '+JSON.stringify(board.rows)+' / '+texts().join('|')};
  }catch(error){return {passed:false,receivedValue:'No se pudo recorrer las ciudades: '+(error?.message||String(error))};}
  finally{board.remove();}
}`);

const ssrHydrationBoundaryTest = browserTest('lit39-universal-boundary', 'El contenido no depende del cliente y la hidratación conserva un único efecto', String.raw`async ({window,document,customElements})=>{
  await customElements.whenDefined('ssr-product-card');
  const card=document.createElement('ssr-product-card'),root=()=>card.shadowRoot||card;
  const heading=()=>root().querySelector('h2')?.textContent.trim()??'';
  const price=()=>root().querySelector('p')?.textContent.trim()??'';
  const button=()=>root().querySelector('button');
  const listeners=new Map();let adds=0,removes=0,updates=0;
  const environment={
    addEventListener(type,listener){adds+=1;const group=listeners.get(type)??new Set();group.add(listener);listeners.set(type,group);},
    removeEventListener(type,listener){removes+=1;listeners.get(type)?.delete(listener);},
    dispatch(type){for(const listener of [...(listeners.get(type)??[])])typeof listener==='function'?listener({type}):listener.handleEvent?.({type});},
  };
  const originalUpdate=card.requestUpdate.bind(card);
  card.requestUpdate=(...args)=>{updates+=1;return originalUpdate(...args);};
  let previousWidth;
  try{
    card.setAttribute('name','Mesa');card.setAttribute('price','125');document.body.append(card);await card.updateComplete;
    const article=root().querySelector('article'),initialButton=button();
    if(!article||heading()!=='Mesa'||price()!=='Precio: 125'||!initialButton||initialButton.getAttribute('aria-pressed')!=='false'||initialButton.textContent.trim()!=='Guardar')return {passed:false,receivedValue:'Contenido inicial: '+root().textContent.trim()};

    card.name='Lámpara';card.price=47;await card.updateComplete;
    if(heading()!=='Lámpara'||price()!=='Precio: 47'||button()!==initialButton)return {passed:false,receivedValue:'Cambio de datos: '+root().textContent.trim()};
    initialButton.click();await card.updateComplete;
    if(card.saved!==true||button()?.getAttribute('aria-pressed')!=='true'||button()?.textContent.trim()!=='Guardado')return {passed:false,receivedValue:'Después de hidratar la acción: '+root().textContent.trim()};

    if(typeof card.connectClient!=='function'||typeof card.disconnectClient!=='function'||card.connectClient(undefined)!==false)return {passed:false,receivedValue:'Falta una frontera cliente que ignore un entorno ausente.'};
    card.connectClient(environment);card.connectClient(environment);
    updates=0;environment.dispatch('product-refresh');await card.updateComplete;
    if(adds!==2||removes<1||updates!==1)return {passed:false,receivedValue:'Rehidratación: altas='+adds+', bajas='+removes+', updates='+updates};
    card.disconnectClient();updates=0;environment.dispatch('product-refresh');await Promise.resolve();
    if(updates!==0)return {passed:false,receivedValue:'La frontera cliente siguió activa tras limpiar.'};

    previousWidth=Object.getOwnPropertyDescriptor(window,'innerWidth');
    if(previousWidth?.configurable){Object.defineProperty(window,'innerWidth',{configurable:true,get(){throw new Error('layout no disponible durante render');}});card.render();}
    return {passed:heading()==='Lámpara'&&price()==='Precio: 47',receivedValue:'Contenido='+heading()+' / '+price()+', altas='+adds+', bajas='+removes};
  }catch(error){return {passed:false,receivedValue:'La frontera universal falló: '+(error?.message||String(error))};}
  finally{if(previousWidth?.configurable)Object.defineProperty(window,'innerWidth',previousWidth);card.remove();}
}`);

const viewportEnvironmentLifecycleTest = browserTest('lit39-viewport-boundary', 'El viewport usa fallback, reacciona y limpia sin depender del nivel de módulo', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('viewport-card');
  const card=document.createElement('viewport-card'),root=()=>card.shadowRoot||card,text=()=>root().querySelector('p')?.textContent.trim()??'';
  const makeEnvironment=width=>{
    const listeners=new Map();
    return {innerWidth:width,adds:0,removes:0,
      addEventListener(type,listener){this.adds+=1;const group=listeners.get(type)??new Set();group.add(listener);listeners.set(type,group);},
      removeEventListener(type,listener){this.removes+=1;listeners.get(type)?.delete(listener);},
      dispatch(type){for(const listener of [...(listeners.get(type)??[])])typeof listener==='function'?listener({type}):listener.handleEvent?.({type});},
    };
  };
  const first=makeEnvironment(777),second=makeEnvironment(333);
  let updates=0;const originalUpdate=card.requestUpdate.bind(card);card.requestUpdate=(...args)=>{updates+=1;return originalUpdate(...args);};
  try{
    if(typeof card.readWidth!=='function'||card.readWidth(undefined)!==0||card.readWidth(first)!==777)return {passed:false,receivedValue:'La lectura aislada no devuelve 0/777.'};
    document.body.append(card);await card.updateComplete;
    if(!/^Ancho:\s*\d+$/.test(text()))return {passed:false,receivedValue:'Vista inicial: '+text()};

    card.start(first);await card.updateComplete;
    if(text()!=='Ancho: 777'||first.adds!==1)return {passed:false,receivedValue:'Primer entorno: '+text()+', altas='+first.adds};
    first.innerWidth=512;updates=0;first.dispatch('resize');await card.updateComplete;
    if(text()!=='Ancho: 512'||updates!==1)return {passed:false,receivedValue:'Resize: '+text()+', updates='+updates};

    card.start(second);await card.updateComplete;updates=0;first.innerWidth=999;first.dispatch('resize');await Promise.resolve();
    if(updates!==0||text()!=='Ancho: 333'||first.removes!==1||second.adds!==1)return {passed:false,receivedValue:'Cambio de entorno: '+text()+', updates='+updates+', bajas='+first.removes};
    second.innerWidth=444;second.dispatch('resize');await card.updateComplete;
    if(text()!=='Ancho: 444')return {passed:false,receivedValue:'Segundo entorno: '+text()};

    card.remove();updates=0;second.innerWidth=555;second.dispatch('resize');await Promise.resolve();
    return {passed:updates===0&&text()==='Ancho: 444'&&second.removes===1,receivedValue:'Desconectado: '+text()+', updates='+updates+', bajas='+second.removes};
  }catch(error){return {passed:false,receivedValue:'No se pudo recorrer el viewport: '+(error?.message||String(error))};}
  finally{card.remove();}
}`);

const supportCenterVerticalSliceTest = browserTest('lit40-support-slice', 'El centro carga, crea, filtra, cierra y se recupera sin romper el contrato', String.raw`async ({window,document,customElements})=>{
  await customElements.whenDefined('support-center');
  const center=document.createElement('support-center'),root=()=>center.shadowRoot||center;
  const status=()=>root().querySelector('[role="status"]')?.textContent.trim()??'';
  const rows=()=>[...root().querySelectorAll('li')];
  const strict=ticket=>ticket&&Object.keys(ticket).sort().join(',')==='id,priority,status,title';
  const settle=async()=>{await Promise.resolve();await center.updateComplete;await Promise.resolve();await center.updateComplete;};
  let resolveLoad,resolveSave;const saved=[];
  const storage={
    load:()=>new Promise(resolve=>{resolveLoad=resolve;}),
    save:tickets=>{saved.push(tickets);return new Promise(resolve=>{resolveSave=resolve;});},
  };
  try{
    if(!center.service||!('storage' in center.service))return {passed:false,receivedValue:'Falta un servicio con almacenamiento reemplazable.'};
    center.service.storage=storage;document.body.append(center);await center.updateComplete;
    if(center.status!=='loading'||status()!=='Cargando')return {passed:false,receivedValue:'Durante load: '+center.status+' / '+status()};
    resolveLoad([{ticket_id:7,title:'  Acceso  ',priority:'2',state:'open',secret:'no filtrar'}]);
    await settle();
    const original=center.tickets[0];
    if(center.status!=='ready'||center.tickets.length!==1||!strict(original)||original.id!=='7'||original.title!=='Acceso'||original.priority!==2||original.status!=='open'||rows().length!==1||!root().textContent.includes('Acceso'))return {passed:false,receivedValue:'Carga normalizada: '+JSON.stringify(center.tickets)+' / '+root().textContent.trim()};

    const title=root().querySelector('input[name="title"]'),priority=root().querySelector('select[name="priority"]'),filter=root().querySelector('select:not([name="priority"])'),form=root().querySelector('form');
    if(!title||!priority||!filter||!form||!title.labels?.length||!priority.labels?.length||!filter.labels?.length)return {passed:false,receivedValue:'Faltan formulario, controles o etiquetas.'};
    const beforeInvalid=center.tickets;
    let invalidSaves=0;storage.save=async()=>{invalidSaves+=1;};
    if(await center.createTicket(' ',2)!==false||await center.createTicket('Inválido',0)!==false||await center.createTicket('Inválido',4)!==false||center.tickets!==beforeInvalid||invalidSaves!==0)return {passed:false,receivedValue:'Entradas inválidas: tickets='+center.tickets.length+', saves='+invalidSaves};

    storage.save=tickets=>{saved.push(tickets);return new Promise(resolve=>{resolveSave=resolve;});};
    title.value='  Impresora  ';priority.value='3';
    const prevented=!form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
    await settle();
    const createButton=form.querySelector('button');
    if(!prevented||center.status!=='saving'||status()!=='Guardando'||createButton?.disabled!==true||center.tickets!==beforeInvalid||center.tickets.length!==1||saved.length!==1||saved[0].length!==2)return {passed:false,receivedValue:'Durante creación: prevented='+prevented+', status='+center.status+', tickets='+center.tickets.length+', saves='+saved.length};
    resolveSave();await settle();
    const created=center.tickets[1];
    if(center.status!=='ready'||center.tickets[0]!==original||!strict(created)||created.title!=='Impresora'||created.priority!==3||created.status!=='open'||saved[0]===center.tickets||saved[0][0]===center.tickets[0]||rows().length!==2)return {passed:false,receivedValue:'Creación persistida: '+JSON.stringify(center.tickets)};

    filter.value='closed';filter.dispatchEvent(new window.Event('change',{bubbles:true}));await center.updateComplete;
    if(center.filter!=='closed'||rows().length!==0||!root().textContent.includes('Sin resultados'))return {passed:false,receivedValue:'Filtro cerrado vacío: '+root().textContent.trim()};
    filter.value='open';filter.dispatchEvent(new window.Event('change',{bubbles:true}));await center.updateComplete;
    if(rows().length!==2)return {passed:false,receivedValue:'Filtro abiertos: filas='+rows().length};

    storage.save=async tickets=>{saved.push(tickets);};
    const closeButton=root().querySelector('li[data-id="'+created.id+'"] button');closeButton?.click();await settle();
    const closed=center.tickets.find(ticket=>ticket.id===created.id);
    if(!closed||closed===created||closed.status!=='closed'||center.tickets[0]!==original||saved.at(-1)===center.tickets)return {passed:false,receivedValue:'Cierre: '+JSON.stringify(center.tickets)};
    center.filter='closed';await center.updateComplete;
    if(rows().length!==1||!rows()[0].textContent.includes('Impresora')||rows()[0].querySelector('button')?.disabled!==true)return {passed:false,receivedValue:'Vista cerrados: '+root().textContent.trim()};

    const beforeFailure=center.tickets;storage.save=async()=>{throw new Error('detalle privado');};
    if(await center.createTicket('No guardar',2)!==false||center.tickets!==beforeFailure||center.status!=='error'||!status().includes('No se pudo')||status().includes('detalle'))return {passed:false,receivedValue:'Fallo atómico: '+center.status+' / '+status()};
    storage.save=async tickets=>{saved.push(tickets);};center.filter='all';
    if(await center.createTicket('Recuperado',1)!==true||center.status!=='ready'||!center.tickets.some(ticket=>ticket.title==='Recuperado'))return {passed:false,receivedValue:'Recuperación: '+JSON.stringify(center.tickets)};

    storage.load=async()=>{throw new Error('carga privada');};
    if(await center.load()!==false||center.status!=='error'||center.tickets.length!==0||!status().includes('No se pudo'))return {passed:false,receivedValue:'Fallo de carga: '+center.status+' / '+status()};
    storage.load=async()=>[{ticket_id:'r1',title:'Restaurado',priority:1,state:'closed'}];
    const loaded=await center.load();await center.updateComplete;
    return {passed:loaded===true&&center.status==='ready'&&center.tickets.length===1&&strict(center.tickets[0])&&center.tickets[0].title==='Restaurado',receivedValue:'Estado final: '+JSON.stringify(center.tickets)+' / '+status()};
  }catch(error){return {passed:false,receivedValue:'No se pudo recorrer el capstone: '+(error?.message||String(error))};}
  finally{center.remove();}
}`);

const projectBoardAtomicPersistenceTest = browserTest('lit40-project-version', 'El tablero asigna exactamente la versión persistida y conserva el estado ante fallos', String.raw`async ({document,customElements})=>{
  await customElements.whenDefined('project-board');
  const board=document.createElement('project-board'),root=()=>board.shadowRoot||board;
  const count=()=>root().querySelector('p')?.textContent.trim()??'';
  let resolveSave,saved;
  try{
    document.body.append(board);await board.updateComplete;
    if(board.cards.length!==0||count()!=='0')return {passed:false,receivedValue:'Estado inicial: '+JSON.stringify(board.cards)+' / '+count()};
    let invalidSaves=0;board.storage={save:async()=>{invalidSaves+=1;}};
    if(await board.add(' ')!==false||invalidSaves!==0||board.cards.length!==0)return {passed:false,receivedValue:'El título vacío llegó a persistencia.'};

    board.storage={save:cards=>{saved=cards;return new Promise(resolve=>{resolveSave=resolve;});}};
    const firstPromise=board.add('  Uno  ');await board.updateComplete;
    if(board.status!=='saving'||board.cards.length!==0||!Array.isArray(saved)||saved.length!==1||saved[0].title!=='Uno'||count()!=='0')return {passed:false,receivedValue:'Durante primer save: '+board.status+', cards='+board.cards.length+', saved='+JSON.stringify(saved)};
    const firstVersion=saved;resolveSave();
    if(await firstPromise!==true)return {passed:false,receivedValue:'add no confirmó el éxito.'};
    await board.updateComplete;
    if(board.cards!==firstVersion||count()!=='1'||board.status!=='ready')return {passed:false,receivedValue:'Primera versión: same='+(board.cards===firstVersion)+', count='+count()};

    const firstCard=board.cards[0];let secondVersion;
    board.storage={save:async cards=>{secondVersion=cards;}};
    if(await board.add('Dos')!==true||board.cards!==secondVersion||board.cards===firstVersion||board.cards[0]!==firstCard||board.cards.length!==2)return {passed:false,receivedValue:'Segunda versión: '+JSON.stringify(board.cards)};
    await board.updateComplete;if(count()!=='2')return {passed:false,receivedValue:'Conteo después de dos: '+count()};

    const beforeFailure=board.cards;board.storage={save:async()=>{throw new Error('privado');}};
    if(await board.add('Tres')!==false||board.cards!==beforeFailure||board.cards.length!==2||board.status!=='error')return {passed:false,receivedValue:'Fallo: cards='+board.cards.length+', status='+board.status};
    await board.updateComplete;
    if(count()!=='2'||!root().querySelector('[role="status"]')?.textContent.includes('No se pudo'))return {passed:false,receivedValue:'Vista del fallo: '+root().textContent.trim()};
    board.storage={save:async cards=>{saved=cards;}};
    const recovered=await board.add('Tres');await board.updateComplete;
    return {passed:recovered===true&&board.cards===saved&&board.cards.length===3&&count()==='3'&&board.status==='ready',receivedValue:'Estado final: '+JSON.stringify(board.cards)};
  }catch(error){return {passed:false,receivedValue:'No se pudo recorrer la persistencia: '+(error?.message||String(error))};}
  finally{board.remove();}
}`);

export const COMPONENT_SPECS_33_TO_40 = [
  lesson({
    number: 33, module: 12, title: 'Directivas personalizadas: cuándo crear una abstracción', appName: 'un formulario que resalta campos inválidos sin duplicar lógica DOM',
    summary: 'Construye una directiva pequeña cuando una operación de render repetida necesita ciclo y acceso al elemento.',
    concepts: [{ label: 'Directiva personalizada', desc: 'Unidad de render reutilizable que participa en el ciclo de una parte del template.' }, { label: 'PartInfo', desc: 'Información sobre la clase de binding donde se usa una directiva.' }],
    skillsRequired: ['lit-repeat', 'lit-style-directives'], skillsIntroduced: ['lit-custom-directives', 'directive-lifecycle'],
    reasoningSteps: ['El template entrega valor y regla', 'La directiva valida su tipo de parte', 'update compara la entrada', 'El elemento recibe solo el efecto necesario'],
    html: appHtml('Validación', '<validation-form></validation-form>'),
    example: `import { LitElement, html } from 'lit';
import { Directive, directive, PartType } from 'lit/directive.js';
class AriaCurrentDirective extends Directive {
  constructor(partInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.CHILD)
      throw new Error('ariaCurrent requiere una ChildPart');
  }
  update(part, [active]) {
    part.parentNode.toggleAttribute('aria-current', active);
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
    challengeTitle: 'App: directiva de validación enfocada', challengeInstructions: 'Completa invalidField para que cada formulario sincronice su propio input y aviso en cada cambio. Vacío o correo válido no muestran mensaje ni aria-invalid=true; un correo no vacío sin @ muestra aria-invalid=true y “Escribe un correo válido”. Conserva los nodos y no consultes el documento completo: la regla y email siguen perteneciendo al formulario.',
    tests: [invalidFieldLifecycleTest],
    hints: ['La directiva adapta el render; el formulario conserva email y la regla.', 'En una ChildPart, parentNode es el contenedor donde se inserta el resultado. Desde ese contexto local puedes localizar el control relacionado.', 'Actualiza aria-invalid desde update y devuelve desde render el mensaje vigente o una cadena vacía.'],
    model: 'Una directiva personalizada es un adaptador del render, no un componente escondido: recibe entradas, opera sobre una parte concreta y devuelve lo que esa parte debe mostrar.',
    whenToUse: 'Créala cuando el mismo comportamiento de binding aparece en varios componentes y necesita conocer su parte; usa una función normal si solo transformas datos.',
    bestPractices: 'Valida el tipo de parte, documenta dónde puede usarse, conserva responsabilidades estrechas y evita guardar estado de negocio dentro de la directiva.',
    commonErrors: 'crear directivas para formatear texto, asumir cualquier Part, consultar todo el documento o esconder validación de dominio dentro del render.',
    transfer: 'Decide si formato de moneda, autofocus condicional, tooltip y sanitización pertenecen a función, directiva o componente.',
    sources: [source('Custom directives', 'https://lit.dev/docs/templates/custom-directives/', 'Comprende Directive, Part y ciclo.', 'Lit'), source('Directive API', 'https://lit.dev/docs/api/directives/', 'Consulta contratos de directivas.', 'Lit')],
    debug: { title: 'La directiva conserva el primer valor para siempre', expected: 'Cada live-label muestra siempre su label vigente, incluido el valor vacío; dos instancias no comparten el primer valor y las actualizaciones rápidas terminan en el último.', observed: 'render ignora actualizaciones después de la primera.',
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
      tests: [liveLabelCurrentValueTest],
      hints: ['La entrada de render ya es la versión vigente, incluso cuando es una cadena vacía.', 'No toda directiva necesita memoria; guardar el primer valor mezcla tiempos que el host ya controla.', 'Devuelve el argumento de cada actualización y deja que cada posición del template conserve su propia instancia.'] },
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
    challengeTitle: 'App: avisos accesibles y no bloqueantes', challengeInstructions: 'Completa add para que el aviso exista y se anuncie antes de cualquier animación. Cada llamada conserva un id único y su mensaje; aria-live=polite contiene filas con Cerrar que eliminan solo su aviso. Con prefers-reduced-motion no llames animate; sin reducción, anima la fila recién añadida cuando ya esté conectada usando al menos dos keyframes de opacity o transform. El contenido nunca depende de que la animación termine.',
    tests: [noticeMotionPreferenceTest],
    hints: ['Primero crea el aviso en el estado; la animación no debe crear ni desbloquear el contenido.', 'Espera a que Lit termine la actualización antes de localizar la fila por el id que acabas de asignar.', 'Consulta la preferencia de movimiento: si solicita reducción, conserva exactamente la misma funcionalidad sin llamar animate.'],
    model: 'La animación explica un cambio que ya ocurrió en el estado. La aplicación debe seguir siendo correcta si dura cero milisegundos o si el navegador decide no ejecutarla.',
    whenToUse: 'Anima para orientar atención o continuidad espacial; evita movimiento decorativo continuo y cualquier flujo que dependa de esperar una transición.',
    bestPractices: 'Respeta reduced motion, limita propiedades a transform/opacity, cancela animaciones obsoletas y mantiene foco y aria-live independientes.',
    commonErrors: 'animar antes de que exista el nodo, usar setTimeout como reloj del DOM, ocultar información hasta animationend o ignorar preferencias.',
    transfer: 'Diseña estados sin animación y luego decide qué movimiento ayuda en modal, acordeón, lista reordenada y carga.',
    sources: [source('Web Animations API', 'https://developer.mozilla.org/docs/Web/API/Web_Animations_API', 'Usa la API nativa de animación.'), source('prefers-reduced-motion', 'https://developer.mozilla.org/docs/Web/CSS/@media/prefers-reduced-motion', 'Respeta preferencias de movimiento.'), source('Lit animations', 'https://lit.dev/docs/components/styles/#animations', 'Coordina estilos y render.', 'Lit')],
    debug: { title: 'La tarjeta intenta animarse antes de existir', expected: 'Cada detail-panel empieza con Abrir. show muestra Detalle y solo después anima el article ya conectado de esa instancia; la acción visible cumple el mismo orden y no altera otro panel.', observed: 'querySelector devuelve null al abrir.',
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
      tests: [detailAnimationOrderTest],
      hints: ['Asignar open programa una actualización; todavía no significa que article exista en el DOM.', 'Espera el ciclo que materializa el template antes de consultar dentro de la raíz de esa instancia.', 'La promesa de show debe cubrir también la llamada a animate, para que quien la espera observe el detalle listo.'] },
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
    challengeTitle: 'App: tablero observable sin fugas', challengeInstructions: 'Completa subscribe, publish y el ciclo del panel. Dos tableros conectados reciben snapshots independientes de cada métrica y actualizan su vista. Al desconectarse no reciben nada; al reconectarse conservan exactamente una suscripción, incluso después de varios ciclos. La vista debe representar cualquier name y value recibidos, no solo el ejemplo latencia: 42.',
    tests: [metricsSubscriptionLifecycleTest],
    hints: ['La fuente conserva listeners únicos y devuelve una función que retira exactamente la referencia recibida.', 'Publica una copia de la métrica para cada observador; así uno no puede mutar el valor que verá otro.', 'El panel guarda el listener y la limpieza como referencias estables, ejecuta la limpieza al salir y evita acumular suscripciones al volver.'],
    model: 'Observer define quién anuncia y quién escucha; el ciclo de vida define quién es responsable de dejar de escuchar. Los eventos DOM son una forma de observación con propagación incorporada.',
    whenToUse: 'Úsalo para fuentes con múltiples consumidores y emisiones en el tiempo; propiedades y eventos bastan para relaciones locales entre componentes.',
    bestPractices: 'Devuelve unsubscribe, usa instantáneas inmutables, captura errores por observador y asigna un dueño claro a cada suscripción.',
    commonErrors: 'suscribir dentro de render, no limpiar, compartir objetos mutables o usar un bus global para comunicación padre-hijo.',
    transfer: 'Compara evento DOM, Observer, contexto y controller para red, sesión, carrito y telemetría.',
    sources: [source('Observer pattern', 'https://developer.mozilla.org/docs/Web/API/EventTarget', 'Relaciona suscripciones con EventTarget.'), source('Lifecycle', 'https://lit.dev/docs/components/lifecycle/', 'Integra limpieza con el ciclo de Lit.', 'Lit')],
    debug: { title: 'Cada conexión duplica las notificaciones', expected: 'Cada instancia conserva la misma referencia de listener, recibe una notificación por evento mientras está conectada y retira exactamente esa suscripción al salir.', observed: 'connectedCallback añade listeners que nunca salen.',
      starter: `import { LitElement, html } from 'lit';
const feed = new EventTarget();
class FeedView extends LitElement {
  constructor() {
    super();
    this.feed = feed;
  }
  connectedCallback() {
    super.connectedCallback();
    this.feed.addEventListener('message', (event) => {
      this.message = event.detail;
      this.requestUpdate();
    });
  }
  render() {
    return html\`<p>\${this.message ?? 'Vacío'}</p>\`;
  }
}
customElements.define('feed-view', FeedView);`,
      tests: [feedListenerLifecycleTest],
      hints: ['Una arrow creada dentro de connectedCallback cambia de identidad en cada conexión y no puede retirarse con otra arrow parecida.', 'Crea una única función u objeto handleEvent por instancia y usa esa misma referencia al añadir y retirar.', 'disconnectedCallback retira message de this.feed antes o después de delegar al ciclo base; al reconectar solo debe quedar una escucha.'] },
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
    challengeTitle: 'App: proveedor intercambiable', challengeInstructions: 'Implementa PaymentAdapter y submit como una frontera completa. Un monto no finito o menor o igual a cero no llama al proveedor y produce {success:false,message,id:null}. Un monto válido se convierte a Number, muestra Procesando y bloquea Pagar mientras espera. El adapter traduce ok, transaction y note al único contrato público {success,message,id}; también convierte una excepción externa en un resultado fallido sin filtrar su mensaje. Al terminar, el panel muestra result.message y vuelve a habilitarse. La vista debe seguir funcionando si se reemplaza service por otro objeto charge con ese contrato, sin leer campos crudos.',
    tests: [paymentAdapterBoundaryTest],
    hints: ['PaymentAdapter es el único lugar que conoce ok, transaction, note y pay; devuelve siempre solo success, message e id.', 'Convierte amount con Number y corta antes de pay cuando no sea finito o sea menor o igual a cero. Captura también los errores del proveedor.', 'submit activa pending antes de esperar charge y lo desactiva en finally; render solo necesita pending y result.message.'],
    model: 'El componente habla el idioma estable de la aplicación; cada adapter habla el idioma cambiante de un proveedor. Bridge aparece cuando puedes variar vista e implementación de servicio por separado.',
    whenToUse: 'Úsalo ante SDK, API o almacenamiento externo; evita una capa ceremonial si no existe una frontera cambiante.',
    bestPractices: 'Define el puerto desde las necesidades del consumidor, normaliza errores y datos, inyecta dependencias y prueba adapters con contratos comunes.',
    commonErrors: 'filtrar respuestas crudas a la UI, llamar fetch en render, adapters que contienen reglas visuales o interfaces enormes por copiar el SDK.',
    transfer: 'Diseña un contrato mínimo para clima, museo y autenticación con dos implementaciones posibles.',
    sources: [source('Dependency inversion', 'https://developer.mozilla.org/docs/Learn_web_development/Extensions/Client-side_APIs/Introduction', 'Ubica APIs externas como frontera.'), source('Context', 'https://lit.dev/docs/data/context/', 'Inyecta servicios cuando el árbol lo requiere.', 'Lit')],
    debug: { title: 'El componente depende de los campos crudos del proveedor', expected: 'shipping-card parte en “--”, llama a un puerto quote reemplazable y representa exactamente cost y currency normalizados, incluidos 9.5 USD, otro adapter con 17 EUR y el costo válido 0 COP. La vista nunca lee total_cents ni currency_code.', observed: 'render conoce total_cents y divide manualmente.',
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
      tests: [shippingAdapterBoundaryTest],
      hints: ['La vista solo debería conocer cost y currency; total_cents y currency_code terminan en la frontera.', 'Crea un objeto con quote alrededor del provider —puede ser una clase o una función— y guárdalo como dependencia reemplazable de la tarjeta.', 'Convierte centavos a unidades dentro del adapter. Al renderizar, comprueba la existencia del resultado, no la verdad de cost: cero también es válido.'] },
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
    challengeTitle: 'Proyecto: sala de museo resistente', challengeInstructions: 'Completa el corte vertical. MuseumService llama client(query,{signal}) y devuelve únicamente obras {id,title,artist,year,imageUrl}: convierte id a texto y usa “Sin título”, “Autor desconocido”, “Fecha desconocida” y cadena vacía cuando faltan datos. MuseumRoom conserva una sola Task ligada a query y ofrece un formulario con input etiquetado que recorta la búsqueda y previene navegación. La vista distingue Cargando, Sin obras, No se pudo cargar y una lista semántica; no muestra el mensaje externo. Cada tarjeta usa solo el modelo normalizado, evita img cuando imageUrl está vacío, muestra “Imagen no disponible” y permite añadir o quitar exactamente su id de favorites con arrays nuevos y aria-pressed.',
    tests: [museumVerticalSliceTest],
    hints: ['Normaliza cada item dentro de MuseumService y reenvía signal al cliente; render no debería conocer objectID ni otros nombres externos.', 'El submit lee query del formulario, la recorta y actualiza el argumento de una única Task. En complete separa primero el array vacío.', 'favorites contiene ids: crea un array nuevo al añadir y otro al retirar. La tarjeta decide entre img con alt y el fallback a partir de imageUrl.'],
    model: 'Una interfaz API no es una lista bonita: es una máquina de estados alrededor de un contrato propio. Curar implica decidir qué dato importa y qué hacer cuando falta.',
    whenToUse: 'Aplica este corte a cualquier vista remota con búsqueda y acciones locales; reduce complejidad en demos estáticas sin red.',
    bestPractices: 'Inyecta cliente, cancela búsquedas, normaliza opcionales, ofrece vacíos útiles, conserva identidad y prueba con fixtures deterministas.',
    commonErrors: 'renderizar respuestas crudas, asumir imágenes, confundir cero resultados con error, fetch en render o favoritos por índice.',
    transfer: 'Diseña los cinco estados y el modelo normalizado de una API de películas o bibliotecas.',
    sources: [source('Async tasks', 'https://lit.dev/docs/data/task/', 'Coordina búsquedas y estados.', 'Lit'), source('Fetch API', 'https://developer.mozilla.org/docs/Web/API/Fetch_API', 'Comprende solicitud, respuesta y cancelación.')],
    debug: { title: 'La sala rompe cuando una obra no tiene imagen', expected: 'art-card parte con “Sin título”, responde a cada cambio de art y solo consume title e imageUrl normalizados. Con imageUrl muestra una imagen con alt igual al título limpio; sin URL muestra “Imagen no disponible” y no crea una imagen rota, aunque exista un campo crudo image.url.', observed: 'Accede a image.url sin comprobar image.',
      starter: `import { LitElement, html } from 'lit';
class ArtCard extends LitElement {
  static properties = { art: { attribute: false } };
  render() {
    return html\`<img src=\${this.art.image.url} alt=\${this.art.title} />
      <h2>\${this.art.title}</h2>\`;
  }
}
customElements.define('art-card', ArtCard);`,
      tests: [artCardResilienceTest],
      hints: ['Los datos normalizados pueden traer imageUrl vacío; image.url pertenece a otra frontera y no debe consultarse aquí.', 'Calcula un título limpio con fallback y decide antes del template si existe una URL utilizable.', 'Mantén art reactiva: devuelve img con alt cuando hay URL y un texto de fallback sin img cuando no la hay.'] },
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
    challengeTitle: 'Proyecto: clima con fallos parciales', challengeInstructions: 'Completa el corte climático. WeatherService.current(city, unit) llama a su cliente, convierte tempC a Celsius o Fahrenheit y devuelve únicamente {id,city,temperature,unit,condition}; la unidad F usa C × 9/5 + 32. WeatherDashboard ofrece un selector de unidad etiquetado y Actualizar. refresh inicia todas las ciudades sin esperar una antes de lanzar la siguiente, conserva el orden e identidad originales y sustituye results por una fila ready o error para cada ciudad. La vista muestra ciudad, temperatura, unidad y condición en las filas correctas, y ciudad más “No disponible” en la fallida. Debe funcionar con otras ciudades, unidades y servicios, no solo con el fixture.',
    tests: [weatherConcurrencyContractTest],
    hints: ['Haz que current normalice una sola respuesta; no filtres campos crudos ni conviertas la misma temperatura más de una vez.', 'Copia cities y unit al iniciar refresh, crea todas las promesas y espera su resultado conjunto. Relaciona cada posición settled con la ciudad de esa copia.', 'El selector actualiza unit. Renderiza cada fila por su id y distingue ready de error sin borrar los éxitos.'],
    model: 'Concurrencia significa que el reloj de la red no respeta el orden visual. La identidad y el estado por recurso impiden que una respuesta lenta sobrescriba o borre información ajena.',
    whenToUse: 'Úsalo cuando varias fuentes son independientes; una sola operación atómica puede tener un error global.',
    bestPractices: 'Conserva ids, representa error por elemento, limita concurrencia si es necesario y separa unidades del dato base.',
    commonErrors: 'Promise.all cuando toleras fallos parciales, usar índice como identidad, borrar datos previos al refrescar o convertir unidades varias veces.',
    transfer: 'Diseña resultados parciales para precios, disponibilidad de tiendas y salud de servicios.',
    sources: [source('Promise.allSettled', 'https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled', 'Conserva éxito y rechazo por operación.'), source('Lists', 'https://lit.dev/docs/templates/lists/', 'Mantén identidad al renderizar resultados.', 'Lit')],
    debug: { title: 'Una ciudad fallida vacía todo el tablero', expected: 'city-board inicia todos sus loaders sin esperar entre ellos, conserva una fila por posición y reemplaza rows en cada carga: los fulfilled muestran su ciudad y los rejected muestran “No disponible”.', observed: 'Promise.all rechaza el grupo completo.',
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
      tests: [cityBoardPartialFailureTest],
      hints: ['Invoca todos los loaders al construir la colección de promesas; no pongas await dentro de un bucle secuencial.', 'El resultado settled conserva una entrada por promesa. Transforma fulfilled y rejected por separado en filas nuevas.', 'La vista necesita una rama visible para ready y otra para error; vuelve a cargar con datos distintos sin conservar filas viejas.'] },
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
    this.clientEnvironment = null;
    this.onRefresh = () => this.requestUpdate();
  }
  connectClient(environment) {
    /* sustituye la conexión previa, tolera undefined y escucha product-refresh */
  }
  disconnectClient() {
    /* retira del mismo entorno la misma referencia y limpia su propiedad */
  }
  connectedCallback() {
    super.connectedCallback();
    /* conecta solo si existe window */
  }
  disconnectedCallback() {
    /* desconecta y delega al ciclo base */
  }
  toggleSaved() {
    /* alterna saved */
  }
  render() {
    /* article con nombre, precio y botón Guardar/Guardado con aria-pressed */
  }
}
customElements.define('ssr-product-card', SsrProductCard);`,
    challengeTitle: 'App: componente universal por contrato', challengeInstructions: 'Completa una frontera observable entre contenido universal e hidratación. render produce un article semántico desde name y price, sin leer window ni medidas del layout: h2 para el nombre, “Precio: N” y un botón Guardar con aria-pressed="false". El botón llama toggleSaved y alterna saved, aria-pressed y el texto Guardar/Guardado sin reemplazar el nodo. connectClient(environment) primero retira una conexión anterior; si environment no ofrece addEventListener devuelve false sin lanzar, y si lo ofrece conserva ese entorno, escucha product-refresh con la referencia estable onRefresh y devuelve true. disconnectClient retira esa misma referencia y limpia el entorno. connectedCallback delega y llama connectClient solo mediante un guard de window; disconnectedCallback limpia y delega. Rehidratar varias veces deja una sola escucha y desconectar deja el contenido intacto.',
    tests: [ssrHydrationBoundaryTest],
    hints: ['Empieza por render: solo propiedades serializables, article, h2, precio y un botón cuyo estado observable sale de saved.', 'La frontera cliente recibe el entorno como argumento. Antes de añadir, retira la conexión previa; con undefined devuelve false y no toca ninguna API.', 'Conserva onRefresh y clientEnvironment. Usa exactamente esas referencias al añadir y retirar product-refresh, y enlaza la acción Guardar a toggleSaved.'],
    model: 'SSR responde con significado; hidratación añade comportamiento. Un componente universal mantiene su render puro respecto al entorno y confina APIs del navegador al ciclo apropiado.',
    whenToUse: 'Considera SSR para contenido inicial, indexación o arranque; una herramienta interna totalmente cliente puede no justificarlo.',
    bestPractices: 'Usa datos serializables, evita efectos en render, protege globals, conserva HTML estable y mide si la hidratación aporta valor.',
    commonErrors: 'leer window en inicializadores, generar ids aleatorios durante render, depender de layout del cliente o producir HTML distinto entre entornos.',
    transfer: 'Audita un componente de fecha, ancho de pantalla y autenticación: marca qué puede renderizar el servidor.',
    sources: [source('Server-side rendering', 'https://lit.dev/docs/ssr/overview/', 'Comprende capacidades y límites de SSR.', 'Lit'), source('DOM environment', 'https://lit.dev/docs/ssr/dom-emulation/', 'Distingue APIs disponibles.', 'Lit'), source('Hydration', 'https://lit.dev/docs/ssr/client-usage/', 'Conecta el cliente.', 'Lit')],
    debug: { title: 'El componente lee window durante la definición de la clase', expected: 'viewport-card empieza con un fallback 0, readWidth acepta un entorno opcional, start sustituye la escucha resize y refleja cada ancho, y disconnectedCallback retira exactamente la referencia estable antes de delegar.', observed: 'Importar el módulo en servidor lanza ReferenceError.',
      starter: `import { LitElement, html } from 'lit';
const initialWidth = window.innerWidth;
class ViewportCard extends LitElement {
  static properties = { width: { state: true } };
  constructor() {
    super();
    this.width = initialWidth;
    this.environment = null;
    this.onResize = () => { /* actualiza width desde el entorno actual */ };
  }
  readWidth(environment) {
    /* devuelve un ancho numérico válido o 0 cuando el entorno no existe */
  }
  start(environment) {
    /* sustituye la escucha anterior, toma el ancho y escucha resize */
  }
  stop() {
    /* retira la misma referencia y limpia el entorno */
  }
  connectedCallback() {
    super.connectedCallback();
    /* inicia con window solo cuando existe */
  }
  disconnectedCallback() {
    /* detiene y delega */
  }
  render() {
    return html\`<p aria-live="polite">Ancho: \${this.width}</p>\`;
  }
}
customElements.define('viewport-card', ViewportCard);`,
      tests: [viewportEnvironmentLifecycleTest],
      hints: ['Elimina initialWidth del nivel del módulo. Empieza width en 0 y concentra la lectura en readWidth(environment), que también debe aceptar undefined.', 'Guarda environment y una única onResize. start llama stop antes de añadir resize, para que cambiar de entorno no deje viva la escucha anterior.', 'connectedCallback protege window antes de pasarlo a start; disconnectedCallback llama stop. Usa la misma onResize al añadir y retirar.'] },
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
    challengeTitle: 'Capstone: corte vertical listo para demostrar', challengeInstructions: 'Entrega el corte completo. TicketService.load transforma cada fila del storage al contrato estricto {id,title,priority,status}: ticket_id pasa a texto, title se recorta con fallback “Sin título”, priority es Number y state solo produce open o closed. save persiste copias de la colección y de cada ticket. SupportCenter.load muestra Cargando, reemplaza tickets y termina en ready o empty; ante error deja la lista vacía, muestra un mensaje genérico y devuelve false. createTicket recorta título, acepta solo prioridades enteras 1–3 y no persiste entradas inválidas. Para una entrada válida calcula una nueva colección con id único y estado open, muestra Guardando, bloquea Crear y solo la publica tras guardar; un fallo conserva exactamente la versión anterior. closeTicket hace lo mismo y reemplaza únicamente el ticket elegido. El formulario etiquetado previene navegación; un filtro etiquetado all/open/closed controla visibleTickets. La vista expone role=status, estado vacío, lista con título/prioridad/estado y un botón Cerrar por fila, desactivado cuando ya está cerrada. Después de un error, otra carga o escritura válida debe recuperar el centro.',
    tests: [supportCenterVerticalSliceTest],
    hints: ['Empieza por TicketService: load devuelve solo id, title, priority y status; save crea snapshots antes de llamar al storage.', 'Para load, createTicket y closeTicket separa la versión confirmada de la candidata. Cambia tickets únicamente cuando la operación externa termina bien; status hace visibles loading, saving, empty, ready y error.', 'Conecta un formulario y un filtro realmente etiquetados. Deriva visibleTickets, renderiza cada fila por id y usa el mismo método público tanto desde la UI como desde las pruebas.'],
    model: 'Un capstone profesional no es mucho código: es una cadena completa de decisiones que otra persona puede usar, probar, mantener y desplegar sin adivinar contratos ocultos.',
    whenToUse: 'Usa este enfoque para convertir requisitos amplios en incrementos verificables; un prototipo exploratorio puede aceptar evidencia más ligera, pero debe declararlo.',
    bestPractices: 'Escribe criterios observables, integra por cortes, prueba comportamiento público en navegador, documenta API y límites, y conserva estados de error accesibles.',
    commonErrors: 'construir todas las capas vacías, afirmar terminado por compilar, probar helpers sin interacción, ocultar errores o acoplar UI al almacenamiento.',
    transfer: 'Redacta la arquitectura y Definition of Done para museo, clima o inventario como proyecto de portafolio.',
    sources: [source('Components overview', 'https://lit.dev/docs/components/overview/', 'Revisa la arquitectura completa.', 'Lit'), source('Testing', 'https://lit.dev/docs/tools/testing/', 'Obtén evidencia en navegador.', 'Lit'), source('Publishing', 'https://lit.dev/docs/tools/publishing/', 'Prepara consumo externo.', 'Lit'), source('Accessibility', 'https://developer.mozilla.org/docs/Web/Accessibility', 'Verifica semántica e interacción.')],
    debug: { title: 'Guardar ocurre antes de actualizar y persiste la lista vieja', expected: 'project-board calcula next, asigna y guarda la misma versión.', observed: 'save recibe this.cards antes del cambio.',
      starter: `import { LitElement, html } from 'lit';
class ProjectBoard extends LitElement {
  static properties = {
    cards: { state: true },
    status: { state: true },
  };
  constructor() {
    super();
    this.cards = [];
    this.status = 'idle';
    this.storage = { save: async (_cards) => {} };
  }
  async add(title) {
    /* valida, calcula next, persiste esa referencia y solo entonces la asigna */
  }
  render() {
    return html\`<p>\${this.cards.length}</p>
      <p role="status">
        \${this.status === 'error' ? 'No se pudo guardar' : this.status}
      </p>\`;
  }
}
customElements.define('project-board', ProjectBoard);`,
      tests: [projectBoardAtomicPersistenceTest],
      hints: ['Recorta title y corta con false antes de persistir cuando queda vacío.', 'Calcula next una sola vez. Mientras save espera, conserva cards y muestra saving; si termina bien asigna exactamente next y devuelve true.', 'Si save falla, no asignes la candidata: conserva la referencia anterior, muestra el error genérico y permite que el siguiente add válido recupere el tablero.'] },
  }),
];
