/* The ARM simulator widget. Full page version and the small version embedded in lessons. */
(function (g) {
  'use strict';
  var E = g.E359, Lab = g.Lab, h = Lab.h;
  var hx = E.hex;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- presets taken from the course material ---------- */
  var M_SLIDE = [{ addr: 0x02000000, bytes: [0xE1, 0xE3, 0x65, 0x87] }];
  var M_IDX = [{ addr: 0x20008000, bytes: [0x1F, 0x2E, 0x3D, 0x4C, 0x5B, 0x6A, 0x79, 0x88] }];
  Lab.presets = [
    { id: 'hw1-p2a', title: 'Homework 1, Problem 2(a): ADDS and its flags', source: 'Homework 1',
      code: '; R0 = 0xFAB46AD2, R1 = 0xEFFD34A4 (set in the initial state)\n  ADDS R8, R0, R1\nstop B stop', init: { regs: { R0: 0xFAB46AD2, R1: 0xEFFD34A4, R2: 0x9876543D } } },
    { id: 'hw1-p3', title: 'Homework 1, Problem 3: the conditional chain', source: 'Homework 1',
      code: '; flags start as C=1 V=1 Z=0 N=0\n  CMP    R0, R2\n  CMPGTS R2, R0\n  ADDGTS R1, R0, R2\n  SUBCS  R0, R2\nstop B stop', init: { regs: { R0: 0xFED46A34, R1: 0xEFFD3456, R2: 0x7865432A }, flags: { N: 0, Z: 0, C: 1, V: 1 } } },
    { id: 'add64', title: '64-bit addition with ADDS and ADC', source: 'Handout 03',
      code: '; C = A + B with A = 0x00000002FFFFFFFF, B = 0x0000000400000001\n  LDR  r0, =0xFFFFFFFF  ; A low\n  LDR  r1, =0x00000002  ; A high\n  LDR  r2, =0x00000001  ; B low\n  LDR  r3, =0x00000004  ; B high\n  ADDS r4, r2, r0       ; low words, sets the carry\n  ADC  r5, r3, r1       ; high words plus that carry\nstop B stop' },
    { id: 'sub64', title: '64-bit subtraction with SUBS and SBC', source: 'Handout 03',
      code: '; C = A - B\n  LDR  r0, =0xFFFFFFFF  ; A low\n  LDR  r1, =0x00000002  ; A high\n  LDR  r2, =0x00000001  ; B low\n  LDR  r3, =0x00000004  ; B high\n  SUBS r4, r0, r2\n  SBC  r5, r1, r3\nstop B stop' },
    { id: 'mul35', title: 'Multiply by 35 with shifts and adds', source: 'Module 3',
      code: '; R0 = 3, so the answer should be 105\n  MOV r0, #3\n  ADD r0, r0, r0, LSL #2  ; 5 x R0\n  RSB r0, r0, r0, LSL #3  ; 8 x (5R0) - 5R0 = 35 x R0\nstop B stop' },
    { id: 'ifelse', title: 'If / else with conditional execution (no branches)', source: 'Module 3',
      code: '; if (R9 == 7) R0 = R1 else R0 = R2 + R3\n  MOV R9, #7\n  MOV R1, #11\n  MOV R2, #20\n  MOV R3, #30\n  CMP R9, #7\n  MOVEQ R0, R1\n  ADDNE R0, R2, R3\nstop B stop' },
    { id: 'abs', title: 'Absolute value with RSBLT', source: 'Module 3',
      code: '; if (a < 0) a = 0 - a;\n  MOV R1, #-5\n  CMP R1, #0\n  RSBLT R1, R1, #0\nstop B stop' },
    { id: 'while', title: 'while (R0 > 50) loop', source: 'Module 3',
      code: '; while R0 > 50:  R1 = R1 + R2;  R0 = R0 - R1\n  MOV R0, #100\n  MOV R1, #0\n  MOV R2, #10\nagain CMP R0, #50\n  BLE getout          ; leave on the OPPOSITE condition\n  ADD R1, R1, R2\n  SUB R0, R0, R1\n  B again\ngetout\nstop B stop' },
    { id: 'for', title: 'for (i = 0; i < 10; i++) sum += i', source: 'Module 3',
      code: '  MOV R10, #0   ; sum\n  MOV R0, #0    ; i\nloop CMP R0, #10\n  BGE done\n  ADD R10, R10, R0\n  ADD R0, R0, #1\n  B loop\ndone\nstop B stop' },
    { id: 'arraysum', title: 'Sum an array with post-indexed loads', source: 'Module 3',
      code: '; four words at 0x20008000: 1, 2, 3, 4\n  MOV R3, #0\n  MOV R2, #0\n  LDR R0, =0x20008000\nLoop LDR R1, [R0], #4   ; load, then step R0 by 4 bytes\n  ADD R2, R2, R1\n  ADD R3, R3, #1\n  CMP R3, #4\n  BLT Loop\nstop B stop', init: { mem: [{ addr: 0x20008000, bytes: [1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0] }] } },
    { id: 'loads', title: 'Byte, halfword and word loads (little-endian)', source: 'Module 3',
      code: '; memory at 0x02000000 holds E1 E3 65 87\n  LDR  R0, =0x02000000\n  LDRB R1, [R0]\n  LDRH R2, [R0]\n  LDR  R3, [R0]\nstop B stop', init: { mem: M_SLIDE } },
    { id: 'indexing', title: 'Pre-index, post-index and auto-index', source: 'Module 3',
      code: '  LDR R0, =0x20008000\n  LDR R1, [R0, #4]    ; pre-index: R0 unchanged\n  LDR R2, [R0], #4    ; post-index: R0 <- R0 + 4 afterwards\n  LDR R3, [R0, #4]!   ; auto-index: R0 <- R0 + 4 first\nstop B stop', init: { mem: M_IDX } },
    { id: 'chain', title: 'Chained comparison with CMPEQ', source: 'Module 3',
      code: '; if ((R0 == R1) && (R2 == R3)) R4++\n  MOV R0, #5\n  MOV R1, #5\n  MOV R2, #9\n  MOV R3, #9\n  MOV R4, #0\n  CMP   R0, R1\n  CMPEQ R2, R3\n  ADDEQ R4, R4, #1\nstop B stop' },
    { id: 'bits', title: 'Set, clear, toggle and test a bit', source: 'Handout 03',
      code: '  MOV R0, #0x20     ; bit 5 set\n  MOV R1, #0\n  ORR R1, R1, #0x20  ; set bit 5\n  BIC R0, R0, #0x20  ; clear bit 5\n  MOV R2, #0xF0\n  EOR R2, R2, #0x20  ; toggle bit 5\n  TST R2, #0x20      ; test bit 5 (sets Z if it is clear)\nstop B stop' },
    { id: 'bfi', title: 'BFC, BFI and RBIT', source: 'Handout 03',
      code: '  LDR R4, =0xFFFFFFFF\n  BFC R4, #8, #12          ; clear bits 8 to 19\n  LDR R2, =0x00000ABC\n  MOV R9, #0\n  BFI R9, R2, #8, #12      ; insert 12 bits at bit 8\n  LDR R0, =0x12345678\n  RBIT R1, R0              ; reverse all 32 bits\nstop B stop' },
    { id: 'call', title: 'Call a function with BL, return with BX LR, save with PUSH and POP', source: 'Module 3',
      code: '  MOV R0, #5\n  BL double\n  BL double\n  B stop\ndouble PUSH {R4, LR}\n  ADD R0, R0, R0\n  POP {R4, LR}\n  BX LR\nstop B stop' },
    { id: 'stm', title: 'STMED and LDMED (empty descending stack)', source: 'Homework 1 formula sheet',
      code: '  LDR R0, =0x20007F00\n  MOV R1, #1\n  MOV R2, #2\n  MOV R3, #3\n  STMED R0!, {R1-R3}\n  MOV R1, #0\n  MOV R2, #0\n  MOV R3, #0\n  LDMED R0!, {R1-R3}\nstop B stop' },
    { id: 'blank', title: 'Blank program', source: '', code: '  ; type your own program here\n  MOV R0, #1\nstop B stop' }
  ];

  /* ---------- helpers ---------- */
  function parseMemText(txt) {
    var out = [], errs = [];
    String(txt || '').split(/\n/).forEach(function (ln, i) {
      ln = ln.replace(/[;@].*$/, '').trim(); if (!ln) return;
      var m = /^([^:]+):\s*(.*)$/.exec(ln);
      if (!m) { errs.push('Memory line ' + (i + 1) + ' should look like  0x20008000: 1F 2E 3D 4C'); return; }
      var addr = E.parseValue(m[1]); if (addr === null) { errs.push('Memory line ' + (i + 1) + ': bad address'); return; }
      var rest = m[2].trim(), bytes = [];
      var wm = /^word\s+(.*)$/i.exec(rest);
      if (wm) wm[1].split(/[\s,]+/).forEach(function (w) { var v = E.parseValue(w); if (v !== null) for (var k = 0; k < 4; k++) bytes.push((v >>> (8 * k)) & 0xFF); });
      else rest.split(/[\s,]+/).forEach(function (b) { if (b === '') return; var v = parseInt(b.replace(/^0x/i, ''), 16); if (!isNaN(v) && v >= 0 && v <= 255) bytes.push(v); else errs.push('Memory line ' + (i + 1) + ': "' + b + '" is not a byte'); });
      out.push({ addr: addr, bytes: bytes });
    });
    return { mem: out, errors: errs };
  }
  function memToText(mem) {
    return (mem || []).map(function (m) { return hx(m.addr) + ': ' + m.bytes.map(function (b) { return b.toString(16).toUpperCase().padStart(2, '0'); }).join(' '); }).join('\n');
  }
  function regsUsed(prog) {
    var set = {};
    prog.forEach(function (p) {
      ['rd', 'rn', 'rm', 'rs', 'ra', 'rdlo', 'rdhi'].forEach(function (k) { if (p[k] !== undefined && p[k] !== null && !(k === 'rn' && (p.op === 'MOV' || p.op === 'MVN'))) set[p[k]] = 1; });
      if (p.o2 && p.o2.rm !== undefined) set[p.o2.rm] = 1;
      if (p.o2 && p.o2.sh && p.o2.sh.rs !== undefined) set[p.o2.sh.rs] = 1;
      if (p.mem && p.mem.rn !== null && p.mem.rn !== undefined) set[p.mem.rn] = 1;
      if (p.mem && p.mem.off && p.mem.off.rm !== undefined) set[p.mem.off.rm] = 1;
      (p.list || []).forEach(function (r) { set[r] = 1; });
    });
    return Object.keys(set).map(Number).filter(function (n) { return n !== 15; }).sort(function (a, b) { return a - b; });
  }
  function snapshot(cpu) { return { reg: cpu.reg.slice(), f: Object.assign({}, cpu.f), mem: new Map(cpu.mem), touched: new Map(cpu.touched), pc: cpu.pc, halted: cpu.halted, haltReason: cpu.haltReason, steps: cpu.steps }; }
  function restore(cpu, s) { cpu.reg = s.reg.slice(); cpu.f = Object.assign({}, s.f); cpu.mem = new Map(s.mem); cpu.touched = new Map(s.touched); cpu.pc = s.pc; cpu.halted = s.halted; cpu.haltReason = s.haltReason; cpu.steps = s.steps; }

  /* ---------- the widget ---------- */
  Lab.widgets.armSim = function (root, o) {
    o = o || {};
    var mini = !!o.mini, editable = o.editable !== undefined ? o.editable : !mini;
    var st = {
      src: o.code || Lab.presets[0].code, init: { regs: Object.assign({}, o.regs || {}), flags: Object.assign({ N: 0, Z: 0, C: 0, V: 0 }, o.flags || {}), mem: o.mem ? o.mem.slice() : [] },
      cpu: null, asm: null, history: [], trace: [], last: null, timer: null, fmt: 'hex', memBase: o.memBase !== undefined ? o.memBase >>> 0 : null, bps: {}, errs: []
    };
    if (o.init) { if (o.init.regs) st.init.regs = Object.assign({}, o.init.regs); if (o.init.flags) st.init.flags = Object.assign(st.init.flags, o.init.flags); if (o.init.mem) st.init.mem = o.init.mem.slice(); }

    var wrap = h('div', { class: 'sim' + (mini ? ' mini' : '') });
    root.appendChild(wrap);
    var editorCol = h('div', { class: 'sim-left' }), stateCol = h('div', { class: 'sim-right' });
    wrap.appendChild(editorCol); wrap.appendChild(stateCol);

    // toolbar
    var presetSel = null;
    if (!mini) {
      presetSel = h('select', { id: 'sim-preset', 'aria-label': 'Load an example program' }, [h('option', { value: '' }, 'Load an example…')].concat(Lab.presets.map(function (p) { return h('option', { value: p.id }, p.title); })));
      presetSel.addEventListener('change', function () { var p = Lab.presets.filter(function (x) { return x.id === presetSel.value; })[0]; if (p) loadPreset(p); presetSel.value = ''; });
    }
    var btnAsm = h('button', { class: 'btn btn-sm', type: 'button', title: 'Assemble and reset (Ctrl+Enter)' }, mini ? 'Reset' : 'Assemble and reset');
    var btnStep = h('button', { class: 'btn btn-primary btn-sm', type: 'button', title: 'Execute one instruction' }, 'Step');
    var btnBack = h('button', { class: 'btn btn-sm', type: 'button', title: 'Undo the last step' }, 'Back');
    var btnPlay = h('button', { class: 'btn btn-sm', type: 'button' }, 'Play');
    var btnRun = h('button', { class: 'btn btn-sm', type: 'button', title: 'Run until the program stops' }, 'Run to end');
    var toolbar = h('div', { class: 'btn-row sim-tools' }, btnStep, btnBack, btnPlay, btnRun, btnAsm);
    if (presetSel) editorCol.appendChild(h('div', { class: 'field-row' }, h('div', { class: 'field' }, h('label', { for: 'sim-preset' }, 'Course examples'), presetSel)));

    var ta = null, gutter = null, errBox = h('div', { class: 'sim-errors', 'aria-live': 'polite' });
    if (editable) {
      ta = h('textarea', { id: 'sim-src', class: 'sim-src', rows: Math.min(18, Math.max(8, st.src.split('\n').length + 1)), spellcheck: 'false', 'aria-label': 'Assembly source', autocapitalize: 'off', autocomplete: 'off' });
      ta.value = st.src;
      gutter = h('div', { class: 'sim-gutter mono', 'aria-hidden': 'true' });
      ta.addEventListener('input', function () { st.src = ta.value; drawGutter(); });
      ta.addEventListener('scroll', function () { gutter.scrollTop = ta.scrollTop; });
      ta.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); assemble(); }
        if (e.key === 'Tab') { e.preventDefault(); var s0 = ta.selectionStart; ta.value = ta.value.slice(0, s0) + '  ' + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = s0 + 2; st.src = ta.value; }
      });
      editorCol.appendChild(h('div', { class: 'sim-editor' }, gutter, ta));
      editorCol.appendChild(errBox);
    }
    editorCol.appendChild(toolbar);
    var listing = h('div', { class: 'sim-listing', role: 'group', 'aria-label': 'Assembled program. Select a line to toggle a breakpoint.' });
    editorCol.appendChild(listing);
    var hint = h('p', { class: 'muted sim-hint' }, editable ? 'Instructions start in the second column or later. Anything starting in the first column is a label. Select a line in the listing to set a breakpoint. Ctrl+Enter assembles.' : '');
    editorCol.appendChild(hint);

    var regBox = h('div', { class: 'sim-regs' }), flagBox = h('div'), msgBox = h('div', { class: 'sim-msg', 'aria-live': 'polite' }), memBox = h('div', { class: 'sim-mem' }), initBox = h('details', { class: 'sim-init' }), traceBox = h('div', { class: 'sim-trace' });
    var fmtSeg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Number format' });
    function drawFmt() { Lab.clear(fmtSeg); [['hex', 'Hex'], ['u', 'Unsigned'], ['s', 'Signed'], ['bin', 'Binary']].forEach(function (f) { fmtSeg.appendChild(h('button', { type: 'button', 'aria-pressed': st.fmt === f[0] ? 'true' : 'false', onclick: function () { st.fmt = f[0]; drawFmt(); draw(); } }, f[1])); }); }
    drawFmt();
    stateCol.appendChild(h('div', { class: 'sim-state-head' }, h('div', { class: 'subhead' }, 'Registers'), fmtSeg));
    stateCol.appendChild(regBox);
    stateCol.appendChild(h('div', { class: 'sim-flagrow' }, h('span', { class: 'lab' }, 'Flags'), flagBox));
    stateCol.appendChild(msgBox);
    if (!mini || o.showMem) { stateCol.appendChild(memBox); }
    if (!mini) stateCol.appendChild(initBox);
    if (!mini) wrap.appendChild(h('div', { class: 'sim-bottom' }, h('h2', { class: 'subhead' }, 'What happened, step by step'), traceBox));

    function drawGutter() { if (!gutter) return; var n = st.src.split('\n').length, s = ''; for (var i = 1; i <= n; i++) s += i + '\n'; gutter.textContent = s; }

    function loadPreset(p) {
      stop();
      st.src = p.code; st.init = { regs: Object.assign({}, (p.init && p.init.regs) || {}), flags: Object.assign({ N: 0, Z: 0, C: 0, V: 0 }, (p.init && p.init.flags) || {}), mem: ((p.init && p.init.mem) || []).slice() };
      if (ta) { ta.value = st.src; ta.rows = Math.min(18, Math.max(8, st.src.split('\n').length + 1)); drawGutter(); }
      st.bps = {}; assemble(); drawInit();
    }

    function assemble() {
      stop();
      var a = E.assemble(st.src);
      st.asm = a; st.errs = a.errors.slice();
      Lab.clear(errBox);
      a.errors.forEach(function (er) { errBox.appendChild(h('div', { class: 'feedback bad sim-err' }, h('button', { class: 'linkish', type: 'button', onclick: function () { selectLine(er.line); } }, 'Line ' + er.line + ': '), er.msg)); });
      a.warnings.forEach(function (w) { errBox.appendChild(h('div', { class: 'feedback sim-err' }, 'Line ' + w.line + ': ' + w.msg)); });
      if (!a.ok) { st.cpu = null; st.history = []; st.trace = []; st.last = null; draw(); return false; }
      var cpu = new E.CPU(); cpu.reset(a);
      Object.keys(st.init.regs).forEach(function (k) { var n = E.parseReg(k); if (n !== null) cpu.reg[n] = st.init.regs[k] >>> 0; });
      cpu.f = Object.assign({}, st.init.flags);
      st.init.mem.forEach(function (m) { for (var i = 0; i < m.bytes.length; i++) cpu.mem.set((m.addr + i) >>> 0, m.bytes[i]); });
      st.cpu = cpu; st.history = []; st.trace = []; st.last = null;
      if (st.memBase === null) st.memBase = st.init.mem.length ? st.init.mem[0].addr : (a.data.length ? a.data[0].addr : E.DATA_BASE);
      draw();
      return true;
    }
    function selectLine(n) { if (!ta) return; var lines = st.src.split('\n'), pos = 0; for (var i = 0; i < n - 1; i++) pos += lines[i].length + 1; ta.focus(); ta.setSelectionRange(pos, pos + (lines[n - 1] || '').length); }

    function doStep() {
      if (!st.cpu) { if (!assemble()) return null; }
      var cpu = st.cpu; if (cpu.halted) return null;
      st.history.push(snapshot(cpu)); if (st.history.length > 2000) st.history.shift();
      var T = cpu.step();
      if (!T) { st.history.pop(); draw(); return null; }
      T.n = cpu.steps; st.last = T; st.trace.push(T); if (st.trace.length > 400) st.trace.shift();
      return T;
    }
    function stop() { if (st.timer) { clearInterval(st.timer); st.timer = null; btnPlay.textContent = 'Play'; } }
    btnStep.addEventListener('click', function () { stop(); doStep(); draw(); });
    btnBack.addEventListener('click', function () { stop(); if (!st.history.length) return; restore(st.cpu, st.history.pop()); st.trace.pop(); st.last = st.trace[st.trace.length - 1] || null; draw(); });
    btnAsm.addEventListener('click', function () { assemble(); });
    btnPlay.addEventListener('click', function () {
      if (st.timer) { stop(); return; }
      if (!st.cpu && !assemble()) return;
      btnPlay.textContent = 'Pause';
      st.timer = setInterval(function () { if (!root.isConnected) { stop(); return; } var T = doStep(); draw(); if (!T || st.cpu.halted || (T && st.bps[T.pcAfter])) stop(); }, reduce ? 150 : 550);
    });
    btnRun.addEventListener('click', function () {
      stop(); if (!st.cpu && !assemble()) return;
      var n = 0; while (!st.cpu.halted && n < 100000) { var T = doStep(); if (!T) break; n++; if (st.bps[T.pcAfter] && !st.cpu.halted) break; }
      if (!st.cpu.halted && n >= 100000) { st.cpu.halted = true; st.cpu.haltReason = 'Stopped after 100,000 steps. Is there an infinite loop?'; }
      draw();
    });

    function fmtVal(v) {
      if (st.fmt === 'u') return String(v >>> 0);
      if (st.fmt === 's') return String(v | 0);
      if (st.fmt === 'bin') return E.binGroups(v);
      return hx(v);
    }

    function draw() {
      var cpu = st.cpu, T = st.last;
      btnBack.disabled = !st.history.length; btnStep.disabled = !!(cpu && cpu.halted);
      // listing
      Lab.clear(listing);
      var prog = st.asm && st.asm.ok ? st.asm.program : [];
      prog.forEach(function (p) {
        var isPC = cpu && !cpu.halted && cpu.pc === p.addr;
        var was = T && T.addr === p.addr;
        var w = E.encode(p);
        var row = h('div', { class: 'lrow' + (isPC ? ' next' : '') + (was ? ' was' : '') + (st.bps[p.addr] ? ' bp' : '') + (was && T.skipped ? ' skipped' : ''), role: 'button', tabindex: 0, 'aria-label': 'Breakpoint on line ' + p.line + ': ' + p.text + (isPC ? ' (next to run)' : ''), 'aria-pressed': st.bps[p.addr] ? 'true' : 'false' },
          h('span', { class: 'ptr', 'aria-hidden': 'true' }, isPC ? '▶' : (st.bps[p.addr] ? '●' : '')),
          h('span', { class: 'addr mono' }, hx(p.addr, 4)),
          h('span', { class: 'word mono' }, w === null ? 'not encoded' : hx(w)),
          h('span', { class: 'src mono', html: Lab.asmHtml(p.text) }));
        var toggle = function () { if (st.bps[p.addr]) delete st.bps[p.addr]; else st.bps[p.addr] = true; draw(); };
        row.addEventListener('click', toggle);
        row.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
        listing.appendChild(row);
        if (p.note && !mini) listing.appendChild(h('div', { class: 'lnote muted' }, p.note));
      });
      if (!prog.length) listing.appendChild(h('p', { class: 'muted' }, st.asm && !st.asm.ok ? 'Fix the errors above and press Assemble and reset.' : 'Press Assemble and reset to load the program.'));
      // registers
      Lab.clear(regBox);
      var show = mini ? (o.watch ? o.watch.map(function (r) { return E.parseReg(r); }) : regsUsed(prog)) : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
      show.forEach(function (n) {
        var v = cpu ? cpu.reg[n] : (st.init.regs[E.regName(n)] || 0);
        var changed = T && T.changed && T.changed.indexOf(n) >= 0;
        regBox.appendChild(h('div', { class: 'reg' + (changed ? ' changed' : ''), title: E.regName(n) + ' = ' + hx(v) + ' = ' + (v >>> 0) + ' unsigned = ' + (v | 0) + ' signed' }, h('span', { class: 'rn' }, E.regName(n)), h('span', { class: 'rv mono' }, fmtVal(v))));
      });
      if (!mini || o.showPC) regBox.appendChild(h('div', { class: 'reg pc' + (T && T.branch !== null && T.branch !== undefined ? ' changed' : '') }, h('span', { class: 'rn' }, 'PC'), h('span', { class: 'rv mono' }, hx(cpu ? cpu.pc : 0))));
      // flags
      Lab.clear(flagBox);
      var f = cpu ? cpu.f : st.init.flags;
      var chg = {}; if (T && T.fBefore) ['N', 'Z', 'C', 'V'].forEach(function (k) { if (T.fBefore[k] !== T.fAfter[k]) chg[k] = true; });
      flagBox.appendChild(Lab.flagChips(f, { changed: chg }));
      // message
      Lab.clear(msgBox);
      if (T) {
        msgBox.appendChild(h('div', { class: 'msg-line' }, h('strong', {}, 'Step ' + T.n + ': '), h('code', {}, T.text)));
        msgBox.appendChild(h('p', { html: Lab.fmt(T.msg) }));
        if (T.ins && T.ins.note) msgBox.appendChild(h('p', { class: 'muted' }, T.ins.note));
        if (T.detail && T.detail.flags && !T.skipped && !mini) {
          var kind = T.detail.kind, why = E.explainFlags(kind, T.detail.a, T.detail.b, T.detail.res, T.detail.flags, { shifted: T.detail.shifted });
          msgBox.appendChild(h('ul', { class: 'why-list' }, ['N', 'Z', 'C', 'V'].map(function (k) { return h('li', {}, h('strong', { class: 'f' + k }, k + ' = ' + T.detail.flags[k] + '. '), why[k]); })));
        }
      } else msgBox.appendChild(h('p', { class: 'muted' }, cpu ? 'Ready. The PC is ' + hx(cpu.pc) + '. Press Step to run the first instruction.' : 'Not assembled yet.'));
      if (cpu && cpu.halted) msgBox.appendChild(h('div', { class: 'feedback good' }, h('strong', { class: 'verdict' }, 'Stopped.'), h('div', {}, cpu.haltReason)));
      // memory
      if (!mini || o.showMem) drawMem();
      if (!mini) { drawTrace(); }
    }

    function drawMem() {
      Lab.clear(memBox);
      var cpu = st.cpu;
      var base = st.memBase !== null ? st.memBase : E.DATA_BASE;
      var f = Lab.hexField({ value: base, label: 'Memory window starts at', onChange: function (v) { st.memBase = (v & ~7) >>> 0; drawMemGrid(); } });
      memBox.appendChild(h('div', { class: 'sim-state-head' }, h('div', { class: 'subhead' }, 'Memory'), f.el));
      memBox.appendChild(h('div', { class: 'btn-row' }, [['Data (0x20000000)', E.DATA_BASE], ['Stack top (0x20007FC0)', 0x20007FC0], ['Slide data (0x20008000)', 0x20008000]].map(function (b) { return h('button', { class: 'btn btn-sm btn-quiet', type: 'button', onclick: function () { st.memBase = b[1]; f.set(b[1]); drawMemGrid(); } }, b[0]); })));
      var gridSlot = h('div'); memBox.appendChild(gridSlot);
      function drawMemGrid() {
        Lab.clear(gridSlot);
        var b0 = st.memBase !== null ? st.memBase : E.DATA_BASE;
        var grid = h('div', { class: 'memtable', role: 'group', 'aria-label': 'Memory bytes' });
        for (var r = 0; r < 4; r++) {
          var row = h('div', { class: 'mrow' }, h('span', { class: 'addr mono' }, hx((b0 + r * 8) >>> 0)));
          for (var c = 0; c < 8; c++) {
            var a = (b0 + r * 8 + c) >>> 0, v = cpu ? cpu.readByte(a) : 0, t = cpu ? cpu.touched.get(a) : null;
            row.appendChild(h('span', { class: 'mb mono' + (t === 'r' ? ' read' : t === 'w' ? ' wrote' : ''), title: hx(a) }, v.toString(16).toUpperCase().padStart(2, '0')));
          }
          grid.appendChild(row);
        }
        gridSlot.appendChild(grid);
        gridSlot.appendChild(h('p', { class: 'muted' }, 'Each cell is one byte. Highlighted: bytes read (green) or written (amber) so far. Little-endian: a word at address A has its least significant byte at A.'));
      }
      drawMemGrid();
    }

    function drawTrace() {
      Lab.clear(traceBox);
      if (!st.trace.length) { traceBox.appendChild(h('p', { class: 'muted' }, 'Nothing has run yet. Step through the program and each instruction appears here with what it did.')); return; }
      var rows = st.trace.slice(-150).map(function (T) {
        return [String(T.n), h('code', {}, hx(T.pcBefore, 4)), h('code', {}, T.text), T.skipped ? 'skipped' : 'ran', h('span', { class: 'trace-msg', html: Lab.fmt(T.msg.replace(/   Flags now[^.]*\./, '')) }), h('span', { class: 'mono' }, Lab.flagStr(T.fAfter).replace(/[A-Z]=/g, function (m) { return m[0]; }))];
      });
      var tbl = Lab.table(['#', 'PC', 'Instruction', 'Result', 'Effect', 'NZCV after'], rows);
      traceBox.appendChild(tbl);
      var tw = tbl; tw.scrollTop = tw.scrollHeight;
      traceBox.appendChild(h('div', { class: 'btn-row' }, h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { Lab.copy(st.trace.map(function (T) { return T.n + '\t' + hx(T.pcBefore, 4) + '\t' + T.text + '\t' + (T.skipped ? 'skipped' : T.msg); }).join('\n')); } }, 'Copy the trace')));
    }

    function drawInit() {
      Lab.clear(initBox);
      initBox.appendChild(h('summary', {}, 'Starting state (registers, flags and memory before the program runs)'));
      var regs = h('div', { class: 'init-regs' });
      for (var i = 0; i <= 12; i++) (function (i) {
        var name = 'R' + i;
        var cur = st.init.regs[name];
        var inp = h('input', { type: 'text', value: cur !== undefined ? hx(cur) : '', placeholder: '0x00000000', id: 'ir' + i, 'aria-label': name + ' initial value', spellcheck: 'false' });
        inp.addEventListener('input', function () { var v = E.parseValue(inp.value); inp.classList.toggle('bad', inp.value.trim() !== '' && v === null); if (inp.value.trim() === '') delete st.init.regs[name]; else if (v !== null) st.init.regs[name] = v; });
        regs.appendChild(h('div', { class: 'field' }, h('label', { for: 'ir' + i }, name), inp));
      })(i);
      initBox.appendChild(regs);
      var fl = h('div', { class: 'field-row' }, h('span', { class: 'lab' }, 'Flags'), ['N', 'Z', 'C', 'V'].map(function (k) { return h('label', { class: 'inline-check' }, h('input', { type: 'checkbox', checked: st.init.flags[k] === 1, onchange: function (e) { st.init.flags[k] = e.target.checked ? 1 : 0; } }), k); }));
      initBox.appendChild(fl);
      var mt = h('textarea', { rows: 3, id: 'init-mem', placeholder: '0x20008000: 1F 2E 3D 4C\n0x20008004: word 0x12345678', 'aria-label': 'Initial memory' }); mt.value = memToText(st.init.mem);
      var merr = h('div', { class: 'muted' });
      mt.addEventListener('input', function () { var r = parseMemText(mt.value); st.init.mem = r.mem; merr.textContent = r.errors.join(' '); });
      initBox.appendChild(h('div', { class: 'field' }, h('label', { for: 'init-mem' }, 'Memory: address, then bytes in hex (or "word" and a 32-bit value)'), mt, merr));
      initBox.appendChild(h('p', { class: 'muted' }, 'After changing the starting state, press Assemble and reset.'));
      initBox.appendChild(h('div', { class: 'btn-row' }, h('button', { class: 'btn btn-sm', type: 'button', onclick: assemble }, 'Apply and reset')));
    }

    if (editable) drawGutter();
    if (!mini) drawInit();
    assemble();
  };

  /* ---------- the full-page simulator ---------- */
  Lab.pages.sim = function (el) {
    Lab.setTitle('ARM simulator');
    el.appendChild(h('div', { class: 'lesson-head' }, h('h1', {}, 'ARM simulator'),
      h('p', { class: 'lede' }, 'Write ARM assembly, step through it, and watch the registers, flags and memory change. It follows the course: 32-bit instructions, the PC advancing by 4, ARM condition codes.')));
    var box = h('div', { class: 'widget-card sim-card' }, h('div', { class: 'widget' }));
    el.appendChild(box);
    var pending = Lab.pendingSim; Lab.pendingSim = null;
    if (!pending) { try { var raw = sessionStorage.getItem('e359.simload'); if (raw) pending = JSON.parse(raw); sessionStorage.removeItem('e359.simload'); } catch (e) { /* ignore */ } }
    var opts = {};
    if (pending) { opts.code = pending.code; if (pending.init) { opts.init = pending.init; } }
    Lab.mountWidget(box.querySelector('.widget'), 'armSim', opts);
    el.appendChild(h('div', { class: 'lesson', style: { marginTop: '24px' } },
      h('h2', {}, 'What this simulator models'),
      h('p', { html: Lab.fmt('It is a teaching model, not a full ARM core. It handles the data-processing, shift, multiply, load/store, load/store-multiple and branch instructions from Modules 2 and 3 and Handout 03. Instructions are 32 bits and the PC advances by 4, as in the course. Reading `PC` as an operand gives the instruction address plus 8, as on classic ARM. Not modelled: Thumb-2, exceptions, caches, cycle timing.') }),
      h('p', { html: Lab.fmt('Both `ADDGTS` (the course style) and `ADDSGT` (the modern style) are accepted. A word access must be 4-aligned and a halfword 2-aligned, as the course states. A branch to itself (`stop B stop`) ends the run.') })));
  };

  Lab.toolList = (Lab.toolList || []);
})(window);
