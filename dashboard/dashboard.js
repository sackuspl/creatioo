/* ═══════════════════════════════════════════════════════════
   CREATIOO DASHBOARD — dashboard.js
   Firebase Auth + Firestore CRUD + Drag & Drop
   ═══════════════════════════════════════════════════════════ */

/* ── STAN APLIKACJI ─────────────────────────────────────── */
const State = {
  reviews: [],
  clients: [],
  projects: [],
  gallery: [],
  pending: [],
};

/* ── DRAG & DROP ────────────────────────────────────────── */
let dragSrc  = null;
let dragList = null;


/* ── TOAST ──────────────────────────────────────────────── */
function toast(msg, type = 'success') {
  const wrap = document.getElementById('toast');
  const el   = document.createElement('div');
  el.className = `toast-msg ${type}`;
  el.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'circle-check' : 'circle-exclamation'}"></i><span>${msg}</span>`;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastOut 0.25s ease forwards';
    el.addEventListener('animationend', () => el.remove());
  }, 3200);
}

/* ── CONFIRM ────────────────────────────────────────────── */
function confirm(message, onConfirm, options = {}) {
  const overlay   = document.getElementById('confirmOverlay');
  const msgEl     = document.getElementById('confirmMsg');
  const titleEl   = document.getElementById('confirmTitle');
  const iconEl    = document.getElementById('confirmIcon');
  const okBtn     = document.getElementById('confirmOk');
  const cancelBtn = document.getElementById('confirmCancel');

  const {
    variant      = 'danger',           // 'danger' | 'success'
    icon         = 'fa-trash',
    title        = 'Potwierdź usunięcie',
    confirmLabel = 'Usuń',
  } = options;

  msgEl.textContent   = message;
  titleEl.textContent = title;
  iconEl.innerHTML    = `<i class="fa-solid ${icon}"></i>`;
  okBtn.textContent   = confirmLabel;

  iconEl.classList.toggle('confirm-icon--success', variant === 'success');
  iconEl.classList.toggle('confirm-icon--danger', variant !== 'success');
  okBtn.classList.toggle('btn-confirm-approve', variant === 'success');
  okBtn.classList.toggle('btn-confirm-delete', variant !== 'success');

  overlay.classList.add('open');

  const close = () => overlay.classList.remove('open');

  const handleOk = () => { close(); onConfirm(); cleanup(); };
  const handleCancel = () => { close(); cleanup(); };

  const cleanup = () => {
    okBtn.removeEventListener('click', handleOk);
    cancelBtn.removeEventListener('click', handleCancel);
  };

  okBtn.addEventListener('click', handleOk);
  cancelBtn.addEventListener('click', handleCancel);
}

/* ── MODAL ──────────────────────────────────────────────── */
const Modal = {
  el: null,
  init(id) {
    this.el = document.getElementById(id);
  },
  open() {
    this.el.classList.add('open');
    const first = this.el.querySelector('input, textarea, select');
    if (first) setTimeout(() => first.focus(), 100);
  },
  close() {
    this.el.classList.remove('open');
  }
};

/* ── AUTH ───────────────────────────────────────────────── */
auth.onAuthStateChanged(user => {
  if (user) {
    showApp(user);
  } else {
    showLogin();
  }
});

function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('app').classList.remove('visible');
}

function showApp(user) {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').classList.add('visible');
  document.getElementById('userEmail').textContent = user.email;
  document.getElementById('userAvatar').textContent = user.email[0].toUpperCase();
  loadAll();
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn   = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPass').value;

  errEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Logowanie…';

  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch (err) {
    errEl.style.display = 'block';
    errEl.textContent = mapAuthError(err.code);
    btn.disabled = false;
    btn.textContent = 'Zaloguj się';
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await auth.signOut();
});

function mapAuthError(code) {
  const map = {
    'auth/invalid-email':      'Nieprawidłowy adres e-mail.',
    'auth/user-not-found':     'Konto nie istnieje.',
    'auth/wrong-password':     'Nieprawidłowe hasło.',
    'auth/invalid-credential': 'Nieprawidłowy e-mail lub hasło.',
    'auth/too-many-requests':  'Za dużo prób. Spróbuj za chwilę.',
  };
  return map[code] || 'Błąd logowania. Spróbuj ponownie.';
}

/* ── NAWIGACJA ──────────────────────────────────────────── */
document.querySelectorAll('.nav-item[data-section]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.section;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(target).classList.add('active');
    document.getElementById('pageTitle').textContent   = btn.dataset.title || '';
    document.getElementById('pageSubtitle').textContent = btn.dataset.sub || '';
  });
});

/* ── LOAD ALL ───────────────────────────────────────────── */
async function loadAll() {
  await Promise.all([loadReviews(), loadClients(), loadGallery(), loadProjects(), loadPending()]);
  updateOverview();
}

/* ═══════════════════════════════════════════════════════════
   OPINIE (reviews)
   ═══════════════════════════════════════════════════════════ */
async function loadReviews() {
  const listEl = document.getElementById('reviewsList');
  listEl.innerHTML = `<div class="loader"><i class="fa-solid fa-spinner"></i> Wczytywanie…</div>`;

  try {
    const snap = await db.collection('reviews').orderBy('order').get();
    State.reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    State.reviews = [];
    toast('Błąd wczytywania opinii', 'error');
  }

  renderReviews();
}

function renderReviews() {
  const listEl = document.getElementById('reviewsList');
  document.getElementById('reviewCount').textContent = State.reviews.length;

  if (!State.reviews.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-comment-dots"></i>
        <p>Brak opinii. Dodaj pierwszą!</p>
      </div>`;
    return;
  }

  listEl.innerHTML = '';
  listEl.className = 'drag-list';

  State.reviews.forEach((r, i) => {
    const el = document.createElement('div');
    el.className = 'drag-item';
    el.dataset.id = r.id;
    el.dataset.idx = i;
    el.draggable = true;

    const starsHtml = Array.from({length: 5}, (_, si) =>
      `<i class="fa-${si < r.stars ? 'solid' : 'regular'} fa-star${si < r.stars ? '' : ' empty'}"></i>`
    ).join('');

    el.innerHTML = `
      <div class="drag-handle"><i class="fa-solid fa-grip-dots-vertical"></i></div>
      <div class="drag-thumb-placeholder"><i class="fa-regular fa-user"></i></div>
      <div class="drag-info">
        <div class="drag-name">${escHtml(r.name)}</div>
        <div class="drag-meta">${escHtml(r.role || '')} · <span class="stars-preview">${starsHtml}</span></div>
      </div>
      <div class="drag-actions">
        <button class="btn-icon edit" title="Edytuj" onclick="openReviewModal('${r.id}')"><i class="fa-regular fa-pen"></i></button>
        <button class="btn-icon del"  title="Usuń"   onclick="deleteReview('${r.id}')"><i class="fa-regular fa-trash"></i></button>
      </div>`;

    setupDrag(el, 'reviews');
    listEl.appendChild(el);
  });
}

/* ── MODAL OPINIE ───────────────────────────────────────── */
const reviewModal = { el: null };
let   reviewStars = 5;
let   editReviewId = null;

function openReviewModal(id = null) {
  editReviewId = id;
  const m = document.getElementById('reviewModal');
  m.classList.add('open');

  if (id) {
    const r = State.reviews.find(x => x.id === id);
    document.getElementById('rName').value = r.name  || '';
    document.getElementById('rRole').value = r.role  || '';
    document.getElementById('rText').value = r.text  || '';
    reviewStars = r.stars || 5;
    document.getElementById('reviewModalTitle').textContent = 'Edytuj opinię';
  } else {
    document.getElementById('reviewForm').reset();
    reviewStars = 5;
    document.getElementById('reviewModalTitle').textContent = 'Dodaj opinię';
  }
  setStars(reviewStars);

  setTimeout(() => document.getElementById('rName').focus(), 100);
}

function closeReviewModal() {
  document.getElementById('reviewModal').classList.remove('open');
  editReviewId = null;
}

function setStars(n) {
  reviewStars = n;
  document.querySelectorAll('.star-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i < n);
    btn.innerHTML = `<i class="fa-${i < n ? 'solid' : 'regular'} fa-star"></i>`;
  });
}

document.querySelectorAll('.star-btn').forEach((btn, i) => {
  btn.addEventListener('click', () => setStars(i + 1));
  btn.addEventListener('mouseover', () => {
    document.querySelectorAll('.star-btn').forEach((b, j) => {
      b.innerHTML = `<i class="fa-${j <= i ? 'solid' : 'regular'} fa-star"></i>`;
    });
  });
  btn.addEventListener('mouseleave', () => setStars(reviewStars));
});

document.getElementById('reviewForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('reviewSaveBtn');
  btn.disabled = true;
  btn.textContent = 'Zapisuję…';

  const data = {
    name:  document.getElementById('rName').value.trim(),
    role:  document.getElementById('rRole').value.trim(),
    text:  document.getElementById('rText').value.trim(),
    stars: reviewStars,
  };

  try {
    if (editReviewId) {
      await db.collection('reviews').doc(editReviewId).update(data);
      toast('Opinia zaktualizowana');
    } else {
      data.order = State.reviews.length;
      await db.collection('reviews').add(data);
      toast('Opinia dodana');
    }
    closeReviewModal();
    await loadReviews();
    updateOverview();
  } catch (err) {
    toast('Błąd zapisu: ' + err.message, 'error');
  }

  btn.disabled = false;
  btn.textContent = 'Zapisz';
});

function deleteReview(id) {
  const r = State.reviews.find(x => x.id === id);
  confirm(`Usunąć opinię od „${r?.name}"?`, async () => {
    try {
      await db.collection('reviews').doc(id).delete();
      toast('Opinia usunięta');
      await loadReviews();
      updateOverview();
    } catch (e) {
      toast('Błąd usuwania', 'error');
    }
  });
}


/* ═══════════════════════════════════════════════════════════
   OPINIE OCZEKUJĄCE (pendingReviews)
   ═══════════════════════════════════════════════════════════ */
async function loadPending() {
  const listEl = document.getElementById('pendingList');
  listEl.innerHTML = `<div class="loader"><i class="fa-solid fa-spinner"></i> Wczytywanie…</div>`;

  try {
    const snap = await db.collection('pendingReviews').orderBy('createdAt', 'desc').get();
    State.pending = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    State.pending = [];
    toast('Błąd wczytywania oczekujących opinii', 'error');
  }

  renderPending();
}

function renderPending() {
  const listEl = document.getElementById('pendingList');
  document.getElementById('pendingCount').textContent = State.pending.length;

  const navBadge = document.getElementById('pendingNavBadge');
  if (navBadge) {
    navBadge.textContent = State.pending.length || '';
    navBadge.style.display = State.pending.length ? '' : 'none';
  }

  if (!State.pending.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-circle-check"></i>
        <p>Brak oczekujących opinii.</p>
      </div>`;
    return;
  }

  listEl.innerHTML = '';
  listEl.className = 'drag-list';

  State.pending.forEach(r => {
    const el = document.createElement('div');
    el.className = 'drag-item';
    el.dataset.id = r.id;

    const starsHtml = Array.from({ length: 5 }, (_, si) =>
      `<i class="fa-${si < r.stars ? 'solid' : 'regular'} fa-star${si < r.stars ? '' : ' empty'}"></i>`
    ).join('');

    el.innerHTML = `
      <div class="drag-thumb-placeholder"><i class="fa-regular fa-user"></i></div>
      <div class="drag-info">
        <div class="drag-name">${escHtml(r.name)}</div>
        <div class="drag-meta">${escHtml(r.role || '')} · <span class="stars-preview">${starsHtml}</span></div>
        <div class="drag-meta" style="margin-top:4px;">${escHtml(r.text || '')}</div>
      </div>
      <div class="drag-actions">
        <button class="btn-icon" title="Zatwierdź" onclick="approvePending('${r.id}')"><i class="fa-solid fa-check" style="color:#27ae60;"></i></button>
        <button class="btn-icon del" title="Odrzuć" onclick="rejectPending('${r.id}')"><i class="fa-solid fa-xmark"></i></button>
      </div>`;

    listEl.appendChild(el);
  });
}

async function approvePending(id) {
  const r = State.pending.find(x => x.id === id);
  if (!r) return;

  confirm(`Zatwierdzić opinię od „${r.name}"?`, async () => {
    try {
      // znajdź najwyższy istniejący "order" i dodaj 1 — gwarantuje koniec listy
      const maxOrder = State.reviews.reduce((max, rv) => Math.max(max, rv.order ?? -1), -1);

      await db.collection('reviews').add({
        name:  r.name,
        role:  r.role || '',
        text:  r.text,
        stars: r.stars || 5,
        order: maxOrder + 1,
      });
      await db.collection('pendingReviews').doc(id).delete();

      toast('Opinia zatwierdzona i opublikowana');
      await Promise.all([loadReviews(), loadPending()]);
      updateOverview();
    } catch (err) {
      toast('Błąd zatwierdzania: ' + err.message, 'error');
    }
  }, { variant: 'success', icon: 'fa-check', title: 'Zatwierdź opinię', confirmLabel: 'Zatwierdź' });
}

function rejectPending(id) {
  const r = State.pending.find(x => x.id === id);
  confirm(`Odrzucić opinię od „${r?.name}"? Zostanie trwale usunięta.`, async () => {
    try {
      await db.collection('pendingReviews').doc(id).delete();
      toast('Opinia odrzucona');
      await loadPending();
    } catch (e) {
      toast('Błąd odrzucania', 'error');
    }
  });
}


/* ═══════════════════════════════════════════════════════════
   KLIENCI (clients)
   ═══════════════════════════════════════════════════════════ */
async function loadClients() {
  const listEl = document.getElementById('clientsList');
  listEl.innerHTML = `<div class="loader"><i class="fa-solid fa-spinner"></i> Wczytywanie…</div>`;

  try {
    const snap = await db.collection('clients').orderBy('order').get();
    State.clients = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    State.clients = [];
    toast('Błąd wczytywania klientów', 'error');
  }

  renderClients();
}

function renderClients() {
  const listEl = document.getElementById('clientsList');
  document.getElementById('clientCount').textContent = State.clients.length;

  if (!State.clients.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-building"></i>
        <p>Brak logotypów. Dodaj pierwszy!</p>
      </div>`;
    return;
  }

  listEl.innerHTML = '';
  listEl.className = 'drag-list';

  State.clients.forEach((c, i) => {
    const el = document.createElement('div');
    el.className = 'drag-item';
    el.dataset.id = c.id;
    el.dataset.idx = i;
    el.draggable = true;

    const thumbHtml = c.imageUrl
      ? `<img class="drag-thumb" src="${escHtml(c.imageUrl)}" alt="${escHtml(c.alt || '')}" loading="lazy">`
      : `<div class="drag-thumb-placeholder"><i class="fa-regular fa-image"></i></div>`;

    el.innerHTML = `
      <div class="drag-handle"><i class="fa-solid fa-grip-dots-vertical"></i></div>
      ${thumbHtml}
      <div class="drag-info">
        <div class="drag-name">${escHtml(c.alt || 'Klient')}</div>
        <div class="drag-meta">${c.imageUrl ? '<i class="fa-solid fa-link"></i> URL wklejony' : 'Brak URL'}</div>
      </div>
      <div class="drag-actions">
        <button class="btn-icon edit" title="Edytuj" onclick="openClientModal('${c.id}')"><i class="fa-regular fa-pen"></i></button>
        <button class="btn-icon del"  title="Usuń"   onclick="deleteClient('${c.id}')"><i class="fa-regular fa-trash"></i></button>
      </div>`;

    setupDrag(el, 'clients');
    listEl.appendChild(el);
  });
}

let editClientId = null;

function openClientModal(id = null) {
  editClientId = id;
  const m = document.getElementById('clientModal');
  m.classList.add('open');

  if (id) {
    const c = State.clients.find(x => x.id === id);
    document.getElementById('cUrl').value = c.imageUrl || '';
    document.getElementById('cAlt').value = c.alt      || '';
    document.getElementById('clientModalTitle').textContent = 'Edytuj logotyp';
    updateClientPreview(c.imageUrl);
  } else {
    document.getElementById('clientForm').reset();
    updateClientPreview('');
    document.getElementById('clientModalTitle').textContent = 'Dodaj logotyp';
  }

  setTimeout(() => document.getElementById('cUrl').focus(), 100);
}

function closeClientModal() {
  document.getElementById('clientModal').classList.remove('open');
  editClientId = null;
}

document.getElementById('cUrl').addEventListener('input', e => {
  updateClientPreview(e.target.value.trim());
});

function updateClientPreview(url) {
  const wrap = document.getElementById('clientImgPreview');
  if (url) {
    wrap.innerHTML = `<img src="${escHtml(url)}" alt="podgląd" onerror="this.style.display='none'">`;
  } else {
    wrap.innerHTML = `<div class="img-preview-placeholder"><i class="fa-regular fa-image"></i>Wklej URL, aby zobaczyć podgląd</div>`;
  }
}

document.getElementById('clientForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('clientSaveBtn');
  btn.disabled = true;
  btn.textContent = 'Zapisuję…';

  const data = {
    imageUrl: document.getElementById('cUrl').value.trim(),
    alt:      document.getElementById('cAlt').value.trim(),
  };

  try {
    if (editClientId) {
      await db.collection('clients').doc(editClientId).update(data);
      toast('Logotyp zaktualizowany');
    } else {
      data.order = State.clients.length;
      await db.collection('clients').add(data);
      toast('Logotyp dodany');
    }
    closeClientModal();
    await loadClients();
    updateOverview();
  } catch (err) {
    toast('Błąd zapisu: ' + err.message, 'error');
  }

  btn.disabled = false;
  btn.textContent = 'Zapisz';
});

function deleteClient(id) {
  const c = State.clients.find(x => x.id === id);
  confirm(`Usunąć logotyp „${c?.alt || 'klienta'}"?`, async () => {
    try {
      await db.collection('clients').doc(id).delete();
      toast('Logotyp usunięty');
      await loadClients();
      updateOverview();
    } catch (e) {
      toast('Błąd usuwania', 'error');
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   PROJEKTY (projects)
   ═══════════════════════════════════════════════════════════ */
async function loadProjects() {
  const listEl = document.getElementById('projectsList');
  listEl.innerHTML = `<div class="loader"><i class="fa-solid fa-spinner"></i> Wczytywanie…</div>`;

  try {
    const snap = await db.collection('projects').orderBy('order').get();
    State.projects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    State.projects = [];
    toast('Błąd wczytywania projektów', 'error');
  }

  renderProjects();
}

function renderProjects() {
  const listEl = document.getElementById('projectsList');
  document.getElementById('projectCount').textContent = State.projects.length;

  if (!State.projects.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-folder-open"></i>
        <p>Brak projektów. Dodaj pierwszy!</p>
      </div>`;
    return;
  }

  listEl.innerHTML = '';
  listEl.className = 'drag-list';

  State.projects.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'drag-item';
    el.dataset.id = p.id;
    el.dataset.idx = i;
    el.draggable = true;

    const thumbHtml = p.imageUrl
      ? `<img class="drag-thumb" src="${escHtml(p.imageUrl)}" alt="${escHtml(p.alt || '')}" loading="lazy">`
      : `<div class="drag-thumb-placeholder"><i class="fa-regular fa-image"></i></div>`;

    el.innerHTML = `
      <div class="drag-handle"><i class="fa-solid fa-grip-dots-vertical"></i></div>
      ${thumbHtml}
      <div class="drag-info">
        <div class="drag-name">${escHtml(p.alt || 'Projekt')}</div>
        <div class="drag-meta">${p.imageUrl ? '<i class="fa-solid fa-link"></i> URL wklejony' : 'Brak URL'}</div>
      </div>
      <div class="drag-actions">
        <button class="btn-icon edit" title="Edytuj" onclick="openProjectModal('${p.id}')"><i class="fa-regular fa-pen"></i></button>
        <button class="btn-icon del"  title="Usuń"   onclick="deleteProject('${p.id}')"><i class="fa-regular fa-trash"></i></button>
      </div>`;

    setupDrag(el, 'projects');
    listEl.appendChild(el);
  });
}

let editProjectId = null;

function openProjectModal(id = null) {
  editProjectId = id;
  const m = document.getElementById('projectModal');
  m.classList.add('open');

  if (id) {
    const p = State.projects.find(x => x.id === id);
    document.getElementById('pUrl').value = p.imageUrl || '';
    document.getElementById('pAlt').value = p.alt      || '';
    document.getElementById('projectModalTitle').textContent = 'Edytuj projekt';
    updateProjectPreview(p.imageUrl);
  } else {
    document.getElementById('projectForm').reset();
    updateProjectPreview('');
    document.getElementById('projectModalTitle').textContent = 'Dodaj projekt';
  }

  setTimeout(() => document.getElementById('pUrl').focus(), 100);
}

function closeProjectModal() {
  document.getElementById('projectModal').classList.remove('open');
  editProjectId = null;
}

document.getElementById('pUrl').addEventListener('input', e => {
  updateProjectPreview(e.target.value.trim());
});

function updateProjectPreview(url) {
  const wrap = document.getElementById('projectImgPreview');
  if (url) {
    wrap.innerHTML = `<img src="${escHtml(url)}" alt="podgląd" onerror="this.style.display='none'">`;
  } else {
    wrap.innerHTML = `<div class="img-preview-placeholder"><i class="fa-regular fa-image"></i>Wklej URL, aby zobaczyć podgląd</div>`;
  }
}

document.getElementById('projectForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('projectSaveBtn');
  btn.disabled = true;
  btn.textContent = 'Zapisuję…';

  const data = {
    imageUrl: document.getElementById('pUrl').value.trim(),
    alt:      document.getElementById('pAlt').value.trim(),
  };

  try {
    if (editProjectId) {
      await db.collection('projects').doc(editProjectId).update(data);
      toast('Projekt zaktualizowany');
    } else {
      data.order = State.projects.length;
      await db.collection('projects').add(data);
      toast('Projekt dodany');
    }
    closeProjectModal();
    await loadProjects();
    updateOverview();
  } catch (err) {
    toast('Błąd zapisu: ' + err.message, 'error');
  }

  btn.disabled = false;
  btn.textContent = 'Zapisz';
});

function deleteProject(id) {
  const p = State.projects.find(x => x.id === id);
  confirm(`Usunąć projekt „${p?.alt || 'projekt'}"?`, async () => {
    try {
      await db.collection('projects').doc(id).delete();
      toast('Projekt usunięty');
      await loadProjects();
      updateOverview();
    } catch (e) {
      toast('Błąd usuwania', 'error');
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   DRAG & DROP — wspólna logika
   ═══════════════════════════════════════════════════════════ */
function setupDrag(el, collection) {
  el.addEventListener('dragstart', e => {
    dragSrc  = el;
    dragList = collection;
    setTimeout(() => el.classList.add('dragging'), 0);
    e.dataTransfer.effectAllowed = 'move';
  });

  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    document.querySelectorAll('.drag-item').forEach(i => i.classList.remove('drag-over'));
    dragSrc  = null;
    dragList = null;
  });

  el.addEventListener('dragover', e => {
    e.preventDefault();
    if (dragSrc && dragSrc !== el) {
      el.classList.add('drag-over');
    }
  });

  el.addEventListener('dragleave', () => {
    el.classList.remove('drag-over');
  });

  el.addEventListener('drop', async e => {
    e.preventDefault();
    el.classList.remove('drag-over');

    if (!dragSrc || dragSrc === el || dragList !== collection) return;

    const listEl  = el.parentElement;
    const items   = [...listEl.querySelectorAll('.drag-item')];
    const fromIdx = items.indexOf(dragSrc);
    const toIdx   = items.indexOf(el);

    if (fromIdx === -1 || toIdx === -1) return;

    // Przenieś w DOM
    if (fromIdx < toIdx) {
      listEl.insertBefore(dragSrc, el.nextSibling);
    } else {
      listEl.insertBefore(dragSrc, el);
    }

    // Zaktualizuj State + Firestore
    await reorderCollection(collection);
  });
}

async function reorderCollection(collection) {
  const listEl  = document.getElementById(`${collection}List`);
  const items   = [...listEl.querySelectorAll('.drag-item')];
  const ids     = items.map(el => el.dataset.id);

  // Aktualizuj State
  const stateArr = State[collection];
  const reordered = ids.map(id => stateArr.find(x => x.id === id)).filter(Boolean);
  State[collection] = reordered;

  // Batch write do Firestore
  try {
    const batch = db.batch();
    ids.forEach((id, i) => {
      batch.update(db.collection(collection).doc(id), { order: i });
    });
    await batch.commit();
    toast('Kolejność zapisana');
  } catch (err) {
    toast('Błąd zapisu kolejności: ' + err.message, 'error');
  }
}

/* ── OVERVIEW ───────────────────────────────────────────── */
function updateOverview() {
  document.getElementById('overviewReviews').textContent  = State.reviews.length;
  document.getElementById('overviewClients').textContent  = State.clients.length;
  document.getElementById('overviewProjects').textContent = State.projects.length;
  document.getElementById('overviewGallery').textContent  = State.gallery.length;  // ← to
}

/* ── ESCAPE HTML ────────────────────────────────────────── */
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── KEYBOARD ESC ───────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
});

/* ── STAŁE ──────────────────────────────────────────────── */
const GALLERY_CATS = {
  logo:      'Logotyp',
  banner:    'Banner',
  wizytowka: 'Wizytówka',
  produkt:   'Produkt',
};

let activeGalleryCat = 'all';
let editGalleryId    = null;
let galleryDragSrc   = null;

/* ── ZAKŁADKI KATEGORII ─────────────────────────────────── */
document.querySelectorAll('.gallery-dash-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.gallery-dash-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeGalleryCat = btn.dataset.cat;
    renderGallery();
    // Pokaż info o drag tylko gdy wybrana konkretna kategoria
    const info = document.getElementById('galleryDragInfo');
    if (info) info.style.display = activeGalleryCat !== 'all' ? 'flex' : 'none';
  });
});

/* ── LOAD ───────────────────────────────────────────────── */
async function loadGallery() {
  const listEl = document.getElementById('galleryList');
  listEl.innerHTML = `<div class="loader"><i class="fa-solid fa-spinner"></i> Wczytywanie…</div>`;

  try {
    const snap = await db.collection('gallery').get(); // ← bez orderBy
    State.gallery = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    State.gallery = [];
    console.error('Galeria błąd:', e);
    toast('Błąd wczytywania galerii', 'error');
  }

  renderGallery();
}

/* ── RENDER ─────────────────────────────────────────────── */
function renderGallery() {
  updateGalleryCounts();

  const listEl = document.getElementById('galleryList');
  const cat    = activeGalleryCat;

  /* Pobierz i posortuj elementy */
  let items;
  if (cat === 'all') {
    // Grupuj po kategorii, w ramach kategorii sortuj po order
    items = [...State.gallery].sort((a, b) => {
      if (a.cat < b.cat) return -1;
      if (a.cat > b.cat) return 1;
      return (a.order ?? 0) - (b.order ?? 0);
    });
  } else {
    items = State.gallery
      .filter(g => g.cat === cat)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  if (!items.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-images"></i>
        <p>${cat === 'all' ? 'Galeria jest pusta. Dodaj pierwsze zdjęcie!' : 'Brak zdjęć w tej kategorii.'}</p>
      </div>`;
    return;
  }

  listEl.innerHTML = '';
  listEl.className = 'drag-list';

  /* W widoku "wszystkie" wstawiaj nagłówki kategorii */
  let lastCat = null;

  items.forEach(g => {
    /* Separator kategorii w widoku "all" */
    if (cat === 'all' && g.cat !== lastCat) {
      lastCat = g.cat;
      const sep = document.createElement('div');
      sep.className = 'gallery-cat-sep';
      sep.innerHTML = `<span class="gallery-cat-sep-label">${GALLERY_CATS[g.cat] || g.cat}</span>`;
      listEl.appendChild(sep);
    }

    const el = document.createElement('div');
    el.className = 'drag-item';
    el.dataset.id  = g.id;
    el.dataset.cat = g.cat;

    /* Tylko w widoku kategorii włącz drag */
    if (cat !== 'all') {
      el.draggable = true;
    }

    const thumbHtml = g.imageUrl
      ? `<img class="drag-thumb" src="${escHtml(g.imageUrl)}" alt="${escHtml(g.title || '')}" loading="lazy">`
      : `<div class="drag-thumb-placeholder"><i class="fa-regular fa-image"></i></div>`;

    const catLabel  = GALLERY_CATS[g.cat] || g.cat || '';
    const catClass  = `gallery-cat-badge gallery-cat-${g.cat}`;
    const handleHtml = cat !== 'all'
      ? `<div class="drag-handle"><i class="fa-solid fa-grip-dots-vertical"></i></div>`
      : `<div class="drag-handle" style="opacity:0.2;cursor:default"><i class="fa-solid fa-grip-dots-vertical"></i></div>`;

    el.innerHTML = `
      ${handleHtml}
      ${thumbHtml}
      <div class="drag-info">
        <div class="drag-name">${escHtml(g.title || 'Bez tytułu')}</div>
        <div class="drag-meta">
          <span class="${catClass}">${catLabel}</span>
          ${g.tools ? ` · ${escHtml(g.tools)}` : ''}
          ${g.year  ? ` · ${escHtml(g.year)}`  : ''}
        </div>
      </div>
      <div class="drag-actions">
        <button class="btn-icon edit" title="Edytuj"
          onclick="openGalleryModal('${g.id}')">
          <i class="fa-regular fa-pen"></i>
        </button>
        <button class="btn-icon del" title="Usuń"
          onclick="deleteGalleryItem('${g.id}')">
          <i class="fa-regular fa-trash"></i>
        </button>
      </div>`;

    if (cat !== 'all') setupGalleryDrag(el);
    listEl.appendChild(el);
  });
}

/* ── COUNTS ─────────────────────────────────────────────── */
function updateGalleryCounts() {
  const total = State.gallery.length;
  const cnt = document.getElementById('galleryCount');
  if (cnt) cnt.textContent = total;

  const all = document.getElementById('gCount-all');
  if (all) all.textContent = total;

  Object.keys(GALLERY_CATS).forEach(cat => {
    const el = document.getElementById(`gCount-${cat}`);
    if (el) el.textContent = State.gallery.filter(g => g.cat === cat).length;
  });

  const ov = document.getElementById('overviewGallery');
  if (ov) ov.textContent = total;
}

/* ── DRAG & DROP (per kategoria) ────────────────────────── */
function setupGalleryDrag(el) {
  el.addEventListener('dragstart', e => {
    galleryDragSrc = el;
    setTimeout(() => el.classList.add('dragging'), 0);
    e.dataTransfer.effectAllowed = 'move';
  });

  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    document.querySelectorAll('#galleryList .drag-item')
      .forEach(i => i.classList.remove('drag-over'));
    galleryDragSrc = null;
  });

  el.addEventListener('dragover', e => {
    e.preventDefault();
    if (galleryDragSrc && galleryDragSrc !== el) {
      el.classList.add('drag-over');
    }
  });

  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));

  el.addEventListener('drop', async e => {
    e.preventDefault();
    el.classList.remove('drag-over');
    if (!galleryDragSrc || galleryDragSrc === el) return;

    const listEl  = el.parentElement;
    const items   = [...listEl.querySelectorAll('.drag-item')];
    const fromIdx = items.indexOf(galleryDragSrc);
    const toIdx   = items.indexOf(el);
    if (fromIdx === -1 || toIdx === -1) return;

    if (fromIdx < toIdx) {
      listEl.insertBefore(galleryDragSrc, el.nextSibling);
    } else {
      listEl.insertBefore(galleryDragSrc, el);
    }

    await reorderGalleryCategory(activeGalleryCat);
  });
}

async function reorderGalleryCategory(cat) {
  const listEl = document.getElementById('galleryList');
  const items  = [...listEl.querySelectorAll('.drag-item')];
  const ids    = items.map(el => el.dataset.id);

  /* Zaktualizuj State — tylko elementy danej kategorii */
  const others     = State.gallery.filter(g => g.cat !== cat);
  const reordered  = ids
    .map(id => State.gallery.find(g => g.id === id))
    .filter(Boolean)
    .map((g, i) => ({ ...g, order: i }));

  State.gallery = [...others, ...reordered];

  /* Batch write */
  try {
    const batch = db.batch();
    reordered.forEach((g, i) => {
      batch.update(db.collection('gallery').doc(g.id), { order: i });
    });
    await batch.commit();
    toast('Kolejność zapisana');
  } catch (err) {
    toast('Błąd zapisu kolejności: ' + err.message, 'error');
  }
}

/* ── MODAL ──────────────────────────────────────────────── */
function openGalleryModal(id = null) {
  editGalleryId = id;
  const m = document.getElementById('galleryModal');
  m.classList.add('open');

  if (id) {
    const g = State.gallery.find(x => x.id === id);
    document.getElementById('gUrl').value   = g.imageUrl || '';
    document.getElementById('gTitle').value = g.title    || '';
    document.getElementById('gCat').value   = g.cat      || '';
    document.getElementById('gDesc').value  = g.desc     || '';
    document.getElementById('gTools').value = g.tools    || '';
    document.getElementById('gTime').value  = g.time     || '';
    document.getElementById('gYear').value  = g.year     || '';
    document.getElementById('galleryModalTitle').textContent = 'Edytuj zdjęcie';
    updateGalleryPreview(g.imageUrl);
  } else {
    document.getElementById('galleryForm').reset();
    updateGalleryPreview('');
    document.getElementById('galleryModalTitle').textContent = 'Dodaj zdjęcie';
  }

  setTimeout(() => document.getElementById('gUrl').focus(), 100);
}

function closeGalleryModal() {
  document.getElementById('galleryModal').classList.remove('open');
  editGalleryId = null;
}

document.getElementById('gUrl').addEventListener('input', e => {
  updateGalleryPreview(e.target.value.trim());
});

function updateGalleryPreview(url) {
  const wrap = document.getElementById('galleryImgPreview');
  if (!wrap) return;
  if (url) {
    wrap.innerHTML = `<img src="${escHtml(url)}" alt="podgląd"
      onerror="this.parentElement.innerHTML='<div class=\\'img-preview-placeholder\\'><i class=\\'fa-regular fa-triangle-exclamation\\'></i>Nie można załadować obrazu</div>'">`;
  } else {
    wrap.innerHTML = `<div class="img-preview-placeholder">
      <i class="fa-regular fa-image"></i>Wklej URL, aby zobaczyć podgląd</div>`;
  }
}

/* ── SAVE ───────────────────────────────────────────────── */
document.getElementById('galleryForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('gallerySaveBtn');
  btn.disabled    = true;
  btn.textContent = 'Zapisuję…';

  const cat = document.getElementById('gCat').value;

  const data = {
    imageUrl: document.getElementById('gUrl').value.trim(),
    title:    document.getElementById('gTitle').value.trim(),
    cat,
    catLabel: GALLERY_CATS[cat] || cat,
    desc:     document.getElementById('gDesc').value.trim(),
    tools:    document.getElementById('gTools').value.trim(),
    time:     document.getElementById('gTime').value.trim(),
    year:     document.getElementById('gYear').value.trim(),
  };

  try {
    if (editGalleryId) {
      await db.collection('gallery').doc(editGalleryId).update(data);
      toast('Zdjęcie zaktualizowane');
    } else {
      /* Nowy element dostaje kolejny numer w swojej kategorii */
      const catItems = State.gallery.filter(g => g.cat === cat);
      data.order = catItems.length;
      await db.collection('gallery').add(data);
      toast('Zdjęcie dodane');
    }
    closeGalleryModal();
    await loadGallery();
    updateOverview();
  } catch (err) {
    toast('Błąd zapisu: ' + err.message, 'error');
  }

  btn.disabled    = false;
  btn.textContent = 'Zapisz';
});

/* ── DELETE ─────────────────────────────────────────────── */
function deleteGalleryItem(id) {
  const g = State.gallery.find(x => x.id === id);
  confirm(`Usunąć „${g?.title || 'to zdjęcie'}"?`, async () => {
    try {
      await db.collection('gallery').doc(id).delete();
      toast('Zdjęcie usunięte');
      await loadGallery();
      updateOverview();
    } catch (e) {
      toast('Błąd usuwania', 'error');
    }
  });
}




/* ═══════════════════════════════════════════════════════════
   CLOUDINARY UPLOAD (unsigned preset)
═══════════════════════════════════════════════════════════ */
const CLOUDINARY_CLOUD_NAME = 'dafgacxhm';
const CLOUDINARY_UPLOAD_PRESET = 'dashboard_unsigned';
const MAX_UPLOAD_MB = 5;

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Upload nie powiódł się.');
  }
  const data = await res.json();
  return data.secure_url;
}

function setupCloudinaryUpload({ fileInputId, urlInputId, btnId, previewFn }) {
  const fileInput = document.getElementById(fileInputId);
  const urlInput = document.getElementById(urlInputId);
  const btn = document.getElementById(btnId);
  if (!fileInput || !urlInput || !btn) return;

  const originalLabel = btn.innerHTML;
  btn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast('Dozwolone formaty: JPG, PNG, WebP', 'error');
      fileInput.value = '';
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      toast(`Plik jest większy niż ${MAX_UPLOAD_MB}MB`, 'error');
      fileInput.value = '';
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Wysyłanie…';

    try {
      const url = await uploadToCloudinary(file);
      urlInput.value = url;
      if (typeof previewFn === 'function') previewFn(url);
      toast('Plik przesłany na Cloudinary');
    } catch (err) {
      toast('Błąd uploadu: ' + err.message, 'error');
    } finally {
      fileInput.value = '';
      btn.disabled = false;
      btn.innerHTML = originalLabel;
    }
  });
}

setupCloudinaryUpload({ fileInputId: 'cFile', urlInputId: 'cUrl', btnId: 'cUploadBtn', previewFn: updateClientPreview });
setupCloudinaryUpload({ fileInputId: 'pFile', urlInputId: 'pUrl', btnId: 'pUploadBtn', previewFn: updateProjectPreview });
setupCloudinaryUpload({ fileInputId: 'gFile', urlInputId: 'gUrl', btnId: 'gUploadBtn', previewFn: updateGalleryPreview });