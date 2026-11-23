/* ============================================================
   w-gases.js — the gases themselves.

     diffuse     "Gases diffusing across the wall of an alveolus" (station `surface`, 11.1.1): five steps, from the alveoli to one capillary
                 on an alveolus, then oxygen and carbon dioxide diffusing across the wall into and out of the flowing blood.
     airchange   "What happens to the air in the lungs" (station `air`, 11.1.4, 11.1.9): one sample of air, in, changed, and out.
     GasDots     the counted dots both of them and the station's picture draw (equal volumes, one fixed layout).

   THE PICTURE OF THE WALL IS TO SCALE. The window is 30 µm wide: a red blood cell 7.5 µm, a capillary 8 µm, each wall about
   0.5 µm. The blood flows from the first frame of the close-up, and goes on flowing while a step waits (WKit.world). Only the molecules are drawn far larger than real (an oxygen molecule is about 0.0003 µm), and a line on the page says so.
   DIFFUSION IS DRAWN AS IT IS (the syllabus's 3.1.1, the words the Topic 3 lab uses): the particles keep moving at random, some
   cross each way, and more cross from the higher concentration to the lower: that difference is the net movement.
   IN THE BLOOD oxygen travels on the red blood cells, combined with haemoglobin, and carbon dioxide in the plasma (0610 2026–28, 9.4.3;
   scheme 0610/23/O/N/14; report 0610 O/N 2015). Beyond the syllabus: most of the carbon dioxide is hydrogencarbonate ions.
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
  /* where the film goes: a capillary on an alveolus, at the place where the drawing's network changes from blue to red, so the blood in
     the close-up comes in on the left with less oxygen and leaves on the right with more (Daniel, 23 Nov 2026: "zooming into a place
     that actually might make sense to what you're showing later") */
  var SPOT = { x: 173, y: 333 };
  /* the blood flows from the first frame of the close-up and never stops (his words: "make sure that flow is constantly visual"). It moves
     BLOOD units a second on the world's clock (WKit.world). The blood is one moving belt, BELT units round, which takes CYC seconds: its cells
     keep their places on it, and so does what the plasma carries */
  var BLOOD = 34, NCELL = 4, SPACE = 214, BELT = NCELL * SPACE, CYC = BELT / BLOOD, RX = 77, RY = 55.3;
  var D_STEPS = [
    { t: 0, h: 'From the alveoli to one capillary', p: [['ig', 'Oxygen must diffuse into the blood, and carbon dioxide must diffuse out of the blood. Between the air and the blood there are only two thin walls: the **wall of the alveolus** and the **wall of the capillary**. Each wall is **one cell thick**.']] },
    { t: 4.6, h: 'Oxygen diffuses into the blood', p: [['ig', 'The **oxygen concentration** is **higher in the alveolus** than in the blood. Oxygen molecules move across the wall in both directions, but more move into the blood than out of it. This **net movement** is **diffusion**. In the **red blood cells**, oxygen **combines with haemoglobin**.']] },
    { t: 10.8, h: 'Carbon dioxide diffuses into the alveolus', p: [['ig', 'Carbon dioxide is **dissolved in the plasma**. The **carbon dioxide concentration** is **higher in the blood** than in the alveolus, so carbon dioxide **diffuses out of the blood**: its **net movement** is **into the alveolus**.'], ['bey', 'Most of the carbon dioxide in the blood is in the plasma as **hydrogencarbonate ions**. A smaller part is carried by haemoglobin, and a small part is dissolved.']] },
    { t: 16.6, h: 'Both gases at the same time', p: [['ig', 'Each gas diffuses from its higher concentration to its lower concentration: this is **down its own concentration gradient**. “Down” does not mean down the screen. The two gases diffuse at the same time, in opposite directions.']] },
    { t: 20.6, h: 'The gradients stay steep', p: [['ig', 'The **blood** flows all the time. **Red blood cells** transport oxygen away from the alveoli, and the **plasma** brings more carbon dioxide. **Ventilation** brings fresh air. So both **concentration gradients are maintained**.']] }
  ];
  var D_M = [0, 4.6, 10.8, 16.6, 20.6, 26.4];
  var D_MOTION = { 'Gases diffusing across the wall of an alveolus': [4.6, 6.2, 5.8, 4, 5.8] };

  /* THE MOLECULES. w is the world's clock.
     OXYGEN travels on the red blood cells, combined with haemoglobin (Daniel, 23 Nov 2026: "oxygen should be binded to the red blood cells"). A cell
     arrives with HELD of its SITES places taken, because blood reaching the lungs is not empty of oxygen. The others are taken while it passes under
     the alveolus, each by a molecule that crosses the wall. Three molecules leave a cell and cross back: diffusion goes both ways.
     CARBON DIOXIDE travels in the plasma, between and round the cells ("carbon dioxide dissolved in the plasma"), so it never lies on a cell. Most of
     it crosses into the air, each molecule at its own place. The molecules under a cell stay in the blood, because blood leaves the lungs with carbon
     dioxide still in it. Three cross the other way.
     The counts keep each gradient true at every moment, as a density (the air is 260 units high and the blood 170; tools/film-truth.mjs measures it).
     A molecule on the screen is [x, y, opacity, 1 if it is on a cell (oxygen) or in the plasma (carbon dioxide), else 0]. */
  var SITES = 7, HELD = 2, FLY = 2.6;
  function sway(q, w) { return [9 * Math.sin(w * q.f1 + q.a), 7 * Math.sin(w * q.f2 + q.b)]; }
  function beltX(pos, w) { return ((pos + w * BLOOD) % BELT + BELT) % BELT - 108; }
  /* the blood's cells: single file, 7.5 µm across in a capillary 8 µm wide, each loading oxygen as it passes */
  function cellAt(i, w) {
    var x = beltX(i * SPACE, w);
    return { x: x, y: Y.lum0 + 85 + (i % 2 ? 7 : -7) + 3 * Math.sin(w * .7 + i * 1.7), rot: 7 * Math.sin(x / 74 + i * 2), k: K.clamp01((x + 40) / 560) };
  }
  function onCell(c, ox, oy) { var a = c.rot * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a); return [c.x + ox * cs - oy * sn, c.y + ox * sn + oy * cs]; }
  function clearOfCells(pos, y, m) {
    for (var i = 0; i < NCELL; i++) {
      var dx = ((pos - i * SPACE) % BELT + BELT * 1.5) % BELT - BELT / 2, dy = y - (Y.lum0 + 85 + (i % 2 ? 7 : -7));
      if (dx * dx / ((RX + m) * (RX + m)) + dy * dy / ((RY + m) * (RY + m)) < 1) return false;
    }
    return true;
  }
  /* places in the plasma on the belt, never on a cell and never on each other */
  function plasmaPlaces(n, seed) {
    var r = rng(seed), out = [];
    for (var tries = 0; out.length < n && tries < 9000; tries++) {
      var pos = r() * BELT, y = Y.lum0 + 10 + r() * 150;
      if (!clearOfCells(pos, y, 11) || out.some(function (q) { var dx = Math.abs(q.pos - pos); dx = Math.min(dx, BELT - dx); return dx * dx + (q.y - y) * (q.y - y) < 324; })) continue;
      out.push({ pos: pos, y: y, under: y > Y.lum0 + 85 && !clearOfCells(pos, Y.lum0 + 85, 0), xc: 26 + r() * 560, ya: 30 + r() * (Y.wall - 62), f1: .5 + r() * .7, f2: .4 + r() * .8, a: r() * 6.3, b: r() * 6.3 });
    }
    return out;
  }
  /* from the air to a moving place in the blood: it floats, crosses the wall, and arrives exactly when that place gets there */
  function flying(q, left, to, x0, w) {
    var v = sway(q, w), s = 1 - left / FLY, ax = x0 - 34 + v[0], ay = q.ya + v[1];
    if (s < .42) return [ax, ay, Math.min(1, s / .16), 0];
    var k = ease((s - .42) / .58);
    return [lerp(ax, to[0], k), lerp(ay, to[1], k), 1, 0];
  }
  /* from the blood, across the wall, into the air, where it fades as the air moves it away */
  function leaving(q, over, from, w) {
    var v = sway(q, w), k;
    if (over < 1.3) { k = ease(over / 1.3); return [lerp(from[0], q.xc + v[0], k), lerp(from[1], q.ya + v[1], k), 1, 0]; }
    return over < 3.3 ? [q.xc + v[0], q.ya + v[1], 1 - (over - 1.3) / 2, 0] : null;
  }
  function o2Site(q, w) {
    var c = cellAt(q.cell, w), p = onCell(c, q.ox, q.oy);
    if (c.x >= q.at) return [p[0], p[1], 1, 1];
    var left = (q.at - c.x) / BLOOD;
    return left < FLY ? flying(q, left, p, q.at + q.ox, w) : null;
  }
  function o2Back(q, w) {
    var c = cellAt(q.cell, w), p = onCell(c, q.ox, q.oy);
    return c.x < q.xc ? [p[0], p[1], 1, 1] : leaving(q, (c.x - q.xc) / BLOOD, p, w);
  }
  function co2Plasma(q, w) {
    var x = beltX(q.pos, w), v = sway(q, w), p = [x + v[0] * .12, q.y + v[1] * .22];
    return q.under || x < q.xc ? [p[0], p[1], 1, 1] : leaving(q, (x - q.xc) / BLOOD, p, w);
  }
  function co2Back(q, w) {
    var x = beltX(q.pos, w), v = sway(q, w), p = [x + v[0] * .12, q.y + v[1] * .22];
    if (x >= q.xc) return [p[0], p[1], 1, 1];
    var left = (q.xc - x) / BLOOD;
    return left < FLY ? flying(q, left, p, q.xc, w) : null;
  }
  var GASES = (function () {
    var r = rng(5), air = [], sites = [], i, j;
    function still(kind, n) { for (var m = 0; m < n; m++) air.push({ kind: kind, x: 16 + r() * 608, y: 22 + r() * (Y.wall - 36), f1: .5 + r() * .7, f2: .4 + r() * .8, a: r() * 6.3, b: r() * 6.3 }); }
    still('o2', 50); still('co2', 3);
    for (i = 0; i < NCELL; i++) {
      var order = [0, 1, 2, 3, 4, 5, 6];
      for (j = 6; j > 0; j--) { var m = Math.floor(r() * (j + 1)), hold = order[j]; order[j] = order[m]; order[m] = hold; }
      for (j = 0; j < SITES; j++) {
        var th = order[j] * 6.2832 / SITES + .45 + i * .3;
        sites.push({ cell: i, ox: 52 * Math.cos(th), oy: 36 * Math.sin(th), at: j < HELD ? -1e9 : 36 + (j - HELD) * 90 + r() * 46, ya: 30 + r() * (Y.wall - 62), f1: .5 + r() * .7, f2: .4 + r() * .8, a: r() * 6.3, b: r() * 6.3 });
      }
    }
    var back = [[0, 196], [1, 334], [3, 470]].map(function (q) { return { cell: q[0], ox: (r() - .5) * 18, oy: (r() - .5) * 12, xc: q[1], ya: 40 + r() * (Y.wall - 80), f1: .5 + r() * .7, f2: .4 + r() * .8, a: r() * 6.3, b: r() * 6.3 }; });
    var P = plasmaPlaces(30, 9), cross = P.filter(function (q) { return !q.under; }).slice(0, 3);
    return { air: air, sites: sites, o2back: back, co2: P.filter(function (q) { return cross.indexOf(q) < 0; }), co2back: cross };
  })();
  /* everything of one gas on the screen at the world's moment w */
  function gasAt(kind, w) {
    var out = [];
    function add(p) { if (p) out.push(p); }
    GASES.air.forEach(function (q) { if (q.kind === kind) { var v = sway(q, w); out.push([q.x + v[0], q.y + v[1], 1, 0]); } });
    if (kind === 'o2') {
      GASES.sites.forEach(function (q) { add(o2Site(q, w)); });
      GASES.o2back.forEach(function (q) { add(o2Back(q, w)); });
    } else {
      GASES.co2.forEach(function (q) { add(co2Plasma(q, w)); });
      GASES.co2back.forEach(function (q) { add(co2Back(q, w)); });
    }
    return out;
  }
  function cellsAt(w) { var out = []; for (var i = 0; i < NCELL; i++) { var c = cellAt(i, w); out.push({ x: c.x, y: c.y, rot: c.rot, rx: RX, ry: RY }); } return out; }
  global.GasFlow = { gasAt: gasAt, cellsAt: cellsAt, Y: Y, BLOOD: BLOOD, CYC: CYC };

  /* the section: the air, the wall of the alveolus, the fine layer between the two cells, the wall of the capillary, the flowing blood */
  function wallSvg(w, u) {
    var o = '', i;
    o += '<rect class="df__airsp" x="0" y="0" width="640" height="' + Y.wall + '" fill="url(#' + u + 'air)"/>';
    o += '<path class="df__cell" d="M0 ' + Y.wall + ' H220 C250 ' + (Y.wall + 1) + ' 268 ' + (Y.wall - 15) + ' 300 ' + (Y.wall - 15) + ' C332 ' + (Y.wall - 15) + ' 350 ' + (Y.wall + 1) + ' 380 ' + Y.wall + ' H640 V' + Y.wall2 + ' H0 Z"/>';
    o += '<ellipse class="df__nuc" cx="300" cy="' + (Y.wall - 3) + '" rx="42" ry="9"/>';
    o += '<rect class="df__gap" x="0" y="' + Y.wall2 + '" width="640" height="' + (Y.gap - Y.wall2) + '"/>';
    o += '<rect class="df__plasma" x="0" y="' + Y.lum0 + '" width="640" height="' + (Y.lum1 - Y.lum0) + '" fill="url(#' + u + 'pl)"/>';
    /* fine streaks in the plasma, moving with the blood, so the flow shows between the cells too */
    for (i = 0; i < 11; i++) {
      var sx = ((i * 83 + w * BLOOD * 1.04) % 913) - 90, sy = Y.lum0 + 16 + (i * 53) % 138;
      o += '<path class="df__stream" d="M' + n1(sx) + ' ' + sy + 'h' + (24 + (i * 7) % 18) + '"/>';
    }
    for (i = 0; i < NCELL; i++) { var c = cellAt(i, w); o += K.rbc(u, c.x, c.y, c.k, 11, 7.9, c.rot); }
    /* the capillary's wall, above and below, with the bulge of one of its cells */
    o += '<path class="df__cap" d="M0 ' + Y.gap + ' H640 V' + Y.cap + ' H520 C498 ' + Y.cap + ' 486 ' + (Y.cap + 11) + ' 462 ' + (Y.cap + 11) + ' C438 ' + (Y.cap + 11) + ' 426 ' + Y.cap + ' 404 ' + Y.cap + ' H0 Z"/>';
    o += '<ellipse class="df__nuc" cx="462" cy="' + (Y.cap + 3) + '" rx="30" ry="6"/>';
    o += '<rect class="df__cap" x="0" y="' + Y.lum1 + '" width="640" height="' + (Y.capB - Y.lum1) + '"/>';
    o += '<rect class="df__tissue" x="0" y="' + Y.capB + '" width="640" height="70"/>';
    return o;
  }
  global.GasFlow.wallSvg = wallSvg;
  /* the defs of the section: the air's soft light, the plasma, a molecule of each gas lit from the top left, the blood's cells */
  function sectionDefs(u) {
    function ball(id, a, b, c) { return '<radialGradient id="' + u + id + '" cx=".36" cy=".32" r=".75"><stop offset="0" stop-color="' + a + '"/><stop offset=".55" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></radialGradient>'; }
    return '<linearGradient id="' + u + 'air" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9F6FC"/><stop offset="1" stop-color="#CFE8F4"/></linearGradient>' +
      '<linearGradient id="' + u + 'pl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3D27F"/><stop offset=".5" stop-color="#F9E2A6"/><stop offset="1" stop-color="#F0CB74"/></linearGradient>' +
      ball('mo', '#FFC2B8', '#FF6B5E', '#C93A2E') + ball('mc', '#BFE0FF', '#58A6FF', '#2467BE') + K.rbcDefs(u);
  }
  global.GasFlow.sectionDefs = sectionDefs;
  function molSvg(p, kind, u, op) {
    var a = p[2] * op; if (a <= .01) return '';
    /* oxygen on a red blood cell has a white ring, so that it stands out from the red of the cell */
    var held = kind === 'o2' && p[3] === 1;
    return '<circle cx="' + n1(p[0]) + '" cy="' + n1(p[1]) + '" r="6" fill="url(#' + u + (kind === 'o2' ? 'mo' : 'mc') + ')" stroke="' + (held ? '#FFF' : kind === 'o2' ? '#5A1109' : '#0E2F59') + '" stroke-width="' + (held ? 1.6 : 1) + '"' + (a < .995 ? ' opacity="' + n1(a * 100) / 100 + '"' : '') + '/>';
  }
  global.GasFlow.molSvg = molSvg;
  /* a thick filled arrow for a net movement (memory concentration-pictures-equal-volumes): width = how much */
  function flow(x, y0, y1, w, cls) {
    var dir = y1 > y0 ? 1 : -1, hd = 16, hw = w + 9, ye = y1 - dir * hd;
    return '<path class="' + cls + '" d="M' + (x - w / 2) + ' ' + y0 + 'L' + (x - w / 2) + ' ' + ye + 'L' + (x - hw / 2) + ' ' + ye + 'L' + x + ' ' + y1 + 'L' + (x + hw / 2) + ' ' + ye + 'L' + (x + w / 2) + ' ' + ye + 'L' + (x + w / 2) + ' ' + y0 + 'Z"/>';
  }
  global.GasFlow.arrow = flow;
  var DF_N = 0;

  function diffuse(spec) {
    var title = spec.title || 'Gases diffusing across the wall of an alveolus', u = 'df' + (++DF_N) + '-';
    var S = K.shell(spec, 'df', title, 'A capillary on the wall of an alveolus. Blood flows through it, and oxygen and carbon dioxide molecules diffuse across the two thin walls. Oxygen joins the red blood cells, and carbon dioxide travels in the plasma.', []);
    var svg = S.svg, NSV = K.NS;
    var defs = document.createElementNS(NSV, 'defs');
    defs.innerHTML = '<clipPath id="' + u + 'clip"><rect x="0" y="0" width="640" height="' + WD.y1 + '" rx="12"/></clipPath>' + sectionDefs(u);
    svg.appendChild(defs);
    var bg = document.createElementNS(NSV, 'rect'); bg.setAttribute('class', 'df__bg'); svg.appendChild(bg);
    var model = document.createElementNS(NSV, 'g'); svg.appendChild(model);
    var art = document.createElementNS(NSV, 'g'); art.setAttribute('clip-path', 'url(#' + u + 'clip)'); model.appendChild(art);
    var cr = document.createElementNS(NSV, 'rect');
    var gLab = document.createElementNS(NSV, 'g'); svg.appendChild(gLab);
    /* the key names only what is on the screen; its row keeps its height */
    var keyEl = dotKey([[INK.o2, 'oxygen'], [INK.co2, 'carbon dioxide']]); S.fig.appendChild(keyEl);
    keyEl.insertAdjacentHTML('afterbegin', '<span class="gk__i" data-k="red blood cell"><svg viewBox="-9 -7 18 14" aria-hidden="true"><g transform="scale(1.15 .9)"><use href="#' + u + 'rbF"/></g></svg>red blood cell</span>');
    var keyO = keyEl.querySelector('[data-k="oxygen"]'), keyC = keyEl.querySelector('[data-k="carbon dioxide"]'), keyR = keyEl.querySelector('[data-k="red blood cell"]');
    keyO.insertAdjacentHTML('afterend', '<span class="gk__i" data-k="oxygen on haemoglobin"><svg viewBox="-9 -7 18 14" aria-hidden="true"><g transform="scale(1.15 .9)"><use href="#' + u + 'rbF"/></g><circle r="3.4" fill="url(#' + u + 'mo)" stroke="#FFF" stroke-width="1"/></svg>oxygen on haemoglobin</span>');
    var keyH = keyEl.querySelector('[data-k="oxygen on haemoglobin"]');
    var lay = null, narrow = false, key = K.pinKey(S), memo = {};
    var TL = K.timeline(D_M, null, D_MOTION, title), R = TL.R, clock = TL.clock, worldAt = function (m) { return m; };

    /* the camera of step 1, from the whole drawing to the capillary */
    function camAt(t) {
      /* a zoom whose target travels in a straight line on the screen, so it stays in the picture all the way */
      var s = lerp(2.05, 11, ease(seg(t, .3, 3.3))), k = (1 / s - 1 / 2.05) / (1 / 11 - 1 / 2.05);
      return { s: s, cx: lerp(131, SPOT.x, k), cy: lerp(240, SPOT.y, k) };
    }
    function labelsAt(t) {
      var it = [];
      if (t >= 1.5 && t < 3.05) {
        var c = camAt(t);
        it.push({ id: 'capz', text: 'capillary on an alveolus', x: 320 + (SPOT.x - c.cx) * c.s, y: WD.y1 / 2 + (SPOT.y - c.cy) * c.s, side: 'R' });
      }
      if (t >= 4.3) {
        it.push({ id: 'air', text: 'air in the alveolus', x: 60, y: 120, side: 'L' });
        it.push({ id: 'wall', text: 'wall of the alveolus', x: 100, y: Y.wall + 5, side: 'L' });
        it.push({ id: 'cap', text: 'wall of the capillary', x: 560, y: Y.gap + 5, side: 'R' });
        it.push({ id: 'plasma', text: 'plasma', x: 600, y: Y.lum0 + 161, side: 'R' });
      }
      if (t >= 4.6 && t < 16.6) it.push({ id: 'hi', text: t < 10.8 ? 'net movement of oxygen' : 'net movement of carbon dioxide', x: t < 10.8 ? 210 : 430, y: Y.wall - 26, side: t < 10.8 ? 'L' : 'R' });
      return it;
    }
    var itemsAt = K.itemsOf(function () { return lay; }, function (tt) { return labelsAt(clock(tt)); }, true);

    function draw(tt, still) {
      var t = clock(tt), wt = still ? t : worldAt(t), o = '';
      /* step 1: the wider picture closing in on one capillary; the section opens inside it */
      var w = seg(t, 3.05, 4.35);
      if (w < 1) {
        var c = camAt(t);
        o += '<rect x="0" y="0" width="640" height="' + WD.y1 + '" class="df__far"/>';
        o += '<g transform="translate(' + n1(320 - c.cx * c.s) + ' ' + n1(WD.y1 / 2 - c.cy * c.s) + ') scale(' + n1(c.s * 100) / 100 + ')"><image href="assets/photos/sv-alveoli.svg" x="0" y="0" width="262" height="380"/></g>';
        /* the place the close-up will open from */
        var mk = seg(t, 1.1, 1.7) * (1 - seg(t, 3.05, 3.3));
        if (mk > 0) o += '<circle class="df__spot" cx="' + n1(320 + (SPOT.x - c.cx) * c.s) + '" cy="' + n1(WD.y1 / 2 + (SPOT.y - c.cy) * c.s) + '" r="46" opacity="' + n1(mk * 100) / 100 + '"/>';
      }
      if (w > 0) {
        var open = 430 * ease(w);
        o += '<clipPath id="' + u + 'open"><circle cx="320" cy="' + WD.y1 / 2 + '" r="' + n1(open) + '"/></clipPath><g clip-path="url(#' + u + 'open)">' + wallSvg(wt, u);
        if (t > 4.2) {
          var showO = (t < 10.8 ? ease(seg(t, 4.6, 5.2)) : t < 16.6 ? lerp(1, .22, seg(t, 10.8, 11.2)) : lerp(.22, 1, seg(t, 16.6, 17))), showC = ease(seg(t, 10.8, 11.4));
          gasAt('o2', wt).forEach(function (p) { o += molSvg(p, 'o2', u, showO); });
          if (showC > 0) gasAt('co2', wt).forEach(function (p) { o += molSvg(p, 'co2', u, showC); });
        }
        /* the net movement of each gas: one filled arrow across the wall */
        var ao = t < 10.8 ? seg(t, 4.6, 5.2) : t < 16.6 ? lerp(1, .28, seg(t, 10.8, 11.2)) : lerp(.28, 1, seg(t, 16.6, 17));
        var ac = t < 16.6 ? seg(t, 10.8, 11.4) : 1;
        if (ao > 0) o += '<g opacity="' + n1(ao * 100) / 100 + '">' + flow(210, Y.wall - 42, Y.lum0 + 40, 16, 'df__neto') + '</g>';
        if (ac > 0) o += '<g opacity="' + n1(ac * 100) / 100 + '">' + flow(430, Y.lum0 + 40, Y.wall - 42, 16, 'df__netc') + '</g>';
        /* step 5: what keeps the gradients: fresh air from above, the blood moving on */
        if (t > 20.8) {
          var fr = seg(t, 20.8, 21.6);
          o += '<g opacity="' + n1(fr * 100) / 100 + '"><path class="df__move" d="M28 40 H150 M132 26 L152 40 L132 54"/><rect x="23" y="9" width="72" height="22" rx="5" class="df__chip"/><text class="df__w" x="28" y="26">fresh air</text>' +
            '<path class="df__move df__move--b" d="M28 ' + (WD.y1 - 96) + ' H150 M132 ' + (WD.y1 - 110) + ' L152 ' + (WD.y1 - 96) + ' L132 ' + (WD.y1 - 82) + '"/>' +
            '<rect x="23" y="' + (WD.y1 - 127) + '" width="90" height="22" rx="5" class="df__chip df__chip--b"/><text class="df__w df__w--b" x="28" y="' + (WD.y1 - 110) + '">blood flow</text></g>';
        }
        o += '</g>';
      }
      art.innerHTML = o;
      /* the key names a part only from the step that shows it */
      keyR.style.visibility = t >= 3.3 ? 'visible' : 'hidden';
      keyO.style.visibility = keyH.style.visibility = t >= 4.6 ? 'visible' : 'hidden'; keyC.style.visibility = t >= 10.8 ? 'visible' : 'hidden';
      /* the scale: true for the section */
      if (t >= 4.3) art.innerHTML += '<g class="df__scale" transform="translate(462 ' + (WD.y1 - 22) + ')"><line x1="0" y1="0" x2="106.5" y2="0"/><line x1="0" y1="-5" x2="0" y2="5"/><line x1="106.5" y1="-5" x2="106.5" y2="5"/><text x="112" y="5">5 µm</text></g>';
      var items = L.stillItems(still, itemsAt, itemsAt(tt), tt, memo, narrow + '|' + (lay ? lay.f : 0));
      gLab.innerHTML = K.names(lay, items, narrow, key, null, 14);
    }
    var sp = L.stepper({ steps: K.readerSteps(D_STEPS, R), end: TL.end, render: draw, flow: TL.flow, stills: K.stillsOf(D_STEPS, TL) });
    worldAt = K.world(S, sp, function () { draw(sp.time()); });
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
    { t: 3.6, h: 'Oxygen diffuses out of the air', p: [['ig', 'In the alveoli, **oxygen diffuses into the blood**. It is used in **aerobic respiration** in the cells. So the air you breathe out holds about **16 %** oxygen.']] },
    { t: 8.4, h: 'Carbon dioxide diffuses into the air', p: [['ig', '**Carbon dioxide**, produced by aerobic respiration, **diffuses from the blood** into the alveoli. So the air you breathe out holds about **4 %** carbon dioxide.']] },
    { t: 13.2, h: 'Water evaporates into the air', p: [['ig', '**Water evaporates** from the moist surface of the alveoli, and **aerobic respiration** also produces water. The air now holds as much **water vapour** as air can hold at this temperature: the air is **saturated**.']] },
    { t: 17.6, h: 'Expired air leaves', p: [['ig', 'This is **expired air**: **less oxygen**, **more carbon dioxide** and **more water vapour** than inspired air.']] }
  ];
  var AV_M = [0, 3.6, 8.4, 13.2, 17.6, 21];
  var AV_MOTION = { 'What happens to the air in the lungs': [3.4, 4.3, 4.3, 3.7, 3.3] };
  function airchange(spec) {
    var title = spec.title || 'What happens to the air in the lungs';
    var S = K.shell(spec, 'av', title, 'A box of air particles: oxygen diffuses out, carbon dioxide diffuses in, and water evaporates into the air.', []);
    S.fig.removeChild(S.svg);
    var wrap = h('div', 'av__stage'), cv = document.createElement('canvas');
    cv.className = 'av__cv'; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'A box of 2,500 air particles. Oxygen diffuses out, carbon dioxide diffuses in, then water evaporates into the air.');
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
