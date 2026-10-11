(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hasDb = () => { try { return typeof db !== 'undefined' && !!db; } catch (e) { return false; } };

  // Cloudinary delivers a smaller file when transformations are added to the path.
  const cdn = (u, w) => {
    if (typeof u === 'string' && /res\.cloudinary\.com/.test(u) && u.includes('/upload/') && !/\/upload\/[^/]*(f_auto|q_auto|w_\d)/.test(u)) {
      return u.replace('/upload/', `/upload/f_auto,q_auto,w_${w}/`);
    }
    return u;
  };
  const logoUrl = u => (typeof u === 'string' && /res\.cloudinary\.com/.test(u) && u.includes('/upload/') && !/\/upload\/[^/]*(e_trim|f_auto|q_auto|w_\d)/.test(u)
    ? u.replace('/upload/', '/upload/e_trim,w_520,f_auto,q_auto/') : u);
  const withFallback = (img, original) => {
    img.addEventListener('error', () => { if (img.getAttribute('src') !== original) img.src = original; }, { once: true });
  };

  // Mobile dock hides while the contact form or the footer is on screen.
  const dock = $('#dock');
  if (dock && 'IntersectionObserver' in window) {
    const seen = new Set();
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      dock.classList.toggle('hide', seen.size > 0);
    }, { threshold: .12 });
    io.observe($('#contact'));
    io.observe($('.foot'));
  }

  // Homepage works. Items added in the dashboard feed the rotating project cards.
  async function featured() {
    if (!hasDb() || !window.creatiooShowcase) return;
    let list = [];
    try {
      const snap = await db.collection('projects').orderBy('order').get();
      list = snap.docs.map(d => d.data()).filter(p => p.imageUrl);
    } catch (e) { console.error(e); }
    if (list.length) window.creatiooShowcase.configure(list);
  }

  async function reviews() {
    const track = $('#rvTrack');
    let data = [];
    if (hasDb()) {
      try {
        const snap = await db.collection('reviews').orderBy('order').get();
        data = snap.docs.map(d => d.data());
      } catch (e) { console.error(e); }
    }
    if (!data.length) { track.innerHTML = '<p class="empty">Opinie pojawią się tutaj wkrótce.</p>'; return; }
    const initials = n => String(n || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('');
    track.innerHTML = data.map(r => {
      const n = Math.max(1, Math.min(5, +r.stars || 5));
      return `<article><div class="st" style="--n:${n}" role="img" aria-label="Ocena ${n} na 5"></div><p>${esc(r.text)}</p><footer><span class="av" aria-hidden="true">${esc(initials(r.name))}</span><div><b>${esc(r.name)}</b>${r.role ? `<small>${esc(r.role)}</small>` : ''}</div></footer></article>`;
    }).join('');
    window.creatiooReviews?.mount();
  }

  // Logo wall: flat marks become one-tone silhouettes, detailed artwork becomes a grayscale drawing
  const tuneLogo = img => {
    const w = img.naturalWidth, h = img.naturalHeight;
    if (w && h) {
      const ar = w / h;
      img.style.setProperty('--ar', ar.toFixed(3));
      img.style.setProperty('--k', Math.sqrt(ar).toFixed(3));
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
    if (!list.length) { section.hidden = true; return; }
    $('#clientGrid').innerHTML = list.map(c => `<div class="client-cell" role="listitem"><div class="client-mark"><img src="${esc(logoUrl(c.imageUrl))}" alt="${esc(c.alt || 'Logo klienta')}" crossorigin="anonymous" loading="lazy" decoding="async"></div>${c.alt ? `<span class="client-name">${esc(c.alt)}</span>` : ''}</div>`).join('');
    $$('#clientGrid img').forEach((img, i) => {
      let tries = 0;
      img.addEventListener('load', () => tuneLogo(img));
      img.addEventListener('error', () => {
        tries += 1;
        if (tries === 1) {
          // retry without CORS, the logo is still shown (just not analysed)
          const src = img.getAttribute('src');
          img.removeAttribute('crossorigin');
          img.removeAttribute('src');
          img.src = src;
        } else if (tries === 2 && img.getAttribute('src') !== list[i].imageUrl) img.src = list[i].imageUrl;
      });
      if (img.complete && img.naturalWidth) tuneLogo(img);
    });
  }

  // Review dialog
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

  // Contact form
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
