/* ============================================================
   w-chest.js — the real chest, breathing (js/chest3d.js draws it).

     breath   the film "Breathing in and breathing out" (station `ventilation`, 11.1.6, 11.1.8): six steps, each held until
              Next step. The chest is one real body; what moves is worked out from its bones (chest3d-build/build_chest.py).
     GasChest.load(host)    the chest in any element, with a loading line and a way out if the browser cannot draw it

   WHAT EACH FRAME MUST BE TRUE TO (0610 11.1.8; schemes 0610/42/F/M/20 Q1(a)(ii), 0610/42/M/J/22, 0610/41/M/J/23 Q3(b),
   0610/42/O/N/24, 0610/31/O/N/10 Q3(c)):
     a muscle contracts when its FIBRES become shorter; the diaphragm's central tendon has no muscle fibres and does not contract;
     the muscle contracts first; the part it moves moves while it contracts; the volume of the thorax changes with that
     movement; the pressure follows from the volume, so it is furthest from the air outside while the volume is changing
     fastest, and equal to it again when the movement stops; the air moves only while the two pressures differ, and only from
     the higher pressure to the lower. Air here is drawn by the volume itself, so it cannot move at the wrong moment.
   ============================================================ */
(function (global) {
  'use strict';
  var L = global.CircLearn, K = global.WKit;
  if (!L || !K) return;
  var h = L.h, n1 = K.n1, seg = K.seg, ease = K.ease, lerp = K.lerp;
  var NS = K.NS;

  var ME = document.currentScript, SRC = (ME && ME.src) || '';
  var STAMP = (/[?&]v=([^&#]+)/.exec(SRC) || [])[1] || '1';
  var BASE = SRC ? SRC.replace(/[^\/?#]*(\?.*)?$/, '') : 'js/';
  var MODULE = BASE + 'chest3d.js?v=' + STAMP;

  /* the chest in an element; `say` reports a problem in plain words */
  function load(host, opts) {
    var note = h('p', 'c3__load', 'Opening the 3D chest…');
    host.appendChild(note);
    return import(MODULE).then(function (m) { return m.createChest(host, Object.assign({ stamp: STAMP }, opts || {})); })
      .then(function (A) { note.remove(); return A; })
      .catch(function (e) {
        note.textContent = 'This browser cannot draw the 3D chest. The steps and their words still work.';
        note.classList.add('c3__load--no');
        if (global.console) console.warn('chest', e);
        return null;
      });
  }

  /* a value that moves through ramps [from, to, startValue, endValue], in order */
  function ramp(R, t) {
    var v = R[0][2];
    for (var i = 0; i < R.length; i++) {
      var r = R[i];
      if (t >= r[1]) v = r[3];
      else if (t > r[0]) { v = lerp(r[2], r[3], ease(seg(t, r[0], r[1]))); break; }
      else break;
    }
    return v;
  }

  /* The three gauges under the picture: the volume of the thorax, the pressure inside it against the air outside, and the
     air. The pressure is worked out from how fast the volume is changing, so it cannot disagree with the picture. */
  function gauges(cls) {
    var box = h('div', 'c3g' + (cls ? ' ' + cls : ''),
      '<div class="c3g__row"><span class="c3g__n">Volume<span class="c3g__of"> of the thorax</span></span><span class="c3g__bar"><i class="c3g__fill" data-g="v"></i></span><b class="c3g__w" data-w="v"></b></div>' +
      '<div class="c3g__row"><span class="c3g__n">Pressure<span class="c3g__of"> in the thorax</span></span><span class="c3g__bar c3g__bar--p"><span class="c3g__zero" aria-hidden="true"></span><i class="c3g__fill c3g__fill--p" data-g="p"></i></span><b class="c3g__w" data-w="p"></b></div>' +
      '<div class="c3g__row c3g__row--air"><span class="c3g__n">Air</span><span class="c3g__air" data-air=""><i></i><i></i><i></i></span><b class="c3g__w" data-w="a"></b></div>');
    var fv = box.querySelector('[data-g="v"]'), fp = box.querySelector('[data-g="p"]'), air = box.querySelector('[data-air]');
    var wv = box.querySelector('[data-w="v"]'), wp = box.querySelector('[data-w="p"]'), wa = box.querySelector('[data-w="a"]');
    function say(e, s) { if (e.textContent !== s) e.textContent = s; }
    /* v: 0 the resting volume, 1 after a deep breath in, below 0 after a hard breath out; rate: how fast it is changing */
    function show(v, rate) {
      var moving = Math.abs(rate) > .012, inw = moving && rate > 0;
      fv.style.width = n1(Math.max(4, Math.min(100, 34 + v * 66))) + '%';
      /* the pressure's bar grows from the middle line (the air outside): to the left while it is lower, to the right while higher */
      var k = Math.max(-1, Math.min(1, -rate * 3.4));
      fp.style.left = n1(k < 0 ? 50 + k * 50 : 50) + '%';
      fp.style.width = n1(Math.abs(k) * 50) + '%';
      box.setAttribute('data-p', !moving ? 'eq' : inw ? 'low' : 'high');
      say(wv, !moving ? (v > .96 ? 'largest' : v < -.1 ? 'smallest' : v > .04 ? 'larger' : 'at rest') : inw ? 'increasing' : 'decreasing');
      say(wp, !moving ? 'equal to the pressure outside' : inw ? 'lower than the pressure outside' : 'higher than the pressure outside');
      say(wa, !moving ? 'no air moves' : inw ? 'moves into the lungs' : 'moves out of the lungs');
      air.setAttribute('data-air', !moving ? '' : inw ? 'in' : 'out');
    }
    return { el: box, show: show };
  }

  /* ---------------- how the picture looks at the muscles (the film and the station's picture share all of this) ---------------- */
  var GROUPS = ['spine', 'rib', 'sternum', 'cartilage', 'int', 'ext', 'diaphragm', 'heart', 'airway', 'lung'];
  var ALL = { spine: 1, rib: 1, sternum: 1, cartilage: 1, int: 1, ext: 1, diaphragm: 1, heart: 1, airway: 1, lung: 1 };
  var LOOKS = {
    /* the chest cut open from the front */
    whole: { view: 'cut', cut: .1, dome: .1, a: ALL },
    /* the diaphragm alone in its frame of ribs, the front of the ribs removed: the white tendon, the fibres fanning out from it */
    dome: { view: 'dome', cut: .1, dome: 1.7, near: 1, a: { spine: .5, rib: .36, sternum: .36, cartilage: .36, int: 0, ext: 0, diaphragm: 1, heart: 0, airway: 0, lung: 0 } },
    /* close to the ribs, from the side: the external muscles */
    ribs: { view: 'ribsNear', cut: 1.7, dome: 1.7, a: ALL },
    /* the same place, the external muscles hidden: the internal muscles */
    ribsIn: { view: 'ribsNear', cut: 1.7, dome: 1.7, a: Object.assign({}, ALL, { ext: 0 }) },
    /* the same place as `ribs`, the external muscles see-through: the internal muscles under them, their fibres crossing the other way */
    ribsOut: { view: 'ribsNear', cut: 1.7, dome: 1.7, a: Object.assign({}, ALL, { ext: .34 }) }
  };
  /* the fibres the picture follows in each look (the head's `fibres`: measured on the model, from bone to bone or bone to tendon) */
  var FOLLOW = { dome: [['diaphragm', 4], ['diaphragm', 3], ['diaphragm', 2]], ribs: [['ext', [3, 4]], ['ext', [2, 3]]], ribsOut: [['ext', [3, 4]], ['int', [5, 6]]], ribsIn: [['int', [5, 6]]] };
  /* a fibre of a sheet is named by the two ribs it joins */
  function fibreNo(A, g, k) {
    if (typeof k === 'number') return k;
    var L = A.head.fibres[g];
    for (var i = 0; i < L.length; i++) if (L[i].ribs && L[i].ribs[0] === k[0] && L[i].ribs[1] === k[1]) return i;
    return -1;
  }
  function sameCamera(a, b) { return LOOKS[a].view === LOOKS[b].view; }
  function smooth01(k) { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); }
  /* the picture between two looks; k 0 to 1. `cam` false leaves the camera to the reader */
  function look(A, a, b, k, cam) {
    var L0 = LOOKS[a], L1 = LOOKS[b], e = smooth01(k);
    GROUPS.forEach(function (g) {
      /* what lies inside the chest leaves early and comes back late, so that a camera move never passes through a pink haze */
      var inner = g === 'lung' || g === 'airway' || g === 'heart', f = !inner || L0.a[g] === L1.a[g] ? e : L1.a[g] > L0.a[g] ? e * e * e : 1 - (1 - e) * (1 - e) * (1 - e);
      A.opacity(g, lerp(L0.a[g], L1.a[g], f));
    });
    var c = lerp(L0.cut, L1.cut, e), dc = lerp(L0.dome, L1.dome, e);
    A.cut(true, c); A.cutDome(Math.abs(dc - c) < .001 ? null : dc);
    A.hideNear(lerp(L0.near || 0, L1.near || 0, e));
    if (cam !== false) A.viewBlend(L0.view, L1.view, k);
  }
  /* how far each muscle is contracted follows the movement itself, so that it cannot disagree with the picture. The internal intercostal
     muscles are the exception, `ci`: in an exam they contract during expiration (0610/23/M/J/17 Q20, 0610/21/O/N/23 Q22; Daniel's X rule), part
     of the way in an ordinary breath out and fully in a hard one, while the ribs are already moving down */
  function contracted(q, d, ci) { return { dia: Math.max(0, Math.min(1, d)), ext: Math.max(0, Math.min(1, q)), int: ci != null ? ci : Math.max(0, Math.min(1, -q / .35)) }; }
  function pose(A, q, d, ci) {
    var c = contracted(q, d, ci);
    A.pose(q, d); A.contract('diaphragm', c.dia); A.contract('ext', c.ext); A.contract('int', c.int);
    return c;
  }
  /* where the part was at rest: a faint outline in the two close looks, once the part has moved */
  function ghosts(A, a, b, k, q, d) {
    var e = smooth01(k), share = function (m) { return (a === m ? 1 - e : 0) + (b === m ? e : 0); };
    A.ghost('diaphragm', .62 * share('dome') * smooth01(Math.abs(d) / .22));
    A.ghost('rib', .58 * (share('ribs') + share('ribsOut') + share('ribsIn')) * smooth01(Math.abs(q) / .22));
  }
  /* the followed fibres, drawn over the muscle: a bright line between two pins, one on each thing the fibre joins. sx, sy: canvas to drawing */
  function marks(A, a, b, k, sx, sy) {
    var e = smooth01(k), out = '';
    [[a, 1 - e], [b, e]].forEach(function (pair) {
      var list = FOLLOW[pair[0]], al = pair[1];
      if (!list || al < .04 || (a === b && pair[0] === a && pair[1] === 1 - e)) return;
      list.forEach(function (l) {
        var no = fibreNo(A, l[0], l[1]); if (no < 0) return;
        var f = A.fibre(l[0], no), P = f.pts.map(function (v) { var c = A.onCanvas(v); return [n1(c[0] * sx), n1(c[1] * sy)]; });
        var d = 'M' + P.map(function (x) { return x[0] + ' ' + x[1]; }).join('L'), w = n1(3 / Math.sqrt(Math.max(.4, f.share)));
        out += '<g class="c3f' + (l[0] === 'int' ? ' c3f--int' : '') + '" opacity="' + n1(al * 100) / 100 + '"><path class="c3f__h" d="' + d + '" stroke-width="' + n1(+w + 2.6) + '"/><path class="c3f__l" d="' + d + '" stroke-width="' + w + '"/>' +
          [P[0], P[P.length - 1]].map(function (x) { return '<circle class="c3f__p" cx="' + x[0] + '" cy="' + x[1] + '" r="3.6"/>'; }).join('') + '</g>';
      });
    });
    return out;
  }

  /* The three muscles, always in view: what each is doing now, with one bundle of fibres that is short and thick while contracted and
     long and thin while relaxed. The drawn bundle is a sign, not a measure. */
  function muscles() {
    var ROWS = [['dia', 'Diaphragm'], ['ext', 'External intercostal muscles'], ['int', 'Internal intercostal muscles']];
    var box = h('div', 'c3m', ROWS.map(function (r) {
      return '<div class="c3m__i c3m__i--' + r[0] + '" data-m="' + r[0] + '"><svg class="c3m__f" viewBox="0 0 66 18" aria-hidden="true"><rect class="c3m__e" x="1" y="1" width="3" height="16" rx="1"/><path class="c3m__b"/><rect class="c3m__e c3m__e--r" y="1" width="3" height="16" rx="1"/></svg>' +
        '<span class="c3m__t"><span class="c3m__n">' + r[1] + '</span><b class="c3m__w"></b></span></div>';
    }).join(''));
    var parts = {};
    ROWS.forEach(function (r) {
      var el = box.querySelector('[data-m="' + r[0] + '"]');
      parts[r[0]] = { el: el, b: el.querySelector('.c3m__b'), e: el.querySelector('.c3m__e--r'), w: el.querySelector('.c3m__w') };
    });
    function show(c, rate) {
      ROWS.forEach(function (r) {
        var k = r[0], p = parts[k], v = c[k], m = rate ? rate[k] : 0, L = 58 - 19 * v, x1 = 4 + L, th = 2 + 1.7 * v, d = '';
        [4.6, 9, 13.4].forEach(function (y) { var bow = (y - 9) * .42 * v; d += 'M4 ' + y + 'Q' + n1(4 + L / 2) + ' ' + n1(y + bow) + ' ' + n1(x1) + ' ' + y; });
        p.b.setAttribute('d', d); p.b.setAttribute('stroke-width', n1(th));
        p.e.setAttribute('x', n1(x1));
        var word = m > .006 ? 'contracting' : m < -.006 ? 'relaxing' : v > .5 ? 'contracted' : 'relaxed';
        if (p.w.textContent !== word) p.w.textContent = word;
        p.el.setAttribute('data-s', v > .5 || m > .006 ? 'on' : 'off');
        p.el.style.setProperty('--c3m', n1(v * 100) / 100);
      });
    }
    show({ dia: 0, ext: 0, int: 0 });
    return { el: box, show: show };
  }

  /* the new space above the dome: half-way between where the top of the dome was and where it is now */
  function gapAt(A, an) {
    var g = A.groups[an[0]], j = an[1] * 3, rest = new A.THREE.Vector3(g.pos[j], g.pos[j + 1], g.pos[j + 2]);
    var c = A.onCanvas(A.vertexAt(an[0], an[1]).lerp(rest, .5));
    return { x: c[0], y: c[1] };
  }

  /* the key of the moving picture: a drawn sign for each thing on the screen now. Every sign keeps its place, so nothing jumps */
  function keyRow() {
    var ITEMS = [['pale', 'relaxed'], ['deep', 'contracted'], ['tendon', 'tendon'], ['rest', 'place at rest'], ['fib', 'one fibre']];
    var ON = { whole: ['pale', 'deep'], dome: ['pale', 'deep', 'tendon', 'rest', 'fib'], ribs: ['pale', 'deep', 'rest', 'fib'], ribsOut: ['pale', 'deep', 'rest', 'fib'], ribsIn: ['pale', 'deep', 'rest', 'fib'] };
    var box = h('div', 'c3k', ITEMS.map(function (i) { return '<span class="c3k__i" data-k="' + i[0] + '"><i class="c3k__s c3k__s--' + i[0] + '"></i>' + i[1] + '</span>'; }).join(''));
    var was = '';
    function show(m) {
      if (m === was) return; was = m;
      box.setAttribute('data-look', m);     /* the internal muscles are amber: the signs take the colour of the muscle in view */
      Array.prototype.forEach.call(box.children, function (e) { e.style.visibility = ON[m].indexOf(e.getAttribute('data-k')) >= 0 ? '' : 'hidden'; });
    }
    return { el: box, show: show };
  }

  /* where the words stand on the picture: one vertex of each part, chosen so that it stays on that part, in view, in every pose of the
     film (measured by hiding the part and seeing which pixels change: tools/pins.mjs proves it at the stop of every step) */
  function anchors(A) {
    var at = function (x0, y0, z0) { return function (x, y, z) { return -((x - x0) * (x - x0) + (y - y0) * (y - y0) + (z - z0) * (z - z0)); }; };
    return {
      /* cut open, seen from the front */
      trachea: ['airway', A.find('airway', at(.047, 1.634, .033))],
      /* lower down it, for the picture whose buttons stand at the top */
      tr2: ['airway', A.find('airway', at(.04, 1.24, .05))],
      bronchus: ['airway', A.find('airway', at(.599, .755, .302))],
      lung: ['lung', A.find('lung', at(-.87, .888, .189))],
      rib: ['rib', A.find('rib', at(1.173, .355, .117))],
      dia: ['diaphragm', A.find('diaphragm', at(1.117, -.58, -.017))],
      intL: ['int', A.find('int', at(-1.178, .506, .114))],
      extL: ['ext', A.find('ext', at(-1.05, 1.157, -.392))],
      /* seen from the side (the camera stands at the body's right) */
      sRib: ['rib', A.find('rib', at(-1.162, .237, .257))],
      sExt: ['ext', A.find('ext', at(-1.285, .126, .064))],
      sInt: ['int', A.find('int', at(-.801, -.214, .917))],
      /* the diaphragm alone */
      ten: ['diaphragm', A.find('diaphragm', at(-.56, .02, .02))],
      mus: ['diaphragm', A.find('diaphragm', at(-.98, -.62, .46))],
      /* close to the ribs */
      nExt: ['ext', A.find('ext', at(-1.02, .62, .36))],
      nRib: ['rib', A.find('rib', at(-1.0, .42, .52))],
      gap: ['diaphragm', A.find('diaphragm', at(.95, -.258, -.215))],
      lInt: ['int', A.find('int', at(-1.17, .06, .3))],
      lRib: ['rib', A.find('rib', at(-1.228, -.183, .428))]
    };
  }
  /* the middle of the trachea, top to bottom, for the air moving in it */
  function tracheaLine(A) {
    var g = A.groups.airway, levels = [2.05, 1.8, 1.55, 1.3, 1.08], out = [];
    levels.forEach(function (ly) {
      var sx = 0, sz = 0, n = 0;
      for (var i = 0; i < g.n; i++) { var j = i * 3; if (Math.abs(g.pos[j + 1] - ly) < .03 && Math.abs(g.pos[j]) < .22) { sx += g.pos[j]; sz += g.pos[j + 2]; n++; } }
      if (n) out.push([sx / n, ly, sz / n]);
    });
    return out;
  }

  /* ------------------------------------------------------------------ the film ------------------------------------- */
  var STEPS = [
    { t: 0, h: 'At rest', p: [['ig', 'The front of the chest is **removed** so that you can see inside. The **pressure** in the thorax is **equal** to **atmospheric pressure** (the air pressure outside), so **no air moves**.']] },
    { t: 3.2, h: 'Breathing in: the diaphragm contracts', p: [['ig', 'The **muscle fibres** of the diaphragm **contract**: they become **shorter** and pull the white **tendon** (strong tissue, not muscle) down, so the diaphragm **flattens**. The **volume of the thorax increases** and the **pressure decreases** below atmospheric pressure. **Air moves into the lungs**, down the **pressure gradient**, until the two pressures are **equal**.']] },
    { t: 12.6, h: 'Breathing out: the diaphragm relaxes', p: [['ig', 'The **muscle fibres relax** and become **longer**, and the diaphragm becomes **dome-shaped** (moves up). The **volume of the thorax decreases** and the **pressure increases** above atmospheric pressure, so **air moves out of the lungs**.']] },
    { t: 19, h: 'Breathing in: the ribs', p: [['ig', '**At the same time as the diaphragm**, the **fibres of the external intercostal muscles contract** and the internal intercostal muscles relax. The fibres pull each rib towards the rib above, so the **ribs move upwards and outwards**. This **also increases the volume of the thorax**.']] },
    { t: 26.6, h: 'Breathing out: the ribs', p: [['ig', 'The **external intercostal muscles relax** and the **internal intercostal muscles contract**. The internal fibres slope the opposite way, so the **ribs move downwards and inwards**. The **volume of the thorax decreases**, the **pressure increases** above atmospheric pressure, and **air moves out of the lungs**.']] },
    { t: 32.8, h: 'Breathing out hard', p: [['ig', 'To breathe out **hard**, the **internal intercostal muscles contract more strongly** and pull the **ribs further downwards and inwards**. The **volume decreases** more, so **more air is forced out**. The picture hides the external muscles so that you can see the internal muscles.']] }
  ];
  var M = [0, 3.2, 12.6, 19, 26.6, 32.8, 39.6];
  /* how long each step's picture really moves, in the model's seconds */
  var MOTION = { 'Breathing in and breathing out': [2.65, 9.25, 6.05, 7.25, 5.85, 6.65] };
  /* Two whole breaths, each watched from one place: at the diaphragm, then at the ribs. In both, the diaphragm and the external intercostal
     muscles contract TOGETHER (0610/21/O/N/21 Q20): the row of muscles under the picture shows all three at every moment */
  var RQ = [[6.8, 12.4, 0, 1], [13, 18.6, 1, 0], [21, 26.2, 0, 1], [27, 32.4, 1, 0], [34.6, 39.4, 0, -.35]];
  var RD = RQ;
  var RI = [[13, 13.6, 0, .6], [18, 18.6, .6, 0], [27, 27.6, 0, .6], [31.8, 32.4, .6, 0], [34.4, 35, 0, 1]];
  var qAt = function (t) { return ramp(RQ, t); }, dAt = function (t) { return ramp(RD, t); }, iAt = function (t) { return ramp(RI, t); };
  /* the camera's journey: which look, from when to when. The diaphragm is named and held still before it contracts, so that a reader can
     see first which part is muscle and which is tendon */
  var SHOTS = [['whole', 'dome', 3.3, 4.8], ['dome', 'ribs', 19.1, 20.7], ['ribs', 'ribsOut', 26.7, 27.7], ['ribsOut', 'ribsIn', 32.9, 33.9]];
  function shotAt(t) {
    var a = 'whole';
    for (var i = 0; i < SHOTS.length; i++) {
      var S = SHOTS[i];
      if (t >= S[3]) a = S[1];
      else if (t > S[2]) return { a: S[0], b: S[1], k: seg(t, S[2], S[3]) };
      else break;
    }
    return { a: a, b: a, k: 1 };
  }

  function breath(spec) {
    var title = spec.title || 'Breathing in and breathing out';
    var S = K.shell(spec, 'br', title, 'A real human chest, cut open from the front, breathing in and out.', []);
    var svg = S.svg;
    var bg = document.createElementNS(NS, 'rect'); bg.setAttribute('class', 'br__bg'); svg.appendChild(bg);
    var model = document.createElementNS(NS, 'g'); svg.appendChild(model);
    var cr = document.createElementNS(NS, 'rect');
    var gFib = document.createElementNS(NS, 'g'); svg.appendChild(gFib);
    var gAir = document.createElementNS(NS, 'g'); gAir.setAttribute('class', 'br__airg'); svg.appendChild(gAir);
    var gLab = document.createElementNS(NS, 'g'); svg.appendChild(gLab);
    var host = h('div', 'br__c3'); S.fig.insertBefore(host, svg);
    var KEYR = keyRow(); S.fig.appendChild(KEYR.el);
    var MS = muscles(); S.fig.appendChild(MS.el);
    var G = gauges(); S.fig.appendChild(G.el);
    var WIN = { x0: 0, x1: 600, y0: 0, y1: 640 };
    var lay = null, narrow = false, key = K.pinKey(S), A = null, AN = null;
    var T = K.timeline(M, null, MOTION, title), clock = T.clock;

    function volAt(t) { return A ? A.volumeAt(qAt(t), dAt(t)) : qAt(t) * .5 + dAt(t) * .5; }
    function labelsAt(t) {
      /* the names come once the front of the chest has been cut away */
      if (!A || t < 2.6) return [];
      /* no names while the camera moves: each would stand on the wrong part */
      var sh = shotAt(t); if (sh.k < 1 && !sameCamera(sh.a, sh.b)) return [];
      var it = [], at = sh.k < .5 ? sh.a : sh.b;
      function put(id, text, an, sd) {
        var p = A.project(an[0], an[1], false), W = A.size()[0] || 1;
        it.push({ id: id, text: text, x: p.x / W * WIN.x1, y: p.y / (A.size()[1] || 1) * WIN.y1, side: sd });
      }
      if (at === 'dome') {
        /* the last names of a breath out are those of the part at rest: nothing is moving any more */
        put('ten', t < 6.85 ? 'central tendon: does not contract' : t < 12.9 ? 'tendon: pulled down' : t < 18.62 ? 'tendon: moves up' : 'central tendon', AN.ten, 'L');
        put('mus', t < 6.85 ? 'muscle fibres' : t < 12.9 ? 'muscle fibres contract: they become shorter' : t < 18.62 ? 'muscle fibres relax: they become longer' : 'muscle fibres: relaxed', AN.mus, 'R');
        if (t < 12.9 && dAt(t) > .28) { var gp = gapAt(A, AN.gap), S0 = A.size(); it.push({ id: 'gap', text: 'more space: larger volume', x: gp.x / (S0[0] || 1) * WIN.x1, y: gp.y / (S0[1] || 1) * WIN.y1, side: 'L' }); }
      } else if (at === 'ribs') {
        put('nExt', t < 21.05 ? 'external intercostal muscles' : 'external intercostal muscles contract', AN.nExt, 'L');
        put('nRib', t < 21.05 ? 'rib' : 'ribs: upwards and outwards', AN.nRib, 'R');
      } else if (at === 'ribsOut') {
        /* at rest again, one name for both layers: nothing is moving any more */
        if (t < 32.42) put('nExt', 'external intercostal muscles relax', AN.nExt, 'L');
        put('lInt', t < 32.42 ? 'internal intercostal muscles contract' : 'intercostal muscles: relaxed', AN.lInt, 'L');
        put('nRib', t < 32.42 ? 'ribs: downwards and inwards' : 'rib', AN.nRib, 'R');
      } else if (at === 'ribsIn') {
        put('lInt', t < 34.45 ? 'internal intercostal muscles' : 'internal intercostal muscles contract', AN.lInt, 'L');
        put('nRib', t < 34.6 ? 'rib' : 'ribs: further downwards and inwards', AN.nRib, 'R');
      } else {
        put('trachea', 'trachea', AN.trachea, 'R');
        put('bronchus', 'bronchus', AN.bronchus, 'R');
        put('lung', 'lung', AN.lung, 'L');
        put('rib', 'rib', AN.rib, 'R');
        put('dia', 'diaphragm', AN.dia, 'R');
      }
      return it;
    }

    /* the air: dots in the trachea whose place is the volume itself, so they move exactly when and as far as the volume changes */
    var line = null;
    function airDots(v) {
      if (!A || !line || line.length < 2) return '';
      var cam = A.camera, W = A.size()[0], H = A.size()[1]; if (!W) return '';
      var P = line.map(function (p) { var q = new A.THREE.Vector3(p[0], p[1], p[2]).project(cam); return [(q.x + 1) / 2 * WIN.x1, (1 - q.y) / 2 * WIN.y1]; });
      var out = '', n = 13;
      for (var i = 0; i < n; i++) {
        var u = ((i + .5) / n + v * 1.6) % 1; if (u < 0) u += 1;
        var a = u * (P.length - 1), k = Math.min(P.length - 2, Math.floor(a)), f = a - k;
        var x = lerp(P[k][0], P[k + 1][0], f) + Math.sin(i * 2.4) * 5, y = lerp(P[k][1], P[k + 1][1], f);
        var edge = Math.min(u, 1 - u) * 9, op = Math.min(1, edge);
        out += '<circle class="br__air" cx="' + n1(x) + '" cy="' + n1(y) + '" r="3.1" opacity="' + n1(op * 100) / 100 + '"/>';
      }
      return out;
    }

    var memo = {};
    var itemsAt = K.itemsOf(function () { return lay; }, function (tt) { var t = clock(tt); return labelsAt(t); }, true);
    function draw(tt, still) {
      var t = clock(tt);
      var q = qAt(t), d = dAt(t), ci = iAt(t), sh = shotAt(t);
      var dt = .04, rate = (volAt(t + dt) - volAt(t - dt)) / (2 * dt);
      G.show(volAt(t), rate);
      var c = contracted(q, d, ci), c0 = contracted(qAt(t - dt), dAt(t - dt), iAt(t - dt)), c1 = contracted(qAt(t + dt), dAt(t + dt), iAt(t + dt));
      MS.show(c, { dia: (c1.dia - c0.dia) / (2 * dt), ext: (c1.ext - c0.ext) / (2 * dt), int: (c1.int - c0.int) / (2 * dt) });
      KEYR.show(sh.k < .5 ? sh.a : sh.b);
      if (!A) return;
      pose(A, q, d, ci);
      look(A, sh.a, sh.b, sh.k);
      /* step 1: the front of the chest is cut away so that you can see inside */
      if (t < 3.2) A.cut(true, lerp(1.05, .1, ease(seg(t, .35, 2.75))));
      ghosts(A, sh.a, sh.b, sh.k, q, d);
      A.now();
      var S_ = A.size();
      gFib.innerHTML = S_[0] ? marks(A, sh.a, sh.b, sh.k, WIN.x1 / S_[0], WIN.y1 / S_[1]) : '';
      gAir.innerHTML = airDots(volAt(t));
      /* the air is inside the trachea: it is drawn only while the chest is open from the front */
      var open = (sh.a === 'whole' ? 1 - smooth01(sh.k) : 0) + (sh.b === 'whole' ? smooth01(sh.k) : 0);
      if (sh.a === 'whole' && sh.b === 'whole') open = 1;
      gAir.style.opacity = String(n1(open * 100) / 100);
      var items = L.stillItems(still, itemsAt, itemsAt(tt), tt, memo, narrow + '|' + (lay ? lay.f : 0));
      gLab.innerHTML = K.names(lay, items, narrow, key, null, 14);
    }
    var sp = L.stepper({ steps: K.readerSteps(STEPS, T.R), end: T.end, render: draw, flow: T.flow, stills: K.stillsOf(STEPS, T) });
    K.mount(S, sp, 'br', [], function (D, nar, room) {
      narrow = nar;
      /* in the picture's column the chest fills the whole frame, the names over its two sides and the key on it (Daniel, 23 Nov 2026: "the 3D space is
         very short and not really big"). The names used to take half of the width, and left the chest 262 by 279 px on a laptop */
      var full = !!room && !nar;
      KEYR.el.classList.toggle('c3k--over', full);
      if (full) {
        var w = Math.round(D), band = Math.max(104, Math.round(w * .22));
        WIN.x1 = w; WIN.y1 = room;
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + room);
        model.removeAttribute('transform');
        lay = { tall: false, win: WIN, f: 13.5, mL: band + 12, mR: band + 12, inL: band, inR: w - band, inB: 40, vb: { x: 0, y: 0, w: w, h: room, bw: w, bh: room }, to: function (x, y) { return [x, y]; } };
        host.style.left = '0'; host.style.top = '0'; host.style.width = w + 'px'; host.style.height = room + 'px';
        KEYR.el.style.top = (room - 32) + 'px';
      } else {
        WIN.x1 = 600; WIN.y1 = 640;
        KEYR.el.style.top = '';
        var m = K.margins(nar, 22, 18, 130, 130);
        lay = K.frameOf(svg, bg, model, cr, WIN, false, D, m[0], m[1], m[2], m[3], 13.5);
        model.removeAttribute('transform');
        var s = D / lay.vb.w;
        host.style.left = n1(-lay.vb.x * s) + 'px'; host.style.top = n1(-lay.vb.y * s) + 'px';
        host.style.width = n1(lay.vb.bw * s) + 'px'; host.style.height = n1(lay.vb.bh * s) + 'px';
      }
      if (A) { A.resize(); }
    });
    /* the chest loads only when this card is opened */
    var started = false;
    function begin() {
      if (started) return; started = true;
      load(host, { keep: true }).then(function (a) {
        if (!a) return;
        A = a; A.manual(true); A.controls.enabled = false;
        AN = anchors(A); line = tracheaLine(A);
        if (S.box.isConnected) { A.resize(); sp.paint(sp.time()); }
      });
    }
    var io = global.IntersectionObserver ? new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { begin(); io.disconnect(); } }) : null;
    if (io) io.observe(S.fig); else begin();
    S.box.__chest = function () { return A; };
    return S.box;
  }
  L.add('breath', breath);

  global.GasChest = { load: load, gauges: gauges, ramp: ramp, anchors: anchors, tracheaLine: tracheaLine, look: look, pose: pose, ghosts: ghosts, marks: marks, muscles: muscles, keyRow: keyRow, contracted: contracted, gapAt: gapAt, sameCamera: sameCamera };
})(window);
