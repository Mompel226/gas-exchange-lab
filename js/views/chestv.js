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
  function namer(stage, topGap) {
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'c3v__svg'); svg.setAttribute('aria-hidden', 'true');
    stage.appendChild(svg);
    return function draw(A, list) {
      if (!A) { svg.innerHTML = ''; return; }
      var s = A.size(), W = s[0], H = s[1]; if (!W) return;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var f = W < 420 ? 12.5 : 13.5, band = Math.max(86, W * .2);
      var items = list.map(function (q) {
        var p = q.at || A.project(q.g, q.i, false);
        return { id: q.id, text: q.text, x: p.x, y: p.y, side: q.side || (p.x < W / 2 ? 'L' : 'R') };
      });
      var o = { left: band, right: W - band, font: f, top: topGap || 26, bottom: H - 8, gap: 5 };
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
        /* this picture is about where the parts are, not what they are doing: the muscles in their ordinary colour, clearly apart from the lungs */
        ['diaphragm', 'ext', 'int'].forEach(function (g) { A.contract(g, .55); });
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
  /* what each card shows: the pose the chest goes to, and the look that shows it best. The diaphragm and the external intercostal
     muscles contract together, so every card of a breath in shows the same whole breath */
  var POSES = {
    diaphragm: { q: 1, d: 1, mode: 'dome', phase: 'in' },
    external: { q: 1, d: 1, mode: 'ribs', phase: 'in' },
    volume: { q: 1, d: 1, mode: 'whole', phase: 'in', names: [['lung', 'lungs: larger volume', 'L']] },
    out: { q: 0, d: 0, mode: 'whole', phase: 'out', names: [['dia', 'diaphragm: relaxes, dome-shaped', 'R']] },
    internal: { q: -.35, d: -.35, mode: 'ribsIn', phase: 'hard' }
  };
  /* the names in each look, for what the chest is doing */
  var NAMES = {
    whole: {
      rest: [['tr2', 'trachea', 'R'], ['bronchus', 'bronchus', 'R'], ['lung', 'lung', 'L'], ['rib', 'rib', 'R'], ['dia', 'diaphragm', 'R']],
      in: [['dia', 'diaphragm contracts', 'R'], ['rib', 'ribs: upwards and outwards', 'R']],
      out: [['dia', 'diaphragm relaxes', 'R'], ['rib', 'ribs: downwards and inwards', 'R']],
      hard: [['intL', 'internal intercostal muscles contract', 'L'], ['rib', 'ribs: downwards and inwards', 'R']]
    },
    dome: {
      rest: [['ten', 'central tendon: does not contract', 'L'], ['mus', 'muscle fibres', 'R']],
      in: [['ten', 'tendon: pulled down', 'L'], ['mus', 'muscle fibres contract: they become shorter', 'R'], ['gap', 'more space: larger volume', 'L']],
      out: [['ten', 'tendon: moves up', 'L'], ['mus', 'muscle fibres relax: they become longer', 'R']],
      hard: [['ten', 'central tendon', 'L'], ['mus', 'muscle fibres: relaxed', 'R']]
    },
    ribs: {
      rest: [['nExt', 'external intercostal muscles', 'L'], ['nRib', 'rib', 'R']],
      in: [['nExt', 'external intercostal muscles contract', 'L'], ['nRib', 'ribs: upwards and outwards', 'R']],
      out: [['nExt', 'external intercostal muscles relax', 'L'], ['nRib', 'ribs: downwards and inwards', 'R']]
    },
    ribsOut: {
      rest: [['nExt', 'external intercostal muscles', 'L'], ['nRib', 'rib', 'R']],
      out: [['nExt', 'external intercostal muscles relax', 'L'], ['lInt', 'internal intercostal muscles contract', 'L'], ['nRib', 'ribs: downwards and inwards', 'R']]
    },
    ribsIn: {
      rest: [['lInt', 'internal intercostal muscles', 'L'], ['nRib', 'rib', 'R']],
      hard: [['lInt', 'internal intercostal muscles contract', 'L'], ['nRib', 'ribs: further downwards and inwards', 'R']]
    }
  };

  function breathe(spec, ctx) {
    var GC = global.GasChest;
    var root = h('div', 'c3v');
    var stage = h('div', 'c3v__stage'), host = h('div', 'c3v__c3'); stage.appendChild(host);
    root.appendChild(stage);
    var marksSvg = document.createElementNS(NS, 'svg'); marksSvg.setAttribute('class', 'c3v__marks'); marksSvg.setAttribute('aria-hidden', 'true'); stage.appendChild(marksSvg);
    var KEY = GC.keyRow(); root.appendChild(KEY.el);
    var MS = GC.muscles(); root.appendChild(MS.el);
    var G = GC.gauges(); root.appendChild(G.el);
    var bar = h('div', 'c3v__bar');
    var bIn = btn('c3v__b c3v__b--go', 'Hold to breathe in'), bOut = btn('c3v__b c3v__b--hard', 'Hold to breathe out hard');
    var vWhole = btn('c3v__b', 'Whole chest'), vDome = btn('c3v__b', 'Diaphragm'), vRibs = btn('c3v__b', 'Rib muscles');
    [bIn, bOut].forEach(function (b) { bar.appendChild(b); });
    root.appendChild(bar);
    /* what to look at: at the top of the picture they change */
    var views = h('div', 'c3v__views');
    [vWhole, vDome, vRibs].forEach(function (b) { views.appendChild(b); });
    stage.appendChild(views);
    var A = null, AN = null, name = namer(stage, 48), q = 0, d = 0, ci = 0, tq = 0, td = 0, raf = 0, last = 0;
    var mode = 'whole', from = 'whole', mk = 1, turned = false, phase = 'rest', custom = null;
    var RATE = 1.15;      /* how fast the chest follows, per second; a breath in takes about two seconds */
    function vol(a, b) { return A ? A.volumeAt(a, b) : (a + b) / 2; }
    function list() { var m = NAMES[mode]; return custom || (m[phase] && m[phase].length ? m[phase] : m.rest); }
    function drawNames() {
      if (!A) return;
      /* no names while the camera moves: each would stand on the wrong part */
      name(A, mk < 1 && !GC.sameCamera(from, mode) ? [] : list().filter(function (l) { return l[0] !== 'gap' || d > .28; }).map(function (l) {
        var x = AN[l[0]];
        return { id: l[0], text: l[1], g: x[0], i: x[1], side: l[2], at: l[0] === 'gap' ? GC.gapAt(A, x) : null };
      }));
    }
    function drawMarks() {
      if (!A) return;
      var s = A.size(); if (!s[0]) return;
      marksSvg.setAttribute('viewBox', '0 0 ' + s[0] + ' ' + s[1]);
      marksSvg.innerHTML = GC.marks(A, from, mode, mk, 1, 1);
    }
    function apply(rate, cr) {
      if (!A) return;
      var c = GC.pose(A, q, d, ci);
      GC.look(A, from, mode, mk, mk < 1 || turned);
      turned = false;
      GC.ghosts(A, from, mode, mk, q, d);
      G.show(vol(q, d), rate); MS.show(c, cr); KEY.show(mode);
      A.now();
      drawMarks(); drawNames();
    }
    function tick(ts) {
      raf = 0;
      var dt = last ? Math.min(.05, (ts - last) / 1000) : .016; last = ts;
      var v0 = vol(q, d), c0 = GC.contracted(q, d, ci), k = 1 - Math.exp(-RATE * 2.2 * dt);
      q += (tq - q) * k; d += (td - d) * k;
      if (Math.abs(tq - q) < .003) q = tq;
      if (Math.abs(td - d) < .003) d = td;
      var wi = wantI();
      ci += (wi - ci) * (1 - Math.exp(-dt * 6));
      if (Math.abs(wi - ci) < .006) ci = wi;
      if (mk < 1) { mk = Math.min(1, mk + dt / .95); if (mk === 1) turned = true; }
      var c1 = GC.contracted(q, d, ci);
      apply((vol(q, d) - v0) / dt, { dia: (c1.dia - c0.dia) / dt, ext: (c1.ext - c0.ext) / dt, int: (c1.int - c0.int) / dt });
      if (q !== tq || d !== td || ci !== wi || mk < 1) raf = requestAnimationFrame(tick);
      else { last = 0; settle(); apply(0, null); }
    }
    /* the internal intercostal muscles: fully in a hard breath out, part of the way while the ribs move down in an ordinary one */
    function wantI() { return phase === 'hard' ? 1 : phase === 'out' && q > .004 ? .6 : 0; }
    /* once the chest has stopped at rest, no name still says that something is moving, and the external muscles are solid again */
    function settle() {
      if (phase === 'out' && !custom && q === 0 && d === 0) { phase = 'rest'; if (mode === 'ribsOut') setMode('ribs'); }
    }
    function go() {
      if (still()) { q = tq; d = td; ci = wantI(); if (mk < 1) { mk = 1; turned = true; } settle(); ci = wantI(); if (mk < 1) { mk = 1; turned = true; } apply(0, null); return; }
      if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
    }
    function press() {
      vWhole.setAttribute('aria-pressed', mode === 'whole' ? 'true' : 'false');
      vDome.setAttribute('aria-pressed', mode === 'dome' ? 'true' : 'false');
      vRibs.setAttribute('aria-pressed', mode === 'ribs' || mode === 'ribsOut' || mode === 'ribsIn' ? 'true' : 'false');
    }
    function setMode(m) {
      if (m !== mode) { from = mode; mode = m; mk = 0; custom = null; }
      press();
      go();
    }
    function target(a, b, ph, names) { tq = a; td = b; phase = ph; custom = names || null; go(); }
    /* the two hold buttons: the pointer, or the keyboard (space or Enter held) */
    function holdable(b, on, off) {
      var held = false;
      function down(e) { if (held) return; held = true; b.classList.add('is-on'); if (e && e.pointerId != null && b.setPointerCapture) { try { b.setPointerCapture(e.pointerId); } catch (x) {} } on(); }
      function free() { if (!held) return; held = false; b.classList.remove('is-on'); off(); }
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); down(e); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { b.addEventListener(t, free); });
      b.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); down(); } });
      b.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); free(); } });
      b.addEventListener('blur', free);
    }
    holdable(bIn, function () { if (mode === 'ribsIn' || mode === 'ribsOut') setMode('ribs'); target(1, 1, 'in'); },
      function () { if (mode === 'ribs' && q > .05) setMode('ribsOut'); target(0, 0, 'out'); });
    /* the internal muscles lie under the external ones: close to the ribs, a hard breath out shows them */
    holdable(bOut, function () { if (mode === 'ribs' || mode === 'ribsOut') setMode('ribsIn'); target(-.35, -.35, 'hard'); }, function () { target(0, 0, 'rest'); });
    vWhole.addEventListener('click', function () { setMode('whole'); });
    vDome.addEventListener('click', function () { setMode('dome'); });
    vRibs.addEventListener('click', function () { setMode('ribs'); });
    press();
    var loading = false;
    function load() {
      if (A || loading) return; loading = true;
      GC.load(host, {}).then(function (a) {
        loading = false; if (!a) return;
        A = a; AN = GC.anchors(A); GC.look(A, mode, mode, 1); apply(0, null);
        A.onDraw(function () { if (!raf) { drawMarks(); drawNames(); } });
        if (pending) { var p = pending; pending = null; api.focus(p); }
      });
    }
    var pending = null;
    root.__chest = function () { return A; };   /* for tools/pins.mjs */
    G.show(0, 0); KEY.show('whole');
    var api = {
      el: root, say: 'A real human chest. Hold a button to make the chest breathe', credit: CREDIT_B,
      labels: { diaphragm: 'diaphragm', external: 'external intercostal muscles', volume: 'volume of the thorax', out: 'breathing out', internal: 'internal intercostal muscles' },
      focus: function (part) {
        if (!A) { pending = part; load(); return; }
        if (!part) { setMode('whole'); target(0, 0, 'rest'); return; }
        var P = POSES[part]; if (!P) return;
        setMode(P.mode);
        target(P.q, P.d, P.phase, P.names);
      },
      start: function () { load(); if (A) { A.resize(); A.kick(); } },
      stop: function () { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    };
    return api;
  }
  Views.add('breathe', breathe);
})(window);
