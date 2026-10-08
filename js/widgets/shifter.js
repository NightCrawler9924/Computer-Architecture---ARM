/* Barrel shifter: LSL, LSR, ASR, ROR and RRX on 32 bits, showing the bits that leave, the bits that enter, and C. */
(function (g) {
  'use strict';
  var E = g.E359, Lab = g.Lab, h = Lab.h;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MAXN = { LSL: 31, LSR: 32, ASR: 32, ROR: 32, RRX: 1 };
  var MEANING = {
    LSL: 'Zeros enter at the bottom. Each place multiplies by 2.',
    LSR: 'Zeros enter at the top. Each place divides by 2, treating the bits as unsigned.',
    ASR: 'Copies of the sign bit enter at the top. Each place divides by 2, treating the bits as signed.',
    ROR: 'Bits that fall off the bottom re-enter at the top. Nothing is lost.',
    RRX: 'Rotate right by one place through the carry: the old C enters at the top and bit 0 becomes the new C.'
  };

  Lab.widgets.shifter = function (root, o) {
    o = o || {};
    var st = { x: o.x !== undefined ? o.x >>> 0 : 0x60000000, type: o.type || 'LSL', n: o.n !== undefined ? o.n : 2, shown: o.n !== undefined ? o.n : 2, cin: 0, vin: 1, timer: null };
    var fx = Lab.hexField({ value: st.x, label: 'Value in Rm', onChange: function (v) { st.x = v; render(); } });
    var seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Shift type' });
    var amt = h('input', { type: 'range', min: 0, max: 32, value: st.n, id: 'sh-amt', 'aria-label': 'Shift amount' });
    var amtOut = h('output', { for: 'sh-amt', class: 'mono' });
    var cinBox = h('label', { class: 'inline-check' }, h('input', { type: 'checkbox', onchange: function (e) { st.cin = e.target.checked ? 1 : 0; render(); } }), 'C = 1 before the shift');
    var vBox = h('label', { class: 'inline-check' }, h('input', { type: 'checkbox', checked: true, onchange: function (e) { st.vin = e.target.checked ? 1 : 0; render(); } }), 'V = 1 before');
    amt.addEventListener('input', function () { stop(); st.n = +amt.value; st.shown = st.n; render(); });
    function drawSeg() {
      Lab.clear(seg);
      Object.keys(MAXN).forEach(function (t) { seg.appendChild(h('button', { type: 'button', 'aria-pressed': st.type === t ? 'true' : 'false', onclick: function () { stop(); st.type = t; if (t === 'RRX') st.n = 1; else if (st.n > MAXN[t]) st.n = MAXN[t]; if (t !== 'RRX' && st.n === 1 && o.n === undefined) st.n = 2; st.shown = st.n; drawSeg(); render(); } }, t)); });
    }
    root.appendChild(h('div', { class: 'field-row' }, fx.el, h('div', { class: 'field' }, h('span', { class: 'lab' }, 'Shift'), seg),
      h('div', { class: 'field shift-amt' }, h('label', { for: 'sh-amt' }, 'Places: ', amtOut), amt), h('div', { class: 'field' }, h('span', { class: 'lab' }, ' '), cinBox)));
    var view = h('div', { class: 'shifter-view' });
    root.appendChild(view);
    drawSeg();

    function stop() { if (st.timer) { clearInterval(st.timer); st.timer = null; } }
    function anim() {
      if (reduce) { st.shown = st.n; render(); return; }
      stop(); st.shown = 0; render();
      st.timer = setInterval(function () { if (!root.isConnected) { stop(); return; } st.shown++; if (st.shown >= st.n) stop(); render(); }, 450);
    }

    function indexes(lo, hi) { var a = []; for (var i = lo; i <= hi; i++) a.push(i); return a; }

    function render() {
      var t = st.type, n = t === 'RRX' ? 1 : Math.min(st.n, MAXN[t]), k = t === 'RRX' ? 1 : Math.min(st.shown, n);
      amt.max = MAXN[t]; amt.disabled = (t === 'RRX'); amt.value = n; amtOut.textContent = String(n);
      cinBox.style.display = (t === 'RRX') ? '' : '';
      Lab.clear(view);
      var x = st.x, r = E.shiftC(t, x, k, st.cin);
      var outIdx = [], inIdx = [], last = -1;
      if (k > 0) {
        if (t === 'LSL') { outIdx = indexes(Math.max(0, 32 - k), 31); inIdx = indexes(0, Math.min(k, 32) - 1); last = k <= 32 ? 32 - k : -1; }
        if (t === 'LSR') { outIdx = indexes(0, Math.min(k, 32) - 1); inIdx = indexes(Math.max(0, 32 - k), 31); last = k - 1; }
        if (t === 'ASR') { outIdx = indexes(0, Math.min(k, 32) - 1); inIdx = indexes(Math.max(0, 32 - k), 31); last = Math.min(k, 32) - 1; }
        if (t === 'ROR') { var kk = k % 32; outIdx = kk ? indexes(0, kk - 1) : []; inIdx = kk ? indexes(32 - kk, 31) : []; last = kk ? kk - 1 : 31; }
        if (t === 'RRX') { outIdx = [0]; inIdx = [31]; last = 0; }
        if (t === 'LSL' && k === 32) { last = 0; }
      }
      view.appendChild(h('p', { class: 'muted', style: { marginBottom: '6px' } }, 'Before (outlined bits are about to leave)'));
      view.appendChild(Lab.bitsEl(x, { out: outIdx, idx: true, last: last }));
      view.appendChild(h('div', { class: 'shift-arrow mono', 'aria-hidden': 'true' }, t === 'LSL' ? '← shifting left ' + k : t === 'RRX' ? '→ rotating right through C' : t === 'ROR' ? '↻ rotating right ' + k : '→ shifting right ' + k));
      view.appendChild(h('p', { class: 'muted', style: { marginBottom: '6px' } }, 'After (green bits entered)'));
      view.appendChild(Lab.bitsEl(r.res, { inn: inIdx, idx: true }));
      view.appendChild(h('div', { class: 'shift-result' },
        h('div', {}, h('span', { class: 'lab' }, 'Result'), h('div', { class: 'mono big' }, E.hex(r.res))),
        h('div', {}, h('span', { class: 'lab' }, 'C out'), h('div', { class: 'mono big fC' }, String(r.C))),
        h('div', {}, h('span', { class: 'lab' }, 'Unsigned / signed'), h('div', { class: 'mono' }, r.res.toLocaleString('en-US') + ' / ' + (r.res | 0).toLocaleString('en-US')))));
      view.appendChild(h('p', {}, MEANING[t]));
      var how = '';
      if (k === 0) how = 'Zero places means no shift at all, and C is left as it was.';
      else if (t === 'LSL') how = 'C is the <strong>last bit pushed off the top</strong>: bit ' + (32 - k) + ' of the original, which is ' + r.C + '.';
      else if (t === 'LSR' || t === 'ASR') how = 'C is the <strong>last bit pushed off the bottom</strong>: bit ' + (Math.min(k, 32) - 1) + ' of the original, which is ' + r.C + '.';
      else if (t === 'ROR') how = 'C becomes bit 31 of the result, the last bit that wrapped round: ' + r.C + '.';
      else how = 'Bit 0 of the original (' + (x & 1) + ') becomes C. The old C (' + st.cin + ') becomes bit 31.';
      view.appendChild(h('p', { html: Lab.fmt(how) }));

      var f = { N: r.res >>> 31, Z: r.res === 0 ? 1 : 0, C: r.C, V: st.vin };
      view.appendChild(h('div', { class: 'field-row', style: { alignItems: 'center' } }, h('span', { class: 'lab' }, 'If this were MOVS Rd, Rm, ' + (t === 'RRX' ? 'RRX' : t + ' #' + k) + ':'), Lab.flagChips(f), vBox));
      view.appendChild(h('p', { class: 'muted' }, 'N and Z come from the result, C comes from the shifter, and V is not touched by a move.'));
      view.appendChild(h('div', { class: 'btn-row' }, h('button', { class: 'btn btn-sm', type: 'button', disabled: t === 'RRX', onclick: anim }, 'Animate one place at a time')));
    }
    render();
  };
})(window);
