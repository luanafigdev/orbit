(() => {
  const DESTINATION = '/alunar/';
  const moonIcon = '<span aria-hidden="true">☾</span>';
  let scheduled = false;

  function makeLink(className, label) {
    const a = document.createElement('a');
    a.className = className;
    a.href = DESTINATION;
    a.dataset.alunarLink = '';
    a.setAttribute('aria-label', 'ALUNAR — uma experiência lunar do ORBIT');
    a.innerHTML = `${moonIcon}<span>${label}</span>`;
    return a;
  }

  function installNavigation() {
    const desktop = document.querySelector('.desktop-nav');
    if (desktop && !desktop.querySelector('[data-alunar-link]')) {
      const link = makeLink('nav-link alunar-nav-link', 'ALUNAR');
      const before = [...desktop.querySelectorAll('a')].find(a => /missões|missions|linha do tempo/i.test(a.textContent));
      desktop.insertBefore(link, before || null);
    }
    const mobile = document.querySelector('.mobile-nav');
    if (mobile && !mobile.querySelector('[data-alunar-link]')) {
      const link = makeLink('alunar-mobile-link', 'ALUNAR');
      const before = [...mobile.querySelectorAll('a')].find(a => /missões|missions|linha do tempo/i.test(a.textContent));
      mobile.insertBefore(link, before || null);
    }
  }

  function installHeroLink() {
    const buttons = document.querySelector('.hero-actions');
    if (!buttons || buttons.querySelector('.alunar-hero-link')) return;
    const link = makeLink('alunar-hero-link', 'ALUNAR — A Lua mais perto de você');
    buttons.append(link);
  }

  function installFeature() {
    if (document.querySelector('.alunar-orbit-teaser')) return;
    const target = document.querySelector('.home-facts');
    const previous = document.querySelector('.explore-section');
    if (!target && !previous) return;

    const section = document.createElement('section');
    section.className = 'alunar-orbit-teaser shell';
    section.setAttribute('aria-labelledby', 'alunar-orbit-title');
    section.innerHTML = `
      <div class="alunar-teaser-copy">
        <p class="alunar-teaser-eyebrow">UMA EXPERIÊNCIA LUNAR DO ORBIT <span aria-hidden="true">✦</span> EDIÇÃO ESPECIAL</p>
        <h2 id="alunar-orbit-title">A<span>LUNAR.</span></h2>
        <p class="alunar-teaser-lead">A Lua mais perto de você.</p>
        <p class="alunar-teaser-description">Uma viagem entre crateras, fases, descobertas e lembranças. Explore a superfície lunar, acompanhe o ciclo de hoje e registre seu próprio céu.</p>
        <div class="alunar-teaser-actions">
          <a class="btn btn-primary" href="${DESTINATION}">Explorar ALUNAR <span aria-hidden="true">↗</span></a>
          <span>UM NOVO CAPÍTULO DO ORBIT</span>
        </div>
      </div>
      <div class="alunar-teaser-visual" aria-hidden="true">
        <div class="alunar-teaser-halo"></div>
        <img src="/alunar/assets/hero-moon.webp" alt="" loading="lazy" width="510" height="510">
        <span class="alunar-teaser-orbit"></span>
        <span class="alunar-teaser-symbol">✦</span>
      </div>`;
    if (target) target.before(section);
    else previous.after(section);
  }

  function apply() {
    scheduled = false;
    installNavigation();
    installHeroLink();
    installFeature();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(apply);
  }

  function start() {
    const root = document.getElementById('app') || document.body;
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true });
    schedule();
    window.addEventListener('hashchange', schedule);
    window.addEventListener('popstate', schedule);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
