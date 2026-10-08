/* Opcode: a small 32-bit ARM-state assembler, encoder and CPU.
   Models what Modules 2-3 and Handout 03 teach: 16 registers, N/Z/C/V, conditional
   execution of everything, the barrel shifter, load/store with pre/post/auto indexing,
   multiply, branches. Instructions are 32 bits and the PC advances by 4, as in the course.
   Not modelled: Thumb, exceptions, caches, coprocessors, cycle timing. */
(function (g) {
  'use strict';
  var E = g.E359;
  var hx = E.hex;

  var CODE_BASE = 0x00000000;
  var DATA_BASE = 0x20000000;
  var STACK_TOP = 0x20008000;
  E.CODE_BASE = CODE_BASE; E.DATA_BASE = DATA_BASE; E.STACK_TOP = STACK_TOP;

  var CONDS = ['EQ', 'NE', 'CS', 'HS', 'CC', 'LO', 'MI', 'PL', 'VS', 'VC', 'HI', 'LS', 'GE', 'LT', 'GT', 'LE', 'AL'];
  var DP3 = ['AND', 'EOR', 'SUB', 'RSB', 'ADD', 'ADC', 'SBC', 'RSC', 'ORR', 'BIC', 'ORN'];
  var DPMOV = ['MOV', 'MVN'];
  var DPCMP = ['CMP', 'CMN', 'TST', 'TEQ'];
  var SHIFTS = ['LSL', 'LSR', 'ASR', 'ROR', 'RRX'];
  var MULS = ['MUL', 'MLA'];
  var LONGS = ['UMULL', 'SMULL', 'UMLAL', 'SMLAL'];
  var MISC = ['CLZ', 'RBIT', 'REV', 'BFC', 'BFI', 'UDIV', 'SDIV', 'MRS', 'MSR', 'NOP', 'BKPT', 'ADR'];
  var MEMOPS = ['LDR', 'STR'];
  var BLOCK = ['LDM', 'STM'];
  var STACKOPS = ['PUSH', 'POP'];
  var MODES = ['IA', 'IB', 'DA', 'DB', 'FD', 'FA', 'ED', 'EA'];
  var DIRS = ['AREA', 'ENTRY', 'END', 'EXPORT', 'GLOBAL', 'ALIGN', 'DCD', 'DCW', 'DCB', 'SPACE', 'EQU', 'THUMB', 'CODE32', 'CODE16', 'PRESERVE8', 'REQUIRE8', 'IMPORT', 'ORG'];
  var DOTDIR = { '.WORD': 'DCD', '.INT': 'DCD', '.HWORD': 'DCW', '.SHORT': 'DCW', '.BYTE': 'DCB', '.SPACE': 'SPACE', '.ALIGN': 'ALIGN', '.EQU': '.EQU' };
  var IGNORE_DOT = /^\.(text|data|global|globl|syntax|arch|cpu|thumb|arm|section|type|size|end|fpu|code)\b/i;
  // armasm and GNU both allow these; we just ignore them.
  var NOS = { DCD: 1, DCW: 1, DCB: 1, SPACE: 1 };

  /* the stack-mode names are aliases for the four addressing modes (checked against ARM docs) */
  var LDM_MODE = { IA: 'IA', IB: 'IB', DA: 'DA', DB: 'DB', FD: 'IA', ED: 'IB', FA: 'DA', EA: 'DB' };
  var STM_MODE = { IA: 'IA', IB: 'IB', DA: 'DA', DB: 'DB', FD: 'DB', ED: 'DA', FA: 'IB', EA: 'IA' };

  var REGN = { SP: 13, LR: 14, PC: 15, IP: 12, FP: 11, SB: 9, SL: 10 };
  function parseReg(s) {
    if (s === undefined || s === null) return null;
    s = String(s).trim().toUpperCase();
    if (REGN[s] !== undefined) return REGN[s];
    var m = /^R(\d{1,2})$/.exec(s);
    if (m && +m[1] <= 15) return +m[1];
    return null;
  }
  E.regName = function (n) { return n === 13 ? 'SP' : n === 14 ? 'LR' : n === 15 ? 'PC' : 'R' + n; };

  function AsmError(msg) { this.msg = msg; }

  function splitOps(s) {
    var out = [], depth = 0, cur = '', q = false;
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (ch === '"') q = !q;
      if (!q) {
        if (ch === '[' || ch === '{') depth++;
        if (ch === ']' || ch === '}') depth--;
        if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
      }
      cur += ch;
    }
    if (cur.trim() !== '' || out.length) out.push(cur.trim());
    return out;
  }

  /* tiny expression evaluator: numbers, symbols, + and - */
  function evalExpr(s, syms) {
    s = String(s).trim();
    if (!s) throw new AsmError('Missing value.');
    var re = /\s*([+-]?)\s*([A-Za-z_.][\w.]*|0x[0-9a-fA-F]+|&[0-9a-fA-F]+|0b[01]+|\d+|'.')\s*/y;
    var pos = 0, total = 0, first = true, m;
    while (pos < s.length) {
      re.lastIndex = pos;
      m = re.exec(s);
      if (!m) throw new AsmError("Can't understand '" + s + "' as a number or label.");
      var sign = m[1] === '-' ? -1 : 1;
      if (!first && m[1] === '') throw new AsmError("Can't understand '" + s + "' as a number or label.");
      var t = m[2], v;
      if (/^[A-Za-z_.]/.test(t) && !/^0b/i.test(t)) {
        var k = t.toLowerCase();
        if (!(k in syms)) throw new AsmError("Unknown label or name '" + t + "'.");
        v = syms[k];
      } else {
        v = E.parseValue(t);
        if (v === null) throw new AsmError("Can't understand '" + t + "' as a number.");
      }
      total += sign * v;
      pos = re.lastIndex; first = false;
    }
    return total >>> 0;
  }

  /* ---------- mnemonic parsing: ADDGTS (course style) and ADDSGT (UAL) both accepted ---------- */
  function condOf(c) {
    c = c.toUpperCase();
    if (c === 'HS') return 'CS';
    if (c === 'LO') return 'CC';
    return c;
  }
  function splitCondS(rest, allowS) {
    if (rest === '') return { cond: 'AL', S: false };
    if (allowS && rest === 'S') return { cond: 'AL', S: true };
    if (CONDS.indexOf(rest) >= 0) return { cond: condOf(rest), S: false };
    if (allowS) {
      var a = rest.slice(0, 2), b = rest.slice(2);
      if (CONDS.indexOf(a) >= 0 && b === 'S') return { cond: condOf(a), S: true };
      var c = rest.slice(0, 1), d = rest.slice(1);
      if (c === 'S' && CONDS.indexOf(d) >= 0) return { cond: condOf(d), S: true };
    }
    return null;
  }
  function parseMnemonic(m) {
    m = m.toUpperCase();
    var i, r, b;
    // branches
    var bb = ['BLX', 'BL', 'BX', 'B'];
    for (i = 0; i < bb.length; i++) {
      b = bb[i];
      if (m.indexOf(b) === 0) {
        var rest = m.slice(b.length);
        if (rest === '' || CONDS.indexOf(rest) >= 0) return { base: b, cond: condOf(rest || 'AL'), S: false };
      }
    }
    var bases = [].concat(DP3, DPMOV, DPCMP, SHIFTS, MULS, LONGS, MISC)
      .sort(function (x, y) { return y.length - x.length; });
    for (i = 0; i < bases.length; i++) {
      b = bases[i];
      if (m.indexOf(b) === 0) {
        // compares always set the flags; the course still writes CMPGTS, so a trailing S is accepted
        var allowS = DP3.indexOf(b) >= 0 || DPMOV.indexOf(b) >= 0 || DPCMP.indexOf(b) >= 0 || SHIFTS.indexOf(b) >= 0 || MULS.indexOf(b) >= 0 || LONGS.indexOf(b) >= 0;
        r = splitCondS(m.slice(b.length), allowS);
        if (r) return { base: b, cond: r.cond, S: r.S };
      }
    }
    // loads and stores: LDR{cond}{B|H|SH|SB} or LDR{B|H|SH|SB}{cond}
    var mm = /^(LDR|STR)(.*)$/.exec(m);
    if (mm) {
      var tail = mm[2], sizes = ['SH', 'SB', 'B', 'H', ''];
      for (i = 0; i < sizes.length; i++) {
        var sz = sizes[i];
        // size first, then condition
        if (tail.indexOf(sz) === 0) {
          var c1 = tail.slice(sz.length);
          if (c1 === '' || CONDS.indexOf(c1) >= 0) {
            if ((sz === 'SH' || sz === 'SB') && mm[1] === 'STR') continue;
            return { base: mm[1], cond: condOf(c1 || 'AL'), S: false, size: sz };
          }
        }
        // condition first, then size
        for (var k = 0; k < CONDS.length; k++) {
          var cc = CONDS[k];
          if (tail.indexOf(cc) === 0 && tail.slice(cc.length) === sz && sz !== '') {
            return { base: mm[1], cond: condOf(cc), S: false, size: sz };
          }
        }
      }
    }
    // block transfers
    mm = /^(LDM|STM)(.*)$/.exec(m);
    if (mm) {
      var t2 = mm[2];
      var opts = [t2];
      for (i = 0; i < MODES.length; i++) {
        if (t2.indexOf(MODES[i]) === 0) opts.push({ mode: MODES[i], c: t2.slice(2) });
        if (t2.slice(-2) === MODES[i]) opts.push({ mode: MODES[i], c: t2.slice(0, -2) });
      }
      if (t2 === '' || CONDS.indexOf(t2) >= 0) return { base: mm[1], cond: condOf(t2 || 'AL'), S: false, mode: 'IA' };
      for (i = 1; i < opts.length; i++) {
        if (opts[i].c === '' || CONDS.indexOf(opts[i].c) >= 0) return { base: mm[1], cond: condOf(opts[i].c || 'AL'), S: false, mode: opts[i].mode };
      }
    }
    mm = /^(PUSH|POP)(.*)$/.exec(m);
    if (mm && (mm[2] === '' || CONDS.indexOf(mm[2]) >= 0)) return { base: mm[1], cond: condOf(mm[2] || 'AL'), S: false };
    return null;
  }

  /* ---------- operand parsing ---------- */
  function parseShiftSpec(t) {
    var m = /^(LSL|ASL|LSR|ASR|ROR)\s+(.+)$/i.exec(t);
    if (/^RRX$/i.test(t)) return { t: 'RRX' };
    if (!m) throw new AsmError("Expected a shift like 'LSL #2', but found '" + t + "'.");
    var type = m[1].toUpperCase() === 'ASL' ? 'LSL' : m[1].toUpperCase();
    var a = m[2].trim();
    var rs = parseReg(a);
    if (rs !== null) return { t: type, rs: rs };
    if (a[0] !== '#') throw new AsmError("A shift amount needs '#' in front, like " + type + ' #2.');
    return { t: type, n: null, expr: a.slice(1) };
  }
  function finishShift(sh, syms) {
    if (!sh || sh.rs !== undefined || sh.t === 'RRX') return sh;
    var n = evalExpr(sh.expr, syms);
    var max = sh.t === 'LSL' ? 31 : sh.t === 'ROR' ? 31 : 32;
    if (sh.t === 'ROR' && n === 32) { /* allowed by the slides; rotates by nothing but sets C */ } else if (n > max) throw new AsmError(sh.t + ' can shift by 0 to ' + max + ' places, not ' + n + '.');
    return { t: sh.t, n: n };
  }
  function parseOp2(ops, i, syms) {
    var t = ops[i];
    if (t === undefined) throw new AsmError('Missing the last operand.');
    var rm = parseReg(t);
    if (rm === null) {
      if (t[0] !== '#') throw new AsmError("'" + t + "' isn't a register. A constant needs '#' in front, like #" + t + '.');
      var v = evalExpr(t.slice(1), syms);
      return { k: 'imm', value: v };
    }
    var sh = null;
    if (ops[i + 1] !== undefined) sh = finishShift(parseShiftSpec(ops[i + 1]), syms);
    if (ops[i + 2] !== undefined) throw new AsmError("Too many operands - '" + ops[i + 2] + "' isn't expected.");
    return { k: 'reg', rm: rm, sh: sh };
  }
  var NEEDS_COMP = { MOV: 'MVN', MVN: 'MOV', ADD: 'SUB', SUB: 'ADD', CMP: 'CMN', CMN: 'CMP', AND: 'BIC', BIC: 'AND', ADC: 'SBC', SBC: 'ADC' };
  function regOrErr(s, what) {
    var r = parseReg(s);
    if (r === null) throw new AsmError((what || 'Operand') + " should be a register (R0-R15), but found '" + s + "'.");
    return r;
  }

  function parseMemOperand(ops, start, syms) {
    var a = ops[start];
    var m = /^\[\s*([^,\]]+?)\s*(?:,\s*(.+?))?\s*\](!?)$/.exec(a || '');
    if (!m) throw new AsmError("Expected an address like [R0] or [R0, #4], but found '" + (a || '') + "'.");
    var rn = regOrErr(m[1], 'The base register');
    var mem = { rn: rn, pre: true, wb: m[3] === '!', off: null };
    if (m[2]) {
      var parts = splitOps(m[2]), p0 = parts[0], sub = false;
      if (p0[0] === '#') mem.off = { k: 'imm', v: evalSigned(p0.slice(1), syms) };
      else {
        if (p0[0] === '-') { sub = true; p0 = p0.slice(1); } else if (p0[0] === '+') p0 = p0.slice(1);
        mem.off = { k: 'reg', rm: regOrErr(p0, 'The offset'), sub: sub, sh: parts[1] ? finishShift(parseShiftSpec(parts[1]), syms) : null };
      }
    }
    if (ops[start + 1] !== undefined) {
      // post-indexed: [Rn], #off
      if (m[2]) throw new AsmError('Post-index looks like [R0], #4 with nothing inside the brackets except the base register.');
      if (m[3]) throw new AsmError("You can't use '!' together with a post-index offset.");
      var q = ops[start + 1], sub2 = false;
      mem.pre = false; mem.wb = true;
      if (q[0] === '#') mem.off = { k: 'imm', v: evalSigned(q.slice(1), syms) };
      else {
        if (q[0] === '-') { sub2 = true; q = q.slice(1); }
        mem.off = { k: 'reg', rm: regOrErr(q, 'The offset'), sub: sub2, sh: ops[start + 2] ? finishShift(parseShiftSpec(ops[start + 2]), syms) : null };
      }
    }
    return mem;
  }
  function evalSigned(s, syms) { return evalExpr(s, syms) | 0; }

  /* ---------- the assembler ---------- */
  E.assemble = function (src) {
    var lines = String(src).split(/\r?\n/);
    var errors = [], warnings = [];
    var syms = {}, labels = {};
    var items = [];   // {kind:'ins'|'data', ...}
    var codeAddr = CODE_BASE, dataAddr = DATA_BASE;
    var ended = false;

    function addLabel(name, addr, ln) {
      var k = name.toLowerCase();
      if (k in syms) { errors.push({ line: ln, msg: "The label '" + name + "' is defined twice." }); return; }
      syms[k] = addr >>> 0; labels[name] = addr >>> 0;
    }
    function isDirective(w) { w = w.toUpperCase(); return DIRS.indexOf(w) >= 0 || w in DOTDIR || IGNORE_DOT.test(w); }

    // ---- pass 1: split lines, assign addresses ----
    lines.forEach(function (raw, idx) {
      var ln = idx + 1;
      if (ended) return;
      var text = raw.replace(/\/\/.*$/, '').replace(/[;@].*$/, '');
      if (!text.trim()) return;
      var col0 = !/^\s/.test(text);
      var body = text.trim(), label = null;
      var fw = body.split(/\s+/)[0];
      var restAfter = body.slice(fw.length).trim();
      if (fw.slice(-1) === ':' ) { label = fw.slice(0, -1); body = restAfter; }
      else if (col0) {
        var nextWord = restAfter.split(/\s+/)[0] || '';
        if (isDirective(nextWord) && !isDirective(fw)) { label = fw; body = restAfter; }
        else if (isDirective(fw) || parseMnemonic(fw)) {
          if (!isDirective(fw) || fw.toUpperCase() !== 'END') warnings.push({ line: ln, msg: 'Instructions should be indented. Anything in the first column is treated as a label.' });
        } else { label = fw; body = restAfter; }
      }
      if (label !== null && !/^[A-Za-z_.][\w.$]*$/.test(label)) { errors.push({ line: ln, msg: "'" + label + "' isn't a valid label name." }); return; }
      var mw = body.split(/\s+/)[0] || '';
      var rest = body.slice(mw.length).trim();
      var up = mw.toUpperCase();

      if (up === 'EQU' || up === '.EQU' || (rest.split(/\s+/)[0] || '').toUpperCase() === 'EQU') {
        try {
          var nm, ex;
          if (up === 'EQU') { nm = label; ex = rest; }
          else if (up === '.EQU') { var pp = splitOps(rest); nm = pp[0]; ex = pp[1]; label = null; }
          else { nm = mw; ex = rest.replace(/^\S+\s*/, ''); label = null; }
          if (!nm) throw new AsmError('EQU needs a name before it.');
          var kk = nm.toLowerCase();
          if (kk in syms) throw new AsmError("The name '" + nm + "' is defined twice.");
          syms[kk] = evalExpr(ex, syms); labels[nm] = syms[kk];
        } catch (e) { if (e instanceof AsmError) errors.push({ line: ln, msg: e.msg }); else throw e; }
        if (label !== null && up !== 'EQU') { /* handled above */ }
        return;
      }

      if (isDirective(mw)) {
        var dname = DOTDIR[up] || up;
        if (IGNORE_DOT.test(mw) && !(up in DOTDIR)) { if (label) addLabel(label, codeAddr, ln); return; }
        if (dname === 'END') { ended = true; if (label) addLabel(label, codeAddr, ln); return; }
        if (NOS[dname]) {
          var align = dname === 'DCD' ? 4 : dname === 'DCW' ? 2 : 1;
          if (dname !== 'SPACE' && dataAddr % align) dataAddr += align - (dataAddr % align);
          if (label) addLabel(label, dataAddr, ln);
          var ops = splitOps(rest), size = 0;
          if (dname === 'SPACE') {
            try { size = evalExpr(ops[0] || '0', syms); } catch (e) { errors.push({ line: ln, msg: e.msg || String(e) }); return; }
            items.push({ kind: 'data', dir: 'SPACE', addr: dataAddr, size: size, line: ln });
          } else {
            var per = dname === 'DCD' ? 4 : dname === 'DCW' ? 2 : 1;
            var count = 0;
            ops.forEach(function (o) { count += (dname === 'DCB' && /^".*"$/.test(o)) ? o.length - 2 : 1; });
            size = per * count;
            items.push({ kind: 'data', dir: dname, addr: dataAddr, ops: ops, size: size, line: ln });
          }
          dataAddr += size;
          return;
        }
        if (label) addLabel(label, codeAddr, ln);
        return;
      }
      if (label) addLabel(label, codeAddr, ln);
      if (!mw) return;
      items.push({ kind: 'ins', mnem: mw, rest: rest, addr: codeAddr, line: ln, text: body });
      codeAddr += 4;
    });

    // ---- pass 2: parse instructions and data ----
    var program = [], data = [];
    items.forEach(function (it) {
      try {
        if (it.kind === 'data') {
          var bytes = [];
          if (it.dir === 'SPACE') { for (var s = 0; s < it.size; s++) bytes.push(0); }
          else {
            it.ops.forEach(function (o) {
              if (it.dir === 'DCB' && /^".*"$/.test(o)) { for (var c = 1; c < o.length - 1; c++) bytes.push(o.charCodeAt(c)); return; }
              var v = evalExpr(o, syms);
              var n = it.dir === 'DCD' ? 4 : it.dir === 'DCW' ? 2 : 1;
              for (var b = 0; b < n; b++) bytes.push((v >>> (8 * b)) & 0xFF);
            });
          }
          data.push({ addr: it.addr, bytes: bytes });
        } else {
          var ins = parseInstruction(it, syms);
          program.push(ins);
        }
      } catch (e) {
        if (e instanceof AsmError) errors.push({ line: it.line, msg: e.msg });
        else throw e;
      }
    });
    // keep program index aligned with address even if one line failed
    return { ok: errors.length === 0, errors: errors, warnings: warnings, program: program, data: data, labels: labels, size: codeAddr - CODE_BASE };
  };

  function parseInstruction(it, syms) {
    var pm = parseMnemonic(it.mnem);
    if (!pm) {
      var near = it.mnem.toUpperCase();
      throw new AsmError("Unknown instruction '" + it.mnem + "'." + (/^(ADDS?|MOVS?)$/.test(near) ? '' : ' Check the spelling, or see the instruction list on the Reference page.'));
    }
    var ops = splitOps(it.rest);
    var ins = { op: pm.base, cond: pm.cond, S: pm.S, addr: it.addr, line: it.line, text: it.text, size: pm.size || '', mode: pm.mode };
    var b = pm.base;
    var need = function (n, usage) { if (ops.length !== n) throw new AsmError(b + ' needs ' + n + ' operand' + (n > 1 ? 's' : '') + (usage ? ', like ' + usage : '') + ' but this has ' + ops.length + '.'); };

    if (b === 'B' || b === 'BL') {
      need(1, b + ' label');
      ins.target = evalExpr(ops[0], syms); ins.link = (b === 'BL'); ins.op = 'B';
      return ins;
    }
    if (b === 'BX' || b === 'BLX') {
      need(1, b + ' LR');
      ins.rm = regOrErr(ops[0]); ins.link = (b === 'BLX'); ins.op = 'BX';
      return ins;
    }
    if (DP3.indexOf(b) >= 0) {
      if (ops.length < 2) throw new AsmError(b + ' needs a destination and operands, like ' + b + ' R0, R1, R2.');
      ins.rd = regOrErr(ops[0], 'The destination');
      var i2 = 1;
      // three operands (Rd, Rn, Op2) unless the third is just a shift of the second, as in ADD R0, R1, LSL #2
      var threeOp = false;
      if (ops.length >= 3) {
        var maybeShift = /^(LSL|LSR|ASR|ROR|ASL|RRX)\b/i.test(ops[2]);
        threeOp = !(ops.length === 3 && maybeShift);
      }
      if (threeOp) { ins.rn = regOrErr(ops[1], 'The first source'); i2 = 2; } else { ins.rn = ins.rd; i2 = 1; }
      ins.o2 = parseOp2(ops, i2, syms);
      fixImmediate(ins, b);
      return ins;
    }
    if (DPMOV.indexOf(b) >= 0) {
      if (ops.length < 2) throw new AsmError(b + ' needs a destination and a source, like ' + b + ' R0, #5.');
      ins.rd = regOrErr(ops[0], 'The destination'); ins.rn = 0;
      ins.o2 = parseOp2(ops, 1, syms);
      fixImmediate(ins, b);
      return ins;
    }
    if (DPCMP.indexOf(b) >= 0) {
      if (ops.length < 2) throw new AsmError(b + ' needs two operands, like ' + b + ' R0, #10.');
      ins.rn = regOrErr(ops[0], 'The first operand'); ins.rd = 0; ins.S = true;
      ins.o2 = parseOp2(ops, 1, syms);
      fixImmediate(ins, b);
      return ins;
    }
    if (SHIFTS.indexOf(b) >= 0) {
      // LSL Rd, Rm, #n  ==  MOV Rd, Rm, LSL #n
      ins.rd = regOrErr(ops[0], 'The destination');
      if (b === 'RRX') {
        if (ops.length > 2) throw new AsmError('RRX needs a destination and a source, like RRX R0, R1.');
        ins.rn = 0; ins.o2 = { k: 'reg', rm: regOrErr(ops[ops.length > 1 ? 1 : 0]), sh: { t: 'RRX' } };
      } else {
        var rm, amt;
        if (ops.length === 3) { rm = regOrErr(ops[1], 'The source'); amt = ops[2]; }
        else if (ops.length === 2) { rm = ins.rd; amt = ops[1]; }
        else throw new AsmError(b + ' needs operands like ' + b + ' R0, R1, #2.');
        var rs = parseReg(amt), sh;
        if (rs !== null) sh = { t: b, rs: rs };
        else {
          if (amt[0] !== '#') throw new AsmError("A shift amount needs '#' in front, like " + b + ' R0, R1, #2.');
          sh = finishShift({ t: b, expr: amt.slice(1) }, syms);
        }
        ins.rn = 0; ins.o2 = { k: 'reg', rm: rm, sh: sh };
      }
      ins.alias = b; ins.op = 'MOV';
      return ins;
    }
    if (b === 'MUL') {
      need(3, 'MUL R4, R3, R2');
      ins.rd = regOrErr(ops[0]); ins.rm = regOrErr(ops[1]);
      if (parseReg(ops[2]) === null) throw new AsmError('MUL cannot take an immediate. Load the constant into a register first, or use shifts and adds.');
      ins.rs = regOrErr(ops[2]);
      return ins;
    }
    if (b === 'MLA') {
      need(4, 'MLA R4, R3, R2, R1');
      ins.rd = regOrErr(ops[0]); ins.rm = regOrErr(ops[1]); ins.rs = regOrErr(ops[2]); ins.ra = regOrErr(ops[3]);
      return ins;
    }
    if (LONGS.indexOf(b) >= 0) {
      need(4, b + ' R0, R1, R2, R3');
      ins.rdlo = regOrErr(ops[0]); ins.rdhi = regOrErr(ops[1]); ins.rm = regOrErr(ops[2]); ins.rs = regOrErr(ops[3]);
      return ins;
    }
    if (b === 'UDIV' || b === 'SDIV') {
      if (ops.length === 2) { ops.splice(1, 0, ops[0]); }
      need(3, b + ' R0, R1, R2');
      ins.rd = regOrErr(ops[0]); ins.rn = regOrErr(ops[1]); ins.rm = regOrErr(ops[2]);
      return ins;
    }
    if (b === 'CLZ' || b === 'RBIT' || b === 'REV') {
      need(2, b + ' R0, R1');
      ins.rd = regOrErr(ops[0]); ins.rm = regOrErr(ops[1]);
      return ins;
    }
    if (b === 'BFC') {
      need(3, 'BFC R4, #8, #12');
      ins.rd = regOrErr(ops[0]); ins.lsb = evalExpr(ops[1].replace(/^#/, ''), syms); ins.width = evalExpr(ops[2].replace(/^#/, ''), syms);
      checkField(ins); return ins;
    }
    if (b === 'BFI') {
      need(4, 'BFI R9, R2, #8, #12');
      ins.rd = regOrErr(ops[0]); ins.rn = regOrErr(ops[1]); ins.lsb = evalExpr(ops[2].replace(/^#/, ''), syms); ins.width = evalExpr(ops[3].replace(/^#/, ''), syms);
      checkField(ins); return ins;
    }
    if (b === 'MRS') { need(2, 'MRS R0, APSR'); ins.rd = regOrErr(ops[0]); if (!/^(CPSR|APSR)$/i.test(ops[1])) throw new AsmError('MRS reads CPSR or APSR here.'); return ins; }
    if (b === 'MSR') { need(2, 'MSR APSR_nzcvq, R0'); if (!/^(CPSR|APSR)(_\w+)?$/i.test(ops[0])) throw new AsmError('MSR writes CPSR_f or APSR_nzcvq here.'); ins.rm = regOrErr(ops[1]); return ins; }
    if (b === 'NOP' || b === 'BKPT') { return ins; }
    if (b === 'ADR') {
      need(2, 'ADR R0, label');
      ins.rd = regOrErr(ops[0]);
      if (ops[1][0] === '#') throw new AsmError("ADR takes a label, not a '#' number. Use ADR R0, label, or LDR R0, =0x1234 for a literal address.");
      ins.value = evalExpr(ops[1], syms);
      return ins;
    }
    if (b === 'LDR' || b === 'STR') {
      if (ops.length < 2) throw new AsmError(b + ' needs a register and an address, like ' + b + ' R1, [R0].');
      ins.rd = regOrErr(ops[0], 'The register');
      if (ops[1][0] === '=') {
        if (b === 'STR') throw new AsmError("'=' (a literal) only works with LDR.");
        ins.op = 'LDRLIT'; ins.value = evalExpr(ops[1].slice(1), syms);
        return ins;
      }
      if (ops[1][0] !== '[') {
        // LDR R0, label  -> load from that address
        if (ops.length !== 2) throw new AsmError('Too many operands.');
        ins.mem = { abs: evalExpr(ops[1], syms), rn: null, pre: true, wb: false, off: null };
        return ins;
      }
      ins.mem = parseMemOperand(ops, 1, syms);
      if (ins.mem.wb && ins.mem.rn === ins.rd && b === 'LDR') throw new AsmError('Writing back to the same register you are loading into gives an unpredictable result on ARM.');
      return ins;
    }
    if (b === 'LDM' || b === 'STM') {
      need(2, b + 'IA R0!, {R1-R3}');
      var bm = /^(\w+)(!?)$/.exec(ops[0]);
      if (!bm) throw new AsmError('Expected a base register like R0 or R0!.');
      ins.rn = regOrErr(bm[1]); ins.wb = bm[2] === '!';
      ins.list = parseRegList(ops[1]);
      ins.amode = (b === 'LDM' ? LDM_MODE : STM_MODE)[pm.mode];
      return ins;
    }
    if (b === 'PUSH' || b === 'POP') {
      need(1, b + ' {R4, LR}');
      ins.list = parseRegList(ops[0]); ins.rn = 13; ins.wb = true;
      ins.amode = b === 'PUSH' ? 'DB' : 'IA'; ins.op = b === 'PUSH' ? 'STM' : 'LDM';
      ins.alias = b;
      return ins;
    }
    throw new AsmError("'" + it.mnem + "' isn't supported by this simulator yet.");
  }
  function checkField(ins) {
    if (ins.lsb > 31 || ins.width < 1 || ins.lsb + ins.width > 32) throw new AsmError('The bit field is out of range: lsb + width must be at most 32, and width at least 1.');
  }
  function parseRegList(s) {
    var m = /^\{(.*)\}$/.exec(s.trim());
    if (!m) throw new AsmError("A register list looks like {R0, R2-R4}, but found '" + s + "'.");
    var regs = {};
    m[1].split(',').forEach(function (p) {
      p = p.trim(); if (!p) return;
      var r = p.split('-');
      var a = parseReg(r[0]), z = r[1] !== undefined ? parseReg(r[1]) : a;
      if (a === null || z === null || z < a) throw new AsmError("'" + p + "' isn't a valid register or range.");
      for (var i = a; i <= z; i++) regs[i] = true;
    });
    var out = Object.keys(regs).map(Number).sort(function (x, y) { return x - y; });
    if (!out.length) throw new AsmError('The register list is empty.');
    return out;
  }
  /* if the constant can't be encoded, try the complementary instruction, like real assemblers */
  function fixImmediate(ins, b) {
    var o = ins.o2;
    if (o.k !== 'imm') {
      if (o.sh && o.sh.t !== 'RRX' && o.sh.rs === undefined && o.sh.n === 0) o.sh = null;
      return;
    }
    var enc = E.encodeImm(o.value);
    if (enc) { o.rot = enc.rot; o.imm8 = enc.imm8; return; }
    var comp = NEEDS_COMP[b];
    if (comp) {
      var alt = (b === 'MOV' || b === 'MVN' || b === 'AND' || b === 'BIC' || b === 'ADC' || b === 'SBC') ? (~o.value) >>> 0 : ((-o.value) >>> 0);
      var e2 = E.encodeImm(alt);
      if (e2) {
        ins.op = comp; o.value = alt; o.rot = e2.rot; o.imm8 = e2.imm8;
        ins.note = b + ' with that constant was assembled as ' + comp + ' with ' + hx(alt) + ', because the original constant does not fit the immediate format but this one does.';
        return;
      }
    }
    throw new AsmError(hx(o.value) + " can't be an ARM immediate (8 bits rotated right by an even number of places). Use LDR " + E.regName(ins.rd || 0) + ', =' + hx(o.value) + ' instead.');
  }

  /* ---------- machine-code encoder (the formats shown in Module 3) ---------- */
  var DPOP = { AND: 0, EOR: 1, SUB: 2, RSB: 3, ADD: 4, ADC: 5, SBC: 6, RSC: 7, TST: 8, TEQ: 9, CMP: 10, CMN: 11, ORR: 12, MOV: 13, BIC: 14, MVN: 15 };
  E.DPOP = DPOP;
  var SHT = { LSL: 0, LSR: 1, ASR: 2, ROR: 3 };
  function condBits(c) { return parseInt(E.condByName(c).bits, 2); }
  E.encode = function (ins) {
    var cd = condBits(ins.cond), w = 0;
    var op = ins.op;
    if (op in DPOP && ins.o2) {
      var cmp = DPCMP.indexOf(op) >= 0, mov = op === 'MOV' || op === 'MVN';
      var S = (ins.S || cmp) ? 1 : 0;
      var rn = mov ? 0 : ins.rn, rd = cmp ? 0 : ins.rd;
      var o2, I = 0;
      if (ins.o2.k === 'imm') { I = 1; o2 = (ins.o2.rot << 8) | ins.o2.imm8; }
      else {
        var sh = ins.o2.sh;
        if (!sh) o2 = ins.o2.rm;
        else if (sh.t === 'RRX') o2 = (3 << 5) | ins.o2.rm;
        else if (sh.rs !== undefined) o2 = (sh.rs << 8) | (SHT[sh.t] << 5) | (1 << 4) | ins.o2.rm;
        else { var n5 = sh.n === 32 ? 0 : sh.n; o2 = (n5 << 7) | (SHT[sh.t] << 5) | ins.o2.rm; }
      }
      w = (cd << 28) | (I << 25) | (DPOP[op] << 21) | (S << 20) | (rn << 16) | (rd << 12) | o2;
      return w >>> 0;
    }
    if (op === 'B') {
      var off = ((ins.target - (ins.addr + 8)) >> 2) & 0x00FFFFFF;
      return ((cd << 28) | (0x5 << 25) | ((ins.link ? 1 : 0) << 24) | off) >>> 0;
    }
    if (op === 'BX') return ((cd << 28) | 0x012FFF10 | (ins.link ? 0x20 : 0) | ins.rm) >>> 0;
    if (op === 'MUL') return ((cd << 28) | ((ins.S ? 1 : 0) << 20) | (ins.rd << 16) | (ins.rs << 8) | 0x90 | ins.rm) >>> 0;
    if (op === 'MLA') return ((cd << 28) | (1 << 21) | ((ins.S ? 1 : 0) << 20) | (ins.rd << 16) | (ins.ra << 12) | (ins.rs << 8) | 0x90 | ins.rm) >>> 0;
    if (LONGS.indexOf(op) >= 0) {
      var u = op[0] === 'S' ? 1 : 0, a = op.indexOf('LAL') > 0 ? 1 : 0;
      return ((cd << 28) | (1 << 23) | (u << 22) | (a << 21) | ((ins.S ? 1 : 0) << 20) | (ins.rdhi << 16) | (ins.rdlo << 12) | (ins.rs << 8) | 0x90 | ins.rm) >>> 0;
    }
    if ((op === 'LDR' || op === 'STR') && ins.mem && ins.mem.rn !== null && (!ins.mem.off || ins.mem.off.k === 'imm')) {
      var offv = ins.mem.off ? ins.mem.off.v : 0, U = offv >= 0 ? 1 : 0, mag = Math.abs(offv);
      var P = ins.mem.pre ? 1 : 0, W = (ins.mem.pre && ins.mem.wb) ? 1 : 0, L = op === 'LDR' ? 1 : 0;
      if (ins.size === 'B' || ins.size === '') {
        if (mag > 4095) return null;
        return ((cd << 28) | (1 << 26) | (P << 24) | (U << 23) | ((ins.size === 'B' ? 1 : 0) << 22) | (W << 21) | (L << 20) | (ins.mem.rn << 16) | (ins.rd << 12) | mag) >>> 0;
      }
      if (mag > 255) return null;
      var sbit = (ins.size === 'SH' || ins.size === 'SB') ? 1 : 0, hbit = (ins.size === 'H' || ins.size === 'SH') ? 1 : 0;
      return ((cd << 28) | (P << 24) | (U << 23) | (1 << 22) | (W << 21) | (L << 20) | (ins.mem.rn << 16) | (ins.rd << 12) | ((mag >> 4) << 8) | 0x90 | (sbit << 6) | (hbit << 5) | (mag & 0xF)) >>> 0;
    }
    if (op === 'NOP') return 0xE320F000;
    return null;
  };

  /* ---------- the CPU ---------- */
  function CPU() { this.reset(null); }
  E.CPU = CPU;

  CPU.prototype.reset = function (asmResult) {
    this.reg = new Array(16).fill(0);
    this.reg[13] = STACK_TOP; this.reg[14] = 0xFFFFFFFF;
    this.f = { N: 0, Z: 0, C: 0, V: 0 };
    this.mem = new Map();
    this.touched = new Map();
    this.pc = CODE_BASE;
    this.halted = false; this.haltReason = ''; this.steps = 0;
    this.strictAlign = true;
    this.asm = asmResult || null;
    this.prog = asmResult ? asmResult.program : [];
    this.initMem = null;
    if (asmResult) {
      var self = this;
      asmResult.data.forEach(function (d) { for (var i = 0; i < d.bytes.length; i++) self.mem.set((d.addr + i) >>> 0, d.bytes[i]); });
    }
  };
  CPU.prototype.setFlags = function (n, z, c, v) { this.f = { N: n ? 1 : 0, Z: z ? 1 : 0, C: c ? 1 : 0, V: v ? 1 : 0 }; };
  CPU.prototype.readByte = function (a) { a = a >>> 0; return this.mem.has(a) ? this.mem.get(a) : 0; };
  CPU.prototype.writeByte = function (a, v) { a = a >>> 0; this.mem.set(a, v & 0xFF); this.touched.set(a, 'w'); };
  CPU.prototype.readN = function (a, n) {
    var v = 0;
    for (var i = n - 1; i >= 0; i--) v = ((v << 8) | this.readByte(a + i)) >>> 0;
    for (i = 0; i < n; i++) if (!this.touched.has((a + i) >>> 0)) this.touched.set((a + i) >>> 0, 'r');
    return v >>> 0;
  };
  CPU.prototype.writeN = function (a, v, n) { for (var i = 0; i < n; i++) this.writeByte(a + i, (v >>> (8 * i)) & 0xFF); };
  CPU.prototype.R = function (n, addr) { return n === 15 ? (addr + 8) >>> 0 : this.reg[n] >>> 0; };

  CPU.prototype.op2 = function (o, addr) {
    if (o.k === 'imm') return { v: o.value >>> 0, c: (o.rot ? (o.value >>> 31) : this.f.C), shifted: false };
    var rm = this.R(o.rm, addr);
    if (!o.sh) return { v: rm, c: this.f.C, shifted: false };
    var n = o.sh.rs !== undefined ? (this.R(o.sh.rs, addr) & 0xFF) : o.sh.n;
    var r = E.shiftC(o.sh.t, rm, n || 0, this.f.C);
    return { v: r.res, c: r.C, shifted: o.sh.t === 'RRX' || n > 0 };
  };

  CPU.prototype.writeReg = function (n, v, T) {
    v = v >>> 0;
    if (n === 15) { this.setPC(v & ~3, T); return; }
    this.reg[n] = v;
  };
  CPU.prototype.setPC = function (v, T) {
    v = v >>> 0;
    if (v >= 0xFFFFFFF0) { this.halted = true; this.haltReason = 'Returned from the program (LR held the "return to nobody" value 0xFFFFFFFF).'; this.pc = v; return; }
    this.pc = v;
    if (T) T.branch = v;
  };

  var SYM = { ADD: '+', ADC: '+', SUB: '−', SBC: '−', RSB: '−', RSC: '−', AND: 'AND', EOR: 'EOR', ORR: 'OR', BIC: 'AND NOT', ORN: 'OR NOT', CMP: '−', CMN: '+', TST: 'AND', TEQ: 'EOR' };

  CPU.prototype.step = function () {
    if (this.halted) return null;
    var addr = this.pc;
    var idx = (addr - CODE_BASE) / 4;
    if (addr % 4 !== 0 || idx < 0 || idx >= this.prog.length) {
      this.halted = true; this.haltReason = 'The PC (' + hx(addr) + ') ran past the last instruction. Real hardware would keep fetching whatever is there. End programs with a "stop B stop" loop.';
      return null;
    }
    var ins = this.prog[idx];
    var T = {
      addr: addr, ins: ins, text: ins.text, line: ins.line,
      pcBefore: addr, regsBefore: this.reg.slice(), fBefore: Object.assign({}, this.f),
      skipped: false, detail: null, msg: '', memOps: [], branch: null
    };
    this.pc = (addr + 4) >>> 0;   // the fetch increments the PC before execution
    var pass = E.condPasses(ins.cond, this.f);
    T.condPass = pass;
    if (!pass) {
      var c = E.condByName(ins.cond);
      T.skipped = true;
      T.msg = 'Skipped. ' + ins.cond + ' needs ' + c.need + ' but the flags are N=' + this.f.N + ' Z=' + this.f.Z + ' C=' + this.f.C + ' V=' + this.f.V + '. Nothing changes, not even the flags.';
    } else {
      try { this.exec(ins, addr, T); }
      catch (e) {
        if (e && e.fault) { this.halted = true; this.haltReason = e.fault; T.msg = 'Fault: ' + e.fault; T.fault = e.fault; }
        else throw e;
      }
    }
    T.pcAfter = this.pc; T.regsAfter = this.reg.slice(); T.fAfter = Object.assign({}, this.f);
    T.changed = [];
    for (var i = 0; i < 16; i++) if (T.regsBefore[i] !== T.regsAfter[i]) T.changed.push(i);
    this.steps++;
    if (ins.op === 'B' && !ins.link && ins.cond === 'AL' && ins.target === addr && !this.halted) {
      this.halted = true; this.haltReason = 'Reached a branch-to-self (the "stop B stop" idiom). The program is finished.';
    }
    if (ins.op === 'BKPT' && pass) { this.halted = true; this.haltReason = 'Hit a BKPT breakpoint.'; }
    return T;
  };

  CPU.prototype.run = function (max) {
    var out = [];
    max = max || 100000;
    while (!this.halted && out.length < max) { var t = this.step(); if (!t) break; out.push(t); }
    if (!this.halted && out.length >= max) { this.halted = true; this.haltReason = 'Stopped after ' + max + ' steps. Is there an infinite loop?'; }
    return out;
  };

  function align(addr, n, strict) {
    if (strict && addr % n !== 0) throw { fault: 'Alignment fault: a ' + (n === 4 ? 'word' : 'halfword') + ' access at ' + hx(addr) + ' needs an address divisible by ' + n + '.' };
  }

  CPU.prototype.exec = function (ins, addr, T) {
    var op = ins.op, f = this.f, self = this;
    var rn, o, r, res;

    if (op in DPOP && ins.o2) {
      var isCmp = DPCMP.indexOf(op) >= 0, isMov = (op === 'MOV' || op === 'MVN');
      rn = isMov ? 0 : this.R(ins.rn, addr);
      o = this.op2(ins.o2, addr);
      var a = rn, b = o.v, kind;
      switch (op) {
        case 'AND': case 'TST': res = (a & b) >>> 0; kind = 'logic'; break;
        case 'EOR': case 'TEQ': res = (a ^ b) >>> 0; kind = 'logic'; break;
        case 'ORR': res = (a | b) >>> 0; kind = 'logic'; break;
        case 'ORN': res = (a | ~b) >>> 0; kind = 'logic'; break;
        case 'BIC': res = (a & ~b) >>> 0; kind = 'logic'; break;
        case 'MOV': res = b; kind = 'logic'; break;
        case 'MVN': res = (~b) >>> 0; kind = 'logic'; break;
        case 'ADD': case 'CMN': r = E.addWithCarry(a, b, 0); kind = 'add'; break;
        case 'ADC': r = E.addWithCarry(a, b, f.C); kind = 'add'; break;
        case 'SUB': case 'CMP': r = E.addWithCarry(a, (~b) >>> 0, 1); kind = 'sub'; break;
        case 'SBC': r = E.addWithCarry(a, (~b) >>> 0, f.C); kind = 'sub'; break;
        case 'RSB': r = E.addWithCarry(b, (~a) >>> 0, 1); kind = 'sub'; a = b; b = rn; break;
        case 'RSC': r = E.addWithCarry(b, (~a) >>> 0, f.C); kind = 'sub'; a = b; b = rn; break;
      }
      if (r) res = r.res;
      var setFlags = ins.S || isCmp;
      var newF = null;
      if (setFlags) {
        if (kind === 'logic') newF = { N: res >>> 31, Z: res === 0 ? 1 : 0, C: o.c, V: f.V };
        else newF = { N: r.N, Z: r.Z, C: r.C, V: r.V };
      }
      if (!isCmp) this.writeReg(ins.rd, res, T);
      if (newF) this.f = newF;
      T.detail = { kind: kind, a: a >>> 0, b: b >>> 0, res: res >>> 0, flags: newF, shifted: o.shifted, writes: !isCmp };
      var opnd2 = ins.o2.k === 'imm' ? hx(o.v) : (o.v !== this.R(ins.o2.rm, addr) ? hx(o.v) + ' (after the shift)' : hx(o.v));
      if (isMov) T.msg = E.regName(ins.rd) + ' ← ' + (op === 'MVN' ? 'NOT ' : '') + opnd2 + ' = ' + hx(res);
      else if (isCmp) T.msg = 'Computed ' + hx(a >>> 0) + ' ' + SYM[op] + ' ' + opnd2 + ' = ' + hx(res) + ' and kept only the flags (no register is written).';
      else T.msg = E.regName(ins.rd) + ' ← ' + hx(a >>> 0) + ' ' + SYM[op] + ' ' + opnd2 + ' = ' + hx(res);
      if (setFlags) T.msg += '   Flags now N=' + this.f.N + ' Z=' + this.f.Z + ' C=' + this.f.C + ' V=' + this.f.V + '.';
      else T.msg += '   (No S, so the flags are untouched.)';
      return;
    }
    switch (op) {
      case 'MUL': case 'MLA': {
        var p = Math.imul(this.R(ins.rm, addr), this.R(ins.rs, addr)) >>> 0;
        if (op === 'MLA') p = (p + this.R(ins.ra, addr)) >>> 0;
        this.writeReg(ins.rd, p, T);
        if (ins.S) this.f = { N: p >>> 31, Z: p === 0 ? 1 : 0, C: f.C, V: f.V };
        T.msg = E.regName(ins.rd) + ' ← low 32 bits of the product = ' + hx(p);
        return;
      }
      case 'UMULL': case 'SMULL': case 'UMLAL': case 'SMLAL': {
        var x = BigInt(this.R(ins.rm, addr)), y = BigInt(this.R(ins.rs, addr));
        if (op[0] === 'S') { x = BigInt.asIntN(32, x); y = BigInt.asIntN(32, y); }
        var prod = x * y;
        if (op.indexOf('LAL') > 0) prod += (BigInt(this.reg[ins.rdhi]) << 32n) | BigInt(this.reg[ins.rdlo]);
        prod = BigInt.asUintN(64, prod);
        var lo = Number(prod & 0xFFFFFFFFn) >>> 0, hi = Number(prod >> 32n) >>> 0;
        this.writeReg(ins.rdlo, lo, T); this.writeReg(ins.rdhi, hi, T);
        if (ins.S) this.f = { N: hi >>> 31, Z: (hi === 0 && lo === 0) ? 1 : 0, C: f.C, V: f.V };
        T.msg = E.regName(ins.rdhi) + ':' + E.regName(ins.rdlo) + ' ← ' + hx(hi) + hx(lo).slice(2);
        return;
      }
      case 'UDIV': case 'SDIV': {
        var n1 = this.R(ins.rn, addr), d1 = this.R(ins.rm, addr), q;
        if (d1 === 0) q = 0;
        else if (op === 'UDIV') q = Math.floor(n1 / d1) >>> 0;
        else { q = (n1 | 0) === -2147483648 && (d1 | 0) === -1 ? 0x80000000 : (Math.trunc((n1 | 0) / (d1 | 0)) >>> 0); }
        this.writeReg(ins.rd, q, T);
        T.msg = E.regName(ins.rd) + ' ← ' + hx(q) + (d1 === 0 ? ' (divide by zero gives 0 on Cortex-M4)' : '');
        return;
      }
      case 'CLZ': { var cz = Math.clz32(this.R(ins.rm, addr)); this.writeReg(ins.rd, cz, T); T.msg = E.regName(ins.rd) + ' ← ' + cz + ' leading zeros'; return; }
      case 'RBIT': {
        var xv = this.R(ins.rm, addr), rv = 0;
        for (var i = 0; i < 32; i++) if ((xv >>> i) & 1) rv |= (1 << (31 - i));
        rv >>>= 0; this.writeReg(ins.rd, rv, T); T.msg = E.regName(ins.rd) + ' ← bits reversed = ' + hx(rv); return;
      }
      case 'REV': {
        var xr = this.R(ins.rm, addr);
        var rr = (((xr & 0xFF) << 24) | ((xr & 0xFF00) << 8) | ((xr >>> 8) & 0xFF00) | (xr >>> 24)) >>> 0;
        this.writeReg(ins.rd, rr, T); T.msg = E.regName(ins.rd) + ' ← bytes reversed = ' + hx(rr); return;
      }
      case 'BFC': case 'BFI': {
        var mask = ins.width === 32 ? 0xFFFFFFFF : (((1 << ins.width) >>> 0) - 1);
        var shifted = (mask << ins.lsb) >>> 0;
        var cur = this.R(ins.rd, addr), nv;
        if (op === 'BFC') nv = (cur & ~shifted) >>> 0;
        else nv = ((cur & ~shifted) | ((this.R(ins.rn, addr) & mask) << ins.lsb)) >>> 0;
        this.writeReg(ins.rd, nv, T);
        T.msg = E.regName(ins.rd) + ' ← ' + hx(nv) + ' (bits ' + (ins.lsb + ins.width - 1) + ' to ' + ins.lsb + (op === 'BFC' ? ' cleared)' : ' replaced)'); return;
      }
      case 'MRS': { var cp = ((f.N << 31) | (f.Z << 30) | (f.C << 29) | (f.V << 28)) >>> 0; this.writeReg(ins.rd, cp, T); T.msg = E.regName(ins.rd) + ' ← ' + hx(cp) + ' (the flag bits sit at the top)'; return; }
      case 'MSR': { var mv = this.R(ins.rm, addr); this.f = { N: (mv >>> 31) & 1, Z: (mv >>> 30) & 1, C: (mv >>> 29) & 1, V: (mv >>> 28) & 1 }; T.msg = 'Flags ← top four bits of ' + hx(mv); return; }
      case 'NOP': T.msg = 'Does nothing.'; return;
      case 'BKPT': T.msg = 'Breakpoint.'; return;
      case 'ADR': this.writeReg(ins.rd, ins.value, T); T.msg = E.regName(ins.rd) + ' ← the address ' + hx(ins.value); return;
      case 'LDRLIT': this.writeReg(ins.rd, ins.value, T); T.msg = E.regName(ins.rd) + ' ← the 32-bit literal ' + hx(ins.value) + ' (the assembler stores it nearby and loads it)'; return;
      case 'B': {
        if (ins.link) this.reg[14] = (addr + 4) >>> 0;
        this.setPC(ins.target, T);
        T.msg = (ins.link ? 'LR ← ' + hx(addr + 4) + ' and ' : '') + 'PC ← ' + hx(ins.target) + ' (the PC is replaced, with no +4).';
        return;
      }
      case 'BX': {
        var tgt = this.R(ins.rm, addr);
        if (ins.link) this.reg[14] = (addr + 4) >>> 0;
        this.setPC(tgt & ~1, T);
        T.msg = 'PC ← ' + hx(tgt & ~1);
        return;
      }
      case 'LDR': case 'STR': {
        var m = ins.mem, base = m.abs !== undefined ? m.abs : this.R(m.rn, addr), offv = 0;
        if (m.off) {
          if (m.off.k === 'imm') offv = m.off.v;
          else {
            var rmv = this.R(m.off.rm, addr);
            if (m.off.sh) rmv = E.shiftC(m.off.sh.t, rmv, m.off.sh.n || 0, f.C).res;
            offv = m.off.sub ? -rmv : rmv;
          }
        }
        var eff = (base + offv) >>> 0, ea = m.pre ? eff : base;
        var nbytes = (ins.size === 'B' || ins.size === 'SB') ? 1 : (ins.size === 'H' || ins.size === 'SH') ? 2 : 4;
        if (nbytes > 1) align(ea, nbytes, this.strictAlign);
        if (op === 'LDR') {
          var val = this.readN(ea, nbytes);
          if (ins.size === 'SB') val = ((val << 24) >> 24) >>> 0;
          if (ins.size === 'SH') val = ((val << 16) >> 16) >>> 0;
          if (m.rn !== null && m.wb) this.reg[m.rn] = eff;
          this.writeReg(ins.rd, val, T);
          T.memOps.push({ kind: 'r', addr: ea, n: nbytes, val: val });
          T.msg = E.regName(ins.rd) + ' ← memory[' + hx(ea) + '] = ' + hx(val, nbytes * 2) + '.';
        } else {
          var sv = ins.rd === 15 ? (addr + 8) >>> 0 : this.reg[ins.rd];
          this.writeN(ea, sv, nbytes);
          if (m.rn !== null && m.wb) this.reg[m.rn] = eff;
          T.memOps.push({ kind: 'w', addr: ea, n: nbytes, val: nbytes === 4 ? sv : (sv & ((1 << (8 * nbytes)) - 1)) });
          T.msg = 'memory[' + hx(ea) + '] ← ' + hx(nbytes === 4 ? sv : (sv & ((1 << (8 * nbytes)) - 1)) >>> 0, nbytes * 2) + '.';
        }
        if (m.rn !== null && m.wb) T.msg += ' ' + E.regName(m.rn) + ' ← ' + hx(eff) + ' (written back).';
        else if (m.rn !== null) T.msg += ' ' + E.regName(m.rn) + ' is unchanged.';
        T.ea = ea;
        return;
      }
      case 'LDM': case 'STM': {
        var list = ins.list, nb = list.length * 4, base2 = this.R(ins.rn, addr), start, newBase;
        switch (ins.amode) {
          case 'IA': start = base2; newBase = base2 + nb; break;
          case 'IB': start = base2 + 4; newBase = base2 + nb; break;
          case 'DA': start = base2 - nb + 4; newBase = base2 - nb; break;
          case 'DB': start = base2 - nb; newBase = base2 - nb; break;
        }
        start = start >>> 0;
        if (this.strictAlign) align(start, 4, true);
        var parts = [];
        list.forEach(function (rg, k) {
          var ea2 = (start + 4 * k) >>> 0;
          if (ins.op === 'STM') { var v2 = rg === 15 ? (addr + 12) >>> 0 : self.reg[rg]; self.writeN(ea2, v2, 4); T.memOps.push({ kind: 'w', addr: ea2, n: 4, val: v2 }); parts.push(E.regName(rg) + '→' + hx(ea2)); }
          else { var v3 = self.readN(ea2, 4); T.memOps.push({ kind: 'r', addr: ea2, n: 4, val: v3 }); self.writeReg(rg, v3, T); parts.push(E.regName(rg) + '←' + hx(ea2)); }
        });
        if (ins.wb) this.reg[ins.rn] = newBase >>> 0;
        T.msg = parts.join(', ') + (ins.wb ? '. ' + E.regName(ins.rn) + ' ← ' + hx(newBase >>> 0) + ' (written back).' : '.');
        return;
      }
    }
    throw new Error('Not implemented: ' + op);
  };

  /* convenience for the site and the tests */
  E.runProgram = function (src, init) {
    var a = E.assemble(src);
    if (!a.ok) return { asm: a, cpu: null, trace: [] };
    var cpu = new CPU(); cpu.reset(a);
    init = init || {};
    if (init.regs) Object.keys(init.regs).forEach(function (k) { var n = parseReg(k); cpu.reg[n] = init.regs[k] >>> 0; });
    if (init.flags) cpu.f = Object.assign({ N: 0, Z: 0, C: 0, V: 0 }, init.flags);
    if (init.mem) init.mem.forEach(function (m) { for (var i = 0; i < m.bytes.length; i++) cpu.mem.set((m.addr + i) >>> 0, m.bytes[i]); });
    var tr = cpu.run(init.max);
    return { asm: a, cpu: cpu, trace: tr };
  };
  E.parseReg = parseReg;
  E.parseMnemonic = parseMnemonic;
})(typeof window !== 'undefined' ? window : globalThis);
