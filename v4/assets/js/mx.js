/* mx.js — 承継する会社の強み × B supplyの強み：全組み合わせを点線で結び、光の粒が左右から中央の×へ流れる */
(() => {
  const root = document.querySelector('[data-mx]');
  if (!root) return;
  const svg = root.querySelector('.b3-mx-lines');
  const colA = Array.from(root.querySelectorAll('.b3-mx-col--a .b3-mx-item'));
  const colB = Array.from(root.querySelectorAll('.b3-mx-col--b .b3-mx-item'));
  const ns = 'http://www.w3.org/2000/svg';
  const desktop = { matches: true, addEventListener() {} };
  const narrow = matchMedia('(max-width: 960px)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lines = [];
  let travelers = [];
  let visible = false;

  const center = (item, box) => {
    const r = item.querySelector('.b3-mx-dot').getBoundingClientRect();
    return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
  };

  const build = () => {
    svg.replaceChildren();
    lines = [];
    travelers = [];
    if (!desktop.matches) return;
    const box = root.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const defs = document.createElementNS(ns, 'defs');
    svg.appendChild(defs);
    // スマートフォン幅: 全組み合わせではなく、左右それぞれの項目を中央の×と結ぶ（粒はどちらも×へ向かう）
    const pairs = [];
    if (narrow.matches) {
      const xr = root.querySelector('.b3-mx-x').getBoundingClientRect();
      const hub = [xr.left + xr.width / 2 - box.left, xr.top + xr.height / 2 - box.top];
      colA.forEach((a, i) => pairs.push({ from: center(a, box), to: hub, delay: i * 0.1 }));
      colB.forEach((b, j) => pairs.push({ from: center(b, box), to: hub, delay: 0.6 + j * 0.1 }));
    } else {
      colA.forEach((a, i) => colB.forEach((b, j) => pairs.push({ from: center(a, box), to: center(b, box), delay: i * 0.28 + j * 0.06 })));
    }
    pairs.forEach((pr, k) => {
      const [x1, y1] = pr.from;
      {
        const [x2, y2] = pr.to;
        const mx = (x1 + x2) / 2;
        const d = `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
        const id = `mxm${k}`;
        const delay = pr.delay.toFixed(2);

        const mask = document.createElementNS(ns, 'mask');
        mask.setAttribute('id', id);
        mask.setAttribute('maskUnits', 'userSpaceOnUse');
        mask.setAttribute('x', 0); mask.setAttribute('y', 0);
        mask.setAttribute('width', box.width); mask.setAttribute('height', box.height);
        const mk = document.createElementNS(ns, 'path');
        mk.setAttribute('d', d);
        mk.setAttribute('pathLength', '1');
        mk.setAttribute('class', 'b3-mx-mk');
        mk.style.setProperty('--d', delay);
        mask.appendChild(mk);
        defs.appendChild(mask);

        const p = document.createElementNS(ns, 'path');
        p.setAttribute('d', d);
        p.setAttribute('class', 'b3-mx-ln');
        p.setAttribute('mask', `url(#${id})`);
        svg.appendChild(p);
        // PC幅は1本に左右1粒ずつ（両端から中央へ、同時に到着）。スマホ幅は線が×で終わるので端から×へ1粒
        const segs = narrow.matches ? [[0, 1]] : [[0, .5], [1, .5]];
        const dur = narrow.matches ? 1500 + (k % 5) * 250 : 1900 + (k % 5) * 300;
        lines.push({ el: p, len: p.getTotalLength(), start: 0, dur, off: (k * 0.37) % 1, segs, tr: [] });
      }
    });
    if (!reduce) {
      lines.forEach((l) => l.segs.forEach(() => {
        const c = document.createElementNS(ns, 'circle');
        c.setAttribute('r', 3);
        c.setAttribute('class', 'b3-mx-tr');
        c.style.opacity = 0;
        svg.appendChild(c);
        l.tr.push(c);
        travelers.push(c);
      }));
    }
  };

  const tick = (now) => {
    requestAnimationFrame(tick);
    if (!visible || !travelers.length) return;
    const el = now;
    lines.forEach((l) => {
      if (el < l.start) return;
      const t = (((el - l.start) / l.dur) + l.off) % 1;
      l.segs.forEach(([a, b], s) => {
        const pt = l.el.getPointAtLength((a + (b - a) * t) * l.len);
        const c = l.tr[s];
        c.setAttribute('cx', pt.x);
        c.setAttribute('cy', pt.y);
        c.style.opacity = Math.sin(t * Math.PI) * 0.95;
      });
    });
  };

  build();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  if ('ResizeObserver' in window) new ResizeObserver(build).observe(root);
  desktop.addEventListener('change', build);
  narrow.addEventListener('change', build);

  const show = () => root.classList.add('in');
  if ('IntersectionObserver' in window && !reduce) {
    new IntersectionObserver((es) => es.forEach((e) => {
      visible = e.isIntersecting;
      if (visible) show();
    }), { rootMargin: '0px 0px -12% 0px', threshold: 0.15 }).observe(root);
    requestAnimationFrame(tick);
  } else show();
})();
