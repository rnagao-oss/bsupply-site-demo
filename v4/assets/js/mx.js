/* mx.js — 承継する会社の強み × B supplyの強み：全組み合わせの曲線を引き、選んだ項目の線だけを強調する */
(() => {
  const root = document.querySelector('[data-mx]');
  if (!root) return;
  const svg = root.querySelector('.b3-mx-lines');
  const colA = Array.from(root.querySelectorAll('.b3-mx-col--a .b3-mx-item'));
  const colB = Array.from(root.querySelectorAll('.b3-mx-col--b .b3-mx-item'));
  const all = colA.concat(colB);
  const ns = 'http://www.w3.org/2000/svg';
  const desktop = matchMedia('(min-width: 961px)');
  let paths = [];
  let current = null;

  const center = (item, box) => {
    const r = item.querySelector('.b3-mx-dot').getBoundingClientRect();
    return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
  };

  const build = () => {
    svg.replaceChildren();
    paths = [];
    if (!desktop.matches) return;
    const box = root.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    colA.forEach((a, i) => {
      const [x1, y1] = center(a, box);
      colB.forEach((b, j) => {
        const [x2, y2] = center(b, box);
        const mx = (x1 + x2) / 2;
        const p = document.createElementNS(ns, 'path');
        p.setAttribute('d', `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`);
        p.setAttribute('pathLength', '1');
        p.setAttribute('class', 'b3-mx-ln');
        p.style.setProperty('--d', i * 5 + j);
        svg.appendChild(p);
        paths.push({ el: p, a: i, b: j });
      });
    });
    if (current) activate(current[0], current[1]);
  };

  const clear = () => {
    current = null;
    all.forEach((el) => el.classList.remove('is-on', 'is-dim'));
    paths.forEach((p) => p.el.classList.remove('is-on', 'is-dim'));
  };

  const activate = (side, idx) => {
    if (!desktop.matches) return;
    clear();
    current = [side, idx];
    const own = side === 'a' ? colA : colB;
    own.forEach((el, k) => el.classList.add(k === idx ? 'is-on' : 'is-dim'));
    const hit = paths.filter((p) => p[side] === idx);
    paths.forEach((p) => p.el.classList.add(p[side] === idx ? 'is-on' : 'is-dim'));
    hit.forEach((p) => svg.appendChild(p.el));
  };

  const bind = (items, side) => items.forEach((el, idx) => {
    el.addEventListener('pointerenter', () => activate(side, idx));
    el.addEventListener('pointerleave', clear);
    el.addEventListener('focus', () => activate(side, idx));
    el.addEventListener('blur', clear);
  });
  bind(colA, 'a');
  bind(colB, 'b');

  build();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  if ('ResizeObserver' in window) new ResizeObserver(build).observe(root);
  desktop.addEventListener('change', build);

  const show = () => root.classList.add('in');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { show(); io.disconnect(); } }), { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    io.observe(root);
  } else show();
})();
