/* ═══════════════════════════════════════════════════════════
   CREATIOO GALLERY — gallery.js
   Ładuje projekty z Firestore zamiast statycznej tablicy.

   Wymaga: db (firebase-init.js) załadowanego wcześniej.
   Kolekcja Firestore: "gallery"
   Reguły Firestore: odczyt publiczny dla kolekcji gallery.

   Przykładowe reguły (security rules):
     match /gallery/{doc} {
       allow read: if true;
       allow write: if request.auth.uid == 'TWÓJ_UID';
     }
   ═══════════════════════════════════════════════════════════ */

/* ── DANE PROJEKTÓW (ładowane z Firestore) ───────────────── */
let projects = [];

/* ── SIATKA I EMPTY STATE ───────────────────────────────── */
const grid  = document.getElementById('galleryGrid');
const empty = document.getElementById('galleryEmpty');

/* ── MOTION PREFERENCE ───────────────────────────────────── */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── AKTYWNY FILTR ───────────────────────────────────────── */
let activeFilter = 'all';

/* ═══════════════════════════════════════════════════════════
   INICJALIZACJA — pobierz dane, zbuduj siatkę
   ═══════════════════════════════════════════════════════════ */
async function initGallery() {
  /* Pokaż loader */
  grid.innerHTML = `
    <div class="gallery-loader">
      <i class="icon--fa6-solid icon--fa6-solid--spinner fa-spin"></i>
      <span>Wczytywanie projektów…</span>
    </div>`;

  try {
    const snap = await db.collection('gallery').orderBy('order').get();

    projects = snap.docs.map(d => {
      const data = d.data();
      return {
        id:       d.id,
        cat:      data.cat      || 'inne',
        catLabel: data.catLabel || data.cat || '',
        title:    data.title    || '',
        desc:     data.desc     || '',
        img:      data.imageUrl || '',   // mapowanie imageUrl → img (kompatybilność)
        tools:    data.tools    || '',
        time:     data.time     || '',
        year:     data.year     || '',
        order:    data.order    ?? 0,
      };
    });
  } catch (e) {
    console.error('Błąd ładowania galerii:', e);
    projects = [];
    grid.innerHTML = `
      <div class="gallery-error">
        <i class="icon--fa6-solid icon--fa6-solid--triangle-exclamation"></i>
        <p>Nie udało się załadować projektów.</p>
      </div>`;
    return;
  }

  updateCounts();
  buildGrid('all');
  initFilters();
}

/* ── AKTUALIZACJA LICZNIKÓW ──────────────────────────────── */
function updateCounts() {
  const all = document.getElementById('count-all');
  if (all) all.textContent = projects.length;

  ['logo', 'banner', 'wizytowka', 'miniatura', 'produkt'].forEach(cat => {
    const el = document.getElementById(`count-${cat}`);
    if (el) el.textContent = projects.filter(p => p.cat === cat).length;
  });
}

/* ── STAGGER HELPER ──────────────────────────────────────── */
function animateItems(items) {
  if (prefersReduced) {
    items.forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
    return;
  }
  items.forEach((el, i) => {
    el.style.animationDelay = `${i * 0.055}s`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add('visible'));
    });
  });
}

/* ── BUDOWANIE SIATKI ────────────────────────────────────── */
function buildGrid(filter) {
  activeFilter = filter;

  const visible = filter === 'all'
    ? projects
    : projects.filter(p => p.cat === filter);

  /* Płynne wyjście poprzednich kart */
  const existing = [...grid.querySelectorAll('.gallery-item')];
  if (existing.length) {
    existing.forEach(el => {
      el.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
      el.style.opacity    = '0';
      el.style.transform  = 'translateY(10px)';
    });
  }

  const FADE_OUT = existing.length ? 230 : 0;

  setTimeout(() => {
    grid.innerHTML = '';

    if (visible.length === 0) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    const els = visible.map(p => {
      const el = document.createElement('div');
      el.className  = 'gallery-item';
      el.dataset.id = p.id;
      el.innerHTML  = `
        <img src="${p.img}" alt="${escapeHtml(p.title)}" loading="lazy">
        <span class="gallery-item-badge">${escapeHtml(p.catLabel)}</span>
        <div class="gallery-item-overlay">
    
        </div>
        <div class="gallery-item-icon"><i class="icon--fa6-solid icon--fa6-solid--expand"></i></div>
      `;
      el.addEventListener('click', () => openLightbox(p.id, filter));
      grid.appendChild(el);
      return el;
    });

    animateItems(els);
  }, FADE_OUT);
}

/* ── ESCAPE HTML ─────────────────────────────────────────── */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── FILTRY ─────────────────────────────────────────────── */
function initFilters() {
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      /* Animacja "pop" */
      btn.classList.remove('anim-pop');
      void btn.offsetWidth;
      btn.classList.add('anim-pop');
      btn.addEventListener('animationend', () => btn.classList.remove('anim-pop'), { once: true });

      buildGrid(btn.dataset.filter);
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   LIGHTBOX
   ═══════════════════════════════════════════════════════════ */
const projectModal = document.getElementById('project-modal');
const lbImg        = document.getElementById('projectModalImg');
const lbMeta       = document.getElementById('projectModalMeta');
const lbClose      = document.getElementById('projectModalClose');
const lbPrev       = document.getElementById('projectModalPrev');
const lbNext       = document.getElementById('projectModalNext');
const lbBackdrop   = document.getElementById('projectModalBackdrop');

let currentIndex = 0;
let currentList  = [];

function openLightbox(id, filter) {
  currentList  = filter === 'all'
    ? projects
    : projects.filter(p => p.cat === filter);
  currentIndex = currentList.findIndex(p => p.id === id);
  if (currentIndex === -1) currentIndex = 0;

  renderLightbox('none');
  projectModal.classList.add('open');
  document.body.style.overflow = 'hidden';

  const panel = projectModal.querySelector('.project-modal-panel');
  panel.classList.remove('anim-in');
  void panel.offsetWidth;
  panel.classList.add('anim-in');
  panel.addEventListener('animationend', () => panel.classList.remove('anim-in'), { once: true });
}

function renderLightbox(direction = 'none') {
  const p = currentList[currentIndex];
  if (!p) return;

  /* Animacja zdjęcia */
  const animCls = direction === 'next' ? 'anim-slide-left'
                : direction === 'prev' ? 'anim-slide-right'
                : null;

  if (animCls && !prefersReduced) {
    lbImg.classList.remove('anim-slide-left', 'anim-slide-right');
    void lbImg.offsetWidth;
    lbImg.classList.add(animCls);
    lbImg.addEventListener('animationend', () => lbImg.classList.remove(animCls), { once: true });

    const infoEl = lbMeta.parentElement;
    infoEl.classList.remove('anim-fade');
    void infoEl.offsetWidth;
    infoEl.classList.add('anim-fade');
    infoEl.addEventListener('animationend', () => infoEl.classList.remove('anim-fade'), { once: true });
  }

  lbImg.src = p.img;
  lbImg.alt = p.title;

  /* Zawsze pokazujemy komplet pól — jeśli w danych projektu brakuje
     narzędzi / czasu / roku, wstawiamy kreskę zamiast pomijać cały
     wiersz. Dzięki temu pasek informacji nigdy nie "znika" ani nie
     wygląda jakby się nie wczytał. */
  const metaFields = [
    { icon: 'wrench',   label: 'Narzędzia:',       value: p.tools },
    { icon: 'clock',    label: 'Czas realizacji:', value: p.time  },
    { icon: 'calendar', label: 'Rok:',              value: p.year  },
  ];

  lbMeta.innerHTML = metaFields
    .map(f => `
      <div class="project-modal-meta-item">
        <i class="icon--fa6-solid icon--fa6-solid--${f.icon}"></i>
        <span><strong>${f.label}</strong> ${escapeHtml(f.value) || '—'}</span>
      </div>
    `)
    .join('');

  lbPrev.disabled      = currentIndex === 0;
  lbNext.disabled      = currentIndex === currentList.length - 1;
  lbPrev.style.opacity = currentIndex === 0 ? '0.35' : '1';
  lbNext.style.opacity = currentIndex === currentList.length - 1 ? '0.35' : '1';
}

function closeLightbox() {
  projectModal.classList.remove('open');
  document.body.style.overflow = '';
}

lbClose.addEventListener('click', closeLightbox);
lbBackdrop.addEventListener('click', closeLightbox);

lbPrev.addEventListener('click', () => {
  if (currentIndex > 0) { currentIndex--; renderLightbox('prev'); }
});
lbNext.addEventListener('click', () => {
  if (currentIndex < currentList.length - 1) { currentIndex++; renderLightbox('next'); }
});

document.addEventListener('keydown', e => {
  if (!projectModal.classList.contains('open')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft'  && currentIndex > 0)
    { currentIndex--; renderLightbox('prev'); }
  if (e.key === 'ArrowRight' && currentIndex < currentList.length - 1)
    { currentIndex++; renderLightbox('next'); }
});

/* ── START ───────────────────────────────────────────────── */
initGallery();