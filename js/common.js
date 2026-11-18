(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;

  /* Theme and language changes: the page crossfades as a whole. Element transitions are paused for that moment,
     otherwise the header, buttons and links would each fade at their own speed and look out of sync. */
  window.creatiooSwitch = change => {
    const run = () => {
      root.classList.add('switching');
      change();
      getComputedStyle(root).color; // apply the new styles while transitions are off
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('switching')));
    };
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(run);
    else run();
  };

  const theme = $('#theme');
  if (theme) {
    theme.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      window.creatiooSwitch(() => { root.dataset.theme = next; });
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  /* Header: glass once the page moves, hides on the way down, returns on the way up */
  const top = $('#top');
  if (top) {
    let lastY = scrollY, queued = false;
    const onScroll = () => {
      queued = false;
      const y = scrollY;
      top.classList.toggle('is-scrolled', y > 24);
      const down = y > lastY + 4, up = y < lastY - 4;
      if (down && y > innerHeight * .6 && !document.body.classList.contains('menu-open')) top.classList.add('is-hidden');
      else if (up || y < 80) top.classList.remove('is-hidden');
      if (down || up) lastY = y;
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }, { passive: true });
    top.addEventListener('focusin', () => top.classList.remove('is-hidden'));
    onScroll();
  }

  /* Footer: copy the e-mail address */
  $$('[data-copy]').forEach(btn => {
    const label = $('.foot-copy-txt', btn);
    let timer = 0;
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
      } catch (e) {
        location.href = `mailto:${btn.dataset.copy}`;
        return;
      }
      label.textContent = 'Skopiowano';
      btn.classList.add('is-done');
      clearTimeout(timer);
      timer = setTimeout(() => { label.textContent = 'Kopiuj adres'; btn.classList.remove('is-done'); }, 2200);
    });
  });

  /* Form selects: an option list in the site's style. The native select stays underneath,
     so the form still sends its value and the browser still checks that one was picked. */
  $$('.form select').forEach((native, n) => {
    const id = `sel${n + 1}`;
    const choices = [...native.options].filter(o => o.value !== '');
    const placeholder = [...native.options].find(o => o.value === '');
    const box = document.createElement('div');
    box.className = 'sel';
    box.innerHTML = `<button class="sel-btn" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}"><span class="sel-val" id="${id}-val"></span><span class="sel-ico" aria-hidden="true"></span></button><ul class="sel-list" id="${id}" role="listbox" tabindex="-1"></ul>`;
    const btn = $('.sel-btn', box), val = $('.sel-val', box), list = $('.sel-list', box);
    const caption = native.getAttribute('aria-labelledby');
    if (caption) {
      btn.setAttribute('aria-labelledby', `${caption} ${id}-val`);
      list.setAttribute('aria-labelledby', caption);
      $(`#${caption}`)?.addEventListener('click', () => btn.focus());
    }
    const opts = choices.map((o, i) => {
      const li = document.createElement('li');
      li.className = 'sel-opt';
      li.id = `${id}-${i}`;
      li.setAttribute('role', 'option');
      li.textContent = o.text;
      list.append(li);
      return li;
    });
    native.classList.add('sel-native');
    native.tabIndex = -1;
    native.setAttribute('aria-hidden', 'true');
    native.after(box);

    let active = -1;
    const isOpen = () => box.classList.contains('is-open');
    const sync = () => {
      const i = choices.indexOf(native.selectedOptions[0]);
      opts.forEach((o, k) => o.setAttribute('aria-selected', String(k === i)));
      val.textContent = i >= 0 ? opts[i].textContent : (placeholder?.text || '');
      val.classList.toggle('is-empty', i < 0);
    };
    const setActive = i => {
      active = i;
      opts.forEach((o, k) => o.classList.toggle('is-active', k === i));
      if (i >= 0) list.setAttribute('aria-activedescendant', opts[i].id);
      else list.removeAttribute('aria-activedescendant');
    };
    const open = () => {
      if (isOpen()) return;
      // open upwards when the list would not fit below the field
      const r = btn.getBoundingClientRect(), need = list.offsetHeight + 24;
      box.classList.toggle('is-up', innerHeight - r.bottom < need && r.top > need);
      box.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      setActive(Math.max(0, choices.indexOf(native.selectedOptions[0])));
      list.focus({ preventScroll: true });
    };
    const close = (refocus = true) => {
      if (!isOpen()) return;
      box.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      setActive(-1);
      if (refocus) btn.focus({ preventScroll: true });
    };
    const pick = i => {
      if (i < 0) return;
      native.value = choices[i].value;
      native.dispatchEvent(new Event('change', { bubbles: true }));
      close();
    };

    btn.addEventListener('click', () => (isOpen() ? close() : open()));
    btn.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); }
    });
    list.addEventListener('keydown', e => {
      const last = opts.length - 1;
      if (e.key === 'ArrowDown') setActive(Math.min(last, active + 1));
      else if (e.key === 'ArrowUp') setActive(Math.max(0, active - 1));
      else if (e.key === 'Home') setActive(0);
      else if (e.key === 'End') setActive(last);
      else if (e.key === 'Enter' || e.key === ' ') pick(active);
      else if (e.key === 'Escape') { e.stopPropagation(); close(); }
      else if (e.key === 'Tab') { close(false); return; }
      else if (e.key.length === 1) {
        // jump to the next option starting with the typed letter
        const ch = e.key.toLowerCase();
        const order = opts.map((_, k) => (active + 1 + k) % opts.length);
        const hit = order.find(k => opts[k].textContent.trim().toLowerCase().startsWith(ch));
        if (hit !== undefined) setActive(hit);
      } else return;
      e.preventDefault();
    });
    let px = -1, py = -1;
    list.addEventListener('pointermove', e => {
      // a scroll under a still pointer also fires pointermove; only real movement picks the row
      if (e.clientX === px && e.clientY === py) return;
      px = e.clientX; py = e.clientY;
      const o = e.target.closest('.sel-opt');
      if (o && o !== opts[active]) setActive(opts.indexOf(o));
    });
    list.addEventListener('click', e => {
      const o = e.target.closest('.sel-opt');
      if (o) pick(opts.indexOf(o));
    });
    document.addEventListener('pointerdown', e => { if (!box.contains(e.target)) close(false); });
    native.addEventListener('change', sync);
    native.form?.addEventListener('reset', () => setTimeout(sync));
    addEventListener('languagechange', sync);
    sync();
  });

  const burger = $('#burger');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    if (burger) burger.setAttribute('aria-expanded', String(open));
  };
  if (burger) {
    burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    $$('#links a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    matchMedia('(min-width: 1101px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
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
