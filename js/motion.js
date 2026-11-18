(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduced || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  root.classList.add('motion');

  /* Smooth scrolling (desktop pointers only; touch keeps native scrolling) */
  let lenis = null;
  if (window.Lenis && finePointer) {
    lenis = new Lenis({ lerp: .1, wheelMultiplier: 1, anchors: { offset: -parseInt(getComputedStyle(root).getPropertyValue('--hdr') || 76, 10) } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.creatiooLenis = lenis;
    let locked = null;
    const lock = () => {
      const next = document.body.matches('.menu-open, .dialog-open') || !root.classList.contains('is-ready');
      if (next === locked) return;
      locked = next;
      if (next) lenis.stop(); else lenis.start();
    };
    new MutationObserver(lock).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    addEventListener('intro:reveal', lock);
    setTimeout(lock, 6600);
    lock();
  }

  /* Runs once the loader has lifted (or right away on later visits) */
  const whenReady = fn => {
    let done = false;
    const run = () => { if (!done) { done = true; fn(); } };
    if (root.classList.contains('is-ready')) run();
    else { addEventListener('intro:reveal', run, { once: true }); setTimeout(run, 6500); }
  };

  /* Count-up for the hero figures */
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, o = { v: 0 };
    el.textContent = '0';
    whenReady(() => gsap.to(o, { v: end, duration: 2, delay: .7, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); } }));
  });

  /* Elements that get .is-in once they scroll into view; CSS does the rest */
  const onceIn = (els, start = 'top 85%') => els.forEach(el => el && ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => el.classList.add('is-in') }));
  onceIn($$('.service'), 'top 92%');
  onceIn([$('#workTrack')], 'top 82%');
  onceIn($$('[data-split]'), 'top 86%');

  /* Marquee: scrolling speeds it up, scrolling back reverses it, fast scrolls lean the type */
  const marquee = $('.marquee-track');
  const loop = marquee?.getAnimations?.()[0];
  if (marquee && loop) {
    const groups = $$('.marquee-group', marquee);
    const lean = gsap.quickTo(groups, 'skewX', { duration: .5, ease: 'power3' });
    let velocity = 0, direction = 1, rate = 1, active = false;
    ScrollTrigger.create({
      trigger: '.marquee', start: 'top bottom', end: 'bottom top',
      onToggle: self => { active = self.isActive; },
      onUpdate: self => { velocity = self.getVelocity(); direction = self.direction; }
    });
    gsap.ticker.add(() => {
      if (!active) return;
      velocity *= .9;
      const target = direction * (1 + Math.min(Math.abs(velocity) / 220, 9));
      rate += (target - rate) * .08;
      loop.playbackRate = rate;
      lean(gsap.utils.clamp(-7, 7, velocity / -320));
    });
  }

  /* Section headings rise out of a mask once */
  $$('h2.reveal').forEach(h => {
    gsap.fromTo(h, { clipPath: 'inset(0 0 100% 0)', y: 60 }, {
      clipPath: 'inset(0 0 -20% 0)', y: 0, duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: h, start: 'top 88%', once: true }
    });
  });

  /* Selected work: vertical scroll drives a horizontal track */
  const mm = gsap.matchMedia();
  let workCtx = null;
  const buildWork = () => {
    workCtx?.revert();
    workCtx = gsap.context(() => {
      mm.add('(min-width: 901px)', () => {
        const section = $('#projects'), track = $('#workTrack'), bar = $('#workBar');
        const dist = () => Math.max(0, track.scrollWidth - innerWidth);
        const slide = gsap.to(track, {
          x: () => -dist(), ease: 'none',
          scrollTrigger: {
            trigger: section, pin: true, start: 'top top', end: () => '+=' + dist(),
            scrub: .8, invalidateOnRefresh: true, anticipatePin: 1,
            onUpdate: self => gsap.set(bar, { scaleX: self.progress })
          }
        });
        $$('.work-img img', track).forEach(img => {
          gsap.fromTo(img, { xPercent: -5 }, {
            xPercent: 5, ease: 'none',
            scrollTrigger: { trigger: img.closest('.work-card'), containerAnimation: slide, start: 'left right', end: 'right left', scrub: true }
          });
        });
      });
    });
  };
  buildWork();
  addEventListener('works:updated', () => { buildWork(); ScrollTrigger.refresh(); });

  /* About: words light up as the paragraph passes through the screen */
  let wordsST = null;
  const buildWords = () => {
    wordsST?.kill();
    const p = $('#aboutIntro');
    if (!p) return;
    const words = $$('.w', p);
    wordsST = ScrollTrigger.create({
      trigger: p, start: 'top 82%', end: 'bottom 48%', scrub: true,
      onUpdate: self => {
        const n = Math.round(self.progress * words.length);
        words.forEach((w, i) => w.classList.toggle('on', i < n));
      }
    });
  };
  buildWords();
  addEventListener('words:built', buildWords);

  /* Process: the line fills, each step lights up as it reaches the middle of the screen */
  const steps = $('#steps');
  if (steps) {
    gsap.to('#stepsFill', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: steps, start: 'top 60%', end: 'bottom 60%', scrub: true } });
    $$('li', steps).forEach(li => ScrollTrigger.create({ trigger: li, start: 'top 62%', onToggle: self => li.classList.toggle('is-on', self.isActive || self.progress === 1), end: 'max' }));
  }

  /* Footer: the wordmark settles into place as the page ends */
  const footIn = $('.foot-in');
  if (footIn) {
    const word = $('.foot-word img');
    if (word) gsap.fromTo(word, { yPercent: 14 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.foot-word', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  /* Cursor label: a round tag follows the pointer over work cards ("View") and the 3D mark ("Drag") */
  if (finePointer) {
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.setAttribute('data-no-translate', '');
    cursor.innerHTML = '<span class="cursor-in"></span>';
    document.body.append(cursor);
    root.classList.add('has-cursor');
    const label = cursor.firstChild;
    const cx = gsap.quickTo(cursor, 'x', { duration: .35, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: .35, ease: 'power3' });
    const tr = s => (s && window.creatiooI18n && root.dataset.lang === 'en' ? window.creatiooI18n.t(s, 'en') : s);
    let fromEl = null, fromMark = null, px = -1, py = -1, first = true;
    const show = () => {
      const text = fromMark || fromEl;
      if (text) label.textContent = tr(text);
      cursor.classList.toggle('is-on', !!text);
    };
    const pick = el => { const host = el?.closest?.('[data-cursor]'); fromEl = host ? host.dataset.cursor : null; show(); };
    addEventListener('pointermove', e => {
      px = e.clientX; py = e.clientY;
      if (first) { first = false; gsap.set(cursor, { x: px, y: py }); }
      cx(px); cy(py);
    }, { passive: true });
    document.addEventListener('pointerover', e => pick(e.target));
    root.addEventListener('pointerleave', () => { fromEl = null; fromMark = null; show(); });
    addEventListener('cursor:label', e => { fromMark = e.detail; show(); });
    // cards slide under a still pointer while the work section scrolls
    let checking = false;
    addEventListener('scroll', () => {
      if (checking || px < 0) return;
      checking = true;
      requestAnimationFrame(() => { checking = false; pick(document.elementFromPoint(px, py)); });
    }, { passive: true });
  }

  /* Keep measurements right when content or fonts change */
  const refresh = () => ScrollTrigger.refresh();
  addEventListener('layout:changed', () => requestAnimationFrame(refresh));
  addEventListener('intro:reveal', refresh);
  document.fonts?.ready.then(refresh);
  addEventListener('load', refresh);
})();
