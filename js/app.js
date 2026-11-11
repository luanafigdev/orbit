/* ORBIT — aplicação independente em HTML, CSS, JavaScript e Canvas 2D.
   Sem framework, sem cadastro e sem telemetria. © Luana Figueiredo. */
(() => {
  'use strict';
  const {planetas,curiosidades,missoes,linhaTempo,fontes}=window.ORBIT_DATA;
  const app=document.getElementById('app');
  const storageKey='orbit-luana-favorites-v1';
  const saved=()=>{try{return JSON.parse(localStorage.getItem(storageKey)||'[]')}catch{return []}};
  const state={
    favoritos:new Set(Array.isArray(saved())?saved():[]), selecionado:'saturno', planetaFiltro:'Todos', fatoFiltro:'Todos', missaoFiltro:'Todas', tempoFiltro:'Todos',
    buscaPlaneta:'',buscaFato:'',buscaMissao:'',fatoAtual:1, planetLimit:8,
    compara:['terra','saturno'], metricas:'diametro', menu:false, modal:null, orbitaRodando:true, velocidade:2, zoom:1, rotulos:true, tempo:0,
    quizIndex:0, quizPontos:0, quizResposta:null
  };
  const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const byId=id=>planetas.find(p=>p.id===id)||planetas[5];
  const ptNumber=(n,max=0)=>Number(n).toLocaleString('pt-BR',{maximumFractionDigits:max});
  const link=(name,href,klass='')=>`<a class="${klass}" href="${href}">${name}</a>`;
  const route=()=>decodeURIComponent((location.hash||'#inicio').replace(/^#\/?/,''))||'inicio';
  const go=(path)=>location.hash='#'+path;
  let canvasController=null;
  let toastTimer=0;

  const icons={
    orbit:'<circle cx="12" cy="12" r="5.3"/><ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(-27 12 12)"/>',
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',external:'<path d="M7 17 17 7M8 7h9v9"/>',
    heart:'<path d="M20.8 4.8a5.6 5.6 0 0 0-7.9 0L12 5.7l-.9-.9a5.6 5.6 0 0 0-7.9 7.9L12 21l8.8-8.3a5.6 5.6 0 0 0 0-7.9z"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',close:'<path d="M5 5 19 19M19 5 5 19"/>',
    chevron:'<path d="m9 18 6-6-6-6"/>',chevronLeft:'<path d="m15 18-6-6 6-6"/>',
    pause:'<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    play:'<path d="m7 4 13 8-13 8z"/>',plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',
    sliders:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="currentColor"/><circle cx="16" cy="17" r="2" fill="currentColor"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
    planet:'<circle cx="12" cy="12" r="8"/><path d="M5 6c4 3 8 7 13 11"/>',
    spark:'<path d="m12 2 2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3L12 2z"/>',
    layers:'<path d="m12 3 10 5-10 5L2 8l10-5zM2 12l10 5 10-5M2 16l10 5 10-5"/>',
    check:'<path d="m4 12 5 5L20 6"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-6 5-6 13 0 18M12 3c6 5 6 13 0 18"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7h.01"/>',
    filter:'<path d="M4 7h16M7 12h10M10 17h4"/>',
    telescope:'<path d="m14 3 8 8-3 3-8-8zM3 12l9-9M8 14l-3 7M14 14l4 7M5 17h14"/>',
    rocket:'<path d="M12 3c4 1 7 4 9 9-3 4-7 7-12 9l-3-3 6-15zM9 16l-4 4M6 17l-3-3 4-6M14 10h.01"/>',
    refresh:'<path d="M20 7v5h-5M4 17v-5h5M6 8a7 7 0 0 1 12-2l2 1M4 17l2 1a7 7 0 0 0 12-2"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    sort:'<path d="M8 3v18M4 7l4-4 4 4M16 21V3M12 17l4 4 4-4"/>',
    globe2:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/>',
  };
  const ico=(n,size=20)=>`<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[n]||icons.spark}</svg>`;
  const like=(type,id)=>{
    const key=`${type}:${id}`,on=state.favoritos.has(key);
    return `<button class="fav-toggle ${on?'is-fav':''}" data-action="favorite" data-id="${key}" aria-label="${on?'Remover dos':'Adicionar aos'} favoritos" aria-pressed="${on}" title="${on?'Remover favorito':'Salvar favorito'}">${ico('heart',19)}</button>`;
  };
  const planetImg=(p,cls='')=>`<img class="${cls}" src="${p.imagem}" alt="Ilustração artística de ${p.nome}" loading="lazy">`;
  const chip=(t,cls='')=>`<span class="chip ${cls}">${escapeHTML(t)}</span>`;
  const btn=(text,to,secondary=false)=>`<a class="btn ${secondary?'btn-ghost':'btn-primary'}" href="#${to}">${text} ${ico('arrow',17)}</a>`;
  const sectionEyebrow=(index,t)=>`<div class="eyebrow"><span class="eyebrow-line"></span>${index?`<span class="eyebrow-index">${index} / ORBIT</span>`:''}<span>${t}</span></div>`;

  function nav(){
    const r=route(),current= r.startsWith('planeta/')?'planetas':r;
    const items=[['inicio','Início'],['explorar','Explorar'],['planetas','Planetas'],['comparar','Comparar'],['curiosidades','Curiosidades'],['missoes','Missões'],['linha-do-tempo','Linha do tempo']];
    return `<header class="site-header"><div class="header-inner">
      <a href="#inicio" class="logo" aria-label="ORBIT — voltar ao início">${ico('orbit',35)}<span>O R B I T</span></a>
      <nav class="desktop-nav" aria-label="Navegação principal">${items.map(([path,t])=>`<a class="nav-link ${current===path?'active':''}" href="#${path}">${t}</a>`).join('')}</nav>
      <div class="header-right"><a class="header-fav ${current==='favoritos'?'active':''}" href="#favoritos" title="Minha coleção">${ico('heart',18)}<span class="fav-count">${state.favoritos.size}</span></a><button class="icon-btn menu-toggle" data-action="menu" aria-label="Abrir menu" aria-expanded="${state.menu}">${ico(state.menu?'close':'menu',24)}</button></div>
    </div>${state.menu?`<nav class="mobile-nav" aria-label="Navegação para celular">${items.map(([path,t])=>`<a href="#${path}">${t} ${ico('arrow',15)}</a>`).join('')}<a href="#favoritos">Minha coleção ${ico('heart',15)}</a></nav>`:''}</header>`;
  }
  function footer(){return `<footer class="footer" id="contato"><div class="footer-contact shell">
    <div class="footer-copy">${sectionEyebrow('','DESENVOLVIDO COM CRIATIVIDADE')}<h2>Gostou desta experiência?<br><em>Vamos criar a sua</em></h2><p>Sites e experiências digitais com identidade, cuidado e personalidade.</p></div>
    <div class="footer-cta"><a href="mailto:luanafigueiredo.dev@gmail.com?subject=Vamos%20conversar%20sobre%20um%20projeto" class="btn btn-primary">${ico('mail',19)} Entrar em contato ${ico('arrow',17)}</a><a class="footer-email" href="mailto:luanafigueiredo.dev@gmail.com">luanafigueiredo.dev@gmail.com</a></div>
  </div><div class="footer-bottom shell"><a class="footer-brand" href="#inicio">${ico('orbit',27)} ORBIT</a><span>Um projeto autoral de Luana Figueiredo.</span><div class="footer-links"><a href="#fontes">Fontes científicas</a><a href="#inicio">Voltar ao início ↑</a></div></div></footer>`;}
  function sources(){return `<div class="sources shell"><div class="sources-heading">${ico('info',17)} Referências & transparência</div><p>Dados físicos arredondados com base na NASA e no JPL. Contagens de luas podem mudar com novas descobertas. Ilustrações autorais geradas proceduralmente; não são fotografias da NASA. As órbitas interativas são esquemáticas e não estão em escala. ORBIT é independente e não é afiliado ou endossado pela NASA.</p><div class="source-links">${fontes.map(f=>`<a href="${f.url}" target="_blank" rel="noopener noreferrer">${escapeHTML(f.nome)} ${ico('external',12)}</a>`).join('')}</div></div>`;}
  function renderLayout(content){return `${nav()}<main id="conteudo">${content}</main>${sources()}${footer()}<div class="toast" id="toast" role="status" aria-live="polite"></div>${state.modal?modalHTML():''}`;}

  function home(){const p=byId(state.selecionado),f=curiosidades[(state.fatoAtual+curiosidades.length)%curiosidades.length];
    return `<div class="home-page"><section class="hero" aria-label="Apresentação do ORBIT"><div class="hero-nebula"></div><div class="hero-inner shell">
      <div class="hero-copy">${sectionEyebrow('01','UMA JORNADA ALÉM DO COMUM')}<p class="hero-tiny">THE SOLAR SYSTEM / INTERACTIVE EXPERIENCE</p><h1 class="hero-title">ORBIT</h1><h2>O universo está<br><em>mais perto do que parece</em></h2><p class="hero-description">Descubra os oito planetas, viaje pelas órbitas e explore as histórias que tornam o nosso Sistema Solar extraordinário.</p><div class="hero-actions">${btn('Começar a explorar','explorar')}${btn('Conhecer planetas','planetas',true)}</div><div class="hero-scroll"><span class="scroll-line"></span>ROLE PARA DESCOBRIR</div></div>
      <div class="hero-planet" aria-hidden="true"><span class="planet-halo"></span><img src="assets/saturno-hero.png" alt="" fetchpriority="high"><span class="hero-crosshair top"></span><span class="hero-crosshair bottom"></span></div>
      <aside class="planet-spotlight"><div class="spotlight-heading"><span class="small-pill"><span class="pulse-dot"></span> PLANETA EM FOCO</span><span>${p.numero} / 08</span></div><div class="spotlight-identity">${planetImg(p,'spotlight-icon')}<div><h3>${p.nome}</h3><p>${p.subtitulo}</p></div></div><p class="spotlight-intro">${p.resumo}</p><div class="spotlight-stats"><div><span>DIÂMETRO</span><strong>${ptNumber(p.diametro)} km</strong></div><div><span>DISTÂNCIA DO SOL</span><strong>${ptNumber(p.distancia,2)} UA</strong></div><div><span>ANO ORBITAL</span><strong>${ptNumber(p.ano)} dias</strong></div></div><a href="#planeta/${p.id}" class="spotlight-link">Explorar ${p.nome} ${ico('arrow',17)}</a></aside>
    </div><div class="hero-bottom shell"><span>UMA EXPERIÊNCIA CRIADA PARA DESCOBRIR</span><span>08 PLANETAS <span class="star-separator">✦</span> INFINITAS PERGUNTAS</span></div></section>
    <section class="planet-selector shell" aria-labelledby="planets-home-title"><div class="row-heading"><div>${sectionEyebrow('02','NOSSA VIZINHANÇA CÓSMICA')}<h2 id="planets-home-title">O Sistema Solar <em>ao seu alcance</em></h2></div><a class="text-link" href="#planetas">Ver todos os planetas ${ico('arrow',17)}</a></div><div class="planet-strip">${planetas.map(planet=>`<button class="planet-pick ${planet.id===p.id?'selected':''}" data-action="select-planet" data-id="${planet.id}" aria-pressed="${planet.id===p.id}">${planetImg(planet)}<span>${planet.nome}</span></button>`).join('')}</div><div class="strip-caption"><span>EM FOCO: ${p.nome.toUpperCase()}</span><a href="#planeta/${p.id}">Conhecer ${p.nome} ${ico('arrow',14)}</a></div></section>
    <section class="explore-section shell" aria-label="Descubra o ORBIT"><div class="feature-grid">${[
      ['explorar','Exploração orbital','Veja o movimento dos planetas em uma simulação interativa.','orbit','terra'],
      ['comparar','Compare mundos','Tamanhos, massas, distâncias e gravidade lado a lado.','layers','jupiter'],
      ['linha-do-tempo','Linha do tempo','Viaje pelos grandes momentos da astronomia.','clock','urano'],
      ['missoes','Missões espaciais','Conheça as sondas e telescópios que ampliaram nossos horizontes.','rocket','saturno']
    ].map((it,i)=>`<a class="feature-card feature-${i}" href="#${it[0]}"><div class="feature-sheen"></div>${planetImg(byId(it[4]),'feature-art')}<span class="feature-icon">${ico(it[3],23)}</span><div class="feature-text"><h3>${it[1]}</h3><p>${it[2]}</p><span class="feature-go">Descobrir ${ico('arrow',17)}</span></div></a>`).join('')}</div></section>
    <section class="home-facts shell"><div class="row-heading"><div>${sectionEyebrow('03','O UNIVERSO SURPREENDE')}<h2>Curiosidades <em>que desafiam a imaginação</em></h2></div><a class="text-link" href="#curiosidades">Explorar curiosidades ${ico('arrow',17)}</a></div><div class="home-fact-panel"><div class="home-fact-art"><img src="${byId(f.planeta).imagem}" alt="Ilustração de ${byId(f.planeta).nome}"><span>VOCÊ SABIA?</span></div><div class="home-fact-content"><div class="home-fact-top">${chip(f.categoria)} <span>${f.numero} / ${curiosidades.length}</span></div><h3>${f.titulo}</h3><p>${f.resumo}</p><div class="home-fact-footer"><button class="text-link" data-action="fact-detail" data-id="${f.id}">Descobrir mais ${ico('arrow',17)}</button><div class="fact-arrows"><button class="round-arrow" data-action="fact-slide" data-step="-1" aria-label="Curiosidade anterior">${ico('chevronLeft',18)}</button><button class="round-arrow" data-action="fact-slide" data-step="1" aria-label="Próxima curiosidade">${ico('chevron',18)}</button></div></div></div></div></section>
    <section class="home-quote shell"><span>“</span><blockquote>Somos feitos da mesma matéria das estrelas — e ainda estamos aprendendo a olhar para elas.</blockquote><p>UM CONVITE À CURIOSIDADE</p></section></div>`;
  }

  function innerHero(no,label,title,desc,extra=''){return `<header class="page-hero shell">${sectionEyebrow(no,label)}<div class="page-hero-grid"><div><h1>${title}</h1><p>${desc}</p></div>${extra}</div></header>`;}
  function planetCard(p,index){return `<article class="planet-card" style="--planet-accent:${p.cor}"><a class="planet-card-link" href="#planeta/${p.id}" aria-label="Conhecer ${p.nome}"><div class="planet-card-visual"><span class="planet-card-orbit"></span>${planetImg(p)}<span class="planet-card-number">${p.numero} / 08</span></div><div class="planet-card-name"><div><span class="card-kicker">${p.classe}</span><h3>${p.nome}</h3><p>${p.subtitulo}</p></div><span class="card-arrow">${ico('arrow',19)}</span></div></a><div class="planet-card-foot"><span>${ptNumber(p.distancia,2)} UA DO SOL</span>${like('planeta',p.id)}</div></article>`;}
  function planetsPage(){
    const query=state.buscaPlaneta.toLocaleLowerCase('pt-BR').trim();const found=planetas.filter(p=>(state.planetaFiltro==='Todos'||p.classe===state.planetaFiltro)&&(`${p.nome} ${p.subtitulo} ${p.classe}`.toLowerCase().includes(query)));
    return `${innerHero('02','OS OITO MUNDOS','Cada planeta guarda<br><em>um universo.</em>','Dos mundos rochosos aos gigantes de gelo: escolha um planeta e descubra o que existe além da sua aparência.',`<div class="page-counter"><strong>08</strong><span>PLANETAS<br>PARA EXPLORAR</span></div>`)}<section class="shell listing"><div class="toolbar"><div class="segmented">${['Todos','Rochoso','Gigante gasoso','Gigante de gelo'].map(t=>`<button class="segment ${state.planetaFiltro===t?'active':''}" data-action="planet-filter" data-value="${t}" aria-pressed="${state.planetaFiltro===t}">${t==='Rochoso'?'Rochosos':t==='Gigante gasoso'?'Gigantes gasosos':t==='Gigante de gelo'?'Gigantes de gelo':'Todos'}</button>`).join('')}</div><label class="search-field">${ico('search',18)}<input data-search="planeta" type="search" placeholder="Buscar um planeta..." value="${escapeHTML(state.buscaPlaneta)}" aria-label="Buscar planeta"></label></div><div class="catalog-status">${String(found.length).padStart(2,'0')} ${found.length===1?'RESULTADO':'RESULTADOS'} ENCONTRADOS</div>${found.length?`<div class="planet-grid">${found.map(planetCard).join('')}</div>`:emptyState('Nenhum planeta encontrado','Tente outro nome ou remova os filtros.','planetas')}</section>`;
  }
  function statGrid(p){return [
    ['Diâmetro',`${ptNumber(p.diametro)} km`,'planeta'],['Massa',`${ptNumber(p.massa,3)} Terras`,'layers'],['Gravidade',`${ptNumber(p.gravidade,1)} m/s²`,'globe'],['Distância média',`${ptNumber(p.distancia,2)} UA`,'orbit'],['Ano orbital',`${ptNumber(p.ano)} dias`,'calendar'],['Rotação sideral',`${ptNumber(Math.abs(p.rotacao),1)} h${p.rotacao<0?' ↶':''}`,'clock'],['Temperatura média',`${ptNumber(p.temperatura)} °C`,'spark'],['Luas conhecidas*',`${ptNumber(p.luas)}`,'globe']
  ].map(s=>`<div class="fact-stat">${ico(s[2],18)}<span>${s[0]}</span><strong>${s[1]}</strong></div>`).join('');}
  function planetDetail(id){const p=byId(id),index=planetas.findIndex(x=>x.id===p.id);const relatedFacts=curiosidades.filter(f=>f.planeta===p.id).slice(0,3);
    return `<div class="detail-page"><section class="detail-hero" style="--planet-accent:${p.cor}"><div class="shell"><a class="back-link" href="#planetas">${ico('chevronLeft',17)} Todos os planetas</a><div class="detail-layout"><div class="detail-words"><span class="eyebrow-simple">PLANETA ${p.numero} <span>✦</span> ${p.classe.toUpperCase()}</span><h1>${p.nome}</h1><h2>${p.subtitulo}</h2><p>${p.resumo}</p><div class="detail-buttons">${like('planeta',p.id)}${btn('Comparar este planeta','comparar',true)}</div></div><div class="detail-planet-art">${planetImg(p)}<div class="detail-orbit-arc"></div></div><div class="detail-number">${p.numero} <span>/ 08</span></div></div></div></section><section class="shell detail-content"><div class="detail-intro"><div>${sectionEyebrow('','ALÉM DA SUPERFÍCIE')}<h2>Conheça <em>${p.nome}</em></h2><p>${p.descricao}</p></div><div class="detail-note">${ico('info',21)}<div><strong>Você sabia?</strong><p>${p.fatos[0]}</p></div></div></div><h3 class="section-subtitle">Em números</h3><div class="stat-grid">${statGrid(p)}</div><p class="science-note">* Contagem de luas conforme a tabela de referência da NASA; novas descobertas podem alterar o total. Valores físicos aproximados.</p><div class="detail-lower"><div class="detail-facts"><h3>Três coisas para guardar</h3>${p.fatos.map((f,i)=>`<div class="detail-bullet"><span>0${i+1}</span><p>${f}</p></div>`).join('')}</div><div class="detail-related"><h3>Curiosidades relacionadas</h3>${relatedFacts.length?relatedFacts.map(c=>`<button data-action="fact-detail" data-id="${c.id}">${ico('spark',17)}<span>${c.titulo}</span>${ico('arrow',17)}</button>`).join(''):'<p>Mais curiosidades estão chegando.</p>'}</div></div><div class="detail-next"><a href="#planeta/${planetas[(index+7)%8].id}">${ico('chevronLeft',19)} ${planetas[(index+7)%8].nome}</a><span>CONTINUE EXPLORANDO</span><a href="#planeta/${planetas[(index+1)%8].id}">${planetas[(index+1)%8].nome} ${ico('chevron',19)}</a></div></section></div>`;
  }
  function explore(){
    const selected=byId(state.selecionado);
    return `${innerHero('03','EXPERIÊNCIA INTERATIVA','O Sistema Solar<br><em>em movimento.</em>','Controle o tempo, escolha um planeta e observe uma representação animada de suas órbitas. Cada clique revela um novo mundo.')}
    <section class="shell orbit-section"><div class="orbit-workspace"><div class="orbit-topbar"><div><span class="live-indicator"><span></span> SIMULADOR ORBITAL</span><strong>Sistema Solar / Vista superior inclinada</strong></div><div class="orbit-buttons"><button class="round-arrow" data-action="orbit-play" aria-label="${state.orbitaRodando?'Pausar':'Reproduzir'} animação" title="${state.orbitaRodando?'Pausar':'Reproduzir'}">${ico(state.orbitaRodando?'pause':'play',17)}</button><button class="round-arrow" data-action="orbit-reset" aria-label="Reiniciar simulação" title="Reiniciar">${ico('refresh',17)}</button></div></div><div class="canvas-frame"><canvas id="orbit-canvas" tabindex="0" role="img" aria-label="Representação animada do Sol e das órbitas dos oito planetas. Você pode selecionar um planeta na lista abaixo."></canvas><div class="orbit-hint">${ico('info',14)} Movimentos e distâncias visuais esquemáticos, fora de escala</div></div><div class="orbit-controls"><label>VELOCIDADE <strong id="speed-value">${state.velocidade}×</strong><input id="speed-control" type="range" min="1" max="30" value="${state.velocidade}" aria-label="Velocidade da simulação"></label><label>ZOOM <strong id="zoom-value">${Math.round(state.zoom*100)}%</strong><input id="zoom-control" type="range" min="70" max="150" value="${Math.round(state.zoom*100)}" aria-label="Zoom do simulador"></label><label class="checkline"><input type="checkbox" id="labels-control" ${state.rotulos?'checked':''}> Identificar planetas</label></div></div><div class="orbit-sidebar"><div class="sidebar-header">${sectionEyebrow('','SELECIONAR UM MUNDO')}<h3>Escolha o próximo destino</h3></div><div class="orbit-planet-list">${planetas.map(p=>`<button data-action="select-orbit" data-id="${p.id}" class="orbit-planet-item ${selected.id===p.id?'active':''}">${planetImg(p)}<span>${p.nome}<small>${p.classe}</small></span>${ico('chevron',16)}</button>`).join('')}</div><div class="orbit-selected"><span>EM FOCO</span><strong>${selected.nome}</strong><p>${selected.subtitulo}</p><a href="#planeta/${selected.id}">Ver dados completos ${ico('arrow',16)}</a></div></div></section><section class="shell orbit-explanation">${ico('info',22)}<p>Este simulador educativo usa períodos orbitais aproximados da NASA, mas apresenta posições iniciais ilustrativas, órbitas circulares e tamanhos exagerados para facilitar a observação. Não representa posições astronômicas atuais nem serve para navegação.</p></section>`;
  }
  const metrics={diametro:['Diâmetro','km',p=>p.diametro],massa:['Massa','Terras',p=>p.massa],distancia:['Distância do Sol','UA',p=>p.distancia],gravidade:['Gravidade','m/s²',p=>p.gravidade],ano:['Duração do ano','dias',p=>p.ano],luas:['Luas conhecidas','luas',p=>p.luas],temperatura:['Temperatura média','°C',p=>p.temperatura]};
  function compare(){
    const [p1,p2]=state.compara.map(byId),[keyLabel,unit,getval]=metrics[state.metricas];const selected= [p1,p2];
    return `${innerHero('04','COLOQUE EM PERSPECTIVA','Dois mundos.<br><em>Infinitas diferenças.</em>','Compare o que torna cada planeta único. Escolha dois mundos e veja seus números lado a lado.')}
    <section class="shell compare-layout"><div class="compare-selectors">${[p1,p2].map((p,i)=>`<div class="compare-selector"><span>PLANETA 0${i+1}</span><label class="sr-only" for="compare-${i}">Selecionar planeta ${i+1}</label><select id="compare-${i}" data-select="compare" data-slot="${i}">${planetas.map(o=>`<option value="${o.id}" ${p.id===o.id?'selected':''}>${o.nome}</option>`).join('')}</select><div class="compare-art">${planetImg(p)}</div><h3>${p.nome}</h3><p>${p.subtitulo}</p></div>${i===0?`<div class="versus"><span>VS</span><button data-action="swap-compare" title="Trocar os planetas" aria-label="Trocar planetas">${ico('refresh',18)}</button></div>`:''}`).join('')}</div><div class="compare-dashboard"><div class="compare-menu"><h3>Compare as grandezas</h3><div class="metric-tabs">${Object.keys(metrics).map(k=>`<button data-action="metric" data-value="${k}" class="${state.metricas===k?'active':''}" aria-pressed="${state.metricas===k}">${metrics[k][0]}</button>`).join('')}</div></div><div class="compare-result"><div class="result-heading"><span>${keyLabel.toUpperCase()}</span><span>VALORES APROXIMADOS</span></div>${selected.map(p=>{const val=getval(p);const vals=selected.map(getval);const max=Math.max(1,...vals.map(x=>Math.abs(x)));const px=Math.max(1,Math.abs(val)/max*100);return `<div class="compare-bar-row"><div><strong>${p.nome}</strong><span>${ptNumber(val,3)} ${unit}</span></div><div class="compare-rail"><div style="width:${px}%;background:${p.cor}"></div></div></div>`;}).join('')}<p class="chart-note">Comprimento das barras relativo ao maior valor entre os dois planetas selecionados; valores numéricos são os dados de referência. Temperaturas negativas são representadas pela magnitude absoluta.</p></div><div class="compare-fact-table">${[['Diâmetro','diametro','km'],['Massa','massa','Terras'],['Gravidade','gravidade','m/s²'],['Distância','distancia','UA'],['Ano','ano','dias'],['Luas','luas','']].map(([label,k,unit])=>`<div><strong>${label}</strong><span>${ptNumber(p1[k],3)} ${unit}</span><span>${ptNumber(p2[k],3)} ${unit}</span></div>`).join('')}</div></div></section>`;
  }
  function factCard(f,i){const p=byId(f.planeta);return `<article class="curiosity-card ${i===0?'curiosity-large':''}"><div class="curiosity-card-visual"><img src="${p.imagem}" alt="Ilustração de ${p.nome}" loading="lazy"><span>${f.numero} / ${curiosidades.length}</span></div><div class="curiosity-card-body"><div class="card-cats">${chip(f.categoria)}<span>${p.nome}</span></div><h3>${f.titulo}</h3><p>${f.resumo}</p><div class="card-foot"><button data-action="fact-detail" data-id="${f.id}" class="text-link">Ler curiosidade ${ico('arrow',17)}</button>${like('fato',f.id)}</div></div></article>`;}
  function facts(){const categories=['Todos','Planetas','Luas','Fenômenos','Descobertas']; const query=state.buscaFato.trim().toLowerCase();let pool=curiosidades.filter(f=>(state.fatoFiltro==='Todos'||f.categoria===state.fatoFiltro)&&(`${f.titulo} ${f.resumo} ${byId(f.planeta).nome}`.toLowerCase().includes(query)));
    return `${innerHero('05','PERGUNTAS SEM FIM','O universo é feito<br><em>de surpresas.</em>','Histórias improváveis, fenômenos surpreendentes e descobertas que mudam a forma como enxergamos o céu.',`<div class="page-counter"><strong>${curiosidades.length}</strong><span>CURIOSIDADES<br>PARA DESCOBRIR</span></div>`)}<section class="shell facts-listing"><div class="fact-feature"><div class="fact-feature-image">${planetImg(byId('saturno'))}</div><div class="fact-feature-copy"><span class="eyebrow-simple">✦ DESTAQUE CÓSMICO</span><h2>Nem tudo o que parece <em>é o que é</em></h2><p>O universo guarda histórias que ultrapassam a nossa imaginação. Escolha uma e comece a descobrir.</p><button class="btn btn-primary" data-action="fact-detail" data-id="sat-aneis">Conhecer esta história ${ico('arrow',17)}</button></div></div><div class="toolbar facts-toolbar"><div class="segmented">${categories.map(t=>`<button data-action="fact-filter" data-value="${t}" class="segment ${state.fatoFiltro===t?'active':''}" aria-pressed="${state.fatoFiltro===t}">${t}</button>`).join('')}</div><label class="search-field">${ico('search',18)}<input data-search="fato" type="search" placeholder="Buscar curiosidade..." value="${escapeHTML(state.buscaFato)}" aria-label="Buscar curiosidades"></label></div><div class="catalog-status">${String(pool.length).padStart(2,'0')} HISTÓRIAS PARA EXPLORAR</div>${pool.length?`<div class="curiosity-grid">${pool.map(factCard).join('')}</div>`:emptyState('Nenhuma curiosidade encontrada','Tente um termo ou categoria diferente.','curiosidades')}</section>`;
  }
  function missionCard(m,i){return `<article class="mission-card"><div class="mission-top"><span>${String(i+1).padStart(2,'0')} / ${String(missoes.length).padStart(2,'0')}</span>${like('missao',m.id)}</div><div class="mission-icon">${ico(i%3===0?'rocket':i%3===1?'telescope':'globe',36)}</div><div class="mission-year">LANÇAMENTO • ${m.ano}</div><h3>${m.nome}</h3><div class="mission-type">${m.tipo}</div><p>${m.resumo}</p><div class="mission-bottom"><span>${m.destino}</span><button data-action="mission-detail" data-id="${m.id}" aria-label="Saiba mais sobre ${m.nome}">${ico('arrow',18)}</button></div></article>`;}
  function missions(){const categories=['Todas','Sonda interplanetária','Telescópio espacial','Orbitador','Rover','Sonda solar','Orbitador e módulo de pouso'];const query=state.buscaMissao.toLowerCase().trim();let arr=missoes.filter(m=>(state.missaoFiltro==='Todas'||m.tipo===state.missaoFiltro)&&(`${m.nome} ${m.destino} ${m.tipo}`.toLowerCase().includes(query)));
    return `${innerHero('06','UMA HISTÓRIA DE CORAGEM','Os exploradores<br><em>do impossível.</em>','Das primeiras sondas aos telescópios mais sofisticados: conheça as missões que expandiram nossos horizontes.')}
      <section class="shell mission-layout"><div class="mission-hero"><div>${sectionEyebrow('','UMA VIAGEM SEM VOLTA')}<h2>Algumas viagens <em>mudam tudo</em></h2><p>Em 1977, duas sondas começaram uma jornada que ainda inspira gerações: Voyager 1 e Voyager 2.</p><button data-action="mission-detail" data-id="voyager-1" class="btn btn-ghost">Conhecer a Voyager ${ico('arrow',17)}</button></div><div class="voyager-graphic">${ico('telescope',100)}<span>BEYOND THE KNOWN</span></div></div><div class="toolbar"><label class="search-field">${ico('search',18)}<input data-search="missao" type="search" placeholder="Buscar missão..." value="${escapeHTML(state.buscaMissao)}" aria-label="Buscar missões"></label><label class="custom-select">${ico('filter',17)}<select data-select="mission-filter" aria-label="Filtrar tipos de missão">${categories.map(t=>`<option value="${t}" ${state.missaoFiltro===t?'selected':''}>${t==='Todas'?'Todas as missões':t}</option>`).join('')}</select></label></div><div class="catalog-status">${arr.length} MISSÕES EM DESTAQUE</div>${arr.length?`<div class="mission-grid">${arr.map(missionCard).join('')}</div>`:emptyState('Nenhuma missão encontrada','Experimente outra busca ou categoria.','missoes')}</section>`;
  }
  function timeline(){const cats=['Todos','Descoberta','Exploração','Missões'];let arr=linhaTempo.filter(item=>state.tempoFiltro==='Todos'||item.categoria===state.tempoFiltro);
    return `${innerHero('07','ATRAVÉS DOS SÉCULOS','O tempo também<br><em>é uma viagem.</em>','A história do conhecimento humano escrita em descobertas, coragem e uma pergunta constante: o que existe além?')}
      <section class="shell timeline-section"><div class="timeline-intro"><strong>${linhaTempo.length}</strong><span>MARCOS HISTÓRICOS<br>QUE AMPLIARAM O NOSSO CÉU</span><div class="segmented">${cats.map(t=>`<button class="segment ${state.tempoFiltro===t?'active':''}" data-action="time-filter" data-value="${t}" aria-pressed="${state.tempoFiltro===t}">${t}</button>`).join('')}</div></div><div class="timeline-line">${arr.map((e,i)=>`<article class="timeline-event"><div class="timeline-dot"></div><span class="timeline-year">${e.ano}</span><div class="timeline-event-copy">${chip(e.categoria)}<h3>${e.titulo}</h3><p>${e.texto}</p></div></article>`).join('')}</div></section>`;
  }
  function favorites(){const list=[...state.favoritos];const names={planeta:'Planeta',fato:'Curiosidade',missao:'Missão'};const items=list.map(id=>{const [type,key]=id.split(':');const x=type==='planeta'?planetas.find(p=>p.id===key):type==='fato'?curiosidades.find(f=>f.id===key):missoes.find(m=>m.id===key);return x?{type,x,id}:null}).filter(Boolean);
    return `${innerHero('08','SUA PRÓPRIA CONSTELAÇÃO','Salve o que<br><em>te faz olhar para cima.</em>','Reúna planetas, missões e curiosidades em uma coleção pessoal. Tudo é salvo neste navegador.',`<div class="page-counter"><strong>${items.length}</strong><span>ITENS SALVOS<br>NO NAVEGADOR</span></div>`)}<section class="shell favorites-listing">${items.length?`<div class="favorites-grid">${items.map(({type,x,id})=>`<article class="favorite-card"><div class="favorite-visual">${type==='missao'?ico('rocket',64):planetImg(byId(type==='planeta'?x.id:x.planeta))}</div><div><span class="card-kicker">${names[type]}</span><h3>${type==='planeta'?x.nome:x.titulo||x.nome}</h3><p>${x.resumo}</p><a href="#${type==='planeta'?'planeta/'+x.id:type==='fato'?'curiosidades':'missoes'}" class="text-link">Explorar ${ico('arrow',16)}</a></div>${like(type,x.id)}</article>`).join('')}</div><div class="favorites-note">${ico('info',18)} Seus favoritos são guardados apenas neste dispositivo. Se você limpar os dados do navegador, a coleção será apagada.</div>`:emptyState('Sua coleção está esperando por você.','Clique no coração de um planeta, curiosidade ou missão para começar a guardar suas descobertas.','planetas')}</section>`;
  }
  function emptyState(t,d,to){return `<div class="empty-state">${ico('orbit',46)}<h3>${t}</h3><p>${d}</p>${btn('Continuar explorando',to)}</div>`;}
  function modalHTML(){const {type,id}=state.modal||{};let title='',label='',body='',url='',image='';
    if(type==='fato'){
      const f=curiosidades.find(x=>x.id===id);if(!f)return '';const p=byId(f.planeta);title=f.titulo;label=`CURIOSIDADE ${f.numero} · ${f.categoria.toUpperCase()}`;body=`<p>${f.resumo}</p><p>${f.detalhe}</p><div class="modal-more"><span>RELACIONADO</span><a href="#planeta/${p.id}" data-action="close-modal">${p.nome} ${ico('arrow',16)}</a></div>`;url=f.fonte;image=p.imagem;
    }else{
      const m=missoes.find(x=>x.id===id);if(!m)return '';title=m.nome;label=`MISSÃO ESPACIAL · ${m.ano}`;body=`<p>${m.resumo}</p><p>${m.destaque}</p><div class="modal-more"><span>DESTINO</span><strong>${m.destino}</strong></div><div class="modal-more"><span>TIPO</span><strong>${m.tipo}</strong></div>`;url=m.fonte;
    }
    return `<div class="modal-overlay" data-action="dismiss" role="presentation"><section class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><div class="modal-top"><span>${label}</span><button class="round-arrow" data-action="close-modal" aria-label="Fechar janela">${ico('close',19)}</button></div><div class="modal-middle">${image?`<img src="${image}" alt="Ilustração de planeta">`:`<div class="modal-mission-icon">${ico('rocket',65)}</div>`}<div><h2 id="modal-title">${title}</h2>${body}</div></div><div class="modal-end"><a href="${url}" target="_blank" rel="noopener noreferrer">Ver fonte científica ${ico('external',16)}</a><button data-action="${type==='fato'?'favorite':'favorite'}" data-id="${type==='fato'?'fato':'missao'}:${id}" class="btn btn-ghost">${ico('heart',18)} ${state.favoritos.has(`${type==='fato'?'fato':'missao'}:${id}`)?'Remover favorito':'Salvar na coleção'}</button></div></section></div>`;
  }
  function render(){
    if(canvasController){canvasController.destroy();canvasController=null}
    const path=route();let content;
    if(path==='inicio')content=home();
    else if(path==='planetas')content=planetsPage();
    else if(path.startsWith('planeta/'))content=planetDetail(path.split('/')[1]);
    else if(path==='explorar')content=explore();
    else if(path==='comparar')content=compare();
    else if(path==='curiosidades')content=facts();
    else if(path==='missoes')content=missions();
    else if(path==='linha-do-tempo')content=timeline();
    else if(path==='favoritos')content=favorites();
    else if(path==='fontes')content=`${innerHero('','SOBRE O ORBIT','Dados com origem.<br><em>Curiosidade com respeito.</em>','Este projeto reúne informação científica de referência em uma experiência visual autoral.')}`;
    else content=emptyState('Perdidos no espaço?','Essa rota não foi encontrada.','inicio');
    app.innerHTML=renderLayout(content);
    const pageName=({planetas:'Planetas',explorar:'Exploração orbital',comparar:'Comparador',curiosidades:'Curiosidades',missoes:'Missões','linha-do-tempo':'Linha do tempo',favoritos:'Minha coleção',fontes:'Fontes científicas'})[path]||(path.startsWith('planeta/')?byId(path.split('/')[1]).nome:'ORBIT');
    document.title=path==='inicio'?'ORBIT — Explore o Sistema Solar':`${pageName} — ORBIT`;
    document.body.classList.toggle('modal-open',!!state.modal);
    if(path==='explorar'){
      const canvas=document.getElementById('orbit-canvas');
      if(canvas && window.ORBIT_ORBITS){canvasController=window.ORBIT_ORBITS.mount(canvas,{
        planets:planetas,selected:state.selecionado,getState:()=>state,onSelect:(id)=>{state.selecionado=id;render()}
      })}
    }
    if(path==='fontes')document.querySelector('.sources')?.scrollIntoView({block:'center'});
    if(state.modal)setTimeout(()=>document.querySelector('.modal-dialog')?.focus(),0);
  }
  function toast(message){const el=document.getElementById('toast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2800)}
  function toggleFavorite(id){if(state.favoritos.has(id))state.favoritos.delete(id);else state.favoritos.add(id);try{localStorage.setItem(storageKey,JSON.stringify([...state.favoritos]))}catch{}render();toast(state.favoritos.has(id)?'Salvo na sua coleção ✦':'Removido da coleção')}
  function navigate(){state.menu=false;state.modal=null;render();scrollTo({top:0,behavior:'instant'});}
  document.addEventListener('click',e=>{
    const button=e.target.closest('[data-action]');
    if(!button)return;
    const act=button.dataset.action;
    if(act==='dismiss' && e.target!==button)return;
    if(['fact-detail','mission-detail'].includes(act)){state.modal={type:act==='fact-detail'?'fato':'missao',id:button.dataset.id};render();return}
    if(act==='close-modal'||act==='dismiss'){state.modal=null;render();return}
    if(act==='favorite'){toggleFavorite(button.dataset.id);return}
    if(act==='menu'){state.menu=!state.menu;render();return}
    if(act==='select-planet'||act==='select-orbit'){state.selecionado=button.dataset.id;render();return}
    if(act==='planet-filter'){state.planetaFiltro=button.dataset.value;render();return}
    if(act==='fact-filter'){state.fatoFiltro=button.dataset.value;render();return}
    if(act==='time-filter'){state.tempoFiltro=button.dataset.value;render();return}
    if(act==='metric'){state.metricas=button.dataset.value;render();return}
    if(act==='fact-slide'){state.fatoAtual=(state.fatoAtual+Number(button.dataset.step)+curiosidades.length)%curiosidades.length;render();return}
    if(act==='orbit-play'){state.orbitaRodando=!state.orbitaRodando;render();return}
    if(act==='orbit-reset'){state.tempo=0;state.velocidade=2;state.zoom=1;state.orbitaRodando=true;render();toast('Simulação reiniciada');return}
    if(act==='swap-compare'){state.compara.reverse();render();return}
  });
  document.addEventListener('click',e=>{
    const linkEl=e.target.closest('a[href^="#"]');
    if(!linkEl)return;
    if(state.modal)state.modal=null;
    const target=linkEl.getAttribute('href').slice(1);
    if(route()===target){navigate();return}
    state.menu=false;
  });
  document.addEventListener('change',e=>{
    const el=e.target;
    if(el.dataset.select==='compare'){
      state.compara[Number(el.dataset.slot)]=el.value;render();
    }else if(el.dataset.select==='mission-filter'){
      state.missaoFiltro=el.value;render();
    }else if(el.id==='labels-control')state.rotulos=el.checked;
  });
  document.addEventListener('input',e=>{
    const el=e.target;
    if(el.id==='speed-control'){state.velocidade=Number(el.value);document.getElementById('speed-value').textContent=el.value+'×';return}
    if(el.id==='zoom-control'){state.zoom=Number(el.value)/100;document.getElementById('zoom-value').textContent=el.value+'%';return}
    const type=el.dataset.search;if(!type)return;
    const start=el.selectionStart,end=el.selectionEnd;
    if(type==='planeta')state.buscaPlaneta=el.value;
    if(type==='fato')state.buscaFato=el.value;
    if(type==='missao')state.buscaMissao=el.value;
    render();
    const next=document.querySelector(`[data-search="${type}"]`);
    if(next){next.focus();try{next.setSelectionRange(start,end)}catch{}}
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && (state.modal||state.menu)){state.modal=null;state.menu=false;render()}
    if(e.key==='Tab' && state.modal){const modal=document.querySelector('.modal-dialog');const focusable=Array.from(modal?.querySelectorAll('button,a,[tabindex]:not([tabindex="-1"])')||[]);if(!focusable.length)return;let first=focusable[0],last=focusable.at(-1);if(e.shiftKey && document.activeElement===first){last.focus();e.preventDefault()}else if(!e.shiftKey&&document.activeElement===last){first.focus();e.preventDefault()}}
  });
  window.addEventListener('hashchange',navigate);
  window.addEventListener('storage',e=>{if(e.key===storageKey){state.favoritos=new Set(saved());render()}});
  // Clear #fontes route scroll after nav: sources live near the bottom of every view.
  if(!location.hash)location.hash='#inicio';else render();
})();
