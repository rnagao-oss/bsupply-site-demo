// ヘッダーの白背景切替・全画面メニュー・事例の絞り込み・リンクコピー・動画の一時停止。アニメーションは入れない（フェーズ3）。
(function () {
  var header = document.querySelector('[data-header]');
  if (header && header.classList.contains('is-dark')) {
    var hero = document.querySelector('.hero');
    var update = function () {
      var limit = hero ? hero.offsetHeight - header.offsetHeight : 8;
      header.classList.toggle('is-scrolled', window.scrollY > limit);
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('menu');
  if (btn && menu) {
    var set = function (open) {
      menu.hidden = !open;
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? btn.dataset.closeLabel : btn.dataset.openLabel);
      if (open) { var first = menu.querySelector('a'); if (first) first.focus(); }
    };
    btn.addEventListener('click', function () { set(menu.hidden); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1024 && !menu.hidden) set(false); });
  }

  var tabs = document.querySelector('[data-tabs]');
  if (tabs) {
    var cards = document.querySelectorAll('.work-card');
    var state = { group: tabs.querySelector('[data-group]').dataset.group, value: '' };
    var apply = function () {
      cards.forEach(function (c) { c.hidden = !!state.value && c.dataset[state.group] !== state.value; });
    };
    tabs.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.group !== undefined) {
        state.group = b.dataset.group; state.value = '';
        tabs.querySelectorAll('[data-group]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        tabs.querySelectorAll('[data-group-items]').forEach(function (l) {
          l.hidden = l.dataset.groupItems !== state.group;
          l.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.filter === '' ? 'true' : 'false'); });
        });
      } else if (b.dataset.filter !== undefined) {
        state.value = b.dataset.filter;
        b.closest('ul').querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      }
      apply();
    });
  }

  document.querySelectorAll('.file-input').forEach(function (input) {
    var name = input.parentNode.querySelector('[data-file-name]');
    if (!name) return;
    var empty = name.textContent;
    input.addEventListener('change', function () {
      name.textContent = input.files && input.files.length ? input.files[0].name : empty;
    });
  });

  var copy = document.querySelector('[data-copy]');
  if (copy && navigator.clipboard) {
    copy.addEventListener('click', function () {
      navigator.clipboard.writeText(copy.dataset.copy).then(function () { copy.textContent = 'コピーしました'; });
    });
  }
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-video]').forEach(function (fig) {
    var v = fig.querySelector('video');
    var b = fig.querySelector('[data-video-toggle]');
    if (still) return; /* 動きを減らす設定では src を入れない（mp4 を取得しない） */
    v.src = v.dataset.src;
    v.play().catch(function () {});
    b.hidden = false;
    b.addEventListener('click', function () {
      if (v.paused) { v.play(); b.textContent = b.dataset.pause; } else { v.pause(); b.textContent = b.dataset.play; }
    });
  });
})();
