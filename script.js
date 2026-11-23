(() => {
  const nav=document.querySelector('#nav');
  const scroll=()=>{const max=document.documentElement.scrollHeight-innerHeight;document.documentElement.style.setProperty('--sp',max>0?scrollY/max:0);nav?.classList.toggle('scrolled',scrollY>30)};
  addEventListener('scroll',scroll,{passive:true});scroll();
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-filter]').forEach(b=>{const on=b===button;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
    document.querySelectorAll('[data-category]').forEach(card=>card.hidden=button.dataset.filter!=='Todos os projetos'&&card.dataset.category!==button.dataset.filter);
  }));
  document.querySelector('#briefing').addEventListener('submit',async e=>{e.preventDefault();const message=document.querySelector('#project-message').value.trim();const status=document.querySelector('#contact-status');try{await navigator.clipboard.writeText(message);status.textContent='Mensagem copiada. Os canais de contato estarão disponíveis em breve.'}catch{status.textContent='Sua mensagem está pronta. Selecione o texto para copiar.'}});
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.animate([{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)'}],{duration:600,easing:'ease-out'});io.unobserve(e.target)}}),{threshold:.1});document.querySelectorAll('.service-card,.project-card,.about-photo').forEach(e=>io.observe(e))}
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
