/* viewmore.js — VIEW MORE の文字を1字ずつに分け、光が流れる動きを付ける（カードごとに開始をずらす） */
(() => {
  document.querySelectorAll('.bb-card .bb-more').forEach((el, i) => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.style.setProperty('--vm', i);
    const t = document.createElement('span');
    t.className = 'vm-t';
    t.append(...Array.from(text).map((ch, k) => {
      const s = document.createElement('span');
      s.setAttribute('aria-hidden', 'true');
      s.className = ch === ' ' ? 'vm-ch vm-sp' : 'vm-ch';
      s.style.setProperty('--c', k);
      s.textContent = ch === ' ' ? ' ' : ch;
      return s;
    }));
    el.replaceChildren(t);
  });
})();
