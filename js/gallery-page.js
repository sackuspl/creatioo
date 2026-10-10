(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hasDb = () => { try { return typeof db !== 'undefined' && !!db; } catch (e) { return false; } };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LABELS = { logo: 'Logotypy', banner: 'Bannery', miniatura: 'Miniatury', wizytowka: 'Wizytówki i ulotki', produkt: 'Produkty' };

  const mas = $('#mas'), bar = $('#fbar'), chips = $('#chips'), count = $('#gCount');
  const dlg = $('#lb'), lbImg = $('#lbImg'), lbCount = $('#lbCount'), lbCat = $('#lbCat'), lbTitle = $('#lbTitle'), lbDesc = $('#lbDesc'), lbMeta = $('#lbMeta');
  const lbPrev = $('#lbPrev'), lbNext = $('#lbNext'), lbClose = $('#lbClose'), lbStage = $('#lbStage');

  const cdn = (u, w) => {
    if (typeof u === 'string' && /res\.cloudinary\.com/.test(u) && u.includes('/upload/') && !/\/upload\/[^/]*(f_auto|q_auto|w_\d)/.test(u)) {
      return u.replace('/upload/', `/upload/f_auto,q_auto,w_${w}/`);
    }
    return u;
  };
  const abs = u => { try { return new URL(u, location.href).href; } catch (e) { return u; } };
  const withFallback = (img, original) => {
    img.addEventListener('error', () => { if (img.src !== abs(original)) img.src = original; }, { once: true });
  };

  let items = [], filter = 'all', list = [], current = 0, opener = null, pushed = false;

  const colsNow = () => (innerWidth >= 1000 ? 3 : 2);

  const loadRatio = p => new Promise(res => {
    if (p.ar) return res();
    const im = new Image();
    const done = () => { p.ar = im.naturalWidth && im.naturalHeight ? im.naturalWidth / im.naturalHeight : 4 / 3; res(); };
    const t = setTimeout(() => { p.ar = p.ar || 4 / 3; res(); }, 6000);
    im.onload = () => { clearTimeout(t); done(); };
    im.onerror = () => {
      if (im.src !== abs(p.img)) { im.src = p.img; return; }
      clearTimeout(t); p.ar = 4 / 3; res();
    };
    im.src = p.probe;
  });

  const skeleton = () => {
    const n = colsNow();
    const heights = [1.25, .8, 1, .75, 1.2, .9];
    mas.innerHTML = Array.from({ length: n }, (_, c) =>
      `<div class="mas-col">${[0, 1].map(r => `<div class="sk" style="aspect-ratio:1/${heights[(c * 2 + r) % heights.length]}"></div>`).join('')}</div>`
    ).join('');
  };

  const render = () => {
    const n = colsNow();
    const cols = Array.from({ length: n }, () => ({ h: 0, html: '' }));
    list.forEach((p, i) => {
      const c = cols.reduce((a, b) => (b.h < a.h ? b : a));
      c.h += 1 / (p.ar || 4 / 3);
      c.html += `<button class="shot" type="button" data-i="${i}" style="--ar:${(p.ar || 4 / 3).toFixed(4)}" aria-label="Powiększ: ${esc(p.alt)}"><img src="${esc(p.thumb)}" alt="${esc(p.alt)}" decoding="async"${i > 5 ? ' loading="lazy"' : ''}><span class="cap" aria-hidden="true"><b>${esc(p.title || p.label)}</b><small>${esc(p.label)}</small></span></button>`;
    });
    mas.innerHTML = cols.map(c => `<div class="mas-col">${c.html}</div>`).join('');
    mas.dataset.cols = n;
    mas.querySelectorAll('.shot img').forEach((img, i) => withFallback(img, list[i].img));
  };

  const visible = () => (filter === 'all' ? items : items.filter(p => p.cat === filter));

  const show = async (animate) => {
    list = visible();
    const word = n => (n === 1 ? 'projekt' : n >= 2 && n <= 4 ? 'projekty' : 'projektów');
    count.textContent = `${list.length} ${word(list.length)}`;
    if (animate && !reduce) { mas.classList.add('swap'); await new Promise(r => setTimeout(r, 160)); }
    await Promise.all(list.map(loadRatio));
    render();
    requestAnimationFrame(() => mas.classList.remove('swap'));
  };

  const buildChips = () => {
    const order = Object.keys(LABELS);
    const present = [...new Set(items.map(p => p.cat))].sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    const label = c => LABELS[c] || items.find(p => p.cat === c)?.catLabel || c;
    const defs = [['all', 'Wszystkie', items.length], ...present.map(c => [c, label(c), items.filter(p => p.cat === c).length])];
    chips.innerHTML = defs.map(([k, l, n]) => `<button class="chip" type="button" data-k="${esc(k)}" aria-pressed="${k === filter}">${esc(l)} <small>${n}</small></button>`).join('');
    bar.hidden = present.length < 2;
    chips.onclick = e => {
      const b = e.target.closest('.chip');
      if (!b || b.dataset.k === filter) return;
      filter = b.dataset.k;
      chips.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === b));
      const u = new URL(location.href);
      if (filter === 'all') u.searchParams.delete('kat'); else u.searchParams.set('kat', filter);
      history.replaceState(history.state, '', u);
      show(true);
    };
  };

  const fail = () => {
    bar.hidden = true;
    count.textContent = '';
    mas.innerHTML = '<div class="g-state"><h2>Nie udało się wczytać projektów</h2><p>Sprawdź połączenie i spróbuj ponownie. Jeśli problem wraca, napisz do mnie.</p><button class="btn" type="button" id="retry">Spróbuj ponownie</button></div>';
    $('#retry').onclick = load;
  };

  async function load() {
    skeleton();
    if (!hasDb()) return fail();
    let docs;
    try {
      const snap = await db.collection('gallery').orderBy('order').get();
      docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) { console.error(e); return fail(); }
    items = docs.filter(d => d.imageUrl).map((d, i) => {
      const cat = d.cat || 'inne';
      const label = LABELS[cat] || d.catLabel || cat;
      return {
        id: d.id, cat, label,
        title: d.title || '', desc: d.desc || '', tools: d.tools || '', time: d.time || '', year: d.year || '',
        img: d.imageUrl, probe: cdn(d.imageUrl, 80), thumb: cdn(d.imageUrl, 900), full: cdn(d.imageUrl, 1800),
        alt: d.title || `${label}, projekt ${i + 1}`
      };
    });
    if (!items.length) {
      bar.hidden = true;
      count.textContent = '';
      mas.innerHTML = '<div class="g-state"><h2>Galeria jest jeszcze pusta</h2><p>Nowe projekty pojawią się tutaj wkrótce.</p></div>';
      return;
    }
    const want = new URLSearchParams(location.search).get('kat');
    filter = want && items.some(p => p.cat === want) ? want : 'all';
    const wanted = new URLSearchParams(location.search).get('projekt');
    buildChips();
    await show(false);
    const at = wanted ? list.findIndex(p => p.id === wanted) : -1;
    if (at >= 0) {
      const u = new URL(location.href);
      u.searchParams.delete('projekt');
      history.replaceState(history.state, '', u);
      open(at);
    }
  }

  const paintLightbox = () => {
    const p = list[current];
    if (!p) return;
    lbImg.classList.remove('on');
    lbImg.onload = () => lbImg.classList.add('on');
    lbImg.onerror = () => { if (lbImg.src !== abs(p.img)) lbImg.src = p.img; else lbImg.classList.add('on'); };
    lbImg.src = p.full;
    lbImg.alt = p.alt;
    lbCount.textContent = `${current + 1} / ${list.length}`;
    lbCat.textContent = p.label;
    lbTitle.textContent = p.title;
    lbDesc.textContent = p.desc;
    const meta = [['Narzędzia', p.tools], ['Czas realizacji', p.time], ['Rok', p.year]].filter(m => m[1]);
    lbMeta.innerHTML = meta.map(([k, v]) => `<span><b>${k}</b>${esc(v)}</span>`).join('');
    lbPrev.disabled = current === 0;
    lbNext.disabled = current === list.length - 1;
    [current - 1, current + 1].forEach(i => { if (list[i]) { const im = new Image(); im.src = list[i].full; } });
  };

  const copyLink = $('#lbCopy');
  let copyTimer;
  copyLink.addEventListener('click', async () => {
    const p = list[current];
    if (!p) return;
    const link = (() => { const u = new URL(location.href); u.search = ''; u.hash = ''; u.searchParams.set('projekt', p.id); if (window.creatiooI18n?.language === 'en') u.searchParams.set('lang', 'en'); return u.href; })();
    let ok = false;
    try { await navigator.clipboard.writeText(link); ok = true; } catch (e) {
      const t = document.createElement('textarea');
      t.value = link; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { ok = document.execCommand('copy'); } catch (err) {}
      t.remove();
    }
    copyLink.textContent = ok ? 'Link skopiowany' : 'Nie udało się skopiować';
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { copyLink.textContent = 'Kopiuj link do projektu'; }, 2200);
  });

  const go = d => {
    const n = current + d;
    if (n < 0 || n >= list.length) return;
    current = n;
    paintLightbox();
  };

  const open = i => {
    current = i;
    opener = document.activeElement;
    paintLightbox();
    dlg.showModal();
    document.body.classList.add('lb-open');
    const u = new URL(location.href);
    u.searchParams.set('projekt', list[i].id);
    history.pushState({ lb: 1 }, '', u);
    pushed = true;
    lbClose.focus({ preventScroll: true });
  };

  mas.addEventListener('click', e => {
    const b = e.target.closest('.shot');
    if (b) open(+b.dataset.i);
  });
  lbClose.onclick = () => dlg.close();
  lbPrev.onclick = () => go(-1);
  lbNext.onclick = () => go(1);
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target === lbStage) dlg.close(); });
  dlg.addEventListener('close', () => {
    document.body.classList.remove('lb-open');
    if (pushed) { pushed = false; history.back(); }
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
  });
  addEventListener('popstate', () => { if (dlg.open) { pushed = false; dlg.close(); } });
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });

  let sx = 0, sy = 0, tracking = false;
  lbStage.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; tracking = true; sx = e.clientX; sy = e.clientY; });
  lbStage.addEventListener('pointerup', e => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
  });
  lbStage.addEventListener('pointercancel', () => { tracking = false; });

  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (items.length && String(colsNow()) !== mas.dataset.cols && list.length) render();
    }, 150);
  });

  load();
})();
