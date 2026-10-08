/* Hex and flags lab: a 32-bit adder shown one column at a time, with the reason for every flag. */
(function (g) {
  'use strict';
  var E = g.E359, Lab = g.Lab, h = Lab.h;
  var fmtInt = function (n) { return Number(n).toLocaleString('en-US'); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var PRESETS = [
    { label: '7FFFFFFF + 1', a: 0x7FFFFFFF, b: 1, op: 'ADD' },
    { label: 'FFFFFFFF + 1', a: 0xFFFFFFFF, b: 1, op: 'ADD' },
    { label: '40000000 + 40000000', a: 0x40000000, b: 0x40000000, op: 'ADD' },
    { label: 'C0000000 + C0000000', a: 0xC0000000, b: 0xC0000000, op: 'ADD' },
    { label: '3 - 5', a: 3, b: 5, op: 'SUB' },
    { label: '5 - 3', a: 5, b: 3, op: 'SUB' },
    { label: '9876ABCD - 6DFF8763', a: 0x9876ABCD, b: 0x6DFF8763, op: 'SUB' }
  ];
  var OPS = { ADD: '+', ADC: '+ C +', SUB: '−', SBC: '− (1 − C) −' };

  Lab.widgets.hexLab = function (root, o) {
    o = o || {};
    var st = { a: o.a !== undefined ? o.a >>> 0 : 0x7DBC1266, b: o.b !== undefined ? o.b >>> 0 : 0xEFD41234, op: o.op || 'ADD', cin: 1, step: 8, timer: null };
    var compact = !!o.compact;

    var fa = Lab.hexField({ value: st.a, label: 'A', onChange: function (v) { st.a = v; render(true); } });
    var fb = Lab.hexField({ value: st.b, label: 'B', onChange: function (v) { st.b = v; render(true); } });
    var ops = compact ? ['ADD', 'SUB'] : ['ADD', 'SUB', 'ADC', 'SBC'];
    var seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Operation' });
    var cinBox = h('label', { class: 'inline-check' }, h('input', { type: 'checkbox', checked: true, onchange: function (e) { st.cin = e.target.checked ? 1 : 0; render(true); } }), 'Carry flag C = 1 coming in');
    function drawSeg() {
      Lab.clear(seg);
      ops.forEach(function (op) { seg.appendChild(h('button', { type: 'button', 'aria-pressed': st.op === op ? 'true' : 'false', onclick: function () { st.op = op; drawSeg(); render(true); } }, op)); });
    }
    var controls = h('div', { class: 'field-row hexlab-controls' }, fa.el, h('div', { class: 'field' }, h('span', { class: 'lab' }, 'Operation'), seg), fb.el, h('div', { class: 'field cin-slot' }, cinBox));
    drawSeg();
    root.appendChild(controls);

    if (!compact) {
      var pr = h('div', { class: 'btn-row preset-row' }, h('span', { class: 'muted', style: { fontSize: 'var(--fs-0)' } }, 'Try:'),
        PRESETS.map(function (p) { return h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { st.a = p.a; st.b = p.b; st.op = p.op; fa.set(p.a); fb.set(p.b); drawSeg(); render(true); } }, p.label); }));
      root.appendChild(pr);
    }

    var view = h('div', { class: 'hexlab-view' });
    root.appendChild(view);

    function model() {
      var a = st.a, b = st.b, sub = st.op === 'SUB' || st.op === 'SBC';
      var cin = (st.op === 'ADD') ? 0 : (st.op === 'SUB') ? 1 : st.cin;
      var bEff = sub ? ((~b) >>> 0) : b;
      var r = E.addWithCarry(a, bEff, cin);
      return { a: a, b: b, sub: sub, cin: cin, bEff: bEff, r: r, cols: E.columnAdd(a, bEff, cin) };
    }

    function stop() { if (st.timer) { clearInterval(st.timer); st.timer = null; } }

    function render(reset) {
      cinBox.parentNode.style.display = (st.op === 'ADC' || st.op === 'SBC') ? '' : 'none';
      if (reset) { stop(); st.step = 8; }
      var m = model(), r = m.r, f = { N: r.N, Z: r.Z, C: r.C, V: r.V };
      Lab.clear(view);

      var kind = m.sub ? 'sub' : 'add';
      var shown = st.step;                            // how many columns have been worked (rightmost first)
      var head = h('p', { class: 'hexlab-eq' }, h('code', {}, E.hex(m.a)), ' ' + OPS[st.op] + ' ', h('code', {}, E.hex(m.b)), ' = ', h('code', {}, E.hex(r.res)));
      view.appendChild(head);

      if (m.sub) {
        view.appendChild(h('p', { class: 'hexlab-note' }, 'The processor has no subtractor. It computes ', h('strong', {}, 'A + NOT B + ' + (st.op === 'SUB' ? '1' : 'C')), ': flip every bit of B (each hex digit becomes F minus that digit), then add with the carry-in shown at the right.'));
        var nb = E.hexDigits(m.bEff), ob = E.hexDigits(m.b);
        view.appendChild(h('div', { class: 'colgrid small' }, rowLabel('B'), digitCells(ob), rowLabel('NOT B'), digitCells(nb)));
      }

      // the column grid; position p (0 = leftmost, 7 = rightmost)
      var ah = E.hexDigits(m.a), bh = E.hexDigits(m.bEff), rh = m.cols.result;
      var cols = m.cols.cols;                         // cols[0] is the rightmost column
      var grid = h('div', { class: 'colgrid', role: 'group', 'aria-label': 'Column-by-column addition, rightmost column first' });
      var carryRow = [], aRow = [], bRow = [], sRow = [], idxRow = [];
      for (var p = 0; p < 8; p++) {
        var k = 7 - p;                                // index into cols for this position
        var done = (k < shown);
        var cur = (k === shown - 1) && shown < 8 && shown > 0 || (shown === 8 && false);
        var cin = cols[k].cin;
        carryRow.push(cell(done || k === 0 ? String(cin) : '', 'carry' + (cin ? ' on' : ' off') + (done || k === 0 ? '' : ' hidden')));
        aRow.push(cell(ah[p], ''));
        bRow.push(cell(bh[p], ''));
        sRow.push(cell(done ? cols[k].digit : '·', 'sum' + (done ? '' : ' hidden') + (cur ? ' now' : '')));
        idxRow.push(cell(String(cols[k].col), 'idx'));
      }
      var coutCell = cell(shown >= 8 ? String(m.cols.carryOut) : '', 'cout' + (m.cols.carryOut && shown >= 8 ? ' on' : ''));
      grid.appendChild(rowLabel('carry in'));
      grid.appendChild(cell('', 'spacer')); carryRow.forEach(function (c) { grid.appendChild(c); });
      grid.appendChild(rowLabel(m.sub ? 'A' : 'A')); grid.appendChild(cell('', 'spacer')); aRow.forEach(function (c) { grid.appendChild(c); });
      grid.appendChild(rowLabel(m.sub ? '+ NOT B' : '+ B')); grid.appendChild(cell('', 'spacer')); bRow.forEach(function (c) { grid.appendChild(c); });
      grid.appendChild(rowLabel('sum')); grid.appendChild(coutCell); sRow.forEach(function (c) { grid.appendChild(c); });
      grid.appendChild(rowLabel('column')); grid.appendChild(cell('', 'spacer')); idxRow.forEach(function (c) { grid.appendChild(c); });
      view.appendChild(grid);

      // narration for the column most recently worked
      var narr = h('p', { class: 'hexlab-narr', 'aria-live': 'polite' });
      if (shown > 0) {
        var c = cols[shown - 1];
        narr.innerHTML = 'Column ' + c.col + ': <code>' + c.a + ' + ' + c.b + (c.cin ? ' + 1' : '') + '</code> = ' + c.da + ' + ' + c.db + (c.cin ? ' + 1' : '') + ' = <strong>' + c.sum + '</strong>. ' +
          (c.sum >= 16 ? '16 or more, so write ' + c.sum + ' − 16 = <strong>' + c.digit + '</strong> and carry 1 into the next column.' : 'Below 16, so write <strong>' + c.digit + '</strong> and carry 0.');
      } else narr.textContent = 'Press Step to work the first column (the rightmost one).';
      view.appendChild(narr);
      var ctl = h('div', { class: 'btn-row' },
        h('button', { class: 'btn btn-sm', type: 'button', disabled: shown >= 8, onclick: function () { stop(); st.step++; render(); } }, 'Step'),
        h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { play(); } }, st.timer ? 'Pause' : (shown >= 8 ? 'Replay' : 'Play')),
        h('button', { class: 'btn btn-sm btn-quiet', type: 'button', onclick: function () { stop(); st.step = 8; render(); } }, 'Show all'),
        h('button', { class: 'btn btn-sm btn-quiet', type: 'button', onclick: function () { stop(); st.step = 0; render(); } }, 'Reset'));
      view.appendChild(ctl);

      if (shown < 8) return;                           // flags only once the sum is complete

      var res = r.res;
      if (compact) {                                   // the home page version: result, flags and why C and V
        var whyC = E.explainFlags(kind, m.a, m.b, res, f);
        view.appendChild(Lab.flagChips(f));
        view.appendChild(h('p', { class: 'hexlab-note', style: { marginTop: '10px' } }, h('strong', { class: 'fC' }, 'C = ' + f.C + '. '), whyC.C + '. ', h('strong', { class: 'fV' }, 'V = ' + f.V + '. '), whyC.V + '.'));
        return;
      }

      // result in other forms
      view.appendChild(h('div', { class: 'hexlab-result' },
        h('div', {}, h('span', { class: 'lab' }, 'Result'), h('div', { class: 'mono big' }, E.hex(res))),
        h('div', {}, h('span', { class: 'lab' }, 'Binary'), h('div', { class: 'mono' }, E.binGroups(res))),
        h('div', {}, h('span', { class: 'lab' }, 'As unsigned'), h('div', { class: 'mono' }, fmtInt(res))),
        h('div', {}, h('span', { class: 'lab' }, 'As signed'), h('div', { class: 'mono' }, fmtInt(res | 0)))));

      view.appendChild(h('div', { class: 'subhead hexlab-h' }, 'Flags'));
      view.appendChild(Lab.flagChips(f));
      var why = E.explainFlags(kind, m.a, m.b, res, f);
      view.appendChild(h('ul', { class: 'why-list' }, ['N', 'Z', 'C', 'V'].map(function (k) {
        return h('li', {}, h('strong', { class: 'f' + k }, k + ' = ' + f[k] + '. '), why[k]);
      })));

      // the two readings of the same bits
      var ua, sa;
      if (!m.sub) {
        var us = (m.a + m.b + m.cin), ss = (m.a | 0) + (m.b | 0) + m.cin;
        ua = 'Unsigned: ' + fmtInt(m.a) + ' + ' + fmtInt(m.b) + (m.cin ? ' + 1' : '') + ' = ' + fmtInt(us) + (us > 0xFFFFFFFF ? '. That does not fit in 32 bits (the largest is 4,294,967,295), so it wrapped and C = 1.' : '. It fits, so C = 0.');
        sa = 'Signed: ' + fmtInt(m.a | 0) + ' + ' + fmtInt(m.b | 0) + (m.cin ? ' + 1' : '') + ' = ' + fmtInt(ss) + ((ss < -2147483648 || ss > 2147483647) ? '. That is outside −2,147,483,648 to 2,147,483,647, so V = 1.' : '. It fits, so V = 0.');
      } else {
        var bor = st.op === 'SUB' ? 0 : (1 - st.cin);
        var us2 = m.a - m.b - bor, ss2 = (m.a | 0) - (m.b | 0) - bor;
        ua = 'Unsigned: ' + fmtInt(m.a) + ' − ' + fmtInt(m.b) + (bor ? ' − 1' : '') + ' = ' + fmtInt(us2) + (us2 < 0 ? '. Negative, so a borrow happened and C = 0.' : '. Not negative, so no borrow and C = 1.');
        sa = 'Signed: ' + fmtInt(m.a | 0) + ' − ' + fmtInt(m.b | 0) + (bor ? ' − 1' : '') + ' = ' + fmtInt(ss2) + ((ss2 < -2147483648 || ss2 > 2147483647) ? '. Outside the signed range, so V = 1.' : '. Inside the signed range, so V = 0.');
      }
      view.appendChild(h('div', { class: 'two-readings' }, h('div', {}, h('span', { class: 'lab' }, 'Reading the bits as unsigned (this is C)'), h('p', { html: Lab.fmt(ua) })),
        h('div', {}, h('span', { class: 'lab' }, 'Reading the bits as signed (this is V)'), h('p', { html: Lab.fmt(sa) }))));
      if (m.sub && m.b === 0) view.appendChild(h('p', { class: 'hexlab-note' }, 'B is zero, so no borrow was needed and C = 1. (The "negate then add" shortcut would miss this one case; adding NOT B + 1 does not.)'));
    }
    function play() {
      if (st.timer) { stop(); render(); return; }
      if (reduce) { st.step = 8; render(); return; }
      if (st.step >= 8) st.step = 0;
      st.timer = setInterval(function () { if (!root.isConnected) { stop(); return; } st.step++; if (st.step >= 8) stop(); render(); }, 650);
      render();
    }
    function cell(t, cls) { return h('div', { class: 'cc ' + (cls || '') }, t); }
    function rowLabel(t) { return h('div', { class: 'rl' }, t); }
    function digitCells(s) { var out = [cell('', 'spacer')]; for (var i = 0; i < 8; i++) out.push(cell(s[i], '')); return out; }
    render(true);
  };
})(window);
