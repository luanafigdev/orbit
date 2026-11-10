(() => {
  const root = document.documentElement;
  const scene = document.getElementById('opening-scene');
  const skip = document.getElementById('skip-opening');
  const replay = document.getElementById('replay-opening');
  const stars = document.getElementById('opening-stars');
  const page = [document.querySelector('.skip'), document.querySelector('.topbar'), document.querySelector('main'), document.querySelector('footer')];
  let finishTimer;
  let hideTimer;
  let returnFocus = null;

  for (let i = 0; i < 68; i++) {
    const star = document.createElement('span');
    const x = (Math.sin(i * 127.1) * 43758.5453) % 1;
    const y = (Math.sin(i * 311.7) * 23591.9374) % 1;
    const randX = x < 0 ? x + 1 : x;
    const randY = y < 0 ? y + 1 : y;
    star.className = 'opening-star';
    star.style.setProperty('--x', `${(randX * 98 + 1).toFixed(2)}%`);
    star.style.setProperty('--y', `${(randY * 98 + 1).toFixed(2)}%`);
    star.style.setProperty('--size', `${i % 8 === 0 ? 3 : i % 3 === 0 ? 2 : 1}px`);
    star.style.setProperty('--delay', `${(i % 13) * 0.09}s`);
    star.style.setProperty('--opacity', `${0.3 + (i % 5) * 0.13}`);
    stars.appendChild(star);
  }

  function markSeen() {
    try { sessionStorage.setItem('noctis-opening-seen', '1'); } catch (error) { }
  }

  function finish() {
    if (!root.classList.contains('noctis-opening')) return;
    clearTimeout(finishTimer);
    clearTimeout(hideTimer);
    root.classList.add('noctis-closing');
    root.classList.remove('noctis-opening');
    markSeen();
    hideTimer = setTimeout(() => {
      scene.setAttribute('aria-hidden', 'true');
      scene.style.display = 'none';
      root.classList.remove('noctis-closing');
      page.forEach(element => { if (element) element.inert = false; });
      if (returnFocus) returnFocus.focus({ preventScroll: true });
      returnFocus = null;
    }, 780);
  }

  function start(fromReplay = false) {
    clearTimeout(finishTimer);
    clearTimeout(hideTimer);
    returnFocus = fromReplay ? replay : null;
    scene.style.display = '';
    scene.setAttribute('aria-hidden', 'false');
    root.classList.remove('noctis-opening', 'noctis-closing');
    void scene.offsetWidth;
    root.classList.add('noctis-opening');
    page.forEach(element => { if (element) element.inert = true; });
    skip.focus({ preventScroll: true });
    finishTimer = setTimeout(finish, 5000);
  }

  skip.addEventListener('click', finish);
  replay.addEventListener('click', () => start(true));
  document.addEventListener('keydown', event => {
    if (root.classList.contains('noctis-opening') && event.key === 'Escape') finish();
  });

  if (root.classList.contains('noctis-opening')) start();
  else scene.setAttribute('aria-hidden', 'true');
})();
