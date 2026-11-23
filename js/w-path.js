/* ============================================================
   w-path.js — "Follow a breath of air" (station `system`, 11.1.2): the air from the nose or mouth to the alveoli, on Servier
   Medical Art's drawing of the whole breathing system (CC BY 4.0). Six steps, each held until Next step.

   Every path below is traced on the drawing itself, inside its airways (measured on a grid of the drawing, 21 Nov 2026), so the
   air never crosses a wall. The front of the air reaches each part in its own step; the dots behind it follow.
   The last step opens a window at the end of a bronchiole, growing from that place, onto Servier's alveoli and capillaries. The air
   goes down the bronchiole INTO the cluster that has its capillaries drawn (Daniel, 23 Nov 2026: "not the top one"), each bead to one
   alveolus. The capillaries are drawn over the beads, because they lie on the outside of the alveoli and the air is inside.
   SOURCES: syllabus 0610 2026–28 11.1.2, 11.1.7; order of parts as credited in 0610/33/O/N/23 Q4(a) and 0610/31/O/N/24 Q5(b).
   ============================================================ */
(function (global) {
  'use strict';
  var L = global.CircLearn, K = global.WKit;
  if (!L || !K) return;
  var n1 = K.n1, seg = K.seg, ease = K.ease, lerp = K.lerp, rng = K.rng;
  var WIN = { x0: 262, x1: 1012, y0: 176, y1: 1340 };

  var NOSE = [[348, 306], [376, 290], [424, 278], [478, 276], [524, 288], [552, 316]];
  var MOUTH = [[364, 396], [394, 372], [434, 350], [494, 344], [540, 362], [566, 396]];
  var THROAT = [[566, 396], [582, 440], [588, 478]];
  var LARYNX = [[588, 478], [572, 522], [574, 566]];
  var TRACHEA = [[574, 566], [596, 640], [612, 720], [617, 830], [618, 940]];
  /* the two main bronchi, to where each divides inside its lung */
  var BR = [[[618, 940], [664, 990], [722, 1034], [756, 1040]], [[618, 940], [576, 978], [546, 1002], [520, 1020]]];
  /* bronchioles, each along a branch of the drawing */
  var TIPS = [
    [[756, 1040], [784, 1074], [798, 1139], [798, 1204], [798, 1274]],
    [[756, 1040], [776, 990], [770, 916], [742, 852], [708, 770]],
    [[776, 990], [802, 938], [828, 880], [856, 838]],
    [[784, 1020], [812, 1002], [858, 988], [914, 1002]],
    [[784, 1074], [812, 1062], [870, 1060], [920, 1082]],
    [[798, 1139], [856, 1132], [928, 1110]],
    [[798, 1150], [856, 1204], [926, 1254]],
    [[520, 1020], [496, 1060], [474, 1103], [467, 1161], [460, 1234]],
    [[520, 1020], [489, 960], [482, 916], [503, 873], [521, 788]],
    [[489, 960], [431, 952], [374, 966], [336, 994]],
    [[500, 985], [431, 1002], [368, 1006]],
    [[496, 1060], [417, 1088], [359, 1089], [322, 1048]],
    [[474, 1110], [417, 1132], [366, 1161]],
    [[467, 1161], [417, 1197], [366, 1247], [352, 1282]]
  ];
  function polyLen(P) { var s = 0; for (var i = 1; i < P.length; i++) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return s; }
  function at(P, u) {
    if (u <= 0) return P[0].slice();
    var want = u * polyLen(P);
    for (var i = 1; i < P.length; i++) {
      var d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
      if (want <= d) { var k = want / (d || 1); return [lerp(P[i - 1][0], P[i][0], k), lerp(P[i - 1][1], P[i][1], k)]; }
      want -= d;
    }
    return P[P.length - 1].slice();
  }
  /* each dot's route: its way in, then the part of the tree it ends in. A route is cut at each part's end, so "the front" can
     reach each part in its own step */
  var ROUTES = [];
  (function () {
    var r = rng(11);
    for (var i = 0; i < 26; i++) {
      /* two dots in three come in through the nose, one through the mouth */
      var head = i % 3 === 2 ? MOUTH : NOSE.concat([[566, 396]]);
      var tip = TIPS[i % TIPS.length], br = i % TIPS.length < 7 ? BR[0] : BR[1];
      /* a bronchiole that starts on another one: its dot goes along the main branch first */
      var trunk = i % TIPS.length < 7 ? [[756, 1040]] : [[520, 1020]];
      var seg5 = (Math.hypot(tip[0][0] - trunk[0][0], tip[0][1] - trunk[0][1]) > 2 ? trunk.concat(tip) : tip);
      ROUTES.push({ legs: [head, THROAT, LARYNX, TRACHEA, br, seg5], lag: r() * .78, off: [(r() - .5) * 11, (r() - .5) * 11], sz: 6.4 + r() * 2 });
    }
  })();
  var STEPS = [
    { t: 0, h: 'In through the nose or the mouth', p: [['ig', 'Air enters through the **nose** or the **mouth**. The two ways join at the back of the throat.']] },
    { t: 4, h: 'The larynx', p: [['ig', 'Air passes through the **larynx**. The larynx contains the vocal cords, which make sounds.']] },
    { t: 7.4, h: 'The trachea', p: [['ig', 'From the larynx, air passes down a wide tube, the **trachea**. **Rings of cartilage** in the wall keep the trachea open.']] },
    { t: 11, h: 'The two bronchi', p: [['ig', 'The trachea divides into two **bronchi**. One **bronchus** carries air into each lung.']] },
    { t: 14.4, h: 'The bronchioles', p: [['ig', 'Inside each lung the bronchi divide again and again into smaller tubes, the **bronchioles**.']] },
    { t: 19, h: 'The alveoli', p: [['ig', 'Each bronchiole ends in tiny air sacs, the **alveoli**. A network of **capillaries** surrounds them. Here, gases are exchanged with the blood.']] }
  ];
  var M = [0, 4, 7.4, 11, 14.4, 19, 25];
  var MOTION = { 'Follow a breath of air': [3.8, 3.2, 3.4, 3.2, 4.2, 6] };
  /* how far the front of the air has come: 0 at the nostril, 1 at the end of the first leg, and so on */
  function frontAt(t) {
    /* leg 0 and the throat in step 1 */
    if (t < 4) return lerp(0, 2, ease(seg(t, .2, 3.8)));
    if (t < 7.4) return 2 + ease(seg(t, 4.1, 7.2));
    if (t < 11) return 3 + ease(seg(t, 7.5, 10.8));
    if (t < 14.4) return 4 + ease(seg(t, 11.1, 14.2));
    return 5 + ease(seg(t, 14.5, 18.6));
  }
  function dotAt(R, f) {
    var g = f - R.lag;
    if (g <= 0) return null;
    var k = Math.min(R.legs.length - 1, Math.floor(g)), u = Math.min(1, g - k);
    var p = at(R.legs[k], u);
    return [p[0] + R.off[0] * Math.min(1, g), p[1] + R.off[1] * Math.min(1, g)];
  }
  /* the part of the airway being named in each step, as a soft band along it */
  var THIN = [3, 1, 0, 1, 2, 1, 1, 3, 1, 0, 0, 1, 1, 1];        /* each branch from where it has become a bronchiole: its first part is still a wide bronchus */
  var BANDS = [[NOSE, MOUTH, THROAT], [LARYNX], [TRACHEA], BR, TIPS.map(function (P, i) { return P.slice(THIN[i]); }), []];
  function band(P) { return 'M' + P.map(function (p) { return n1(p[0]) + ' ' + n1(p[1]); }).join(' L'); }
  /* the window onto the alveoli: at the end of a bronchiole, growing out of it */
  var WC = { x: 800, y: 1120, r: 214 }, AT = { x: 926, y: 1254 };
  /* the drawing in the window: its point (205, 318), the middle of the cluster with capillaries, at the window's middle, 2.3 times larger */
  var WK = 2.3, WX = WC.x - 205 * WK, WY = WC.y - 318 * WK;
  /* the way in, along the bronchiole, then the middle of each alveolus of that cluster (measured from the drawing's own paths) */
  var INTO = [[138, 238], [150, 260], [160, 276]];
  var SACS = [[197.4, 309.1], [218.1, 326], [199.9, 339.3], [224.5, 305.2], [198.9, 282.5], [165.1, 327.3], [215.4, 289.7], [211.9, 356.3], [236, 333.4], [176.2, 309.9], [182.5, 330.7], [180.8, 289.5], [163.9, 302.2], [236.2, 293.5]];

  function labelsAt(t) {
    var it = [];
    function put(id, text, x, y, side) { it.push({ id: id, text: text, x: x, y: y, side: side }); }
    /* each name belongs to its own step: it comes as the step begins and goes as the next begins */
    if (t < 4) { put('nose', 'nose', 430, 262, 'L'); put('mouth', 'mouth', 410, 358, 'L'); }
    if (t >= 4 && t < 7.4) put('larynx', 'larynx', 572, 522, 'R');
    if (t >= 7.4 && t < 11) { put('trachea', 'trachea', 616, 760, 'R'); put('rings', 'rings of cartilage', 588, 800, 'L'); }
    if (t >= 11 && t < 14.4) { put('br', 'bronchus', 690, 1012, 'R'); put('br2', 'bronchus', 556, 996, 'L'); }
    if (t >= 14.4 && t < 19) { put('bl', 'bronchioles', 856, 1132, 'R'); put('bl2', 'bronchioles', 417, 1132, 'L'); }
    if (t >= 21.2) { put('alv', 'alveoli', WX + 224.5 * WK, WY + 305.2 * WK, 'R'); put('cap', 'capillaries', WX + 227 * WK, WY + 349 * WK, 'R'); }
    return it;
  }

  function airpath(spec) {
    var title = spec.title || 'Follow a breath of air';
    var S = K.shell(spec, 'ap', title, 'A drawing of the breathing system. Blue dots of air travel from the nose and mouth to the alveoli.', []);
    var svg = S.svg, NSV = K.NS;
    var defs = document.createElementNS(NSV, 'defs');
    defs.innerHTML = '<clipPath id="apClip"><rect x="' + WIN.x0 + '" y="' + WIN.y0 + '" width="' + (WIN.x1 - WIN.x0) + '" height="' + (WIN.y1 - WIN.y0) + '" rx="14"/></clipPath>' +
      '<clipPath id="apWin"><circle id="apWinC" cx="' + WC.x + '" cy="' + WC.y + '" r="1"/></clipPath>' +
      '<clipPath id="apCaps"><path clip-rule="evenodd" transform="translate(' + WX + ' ' + WY + ') scale(' + WK + ')" d="' + (((global.GasShapes || {})['sv-alveoli.svg'] || {}).caps || '') + '"/></clipPath>';
    svg.appendChild(defs);
    var winC = defs.querySelector('#apWinC');
    var bg = document.createElementNS(NSV, 'rect'); bg.setAttribute('class', 'ap__bg'); svg.appendChild(bg);
    var model = document.createElementNS(NSV, 'g'); svg.appendChild(model);
    var base = document.createElementNS(NSV, 'g'); base.setAttribute('clip-path', 'url(#apClip)');
    base.innerHTML = '<image href="assets/photos/sv-system.png" x="0" y="0" width="1248" height="1594"/>';
    model.appendChild(base);
    var live = document.createElementNS(NSV, 'g'); live.setAttribute('clip-path', 'url(#apClip)'); model.appendChild(live);
    var winG = document.createElementNS(NSV, 'g'); winG.setAttribute('clip-path', 'url(#apWin)'); winG.style.display = 'none';
    winG.innerHTML = '<circle cx="' + WC.x + '" cy="' + WC.y + '" r="' + WC.r + '" class="ap__winbg"/><image href="assets/photos/sv-alveoli.svg" x="' + WX + '" y="' + WY + '" width="' + 262 * WK + '" height="' + 380 * WK + '"/><g class="ap__wair"></g>' +
      '<image clip-path="url(#apCaps)" href="assets/photos/sv-alveoli.svg" x="' + WX + '" y="' + WY + '" width="' + 262 * WK + '" height="' + 380 * WK + '"/>';
    model.appendChild(winG);
    var winRing = document.createElementNS(NSV, 'circle'); winRing.setAttribute('class', 'ap__winring'); model.appendChild(winRing);
    var winAir = winG.querySelector('.ap__wair');
    var cr = document.createElementNS(NSV, 'rect');
    var gLab = document.createElementNS(NSV, 'g'); svg.appendChild(gLab);
    /* the key is drawn: one sample of what the dots are */
    S.fig.appendChild(L.h('div', 'gk', '<span class="gk__i"><svg viewBox="-5 -5 10 10" aria-hidden="true"><circle r="3.6" class="ap__air"/></svg>air</span>'));
    var lay = null, narrow = false, key = K.pinKey(S), memo = {};
    var TL = K.timeline(M, null, MOTION, title), R = TL.R, clock = TL.clock;
    var itemsAt = K.itemsOf(function () { return lay; }, function (tt) { return labelsAt(clock(tt)); }, true);

    function draw(tt, still) {
      var t = clock(tt), f = frontAt(t), stepI = 0;
      for (var i = 0; i < 6; i++) if (t >= M[i]) stepI = i;
      var out = '', op = Math.min(1, seg(t, M[stepI], M[stepI] + .5)) * (stepI < 5 ? 1 : 0);
      BANDS[stepI].forEach(function (P) { out += '<path class="ap__band' + (stepI === 4 ? ' ap__band--thin' : '') + '" d="' + band(P) + '" opacity="' + n1(op * 100) / 100 + '"/>'; });
      /* the dots fade as the window opens: the air has reached the alveoli */
      var fade = t < 19 ? 1 : 1 - seg(t, 19.2, 20.4);
      if (fade > 0) ROUTES.forEach(function (Q) {
        var p = dotAt(Q, f); if (!p) return;
        out += '<circle class="ap__air" cx="' + n1(p[0]) + '" cy="' + n1(p[1]) + '" r="' + n1(Q.sz) + '" opacity="' + n1(fade * 100) / 100 + '"/>';
      });
      live.innerHTML = out;
      /* the window: from the end of a bronchiole to its full size */
      var g = ease(seg(t, 19.2, 21.2));
      if (g > 0) {
        var r = WC.r * g, cx = lerp(AT.x, WC.x, g), cy = lerp(AT.y, WC.y, g);
        winG.style.display = '';
        winC.setAttribute('r', n1(r)); winC.setAttribute('cx', n1(cx)); winC.setAttribute('cy', n1(cy));
        winG.setAttribute('transform', 'translate(' + n1(cx - WC.x) + ' ' + n1(cy - WC.y) + ')');
        winC.setAttribute('cx', n1(WC.x)); winC.setAttribute('cy', n1(WC.y));
        winRing.setAttribute('cx', n1(cx)); winRing.setAttribute('cy', n1(cy)); winRing.setAttribute('r', n1(r));
        winRing.style.display = '';
      } else { winG.style.display = 'none'; winRing.style.display = 'none'; }
      /* air arriving in the window */
      var w = '';
      if (t > 20.7) SACS.forEach(function (q, d) {
        var k = ease(seg(t, 20.8 + d * .2, 22.5 + d * .2));
        if (k <= 0) return;
        /* down the bronchiole, then out to its own alveolus */
        var p = at(INTO.concat([q]), k);
        w += '<circle class="ap__air" cx="' + n1(WX + p[0] * WK) + '" cy="' + n1(WY + p[1] * WK) + '" r="9" style="stroke:#0B6A8C;stroke-width:3"/>';
      });
      winAir.innerHTML = w;
      var items = L.stillItems(still, itemsAt, itemsAt(tt), tt, memo, narrow + '|' + (lay ? lay.f : 0));
      gLab.innerHTML = K.names(lay, items, narrow, key, null, 14);
    }
    var sp = L.stepper({ steps: K.readerSteps(STEPS, R), end: TL.end, render: draw, flow: TL.flow, stills: K.stillsOf(STEPS, TL) });
    return K.mount(S, sp, 'ap', [], function (Dw, nar) {
      narrow = nar;
      var m = K.margins(nar, 13, 13, 110, 110);
      lay = K.frameOf(svg, bg, model, cr, WIN, false, Dw, m[0], m[1], m[2], m[3], 14);
    });
  }
  L.add('airpath', airpath);
})(window);
