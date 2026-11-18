(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hasDb = () => { try { return typeof db !== 'undefined' && !!db; } catch (e) { return false; } };
  const emit = name => dispatchEvent(new CustomEvent(name));
  const pad = n => String(n).padStart(2, '0');

  // Cloudinary delivers a smaller file when transformations are added to the path.
  const cdn = (u, w) => (typeof u === 'string' && /res\.cloudinary\.com/.test(u) && u.includes('/upload/') && !/\/upload\/[^/]*(f_auto|q_auto|w_\d)/.test(u)
    ? u.replace('/upload/', `/upload/f_auto,q_auto,w_${w}/`) : u);
  const logoUrl = u => (typeof u === 'string' && /res\.cloudinary\.com/.test(u) && u.includes('/upload/') && !/\/upload\/[^/]*(e_trim|f_auto|q_auto|w_\d)/.test(u)
    ? u.replace('/upload/', '/upload/e_trim,w_520,f_auto,q_auto/') : u);

  /* Current section in the nav (header scrolling and the footer copy button live in common.js) */
  const navLinks = $$('#links a[href^="#"]');
  if ('IntersectionObserver' in window) {
    const map = new Map(navLinks.map(a => [document.getElementById(a.getAttribute('href').slice(1)), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const link = map.get(e.target);
        if (!link) return;
        if (e.isIntersecting) { navLinks.forEach(a => a.removeAttribute('aria-current')); link.setAttribute('aria-current', 'true'); }
        else if (link.getAttribute('aria-current')) link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, sec) => sec && io.observe(sec));
  }

  /* Text split into words for motion.js: the about intro lights up word by word, [data-split] headings rise word by word.
     Each element keeps its Polish source and is rebuilt in the active language. */
  const i18n = window.creatiooI18n;
  const splitWords = (el, wrap) => {
    const source = i18n ? i18n.t(el.textContent.trim(), 'pl') : el.textContent.trim();
    el.setAttribute('data-no-translate', '');
    const build = () => {
      const lang = i18n?.language || document.documentElement.dataset.lang;
      const text = lang === 'en' && i18n ? i18n.t(source, 'en') : source;
      el.setAttribute('aria-label', text);
      el.innerHTML = text.split(/\s+/).map(wrap).join(' ');
      emit('words:built');
    };
    build();
    addEventListener('languagechange', build);
  };
  const intro = $('#aboutIntro');
  if (intro) splitWords(intro, w => `<span class="w" aria-hidden="true">${esc(w)}</span>`);
  $$('[data-split]').forEach(el => splitWords(el, (w, i) => `<span class="sw" aria-hidden="true"><span style="--i:${i}">${esc(w)}</span></span>`));

  /* Featured work: items added in the dashboard replace the default cards */
  const track = $('#workTrack');
  async function featured() {
    if (!hasDb()) return;
    let list = [];
    try {
      const snap = await db.collection('projects').orderBy('order').get();
      list = snap.docs.map(d => d.data()).filter(p => p.imageUrl);
    } catch (e) { console.error(e); return; }
    if (list.length < 4) return;
    const items = list.slice(0, 10);
    const more = track.querySelector('.work-more');
    const cards = items.map((p, i) => {
      const href = p.galleryId ? `gallery/?projekt=${encodeURIComponent(p.galleryId)}` : 'gallery/';
      const li = document.createElement('li');
      li.className = 'work-card';
      li.innerHTML = `<a data-cursor="Zobacz projekt" href="${esc(href)}"><div class="work-img"><img src="${esc(cdn(p.imageUrl, 1200))}" alt="${esc(p.alt || 'Projekt graficzny')}" width="1200" height="900" loading="lazy" decoding="async"></div><div class="work-meta"><span class="work-no">${pad(i + 1)}</span><h3>${esc(p.alt || 'Projekt')}</h3><span class="work-kind">${esc(p.category || '')}</span></div></a>`;
      const img = li.querySelector('img');
      img.addEventListener('error', () => { if (img.src !== p.imageUrl) img.src = p.imageUrl; }, { once: true });
      return li;
    });
    track.replaceChildren(...cards, more);
    $('#workCount').textContent = `(${pad(items.length)})`;
    emit('works:updated');
  }

  /* Reviews */
  async function reviews() {
    const box = $('#rvTrack');
    let data = [];
    if (hasDb()) {
      try {
        const snap = await db.collection('reviews').orderBy('order').get();
        data = snap.docs.map(d => d.data());
      } catch (e) { console.error(e); }
    }
    if (!data.length) { box.innerHTML = '<p class="empty">Opinie pojawią się tutaj wkrótce.</p>'; emit('layout:changed'); return; }
    const initials = n => String(n || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('');
    box.innerHTML = data.slice(0, 9).map(r => {
      const n = Math.max(1, Math.min(5, +r.stars || 5));
      return `<article role="listitem"><div class="st" style="--n:${n}" role="img" aria-label="Ocena ${n} na 5"></div><p>${esc(r.text)}</p><footer><span class="av" aria-hidden="true">${esc(initials(r.name))}</span><div><b>${esc(r.name)}</b>${r.role ? `<small>${esc(r.role)}</small>` : ''}</div></footer></article>`;
    }).join('');
    emit('layout:changed');
  }

  /* Client logos: flat marks become one-tone silhouettes, detailed artwork stays as a grayscale picture */
  const tuneLogo = img => {
    const w = img.naturalWidth, h = img.naturalHeight;
    if (w && h) {
      const ar = w / h;
      img.style.setProperty('--k', Math.min(1.6, Math.sqrt(ar)).toFixed(3));
      try {
        const scale = Math.min(1, 96 / Math.max(w, h));
        const cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
        const cv = document.createElement('canvas');
        cv.width = cw; cv.height = ch;
        const cx = cv.getContext('2d', { willReadFrequently: true });
        cx.drawImage(img, 0, 0, cw, ch);
        const px = cx.getImageData(0, 0, cw, ch).data, bins = new Map();
        let solid = 0;
        for (let i = 0; i < px.length; i += 4) {
          if (px[i + 3] < 200) continue;
          solid += 1;
          const key = ((px[i] >> 5) << 6) | ((px[i + 1] >> 5) << 3) | (px[i + 2] >> 5);
          bins.set(key, (bins.get(key) || 0) + 1);
        }
        let main = 0;
        bins.forEach(n => { if (n / solid >= 0.01) main += 1; });
        img.classList.toggle('is-art', solid > 0 && main >= 10);
      } catch (e) { /* canvas blocked, keep the silhouette look */ }
    }
    img.classList.add('is-ready');
  };
  async function clients() {
    const section = $('#clients');
    let list = [];
    if (hasDb()) {
      try {
        const snap = await db.collection('clients').orderBy('order').get();
        list = snap.docs.map(d => d.data()).filter(c => c.imageUrl);
      } catch (e) { console.error(e); }
    }
    if (!list.length) { section.hidden = true; emit('layout:changed'); return; }
    $('#clientGrid').innerHTML = list.map(c => `<div class="client-cell" role="listitem"><div class="client-mark"><img src="${esc(logoUrl(c.imageUrl))}" alt="${esc(c.alt || 'Logo klienta')}" crossorigin="anonymous" loading="lazy" decoding="async"></div>${c.alt ? `<span class="client-name">${esc(c.alt)}</span>` : ''}</div>`).join('');
    $$('#clientGrid img').forEach((img, i) => {
      let tries = 0;
      img.addEventListener('load', () => tuneLogo(img));
      img.addEventListener('error', () => {
        tries += 1;
        if (tries === 1) {
          const src = img.getAttribute('src');
          img.removeAttribute('crossorigin'); img.removeAttribute('src'); img.src = src;
        } else if (tries === 2 && img.getAttribute('src') !== list[i].imageUrl) img.src = list[i].imageUrl;
        else img.classList.add('is-ready');
      });
      if (img.complete && img.naturalWidth) tuneLogo(img);
    });
    emit('layout:changed');
  }

  /* Review dialog */
  const dlg = $('#revDlg'), form = $('#revForm'), out = $('#revStatus');
  let stars = 5;
  const say = (msg, cls) => { out.textContent = msg; out.className = 'note ' + (cls || ''); };
  const paint = n => { stars = n; $$('.pick button').forEach((b, i) => { b.classList.toggle('on', i < n); b.setAttribute('aria-pressed', String(i < n)); }); };
  $$('.pick button').forEach((b, i) => b.addEventListener('click', () => paint(i + 1)));
  paint(5);
  $('#revOpen').addEventListener('click', () => { say(''); dlg.showModal(); document.body.classList.add('dialog-open'); });
  const closeDlg = () => { if (dlg.open) dlg.close(); };
  $('#revClose').addEventListener('click', closeDlg);
  dlg.addEventListener('click', e => { if (e.target === dlg) closeDlg(); });
  dlg.addEventListener('close', () => document.body.classList.remove('dialog-open'));
  const deviceId = () => {
    try {
      let id = localStorage.getItem('reviewDeviceId');
      if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID() : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem('reviewDeviceId', id);
      }
      return id;
    } catch (e) { return `dev-${Date.now()}`; }
  };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(form), name = f.get('name').trim(), text = f.get('text').trim();
    if (!name || !text) return say('Uzupełnij imię i treść opinii.', 'err');
    if (!hasDb()) return say('Nie można teraz wysłać opinii. Spróbuj później.', 'err');
    const btn = $('button[type=submit]', form);
    btn.disabled = true;
    try {
      const id = deviceId();
      await db.collection('pendingReviews').add({ name, role: f.get('role').trim(), text, stars, status: 'pending', createdAt: firebase.firestore.FieldValue.serverTimestamp(), deviceId: id });
      await db.collection('reviewCooldowns').doc(id).set({ lastSubmit: firebase.firestore.FieldValue.serverTimestamp() });
      form.reset(); paint(5);
      say('Dziękuję! Opinia pojawi się po zatwierdzeniu.', 'ok');
      setTimeout(closeDlg, 1800);
    } catch (err) {
      console.error(err);
      say(err.code === 'permission-denied' ? 'Opinia z tego urządzenia została już wysłana.' : 'Nie udało się wysłać. Spróbuj ponownie.', 'err');
    }
    btn.disabled = false;
  });

  /* Contact form */
  const cf = $('#cform'), cs = $('#cstatus');
  cf.addEventListener('submit', async e => {
    e.preventDefault();
    const b = $('button[type=submit]', cf);
    b.disabled = true; cs.className = 'note'; cs.textContent = 'Wysyłanie...';
    try {
      const r = await fetch(cf.action, { method: 'POST', body: new FormData(cf), headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error('send');
      cf.reset(); cs.className = 'note ok'; cs.textContent = 'Wiadomość wysłana. Odpowiem najszybciej, jak się da.';
    } catch (err) {
      cs.className = 'note err'; cs.textContent = 'Nie udało się wysłać. Napisz bezpośrednio na creatioopl@gmail.com.';
    }
    b.disabled = false;
  });

  featured();
  reviews();
  clients();
})();
