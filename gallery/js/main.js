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
const counters   = document.querySelectorAll('.counter');
const statsSection = document.querySelector('.hero-stats');
let counterStarted = false;

const counterObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && !counterStarted) {
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
}, { threshold: 0.5 });

if (statsSection) counterObserver.observe(statsSection);

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

// ── PROJECTS AUTO SLIDE ──────────────────────────────────────
const projectsTrack = document.getElementById('projects-track');

if (projectsTrack) {
  setInterval(() => {
    const atEnd =
      projectsTrack.scrollLeft + projectsTrack.clientWidth >=
      projectsTrack.scrollWidth - 10;

    projectsTrack.scrollBy({
      left: atEnd ? -projectsTrack.scrollWidth : 370,
      behavior: 'smooth'
    });
  }, 4000);

  document.querySelector('.next-project')?.addEventListener('click', () => {
    projectsTrack.scrollBy({ left: 370, behavior: 'smooth' });
  });

  document.querySelector('.prev-project')?.addEventListener('click', () => {
    projectsTrack.scrollBy({ left: -370, behavior: 'smooth' });
  });
}

// ── LIGHTBOX ─────────────────────────────────────────────────
document.addEventListener('click', (e) => {
  const img = e.target.closest('.projects-track img');
  if (!img) return;

  const lb = document.createElement('div');
  lb.classList.add('lightbox');
  lb.innerHTML = `<img src="${img.src}" alt="">`;
  document.body.appendChild(lb);
  lb.addEventListener('click', () => lb.remove());
});

// ── THEME TOGGLE ─────────────────────────────────────────────
const themeToggle = document.getElementById('theme-toggle');
const themeIcon   = document.getElementById('theme-icon');
const htmlEl      = document.documentElement;

function applyTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  if (themeIcon) {
    themeIcon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  }
}

// przywróć zapisany motyw (domyślnie dark)
applyTheme(localStorage.getItem('theme') || 'dark');

themeToggle?.addEventListener('click', () => {
  const current = htmlEl.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});





(function () {
  const wrap  = document.getElementById('clientsMarquee');
  const track = document.getElementById('clientsTrack');
  if (!wrap || !track) return;

  (async function () {
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
    let x         = 0;
    let velocity  = 0;
    let lastTs    = null;
    let rafId     = null;
    let isWheel   = false;
    let wheelTimer = null;

    const AUTO_PX_S = 60; /* px na sekundę auto-scroll */

    function setX(val) {
      /* Zawijaj: gdy wyjdziesz poza jeden zestaw, wróć o dokładnie itemsWidth */
      if (val <= -itemsWidth) val += itemsWidth;
      if (val >  0)           val -= itemsWidth;
      x = val;
      track.style.transform = `translateX(${x}px)`;
    }

    function loop(ts) {
      if (lastTs == null) lastTs = ts;
      const dt = Math.min(ts - lastTs, 64);
      lastTs = ts;

      if (isWheel) {
        velocity *= Math.pow(0.88, dt / 16);
        setX(x + velocity * dt / 16);

        if (Math.abs(velocity) < 0.1) {
          velocity  = 0;
          isWheel   = false;
          lastTs    = null;
        }
      } else {
        /* Auto: jedź w prawo (x maleje) */
        setX(x - AUTO_PX_S * dt / 1000);
      }

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);

    wrap.addEventListener('wheel', function (e) {
      e.preventDefault();
      isWheel = true;
      clearTimeout(wheelTimer);

      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      velocity -= delta * 0.5;
      /* cap */
      const cap = itemsWidth * 0.3;
      velocity  = Math.max(-cap, Math.min(cap, velocity));

      /* Jeśli raf nie leci — uruchom */
      if (!rafId) {
        lastTs = null;
        rafId  = requestAnimationFrame(loop);
      }

      /* Po 1s bez wheela wróć do auto */
      wheelTimer = setTimeout(() => {
        isWheel  = false;
        velocity = 0;
        lastTs   = null;
      }, 1000);

    }, { passive: false });

  })();
})();



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

(function () {
  const btn = document.getElementById('scrollTopBtn');
  const THRESHOLD = 300; // px od góry, po których przycisk się pojawia

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > THRESHOLD);
  }, { passive: true });

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
