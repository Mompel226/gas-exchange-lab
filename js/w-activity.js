/* ============================================================
   w-activity.js — "From active muscles to deeper breathing" (station `activity`, 11.1.5, 11.1.10).

   One real body (the Human Body Hub's BodyParts3D model, photographed part by part with one camera: chest3d-build/body_layers.mjs),
   and the chain the syllabus names, link by link: an increased carbon dioxide concentration in the blood, which is detected by the
   brain, leading to an increased rate and greater depth of breathing.

   THE FENCE (Daniel, 21 Nov 2026). This is biology, never his breathing-rate practical: nothing here is counted, measured, tabled or
   graphed, no exercise is named, and the two gauges have no numbers.
   SOURCES: 0610 2026–28 11.1.5, 11.1.10; schemes 0610/42/M/J/19 Q2(d), 0610/43/M/J/25 Q2(c)(ii), 0610/43/M/J/16 Q1(c)(iii),
   0610/42/O/N/24 Q2(c). The reports: not "a decrease in oxygen" (March 2020, March 2024).
   ============================================================ */
(function (global) {
  'use strict';
  var L = global.CircLearn, K = global.WKit;
  if (!L || !K) return;
  var n1 = K.n1, seg = K.seg, ease = K.ease, lerp = K.lerp, rng = K.rng, h = L.h;
  var WIN = { x0: 118, x1: 722, y0: 6, y1: 1125 };
  var CO2_INK = '#58A6FF', IMP_INK = '#FFD54F';
  /* traced on the layers, in their pixels (measured on a grid of the blood layer, 21 Nov 2026). The blood leaves the muscle in a vein,
     up the vena cava (the blue vessel) to the heart; through a lung and back to the heart; then up the aorta and an artery of the neck
     to the brain (Topic 9, the double circulation). The nerves run from the brain to the diaphragm and the intercostal muscles. */
  var VEIN = [[520, 1090], [505, 1040], [462, 950], [428, 868], [409, 812], [407, 780], [405, 680], [402, 600], [400, 548], [398, 500]];
  var LUNG = [[352, 470], [424, 478]];
  var ARTERY = [[430, 430], [434, 392], [438, 362], [441, 322], [436, 272], [430, 200], [422, 136]];
  var NERVE = [[415, 150], [415, 232], [415, 312]];
  var N_DIA = [[415, 312], [470, 424], [505, 540], [510, 664]];
  var N_RIB = [[415, 312], [352, 410], [322, 520]];
  function len(P) { var s = 0; for (var i = 1; i < P.length; i++) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return s; }
  function at(P, u) {
    if (u <= 0) return P[0];
    var want = u * len(P);
    for (var i = 1; i < P.length; i++) {
      var d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
      if (want <= d) { var k = want / d; return [lerp(P[i - 1][0], P[i][0], k), lerp(P[i - 1][1], P[i][1], k)]; }
      want -= d;
    }
    return P[P.length - 1];
  }
  var ROUTE = VEIN.concat(LUNG, ARTERY);
  /* the 'card' lines name each idea, and Cambridge's own sentence (11.1.10) is the card under the animation (28 Nov 2026, memory one-place-per-idea) */
  /* IB lines at the depth of the IB guide (Daniel, 27 Nov 2026: "the IB requires a little bit more"; "ask the other conversations to deepen the IB comments"), each saying only what its statement asks (memory ib-lines-words-against-the-guide): steps 2 to 5 C3.1.15, with C3.1.14 for where the chemoreceptors are (all SL and HL) */
  var STEPS = [
    { t: 0, h: 'Active muscles respire more', p: [['ig', 'During physical activity the **muscles contract more**, so the muscles need more energy. The muscles **respire** more to release this energy, and the muscles **produce more carbon dioxide**.', 'card']] },
    { t: 4.6, h: 'More carbon dioxide in the blood', p: [['ig', 'The carbon dioxide diffuses into the blood.'], ['ig', 'So the blood now holds **more carbon dioxide** than at rest.', 'card'], ['ig', 'The blood carries the carbon dioxide round the body.'], ['ib', 'In the blood, carbon dioxide reacts with water and forms **carbonic acid**, which releases **hydrogen ions** (H⁺). So the more carbon dioxide the blood carries, the lower the **pH** of the blood. During vigorous physical activity, the active muscles also release hydrogen ions into the blood.']] },
    { t: 9.8, h: 'The brain detects the carbon dioxide', p: [['ig', 'The blood flows through the brain, and the brain **detects the increase**.', 'card'], ['ib', 'The decrease in **pH** is monitored by **chemoreceptors**. The main chemoreceptors are in the **brainstem**, in the **medulla oblongata**. Other chemoreceptors, on the carotid arteries and the aorta, monitor the pH of the blood and its concentrations of oxygen and carbon dioxide. The medulla oblongata **coordinates** the response.']] },
    { t: 13, h: 'Impulses to the breathing muscles', p: [['ig', 'The brain sends more electrical signals along nerves to the **diaphragm** and the **intercostal muscles**. These signals are **impulses**. The diaphragm and the intercostal muscles contract **faster** and **more strongly**.', 'card'], ['ib', 'The **medulla oblongata** sends these impulses along **motor neurons**. By changing the signals to the diaphragm and the intercostal muscles, the medulla oblongata controls the **ventilation rate**.']] },
    { t: 18, h: 'A greater rate and depth of breathing', p: [['ig', 'Breathing becomes **faster** and **deeper**. More carbon dioxide is removed from the blood, and more oxygen is supplied to the muscles.', 'card'], ['ib', 'The control of the ventilation rate is an example of **negative feedback**. Faster and deeper ventilation removes carbon dioxide from the blood faster, so the pH of the blood returns towards its normal value, and the chemoreceptors send fewer impulses to the medulla oblongata.']] }
  ];
  var M = [0, 4.6, 9.8, 13, 18, 24.4];
  var MOTION = { 'From active muscles to deeper breathing': [4.6, 5.2, 3.2, 5, 6.4] };
  /* the dots of carbon dioxide leave the muscle one after another; each travels the vein and the artery */
  var DOTS = [], IMPS = [];
  (function () {
    var r = rng(21);
    for (var i = 0; i < 26; i++) DOTS.push({ t0: 2.2 + i * .28, off: (r() - .5) * 9, ox: 492 + r() * 58, oy: 1010 + r() * 96 });
    /* the brain keeps sending them, through the last step too */
    for (var j = 0; j < 30; j++) IMPS.push({ t0: 13.4 + j * .376, leg: j % 2 });
  })();
  function dotAt(q, t) {
    var a = seg(t, q.t0, q.t0 + 1.2);
    if (a <= 0) return null;
    if (a < 1) { var e = ease(a); return [lerp(q.ox, VEIN[0][0], e), lerp(q.oy, VEIN[0][1], e)]; }
    var k = seg(t, q.t0 + 1.2, q.t0 + 6.6), p = at(ROUTE, k);
    return [p[0] + q.off, p[1] + q.off * .3];
  }
  /* the breathing lungs: slow and shallow first, then faster and deeper; the phase is the sum of the speed, so the change has no jump */
  function breathOf(t) {
    var r = ease(seg(t, 18.2, 19.6)), rt = t < 18.2 ? 0 : t < 19.6 ? .5 * Math.pow(t - 18.2, 2) / 2.8 : .35 + (t - 19.6) * .5;
    var ph = (t * .22 + rt) * 6.2832;
    return { amp: lerp(.008, .04, r), val: (1 - Math.cos(ph)) / 2 };
  }
  function labelsAt(t) {
    var it = [];
    function put(id, text, x, y, side) { it.push({ id: id, text: text, x: x, y: y, side: side }); }
    if (t < 9.8) put('mus', 'active muscle: more respiration', 548, 1050, 'R');
    if (t >= 4.6 && t < 13) put('blood', 'carbon dioxide in the blood', 406, 720, 'R');
    if (t >= 9.8) put('brain', t < 13 ? 'brain: detects the carbon dioxide' : 'brain', 440, 96, 'R');
    if (t >= 13) { put('dia', 'diaphragm', 510, 664, 'R'); put('ic', 'intercostal muscles', 300, 400, 'L'); }
    if (t >= 13 && t < 18) put('imp', 'impulses', 415, 268, 'L');
    if (t >= 18) put('lung', 'lungs: greater rate and depth', 340, 540, 'L');
    return it;
  }

  function activity(spec) {
    var title = spec.title || 'From active muscles to deeper breathing';
    var S = K.shell(spec, 'ac', title, 'A real human body: carbon dioxide from the muscles reaches the brain, and impulses go to the breathing muscles.', []);
    var svg = S.svg, NSV = K.NS;
    var defs = document.createElementNS(NSV, 'defs');
    defs.innerHTML = '<clipPath id="acClip"><rect x="' + WIN.x0 + '" y="' + WIN.y0 + '" width="' + (WIN.x1 - WIN.x0) + '" height="' + (WIN.y1 - WIN.y0) + '" rx="14"/></clipPath>';
    svg.appendChild(defs);
    var bg = document.createElementNS(NSV, 'rect'); bg.setAttribute('class', 'ac__bg'); svg.appendChild(bg);
    var model = document.createElementNS(NSV, 'g'); svg.appendChild(model);
    var art = document.createElementNS(NSV, 'g'); art.setAttribute('clip-path', 'url(#acClip)'); model.appendChild(art);
    function img(n) { var e = document.createElementNS(NSV, 'image'); e.setAttribute('href', 'assets/photos/ac-' + n + '.webp'); e.setAttribute('x', 0); e.setAttribute('y', 0); e.setAttribute('width', 840); e.setAttribute('height', 1213); art.appendChild(e); return e; }
    var I = {}; ['base', 'blood', 'lungs', 'breath', 'muscle', 'brain'].forEach(function (n) { I[n] = img(n); });
    var live = document.createElementNS(NSV, 'g'); art.appendChild(live);
    var cr = document.createElementNS(NSV, 'rect');
    var gLab = document.createElementNS(NSV, 'g'); svg.appendChild(gLab);
    var read = h('div', 'ac__gauges',
      '<span class="ac__g"><b>Rate of breathing</b><i class="ac__bar"><u data-g="r"></u></i></span>' +
      '<span class="ac__g"><b>Depth of breathing</b><i class="ac__bar"><u data-g="d"></u></i></span>');
    S.fig.appendChild(read);
    var gR = read.querySelector('[data-g="r"]'), gD = read.querySelector('[data-g="d"]');
    var keyEl = h('div', 'gk', '<span class="gk__i"><svg viewBox="-5 -5 10 10" aria-hidden="true"><circle r="4" fill="' + CO2_INK + '"/></svg>carbon dioxide</span>' +
      '<span class="gk__i"><svg viewBox="-5 -5 10 10" aria-hidden="true"><circle r="4" fill="' + IMP_INK + '"/></svg>impulses</span>');
    S.fig.appendChild(keyEl);
    var keyC = keyEl.children[0], keyI = keyEl.children[1];
    var lay = null, narrow = false, key = K.pinKey(S), memo = {};
    var TL = K.timeline(M, null, MOTION, title), clock = TL.clock;
    var itemsAt = K.itemsOf(function () { return lay; }, function (tt) { return labelsAt(clock(tt)); }, true);
    function setO(e, v) { var s = String(n1(v * 100) / 100); if (e.getAttribute('opacity') !== s) e.setAttribute('opacity', s); }

    function draw(tt, still) {
      var t = clock(tt);
      /* each layer is at rest, faint, and lit while its step is about it */
      var pulse = 1 - (1 - seg(t, 9.2, 9.8)) * (.18 - .18 * Math.sin(t * 5));
      setO(I.base, 1);
      setO(I.muscle, t < 9.8 ? lerp(.3, 1, ease(seg(t, .2, 1.4))) * pulse : lerp(1, .3, seg(t, 9.8, 10.8)));
      setO(I.blood, t < 4.6 ? .28 : t < 13 ? lerp(.28, .95, seg(t, 4.6, 5.4)) : lerp(.95, .28, seg(t, 13, 13.8)));
      setO(I.brain, t < 9.8 ? .5 : t < 18 ? lerp(.5, 1, seg(t, 9.8, 10.4)) : lerp(1, .55, seg(t, 18, 18.8)));
      /* the breathing muscles light while the impulses reach them, then let the lungs be seen through them */
      setO(I.breath, t < 13 ? .16 : t < 18 ? lerp(.16, .96, seg(t, 15.5, 16.7)) : lerp(.96, .46, seg(t, 18, 18.8)));
      var B = breathOf(t), sc = 1 + B.amp * B.val;
      setO(I.lungs, t < 18 ? .55 : lerp(.55, 1, seg(t, 18, 18.8)));
      /* the lungs swell about their middle, a little in a resting breath and more in a deep one */
      I.lungs.setAttribute('transform', 'translate(418 540) scale(' + sc.toFixed(4) + ' ' + (1 + B.amp * 1.5 * B.val).toFixed(4) + ') translate(-418 -540)');
      var o = '';
      if (t < 15) DOTS.forEach(function (q) {
        var p = dotAt(q, t); if (!p) return;
        var fade = t < 13 ? 1 : 1 - seg(t, 13, 14);
        o += '<circle cx="' + n1(p[0]) + '" cy="' + n1(p[1]) + '" r="7.4" fill="' + CO2_INK + '" stroke="#0E2F59" stroke-width="1.4" opacity="' + n1(fade * 100) / 100 + '"/>';
      });
      /* the brain detects: a ring round it */
      if (t > 9.9 && t < 13.2) {
        var rk = seg(t, 9.9, 10.5) * (1 - seg(t, 12.7, 13.2)), rr = 96 + 7 * Math.sin(t * 5);
        o += '<ellipse cx="416" cy="92" rx="' + n1(rr) + '" ry="' + n1(rr * .86) + '" class="ac__ring" opacity="' + n1(rk * 100) / 100 + '"/>';
      }
      /* the impulses, from the brain down the spinal cord, to the diaphragm and the intercostal muscles */
      if (t > 13.2) IMPS.forEach(function (q) {
        var k = seg(t, q.t0, q.t0 + 2.2); if (k <= 0 || k >= 1) return;
        var path = NERVE.concat(q.leg ? N_DIA.slice(1) : N_RIB.slice(1)), p = at(path, k);
        o += '<circle cx="' + n1(p[0]) + '" cy="' + n1(p[1]) + '" r="7.2" fill="' + IMP_INK + '" stroke="#6B4E00" stroke-width="1.3"/>';
      });
      live.innerHTML = o;
      /* the key names a thing only while the picture shows it; its row keeps its height */
      keyC.style.visibility = t >= 2.2 && t < 15 ? 'visible' : 'hidden'; keyI.style.visibility = t >= 13.4 ? 'visible' : 'hidden';
      /* the two gauges follow the same moment as the lungs: no numbers, only more */
      var g = ease(seg(t, 18.2, 19.6)), w = lerp(26, 92, g);
      gR.style.width = n1(w) + '%'; gD.style.width = n1(lerp(30, 90, g)) + '%';
      var items = L.stillItems(still, itemsAt, itemsAt(tt), tt, memo, narrow + '|' + (lay ? lay.f : 0));
      gLab.innerHTML = K.names(lay, items, narrow, key, null, 14);
    }
    var CS = K.withCards(STEPS, spec.cards), sp = L.stepper({ steps: K.readerSteps(CS, TL.R), end: TL.end, render: draw, flow: TL.flow, stills: K.stillsOf(CS, TL) });
    return K.mount(S, sp, 'ac', [], function (Dw, nar) {
      narrow = nar;
      var m = K.margins(nar, 15, 14, 120, 110);
      lay = K.frameOf(svg, bg, model, cr, WIN, false, Dw, m[0], m[1], m[2], m[3], 13.5);
    });
  }
  L.add('activity', activity);
})(window);
