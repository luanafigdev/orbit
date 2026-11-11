(() => {
  const url='aeon/';
  let requested=false;
  const stylesheet=document.createElement('link');
  stylesheet.rel='stylesheet';
  stylesheet.href='aeon/orbit-link.css';
  document.head.append(stylesheet);

  function addLink(container,cssClass){
    if(!container||container.querySelector('[data-aeon-link]'))return;
    const a=document.createElement('a');
    a.href=url;a.dataset.aeonLink='';a.className=cssClass;
    a.setAttribute('aria-label','ÆON — uma jornada pelo tempo do Universo');
    const icon=document.createElement('span');icon.textContent='✦';icon.setAttribute('aria-hidden','true');
    const label=document.createElement('span');label.textContent='ÆON';
    a.append(icon,label);
    const links=[...container.querySelectorAll('a')];
    const contact=links.find(link=>/contato|contact/i.test(link.textContent));
    container.insertBefore(a,contact||null);
  }

  function addHeroAccess(){
    const actions=document.querySelector('.hero-actions');
    if(!actions||actions.querySelector('.aeon-hero-link'))return;
    const a=document.createElement('a');a.href=url;a.className='aeon-hero-link';
    a.textContent='✦  ÆON · Atravesse o tempo';
    actions.append(a);
  }

  function addPortal(){
    if(document.querySelector('.aeon-orbit-portal'))return;
    const lunar=document.querySelector('.alunar-orbit-teaser');
    const area=document.querySelector('.home-facts');
    const features=document.querySelector('.explore-section');
    if(!lunar&&!area&&!features)return;
    const section=document.createElement('section');
    section.className='aeon-orbit-portal shell';
    section.setAttribute('aria-labelledby','aeon-orbit-heading');
    section.innerHTML=`
      <div class="aeon-orbit-content">
        <p class="aeon-orbit-eyebrow">ORBIT APRESENTA <span aria-hidden="true">✦</span> UMA JORNADA CÓSMICA</p>
        <h2 id="aeon-orbit-heading">ÆON</h2>
        <p class="aeon-orbit-subtitle">O tempo transforma o Universo.</p>
        <p class="aeon-orbit-description">Atravesse bilhões de anos de mudanças. Entre na escuridão primordial, acompanhe o nascimento da luz e descubra um cosmos que nunca para de acontecer.</p>
        <a class="aeon-orbit-button" href="${url}">Iniciar a jornada <span aria-hidden="true">↗</span></a>
      </div>
      <div class="aeon-orbit-art" aria-hidden="true">
        <div class="aeon-orbit-halo"></div>
        <div class="aeon-orbit-spiral aeon-orbit-spiral-one"></div>
        <div class="aeon-orbit-spiral aeon-orbit-spiral-two"></div>
        <div class="aeon-orbit-core"></div>
        <span class="aeon-orbit-star">✦</span>
        <span class="aeon-orbit-index">13.8 <small>BILHÕES DE ANOS</small></span>
      </div>`;
    if(lunar)lunar.after(section);
    else if(area)area.before(section);
    else features.after(section);
  }

  function update(){
    requested=false;
    addLink(document.querySelector('.desktop-nav'),'nav-link aeon-main-link');
    addLink(document.querySelector('.mobile-nav'),'aeon-mobile-link');
    addHeroAccess();
    addPortal();
  }
  function queue(){
    if(requested)return;
    requested=true;
    requestAnimationFrame(update);
  }
  function install(){
    new MutationObserver(queue).observe(document.querySelector('#app')||document.body,{childList:true,subtree:true});
    queue();
    window.addEventListener('hashchange',queue);
    window.addEventListener('popstate',queue);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
