document.addEventListener("DOMContentLoaded", async () => {
  const track    = document.getElementById("reviews-track");
  const dotsWrap = document.getElementById("reviews-dots");
  const prev     = document.querySelector(".prev-review");
  const next     = document.querySelector(".next-review");

  // Domyślne opinie — widoczne, jeśli baza Firestore jest jeszcze pusta
  // lub aktualnie niedostępna. Dashboard nadpisuje tę listę.
  const defaultReviews = [
    { name: "Marta Wiśniewska", role: "CEO, BrandLab",      text: "Współpraca z Sacky to czysta przyjemność. Logotyp, który stworzył dla nas, przeszedł nasze oczekiwania — minimalistyczny, a jednocześnie bardzo charakterystyczny.", stars: 5 },
    { name: "Tomasz Jabłoński",  role: "Founder, TJ Digital", text: "Profesjonalizm na najwyższym poziomie. Projekty zawsze na czas, poprawki bez problemów, a efekt końcowy za każdym razem robi wrażenie na klientach.", stars: 5 },
    { name: "Karolina Zając",   role: "Marketing, Novera",   text: "Identyfikacja wizualna, którą przygotował Sacky, całkowicie odświeżyła nasz wizerunek. Klienci od razu zauważyli zmianę i komentują bardzo pozytywnie.", stars: 5 },
    { name: "Piotr Krawczyk",   role: "Studio Kreatywne",    text: "Zlecałem projekt materiałów na social media — efekt był lepszy niż się spodziewałem. Szybki kontakt, świetne wyczucie estetyki.", stars: 4 },
    { name: "Agnieszka Kowal",  role: "E-commerce Owner",    text: "Świetna grafika do reklam online. CTR wzrósł znacząco po zmianie kreacji. Zdecydowanie polecam każdemu, kto szuka kogoś z prawdziwym talentem.", stars: 5 },
    { name: "Bartek Nowicki",   role: "Restauracja Umami",   text: "Menu i materiały drukowane wyglądają rewelacyjnie. Goście często pytają kto to projektował — to chyba najlepszy dowód jakości.", stars: 5 },
  ];

  let reviewsData = defaultReviews;

  try {
    const snap = await db.collection("reviews").orderBy("order").get();
    if (!snap.empty) {
      reviewsData = snap.docs.map(doc => doc.data());
    }
  } catch (err) {
    console.error("Nie udało się wczytać opinii z Firestore, używam domyślnych:", err);
  }

  const VISIBLE = 3;
  const GAP = 20;
  let index = 0;
  const total = reviewsData.length;
  const maxIndex = Math.max(0, total - VISIBLE);

  // inicjały do awatara
  function initials(name) {
    return name.split(" ").map(w => w[0]).slice(0, 2).join("");
  }

  // render kart
  track.innerHTML = reviewsData.map(r => `
    <div class="review-card">
      <div class="review-header">
        <div class="review-avatar">${initials(r.name)}</div>
        <div class="review-meta">
          <strong>${r.name}</strong>
          <span>${r.role}</span>
        </div>
        <div class="review-stars">
          ${'<i class="fa-solid fa-star"></i>'.repeat(r.stars)}
          ${r.stars < 5 ? '<i class="fa-regular fa-star"></i>'.repeat(5 - r.stars) : ''}
        </div>
      </div>
      <p>${r.text}</p>
    </div>
  `).join("");

  // Jeśli jest mniej opinii niż widocznych miejsc — chowamy nawigację
  const showNav = total > VISIBLE;
  prev.style.display = showNav ? "" : "none";
  next.style.display = showNav ? "" : "none";

  // dots — jedna kropka na grupę 3
  const dotCount = Math.ceil(total / VISIBLE);
  dotsWrap.innerHTML = showNav ? Array.from({ length: dotCount }, (_, i) =>
    `<div class="reviews-dot${i === 0 ? ' active' : ''}" data-i="${i}"></div>`
  ).join("") : "";

  const dots = dotsWrap.querySelectorAll(".reviews-dot");

  function update() {
    const viewport = document.querySelector(".reviews-viewport");
    const cardWidth = (viewport.offsetWidth - GAP * (VISIBLE - 1)) / VISIBLE;
    const step = cardWidth + GAP;
    track.style.transform = `translateX(-${index * step}px)`;

    // sync dots
    const activeDot = Math.min(Math.floor(index / VISIBLE), dotCount - 1);
    dots.forEach((d, i) => d.classList.toggle("active", i === activeDot));
  }

  next.addEventListener("click", () => {
    index = index >= maxIndex ? 0 : index + 1;
    update();
  });

  prev.addEventListener("click", () => {
    index = index <= 0 ? maxIndex : index - 1;
    update();
  });

  dots.forEach(d => {
    d.addEventListener("click", () => {
      index = Math.min(parseInt(d.dataset.i) * VISIBLE, maxIndex);
      update();
    });
  });

  window.addEventListener("resize", update);
  update();
});


/* ── PUBLICZNY FORMULARZ „PRZEŚLIJ OPINIĘ” ────────────────── */
(() => {
  const overlay   = document.getElementById("publicReviewOverlay");
  const openBtn   = document.getElementById("openReviewFormBtn");
  const closeBtn  = document.getElementById("closePublicReviewForm");
  const form      = document.getElementById("publicReviewForm");
  const statusEl  = document.getElementById("prStatus");
  const submitBtn = document.getElementById("prSubmitBtn");
  const starBtns  = document.querySelectorAll(".pr-star-btn");

  let selectedStars = 5;

  /* ── DEVICE ID (wymagane przez reguły Firestore) ── */
  function getDeviceId() {
    let id = localStorage.getItem("reviewDeviceId");
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("reviewDeviceId", id);
    }
    return id;
  }
  const deviceId = getDeviceId();

  function setStars(n) {
    selectedStars = n;
    starBtns.forEach((b, i) => b.classList.toggle("active", i < n));
  }
  setStars(5);

  starBtns.forEach((btn, i) => {
    btn.addEventListener("click", () => setStars(i + 1));
  });

  function openForm() {
    overlay.classList.add("open");
    statusEl.textContent = "";
    statusEl.className = "pr-status";
  }
  function closeForm() {
    overlay.classList.remove("open");
  }

  openBtn?.addEventListener("click", openForm);
  closeBtn?.addEventListener("click", closeForm);
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) closeForm();
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("prName").value.trim();
    const role = document.getElementById("prRole").value.trim();
    const text = document.getElementById("prText").value.trim();

    if (!name || !text) {
      statusEl.textContent = "Uzupełnij wymagane pola.";
      statusEl.className = "pr-status error";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Wysyłanie…";

    try {
      await db.collection("pendingReviews").add({
        name,
        role,
        text,
        stars: selectedStars,
        status: "pending",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        deviceId,
      });

      await db.collection("reviewCooldowns").doc(deviceId).set({
        lastSubmit: firebase.firestore.FieldValue.serverTimestamp(),
      });

      statusEl.textContent = "Dziękujemy! Opinia czeka na zatwierdzenie.";
      statusEl.className = "pr-status success";
      form.reset();
      setStars(5);

      setTimeout(closeForm, 1800);
    } catch (err) {
      console.error(err);
      if (err.code === "permission-denied") {
        statusEl.textContent = "Wysłałeś już swoją opinię.";
      } else {
        statusEl.textContent = "Błąd wysyłania. Spróbuj ponownie.";
      }
      statusEl.className = "pr-status error";
    }

    submitBtn.disabled = false;
    submitBtn.textContent = "Wyślij do zatwierdzenia";
  });
})();