(function () {
  const destination = 'noctis/';
  let scheduled = false;

  function makeLink(label, className) {
    const link = document.createElement('a');
    link.href = destination;
    link.textContent = label;
    link.className = className;
    link.dataset.noctisLink = '';
    link.setAttribute('aria-label', 'NOCTIS — Observatório sideral');
    return link;
  }

  function addMenuLink(selector, className, label) {
    const menu = document.querySelector(selector);
    if (!menu) return;

    let link = menu.querySelector('[data-noctis-link]');
    const alunar = menu.querySelector('[data-alunar-link]');
    const missions = Array.from(menu.querySelectorAll('a')).find(function (item) {
      return /missões|missions|linha do tempo/i.test(item.textContent);
    });
    const next = alunar || missions;

    if (!link) {
      link = makeLink(label, className);
      menu.insertBefore(link, next || null);
    } else if (next && link.nextElementSibling !== next) {
      menu.insertBefore(link, next);
    }
  }

  function addFeature() {
    const alunar = document.querySelector('.alunar-orbit-teaser');
    const home = document.querySelector('.home-facts') || document.querySelector('.explore-section');
    if (!alunar && !home) return;

    let section = document.querySelector('.noctis-orbit-teaser');
    if (!section) {
      section = document.createElement('section');
      section.className = 'noctis-orbit-teaser shell';
      section.setAttribute('aria-labelledby', 'noctis-orbit-title');
      section.innerHTML = `
        <div class="noctis-teaser-content">
          <p class="noctis-teaser-kicker">UM OBSERVATÓRIO SIDERAL DO ORBIT</p>
          <h2 id="noctis-orbit-title">NOCTIS<span aria-hidden="true">✳</span></h2>
          <p>O universo não termina onde seus olhos alcançam.</p>
          <a class="noctis-teaser-cta" href="noctis/">
            Entrar no observatório <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div class="noctis-teaser-sky" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>`;
    }

    if (alunar) {
      if (section.previousElementSibling !== alunar) alunar.after(section);
    } else if (home && section.nextElementSibling !== home) {
      home.before(section);
    }
  }

  function update() {
    scheduled = false;
    addMenuLink('.desktop-nav', 'nav-link noctis-orbit-nav', 'NOCTIS');
    addMenuLink('.mobile-nav', 'noctis-orbit-mobile', 'NOCTIS');
    addFeature();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }

  function start() {
    const app = document.getElementById('app');
    const observer = new MutationObserver(schedule);
    observer.observe(app || document.body, { childList: true, subtree: true });
    schedule();
    window.addEventListener('hashchange', schedule);
    window.addEventListener('popstate', schedule);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
