/* ── DANE PROJEKTÓW ──────────────────────────────────────── */
const projects = [
  {
    id: 1,
    cat: "logo",
    catLabel: "Logotyp",
    title: "Studio Flux – identyfikacja",
    desc: "Projekt logotypu dla agencji kreatywnej Studio Flux. Największym wyzwaniem było połączenie dynamiki i minimalizmu w jednym znaku. Klient chciał czegoś, co będzie działać równie dobrze na czarnym tle co na białym — bez utraty charakteru.\n\nZacząłem od szkiców odręcznych, testując kilkanaście koncepcji symbolu. Finalnie wybraliśmy formę opartą na ligaturze liter F i X, która wizualnie przypomina strzałkę w ruchu.",
    img: "https://picsum.photos/seed/logo1/600/700",
    tools: "Illustrator, Figma",
    time: "4 dni",
    year: "2024",
  },
  {
    id: 2,
    cat: "banner",
    catLabel: "Banner",
    title: "Kampania letnia – Social Media",
    desc: "Seria 6 bannerów na Instagram i Facebook dla marki odzieżowej. Wyzwanie polegało na zachowaniu spójności wizualnej przy różnych formatach (stories, post, reklama). Paleta ciepłych kolorów była z góry narzucona przez klienta — musiałem ją ożywić i nadać jej nowoczesny charakter.",
    img: "https://picsum.photos/seed/banner1/600/400",
    tools: "Photoshop, Illustrator",
    time: "2 dni",
    year: "2024",
  },
  {
    id: 3,
    cat: "wizytowka",
    catLabel: "Wizytówka",
    title: "Kancelaria Nowak – wizytówka premium",
    desc: "Dwustronna wizytówka dla kancelarii prawnej. Projekt miał emanować profesjonalizmem i zaufaniem — stąd wybór głębokiej granatowej bazy z lakierem punktowym UV na logotypie. Najtrudniejsze było przygotowanie pliku do druku z prawidłową bleed i marginesami bezpieczeństwa.",
    img: "https://picsum.photos/seed/wiz1/600/420",
    tools: "Illustrator, InDesign",
    time: "1 dzień",
    year: "2025",
  },
  {
    id: 4,
    cat: "produkt",
    catLabel: "Produkt",
    title: "Packshot kosmetyczny – seria Bloom",
    desc: "Retusz i kompozycja zdjęć produktowych dla linii kosmetyków Bloom. Sesja była zrobiona na zewnątrz w pełnym słońcu — duże prześwietlenia i dominanta cieplna. Praca polegała na korekcji kolorów, wycince produktu i umieszczeniu go na czystym, neutralnym tle.",
    img: "https://picsum.photos/seed/prod1/600/800",
    tools: "Photoshop, Lightroom",
    time: "3 dni",
    year: "2025",
  },
  {
    id: 5,
    cat: "logo",
    catLabel: "Logotyp",
    title: "Piekarnio – branding piekarni",
    desc: "Ciepły, rzemieślniczy logotyp dla lokalnej piekarni. Inspiracją były stare szyldy z lat 60. Klient zależało na 'ręcznie robionym' wyglądzie, ale bez kiczu. Łączyłem fonty o różnym charakterze, aż trafiłem na zestawienie, które działa.",
    img: "https://picsum.photos/seed/logo2/600/600",
    tools: "Illustrator, Procreate",
    time: "5 dni",
    year: "2024",
  },
  {
    id: 6,
    cat: "banner",
    catLabel: "Banner",
    title: "Black Friday – sklep online",
    desc: "Zestaw materiałów na Black Friday: banner na stronę główną, mailing HTML i kreacje na social. Deadline był bardzo napięty (72h od briefu do gotowych plików). Udało się dzięki wcześniej przygotowanemu systemowi grid dla tego klienta.",
    img: "https://picsum.photos/seed/banner2/600/340",
    tools: "Figma, Photoshop",
    time: "3 dni",
    year: "2024",
  },
  {
    id: 7,
    cat: "produkt",
    catLabel: "Produkt",
    title: "Butelka Aqua+ – wizualizacja 3D",
    desc: "Wizualizacja produktowa butelki dla startupu Aqua+. Produkt fizycznie nie istniał — projekt opierał się wyłącznie na szkicach technicznych. Stworzyłem model 3D, nadałem materiały i wyrenderowałem finalny packshot do prezentacji inwestorskiej.",
    img: "https://picsum.photos/seed/prod2/600/750",
    tools: "Blender, Photoshop",
    time: "6 dni",
    year: "2025",
  },
  {
    id: 8,
    cat: "logo",
    catLabel: "Logotyp",
    title: "TechNest – startup IT",
    desc: "Logo dla startupu technologicznego. Chcieliśmy uniknąć typowych 'IT-lookingów' — stąd decyzja o organicznej formie nawiązującej do gniazda (nest), ale zbudowanej z pikseli. Projekt przeszedł 4 rundy poprawek zanim klient zatwierdził kierunek.",
    img: "https://picsum.photos/seed/logo3/600/600",
    tools: "Figma, Illustrator",
    time: "7 dni",
    year: "2025",
  },
  {
    id: 9,
    cat: "wizytowka",
    catLabel: "Wizytówka",
    title: "DJ KRVN – wizytówka muzyczna",
    desc: "Niestandardowa wizytówka dla DJ-a w formacie zaokrąglonym (85x55mm z narożnikami r=10). Czarne tło, holograficzny nadruk loga. Przygotowanie wymagało ścisłej współpracy z drukarnią, bo niestandardowy format miał swoje ograniczenia przy lakierze UV.",
    img: "https://picsum.photos/seed/wiz2/600/380",
    tools: "Illustrator",
    time: "2 dni",
    year: "2025",
  },
  {
    id: 10,
    cat: "produkt",
    catLabel: "Produkt",
    title: "Kawa Górska – opakowanie",
    desc: "Projekt opakowania dla lokalnej palarni kawy ze Szczyrku. Klient chciał czegoś, co wygląda jak 'z gór, nie z marketu'. Ilustracja szczytów górskich, ręczne liternictwo i matowa folia z okienkiem — projekt trafił na półki w 3 kawiarniach w regionie.",
    img: "https://picsum.photos/seed/prod3/600/820",
    tools: "Illustrator, Photoshop",
    time: "8 dni",
    year: "2025",
  },
  {
    id: 11,
    cat: "banner",
    catLabel: "Banner",
    title: "Siłownia ActiveZone – reklama outdoor",
    desc: "Billboard 6x3m + banner na ogrodzenie dla siłowni. Projekt outdoor rządzi się własnymi prawami — musiał działać z odległości 30 metrów przy prędkości 60km/h. Prosty przekaz, ogromna typografia, jedno mocne zdjęcie.",
    img: "https://picsum.photos/seed/banner3/600/300",
    tools: "Illustrator, Photoshop",
    time: "2 dni",
    year: "2024",
  },
  {
    id: 12,
    cat: "logo",
    catLabel: "Logotyp",
    title: "Verde Cafe – marka kawiarni",
    desc: "Kompletna identyfikacja wizualna dla nowej kawiarni w centrum Krakowa. Logotyp, paleta, typografia, wzór na kubki takeaway i menu. Projekt trwał 2 tygodnie, ale satysfakcja gdy zobaczyłem kawę w kubku z tym logo — bezcenna.",
    img: "https://picsum.photos/seed/logo4/600/650",
    tools: "Illustrator, Figma, InDesign",
    time: "14 dni",
    year: "2025",
  },
];

/* ── RENDER SIATKI ───────────────────────────────────────── */
const grid  = document.getElementById('galleryGrid');
const empty = document.getElementById('galleryEmpty');

/* ── STAGGER HELPER ──────────────────────────────────────── */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animateItems(items) {
  if (prefersReduced) {
    items.forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
    return;
  }
  items.forEach((el, i) => {
    el.style.animationDelay = `${i * 0.055}s`;
    // rAF zapewnia, że przeglądarka zdąży wyrenderować el przed dodaniem klasy
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add('visible'));
    });
  });
}

function buildGrid(filter) {
  const visible = filter === 'all' ? projects : projects.filter(p => p.cat === filter);

  /* płynne wyjście poprzednich kart */
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

    const els = visible.map((p) => {
      const el = document.createElement('div');
      el.className = 'gallery-item';
      el.dataset.id = p.id;
      el.innerHTML = `
        <img src="${p.img}" alt="${p.title}" loading="lazy">
        <span class="gallery-item-badge">${p.catLabel}</span>
        <div class="gallery-item-overlay">
          <div class="gallery-item-cat">${p.catLabel}</div>
          <div class="gallery-item-title">${p.title}</div>
        </div>
        <div class="gallery-item-icon"><i class="fa-solid fa-expand"></i></div>
      `;
      el.addEventListener('click', () => openLightbox(p.id, filter));
      grid.appendChild(el);
      return el;
    });

    animateItems(els);
  }, FADE_OUT);
}

buildGrid('all');

/* ── FILTRY ─────────────────────────────────────────────── */
document.querySelectorAll('[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    /* animacja "pop" na przycisku */
    btn.classList.remove('anim-pop');
    void btn.offsetWidth; // reflow – reset animacji
    btn.classList.add('anim-pop');
    btn.addEventListener('animationend', () => btn.classList.remove('anim-pop'), { once: true });

    buildGrid(btn.dataset.filter);
  });
});

/* ── LIGHTBOX ────────────────────────────────────────────── */
const projectModal   = document.getElementById('project-modal');
const lbImg      = document.getElementById('projectModalImg');
const lbCat      = document.getElementById('projectModalCat');
const lbTitle    = document.getElementById('projectModalTitle');
const lbDesc     = document.getElementById('projectModalDesc');
const lbMeta     = document.getElementById('projectModalMeta');
const lbClose    = document.getElementById('projectModalClose');
const lbPrev     = document.getElementById('projectModalPrev');
const lbNext     = document.getElementById('projectModalNext');
const lbBackdrop = document.getElementById('projectModalBackdrop');

let currentIndex = 0;
let currentList  = [];

function openLightbox(id, filter) {
  currentList  = filter === 'all' ? projects : projects.filter(p => p.cat === filter);
  currentIndex = currentList.findIndex(p => p.id === id);
  renderLightbox('none');
  projectModal.classList.add('open');
  document.body.style.overflow = 'hidden';

  /* panel wejście */
  const panel = projectModal.querySelector('.project-modal-panel');
  panel.classList.remove('anim-in');
  void panel.offsetWidth;
  panel.classList.add('anim-in');
  panel.addEventListener('animationend', () => panel.classList.remove('anim-in'), { once: true });
}

function renderLightbox(direction = 'none') {
  const p = currentList[currentIndex];

  /* animacja zdjęcia */
  const imgEl   = lbImg;
  const infoEl  = lbDesc.closest ? lbDesc.parentElement : lbDesc;
  const animCls = direction === 'next' ? 'anim-slide-left'
                : direction === 'prev' ? 'anim-slide-right'
                : null;

  if (animCls && !prefersReduced) {
    imgEl.classList.remove('anim-slide-left', 'anim-slide-right');
    void imgEl.offsetWidth;
    imgEl.classList.add(animCls);
    imgEl.addEventListener('animationend', () => imgEl.classList.remove(animCls), { once: true });

    lbDesc.parentElement.classList.remove('anim-fade');
    void lbDesc.parentElement.offsetWidth;
    lbDesc.parentElement.classList.add('anim-fade');
    lbDesc.parentElement.addEventListener('animationend', () => lbDesc.parentElement.classList.remove('anim-fade'), { once: true });
  }

  lbImg.src           = p.img;
  lbImg.alt           = p.title;
  lbCat.textContent   = p.catLabel;
  lbTitle.textContent = p.title;
  lbDesc.innerHTML    = p.desc
    .replace(/\n\n/g, '</p><p style="margin-top:12px">')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
  lbMeta.innerHTML = `
    <div class="project-modal-meta-item"><i class="fa-solid fa-wrench"></i><span><strong>Narzędzia:</strong> ${p.tools}</span></div>
    <div class="project-modal-meta-item"><i class="fa-solid fa-clock"></i><span><strong>Czas realizacji:</strong> ${p.time}</span></div>
    <div class="project-modal-meta-item"><i class="fa-solid fa-calendar"></i><span><strong>Rok:</strong> ${p.year}</span></div>
  `;
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
  if (e.key === 'ArrowLeft')  { if (currentIndex > 0) { currentIndex--; renderLightbox('prev'); } }
  if (e.key === 'ArrowRight') { if (currentIndex < currentList.length - 1) { currentIndex++; renderLightbox('next'); } }
});