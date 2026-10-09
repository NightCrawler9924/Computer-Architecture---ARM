/* Answer-checking widgets for homework-style problems. The expected answer is never typed in by hand:
   it comes from running the instructions on the engine. */
(function (g) {
  'use strict';
  var E = g.E359, Lab = g.Lab, h = Lab.h;
  var hx = E.hex;

  function givenTable(regs, flags) {
    var rows = Object.keys(regs || {}).map(function (k) { return [h('strong', { class: 'mono' }, k), h('code', {}, hx(regs[k]))]; });
    var wrap = h('div', { class: 'given' });
    if (rows.length) wrap.appendChild(Lab.table(['Register', 'Value'], rows));
    if (flags) wrap.appendChild(h('div', { class: 'field-row', style: { alignItems: 'center' } }, h('span', { class: 'lab' }, 'Flags at the start'), Lab.flagChips(Object.assign({ N: 0, Z: 0, C: 0, V: 0 }, flags))));
    return wrap;
  }

  /* mount the matching explanatory widget for the first arithmetic or shift instruction */
  function workingFor(src, init) {
    var r = E.runProgram(src, init);
    if (!r.asm.ok || !r.trace.length) return null;
    var T = r.trace[0], ins = T.ins, before = T.regsBefore, box = h('div', { class: 'widget' });
    var rnv = ins.rn !== undefined && ins.rn !== null ? before[ins.rn] : 0;
    function o2val() { if (ins.o2.k === 'imm') return ins.o2.value; var rm = before[ins.o2.rm]; return rm; }
    if (['ADD', 'CMN', 'ADC'].indexOf(ins.op) >= 0 && ins.o2 && !ins.o2.sh) { Lab.mountWidget(box, 'hexLab', { a: rnv, b: o2val(), op: ins.op === 'ADC' ? 'ADD' : 'ADD', compact: true }); return box; }
    if (['SUB', 'CMP'].indexOf(ins.op) >= 0 && ins.o2 && !ins.o2.sh) { Lab.mountWidget(box, 'hexLab', { a: rnv, b: o2val(), op: 'SUB', compact: true }); return box; }
    if (ins.op === 'MOV' && ins.o2 && ins.o2.k === 'reg' && ins.o2.sh && ins.o2.sh.n !== undefined) { Lab.mountWidget(box, 'shifter', { x: before[ins.o2.rm], type: ins.o2.sh.t, n: ins.o2.sh.n }); return box; }
    return null;
  }

  Lab.widgets.calcCheck = function (root, o) {
    var init = { regs: o.regs || {}, flags: o.flags, mem: o.mem };
    var src = '  ' + o.code + '\nstop B stop';
    var res = E.runProgram(src, init);
    if (!res.asm.ok) { root.appendChild(h('p', { class: 'feedback bad' }, 'Problem setup error: ' + res.asm.errors[0].msg)); return; }
    var cpu = res.cpu, ask = o.ask || [], inputs = {};
    if (o.title) root.appendChild(h('div', { class: 'subhead', style: { marginTop: 0 } }, o.title));
    root.appendChild(givenTable(o.regs, o.flags));
    root.appendChild(h('p', {}, 'Run this instruction on its own:'));
    root.appendChild(Lab.codeBlock(o.code, { init: init, run: o.reveal !== false }));
    var row = h('div', { class: 'field-row' });
    ask.forEach(function (r) { var f = Lab.hexField({ label: r + ' afterwards', placeholder: '0x........' }); inputs[r] = f; row.appendChild(f.el); });
    var fs = { N: 0, Z: 0, C: 0, V: 0 }, chips = null;
    if (o.askFlags !== false) {
      var redraw = function () { var nw = Lab.flagChips(fs, { click: function (k) { fs[k] ^= 1; redraw(); } }); if (chips) chips.replaceWith(nw); chips = nw; };
      redraw(); row.appendChild(h('div', { class: 'field' }, h('span', { class: 'lab' }, 'Flags afterwards (click to toggle)'), chips));
    }
    root.appendChild(row);
    var slot = h('div');
    var btn = h('button', { class: 'btn btn-primary', type: 'button' }, 'Check my answer');
    btn.addEventListener('click', function () {
      slot.innerHTML = '';
      var wrong = [];
      ask.forEach(function (r) { var want = cpu.reg[E.parseReg(r)], got = inputs[r].get(); if (got !== want) wrong.push(r); inputs[r].input.classList.toggle('ok', got === want); inputs[r].input.classList.toggle('bad', got !== want); });
      if (o.askFlags !== false) ['N', 'Z', 'C', 'V'].forEach(function (k) { if (fs[k] !== cpu.f[k]) wrong.push(k); });
      var ok = !wrong.length, T = res.trace[0];
      if (o.reveal === false) {
        /* graded work: say which registers are right, explain the method, never show the answer */
        var marks = ask.map(function (r) { return r + (wrong.indexOf(r) < 0 ? ' correct' : ' needs another look'); }).join(', ');
        var fb2 = h('div', { class: 'feedback ' + (ok ? 'good' : 'bad') }, h('strong', { class: 'verdict' }, ok ? 'Correct.' : 'Not quite.'), h('div', {}, marks + '.'));
        if (o.explain) fb2.appendChild(h('div', { class: 'explain', html: Lab.fmt(o.explain) }));
        slot.appendChild(fb2);
        return;
      }
      var fb = h('div', { class: 'feedback ' + (ok ? 'good' : 'bad') }, h('strong', { class: 'verdict' }, ok ? 'Correct.' : 'Not quite. Check: ' + wrong.join(', ') + '.'));
      var show = h('button', { class: 'btn btn-sm', type: 'button' }, 'Show the answer and the working');
      show.addEventListener('click', function () {
        show.remove();
        var det = h('div', { class: 'answer' });
        ask.forEach(function (r) { det.appendChild(h('p', {}, h('strong', {}, r + ' = '), h('code', {}, hx(cpu.reg[E.parseReg(r)])))); });
        if (o.askFlags !== false) { det.appendChild(Lab.flagChips(cpu.f)); }
        det.appendChild(h('p', { html: Lab.fmt(T.msg) }));
        if (T.detail && T.detail.flags && o.askFlags !== false) {
          var why = E.explainFlags(T.detail.kind, T.detail.a, T.detail.b, T.detail.res, T.detail.flags, { shifted: T.detail.shifted });
          det.appendChild(h('ul', { class: 'why-list' }, ['N', 'Z', 'C', 'V'].map(function (k) { return h('li', {}, h('strong', { class: 'f' + k }, k + ' = ' + T.detail.flags[k] + '. '), why[k]); })));
        }
        var wk = workingFor(src, init); if (wk) { det.appendChild(h('p', { class: 'muted' }, 'Column by column:')); det.appendChild(wk); }
        slot.appendChild(det);
      });
      if (ok) fb.appendChild(h('p', { html: Lab.fmt(T.msg) }));
      fb.appendChild(h('div', { class: 'btn-row', style: { marginTop: '8px' } }, show));
      slot.appendChild(fb);
    });
    root.appendChild(h('div', { class: 'btn-row' }, btn));
    root.appendChild(slot);
  };

  /* a trace table: after each instruction, give the registers and flags */
  Lab.widgets.calcTrace = function (root, o) {
    var lines = o.code.split('\n').filter(function (l) { return l.trim(); });
    var init = { regs: o.regs || {}, flags: o.flags };
    var res = E.runProgram(lines.join('\n') + '\nstop B stop', init);
    if (!res.asm.ok) { root.appendChild(h('p', { class: 'feedback bad' }, 'Problem setup error: ' + res.asm.errors[0].msg)); return; }
    var show = o.show || Object.keys(o.regs || {});
    if (o.title) root.appendChild(h('div', { class: 'subhead', style: { marginTop: 0 } }, o.title));
    root.appendChild(givenTable(o.regs, o.flags));
    var startRegs = {}; show.forEach(function (r) { startRegs[r] = (o.regs && o.regs[r] !== undefined) ? o.regs[r] : 0; });
    var rowsState = [];
    var prev = { regs: Object.assign({}, startRegs), f: Object.assign({ N: 0, Z: 0, C: 0, V: 0 }, o.flags || {}) };
    var table = h('div', { class: 'trace-table', role: 'table' });
    var head = h('div', { class: 'trow thead', role: 'row' }, h('span', { role: 'columnheader' }, 'Instruction'), show.map(function (r) { return h('span', { role: 'columnheader' }, r); }), h('span', { role: 'columnheader' }, 'Flags (N Z C V)'));
    table.appendChild(head);
    lines.forEach(function (ln, i) {
      var st = { regs: {}, f: Object.assign({}, prev.f), inputs: {}, rowEl: null, chipsHolder: null };
      var row = h('div', { class: 'trow', role: 'row' }, h('code', { class: 'cell-code', role: 'cell' }, ln.trim()));
      show.forEach(function (r) {
        var inp = h('input', { type: 'text', class: 'hex-in', value: hx(prev.regs[r]), placeholder: r, 'aria-label': r + ' after ' + ln.trim(), spellcheck: 'false' });
        st.inputs[r] = inp; row.appendChild(h('span', { role: 'cell' }, inp));
      });
      var holder = h('span', { role: 'cell' });
      function redraw() { var nw = Lab.flagChips(st.f, { click: function (k) { st.f[k] ^= 1; redraw(); } }); Lab.clear(holder); holder.appendChild(nw); }
      redraw(); row.appendChild(holder);
      st.rowEl = row; table.appendChild(row); rowsState.push(st);
    });
    root.appendChild(h('div', { class: 'table-wrap' }, table));
    var slot = h('div');
    var btn = h('button', { class: 'btn btn-primary', type: 'button' }, 'Check every line');
    btn.addEventListener('click', function () {
      slot.innerHTML = '';
      var cpu = new E.CPU(); cpu.reset(res.asm);
      Object.keys(init.regs).forEach(function (k) { cpu.reg[E.parseReg(k)] = init.regs[k] >>> 0; });
      if (init.flags) cpu.f = Object.assign({ N: 0, Z: 0, C: 0, V: 0 }, init.flags);
      var allOk = true, notes = [], traces = [];
      rowsState.forEach(function (st, i) {
        var T = cpu.step(); traces.push(T);
        var ok = true;
        show.forEach(function (r) { var got = E.parseValue(st.inputs[r].value), want = cpu.reg[E.parseReg(r)]; var good = got === want; st.inputs[r].classList.toggle('ok', good); st.inputs[r].classList.toggle('bad', !good); if (!good) ok = false; });
        ['N', 'Z', 'C', 'V'].forEach(function (k) { if (st.f[k] !== cpu.f[k]) ok = false; });
        st.rowEl.classList.toggle('row-ok', ok); st.rowEl.classList.toggle('row-bad', !ok);
        if (!ok) allOk = false;
        notes.push({ T: T, ok: ok, regs: cpu.reg.slice(), f: Object.assign({}, cpu.f) });
      });
      var fb = h('div', { class: 'feedback ' + (allOk ? 'good' : 'bad') }, h('strong', { class: 'verdict' }, allOk ? 'Every line is correct.' : 'Some lines are off. The red rows need another look.'));
      var showBtn = h('button', { class: 'btn btn-sm', type: 'button' }, 'Show the working for each line');
      showBtn.addEventListener('click', function () {
        showBtn.remove();
        var det = h('div', { class: 'answer' });
        notes.forEach(function (n, i) {
          det.appendChild(h('p', {}, h('strong', {}, 'Line ' + (i + 1) + ': '), h('code', {}, n.T.text), ' ', n.T.skipped ? h('em', {}, '(skipped)') : null));
          det.appendChild(h('p', { html: Lab.fmt(n.T.msg) }));
          det.appendChild(h('p', { class: 'muted mono' }, show.map(function (r) { return r + '=' + hx(n.regs[E.parseReg(r)]); }).join('   ') + '   ' + Lab.flagStr(n.f)));
        });
        slot.appendChild(det);
      });
      fb.appendChild(h('div', { class: 'btn-row', style: { marginTop: '8px' } }, showBtn));
      slot.appendChild(fb);
    });
    root.appendChild(h('div', { class: 'btn-row' }, btn, h('button', { class: 'btn btn-quiet btn-sm', type: 'button', onclick: function () { Lab.openInSim(lines.join('\n') + '\nstop B stop', init); } }, 'Open in simulator')));
    root.appendChild(slot);
  };
  /* Homework 1 Problem 4: trace a toy program, filling PC and R0 before and after each instruction. */
  Lab.widgets.toyTrace = function (root, o) {
    var st = { r1: 1, four: false };
    var PROG = [
      { a: 0x00, d: 'branch/jump to address 0x18' }, { a: 0x18, d: 'move 5 into R0' }, { a: 0x1C, d: 'increment R0 by one' }, { a: 0x20, d: 'shift left R0 by one bit' },
      { a: 0x24, d: 'compare R0 with 0xA' }, { a: 0x28, d: 'if the N flag equals 0, branch to address 0x38' }, { a: 0x38, d: 'add R0 and R1 and save the result in R0' },
      { a: 0x3C, d: 'branch to address 0x2C' }, { a: 0x2C, d: 'save the contents of R0 (the sheet says "4R0") into address 0x40' }
    ];
    function run() {
      var r0 = null, n = 0, pc = 0, rows = [], mem40 = null, guard = 0;
      while (guard++ < 30) {
        var ins = PROG.filter(function (p) { return p.a === pc; })[0];
        if (!ins) break;
        var before = r0, next = pc + 4;
        switch (pc) {
          case 0x00: next = 0x18; break;
          case 0x18: r0 = 5; break;
          case 0x1C: r0 = r0 + 1; break;
          case 0x20: r0 = r0 * 2; break;
          case 0x24: n = ((r0 - 0xA) < 0) ? 1 : 0; break;
          case 0x28: if (n === 0) next = 0x38; break;
          case 0x38: r0 = (r0 + st.r1) >>> 0; break;
          case 0x3C: next = 0x2C; break;
          case 0x2C: mem40 = st.four ? (4 * r0) >>> 0 : r0; break;
        }
        rows.push({ ins: ins, pcBefore: pc, r0Before: before, pcAfter: next, r0After: r0 });
        pc = next;
      }
      return { rows: rows, mem40: mem40 };
    }
    var r1 = Lab.hexField({ value: st.r1, label: 'Assume R1 =', onChange: function (v) { st.r1 = v; draw(); } });
    var seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Meaning of 4R0' });
    function drawSeg() { Lab.clear(seg); [[false, '"4R0" is a typo for R0'], [true, '"4R0" means 4 x R0']].forEach(function (m) { seg.appendChild(h('button', { type: 'button', 'aria-pressed': st.four === m[0] ? 'true' : 'false', onclick: function () { st.four = m[0]; drawSeg(); draw(); } }, m[1])); }); }
    drawSeg();
    root.appendChild(h('p', {}, 'Execution starts at address 0x0000. The memory sheet is drawn with address 0 at the bottom, so read it from the bottom up. Two things in the question are genuinely ambiguous, so you choose an assumption: R1 is never set in the visible code, and "4R0" is probably a typo.'));
    root.appendChild(h('div', { class: 'field-row' }, r1.el, h('div', { class: 'field' }, h('span', { class: 'lab' }, 'Reading of "4R0"'), seg)));
    var view = h('div'); root.appendChild(view);
    function hx4(v) { return E.hex(v, 4); }
    function draw() {
      Lab.clear(view);
      var R = run(), inputs = [];
      var table = h('div', { class: 'trace-table toy', role: 'table' });
      table.appendChild(h('div', { class: 'trow thead toyrow', role: 'row' }, ['Address and instruction', 'PC before', 'R0 before', 'PC after', 'R0 after'].map(function (t) { return h('span', { role: 'columnheader' }, t); })));
      R.rows.forEach(function (r, i) {
        var mk = function (ph) { var inp = h('input', { type: 'text', class: 'hex-in', placeholder: ph, spellcheck: 'false', 'aria-label': ph + ' row ' + (i + 1) }); return inp; };
        var rb = mk('R0 before'), pa = mk('PC after'), ra = mk('R0 after');
        inputs.push({ r: r, rb: rb, pa: pa, ra: ra });
        table.appendChild(h('div', { class: 'trow toyrow', role: 'row' }, h('span', { role: 'cell' }, h('code', {}, hx4(r.pcBefore)), ' ', r.ins.d), h('span', { role: 'cell' }, h('code', {}, hx4(r.pcBefore))), h('span', { role: 'cell' }, rb), h('span', { role: 'cell' }, pa), h('span', { role: 'cell' }, ra)));
      });
      table.appendChild(h('div', { class: 'trow toyrow' }, h('span', {}, h('code', {}, '0x0030'), ' stop'), h('span', {}, h('code', {}, '0x0030')), h('span', {}), h('span', {}), h('span', {})));
      view.appendChild(h('div', { class: 'table-wrap' }, table));
      var m40 = h('input', { type: 'text', class: 'hex-in', placeholder: '0x........', 'aria-label': 'Contents of address 0x40' });
      view.appendChild(h('div', { class: 'field-row' }, h('div', { class: 'field' }, h('label', {}, 'Contents of address 0x0040 when the program stops'), m40)));
      var slot = h('div');
      function okv(inp, want) { var v = inp.value.trim(); if (want === null) return v === '' || v === '?'; return E.parseValue(v) === want; }
      view.appendChild(h('div', { class: 'btn-row' }, h('button', { class: 'btn btn-primary', type: 'button', onclick: function () {
        var all = true;
        inputs.forEach(function (x) {
          var a = okv(x.rb, x.r.r0Before), b = okv(x.pa, x.r.pcAfter), c = okv(x.ra, x.r.r0After);
          [[x.rb, a], [x.pa, b], [x.ra, c]].forEach(function (p) { p[0].classList.toggle('ok', p[1]); p[0].classList.toggle('bad', !p[1]); });
          if (!(a && b && c)) all = false;
        });
        var mm = okv(m40, R.mem40); m40.classList.toggle('ok', mm); m40.classList.toggle('bad', !mm); if (!mm) all = false;
        Lab.clear(slot);
        slot.appendChild(h('div', { class: 'feedback ' + (all ? 'good' : 'bad') }, h('strong', { class: 'verdict' }, all ? 'Every cell is correct.' : 'Some cells are off. Red ones need another look.'),
          h('div', { html: Lab.fmt('Remember: the PC after an instruction is its address + 4, **except a branch**, where it is the target. The path is `0x00 > 0x18 > 0x1C > 0x20 > 0x24 > 0x28 > 0x38 > 0x3C > 0x2C > 0x30`. It looks like a loop, but it is a single detour: `0x28` jumps forward to `0x38`, and `0x3C` jumps back to `0x2C`, which sits **below** `0x38`. Use "?" or leave R0 blank where it is not yet known.') })));
      } }, 'Check the table'), h('button', { class: 'btn btn-quiet', type: 'button', onclick: function () {
        inputs.forEach(function (x) { x.rb.value = x.r.r0Before === null ? '?' : E.hex(x.r.r0Before); x.pa.value = hx4(x.r.pcAfter); x.ra.value = x.r.r0After === null ? '?' : E.hex(x.r.r0After); });
        m40.value = E.hex(R.mem40);
      } }, 'Fill in the answers')));
      view.appendChild(slot);
    }
    draw();
  };
})(window);
