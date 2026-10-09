/* Program checker for "write an ARM program that..." problems.
   You write the assembly. It runs your program against several test inputs and reports which tests passed.
   It never shows a solution or the expected values. Failing tests show what YOUR program produced. */
(function (g) {
  'use strict';
  var E = g.E359, Lab = g.Lab, h = Lab.h, hx = E.hex;

  Lab.widgets.asmChallenge = function (root, o) {
    var key = 'e359.code.' + o.id, st = { hint: 0 };
    var saved = Lab.lsGet(key);
    var ta = h('textarea', { id: 'ch-' + o.id, class: 'sim-src ch-src', rows: o.rows || 12, spellcheck: 'false', 'aria-label': 'Your assembly program for ' + (o.title || o.id) });
    ta.value = saved !== null && saved !== undefined ? saved : (o.starter || '  ; write your program here, with a comment on every instruction\nstop B stop');
    ta.addEventListener('input', function () { Lab.lsSet(key, ta.value); });
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') { e.preventDefault(); var s0 = ta.selectionStart; ta.value = ta.value.slice(0, s0) + '  ' + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = s0 + 2; Lab.lsSet(key, ta.value); }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
    });
    var resultSel = null;
    if (o.resultChoice) {
      resultSel = h('select', { id: 'chr-' + o.id, 'aria-label': 'Register that holds your result' }, ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12'].map(function (r) { return h('option', { value: r, selected: r === (o.resultDefault || 'R0') }, r); }));
    }
    var out = h('div', { 'aria-live': 'polite' });
    var runBtn = h('button', { class: 'btn btn-primary', type: 'button' }, 'Run the tests');
    var simBtn = h('button', { class: 'btn', type: 'button', title: 'Open your program in the simulator with the first test input, to debug it' }, 'Debug in the simulator');
    var clearBtn = h('button', { class: 'btn btn-quiet', type: 'button' }, 'Start over');
    var hintBtn = o.hints && o.hints.length ? h('button', { class: 'btn btn-quiet', type: 'button' }, 'Give me a hint') : null;
    var hintBox = h('div');
    runBtn.addEventListener('click', run);
    clearBtn.addEventListener('click', function () { ta.value = o.starter || '  ; write your program here, with a comment on every instruction\nstop B stop'; Lab.lsSet(key, ta.value); Lab.clear(out); });
    simBtn.addEventListener('click', function () {
      var t = o.tests[0], regs = {}; Object.keys(t.regs || {}).forEach(function (k) { regs[k] = t.regs[k]; });
      Lab.openInSim(ta.value + '\n' + (t.data || ''), { regs: regs });
    });
    if (hintBtn) hintBtn.addEventListener('click', function () {
      if (st.hint >= o.hints.length) return;
      hintBox.appendChild(h('p', { class: 'hint-item', html: Lab.fmt('**Hint ' + (st.hint + 1) + ' of ' + o.hints.length + '.** ' + o.hints[st.hint]) }));
      st.hint++; if (st.hint >= o.hints.length) hintBtn.disabled = true;
    });
    root.appendChild(h('div', { class: 'ch' },
      o.note ? h('p', { class: 'muted', html: Lab.fmt(o.note) }) : null,
      resultSel ? h('div', { class: 'field', style: { maxWidth: '16rem', marginBottom: '8px' } }, h('label', { for: 'chr-' + o.id }, 'My result goes in'), resultSel) : null,
      ta, h('div', { class: 'btn-row', style: { marginTop: '10px' } }, runBtn, simBtn, hintBtn, clearBtn), hintBox, out));

    function readWord(cpu, addr) { return cpu.readN(addr, 4); }

    function run() {
      Lab.clear(out);
      var code = ta.value, codeLines = code.split('\n');
      var first = E.assemble(code + '\n' + (o.tests[0].data || ''));
      if (!first.ok) { showErrors(first.errors, true); return; }
      // comment check: the homework asks for a comment on every instruction
      var missing = 0, total = 0;
      first.program.forEach(function (p) { total++; if (!/[;@]|\/\//.test(codeLines[p.line - 1] || '')) missing++; });
      var rows = [], passed = 0, firstErr = null;
      for (var i = 0; i < o.tests.length; i++) {
        var t = o.tests[i], a = E.assemble(code + '\n' + (t.data || ''));
        if (!a.ok) { firstErr = a.errors; break; }
        var cpu = new E.CPU(); cpu.reset(a);
        Object.keys(t.regs || {}).forEach(function (k) { cpu.reg[E.parseReg(k)] = t.regs[k] >>> 0; });
        cpu.run(200000);
        var items = [], ok = true;
        var resultReg = resultSel ? resultSel.value : null;
        var ex = t.expect || {};
        Object.keys(ex.regs || {}).forEach(function (k) {
          var reg = k === 'RESULT' ? resultReg : k, got = cpu.reg[E.parseReg(reg)] >>> 0, good = got === (ex.regs[k] >>> 0);
          if (!good) ok = false; items.push({ name: reg, got: got, good: good });
        });
        if (ex.mem) {
          var base = a.labels[ex.mem.label];
          ex.mem.words.forEach(function (w, j) {
            var got = readWord(cpu, base + 4 * j), good = got === (w >>> 0);
            if (!good) ok = false; items.push({ name: ex.mem.label + '[' + j + ']', got: got, good: good });
          });
        }
        var timedOut = /Stopped after/.test(cpu.haltReason), fault = /fault/i.test(cpu.haltReason);
        if (timedOut || fault) ok = false;
        if (ok) passed++;
        rows.push({ t: t, ok: ok, items: items, timedOut: timedOut, fault: fault ? cpu.haltReason : null, ranOff: /ran past/.test(cpu.haltReason) });
      }
      if (firstErr) { showErrors(firstErr, true); return; }
      var all = passed === o.tests.length;
      var fb = h('div', { class: 'feedback ' + (all ? 'good' : 'bad') },
        h('strong', { class: 'verdict' }, all ? 'All ' + o.tests.length + ' tests passed.' : passed + ' of ' + o.tests.length + ' tests passed.'),
        h('div', {}, all ? (o.passNote || 'Your program gives the right result for every test input.') : 'The failing tests show what your program produced. The expected values stay hidden on purpose, so work out what each input should give.'));
      out.appendChild(fb);
      var tbl = Lab.table(['Test', 'Result', 'What your program produced'], rows.map(function (r) {
        var detail = r.fault ? r.fault : r.timedOut ? 'It was still running after 200,000 steps. Look for a loop that never ends.' :
          r.items.filter(function (x) { return !x.good; }).map(function (x) { return x.name + ' = ' + hx(x.got); }).join(', ') || (r.ok ? 'matches' : '');
        return [r.t.label, h('span', { class: r.ok ? 'cond-yes' : 'cond-no', style: { color: r.ok ? '' : 'var(--danger)' } }, r.ok ? 'Passed' : 'Failed'), r.ok ? '' : detail];
      }));
      out.appendChild(tbl);
      if (rows.some(function (r) { return r.ranOff; })) out.appendChild(h('p', { class: 'muted' }, 'Your program ran past its last instruction. End it with a loop such as stop B stop so it halts cleanly.'));
      if (missing) out.appendChild(h('div', { class: 'callout tip' }, h('span', { class: 'label' }, 'Comments'), h('div', {}, missing + ' of ' + total + ' instructions have no comment. The homework asks for a comment on every instruction.')));
      else if (total) out.appendChild(h('p', { class: 'muted' }, 'Every instruction has a comment, as the homework asks.'));
    }
    function showErrors(errs, inTests) {
      var fb = h('div', { class: 'feedback bad' }, h('strong', { class: 'verdict' }, 'The program did not assemble.'));
      errs.slice(0, 3).forEach(function (er) { fb.appendChild(h('div', {}, 'Line ' + er.line + ': ' + er.msg)); });
      if (inTests) fb.appendChild(h('div', { class: 'muted' }, 'If the message mentions a label the checker supplies (such as array_1), remove your own definition of it.'));
      out.appendChild(fb);
    }
  };
})(window);
