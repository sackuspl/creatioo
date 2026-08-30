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

  // Spośród ilu najbliższych dopasowań losujemy — NIE stała liczba, tylko
  // procent dostępnych kandydatów. Dzięki temu przy dużej galerii (50+
  // zdjęć) pula wyboru realnie rośnie zamiast zawsze kręcić tymi samymi
  // 4 "najidealniej" pasującymi zdjęciami.
  const TOP_N_PERCENT  = 0.35;   // do 35% najlepiej dopasowanych kandydatów
  const TOP_N_MIN      = 6;      // ale nigdy mniej niż tyle (gdy pula jest mała)

  const SLOTS = ["wide", "square1", "tall", "square2", "square3", "square4"];

  // "Chłodzenie": zdjęcie, które właśnie zniknęło z ramki, nie powinno
  // wrócić (w tej samej lub innej ramce) zbyt szybko. Pamiętamy N ostatnio
  // pokazanych zdjęć i domyślnie je omijamy — rozmiar chłodzenia skaluje
  // się z wielkością galerii, żeby przy małej puli nie zablokować wyboru.

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const fallbackIcons = ["star", "image", "address-card", "box", "palette", "brush"];

  function renderFallback() {
    showcase.innerHTML = SLOTS.map((slot, i) => `
      <div class="project-tile project-tile--empty" data-slot="${slot}">
        <div class="project-tile-empty-icon">
          <i class="icon--fa6-solid icon--fa6-solid--${fallbackIcons[i % fallbackIcons.length]}"></i>
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

  // Rozmiar "chłodni": ~40% puli, min. 2x liczba ramek, ale zawsze
  // zostawiamy przynajmniej kilka zdjęć poza chłodzeniem do wyboru.
  const COOLDOWN_SIZE = Math.max(
    SLOTS.length * 2,
    Math.min(pool.length - SLOTS.length - 1, Math.ceil(pool.length * 0.4))
  );
  let recentlyShown = []; // kolejka FIFO ostatnio pokazanych src

  function markShown(src) {
    recentlyShown.push(src);
    while (recentlyShown.length > COOLDOWN_SIZE) recentlyShown.shift();
  }

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

    // Wolimy zdjęcia jeszcze nie użyte w innych kafelkach w tym cyklu
    // ORAZ nie pokazywane niedawno (chłodzenie). Jeśli po odfiltrowaniu
    // zostaje zbyt mało kandydatów (mała galeria), łagodnie cofamy się
    // do pełnej puli — lepiej rzadka powtórka niż brak zdjęcia pasującego
    // kształtem.
    const cooling = new Set(recentlyShown);
    const combinedAvoid = avoidSrcs ? new Set([...avoidSrcs, ...cooling]) : cooling;
    const fresh = usable.filter(p => !combinedAvoid.has(p.src));
    const candidates = fresh.length > 0 ? fresh : usable.filter(p => !(avoidSrcs && avoidSrcs.has(p.src)));
    const finalCandidates = candidates.length > 0 ? candidates : usable;

    const ranked = finalCandidates
      .map(p => ({ item: p, dist: Math.abs(Math.log(p.ratio) - targetLog) }))
      .sort((a, b) => a.dist - b.dist);

    const n = Math.max(TOP_N_MIN, Math.ceil(ranked.length * TOP_N_PERCENT));
    const top = ranked.slice(0, Math.min(n, ranked.length));
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
    markShown(chosen.src);
    return { slot, targetRatio: slotRatios[slot], current: chosen };
  });

  showcase.innerHTML = tiles.map((t) => `
    <div class="project-tile" data-slot="${t.slot}">
      <img class="project-tile-img layer-a active" src="${t.current.src}" alt="${escapeHtml(t.current.alt)}" loading="lazy">
      <img class="project-tile-img layer-b" alt="" data-empty="1">
      <!-- brak atrybutu src celowo: pusty src="" powoduje w przeglądarce
           błędne pobranie bieżącej strony jako "obrazka" (błąd w konsoli,
           zbędny request). src ustawiany jest dopiero w JS, gdy warstwa
           zostanie faktycznie użyta. -->
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

      // Nie pokazuj zdjęcia, które w tej chwili jest już widoczne
      // w INNEJ ramce (dzięki temu nigdy nie ma dwóch takich samych
      // zdjęć na ekranie jednocześnie).
      const visibleElsewhere = new Set(
        tiles.filter(t => t !== state).map(t => t.current.src)
      );
      const next = pickFor(state.targetRatio, state.current.src, visibleElsewhere);
      markShown(next.src);
      hiddenImg.src = next.src;
      hiddenImg.alt = escapeHtml(next.alt);

      const doFade = () => {
        // resetuj Ken Burns na nowej warstwie tuż przed pokazaniem
        hiddenImg.classList.remove("kb-in");
        void hiddenImg.offsetWidth; // wymuś reflow, żeby animacja odpaliła od nowa
        hiddenImg.classList.add("active", "kb-in");
        // Ważne: NIE zdejmujemy tu "kb-in" ze znikającego zdjęcia —
        // jest ono w trakcie 7-sekundowego zoomu (zmiana zdjęć następuje
        // co 3.8–6.8s, czyli prawie zawsze w połowie animacji). Zdjęcie
        // tej klasy w tym momencie powodowałoby natychmiastowy "skok"
        // skali z powrotem do 1.055, bo transform straciłby przejście,
        // zanim opacity zdąży dojść do 0. "kb-in" zostaje — reset skali
        // nastąpi dopiero wtedy, gdy to zdjęcie znów stanie się warstwą
        // docelową (patrz reset na początku tej funkcji, kilka linii wyżej).
        activeImg.classList.remove("active");
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
