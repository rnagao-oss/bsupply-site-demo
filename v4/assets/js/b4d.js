/* b4d.js — B4D の円：見えたときに文字が1字ずつせり上がり、4つの力を順に光らせながら円の下段の語が入れ替わる */
(() => {
  const grid = document.querySelector('.b3-b4d-grid');
  if (!grid) return;
  const fig = grid.closest('.b3-b4d');
  const core = fig.querySelector('.b3-b4d-core');
  const en = core.querySelector('.b3-b4d-core-en');
  const sub = core.querySelector('.b3-b4d-core-ja');
  const tiles = [...grid.querySelectorAll('.b3-tile')];
  const words = tiles.map(t => t.querySelector('.b3-b4d-name').textContent.trim().split(' ')[0]);
  const base = sub.textContent.trim();
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  en.setAttribute('aria-label', en.textContent);
  en.replaceChildren(...Array.from(en.textContent).map((ch, k) => {
    const s = document.createElement('span');
    s.className = 'b4d-ch';
    s.setAttribute('aria-hidden', 'true');
    s.style.setProperty('--k', k);
    s.textContent = ch;
    return s;
  }));
  sub.replaceChildren(Object.assign(document.createElement('span'), { className: 'b4d-word', textContent: base }));
  const word = sub.firstChild;

  const show = (text) => {
    word.textContent = text;
    word.classList.remove('b4d-swap');
    void word.offsetWidth;
    word.classList.add('b4d-swap');
  };

  let i = -1, timer = null;
  const step = () => {
    tiles.forEach(t => t.classList.remove('is-on'));
    i = (i + 1) % (tiles.length + 1);
    if (i < tiles.length) { tiles[i].classList.add('is-on'); show(words[i]); }
    else show(base);
  };
  const start = () => { if (!timer) { step(); timer = setInterval(step, 2400); } };
  const stop = () => { clearInterval(timer); timer = null; };

  fig.classList.add('b4d-ready');
  if (still) { fig.classList.add('is-in'); return; }
  new IntersectionObserver((es) => es.forEach(e => {
    if (e.isIntersecting) { fig.classList.add('is-in'); setTimeout(start, 900); } else stop();
  }), { threshold: .9 }).observe(core);
  if (matchMedia('(hover: hover)').matches) {
    grid.addEventListener('mouseenter', stop);
    grid.addEventListener('mouseleave', () => { if (fig.classList.contains('is-in')) start(); });
  }
})();
