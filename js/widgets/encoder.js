/* Instruction encoder and decoder for the 32-bit formats in Module 3: data processing, branch, single load/store. */
(function (g) {
  'use strict';
  var E = g.E359, Lab = g.Lab, h = Lab.h;
  var hx = E.hex;
  var OPN = ['AND', 'EOR', 'SUB', 'RSB', 'ADD', 'ADC', 'SBC', 'RSC', 'TST', 'TEQ', 'CMP', 'CMN', 'ORR', 'MOV', 'BIC', 'MVN'];
  var SHN = ['LSL', 'LSR', 'ASR', 'ROR'];
  var CN = E.COND.map(function (c) { return c.code; });
  var bits = function (w, hi, lo) { return (w >>> lo) & ((1 << (hi - lo + 1)) - 1); };
  var b2 = function (v, n) { return v.toString(2).padStart(n, '0'); };
  function R(n) { return E.regName(n); }

  /* Break a 32-bit word into named fields. Returns [{name, hi, lo, bits, cls, note}] or null. */
  function fieldsOfWord(w) {
    var f = [], cond = bits(w, 31, 28), c = E.COND[cond] ? E.COND[cond] : null;
    function add(name, hi, lo, cls, note) { f.push({ name: name, hi: hi, lo: lo, bits: b2(bits(w, hi, lo), hi - lo + 1), cls: cls, note: note }); }
    var condNote = c ? c.code + ': ' + c.name + ' (' + c.need + ')' : '';
    if (bits(w, 27, 25) === 5) {
      add('cond', 31, 28, 'cond', condNote); add('1 0 1', 27, 25, 'misc', 'branch');
      add('L', 24, 24, 'misc', bits(w, 24, 24) ? 'link: save the return address in LR (BL)' : 'no link (plain B)');
      var off = bits(w, 23, 0); var sgn = (off << 8) >> 8;
      add('offset', 23, 0, 'imm', 'signed word offset ' + sgn + '. Target = address + 8 + 4 x offset.');
      return f;
    }
    if (bits(w, 27, 26) === 1) {
      var Ib = bits(w, 25, 25), P = bits(w, 24, 24), U = bits(w, 23, 23), B = bits(w, 22, 22), W = bits(w, 21, 21), L = bits(w, 20, 20);
      add('cond', 31, 28, 'cond', condNote); add('0 1', 27, 26, 'misc', 'single data transfer');
      add('I', 25, 25, 'misc', Ib ? 'offset is a register' : 'offset is a 12-bit immediate');
      add('P', 24, 24, 'misc', P ? 'pre-index (offset applied before the access)' : 'post-index (offset applied after)');
      add('U', 23, 23, 'misc', U ? 'add the offset' : 'subtract the offset');
      add('B', 22, 22, 'misc', B ? 'byte' : 'word');
      add('W', 21, 21, 'misc', W ? 'write the address back to Rn' : 'no write-back');
      add('L', 20, 20, 'op', L ? 'load (LDR)' : 'store (STR)');
      add('Rn', 19, 16, 'reg', 'base register ' + R(bits(w, 19, 16))); add('Rd', 15, 12, 'reg', R(bits(w, 15, 12)));
      add('offset', 11, 0, 'imm', Ib ? 'register offset with optional shift' : bits(w, 11, 0) + ' bytes');
      return f;
    }
    if (bits(w, 27, 26) === 0) {
      if (bits(w, 25, 25) === 0 && bits(w, 7, 4) === 9) return null;       // multiply family
      if (bits(w, 25, 25) === 0 && bits(w, 7, 7) === 1 && bits(w, 4, 4) === 1) return null; // halfword transfers
      var I = bits(w, 25, 25), op = bits(w, 24, 21), S = bits(w, 20, 20);
      add('cond', 31, 28, 'cond', condNote); add('0 0', 27, 26, 'misc', 'data-processing instruction');
      add('#', 25, 25, 'misc', I ? 'operand 2 is an immediate' : 'operand 2 is a register');
      add('opcode', 24, 21, 'op', OPN[op]); add('S', 20, 20, 'misc', S ? 'update the flags' : 'leave the flags alone');
      add('Rn', 19, 16, 'reg', 'first operand ' + R(bits(w, 19, 16))); add('Rd', 15, 12, 'reg', 'destination ' + R(bits(w, 15, 12)));
      if (I) { add('rot', 11, 8, 'imm', 'rotate right by 2 x ' + bits(w, 11, 8) + ' = ' + 2 * bits(w, 11, 8)); add('imm8', 7, 0, 'imm', '8-bit value ' + bits(w, 7, 0) + '. Immediate = ' + hx(E.decodeImm(bits(w, 11, 8), bits(w, 7, 0)))); }
      else if (bits(w, 4, 4) === 0) {
        add('shift', 11, 7, 'imm', 'shift amount ' + bits(w, 11, 7)); add('type', 6, 5, 'imm', SHN[bits(w, 6, 5)]); add('0', 4, 4, 'misc', 'shift by an immediate'); add('Rm', 3, 0, 'reg', 'second operand ' + R(bits(w, 3, 0)));
      } else { add('Rs', 11, 8, 'reg', 'shift amount comes from ' + R(bits(w, 11, 8))); add('0', 7, 7, 'misc', ''); add('type', 6, 5, 'imm', SHN[bits(w, 6, 5)]); add('1', 4, 4, 'misc', 'shift by a register'); add('Rm', 3, 0, 'reg', 'second operand ' + R(bits(w, 3, 0))); }
      return f;
    }
    return null;
  }
  Lab.fieldsOfWord = fieldsOfWord;
  Lab.fieldsOf = function (ins, w) { return w === null || w === undefined ? null : fieldsOfWord(w); };
  Lab.fieldsTable = function (fields) {
    return Lab.table(['Field', 'Bits', 'Value', 'Meaning'], fields.map(function (x) { return [h('strong', { class: 'mono' }, x.name), h('span', { class: 'mono' }, (x.hi === x.lo ? String(x.hi) : x.hi + '-' + x.lo)), h('span', { class: 'mono' }, x.bits), x.note]; }), {});
  };
  function wordStrip(w, fields) {
    var s = b2(w >>> 0, 32), strip = h('div', { class: 'wordstrip mono', role: 'img', 'aria-label': 'Instruction bits ' + E.binGroups(w) });
    if (!fields) { strip.textContent = E.binGroups(w); return strip; }
    fields.forEach(function (x) {
      var seg = h('div', { class: 'fld ' + x.cls }, h('span', { class: 'fb' }, x.bits), h('span', { class: 'fn' }, x.name));
      strip.appendChild(seg);
    });
    return strip;
  }

  /* machine word -> assembly text (data processing, branch not resolved) */
  function disasm(w) {
    var cond = bits(w, 31, 28);
    if (cond === 15) return null;
    var cc = CN[cond] === 'AL' ? '' : CN[cond];
    if (bits(w, 27, 25) === 5) { var off = ((bits(w, 23, 0) << 8) >> 8); return 'B' + (bits(w, 24, 24) ? 'L' : '') + cc + ' (PC + 8 + ' + (off * 4) + ')'; }
    if (bits(w, 27, 26) !== 0) return null;
    if (bits(w, 25, 25) === 0 && (bits(w, 7, 4) === 9 || (bits(w, 7, 7) === 1 && bits(w, 4, 4) === 1))) return null;
    var op = bits(w, 24, 21), S = bits(w, 20, 20), rn = bits(w, 19, 16), rd = bits(w, 15, 12), name = OPN[op];
    var cmp = op >= 8 && op <= 11, mov = op === 13 || op === 15;
    var o2;
    if (bits(w, 25, 25)) o2 = '#' + hx(E.decodeImm(bits(w, 11, 8), bits(w, 7, 0)));
    else {
      o2 = R(bits(w, 3, 0));
      var type = bits(w, 6, 5);
      if (bits(w, 4, 4) === 0) {
        var n = bits(w, 11, 7);
        if (n === 0 && type === 0) { /* no shift */ } else if (n === 0 && type === 3) o2 += ', RRX'; else o2 += ', ' + SHN[type] + ' #' + ((n === 0) ? 32 : n);
      } else o2 += ', ' + SHN[type] + ' ' + R(bits(w, 11, 8));
    }
    var mn = name + cc + ((S && !cmp) ? 'S' : '');
    if (cmp) return mn + ' ' + R(rn) + ', ' + o2;
    if (mov) return mn + ' ' + R(rd) + ', ' + o2;
    return mn + ' ' + R(rd) + ', ' + R(rn) + ', ' + o2;
  }
  Lab.disasm = disasm;

  Lab.widgets.encoder = function (root, o) {
    o = o || {};
    var st = { tab: o.tab || 'asm', text: o.text || 'ADDGT r0, r3, r9', word: o.word !== undefined ? o.word >>> 0 : 0xC0830009, b: { cond: 'GT', op: 'ADD', S: false, rn: 3, rd: 0, rm: 9, imm: false, immv: 5 } };
    var tabs = h('div', { class: 'seg', role: 'tablist' });
    var body = h('div');
    root.appendChild(tabs); root.appendChild(body);
    function drawTabs() {
      Lab.clear(tabs);
      [['asm', 'Assembly to machine code'], ['build', 'Build field by field'], ['word', 'Machine code to assembly']].forEach(function (t) { tabs.appendChild(h('button', { type: 'button', role: 'tab', 'aria-selected': st.tab === t[0] ? 'true' : 'false', onclick: function () { st.tab = t[0]; drawTabs(); render(); } }, t[1])); });
    }
    drawTabs();

    function showWord(slot, w, extra) {
      var fields = fieldsOfWord(w);
      slot.appendChild(h('div', { class: 'enc-word' }, h('span', { class: 'lab' }, 'Machine word'), h('div', { class: 'mono big' }, hx(w)), h('div', { class: 'mono muted' }, E.binGroups(w))));
      slot.appendChild(wordStrip(w, fields));
      if (fields) slot.appendChild(Lab.fieldsTable(fields)); else slot.appendChild(h('p', { class: 'muted' }, 'This instruction type is not broken down by this tool. The data-processing, branch and single load/store formats are.'));
      if (extra) slot.appendChild(extra);
    }

    function render() {
      Lab.clear(body);
      if (st.tab === 'asm') {
        var inp = h('input', { type: 'text', id: 'enc-asm', value: st.text, style: { width: '100%', maxWidth: '26rem' }, spellcheck: 'false', 'aria-label': 'One assembly instruction' });
        var out = h('div');
        function go() {
          Lab.clear(out); st.text = inp.value;
          var a = E.assemble('  ' + inp.value + '\nstop B stop');
          if (!a.ok) { out.appendChild(h('div', { class: 'feedback bad' }, a.errors[0].msg)); return; }
          var ins = a.program[0], w = E.encode(ins);
          if (w === null) { out.appendChild(h('p', { class: 'muted' }, 'This instruction is valid, but its encoding is not shown by this tool.')); return; }
          showWord(out, w, ins.note ? h('p', { class: 'muted' }, ins.note) : null);
          out.appendChild(h('p', { class: 'muted' }, 'Branch offsets are shown for a branch placed at address 0.'));
        }
        inp.addEventListener('input', go);
        body.appendChild(h('div', { class: 'field', style: { marginTop: '14px' } }, h('label', { for: 'enc-asm' }, 'Type one instruction'), inp));
        body.appendChild(h('div', { class: 'btn-row' }, ['ADDGT r0, r3, r9', 'MOV r0, #0', 'ADD r1, r0, r0, LSL #3', 'SUBS r4, r0, r2', 'CMP r0, #10', 'LDR r1, [r0, #4]!', 'B stop'].map(function (x) { return h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { inp.value = x; go(); } }, x); })));
        body.appendChild(out); go();
        return;
      }
      if (st.tab === 'word') {
        var wf = Lab.hexField({ value: st.word, label: '32-bit instruction word', onChange: function (v) { st.word = v; fill(); } });
        var res = h('div');
        function fill() {
          Lab.clear(res);
          var text = disasm(st.word);
          res.appendChild(h('p', {}, 'Decodes to: ', text ? h('code', {}, text) : h('span', { class: 'muted' }, 'an instruction type this tool does not decode')));
          showWord(res, st.word);
        }
        body.appendChild(h('div', { style: { marginTop: '14px' } }, wf.el)); body.appendChild(h('div', { class: 'btn-row' }, ['0xC0830009', '0xE3A00000', '0xE0821003', '0xE1A01182', '0xEAFFFFFE'].map(function (x) { return h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { st.word = E.parseValue(x); wf.set(st.word); fill(); } }, x); })));
        body.appendChild(res); fill(); return;
      }
      // builder
      var B = st.b;
      function sel(id, label, items, val, set) {
        var s2 = h('select', { id: id, 'aria-label': label }, items.map(function (i) { return h('option', { value: i[0], selected: String(i[0]) === String(val) }, i[1]); }));
        s2.addEventListener('change', function () { set(s2.value); build(); });
        return h('div', { class: 'field' }, h('label', { for: id }, label), s2);
      }
      var outB = h('div');
      var cmpOps = ['CMP', 'CMN', 'TST', 'TEQ'], movOps = ['MOV', 'MVN'];
      function build() {
        Lab.clear(outB);
        var regs = []; for (var i = 0; i <= 12; i++) regs.push([i, 'R' + i]); regs.push([13, 'SP'], [14, 'LR']);
        var text = B.op;
        var isCmp = cmpOps.indexOf(B.op) >= 0, isMov = movOps.indexOf(B.op) >= 0;
        var o2 = B.imm ? '#' + B.immv : 'R' + B.rm;
        var cc = B.cond === 'AL' ? '' : B.cond;
        var mn = B.op + cc + ((B.S && !isCmp) ? 'S' : '');
        text = isCmp ? mn + ' R' + B.rn + ', ' + o2 : isMov ? mn + ' R' + B.rd + ', ' + o2 : mn + ' R' + B.rd + ', R' + B.rn + ', ' + o2;
        var a = E.assemble('  ' + text + '\nstop B stop');
        outB.appendChild(h('p', {}, 'This is the instruction: ', h('code', {}, text)));
        if (!a.ok) { outB.appendChild(h('div', { class: 'feedback bad' }, a.errors[0].msg)); return; }
        var w = E.encode(a.program[0]); showWord(outB, w);
      }
      body.appendChild(h('div', { class: 'field-row', style: { marginTop: '14px' } },
        sel('b-cond', 'cond', E.COND.filter(function (c) { return c.code !== 'NV'; }).map(function (c) { return [c.code, c.code]; }), B.cond, function (v) { B.cond = v; }),
        sel('b-op', 'opcode', OPN.map(function (n) { return [n, n]; }), B.op, function (v) { B.op = v; }),
        sel('b-s', 'S', [['0', '0 (flags untouched)'], ['1', '1 (set flags)']], B.S ? '1' : '0', function (v) { B.S = v === '1'; }),
        sel('b-rn', 'Rn (first operand)', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (i) { return [i, 'R' + i]; }), B.rn, function (v) { B.rn = +v; }),
        sel('b-rd', 'Rd (destination)', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (i) { return [i, 'R' + i]; }), B.rd, function (v) { B.rd = +v; }),
        sel('b-kind', 'operand 2', [['reg', 'a register'], ['imm', 'a constant']], B.imm ? 'imm' : 'reg', function (v) { B.imm = v === 'imm'; }),
        sel('b-rm', 'Rm', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (i) { return [i, 'R' + i]; }), B.rm, function (v) { B.rm = +v; }),
        sel('b-imm', 'constant', [0, 1, 4, 5, 10, 16, 255].map(function (i) { return [i, String(i)]; }), B.immv, function (v) { B.immv = +v; })));
      body.appendChild(outB); build();
    }
    render();
  };
})(window);
