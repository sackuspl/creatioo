// Loader: the mark draws itself while the page, fonts and 3D scene get ready, then the curtain lifts.
// It shows once per browser session; later visits go straight to the page.
(() => {
  const root = document.documentElement;
  const loader = document.getElementById('loader');

  const reveal = () => {
    if (root.classList.contains('is-ready')) return;
    root.classList.add('is-ready');
    try { sessionStorage.setItem('intro', '1'); } catch (e) { /* private mode */ }
    dispatchEvent(new Event('intro:reveal'));
    if (loader) setTimeout(() => loader.remove(), 1600);
  };

  if (!loader || getComputedStyle(loader).display === 'none') { reveal(); return; }

  const num = loader.querySelector('.loader-num');
  const bar = loader.querySelector('.loader-bar i');
  const steps = { dom: false, fonts: false, load: false, gl: false };
  const mark = name => { steps[name] = true; };

  if (document.readyState !== 'loading') mark('dom'); else document.addEventListener('DOMContentLoaded', () => mark('dom'), { once: true });
  if (document.readyState === 'complete') mark('load'); else addEventListener('load', () => mark('load'), { once: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => mark('fonts')); else mark('fonts');
  if (root.dataset.gl) mark('gl');
  addEventListener('hero3d:ready', () => mark('gl'), { once: true });
  addEventListener('hero3d:none', () => mark('gl'), { once: true });

  const began = performance.now();
  const minTime = 1300, maxTime = 4500;
  let shown = 0, last = began, finished = false;

  const frame = now => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const elapsed = now - began;
    let target = 8 + (steps.dom ? 22 : 0) + (steps.fonts ? 20 : 0) + (steps.load ? 25 : 0) + (steps.gl ? 25 : 0);
    if (elapsed > maxTime) target = 100;
    target = Math.min(target, (elapsed / minTime) * 100);
    shown += (target - shown) * Math.min(1, dt * 5);
    if (target >= 100 && shown > 99.4) shown = 100;
    const value = Math.round(shown);
    if (num) num.textContent = String(value).padStart(3, '0');
    if (bar) bar.style.transform = `scaleX(${shown / 100})`;
    if (value >= 100 && !finished) {
      finished = true;
      setTimeout(reveal, 180);
      return;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
