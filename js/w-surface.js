/* ============================================================
   w-surface.js — three short films for the features of the gas exchange surface (station `surface`, 11.1.1). Daniel, 23 Nov 2026: "that
   image doesn't really show how many alveoli there are ... an animation that really shows how much surface area there is by zooming in
   and then zooming out"; "For thin surface, you don't show a thin surface"; "good ventilation with air, you don't show any animations".

     manyalv    A large surface area: from one alveolus, out to its cluster, its bronchiole and both lungs, then the surface spread flat
     thinwall   A thin surface: the two walls, the diffusion distance, then a thin and a thick surface side by side
     freshair   Good ventilation: fresh air in, the gases diffuse, used air out; and what happens to the gradient if the air stays still

   The art is Servier's, as everywhere in this lab; the section is the one the film of diffusion draws (GasFlow, w-gases.js), to scale.
   The blood flows in every frame and goes on flowing while a step waits (WKit.world).
   SOURCES: 0610 2026–28 11.1.1; schemes 0610/31/M/J/24 Q3(a)(ii) (surface area and the rate of diffusion), 0610/33/M/J/22 Q5(a), 0610/43/M/J/25
   Q2(a). Beyond the syllabus, and marked so: about 480 million alveoli (Ochs et al. 2004, Am J Respir Crit Care Med 169: 120); a surface of
   about 130 m² (120–140 m²: Knudsen and Ochs 2018, Histochem Cell Biol 150: 661; Gehr et al. 1978, Respir Physiol 32: 121); a barrier
   about 1 µm thick (under 1 µm as a harmonic mean, the same review). Diffusion across a wall four times as thick is four times slower (Fick's law).
   ============================================================ */
(function (global) {
  'use strict';
  var L = global.CircLearn, K = global.WKit, F = global.GasFlow;
  if (!L || !K || !F) return;
  var n1 = K.n1, seg = K.seg, ease = K.ease, lerp = K.lerp, rng = K.rng, clamp = K.clamp01, h = L.h, NSV = K.NS;
  var W = 640, H = 534, WIN = { x0: 0, x1: W, y0: 0, y1: H }, UID = 0;

  /* what the three films share: the layers of the drawing, a drawn key, and the frame's layout */
  function stage(S, cls, u, more) {
    var defs = document.createElementNS(NSV, 'defs');
    defs.innerHTML = '<clipPath id="' + u + 'clip"><rect x="0" y="0" width="' + W + '" height="' + H + '" rx="12"/></clipPath>' + F.sectionDefs(u) + (more || '');
    S.svg.appendChild(defs);
    var bg = document.createElementNS(NSV, 'rect'); bg.setAttribute('class', cls + '__bg'); S.svg.appendChild(bg);
    var model = document.createElementNS(NSV, 'g'); S.svg.appendChild(model);
    var art = document.createElementNS(NSV, 'g'); art.setAttribute('clip-path', 'url(#' + u + 'clip)'); model.appendChild(art);
    var gLab = document.createElementNS(NSV, 'g'); S.svg.appendChild(gLab);
    return { bg: bg, model: model, art: art, gLab: gLab, cr: document.createElementNS(NSV, 'rect'), lay: null, narrow: false, key: K.pinKey(S), memo: {} };
  }
  function keyOf(S, u, list) {
    var icon = { o2: ['<circle r="4" fill="url(#' + u + 'mo)" stroke="#5A1109" stroke-width=".6"/>', 'oxygen'], co2: ['<circle r="4" fill="url(#' + u + 'mc)" stroke="#0E2F59" stroke-width=".6"/>', 'carbon dioxide'],
      hb: ['<g transform="scale(.72 .56)"><use href="#' + u + 'rbF"/></g><circle r="2.3" fill="url(#' + u + 'mo)" stroke="#FFF" stroke-width=".7"/>', 'oxygen on haemoglobin'],
      rbc: ['<g transform="scale(.72 .56)"><use href="#' + u + 'rbF"/></g>', 'red blood cell'] };
    var el = h('div', 'gk', list.map(function (k) { return '<span class="gk__i" data-k="' + k + '"><svg viewBox="-5 -5 10 10" aria-hidden="true">' + icon[k][0] + '</svg>' + icon[k][1] + '</span>'; }).join(''));
    S.fig.appendChild(el);
    return function (k, on) { el.querySelector('[data-k="' + k + '"]').style.visibility = on ? 'visible' : 'hidden'; };
  }
  function layout(S, T) {
    return function (Dw, nar) {
      T.narrow = nar;
      var m = K.margins(nar, 13.5, 13.5, 120, 120);
      T.lay = K.frameOf(S.svg, T.bg, T.model, T.cr, WIN, false, Dw, m[0], m[1], m[2], m[3], 13.5);
      T.model.setAttribute('transform', 'translate(0 0)');
    };
  }
  function names(T, itemsAt, tt, still) {
    var items = L.stillItems(still, itemsAt, itemsAt(tt), tt, T.memo, T.narrow + '|' + (T.lay ? T.lay.f : 0));
    T.gLab.innerHTML = K.names(T.lay, items, T.narrow, T.key, null, 14);
  }
  function op(x) { return n1(clamp(x) * 100) / 100; }

  /* ================================================================== 1. a large surface area ================== */
  var SA_TITLE = 'A large surface area: from one alveolus to both lungs';
  /* IB lines at the depth of the IB guide (Daniel, 27 Nov 2026: "the IB requires a little bit more"; "ask the other conversations to deepen the IB comments"), each saying only what its statement asks (memory ib-lines-words-against-the-guide): step 3 B3.1.4 (branched bronchioles), step 5 B3.1.1 and B3.1.4 (high surface area) */
  var SA_STEPS = [
    { t: 0, h: 'One alveolus', p: [['ig', 'This is **one alveolus**, a tiny air sac. Gases diffuse across its wall.']] },
    { t: 3.6, h: 'A cluster of alveoli', p: [['ig', 'The alveoli are packed together in small groups, called **clusters**. Each alveolus adds its own wall to the surface for gas exchange.'], ['bey', 'A cluster of alveoli is an **alveolar sac**.']] },
    { t: 8.2, h: 'Clusters on every bronchiole', p: [['ig', 'Each **bronchiole** divides and ends in **many clusters**. This drawing shows only one small branch.'], ['ib', 'A **branched network of bronchioles** is an adaptation of the lungs for gas exchange: the branches carry air to millions of alveoli, in every part of both lungs.']] },
    { t: 12.2, h: 'Millions of alveoli', p: [['ig', 'Every bronchiole in the two lungs ends like this.'], ['ig', 'So the lungs contain **millions of alveoli**.', 'card'], ['bey', 'An adult has about **480 million** alveoli. This number is not in the syllabus.']] },
    { t: 18.4, h: 'A very large surface area', p: [['ig', 'So the **total surface area** is **very large**, and the **rate of diffusion** is high.', 'card'], ['ib', 'Gas exchange is a **vital function** in all organisms, and the challenges become greater as an organism becomes larger: its **surface area-to-volume ratio** decreases, and the distance from its centre to its outside increases. The surface of a large body cannot exchange gases fast enough for all its cells, so the body needs a gas-exchange organ with a very **high surface area**, such as the alveolar lungs of a mammal.'], ['bey', 'If you spread the walls of all the alveoli flat, the walls cover about **130 m²**. This is about half a tennis court. Your skin is about 2 m². These numbers are not in the syllabus.']] }
  ];
  var SA_M = [0, 3.6, 8.2, 12.2, 18.4, 24.4];
  var SA_MOTION = { 'A large surface area: from one alveolus to both lungs': [3.4, 4, 3.6, 5.8, 4.2] };
  /* in the drawing's units: the one alveolus, its cluster, the whole drawing; where the drawing's middle lies on the lung, and how much smaller */
  var A1 = { x: 197.4, y: 309.1 }, CL = { x: 203, y: 320 }, WH = { x: 131, y: 190 }, PT = { x: 938.7, y: 1274 }, EMB = .105, LU = { x: 632, y: 1022, s: .84 };
  var LX = WH.x + (LU.x - PT.x) / EMB, LY = WH.y + (LU.y - PT.y) / EMB, S_END = LU.s * EMB;
  function camA(t) {
    var a = ease(seg(t, 3.8, 7.6)), b = ease(seg(t, 8.4, 11.8)), c = ease(seg(t, 12.4, 15.9)), s, cx, cy;
    if (t < 8.3) { s = 11 * (1 + .09 * (1 - ease(seg(t, 0, 3.4)))) * Math.pow(3.55 / 11, a); cx = lerp(A1.x, CL.x, a); cy = lerp(A1.y, CL.y, a); }
    else if (t < 12.3) { s = 3.55 * Math.pow(1.36 / 3.55, b); cx = lerp(CL.x, WH.x, b); cy = lerp(CL.y, WH.y, b); }
    else {
      s = 1.36 * Math.pow(S_END / 1.36, c);
      var w = (1 / s - 1 / 1.36) / (1 / S_END - 1 / 1.36);        /* the point on the screen moves in a straight line while the picture shrinks */
      cx = lerp(WH.x, LX, w); cy = lerp(WH.y, LY, w);
    }
    return { s: s, cx: cx, cy: cy, c: c };
  }
  function onDrawing(c, x, y) { return [W / 2 + (x - c.cx) * c.s, H / 2 + (y - c.cy) * c.s]; }
  function onBody(c, x, y) { return onDrawing(c, WH.x + (x - PT.x) / EMB, WH.y + (y - PT.y) / EMB); }
  /* how many alveoli are in the picture (the drawing's own: 53 in its cluster, 166 in all) */
  function countAt(t) {
    if (t < 3.8) return 1;
    if (t < 8.3) return 1 + 52 * ease(seg(t, 3.9, 7.5));
    if (t < 12.3) return 53 + 113 * ease(seg(t, 8.5, 11.6));
    return 166 * Math.pow(480e6 / 166, ease(seg(t, 13.2, 17.6)));
  }
  function countText(v) {
    if (v < 1.5) return '1 alveolus';
    if (v < 1e3) return Math.round(v) + ' alveoli';
    if (v < 1e6) return Math.round(v / 100) * 100 + ' alveoli';
    return 'about ' + Math.round(v / 1e6) + ' million alveoli';
  }
  /* a tennis court to scale, half of it covered by the surface; a person and their skin at the same scale */
  var CM = 24.2, CW = 23.77 * CM, CH = 10.97 * CM, CX = (W - CW) / 2, CY = (H - CH) / 2 + 16;
  var PERSON = { x: 4.4, y: .3 }, SKIN = { x: 7.6, y: .68 };      /* metres from the net, and part of the way across the court */
  function courtSvg(g, u) {
    var xn = CX + CW / 2, ys = 1.37 * CM, xs = 6.4 * CM, o = '';
    o += '<rect class="sa__court" x="' + n1(CX) + '" y="' + n1(CY) + '" width="' + n1(CW) + '" height="' + n1(CH) + '"/>';
    if (g > 0) o += '<rect fill="#F4B79C" stroke="#C4694F" stroke-width="1.6" x="' + n1(CX) + '" y="' + n1(CY) + '" width="' + n1(CW / 2 * g) + '" height="' + n1(CH) + '"/>';
    o += '<path class="sa__line" d="M' + n1(CX) + ' ' + n1(CY) + 'h' + n1(CW) + 'v' + n1(CH) + 'h' + n1(-CW) + 'zM' + n1(CX) + ' ' + n1(CY + ys) + 'h' + n1(CW) + 'M' + n1(CX) + ' ' + n1(CY + CH - ys) + 'h' + n1(CW) +
      'M' + n1(xn - xs) + ' ' + n1(CY + ys) + 'v' + n1(CH - 2 * ys) + 'M' + n1(xn + xs) + ' ' + n1(CY + ys) + 'v' + n1(CH - 2 * ys) + 'M' + n1(xn - xs) + ' ' + n1(CY + CH / 2) + 'h' + n1(2 * xs) + '"/>';
    o += '<path class="sa__net" d="M' + n1(xn) + ' ' + n1(CY - 5) + 'v' + n1(CH + 10) + '"/>';
    /* a person 1.7 m tall, and a square of 2 m², the area of the skin */
    var px = xn + PERSON.x * CM, py = CY + CH * PERSON.y, ph = 1.7 * CM;
    o += '<g class="sa__person" transform="translate(' + n1(px) + ' ' + n1(py) + ') scale(' + n1(ph / 40 * 100) / 100 + ')"><circle cx="0" cy="-16" r="4.6"/><path d="M-5.4-10h10.8l1.7 13h-3l-.9-7v8l1 16h-3.6l-1-12h-.8l-1 12h-3.6l1-16v-8l-.9 7h-3z"/></g>';
    var sq = Math.sqrt(2) * CM;
    o += '<rect class="sa__skin" x="' + n1(xn + SKIN.x * CM - sq / 2) + '" y="' + n1(CY + CH * SKIN.y - sq / 2) + '" width="' + n1(sq) + '" height="' + n1(sq) + '"/>';
    return o;
  }

  function manyalv(spec) {
    var u = 'sa' + (++UID) + '-', title = spec.title || SA_TITLE;
    var S = K.shell(spec, 'sa', title, 'A zoom out from one alveolus to its cluster, to one bronchiole and to both lungs, then the walls of all the alveoli spread flat on a tennis court.', []);
    var T = stage(S, 'sa', u, '<mask id="' + u + 'one" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '"><rect width="' + W + '" height="' + H + '" fill="#fff"/><path id="' + u + 'oneP" fill="#000" fill-rule="evenodd" d="' + (((global.GasShapes || {})['sv-alveoli.svg'] || {}).wall || '') + '"/></mask>' +
      '<clipPath id="' + u + 'grow"><circle id="' + u + 'growC" r="1"/></clipPath>');
    var oneP = T.bg.ownerSVGElement.querySelector('#' + u.replace(/([^\w-])/g, '\\$1') + 'oneP'), growC = S.svg.querySelector('#' + u + 'growC');
    /* three layers built once: the zoom only moves them */
    var gAlv = document.createElementNS(NSV, 'g'), gBody = document.createElementNS(NSV, 'g'), gLive = document.createElementNS(NSV, 'g');
    gBody.innerHTML = '<image href="assets/photos/sv-system.png" x="0" y="0" width="1248" height="1594"/><image clip-path="url(#' + u + 'grow)" href="assets/photos/sv-lungsacs.webp" x="290" y="725" width="685" height="600"/>';
    gAlv.innerHTML = '<image href="assets/photos/sv-alveoli.svg" x="0" y="0" width="262" height="380"/>';
    var bgR = document.createElementNS(NSV, 'rect'); bgR.setAttribute('width', W); bgR.setAttribute('height', H); bgR.setAttribute('class', 'df__far');
    T.art.appendChild(bgR); T.art.appendChild(gBody); T.art.appendChild(gAlv); T.art.appendChild(gLive);
    var TL = K.timeline(SA_M, null, SA_MOTION, title), R = TL.R, clock = TL.clock;
    function labelsAt(t) {
      var c = camA(t), it = [], p;
      function put(id, text, q, side) { it.push({ id: id, text: text, x: q[0], y: q[1], side: side }); }
      if (t < 3.6) put('one', 'one alveolus', onDrawing(c, A1.x + 8, A1.y - 2), 'R');
      if (t >= 4.7 && t < 8.2) put('cl', 'a cluster of alveoli', onDrawing(c, 166, 312), 'L');
      if (t >= 10.4 && t < 12.2) put('br', 'bronchiole', onDrawing(c, 58, 108), 'L');
      if (t >= 9.5 && t < 12.2) put('cl2', 'clusters of alveoli', onDrawing(c, 200, 214), 'R');
      if (t >= 15.9 && t < 18.4) { p = onBody(c, 450, 1010); put('lg', 'lungs filled with alveoli', p, 'L'); }
      if (t >= 20.8) put('sh', 'the walls of all the alveoli, spread flat', [CX + CW / 4 - 40, CY + CH / 2], 'L');
      if (t >= 19.6) {
        put('ct', 'tennis court', [CX + CW * .9, CY + CH * .86], 'R');
        put('me', 'you', [CX + CW / 2 + PERSON.x * CM + 2, CY + CH * PERSON.y - 2], 'R');
        put('sk', 'your skin', [CX + CW / 2 + SKIN.x * CM, CY + CH * SKIN.y], 'R');
      }
      return it;
    }
    var itemsAt = K.itemsOf(function () { return T.lay; }, function (tt) { return labelsAt(clock(tt)); }, true);

    function draw(tt, still) {
      var t = clock(tt), c = camA(t), ct = seg(t, 18.5, 19.3);
      gAlv.setAttribute('transform', 'translate(' + n1(W / 2 - c.cx * c.s) + ' ' + n1(H / 2 - c.cy * c.s) + ') scale(' + n1(c.s * 1000) / 1000 + ')');
      var aO = 1 - ease(seg(c.c, .55, .85)), bO = t < 12.4 ? 0 : ease(seg(c.c, .36, .68));
      gAlv.setAttribute('opacity', op(aO)); gAlv.style.display = aO > 0 ? '' : 'none';
      gBody.style.display = bO > 0 ? '' : 'none';
      if (bO > 0) {
        gBody.setAttribute('opacity', op(bO));
        gBody.setAttribute('transform', 'translate(' + n1(W / 2 + (WH.x - PT.x / EMB - c.cx) * c.s) + ' ' + n1(H / 2 + (WH.y - PT.y / EMB - c.cy) * c.s) + ') scale(' + n1(c.s / EMB * 1000) / 1000 + ')');
        growC.setAttribute('cx', PT.x); growC.setAttribute('cy', PT.y); growC.setAttribute('r', n1(1000 * ease(seg(t, 15.5, 18))));
      }
      var o = '';
      /* step 1: the one alveolus is lit, the rest waits in the shade */
      var veil = t < 3.8 ? 1 : 1 - seg(t, 3.8, 5);
      if (veil > 0) {
        oneP.setAttribute('transform', 'translate(' + n1(W / 2 - c.cx * c.s) + ' ' + n1(H / 2 - c.cy * c.s) + ') scale(' + n1(c.s * 1000) / 1000 + ')');
        o += '<rect width="' + W + '" height="' + H + '" fill="#0E141B" opacity="' + op(veil * .46) + '" mask="url(#' + u + 'one)"/>';
      }
      /* step 5: the surface spread flat */
      if (ct > 0) o += '<g opacity="' + op(ct) + '"><rect width="' + W + '" height="' + H + '" class="sa__floor"/>' + courtSvg(ease(seg(t, 19.4, 22.6)), u) + '</g>';
      /* the count */
      var txt = t >= 18.4 ? 'about 130 m² of surface' : countText(countAt(t));
      var tw = txt.length * 12.2 + 34;
      o += '<g class="sa__count"><rect x="' + n1(W / 2 - tw / 2) + '" y="12" width="' + n1(tw) + '" height="40" rx="20"/><text x="' + W / 2 + '" y="39" text-anchor="middle">' + txt + '</text></g>';
      gLive.innerHTML = o;
      names(T, itemsAt, tt, still);
    }
    var CS = K.withCards(SA_STEPS, spec.cards), sp = L.stepper({ steps: K.readerSteps(CS, R), end: TL.end, render: draw, flow: TL.flow, stills: K.stillsOf(CS, TL) });
    return K.mount(S, sp, 'sa', [['The lungs in step 4 show how crowded the alveoli are. They are not a count: real alveoli are far smaller.']], layout(S, T));
  }
  L.add('manyalv', manyalv);

  /* ================================================================== 2. a thin surface ======================== */
  var TW_TITLE = 'A thin surface: a short diffusion distance';
  /* IB lines at the depth of the IB guide (Daniel, 27 Nov 2026: "the IB requires a little bit more"; "ask the other conversations to deepen the IB comments"), each saying only what its statement asks (memory ib-lines-words-against-the-guide): step 1 B2.3.8 (HL) */
  var TW_STEPS = [
    { t: 0, h: 'Two thin walls', p: [['ig', 'Between the air and the blood there are only **two walls**: the wall of the **alveolus** and the wall of the **capillary**. Each wall is **one cell thick**.'], ['ibhl', 'The wall of an alveolus is an **epithelium** with two types of cell. **Type I pneumocytes** are extremely thin, so the distance for diffusion is short. **Type II pneumocytes** contain many vesicles (**lamellar bodies**) that discharge **surfactant** into the alveolus. The tissue needs more than one type of cell because its function needs different adaptations.']] },
    { t: 4.2, h: 'A short diffusion distance', p: [['ig', 'The path across the two walls is the **diffusion distance**.'], ['ig', 'The diffusion distance is very **short**.', 'card'], ['bey', 'The **diffusion distance** is about 1 µm. A red blood cell is about 7.5 µm across. These numbers are not in the syllabus.']] },
    { t: 9.4, h: 'A thin surface and a thick surface', p: [['ig', 'Compare a **thin** surface with a **thick** one, with the same concentrations of oxygen. Oxygen has a **shorter distance** to diffuse across the thin surface, so **more oxygen diffuses** in the same time.']] },
    { t: 16.4, h: 'Why a thin surface helps', p: [['ig', 'A **thin surface** gives a **short diffusion distance**, so the **rate of diffusion** is high.']] }
  ];
  var TW_M = [0, 4.2, 9.4, 16.4, 20.4];
  var TW_MOTION = { 'A thin surface: a short diffusion distance': [4.2, 5.2, 7, 4] };
  var Y = F.Y, ZX = 200, ZY = 322, WALLS = (Y.wall + Y.cap) / 2;
  /* the two surfaces side by side: same air, same blood; the thick wall is four times as thick, so a quarter as much oxygen crosses in the same time */
  var PAN = [{ x: 12, thick: 20, every: .72, go: .62, name: 'thin surface' }, { x: 332, thick: 80, every: 2.88, go: 2.5, name: 'thick surface' }];
  var PW = 296, PY0 = 62, PY1 = 500, PMID = 276;
  var PAIR = (function () { var r = rng(23), o = []; for (var i = 0; i < 24; i++) o.push({ x: 12 + r() * (PW - 24), y: PY0 + 10 + r() * (PMID - 56 - PY0), f1: .5 + r() * .7, f2: .4 + r() * .8, a: r() * 6.3, b: r() * 6.3 }); return o; })();
  function panelSvg(P, w, t0, u, ap) {
    var y0 = PMID - P.thick / 2, y1 = PMID + P.thick / 2, o = '', i;
    o += '<g transform="translate(' + P.x + ' 0)" opacity="' + op(ap) + '"><g clip-path="url(#' + u + 'pan)">';
    o += '<rect x="0" y="' + PY0 + '" width="' + PW + '" height="' + (y0 - PY0) + '" fill="url(#' + u + 'air)"/>';
    o += '<rect class="df__plasma" x="0" y="' + y1 + '" width="' + PW + '" height="' + (PY1 - y1) + '" fill="url(#' + u + 'pl)"/>';
    /* the wall, drawn as its layer of cells */
    o += '<rect class="tw__wall" x="0" y="' + y0 + '" width="' + PW + '" height="' + P.thick + '"/>';
    var layers = Math.round(P.thick / 20);
    for (i = 1; i < layers; i++) o += '<path class="tw__wline" d="M0 ' + (y0 + i * 20) + 'h' + PW + '"/>';
    for (i = 0; i < layers; i++) o += '<ellipse class="df__nuc" cx="' + (58 + (i % 2) * 150 + i * 16) + '" cy="' + (y0 + 10 + i * 20) + '" rx="22" ry="5"/>';
    /* the blood below, moving on */
    function cellOf(c, when) { return { x: ((c * 142 + when * 26) % 426) - 62, y: (y1 + PY1) / 2 + (c % 2 ? 22 : -14) }; }
    for (i = 0; i < 3; i++) { var cc = cellOf(i, w); o += K.rbc(u, cc.x, cc.y, clamp((cc.x + 40) / 320), 6.8, 4.9, 6 * Math.sin(cc.x / 50 + i)); }
    PAIR.forEach(function (q) { o += F.molSvg([q.x + 8 * Math.sin(w * q.f1 + q.a), q.y + 6 * Math.sin(w * q.f2 + q.b), 1], 'o2', u, 1); });
    /* oxygen crossing, one molecule after another; in the blood each joins the nearest red blood cell and travels on it */
    var first = Math.max(0, Math.floor((w - t0) / P.every) - Math.ceil(15 / P.every));
    for (i = first; ; i++) {
      var s0 = t0 + i * P.every; if (s0 > w) break;
      var age = w - s0, x = 34 + (i * 97) % (PW - 80), yy;
      if (age < P.go) { var k = age / P.go; yy = lerp(y0 - 14, y1 + 16, k); o += F.molSvg([x + 3 * Math.sin(k * 9 + i), yy, Math.min(1, k * 5)], 'o2', u, 1); continue; }
      var land = s0 + P.go + .55, join = 0, far = 1e9;
      for (var j = 0; j < 3; j++) { var dd = Math.abs(cellOf(j, land).x - x - 8); if (dd < far) { far = dd; join = j; } }
      var now = cellOf(join, w), then = cellOf(join, land), th = i * 2.4, tx = now.x + 30 * Math.cos(th), ty = now.y + 21 * Math.sin(th);
      if ((w - land) * 26 + then.x >= 364) continue;        /* its cell has left the panel */
      if (w < land) { var kk = ease((w - s0 - P.go) / .55); o += F.molSvg([lerp(x, tx, kk), lerp(y1 + 16, ty, kk), 1, 0], 'o2', u, 1); }
      else if (tx < PW + 8) o += F.molSvg([tx, ty, 1, 1], 'o2', u, 1);
    }
    o += '</g>';
    /* how many have crossed since the comparison began */
    var n = Math.max(0, Math.floor((w - t0 - P.go) / P.every) + 1);
    o += '<rect class="tw__tag" x="' + (PW / 2 - 84) + '" y="' + (PY1 - 38) + '" width="168" height="30" rx="15"/><text class="tw__n" x="' + PW / 2 + '" y="' + (PY1 - 17) + '" text-anchor="middle">' + n + ' crossed</text>';
    o += '<text class="tw__h" x="' + PW / 2 + '" y="' + (PY0 - 14) + '" text-anchor="middle">' + P.name + '</text>';
    return o + '</g>';
  }
  function thinwall(spec) {
    var u = 'tw' + (++UID) + '-', title = spec.title || TW_TITLE;
    var S = K.shell(spec, 'tw', title, 'The two thin walls between the air and the blood, the short diffusion distance across them, then a thin and a thick surface side by side with oxygen crossing each.', []);
    var T = stage(S, 'tw', u, '<clipPath id="' + u + 'pan"><rect x="0" y="' + PY0 + '" width="' + PW + '" height="' + (PY1 - PY0) + '" rx="8"/></clipPath>');
    var showKey = keyOf(S, u, ['o2', 'hb', 'rbc']);
    var TL = K.timeline(TW_M, null, TW_MOTION, title), R = TL.R, clock = TL.clock, worldAt = function (m) { return m; }, read0 = 0;
    function zoomAt(t) { return lerp(1, 1.65, ease(seg(t, 4.3, 6.2))); }
    /* the point of the section at the middle of the picture: its own middle at first, the two walls once it has closed in */
    function midAt(t) { var k = ease(seg(t, 4.3, 6.2)); return [lerp(W / 2, ZX, k), lerp(H / 2, ZY, k)]; }
    function labelsAt(t) {
      var it = [];
      if (t < 9.4) {
        var z = zoomAt(t), c = midAt(t);
        it.push({ id: 'wa', text: 'wall of the alveolus', x: W / 2 - 110, y: H / 2 + (Y.wall + 5 - c[1]) * z, side: 'L' });
        it.push({ id: 'wc', text: 'wall of the capillary', x: W / 2 + 70, y: H / 2 + (Y.gap + 5 - c[1]) * z, side: 'R' });
        if (t >= 6) it.push({ id: 'dd', text: 'diffusion distance', x: W / 2 + 16, y: H / 2 + (WALLS - c[1]) * z, side: 'R' });
      }
      return it;
    }
    var itemsAt = K.itemsOf(function () { return T.lay; }, function (tt) { return labelsAt(clock(tt)); }, true);
    function draw(tt, still) {
      var t = clock(tt), wt = still ? t : worldAt(t), o = '', z = zoomAt(t), c = midAt(t), sw = 1 - seg(t, 9.4, 10.2);
      if (still) read0 = 0; else if (t < 9.8) read0 = wt - t;
      if (sw > 0) {
        o += '<g opacity="' + op(sw) + '"><g transform="translate(' + n1(W / 2 - c[0] * z) + ' ' + n1(H / 2 - c[1] * z) + ') scale(' + n1(z * 1000) / 1000 + ')">' + F.wallSvg(wt, u) + '</g>';
        /* step 1: the two walls lit */
        var lit = ease(seg(t, .4, 1.2)) * (1 - seg(t, 4.2, 4.8));
        if (lit > 0) o += '<rect class="tw__glow" x="-4" y="' + n1(H / 2 + (Y.wall - c[1]) * z - 3) + '" width="' + (W + 8) + '" height="' + n1((Y.cap - Y.wall) * z + 6) + '" opacity="' + op(lit) + '"/>';
        /* step 2: the distance, measured across the two walls */
        var br = ease(seg(t, 5.6, 6.3));
        if (br > 0) {
          var by0 = H / 2 + (Y.wall - c[1]) * z, by1 = H / 2 + (Y.cap - c[1]) * z, bx = W / 2 + 6;
          o += '<g opacity="' + op(br) + '"><path class="tw__br" d="M' + (bx + 11) + ' ' + n1(by0) + 'H' + bx + 'V' + n1(by1) + 'H' + (bx + 11) + '"/></g>';
        }
        /* the scale, true for the section at this zoom */
        var bar = 106.5 * z;
        o += '<g class="df__scale" transform="translate(' + n1(W - bar - 62) + ' ' + (H - 22) + ')"><line x1="0" y1="0" x2="' + n1(bar) + '" y2="0"/><line x1="0" y1="-5" x2="0" y2="5"/><line x1="' + n1(bar) + '" y1="-5" x2="' + n1(bar) + '" y2="5"/><text x="' + n1(bar + 6) + '" y="5">5 µm</text></g>';
        o += '</g>';
      }
      var pa = seg(t, 9.8, 10.6);
      if (pa > 0) {
        o += '<rect width="' + W + '" height="' + H + '" class="sa__floor" opacity="' + op(pa) + '"/>';
        /* the count starts when the comparison starts, however long the reader stayed on the steps before, so the two are always a fair race */
        PAN.forEach(function (P) { o += panelSvg(P, Math.max(wt - read0, 10.6), 10.6, u, pa); });
      }
      T.art.innerHTML = o;
      showKey('o2', t >= 9.8); showKey('hb', t >= 9.8); showKey('rbc', true);
      names(T, itemsAt, tt, still);
    }
    var CS = K.withCards(TW_STEPS, spec.cards), sp = L.stepper({ steps: K.readerSteps(CS, R), end: TL.end, render: draw, flow: TL.flow, stills: K.stillsOf(CS, TL) });
    worldAt = K.world(S, sp, function () { draw(sp.time()); });
    return K.mount(S, sp, 'tw', [['In steps 1 and 2 the walls and the cells are drawn to scale, and the molecules far larger than real.']], layout(S, T));
  }
  L.add('thinwall', thinwall);

  /* ================================================================== 3. good ventilation ====================== */
  var FA_TITLE = 'Good ventilation: fresh air keeps the gradient steep';
  var FA_STEPS = [
    { t: 0, h: 'Breathing in brings fresh air', p: [['ig', '**Ventilation** moves air into and out of the lungs.', 'card'], ['ig', 'Breathing in brings **fresh air**, with a **high oxygen concentration**, into the alveolus.']] },
    { t: 4.6, h: 'The gases diffuse', p: [['ig', 'Oxygen **diffuses into the blood** and carbon dioxide **diffuses out of the blood**. So the air in the alveolus now has **less oxygen** and **more carbon dioxide**.']] },
    { t: 9.4, h: 'Breathing out, then in again', p: [['ig', 'Breathing out **removes part** of this air. Breathing in mixes **fresh air** with the air that stays, so the oxygen concentration **rises** and the carbon dioxide concentration **falls**.']] },
    { t: 14.2, h: 'If the air is not changed', p: [['ig', 'If no fresh air arrives, the concentration of oxygen in this air **falls** and the concentration of carbon dioxide **rises**. The **concentration gradients** become **less steep**, so diffusion becomes **slower**.']] },
    { t: 21, h: 'Ventilation keeps the gradients steep', p: [['ig', 'Breathing brings fresh air again.'], ['ig', '**Good ventilation** keeps the **concentration gradients steep**.', 'card'], ['ig', 'Steep concentration gradients make the gases diffuse **quickly**.']] }
  ];
  var FA_M = [0, 4.6, 9.4, 14.2, 21, 27];
  var FA_MOTION = { 'Good ventilation: fresh air keeps the gradient steep': [4.6, 4.8, 4.8, 6.8, 6] };
  var AC = { x: 372, y: 300 }, AR = 146, TUBE0 = [52, -24], NECK = [AC.x - 112, AC.y - 118];
  var CAP_A0 = 172 * Math.PI / 180, CAP_A1 = 6 * Math.PI / 180, CAP_L = [-16, 250], CAP_R = [656, 238];
  /* what happens to the air, in order. An alveolus never empties: each breath changes only part of its air (at rest about a seventh; here more, so that
     it shows), and diffusion never stops. ['in', from, to, oxygen molecules that arrive]; ['out', from, to, oxygen, carbon dioxide leaving];
     ['dif', from, to, oxygen into the blood, carbon dioxide from the blood]. */
  var FA_EV = [['in', .2, 3.2, 12], ['dif', 1.8, 4.5, 1, 1], ['dif', 4.8, 9.2, 8, 7], ['out', 9.6, 11.2, 8, 4], ['dif', 9.6, 13.4, 2, 2], ['in', 11.4, 13.4, 13],
               ['dif', 14.5, 20.6, 10, 8], ['out', 21.2, 22.3, 6, 7], ['dif', 21.4, 26.6, 2, 2], ['in', 22.3, 23.7, 13], ['out', 23.9, 24.9, 6, 3], ['in', 24.9, 26.3, 12]];
  var FA_O = 30, FA_C = 24, MOVE = 1.1;       /* full gauges; how long one molecule takes to travel */
  /* every molecule's life: when and how it came, when and how it left */
  var DOTS = (function () {
    var r = rng(61), all = [], acts = [], i;
    function born(kind, t0, how) {
      var rho = Math.sqrt(.03 + r() * .84), a = r() * 6.283;
      var d = { kind: kind, t0: t0, how0: how, t1: 1e9, how1: null, rx: rho * Math.cos(a), ry: rho * Math.sin(a), f1: .6 + r() * .6, f2: .5 + r() * .7, p1: r() * 6.3, p2: r() * 6.3,
        side: (r() - .5) * 44, ca: CAP_A0 - .4 + r() * (CAP_A1 - CAP_A0 + .8) };
      all.push(d); return d;
    }
    for (i = 0; i < 18; i++) born('o2', -9, 'here');
    for (i = 0; i < 3; i++) born('co2', -9, 'here');
    function spread(e, n, f) { for (var j = 0; j < n; j++) f(e[1] + (e[2] - e[1] - MOVE * .8) * (j + .5) / n); }
    FA_EV.forEach(function (e) {
      if (e[0] === 'in') spread(e, e[3], function (t) { acts.push({ t: t, a: 'in', k: 'o2' }); });
      if (e[0] === 'out') { spread(e, e[3], function (t) { acts.push({ t: t, a: 'out', k: 'o2' }); }); spread(e, e[4], function (t) { acts.push({ t: t, a: 'out', k: 'co2' }); }); }
      if (e[0] === 'dif') { spread(e, e[3], function (t) { acts.push({ t: t, a: 'dif', k: 'o2' }); }); spread(e, e[4], function (t) { acts.push({ t: t, a: 'in2', k: 'co2' }); }); }
    });
    acts.sort(function (x, y) { return x.t - y.t; });
    acts.forEach(function (x) {
      if (x.a === 'in') { born('o2', x.t, 'in'); return; }
      if (x.a === 'in2') { born('co2', x.t, 'dif'); return; }
      /* one molecule that has already arrived leaves */
      var can = all.filter(function (d) { return d.kind === x.k && d.t1 > 1e8 && d.t0 + MOVE <= x.t; });
      if (can.length) { var d = can[Math.floor(r() * can.length)]; d.t1 = x.t; d.how1 = x.a; }
    });
    return all;
  })();
  /* how full of breath the alveolus is, 0 to 1 */
  function fullness(t) {
    var v = 0;
    FA_EV.forEach(function (e) { if (e[0] === 'in' && t >= e[1]) v = ease(seg(t, e[1], e[2])); if (e[0] === 'out' && t >= e[1]) v = 1 - ease(seg(t, e[1], e[2])); });
    return v;
  }
  function radius(t) { return AR + 13 * fullness(t); }
  function homeAt(q, t, w) { var r = radius(t) - 12; return [AC.x + q.rx * r + 5 * Math.sin(w * q.f1 + q.p1), AC.y + q.ry * r + 4 * Math.sin(w * q.f2 + q.p2)]; }
  function along(a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; }
  /* through the bronchiole, side by side rather than in single file, by the neck of the alveolus, to the molecule's place */
  function viaNeck(p, k, side) {
    var n = [-.7, .71], a = [TUBE0[0] + n[0] * side, TUBE0[1] + n[1] * side], b = [NECK[0] + n[0] * side, NECK[1] + n[1] * side];
    return k < .5 ? along(a, b, k * 2) : along(b, p, (k - .5) * 2);
  }
  function capPoint(a, t) { var r = radius(t) + 25; return [AC.x + r * Math.cos(a), AC.y + r * Math.sin(a)]; }
  function bez(a, b, c, d, u) { var v = 1 - u; return [v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]]; }
  /* the capillary comes in from the left of the picture, runs round the alveolus and leaves on the right: never a closed tube */
  function capLine(t) {
    var P0 = capPoint(CAP_A0, t), P1 = capPoint(CAP_A1, t);
    return { P0: P0, P1: P1, c0: [CAP_L[0] + 100, CAP_L[1]], c1: [P0[0] - Math.sin(CAP_A0) * 70, P0[1] + Math.cos(CAP_A0) * 70], c2: [P1[0] + Math.sin(CAP_A1) * 70, P1[1] - Math.cos(CAP_A1) * 70], c3: [CAP_R[0] - 80, CAP_R[1]], r: radius(t) + 25 };
  }
  function capD(g) {
    return 'M' + CAP_L[0] + ' ' + CAP_L[1] + 'C' + n1(g.c0[0]) + ' ' + n1(g.c0[1]) + ' ' + n1(g.c1[0]) + ' ' + n1(g.c1[1]) + ' ' + n1(g.P0[0]) + ' ' + n1(g.P0[1]) +
      'A' + n1(g.r) + ' ' + n1(g.r) + ' 0 0 0 ' + n1(g.P1[0]) + ' ' + n1(g.P1[1]) + 'C' + n1(g.c2[0]) + ' ' + n1(g.c2[1]) + ' ' + n1(g.c3[0]) + ' ' + n1(g.c3[1]) + ' ' + CAP_R[0] + ' ' + CAP_R[1];
  }
  function capAt(g, f, t) {
    if (f < .2) return bez(CAP_L, g.c0, g.c1, g.P0, f / .2);
    if (f < .8) return capPoint(lerp(CAP_A0, CAP_A1, (f - .2) / .6), t);
    return bez(g.P1, g.c2, g.c3, CAP_R, (f - .8) / .2);
  }
  /* every molecule of the air at time t: [x, y, opacity, kind], and how many of each are in the alveolus */
  function airAt(t, w) {
    var out = [], nO = 0, nC = 0;
    DOTS.forEach(function (d) {
      if (t < d.t0 || t >= d.t1 + MOVE) return;
      var p = homeAt(d, t, w), k, q, x, a, weight;
      if (d.how0 === 'in' && t < d.t0 + MOVE) { k = ease((t - d.t0) / MOVE); q = viaNeck(p, k, d.side); x = q; a = Math.min(1, k * 4); weight = k; }
      else if (d.how0 === 'dif' && t < d.t0 + MOVE) { k = ease((t - d.t0) / MOVE); x = along(capPoint(d.ca, t), p, k); a = Math.min(1, k * 3); weight = k; }
      else if (d.how1 === 'out' && t >= d.t1) { k = ease((t - d.t1) / MOVE); x = viaNeck(p, 1 - k, d.side); a = k > .75 ? (1 - k) / .25 : 1; weight = 1 - k; }
      else if (d.how1 === 'dif' && t >= d.t1) { k = ease((t - d.t1) / MOVE); x = along(p, capPoint(d.ca, t), k); a = 1 - k * k; weight = 1 - k; }
      else { x = p; a = 1; weight = 1; }
      out.push([x[0], x[1], a, d.kind]);
      if (d.kind === 'o2') nO += weight; else nC += weight;
    });
    return { dots: out, o: nO, c: nC };
  }
  global.GasFlow.ventAt = function (t) { var A = airAt(t, t); return { o: A.o, c: A.c }; };
  function freshair(spec) {
    var u = 'fa' + (++UID) + '-', title = spec.title || FA_TITLE;
    var S = K.shell(spec, 'fa', title, 'A bronchiole opening into one alveolus with a capillary round it. Fresh air comes in and used air goes out, and two gauges show the oxygen and carbon dioxide in the alveolus.', []);
    S.read.innerHTML = '<div class="fa__g"><span class="fa__gn">oxygen in the alveolus</span><span class="fa__gb"><i class="fa__gf fa__gf--o"></i></span></div>' +
      '<div class="fa__g"><span class="fa__gn">carbon dioxide in the alveolus</span><span class="fa__gb"><i class="fa__gf fa__gf--c"></i></span></div>';
    var gO = S.read.querySelector('.fa__gf--o'), gC = S.read.querySelector('.fa__gf--c');
    var T = stage(S, 'fa', u);
    var showKey = keyOf(S, u, ['o2', 'co2', 'rbc']);
    var TL = K.timeline(FA_M, null, FA_MOTION, title), R = TL.R, clock = TL.clock, worldAt = function (m) { return m; };
    function labelsAt(t) {
      var r = radius(t), it = [];
      it.push({ id: 'br', text: 'bronchiole', x: 118, y: 62, side: 'L' });
      it.push({ id: 'al', text: 'alveolus', x: AC.x + r * .62, y: AC.y - r * .55, side: 'R' });
      var cp = capPoint(30 * Math.PI / 180, t);
      it.push({ id: 'cp', text: 'capillary', x: cp[0], y: cp[1], side: 'R' });
      return it;
    }
    var itemsAt = K.itemsOf(function () { return T.lay; }, function (tt) { return labelsAt(clock(tt)); }, true);
    function draw(tt, still) {
      var t = clock(tt), wt = still ? t : worldAt(t), r = radius(t), o = '', i;
      /* the airway and the alveolus, one shape: the wall drawn wide, the air drawn inside it */
      var tube = 'M' + TUBE0[0] + ' ' + TUBE0[1] + 'L' + NECK[0] + ' ' + NECK[1] + 'L' + n1(AC.x - 60) + ' ' + n1(AC.y - 64);
      o += '<rect width="' + W + '" height="' + H + '" class="fa__tissue"/>';
      /* the capillary round the lower part of the alveolus, behind its wall */
      var g = capLine(t), cd = capD(g);
      o += '<path class="fa__capw" d="' + cd + '"/><path class="fa__capl" d="' + cd + '"/>';
      for (i = 0; i < 12; i++) {
        var f = ((i / 12 + wt * .036) % 1), p = capAt(g, f, t), pn = capAt(g, Math.min(.999, f + .004), t);
        o += K.rbc(u, p[0], p[1], clamp((f - .24) / .42), 1.9, 1.3, Math.atan2(pn[1] - p[1], pn[0] - p[0]) * 180 / Math.PI);
      }
      o += '<g class="fa__wall"><path d="' + tube + '" stroke-width="84"/><circle cx="' + AC.x + '" cy="' + AC.y + '" r="' + n1(r + 7) + '"/></g>';
      o += '<g class="fa__air"><path d="' + tube + '" stroke-width="70"/><circle cx="' + AC.x + '" cy="' + AC.y + '" r="' + n1(r) + '"/></g>';
      /* the air moving: a filled arrow in the bronchiole while it moves */
      var dir = 0;
      FA_EV.forEach(function (e) { if (e[0] === 'in' && t >= e[1] && t < e[2]) dir = 1; if (e[0] === 'out' && t >= e[1] && t < e[2]) dir = -1; });
      if (dir) {
        var ax = dir > 0 ? [116, 40, 196, 122] : [196, 122, 116, 40];
        o += '<path class="fa__move" d="M' + ax[0] + ' ' + ax[1] + 'L' + ax[2] + ' ' + ax[3] + '" marker-end="url(#' + u + 'arrow)"/>';
      }
      var A = airAt(t, wt);
      A.dots.forEach(function (d) { o += F.molSvg(d, d[3], u, 1); });
      /* the net movement of each gas across the wall: the arrow's width follows the gradient */
      var gradO = clamp((A.o / FA_O - .18) / .82), gradC = clamp(1 - A.c / FA_C), on = seg(t, 4.6, 5.2);
      var wO = 4 + 18 * gradO, wC = 4 + 18 * gradC, ya = AC.y + r - 38, yb = AC.y + r + 34;
      if (on > 0) o += '<g opacity="' + op(on) + '">' + F.arrow(AC.x - 34, ya, yb, n1(wO), 'df__neto') + F.arrow(AC.x + 34, yb, ya, n1(wC), 'df__netc') + '</g>';
      T.art.innerHTML = '<defs><marker id="' + u + 'arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z" fill="#0B6A8C"/></marker></defs>' + o;
      gO.style.width = n1(clamp(A.o / FA_O) * 100) + '%'; gC.style.width = n1(clamp(A.c / FA_C) * 100) + '%';
      showKey('o2', true); showKey('co2', true); showKey('rbc', true);
      names(T, itemsAt, tt, still);
    }
    var CS = K.withCards(FA_STEPS, spec.cards), sp = L.stepper({ steps: K.readerSteps(CS, R), end: TL.end, render: draw, flow: TL.flow, stills: K.stillsOf(CS, TL) });
    worldAt = K.world(S, sp, function () { draw(sp.time()); });
    return K.mount(S, sp, 'fa', [['A simplified picture of one alveolus. Only oxygen and carbon dioxide are drawn, and the molecules are far larger than real.']], layout(S, T));
  }
  L.add('freshair', freshair);
})(window);
