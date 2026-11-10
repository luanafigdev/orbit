import { PHASE_NAMES, PHASE_DETAILS, phaseAt, nextMajorPhase, paintPhase, dateFromInput, inputDate, formatDate } from './astronomy.js';
import { FEATURES, TIMELINE } from './data.js';
import { createGlobe } from './globe.js';

const $ = (id) => document.getElementById(id);
const JOURNAL_KEY = 'orbit.alunar.journal.v1';
const SECRET_KEY = 'orbit.alunar.discoveries.v1';
const today = new Date();
const state = {
  month: new Date(today.getFullYear(), today.getMonth(), 1),
  selectedDate: inputDate(today),
  hemisphere: 'south',
  phaseIndex: 4,
  entries: readStorage(JOURNAL_KEY, []),
  discoveries: readStorage(SECRET_KEY, [])
};

function readStorage(key, fallback) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : fallback;
  } catch { return fallback; }
}
function saveStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { notify('Não foi possível salvar neste navegador. Exporte suas notas como backup.'); return false; }
}
let toastTimer;
function notify(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 3800);
}
function showDialog(dialog) { if (!dialog.open) dialog.showModal(); }
function setupDialogs() {
  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  }
  $('note-star').addEventListener('click', () => showDialog($('note-modal')));
  $('open-credits').addEventListener('click', () => showDialog($('credits-modal')));
}
function setupNavigation() {
  $('year').textContent = today.getFullYear();
  const btn = $('mobile-menu'), nav = $('site-nav-mobile');
  btn.addEventListener('click', () => {
    nav.hidden = !nav.hidden;
    btn.setAttribute('aria-expanded', String(!nav.hidden));
    btn.setAttribute('aria-label', nav.hidden ? 'Abrir navegação' : 'Fechar navegação');
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.hidden = true; btn.setAttribute('aria-expanded', 'false');
  }));
}
function setupToday() {
  const data = phaseAt(today), next = nextMajorPhase(today);
  $('today-date').textContent = formatDate(today);
  $('today-name').textContent = data.name;
  $('today-explanation').textContent = data.description;
  $('today-light').textContent = `${Math.round(data.illuminated * 100)}%`;
  $('today-age').textContent = `${data.age.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dias`;
  $('today-next').textContent = `${next.name} · ${formatDate(next.when, {day:'2-digit', month:'short'})}`;
  paintPhase($('today-phase'), data.fraction, state.hemisphere === 'south');
}

function makeMiniPhase(value) {
  const canvas = document.createElement('canvas');
  canvas.width = 38; canvas.height = 38;
  canvas.className = 'phase-symbol';
  paintPhase(canvas, value, state.hemisphere === 'south');
  return canvas;
}
function renderCalendar() {
  const first = state.month;
  const year = first.getFullYear(), month = first.getMonth();
  $('calendar-title').textContent = formatDate(first, {month:'long',year:'numeric'});
  const container = $('calendar-days');
  container.replaceChildren();
  const start = first.getDay();
  const count = new Date(year, month+1,0).getDate();
  for (let i=0; i<start; i++) container.append(document.createElement('span'));
  for (let day=1; day<=count; day++) {
    const date = new Date(year, month, day, 12);
    const value = inputDate(date);
    const phase = phaseAt(date);
    const button = document.createElement('button');
    button.type='button';button.className='day';
    if (value===inputDate(today)) button.classList.add('is-today');
    if (value===state.selectedDate) button.classList.add('is-selected');
    button.setAttribute('aria-label', `${formatDate(date)}: ${phase.name}, ${Math.round(phase.illuminated*100)}% iluminada`);
    const number = document.createElement('span'); number.className='date-number';number.textContent=day;
    button.append(number,makeMiniPhase(phase.fraction));
    button.addEventListener('click', () => {state.selectedDate=value;renderCalendar();});
    container.append(button);
  }
  const selected = phaseAt(dateFromInput(state.selectedDate));
  $('calendar-selection').textContent = `${formatDate(dateFromInput(state.selectedDate))} · ${selected.name} · ${Math.round(selected.illuminated*100)}% iluminada`;
}
function setupCalendar() {
  $('month-prev').addEventListener('click', () => {state.month=new Date(state.month.getFullYear(), state.month.getMonth()-1,1);state.selectedDate=inputDate(state.month);renderCalendar();});
  $('month-next').addEventListener('click', () => {state.month=new Date(state.month.getFullYear(), state.month.getMonth()+1,1);state.selectedDate=inputDate(state.month);renderCalendar();});
  $('month-now').addEventListener('click', () => {state.month=new Date(today.getFullYear(),today.getMonth(),1);state.selectedDate=inputDate(today);renderCalendar();});
  renderCalendar();
}

function setupGlobe() {
  let globe;
  const selectFeature = (place) => {
    $('feature-type').textContent = {mare:'PLANÍCIE BASÁLTICA',crater:'CRATERA LUNAR',mission:'LOCAL HISTÓRICO'}[place.type];
    $('feature-title').textContent=place.name;
    $('feature-subtitle').textContent=place.subtitle;
    $('feature-copy').textContent=place.detail;
    const lat = `${Math.abs(place.lat).toFixed(2)}° ${place.lat<0?'S':'N'}`;
    const lon = `${Math.abs(place.lon).toFixed(2)}° ${place.lon<0?'O':'L'}`;
    $('feature-coordinates').textContent = `${lat}  /  ${lon}`;
    document.querySelectorAll('#feature-list button').forEach(b => b.classList.toggle('active',b.dataset.place===place.id));
  };
  const list = $('feature-list');
  const inner = document.createElement('div');
  for (const place of FEATURES) {
    const b=document.createElement('button');b.type='button';b.dataset.place=place.id;b.textContent=place.name;
    b.addEventListener('click',()=>globe.focus(place));
    inner.append(b);
  }
  list.append(inner);
  globe = createGlobe({canvas:$('globe'),markers:$('surface-markers'),onSelect:selectFeature});
  selectFeature(FEATURES.find(p=>p.id==='apollo11'));
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('[data-filter]').forEach(n=>n.classList.toggle('active',n===b));
    globe.setFilter(b.dataset.filter);
    for (const btn of inner.children) {
      const p=FEATURES.find(f=>f.id===btn.dataset.place);
      btn.hidden=b.dataset.filter!=='all' && p.type!==b.dataset.filter;
    }
  }));
  $('globe-zoom-in').addEventListener('click',()=>globe.zoom(.1));
  $('globe-zoom-out').addEventListener('click',()=>globe.zoom(-.1));
  $('globe-reset').addEventListener('click',()=>globe.reset());
}

function renderPhases() {
  const grid=$('phase-grid');
  grid.replaceChildren();
  for(let i=0;i<8;i++){
    const card=document.createElement('button');card.type='button';card.className='phase-card';
    if(i===state.phaseIndex) card.classList.add('active');
    card.setAttribute('aria-pressed',String(i===state.phaseIndex));
    const canvas=document.createElement('canvas');canvas.width=112;canvas.height=112;
    const name=document.createElement('span');name.textContent=PHASE_NAMES[i];
    card.append(canvas,name);
    paintPhase(canvas,i/8,state.hemisphere==='south');
    card.addEventListener('click',()=>{state.phaseIndex=i;renderPhases();});
    grid.append(card);
  }
  $('selected-phase-name').textContent=PHASE_NAMES[state.phaseIndex];
  $('selected-phase-desc').textContent=PHASE_DETAILS[state.phaseIndex];
  paintPhase($('selected-phase'),state.phaseIndex/8,state.hemisphere==='south');
}
function setupPhases() {
  document.querySelectorAll('[data-hemisphere]').forEach(btn=>btn.addEventListener('click',()=>{
    state.hemisphere=btn.dataset.hemisphere;
    document.querySelectorAll('[data-hemisphere]').forEach(b=>b.classList.toggle('active',b===btn));
    renderPhases();renderCalendar();setupToday();
  }));
  renderPhases();
}
function setupTimeline() {
  const el=$('timeline');
  for (const event of TIMELINE) {
    const item=document.createElement('article');item.className='timeline-item';
    const year=document.createElement('span');year.className='timeline-year';year.textContent=event.year;
    const content=document.createElement('div');
    const title=document.createElement('h3');title.textContent=event.title;
    const copy=document.createElement('p');copy.textContent=event.copy;
    content.append(title,copy);item.append(year,content);el.append(item);
  }
}

function validEntry(value) {
  return value && typeof value==='object' && typeof value.title==='string' &&
  typeof value.date==='string' && /^\d{4}-\d\d-\d\d$/.test(value.date) &&
  inputDate(dateFromInput(value.date))===value.date && typeof value.content==='string';
}
function cleanEntry(value) {
  return {
    id:typeof value.id==='string'&&value.id.length<70?value.id:crypto.randomUUID(),
    title:value.title.trim().slice(0,90),date:value.date,
    content:value.content.trim().slice(0,2500),
    sky:typeof value.sky==='string'?value.sky.slice(0,40):'Não observei o céu',
    tags:Array.isArray(value.tags)?value.tags.filter(x=>typeof x==='string').map(x=>x.trim().slice(0,25)).slice(0,8):[],
    favorite:!!value.favorite
  };
}
function createElement(tag,className,text) {
  const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;
}
function saveJournal() {
  saveStorage(JOURNAL_KEY,state.entries);
  renderJournal();
}
function renderJournal() {
  const query=$('journal-search').value.trim().toLocaleLowerCase('pt-BR');
  const filter=$('journal-phase-filter').value;
  const entries=state.entries.filter(e=>{
    if(!validEntry(e))return false;
    const phase=phaseAt(dateFromInput(e.date));
    return (filter==='all'||String(phase.index)===filter) &&
      [e.title,e.content,(e.tags||[]).join(' ')].join(' ').toLocaleLowerCase('pt-BR').includes(query);
  }).sort((a,b)=>Number(b.favorite)-Number(a.favorite)||b.date.localeCompare(a.date));
  $('diary-count').textContent=state.entries.length;
  const container=$('journal-entries');container.replaceChildren();
  if(!entries.length){
    const empty=createElement('div','empty-journal');
    empty.append(createElement('span','', '✧'),createElement('b','',state.entries.length?'Nenhum registro encontrado':'Sua primeira página espera.'),createElement('span','',state.entries.length?'Tente outros termos ou fases.':'Cada observação pode virar uma pequena memória.'));
    container.append(empty);return;
  }
  for(const entry of entries){
    const item=createElement('article','journal-entry');
    const row=createElement('div','journal-entry-top');
    const date=createElement('span','entry-meta',`${formatDate(dateFromInput(entry.date))} · ${phaseAt(dateFromInput(entry.date)).name}`);
    const actions=createElement('div','entry-actions');
    const favorite=createElement('button','',entry.favorite?'★':'☆');favorite.type='button';favorite.title='Favoritar';favorite.setAttribute('aria-label',entry.favorite?'Desfavoritar':'Favoritar');
    favorite.addEventListener('click',()=>{entry.favorite=!entry.favorite;saveJournal();});
    const edit=createElement('button','','Editar');edit.type='button';edit.addEventListener('click',()=>openEntry(entry));
    const remove=createElement('button','','Excluir');remove.type='button';remove.addEventListener('click',()=>{
      if(confirm(`Excluir o registro "${entry.title}"?`)){state.entries=state.entries.filter(x=>x.id!==entry.id);saveJournal();notify('Registro excluído.');}
    });
    actions.append(favorite,edit,remove);row.append(date,actions);
    item.append(row,createElement('h4','',entry.title),createElement('p','',entry.content));
    if(entry.tags?.length){const tags=createElement('div','tag-list');for(const t of entry.tags)tags.append(createElement('span','',t));item.append(tags);}
    container.append(item);
  }
}
function openEntry(entry=null){
  $('entry-form').reset();
  $('entry-title').textContent=entry?'Editar observação':'Nova observação';
  $('entry-id').value=entry?.id||'';
  $('entry-name').value=entry?.title||'';
  $('entry-date').value=entry?.date||inputDate(today);
  $('entry-text').value=entry?.content||'';
  $('entry-sky').value=entry?.sky||'Limpo';
  $('entry-tags').value=(entry?.tags||[]).join(', ');
  $('entry-fav').checked=!!entry?.favorite;
  updateEntryPhase();showDialog($('entry-modal'));
}
function updateEntryPhase(){
  const date=dateFromInput($('entry-date').value||inputDate(today));
  $('entry-phase-display').textContent=`Fase na data selecionada: ${phaseAt(date).name}`;
}
function downloadFile(content,filename,type){
  const blob=new Blob([content],{type});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function setupJournal(){
  state.entries=state.entries.filter(validEntry).map(cleanEntry).slice(0,3000);
  $('new-entry').addEventListener('click',()=>openEntry());
  $('entry-date').addEventListener('change',updateEntryPhase);
  $('entry-form').addEventListener('submit',event=>{
    event.preventDefault();
    const entry=cleanEntry({id:$('entry-id').value||crypto.randomUUID(),title:$('entry-name').value,date:$('entry-date').value,content:$('entry-text').value,sky:$('entry-sky').value,tags:$('entry-tags').value.split(',').map(x=>x.trim()).filter(Boolean),favorite:$('entry-fav').checked});
    if(!entry.title||!entry.content){notify('Preencha o título e o registro.');return;}
    const i=state.entries.findIndex(x=>x.id===entry.id);
    if(i>=0)state.entries[i]=entry;else state.entries.push(entry);
    saveJournal();$('entry-modal').close();notify('Sua observação foi guardada. ✦');
  });
  $('journal-search').addEventListener('input',renderJournal);
  for(let i=0;i<8;i++){$('journal-phase-filter').append(new Option(PHASE_NAMES[i],String(i)));}
  $('journal-phase-filter').addEventListener('change',renderJournal);
  $('journal-export').addEventListener('click',()=>{
    downloadFile(JSON.stringify({app:'ALUNAR',version:1,exportedAt:new Date().toISOString(),entries:state.entries},null,2),`alunar-diario-${inputDate(today)}.json`,'application/json');
    notify('Backup do diário exportado.');
  });
  $('journal-import').addEventListener('click',()=>$('journal-file').click());
  $('journal-file').addEventListener('change',async(event)=>{
    const file=event.target.files[0];if(!file)return;
    if(file.size>5_000_000){notify('Arquivo muito grande para importar.');return;}
    try{
      const parsed=JSON.parse(await file.text());
      if(parsed.app!=='ALUNAR'||!Array.isArray(parsed.entries)||parsed.entries.length>3000||!parsed.entries.every(validEntry))throw new Error('Formato inválido');
      const incoming=parsed.entries.map(cleanEntry);
      const ids=new Set(state.entries.map(e=>e.id));
      let count=0;
      for(const entry of incoming){if(state.entries.length>=3000)break;if(!ids.has(entry.id)){state.entries.push(entry);ids.add(entry.id);count++;}}
      saveJournal();notify(`${count} observação(ões) importada(s).`);
    }catch{notify('Não foi possível importar: arquivo inválido.');}
    event.target.value='';
  });
  renderJournal();
}

const SECRETS = {
  origami:{name:'Um papel dobrado',icon:'🐇',text:'Algumas lembranças encontram maneiras de voltar.'},
  lighthouse:{name:'Uma luz distante',icon:'✧',text:'Há luzes que continuam acesas, mesmo quando ninguém está olhando.'},
  constellation:{name:'Duas estrelas',icon:'✦',text:'Se o caminho se perder, talvez as estrelas ainda saibam onde nos encontrar.'}
};
function discover(key){
  const secret=SECRETS[key];
  if(!state.discoveries.includes(key)){
    state.discoveries.push(key);
    saveStorage(SECRET_KEY,state.discoveries);
  }
  $('secret-art').textContent=secret.icon;
  $('secret-title').textContent=secret.name;
  $('secret-description').textContent=secret.text;
  $('secret-progress').textContent=`${state.discoveries.filter(s=>SECRETS[s]).length} de 3 lembranças encontradas`;
  $('secret-complete').hidden=Object.keys(SECRETS).some(s=>!state.discoveries.includes(s));
  showDialog($('secret-modal'));
}
function setupSecrets(){
  $('secret-origami').addEventListener('click',()=>discover('origami'));
  $('secret-lighthouse').addEventListener('click',()=>discover('lighthouse'));
  $('secret-constellation').addEventListener('click',()=>discover('constellation'));
}

setupNavigation();
setupDialogs();
setupToday();
setupCalendar();
setupGlobe();
setupPhases();
setupTimeline();
setupJournal();
setupSecrets();
