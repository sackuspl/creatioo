// ── PROJECTS SLIDER ──────────────────────────────────────────
(async function () {
  const pTrack    = document.getElementById("projects-track");
  const pDotsWrap = document.getElementById("projects-dots");
  const pPrev     = document.querySelector(".prev-project");
  const pNext     = document.querySelector(".next-project");

  const P_VISIBLE = 3;
  const P_GAP     = 16;

  // Domyślne placeholdery — widoczne, jeśli baza Firestore jest jeszcze
  // pusta lub aktualnie niedostępna. Dashboard nadpisuje tę listę.
  const defaultPlaceholdersHTML = `
    <div class="project-placeholder"><i class="fa-solid fa-image"></i><span>Projekt 1</span></div>
    <div class="project-placeholder"><i class="fa-solid fa-image"></i><span>Projekt 2</span></div>
    <div class="project-placeholder"><i class="fa-solid fa-image"></i><span>Projekt 3</span></div>
    <div class="project-placeholder"><i class="fa-solid fa-image"></i><span>Projekt 4</span></div>
    <div class="project-placeholder"><i class="fa-solid fa-image"></i><span>Projekt 5</span></div>
  `;

  try {
    const snap = await db.collection("projects").orderBy("order").get();
    if (!snap.empty) {
      pTrack.innerHTML = snap.docs.map(doc => {
        const p = doc.data();
        return `<img src="${p.imageUrl}" alt="${p.alt || 'Projekt'}">`;
      }).join("");
    } else {
      pTrack.innerHTML = defaultPlaceholdersHTML;
    }
  } catch (err) {
    console.error("Nie udało się wczytać projektów z Firestore, używam domyślnych:", err);
    pTrack.innerHTML = defaultPlaceholdersHTML;
  }

  const pCards    = pTrack.querySelectorAll(".project-placeholder, img");
  const pTotal    = pCards.length;
  const pMaxIndex = Math.max(0, pTotal - P_VISIBLE);
  let pIndex      = 0;

  // Jeśli jest mniej elementów niż widocznych miejsc — chowamy nawigację
  const showNav = pTotal > P_VISIBLE;
  pPrev.style.display = showNav ? "" : "none";
  pNext.style.display = showNav ? "" : "none";

  // dots
  const pDotCount = Math.ceil(pTotal / P_VISIBLE);
  pDotsWrap.innerHTML = showNav ? Array.from({ length: pDotCount }, (_, i) =>
    `<div class="projects-dot${i === 0 ? ' active' : ''}" data-i="${i}"></div>`
  ).join("") : "";
  const pDots = pDotsWrap.querySelectorAll(".projects-dot");

  function setProjectWidths() {
    const viewport = document.querySelector(".projects-viewport");
    const cardWidth = (viewport.offsetWidth - P_GAP * (P_VISIBLE - 1)) / P_VISIBLE;
    pCards.forEach(c => {
      c.style.width    = cardWidth + "px";
      c.style.minWidth = cardWidth + "px";
    });
  }

  function updateProjects() {
    const viewport  = document.querySelector(".projects-viewport");
    const cardWidth = (viewport.offsetWidth - P_GAP * (P_VISIBLE - 1)) / P_VISIBLE;
    pTrack.style.transform = `translateX(-${pIndex * (cardWidth + P_GAP)}px)`;

    const activeDot = Math.min(Math.floor(pIndex / P_VISIBLE), pDotCount - 1);
    pDots.forEach((d, i) => d.classList.toggle("active", i === activeDot));
  }

  pNext.addEventListener("click", () => {
    pIndex = pIndex >= pMaxIndex ? 0 : pIndex + 1;
    updateProjects();
  });

  pPrev.addEventListener("click", () => {
    pIndex = pIndex <= 0 ? pMaxIndex : pIndex - 1;
    updateProjects();
  });

  pDots.forEach(d => {
    d.addEventListener("click", () => {
      pIndex = Math.min(parseInt(d.dataset.i) * P_VISIBLE, pMaxIndex);
      updateProjects();
    });
  });

  window.addEventListener("resize", () => { setProjectWidths(); updateProjects(); });
  setProjectWidths();
  updateProjects();
})();