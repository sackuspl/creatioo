/* ── PRELOADER ─────────────────────────────────────────────── */



window.addEventListener('load', () => {
  document.getElementById('preloader').classList.add('loaded');
});




// ── REVEAL ON SCROLL ────────────────────────────────────────
const revealEls = document.querySelectorAll('.reveal');



const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // lekkie opóźnienie kaskadowe dla kart w gridzie
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, i * 60);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });



revealEls.forEach(el => revealObserver.observe(el));



// ── COUNTERS ─────────────────────────────────────────────────
// Poprawka: niższy threshold (0.5 → 0.15) + zapasowe sprawdzenie
// widoczności na starcie. Na mobile .hero-stats bywa widoczny od
// razu po wczytaniu strony i observer z threshold 0.5 nie zawsze
// zdążył złapać moment przejścia przez 50% widoczności — licznik
// zostawał na 0.
const counters   = document.querySelectorAll('.counter');
const statsSection = document.querySelector('.hero-stats');
let counterStarted = false;


function runCounters() {
  if (counterStarted) return;
  counterStarted = true;
  counters.forEach(counter => {
    const target = +counter.dataset.target;
    let count = 0;
    const speed = target / 120;
    const tick = () => {
      count += speed;
      if (count < target) {
        counter.innerText = Math.floor(count);
        requestAnimationFrame(tick);
      } else {
        counter.innerText = target;
      }
    };
    tick();
  });
}


const counterObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    runCounters();
  }
}, { threshold: 0.15 });


if (statsSection) {
  counterObserver.observe(statsSection);


  // Zapasowe sprawdzenie: jeśli pasek jest już w widoku w momencie
  // wczytania strony, ręcznie odpalamy animację od razu.
  const rect = statsSection.getBoundingClientRect();
  if (rect.top < window.innerHeight && rect.bottom > 0) {
    runCounters();
  }
}



// ── SCROLL INDICATOR ─────────────────────────────────────────
const scrollIndicator = document.querySelector('.scroll-indicator');



window.addEventListener('scroll', () => {
  if (!scrollIndicator) return;
  scrollIndicator.classList.toggle('hidden', window.scrollY > 100);
});



// ── NAVBAR SCROLLED STATE ────────────────────────────────────
const navbar = document.getElementById('navbar');



window.addEventListener('scroll', () => {
  if (!navbar) return;
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});



// ── LIGHTBOX (witryna projektów na stronie głównej) ───────────
document.addEventListener('click', (e) => {
  const img = e.target.closest('.project-tile-img.active');
  if (!img) return;



  const lb = document.createElement('div');
  lb.classList.add('lightbox');
  lb.innerHTML = `<img src="${img.src}" alt="">`;
  document.body.appendChild(lb);
  lb.addEventListener('click', () => lb.remove());
});



// ── THEME TOGGLE ─────────────────────────────────────────────
const themeToggle = document.getElementById('theme-toggle');
const htmlEl = document.documentElement;



function applyTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}



applyTheme(localStorage.getItem('theme') || 'dark');



themeToggle?.addEventListener('click', () => {
  const current = htmlEl.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});







// Karuzela logotypów klientów ("Zaufali mi") — przeniesiona do js/clients.js,
// bo ten plik dodatkowo ściąga listę klientów z Firestore przed jej zbudowaniem.





(function(){
  const el   = document.getElementById('pswText');
  const fnt  = document.getElementById('pswFont');
  const B    = document.getElementById('pswB');
  const I    = document.getElementById('pswI');
  const U    = document.getElementById('pswU');
  const plus = document.getElementById('pswPlus');
  const min  = document.getElementById('pswMinus');
  const szv  = document.getElementById('pswSzVal');
  const pk   = document.getElementById('pswPicker');
  let size = 32;
 
  function apply(){
    el.style.fontFamily     = fnt.value;
    el.style.fontSize       = size + 'px';
    el.style.fontWeight     = B.classList.contains('on') ? '700' : '400';
    el.style.fontStyle      = I.classList.contains('on') ? 'italic' : 'normal';
    el.style.textDecoration = U.classList.contains('on') ? 'underline' : 'none';
    el.style.color          = pk.value;
    el.style.filter         = `drop-shadow(0 0 22px ${pk.value}66)`;
    szv.textContent         = size;
  }
 
  fnt.addEventListener('change', apply);
  [B,I,U].forEach(b => b.addEventListener('click', () => { b.classList.toggle('on'); apply(); }));
 
  plus.addEventListener('click', () => { if(size < 72) { size += 2; apply(); } });
  min.addEventListener('click',  () => { if(size > 10) { size -= 2; apply(); } });
 
  document.querySelectorAll('.psw-sw[data-c]').forEach(s => {
    s.addEventListener('click', () => {
      document.querySelectorAll('.psw-sw').forEach(x => x.classList.remove('psw-sw--on'));
      s.classList.add('psw-sw--on');
      pk.value = s.dataset.c;
      apply();
    });
  });
 
  pk.addEventListener('input', () => {
    document.querySelectorAll('.psw-sw[data-c]').forEach(x => x.classList.remove('psw-sw--on'));
    apply();
  });
 
  apply();
})();



// ── SCROLL TO TOP ─────────────────────────────────────────────────
// Poprawka: przycisk pojawia się na środku dołu ekranu podczas
// przewijania, ale gdy jesteśmy blisko końca strony (stopki),
// klasa .at-bottom (obsłużona w mobile.css) przesuwa go na prawą
// stronę, żeby nie zasłaniał treści stopki. Gdy user wraca w górę,
// klasa jest usuwana i przycisk wraca na środek.


(function () {
  const btn = document.getElementById('scrollTopBtn');
  const THRESHOLD = 300;      // px od góry, po których przycisk się pojawia
  const BOTTOM_OFFSET = 140;  // px od dołu strony, od których przycisk przechodzi na bok


  function updateScrollTop() {
    const scrollY = window.scrollY;
    const viewportH = window.innerHeight;
    const docH = document.documentElement.scrollHeight;


    btn.classList.toggle('visible', scrollY > THRESHOLD);


    const distanceFromBottom = docH - (scrollY + viewportH);
    btn.classList.toggle('at-bottom', distanceFromBottom < BOTTOM_OFFSET);
  }


  window.addEventListener('scroll', updateScrollTop, { passive: true });
  window.addEventListener('resize', updateScrollTop, { passive: true });
  updateScrollTop();


  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();




document.querySelectorAll('.faq-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    const answer = trigger.nextElementSibling;



    // zamknij wszystkie
    document.querySelectorAll('.faq-trigger').forEach(t => {
      t.setAttribute('aria-expanded', 'false');
      t.nextElementSibling.classList.remove('open');
    });



    // otwórz kliknięty
    if (!isOpen) {
      trigger.setAttribute('aria-expanded', 'true');
      answer.classList.add('open');
    }
  });
});












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



function buildGrid(filter) {
  const visible = filter === 'all' ? projects : projects.filter(p => p.cat === filter);
  grid.innerHTML = '';



  if (visible.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';



  visible.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'gallery-item';
    el.dataset.id = p.id;
    el.style.animationDelay = `${i * 0.04}s`;
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
  });
}



buildGrid('all');



/* ── FILTRY ─────────────────────────────────────────────── */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    buildGrid(btn.dataset.filter);
  });
});



/* ── LIGHTBOX ────────────────────────────────────────────── */
const lightbox   = document.getElementById('lightbox');
const lbImg      = document.getElementById('lightboxImg');
const lbCat      = document.getElementById('lightboxCat');
const lbTitle    = document.getElementById('lightboxTitle');
const lbDesc     = document.getElementById('lightboxDesc');
const lbMeta     = document.getElementById('lightboxMeta');
const lbClose    = document.getElementById('lightboxClose');
const lbPrev     = document.getElementById('lightboxPrev');
const lbNext     = document.getElementById('lightboxNext');
const lbBackdrop = document.getElementById('lightboxBackdrop');



let currentIndex = 0;
let currentList  = [];



function openLightbox(id, filter) {
  currentList  = filter === 'all' ? projects : projects.filter(p => p.cat === filter);
  currentIndex = currentList.findIndex(p => p.id === id);
  renderLightbox();
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}



function renderLightbox() {
  const p = currentList[currentIndex];
  lbImg.src           = p.img;
  lbImg.alt           = p.title;
  lbCat.textContent   = p.catLabel;
  lbTitle.textContent = p.title;
  lbDesc.innerHTML    = p.desc
    .replace(/\n\n/g, '</p><p style="margin-top:12px">')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
  lbMeta.innerHTML = `
    <div class="lightbox-meta-item"><i class="fa-solid fa-wrench"></i><span><strong>Narzędzia:</strong> ${p.tools}</span></div>
    <div class="lightbox-meta-item"><i class="fa-solid fa-clock"></i><span><strong>Czas realizacji:</strong> ${p.time}</span></div>
    <div class="lightbox-meta-item"><i class="fa-solid fa-calendar"></i><span><strong>Rok:</strong> ${p.year}</span></div>
  `;
  lbPrev.disabled      = currentIndex === 0;
  lbNext.disabled      = currentIndex === currentList.length - 1;
  lbPrev.style.opacity = currentIndex === 0 ? '0.35' : '1';
  lbNext.style.opacity = currentIndex === currentList.length - 1 ? '0.35' : '1';
}



function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}



lbClose.addEventListener('click', closeLightbox);
lbBackdrop.addEventListener('click', closeLightbox);



lbPrev.addEventListener('click', () => {
  if (currentIndex > 0) { currentIndex--; renderLightbox(); }
});
lbNext.addEventListener('click', () => {
  if (currentIndex < currentList.length - 1) { currentIndex++; renderLightbox(); }
});



document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  { if (currentIndex > 0) { currentIndex--; renderLightbox(); } }
  if (e.key === 'ArrowRight') { if (currentIndex < currentList.length - 1) { currentIndex++; renderLightbox(); } }
});