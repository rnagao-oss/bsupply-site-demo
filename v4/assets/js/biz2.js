(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js', 'biz2-ready');
  if (reduce) document.documentElement.classList.add('no-motion');

  const revealNodes = document.querySelectorAll('.bz .bd-sec, .bz .works, .bz .bd-photos, .bz .eq-card, .bz .rs-card');
  const iconNodes = document.querySelectorAll('.bz .bpo-icon');
  revealNodes.forEach((node) => node.classList.add('bz-reveal'));

  if ('IntersectionObserver' in window && !reduce) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealNodes.forEach((node) => observer.observe(node));
    iconNodes.forEach((node) => observer.observe(node));
  } else {
    revealNodes.forEach((node) => node.classList.add('is-in'));
    iconNodes.forEach((node) => node.classList.add('is-in'));
  }

  const units = document.querySelector('.bz-units');
  if (units) requestAnimationFrame(() => units.classList.add('is-in'));



  const dither = document.querySelector('.bz-dither');
  if (dither) initDither(dither, reduce);

  const magnetic = document.querySelectorAll('.bz .bd-cta-btn, .bz .fin-mail, .bz .bpo-btn-primary, .bz .bpo-task-cta .bpo-btn');
  if (matchMedia('(hover: hover)').matches && !reduce) {
    magnetic.forEach((button) => {
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
    let width = 0;
    let height = 0;
    let pointerX = -1000;
    let pointerY = -1000;
    let frame = 0;
    const cell = 13;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw(0);
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, width, height);
      const drift = Math.sin(time * .00035) * .12;
      for (let y = cell / 2; y < height; y += cell) {
        for (let x = cell / 2; x < width; x += cell) {
          const dx = x - pointerX;
          const dy = y - pointerY;
          const ripple = Math.max(0, 1 - Math.hypot(dx, dy) / 230);
          const field = (Math.sin(x * .018 + time * .00025) + Math.cos(y * .022 - time * .00022)) * .09;
          const alpha = Math.max(.025, Math.min(.23, .07 + field + drift + ripple * .17));
          const size = 1 + alpha * 10;
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }
      }
    };

    const animate = (time) => {
      if (frame % 3 === 0) draw(time);
      frame += 1;
      requestAnimationFrame(animate);
    };

    canvas.addEventListener('pointermove', (event) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
    });
    canvas.addEventListener('pointerleave', () => { pointerX = pointerY = -1000; });
    addEventListener('resize', resize, { passive: true });
    resize();
    if (!isReduced) requestAnimationFrame(animate);
  }
})();
