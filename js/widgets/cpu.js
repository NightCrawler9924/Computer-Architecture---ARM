/* CPU and memory widgets: the three buses, DRAM charge, and the fetch-decode-execute cycle. */
(function (g) {
  'use strict';
  var E = g.E359, Lab = g.Lab, h = Lab.h;
  var hx = E.hex;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, kids) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  Lab.svg = s;

  /* ---------- the three buses: a memory read and a memory write, step by step ---------- */
  Lab.widgets.buses = function (root, o) {
    o = o || {};
    var st = { mode: o.mode || 'read', step: 0, addr: o.addr !== undefined ? o.addr >>> 0 : 0x20008004, wdata: 0xCAFEF00D, mem: 0x88796A5B, timer: null };
    var fa = Lab.hexField({ value: st.addr, label: 'Address', onChange: function (v) { st.addr = v; render(); } });
    var fd = Lab.hexField({ value: st.mem, label: 'Value stored in that location', onChange: function (v) { st.mem = v; render(); } });
    var fw = Lab.hexField({ value: st.wdata, label: 'Value the CPU writes', onChange: function (v) { st.wdata = v; render(); } });
    var seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Cycle type' });
    function drawSeg() {
      Lab.clear(seg);
      [['read', 'Read cycle'], ['write', 'Write cycle']].forEach(function (m) { seg.appendChild(h('button', { type: 'button', 'aria-pressed': st.mode === m[0] ? 'true' : 'false', onclick: function () { stop(); st.mode = m[0]; st.step = 0; drawSeg(); render(); } }, m[1])); });
    }
    var inputsRow = h('div', { class: 'field-row' }, h('div', { class: 'field' }, h('span', { class: 'lab' }, 'Cycle'), seg), fa.el, fd.el);
    root.appendChild(inputsRow);
    var view = h('div'); root.appendChild(view);
    drawSeg();

    var READ = [
      ['Put the address on the address bus', 'The CPU drives all 32 address lines with the location it wants. The address bus runs one way only: CPU to memory.'],
      ['Activate the memory read signal', 'The control bus carries the type of transaction. Asserting MEMORY READ tells memory this is a read, not a write.'],
      ['Wait for the memory (the access time)', 'Memory needs time to find the location and drive its data. The CPU just waits. This delay is the access time.'],
      ['Memory puts the data on the data bus; the CPU reads it', 'The data bus carries the value. For a read, memory drives it and the CPU samples it. The location keeps its contents (reads do not destroy).'],
      ['Drop the memory read signal', 'The CPU releases the control line, which ends the cycle. The bus is free for the next transaction.']
    ];
    var WRITE = [
      ['Put the address on the address bus', 'Same first step as a read: say which location.'],
      ['Put the data to be written on the data bus', 'A write must supply the value as well as the address, and this time the CPU drives the data bus. A read has no such step.'],
      ['Activate the memory write signal', 'Asserting MEMORY WRITE tells memory to take the value from the data bus.'],
      ['Wait for the memory to store the data', 'Memory stores the value. The old contents of this location are destroyed. Writes are destructive.'],
      ['Drop the memory write signal', 'The CPU releases the control line and the cycle ends.']
    ];

    function stop() { if (st.timer) { clearInterval(st.timer); st.timer = null; } }
    function play() {
      if (st.timer) { stop(); render(); return; }
      if (reduce) { st.step = 5; render(); return; }
      if (st.step >= 5) st.step = 0;
      st.timer = setInterval(function () { if (!root.isConnected) { stop(); return; } st.step++; if (st.step >= 5) stop(); render(); }, 1300);
      render();
    }

    function diagram() {
      var rd = st.mode === 'read', k = st.step;      // k steps completed (0..5); highlight k-1
      var cur = k - 1;
      var addrOn = k >= 1 && k <= (rd ? 5 : 5) && !(k === 5);
      var addrActive = cur === 0 || (cur >= 1 && cur <= 3);
      var dataActive = rd ? (cur === 3) : (cur === 1 || cur === 2 || cur === 3);
      var ctlActive = rd ? (cur === 1 || cur === 2 || cur === 3) : (cur === 2 || cur === 3);
      var addrVal = (k >= 1 && k < 5) ? hx(st.addr) : 'idle';
      var dataVal = rd ? (cur === 3 ? hx(st.mem) : 'idle') : ((cur >= 1 && cur <= 3) ? hx(st.wdata) : 'idle');
      var ctlVal = ctlActive ? (rd ? 'MEM READ asserted' : 'MEM WRITE asserted') : 'idle';
      var memLine = rd ? (hx(st.mem)) : (cur >= 3 ? hx(st.wdata) : hx(st.mem));
      var busy = rd ? cur === 2 : cur === 3;
      var svg = s('svg', { viewBox: '0 0 760 250', class: 'busdiag', role: 'img', 'aria-label': 'CPU and memory joined by an address bus, a data bus and a control bus. Step ' + k + ' of 5.' });
      svg.appendChild(s('defs', {}, [s('marker', { id: 'arr', viewBox: '0 0 10 10', refX: '8', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, [s('path', { d: 'M0 0 L10 5 L0 10 z', fill: 'currentColor' })])]));
      function box(x, y, w, hh, title, sub, cls) { return s('g', { class: 'bx ' + (cls || '') }, [s('rect', { x: x, y: y, width: w, height: hh, rx: 6 }), s('text', { x: x + w / 2, y: y + 28, 'text-anchor': 'middle', class: 'bt' }, [title]), sub ? s('text', { x: x + w / 2, y: y + 50, 'text-anchor': 'middle', class: 'bs' }, [sub]) : null]); }
      svg.appendChild(box(20, 20, 150, 210, 'CPU', 'registers, ALU, control'));
      svg.appendChild(box(590, 20, 150, 210, 'Memory', rd ? 'location ' + hx(st.addr, 8).slice(2) : 'location ' + hx(st.addr, 8).slice(2), busy ? 'busy' : ''));
      svg.appendChild(s('text', { x: 665, y: 140, 'text-anchor': 'middle', class: 'memval' }, [memLine]));
      svg.appendChild(s('text', { x: 665, y: 168, 'text-anchor': 'middle', class: 'bs' }, [!rd && cur >= 3 ? 'old value destroyed' : rd && cur >= 3 ? 'unchanged by the read' : 'contents']));
      function bus(y, label, val, active, dir, width) {
        var grp = s('g', { class: 'bus' + (active ? ' active' : '') });
        grp.appendChild(s('line', { x1: dir === 'left' ? 176 : 184, y1: y, x2: dir === 'right' ? 584 : 584, y2: y, 'marker-end': dir === 'left' ? null : 'url(#arr)', 'marker-start': (dir === 'both' || dir === 'left') ? 'url(#arr)' : null }));
        if (dir === 'left') { grp.firstChild.setAttribute('x1', 584); grp.firstChild.setAttribute('x2', 184); grp.firstChild.setAttribute('marker-end', 'url(#arr)'); grp.firstChild.removeAttribute('marker-start'); }
        grp.appendChild(s('text', { x: 380, y: y - 12, 'text-anchor': 'middle', class: 'bl' }, [label]));
        grp.appendChild(s('text', { x: 380, y: y + 24, 'text-anchor': 'middle', class: 'bv' }, [val]));
        return grp;
      }
      svg.appendChild(bus(60, 'Address bus (32 lines, CPU to memory)', addrVal, addrActive, 'right'));
      svg.appendChild(bus(135, 'Data bus (' + (rd ? 'memory to CPU' : 'CPU to memory') + ')', dataVal, dataActive, rd ? 'left' : 'right'));
      svg.appendChild(bus(210, 'Control bus (type of transaction)', ctlVal, ctlActive, 'right'));
      return svg;
    }

    function render() {
      Lab.clear(view);
      var steps = st.mode === 'read' ? READ : WRITE, k = st.step;
      fd.el.style.display = st.mode === 'read' ? '' : 'none';
      if (st.mode === 'write' && !fw.el.parentNode) inputsRow.appendChild(fw.el);
      if (st.mode === 'read' && fw.el.parentNode) fw.el.remove();
      view.appendChild(h('figure', { class: 'figure' }, diagram(), h('figcaption', { class: 'muted' }, 'The three buses carry three different things: where (address), what (data) and which kind of transaction (control).')));
      var list = h('ol', { class: 'cycle-steps' });
      steps.forEach(function (sp, i) { list.appendChild(h('li', { class: i < k ? 'done' : '', 'aria-current': i === k - 1 ? 'step' : null }, h('strong', {}, sp[0]), i === k - 1 ? h('p', {}, sp[1]) : null)); });
      view.appendChild(list);
      view.appendChild(h('div', { class: 'btn-row' },
        h('button', { class: 'btn btn-primary btn-sm', type: 'button', disabled: k >= 5, onclick: function () { stop(); st.step++; render(); } }, k === 0 ? 'Start' : 'Next step'),
        h('button', { class: 'btn btn-sm', type: 'button', onclick: play }, st.timer ? 'Pause' : 'Play'),
        h('button', { class: 'btn btn-sm btn-quiet', type: 'button', onclick: function () { stop(); st.step = 0; render(); } }, 'Reset')));
      if (k >= 5) view.appendChild(h('p', { class: 'muted', style: { marginTop: '10px' } }, st.mode === 'read' ? 'A read put the address and a control signal out, and got data back.' : 'A write put the address, the data and a control signal out. Nothing comes back except the stored value.'));
    }
    render();
  };

  /* ---------- DRAM: leakage, refresh and destructive reads ---------- */
  Lab.widgets.dram = function (root, o) {
    o = o || {};
    var st = { t: 0, refresh: 64, charge: 1, stored: 1, running: false, timer: null, readStage: 0, lost: false, log: [] };
    var TAU = 70;                       // illustrative leak time constant, ms
    var bar = h('div', { class: 'charge', role: 'img', 'aria-label': 'Charge on the capacitor' }, h('div', { class: 'charge-fill' }), h('div', { class: 'charge-thr', title: 'threshold' }));
    var readout = h('div', { class: 'mono', 'aria-live': 'polite' });
    var msg = h('p', { 'aria-live': 'polite' });
    var slider = h('input', { type: 'range', min: 10, max: 200, value: st.refresh, id: 'dram-ref', 'aria-label': 'Refresh period in milliseconds' });
    var sOut = h('output', { for: 'dram-ref', class: 'mono' }, st.refresh + ' ms');
    slider.addEventListener('input', function () { st.refresh = +slider.value; sOut.textContent = st.refresh + ' ms'; });
    var runBtn = h('button', { class: 'btn btn-primary btn-sm', type: 'button' }, 'Start the clock');
    var readBtn = h('button', { class: 'btn btn-sm', type: 'button' }, 'Read the bit');
    var resetBtn = h('button', { class: 'btn btn-sm btn-quiet', type: 'button' }, 'Reset');
    root.appendChild(h('p', {}, 'One DRAM cell is a tiny capacitor. A charged capacitor is a 1. Press start and watch the charge leak. The dashed line is the level below which the cell reads as 0.'));
    root.appendChild(h('div', { class: 'field-row' }, h('div', { class: 'field' }, h('label', { for: 'dram-ref' }, 'Refresh period: ', sOut), slider)));
    root.appendChild(h('div', { class: 'dram-view' }, bar, h('div', {}, readout, msg)));
    root.appendChild(h('div', { class: 'btn-row' }, runBtn, readBtn, resetBtn));
    var tl = h('div', { class: 'cycle-compare', 'aria-hidden': 'true' });
    root.appendChild(tl);

    function paint() {
      bar.firstChild.style.height = Math.max(0, Math.min(1, st.charge)) * 100 + '%';
      bar.firstChild.classList.toggle('low', st.charge < 0.5);
      readout.textContent = 't = ' + Math.round(st.t) + ' ms since last refresh   charge = ' + Math.round(st.charge * 100) + '%';
      Lab.clear(tl);
      if (st.readStage) {
        tl.appendChild(h('div', { class: 'tl-row' }, h('span', { class: 'tl-lab' }, 'Access time'), h('span', { class: 'tl-bar a', style: { width: '40%' } }, 'read')));
        tl.appendChild(h('div', { class: 'tl-row' }, h('span', { class: 'tl-lab' }, 'Cycle time'), h('span', { class: 'tl-bar a', style: { width: '40%' } }, 'read'), h('span', { class: 'tl-bar b', style: { width: '40%' } }, 'restore')));
      }
    }
    function tick() {
      st.t += 4;
      st.charge = Math.exp(-st.t / TAU) * (st.stored ? 1 : 0);
      if (st.t >= st.refresh) { if (st.charge >= 0.5) { st.t = 0; st.charge = st.stored; msg.textContent = 'Refresh: the cell was read and rewritten at full charge.'; } else { st.stored = 0; st.lost = true; msg.textContent = 'The charge fell below the threshold before the refresh arrived. The 1 is now a 0, and no refresh can bring it back.'; stop(); } }
      else if (st.charge < 0.5 && st.stored && !st.lost) { st.stored = 0; st.lost = true; msg.textContent = 'Too late. The refresh period is longer than the cell can hold its charge, so the bit decayed to 0 before the refresh arrived.'; stop(); }
      paint();
    }
    function stop() { if (st.timer) { clearInterval(st.timer); st.timer = null; } runBtn.textContent = 'Start the clock'; }
    runBtn.addEventListener('click', function () {
      if (st.timer) { stop(); return; }
      if (st.lost) reset();
      st.timer = setInterval(function () { if (!root.isConnected) { stop(); return; } tick(); }, 60);
      runBtn.textContent = 'Pause';
      msg.textContent = 'Charge is leaking. DRAM controllers refresh every cell about every 64 ms.';
    });
    readBtn.addEventListener('click', function () {
      if (!st.stored) { msg.textContent = 'The cell already holds 0, so a read finds no charge.'; return; }
      st.readStage = 1; st.charge = 0;
      msg.innerHTML = 'Reading works by testing whether the capacitor is charged, and the test <strong>drains it</strong>. The 1 was read correctly, but the cell is now empty, so a restore cycle must write it back. That is why the DRAM cycle time is about twice the access time.';
      paint();
      setTimeout(function () { if (!root.isConnected) return; st.charge = 1; st.t = 0; st.readStage = 2; paint(); }, reduce ? 0 : 900);
    });
    function reset() { stop(); st = Object.assign(st, { t: 0, charge: 1, stored: 1, readStage: 0, lost: false }); msg.textContent = ''; paint(); }
    resetBtn.addEventListener('click', reset);
    paint();
  };

  /* ---------- fetch, decode, execute ---------- */
  var DEFAULT_PROG = ['  MOV R0, #5', '  ADD R0, R0, #1', '  MOV R0, R0, LSL #1', '  CMP R0, #10', '  BPL big', '  MOV R1, #0', '  B stop', 'big MOV R1, #1', 'stop B stop'].join('\n');

  Lab.widgets.fetchCycle = function (root, o) {
    o = o || {};
    var code = o.code || DEFAULT_PROG;
    var asm = E.assemble(code);
    var cpu = new E.CPU(); cpu.reset(asm);
    var st = { phase: 0, ir: null, pcFetched: null, trace: null, timer: null, count: 0 };   // phase 0 = about to fetch, 1 = fetched, 2 = decoded, 3 = executed
    var view = h('div');
    root.appendChild(view);

    function insAt(a) { return asm.program[(a - E.CODE_BASE) / 4]; }
    function word(ins) { var w = ins ? E.encode(ins) : null; return w === null ? null : w; }

    function render() {
      Lab.clear(view);
      var ins = insAt(cpu.pc), done = cpu.halted && !ins;
      var phaseNames = ['Fetch', 'Decode', 'Execute'];
      var active = st.phase === 0 ? 0 : st.phase === 1 ? 1 : st.phase === 2 ? 2 : -1;
      var chips = h('div', { class: 'phase-row', role: 'list' }, phaseNames.map(function (n, i) { return h('div', { role: 'listitem', class: 'phase' + (st.phase === i + 1 || (st.phase === 0 && i === 0 && false) ? ' on' : '') + (st.phase > i + 1 ? ' past' : ''), 'aria-current': st.phase === i + 1 ? 'step' : null }, n); }));
      view.appendChild(chips);

      var left = h('div', { class: 'memlist', role: 'group', 'aria-label': 'Instruction memory' }, h('div', { class: 'memhead' }, 'Memory (instructions)'));
      asm.program.forEach(function (p) {
        var w = word(p);
        left.appendChild(h('div', { class: 'memline' + (p.addr === (st.phase >= 1 && st.phase <= 3 && st.pcFetched !== null ? st.pcFetched : cpu.pc) && !cpu.halted ? ' pc' : '') }, h('span', { class: 'addr mono' }, hx(p.addr, 4)), h('span', { class: 'mono word' }, w === null ? '-' : hx(w)), h('span', { class: 'mono asmtxt', html: Lab.asmHtml(p.text.replace(/^\S+\s+(?=[A-Za-z]{2,}\s)/, function (m) { return m; })) })));
      });
      var cur = st.phase >= 1 && st.pcFetched !== null ? insAt(st.pcFetched) : ins;
      var shownPC = st.phase >= 1 && st.phase <= 2 ? (st.pcFetched + 4) : cpu.pc;
      var right = h('div', { class: 'cpubox' },
        h('div', { class: 'cpurow' }, reg('PC', hx(shownPC), st.phase === 1), reg('IR', st.ir !== null ? hx(st.ir) : '-', st.phase === 1 || st.phase === 2)),
        h('div', { class: 'cpurow' }, reg('Decoder / control', st.phase === 2 ? 'fields split, control signals made' : st.phase === 3 ? 'signals applied' : 'idle', st.phase === 2), reg('ALU', st.phase === 3 ? 'working' : 'idle', st.phase === 3)),
        h('div', { class: 'cpurow regs' }, [0, 1, 2, 3].map(function (i) { return reg('R' + i, hx(cpu.reg[i]), st.trace && st.trace.changed && st.trace.changed.indexOf(i) >= 0 && st.phase === 3); })),
        h('div', { class: 'cpurow' }, Lab.flagChips(cpu.f)));
      view.appendChild(h('div', { class: 'cycle-grid' }, left, right));

      var narr = h('div', { class: 'cycle-narr', 'aria-live': 'polite' });
      if (cpu.halted && st.phase === 0) narr.innerHTML = '<strong>Finished.</strong> ' + Lab.esc(cpu.haltReason);
      else if (st.phase === 0) narr.innerHTML = 'Ready to fetch. The PC holds <code>' + hx(cpu.pc) + '</code>, the address of the next instruction.';
      else if (st.phase === 1) narr.innerHTML = '<strong>Fetch.</strong> The PC (<code>' + hx(st.pcFetched) + '</code>) goes onto the address bus and memory read is asserted. The word <code>' + (st.ir !== null ? hx(st.ir) : '?') + '</code> comes back on the data bus into the instruction register. During the fetch the PC is incremented by 4 (every ARM instruction is 4 bytes), so it now reads <code>' + hx(st.pcFetched + 4) + '</code>.';
      else if (st.phase === 2) narr.appendChild(decodeBlock(cur, st.ir));
      else if (st.phase === 3) narr.innerHTML = '<strong>Execute.</strong> ' + Lab.esc(st.trace ? st.trace.msg : '') + (st.trace && st.trace.branch !== null ? ' <em>A branch overwrites the PC, so there is no +4 on top.</em>' : '');
      view.appendChild(narr);

      view.appendChild(h('div', { class: 'btn-row' },
        h('button', { class: 'btn btn-primary btn-sm', type: 'button', disabled: cpu.halted && st.phase === 0, onclick: function () { advance(); } }, st.phase === 0 ? 'Fetch' : st.phase === 1 ? 'Decode' : st.phase === 2 ? 'Execute' : 'Next instruction'),
        h('button', { class: 'btn btn-sm', type: 'button', disabled: cpu.halted && st.phase === 0, onclick: function () { auto(); } }, st.timer ? 'Pause' : 'Auto-run'),
        h('button', { class: 'btn btn-sm btn-quiet', type: 'button', onclick: function () { stopAuto(); cpu.reset(asm); st = { phase: 0, ir: null, pcFetched: null, trace: null, timer: null, count: 0 }; render(); } }, 'Reset')));
      view.appendChild(h('p', { class: 'muted' }, 'Instruction words come from the encoder: each is 32 bits. Step through a few times and watch the PC. It goes up by 4 after each instruction, except after a branch.'));
    }
    function reg(name, val, hot) { return h('div', { class: 'cpureg' + (hot ? ' hot' : '') }, h('span', { class: 'rn' }, name), h('span', { class: 'rv mono' }, val)); }
    function decodeBlock(ins, w) {
      var box = h('div');
      box.appendChild(h('p', {}, h('strong', {}, 'Decode. '), 'The decoder splits the instruction register into fields, and the control unit turns them into signals for the execute stage.'));
      var fields = Lab.fieldsOf ? Lab.fieldsOf(ins, w) : null;
      if (fields) box.appendChild(Lab.fieldsTable(fields));
      var c = E.condByName(ins.cond);
      box.appendChild(h('p', { class: 'muted' }, ins.cond === 'AL' ? 'The condition is AL (always), so the instruction will run.' : 'The condition is ' + ins.cond + ' (' + c.need + '). The flags are ' + Lab.flagStr(cpu.f) + ', so this instruction will ' + (c.fn(cpu.f) ? 'run.' : 'be skipped.')));
      return box;
    }
    function advance() {
      if (st.phase === 0) {
        if (cpu.halted) return;
        var ins = insAt(cpu.pc);
        if (!ins) { cpu.step(); render(); return; }
        st.pcFetched = cpu.pc; st.ir = word(ins); st.phase = 1;
      } else if (st.phase === 1) st.phase = 2;
      else if (st.phase === 2) { st.trace = cpu.step(); st.phase = 3; }
      else { st.phase = 0; st.trace = null; st.pcFetched = null; st.ir = st.ir; }
      render();
    }
    function stopAuto() { if (st.timer) { clearInterval(st.timer); st.timer = null; } }
    function auto() {
      if (st.timer) { stopAuto(); render(); return; }
      st.timer = setInterval(function () { if (!root.isConnected || (cpu.halted && st.phase === 0)) { stopAuto(); render(); return; } advance(); }, reduce ? 200 : 900);
      render();
    }
    render();
  };
})(window);
