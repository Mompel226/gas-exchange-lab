/* ============================================================
   w-gases.js — the gases themselves.

     diffuse     "Gases crossing the wall of an alveolus" (station `surface`, 11.1.1): five steps, from the lung to one alveolus, then
                 oxygen and carbon dioxide crossing its wall.
     airchange   "What happens to the air in the lungs" (station `air`, 11.1.4, 11.1.9): one sample of air, in, changed, and out.
     GasDots     the counted dots both of them and the station's picture draw (equal volumes, one fixed layout).

   THE PICTURE OF THE WALL IS TO SCALE. The window is 30 µm wide: a red blood cell 7.5 µm, a capillary 8 µm, each wall about
   0.5 µm. Only the molecules are drawn far larger than real (an oxygen molecule is about 0.0003 µm), and a line on the page says so.
   DIFFUSION IS DRAWN AS IT IS (the syllabus's 3.1.1, the words the Topic 3 lab uses): the particles keep moving at random, some
   cross each way, and more cross from the higher concentration to the lower: that difference is the net movement.
   SOURCES: 0610 2026–28 11.1.1, 11.1.4, 11.1.9; schemes 0610/43/M/J/25 Q2(a), 0610/42/F/M/22 Q1(c)(ii), 0610/41/O/N/22 Q6(b)(i);
   the percentages of the T11 summary and of 0610/43/O/N/23 Q3(a)(i).
   ============================================================ */
(function (global) {
  'use strict';
  var L = global.CircLearn, K = global.WKit;
  if (!L || !K) return;
  var n1 = K.n1, seg = K.seg, ease = K.ease, lerp = K.lerp, rng = K.rng, h = L.h;

  /* ---------------------------------------------------------------- the counted dots ------------------------------ */
  var INK = { o2: '#FF6B5E', co2: '#58A6FF', h2o: '#3FE0D0', other: '#7D8A97' };
  /* 2,500 particles of air in one box: so 21 % is 525 and 0.04 % is 1 */
  var AIR = { in: { o2: 525, co2: 1, h2o: 25 }, out: { o2: 400, co2: 100, h2o: 150 } };
  function dotLayout() {
    var r = rng(77), P = [], n = 50;
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) P.push({ x: (x + .18 + r() * .64) / n, y: (y + .18 + r() * .64) / n, o: r() });
    /* the order in which positions are given to each gas: mixed evenly over the box */
    return P.map(function (p) { return { p: p, k: r() }; }).sort(function (a, b) { return a.k - b.k; }).map(function (q) { return q.p; });
  }
  var LAY = dotLayout();
  /* which gas each of the 2,500 places holds, for a composition: the same places keep the same gas wherever it can */
  function kinds(c) {
    /* each gas has its own run of places in both airs (oxygen from 0, carbon dioxide from 525, water vapour from 625), so a
       particle that changes is the same dot in the box, the film and the station's picture */
    var out = new Array(2500), j;
    for (j = 0; j < c.o2; j++) out[j] = 'o2';
    for (j = 0; j < c.co2; j++) out[525 + j] = 'co2';
    for (j = 0; j < c.h2o; j++) out[625 + j] = 'h2o';
    for (j = 0; j < 2500; j++) if (!out[j]) out[j] = 'other';
    return out;
  }
  function drawBox(ctx, x, y, w, h2, kindsArr, focus) {
    var r = Math.max(1, Math.min(w, h2) / 150);
    ctx.save();
    ctx.fillStyle = '#10161D'; ctx.fillRect(x, y, w, h2);
    ['other', 'o2', 'h2o', 'co2'].forEach(function (g) {
      var lit = !focus || focus === g;
      ctx.fillStyle = INK[g];
      ctx.globalAlpha = g === 'other' ? (focus ? .12 : .34) : (lit ? 1 : .14);
      var rr = g === 'other' ? r * .8 : (lit && focus ? r * 1.5 : r * 1.12);
      ctx.beginPath();
      for (var i = 0; i < 2500; i++) if (kindsArr[i] === g) {
        var p = LAY[i], px = x + p.x * w, py = y + p.y * h2;
        ctx.moveTo(px + rr, py); ctx.arc(px, py, rr, 0, 6.2832);
      }
      ctx.fill();
    });
    ctx.restore();
  }
  global.GasDots = { INK: INK, AIR: AIR, LAY: LAY, kinds: kinds, drawBox: drawBox };

  function dotKey(list) {
    return h('div', 'gk', list.map(function (q) { return '<span class="gk__i" data-k="' + q[1] + '"><svg viewBox="-5 -5 10 10" aria-hidden="true"><circle r="4" fill="' + q[0] + '"/></svg>' + q[1] + '</span>'; }).join(''));
  }

  /* ---------------------------------------------------------------- diffuse --------------------------------------- */
  var WD = { x0: 0, x1: 640, y0: 0, y1: 534 };
  /* the layers, in the picture's units (21.3 units = 1 µm) */
  var Y = { wall: 260, wall2: 270, gap: 274, cap: 284, lum0: 284, lum1: 454, capB: 464 };
  /* step 5: the air and the blood move on at this speed (picture units a second) */
  var FLOW = 34, T5 = 20.6;
  var D_STEPS = [
    { t: 0, h: 'From the lung to one alveolus', p: [['ig', 'Oxygen must enter the blood, and carbon dioxide must leave the blood. Between the air and the blood there are only two thin walls: the **wall of the alveolus** and the **wall of the capillary**. Each wall is **one cell thick**.']] },
    { t: 4.6, h: 'Oxygen diffuses into the blood', p: [['ig', 'The **oxygen concentration** is **higher in the alveolus** than in the blood. Oxygen molecules cross the wall in both directions, but more enter the blood. This **net movement** is **diffusion**.']] },
    { t: 10.8, h: 'Carbon dioxide diffuses into the alveolus', p: [['ig', 'The **carbon dioxide concentration** is **higher in the blood** than in the alveolus, so the **net movement** of carbon dioxide is **into the alveolus**.']] },
    { t: 16.6, h: 'Both gases at the same time', p: [['ig', 'Each gas moves from its higher concentration to its lower concentration: this is **down its own concentration gradient**. “Down” does not mean down the screen. The two gases move at the same time, in opposite directions.']] },
    { t: 20.6, h: 'The gradients stay steep', p: [['ig', 'The **blood** carries oxygen away and brings more carbon dioxide. **Ventilation** brings fresh air. So both **concentration gradients are maintained**.']] }
  ];
  var D_M = [0, 4.6, 10.8, 16.6, 20.6, 26.4];
  var D_MOTION = { 'Gases crossing the wall of an alveolus': [4.6, 6.2, 5.8, 4, 5.8] };
  /* the molecules. Each one wanders in its region; `cross` carries it through the walls at time c. */
  function makeMol(kind, n, seedV, up0, net, tBase, back, tBoth) {
    var r = rng(seedV), out = [];
    for (var i = 0; i < n; i++) {
      var inTop = i < up0, m = { kind: kind, x: 16 + r() * 608, f1: .5 + r() * .7, f2: .4 + r() * .8, a: r() * 6.3, b: r() * 6.3, ya: 22 + r() * (Y.wall - 36), yb: Y.lum0 + 14 + r() * 148 };
      m.start = inTop ? 'air' : 'blood';
      out.push(m);
    }
    /* those that cross: most down the gradient, a few the other way */
    var down = out.filter(function (q) { return q.start === (kind === 'o2' ? 'air' : 'blood'); }), upw = out.filter(function (q) { return q.start !== (kind === 'o2' ? 'air' : 'blood'); });
    down.slice(0, net).forEach(function (q, i) { q.c = tBase + .3 + i * (4.6 / net); q.d = 1.05; });
    upw.slice(0, back).forEach(function (q, i) { q.c = tBase + 1 + i * (4 / Math.max(1, back)); q.d = 1.05; });
    /* step 4: three more of each gas cross, down its own gradient, while the other gas crosses the other way */
    down.slice(net, net + 3).forEach(function (q, i) { q.c = tBoth + i * .7; q.d = 1.05; });
    return out;
  }
  /* the counts keep each gradient true at every frame, as a density: the air is 260 units high and the blood 170. Oxygen 42 in the air
     and 4 in the blood; 9 enter the blood and 2 return, then 3 more enter (32 and 14 at the end: 12.3 and 8.2 per 100 units of height).
     Carbon dioxide 25 in the blood and 3 in the air; 9 enter the air and 2 return, then 3 more enter (15 and 13 at the end: 8.8 in
     the blood and 5 in the air). */
  var O2 = makeMol('o2', 46, 3, 42, 9, 4.8, 2, 17), CO2 = makeMol('co2', 28, 9, 3, 9, 11, 2, 17.35);
  function molAt(q, t) {
    var wx = 10 * Math.sin(t * q.f1 + q.a), wy = 8 * Math.sin(t * q.f2 + q.b);
    var from = q.start === 'air' ? q.ya : q.yb, to = q.start === 'air' ? q.yb : q.ya;
    var k = q.c == null ? 0 : ease(seg(t, q.c, q.c + q.d));
    var y = lerp(from, to, k) + wy, x = q.x + wx;
    /* step 5: the air and the blood move on, so what has changed leaves at the right */
    if (t > T5) { x += (t - T5) * FLOW; if (x > 650) return null; }
    return [x, y];
  }
  /* what arrives from the left in step 5: fresh air and new blood, at the concentrations of the start (per 640 units of width: 42
     oxygen and 3 carbon dioxide in the air; 4 oxygen and 25 carbon dioxide in the blood), behind the edge for the 200 units they travel */
  var ARRIVE = (function () {
    var r = rng(41), out = [];
    function lane(n, kind, y0, y1) { for (var i = 0; i < n; i++) out.push({ kind: kind, x: -14 - r() * 200, y: y0 + r() * (y1 - y0), f1: .5 + r() * .7, f2: .4 + r() * .8, a: r() * 6.3, b: r() * 6.3 }); }
    lane(13, 'o2', 22, Y.wall - 14); lane(1, 'co2', 22, Y.wall - 14);
    lane(1, 'o2', Y.lum0 + 14, Y.lum1 - 8); lane(8, 'co2', Y.lum0 + 14, Y.lum1 - 8);
    return out;
  })();
  function arriveAt(q, t) {
    if (t <= T5) return null;
    var x = q.x + (t - T5) * FLOW + 10 * Math.sin(t * q.f1 + q.a);
    return x < -8 ? null : [x, q.y + 8 * Math.sin(t * q.f2 + q.b)];
  }
  /* red blood cells, flowing left to right along the capillary: deoxygenated at the left, oxygenated at the right */
  var RBC = [0, 1, 2, 3, 4].map(function (i) { return { x: 40 + i * 165, y: Y.lum0 + 85 + (i % 2 ? 12 : -8) }; });

  function wallSvg(t) {
    var o = '';
    /* the air in the alveolus, then the wall of the alveolus, a fine layer between the two cells, the wall of the capillary, the
       plasma, and the far wall of the capillary */
    o += '<rect class="df__airsp" x="0" y="0" width="640" height="' + Y.wall + '"/>';
    o += '<path class="df__cell" d="M0 ' + Y.wall + ' H220 C250 ' + (Y.wall + 1) + ' 268 ' + (Y.wall - 15) + ' 300 ' + (Y.wall - 15) + ' C332 ' + (Y.wall - 15) + ' 350 ' + (Y.wall + 1) + ' 380 ' + Y.wall + ' H640 V' + Y.wall2 + ' H0 Z"/>';
    o += '<ellipse class="df__nuc" cx="300" cy="' + (Y.wall - 3) + '" rx="42" ry="9"/>';
    o += '<rect class="df__gap" x="0" y="' + Y.wall2 + '" width="640" height="' + (Y.gap - Y.wall2) + '"/>';
    o += '<rect class="df__cap" x="0" y="' + Y.gap + '" width="640" height="' + (Y.cap - Y.gap) + '"/>';
    o += '<rect class="df__plasma" x="0" y="' + Y.lum0 + '" width="640" height="' + (Y.lum1 - Y.lum0) + '"/>';
    o += '<rect class="df__cap" x="0" y="' + Y.lum1 + '" width="640" height="' + (Y.capB - Y.lum1) + '"/>';
    o += '<rect class="df__tissue" x="0" y="' + Y.capB + '" width="640" height="70"/>';
    /* the red blood cells, each 160 units (7.5 µm) across */
    RBC.forEach(function (c) {
      var x = ((c.x + (t > T5 ? (t - T5) * FLOW : 0)) % 825) - 90, k = Math.max(0, Math.min(1, x / 560));
      /* oxygen loads as the cell passes the alveolus: darker red at the left, brighter at the right */
      var col = 'rgb(' + Math.round(lerp(126, 214, k)) + ',' + Math.round(lerp(34, 48, k)) + ',' + Math.round(lerp(58, 52, k)) + ')';
      o += '<g transform="translate(' + n1(x) + ' ' + c.y + ')"><ellipse rx="80" ry="33" fill="' + col + '"/><ellipse rx="42" ry="14" fill="#000" opacity=".22"/></g>';
    });
    return o;
  }
  /* a thick filled arrow for a net movement (memory concentration-pictures-equal-volumes): width = how much */
  function flow(x, y0, y1, w, cls) {
    var dir = y1 > y0 ? 1 : -1, hd = 16, hw = w + 9, ye = y1 - dir * hd;
    return '<path class="' + cls + '" d="M' + (x - w / 2) + ' ' + y0 + 'L' + (x - w / 2) + ' ' + ye + 'L' + (x - hw / 2) + ' ' + ye + 'L' + x + ' ' + y1 + 'L' + (x + hw / 2) + ' ' + ye + 'L' + (x + w / 2) + ' ' + ye + 'L' + (x + w / 2) + ' ' + y0 + 'Z"/>';
  }

  function diffuse(spec) {
    var title = spec.title || 'Gases crossing the wall of an alveolus';
    var S = K.shell(spec, 'df', title, 'The wall of an alveolus and a capillary, with oxygen and carbon dioxide molecules crossing it.', []);
    var svg = S.svg, NSV = K.NS;
    var defs = document.createElementNS(NSV, 'defs');
    defs.innerHTML = '<clipPath id="dfClip"><rect x="0" y="0" width="640" height="' + WD.y1 + '" rx="12"/></clipPath>';
    svg.appendChild(defs);
    var bg = document.createElementNS(NSV, 'rect'); bg.setAttribute('class', 'df__bg'); svg.appendChild(bg);
    var model = document.createElementNS(NSV, 'g'); svg.appendChild(model);
    var art = document.createElementNS(NSV, 'g'); art.setAttribute('clip-path', 'url(#dfClip)'); model.appendChild(art);
    var cr = document.createElementNS(NSV, 'rect');
    var gLab = document.createElementNS(NSV, 'g'); svg.appendChild(gLab);
    var keyEl = dotKey([[INK.o2, 'oxygen'], [INK.co2, 'carbon dioxide']]); S.fig.appendChild(keyEl);
    var keyO = keyEl.querySelector('[data-k="oxygen"]'), keyC = keyEl.querySelector('[data-k="carbon dioxide"]');
    var lay = null, narrow = false, key = K.pinKey(S), memo = {};
    var TL = K.timeline(D_M, null, D_MOTION, title), R = TL.R, clock = TL.clock;

    function labelsAt(t) {
      var it = [];
      if (t >= 4.3) {
        it.push({ id: 'air', text: 'air in the alveolus', x: 60, y: 120, side: 'L' });
        it.push({ id: 'wall', text: 'wall of the alveolus', x: 100, y: Y.wall + 5, side: 'L' });
        it.push({ id: 'cap', text: 'wall of the capillary', x: 560, y: Y.gap + 5, side: 'R' });
        /* on one cell, and moving with it when the blood flows on */
        it.push({ id: 'rbc', text: 'red blood cell', x: ((RBC[3].x + Math.max(0, t - T5) * FLOW) % 825) - 60, y: RBC[3].y, side: 'R' });
      }
      if (t >= 4.6 && t < 16.6) it.push({ id: 'hi', text: t < 10.8 ? 'net movement of oxygen' : 'net movement of carbon dioxide', x: t < 10.8 ? 210 : 430, y: Y.wall - 26, side: t < 10.8 ? 'L' : 'R' });
      return it;
    }
    var itemsAt = K.itemsOf(function () { return lay; }, function (tt) { return labelsAt(clock(tt)); }, true);

    function draw(tt, still) {
      var t = clock(tt), o = '';
      /* step 1: the wider picture, closing in on one alveolus; the wall opens inside it */
      var z = ease(seg(t, .3, 4.3)), w = seg(t, 3.1, 4.4);
      if (w < 1) {
        var s = lerp(2.05, 8.4, z), cx = lerp(131, 200, z), cy = lerp(190, 248, z);
        o += '<rect x="0" y="0" width="640" height="' + WD.y1 + '" class="df__far"/>';
        o += '<g transform="translate(' + n1(320 - cx * s) + ' ' + n1(WD.y1 / 2 - cy * s) + ') scale(' + n1(s * 100) / 100 + ')"><image href="assets/photos/sv-alveoli.svg" x="0" y="0" width="262" height="380"/></g>';
        /* the place on the alveolus that the close-up will open from */
        var mk = seg(t, .9, 1.5) * (1 - seg(t, 3.1, 3.4));
        if (mk > 0) o += '<circle class="df__spot" cx="' + n1(320 + (200 - cx) * s) + '" cy="' + n1(WD.y1 / 2 + (248 - cy) * s) + '" r="30" opacity="' + n1(mk * 100) / 100 + '"/>';
      }
      if (w > 0) {
        /* the close-up is a window growing out of that place on the alveolus */
        var open = 430 * ease(w);
        o += '<clipPath id="dfOpen"><circle cx="320" cy="' + WD.y1 / 2 + '" r="' + n1(open) + '"/></clipPath><g clip-path="url(#dfOpen)">' + wallSvg(t);
        if (t > 4.2) {
          var showO = ease(seg(t, 4.6, 5.2)), showC = ease(seg(t, 10.8, 11.4));
          var mol = function (a, kind, op) { if (a) o += '<circle cx="' + n1(a[0]) + '" cy="' + n1(a[1]) + '" r="6" fill="' + INK[kind] + '" stroke="' + (kind === 'o2' ? '#5A1109' : '#0E2F59') + '" stroke-width="1.1" opacity="' + n1(op * 100) / 100 + '"/>'; };
          O2.forEach(function (q) { mol(molAt(q, t), 'o2', showO); });
          if (t > 10.6) CO2.forEach(function (q) { mol(molAt(q, t), 'co2', showC); });
          ARRIVE.forEach(function (q) { mol(arriveAt(q, t), q.kind, 1); });
        }
        /* the net movement of each gas: one filled arrow across the wall */
        var ao = t < 10.8 ? seg(t, 4.6, 5.2) : t < 16.6 ? lerp(1, .28, seg(t, 10.8, 11.2)) : lerp(.28, 1, seg(t, 16.6, 17));
        var ac = t < 16.6 ? seg(t, 10.8, 11.4) : 1;
        if (ao > 0) o += '<g opacity="' + n1(ao * 100) / 100 + '">' + flow(210, Y.wall - 42, Y.lum0 + 40, 16, 'df__neto') + '</g>';
        if (ac > 0) o += '<g opacity="' + n1(ac * 100) / 100 + '">' + flow(430, Y.lum0 + 40, Y.wall - 42, 16, 'df__netc') + '</g>';
        /* step 5: fresh air arrives from above, blood carries on to the right */
        if (t > 20.8) {
          var fr = seg(t, 20.8, 21.6);
          o += '<g opacity="' + n1(fr * 100) / 100 + '"><path class="df__move" d="M28 40 H150 M132 26 L152 40 L132 54"/><rect x="23" y="9" width="72" height="22" rx="5" class="df__chip"/><text class="df__w" x="28" y="26">fresh air</text>' +
            '<path class="df__move df__move--b" d="M28 ' + (WD.y1 - 96) + ' H150 M132 ' + (WD.y1 - 110) + ' L152 ' + (WD.y1 - 96) + ' L132 ' + (WD.y1 - 82) + '"/><rect x="157" y="' + (WD.y1 - 110) + '" width="110" height="22" rx="5" class="df__chip df__chip--b"/><text class="df__w df__w--b" x="162" y="' + (WD.y1 - 94) + '">flowing blood</text></g>';
        }
        o += '</g>';
      }
      art.innerHTML = o;
      /* the key names a gas only from the step that shows it; its row keeps its height */
      keyO.style.visibility = t >= 4.6 ? 'visible' : 'hidden'; keyC.style.visibility = t >= 10.8 ? 'visible' : 'hidden';
      /* the scale: true for the wall's picture */
      if (t >= 4.3) art.innerHTML += '<g class="df__scale" transform="translate(462 ' + (WD.y1 - 22) + ')"><line x1="0" y1="0" x2="106.5" y2="0"/><line x1="0" y1="-5" x2="0" y2="5"/><line x1="106.5" y1="-5" x2="106.5" y2="5"/><text x="112" y="5">5 µm</text></g>';
      var items = L.stillItems(still, itemsAt, itemsAt(tt), tt, memo, narrow + '|' + (lay ? lay.f : 0));
      gLab.innerHTML = K.names(lay, items, narrow, key, null, 14);
    }
    var sp = L.stepper({ steps: K.readerSteps(D_STEPS, R), end: TL.end, render: draw, flow: TL.flow, stills: K.stillsOf(D_STEPS, TL) });
    return K.mount(S, sp, 'df', [['Drawn to scale, except the molecules, which are drawn far larger than real.']], function (Dw, nar) {
      narrow = nar;
      var m = K.margins(nar, 13.5, 13.5, 120, 120);
      lay = K.frameOf(svg, bg, model, cr, WD, false, Dw, m[0], m[1], m[2], m[3], 13.5);
      model.setAttribute('transform', 'translate(0 0)');
    });
  }
  L.add('diffuse', diffuse);

  /* ---------------------------------------------------------------- airchange ------------------------------------- */
  var AV_STEPS = [
    { t: 0, h: 'Inspired air enters', p: [['ig', 'This box holds a sample of **inspired air**: 2,500 particles. About **21 %** are oxygen. Only **0.04 %** are carbon dioxide, which is 1 particle here.']] },
    { t: 3.6, h: 'Oxygen leaves the air', p: [['ig', 'In the alveoli, **oxygen diffuses into the blood**. It is used in **aerobic respiration** in the cells. So the air you breathe out holds about **16 %** oxygen.']] },
    { t: 8.4, h: 'Carbon dioxide enters the air', p: [['ig', '**Carbon dioxide**, produced by aerobic respiration, **diffuses from the blood** into the alveoli. So the air you breathe out holds about **4 %** carbon dioxide.']] },
    { t: 13.2, h: 'Water vapour enters the air', p: [['ig', '**Water evaporates** from the moist surface of the alveoli. The air now holds as much **water vapour** as air can hold at this temperature: the air is **saturated**.']] },
    { t: 17.6, h: 'Expired air leaves', p: [['ig', 'This is **expired air**: **less oxygen**, **more carbon dioxide** and **more water vapour** than inspired air.']] }
  ];
  var AV_M = [0, 3.6, 8.4, 13.2, 17.6, 21];
  var AV_MOTION = { 'What happens to the air in the lungs': [3.4, 4.3, 4.3, 3.7, 3.3] };
  function airchange(spec) {
    var title = spec.title || 'What happens to the air in the lungs';
    var S = K.shell(spec, 'av', title, 'A box of air particles: oxygen leaves, carbon dioxide and water vapour enter.', []);
    S.fig.removeChild(S.svg);
    var wrap = h('div', 'av__stage'), cv = document.createElement('canvas');
    cv.className = 'av__cv'; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'A box of 2,500 air particles. Oxygen leaves, then carbon dioxide and water vapour enter.');
    wrap.appendChild(cv); S.fig.appendChild(wrap);
    var read = h('div', 'av__nums',
      '<span class="av__n" data-g="o2"><i style="background:' + INK.o2 + '"></i>oxygen <b></b></span>' +
      '<span class="av__n" data-g="co2"><i style="background:' + INK.co2 + '"></i>carbon dioxide <b></b></span>' +
      '<span class="av__n" data-g="h2o"><i style="background:' + INK.h2o + '"></i>water vapour <b></b></span>' +
      '<span class="av__n av__n--o"><i style="background:' + INK.other + '"></i>other gases</span>');
    S.fig.appendChild(read);
    var nums = { o2: read.querySelector('[data-g="o2"] b'), co2: read.querySelector('[data-g="co2"] b'), h2o: read.querySelector('[data-g="h2o"] b') };
    var TL = K.timeline(AV_M, null, AV_MOTION, title), clock = TL.clock, cw = 0, chh = 0;
    var ctx = cv.getContext('2d');
    function sizeIt() {
      var r = wrap.getBoundingClientRect(), dp = Math.min(global.devicePixelRatio || 1, 2), w = Math.round(r.width), hh = Math.round(r.height);
      if (!w || !hh || (w === cw && hh === chh)) return;
      cw = w; chh = hh; cv.width = w * dp; cv.height = hh * dp; cv.style.width = w + 'px'; cv.style.height = hh + 'px'; ctx.setTransform(dp, 0, 0, dp, 0, 0);
    }
    /* each particle that changes has its own moment, so the number beside the box is always the number of dots in it */
    function pace(k, u) { return Math.min(1, Math.max(0, (k - u * .65) / .35)); }
    function draw(tt) {
      sizeIt(); if (!cw) return;
      var t = clock(tt);
      ctx.clearRect(0, 0, cw, chh);
      var m = 8, foot = cw < 400 ? 82 : 66, bx = m, by = m, bw = cw - 2 * m, bh = chh - foot - m, band = 18, wallY = by + bh, bloodY = wallY + band, into = bloodY + band / 2;
      ctx.fillStyle = '#10161D'; ctx.fillRect(bx, by, bw, bh);
      var kO = seg(t, 3.9, 7.9), kC = seg(t, 8.7, 12.7), kW = seg(t, 13.5, 16.9);
      var r = Math.max(1, Math.min(bw, bh) / 150), at = { other: [], o2: [], co2: [], h2o: [] }, mv = [], nO = 400, nC = 1, nW = 25;
      /* the sample moves: down into the box in step 1, up and out in step 5; what leaves one edge comes in at the other, so the same
         air fills the box at every frame */
      var drift = t < 3.6 ? (ease(seg(t, .15, 3.4)) - 1) * .16 : t >= 17.6 ? -ease(seg(t, 17.8, 20.9)) * .16 : 0;
      for (var i = 0; i < 2500; i++) {
        var p = LAY[i], px = bx + p.x * bw, py = by + (((p.y + drift) % 1 + 1) % 1) * bh, g = 'other', kk;
        if (i < 400) g = 'o2';
        else if (i < 525) {
          kk = pace(kO, (i - 400) / 125);
          if (kk < 1) { nO++; if (kk > 0) { mv.push(px, lerp(py, into, ease(kk)), 'o2'); continue; } g = 'o2'; }
        } else if (i === 525) g = 'co2';
        else if (i < 625) {
          kk = pace(kC, (i - 526) / 99);
          if (kk >= 1) { nC++; g = 'co2'; } else if (kk > 0) mv.push(px, lerp(into, py, ease(kk)), 'co2');
        } else if (i < 650) g = 'h2o';
        else if (i < 775) {
          kk = pace(kW, (i - 650) / 125);
          if (kk >= 1) { nW++; g = 'h2o'; } else if (kk > 0) mv.push(px, lerp(wallY, py, ease(kk)), 'h2o');
        }
        at[g].push(px, py);
      }
      /* steps 2 to 4: the gas of the step stays bright and the others dim, so the eye can follow the particles that change */
      var dimOn = seg(t, 3.6, 4) * (1 - seg(t, 17.6, 18));
      var LIT = { o2: [3.6, 8.4], co2: [8.4, 13.2], h2o: [13.2, 17.6] };
      function litOf(g) { var f = LIT[g]; return f ? seg(t, f[0], f[0] + .4) * (1 - seg(t, f[1], f[1] + .4)) : 0; }
      ['other', 'o2', 'h2o', 'co2'].forEach(function (g) {
        var rr = g === 'other' ? r * .8 : r * 1.12, A = at[g], base = g === 'other' ? .34 : 1;
        ctx.fillStyle = INK[g]; ctx.globalAlpha = lerp(base, lerp(g === 'other' ? .1 : .2, 1, litOf(g)), dimOn); ctx.beginPath();
        for (var j = 0; j < A.length; j += 2) { ctx.moveTo(A[j] + rr, A[j + 1]); ctx.arc(A[j], A[j + 1], rr, 0, 6.2832); }
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      /* under the air: the wall of the alveolus, with its moist surface, and the blood; the gases go to and come from them */
      ctx.fillStyle = '#F2B8B8'; ctx.fillRect(bx, wallY, bw, band);
      ctx.fillStyle = '#8FD8F2'; ctx.fillRect(bx, wallY, bw, 3);
      ctx.fillStyle = '#7E2238'; ctx.fillRect(bx, bloodY, bw, band);
      /* those crossing now go over the wall, and the wall's words stay on top so that they can always be read */
      ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 1;
      for (var q = 0; q < mv.length; q += 3) { ctx.fillStyle = INK[mv[q + 2]]; ctx.beginPath(); ctx.arc(mv[q], mv[q + 1], r * 2, 0, 6.2832); ctx.fill(); ctx.stroke(); }
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.font = '600 12.5px Inter, system-ui, sans-serif';
      [['wall of the alveolus, with a moist surface', wallY, '#F2B8B8', '#4A1418'], ['blood in a capillary', bloodY, '#7E2238', '#FFE9EA']].forEach(function (w) {
        var tw = ctx.measureText(w[0]).width;
        ctx.fillStyle = w[2]; ctx.fillRect(bx + 4, w[1] + 3, tw + 8, band - 4);
        ctx.fillStyle = w[3]; ctx.fillText(w[0], bx + 8, w[1] + band / 2 + 1);
      });
      ctx.fillStyle = '#EDF2F6'; ctx.font = '600 13px Inter, system-ui, sans-serif';
      var lab = t < 3.6 ? 'inspired air' : t < 17.6 ? 'the air in the lungs' : 'expired air', ly = bloodY + band + 13;
      ctx.fillText(lab, bx + 2, ly);
      var low = t < 3.6 ? 'air moves into the alveoli ↓' : t >= 17.6 ? 'air moves out of the lungs ↑' : t < 8.6 ? 'oxygen diffuses into the blood ↓' : t < 13.4 ? 'carbon dioxide diffuses from the blood ↑' : 'water evaporates from the moist surface ↑';
      if (low) {
        /* on a phone the two lines do not fit side by side */
        ctx.fillStyle = '#A9B7C4'; ctx.font = '500 12.5px Inter, system-ui, sans-serif';
        if (cw < 400) ctx.fillText(low, bx + 2, ly + 16);
        else { ctx.textAlign = 'right'; ctx.fillText(low, bx + bw - 2, ly); ctx.textAlign = 'left'; }
      }
      var pct = function (n) { var v = n / 25; return v < .1 ? v.toFixed(2) : v < 10 ? (Math.round(v * 10) / 10).toString() : String(Math.round(v)); };
      nums.o2.textContent = pct(nO) + ' %'; nums.co2.textContent = pct(nC) + ' %';
      nums.h2o.textContent = t < 13.4 ? 'variable' : nW >= 150 ? 'saturated' : 'rising';
    }
    var sp = L.stepper({ steps: K.readerSteps(AV_STEPS, TL.R), end: TL.end, render: draw, flow: TL.flow, stills: K.stillsOf(AV_STEPS, TL) });
    if (global.ResizeObserver) { var ro = new ResizeObserver(function () { if (!S.box.isConnected) { ro.disconnect(); return; } sizeIt(); sp.paint(sp.time()); }); ro.observe(wrap); }
    return K.mount(S, sp, 'av', [['One dot is one particle of gas, in 2,500. Both airs are the same volume.']], function () {});
  }
  L.add('airchange', airchange);
})(window);
