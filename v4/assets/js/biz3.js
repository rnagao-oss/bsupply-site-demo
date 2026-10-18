/* biz3.js — 事業5ページの動き：出現・ロゴ帯の等速・ディザ格子・マグネティックボタン */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* 出現：.b3-reveal / .b3-stagger / .b3-flow / .b3-cmp-wrap / .b3-photos に in を付ける */
  const targets = document.querySelectorAll('.b3 .b3-reveal, .b3 .b3-stagger, .b3 .b3-flow, .b3 .b3-cmp-wrap, .b3 .b3-photos, .b3 .b3-photo, .b3 .b3-feature, .b3 .b3-mission, .b3 .b3-mix');
  document.querySelectorAll('.b3 .b3-stagger').forEach((list) => {
    Array.from(list.children).forEach((child, i) => child.style.setProperty('--i', i));
  });
  const show = (el) => el.classList.add('in');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (!e.isIntersecting) return; show(e.target); io.unobserve(e.target); });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach((el) => io.observe(el));
    const mission = document.querySelector('.b3-mission');
    if (mission) requestAnimationFrame(() => requestAnimationFrame(() => show(mission)));
    const lp = document.querySelector('.b3-lp');
    if (lp) requestAnimationFrame(() => requestAnimationFrame(() => show(lp)));
  } else {
    targets.forEach(show);
  }

  /* BPOの価格だけを0から数える（本文の文字列はHTMLに保持する） */
  document.querySelectorAll('.b3 [data-count]').forEach((counter) => {
    if (reduce) return;
    const match = counter.textContent.match(/^(.*?)(\d+)(.*)$/);
    if (!match) return;
    const [, before, raw, after] = match;
    const end = Number(raw);
    const start = () => {
      const began = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - began) / 1200);
        const eased = 1 - Math.pow(1 - progress, 3);
        counter.textContent = `${before}${Math.round(end * eased)}${after}`;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      const countObserver = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        countObserver.disconnect();
        start();
      }, { threshold: .6 });
      countObserver.observe(counter);
    } else start();
  });

  /* FAQ：detailsの標準操作を保ちつつ、高さだけを補間する */
  if (!reduce) document.querySelectorAll('.b3 .b3-faq details').forEach((details) => {
    const summary = details.querySelector('summary');
    if (!summary) return;
    let animation;
    summary.addEventListener('click', (event) => {
      event.preventDefault();
      if (animation) animation.cancel();
      const startHeight = `${details.offsetHeight}px`;
      if (!details.open) details.open = true;
      const endHeight = details.open && startHeight !== `${summary.offsetHeight}px`
        ? `${summary.offsetHeight}px`
        : `${summary.offsetHeight + (details.querySelector('p')?.offsetHeight || 0)}px`;
      const closing = endHeight === `${summary.offsetHeight}px`;
      animation = details.animate({ height: [startHeight, endHeight] }, { duration: 360, easing: 'cubic-bezier(.19,1,.22,1)' });
      animation.onfinish = () => {
        details.open = !closing;
        details.style.height = '';
        animation = null;
      };
    });
  });

  /* ロゴ帯：2段とも同じ向き・同じ速度（px/s）で流す */
  const PXPS = () => Math.max(24, innerWidth / 34);
  document.querySelectorAll('.b3 .b3-mq-track').forEach((track) => {
    if (!track.dataset.looped) { track.innerHTML += track.innerHTML; track.dataset.looped = '1'; }
    const sync = () => {
      const half = track.scrollWidth / 2;
      if (half > 0) track.style.setProperty('--b3-mq-dur', `${Math.max(1, half / PXPS()).toFixed(1)}s`);
    };
    sync();
    if ('ResizeObserver' in window) new ResizeObserver(sync).observe(track);
    addEventListener('load', sync, { once: true });
  });

  /* ディザ格子（黒い面）：ゆっくり明滅し、ポインターの近くで薄く波紋が出る */
  document.querySelectorAll('.b3 canvas.b3-dither').forEach((canvas) => initDither(canvas, reduce));

  /* マグネティックボタン */
  if (matchMedia('(hover: hover)').matches && !reduce) {
    document.querySelectorAll('.b3 .b3-btn:not(.b3-btn--text)').forEach((button) => {
      button.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * .12;
        const y = (event.clientY - rect.top - rect.height / 2) * .12;
        button.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
      button.addEventListener('pointerleave', () => { button.style.transform = ''; });
    });
  }

  function initDither(canvas, isReduced) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    let width = 0, height = 0, pointerX = -1000, pointerY = -1000, frame = 0;
    const cell = 11;
    const strength = parseFloat(canvas.dataset.strength) || 1;
    const draw = (time) => {
      ctx.clearRect(0, 0, width, height);
      const drift = Math.sin(time * .00035) * .12;
      for (let y = cell / 2; y < height; y += cell) {
        for (let x = cell / 2; x < width; x += cell) {
          const ripple = Math.max(0, 1 - Math.hypot(x - pointerX, y - pointerY) / 230);
          const field = (Math.sin(x * .018 + time * .00025) + Math.cos(y * .022 - time * .00022)) * .09;
          const alpha = Math.max(.02, Math.min(.16, .05 + field * .7 + drift * .6 + ripple * .14)) * strength;
          const size = .8 + alpha * 5;
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }
      }
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(devicePixelRatio || 1, 2);
      width = rect.width; height = rect.height;
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw(0);
    };
    const animate = (time) => { if (frame % 3 === 0) draw(time); frame += 1; requestAnimationFrame(animate); };
    canvas.addEventListener('pointermove', (event) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = event.clientX - rect.left; pointerY = event.clientY - rect.top;
    });
    canvas.addEventListener('pointerleave', () => { pointerX = pointerY = -1000; });
    addEventListener('resize', resize, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    resize();
    if (!isReduced) requestAnimationFrame(animate);
  }
})();
