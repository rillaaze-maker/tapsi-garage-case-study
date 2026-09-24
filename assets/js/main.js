(() => {
  'use strict';

  /* ---------- load every screenshot (one bundle), then start ---------- */
  const EST = 3.35e6;
  const loader = document.getElementById('loader');
  const bar = document.getElementById('loaderBar');
  const pctEl = document.getElementById('loaderPct');
  const setP = p => { const v = Math.min(99, Math.round(p * 100)); bar.style.transform = `scaleX(${v / 100})`; pctEl.textContent = v + '%'; };

  function loadScreens() {
    return new Promise((resolve, reject) => {
      const inject = code => { const s = document.createElement('script'); if (code) s.textContent = code; else s.src = 'assets/screens.js'; s.onload = resolve; s.onerror = reject; document.head.appendChild(s); if (code) resolve(); };
      if (location.protocol === 'file:') { inject(null); return; }
      const x = new XMLHttpRequest();
      x.open('GET', 'assets/screens.js');
      x.onprogress = e => setP(e.lengthComputable ? e.loaded / e.total : e.loaded / EST);
      x.onload = () => (x.status >= 200 && x.status < 300 ? inject(x.responseText) : reject(new Error(x.status)));
      x.onerror = reject;
      x.send();
    });
  }

  loadScreens()
    .then(() => {
      setP(1); pctEl.textContent = '100%';
      init();
      document.body.classList.remove('loading');
      loader.classList.add('done');
      setTimeout(() => loader.remove(), 500);
    })
    .catch(() => {
      loader.querySelector('p').textContent = "Couldn't load the screenshots. Please refresh the page.";
    });

  function init() {
  const W = 591, H = 1280;
  const src = id => (window.SCREENS && window.SCREENS[id]) || `assets/screens/${id}.webp`;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const pct = (v, t) => (v / t * 100).toFixed(3) + '%';
  const rect = s => s.split(',').map(Number);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function img(id, cls = '', alt = '') {
    const i = new Image();
    i.src = src(id); i.alt = alt; i.loading = 'lazy'; i.decoding = 'async';
    if (cls) i.className = cls;
    return i;
  }

  /* ---------- phones & spotlights ---------- */
  function fillPhone(el) {
    const s = document.createElement('div');
    s.className = 'screen';
    s.appendChild(img(el.dataset.img, '', el.dataset.alt || ''));
    el.appendChild(s);
    el.dataset.lb = el.dataset.img;
  }

  function buildSpot(el) {
    const id = el.dataset.img;
    const [x1, y1, x2, y2] = rect(el.dataset.r);
    const phone = document.createElement('div');
    phone.className = 'phone';
    phone.dataset.lb = id;
    const s = document.createElement('div');
    s.className = 'screen';
    s.appendChild(img(id, 'base'));
    s.appendChild(img(id, 'sharp', el.dataset.alt || ''));
    const ring = document.createElement('span');
    ring.className = 'ring';
    Object.assign(ring.style, { left: pct(x1, W), top: pct(y1, H), width: pct(x2 - x1, W), height: pct(y2 - y1, H) });
    s.appendChild(ring);
    if (el.dataset.ghost) {
      const g = document.createElement('span');
      g.className = 'ghost';
      g.textContent = el.dataset.ghost;
      Object.assign(g.style, { left: pct(x1 + 24, W), right: pct(W - x2 + 24, W), top: pct(y2 + 14, H), height: pct(56, H) });
      s.appendChild(g);
    }
    phone.appendChild(s);
    el.appendChild(phone);
    el.style.setProperty('--clip', `inset(${pct(y1, H)} ${pct(W - x2, W)} ${pct(H - y2, H)} ${pct(x1, W)} round 8px)`);
  }

  $$('.phone[data-img]').forEach(fillPhone);
  $$('.spot[data-img]').forEach(buildSpot);

  /* ---------- JTBD score ---------- */
  const PATHS = {
    A: { name: 'Path A · Catalog', imgs: ['S18','S16','S19','S03','S15','S12','S08','S07'],
         em: ['no','no','no','no','no','no','no','mid'], pl: ['mid','no','mid','ok','mid','ok','no','ok'] },
    B: { name: 'Path B · On-site service', imgs: ['S18','O16','O15','O14','O10','O07','O06','O01'],
         em: ['no','mid','no','mid','no','no','no','mid'], pl: ['mid','ok','mid','ok','mid','ok','mid','mid'] },
  };
  const score = $('#score');
  if (score) {
    const head = document.createElement('div');
    head.className = 'score-row head';
    head.innerHTML = `<span></span><span>${PATHS.A.name}</span><span>${PATHS.B.name}</span>`;
    score.appendChild(head);
    [['em', 'Emergency', 'Stuck on the road'], ['pl', 'Planned', 'Replacing it early']].forEach(([key, label, sub]) => {
      const row = document.createElement('div');
      row.className = 'score-row';
      row.innerHTML = `<span class="score-k">${label}<small>${sub}</small></span>`;
      ['A', 'B'].forEach(p => {
        const cell = document.createElement('div');
        const thumbs = document.createElement('div');
        thumbs.className = 'thumbs';
        PATHS[p].imgs.forEach((id, i) => {
          const t = document.createElement('button');
          t.type = 'button';
          t.className = 'thumb ' + PATHS[p][key][i];
          t.dataset.lb = id;
          t.setAttribute('aria-label', `${p}${i + 1}: ${PATHS[p][key][i]}`);
          t.appendChild(img(id));
          thumbs.appendChild(t);
        });
        const ok = PATHS[p][key].filter(v => v === 'ok').length;
        const tally = document.createElement('p');
        tally.className = 'tally';
        tally.innerHTML = `<b>${ok} of 8</b> screens fully serve them`;
        cell.append(thumbs, tally);
        row.appendChild(cell);
      });
      score.appendChild(row);
    });
  }

  /* ---------- heuristic matrix ---------- */
  const HEUR = ['Visibility of system status','Match with the real world','User control and freedom','Consistency and standards','Error prevention','Recognition rather than recall','Flexibility and efficiency','Minimalist design','Recover from errors','Help and documentation'];
  const FIND = [
    ['C1',6,3],['C2',10,3],['C3',5,3],['C4',10,2],['C5',10,2],['C6',1,2],['C7',8,2],
    ['S1',7,3],['S2',2,3],['S3',1,3],['S4',4,3],['S5',7,2],['S6',6,2],['S7',8,2],
    ['A1',9,2],['A2',2,2],['A3',8,2],['A4',7,2],['A5',4,1],['A6',4,1],['A7',4,1],['A8',6,1],
  ];
  const GOOD = [6, 1, 1, 10, 5, 9, 3, 8];
  const hm = $('#hmatrix');
  if (hm) {
    const cell = (html, cls = '') => { const d = document.createElement('div'); d.className = 'hm-cell ' + cls; d.innerHTML = html; hm.appendChild(d); };
    ['Heuristic', 'Catalog path', 'On-site path', 'App-wide', 'Works well'].forEach(t => cell(t, 'hd'));
    HEUR.forEach((name, i) => {
      const h = i + 1;
      cell(`<b>H${h}</b><span>${name}</span>`, 'hn');
      ['C', 'S', 'A'].forEach(g => {
        cell(FIND.filter(f => f[0][0] === g && f[1] === h).map(f => `<span class="hdot s${f[2]}" title="${f[0]} · severity ${f[2]}">${f[0]}</span>`).join(''));
      });
      const n = GOOD.filter(x => x === h).length;
      cell(n ? Array.from({ length: n }, () => '<span class="hdot g" title="Works well">✓</span>').join('') : '');
    });
  }

  /* ---------- root-cause diagram ---------- */
  function layoutRoot() {
    const root = $('#root');
    if (!root) return;
    const nodes = $$('.root-nodes li', root);
    let svg = '<circle cx="300" cy="300" r="250"/>';
    nodes.forEach((li, i) => {
      const a = (-90 + 360 / nodes.length * i) * Math.PI / 180;
      const x = 50 + 41.5 * Math.cos(a), y = 50 + 41.5 * Math.sin(a);
      li.style.left = x + '%';
      li.style.top = y + '%';
      svg += `<line x1="${(300 + 122 * Math.cos(a)).toFixed(1)}" y1="${(300 + 122 * Math.sin(a)).toFixed(1)}" x2="${(x * 6).toFixed(1)}" y2="${(y * 6).toFixed(1)}"/>`;
    });
    $('.root-lines', root).innerHTML = svg;
  }
  layoutRoot();

  /* ---------- gallery ---------- */
  const ONSITE = ['O16','O15','O13','O14','O12','O11','O10','O09','O08','O07','O06','O05','O04','O03','O02','O01'];
  const CATALOG = Array.from({ length: 81 }, (_, i) => 'S' + String(i + 1).padStart(2, '0'));
  const gallery = $('#gallery');
  function renderGallery(f) {
    gallery.innerHTML = '';
    [...ONSITE, ...CATALOG].filter(id => f === 'all' || id[0] === f).forEach((id, n) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'g-item';
      b.dataset.lb = id;
      b.setAttribute('aria-label', `Open screen ${n + 1}`);
      b.appendChild(img(id));
      const t = document.createElement('span');
      t.textContent = n + 1;
      b.appendChild(t);
      gallery.appendChild(b);
    });
  }
  if (gallery) renderGallery('all');
  $$('[data-gal]').forEach(b => b.addEventListener('click', () => {
    $$('[data-gal]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    renderGallery(b.dataset.gal);
  }));

  /* ---------- deck ---------- */
  const body = document.body;
  const ALL = $$('.slide');
  const QUICK = ALL.filter(s => s.hasAttribute('data-quick'));
  let path = 'full';
  let list = ALL;
  let idx = 0;

  $('[data-count="quick"]').textContent = `${QUICK.length} slides · ~4 min`;
  $('[data-count="full"]').textContent = `${ALL.length} slides · ~10 min`;

  function setPath(p, keepSlide) {
    const current = list[idx];
    path = p;
    list = p === 'quick' ? QUICK : ALL;
    body.classList.toggle('path-full', p === 'full');
    $$('.seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.path === p)));
    buildStory();
    let target = 0;
    if (keepSlide && current) {
      target = list.indexOf(current);
      if (target < 0) { // current slide isn't in the quick path: go to the nearest one before it
        const pos = ALL.indexOf(current);
        target = Math.max(0, list.findLastIndex(s => ALL.indexOf(s) <= pos));
      }
    }
    go(target, 0, true);
  }

  function buildStory() {
    const story = $('#story');
    story.innerHTML = '';
    const chapters = [];
    list.forEach((s, i) => {
      const ch = s.dataset.ch;
      let c = chapters[chapters.length - 1];
      if (!c || c.name !== ch) { c = { name: ch, items: [] }; chapters.push(c); }
      c.items.push(i);
    });
    chapters.forEach(c => {
      const wrap = document.createElement('div');
      wrap.className = 'chap';
      wrap.style.setProperty('--n', c.items.length);
      wrap.dataset.ch = c.name;
      wrap.innerHTML = `<span class="chap-name">${c.name}</span><div class="dots"></div>`;
      const dots = $('.dots', wrap);
      c.items.forEach(i => {
        const d = document.createElement('button');
        d.type = 'button';
        d.className = 'dot';
        d.dataset.i = i;
        d.setAttribute('aria-label', `Slide ${i + 1}: ${list[i].dataset.title}`);
        d.innerHTML = `<i></i><span class="tip">${i + 1}. ${list[i].dataset.title}</span>`;
        d.addEventListener('click', () => go(i));
        dots.appendChild(d);
      });
      story.appendChild(wrap);
    });
  }

  function playVideos(slide) {
    $$('video').forEach(v => { if (!slide.contains(v)) { v.autoplay = false; v.pause(); } });
    if (reduced) return;
    $$('video', slide).forEach(v => {
      v.autoplay = true;
      if (!v.getAttribute('src') && v.dataset.src) v.src = v.dataset.src;
      v.play().catch(() => {});
    });
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && list[idx]) playVideos(list[idx]);
  });

  function activateSpots(slide) {
    playVideos(slide);
    $$('.spot.on').forEach(s => { if (!slide.contains(s)) s.classList.remove('on'); });
    setTimeout(() => { if (list[idx] === slide) $$('.spot', slide).forEach(s => s.classList.add('on')); }, reduced ? 0 : 280);
  }

  function go(i, dir, instant) {
    i = Math.max(0, Math.min(list.length - 1, i));
    const prevSlide = list[idx];
    const next = list[i];
    const d = dir ?? (i >= idx ? 1 : -1);
    ALL.forEach(s => {
      if (s !== next && s !== prevSlide) s.classList.remove('active', 'leaving');
    });
    if (prevSlide && prevSlide !== next && !instant) {
      prevSlide.style.setProperty('--to', `${-24 * d}px`);
      prevSlide.classList.add('leaving');
      prevSlide.classList.remove('active');
    } else if (prevSlide && prevSlide !== next) {
      prevSlide.classList.remove('active', 'leaving');
    }
    next.style.setProperty('--from', `${24 * d}px`);
    next.classList.remove('leaving');
    next.scrollTop = 0;
    idx = i;
    requestAnimationFrame(() => { if (list[idx] === next) next.classList.add('active'); });
    activateSpots(next);
    updateChrome();
    history.replaceState(null, '', `?path=${path}#/${next.dataset.id}`);
  }

  function updateChrome() {
    const slide = list[idx];
    const hasScreens = !!slide.querySelector('.phone[data-lb], .spot, .thumb, .g-item, .phone.redesign:not(.is-empty)');
    $('#zoomTip').hidden = !hasScreens;
    $('#counter').textContent = `${idx + 1} / ${list.length}`;
    $('#prev').disabled = idx === 0;
    $('#next').disabled = idx === list.length - 1;
    const nx = list[idx + 1];
    $('#nextLabel').textContent = nx ? `Next: ${nx.dataset.title}` : 'The end';
    $$('.dot').forEach(d => {
      const i = Number(d.dataset.i);
      d.classList.toggle('done', i < idx);
      d.classList.toggle('current', i === idx);
      if (i === idx) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
    });
    const ch = list[idx].dataset.ch;
    let seen = false;
    $$('.chap').forEach(c => {
      const active = c.dataset.ch === ch;
      c.classList.toggle('active', active);
      c.classList.toggle('done', !seen && !active);
      if (active) seen = true;
    });
    document.title = `${list[idx].dataset.title} · Tapsi Garage case study`;
  }

  function start(p, slideId) {
    body.classList.remove('at-landing');
    list = p === 'quick' ? QUICK : ALL;
    let i = 0;
    if (slideId) {
      const s = ALL.find(x => x.dataset.id === slideId);
      if (s && !list.includes(s)) { p = 'full'; list = ALL; }
      i = Math.max(0, list.indexOf(s));
    }
    idx = i;
    setPathSilently(p);
    go(i, 1, true);
    $('#next').focus({ preventScroll: true });
  }
  function setPathSilently(p) {
    path = p;
    body.classList.toggle('path-full', p === 'full');
    $$('.seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.path === p)));
    buildStory();
  }
  function toLanding() {
    body.classList.add('at-landing');
    history.replaceState(null, '', location.pathname);
    document.title = "A dead battery isn't a shopping trip · Tapsi Garage case study";
    $('[data-start="quick"]').focus({ preventScroll: true });
  }

  $$('[data-start]').forEach(b => b.addEventListener('click', () => start(b.dataset.start)));
  $$('.seg button').forEach(b => b.addEventListener('click', () => { if (b.dataset.path !== path) setPath(b.dataset.path, true); }));
  $('#prev').addEventListener('click', () => go(idx - 1, -1));
  $('#next').addEventListener('click', () => go(idx + 1, 1));
  $('#toLanding').addEventListener('click', toLanding);
  $('#restart').addEventListener('click', toLanding);
  $('#toFull').addEventListener('click', () => setPath('full', false));

  // deep links: ?path=quick#/slide-id
  const params = new URLSearchParams(location.search);
  const hashId = location.hash.startsWith('#/') ? location.hash.slice(2) : '';
  if (hashId || params.get('path')) start(params.get('path') === 'quick' ? 'quick' : 'full', hashId);

  addEventListener('hashchange', () => {
    const id = location.hash.startsWith('#/') ? location.hash.slice(2) : '';
    if (!id) return;
    if (body.classList.contains('at-landing')) { start(path, id); return; }
    const s = ALL.find(x => x.dataset.id === id);
    if (!s || s === list[idx]) return;
    if (!list.includes(s)) { list = ALL; setPathSilently('full'); }
    go(list.indexOf(s));
  });

  /* ---------- keyboard & swipe ---------- */
  const index = $('#index'), lb = $('#lightbox');
  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Escape') { closeOverlay(lb); closeOverlay(index); return; }
    if (body.classList.contains('at-landing') || !lb.hidden || !index.hidden) return;
    if (['ArrowRight', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.target.closest('button'))) { e.preventDefault(); go(idx + 1, 1); }
    else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(idx - 1, -1); }
    else if (e.key === 'Home') go(0, -1);
    else if (e.key === 'End') go(list.length - 1, 1);
  });

  let tx = 0, ty = 0, tIgnore = false;
  const deck = $('#deck');
  deck.addEventListener('touchstart', e => {
    const t = e.touches[0];
    tx = t.clientX; ty = t.clientY;
    tIgnore = !!e.target.closest('.hscroll, .gallery');
  }, { passive: true });
  deck.addEventListener('touchend', e => {
    if (tIgnore) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - tx, dy = t.clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) go(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  }, { passive: true });

  // drag horizontal flows with a mouse
  $$('.hscroll').forEach(el => {
    let down = false, sx = 0, sl = 0, moved = false;
    el.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = el.scrollLeft; });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 5) moved = true; if (moved) el.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { down = false; });
    el.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  });

  /* ---------- overlays ---------- */
  let lastFocus = null;
  function openOverlay(o) { lastFocus = document.activeElement; o.hidden = false; $('.x', o)?.focus(); }
  function closeOverlay(o) { if (o.hidden) return; o.hidden = true; lastFocus?.focus?.({ preventScroll: true }); }
  index.addEventListener('click', e => { if (e.target === index || e.target.closest('[data-close]')) closeOverlay(index); });
  // screen viewer: anything outside the phone, the zoom and the caption closes it
  lb.addEventListener('click', e => {
    if (e.target.closest('[data-close]') || !e.target.closest('.phone, .lb-zoom, .lb-side p')) closeOverlay(lb);
  });

  $('#openIndex').addEventListener('click', () => {
    const box = $('#indexList');
    box.innerHTML = '';
    let lastCh = '';
    ALL.forEach(s => {
      if (s.dataset.ch !== lastCh) {
        lastCh = s.dataset.ch;
        const h = document.createElement('p');
        h.className = 'idx-ch';
        h.textContent = lastCh;
        box.appendChild(h);
      }
      const inPath = list.includes(s);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'idx-item' + (s === list[idx] ? ' current' : '') + (inPath ? '' : ' off');
      b.innerHTML = `<span class="n">${inPath ? list.indexOf(s) + 1 : '·'}</span><span></span>${s.hasAttribute('data-quick') ? '<span class="q">Quick</span>' : ''}`;
      b.children[1].textContent = s.dataset.title;
      b.addEventListener('click', () => {
        closeOverlay(index);
        if (!inPath) { list = ALL; setPathSilently('full'); }
        go(list.indexOf(s));
      });
      box.appendChild(b);
    });
    openOverlay(index);
    $('.idx-item.current', box)?.scrollIntoView({ block: 'center' });
  });

  // inspect a screen: large phone + zoomed region
  document.addEventListener('click', e => {
    const rd = e.target.closest('.phone.redesign:not(.is-empty)');
    const t = rd || e.target.closest('[data-lb]');
    if (!t || t.closest('#lightbox') || t.closest('.landing')) return;
    const bodyEl = $('#lbBody');
    bodyEl.innerHTML = '';
    if (rd) {
      const p = document.createElement('div');
      p.className = 'phone';
      const s = document.createElement('div'); s.className = 'screen';
      const im = $('img', rd).cloneNode(); s.appendChild(im); p.appendChild(s);
      bodyEl.appendChild(p);
      openOverlay(lb);
      return;
    }
    const spot = t.closest('.spot');
    if (spot) {
      const clone = document.createElement('div');
      clone.className = 'spot on';
      clone.dataset.img = spot.dataset.img;
      clone.dataset.r = spot.dataset.r;
      clone.dataset.tone = spot.dataset.tone || 's3';
      if (spot.dataset.ghost) clone.dataset.ghost = spot.dataset.ghost;
      buildSpot(clone);
      bodyEl.appendChild(clone);
      const [x1, y1, x2, y2] = rect(spot.dataset.r);
      const side = document.createElement('div');
      side.className = 'lb-side';
      side.dataset.tone = clone.dataset.tone;
      let k = Math.min(2.2, 400 / (x2 - x1));
      if ((y2 - y1) * k > 420) k = 420 / (y2 - y1);
      const zoom = document.createElement('div');
      zoom.className = 'lb-zoom';
      Object.assign(zoom.style, {
        width: (x2 - x1) * k + 'px', height: (y2 - y1) * k + 'px',
        backgroundImage: `url(${src(spot.dataset.img)})`,
        backgroundSize: `${W * k}px ${H * k}px`, backgroundPosition: `${-x1 * k}px ${-y1 * k}px`,
      });
      side.appendChild(zoom);
      const cap = spot.closest('figure')?.querySelector('figcaption');
      if (cap) {
        const p = document.createElement('p');
        const strong = $('strong', cap) || $('b', cap);
        const rest = [...cap.querySelectorAll('span:not(.fmeta)')].map(x => x.textContent).join(' ');
        const fm = $('.fmeta', cap);
        const meta = fm ? [...fm.childNodes].map(n => n.textContent.trim()).filter(Boolean).join(' · ') : '';
        p.innerHTML = `${meta ? `<span>${meta}</span>` : ''}<strong></strong>${rest ? `<span></span>` : ''}`;
        $('strong', p).textContent = strong ? strong.textContent : '';
        if (rest) p.lastElementChild.textContent = rest;
        side.appendChild(p);
      }
      bodyEl.appendChild(side);
    } else {
      const p = document.createElement('div');
      p.className = 'phone';
      p.dataset.img = t.dataset.lb;
      fillPhone(p);
      delete p.dataset.lb;
      bodyEl.appendChild(p);
    }
    openOverlay(lb);
  });
  }
})();
