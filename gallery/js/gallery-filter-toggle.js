/* ═══════════════════════════════════════════════════════════════
   gallery-filter-toggle.js (v4)
   Podmień plik js/gallery-filter-toggle.js na ten.

   POPRAWKA: przyciemnienie tła było wcześniej pseudo-elementem
   (body::after), który nie może mieć własnego nasłuchiwacza
   kliknięć w JS — stąd ekran się zaciemniał, ale nic nie reagowało
   na dotyk. Teraz to prawdziwy element <div> dodawany do strony,
   z własnym kliknięciem zamykającym panel — w 100% pod kontrolą.
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn   = document.getElementById("filterToggleBtn");
  const toggleLabel = document.getElementById("filterToggleLabel");
  const panel       = document.getElementById("galleryFiltersPanel");

  if (!toggleBtn || !panel) return;

  // ── NAPRAWA "blur na cały ekran, nie da się kliknąć kategorii" ──
  // .gallery-section > * ma w style.css wymuszone position:relative +
  // z-index:1 (dla ozdobnych rozmytych kółek w tle). To tworzy nowy
  // stacking context na .container, wewnątrz którego panel filtrów
  // jest uwięziony — jego lokalny z-index:999 nic nie daje, bo
  // .gallery-filter-backdrop (dodawany prosto do <body>, z-index:998)
  // żyje w głównym stackingu i zawsze wygrywa z całym .container (z:1).
  // Rozwiązanie: gdy panel jest otwarty, podbijamy z-index tego
  // konkretnego przodka ponad backdrop, żeby panel mógł się pokazać.
  const stackingAncestor = toggleBtn.closest(".container") || toggleBtn.parentElement;
  const ancestorPrevZIndex = stackingAncestor ? stackingAncestor.style.zIndex : "";

  const filterLabels = {
    all: "Wszystkie",
    logo: "Logotypy",
    banner: "Bannery",
    miniatura: "Miniatury",
    wizytowka: "Wizytówki",
    produkt: "Produkty",
  };

  // Prawdziwy, klikalny element przyciemnienia — tworzony raz,
  // dodawany na końcu <body>.
  let backdrop = document.getElementById("galleryFilterBackdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "galleryFilterBackdrop";
    backdrop.className = "gallery-filter-backdrop";
    document.body.appendChild(backdrop);
  }

  function positionPanel() {
    const rect = toggleBtn.getBoundingClientRect();
    panel.style.setProperty("--dd-top", `${rect.bottom + 8}px`);
    panel.style.setProperty("--dd-left", `${rect.left}px`);
    panel.style.setProperty("--dd-width", `${rect.width}px`);
  }

  function openPanel() {
    positionPanel();
    if (stackingAncestor) stackingAncestor.style.zIndex = "1000"; // ponad backdropem (998)
    panel.classList.add("open");
    toggleBtn.classList.add("open");
    toggleBtn.setAttribute("aria-expanded", "true");
    backdrop.classList.add("open");
  }

  function closePanel() {
    panel.classList.remove("open");
    toggleBtn.classList.remove("open");
    toggleBtn.setAttribute("aria-expanded", "false");
    backdrop.classList.remove("open");
    if (stackingAncestor) stackingAncestor.style.zIndex = ancestorPrevZIndex; // przywróć oryginał
  }

  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (panel.classList.contains("open")) {
      closePanel();
    } else {
      openPanel();
    }
  });

  // Kliknięcie w przyciemnione tło — zamyka panel. To jest teraz
  // prawdziwy element z realnym nasłuchiwaczem, więc zawsze działa.
  backdrop.addEventListener("click", closePanel);

  panel.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.filter;
      if (toggleLabel) {
        toggleLabel.textContent = filterLabels[key] || "Wybierz kategorię";
      }
      closePanel();
    });
  });

  // Zapasowe zamykanie po kliknięciu gdziekolwiek poza panelem/przyciskiem
  document.addEventListener("click", (e) => {
    if (!panel.classList.contains("open")) return;
    if (!toggleBtn.contains(e.target) && !panel.contains(e.target)) {
      closePanel();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanel();
  });

  window.addEventListener("scroll", () => {
    if (panel.classList.contains("open")) closePanel();
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (panel.classList.contains("open")) positionPanel();
  });
});
