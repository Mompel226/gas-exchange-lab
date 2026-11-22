/* ============================================================
   chest3d.js — the real chest in three dimensions, for the Gas Exchange Lab.

   Loaded ONLY when a chest comes on screen, by a dynamic import(), so a reader who never reaches it never downloads
   three.js or the model. Everything it needs is in this repository: js/vendor/three (three.js r185.1, MIT) and
   assets/3d/chest.bin with chest.json.

   THE MODEL (assets/3d/CREDITS.md): BodyParts3D, © The Database Center for Life Science, CC BY-SA 2.1 Japan, the source of
   the Human Body Hub's body: 24 ribs, 14 costal cartilages, the sternum, 12 thoracic vertebrae and their discs, the
   external and internal intercostal muscles, the diaphragm, the five lobes of the lungs, the trachea and the bronchi,
   each measured from one real body. Frame: 1 unit = 1 dm, +x the body's LEFT, +y up, +z forward, so a camera on +z sees
   the person facing you, their right side on your left.

   THE MOVEMENT (labs/gas-exchange-lab-source/chest3d-build/build_chest.py says how it was worked out, with sources).
   Two numbers: q, the ribs (0 the end of a quiet breath out, 1 a deep breath in, -0.35 a hard breath out), and d, the
   diaphragm, on the same scale. Every vertex is p0 + q A + q² B + d D, drawn on the graphics card, so the whole chest
   moves as one and any moment can be drawn exactly (memory headless-raf-animations).
   ============================================================ */
import * as THREE from './vendor/three/build/three.module.min.js?v=0.185.1';
import { OrbitControls } from './vendor/three/examples/jsm/controls/OrbitControls.js?v=0.185.1';

/* the look of each part: drawn colours, not real ones, and each part clearly apart from its neighbour (memory
   3d-anatomy-whole). ext and int are the two muscle layers, told apart by colour and by the direction of their fibres. */
export const COLORS = {
  spine: 0xcfc4ad, rib: 0xefe6d2, sternum: 0xefe6d2, cartilage: 0xb9d6d6, ext: 0xd2604e, int: 0xe7a23c,
  diaphragm: 0xb0483f, lung: 0xeda6ac, airway: 0xdbe6ee, heart: 0xa8706a
};
const CUT = { lung: 0xe58b95, airway: 0xf3f7fa, spine: 0xd6ccb6, rib: 0xf6efdf, sternum: 0xf6efdf, cartilage: 0xcfe6e4, ext: 0xe0705c, int: 0xf0b050, diaphragm: 0xc65a4e, heart: 0xbb857e };
const ORDER = ['spine', 'rib', 'sternum', 'cartilage', 'int', 'ext', 'diaphragm', 'heart', 'airway', 'lung'];
/* the cut faces are drawn in this order; the lung's comes last and leaves its mark in the stencil, so the tree of bronchi can
   be drawn exactly where the cut passes through a lung, and never over the diaphragm below it */
const CAPS = ['diaphragm', 'int', 'ext', 'cartilage', 'spine', 'rib', 'sternum', 'lung'];

let MODEL = null;
function loadModel(stamp) {
  if (MODEL) return MODEL;
  const base = new URL('../assets/3d/', import.meta.url);
  const v = stamp ? '?v=' + stamp : '';
  MODEL = Promise.all([fetch(new URL('chest.json' + v, base)).then((r) => r.json()), fetch(new URL('chest.bin' + v, base)).then((r) => r.arrayBuffer())])
    .then(([head, bin]) => {
      const out = {};
      Object.keys(head.groups).forEach((name) => {
        const g = head.groups[name], n = g.v, pos = new Float32Array(n * 3), a = new Float32Array(n * 3), b = new Float32Array(n * 3);
        const qp = new Int16Array(bin, g.pos, n * 3), qa = new Int16Array(bin, g.a, n * 3), qb = new Int8Array(bin, g.b, n * 3);
        for (let i = 0; i < n * 3; i++) { pos[i] = g.lo[i % 3] + (qp[i] + 32767) * g.sc; a[i] = qa[i] * g.sa; b[i] = qb[i] * g.sb; }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(bin, g.nor, n * 3), 3, true));
        geo.setAttribute('aA', new THREE.BufferAttribute(a, 3));
        geo.setAttribute('aB', new THREE.BufferAttribute(b, 3));
        let d = null;
        if (g.d != null) {
          const qd = new Int16Array(bin, g.d, n * 3); d = new Float32Array(n * 3);
          for (let i = 0; i < n * 3; i++) d[i] = qd[i] * g.sd;
          geo.setAttribute('aD', new THREE.BufferAttribute(d, 3));
        }
        if (g.fib != null) geo.setAttribute('aF', new THREE.BufferAttribute(new Float32Array(bin, g.fib, n), 1));
        geo.setIndex(new THREE.BufferAttribute(g.wide ? new Uint32Array(bin, g.idx, g.t * 3) : new Uint16Array(bin, g.idx, g.t * 3), 1));
        geo.computeBoundingSphere();
        geo.boundingSphere.radius += .4;             /* the chest moves: never culled while it is in view */
        out[name] = { geo, pos, a, b, d, part: new Uint8Array(bin, g.part, n), n };
      });
      return { head, groups: out };
    });
  return MODEL;
}

const VIEWS = {
  front: { p: [0, .06, 1], t: [0, .04, 0], d: 9.4 },
  cut: { p: [0, .05, 1], t: [0, .08, 0], d: 8.6 },
  side: { p: [-1, .06, .02], t: [0, .04, 0], d: 9.4 },
  turned: { p: [-.62, .16, .77], t: [0, .04, 0], d: 9.6 },
  low: { p: [-.36, -.24, .9], t: [0, -.3, 0], d: 8.2 }
};

export async function createChest(host, opts) {
  opts = opts || {};
  const { head, groups } = await loadModel(opts.stamp);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, stencil: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.keep });
  renderer.setPixelRatio(Math.min(global().devicePixelRatio || 1, 2));
  renderer.localClippingEnabled = true;
  renderer.autoClearStencil = true;
  const el = renderer.domElement;
  el.className = 'chest3d__canvas';
  host.appendChild(el);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(22, 1, .5, 40);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x3b4655, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(-3.5, 5, 8); scene.add(key);
  const fill = new THREE.DirectionalLight(0xfff2e6, .7); fill.position.set(6, 1, 3); scene.add(fill);
  const back = new THREE.DirectionalLight(0xdfe9ff, .5); back.position.set(0, 2, -8); scene.add(back);

  const U = { uQ: { value: 0 }, uD: { value: 0 } };
  const clip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
  const CLIP = [clip];
  const root = new THREE.Group(); scene.add(root);
  const parts = {};

  function morph(mat, name, geo) {
    const hasD = !!geo.getAttribute('aD'), hasF = !!geo.getAttribute('aF');
    mat.onBeforeCompile = (s) => {
      s.uniforms.uQ = U.uQ; s.uniforms.uD = U.uD;
      s.vertexShader = s.vertexShader.replace('#include <common>',
        '#include <common>\nattribute vec3 aA; attribute vec3 aB;' + (hasD ? ' attribute vec3 aD;' : '') + (hasF ? ' attribute float aF; varying float vF;' : '') + ' uniform float uQ; uniform float uD;')
        .replace('#include <begin_vertex>', 'vec3 transformed = position + aA * uQ + aB * uQ * uQ' + (hasD ? ' + aD * uD' : '') + ';' + (hasF ? ' vF = aF;' : ''));
      if (hasF && s.fragmentShader.includes('#include <color_fragment>')) {
        /* the muscle's fibres: fine lines running the way this layer's fibres really run */
        s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vF;')
          .replace('#include <color_fragment>', '#include <color_fragment>\n' +
            'float fw = max(fwidth(vF) * 1.1, .0001); float fb = abs(fract(vF / 3.1) - .5) * 2.; float fs = smoothstep(.42 - fw, .42 + fw, fb); diffuseColor.rgb *= mix(1.1, .68, fs);');
      }
    };
    mat.customProgramCacheKey = () => 'chest-' + name + (mat.isMeshBasicMaterial ? '-b' : '');
    return mat;
  }

  ORDER.forEach((name) => {
    const g = groups[name];
    const mat = morph(new THREE.MeshStandardMaterial({ color: COLORS[name], roughness: name === 'lung' ? .62 : .5, metalness: 0, side: name === 'diaphragm' ? THREE.DoubleSide : THREE.FrontSide }), name, g.geo);
    const mesh = new THREE.Mesh(g.geo, mat);
    mesh.name = name;
    mesh.frustumCulled = false;
    root.add(mesh);
    parts[name] = { mesh, mat, base: new THREE.Color(COLORS[name]), opacity: 1, tone: 1, glow: 0, g };
  });

  /* ---------- the cut face (memory threejs-cut-face-stencil; the Circulation Lab's heart3d.js) ----------
     1. the plane's depth is written; 2. for one group of closed solids, the faces behind the plane count into the stencil
     (+1 back, -1 front), so the count is not zero where the plane passes through the group; 3. a flat face in the group's
     cut colour is drawn on the plane there, and the count is reset. One group at a time. */
  const capPlane = new THREE.PlaneGeometry(12, 12);
  const capDepth = new THREE.Mesh(capPlane, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, depthFunc: THREE.AlwaysDepth, side: THREE.DoubleSide }));
  capDepth.renderOrder = 19; capDepth.visible = false; capDepth.frustumCulled = false; root.add(capDepth);
  const caps = {};
  CAPS.forEach((name, i) => {
    const pt = parts[name];
    const pair = [[THREE.BackSide, THREE.IncrementWrapStencilOp], [THREE.FrontSide, THREE.DecrementWrapStencilOp]].map(([side, op]) => {
      const m = morph(new THREE.MeshBasicMaterial({ side, colorWrite: false, depthWrite: false, depthFunc: THREE.GreaterDepth,
        stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc, stencilRef: 0, stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: op }), name + '-s' + side, pt.g.geo);
      const c = new THREE.Mesh(pt.g.geo, m); c.renderOrder = 20 + i * 2; c.frustumCulled = false; c.visible = false; root.add(c);
      return c;
    });
    const quad = new THREE.Mesh(capPlane, new THREE.MeshBasicMaterial({ color: CUT[name], toneMapped: false, side: THREE.DoubleSide, depthTest: false, depthWrite: false,
      stencilWrite: true, stencilRef: 0, stencilFunc: THREE.NotEqualStencilFunc, stencilFail: THREE.KeepStencilOp,
      stencilZFail: name === 'lung' ? THREE.KeepStencilOp : THREE.ReplaceStencilOp, stencilZPass: name === 'lung' ? THREE.KeepStencilOp : THREE.ReplaceStencilOp }));
    quad.renderOrder = 21 + i * 2; quad.visible = false; quad.frustumCulled = false; root.add(quad);
    if (name === 'lung') {
      /* a cut lung is a sponge of tiny air spaces, never a plain colour (memory 3d-anatomy-whole) */
      quad.material.onBeforeCompile = (s) => {
        s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvP = (modelMatrix * vec4(position, 1.)).xy;');
        s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vP;\n' +
          'vec2 h2(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }\n' +
          'float cellD(vec2 p){ vec2 i = floor(p), f = fract(p); float d = 1.; for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)); vec2 r = g + h2(i + g) - f; d = min(d, dot(r, r)); } return sqrt(d); }')
          .replace('#include <color_fragment>', '#include <color_fragment>\nfloat sp = cellD(vP * 26.); diffuseColor.rgb *= mix(.8, 1.05, smoothstep(.1, .52, sp));');
      };
      quad.material.customProgramCacheKey = () => 'chest-lungcap';
    }
    caps[name] = { pair, quad };
  });
  /* the airways in a cut chest, whole and drawn over the cut: the bronchi inside each lung (only where the stencil says the
     cut passes through a lung), then the trachea and the two main bronchi between the lungs */
  function airwayCopy(top, order) {
    const m = morph(new THREE.MeshStandardMaterial({ color: COLORS.airway, roughness: .45, metalness: 0, side: THREE.FrontSide,
      stencilWrite: !top, stencilRef: 0, stencilFunc: top ? THREE.AlwaysStencilFunc : THREE.NotEqualStencilFunc, stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: THREE.KeepStencilOp }), top ? 'airT' : 'airI', parts.airway.g.geo);
    if (top) {
      const prev = m.onBeforeCompile;
      m.onBeforeCompile = (s, r) => {
        s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vO;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvO = position;');
        s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vO;').replace('#include <color_fragment>', '#include <color_fragment>\nif (abs(vO.x) > .62 || vO.y < .34) discard;');
        prev(s, r);
      };
    }
    const c = new THREE.Mesh(parts.airway.g.geo, m);
    c.renderOrder = order; c.frustumCulled = false; c.visible = false; root.add(c);
    return c;
  }
  const airIn = airwayCopy(false, 60), airTop = airwayCopy(true, 61);
  airIn.onBeforeRender = (r) => r.clearDepth();
  let cutOn = false, cutAt = 0;
  /* the heart's front: while the cut stands in front of it (the film's first step, the front of the chest being cut away), the
     heart and the airways are drawn as ordinary parts, behind the ribs; once the cut reaches them they are drawn whole, over it */
  let HEART_FRONT = -Infinity;
  { const P = parts.heart.g.pos; for (let i = 2; i < P.length; i += 3) if (P[i] > HEART_FRONT) HEART_FRONT = P[i]; }
  function placeCut() {
    clip.constant = cutAt;
    capDepth.position.z = cutAt;
    Object.values(caps).forEach((c) => { c.quad.position.z = cutAt; });
  }
  function applyCut() {
    const open = cutOn && camera.position.z > cutAt;
    ORDER.forEach((n) => {
      const m = parts[n].mat;
      /* the heart stays whole in a cut chest, in its place between the lungs: it is not what this picture is about */
      const want = cutOn && n !== 'heart' ? CLIP : [];
      if (m.clippingPlanes !== want && (m.clippingPlanes || []).length !== want.length) { m.clippingPlanes = want; m.needsUpdate = true; }
      m.side = (cutOn && n !== 'heart') || n === 'diaphragm' ? THREE.DoubleSide : THREE.FrontSide;
    });
    capDepth.visible = open;
    const inside = open && cutAt < HEART_FRONT;
    parts.heart.mesh.renderOrder = inside ? 60.5 : 0;
    const airOn = parts.airway.opacity > .012;
    parts.airway.mesh.visible = airOn && !inside;
    airIn.visible = airTop.visible = airOn && inside;
    airIn.material.color.copy(parts.airway.mat.color); airTop.material.color.copy(parts.airway.mat.color);
    airIn.material.emissive.copy(parts.airway.base); airTop.material.emissive.copy(parts.airway.base);
    airIn.material.emissiveIntensity = airTop.material.emissiveIntensity = parts.airway.glow;
    CAPS.forEach((n) => {
      const on = open && parts[n].mesh.visible && parts[n].opacity > .5;
      caps[n].pair.forEach((c) => { c.visible = on; });
      caps[n].quad.visible = on;
    });
  }

  /* ---------- turning and zooming (memory 3d-zoom-where-fingers-are) ---------- */
  const controls = new OrbitControls(camera, el);
  const coarse = !!(global().matchMedia && global().matchMedia('(pointer: coarse)').matches);
  controls.enableDamping = false; controls.enablePan = false; controls.rotateSpeed = coarse ? .7 : .55; controls.zoomSpeed = .9;
  controls.minDistance = 1.4; controls.maxDistance = 16; controls.minPolarAngle = .35; controls.maxPolarAngle = Math.PI - .35;
  controls.zoomToCursor = true;
  const WHEEL = controls.zoomSpeed, PINCH = .1 / -Math.log(.95);
  const disposers = [];
  const on = (t, type, fn, o) => { t.addEventListener(type, fn, o); disposers.push(() => t.removeEventListener(type, fn, o)); };
  on(global(), 'wheel', (e) => { if (e.target === el) controls.zoomSpeed = e.ctrlKey && !controls._controlActive ? PINCH * Math.min(1, 40 / (Math.abs(e.deltaY) || 1)) : WHEEL; }, { capture: true, passive: true });
  const fingers = new Map();
  const onFinger = (e) => {
    if (e.type === 'pointerdown' && e.target === el) controls.zoomSpeed = e.pointerType === 'touch' ? 1 : WHEEL;
    if (e.pointerType !== 'touch' || (e.type === 'pointerdown' ? e.target !== el : !fingers.has(e.pointerId))) return;
    Object.defineProperty(e, 'pageX', { value: e.clientX });
    Object.defineProperty(e, 'pageY', { value: e.clientY });
    fingers.set(e.pointerId, [e.clientX, e.clientY]);
  };
  const offFinger = (e) => fingers.delete(e.pointerId);
  ['pointerdown', 'pointermove'].forEach((t) => on(global(), t, onFinger, true));
  ['pointerup', 'pointercancel'].forEach((t) => on(global(), t, offFinger, true));
  if (!navigator.maxTouchPoints) {
    let last = 1, pinching = false, px = 0, py = 0;
    on(el, 'pointermove', (e) => { px = e.clientX; py = e.clientY; });
    on(el, 'gesturestart', (e) => { e.preventDefault(); last = 1; pinching = true; });
    on(el, 'gesturechange', (e) => {
      e.preventDefault();
      const k = e.scale / last; last = e.scale;
      if (!(k > 0) || !isFinite(k) || k === 1) return;
      el.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 * Math.log(k), ctrlKey: true, bubbles: true, cancelable: true, clientX: e.clientX ?? px, clientY: e.clientY ?? py }));
    });
    on(el, 'gestureend', (e) => { e.preventDefault(); pinching = false; });
    on(global(), 'wheel', (e) => { if (pinching && e.isTrusted) { e.preventDefault(); e.stopPropagation(); } }, { capture: true, passive: false });
  }

  /* ---------- drawing: only when something changed ---------- */
  let W = 0, H = 0, dirty = true, raf = 0, dead = false, manual = false;
  const listeners = new Set();
  function draw() {
    raf = 0;
    if (dead || !W || !H) return;
    dirty = false;
    applyCut();
    renderer.clear();
    renderer.render(scene, camera);
    listeners.forEach((f) => f());
  }
  /* `manual`: a film draws each moment itself (api.now), so nothing here draws it a second time */
  function kick() { dirty = true; if (!manual && !raf && !dead) raf = requestAnimationFrame(draw); }
  controls.addEventListener('change', kick);
  function resize() {
    const r = host.getBoundingClientRect(), w = Math.round(r.width), hh = Math.round(r.height);
    if (!w || !hh || (w === W && hh === H)) return;
    W = w; H = hh; camera.aspect = W / H; camera.updateProjectionMatrix();
    renderer.setSize(W, H, false);
    el.style.width = W + 'px'; el.style.height = H + 'px';
    if (!dead) draw();
  }
  const ro = global().ResizeObserver ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(host);

  /* a named view: the camera arrives over `ms`, or at once. Tall or narrow pictures stand further back, so the whole chest fits. */
  let tween = null;
  function fitDist(d) { const a = camera.aspect || 1; return a < .9 ? d * (.9 / a) * 1.02 : d; }
  function setCam(p, t) { camera.position.copy(p); controls.target.copy(t); camera.lookAt(t); }
  function viewNow(name) {
    const v = VIEWS[name] || VIEWS.front;
    const dir = new THREE.Vector3(...v.p).normalize();
    const t = new THREE.Vector3(...v.t);
    setCam(t.clone().addScaledVector(dir, fitDist(v.d)), t);
    controls.update();
  }
  function view(name, ms) {
    const v = VIEWS[name] || VIEWS.front;
    if (!ms) { tween = null; viewNow(name); kick(); return; }
    const t1 = new THREE.Vector3(...v.t), t0 = controls.target.clone();
    const s0 = new THREE.Spherical().setFromVector3(camera.position.clone().sub(t0));
    const s1 = new THREE.Spherical().setFromVector3(new THREE.Vector3(...v.p).normalize().multiplyScalar(fitDist(v.d)));
    let dt = s1.theta - s0.theta; if (dt > Math.PI) dt -= 2 * Math.PI; if (dt < -Math.PI) dt += 2 * Math.PI;
    const start = performance.now();
    tween = { start, ms };
    const step = () => {
      if (!tween || tween.start !== start || dead) return;
      let k = (performance.now() - start) / ms; k = k >= 1 ? 1 : k;
      const e = k * k * (3 - 2 * k), sp = new THREE.Spherical(s0.radius + (s1.radius - s0.radius) * e, s0.phi + (s1.phi - s0.phi) * e, s0.theta + dt * e);
      setCam(t0.clone().lerp(t1, e).add(new THREE.Vector3().setFromSpherical(sp)), t0.clone().lerp(t1, e));
      controls.update(); kick();
      if (k < 1) requestAnimationFrame(step); else tween = null;
    };
    step();
  }
  /* a held view for a film: the camera at a blend of two named views, with no timer (any moment can be drawn) */
  function viewBlend(a, b, k) {
    const va = VIEWS[a], vb = VIEWS[b] || va;
    const ta = new THREE.Vector3(...va.t), tb = new THREE.Vector3(...vb.t);
    const sa = new THREE.Spherical().setFromVector3(new THREE.Vector3(...va.p).normalize().multiplyScalar(fitDist(va.d)));
    const sb = new THREE.Spherical().setFromVector3(new THREE.Vector3(...vb.p).normalize().multiplyScalar(fitDist(vb.d)));
    let dt = sb.theta - sa.theta; if (dt > Math.PI) dt -= 2 * Math.PI; if (dt < -Math.PI) dt += 2 * Math.PI;
    const e = k * k * (3 - 2 * k), sp = new THREE.Spherical(sa.radius + (sb.radius - sa.radius) * e, sa.phi + (sb.phi - sa.phi) * e, sa.theta + dt * e);
    const t = ta.lerp(tb, e);
    setCam(t.clone().add(new THREE.Vector3().setFromSpherical(sp)), t);
    controls.update();
  }

  function paint(name) {
    const p = parts[name];
    p.mat.color.copy(p.base).multiplyScalar(p.tone);
    p.mat.emissive.copy(p.base); p.mat.emissiveIntensity = p.glow;
    const a = p.opacity, see = a < .995;
    if (p.mat.transparent !== see) { p.mat.transparent = see; p.mat.needsUpdate = true; }
    p.mat.opacity = a; p.mat.depthWrite = a > .55;
    p.mesh.visible = a > .012;
    p.mesh.renderOrder = see ? 8 + ORDER.indexOf(name) * .1 : 0;
  }

  const P = new THREE.Vector3();
  function vertexAt(name, i, out) {
    const g = groups[name], j = i * 3, q = U.uQ.value, d = U.uD.value;
    out.set(g.pos[j] + g.a[j] * q + g.b[j] * q * q + (g.d ? g.d[j] * d : 0),
            g.pos[j + 1] + g.a[j + 1] * q + g.b[j + 1] * q * q + (g.d ? g.d[j + 1] * d : 0),
            g.pos[j + 2] + g.a[j + 2] * q + g.b[j + 2] * q * q + (g.d ? g.d[j + 2] * d : 0));
    return out;
  }

  /* what a press lands on: the nearest part in view, the cut respected */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function partAt(x, y) {
    ndc.set(x / W * 2 - 1, -y / H * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const meshes = ORDER.filter((n) => parts[n].opacity > .35).map((n) => parts[n].mesh);
    const hits = ray.intersectObjects(meshes, false).filter((h) => !cutOn || clip.distanceToPoint(h.point) >= -.01);
    if (!hits.length) return null;
    const h = hits[0], g = groups[h.object.name];
    return { name: h.object.name, part: head.parts[g.part[h.face.a] - 1], point: h.point.clone() };
  }

  const api = {
    THREE, el, camera, controls, renderer, scene, head, parts, groups, U,
    /* the chest's pose; d follows q unless given */
    pose(q, d) { U.uQ.value = q; U.uD.value = d == null ? q : d; kick(); },
    /* how much the lungs hold at this pose, 0 at the end of a quiet breath out and 1 after a deep breath in */
    volumeAt(q, d) {
      const v = head.volumes, full = (v.ribs - v.rest) + (v.dome - v.rest);
      const dq = q >= 0 ? q * (v.ribs - v.rest) : -q / .35 * (v.low - v.rest);
      return (dq + (d == null ? q : d) * (v.dome - v.rest)) / full;
    },
    opacity(name, a) { const p = parts[name]; if (!p) return; p.opacity = a; paint(name); kick(); },
    tone(name, t) { const p = parts[name]; if (!p) return; p.tone = t; paint(name); kick(); },
    glow(name, g) { const p = parts[name]; if (!p) return; p.glow = g; paint(name); kick(); },
    cut(on, at) { cutOn = !!on; if (at != null) { cutAt = at; placeCut(); } kick(); },
    view, viewBlend, viewNow,
    resize, kick, now() { if (raf) { cancelAnimationFrame(raf); raf = 0; } draw(); }, manual(on) { manual = !!on; },
    size() { return [W, H]; },
    onDraw(f) { listeners.add(f); return () => listeners.delete(f); },
    vertexAt: (name, i) => vertexAt(name, i, new THREE.Vector3()),
    /* the vertex of a group (or of one named part) that scores highest */
    find(name, score, onlyPart) {
      const g = groups[name]; let best = -1, s = -Infinity;
      const id = onlyPart ? head.parts.indexOf(onlyPart) + 1 : 0;
      for (let i = 0; i < g.n; i++) { if (id && g.part[i] !== id) continue; const j = i * 3, v = score(g.pos[j], g.pos[j + 1], g.pos[j + 2]); if (v > s) { s = v; best = i; } }
      return best;
    },
    /* where a vertex is on the canvas now, in CSS pixels, and whether the camera sees it (nothing in front of it) */
    project(name, i, test) {
      vertexAt(name, i, P);
      const w = P.clone(), s = w.clone().project(camera), x = (s.x + 1) / 2 * W, y = (1 - s.y) / 2 * H;
      let seen = true;
      if (test) {
        const dir = w.clone().sub(camera.position), L = dir.length();
        ray.set(camera.position, dir.normalize()); ray.far = L - .03;
        const meshes = ORDER.filter((n) => parts[n].mesh.visible && parts[n].opacity > .6).map((n) => parts[n].mesh);
        seen = !ray.intersectObjects(meshes, false).some((h) => !cutOn || clip.distanceToPoint(h.point) >= 0);
        ray.far = Infinity;
      }
      return { x, y, seen };
    },
    partAt,
    dispose() { dead = true; if (raf) cancelAnimationFrame(raf); if (ro) ro.disconnect(); disposers.forEach((f) => f()); controls.dispose(); renderer.dispose(); el.remove(); }
  };
  ORDER.forEach(paint);
  resize();
  viewNow('front');
  placeCut();
  kick();
  return api;
}
function global() { return window; }
