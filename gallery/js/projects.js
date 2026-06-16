    // ── PROJECTS SLIDER ──
const pTrack    = document.getElementById("projects-track");
const pDotsWrap = document.getElementById("projects-dots");
const pPrev     = document.querySelector(".prev-project");
const pNext     = document.querySelector(".next-project");

const P_VISIBLE = 3;
const P_GAP     = 16;
const pCards    = pTrack.querySelectorAll(".project-placeholder, img");
const pTotal    = pCards.length;
const pMaxIndex = pTotal - P_VISIBLE;
let pIndex      = 0;

// dots
const pDotCount = Math.ceil(pTotal / P_VISIBLE);
pDotsWrap.innerHTML = Array.from({ length: pDotCount }, (_, i) =>
  `<div class="projects-dot${i === 0 ? ' active' : ''}" data-i="${i}"></div>`
).join("");
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