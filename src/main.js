import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/archivo/wdth-italic.css';
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import './style.css';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- nav: solid on scroll, burger, active link ---------- */
(function () {
  const nav = $('#nav'), burger = $('#burger'), menu = $('#mobile-menu'), dock = $('#dock');
  const hero = $('#top');
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('scrolled', y > 30);
    if (dock) dock.classList.toggle('show', y > hero.offsetHeight * 0.6);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    menu.hidden = open;
    nav.classList.add('scrolled');
  });
  $$('a', menu).forEach(a => a.addEventListener('click', () => {
    burger.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
  }));

  const links = $$('.nav-links a');
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && map.has(e.target.id)) {
        links.forEach(l => l.classList.remove('active'));
        map.get(e.target.id).classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
})();

/* ---------- reveal on scroll ---------- */
(function () {
  const els = $$('.reveal');
  if (reduce || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const sibs = [...e.target.parentElement.children].filter(c => c.classList.contains('reveal'));
      const i = Math.max(0, sibs.indexOf(e.target));
      e.target.style.transitionDelay = Math.min(i * 90, 450) + 'ms';
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(e => io.observe(e));
})();

/* ---------- marquees: duplicate content for a seamless loop ---------- */
$$('.ticker-track, .foot-marquee-track, .rv-track').forEach(t => {
  const clone = t.innerHTML;
  t.insertAdjacentHTML('beforeend', clone);
  [...t.children].slice(t.children.length / 2).forEach(c => c.setAttribute('aria-hidden', 'true'));
});

/* ---------- videos: lazy load, hero autoplay, tap to play with sound ---------- */
(function () {
  const vids = $$('.lazy-video');
  const load = v => {
    if (v.dataset.loaded) return;
    $$('source', v).forEach(s => { s.src = s.dataset.src; });
    v.load();
    v.dataset.loaded = '1';
  };
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) {
        load(v);
        if (!v.classList.contains('tap-video') && !reduce) v.play().catch(() => {});
      } else if (!v.paused) {
        v.pause();
        v.closest('.phone')?.classList.remove('playing');
      }
    });
  }, { rootMargin: '200px' });
  vids.forEach(v => io.observe(v));

  $$('.tap-video').forEach(v => {
    const phone = v.closest('.phone');
    const btn = $('.play', phone);
    const start = () => {
      load(v);
      $$('.tap-video').forEach(o => { if (o !== v && !o.paused) { o.pause(); o.closest('.phone').classList.remove('playing'); } });
      v.muted = false;
      v.play().then(() => phone.classList.add('playing')).catch(() => {});
    };
    btn.addEventListener('click', start);
    v.addEventListener('click', () => {
      if (v.paused) start(); else { v.pause(); phone.classList.remove('playing'); }
    });
  });
})();

/* ---------- before / after slider ---------- */
(function () {
  const ba = $('#ba'); if (!ba) return;
  const range = $('.ba-range', ba);
  const before = $('.ba-before', ba), after = $('.ba-after', ba);
  const bl = $('.bl', ba), al = $('.al', ba);
  const set = v => { ba.style.setProperty('--pos', v + '%'); range.value = v; };
  range.addEventListener('input', () => set(range.value));

  // gentle intro sweep the first time it's seen
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    if (reduce) return;
    ba.classList.add('hint');
    let t0;
    const from = 50, path = [78, 22, 50];
    let leg = 0, start = from;
    const step = ts => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / 700, 1);
      const ease = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      set(start + (path[leg] - start) * ease);
      if (p < 1) requestAnimationFrame(step);
      else if (++leg < path.length) { start = path[leg - 1]; t0 = 0; requestAnimationFrame(step); }
    };
    requestAnimationFrame(step);
  }, { threshold: 0.6 });
  io.observe(ba);

  // preload all pairs so tab switches are instant
  $$('.ba-tabs button').forEach(b => { new Image().src = b.dataset.before; new Image().src = b.dataset.after; });
  $$('.ba-tabs button').forEach(b => b.addEventListener('click', () => {
    $$('.ba-tabs button').forEach(o => o.setAttribute('aria-selected', String(o === b)));
    before.src = b.dataset.before; after.src = b.dataset.after;
    bl.textContent = b.dataset.bl; al.textContent = b.dataset.al;
    set(50);
  }));
})();

/* ---------- scroll-stack: customer journey ---------- */
(function () {
  if (reduce) return;
  const wrap = $('#steps'); if (!wrap) return;
  const cards = $$('.step', wrap);
  if (cards.length < 2) return;
  const end = document.createElement('div');
  end.className = 'stack-end'; end.setAttribute('aria-hidden', 'true');
  wrap.appendChild(end);

  const CFG = { stackPosition: 0.16, scaleEndPosition: 0.07, itemStackDistance: 14, itemScale: 0.03, blurAmount: 0.8 };
  const baseScale = 1 - (cards.length - 1) * CFG.itemScale;
  let rel = [], relEnd = 0, deckBottom = 0, vh = 0, last = [], queued = false;

  function measure() {
    vh = innerHeight;
    const saved = cards.map(c => c.style.transform);
    cards.forEach(c => { c.style.transform = 'none'; c.style.filter = ''; });
    const wrapTop = wrap.getBoundingClientRect().top;
    rel = cards.map(c => c.getBoundingClientRect().top - wrapTop);
    relEnd = end.getBoundingClientRect().top - wrapTop;
    const tallest = Math.max(...cards.map(c => c.offsetHeight));
    deckBottom = CFG.stackPosition * vh + CFG.itemStackDistance * (cards.length - 1) + tallest;
    cards.forEach((c, i) => { c.style.transform = saved[i]; });
    last = [];
    apply();
  }
  const prog = (v, a, b) => v < a ? 0 : v > b ? 1 : (v - a) / (b - a);
  function apply() {
    const top = scrollY;
    const wrapTop = wrap.getBoundingClientRect().top + top;
    const stackPx = CFG.stackPosition * vh, scaleEndPx = CFG.scaleEndPosition * vh;
    const pinEnd = wrapTop + relEnd - deckBottom;
    let topIndex = 0;
    cards.forEach((_, k) => { if (top >= wrapTop + rel[k] - stackPx - CFG.itemStackDistance * k) topIndex = k; });
    cards.forEach((c, i) => {
      const cardTop = wrapTop + rel[i];
      const pinStart = cardTop - stackPx - CFG.itemStackDistance * i;
      const target = baseScale + i * CFG.itemScale;
      const scale = 1 - prog(top, pinStart, cardTop - scaleEndPx) * (1 - target);
      let ty = 0;
      if (top >= pinStart) ty = (top > pinEnd ? pinEnd : top) - cardTop + stackPx + CFG.itemStackDistance * i;
      const blur = i < topIndex ? (topIndex - i) * CFG.blurAmount : 0;
      const t = { y: Math.round(ty * 100) / 100, s: Math.round(scale * 1000) / 1000, b: Math.round(blur * 100) / 100 };
      const p = last[i];
      if (p && Math.abs(p.y - t.y) < 0.1 && Math.abs(p.s - t.s) < 0.001 && Math.abs(p.b - t.b) < 0.1) return;
      c.style.transform = `translate3d(0,${t.y}px,0) scale(${t.s})`;
      c.style.filter = t.b > 0 ? `blur(${t.b}px)` : '';
      last[i] = t;
    });
  }
  addEventListener('scroll', () => {
    if (queued) return; queued = true;
    requestAnimationFrame(() => { queued = false; apply(); });
  }, { passive: true });
  addEventListener('resize', measure);
  wrap.classList.add('is-stacking');
  measure();
  if (window.ResizeObserver) new ResizeObserver(measure).observe(document.body);
})();

/* ---------- count-up numbers + milestone fill ---------- */
(function () {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const el = e.target;
      if (el.id === 'ms-track') { el.style.setProperty('--fill', 1); return; }
      const to = parseFloat(el.dataset.to), dec = parseInt(el.dataset.dec || '0', 10);
      if (reduce) { el.textContent = to.toFixed(dec); return; }
      el.textContent = (0).toFixed(dec);
      const t0 = performance.now(), dur = 1400;
      const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        const v = to * (1 - Math.pow(1 - p, 3));
        el.textContent = v.toFixed(dec);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  $$('.count').forEach(c => io.observe(c));
  const ms = $('#ms-track'); if (ms) io.observe(ms);
})();

/* ---------- "add to my quote" buttons ---------- */
$$('.add-svc').forEach(b => b.addEventListener('click', () => {
  const sel = $('#service');
  if (sel) sel.value = b.dataset.svc;
  $('#quote').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}));

/* ---------- quote form (demo: nothing is sent) ---------- */
(function () {
  const form = $('#quote-form'), err = $('#form-err'), thanks = $('#thanks');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const req = ['name', 'phone', 'postcode'].map(n => form.elements[n]);
    let ok = true;
    req.forEach(i => {
      const bad = !i.value.trim();
      i.classList.toggle('invalid', bad);
      if (bad) ok = false;
    });
    err.hidden = ok;
    if (!ok) { req.find(i => !i.value.trim()).focus(); return; }
    $('#thanks-name').textContent = form.elements.name.value.trim().split(' ')[0];
    form.hidden = true;
    thanks.hidden = false;
    thanks.focus();
  });
  form.addEventListener('input', e => { if (e.target.value.trim()) e.target.classList.remove('invalid'); });
})();

/* ---------- terms dialog ---------- */
(function () {
  const dlg = $('#terms');
  const open = () => { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); };
  $('#open-terms')?.addEventListener('click', open);
  $$('[data-open-terms]').forEach(b => b.addEventListener('click', open));
  $('#close-terms').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
})();

/* ---------- button ripple + magnetic pills ---------- */
(function () {
  if (reduce) return;
  document.addEventListener('pointerdown', e => {
    const el = e.target.closest('.btn, .pill'); if (!el) return;
    const r = el.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'btn-ripple';
    dot.style.left = (e.clientX - r.left) + 'px';
    dot.style.top = (e.clientY - r.top) + 'px';
    dot.addEventListener('animationend', () => dot.remove());
    el.appendChild(dot);
    setTimeout(() => dot.remove(), 900);
  }, { passive: true });

  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  $$('.magnetic').forEach(el => {
    let raf = null, tx = 0, ty = 0, cx = 0, cy = 0, sc = 1, target = 1;
    const frame = () => {
      cx += (tx - cx) * .18; cy += (ty - cy) * .18; sc += (target - sc) * .18;
      el.style.transform = `translate3d(${cx.toFixed(2)}px,${cy.toFixed(2)}px,0) scale(${sc.toFixed(3)})`;
      raf = (Math.abs(tx - cx) > .1 || Math.abs(ty - cy) > .1 || Math.abs(target - sc) > .002) ? requestAnimationFrame(frame) : null;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - r.left - r.width / 2) * .35; ty = (e.clientY - r.top - r.height / 2) * .35; target = 1.08; kick();
    });
    el.addEventListener('pointerleave', () => { tx = 0; ty = 0; target = 1; kick(); });
  });
})();

/* ---------- hero parallax on the wheel ---------- */
(function () {
  if (reduce) return;
  const wheel = $('.wheel'); if (!wheel) return;
  let q = false;
  addEventListener('scroll', () => {
    if (q) return; q = true;
    requestAnimationFrame(() => { q = false; wheel.style.translate = `0 ${Math.min(scrollY, 900) * 0.18}px`; });
  }, { passive: true });
})();
