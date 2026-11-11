import {eras,elements,references} from './data.js';
import {Universe} from './universe.js';

const find = (id) => document.getElementById(id);
const canvas = find('cosmos');
const universe = new Universe(canvas);
const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const state = {
  intro:true,progress:0,index:0,contemplating:false,playing:false,
  motion:!prefersReducedMotion.matches,static:prefersReducedMotion.matches,
  density:66,birth:70,web:72,element:'C',distance:120,scenario:'continuous',
  pulseAt:-10,sparkAt:-10,camera:{x:0,y:0,zoom:1},pointer:{x:0,y:0}
};
let visualTime=0,previousFrame=0,lastEra=-1,lastModalFocus=null,activeModal=null,playPosition=0;
let toastTimeout=null,audioContext=null,ambientNodes=[];
let contemplationTimer=null;
const pointers=new Map();

function showToast(message) {
  const toast=find('toast');
  toast.textContent=message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout=setTimeout(()=>toast.classList.remove('show'),2400);
}

function syncTimeRange(){
  find('timeRange').value=state.progress;
  document.querySelector('.time-range').style.setProperty('--fill',`${state.progress/599*100}%`);
  find('dockEraLabel').textContent=eras[state.index].name;
  find('dockMicro').textContent=eras[state.index].period;
  [...document.querySelectorAll('.era-marker')].forEach((b,i)=>{
    const active=i===state.index;
    b.classList.toggle('active',active);
    if(active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');
  });
  find('prevEra').disabled=state.index===0;
  find('nextEra').disabled=state.index===eras.length-1;
  find('contemplateEra').textContent=eras[state.index].name;
}

function installEraMarkers(){
  const parent=find('eraMarkers');
  eras.forEach((era,index)=>{
    const button=document.createElement('button');
    button.className='era-marker';
    button.type='button';
    button.dataset.index=String(index);
    button.innerHTML=`<span class="marker-index">${era.index}</span>${era.name}`;
    button.title=`Ir para ${era.name}`;
    button.addEventListener('click',()=>goToEra(index));
    parent.append(button);
  });
}

function renderControls(era){
  const root=find('instrumentControls');
  root.replaceChildren();
  for(const control of era.controls){
    const group=document.createElement('div');group.className='control-group';
    if(control.type==='range'){
      const label=document.createElement('label');label.className='control-header';
      label.htmlFor=`control-${control.id}`;
      const name=document.createElement('span');name.textContent=control.title;
      const value=document.createElement('output');value.id=`output-${control.id}`;
      const input=document.createElement('input');input.type='range';input.className='range-input';
      input.id=`control-${control.id}`;input.min=String(control.min);input.max=String(control.max);
      input.step='1';input.value=String(state[control.id]??control.value);
      value.textContent=`${input.value} ${control.unit}`;
      input.addEventListener('input',()=>{
        state[control.id]=Number(input.value);
        value.textContent=`${input.value} ${control.unit}`;
        if(control.id==='distance'){
          find('instrumentMetric').textContent=`${input.value} milhões de anos`;
          find('instrumentMetricLabel').textContent=`para ${input.value} milhões de anos-luz · modelo simples`;
        }
      });
      label.append(name,value);group.append(label,input);
    }
    if(control.type==='action'){
      const button=document.createElement('button');button.type='button';
      button.className='instrument-action';
      button.textContent=control.title;
      const symbol=document.createElement('span');symbol.textContent='↗';button.append(symbol);
      button.addEventListener('click',()=>{
        if(control.id==='spark'){state.sparkAt=visualTime;showToast('Uma nova luz atravessa o céu.');}
        if(control.id==='fly'){state.camera.zoom=Math.min(1.5,state.camera.zoom+.21);showToast('Aproximando-se da teia cósmica.');}
        if(control.id==='photon'){state.pulseAt=visualTime;showToast('A luz começou sua viagem.');}
        if(control.id==='late')openModal('lateModal');
      });
      group.append(button);
    }
    if(control.type==='elements'){
      const title=document.createElement('span');title.className='control-header';title.textContent=control.title;
      const grid=document.createElement('div');grid.className='element-grid';
      const detail=document.createElement('p');detail.className='element-info';
      const updateElement=()=>{
        const selected=elements.find(e=>e.symbol===state.element)||elements[2];
        detail.replaceChildren();
        const name=document.createElement('strong');name.textContent=`${selected.name} · ${selected.kind}`;
        detail.append(name,document.createTextNode(selected.description));
        grid.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===state.element)));
        find('instrumentMetric').textContent=selected.name;
        find('instrumentMetricLabel').textContent=selected.kind;
      };
      elements.forEach(element=>{
        const button=document.createElement('button');button.type='button';button.className='element-button';
        button.textContent=element.symbol;button.title=element.name;
        button.addEventListener('click',()=>{state.element=element.symbol;updateElement();});
        grid.append(button);
      });
      group.append(title,grid,detail);updateElement();
    }
    if(control.type==='scenario'){
      const title=document.createElement('span');title.className='control-header';title.textContent=control.title;
      const list=document.createElement('div');list.className='scenario-list';
      for(const item of [{id:'continuous',title:'Expansão acelerada prolongada'},{id:'alternative',title:'Evolução alternativa da energia escura'}]){
        const b=document.createElement('button');b.className='scenario-button';b.type='button';b.textContent=item.title;
        b.addEventListener('click',()=>{
          state.scenario=item.id;
          list.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
          find('instrumentMetric').textContent=item.id==='continuous'?'Expansão contínua':'Futuro em aberto';
          find('instrumentMetricLabel').textContent='cenário hipotético · não é previsão';
        });
        b.setAttribute('aria-pressed',String(item.id===state.scenario));list.append(b);
      }
      group.append(title,list);
    }
    root.append(group);
  }
}

function updateEra(index){
  const era=eras[index];
  find('eraPeriod').textContent=era.period;
  find('chapterNumber').textContent=`CAPÍTULO ${era.index} / 06`;
  find('eraKicker').textContent=`${era.index} / 06 · TRANSFORMAÇÕES DO COSMOS`;
  find('eraTitle').textContent=era.name;
  find('eraChapter').textContent=era.chapter;
  find('eraLead').textContent=era.lead;
  find('eraDetailText').textContent=era.detail;
  find('eraFact').textContent=era.fact;
  find('instrumentLabel').textContent=era.label;
  find('instrumentMetric').textContent=era.metric;
  find('instrumentMetricLabel').textContent=era.metricLabel;
  find('instrumentNumber').textContent=era.index;
  find('eraDetail').hidden=true;
  find('detailToggle').setAttribute('aria-expanded','false');
  find('detailToggle').innerHTML='Entenda esta era <span aria-hidden="true">↗</span>';
  renderControls(era);
  lastEra=index;
  state.index=index;
  syncTimeRange();
  find('lateStar').hidden=state.intro||index!==4;
  if(state.contemplating)showContemplationCue(false);
}

function setProgress(value){
  state.progress=Math.max(0,Math.min(599,Math.round(value)));
  const index=Math.min(5,Math.floor(state.progress/100));
  if(index!==lastEra)updateEra(index);
  syncTimeRange();
}
function goToEra(index){
  if(index<0||index>=eras.length)return;
  state.playing=false;
  updatePlayButton();
  setProgress(index===0?0:index*100+12);
  if(!state.intro&&!state.contemplating){
    const panel=find('experience');panel.scrollTo({top:0,behavior:state.motion?'smooth':'instant'});
  }
}
function showContemplationCue(intro){
  clearTimeout(contemplationTimer);
  const opening=find('contemplationCopy');
  const era=find('contemplationEraCue');
  opening.classList.remove('is-visible');
  era.classList.remove('is-visible');
  if(!state.contemplating)return;
  const cue=intro?opening:era;
  requestAnimationFrame(()=>{
    if(state.contemplating)cue.classList.add('is-visible');
  });
  contemplationTimer=setTimeout(()=>cue.classList.remove('is-visible'),intro?2600:1900);
}

function setDockExpanded(expanded){
  const dock=find('controlDock');
  const peek=find('dockPeek');
  const open=state.contemplating&&expanded;
  dock.classList.toggle('contemplating',state.contemplating);
  dock.classList.toggle('dock-open',open);
  dock.inert=state.contemplating&&!open;
  peek.hidden=!state.contemplating;
  peek.classList.toggle('is-open',open);
  peek.setAttribute('aria-expanded',String(open));
  peek.textContent=open?'✕ Ocultar controles':'☷ Mostrar controles';
}

function startJourney(contemplate=false){
  state.intro=false;
  state.contemplating=contemplate;
  find('intro').hidden=true;
  find('experience').hidden=contemplate;
  find('contemplation').hidden=!contemplate;
  find('controlDock').hidden=false;
  find('hintBtn').hidden=contemplate;
  find('contemplateToggle').setAttribute('aria-pressed',String(contemplate));
  find('contemplateToggle').title=contemplate?'Sair do Modo Contemplação':'Modo Contemplação';
  setProgress(0);
  setDockExpanded(false);
  find('lateStar').hidden=state.index!==4;
  if(contemplate)showContemplationCue(true);
}
function setContemplation(enabled){
  if(state.intro){startJourney(enabled);return;}
  state.contemplating=enabled;
  find('contemplation').hidden=!enabled;
  find('experience').hidden=enabled;
  find('hintBtn').hidden=enabled;
  find('contemplateToggle').setAttribute('aria-pressed',String(enabled));
  find('contemplateToggle').title=enabled?'Sair do Modo Contemplação':'Modo Contemplação';
  setDockExpanded(false);
  if(enabled)showContemplationCue(true);
  else{
    clearTimeout(contemplationTimer);
    find('contemplationCopy').classList.remove('is-visible');
    find('contemplationEraCue').classList.remove('is-visible');
    find('experience').scrollTop=0;
  }
}

function updatePlayButton(){
  find('playSymbol').textContent=state.playing?'Ⅱ':'▶';
  find('playBtn').setAttribute('aria-pressed',String(state.playing));
  find('playBtn').setAttribute('aria-label',state.playing?'Pausar crononavegação':'Reproduzir crononavegação');
}
function updateMotionButton(){
  find('motionToggle').setAttribute('aria-pressed',String(!state.motion));
  find('motionLabel').textContent=state.motion?'Pausar':'Animar';
  find('motionToggle').title=state.motion?'Pausar movimentos':'Retomar movimentos';
  find('reducedMotion').checked=!state.motion;
}

function openModal(id){
  const modal=find(id);
  if(activeModal)closeModal(false);
  lastModalFocus=document.activeElement;
  activeModal=modal;
  modal.hidden=false;
  modal.querySelector('.modal-close')?.focus();
  document.body.classList.add('modal-open');
}
function closeModal(restore=true){
  if(!activeModal)return;
  activeModal.hidden=true;
  activeModal=null;
  document.body.classList.remove('modal-open');
  if(restore)lastModalFocus?.focus?.();
}
function trapModalFocus(event){
  if(!activeModal||event.key!=='Tab')return;
  const candidates=[...activeModal.querySelectorAll('a[href],button:not([disabled]),input,select,[tabindex="0"]')];
  if(!candidates.length)return;
  const first=candidates[0],last=candidates.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
}

function makeScreenshot(){
  try{
    const output=document.createElement('canvas');
    output.width=canvas.width;output.height=canvas.height;
    const ctx=output.getContext('2d');
    ctx.drawImage(canvas,0,0);
    const w=output.width,h=output.height;
    ctx.fillStyle='rgba(5,7,20,.5)';ctx.fillRect(0,h-72*universe.scale,w,72*universe.scale);
    ctx.textBaseline='middle';ctx.fillStyle='#f6eaff';
    ctx.font=`${Math.round(26*universe.scale)}px Georgia`;
    ctx.fillText(`ÆON · ${eras[state.index].name}`,26*universe.scale,h-36*universe.scale);
    output.toBlob(blob=>{
      if(!blob){showToast('Não foi possível capturar a cena.');return;}
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.download=`aeon-${eras[state.index].id}.png`;a.href=url;a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1500);
      showToast('Instante capturado.');
    },'image/png');
  }catch{showToast('A captura não está disponível neste navegador.');}
}

async function toggleSound(){
  if(audioContext){
    await audioContext.close();audioContext=null;ambientNodes=[];
    find('soundToggle').setAttribute('aria-pressed','false');
    find('soundLabel').textContent='Som';return;
  }
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context){showToast('Áudio ambiente indisponível neste navegador.');return;}
  try{
    audioContext=new Context();
    const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=360;
    const output=audioContext.createGain();output.gain.value=0;
    filter.connect(output);output.connect(audioContext.destination);
    const frequencies=[55,82.41,110];
    frequencies.forEach((frequency,index)=>{
      const oscillator=audioContext.createOscillator();
      oscillator.type=index===0?'sine':'triangle';
      oscillator.frequency.value=frequency;
      const layer=audioContext.createGain();layer.gain.value=[.55,.17,.1][index];
      oscillator.connect(layer);layer.connect(filter);oscillator.start();ambientNodes.push(oscillator);
    });
    output.gain.linearRampToValueAtTime(.022,audioContext.currentTime+1.4);
    await audioContext.resume();
    find('soundToggle').setAttribute('aria-pressed','true');find('soundLabel').textContent='Ligado';
  }catch{
    if(audioContext){audioContext.close().catch(()=>{});audioContext=null;}
    showToast('Não foi possível iniciar o som.');
  }
}

function onPointerDown(e){
  if(e.button!==0&&e.pointerType==='mouse')return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  canvas.setPointerCapture(e.pointerId);
}
function onPointerMove(e){
  state.pointer.x=(e.clientX/innerWidth-.5)*2;
  state.pointer.y=(e.clientY/innerHeight-.5)*2;
  if(!pointers.has(e.pointerId))return;
  const prior=pointers.get(e.pointerId);
  const dx=e.clientX-prior.x,dy=e.clientY-prior.y;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===1){
    state.camera.x=Math.max(-210,Math.min(210,state.camera.x+dx*.55));
    state.camera.y=Math.max(-160,Math.min(160,state.camera.y+dy*.55));
  }
  if(pointers.size===2){
    const items=[...pointers.values()];
    const distance=Math.hypot(items[0].x-items[1].x,items[0].y-items[1].y);
    if(onPointerMove.lastDistance){
      state.camera.zoom=Math.max(.8,Math.min(2.1,state.camera.zoom*distance/onPointerMove.lastDistance));
    }
    onPointerMove.lastDistance=distance;
  }
}
function onPointerEnd(e){pointers.delete(e.pointerId);onPointerMove.lastDistance=null;}
function resetCamera(){state.camera={x:0,y:0,zoom:1};showToast('Câmera centralizada.');}

function bindEvents(){
  find('startBtn').addEventListener('click',()=>startJourney());
  find('startContemplateBtn').addEventListener('click',()=>startJourney(true));
  find('leaveContemplate').addEventListener('click',()=>setContemplation(false));
  find('contemplateToggle').addEventListener('click',()=>setContemplation(!state.contemplating));
  find('constantStar').addEventListener('click',()=>openModal('starModal'));
  find('lateStar').addEventListener('click',()=>{state.pulseAt=visualTime;openModal('lateModal');});
  find('dockPeek').addEventListener('click',()=>setDockExpanded(!find('controlDock').classList.contains('dock-open')));
  find('hintBtn').addEventListener('click',()=>openModal('helpModal'));
  find('timeRange').addEventListener('input',e=>{
    if(state.intro)startJourney(false);
    state.playing=false;updatePlayButton();setProgress(Number(e.target.value));
  });
  find('prevEra').addEventListener('click',()=>goToEra(state.index-1));
  find('nextEra').addEventListener('click',()=>goToEra(state.index+1));
  find('playBtn').addEventListener('click',()=>{
    if(state.progress>=599)setProgress(0);
    state.playing=!state.playing;playPosition=state.progress;updatePlayButton();
  });
  find('detailToggle').addEventListener('click',()=>{
    const visible=find('eraDetail').hidden;
    find('eraDetail').hidden=!visible;
    find('detailToggle').setAttribute('aria-expanded',String(visible));
    find('detailToggle').innerHTML=visible?'Recolher explicação <span aria-hidden="true">↗</span>':'Entenda esta era <span aria-hidden="true">↗</span>';
  });
  find('resetView').addEventListener('click',resetCamera);
  find('captureBtn').addEventListener('click',makeScreenshot);
  find('fullScreenBtn').addEventListener('click',async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
    catch{showToast('Tela cheia indisponível neste navegador.');}
  });
  find('motionToggle').addEventListener('click',()=>{state.motion=!state.motion;state.static=!state.motion;updateMotionButton();});
  find('reducedMotion').addEventListener('change',e=>{state.motion=!e.target.checked;state.static=!state.motion;updateMotionButton();});
  find('soundToggle').addEventListener('click',toggleSound);
  find('qualitySelect').addEventListener('change',e=>{universe.quality=e.target.value;showToast('Qualidade visual atualizada.');});
  document.querySelectorAll('[data-close-modal]').forEach(btn=>btn.addEventListener('click',()=>closeModal()));
  document.querySelectorAll('.modal-backdrop').forEach(backdrop=>backdrop.addEventListener('mousedown',e=>{if(e.target===backdrop)closeModal();}));
  document.addEventListener('keydown',event=>{
    if(activeModal){
      if(event.key==='Escape'){event.preventDefault();closeModal();}
      trapModalFocus(event);return;
    }
    if(event.key==='Escape'&&state.contemplating){setContemplation(false);return;}
    if(state.intro)return;
    if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
    if(event.key==='ArrowRight'){event.preventDefault();goToEra(state.index+1);}
    if(event.key==='ArrowLeft'){event.preventDefault();goToEra(state.index-1);}
  });
  canvas.addEventListener('pointerdown',onPointerDown);
  canvas.addEventListener('pointermove',onPointerMove);
  canvas.addEventListener('pointerup',onPointerEnd);
  canvas.addEventListener('pointercancel',onPointerEnd);
  canvas.addEventListener('lostpointercapture',onPointerEnd);
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();
    state.camera.zoom=Math.max(.8,Math.min(2.1,state.camera.zoom*(e.deltaY<0?1.06:.94)));
  },{passive:false});
  window.addEventListener('resize',()=>universe.resize());
  document.addEventListener('visibilitychange',async()=>{
    previousFrame=0;
    if(audioContext){
      try{if(document.hidden)await audioContext.suspend();else await audioContext.resume();}catch{}
    }
  });
}

function animate(frameTime){
  if(!previousFrame)previousFrame=frameTime;
  const elapsed=Math.min(.07,(frameTime-previousFrame)/1000);
  previousFrame=frameTime;
  if(!document.hidden){
    if(state.motion&&!activeModal)visualTime+=elapsed;
    if(state.playing&&!activeModal){
      if(state.progress>=599){state.playing=false;updatePlayButton();}
      else {playPosition=Math.min(599,playPosition+elapsed*11);setProgress(playPosition);}
    }
    universe.render(visualTime,state);
  }
  requestAnimationFrame(animate);
}

function init(){
  installEraMarkers();
  const list=find('referenceLinks');
  for(const reference of references){
    const li=document.createElement('li'),a=document.createElement('a');
    a.href=reference.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=`${reference.label} ↗`;
    li.append(a);list.append(li);
  }
  updateMotionButton();
  setProgress(0);
  bindEvents();
  requestAnimationFrame(animate);
}

init();
