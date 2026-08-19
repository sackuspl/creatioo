// ── KARUZELA KLIENTÓW ("Zaufali mi") ──────────────────────────
(function () {
  const wrap  = document.getElementById('clientsMarquee');
  const track = document.getElementById('clientsTrack');
  if (!wrap || !track) return;

  // Domyślne logotypy — widoczne, jeśli baza Firestore jest jeszcze pusta
  // lub aktualnie niedostępna. Dashboard nadpisuje tę listę.
  const defaultClients = Array.from({ length: 8 }, () => ({
    imageUrl: "assets/images/clients/client1.png",
    alt: "Nazwa"
  }));

  function renderPills(list) {
    track.innerHTML = list.map(c =>
      `<div class="logo-pill"><img src="${c.imageUrl}" alt="${c.alt || 'Klient'}"></div>`
    ).join("");
  }

  (async function () {
    let clients = defaultClients;

    try {
      const snap = await db.collection("clients").orderBy("order").get();
      if (!snap.empty) {
        clients = snap.docs.map(doc => doc.data());
      }
    } catch (err) {
      console.error("Nie udało się wczytać klientów z Firestore, używam domyślnych:", err);
    }

    renderPills(clients);

    /* Czekaj na obrazki */
    await Promise.allSettled(
      [...track.querySelectorAll('img')].map(img =>
        img.complete
          ? Promise.resolve()
          : new Promise(r => { img.onload = r; img.onerror = r; })
      )
    );

    /* Pobierz oryginalne elementy i zmierz ich łączną szerokość */
    const items      = [...track.children];
    const gap        = 20; /* musi zgadzać się z gap w CSS */
    const itemsWidth = items.reduce((sum, el) => sum + el.offsetWidth + gap, 0);

    /* Klonuj tyle razy żeby wypełnić przynajmniej 3x szerokość okna */
    const copies = Math.ceil((window.innerWidth * 3) / itemsWidth) + 1;
    for (let i = 0; i < copies; i++) {
      items.forEach(el => track.appendChild(el.cloneNode(true)));
    }

    /* Zacznij od pozycji -itemsWidth żeby pierwszy zestaw był na środku */
    let x      = 0;
    let lastTs = null;
    let rafId  = null;

    const AUTO_PX_S = 60; /* px na sekundę auto-scroll */

    function setX(val) {
      /* Zawijaj: gdy wyjdziesz poza jeden zestaw, wróć o dokładnie itemsWidth */
      while (val <= -itemsWidth) val += itemsWidth;
      while (val >  0)           val -= itemsWidth;
      x = val;
      track.style.transform = `translateX(${x}px)`;
    }

    let isVisible = true; /* aktualizowane przez IntersectionObserver poniżej */

    /* Karuzela porusza się WYŁĄCZNIE automatycznie — kursor, scroll ani
       wheel nie mają na nią żadnego wpływu. Jedyna interakcja to hover
       na pojedynczych logotypach (obsługiwany w całości przez CSS). */
    function loop(ts) {
      if (lastTs == null) lastTs = ts;
      const dt = Math.min(ts - lastTs, 64);
      lastTs = ts;

      setX(x - AUTO_PX_S * dt / 1000);

      /* Nie planuj kolejnej klatki, gdy karuzela jest poza ekranem —
         oszczędza CPU i nie obciąża strony podczas scrollowania */
      rafId = isVisible ? requestAnimationFrame(loop) : null;
    }

    rafId = requestAnimationFrame(loop);

    /* Pauzuj animację, gdy karuzela nie jest widoczna na ekranie */
    const visibilityObserver = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
      if (isVisible && !rafId) {
        lastTs = null;
        rafId  = requestAnimationFrame(loop);
      }
    }, { threshold: 0 });
    visibilityObserver.observe(wrap);

  })();
})();
