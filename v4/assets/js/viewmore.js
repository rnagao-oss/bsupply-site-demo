/* viewmore.js — タッチ端末（ホバーなし）では、カードが画面中央に来たとき VIEW MORE を1回だけ再生する */
(() => {
  if (!matchMedia('(hover: none)').matches || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const more = e.target.querySelector('.bb-more');
      if (!more) return;
      more.classList.add('vm-on');
      setTimeout(() => more.classList.remove('vm-on'), 2200);
    });
  }, { rootMargin: '-42% 0px -42% 0px' });
  document.querySelectorAll('.bb-card').forEach((c) => io.observe(c));
})();
