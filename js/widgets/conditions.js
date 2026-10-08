/* Condition-code explorer. Mode 1: toggle N Z C V and see which of the 15 conditions pass.
   Mode 2: compare two numbers with CMP and see the signed and unsigned verdicts side by side. */
(function (g) {
  'use strict';
  var E = g.E359, Lab = g.Lab, h = Lab.h;
  var fmtInt = function (n) { return Number(n).toLocaleString('en-US'); };
  var KIND = { any: 'either', unsigned: 'unsigned', signed: 'signed', flag: 'single flag' };

  function condTable(f, only) {
    var rows = E.COND.filter(function (c) { return c.code !== 'NV' && (!only || only.indexOf(c.code) >= 0); }).map(function (c) {
      var ok = c.fn(f);
      var code = c.alias ? c.code + ' / ' + c.alias : c.code;
      var tick = h('span', { class: ok ? 'cond-yes' : 'cond-no', 'aria-label': ok ? 'executes' : 'skipped' }, ok ? '✓ runs' : '✕ skipped');
      return [h('strong', { class: 'mono' }, code), c.name, h('span', { class: 'mono' }, c.need), KIND[c.kind], tick];
    });
    return Lab.table(['Condition', 'Meaning', 'Needs', 'Used for', 'Result'], rows);
  }

  Lab.widgets.condExplorer = function (root, o) {
    o = o || {};
    var st = { tab: o.tab || 'flags', f: { N: 0, Z: 0, C: 0, V: 0 }, a: o.a !== undefined ? o.a >>> 0 : 0xFFFFFFFF, b: o.b !== undefined ? o.b >>> 0 : 1 };
    var tabs = h('div', { class: 'seg', role: 'group', 'aria-label': 'View' });
    var body = h('div', { class: 'cond-body' });
    function drawTabs() {
      Lab.clear(tabs);
      [['flags', 'Set the flags'], ['cmp', 'Compare two numbers']].forEach(function (t) {
        tabs.appendChild(h('button', { type: 'button', 'aria-pressed': st.tab === t[0] ? 'true' : 'false', onclick: function () { st.tab = t[0]; drawTabs(); render(); } }, t[1]));
      });
    }
    root.appendChild(tabs); root.appendChild(body);
    drawTabs();

    function render() {
      Lab.clear(body);
      if (st.tab === 'flags') {
        body.appendChild(h('p', { style: { marginTop: '14px' } }, 'Click a flag to flip it. The table shows which conditions would let an instruction run with those flags.'));
        body.appendChild(Lab.flagChips(st.f, { click: function (k) { st.f[k] ^= 1; render(); } }));
        var passing = E.COND.filter(function (c) { return c.code !== 'NV' && c.code !== 'AL' && c.fn(st.f); }).map(function (c) { return c.code; });
        body.appendChild(h('p', { class: 'muted', style: { marginTop: '10px' }, html: Lab.fmt('Passing right now: ' + (passing.length ? passing.map(function (c) { return '`' + c + '`'; }).join(' ') : 'none except AL')) }));
        body.appendChild(condTable(st.f));
        return;
      }
      var fa = Lab.hexField({ value: st.a, label: 'R0', onChange: function (v) { st.a = v; render(); } });
      var fb = Lab.hexField({ value: st.b, label: 'R1', onChange: function (v) { st.b = v; render(); } });
      body.appendChild(h('div', { class: 'field-row', style: { marginTop: '14px', alignItems: 'flex-end' } }, fa.el, h('code', { style: { padding: '10px 0' } }, 'CMP R0, R1'), fb.el));
      var r = E.sub(st.a, st.b), f = { N: r.N, Z: r.Z, C: r.C, V: r.V };
      body.appendChild(h('p', {}, 'CMP computes R0 − R1 = ', h('code', {}, E.hex(r.res)), ' and keeps only the flags:'));
      body.appendChild(Lab.flagChips(f));
      var sa = st.a | 0, sb = st.b | 0;
      var sv = sa > sb ? 'greater than' : sa < sb ? 'less than' : 'equal to', uv = st.a > st.b ? 'higher than' : st.a < st.b ? 'lower than' : 'equal to';
      body.appendChild(h('div', { class: 'two-readings' },
        h('div', {}, h('span', { class: 'lab' }, 'If the data is signed'), h('p', { html: Lab.fmt('R0 = ' + fmtInt(sa) + ' is **' + sv + '** R1 = ' + fmtInt(sb) + '. The signed conditions `GT GE LT LE` read N against V to get this answer.') })),
        h('div', {}, h('span', { class: 'lab' }, 'If the data is unsigned'), h('p', { html: Lab.fmt('R0 = ' + fmtInt(st.a) + ' is **' + uv + '** R1 = ' + fmtInt(st.b) + '. The unsigned conditions `HI HS LO LS` read C and Z to get this answer.') }))));
      if ((sa > sb) !== (st.a > st.b) && sa !== sb) body.appendChild(h('div', { class: 'callout warn' }, h('span', { class: 'label' }, 'Same bits, opposite answers'), h('div', { html: Lab.fmt('These two numbers order differently as signed and unsigned. That is why ARM has two families of conditions, and why you must know which kind of data you have before you choose a branch.') })));
      body.appendChild(condTable(f));
    }
    render();
  };
  Lab.condTable = condTable;
})(window);
