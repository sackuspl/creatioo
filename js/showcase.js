(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hover = matchMedia('(hover: hover)');
  const gallery = 'gallery/';
  const squares = new Set(['lumii', 'klima', 'puttviee', 'efekt-wow', 'nexus']);
  const works = [
    ['nexsite', 'Nexsite', 'Projekt logotypu', 'UhOyFjNvTYIyCtt12lXo', 'Logotyp Nexsite na szyldzie przy betonowej ścianie'],
    ['repsly', 'Repsly', 'Grafika na odzież', 'smNABKRHp8O2hNrnYgvM', 'Bluza z logo Repsly na turkusowym tle'],
    ['vibe', 'Vibe Roleplay', 'Projekt logotypu', 'z2NUyF74LuQiu49ENVFv', 'Różowy logotyp Vibe Roleplay na ciemnym tle'],
    ['mallow', 'Mallow', 'Grafika produktowa', 'VfRuQ4hxtB8L3HwCNwDW', 'Opakowania Mallow Pancake Mix w kolorze złota'],
    ['gtarealm', 'GTArealm', 'Gadżety firmowe', 'FrhNir1rybSpH8dsoOT3', 'Zielone kubki z napisami GTArealm'],
    ['klima', 'Klima', 'Materiały do druku', '0zBg1OpqtxdLrV4tVZ4o', 'Wizytówki firmy Klima na niebieskim tle'],
    ['coffee', 'Mallow Coffee', 'Grafika produktowa', 'kmRbEgrG8CiibvZuRY5E', 'Projekt opakowania kawy Mallow'],
    ['efekt-wow', 'EfektWOW', 'Materiały do druku', 'E3zV8NjOPCh5KSDzAwm6', 'Wizytówki EfektWOW w naturalnym świetle'],
    ['lumii', 'Lumii Cosmetics', 'Projekt logotypu', 'tvVBMOjPFooAd7IGctjj', 'Jasnoróżowy logotyp Lumii Cosmetics'],
    ['puttviee', 'Puttviee', 'Projekt logotypu', 't3bT5cWZi5Xn6fknfPJh', 'Fioletowy symbol i logotyp Puttviee'],
    ['nexus', 'Nexus Roleplay', 'Projekt logotypu', 'Hf0TNT5qPcJoE16hQjD4', 'Turkusowy logotyp Nexus Roleplay'],
    ['cloud9', 'Cloud 9 Espresso', 'Projekt logotypu', 'Wx5ge03HSQNnJLig1goV', 'Logotyp Cloud 9 Espresso w kolorach kawy'],
    ['5scripts', '5scripts', 'Projekt logotypu', 'm8VgiTcGVYotwRLXYMi0', 'Niebieski logotyp 5scripts na ciemnym tle'],
    ['venture', 'Venture', 'Baner reklamowy', 'hoFVnd3JZ0BFwHPCKn9N', 'Baner Venture News w czarno-białej stylistyce'],
    ['nexus-biznes', 'Nexus Roleplay', 'Baner na social media', 'zTeJ0CJGKJhtj3k94Tm6', 'Baner Nexus Roleplay z napisem Kup biznes'],
    ['nexus-konwoj', 'Nexus Roleplay', 'Baner na social media', 'c4z7HMS9geNWFmTeA4mD', 'Baner Nexus Roleplay z ciężarówką i napisem Konwój'],
    ['nexus-epidemia', 'Nexus Roleplay', 'Baner na social media', 'ZXXgBpDbHpoSzhk2Wtd8', 'Baner Nexus Roleplay z napisem Epidemia'],
    ['efekt-plot', 'EfektWOW', 'Baner reklamowy', 'Y0fXW5uh2ikUcuTtcUIn', 'Baner reklamowy EfektWOW na ogrodzeniu']
  ].map(([key, title, kind, id, alt]) => ({ key, title, kind, id, alt, src: `assets/images/featured/${key}.webp`, square: squares.has(key) ? `assets/images/featured/${key}-sq.webp` : `assets/images/featured/${key}.webp`, href: `${gallery}?projekt=${id}` }));
  const heroPool = ['nexsite', 'lumii', 'klima', 'nexus', 'efekt-wow', 'puttviee'].map(key => works.find(w => w.key === key));
  const cardKeys = ['repsly', 'vibe', 'mallow', 'gtarealm', 'nexus-biznes', 'coffee', 'cloud9', 'venture', 'klima', '5scripts', 'nexus-konwoj', 'efekt-plot', 'nexus-epidemia', 'efekt-wow', 'lumii'];
  const defaultCards = cardKeys.map(key => works.find(w => w.key === key));
  const frames = new Set();
  const reserved = new Set();
  const loaded = new Map();
  let workPool = defaultCards, workFrames = [], turn = 0;
  
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(e => { const frame = [...frames].find(f => f.link === e.target); if (frame) frame.visible = e.isIntersecting; });
  }, { threshold: .2 }) : null;
  const makeFrame = (link, item, caption) => {
    const frame = { link, item, caption, visible: !observer, busy: false, disposed: false };
    frames.add(frame); observer?.observe(link); return frame;
  };
  const hero = makeFrame($('.hero-image'), heroPool[0], $('.hero-label'));
  const available = frame => !frame.disposed && frame.visible && !frame.busy && !document.hidden &&
    !document.body.matches('.menu-open, .dialog-open, .lb-open') && !frame.link.matches(':focus-within') &&
    !(hover.matches && frame.link.matches(':hover'));
  const occupy = () => new Set([...frames].filter(f => !f.disposed).map(f => f.item.key).concat([...reserved]));
  const nextItem = (pool, frame) => {
    const used = occupy(), start = Math.max(0, pool.findIndex(w => w.key === frame.item.key));
    for (let i = 1; i <= pool.length; i++) {
      const item = pool[(start + i) % pool.length];
      if (!used.has(item.key)) return item;
    }
    return null;
  };
  const load = (item, src) => {
    if (!loaded.has(src)) {
      loaded.set(src, new Promise(resolve => {
        const img = new Image(); img.decoding = 'async';
        img.onload = async () => { try { await img.decode(); } catch (e) {} resolve(img); };
        img.onerror = () => { if (item.original && img.src !== item.original) img.src = item.original; else resolve(null); };
        img.src = src;
      }));
    }
    return loaded.get(src);
  };
  const caption = (frame, item) => {
    const title = $('b, h3', frame.caption), kind = $('span', frame.caption);
    if (title) title.textContent = item.title;
    if (kind) { kind.textContent = item.kind || ''; kind.hidden = !item.kind; }
    frame.link.href = item.href;
    frame.link.setAttribute('aria-label', `Zobacz projekt ${item.title} w galerii`);
  };
  async function swap(frame, item, manual = false) {
    if (!item || frame.busy || frame.disposed) return;
    frame.busy = true; reserved.add(item.key);
    try {
      const cached = await load(item, frame === hero ? item.square : item.src);
      if (!cached || frame.disposed || (!manual && !availableAfterLoad(frame))) return;
      const stage = frame === hero ? frame.link : $('.work-image', frame.link);
      const old = $('img', stage), img = cached.cloneNode();
      img.alt = item.alt; img.removeAttribute('loading');
      stage.insertBefore(img, $('.image-arrow', stage));
      if (reduced.matches) { old?.remove(); caption(frame, item); frame.item = item; return; }
      const time = 1100, ease = 'cubic-bezier(.4,0,.2,1)';
      const reveal = img.animate([{ opacity: 0, transform: 'scale(1.035)' }, { opacity: 1, transform: 'scale(1)' }], {
        duration: time, easing: ease, fill: 'both'
      });
      setTimeout(() => {
        if (frame.disposed) return;
        const out = frame.caption.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-out', fill: 'forwards' });
        out.finished.then(() => {
          caption(frame, item); out.cancel();
          frame.caption.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 520, easing: 'ease-out' });
        }).catch(() => {});
      }, 200);
      frame.item = item;
      await reveal.finished.catch(() => {});
      if (!frame.disposed) { old?.remove(); reveal.cancel(); }
    } finally { frame.busy = false; reserved.delete(item.key); }
  }
  const availableAfterLoad = frame => frame.visible && !document.hidden && !document.body.matches('.menu-open, .dialog-open, .lb-open') &&
    !frame.link.matches(':focus-within') && !(hover.matches && frame.link.matches(':hover'));
  $('#heroNext').addEventListener('click', () => swap(hero, nextItem(heroPool, hero), true));
  const advanceWork = manual => {
    const candidates = manual ? workFrames.filter(f => !f.busy && !f.disposed) : workFrames.filter(available);
    if (!candidates.length) return;
    const frame = candidates[turn++ % candidates.length];
    swap(frame, nextItem(workPool, frame), manual);
  };
  $('#workNext').addEventListener('click', () => advanceWork(true));
  const loop = (fn, interval) => { setTimeout(() => { fn(); loop(fn, interval); }, interval); };
  loop(() => { if (!reduced.matches && available(hero)) swap(hero, nextItem(heroPool, hero)); }, 6500);
  loop(() => { if (!reduced.matches) advanceWork(false); }, 3600);

  function configure(list) {
    workFrames.forEach(f => { f.disposed = true; observer?.unobserve(f.link); frames.delete(f); });
    workFrames = []; turn = 0;
    const custom = list?.length ? list.slice(0, 12).map((p, i) => {
      const src = /\/upload\/[^/]*(f_auto|q_auto|w_\d)/.test(p.imageUrl) ? p.imageUrl : p.imageUrl.replace('/upload/', '/upload/f_auto,q_auto,w_1000/');
      return { key: p.galleryId || `custom-${i}`, title: p.alt || 'Projekt', kind: p.category || '', src, original: p.imageUrl,
        alt: p.alt || 'Projekt graficzny', href: p.galleryId ? `${gallery}?projekt=${encodeURIComponent(p.galleryId)}` : gallery };
    }) : [];
    workPool = custom.length >= 6 ? custom : custom.concat(defaultCards);
    const initial = custom.length ? workPool.slice(0, 4) : ['repsly', 'vibe', 'mallow', 'gtarealm'].map(k => works.find(w => w.key === k));
    const grid = $('#workGrid');
    if (custom.length) {
      grid.replaceChildren();
      initial.forEach(item => {
        const link = document.createElement('a'); link.className = 'work-card'; link.href = item.href;
        link.innerHTML = '<div class="work-image"><img loading="lazy" decoding="async" width="1200" height="900"><span class="image-arrow" aria-hidden="true"><span class="ar"></span></span></div><div class="work-caption"><h3></h3><span></span></div>';
        const img = $('img', link); img.src = item.src; img.alt = item.alt;
        img.addEventListener('error', () => { img.src = item.original; }, { once: true });
        grid.append(link);
      });
    }
    [...grid.children].forEach((link, i) => {
      const frame = makeFrame(link, initial[i], $('.work-caption', link)); caption(frame, initial[i]); workFrames.push(frame);
    });
    $('#workControls').hidden = workPool.length <= workFrames.length;
  }
  $('.showcase-controls', $('#heroShowcase')).hidden = false;
  configure();
  window.creatiooShowcase = { configure };
})();
