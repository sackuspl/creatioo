(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;

  const theme = $('#theme');
  if (theme) {
    theme.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      const apply = () => { root.dataset.theme = next; };
      if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(apply);
      else apply();
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  const burger = $('#burger');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    if (burger) burger.setAttribute('aria-expanded', String(open));
  };
  if (burger) {
    burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    $$('#links a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    matchMedia('(min-width: 1001px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
  }

  // Keep the native details element, then animate its measured height.
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const accordions = $$('.faq details').map(details => {
    const summary = $('summary', details), answer = $('.faq-answer', details);
    let animation = null, expanded = details.open;
    const settle = () => {
      animation?.cancel(); animation = null;
      details.open = expanded; details.style.height = ''; details.style.overflow = '';
      details.classList.remove('is-closing'); summary.setAttribute('aria-expanded', String(expanded));
    };
    const move = target => {
      const start = details.getBoundingClientRect().height;
      expanded = target; animation?.cancel();
      summary.setAttribute('aria-expanded', String(expanded));
      details.classList.toggle('is-closing', !expanded);
      if (reduced.matches || !details.animate) { settle(); return; }
      details.open = true; details.style.overflow = 'hidden';
      const cs = getComputedStyle(details), border = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
      const end = summary.offsetHeight + (expanded ? answer.offsetHeight : 0) + border;
      const current = details.animate([{ height: `${start}px` }, { height: `${end}px` }], {
        duration: 420, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'both'
      });
      animation = current;
      if (expanded) answer.animate([{ opacity: .25, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], {
        duration: 360, easing: 'cubic-bezier(.16,1,.3,1)'
      });
      current.onfinish = () => { if (animation === current) settle(); };
    };
    summary.setAttribute('aria-expanded', String(expanded));
    summary.addEventListener('click', e => { e.preventDefault(); move(!expanded); });
    return { resize: () => { if (animation) move(expanded); }, settle };
  });
  addEventListener('resize', () => accordions.forEach(a => a.resize()));
  reduced.addEventListener('change', () => accordions.forEach(a => a.settle()));

  const backTop = $('#backTop');
  if (backTop) {
    let queued = false;
    const update = () => {
      queued = false;
      const visible = scrollY > Math.max(440, innerHeight * .65);
      backTop.classList.toggle('is-visible', visible);
      backTop.setAttribute('aria-hidden', String(!visible));
      backTop.tabIndex = visible ? 0 : -1;
      // Lift the button above the footer bottom bar so they never overlap
      const bar = $('.foot-bot');
      backTop.style.setProperty('--lift', (bar ? Math.max(0, innerHeight - bar.getBoundingClientRect().top) : 0) + 'px');
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update);
    backTop.addEventListener('click', () => {
      scrollTo({ top: 0, behavior: reduced.matches ? 'instant' : 'smooth' });
      $('#main')?.focus({ preventScroll: true });
    });
    update();
  }

  const toc = $('.toc');
  if (toc) {
    const links = $$('a', toc);
    const secs = links.map(a => document.getElementById(a.getAttribute('href').slice(1)));
    let queued = false;
    const update = () => {
      queued = false;
      let idx = -1;
      secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= 140) idx = i; });
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) idx = secs.length - 1;
      links.forEach((a, i) => {
        if (i === idx) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update);
    update();
  }
})();
