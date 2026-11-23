/* ============================================================
   w-path.js — "Follow a breath of air" (station `system`, 11.1.2): the air from the nose or mouth to the alveoli, on Servier
   Medical Art's drawing of the whole breathing system (CC BY 4.0). Six steps, each held until Next step.

   The air's way through the bronchi and bronchioles (BR, TIPS) runs along the middle of the drawing's real tubes, written by
   tools/trace-routes.py, so the air never crosses a wall or the lung between the tubes (Daniel, 23 Nov 2026: "Same for bronchus or
   bronchioles"). Each step lights its part by the part's exact outline. The front of the air reaches each part in its own step; the
   dots behind it follow.
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
  var BR = [[[618,940],[657,982],[709,1022],[731,1033],[748,1034]],[[618,940],[581,983],[538,1012],[527,1030]]];
  /* bronchioles, each along a branch of the drawing */
  var TIPS = [
    [[748,1034],[740,1050],[769,1110],[796,1151],[796,1158],[789,1178],[789,1187],[794,1201],[796,1211],[800,1223],[798,1241],[807,1255],[811,1266],[811,1273]],
    [[748,1034],[775,1025],[781,1022],[795,1000],[796,986],[779,952],[778,936],[769,925],[757,902],[752,861],[744,835],[740,813],[731,802],[717,780],[705,766]],
    [[748,1034],[779,1024],[795,1001],[796,985],[779,952],[779,937],[787,925],[793,909],[810,897],[829,888],[837,882],[841,864],[854,839]],
    [[748,1034],[779,1024],[793,1004],[799,999],[827,998],[853,982],[867,975],[872,976],[881,980],[903,996],[919,1003]],
    [[748,1034],[772,1026],[782,1027],[800,1044],[811,1058],[821,1065],[833,1080],[841,1086],[851,1086],[873,1092],[888,1091],[896,1094],[904,1094],[918,1087],[930,1076]],
    [[748,1034],[740,1051],[773,1117],[788,1139],[797,1148],[803,1149],[820,1146],[838,1150],[846,1150],[861,1141],[891,1137],[906,1123],[924,1114],[933,1113]],
    [[748,1034],[740,1051],[769,1110],[799,1155],[855,1216],[859,1218],[876,1218],[889,1228],[917,1240],[939,1263],[941,1268]],
    [[527,1030],[510,1069],[494,1086],[484,1109],[470,1126],[458,1162],[459,1184],[455,1215],[471,1245],[480,1253]],
    [[527,1030],[532,1019],[532,1013],[530,1009],[521,1002],[500,992],[488,984],[479,975],[478,968],[487,936],[500,920],[500,905],[504,883],[528,856],[534,846],[543,837],[552,817]],
    [[527,1030],[532,1018],[532,1012],[528,1007],[519,1000],[493,987],[469,966],[450,952],[427,952],[399,958],[382,970],[356,976],[338,991],[330,993]],
    [[527,1030],[532,1019],[532,1012],[529,1008],[519,1000],[497,990],[476,975],[468,976],[446,986],[431,997],[420,1004],[405,1000],[387,1000],[366,1005]],
    [[527,1030],[532,1018],[532,1012],[528,1007],[519,1000],[497,990],[479,976],[472,975],[444,987],[422,1003],[419,1007],[412,1029],[400,1039],[394,1041],[381,1041],[348,1051],[334,1046],[324,1046],[320,1043]],
    [[527,1030],[510,1069],[494,1086],[484,1109],[470,1126],[464,1147],[458,1161],[435,1173],[406,1199],[392,1204],[385,1213]],
    [[527,1030],[510,1069],[494,1086],[487,1105],[477,1118],[471,1122],[447,1122],[432,1127],[399,1147],[376,1167],[370,1206],[362,1216],[357,1246],[346,1265],[353,1297]]
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
      ROUTES.push({ legs: [head, THROAT, LARYNX, TRACHEA, br, tip], lag: r() * .78, off: [(r() - .5) * 11, (r() - .5) * 11], sz: 6.4 + r() * 2 });
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
    /* in the last leg the tube becomes narrow: the dot moves to its middle and becomes smaller, so it stays inside the bronchiole */
    var nar = k < 5 ? 0 : ease(seg(u, .12, .62)), side = Math.min(1, g) * (1 - nar);
    return [p[0] + R.off[0] * side, p[1] + R.off[1] * side, lerp(R.sz, 3.4, nar)];
  }
  /* the part of the airway named in each step stays bright, by its exact outline (the same outlines as the station's picture), and the rest of the
     drawing dims. The throat has no outline of its own, so in step 1 it stays bright along its path */
  var PARTS = [['nose', 'mouth'], ['larynx'], ['trachea'], ['bronchi'], ['bronchioles'], []];
  function partD(i) { var S = (global.GasShapes || {})['sv-system.png'] || {}; return PARTS[i].map(function (k) { return S[k] || ''; }).join(''); }
  function band(P) { return 'M' + P.map(function (p) { return n1(p[0]) + ' ' + n1(p[1]); }).join(' L'); }
  /* the window onto the alveoli: at the end of a bronchiole, growing out of it */
  var WC = { x: 800, y: 1120, r: 214 }, AT = { x: 941, y: 1268 };
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
    if (t >= 14.4 && t < 19) { put('bl', 'bronchioles', 866, 1140, 'R'); put('bl2', 'bronchioles', 414, 1095, 'L'); }
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
      '<mask id="apPart" maskUnits="userSpaceOnUse" x="' + WIN.x0 + '" y="' + WIN.y0 + '" width="' + (WIN.x1 - WIN.x0) + '" height="' + (WIN.y1 - WIN.y0) + '"><rect x="' + WIN.x0 + '" y="' + WIN.y0 + '" width="' + (WIN.x1 - WIN.x0) + '" height="' + (WIN.y1 - WIN.y0) + '" fill="#fff"/>' +
      '<path id="apPartA" fill="#000" fill-rule="evenodd"/><path id="apPartB" fill="#000" fill-rule="evenodd"/><path id="apPartT" fill="none" stroke="#000" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/></mask>' +
      '<clipPath id="apCaps"><path clip-rule="evenodd" transform="translate(' + WX + ' ' + WY + ') scale(' + WK + ')" d="' + (((global.GasShapes || {})['sv-alveoli.svg'] || {}).caps || '') + '"/></clipPath>';
    svg.appendChild(defs);
    var winC = defs.querySelector('#apWinC');
    var bg = document.createElementNS(NSV, 'rect'); bg.setAttribute('class', 'ap__bg'); svg.appendChild(bg);
    var model = document.createElementNS(NSV, 'g'); svg.appendChild(model);
    var base = document.createElementNS(NSV, 'g'); base.setAttribute('clip-path', 'url(#apClip)');
    base.innerHTML = '<image href="assets/photos/sv-system.png" x="0" y="0" width="1248" height="1594"/>';
    model.appendChild(base);
    var veil = document.createElementNS(NSV, 'rect'); veil.setAttribute('class', 'ap__veil'); veil.setAttribute('x', WIN.x0); veil.setAttribute('y', WIN.y0);
    veil.setAttribute('width', WIN.x1 - WIN.x0); veil.setAttribute('height', WIN.y1 - WIN.y0); veil.setAttribute('rx', 14); veil.setAttribute('mask', 'url(#apPart)'); model.appendChild(veil);
    var partA = defs.querySelector('#apPartA'), partB = defs.querySelector('#apPartB'), partT = defs.querySelector('#apPartT'), litStep = -1;
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
      var out = '', kLit = ease(seg(t, M[stepI], M[stepI] + .5));
      /* the part of this step brightens as the part of the last step dims, so the picture never flashes */
      if (litStep !== stepI) {
        litStep = stepI;
        partA.setAttribute('d', stepI ? partD(stepI - 1) : '');
        partB.setAttribute('d', partD(stepI));
        partT.setAttribute('d', stepI < 2 ? band(THROAT) : '');
      }
      partA.setAttribute('opacity', n1((1 - kLit) * 100) / 100);
      partB.setAttribute('opacity', n1(kLit * 100) / 100);
      partT.setAttribute('opacity', n1((stepI === 0 ? kLit : 1 - kLit) * 100) / 100);
      veil.setAttribute('opacity', n1((stepI === 0 ? ease(seg(t, .1, .6)) : stepI < 5 ? 1 : 1 - kLit) * 100) / 100);
      /* the dots fade as the window opens: the air has reached the alveoli */
      var fade = t < 19 ? 1 : 1 - seg(t, 19.2, 20.4);
      if (fade > 0) ROUTES.forEach(function (Q) {
        var p = dotAt(Q, f); if (!p) return;
        out += '<circle class="ap__air" cx="' + n1(p[0]) + '" cy="' + n1(p[1]) + '" r="' + n1(p[2]) + '" opacity="' + n1(fade * 100) / 100 + '"/>';
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
