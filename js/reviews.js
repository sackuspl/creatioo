(() => {
  const root = document.querySelector('#rvTrack');
  if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const hover = matchMedia('(hover: hover)');
  const section = root.closest('section');
  const prev = document.querySelector('#rvPrev'), next = document.querySelector('#rvNext');
  let belt, cards = [], prefix = 0, index = 0, animation = null, timer = null, visible = false;
  const gap = () => parseFloat(getComputedStyle(belt).columnGap) || 0;
  const step = () => (belt?.firstElementChild?.getBoundingClientRect().width || 0) + gap();
  const moving = () => cards.length > (innerWidth <= 700 ? 1 : 2);
  const place = () => { if (belt) belt.style.transform = `translateX(-${(prefix + index) * step()}px)`; };
  const controls = () => {
    prev.hidden = next.hidden = !moving();
  };
  const pause = () => document.hidden || !visible || reduce.matches || !moving() || animation ||
    section.querySelector(':focus-visible') || (hover.matches && [root, prev, next].some(el => el.matches(':hover'))) ||
    document.body.matches('.menu-open, .dialog-open, .lb-open');
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => { if (pause()) schedule(); else move(1, false); }, 6200);
  };
  function move(direction, manual = true) {
    if (!moving() || animation) return;
    clearTimeout(timer);
    const destination = index + direction;
    const offset = step();
    const from = -(prefix + index) * offset, to = -(prefix + destination) * offset;
    const finish = () => {
      index = (destination + cards.length) % cards.length;
      place(); animation?.cancel(); animation = null;
      controls(); schedule();
    };
    if (reduce.matches || !belt.animate) { finish(); return; }
    animation = belt.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], {
      duration: 760, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both'
    });
    controls(); animation.onfinish = finish;
  }
  const clone = card => {
    const copy = card.cloneNode(true); copy.dataset.clone = 'true';
    copy.setAttribute('aria-hidden', 'true'); copy.setAttribute('inert', ''); return copy;
  };
  function mount() {
    animation?.cancel(); animation = null; clearTimeout(timer);
    cards = [...root.querySelectorAll(':scope > article')];
    if (!cards.length) return;
    if (cards.length === 1) { belt = null; prev.hidden = next.hidden = true; return; }
    prefix = Math.min(2, cards.length); index = 0;
    belt = document.createElement('div'); belt.className = 'rv-belt';
    cards.slice(-prefix).forEach(card => belt.append(clone(card)));
    cards.forEach(card => belt.append(card));
    cards.slice(0, prefix).forEach(card => belt.append(clone(card)));
    root.replaceChildren(belt);
    requestAnimationFrame(() => { place(); controls(); schedule(); });
  }
  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); move(e.key === 'ArrowRight' ? 1 : -1); }
  });
  let startX = 0, startY = 0, touch = false;
  root.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    startX = e.clientX; startY = e.clientY; touch = true;
  });
  root.addEventListener('pointerup', e => {
    if (!touch) return; touch = false;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
  });
  root.addEventListener('pointercancel', () => { touch = false; });
  addEventListener('resize', () => {
    animation?.cancel(); animation = null;
    if (!moving()) index = 0;
    place(); controls(); schedule();
  });
  reduce.addEventListener('change', () => { animation?.finish(); schedule(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { threshold: .18 }).observe(root);
  } else visible = true;
  window.creatiooReviews = { mount };
})();
