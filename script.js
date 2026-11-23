(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const clamp = v => (v < 0 ? 0 : v > 1 ? 1 : v);

  /* Liquid glass real só no Chromium (SVG filter em backdrop-filter) */
  try {
    if (window.chrome && CSS.supports('backdrop-filter', 'url(#liquid)')) root.classList.add('lq');
  } catch (e) { /* sem suporte: fica no blur padrão */ }

  /* ---------- Liquid glass: refração só na borda + franja RGB ---------- */
  if (root.classList.contains('lq')) {
    const defs = $('#lq-defs defs');
    const NS = 'http://www.w3.org/2000/svg';
    const made = new Set();
    const mk = (tag, attrs, parent) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(n);
      return n;
    };
    // Mapa de deslocamento: SDF de retângulo arredondado, normal só perto da borda
    const mapURL = (w, h, r, rim) => {
      const k = 0.5, cw = Math.max(2, Math.round(w * k)), ch = Math.max(2, Math.round(h * k));
      const c = document.createElement('canvas');
      c.width = cw; c.height = ch;
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(cw, ch), d = img.data;
      const hw = w / 2, hh = h / 2;
      for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
        const px = (i + 0.5) / k - hw, py = (j + 0.5) / k - hh;
        const qx = Math.abs(px) - (hw - r), qy = Math.abs(py) - (hh - r);
        const mx = Math.max(qx, 0), my = Math.max(qy, 0), ol = Math.hypot(mx, my);
        const depth = -(ol + Math.min(Math.max(qx, qy), 0) - r);
        let R = 128, G = 128;
        if (depth > 0 && depth < rim) {
          let nx, ny;
          if (ol > 0) { nx = mx / ol; ny = my / ol; } else if (qx > qy) { nx = 1; ny = 0; } else { nx = 0; ny = 1; }
          nx *= px < 0 ? -1 : 1; ny *= py < 0 ? -1 : 1;
          const t = 1 - depth / rim, s = t * t;
          R = 128 - nx * 127 * s; G = 128 - ny * 127 * s;
        }
        const o = (j * cw + i) * 4;
        d[o] = R; d[o + 1] = G; d[o + 2] = 128; d[o + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      return c.toDataURL();
    };
    const CH = [
      ['R', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', 1],
      ['G', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', 0.9],
      ['B', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0', 0.8]
    ];
    const filterFor = (w, h, r) => {
      const W = Math.max(4, Math.round(w / 4) * 4), H = Math.max(4, Math.round(h / 4) * 4);
      const R = Math.round(Math.min(r, W / 2, H / 2));
      const id = 'lq-' + W + '-' + H + '-' + R;
      if (made.has(id) || !defs) return id;
      made.add(id);
      const rim = Math.min(18, Math.min(W, H) * 0.3), S = rim * 2.2;
      const f = mk('filter', { id, filterUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H,
        'color-interpolation-filters': 'sRGB' }, defs);
      mk('feImage', { href: mapURL(W, H, R, rim), x: 0, y: 0, width: W, height: H,
        preserveAspectRatio: 'none', result: 'm' }, f);
      CH.forEach(([c, m, k]) => {
        mk('feDisplacementMap', { in: 'SourceGraphic', in2: 'm', scale: (S * k).toFixed(1),
          xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' + c }, f);
        mk('feColorMatrix', { in: 'd' + c, type: 'matrix', values: m, result: 'c' + c }, f);
      });
      mk('feBlend', { in: 'cR', in2: 'cG', mode: 'screen', result: 'rg' }, f);
      mk('feBlend', { in: 'rg', in2: 'cB', mode: 'screen' }, f);
      return id;
    };
    const radiusOf = (el, w, h) => {
      const v = getComputedStyle(el).borderTopLeftRadius || '0';
      const n = parseFloat(v) || 0;
      return v.indexOf('%') > -1 ? n / 100 * Math.min(w, h) : n;
    };
    const applyGlass = el => {
      const w = el.offsetWidth, h = el.offsetHeight;
      if (!w || !h) return;
      const id = filterFor(w, h, radiusOf(el, w, h));
      const v = 'url(#' + id + ') blur(2px) saturate(150%) brightness(1.06)';
      el.style.backdropFilter = v;
      el.style.webkitBackdropFilter = v;
    };
    const glassRO = 'ResizeObserver' in window
      ? new ResizeObserver(es => es.forEach(e => applyGlass(e.target))) : null;
    $$('.glass').forEach(el => { applyGlass(el); if (glassRO) glassRO.observe(el); });
  }

  /* ---------- WhatsApp ---------- */
  const WA = '5522981481742';
  const BASE_MSG = 'Olá José! Vi sua proposta e quero meu avatar de IA com 30 Reels por mês.';
  const ADDON_MSG = ' Quero também a opção em que você posta por mim (R$ 3.500/mês).';
  const addon = $('#addon');
  const waUrl = () => 'https://wa.me/' + WA + '?text=' +
    encodeURIComponent(BASE_MSG + (addon && addon.checked ? ADDON_MSG : ''));
  const setWa = () => {
    const url = waUrl();
    $$('.wa').forEach(a => { a.href = url; a.target = '_blank'; a.rel = 'noopener'; });
  };
  setWa();

  /* ---------- Preço + add-on ---------- */
  const priceVal = $('#priceVal');
  const perDay = $('#perDay');
  if (addon) {
    addon.addEventListener('change', () => {
      const on = addon.checked;
      if (priceVal) {
        priceVal.textContent = on ? '3.500' : '3.000';
        priceVal.classList.remove('bump');
        void priceVal.offsetWidth;
        priceVal.classList.add('bump');
      }
      if (perDay) perDay.textContent = on ? '117' : '100';
      setWa();
    });
  }

  /* ---------- Contadores ---------- */
  const fmt = n => Math.round(n).toLocaleString('pt-BR');
  const ease = t => 1 - Math.pow(1 - t, 3);
  const animateNum = (el, to, money) => {
    const set = v => { el.textContent = money ? 'R$ ' + fmt(v) : fmt(v); };
    if (reduce) { set(to); return; }
    const dur = Math.min(2200, 900 + String(to).length * 180);
    const t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      set(to * ease(p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const runNum = n => {
    if (n.dataset.done) return;
    n.dataset.done = 1;
    const money = n.hasAttribute('data-money');
    animateNum(n, +(money ? n.dataset.money : n.dataset.count), money);
  };

  /* ---------- Data da proposta ---------- */
  const propDate = $('#propDate');
  if (propDate) {
    propDate.textContent = 'Proposta para você em ' +
      new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ---------- Títulos: palavra por palavra ---------- */
  $$('.split').forEach(h => {
    const text = h.textContent.replace(/\s+/g, ' ').trim();
    h.setAttribute('aria-label', text);
    h.textContent = '';
    text.split(' ').forEach((word, i, all) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', i);
      s.textContent = word;
      h.appendChild(s);
      if (i < all.length - 1) h.appendChild(document.createTextNode(' '));
    });
    h.classList.add('ready');
  });

  /* ---------- Barras de custo ---------- */
  $$('ul.bars').forEach(ul => {
    const items = $$('li[data-v]', ul);
    const max = Math.max(1, ...items.map(li => +li.dataset.v || 0));
    items.forEach(li => li.style.setProperty('--w', ((+li.dataset.v || 0) / max).toFixed(3)));
  });

  /* ---------- Marquee: duplica para loop exato ---------- */
  $$('.marquee-track').forEach(t => {
    const k = t.cloneNode(true);
    k.setAttribute('aria-hidden', 'true');
    t.after(k);
  });

  /* ---------- Revelação no scroll ---------- */
  const onReveal = el => {
    if (el.matches('[data-count],[data-money]')) runNum(el);
    $$('[data-count],[data-money]', el).forEach(n => {
      const owner = n.closest('.rv');
      if (!owner || owner === el) runNum(n);
    });
  };
  $$('.rv').forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains('rv'));
    const idx = sibs.indexOf(el);
    if (idx > 0) el.style.setProperty('--rd', Math.min(idx, 6) * 0.08 + 's');
  });
  const targets = $$('.rv, .split, .bars li')
    .concat($$('[data-count],[data-money]').filter(n => !n.closest('.rv')));
  let io = null;
  const reveal = el => {
    if (el.classList.contains('in')) return;
    el.classList.add('in');
    onReveal(el);
    if (io) io.unobserve(el);
  };
  if (!reduce && 'IntersectionObserver' in window) {
    io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const rail = el.parentElement;
        if (rail && (rail.classList.contains('rail') || rail.classList.contains('mosaic'))) $$('.rv', rail).forEach(reveal);
        else reveal(el);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(el => io.observe(el));
  } else {
    targets.forEach(reveal);
  }

  /* ---------- Motor de scroll ---------- */
  const nav = $('#nav');
  const waFloat = $('.wa-float');
  const hero = $('.hero');
  const bg = $('.bg');
  const bgGrid = $('.bg-grid');
  const bar = $('.progress i');
  const px = $$('.px').map(el => ({ el, s: parseFloat(el.dataset.speed) || 0 }));
  const morph = $('.morph');
  const frame = $('.morph-frame');
  const pct = $('#morphPct');
  const mSteps = $$('.morph-steps li');
  let vh = 0, docH = 0, heroH = 0;

  let lastCur = -1, lastPct = -1, ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const mr = morph ? morph.getBoundingClientRect() : null;

    const sp = docH > 0 ? clamp(y / docH) : 0;
    if (bar) bar.style.setProperty('--sp', sp.toFixed(4));
    if (nav) nav.classList.toggle('scrolled', y > 24);
    if (waFloat) waFloat.classList.toggle('show', y > heroH * 0.7);
    if (!reduce) {
      if (bg) bg.style.setProperty('--sp', sp.toFixed(4));
      if (bgGrid) bgGrid.style.setProperty('--gy', (-((y * 0.12) % 44)).toFixed(1) + 'px');
      if (y < vh * 1.6) px.forEach(o => o.el.style.setProperty('--py', (y * o.s).toFixed(1) + 'px'));
    }
    if (mr && frame) {
      const span = mr.height - vh;
      const p = span > 0 ? clamp(-mr.top / span) : 0;
      frame.style.setProperty('--p', p.toFixed(4));
      frame.classList.toggle('ai', p >= 0.5);
      frame.classList.toggle('live', p > 0.005 && p < 0.995);
      const v = Math.round(p * 100);
      if (pct && v !== lastPct) { lastPct = v; pct.textContent = v; }
      const cur = p >= 0.75 ? 2 : p >= 0.4 ? 1 : 0;
      if (cur !== lastCur) {
        lastCur = cur;
        mSteps.forEach((li, i) => {
          li.classList.toggle('on', i <= cur);
          li.classList.toggle('cur', i === cur);
        });
      }
    }
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  const measure = () => {
    vh = window.innerHeight;
    docH = root.scrollHeight - vh;
    heroH = hero ? hero.offsetHeight : 0;
    request();
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  measure();

  /* ---------- Brilho do vidro seguindo o mouse ---------- */
  if (finePointer) {
    document.addEventListener('pointermove', e => {
      const g = e.target.closest && e.target.closest('.glass');
      if (!g) return;
      const r = g.getBoundingClientRect();
      g.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      g.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* ---------- Vídeos autoplay das plataformas ---------- */
  const autos = $$('video[data-auto]');
  if (reduce) autos.forEach(v => { v.removeAttribute('autoplay'); v.pause(); });
  else if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver(es => es.forEach(en => {
      const v = en.target;
      if (en.isIntersecting) {
        if (v.preload !== 'auto') v.preload = 'auto';
        const p = v.play();
        if (p) p.catch(() => {});
      } else v.pause();
    }), { rootMargin: '120px 0px', threshold: 0.01 });
    autos.forEach(v => vio.observe(v));
  }
})();

// Robust autoplay: force muted inline playback, retry when data arrives,
// and kick every video on first user interaction (some browsers wait for it).
(() => {
  const vids = Array.from(document.querySelectorAll('video')).filter(v => !v.closest('.cf'));
  const play = v => {
    v.muted = true; v.defaultMuted = true; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    if (v.preload !== 'auto') v.preload = 'auto';
    const p = v.play(); if (p) p.catch(() => {});
  };
  vids.forEach(v => {
    v.loop = true;
    ['loadeddata', 'canplay'].forEach(ev => v.addEventListener(ev, () => { if (v.dataset.vis === '1') play(v); }));
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => {
      en.target.dataset.vis = en.isIntersecting ? '1' : '0';
      if (en.isIntersecting) play(en.target);
    }), { rootMargin: '200px 400px', threshold: 0 });
    vids.forEach(v => io.observe(v));
  } else vids.forEach(play);
  const kick = () => vids.filter(v => v.dataset.vis === '1').forEach(play);
  ['touchstart', 'pointerdown', 'scroll'].forEach(ev => window.addEventListener(ev, kick, { passive: true, once: true }));
  document.querySelectorAll('.rail').forEach(r => r.addEventListener('scroll', kick, { passive: true }));
})();

/* ---------- Carrossel de edição ---------- */
(() => {
  const rail = document.getElementById('edRail');
  if (!rail) return;
  const items = Array.from(rail.children);
  const dotsBox = document.getElementById('edDots');
  const dots = items.map(() => { const i = document.createElement('i'); dotsBox && dotsBox.appendChild(i); return i; });
  const step = () => (items[1] ? items[1].offsetLeft - items[0].offsetLeft : rail.clientWidth);
  const current = () => Math.round(rail.scrollLeft / Math.max(1, step()));
  const paint = () => { const c = Math.min(items.length - 1, current()); dots.forEach((d, i) => d.classList.toggle('on', i === c)); };
  let raf = 0;
  rail.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(paint); }, { passive: true });
  document.querySelectorAll('.ed-btn').forEach(b => b.addEventListener('click', () => {
    const dir = +b.dataset.dir;
    const max = rail.scrollWidth - rail.clientWidth;
    let to = rail.scrollLeft + dir * step();
    if (dir > 0 && rail.scrollLeft >= max - 4) to = 0;
    if (dir < 0 && rail.scrollLeft <= 4) to = max;
    rail.scrollTo({ left: to, behavior: 'smooth' });
  }));
  paint();
})();



/* ---------- Carrossel 3D olho de peixe: abas, setas, gira sozinho e arrasta ---------- */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wrapN = (d, N) => { d = ((d % N) + N) % N; return d > N / 2 ? d - N : d; };
  const all = [];
  document.querySelectorAll('.cf').forEach(cf => {
    const items = Array.from(cf.querySelectorAll('.cf-item'));
    const N = items.length; if (!N) return;
    const pane = cf.closest('.cf-pane');
    const dotsBox = pane && pane.querySelector('.cf-dots');
    const dots = items.map(() => { const d = document.createElement('i'); dotsBox && dotsBox.appendChild(d); return d; });
    const wide = cf.classList.contains('cf-wide');
    const st = { cf, items, since: 0, pos: 0, target: 0, dragging: false, startX: 0, startPos: 0, moved: 0, lastMove: 0, visible: false, cur: -1 };
    const gapK = wide ? 0.55 : 0.62;
    const layout = () => {
      const w = items[0].offsetWidth || 250, gap = w * gapK;
      items.forEach((el, i) => {
        const d = wrapN(i - st.pos, N), a = Math.abs(d);
        const x = d * gap * (1 + a * 0.08);
        const z = -Math.pow(a, 1.35) * w * (wide ? 0.4 : 0.55);
        const ry = Math.max(-62, Math.min(62, -d * (wide ? 30 : 38)));
        const s = 1 - Math.min(a, 3) * 0.06;
        el.style.transform = `translate(-50%,-50%) translateX(${x}px) translateZ(${z}px) rotateY(${ry}deg) scale(${s})`;
        el.style.opacity = a > 3.2 ? 0 : 1 - Math.max(0, a - 2.2);
        el.style.zIndex = String(100 - Math.round(a * 10));
        el.style.setProperty('--sh', Math.min(1, a * 0.7).toFixed(2));
      });
      const c = ((Math.round(st.pos) % N) + N) % N;
      if (c !== st.cur) {
        st.cur = c; st.since = performance.now();
        dots.forEach((d, i) => d.classList.toggle('on', i === c));
        items.forEach((el, i) => {
          const v = el.querySelector('video'); if (!v) return;
          if (Math.abs(wrapN(i - c, N)) <= 1 && st.visible) { v.preload = 'auto'; v.muted = true; const p = v.play(); if (p) p.catch(() => {}); }
          else v.pause();
        });
      }
    };
    st.step = () => {
      if (!st.dragging) st.pos += (st.target - st.pos) * (reduce ? 1 : 0.09);
      if (!(pane && pane.hidden)) layout();
    };
    const go = n => { st.target = Math.round(st.target) + n; st.lastMove = performance.now(); };
    st.go = go;
    const px = () => (items[0].offsetWidth || 250) * gapK;
    cf.addEventListener('pointerdown', e => {
            st.dragging = true; st.startX = e.clientX; st.startPos = st.pos; st.moved = 0; st.lastMove = performance.now();
      cf.classList.add('drag'); cf.setPointerCapture(e.pointerId);
    });
    cf.addEventListener('pointermove', e => {
      if (!st.dragging) return;
      st.moved = Math.abs(e.clientX - st.startX);
      st.pos = st.startPos - (e.clientX - st.startX) / px(); st.lastMove = performance.now();
    });
    const end = () => { if (!st.dragging) return; st.dragging = false; st.target = Math.round(st.pos); cf.classList.remove('drag'); st.lastMove = performance.now(); };
    cf.addEventListener('pointerup', end); cf.addEventListener('pointercancel', end); cf.addEventListener('lostpointercapture', end);
    const box = cf.parentElement;
    box.querySelector('.cf-prev').addEventListener('click', () => go(-1));
    box.querySelector('.cf-next').addEventListener('click', () => go(1));
    cf.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); });
    items.forEach((el, i) => el.addEventListener('click', () => { if (st.moved > 6) return; go(wrapN(i - Math.round(st.target), N)); }));
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(en => { st.visible = en.isIntersecting; st.cur = -1; }), { threshold: 0.15 }).observe(cf);
    else st.visible = true;
    all.push(st);
  });
  if (!all.length) return;
  const loop = () => { all.forEach(s => s.step()); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  // cada vídeo fica uns 15 s no centro (ou o vídeo inteiro, até 30 s) antes de girar
  setInterval(() => {
    const now = performance.now();
    all.forEach(s => {
      const pane = s.cf.closest('.cf-pane');
      if (reduce || s.dragging || !s.visible || document.hidden || (pane && pane.hidden)) return;
      if (now - s.lastMove < 6000) return;
      const v = s.items && s.items[s.cur] && s.items[s.cur].querySelector('video');
      const dur = v && isFinite(v.duration) && v.duration > 0 ? v.duration * 1000 : 7000;
      if (now - (s.since || 0) < Math.max(15000, Math.min(dur, 30000)) + 400) return;
      s.target = Math.round(s.target) + 1;
    });
  }, 500);
  // abas
  const tabs = Array.from(document.querySelectorAll('.cf-tab'));
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => { const on = x === t; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); });
    document.querySelectorAll('.cf-pane').forEach(p => {
      const show = p.id === 'pane-' + t.dataset.pane;
      p.hidden = !show;
      p.querySelectorAll('video').forEach(v => { if (!show) v.pause(); });
    });
    all.forEach(s => { s.cur = -1; });
  }));
})();
