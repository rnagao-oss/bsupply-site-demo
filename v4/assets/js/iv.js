(() => {
  const els = document.querySelectorAll('.iv-anim');
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.2 });
  els.forEach((e) => io.observe(e));
})();
