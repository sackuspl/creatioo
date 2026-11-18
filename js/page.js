/* Subpages (gallery, privacy policy, 404): the same smooth scrolling as the homepage.
   Desktop pointers only; touch keeps native scrolling. */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!window.Lenis || reduced || !finePointer) return;

  const hdr = parseInt(getComputedStyle(root).getPropertyValue('--hdr'), 10) || 76;
  const lenis = new Lenis({ lerp: .1, autoRaf: true, anchors: { offset: -hdr } });
  window.creatiooLenis = lenis;

  // The page stays put while the menu or a dialog is open
  const lock = () => {
    if (document.body.matches('.menu-open, .dialog-open')) lenis.stop();
    else lenis.start();
  };
  new MutationObserver(lock).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();
