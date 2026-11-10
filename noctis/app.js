(() => {
  const {stars,lines,deep,meteorShowers,locations} = globalThis.NoctisData;
  const Sky = globalThis.NoctisSky;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const formatter = new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1});
  const cardById = new Map([...stars,...deep].map(item => [item.id,item]));
  const state = {
    locationKey:'salvador',
    custom:{name:'Coordenadas personalizadas',lat:-12.9777,lon:-38.5016,tz:'UTC'},
    time:new Date(),
    selected:null,
    tab:'observatorio',
    layers:{lines:true,labels:true,grid:true},
    zoom:1,panX:0,panY:0,
    plotted:[],dragging:null
  };

  function location() {
    return state.locationKey === 'custom' ? state.custom : locations[state.locationKey];
  }

  function formatDate(date, options={}) {
    return new Intl.DateTimeFormat('pt-BR',{...options,timeZone:location().tz}).format(date);
  }

  function setNotice(message) {
    $('#planet-status').textContent = message;
  }

  function announceTime() {
    $('#sky-date').value = Sky.zonedInput(state.time,location().tz);
    $('#timezone-note').textContent = state.locationKey === 'custom' ? `Fuso: ${location().tz} · horário de referência das coordenadas` : `Fuso: ${location().tz} · hora local da cidade escolhida`;
    $('#map-caption').textContent = `${location().name} · ${formatDate(state.time,{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false})}`;
  }

  function updateTime() {
    const result = Sky.zonedToUTC($('#sky-date').value,location().tz);
    if (!result) {
      $('#timezone-note').textContent = 'Esse horário não existe no fuso escolhido. Selecione outro horário.';
      return;
    }
    state.time=result;
    announceTime();
    redraw();
    renderTonight();
  }

  function changeLocation() {
    state.locationKey = $('#sky-location').value;
    $('#custom-coordinates').classList.toggle('hidden',state.locationKey !== 'custom');
    announceTime();
    redraw();
    renderTonight();
  }

  function updateCoordinates() {
    const latitude = Number($('#latitude').value);
    const longitude = Number($('#longitude').value);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return;
    state.custom.lat = latitude;
    state.custom.lon = longitude;
    redraw();
    renderTonight();
  }

  function allPositions(time=state.time) {
    const place = location();
    const starPositions=stars.map(star=>({...star,...Sky.altAz(star.ra,star.dec,place.lat,place.lon,time)}));
    return [...starPositions,...Sky.planetPositions(time,place)];
  }

  const canvas = $('#sky-canvas');
  const ctx = canvas.getContext('2d');
  let width=0,height=0,centerX=0,centerY=0,radius=0;
  const view = position => {
    const r = radius * ((90-position.alt)/90) * state.zoom;
    const angle = position.az*Math.PI/180;
    return {x:centerX+Math.sin(angle)*r+state.panX,y:centerY-Math.cos(angle)*r+state.panY};
  };

  function dimensions() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const dpr = Math.min(window.devicePixelRatio || 1,2);
    const w = Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width=w;canvas.height=h;
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    width=rect.width;height=rect.height;centerX=width/2;centerY=height/2;
    radius=Math.min(width*.445,height*.445);
    return true;
  }

  function drawSky() {
    if (!dimensions()) return;
    ctx.clearRect(0,0,width,height);
    const grad=ctx.createRadialGradient(centerX,centerY,12,centerX,centerY,Math.max(width,height)*.6);
    grad.addColorStop(0,'#142d4b');grad.addColorStop(.62,'#0b1b34');grad.addColorStop(1,'#060f20');
    ctx.fillStyle=grad;ctx.fillRect(0,0,width,height);

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX+state.panX,centerY+state.panY,radius*state.zoom,0,Math.PI*2);
    ctx.clip();
    if (state.layers.grid) {
      ctx.strokeStyle='rgba(156,191,238,.12)';ctx.lineWidth=1;
      for(const altitude of [0,30,60]) {
        ctx.beginPath();ctx.arc(centerX+state.panX,centerY+state.panY,radius*state.zoom*(90-altitude)/90,0,Math.PI*2);ctx.stroke();
      }
      for(let az=0;az<360;az+=30) {
        const end=view({alt:0,az});
        ctx.beginPath();ctx.moveTo(centerX+state.panX,centerY+state.panY);ctx.lineTo(end.x,end.y);ctx.stroke();
      }
    }

    const positions=allPositions();
    const starMap=new Map(positions.map(p=>[p.id,p]));
    if(state.layers.lines) {
      ctx.lineWidth=1.05;ctx.strokeStyle='rgba(120,164,228,.42)';
      for(const [,segments] of lines) {
        for(const [a,b] of segments) {
          const first=starMap.get(a),last=starMap.get(b);
          if(!first || !last || first.alt <= 0 || last.alt <= 0) continue;
          const p=view(first),q=view(last);
          ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
        }
      }
    }
    state.plotted=[];
    for(const star of positions.filter(p=>p.alt>0)) {
      const p=view(star),planet=star.type==='planeta';
      const size=planet ? 4.0 : Math.max(1.15,4.3-star.mag*.87);
      if (p.x < -20 || p.x>width+20 || p.y< -20 || p.y>height+20) continue;
      ctx.beginPath();ctx.fillStyle=planet ? star.color : 'rgba(197,221,255,.42)';
      ctx.shadowColor=planet ? star.color : '#b0d3ff';ctx.shadowBlur=planet?17:10;
      ctx.arc(p.x,p.y,size+ (planet?2.2:1.1),0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;ctx.beginPath();ctx.fillStyle=planet ? star.color : '#f0f7ff';
      ctx.arc(p.x,p.y,Math.max(1,size*.55),0,Math.PI*2);ctx.fill();
      if(state.layers.labels && (planet || star.mag<1.65 || star.id===state.selected?.id)) {
        ctx.font='12px "DM Sans", sans-serif';ctx.fillStyle='#d9e8fc';
        ctx.fillText(star.name,p.x+9,p.y-9);
      }
      if(state.selected?.id===star.id) {
        ctx.strokeStyle='#d4eaff';ctx.lineWidth=1.3;
        ctx.beginPath();ctx.arc(p.x,p.y,12,0,Math.PI*2);ctx.stroke();
      }
      state.plotted.push({...star,screenX:p.x,screenY:p.y});
    }
    ctx.restore();
    ctx.beginPath();ctx.strokeStyle='rgba(164,201,248,.46)';ctx.lineWidth=1;
    ctx.arc(centerX+state.panX,centerY+state.panY,radius*state.zoom,0,Math.PI*2);ctx.stroke();
    ctx.font='600 12px "DM Sans", sans-serif';ctx.fillStyle='#96aed2';ctx.textAlign='center';
    for(const [az,label] of [[0,'N'],[90,'L'],[180,'S'],[270,'O']]) {
      const p=view({az,alt:-7});ctx.fillText(label,p.x,p.y);
    }
    ctx.textAlign='start';
    $('#sky-overlay').textContent=`ZÊNITE · ${formatDate(state.time,{hour:'2-digit',minute:'2-digit',hour12:false})}`;
    if (positions.some(p=>p.type==='planeta')) setNotice('Planetas e Lua: efemérides calculadas com Astronomy Engine.');
    else setNotice('Estrelas disponíveis. Efemérides planetárias não carregadas — verifique a conexão.');
  }

  function redraw() {
    window.requestAnimationFrame(drawSky);
    if(state.selected) updateSelected();
  }

  function choose(item) {
    state.selected=item;
    updateSelected();
    redraw();
  }

  function updateSelected() {
    if(!state.selected) return;
    const current=allPositions().find(p=>p.id===state.selected.id);
    if(!current) {state.selected=null;$('#object-info').innerHTML='<p>Objeto não disponível para esta data.</p>';return;}
    const alt=Math.round(current.alt*10)/10;
    const az=Math.round(current.az*10)/10;
    const text=`${current.type==='planeta'?'Corpo do Sistema Solar':`Estrela · ${current.constellation}`}`;
    const extra=current.type==='estrela'?`<p>Distância aproximada: ${formatter.format(current.distance)} anos-luz</p><p>Magnitude aparente: ${formatter.format(current.mag)}</p>`:'';
    $('#object-info').innerHTML=`<span class="eyebrow">${text}</span><h3>${current.name}</h3><p>${current.description || ''}</p><dl><div><dt>Altitude</dt><dd>${formatter.format(alt)}°</dd></div><div><dt>Azimute</dt><dd>${formatter.format(az)}°</dd></div></dl>${extra}<p class="small-dim">${alt>0?'Acima do horizonte geométrico.':'Abaixo do horizonte geométrico.'}</p>`;
  }

  function clickMap(event) {
    const rect=canvas.getBoundingClientRect();
    const x=event.clientX-rect.left,y=event.clientY-rect.top;
    let nearest=null,minimum=18;
    for(const p of state.plotted) {
      const d=Math.hypot(p.screenX-x,p.screenY-y);
      if(d<minimum){minimum=d;nearest=p;}
    }
    if(nearest) choose(nearest);
  }

  function setupMapInteractions() {
    let pointerStart=null;
    canvas.addEventListener('pointerdown',e=>{
      pointerStart={x:e.clientX,y:e.clientY,panX:state.panX,panY:state.panY,moved:false};
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove',e=>{
      if(!pointerStart)return;
      const dx=e.clientX-pointerStart.x,dy=e.clientY-pointerStart.y;
      if(Math.hypot(dx,dy)>5) pointerStart.moved=true;
      if(pointerStart.moved) {
        state.panX=Sky.clamp(pointerStart.panX+dx,-radius*.7,radius*.7);
        state.panY=Sky.clamp(pointerStart.panY+dy,-radius*.7,radius*.7);
        redraw();
      }
    });
    canvas.addEventListener('pointerup',e=>{if(pointerStart && !pointerStart.moved)clickMap(e);pointerStart=null;});
    canvas.addEventListener('pointercancel',()=>{pointerStart=null;});
    canvas.addEventListener('wheel',e=>{
      e.preventDefault();state.zoom=Sky.clamp(state.zoom+(e.deltaY<0?.12:-.12),.72,2.4);redraw();
    },{passive:false});
    $('#zoom-in').addEventListener('click',()=>{state.zoom=Sky.clamp(state.zoom+.2,.72,2.4);redraw();});
    $('#zoom-out').addEventListener('click',()=>{state.zoom=Sky.clamp(state.zoom-.2,.72,2.4);redraw();});
    $('#reset-view').addEventListener('click',()=>{state.zoom=1;state.panX=0;state.panY=0;redraw();});
    new ResizeObserver(redraw).observe($('#sky-container'));
  }

  function renderTonight() {
    const place=location();
    const tonight=Sky.atLocalTime(state.time,place.tz,21) || state.time;
    const candidates=allPositions(tonight).filter(obj=>obj.alt>15 && obj.type==='estrela')
      .sort((a,b)=>a.mag-b.mag).slice(0,9);
    const moonAndPlanets=Sky.planetPositions(tonight,place).filter(p=>p.alt>15).slice(0,3);
    $('#tonight-city').textContent=place.name;
    $('#tonight-date').textContent=new Intl.DateTimeFormat('pt-BR',{timeZone:place.tz,day:'2-digit',month:'long',year:'numeric'}).format(tonight)+' · 21h';
    const items=[...moonAndPlanets,...candidates];
    $('#tonight-list').innerHTML=items.length ? items.map(o=>`<article class="object-card"><span class="object-card-symbol">${o.type==='planeta'?'◉':'✦'}</span><span class="eyebrow">${o.type==='planeta'?'SISTEMA SOLAR':o.constellation}</span><h3>${o.name}</h3><p>${o.description || 'Objeto calculado para o horário escolhido.'}</p><div class="object-card-bottom"><span>ALT ${formatter.format(o.alt)}°</span><span>AZ ${formatter.format(o.az)}°</span></div><button class="small-link" type="button" data-locate="${o.id}">Localizar no mapa ↗</button></article>`).join(''):'<p>Nenhum objeto do catálogo selecionado está acima de 15° neste horário.</p>';
  }

  function cardMarkup(item) {
    const isStar=item.type==='estrela';
    return `<article class="object-card"><span class="object-card-symbol">${isStar?'✦':'◎'}</span><span class="eyebrow">${isStar?'ESTRELA · '+item.constellation:item.kind.toUpperCase()}</span><h3>${item.name}</h3><p>${item.description}</p><div class="object-card-bottom"><span>${isStar?'MAG '+formatter.format(item.mag):item.designation}</span><span>${isStar?formatter.format(item.distance)+' AL':item.distance}</span></div><button class="small-link" type="button" data-detail="${item.id}">Conhecer objeto ↗</button></article>`;
  }

  function normalizeText(value) {
    return String(value).toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function renderAtlas() {
    const query = normalizeText($('#atlas-search').value.trim());
    const type = $('#atlas-type').value;
    const items = [...stars, ...deep].filter(item => {
      if (type !== 'todos' && item.type !== type) return false;
      const content = [item.name, item.id, item.constellation, item.designation].filter(Boolean).join(' ');
      return normalizeText(content).includes(query);
    });
    $('#atlas-list').innerHTML = items.length ? items.map(cardMarkup).join('') : '<p>Nenhum objeto encontrado. Tente outra pesquisa.</p>';
    $('#atlas-count').textContent = `${items.length} objeto(s) nesta seleção · catálogo introdutório, não exaustivo.`;
  }

  function renderSideral() {
    $('#sideral-list').innerHTML=deep.map(o=>`<article class="deep-card"><div class="deep-art ${o.art}" aria-label="Representação artística ilustrativa de ${o.name}" role="img"><span class="deep-art-label">ILUSTRAÇÃO ARTÍSTICA</span></div><div class="deep-card-content"><span class="eyebrow">${o.designation} / ${o.kind}</span><h3>${o.name}</h3><p>${o.description}</p><div class="deep-meta"><span>${o.distance}</span><span>${o.constellation}</span></div><button class="small-link" type="button" data-detail="${o.id}">Explorar objeto ↗</button></div></article>`).join('');
  }

  function renderEvents() {
    const now=new Date();
    const nearest=meteorShowers.map(o=>{
      let year=now.getUTCFullYear();
      let date=new Date(Date.UTC(year,o.month-1,o.day,12));
      if(date<now){year++;date=new Date(Date.UTC(year,o.month-1,o.day,12));}
      return {...o,date,year};
    }).sort((a,b)=>a.date-b.date);
    $('#events-list').innerHTML=nearest.map(event=>`<article class="event-row"><div class="event-date"><strong>${String(event.day).padStart(2,'0')}</strong><span>${new Intl.DateTimeFormat('pt-BR',{month:'short',timeZone:'UTC'}).format(event.date).toUpperCase().replace('.','')}</span></div><div><span class="eyebrow">CHUVA DE METEOROS · ${event.year}</span><h3>${event.name}</h3><p>${event.description}</p><small>${event.period} · data de referência anual, não máximo confirmado.</small></div><span class="event-star" aria-hidden="true">✧</span></article>`).join('');
  }

  function detail(item) {
    const isStar=item.type==='estrela';
    const source=isStar?'https://simbad.cds.unistra.fr/simbad/':item.source;
    $('#dialog-body').innerHTML=`<span class="eyebrow">${isStar?'ESTRELA · '+item.constellation:item.kind+' · '+item.constellation}</span><h2 id="detail-title">${item.name}</h2><p>${item.description}</p><div class="dialog-facts"><div><small>Distância aproximada</small><strong>${isStar?formatter.format(item.distance)+' anos-luz':item.distance}</strong></div><div><small>${isStar?'Magnitude aparente':'Catálogo'}</small><strong>${isStar?formatter.format(item.mag):item.designation}</strong></div></div>${isStar?`<p class="dialog-extra">Coordenadas de referência J2000: AR ${formatter.format(item.ra)}h · Dec ${formatter.format(item.dec)}°.</p>`:''}<a class="button outline" href="${source}" target="_blank" rel="noopener noreferrer">Consultar fonte astronômica ↗</a>`;
    $('#detail-dialog').showModal();
  }

  function selectTab(name,scroll=true) {
    if(!['observatorio','esta-noite','atlas','sideral','eventos'].includes(name))return;
    state.tab=name;
    $$('.section-tab').forEach(button=>{
      const active=button.dataset.tab===name;
      button.classList.toggle('active',active);
      if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    });
    $$('[data-section]').forEach(section=>section.classList.toggle('hidden',section.dataset.section!==name));
    history.replaceState(null,'',`#${name}`);
    if(scroll) $('.section-nav-wrap').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    if(name==='observatorio')redraw();
    if(name==='esta-noite')renderTonight();
    if(name==='atlas')renderAtlas();
  }

  function installEvents() {
    $$('.section-tab').forEach(button=>button.addEventListener('click',()=>selectTab(button.dataset.tab)));
    $$('[data-goto]').forEach(button=>button.addEventListener('click',()=>selectTab(button.dataset.goto)));
    $('#sky-location').addEventListener('change',changeLocation);
    $('#latitude').addEventListener('change',updateCoordinates);
    $('#longitude').addEventListener('change',updateCoordinates);
    $('#sky-date').addEventListener('change',updateTime);
    $('#now-button').addEventListener('click',()=>{state.time=new Date();announceTime();redraw();renderTonight();});
    for(const [key,id] of [['lines','#show-lines'],['labels','#show-labels'],['grid','#show-grid']]) {
      $(id).addEventListener('change',event=>{state.layers[key]=event.target.checked;redraw();});
    }
    $('#atlas-search').addEventListener('input',renderAtlas);
    $('#atlas-type').addEventListener('change',renderAtlas);
    $('#use-my-location').addEventListener('click',()=>{
      const button=$('#use-my-location');
      if(!navigator.geolocation){button.textContent='Seu navegador não oferece geolocalização.';return;}
      button.disabled=true;button.textContent='Solicitando permissão…';
      navigator.geolocation.getCurrentPosition(position=>{
        state.custom={name:'Localização do dispositivo',lat:position.coords.latitude,lon:position.coords.longitude,tz:Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'};
        state.locationKey='custom';$('#sky-location').value='custom';
        $('#latitude').value=state.custom.lat.toFixed(4);$('#longitude').value=state.custom.lon.toFixed(4);
        $('#custom-coordinates').classList.remove('hidden');button.disabled=false;button.textContent='⌖ Usar minha localização';
        announceTime();redraw();renderTonight();
      },()=>{button.disabled=false;button.textContent='Localização indisponível — escolha uma cidade';},{timeout:9000,maximumAge:600000});
    });
    document.addEventListener('click',event=>{
      const button=event.target.closest('[data-detail], [data-locate]');
      if(!button)return;
      if(button.dataset.detail) { const item=cardById.get(button.dataset.detail);if(item)detail(item); }
      if(button.dataset.locate) {
        const id=button.dataset.locate;
        state.time=Sky.atLocalTime(state.time,location().tz,21) || state.time;
        announceTime();
        selectTab('observatorio');
        const item=allPositions().find(p=>p.id===id);
        if(item)choose(item);
        else $('#object-info').innerHTML='<p>Esse objeto está indisponível para o horário atual do mapa.</p>';
      }
    });
    $('#close-dialog').addEventListener('click',()=>$('#detail-dialog').close());
    $('#detail-dialog').addEventListener('click',event=>{if(event.target===$('#detail-dialog'))$('#detail-dialog').close();});
    window.addEventListener('hashchange',()=>{const name=window.location.hash.slice(1);if(name!==state.tab)selectTab(name,false);});
    setupMapInteractions();
  }

  function loadEphemerides() {
    const script=document.createElement('script');
    script.src='https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js';
    script.async=true;
    script.onload=()=>{redraw();renderTonight();};
    script.onerror=()=>setNotice('O mapa estelar segue disponível. Não foi possível carregar as posições dos planetas.');
    document.head.append(script);
  }

  function init() {
    announceTime();renderAtlas();renderSideral();renderEvents();renderTonight();installEvents();loadEphemerides();
    selectTab(window.location.hash.slice(1)||'observatorio',false);
    setTimeout(redraw,80);
  }

  init();
})();
