/* ============================================================
   views/benches.js — the stations' pictures that are made to be used.

     airsample   station 4: two equal volumes of air as counted dots; press a gas to compare it
     limebench   station 5: the limewater bench, drawn as the T11 summary draws it: Breathe in draws air through the tube on the
                 right, Breathe out pushes it through the tube on the left, and each turns cloudy according to the carbon dioxide
                 that has really passed through it
     reportview  station 8: your report as a page of five parts to press. Empty on purpose: no table, graph or words of the investigation.
   ============================================================ */
(function (global) {
  'use strict';
  var Views = global.Views;
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function still() { return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches); }

  /* ---------------------------------------------------------------- station 4 ------------------------------------- */
  function airsample(spec, ctx) {
    var G = global.GasDots;
    var root = h('div', 'asv');
    var bar = h('div', 'asv__bar');
    var GAS = [['oxygen', 'o2', 'Oxygen'], ['co2', 'co2', 'Carbon dioxide'], ['water', 'h2o', 'Water vapour']];
    var btns = {};
    GAS.forEach(function (g) {
      var b = h('button', 'asv__b', '<i style="background:' + G.INK[g[1]] + '"></i>' + g[2]); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { ctx.pick(g[0]); });
      btns[g[0]] = b; bar.appendChild(b);
    });
    var pair = h('div', 'asv__pair');
    function box(title) {
      var f = h('figure', 'asv__box');
      f.appendChild(h('figcaption', 'asv__t', title));
      var cv = document.createElement('canvas'); cv.className = 'asv__cv'; f.appendChild(cv);
      var n = h('p', 'asv__n'); f.appendChild(n);
      pair.appendChild(f);
      return { f: f, cv: cv, n: n };
    }
    var A = box('Inspired air'), B = box('Expired air');
    root.appendChild(bar); root.appendChild(pair);
    var focus = null;
    var KA = G.kinds(G.AIR.in), KB = G.kinds(G.AIR.out);
    var TXT = {
      o2: ['oxygen: about 21 %', 'oxygen: about 16 %'], co2: ['carbon dioxide: about 0.04 %', 'carbon dioxide: about 4 %'],
      h2o: ['water vapour: variable', 'water vapour: saturated'], none: ['2,500 particles of air', 'the same volume: 2,500 particles']
    };
    function paint() {
      [[A, KA, 0], [B, KB, 1]].forEach(function (q) {
        var e = q[0], cv = e.cv, r = cv.getBoundingClientRect(), dp = Math.min(global.devicePixelRatio || 1, 2);
        if (!r.width) return;
        var w = Math.round(r.width), hh = Math.round(r.height);
        if (cv.width !== w * dp || cv.height !== hh * dp) { cv.width = w * dp; cv.height = hh * dp; }
        var c = cv.getContext('2d'); c.setTransform(dp, 0, 0, dp, 0, 0);
        G.drawBox(c, 0, 0, w, hh, q[1], focus);
        e.n.textContent = TXT[focus || 'none'][q[2]];
      });
    }
    if (global.ResizeObserver) new ResizeObserver(paint).observe(pair);
    var api = {
      el: root, say: 'Two equal volumes of air. Each dot is one particle, so you can compare the concentration of each gas',
      credit: 'Drawn for this lab. The percentages are the syllabus’s.',
      labels: { oxygen: 'oxygen', co2: 'carbon dioxide', water: 'water vapour' },
      focus: function (part) {
        focus = part === 'oxygen' ? 'o2' : part === 'co2' ? 'co2' : part === 'water' ? 'h2o' : null;
        Object.keys(btns).forEach(function (k) { btns[k].setAttribute('aria-pressed', k === part ? 'true' : 'false'); });
        paint();
      },
      start: paint, stop: function () {}
    };
    return api;
  }
  Views.add('airsample', airsample);

  /* ---------------------------------------------------------------- station 5 ------------------------------------- */
  /* The bench, drawn as the T11 summary draws it since 25 Nov 2026: the tube for expired air on the LEFT, the tube for inspired air
     on the RIGHT, no letters, each tube named by its air (why: the KEPT PRIVATE list at the head of the lab's master, which is never
     published). On breathing in, air is drawn in through the long tube on the right, bubbles up through that limewater, and on to the
     mouthpiece; on breathing out, air goes down the long tube on the left, bubbles up through that limewater, and out of its short
     tube. Cloudiness follows the carbon dioxide that has passed: expired air holds 100 times more (0.04 % against 4 %), so its
     limewater clouds within a few breaths and the other only after a hundred times as many. */
  var FULL = 7.5;          /* seconds of expired air for the limewater to become fully cloudy */
  var XO = 162, XI = 458;  /* the middle of the tube for expired air (left) and of the tube for inspired air (right) */
  function limebench(spec, ctx) {
    var root = h('div', 'lbv');
    var svgWrap = h('div', 'lbv__stage');
    svgWrap.innerHTML =
      '<svg viewBox="0 0 620 470" class="lbv__svg" role="img" aria-label="Two test tubes of limewater joined to one mouthpiece. Expired air passes through the tube on the left, and inspired air passes through the tube on the right.">' +
      '<defs><linearGradient id="lbGlass" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".5" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity=".5"/></linearGradient></defs>' +
      /* the glass tubes */
      '<path class="lbv__pipe" d="M310 34 V92 M310 92 H196 V144 M310 92 H424 V144"/>' +
      /* the tube for expired air: its long tube from the mouthpiece, its short tube open to the air */
      '<path class="lbv__pipe" d="M196 144 V330"/><path class="lbv__pipe" d="M128 70 V176"/>' +
      /* the tube for inspired air: its short tube to the mouthpiece, its long tube open to the air */
      '<path class="lbv__pipe" d="M424 144 V176"/><path class="lbv__pipe" d="M492 70 V330"/>' +
      '<g id="lbOut"></g><g id="lbIn"></g>' +
      '<rect x="260" y="6" width="100" height="30" rx="8" class="lbv__mouth"/>' +
      '<text x="310" y="26" class="lbv__s" text-anchor="middle">mouthpiece</text>' +
      '<text x="' + XO + '" y="452" class="lbv__air lbv__out" text-anchor="middle">expired air</text>' +
      '<text x="' + XI + '" y="452" class="lbv__air lbv__in" text-anchor="middle">inspired air</text>' +
      '<text x="128" y="60" class="lbv__s lbv__out" text-anchor="middle">air out</text><text x="492" y="60" class="lbv__s lbv__in" text-anchor="middle">air in</text>' +
      '<g id="lbAir"></g></svg>';
    root.appendChild(svgWrap);
    var read = h('p', 'lbv__say', 'Press Breathe in or Breathe out. Hold the button to keep breathing.');
    read.setAttribute('role', 'status');
    root.appendChild(read);
    var bar = h('div', 'lbv__bar');
    var bIn = h('button', 'lbv__go', 'Breathe in'), bOut = h('button', 'lbv__go lbv__go--out', 'Breathe out'), bNew = h('button', 'lbv__re', 'Fresh limewater');
    [bIn, bOut, bNew].forEach(function (b) { b.type = 'button'; bar.appendChild(b); });
    root.appendChild(bar);
    var gOut = svgWrap.querySelector('#lbOut'), gIn = svgWrap.querySelector('#lbIn'), gAir = svgWrap.querySelector('#lbAir');
    var co2In = 0, co2Out = 0, mode = 0, raf = 0, lastT = 0, TT = 0;
    function tube(x, cloud) {
      var liq = 'rgba(' + Math.round(216 + 26 * cloud) + ',' + Math.round(236 + 8 * cloud) + ',' + Math.round(246 - 6 * cloud) + ',' + (.12 + .84 * cloud).toFixed(3) + ')';
      return '<path class="lbv__glass" d="M' + (x - 54) + ' 150 V384 a54 46 0 0 0 108 0 V150 Z"/>' +
        '<path d="M' + (x - 51) + ' 214 V384 a51 43 0 0 0 102 0 V214 Z" fill="' + liq + '"/>' +
        '<line x1="' + (x - 51) + '" y1="214" x2="' + (x + 51) + '" y2="214" class="lbv__menisc"/>' +
        '<path d="M' + (x - 54) + ' 150 V384 a54 46 0 0 0 108 0 V150" fill="url(#lbGlass)" opacity=".5"/>' +
        '<rect x="' + (x - 58) + '" y="138" width="116" height="16" rx="4" class="lbv__bung"/>';
    }
    function bubbles(xp, tt) {
      var o = '';
      for (var i = 0; i < 9; i++) {
        var u = ((tt * 1.3 + i / 9) % 1), y = 330 - u * 114, x = xp + Math.sin(u * 9 + i * 2) * (5 + u * 14), r = 3 + (i % 3) * 1.3;
        o += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r + '" class="lbv__bub" opacity="' + Math.min(1, (1 - u) * 4).toFixed(2) + '"/>';
      }
      return o;
    }
    function flow(path, tt, cls) {
      var o = '', n = 7;
      for (var i = 0; i < n; i++) {
        var u = (tt * .9 + i / n) % 1, L0 = 0, tot = 0, k;
        for (k = 1; k < path.length; k++) tot += Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1]);
        var want = u * tot, x = path[0][0], y = path[0][1];
        for (k = 1; k < path.length; k++) {
          var d = Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1]);
          if (want <= d) { x = path[k - 1][0] + (path[k][0] - path[k - 1][0]) * want / d; y = path[k - 1][1] + (path[k][1] - path[k - 1][1]) * want / d; break; }
          want -= d;
        }
        o += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.6" class="' + cls + '"/>';
      }
      return o;
    }
    function draw() {
      var cI = Math.min(1, co2In / FULL), cO = Math.min(1, co2Out / FULL);
      gOut.innerHTML = tube(XO, cO) + (mode === 2 ? bubbles(196, TT) : '');
      gIn.innerHTML = tube(XI, cI) + (mode === 1 ? bubbles(492, TT) : '');
      var a = '';
      if (mode === 1) a = flow([[492, 66], [492, 330]], TT, 'lbv__a') + flow([[424, 176], [424, 92], [310, 92], [310, 36]], TT, 'lbv__a');
      if (mode === 2) a = flow([[310, 36], [310, 92], [196, 92], [196, 330]], TT, 'lbv__a lbv__a--o') + flow([[128, 176], [128, 66]], TT, 'lbv__a lbv__a--o');
      gAir.innerHTML = a;
    }
    function words() {
      var cO = co2Out / FULL, cI = co2In / FULL;
      /* two lines at most on a phone of 360 px or more (measured); a no-break space keeps each % beside its number */
      if (mode === 1) read.textContent = 'Breathing in: inspired air (about 0.04 % carbon dioxide) passes through the limewater on the right.';
      else if (mode === 2) read.textContent = 'Breathing out: expired air (about 4 % carbon dioxide) passes through the limewater on the left.';
      else if (cO >= 1) read.textContent = cI >= .5 ? 'Both tubes are now cloudy, but the limewater with expired air turned cloudy far sooner.' : 'Only the limewater with expired air is cloudy: expired air contains more carbon dioxide than inspired air.';
      else if (cO > .05) read.textContent = 'The limewater with expired air is turning cloudy. Keep breathing in and out.';
    }
    function tick(ts) {
      raf = 0;
      var dt = lastT ? Math.min(.05, (ts - lastT) / 1000) : .016; lastT = ts;
      TT += dt;
      if (mode === 1) co2In += dt * .01;          /* 0.04 % against 4 %: a hundred times less carbon dioxide per second */
      if (mode === 2) co2Out += dt;
      draw();
      if (mode) raf = requestAnimationFrame(tick); else lastT = 0;
    }
    function hold(b, m) {
      var held = false;
      function on(e) {
        if (held) return; held = true; if (e && e.pointerId != null && b.setPointerCapture) { try { b.setPointerCapture(e.pointerId); } catch (x) {} }
        b.classList.add('is-on'); mode = m; words();
        if (still()) { if (m === 1) co2In += .03; else co2Out += FULL / 4; draw(); words(); return; }
        if (!raf) { lastT = 0; raf = requestAnimationFrame(tick); }
      }
      function off() { if (!held) return; held = false; b.classList.remove('is-on'); mode = 0; draw(); words(); }
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); on(e); });
      ['pointerup', 'pointercancel', 'lostpointercapture', 'blur'].forEach(function (t) { b.addEventListener(t, off); });
      b.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); on(); } });
      b.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); off(); } });
    }
    hold(bIn, 1); hold(bOut, 2);
    bNew.addEventListener('click', function () { co2In = 0; co2Out = 0; mode = 0; draw(); read.textContent = 'Fresh limewater in both tubes. Press Breathe in or Breathe out.'; });
    draw();
    return {
      el: root, say: 'The tube on the right tests the air you breathe in. The tube on the left tests the air you breathe out', credit: 'Drawn for this lab',
      labels: { test: 'limewater', setup: 'the apparatus', result: 'the result', means: 'what it means' },
      focus: function (part) {
        svgWrap.setAttribute('data-part', part || '');
        if (part === 'result' && co2Out < FULL) { co2Out = FULL; co2In = Math.max(co2In, .05); draw(); words(); }
      },
      stop: function () { mode = 0; if (raf) { cancelAnimationFrame(raf); raf = 0; } draw(); }
    };
  }
  Views.add('limebench', limebench);

  /* ---------------------------------------------------------------- station 8 ------------------------------------- */
  /* one blank page of a report: each part is drawn empty (no headings, no values, no data), so that the work stays the pupil's */
  var SK = {
    tables: '<rect x="2" y="4" width="46" height="40"/><path d="M2 17H48M2 30H48M17 4V44M33 4V44"/><rect x="58" y="4" width="46" height="40"/><path d="M58 17H104M58 30H104M73 4V44M89 4V44"/>',
    means: '<rect x="4" y="16" width="16" height="16"/><rect x="26" y="16" width="16" height="16"/><rect x="48" y="16" width="16" height="16"/><path d="M71 24H82M78 20L83 24L78 28"/><rect class="rpv__skb" x="88" y="14" width="20" height="20"/>',
    graph: '<path d="M18 4V42H104"/><path d="M14 12H18M14 22H18M14 32H18M38 42V46M58 42V46M78 42V46M98 42V46"/>',
    analysis: '<path d="M2 10H106M2 24H106M2 38H72"/>',
    conclusion: '<path d="M2 10H106M2 24H106M2 38H88"/>'
  };
  var PARTS = [['tables', 'Your two tables', 'raw data table · processed data table'], ['means', 'Your means', 'the calculations'], ['graph', 'Your graph', 'title, axes, points'], ['analysis', 'The pattern in your results', 'described with values'], ['conclusion', 'Your conclusion', 'your hypothesis, and the biology']];
  function reportview(spec, ctx) {
    var root = h('div', 'rpv');
    var page = h('div', 'rpv__page');
    var btns = {};
    PARTS.forEach(function (p, i) {
      var b = h('button', 'rpv__b', '<span class="rpv__n">' + (i + 1) + '</span><span class="rpv__t"><b>' + p[1] + '</b><i>' + p[2] + '</i></span><svg class="rpv__sk" viewBox="0 0 110 48" aria-hidden="true">' + SK[p[0]] + '</svg>');
      b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { ctx.pick(p[0]); });
      btns[p[0]] = b; page.appendChild(b);
    });
    root.appendChild(h('p', 'rpv__h', 'Your report'));
    root.appendChild(page);
    return {
      el: root, say: 'The five parts of your report. Press a part to open its card', credit: '',
      labels: { tables: 'Your two tables', means: 'Your means', graph: 'Your graph', analysis: 'The pattern in your results', conclusion: 'Your conclusion' },
      focus: function (part) { Object.keys(btns).forEach(function (k) { btns[k].setAttribute('aria-pressed', k === part ? 'true' : 'false'); }); },
      stop: function () {}
    };
  }
  Views.add('reportview', reportview);
})(window);
