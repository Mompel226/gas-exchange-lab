/* ============================================================
   w-chest.js — the real chest, breathing (js/chest3d.js draws it).

     breath   the film "Breathing in and breathing out" (station `ventilation`, 11.1.6, 11.1.8): six steps, each held until
              Next step. The chest is one real body; what moves is worked out from its bones (chest3d-build/build_chest.py).
     GasChest.load(host)    the chest in any element, with a loading line and a way out if the browser cannot draw it

   WHAT EACH FRAME MUST BE TRUE TO (0610 11.1.8; schemes 0610/42/F/M/20 Q1(a)(ii), 0610/42/M/J/22, 0610/41/M/J/23 Q3(b),
   0610/42/O/N/24, 0610/31/O/N/10 Q3(c)):
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
      '<div class="c3g__row"><span class="c3g__n">Volume of the thorax</span><span class="c3g__bar"><i class="c3g__fill" data-g="v"></i></span><b class="c3g__w" data-w="v"></b></div>' +
      '<div class="c3g__row"><span class="c3g__n">Pressure in the thorax</span><span class="c3g__bar c3g__bar--p"><span class="c3g__zero" aria-hidden="true"></span><i class="c3g__fill c3g__fill--p" data-g="p"></i></span><b class="c3g__w" data-w="p"></b></div>' +
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

  /* where the words stand on the picture: one vertex of each part, chosen so that it stays on that part, in view, in every pose of the
     film (measured by hiding the part and seeing which pixels change: tools/pins.mjs proves it at the stop of every step) */
  function anchors(A) {
    var at = function (x0, y0, z0) { return function (x, y, z) { return -((x - x0) * (x - x0) + (y - y0) * (y - y0) + (z - z0) * (z - z0)); }; };
    return {
      /* cut open, seen from the front */
      trachea: ['airway', A.find('airway', at(.047, 1.634, .033))],
      bronchus: ['airway', A.find('airway', at(.599, .755, .302))],
      lung: ['lung', A.find('lung', at(-.87, .888, .189))],
      rib: ['rib', A.find('rib', at(1.173, .355, .117))],
      dia: ['diaphragm', A.find('diaphragm', at(1.117, -.58, -.017))],
      intL: ['int', A.find('int', at(-1.178, .506, .114))],
      extL: ['ext', A.find('ext', at(-1.05, 1.157, -.392))],
      /* seen from the side (the camera stands at the body's right) */
      sRib: ['rib', A.find('rib', at(-1.162, .237, .257))],
      sExt: ['ext', A.find('ext', at(-1.285, .126, .064))],
      sInt: ['int', A.find('int', at(-.801, -.214, .917))]
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
    { t: 0, h: 'At rest', p: [['ig', 'The front of the chest is **removed** so that you can see inside. The **pressure** in the thorax is **equal** to the air pressure outside, so **no air moves**.']] },
    { t: 3.2, h: 'The diaphragm contracts', p: [['ig', 'The **diaphragm** **contracts** and **flattens** (moves down). The **external intercostal muscles contract at the same time**: the next step shows them. The **volume of the thorax increases**, so the **pressure decreases** below the air pressure outside. **Air moves into the lungs**.']] },
    { t: 9.2, h: 'At the same time: the external intercostal muscles', p: [['ig', '**At the same time as the diaphragm**, the **external intercostal muscles contract** and the **internal intercostal muscles relax**. The **ribs move upwards and outwards**. The movement of the ribs **also increases the volume**, so the **pressure stays below** the air pressure outside and **air continues to move in**.']] },
    { t: 15.6, h: 'Air stops moving', p: [['ig', 'The diaphragm and the external intercostal muscles stay contracted, and the volume stays large. The **pressure** in the thorax is **equal** to the air pressure outside again, so **no more air moves**.']] },
    { t: 18.8, h: 'The muscles relax: breathing out', p: [['ig', 'The **diaphragm relaxes** and becomes **dome-shaped** (moves up). The **external intercostal muscles relax** and the **ribs move downwards and inwards**. The **volume decreases**, the **pressure increases** above the air pressure outside, and **air moves out of the lungs**.']] },
    { t: 25, h: 'Breathing out hard', p: [['ig', 'To breathe out **hard**, the **internal intercostal muscles contract** and pull the **ribs further downwards and inwards**. The **volume decreases** more, so **more air is forced out**.']] }
  ];
  var M = [0, 3.2, 9.2, 15.6, 18.8, 25, 30.4];
  /* how long each step's picture really moves, in the model's seconds */
  var MOTION = { 'Breathing in and breathing out': [2.65, 6, 6.4, 1.5, 6.2, 5.4] };
  /* the diaphragm and the external intercostal muscles contract TOGETHER (0610/21/O/N/21 Q20): one breath in, across steps 2 and 3 */
  var RQ = [[3.8, 16.4, 0, 1], [19.2, 25.4, 1, 0], [25.4, 31, 0, -.35]];
  var RD = [[3.8, 16.4, 0, 1], [19.2, 25.4, 1, 0], [25.4, 31, 0, -.35]];
  var qAt = function (t) { return ramp(RQ, t); }, dAt = function (t) { return ramp(RD, t); };
  /* the camera: cut open and from the front; to the side for the ribs; and back */
  var RV = [[9.3, 10.6, 0, 1], [15.7, 17.1, 1, 0]];
  var vAt = function (t) { return ramp(RV, t); };
  function glowAt(t) {
    /* a muscle glows while it is contracted, and more while it is shortening */
    var dia = t > 3.5 && t < 19.2 ? (t < 3.9 ? (t - 3.5) / .4 : 1) : t >= 19.2 && t < 19.6 ? 1 - (t - 19.2) / .4 : 0;
    var ext = t > 3.5 && t < 19.2 ? (t < 3.9 ? (t - 3.5) / .4 : 1) : t >= 19.2 && t < 19.6 ? 1 - (t - 19.2) / .4 : 0;
    var int = t > 25 ? Math.min(1, (t - 25) / .4) : 0;
    return { dia: dia, ext: ext, int: int };
  }

  function breath(spec) {
    var title = spec.title || 'Breathing in and breathing out';
    var S = K.shell(spec, 'br', title, 'A real human chest, cut open from the front, breathing in and out.', []);
    var svg = S.svg;
    var bg = document.createElementNS(NS, 'rect'); bg.setAttribute('class', 'br__bg'); svg.appendChild(bg);
    var model = document.createElementNS(NS, 'g'); svg.appendChild(model);
    var cr = document.createElementNS(NS, 'rect');
    var gAir = document.createElementNS(NS, 'g'); gAir.setAttribute('class', 'br__airg'); svg.appendChild(gAir);
    var gLab = document.createElementNS(NS, 'g'); svg.appendChild(gLab);
    var host = h('div', 'br__c3'); S.fig.insertBefore(host, svg);
    var G = gauges(); S.fig.appendChild(G.el);
    var WIN = { x0: 0, x1: 600, y0: 0, y1: 640 };
    var lay = null, narrow = false, key = K.pinKey(S), A = null, AN = null;
    var T = K.timeline(M, null, MOTION, title), clock = T.clock;

    function volAt(t) { return A ? A.volumeAt(qAt(t), dAt(t)) : qAt(t) * .5 + dAt(t) * .5; }
    function labelsAt(t, v) {
      /* the names come once the front of the chest has been cut away */
      if (!A || t < 2.6) return [];
      /* no names while the camera turns: each would stand on the wrong part */
      if (v > .03 && v < .97) return [];
      var it = [], side = v > .5;
      function put(id, text, an, sd) {
        var p = A.project(an[0], an[1], false), W = A.size()[0] || 1;
        it.push({ id: id, text: text, x: p.x / W * WIN.x1, y: p.y / (A.size()[1] || 1) * WIN.y1, side: sd });
      }
      if (!side) {
        put('trachea', 'trachea', AN.trachea, 'R');
        put('bronchus', 'bronchus', AN.bronchus, 'R');
        put('lung', 'lung', AN.lung, 'L');
        /* each name says what its part is doing now: it changes as the movement starts and as it stops */
        put('rib', t >= 19.3 && t < 25.4 ? 'ribs: downwards and inwards' : t >= 25.4 ? 'ribs: further downwards and inwards' : 'rib', AN.rib, 'R');
        put('dia', t > 3.7 && t < 16.4 ? 'diaphragm: contracts and flattens' : t >= 16.4 && t < 19.3 ? 'diaphragm: contracted, flat' : t >= 19.3 && t < 25.4 ? 'diaphragm: relaxes and moves up' : t >= 25.4 ? 'diaphragm: relaxed, dome-shaped' : 'diaphragm', AN.dia, 'R');
        if (t > 3.7 && t < 9.2) put('extF', 'external intercostal muscles contract', AN.extL, 'L');
        if (t >= 19.3 && t < 25.2) put('extF', 'external intercostal muscles relax', AN.extL, 'L');
        if (t > 25.2) put('int', 'internal intercostal muscles contract', AN.intL, 'L');
      } else {
        put('sRib', 'ribs: upwards and outwards', AN.sRib, 'L');
        put('sExt', 'external intercostal muscles contract', AN.sExt, 'L');
        put('sInt', 'internal intercostal muscles relax', AN.sInt, 'R');
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
    var itemsAt = K.itemsOf(function () { return lay; }, function (tt) { var t = clock(tt); return labelsAt(t, vAt(t)); }, true);
    function draw(tt, still) {
      var t = clock(tt);
      var q = qAt(t), d = dAt(t), ve = vAt(t);
      var dt = .04, rate = (volAt(t + dt) - volAt(t - dt)) / (2 * dt);
      G.show(volAt(t), rate);
      if (!A) return;
      A.pose(q, d);
      /* step 1: the front of the chest is cut away so that you can see inside; the cut stays there until the camera goes to the side */
      A.cut(true, t < 3.2 ? lerp(1.05, .1, ease(seg(t, .35, 2.75))) : lerp(.1, 1.7, ve));
      var g = glowAt(t);
      A.glow('diaphragm', g.dia * .34); A.glow('ext', g.ext * .4); A.glow('int', g.int * .46);
      A.tone('diaphragm', ve > .5 ? 1 : lerp(.62, 1, g.dia));
      A.viewBlend('cut', 'side', ve);
      A.now();
      gAir.innerHTML = airDots(volAt(t));
      /* the air is inside the trachea: it is not drawn over the closed ribs in the side view */
      gAir.style.opacity = String(n1((1 - seg(ve, 0, .4)) * 100) / 100);
      var items = L.stillItems(still, itemsAt, itemsAt(tt), tt, memo, narrow + '|' + (lay ? lay.f : 0));
      gLab.innerHTML = K.names(lay, items, narrow, key, null, 14);
    }
    var sp = L.stepper({ steps: K.readerSteps(STEPS, T.R), end: T.end, render: draw, flow: T.flow, stills: K.stillsOf(STEPS, T) });
    K.mount(S, sp, 'br', [], function (D, nar) {
      narrow = nar;
      var m = K.margins(nar, 22, 18, 130, 130);
      lay = K.frameOf(svg, bg, model, cr, WIN, false, D, m[0], m[1], m[2], m[3], 13.5);
      model.removeAttribute('transform');
      var s = D / lay.vb.w;
      host.style.left = n1(-lay.vb.x * s) + 'px'; host.style.top = n1(-lay.vb.y * s) + 'px';
      host.style.width = n1(lay.vb.bw * s) + 'px'; host.style.height = n1(lay.vb.bh * s) + 'px';
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
        A.opacity('heart', 1);
        if (S.box.isConnected) { A.resize(); sp.paint(sp.time()); }
      });
    }
    var io = global.IntersectionObserver ? new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { begin(); io.disconnect(); } }) : null;
    if (io) io.observe(S.fig); else begin();
    S.box.__chest = function () { return A; };
    return S.box;
  }
  L.add('breath', breath);

  global.GasChest = { load: load, gauges: gauges, ramp: ramp, anchors: anchors, tracheaLine: tracheaLine };
})(window);
