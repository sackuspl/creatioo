// creatioo hero: the "oo" mark as a real 3D object over an interactive dot field.
// The outline is rebuilt from the logo geometry: ring radius 145, counter 88, open at the top-left.
// Build: `npm run build` in tools/3d (writes js/hero3d.js).
import {
  WebGLRenderer, Scene, PerspectiveCamera, PMREMGenerator, Shape, ExtrudeGeometry, MeshPhysicalMaterial,
  Mesh, Group, DirectionalLight, PointLight, PlaneGeometry, ShaderMaterial, Vector2, Vector3, Matrix4, Ray,
  Raycaster, Clock, ACESFilmicToneMapping, SRGBColorSpace, MathUtils, Color, MeshBasicMaterial, DoubleSide
} from 'three';

const root = document.documentElement;
const canvas = document.getElementById('mark3d');
const hero = document.getElementById('hero');

const signal = state => {
  root.dataset.gl = state;
  dispatchEvent(new Event('hero3d:' + state));
};

const canRun = () => {
  if (!canvas || !hero) return false;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const connection = navigator.connection;
  if ((navigator.hardwareConcurrency || 8) <= 2 || (connection && connection.saveData)) return false;
  try {
    const probe = document.createElement('canvas');
    return !!(probe.getContext('webgl2') || probe.getContext('webgl'));
  } catch (e) {
    return false;
  }
};

const hexToVec = (value, out) => {
  let hex = String(value).trim().replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex, 16);
  if (Number.isNaN(n) || hex.length !== 6) return out;
  return out.set(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const readPalette = () => {
  const style = getComputedStyle(root);
  const read = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
  return {
    bg: read('--bg', '#0e0e0d'),
    ink: read('--ink', '#f2f0eb'),
    brand: read('--brand', '#a06cf8'),
    light: root.dataset.theme === 'light'
  };
};

const clamp01 = v => Math.min(1, Math.max(0, v));
const easeOutExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutQuart = t => 1 - Math.pow(1 - t, 4);
const TAU = Math.PI * 2;

/* One letter "o" of the mark, y up, centred on its ring */
const letterShape = () => {
  const R = 145, r = 88, cut = 35;
  const outerEnd = Math.PI - Math.asin(cut / R);
  const innerStart = Math.PI - Math.asin(cut / r);
  const s = new Shape();
  s.moveTo(-165, R);
  s.lineTo(0, R);
  s.absarc(0, 0, R, Math.PI / 2, outerEnd, true);
  s.lineTo(-Math.sqrt(r * r - cut * cut), cut);
  s.absarc(0, 0, r, innerStart, Math.PI / 2, false);
  s.lineTo(-140, r);
  s.closePath();
  return s;
};

/* Reflections: a dark studio with a few soft light strips, so the faces read as polished, not flat */
const studio = () => {
  const env = new Scene();
  env.background = new Color('#07070a');
  const strip = (w, h, intensity, x, y, z, tint = '#ffffff') => {
    const mat = new MeshBasicMaterial({ color: new Color(tint).multiplyScalar(intensity), side: DoubleSide, toneMapped: false });
    const mesh = new Mesh(new PlaneGeometry(w, h), mat);
    mesh.position.set(x, y, z);
    mesh.lookAt(0, 0, 0);
    env.add(mesh);
  };
  strip(9, 1.6, 5, 0, 5, 4);            // long top softbox
  strip(1.4, 7, 3.2, -6, 0.5, 3);       // left strip
  strip(1.2, 6, 2.4, 6, -0.5, 1);       // right strip
  strip(10, 3, 0.9, 0, -5, 2, '#d8c8ff'); // soft floor bounce
  strip(4, 4, 1.4, 3, 2, -6, '#bfa6ff');  // violet kicker behind
  return env;
};

/* Background: a quiet dot grid that drifts, swells around the pointer and glows behind the mark */
const fieldVertex = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const fieldFragment = /* glsl */ `
  precision highp float;
  uniform vec2 uRes;
  uniform float uDpr;
  uniform float uTime;
  uniform vec3 uMouse;
  uniform vec3 uMark;
  uniform vec3 uBg;
  uniform vec3 uInk;
  uniform vec3 uBrand;
  uniform float uDotA;
  uniform float uGlow;
  uniform float uReveal;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 px = gl_FragCoord.xy;
    float cell = 26.0 * uDpr;
    vec2 id = floor(px / cell);
    vec2 centre = (id + 0.5) * cell;

    vec2 q = centre / (cell * 11.0);
    float n = noise(q + vec2(uTime * 0.05, -uTime * 0.035)) * 0.62 + noise(q * 2.2 - vec2(uTime * 0.04, uTime * 0.06)) * 0.38;
    float wave = smoothstep(0.5, 0.92, n);

    vec2 away = centre - uMouse.xy;
    float md = length(away) / (cell * 6.5);
    float m = exp(-md * md) * uMouse.z;

    float kd = length(centre - uMark.xy) / uMark.z;
    float k = exp(-kd * kd);

    vec2 offset = px - centre - normalize(away + 0.0001) * m * cell * 0.22;
    float radius = cell * (0.042 + 0.05 * wave + 0.11 * m);
    float aa = uDpr * 0.9;
    float dotMask = 1.0 - smoothstep(radius - aa, radius + aa, length(offset));

    float reveal = 1.0 - smoothstep(uReveal * uRes.x * 1.3 - cell * 8.0, uReveal * uRes.x * 1.3, length(centre - uMark.xy));
    vec2 uv = px / uRes;
    float edge = smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.86, uv.y);

    float alpha = (uDotA * (0.6 + 2.2 * wave) + 0.6 * m) * edge * reveal;
    vec3 dotColour = mix(uInk, uBrand, clamp(m * 1.3 + k * 0.55, 0.0, 1.0));

    vec3 colour = mix(uBg, uBrand, k * uGlow * uReveal * smoothstep(0.0, 0.35, uv.y));
    colour = mix(colour, dotColour, clamp(dotMask * alpha, 0.0, 1.0));
    gl_FragColor = vec4(colour, 1.0);
  }
`;

async function start() {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.autoClear = false;

  /* Field */
  const uniforms = {
    uRes: { value: new Vector2(1, 1) },
    uDpr: { value: 1 },
    uTime: { value: 0 },
    uMouse: { value: new Vector3(-9999, -9999, 0) },
    uMark: { value: new Vector3(0, 0, 400) },
    uBg: { value: new Vector3() },
    uInk: { value: new Vector3() },
    uBrand: { value: new Vector3() },
    uDotA: { value: 0.1 },
    uGlow: { value: 0.08 },
    uReveal: { value: 0 }
  };
  const fieldScene = new Scene();
  const field = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({
    uniforms, vertexShader: fieldVertex, fragmentShader: fieldFragment, depthTest: false, depthWrite: false
  }));
  field.frustumCulled = false;
  fieldScene.add(field);

  /* Mark */
  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studio(), 0.035).texture;
  pmrem.dispose();

  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const geometry = new ExtrudeGeometry(letterShape(), {
    depth: 64, bevelEnabled: true, bevelThickness: 14, bevelSize: 10, bevelSegments: 12, curveSegments: 120
  });
  geometry.translate(0, 0, -32);
  geometry.scale(0.01, 0.01, 0.01);
  geometry.computeBoundingBox();

  const material = new MeshPhysicalMaterial({
    metalness: 0.66, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.04,
    iridescence: 0.35, iridescenceIOR: 1.35, envMapIntensity: 1.15
  });

  // Letter centres relative to the middle of the whole mark (outline spans -165..457 in logo units)
  const homeA = new Vector3(-1.46, 0, 0), homeB = new Vector3(1.66, 0, 0);
  const letterA = new Mesh(geometry, material);
  const letterB = new Mesh(geometry, material);
  const pivot = new Group();
  const anchor = new Group();
  pivot.add(letterA, letterB);
  anchor.add(pivot);
  scene.add(anchor);

  const key = new DirectionalLight('#ffffff', 2.4);
  key.position.set(-4, 5, 6);
  const rim = new DirectionalLight('#c9b6ff', 3.2);
  rim.position.set(5, -2, -4);
  const glint = new PointLight('#ffffff', 0, 0, 2);
  glint.position.set(0, 0, 3);
  scene.add(key, rim, glint);

  /* Theme */
  const applyTheme = () => {
    const p = readPalette();
    material.color.set(p.brand);
    material.emissive.set(p.brand);
    material.emissiveIntensity = p.light ? 0.05 : 0.08;
    hexToVec(p.bg, uniforms.uBg.value);
    hexToVec(p.ink, uniforms.uInk.value);
    hexToVec(p.brand, uniforms.uBrand.value);
    uniforms.uDotA.value = p.light ? 0.09 : 0.075;
    uniforms.uGlow.value = p.light ? 0.06 : 0.09;
  };
  applyTheme();
  new MutationObserver(applyTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  /* Layout: the mark is fitted into the free space the headline leaves.
     Wide screens: to the right of the first line and above the second. Narrow screens: above the headline.
     Measured from layout boxes (offsets), so the entrance animations of the text do not skew it. */
  let width = 1, height = 1, dpr = 1, viewH = 1, viewW = 1, baseScale = 1;
  const home = new Vector3();
  const MARK_RATIO = 2.06; // width / height of the mark on screen, with some room for the tilt
  const freeBox = () => {
    const heroRect = hero.getBoundingClientRect();
    const inner = hero.querySelector('.hero-inner');
    const lines = hero.querySelectorAll('.hero-title .line');
    const title = hero.querySelector('.hero-title');
    const header = document.getElementById('top');
    if (!inner || lines.length < 2 || !title) return null;
    const innerRect = inner.getBoundingClientRect();
    const ox = innerRect.left - heroRect.left, oy = innerRect.top - heroRect.top;
    const lineBox = line => {
      const r = line.getBoundingClientRect();
      const text = line.firstElementChild;
      return { left: r.left - heroRect.left, right: r.left - heroRect.left + (text ? text.offsetWidth : r.width), top: r.top - heroRect.top };
    };
    const first = lineBox(lines[0]), second = lineBox(lines[1]);
    const top = (header ? header.offsetHeight : 76) + 20;
    const right = ox + inner.offsetWidth;
    const wideBox = { x0: first.right + Math.max(32, width * 0.03), x1: right, y0: top, y1: second.top + 6 };
    const narrowBox = { x0: ox, x1: right, y0: top, y1: oy + title.offsetTop - 24 };
    return { wideBox, narrowBox };
  };
  const fit = box => {
    const w = box.x1 - box.x0, h = box.y1 - box.y0;
    if (w <= 0 || h <= 0) return { px: 0 };
    const px = Math.min(w * 0.94, h * 0.94 * MARK_RATIO);
    return { px, cx: (box.x0 + box.x1) / 2, cy: (box.y0 + box.y1) / 2 };
  };
  const layout = () => {
    width = Math.max(1, hero.clientWidth);
    height = Math.max(1, hero.clientHeight);
    dpr = Math.min(devicePixelRatio || 1, 2, Math.sqrt(4.6e6 / (width * height)));
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    viewH = 2 * Math.tan(MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    viewW = viewH * camera.aspect;
    uniforms.uRes.value.set(width * dpr, height * dpr);
    uniforms.uDpr.value = dpr;

    const boxes = freeBox();
    let spot = null;
    if (boxes) {
      const side = fit(boxes.wideBox);
      const above = fit(boxes.narrowBox);
      const sideOk = width > 900 && side.px >= 300;
      spot = sideOk ? { ...side, px: Math.min(side.px, width * 0.42, 640) } : { ...above, px: Math.min(above.px, width * 0.8, 520) };
    }
    if (!spot || spot.px < 120) spot = { px: Math.min(width * 0.6, 420), cx: width / 2, cy: height * 0.25 };
    const unit = viewW / width; // world units per CSS pixel
    baseScale = (spot.px * unit) / 6.4;
    home.set((spot.cx - width / 2) * unit, (height / 2 - spot.cy) * unit, 0);
  };
  layout();
  new ResizeObserver(layout).observe(hero);
  addEventListener('languagechange', () => requestAnimationFrame(layout));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  /* Pointer: tilt, a light that follows the cursor, drag or tap to spin */
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const pointer = { x: 0, y: 0, inside: false };
  const tilt = { x: 0, y: 0 };
  const ndc = new Vector2();
  const raycaster = new Raycaster();
  const localRay = new Ray();
  const inverse = new Matrix4();
  const toNdc = (clientX, clientY) => {
    const rect = hero.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    return rect;
  };
  const hitsMark = (clientX, clientY) => {
    toNdc(clientX, clientY);
    raycaster.setFromCamera(ndc, camera);
    return [letterA, letterB].some(mesh => {
      inverse.copy(mesh.matrixWorld).invert();
      localRay.copy(raycaster.ray).applyMatrix4(inverse);
      return localRay.intersectsBox(geometry.boundingBox);
    });
  };

  let spin = 0, spinVel = 0, dragging = false, dragId = null, lastX = 0, lastT = 0, travel = 0;
  let hovering = false, introAt = -1;
  const setHover = state => {
    if (state === hovering) return;
    hovering = state;
    hero.classList.toggle('is-grab', state);
    dispatchEvent(new CustomEvent('cursor:label', { detail: state ? 'Przeciągnij' : null }));
  };
  const interactive = target => target.closest('a,button,input,select,textarea,label');

  const last = { x: -1, y: -1 };
  addEventListener('scroll', () => {
    if (!hovering || dragging) return;
    const rect = hero.getBoundingClientRect();
    if (last.y < rect.top || last.y > rect.bottom || !hitsMark(last.x, last.y)) setHover(false);
  }, { passive: true });
  addEventListener('pointermove', e => {
    last.x = e.clientX; last.y = e.clientY;
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = (e.clientY / innerHeight) * 2 - 1;
    const rect = hero.getBoundingClientRect();
    pointer.inside = e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (dragging && e.pointerId === dragId) {
      const now = performance.now();
      const dx = e.clientX - lastX;
      travel += Math.abs(dx);
      spin += dx * 0.011;
      spinVel = MathUtils.lerp(spinVel, (dx * 0.011) / Math.max(0.008, (now - lastT) / 1000), 0.5);
      lastX = e.clientX; lastT = now;
    } else if (fine && introAt >= 0 && e.pointerType === 'mouse') {
      setHover(pointer.inside && !interactive(e.target) && hitsMark(e.clientX, e.clientY));
    }
  }, { passive: true });

  hero.addEventListener('pointerdown', e => {
    if (introAt < 0 || interactive(e.target) || !hitsMark(e.clientX, e.clientY)) return;
    if (e.pointerType === 'mouse') {
      e.preventDefault();
      dragging = true; dragId = e.pointerId; lastX = e.clientX; lastT = performance.now(); travel = 0; spinVel = 0;
      hero.setPointerCapture(e.pointerId);
      hero.classList.add('is-grabbing');
    } else {
      spinVel += 10; // a tap on touch screens sends the mark around once
    }
  });
  const release = e => {
    if (!dragging || e.pointerId !== dragId) return;
    dragging = false;
    hero.classList.remove('is-grabbing');
    if (travel < 4) spinVel += 10; // a click without dragging spins it too
    try { hero.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
  };
  hero.addEventListener('pointerup', release);
  hero.addEventListener('pointercancel', release);
  document.documentElement.addEventListener('pointerleave', () => { pointer.inside = false; last.x = -1; setHover(false); });

  /* Intro starts when the loader lifts */
  const clock = new Clock();
  const beginIntro = () => { if (introAt < 0) introAt = clock.getElapsedTime(); };
  if (root.classList.contains('is-ready')) beginIntro();
  else {
    addEventListener('intro:reveal', beginIntro, { once: true });
    setTimeout(beginIntro, 5000);
  }

  let visible = true;
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) setHover(false);
  }, { threshold: 0 }).observe(hero);

  let lost = false;
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    lost = true;
    root.classList.remove('has-3d');
  });

  const projected = new Vector3();
  const lightTarget = new Vector3();
  const lightDir = new Vector3();
  let mouseStrength = 0;

  const render = () => {
    renderer.clear();
    renderer.render(fieldScene, camera);
    renderer.clearDepth();
    renderer.render(scene, camera);
  };

  const tick = () => {
    requestAnimationFrame(tick);
    if (lost) return;
    if (!visible || document.hidden) { clock.getDelta(); return; }
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const since = introAt < 0 ? 0 : t - introAt;
    const eA = easeOutExpo(clamp01((since - 0.05) / 2));
    const eB = easeOutExpo(clamp01((since - 0.2) / 2));
    const reveal = easeOutQuart(clamp01((since - 0.1) / 2.6));
    const scroll = clamp01(scrollY / Math.max(1, height));

    // spin settles back to the front after a drag or a tap
    if (!dragging) {
      spin += spinVel * dt;
      spinVel *= Math.pow(0.12, dt);
      if (Math.abs(spinVel) < 3) {
        const rest = Math.round(spin / TAU) * TAU;
        spinVel += (rest - spin) * 26 * dt;
        spinVel *= Math.pow(0.02, dt);
      }
    }

    tilt.x += (pointer.x - tilt.x) * Math.min(1, dt * 3);
    tilt.y += (pointer.y - tilt.y) * Math.min(1, dt * 3);

    anchor.position.set(home.x, home.y - scroll * viewH * 0.18, 0);
    anchor.scale.setScalar(baseScale * (0.82 + 0.18 * eA) * (1 - scroll * 0.18));

    pivot.rotation.y = -0.3 + tilt.x * 0.42 + Math.sin(t * 0.4) * 0.07 + spin + scroll * 0.5;
    pivot.rotation.x = 0.12 + tilt.y * 0.28 + Math.cos(t * 0.5) * 0.045 + scroll * 0.55;
    pivot.rotation.z = Math.sin(t * 0.3) * 0.025;

    const iA = 1 - eA, iB = 1 - eB;
    letterA.position.set(homeA.x - iA * 2.6 - scroll * 0.9, iA * -0.9 + Math.sin(t * 0.9) * 0.05, iA * -5);
    letterA.rotation.set(iA * 0.7, iA * -2.4 - scroll * 0.8, iA * 0.5 + scroll * 0.45);
    letterB.position.set(homeB.x + iB * 2.6 + scroll * 0.9, iB * 0.9 + Math.sin(t * 0.9 + 1.4) * 0.05, iB * -5);
    letterB.rotation.set(iB * -0.7, iB * 2.4 + scroll * 0.8, iB * -0.5 - scroll * 0.45);

    // light that follows the cursor across the surface
    toNdc(((pointer.x + 1) / 2) * innerWidth, ((pointer.y + 1) / 2) * innerHeight);
    lightDir.set(ndc.x, ndc.y, 0.5).unproject(camera).sub(camera.position).normalize();
    lightTarget.copy(camera.position).addScaledVector(lightDir, (2.6 - camera.position.z) / lightDir.z);
    glint.position.lerp(lightTarget, Math.min(1, dt * 4));
    glint.intensity += ((fine && pointer.inside ? 11 : 0) - glint.intensity) * Math.min(1, dt * 3);

    // field uniforms
    scene.updateMatrixWorld();
    projected.setFromMatrixPosition(anchor.matrixWorld).project(camera);
    const pxPerUnit = (height * dpr) / viewH;
    uniforms.uMark.value.set((projected.x * 0.5 + 0.5) * width * dpr, (projected.y * 0.5 + 0.5) * height * dpr, baseScale * 3.6 * pxPerUnit);
    if (fine) {
      const rect = hero.getBoundingClientRect();
      pointer.inside = last.x >= 0 && last.y >= rect.top && last.y <= rect.bottom;
      mouseStrength += ((pointer.inside ? 1 : 0) - mouseStrength) * Math.min(1, dt * 4);
      uniforms.uMouse.value.set((last.x - rect.left) * dpr, (rect.bottom - last.y) * dpr, mouseStrength * reveal);
    } else {
      // touch screens get a slow drifting light instead of a cursor
      const m = uniforms.uMark.value;
      uniforms.uMouse.value.set(m.x + Math.cos(t * 0.33) * width * dpr * 0.3, m.y + Math.sin(t * 0.47) * height * dpr * 0.18, 0.55 * reveal);
    }
    uniforms.uTime.value = t;
    uniforms.uReveal.value = reveal;

    render();
  };

  // Compile shaders before the loader lifts so the first frames do not stutter
  try {
    if (renderer.compileAsync) {
      await renderer.compileAsync(scene, camera);
      await renderer.compileAsync(fieldScene, camera);
    } else {
      renderer.compile(scene, camera);
      renderer.compile(fieldScene, camera);
    }
  } catch (e) { /* compile on first render instead */ }

  tick();
  root.classList.add('has-3d');
  signal('ready');
}

if (canRun()) {
  start().catch(err => {
    console.warn('3D mark disabled:', err);
    root.classList.remove('has-3d');
    signal('none');
  });
} else {
  signal('none');
}
