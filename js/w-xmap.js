/* ============================================================
   w-xmap.js — "Remember it with X": Daniel's own ventilation diagram (L3 deck, slide 12; the sheet he prints is
   To print/Diagram of Ventilation Mechanics.pdf), to fill in.

   His memory aid (21 Nov 2026: "it has helped them. It helps me remember"): eXpiration, eXternal, relaX. In expiration the external
   intercostal muscles and the diaphragm relax; in inspiration it is the opposite. Inspiration on the left, expiration on the right,
   as on his slide, with the same order: the muscles, the ribs, the volume, the pressure, the air.

   A blank is pressed to choose its word. Check says which are right and never shows the answer.
   ============================================================ */
(function (global) {
  'use strict';
  var L = global.CircLearn;
  if (!L) return;
  var h = L.h;
  var X = function (word) { return word.replace(/x/i, function (c) { return '<mark class="xm__x">' + c + '</mark>'; }); };
  var CR = ['contract', 'relax'], CRS = ['contracts', 'relaxes'], SH = ['flattens', 'becomes dome-shaped'];
  var UD = ['upwards', 'downwards'], IO = ['outwards', 'inwards'], ID = ['increases', 'decreases'], AI = ['into', 'out of'];
  var COLS = [
    { head: 'Inspiration', cls: 'in', rows: [
      ['Diaphragm muscle', [CRS, 0], 'and', [SH, 0]],
      ['External intercostal muscles', [CR, 0]],
      ['Internal intercostal muscles', [CR, 1]],
      ['Ribs move', [UD, 0], 'and', [IO, 0]],
      ['Volume of the thorax', [ID, 0]],
      ['Pressure in the thorax', [ID, 1]],
      ['Air moves', [AI, 0], 'the lungs']
    ] },
    { head: X('Expiration'), cls: 'ex', rows: [
      ['Diaphragm muscle', [CRS, 1], 'and', [SH, 1]],
      [X('External') + ' intercostal muscles', [CR, 1]],
      ['Internal intercostal muscles', [CR, 0], '(when you breathe out hard)'],
      ['Ribs move', [UD, 1], 'and', [IO, 1]],
      ['Volume of the thorax', [ID, 1]],
      ['Pressure in the thorax', [ID, 0]],
      ['Air moves', [AI, 1], 'the lungs']
    ] }
  ];

  function xmap(spec) {
    var box = h('div', 'widget xm');
    box.appendChild(L.head(spec.title || 'Remember it with X', spec.ask || 'Press each blank to choose its word, then press Check.', null));
    box.appendChild(h('p', 'xm__rule', 'In ' + X('expiration') + ', the ' + X('external') + ' intercostal muscles and the diaphragm rela' + '<mark class="xm__x">x</mark>. In inspiration it is the opposite: they contract.'));
    var grid = h('div', 'xm__grid'), blanks = [];
    COLS.forEach(function (c) {
      var col = h('section', 'xm__col xm__col--' + c.cls);
      col.appendChild(h('h4', 'xm__h', c.head));
      c.rows.forEach(function (r) {
        var row = h('p', 'xm__row');
        r.forEach(function (part, i) {
          if (typeof part === 'string') {
            row.appendChild(h('span', i === 0 ? 'xm__t xm__t--name' : 'xm__t', part));
            return;
          }
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'xm__b';
          var it = { el: b, words: part[0], right: part[1], at: -1 };
          function paint() {
            var w = it.at < 0 ? '' : it.words[it.at];
            b.innerHTML = it.at < 0 ? '<span class="xm__gap">choose</span>' : (b.classList.contains('is-ok') ? w.replace(/x/, '<mark class="xm__x">x</mark>') : w);
            b.setAttribute('aria-label', it.at < 0 ? 'Blank: press to choose a word' : w + ': press to change');
          }
          it.paint = paint;
          b.addEventListener('click', function () {
            it.at = (it.at + 1) % it.words.length;
            b.classList.remove('is-ok', 'is-no');
            say.textContent = '';
            paint();
          });
          paint();
          blanks.push(it);
          row.appendChild(b);
        });
        col.appendChild(row);
      });
      grid.appendChild(col);
    });
    box.appendChild(grid);
    var foot = h('div', 'xm__foot');
    var check = h('button', 'btn xm__check', 'Check'); check.type = 'button';
    var clear = h('button', 'xm__clear', 'Start again'); clear.type = 'button';
    var say = h('span', 'xm__say'); say.setAttribute('role', 'status');
    foot.appendChild(check); foot.appendChild(clear); foot.appendChild(say);
    box.appendChild(foot);
    check.addEventListener('click', function () {
      var right = 0, empty = 0;
      blanks.forEach(function (it) {
        it.el.classList.remove('is-ok', 'is-no');
        if (it.at < 0) { empty++; return; }
        if (it.at === it.right) { it.el.classList.add('is-ok'); right++; } else it.el.classList.add('is-no');
        it.paint();
      });
      say.textContent = right === blanks.length ? 'All ' + right + ' are right.' :
        right + ' of ' + blanks.length + ' are right.' + (empty ? ' Choose a word for every blank.' : ' Change the ones in red.');
    });
    clear.addEventListener('click', function () {
      blanks.forEach(function (it) { it.at = -1; it.el.classList.remove('is-ok', 'is-no'); it.paint(); });
      say.textContent = '';
    });
    return box;
  }
  L.add('xmap', xmap);
})(window);
