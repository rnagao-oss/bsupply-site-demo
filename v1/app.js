/* B supply — Monochrome Premium */
(() => {
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  /* ── LOADING：ブラシサークル→白黒反転→対角ワイプ（トップのみ） ── */
  const loader = document.getElementById('loader');
  if (loader && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    loader.remove();
    setTimeout(revealHeroTitle, 150);
  } else if (loader) {
    const word = document.getElementById('ldWord');
    const chars = [...word.textContent].map((ch) => {
      const s = document.createElement('span');
      s.className = 'ld-ch';
      s.textContent = ch === ' ' ? '\u00A0' : ch;
      return s;
    });
    word.textContent = '';
    chars.forEach((c) => word.appendChild(c));
    setTimeout(() => loader.classList.add('draw'), 120);       /* 渦を巻きながら円が描かれる */
    setTimeout(() => {
      loader.classList.add('word');                             /* B SUPPLY 打刻 */
      chars.forEach((c, i) => setTimeout(() => c.classList.add('in'), i * 40));
    }, 1500);
    setTimeout(() => loader.classList.add('flip'), 2650);       /* 白黒反転パンチ */
    setTimeout(() => {
      loader.classList.add('done');                             /* 対角ワイプ */
      revealHeroTitle();
    }, 2880);
    setTimeout(() => loader.remove(), 3900);
  } else {
    setTimeout(() => {
      const pt = document.querySelector('.page-title');
      if (pt) staggerIn(pt, 100);
    }, 200);
  }

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

  /* ── カーソルオーブ（IP風マウス追従） ── */
  (() => {
    if (matchMedia('(pointer: coarse)').matches) return;
    const orb = document.createElement('div');
    orb.className = 'cursor-orb';
    document.body.appendChild(orb);
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, seen = false;
    addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!seen) { x = tx; y = ty; seen = true; }
    }, { passive: true });
    addEventListener('pointerdown', () => orb.classList.add('is-down'));
    addEventListener('pointerup', () => orb.classList.remove('is-down'));
    const HOVER = 'a, button, summary, .orbit-node, input, textarea, label';
    document.addEventListener('pointerover', (e) => {
      orb.classList.toggle('is-hover', !!e.target.closest(HOVER));
    });
    (function follow() {
      requestAnimationFrame(follow);
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      orb.style.left = `${x}px`;
      orb.style.top = `${y}px`;
    })();
  })();

  /* ── モバイルメニュー ── */
  const menuBtn = document.getElementById('menuBtn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => document.body.classList.toggle('menu-open'));
    document.querySelectorAll('.mobile-menu a').forEach((a) =>
      a.addEventListener('click', () => document.body.classList.remove('menu-open')));
  }

  /* ── アンビエントドット（全ページ共通・IP風の微粒子） ── */
  (() => {
    const canvas = document.getElementById('ambientDots');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dots = [];
    function size() {
      W = innerWidth; H = innerHeight;
      canvas.width = W * devicePixelRatio;
      canvas.height = H * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      const n = Math.min(56, Math.floor(W / 26));
      dots = Array.from({ length: n }, (_, i) => ({
        x: ((i * 197.31) % 1) * W,
        y: ((i * 383.17) % 1) * H,
        r: 0.8 + ((i * 7) % 10) / 7,
        a: 0.10 + ((i * 13) % 9) / 45,
        vx: (((i * 11) % 7) - 3) / 46,
        vy: (((i * 17) % 7) - 3) / 52,
        ph: (i % 23) / 23 * Math.PI * 2,
      }));
    }
    size();
    addEventListener('resize', size);
    let visible = !document.hidden;
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
    (function tick(now) {
      requestAnimationFrame(tick);
      if (!visible) return;
      const t = now / 1000;
      ctx.clearRect(0, 0, W, H);
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy;
        if (d.x < -8) d.x = W + 8; if (d.x > W + 8) d.x = -8;
        if (d.y < -8) d.y = H + 8; if (d.y > H + 8) d.y = -8;
        const tw = 0.6 + 0.4 * Math.sin(t * 0.8 + d.ph);
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(120, 118, 112, ${d.a * tw})`;
        ctx.fill();
      }
    })(0);
  })();

  /* ── 文字分割（data-split） ── */
  const IS_JA = (document.documentElement.lang || 'ja').startsWith('ja');
  document.querySelectorAll('[data-split]').forEach((el) => {
    el.querySelectorAll(':scope > span.ht-line').length
      ? el.querySelectorAll(':scope > span.ht-line').forEach(splitNode)
      : splitNode(el);
  });
  function splitNode(node) {
    const NO_START = '、。，．・ー」』）〉》！？!?,.%）]';  /* 行頭禁則文字 */
    const addChars = (tok, text) => {
      [...text].forEach((ch) => {
        const s = document.createElement('span');
        s.className = 'char';
        s.textContent = ch === ' ' ? '\u00A0' : ch;
        tok.appendChild(s);
      });
    };
    const walk = (n) => {
      [...n.childNodes].forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          if (!IS_JA) {
            /* 欧文・ハングル等: 単語単位で分割（単語内改行を防ぐ） */
            c.textContent.split(/(\s+)/).forEach((w) => {
              if (!w) return;
              if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
              const tok = document.createElement('span');
              tok.className = 'tok';
              addChars(tok, w);
              frag.appendChild(tok);
            });
            n.replaceChild(frag, c);
            return;
          }
          /* 文節分割：読点・句点の直後でのみ改行を許す */
          const phrases = c.textContent.split(/(?<=[、。，！？!?])/);
          phrases.forEach((ph) => {
            if (!ph) return;
            if (ph.length <= 16) {
              const tok = document.createElement('span');
              tok.className = 'tok';
              addChars(tok, ph);
              frag.appendChild(tok);
            } else {
              /* 長い文節は禁則グループ単位で折返し許可 */
              let tok = null;
              [...ph].forEach((ch) => {
                const isPunct = NO_START.includes(ch);
                if (!tok || !isPunct) {
                  tok = document.createElement('span');
                  tok.className = 'tok';
                  frag.appendChild(tok);
                }
                addChars(tok, ch);
              });
            }
          });
          n.replaceChild(frag, c);
        } else if (c.nodeType === 1 && !c.classList.contains('char') && !c.classList.contains('tok')) {
          walk(c);
        }
      });
    };
    walk(node);
  }
  function staggerIn(el, base = 0) {
    el.querySelectorAll('.char').forEach((c, i) => {
      setTimeout(() => c.classList.add('in'), base + i * 28);
    });
  }
  function revealHeroTitle() {
    const t = document.querySelector('.hero-title');
    if (t) staggerIn(t, 150);
  }

  /* 見出しのIOリビール（文字分割対象） */
  const splitIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      staggerIn(e.target);
      splitIO.unobserve(e.target);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('[data-split]:not(.hero-title)').forEach((el) => splitIO.observe(el));

  /* ── ヘッダー & 進行バー & スクロール連動 ── */
  const header = document.getElementById('siteHeader');
  const progressBar = document.getElementById('progressBar');
  const hero = document.getElementById('hero');
  /* ゴーストテキスト：ティッカー化（複製してループ） */
  /* 共通速度。PCは画面幅比（1440pxで約42px/s）、モバイルは下限24px/sで体感を揃える。
     フォント/画像の読み込みで帯の幅が後から変わっても、ResizeObserverで常に同じ速度に補正する */
  const PXPS = () => Math.max(24, innerWidth / 34);
  const keepSpeed = (el, apply) => {
    const sync = () => {
      const halfW = el.scrollWidth / 2;
      if (halfW > 0) apply(Math.max(1, halfW / PXPS()));
    };
    sync();
    new ResizeObserver(sync).observe(el);
  };
  document.querySelectorAll('.kinetic').forEach((k) => {
    const text = k.textContent.trim();
    const speed = parseFloat(k.dataset.speed || '0.5');
    k.innerHTML = `<span style="display:flex"><b>${text}</b></span>`;
    const oneW = k.firstElementChild.offsetWidth || 2000;
    /* 巨大レイヤーはiOS Safariの合成限界でカクつくため、複製は画面1.5枚分を満たす最小回数に抑える */
    const reps = Math.max(1, Math.ceil((innerWidth * 1.5) / oneW));
    const half = `<b>${text}</b>`.repeat(reps);
    k.innerHTML = `<span style="display:flex">${half}</span><span style="display:flex" aria-hidden="true">${half}</span>`;
    keepSpeed(k, (dur) => k.style.setProperty('--ghost-dur', `${dur.toFixed(1)}s`));
    if (speed < 0) k.classList.add('rev');
  });

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 60);
    if (hero) header.classList.toggle('light', y > hero.offsetHeight - 80);
    const max = document.documentElement.scrollHeight - innerHeight;
    progressBar.style.width = `${(y / max) * 100}%`;
    updateAtelier();
  };
  addEventListener('scroll', onScroll, { passive: true });

  /* ── 汎用リビール ── */
  const revealTargets = document.querySelectorAll(
    '.st-line, .sec-label, .sec-lede, .mi-list li, .mi-statement, .cv-item, .vi-copy, .wm-note, .sn-item, .svc-card, .ca-head, .ca-sub, .case-row, .case-note, .iv-point, .tl-item, .tl-quote, .stat, .rs-card, .eq-card, .data-cell, .msg-body p, .msg-sign2, .iv-meti, .tr-case, .co-table > div, .fin-mail, .df-row, .ci-row, .cp-block, .mx-wrap, .mx-note, .eg-card, .eg-note, .fin-note, .pf, .sv-item, .pq, .tick-wrap, .cl-band, .cl-note, .adv, .svc-card2, .bp-card, .sd-sol, .sd-ap, .sd-lead, .cd-block, .cd-svcs, .cnav, .back-link, .cst p, .jd-mission p, .jd-step, .jd-spec > div, .jd-note, .pos-col'
  );
  revealTargets.forEach((el) => el.classList.add('reveal-el'));
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      revealIO.unobserve(e.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -5% 0px' });
  revealTargets.forEach((el) => revealIO.observe(el));

  document.querySelectorAll('.st-line').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.22}s`;
  });
  /* リスト系は行ごとに時差 */
  document.querySelectorAll('.case-row, .rs-card, .eq-card, .mi-list li, .ci-row, .df-row, .eg-card, .sv-item, .adv, .svc-card2, .bp-card, .sd-sol, .sd-ap').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 12) * 0.05}s`;
  });

  /* ── ロゴマーキー：シームレスループ用に複製 ── */
  document.querySelectorAll('.logo-track, .cl-track, .tick-track').forEach((t) => {
    t.innerHTML += t.innerHTML;
    /* ロゴ帯・事例ティッカーもゴーストと同じ体感速度に統一（画像読込後の幅変化にも追従） */
    keepSpeed(t, (dur) => { t.style.animationDuration = `${dur.toFixed(1)}s`; });
  });

  /* ── サービス行装置（展開＋ウェイト呼吸） ── */
  document.querySelectorAll('.sv-item').forEach((item) => {
    const btn = item.querySelector('.sv-row');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  const svJps = document.querySelectorAll('.sv-jp');
  if (svJps.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const wIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        e.target.style.setProperty('--svw', String(Math.round(550 + e.intersectionRatio * 350)));
      });
    }, { threshold: Array.from({ length: 21 }, (_, i) => i / 20), rootMargin: '-25% 0px -25% 0px' });
    svJps.forEach((el) => wIO.observe(el));
  }

  /* ── 円環図 ── */
  const orbitWrap = document.querySelector('.orbit-wrap');
  if (orbitWrap) {
    const orbitIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        orbitWrap.classList.add('in');
        orbitIO.unobserve(orbitWrap);
      });
    }, { threshold: 0.35 });
    orbitIO.observe(orbitWrap);
  }
  /* 円をタップ→黒く反転→その事業の場所へ遷移 */
  const NODE_DEST = { consulting: 'consulting.html', valueup: 'manufacturing.html' };
  document.querySelectorAll('.orbit-node').forEach((node) => {
    node.addEventListener('click', () => {
      node.classList.add('tapped');
      const dest = NODE_DEST[node.dataset.target];
      if (dest) {
        setTimeout(() => { location.href = dest; }, 420);
      } else {
        document.getElementById(node.dataset.target)?.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => node.classList.remove('tapped'), 900);
      }
    });
  });

  /* ── タイムライン進行 ── */
  const tlTrack = document.getElementById('tlTrack');
  const tlProgress = document.getElementById('tlProgress');
  if (tlTrack) {
    (function tlTick() {
      const r = tlTrack.getBoundingClientRect();
      const visible = Math.min(Math.max((innerHeight * 0.78 - r.top) / r.height, 0), 1);
      tlProgress.style.height = `${visible * 100}%`;
      requestAnimationFrame(tlTick);
    })();
  }

  /* ── 工房シネマ（音声付き） ── */
  const atelier = document.getElementById('atelier');
  const atVideo = document.getElementById('atVideo');
  const atSound = document.getElementById('atSound');
  const captions = [...document.querySelectorAll('.at-caption')];
  let atPlaying = false;
  let soundWanted = true;   // 初期状態: 入域時に音声ONを試みる
  function setSoundUI(on) {
    atSound.classList.toggle('on', on);
    atSound.lastChild.textContent = on ? 'SOUND ON' : 'SOUND OFF';
  }
  function tryUnmute() {
    if (!soundWanted) return;
    atVideo.muted = false;
    atVideo.volume = 1;
    const ok = !atVideo.muted;
    setSoundUI(ok);
  }
  if (atSound) atSound.addEventListener('click', () => {
    soundWanted = atVideo.muted;          // OFF→ON / ON→OFF
    atVideo.muted = !atVideo.muted;
    setSoundUI(!atVideo.muted);
  });
  function updateAtelier() {
    if (!atelier) return;
    const r = atelier.getBoundingClientRect();
    const total = r.height - innerHeight;
    const t = Math.min(Math.max(-r.top / total, 0), 1);
    const inView = r.top < innerHeight && r.bottom > 0;
    if (inView && !atPlaying) {
      atVideo.play().catch(() => {});
      atPlaying = true;
      tryUnmute();
    }
    if (!inView && atPlaying) {
      atVideo.pause();
      atVideo.muted = true;
      setSoundUI(false);
      atPlaying = false;
    }
    const phase = t < 0.34 ? 0 : t < 0.7 ? 1 : 2;
    captions.forEach((c, i) => c.classList.toggle('active', i === phase && inView));
  }

  /* ── 世界地図：日本から、世界へ ── */
  (async () => {
    const wrap = document.getElementById('worldmap');
    if (!wrap) return;
    const canvas = document.getElementById('wmLand');
    const svg = document.getElementById('wmOverlay');
    const NS = 'http://www.w3.org/2000/svg';

    const LAT_TOP = 78, LAT_BTM = -56;
    let W = 1000, H = 425;
    const px = (lon) => ((lon + 180) / 360) * W;
    const py = (lat) => ((LAT_TOP - lat) / (LAT_TOP - LAT_BTM)) * H;

    const ORIGIN = { lon: 138.5, lat: 36.5 };
    /* 匿名の展開拠点（世界中に広く散らす） */
    const DESTS = [
      [-122.4, 37.8], [-118.2, 34.0], [-99.1, 19.4], [-87.6, 41.9], [-74.0, 40.7], [-43.2, -22.9], [-58.4, -34.6],
      [-0.13, 51.5], [2.35, 48.9], [9.19, 45.5], [13.4, 52.5], [4.9, 52.4], [-3.7, 40.4], [18.07, 59.33],
      [31.2, 30.1], [36.8, -1.3], [28.05, -26.2], [55.3, 25.2], [77.2, 28.6], [72.9, 19.1],
      [100.5, 13.8], [103.8, 1.35], [114.2, 22.3], [121.5, 31.2], [126.98, 37.57], [151.2, -33.9], [174.8, -36.8],
    ];

    function sizeAll() {
      const r = wrap.getBoundingClientRect();
      W = Math.max(r.width, 320); H = Math.max(r.height, 160);
      canvas.width = W * devicePixelRatio; canvas.height = H * devicePixelRatio;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    }
    sizeAll();

    let land = null;
    await new Promise((resolve) => {
      const gate = new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting)) { gate.disconnect(); resolve(); }
      }, { rootMargin: '600px 0px' });
      gate.observe(wrap);
    });
    try {
      const geoRes = await fetch((document.documentElement.getAttribute('data-root') || '.') + '/assets/data/land-110m-geo.json');
      land = await geoRes.json();
    } catch (e) { /* offline */ }

    function drawLand() {
      const ctx = canvas.getContext('2d');
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!land) return;
      ctx.fillStyle = '#ebe9e4';
      for (const f of land.features) {
        const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
        for (const poly of polys) {
          ctx.beginPath();
          for (const ring of poly) {
            ring.forEach(([lon, lat], i) => {
              i === 0 ? ctx.moveTo(px(lon), py(lat)) : ctx.lineTo(px(lon), py(lat));
            });
            ctx.closePath();
          }
          ctx.fill();
        }
      }
    }

    /* アーク定義（ベジェ） */
    let arcs = [];
    function buildOverlay() {
      svg.innerHTML = '';
      arcs = [];
      const ox = px(ORIGIN.lon), oy = py(ORIGIN.lat);
      DESTS.forEach(([lon, lat], i) => {
        const x = px(lon), y = py(lat);
        const mx = (ox + x) / 2;
        const dist = Math.hypot(x - ox, y - oy);
        const lift = Math.min(dist * 0.28, H * 0.34);
        const cx = mx, cy = Math.max(Math.min(oy, y) - lift, 6);
        arcs.push({ ox, oy, x, y, cx, cy, off: (i * 0.37) % 1, dur: 5200 + (i % 5) * 900 });

        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', `M ${ox},${oy} Q ${cx},${cy} ${x},${y}`);
        path.setAttribute('class', 'wm-arc');
        const len = dist * 1.25;
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        path.style.transition = `stroke-dashoffset 1.5s cubic-bezier(0.19,1,0.22,1) ${0.3 + i * 0.09}s`;
        svg.appendChild(path);

        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.setAttribute('r', 2.6);
        dot.setAttribute('class', 'wm-city');
        svg.appendChild(dot);
        const pulse = document.createElementNS(NS, 'circle');
        pulse.setAttribute('cx', x); pulse.setAttribute('cy', y); pulse.setAttribute('r', 6);
        pulse.setAttribute('class', 'wm-pulse');
        pulse.style.animationDelay = `${(i % 9) * 0.35}s`;
        svg.appendChild(pulse);
      });

      /* JAPAN 起点 */
      const oDot = document.createElementNS(NS, 'circle');
      oDot.setAttribute('cx', ox); oDot.setAttribute('cy', oy); oDot.setAttribute('r', 5);
      oDot.setAttribute('class', 'wm-city');
      svg.appendChild(oDot);
      ['9', '15'].forEach((r0, i) => {
        const oPulse = document.createElementNS(NS, 'circle');
        oPulse.setAttribute('cx', ox); oPulse.setAttribute('cy', oy); oPulse.setAttribute('r', r0);
        oPulse.setAttribute('class', 'wm-pulse');
        oPulse.style.animationDelay = `${i * 1.3}s`;
        svg.appendChild(oPulse);
      });
      const oLabel = document.createElementNS(NS, 'text');
      oLabel.setAttribute('x', ox + 6);
      oLabel.setAttribute('y', oy + 22);
      oLabel.setAttribute('text-anchor', 'middle');
      oLabel.setAttribute('class', 'wm-label wm-origin-label on');
      oLabel.textContent = 'JAPAN';
      svg.appendChild(oLabel);

      /* 巡回する光（アーク上を流れる粒） */
      travelers = arcs.map(() => {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('r', 2.4);
        c.setAttribute('class', 'wm-traveler');
        svg.appendChild(c);
        return c;
      });
    }

    let travelers = [];
    let played = false;
    function qbez(a, t) {
      const u = 1 - t;
      return {
        x: u * u * a.ox + 2 * u * t * a.cx + t * t * a.x,
        y: u * u * a.oy + 2 * u * t * a.cy + t * t * a.y,
      };
    }
    (function travelTick(now) {
      requestAnimationFrame(travelTick);
      if (!played) return;
      arcs.forEach((a, i) => {
        const t = ((now / a.dur) + a.off) % 1;
        const p = qbez(a, t);
        const tr = travelers[i];
        tr.setAttribute('cx', p.x);
        tr.setAttribute('cy', p.y);
        tr.style.opacity = Math.sin(t * Math.PI) * 0.9;
      });
    })(0);

    drawLand();
    buildOverlay();
    addEventListener('resize', () => { sizeAll(); drawLand(); buildOverlay(); if (played) fire(); });

    function fire() {
      wrap.classList.add('play');
      svg.querySelectorAll('.wm-arc').forEach((p) => { p.style.strokeDashoffset = 0; });
    }
    const wmIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting || played) return;
        played = true;
        fire();
        wmIO.unobserve(wrap);
      });
    }, { threshold: 0.3 });
    wmIO.observe(wrap);
  })();

  /* ── 数字カウントアップ ── */
  const statIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.count;
      const start = performance.now();
      const dur = 1400;
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = String(Math.round(target * ease(p)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      statIO.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.stat-n').forEach((el) => statIO.observe(el));

  /* ── ISSUEカウンター（小数・カンマ対応） ── */
  const issueIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.val);
      const dec = parseInt(el.dataset.dec || '0', 10);
      const comma = el.dataset.comma === '1';
      const start = performance.now();
      const dur = 1800;
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const v = target * ease(p);
        el.textContent = comma
          ? Math.round(v).toLocaleString('ja-JP')
          : v.toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      issueIO.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.is-num').forEach((el) => issueIO.observe(el));

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

  onScroll();
})();

/* ── 求人フィルター（採用情報） ── */
(() => {
  const bar = document.querySelector('.jb-filter');
  if (!bar) return;
  const rows = [...document.querySelectorAll('.jb-row')];
  const menus = [...bar.querySelectorAll('.jb-menu')];
  const pills = [...bar.querySelectorAll('.jb-pill')];
  const countEl = bar.querySelector('.jb-count b');
  const clearBtn = bar.querySelector('.jb-clear');
  const state = { div: new Set(), loc: new Set() };

  const closeMenus = () => {
    menus.forEach((m) => m.classList.remove('open'));
    pills.forEach((p) => p.classList.remove('on'));
  };
  pills.forEach((p) => {
    p.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = bar.querySelector(`.jb-menu[data-for="${p.dataset.menu}"]`);
      const wasOpen = menu.classList.contains('open');
      closeMenus();
      if (!wasOpen) {
        menu.style.left = Math.max(0, Math.min(p.offsetLeft, bar.clientWidth - menu.offsetWidth)) + 'px';
        menu.classList.add('open');
        p.classList.add('on');
      }
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.jb-menu')) closeMenus();
  });

  const apply = () => {
    let visible = 0;
    rows.forEach((r) => {
      const okDiv = !state.div.size || (r.dataset.div || '').split(' ').some((v) => state.div.has(v));
      const okLoc = !state.loc.size || (r.dataset.loc || '').split(' ').some((v) => state.loc.has(v));
      const ok = okDiv && okLoc;
      r.classList.toggle('hide', !ok);
      if (ok) visible++;
    });
    document.querySelectorAll('.rc-division').forEach((sec) => {
      const any = [...sec.querySelectorAll('.jb-row')].some((r) => !r.classList.contains('hide'));
      sec.classList.toggle('hide', !any);
    });
    if (countEl) countEl.textContent = visible;
    pills.forEach((p) => p.setAttribute('data-n', state[p.dataset.menu].size));
    if (clearBtn) clearBtn.style.visibility = state.div.size || state.loc.size ? 'visible' : 'hidden';
  };
  menus.forEach((m) => {
    m.addEventListener('change', (e) => {
      const key = m.dataset.for;
      if (e.target.checked) state[key].add(e.target.value);
      else state[key].delete(e.target.value);
      apply();
    });
  });
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.div.clear();
      state.loc.clear();
      menus.forEach((m) => m.querySelectorAll('input').forEach((i) => (i.checked = false)));
      apply();
    });
  }
  apply();
})();
