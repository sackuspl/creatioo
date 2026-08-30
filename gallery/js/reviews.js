document.addEventListener("DOMContentLoaded", () => {
  const track    = document.getElementById("reviews-track");
  const dotsWrap = document.getElementById("reviews-dots");
  const prev     = document.querySelector(".prev-review");
  const next     = document.querySelector(".next-review");

  const reviewsData = [
    { name: "Marta Wiśniewska", role: "CEO, BrandLab",      text: "Współpraca z Sacky to czysta przyjemność. Logotyp, który stworzył dla nas, przeszedł nasze oczekiwania — minimalistyczny, a jednocześnie bardzo charakterystyczny.", stars: 5 },
    { name: "Tomasz Jabłoński",  role: "Founder, TJ Digital", text: "Profesjonalizm na najwyższym poziomie. Projekty zawsze na czas, poprawki bez problemów, a efekt końcowy za każdym razem robi wrażenie na klientach.", stars: 5 },
    { name: "Karolina Zając",   role: "Marketing, Novera",   text: "Identyfikacja wizualna, którą przygotował Sacky, całkowicie odświeżyła nasz wizerunek. Klienci od razu zauważyli zmianę i komentują bardzo pozytywnie.", stars: 5 },
    { name: "Piotr Krawczyk",   role: "Studio Kreatywne",    text: "Zlecałem projekt materiałów na social media — efekt był lepszy niż się spodziewałem. Szybki kontakt, świetne wyczucie estetyki.", stars: 4 },
    { name: "Agnieszka Kowal",  role: "E-commerce Owner",    text: "Świetna grafika do reklam online. CTR wzrósł znacząco po zmianie kreacji. Zdecydowanie polecam każdemu, kto szuka kogoś z prawdziwym talentem.", stars: 5 },
    { name: "Bartek Nowicki",   role: "Restauracja Umami",   text: "Menu i materiały drukowane wyglądają rewelacyjnie. Goście często pytają kto to projektował — to chyba najlepszy dowód jakości.", stars: 5 },
  ];

  const VISIBLE = 3;
  const GAP = 20;
  let index = 0;
  const total = reviewsData.length;
  const maxIndex = total - VISIBLE;

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
          ${'<i class="icon--fa6-solid icon--fa6-solid--star"></i>'.repeat(r.stars)}
          ${r.stars < 5 ? '<i class="icon--fa6-regular icon--fa6-regular--star"></i>'.repeat(5 - r.stars) : ''}
        </div>
      </div>
      <p>${r.text}</p>
    </div>
  `).join("");

  // dots — jedna kropka na grupę 3
  const dotCount = Math.ceil(total / VISIBLE);
  dotsWrap.innerHTML = Array.from({ length: dotCount }, (_, i) =>
    `<div class="reviews-dot${i === 0 ? ' active' : ''}" data-i="${i}"></div>`
  ).join("");

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