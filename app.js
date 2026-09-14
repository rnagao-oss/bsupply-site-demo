/* B supply — measured responsive layout. */
(() => {
  const menuButton = document.getElementById('menuBtn');
  const navigation = document.getElementById('siteNavigation');
  function setMenu(open) {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    navigation.classList.toggle('is-open', open);
    document.body.classList.toggle('bs-menu-open', open);
  }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (menuButton.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') { setMenu(false); menuButton.focus(); }
    if (event.key === 'Tab') {
      const links = [...navigation.querySelectorAll('a')].filter(link => link.getClientRects().length);
      const first = menuButton, last = links.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  matchMedia('(min-width: 801px)').addEventListener('change', (event) => { if (event.matches) setMenu(false); });
  document.querySelectorAll('[data-show-works]').forEach(button => button.addEventListener('click', event => {
    event.preventDefault();
    document.querySelectorAll('.c-worksCard[hidden]').forEach(card => { card.hidden = false; });
    document.querySelectorAll('[data-show-works]').forEach(link => {
      link.setAttribute('aria-expanded', 'true');
      link.querySelector('span:nth-child(2)').textContent = 'すべての実績を表示しています';
    });
  }));

  /* ── ドットスフィア（モノクロ・許可セクションのみ・スクロール/マウス駆動） ── */
  (() => {
    const allowedAll = [...document.querySelectorAll('[data-sphere="on"]')];
    if (!allowedAll.length) return;
    /* モバイルは文字との重なりを避けるためトップビュー（hero/thanks）のみ表示。デスクトップは全箇所 */
    const heroOnly = allowedAll.filter((el) => el.classList.contains('hero') || el.classList.contains('thanks-hero'));

    const canvas = document.createElement('canvas');
    canvas.className = 'sphere-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0, R = 0, CX = 0, CY = 0, DS = 1;
    function size() {
      W = innerWidth; H = innerHeight;
      canvas.width = W * devicePixelRatio;
      canvas.height = H * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      R = Math.min(W, H) * (W > 900 ? 0.37 : 0.34);
      CX = W > 900 ? W * 0.74 : W * 0.5;
      CY = H * 0.52;
      /* PCと同じ「微細な星屑」の質感: 球が小さい画面ほど点も細かく */
      DS = W > 900 ? 1 : 0.78;
    }
    size();
    addEventListener('resize', size);

    const N = 4400;
    const GA = Math.PI * (3 - Math.sqrt(5));
    const pts = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const th = GA * i;
      pts.push({
        x: Math.cos(th) * rad, y, z: Math.sin(th) * rad,
        tw: (i % 23) / 23 * Math.PI * 2,
        ph: (i % 97) / 97 * Math.PI * 2,
        big: i % 9 === 0,
      });
    }

    let mx = 0, my = 0, tmx = 0, tmy = 0;
    addEventListener('pointermove', (e) => {
      tmx = (e.clientX / innerWidth - 0.5) * 0.6;
      tmy = (e.clientY / innerHeight - 0.5) * 0.35;
    }, { passive: true });

    let prog = 0, tProg = 0;
    const updateProg = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      tProg = max > 0 ? scrollY / max : 0;
    };
    addEventListener('scroll', updateProg, { passive: true });
    updateProg();

    const darkEls = [...document.querySelectorAll('[data-scene="dark"]')];
    const centerCovered = (els) => els.some((el) => {
      const r = el.getBoundingClientRect();
      return r.top < H * 0.6 && r.bottom > H * 0.35;
    });

    const F = 2.6;
    let vis = 0, hiddenTab = false;
    document.addEventListener('visibilitychange', () => { hiddenTab = document.hidden; });

    (function frame(now) {
      requestAnimationFrame(frame);
      if (hiddenTab) return;
      const tVis = centerCovered(W <= 900 ? heroOnly : allowedAll) ? 1 : 0;
      vis += (tVis - vis) * 0.06;
      ctx.clearRect(0, 0, W, H);
      if (vis < 0.02) return;

      const t = now / 1000;
      mx += (tmx - mx) * 0.045;
      my += (tmy - my) * 0.045;
      prog += (tProg - prog) * 0.07;
      const dark = centerCovered(darkEls);
      const col = dark ? '245,245,242' : '15,15,14';
      const maxA = dark ? 0.72 : 0.58;
      const ry = t * 0.16 + prog * Math.PI * 1.3 + mx;
      const rx = 0.35 + my + prog * 0.4 + Math.sin(t * 0.21) * 0.05;
      const cy = Math.cos(ry), sy = Math.sin(ry);
      const cx = Math.cos(rx), sx = Math.sin(rx);
      for (const p of pts) {
        /* 有機的な呼吸: 半径がゆっくり脈動し、表面が生きて見える */
        const br = 1 + Math.sin(t * 0.8 + p.ph) * 0.022;
        const bx = p.x * br, by = p.y * br, bz = p.z * br;
        let x = bx * cy + bz * sy;
        let z = -bx * sy + bz * cy;
        const y = by * cx - z * sx;
        z = by * sx + z * cx;
        const sc = F / (F - z);
        const sxp = CX + x * R * sc;
        const syp = CY + y * R * sc;
        const depth = (z + 1) / 2;
        const d2 = depth * depth;
        const tw = 0.86 + 0.14 * Math.sin(t * 1.4 + p.tw);
        const alpha = (0.05 + d2 * maxA) * tw * vis * (p.big ? 1.3 : 1);
        ctx.beginPath();
        ctx.arc(sxp, syp, ((p.big ? 0.85 : 0.45) + d2 * (p.big ? 1.2 : 0.65)) * DS, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col},${alpha})`;
        ctx.fill();
      }
    })(0);
  })();


  /* ── お問い合わせ: AJAX送信→自前サンクスページへ直行（FormSubmitの画面を経由しない） ── */
  const ctForm = document.querySelector('.ct-form');
  if (ctForm) {
    ctForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = ctForm.querySelector('.ct-submit');
      if (btn.dataset.busy) return;
      btn.dataset.busy = '1';
      const orig = btn.innerHTML;
      btn.innerHTML = document.documentElement.lang === 'ja' ? '送信中…' : 'Sending…';
      const fd = new FormData(ctForm);
      const att = fd.get('attachment');
      if (att && att.size === 0) fd.delete('attachment');
      const dest = ctForm.querySelector('input[name="_next"]')?.value || './thanks.html';
      fetch(ctForm.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
        method: 'POST', body: fd, headers: { Accept: 'application/json' },
      })
        .then((r) => r.json())
        .then((j) => {
          if (j.success === 'true' || j.success === true) { location.href = dest; return; }
          throw new Error('formsubmit');
        })
        .catch(() => {
          /* 失敗時は通常POSTにフォールバック（メールは届く）。submit()はこのリスナーを再発火しない */
          delete btn.dataset.busy;
          btn.innerHTML = orig;
          ctForm.submit();
        });
    });
  }

})();
