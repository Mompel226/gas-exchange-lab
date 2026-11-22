/* ============================================================
   w-lining.js — "Mucus and cilia at work" (station `protect`, 11.1.11).

   The lining of the trachea, Servier Medical Art's (Tissues kit, CC BY 4.0, adapted; the Immunity Lab's cut): ciliated cells with their
   cilia apart so that they can beat, and goblet cells among them. It stands UPRIGHT here, as the wall of the trachea stands in the
   body: the air is on the left, the wall on the right, and "up" on the screen is really up, towards the throat. The Immunity Lab
   shows the same lining lying on its side; the words are the same in both.

   True at every frame: goblet cells secrete the mucus; the mucus lies ON the cilia; particles stick to the mucus and only there; the cilia
   do not touch the particles, they move the mucus; each cilium beats with a quick stroke towards the throat and a slow return,
   and neighbours beat a little after one another, so a wave runs along the lining.
   SOURCES: 0610 2026–28 11.1.11; schemes 0610/42/F/M/18 Q2(b)(i), 0610/41/M/J/23 Q3(a), 0610/43/O/N/17 Q1(b); the reports' errors:
   "cilia trap" (November 2019), cilia moving bacteria (June 2023), moving pathogens directly (June 2025).
   ============================================================ */
(function (global) {
  'use strict';
  var L = global.CircLearn, K = global.WKit;
  if (!L || !K) return;
  var n1 = K.n1, seg = K.seg, ease = K.ease, lerp = K.lerp, rng = K.rng;
  /* the lining's own frame, lying down: x runs along the airway (towards the throat at larger x), y from the air into the wall */
  var LW = 424, LH = 300, X0 = 8, Y0 = 96, S = 1.3, RGT = X0 + 311 * S, GOB = [148.4, 297.9], MTOP = 72, MBOT = 101, BANDS = 22;
  /* standing it up: the air on the left, the throat at the top */
  function up(x, y) { return [y, LW - x]; }
  var WIN = { x0: 0, x1: LH - 26, y0: 13, y1: 414 };

  var STEPS = [
    { t: 0, h: 'The lining of the trachea', p: [['ig', 'This is the wall of the **trachea**, seen from the side. The air is on the left. **Ciliated cells** and **goblet cells** form the lining of the trachea.']] },
    { t: 3.2, h: 'Goblet cells secrete mucus', p: [['ig', '**Goblet cells** **secrete mucus**. The sticky mucus spreads over the cilia as a layer.']] },
    { t: 8, h: 'The mucus traps pathogens and particles', p: [['ig', '**Pathogens** and **particles**, such as dust, in the air you breathe in stick to the mucus: the mucus **traps** them.']] },
    { t: 12.6, h: 'The cilia beat', p: [['ig', 'The **cilia beat** and **move the mucus**, with the trapped pathogens and particles, **up the airway**, away from the lungs. The cilia do not touch the particles.']] },
    { t: 17.6, h: 'To the throat', p: [['ig', 'The mucus reaches the **throat**, where it is **swallowed**. The pathogens and particles do not reach the alveoli.']] }
  ];
  var M = [0, 3.2, 8, 12.6, 17.6, 23];
  var MOTION = { 'Mucus and cilia at work': [3.2, 4.8, 4.6, 5, 5.4] };

  /* the mucus's travel along the airway: nothing before the cilia move it */
  function travel(t) { return 150 * ease(seg(t, 12.9, 17.5)) + 250 * ease(seg(t, 17.6, 22.8)); }
  var CATCH = [];
  (function () {
    var r = rng(5);
    for (var i = 0; i < 9; i++) CATCH.push({ x: 26 + i * 40 + r() * 16, y: MTOP + 7 + r() * 13, start: -44 - r() * 40, t0: 8.3 + i * .36, kind: i % 3 === 1 ? 'b' : 'd', rot: r() * 180, s: .85 + r() * .4 });
  })();
  function beatAngle(t, xc) {
    /* a quick stroke towards the throat and a slow return; each band a little after the one before: the wave. Slowed so that it can be
       followed (real cilia beat many times a second), and small until the step about them, when they beat in full and move the mucus */
    var ph = ((t * .75 - xc / 70) % 1 + 1) % 1, full = .34 + .66 * seg(t, 12.6, 13.2);
    return full * (ph < .3 ? 15 - 30 * (ph / .3) : -15 + 30 * ((ph - .3) / .7));
  }
  /* the layer of mucus: it grows along the lining from each goblet cell, thin at its ends, until the two parts join */
  function mucusPath(go, reach) {
    var d = '', on = false, last = 0;
    for (var x = X0; x <= RGT; x += 4) {
      var e = 0;
      GOB.forEach(function (g) { e = Math.max(e, (reach - Math.abs(x - g)) / 36); });
      if (e > 0) {
        e = Math.min(1, e); e = e * e * (3 - 2 * e);
        d += (on ? 'L' : 'M' + n1(x) + ' ' + MBOT + ' L') + n1(x) + ' ' + n1(MBOT - e * (MBOT - MTOP - 2.4 * Math.sin((x - go) / 15))) + ' ';
        on = true; last = x;
      } else if (on) { d += 'L' + n1(last) + ' ' + MBOT + ' Z '; on = false; }
    }
    return on ? d + 'L' + n1(last) + ' ' + MBOT + ' Z' : d;
  }
  function particle(q, x, y) {
    if (q.kind === 'b') return '<g transform="translate(' + n1(x) + ' ' + n1(y) + ') rotate(' + n1(q.rot) + ') scale(' + q.s + ')"><rect x="-9" y="-4" width="18" height="8" rx="4" class="lg__bac"/></g>';
    return '<g transform="translate(' + n1(x) + ' ' + n1(y) + ') rotate(' + n1(q.rot) + ') scale(' + q.s + ')"><path class="lg__dust" d="M-6 -3 L-1 -6 L5 -4 L7 1 L3 6 L-3 5 L-7 2 Z"/></g>';
  }

  function lining(spec) {
    var A = global.GE_ART;
    var title = spec.title || 'Mucus and cilia at work';
    var S0 = K.shell(spec, 'lg', title, 'The lining of the trachea: goblet cells, mucus, and cilia moving the mucus up towards the throat.', []);
    var svg = S0.svg, NSV = K.NS;
    var uid = 'lg' + Math.random().toString(36).slice(2, 6);
    var lin = 'translate(' + X0 + ' ' + Y0 + ') scale(' + S + ')';
    var bands = ''; for (var b = 0; b < BANDS; b++) bands += '<clipPath id="' + uid + 'b' + b + '"><rect x="' + n1(X0 + b * (RGT - X0) / BANDS - .4) + '" y="0" width="' + n1((RGT - X0) / BANDS + .8) + '" height="170"/></clipPath>';
    var defs = document.createElementNS(NSV, 'defs');
    defs.innerHTML = '<g id="' + uid + 'cb"><g transform="' + lin + '">' + A['airway-ciliaback'].svg + '</g></g><g id="' + uid + 'cf"><g transform="' + lin + '">' + A['airway-cilia'].svg + '</g></g>' + bands +
      /* no cilia on the goblet cells */
      '<clipPath id="' + uid + 'nog"><rect x="0" y="0" width="' + n1(GOB[0] - 27) + '" height="300"/><rect x="' + n1(GOB[0] + 27) + '" y="0" width="' + n1(GOB[1] - GOB[0] - 54) + '" height="300"/><rect x="' + n1(GOB[1] + 27) + '" y="0" width="200" height="300"/></clipPath>' +
      '<clipPath id="' + uid + 'cl"><rect x="0" y="0" width="' + n1(RGT + 2) + '" height="300"/></clipPath>' +
      '<clipPath id="' + uid + 'v"><rect x="' + WIN.x0 + '" y="' + WIN.y0 + '" width="' + (WIN.x1 - WIN.x0) + '" height="' + (WIN.y1 - WIN.y0) + '" rx="12"/></clipPath>';
    svg.appendChild(defs);
    var bg = document.createElementNS(NSV, 'rect'); bg.setAttribute('class', 'lg__bg'); svg.appendChild(bg);
    var model = document.createElementNS(NSV, 'g'); svg.appendChild(model);
    var view = document.createElementNS(NSV, 'g'); view.setAttribute('clip-path', 'url(#' + uid + 'v)'); model.appendChild(view);
    var air = document.createElementNS(NSV, 'rect'); air.setAttribute('class', 'lg__air'); air.setAttribute('x', 0); air.setAttribute('y', 0); air.setAttribute('width', LH); air.setAttribute('height', LW); view.appendChild(air);
    /* everything below is drawn lying down, and stood up by this one transform */
    var stand = document.createElementNS(NSV, 'g'); stand.setAttribute('transform', 'matrix(0 -1 1 0 0 ' + LW + ')'); view.appendChild(stand);
    function useBands(id, parent) {
      var list = [];
      for (var i = 0; i < BANDS; i++) {
        var g = document.createElementNS(NSV, 'g'); g.setAttribute('clip-path', 'url(#' + uid + 'b' + i + ')');
        var u = document.createElementNS(NSV, 'use'); u.setAttribute('href', '#' + uid + id); g.appendChild(u); parent.appendChild(g); list.push(u);
      }
      return list;
    }
    var clip = document.createElementNS(NSV, 'g'); clip.setAttribute('clip-path', 'url(#' + uid + 'cl)'); stand.appendChild(clip);
    var nog1 = document.createElementNS(NSV, 'g'); nog1.setAttribute('clip-path', 'url(#' + uid + 'nog)'); clip.appendChild(nog1);
    var UB = useBands('cb', nog1);
    var cells = document.createElementNS(NSV, 'g');
    cells.innerHTML = '<g transform="' + lin + '">' + A['airway-cells'].svg + '</g>' + GOB.map(function (x) { return '<g transform="translate(' + n1(x - 50.6 * 1.04 / 2) + ' ' + n1(Y0 + 16 * S) + ') scale(1.04 1.885)">' + A.goblet.svg + '</g>'; }).join('');
    clip.appendChild(cells);
    var nog2 = document.createElementNS(NSV, 'g'); nog2.setAttribute('clip-path', 'url(#' + uid + 'nog)'); clip.appendChild(nog2);
    var UF = useBands('cf', nog2);
    var mucus = document.createElementNS(NSV, 'g'); clip.appendChild(mucus);
    var cr = document.createElementNS(NSV, 'rect');
    var gLab = document.createElementNS(NSV, 'g'); svg.appendChild(gLab);
    /* the key is drawn, and names the two kinds of particle only from the step that shows them */
    var keyEl = L.h('div', 'gk', '<span class="gk__i"><svg viewBox="-10 -6 20 12" style="width:20px" aria-hidden="true"><rect x="-9" y="-4" width="18" height="8" rx="4" class="lg__bac"/></svg>a pathogen (a bacterium)</span>' +
      '<span class="gk__i"><svg viewBox="-8 -7 16 14" aria-hidden="true"><path class="lg__dust" d="M-6 -3 L-1 -6 L5 -4 L7 1 L3 6 L-3 5 L-7 2 Z"/></svg>a dust particle</span>');
    S0.fig.appendChild(keyEl);
    var lay = null, narrow = false, key = K.pinKey(S0), memo = {};
    var TL = K.timeline(M, null, MOTION, title), clock = TL.clock;

    function labelsAt(t) {
      var it = [];
      function put(id, text, x, y, side) { var p = up(x, y); it.push({ id: id, text: text, x: p[0], y: p[1], side: side }); }
      put('gob', 'goblet cell', GOB[1], 150, 'R');
      put('cc', 'ciliated cell', 222, 190, 'R');
      if (t < 3.3 || t >= 12.6) put('cil', t >= 12.6 ? 'cilia beat' : 'cilia', 86, 110, 'L');
      if (t >= 5.7) put('muc', 'mucus', 372, (MTOP + MBOT) / 2, 'L');
      if (t >= 10.2 && t < 17.6) { var q = CATCH[2], x = q.x + travel(t); if (x < RGT - 16) put('trap', 'pathogens and particles, trapped', x, q.y, 'L'); }
      if (t >= 17.8) put('thr', 'to the throat: swallowed', 292, 42, 'L');
      return it;
    }
    var itemsAt = K.itemsOf(function () { return lay; }, function (tt) { return labelsAt(clock(tt)); }, true);

    function draw(tt, still) {
      var t = clock(tt), i;
      /* the cilia beat all the time, as real cilia do; the mucus is moved only once it lies on them */
      for (i = 0; i < BANDS; i++) {
        var xc = X0 + (i + .5) * (RGT - X0) / BANDS, a = beatAngle(still ? .1 : t, xc), base = Y0 + 18 * S;
        var tf = 'translate(0 ' + n1(base) + ') skewX(' + n1(a) + ') translate(0 ' + n1(-base) + ')';
        UB[i].setAttribute('transform', tf); UF[i].setAttribute('transform', tf);
      }
      var o = '', go = travel(t);
      /* step 2: mucus leaves the goblet cells, then spreads along the lining */
      if (t >= 3.4 && t < 6.2) GOB.forEach(function (x, g) {
        [0, .33, .66].forEach(function (d, j) {
          var k = Math.max(0, Math.min(1, seg(t, 3.5 + d, 5.4 + d)));
          if (k <= 0) return;
          o += '<ellipse class="lg__drop" cx="' + n1(x + (j - 1) * 5 * k) + '" cy="' + n1(lerp(122, 86, k)) + '" rx="' + n1(3 + 6 * k) + '" ry="' + n1(3 + 3 * k) + '" opacity="' + n1(Math.min(1, k * 4) * 100) / 100 + '"/>';
        });
      });
      var spread = ease(seg(t, 4.3, 7.8));
      if (spread > 0) {
        var cid = uid + 'm', layer = mucusPath(go, spread * 260);
        o += '<clipPath id="' + cid + '"><path d="' + layer + '"/></clipPath>';
        o += '<path class="lg__muc" d="' + layer + '"/><g clip-path="url(#' + cid + ')">';
        /* streaks that travel with the mucus, so its movement shows */
        for (var s = -8; s < 9; s++) {
          var sx = ((X0 + 12 + s * 58 + go) % (RGT + 60) + (RGT + 60)) % (RGT + 60) - 20;
          o += '<ellipse class="lg__streak" cx="' + n1(sx) + '" cy="' + n1(MTOP + 12 + (((s % 2) + 2) % 2) * 6) + '" rx="15" ry="2.6"/>';
        }
        o += '</g>';
      }
      /* the particles: from the air onto the mucus, then only with it */
      CATCH.forEach(function (q) {
        var k = seg(t, q.t0, q.t0 + 1.15); if (k <= 0) return;
        var y = lerp(q.start, q.y, 1 - (1 - k) * (1 - k)), xx = q.x + go;
        if (xx > RGT + 10) return;
        o += particle(q, xx, y);
      });
      /* the way the mucus goes */
      if (t >= 12.8) {
        var f = seg(t, 12.8, 13.4);
        o += '<g opacity="' + n1(f * 100) / 100 + '"><path class="lg__way" d="M150 42 H270"/><path class="lg__wayh" d="M268 30 L292 42 L268 54 Z"/></g>';
      }
      mucus.innerHTML = o;
      keyEl.style.visibility = t >= 8 ? 'visible' : 'hidden';
      var items = L.stillItems(still, itemsAt, itemsAt(tt), tt, memo, narrow + '|' + (lay ? lay.f : 0));
      gLab.innerHTML = K.names(lay, items, narrow, key, { trap: 2 }, 14);
    }
    var sp = L.stepper({ steps: K.readerSteps(STEPS, TL.R), end: TL.end, render: draw, flow: TL.flow, stills: K.stillsOf(STEPS, TL) });
    return K.mount(S0, sp, 'lg', [], function (Dw, nar) {
      narrow = nar;
      var m = K.margins(nar, 15, 13, 118, 100);
      lay = K.frameOf(svg, bg, model, cr, WIN, false, Dw, m[0], m[1], m[2], m[3], 13.5);
    });
  }
  L.add('lining', lining);
})(window);
