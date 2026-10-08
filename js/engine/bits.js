/* Datapath: bit-level maths.
   Pure functions, no DOM. Everything the site shows about hex, two's complement,
   flags, shifts and condition codes comes from here, so a number on screen can
   never disagree with the simulator. */
(function (g) {
  'use strict';
  var E = g.E359 = g.E359 || {};

  var u32 = function (x) { return x >>> 0; };
  E.u32 = u32;

  E.hex = function (x, n) { return '0x' + (x >>> 0).toString(16).toUpperCase().padStart(n || 8, '0'); };
  E.hexDigits = function (x) { return (x >>> 0).toString(16).toUpperCase().padStart(8, '0'); };
  E.bin = function (x, n) { return (x >>> 0).toString(2).padStart(n || 32, '0'); };
  E.binGroups = function (x, n) {
    var s = E.bin(x, n || 32), out = [];
    for (var i = 0; i < s.length; i += 4) out.push(s.slice(i, i + 4));
    return out.join(' ');
  };
  E.signed = function (x) { return x | 0; };

  /* Parse a user-typed number: 0x1F, &1F, 1Fh, 0b101, 255, -5, 'A'. Returns uint32 or null. */
  E.parseValue = function (s) {
    if (s === null || s === undefined) return null;
    s = String(s).trim().replace(/^#/, '').replace(/[_\s]/g, '');
    if (!s) return null;
    var neg = false, m;
    if (s[0] === '-') { neg = true; s = s.slice(1); }
    var v;
    if ((m = /^(?:0x|&|\$)([0-9a-f]{1,8})$/i.exec(s))) v = parseInt(m[1], 16);
    else if ((m = /^([0-9a-f]{1,8})h$/i.exec(s))) v = parseInt(m[1], 16);
    else if ((m = /^0b([01]{1,32})$/i.exec(s))) v = parseInt(m[1], 2);
    else if (/^[0-9]+$/.test(s)) { v = Number(s); if (v > 4294967295) return null; }
    else if ((m = /^'(.)'$/.exec(s))) v = m[1].charCodeAt(0);
    else return null;
    return neg ? ((-v) >>> 0) : (v >>> 0);
  };

  /* ---------- adder ---------- */
  /* AddWithCarry, straight from the ARM Architecture Reference Manual pseudocode. */
  E.addWithCarry = function (a, b, cin) {
    a = a >>> 0; b = b >>> 0; cin = cin ? 1 : 0;
    var u = a + b + cin;
    var res = u >>> 0;
    var s = (a | 0) + (b | 0) + cin;
    return {
      res: res,
      C: u > 0xFFFFFFFF ? 1 : 0,
      V: (s < -2147483648 || s > 2147483647) ? 1 : 0,
      N: res >>> 31,
      Z: res === 0 ? 1 : 0,
      unsignedSum: u, signedSum: s
    };
  };
  E.add = function (a, b) { return E.addWithCarry(a, b, 0); };
  /* A - B is computed as A + NOT(B) + 1. */
  E.sub = function (a, b) { return E.addWithCarry(a, (~b) >>> 0, 1); };

  /* Column-by-column hex addition, right to left. cols[0] is the rightmost column.
     Each row: digit pair, carry in, raw sum, whether it carried, digit written, carry out. */
  E.columnAdd = function (a, b, cin) {
    var ah = E.hexDigits(a), bh = E.hexDigits(b), carry = cin ? 1 : 0, cols = [], out = '';
    for (var i = 7; i >= 0; i--) {
      var da = parseInt(ah[i], 16), db = parseInt(bh[i], 16);
      var sum = da + db + carry, cout = sum >= 16 ? 1 : 0, d = sum - 16 * cout;
      cols.push({ col: 8 - i, a: ah[i].toUpperCase(), b: bh[i].toUpperCase(), da: da, db: db, cin: carry, sum: sum, cout: cout, digit: d.toString(16).toUpperCase() });
      out = d.toString(16).toUpperCase() + out;
      carry = cout;
    }
    return { cols: cols, result: out, carryOut: carry };
  };

  /* Negation, shown as the three hex rows the study book uses. */
  E.negateSteps = function (x) {
    var o = E.hexDigits(x), flip = '', i;
    for (i = 0; i < 8; i++) flip += (15 - parseInt(o[i], 16)).toString(16).toUpperCase();
    var plus = E.hexDigits(((~x) >>> 0) + 1);
    return { orig: o, flip: flip, plus1: plus, value: (-x) >>> 0 };
  };

  /* ---------- barrel shifter ---------- */
  /* Shift_C from the ARM ARM. n = 0 means "no shift"; C passes through unchanged. */
  E.shiftC = function (type, x, n, cin) {
    x = x >>> 0; cin = cin ? 1 : 0;
    if (type === 'RRX') return { res: (((cin << 31) | (x >>> 1)) >>> 0), C: x & 1 };
    if (n === 0) return { res: x, C: cin };
    switch (type) {
      case 'LSL':
        if (n < 32) return { res: (x << n) >>> 0, C: (x >>> (32 - n)) & 1 };
        if (n === 32) return { res: 0, C: x & 1 };
        return { res: 0, C: 0 };
      case 'LSR':
        if (n < 32) return { res: x >>> n, C: (x >>> (n - 1)) & 1 };
        if (n === 32) return { res: 0, C: x >>> 31 };
        return { res: 0, C: 0 };
      case 'ASR':
        if (n < 32) return { res: ((x | 0) >> n) >>> 0, C: (x >>> (n - 1)) & 1 };
        return { res: ((x | 0) >> 31) >>> 0, C: x >>> 31 };
      case 'ROR': {
        var k = n % 32;
        if (k === 0) return { res: x, C: x >>> 31 };
        var r = ((x >>> k) | (x << (32 - k))) >>> 0;
        return { res: r, C: r >>> 31 };
      }
    }
    throw new Error('unknown shift ' + type);
  };

  /* ARM "modified immediate": 8 bits rotated right by an even amount. */
  E.encodeImm = function (v) {
    v = v >>> 0;
    for (var rot = 0; rot < 16; rot++) {
      var r = rot * 2;
      var x = r === 0 ? v : (((v << r) | (v >>> (32 - r))) >>> 0);
      if (x <= 0xFF) return { rot: rot, imm8: x };
    }
    return null;
  };
  E.decodeImm = function (rot, imm8) {
    var r = rot * 2;
    return r === 0 ? imm8 >>> 0 : (((imm8 >>> r) | (imm8 << (32 - r))) >>> 0);
  };

  /* ---------- condition codes ---------- */
  E.COND = [
    { code: 'EQ', bits: '0000', name: 'Equal / zero', need: 'Z = 1', kind: 'any', fn: function (f) { return f.Z === 1; } },
    { code: 'NE', bits: '0001', name: 'Not equal', need: 'Z = 0', kind: 'any', fn: function (f) { return f.Z === 0; } },
    { code: 'CS', alias: 'HS', bits: '0010', name: 'Carry set / unsigned higher or same', need: 'C = 1', kind: 'unsigned', fn: function (f) { return f.C === 1; } },
    { code: 'CC', alias: 'LO', bits: '0011', name: 'Carry clear / unsigned lower', need: 'C = 0', kind: 'unsigned', fn: function (f) { return f.C === 0; } },
    { code: 'MI', bits: '0100', name: 'Minus / negative', need: 'N = 1', kind: 'flag', fn: function (f) { return f.N === 1; } },
    { code: 'PL', bits: '0101', name: 'Plus / positive or zero', need: 'N = 0', kind: 'flag', fn: function (f) { return f.N === 0; } },
    { code: 'VS', bits: '0110', name: 'Overflow set', need: 'V = 1', kind: 'flag', fn: function (f) { return f.V === 1; } },
    { code: 'VC', bits: '0111', name: 'No overflow', need: 'V = 0', kind: 'flag', fn: function (f) { return f.V === 0; } },
    { code: 'HI', bits: '1000', name: 'Unsigned higher', need: 'C = 1 and Z = 0', kind: 'unsigned', fn: function (f) { return f.C === 1 && f.Z === 0; } },
    { code: 'LS', bits: '1001', name: 'Unsigned lower or same', need: 'C = 0 or Z = 1', kind: 'unsigned', fn: function (f) { return f.C === 0 || f.Z === 1; } },
    { code: 'GE', bits: '1010', name: 'Signed greater than or equal', need: 'N = V', kind: 'signed', fn: function (f) { return f.N === f.V; } },
    { code: 'LT', bits: '1011', name: 'Signed less than', need: 'N ≠ V', kind: 'signed', fn: function (f) { return f.N !== f.V; } },
    { code: 'GT', bits: '1100', name: 'Signed greater than', need: 'Z = 0 and N = V', kind: 'signed', fn: function (f) { return f.Z === 0 && f.N === f.V; } },
    { code: 'LE', bits: '1101', name: 'Signed less than or equal', need: 'Z = 1 or N ≠ V', kind: 'signed', fn: function (f) { return f.Z === 1 || f.N !== f.V; } },
    { code: 'AL', bits: '1110', name: 'Always (the default)', need: 'any flags', kind: 'any', fn: function () { return true; } },
    { code: 'NV', bits: '1111', name: 'Never (do not use)', need: 'never', kind: 'any', fn: function () { return false; } }
  ];
  E.condByName = function (name) {
    name = String(name).toUpperCase();
    for (var i = 0; i < E.COND.length; i++) {
      if (E.COND[i].code === name || E.COND[i].alias === name) return E.COND[i];
    }
    return null;
  };
  E.condPasses = function (name, f) { var c = E.condByName(name); return c ? c.fn(f) : false; };

  /* ---------- why each flag has the value it has (shown next to results) ---------- */
  var sg = function (x) { return (x >>> 31) ? 'negative' : 'positive'; };
  E.explainFlags = function (kind, a, b, res, f, extra) {
    var out = {}, hx = E.hex;
    out.N = 'bit 31 of ' + hx(res) + ' is ' + (res >>> 31) + (f.N ? ', so the result reads as negative' : ', so it reads as positive or zero');
    out.Z = f.Z ? 'the result is exactly 0x00000000' : 'the result is not zero';
    if (kind === 'add') {
      out.C = f.C ? 'the addition carried out of bit 31 (a 33rd bit)' : 'nothing carried out of bit 31';
      var sa = sg(a), sb = sg(b), sr = sg(res);
      if (sa !== sb) out.V = 'the operands have different signs (' + sa + ' + ' + sb + '), so signed overflow is impossible';
      else out.V = f.V ? sa + ' + ' + sb + ' gave a ' + sr + ' result, which is impossible, so signed overflow' : sa + ' + ' + sb + ' gave a ' + sr + ' result, which is possible, so no overflow';
    } else if (kind === 'sub') {
      out.C = f.C ? 'no borrow was needed (A ≥ B unsigned), so the adder carried out and C = 1' : 'a borrow was needed (A < B unsigned), so the adder did not carry out and C = 0';
      var ta = sg(a), tb = sg(b), tr = sg(res);
      if (ta === tb) out.V = 'the operands have the same sign (' + ta + ' − ' + tb + '), so signed overflow is impossible';
      else out.V = f.V ? ta + ' − ' + tb + ' gave a ' + tr + ' result, which is impossible, so signed overflow' : ta + ' − ' + tb + ' gave a ' + tr + ' result, which is possible, so no overflow';
    } else if (kind === 'logic') {
      out.C = extra && extra.shifted ? 'C is the last bit the shifter pushed out' : 'C is left as it was (no shift happened)';
      out.V = 'V is not touched by logical and move instructions';
    }
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
