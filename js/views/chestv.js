/* ============================================================
   views/chestv.js — the two station pictures built on the real chest (js/chest3d.js).

     system    station 1: Servier's whole breathing system and its alveoli (labelled figures), and the real chest in 3D, which a
               reader can turn and zoom. Opening a card shows that part in the picture that shows it best.
     breathe   station 5: the chest breathing under the reader's own finger: hold to breathe in, let go to breathe out, hold the
               second button to breathe out hard. The gauges follow what the chest does.

   The chest loads only when the picture that holds it is first shown.
   ============================================================ */
(function (global) {
  'use strict';
  var Views = global.Views;
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function btn(cls, text) { var b = h('button', cls, text); b.type = 'button'; return b; }
  var NS = 'http://www.w3.org/2000/svg';
  function still() { return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches); }

  /* the names on the chest: ruled level lines from the picture's sides, each ending ON its part (CircLearn.labels) */
  function namer(stage) {
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'c3v__svg'); svg.setAttribute('aria-hidden', 'true');
    stage.appendChild(svg);
    return function draw(A, list) {
      if (!A) { svg.innerHTML = ''; return; }
      var s = A.size(), W = s[0], H = s[1]; if (!W) return;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var f = W < 420 ? 12.5 : 13.5, band = Math.max(86, W * .2);
      var items = list.map(function (q) {
        var p = A.project(q.g, q.i, false);
        return { id: q.id, text: q.text, x: p.x, y: p.y, side: q.side || (p.x < W / 2 ? 'L' : 'R') };
      });
      var o = { left: band, right: W - band, font: f, top: 26, bottom: H - 8, gap: 5 };
      svg.innerHTML = global.CircLearn.labels(Object.assign({}, o, { items: items.filter(function (q) { return q.side === 'L'; }), width: band - 14 })) +
        global.CircLearn.labels(Object.assign({}, o, { items: items.filter(function (q) { return q.side === 'R'; }), width: band - 14 }));
    };
  }

  /* ------------------------------------------------------------------ station 1 ------------------------------------ */
  var CREDIT_S = 'Servier Medical Art, CC BY 4.0, adapted';
  var CREDIT_B = 'BodyParts3D, The Database Center for Life Science, CC BY-SA 2.1 JP';
  var FLAT = {
    names: { lungs: 'lung', larynx: 'larynx', trachea: 'trachea', cartilage: 'rings of cartilage', bronchi: 'bronchus', bronchioles: 'bronchioles', alveoli: 'alveoli', caps: 'capillaries', nose: 'nose', mouth: 'mouth' },
    modes: [
      { id: 'whole', name: 'The whole system', img: 'sv-system.png', iw: 1248, ih: 1594, w: 1248, h: 1594,
        alt: 'A drawing of a person from the head to the waist with the airways and lungs shown: nose, mouth, larynx, trachea, two bronchi, and bronchioles branching inside each lung.',
        pts: { nose: [430, 268, 'L'], mouth: [400, 432, 'L'], larynx: [566, 522, 'L'], cartilage: [588, 790, 'L'], lungs: [360, 1010, 'L'], trachea: [616, 690, 'R'], bronchi: [684, 1002, 'R'], bronchioles: [846, 1150, 'R'] },
        say: 'This is how an exam diagram shows the breathing system', credit: CREDIT_S },
      { id: 'alv', name: 'The alveoli', img: 'sv-alveoli.svg', iw: 262, ih: 380, w: 262, h: 380,
        alt: 'A drawing of a bronchiole that branches and ends in clusters of round air sacs, the alveoli. One cluster is covered with a network of red and blue capillaries.',
        pts: { bronchioles: [58, 108, 'L'], alveoli: [84, 310, 'L'], caps: [200, 322, 'R'] },
        say: 'A bronchiole ends in alveoli. Capillaries surround them: one cluster is drawn with its capillaries', credit: CREDIT_S }
    ]
  };
  /* what each card lights in the real chest */
  var IN3D = {
    ribs: { lit: ['rib', 'sternum', 'cartilage'], name: 'ribs', view: 'turned', at: function (A) { return ['rib', A.find('rib', function (x, y, z) { return -((x - 1.156) * (x - 1.156) + (y - .572) * (y - .572) + (z - .003) * (z - .003)); })]; }, side: 'R' },
    intercostal: { lit: ['ext', 'int'], name: 'intercostal muscles', view: 'turned', at: function (A) { return ['ext', A.find('ext', function (x, y, z) { return -x * .5 + z * .2 - Math.abs(y - .2) * 2; })]; }, side: 'L' },
    diaphragm: { lit: ['diaphragm'], name: 'diaphragm', view: 'low', hide: ['ext', 'int'], at: function (A) { return ['diaphragm', A.find('diaphragm', function (x, y, z) { return z * .7 - Math.abs(y + .45) * 1.4 - Math.abs(x - .55) * .7; })]; }, side: 'R' }
  };
  var GROUPS = ['spine', 'rib', 'sternum', 'cartilage', 'int', 'ext', 'diaphragm', 'heart', 'airway', 'lung'];

  function system(spec, ctx) {
    var fig = null, api = null;
    var inner = { station: ctx.station, pick: ctx.pick, caption: function () { if (!fig || !api) return; api.say = fig.say; api.credit = fig.credit; ctx.caption(); } };
    fig = Views.make('figure', Object.assign({ parts: spec.parts }, FLAT), inner);
    var root = fig.el, bar = root.querySelector('.cellv__bar'), stage = root.querySelector('.cellv__stage');
    var b3 = h('button', 'cellv__mode', 'The real chest in 3D'); b3.type = 'button'; b3.setAttribute('aria-pressed', 'false');
    bar.appendChild(b3);
    var d3 = h('div', 'sysv__d3 c3v'); d3.hidden = true;
    var st3 = h('div', 'c3v__stage'), host = h('div', 'c3v__c3'); st3.appendChild(host);
    var hint = h('p', 'c3v__hint', 'Drag to turn. Scroll or pinch to zoom. Press a part to open its card.');
    var bar3 = h('div', 'c3v__bar');
    d3.appendChild(st3); d3.appendChild(hint); d3.appendChild(bar3); stage.appendChild(d3);
    var name3 = namer(st3), A = null, loading = false, lit = null, on3 = false;
    /* the layers a reader can take off, from the outside in */
    var LAYERS = [['Ribs', ['rib', 'sternum', 'cartilage']], ['Muscles', ['ext', 'int']], ['Lungs', ['lung']], ['Airways', ['airway']]], shown = { 0: 1, 1: 1, 2: 1, 3: 1 };
    LAYERS.forEach(function (l, i) {
      var b = btn('c3v__b', l[0]); b.setAttribute('aria-pressed', 'true');
      b.addEventListener('click', function () { shown[i] = shown[i] ? 0 : 1; b.setAttribute('aria-pressed', shown[i] ? 'true' : 'false'); paint(); });
      bar3.appendChild(b);
    });
    function opacityOf(g) {
      var a = 1;
      LAYERS.forEach(function (l, i) { if (l[1].indexOf(g) >= 0 && !shown[i]) a = 0; });
      return a;
    }
    function paint() {
      if (!A) return;
      var m = lit && IN3D[lit];
      GROUPS.forEach(function (g) {
        var a = opacityOf(g);
        if (m && (m.hide || []).indexOf(g) >= 0) a = 0;
        A.opacity(g, a);
        A.tone(g, !m || m.lit.indexOf(g) >= 0 ? 1 : .42);
        A.glow(g, m && m.lit.indexOf(g) >= 0 ? .16 : 0);
      });
      names();
    }
    function names() {
      if (!A) return;
      var m = lit && IN3D[lit], at = m ? m.at(A) : null;
      name3(A, m ? [{ id: lit, text: m.name, g: at[0], i: at[1], side: m.side }] : []);
    }
    function load() {
      if (A || loading) return;
      loading = true;
      global.GasChest.load(host, {}).then(function (a) {
        loading = false; if (!a) return;
        A = a; A.onDraw(names);
        a.el.addEventListener('click', function (e) {
          if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 6) return;
          var r = a.el.getBoundingClientRect(), p = a.partAt(e.clientX - r.left, e.clientY - r.top); if (!p) return;
          var part = p.name === 'rib' || p.name === 'sternum' || p.name === 'cartilage' ? 'ribs' : p.name === 'ext' || p.name === 'int' ? 'intercostal' :
            p.name === 'diaphragm' ? 'diaphragm' : p.name === 'lung' ? 'lungs' : p.name === 'airway' ? (p.point.y > .98 ? 'trachea' : 'bronchi') : null;
          if (part) ctx.pick(part);
        });
        a.el.addEventListener('pointerdown', function (e) { downX = e.clientX; downY = e.clientY; });
        A.view((lit && IN3D[lit] && IN3D[lit].view) || 'turned');
        paint();
      });
    }
    var downX = 0, downY = 0;
    /* for tools/pins.mjs */
    root.__chest = function () { return A; };
    function set3(on) {
      on3 = on;
      d3.hidden = !on;
      b3.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) {
        Array.prototype.forEach.call(bar.querySelectorAll('.cellv__mode'), function (b) { if (b !== b3) b.setAttribute('aria-pressed', 'false'); });
        Array.prototype.forEach.call(stage.querySelectorAll('.cellv__svg'), function (s) { s.style.visibility = 'hidden'; });
        api.say = 'A real human chest, measured from one body. Remove the ribs, the muscles or the lungs to see the parts under them'; api.credit = CREDIT_B;
        ctx.caption();
        load();
        if (A) { A.resize(); A.kick(); }
      } else {
        Array.prototype.forEach.call(stage.querySelectorAll('.cellv__svg'), function (s) { s.style.visibility = ''; });
      }
    }
    b3.addEventListener('click', function () { set3(true); });
    Array.prototype.forEach.call(bar.querySelectorAll('.cellv__mode'), function (b) { if (b !== b3) b.addEventListener('click', function () { set3(false); api.say = fig.say; api.credit = fig.credit; ctx.caption(); }); });
    api = {
      el: root, say: fig.say, credit: fig.credit, labels: Object.assign({}, fig.labels, { ribs: 'ribs', intercostal: 'intercostal muscles', diaphragm: 'diaphragm' }),
      focus: function (part) {
        lit = part || null;
        if (part && IN3D[part]) {
          fig.focus(null);
          set3(true);
          if (A) { A.view(IN3D[part].view, still() ? 0 : 900); paint(); }
          return;
        }
        if (on3 && part) set3(false);
        if (on3 && !part) { paint(); return; }
        fig.focus(part);
        api.say = fig.say; api.credit = fig.credit;
      },
      start: function () { if (on3 && A) { A.resize(); A.kick(); } },
      stop: function () {}
    };
    return api;
  }
  Views.add('system', system);

  /* ------------------------------------------------------------------ station 5 ------------------------------------ */
  /* what each card shows: the pose the chest goes to, what glows, where the camera stands, and the names */
  var POSES = {
    diaphragm: { q: 0, d: 1, glow: { diaphragm: .34 }, view: 'cut', cut: .1, name: [['dia', 'diaphragm: contracts and flattens', 'R']] },
    external: { q: 1, d: 0, glow: { ext: .42 }, view: 'side', cut: 1.7, name: [['sExt', 'external intercostal muscles contract', 'L'], ['sRib', 'ribs move upwards and outwards', 'L']] },
    volume: { q: 1, d: 1, glow: { diaphragm: .22, ext: .28 }, view: 'cut', cut: .1, name: [['lung', 'lungs: larger volume', 'L']] },
    out: { q: 0, d: 0, glow: {}, view: 'cut', cut: .1, name: [['dia', 'diaphragm: relaxes, dome-shaped', 'R']] },
    internal: { q: -.35, d: -.35, glow: { int: .46 }, view: 'side', cut: 1.7, name: [['sInt', 'internal intercostal muscles contract', 'R'], ['sRib', 'ribs move downwards and inwards', 'L']] }
  };

  function breathe(spec, ctx) {
    var root = h('div', 'c3v');
    var stage = h('div', 'c3v__stage'), host = h('div', 'c3v__c3'); stage.appendChild(host);
    root.appendChild(stage);
    var G = global.GasChest.gauges(); root.appendChild(G.el);
    root.appendChild(h('p', 'c3v__hint', 'Hold the button to breathe in. Release the button to breathe out.'));
    var bar = h('div', 'c3v__bar');
    var bIn = btn('c3v__b c3v__b--go', 'Hold to breathe in'), bOut = btn('c3v__b c3v__b--hard', 'Hold to breathe out hard');
    var vCut = btn('c3v__b', 'Cut open'), vSide = btn('c3v__b', 'From the side');
    [bIn, bOut, vCut, vSide].forEach(function (b) { bar.appendChild(b); });
    root.appendChild(bar);
    /* at rest the chest names its parts, as every station's picture does */
    var REST = { cut: [['trachea', 'trachea', 'R'], ['bronchus', 'bronchus', 'R'], ['lung', 'lung', 'L'], ['rib', 'rib', 'R'], ['dia', 'diaphragm', 'R']],
                 side: [['sRib', 'rib', 'L'], ['sExt', 'external intercostal muscles', 'L'], ['sInt', 'internal intercostal muscles', 'R']] };
    var A = null, AN = null, name = namer(stage), q = 0, d = 0, tq = 0, td = 0, tView = 'cut', cutAt = .1, cutTo = .1, raf = 0, last = 0, labels = REST.cut, glow = {};
    var RATE = 1.15;      /* how fast the chest follows, per second; a breath in takes about two seconds */
    function vol(a, b) { return A ? A.volumeAt(a, b) : (a + b) / 2; }
    function setView(v) {
      if (labels === REST[tView]) labels = REST[v];
      tView = v; cutTo = v === 'cut' ? .1 : 1.7;
      vCut.setAttribute('aria-pressed', v === 'cut' ? 'true' : 'false'); vSide.setAttribute('aria-pressed', v === 'side' ? 'true' : 'false');
      if (A) A.view(v, still() ? 0 : 900);
      go();
    }
    function apply(rate) {
      if (!A) return;
      A.pose(q, d); A.cut(true, cutAt);
      ['diaphragm', 'ext', 'int'].forEach(function (g) { A.glow(g, glow[g] || 0); });
      A.tone('diaphragm', tView === 'cut' ? (glow.diaphragm ? 1 : .66) : 1);
      G.show(vol(q, d), rate);
      name(A, labels.map(function (l) { var a = AN[l[0]]; return { id: l[0], text: l[1], g: a[0], i: a[1], side: l[2] }; }));
    }
    function tick(ts) {
      raf = 0;
      var dt = last ? Math.min(.05, (ts - last) / 1000) : .016; last = ts;
      var v0 = vol(q, d), k = 1 - Math.exp(-RATE * 2.2 * dt);
      q += (tq - q) * k; d += (td - d) * k;
      cutAt += (cutTo - cutAt) * Math.min(1, dt * 3.4);
      if (Math.abs(tq - q) < .003) q = tq;
      if (Math.abs(td - d) < .003) d = td;
      if (Math.abs(cutTo - cutAt) < .004) cutAt = cutTo;
      apply((vol(q, d) - v0) / dt);
      if (q !== tq || d !== td || cutAt !== cutTo) raf = requestAnimationFrame(tick);
      else { last = 0; apply(0); }
    }
    function go() {
      if (still()) { q = tq; d = td; cutAt = cutTo; apply(0); return; }
      if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
    }
    function target(a, b, gl, names) { tq = a; td = b; glow = gl || {}; labels = names && names.length ? names : REST[tView]; go(); }
    /* the two hold buttons: the pointer, or the keyboard (space or Enter held) */
    function holdable(b, on, off) {
      var held = false;
      function press(e) { if (held) return; held = true; b.classList.add('is-on'); if (e && e.pointerId != null && b.setPointerCapture) { try { b.setPointerCapture(e.pointerId); } catch (x) {} } on(); }
      function free() { if (!held) return; held = false; b.classList.remove('is-on'); off(); }
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); press(e); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { b.addEventListener(t, free); });
      b.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press(); } });
      b.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); free(); } });
      b.addEventListener('blur', free);
    }
    holdable(bIn, function () { target(1, 1, { diaphragm: .3, ext: .34 }, tView === 'cut' ? [['dia', 'diaphragm contracts', 'R']] : [['sExt', 'external intercostal muscles contract', 'L']]); },
      function () { target(0, 0, {}, tView === 'cut' ? [['dia', 'diaphragm relaxes', 'R']] : [['sExt', 'external intercostal muscles relax', 'L']]); });
    holdable(bOut, function () { target(-.35, -.35, { int: .46 }, tView === 'cut' ? [['intL', 'internal intercostal muscles contract', 'L']] : [['sInt', 'internal intercostal muscles contract', 'R']]); },
      function () { target(0, 0, {}, []); });
    vCut.addEventListener('click', function () { setView('cut'); });
    vSide.addEventListener('click', function () { setView('side'); });
    vCut.setAttribute('aria-pressed', 'true'); vSide.setAttribute('aria-pressed', 'false');
    var loading = false;
    function load() {
      if (A || loading) return; loading = true;
      global.GasChest.load(host, {}).then(function (a) {
        loading = false; if (!a) return;
        A = a; AN = global.GasChest.anchors(A); A.view('cut'); A.cut(true, .1); apply(0);
        A.onDraw(function () { if (!raf) name(A, labels.map(function (l) { var x = AN[l[0]]; return { id: l[0], text: l[1], g: x[0], i: x[1], side: l[2] }; })); });
        if (pending) { var p = pending; pending = null; api.focus(p); }
      });
    }
    var pending = null;
    root.__chest = function () { return A; };   /* for tools/pins.mjs */
    G.show(0, 0);
    var api = {
      el: root, say: 'A real human chest. Hold a button to make the chest breathe', credit: CREDIT_B,
      labels: { diaphragm: 'diaphragm', external: 'external intercostal muscles', volume: 'volume of the thorax', out: 'breathing out', internal: 'internal intercostal muscles' },
      focus: function (part) {
        if (!A) { pending = part; load(); return; }
        if (!part) { setView('cut'); target(0, 0, {}, []); return; }
        var P = POSES[part]; if (!P) return;
        if (P.view !== tView) setView(P.view);
        target(P.q, P.d, P.glow, P.name);
      },
      start: function () { load(); if (A) { A.resize(); A.kick(); } },
      stop: function () { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    };
    return api;
  }
  Views.add('breathe', breathe);
})(window);
