/* ═══════════════════════════════════════════════════════════
   CREATIOO — "Wykonane projekty" (strona główna)
   Stały układ "bento" (miejsca: 1 szerokie, 1 pionowe, 4 kwadratowe)
   wypełniany losowymi zdjęciami z pełnej galerii Firestore
   (kolekcja "gallery" — to samo źródło co /gallery/js/gallery.js).

   Dopasowanie kształtu jest CIĄGŁE, nie kategoryczne: dla każdego
   miejsca mierzymy jego RZECZYWISTE proporcje w DOM-ie (szerokość /
   wysokość tak, jak faktycznie wyszły z siatki CSS na danym ekranie)
   i wybieramy zdjęcie, którego naturalna proporcja jest najbliższa —
   więc do wąskiej pionowej ramki nigdy nie trafi kwadrat, jeśli jest
   dostępne coś bardziej pionowego, a object-fit: cover prawie nic
   nie ucina. Układ (siatka miejsc) sam w sobie się nie zmienia, więc
   strona nigdy się "nie rozjeżdża" — zmienia się tylko zdjęcie
   w środku, płynnym crossfadem + delikatnym efektem Ken Burns.
   ═══════════════════════════════════════════════════════════ */
(async function () {
  const showcase = document.getElementById("projects-showcase");
  if (!showcase) return;

  const MIN_INTERVAL   = 3800;   // ms
  const MAX_INTERVAL   = 6800;   // ms
  const FADE_MS        = 1200;
  const MAX_TO_MEASURE = 100;    // limit wstępnego mierzenia proporcji (wydajność)
  const TOP_N_CHOICES  = 4;      // spośród ilu najbliższych dopasowań losujemy

  const SLOTS = ["wide", "square1", "tall", "square2", "square3", "square4"];

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const fallbackIcons = ["fa-star", "fa-image", "fa-address-card", "fa-box", "fa-palette", "fa-brush"];

  function renderFallback() {
    showcase.innerHTML = SLOTS.map((slot, i) => `
      <div class="project-tile project-tile--empty" data-slot="${slot}">
        <div class="project-tile-empty-icon">
          <i class="fa-solid ${fallbackIcons[i % fallbackIcons.length]}"></i>
        </div>
      </div>
    `).join("");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ── Pobierz CAŁĄ pulę zdjęć z galerii (wszystkie kategorie) ── */
  let pool = [];
  try {
    const snap = await db.collection("gallery").get();
    pool = snap.docs
      .map(d => d.data())
      .filter(p => p.imageUrl)
      .map(p => ({ src: p.imageUrl, alt: p.title || p.catLabel || "Projekt" }));
  } catch (err) {
    console.error("Nie udało się wczytać galerii dla witryny projektów:", err);
  }

  if (pool.length === 0) {
    renderFallback();
    return;
  }

  /* Losowa kolejność puli */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const shuffledPool = shuffle(pool);

  /* ── Mierzenie realnych proporcji zdjęć (naturalWidth/naturalHeight) ── */
  function measure(item) {
    if (item.ratio) return Promise.resolve(item); // już zmierzone
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        item.ratio = img.naturalWidth / img.naturalHeight || 1;
        resolve(item);
      };
      img.onerror = () => {
        item.ratio = 1;
        item.broken = true;
        resolve(item);
      };
      img.src = item.src;
    });
  }

  const toMeasureNow = shuffledPool.slice(0, Math.min(MAX_TO_MEASURE, shuffledPool.length));
  await Promise.all(toMeasureNow.map(measure));

  const restToMeasure = shuffledPool.slice(toMeasureNow.length);
  let restIndex = 0;
  let measuring = false;

  async function measureMore(count = 15) {
    if (measuring || restIndex >= restToMeasure.length) return;
    measuring = true;
    const batch = restToMeasure.slice(restIndex, restIndex + count);
    restIndex += batch.length;
    await Promise.all(batch.map(measure));
    measuring = false;
  }

  /* ── Wybór najbliższego zdjęcia do rzeczywistych proporcji miejsca ──
     Porównujemy w skali logarytmicznej (log(szer/wys)), bo dzięki temu
     "2:1 szerokie" i "1:2 pionowe" są symetrycznie tak samo "daleko"
     od kwadratu — to dokładnie odpowiada temu, jak to widzi oko.     */
  function pickFor(targetRatio, excludeSrc, avoidSrcs) {
    const targetLog = Math.log(targetRatio || 1);
    const usable = pool.filter(p => p.ratio && !p.broken && p.src !== excludeSrc);

    if (usable.length === 0) {
      const any = pool.filter(p => p.src !== excludeSrc);
      return any.length ? any[Math.floor(Math.random() * any.length)] : pool[0];
    }

    // Wolimy zdjęcia jeszcze nie użyte w innych kafelkach w tym cyklu.
    const fresh = avoidSrcs ? usable.filter(p => !avoidSrcs.has(p.src)) : usable;
    const candidates = fresh.length > 0 ? fresh : usable;

    const ranked = candidates
      .map(p => ({ item: p, dist: Math.abs(Math.log(p.ratio) - targetLog) }))
      .sort((a, b) => a.dist - b.dist);

    const top = ranked.slice(0, Math.min(TOP_N_CHOICES, ranked.length));
    return top[Math.floor(Math.random() * top.length)].item;
  }

  /* ── Zbuduj puste kafelki najpierw, żeby zmierzyć ich REALNE proporcje
     z siatki CSS (różne na desktopie / tablecie / telefonie) ── */
  showcase.innerHTML = SLOTS.map(slot => `
    <div class="project-tile is-loading" data-slot="${slot}"></div>
  `).join("");

  function measureSlotRatios() {
    const ratios = {};
    showcase.querySelectorAll(".project-tile").forEach(el => {
      const r = el.getBoundingClientRect();
      ratios[el.dataset.slot] = (r.width > 0 && r.height > 0) ? (r.width / r.height) : 1;
    });
    return ratios;
  }

  // Poczekaj na layout (siatka CSS musi się "ułożyć" zanim zmierzymy).
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);
  const slotRatios = measureSlotRatios();

  /* ── Przydział startowych zdjęć — bez powtórzeń na starcie ── */
  const usedNow = new Set();
  const tiles = SLOTS.map((slot) => {
    const chosen = pickFor(slotRatios[slot], null, usedNow);
    usedNow.add(chosen.src);
    return { slot, targetRatio: slotRatios[slot], current: chosen };
  });

  showcase.innerHTML = tiles.map((t) => `
    <div class="project-tile" data-slot="${t.slot}">
      <img class="project-tile-img layer-a active" src="${t.current.src}" alt="${escapeHtml(t.current.alt)}" loading="lazy">
      <img class="project-tile-img layer-b" alt="">
      <div class="project-tile-overlay"></div>
      <span class="project-tile-title">${escapeHtml(t.current.alt)}</span>
    </div>
  `).join("");

  // Ponowny pomiar proporcji przy zmianie rozmiaru okna (np. obrót telefonu,
  // zmiana szerokości okna) — wpływa tylko na PRZYSZŁE dobierane zdjęcia,
  // sam układ miejsc nadal jest w 100% zdefiniowany przez CSS.
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const fresh = measureSlotRatios();
      tiles.forEach(t => {
        if (fresh[t.slot]) t.targetRatio = fresh[t.slot];
      });
    }, 250);
  });

  function cycleTile(tileEl, state) {
    if (prefersReduced) return; // brak auto-cyklu — zostaje statyczne, losowe zdjęcie

    const delay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
    setTimeout(async () => {
      if (restIndex < restToMeasure.length && pool.filter(p => p.ratio).length < pool.length * 0.6) {
        await measureMore();
      }

      const imgs      = tileEl.querySelectorAll(".project-tile-img");
      const activeImg = tileEl.querySelector(".project-tile-img.active");
      const hiddenImg = [...imgs].find(el => el !== activeImg);
      const titleEl   = tileEl.querySelector(".project-tile-title");

      const next = pickFor(state.targetRatio, state.current.src);
      hiddenImg.src = next.src;
      hiddenImg.alt = escapeHtml(next.alt);

      const doFade = () => {
        // resetuj Ken Burns na nowej warstwie tuż przed pokazaniem
        hiddenImg.classList.remove("kb-in");
        void hiddenImg.offsetWidth; // wymuś reflow, żeby animacja odpaliła od nowa
        hiddenImg.classList.add("active", "kb-in");
        activeImg.classList.remove("active", "kb-in");
        if (titleEl) titleEl.textContent = next.alt;
        state.current = next;
        cycleTile(tileEl, state);
      };

      if (hiddenImg.complete) {
        requestAnimationFrame(doFade);
      } else {
        hiddenImg.addEventListener("load", doFade, { once: true });
      }
    }, delay);
  }

  showcase.querySelectorAll(".project-tile").forEach((tileEl, i) => {
    const activeImg = tileEl.querySelector(".project-tile-img.active");
    if (activeImg) activeImg.classList.add("kb-in");
    cycleTile(tileEl, tiles[i]);
  });

  showcase.style.setProperty("--fade-ms", FADE_MS + "ms");
})();
