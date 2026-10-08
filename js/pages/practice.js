/* Practice page. Every question is generated with fresh numbers and every answer is computed by the engine. */
(function (g) {
  'use strict';
  var E = g.E359, Lab = g.Lab, h = Lab.h;
  var hx = E.hex, rnd = Lab.rnd, pick = Lab.pick;
  function fl(f) { return '' + f.N + f.Z + f.C + f.V; }
  function nice32() {
    var x = Lab.rand32();
    var zeros = 2 + rnd(2);
    for (var i = 0; i < zeros; i++) { var nib = rnd(5); x = (x & ~(0xF << (4 * nib))) >>> 0; }
    return x >>> 0;
  }
  function reasons(kind, a, b, res, f) {
    var why = E.explainFlags(kind, a, b, res, f);
    return ['N', 'Z', 'C', 'V'].map(function (k) { return '**' + k + ' = ' + f[k] + '**: ' + why[k] + '.'; }).join('<br>');
  }

  /* ----- generators: each returns a spec for Lab.question ----- */
  var G = {};

  G.hexadd = { title: 'Add two hex numbers and give the flags', gen: function () {
    var kind = pick(['random', 'pospos', 'negneg', 'wrap', 'mixed']), a, b;
    if (kind === 'pospos') { a = (0x40000000 + rnd(0x3000) * 0x10000) >>> 0; b = (0x80000000 - a + rnd(0x1000) * 0x1000) >>> 0; if (b > 0x7FFFFFFF) b = 0x7FFFFFFF; }
    else if (kind === 'negneg') { a = (0x80000000 + nice32() % 0x7FFFFFFF) >>> 0; b = (0x80000000 + nice32() % 0x7FFFFFFF) >>> 0; }
    else if (kind === 'wrap') { a = (0xFFFFFFFF - rnd(16)) >>> 0; b = 1 + rnd(32); }
    else if (kind === 'mixed') { a = nice32() & 0x7FFFFFFF; b = (nice32() | 0x80000000) >>> 0; }
    else { a = nice32(); b = nice32(); }
    var r = E.add(a, b), f = { N: r.N, Z: r.Z, C: r.C, V: r.V };
    return { kind: 'flags', q: 'After `ADDS R8, R0, R1` with R0 = `' + hx(a) + '` and R1 = `' + hx(b) + '`, give R8 and the four flags.', res: r.res, resLabel: 'R8 (hex)', expect: f,
      why: 'Add right to left in hex: `' + hx(a) + ' + ' + hx(b) + ' = ' + hx(r.res) + '`.<br>' + reasons('add', a, b, r.res, f), hint: 'Work right to left, carrying whenever a column reaches 16. C is the carry out of the leftmost column. For V compare the signs of the operands and the result.' };
  } };

  G.hexsub = { title: 'Subtract and give the flags', gen: function () {
    var kind = pick(['random', 'small', 'bigger', 'posneg']), a, b;
    if (kind === 'small') { a = rnd(30); b = rnd(30); } else if (kind === 'bigger') { a = nice32() >>> 1; b = (a + 1 + rnd(0x1000) * 0x100) >>> 0; if (b > 0x7FFFFFFF) b = 0x7FFFFFFF; }
    else if (kind === 'posneg') { a = nice32() & 0x7FFFFFFF; b = (nice32() | 0x80000000) >>> 0; } else { a = nice32(); b = nice32(); }
    var r = E.sub(a, b), f = { N: r.N, Z: r.Z, C: r.C, V: r.V };
    return { kind: 'flags', q: 'After `SUBS R8, R0, R1` with R0 = `' + hx(a) + '` and R1 = `' + hx(b) + '`, give R8 and the four flags.', res: r.res, resLabel: 'R8 (hex)', expect: f,
      why: 'The processor computes `A + NOT B + 1`. The result is `' + hx(r.res) + '`.<br>' + reasons('sub', a, b, r.res, f), hint: 'On ARM, C = 1 means no borrow was needed (A is at least B, unsigned). That is the opposite of x86.' };
  } };

  G.negate = { title: 'Negate a number (two\'s complement)', gen: function () {
    var x = nice32(), n = E.negateSteps(x);
    return { kind: 'input', type: 'hex', q: 'What is `-' + hx(x) + '` as a 32-bit two\'s-complement number?', a: [hx(n.value)], ph: '0x........',
      why: 'Flip every hex digit (F minus the digit): `' + n.orig + '` becomes `' + n.flip + '`. Then add 1: `' + n.plus1 + '`. Check: the number plus its negation should be zero.', hint: 'Flip each hex digit, then add 1.' };
  } };

  G.signed = { title: 'Read a number as signed or unsigned', gen: function () {
    var x = pick([(0xFFFFFF00 + rnd(256)) >>> 0, (0xFFFF0000 + rnd(65536)) >>> 0, (0x80000000 + rnd(0x100)) >>> 0, rnd(500), (0x7FFFFF00 + rnd(256)) >>> 0]);
    var sv = x | 0, opts = [sv, x >>> 0, -sv, sv + 1].filter(function (v, i, a) { return a.indexOf(v) === i; });
    while (opts.length < 4) opts.push(sv + opts.length + 2);
    opts = Lab.shuffle(opts.slice(0, 4)); if (opts.indexOf(sv) < 0) opts[0] = sv;
    var fm = function (v) { return Number(v).toLocaleString('en-US'); };
    return { kind: 'mcq', q: 'What is `' + hx(x) + '` read as a **signed** 32-bit number?', opts: opts.map(fm), ans: opts.indexOf(sv),
      why: (sv < 0 ? 'The leading hex digit is ' + hx(x)[2] + ', which is 8 to F, so bit 31 is set and the number is negative. Negate it to find the size: `' + hx(E.negateSteps(x).value) + '` = ' + fm(-sv) + ', so the value is ' + fm(sv) + '.' : 'The leading digit is 0 to 7, so bit 31 is clear and the number is positive: ' + fm(sv) + '.') + ' Read as unsigned the same bits are ' + fm(x >>> 0) + '.' };
  } };

  G.shift = { title: 'Shifts and rotates', gen: function () {
    var t = pick(['LSL', 'LSR', 'ASR', 'ROR']), n = t === 'ROR' ? 1 + rnd(12) : 1 + rnd(8), x = nice32();
    var r = E.shiftC(t, x, n, 0);
    return { kind: 'multi', q: 'After `MOVS R8, R1, ' + t + ' #' + n + '` with R1 = `' + hx(x) + '`, give R8 and the carry flag C.', fields: [{ label: 'R8 (hex)', a: [hx(r.res)], type: 'hex' }, { label: 'C (0 or 1)', a: [String(r.C)], type: 'num' }],
      why: 'In binary R1 is `' + E.binGroups(x) + '`. After ' + t + ' #' + n + ' it is `' + E.binGroups(r.res) + '` = `' + hx(r.res) + '`. C is ' + (t === 'LSL' ? 'the last bit pushed off the top' : t === 'ROR' ? 'the new bit 31' : 'the last bit pushed off the bottom') + ': ' + r.C + '. N and Z come from the result, and V is untouched.', hint: 'A shift by a multiple of 4 moves whole hex digits. Write it in binary when it is not.' };
  } };

  G.condition = { title: 'Does a conditional instruction run?', gen: function () {
    var f = { N: rnd(2), Z: rnd(2), C: rnd(2), V: rnd(2) }, names = ['EQ', 'NE', 'CS', 'CC', 'MI', 'PL', 'VS', 'VC', 'HI', 'LS', 'GE', 'LT', 'GT', 'LE'];
    var c = pick(names), cc = E.condByName(c), ok = cc.fn(f), op = pick(['ADD', 'SUB', 'MOV', 'ORR']);
    return { kind: 'mcq', q: 'The flags are **N=' + f.N + ' Z=' + f.Z + ' C=' + f.C + ' V=' + f.V + '**. Does `' + op + c + ' R0, R1, R2` execute?', opts: ['Yes, it runs', 'No, it is skipped'], ans: ok ? 0 : 1,
      why: '`' + c + '` (' + cc.name + ') needs **' + cc.need + '**. ' + (ok ? 'That holds, so it runs.' : 'That does not hold, so it is skipped. A skipped instruction changes nothing, not even the flags.') };
  } };

  G.cmpbranch = { title: 'Signed or unsigned comparison', gen: function () {
    var pairs = [[0xFFFFFFFF, 1], [1, 0xFFFFFFFF], [0x80000000, 1], [5, 3], [3, 5], [0x7FFFFFFF, 0x80000000], [0xFFFFFFFE, 0xFFFFFFFF], [7, 7], [0x00000010, 0xFFFFFFF0]];
    var p = pick(pairs), a = p[0], b = p[1], r = E.sub(a, b), f = { N: r.N, Z: r.Z, C: r.C, V: r.V };
    var gt = E.condPasses('GT', f), hi = E.condPasses('HI', f);
    var ans = gt && hi ? 0 : gt ? 1 : hi ? 2 : 3;
    return { kind: 'mcq', q: 'After `CMP R0, R1` with R0 = `' + hx(a) + '` and R1 = `' + hx(b) + '`, which branches are taken: `BGT` (signed greater) and `BHI` (unsigned higher)?', opts: ['Both BGT and BHI', 'Only BGT', 'Only BHI', 'Neither'], ans: ans,
      why: 'CMP gives N=' + f.N + ' Z=' + f.Z + ' C=' + f.C + ' V=' + f.V + '. `GT` needs Z = 0 and N = V, which is ' + (gt ? 'true' : 'false') + '. `HI` needs C = 1 and Z = 0, which is ' + (hi ? 'true' : 'false') + '. As signed numbers ' + (a | 0) + ' versus ' + (b | 0) + '; as unsigned ' + (a >>> 0) + ' versus ' + (b >>> 0) + '.' };
  } };

  G.endian = { title: 'Little-endian loads', gen: function () {
    var bytes = [1, 2, 3, 4].map(function () { return 16 + rnd(224); }), size = pick(['LDR', 'LDRH', 'LDRB']), off = size === 'LDR' ? 0 : size === 'LDRH' ? pick([0, 2]) : rnd(4);
    var base = pick([0x20008000, 0x02000000, 0x20000100]);
    var res = E.runProgram('  ' + size + ' R1, [R0, #' + off + ']\nstop B stop', { regs: { R0: base }, mem: [{ addr: base, bytes: bytes }] });
    var hb = bytes.map(function (b) { return b.toString(16).toUpperCase().padStart(2, '0'); });
    var tbl = '<code>' + [0, 1, 2, 3].map(function (i) { return hx(base + i) + ' = ' + hb[i]; }).join('</code>, <code>') + '</code>';
    return { kind: 'input', type: 'hex', q: 'Memory holds ' + tbl + '. With R0 = `' + hx(base) + '`, what is R1 after `' + size + ' R1, [R0, #' + off + ']`?', a: [hx(res.cpu.reg[1])], ph: '0x........',
      why: 'ARM is little-endian, so the lowest address holds the least significant byte. ' + (size === 'LDR' ? 'Read the four bytes from the highest address down: `' + hb[3] + hb[2] + hb[1] + hb[0] + '`.' : size === 'LDRH' ? 'Two bytes at offset ' + off + ' make `' + hb[off + 1] + hb[off] + '`, zero-extended to 32 bits.' : 'One byte at offset ' + off + ' is `' + hb[off] + '`, zero-extended to 32 bits.') + ' R1 = `' + hx(res.cpu.reg[1]) + '`.', hint: 'Read the bytes backwards.' };
  } };

  G.indexing = { title: 'Pre, post and auto-indexing', gen: function () {
    var bytes = []; for (var i = 0; i < 12; i++) bytes.push(16 + rnd(224));
    var mode = pick(['pre', 'post', 'auto']), off = pick([4, 8]), base = 0x20008000;
    var ins = mode === 'pre' ? 'LDR R1, [R0, #' + off + ']' : mode === 'post' ? 'LDR R1, [R0], #' + off : 'LDR R1, [R0, #' + off + ']!';
    var res = E.runProgram('  ' + ins + '\nstop B stop', { regs: { R0: base }, mem: [{ addr: base, bytes: bytes }] });
    var hb = bytes.map(function (b) { return b.toString(16).toUpperCase().padStart(2, '0'); });
    return { kind: 'multi', q: 'R0 = `' + hx(base) + '`. Memory from `' + hx(base) + '` upward holds bytes <code>' + hb.join(' ') + '</code>. After `' + ins + '`, give R1 and R0.', fields: [{ label: 'R1 (hex)', a: [hx(res.cpu.reg[1])], type: 'hex' }, { label: 'R0 (hex)', a: [hx(res.cpu.reg[0])], type: 'hex' }],
      why: (mode === 'pre' ? 'Pre-index: the access uses R0 + ' + off + ' and R0 stays unchanged.' : mode === 'post' ? 'Post-index: the access uses R0 as it is, then R0 becomes R0 + ' + off + '.' : 'Auto-index: the access uses R0 + ' + off + ' and R0 is updated to that address (the ! writes it back).') + ' The word is read little-endian, so R1 = `' + hx(res.cpu.reg[1]) + '` and R0 = `' + hx(res.cpu.reg[0]) + '`.', hint: 'Brackets tell you when the offset applies: inside means before, outside means after. The ! writes back.' };
  } };

  G.trace = { title: 'Trace a conditional chain', gen: function () {
    var a = nice32(), b = nice32(), c = nice32();
    var templates = [
      ['CMP R0, R1', 'ADDGTS R2, R0, R1', 'SUBLE R2, R1, R0'],
      ['CMP R0, R1', 'MOVEQ R2, #1', 'MOVNE R2, #2'],
      ['SUBS R3, R0, R1', 'ADDMI R2, R2, #1', 'SUBCS R2, R2, #1'],
      ['CMP R0, R1', 'CMPGT R1, R2', 'MOVGT R3, #5']
    ];
    var lines = pick(templates), code = lines.map(function (l) { return '  ' + l; }).join('\n') + '\nstop B stop';
    var regs = { R0: a, R1: b, R2: c, R3: 0 };
    var res = E.runProgram(code, { regs: regs }), cpu = res.cpu;
    var msgs = res.trace.map(function (T, i) { return '`' + T.text + '`: ' + (T.skipped ? 'skipped (' + T.ins.cond + ' not met)' : T.msg.replace(/   .*$/, '')); });
    return { kind: 'multi', pre: h('pre', {}, h('code', { html: Lab.asmHtml(lines.join('\n')) })), q: 'Start with R0 = `' + hx(a) + '`, R1 = `' + hx(b) + '`, R2 = `' + hx(c) + '`, R3 = 0 and all flags clear. After the three lines, give R2, R3 and the flags as NZCV.',
      fields: [{ label: 'R2 (hex)', a: [hx(cpu.reg[2])], type: 'hex' }, { label: 'R3 (hex)', a: [hx(cpu.reg[3])], type: 'hex' }, { label: 'Flags NZCV', a: [fl(cpu.f)], type: 'text', ph: '0000' }],
      why: msgs.join('<br>') + '<br>Final flags: N=' + cpu.f.N + ' Z=' + cpu.f.Z + ' C=' + cpu.f.C + ' V=' + cpu.f.V + '.', hint: 'Write the flags down after every line. A skipped instruction leaves them untouched.' };
  } };

  G.encode = { title: 'Encode an instruction', gen: function () {
    var op = pick(['ADD', 'SUB', 'AND', 'ORR', 'EOR', 'BIC']), cond = pick(['', '', 'EQ', 'NE', 'GT', 'LT', 'CS']), rd = rnd(10), rn = rnd(10), rm = rnd(10);
    var s = rnd(2) ? 'S' : '', text = op + cond + s + ' R' + rd + ', R' + rn + ', R' + rm;
    var a = E.assemble('  ' + text + '\nstop B stop'), w = E.encode(a.program[0]);
    var fields = Lab.fieldsOfWord(w);
    return { kind: 'input', type: 'hex', q: 'What is the 32-bit machine word for `' + text + '`?', a: [hx(w)], ph: '0x........',
      why: fields.map(function (f) { return '`' + f.name + '` = ' + f.bits + ' (' + f.note + ')'; }).join('<br>') + '<br>Joined together: `' + E.binGroups(w) + '` = `' + hx(w) + '`.', hint: 'cond (4) | 00 | # | opcode (4) | S | Rn (4) | Rd (4) | shift (8 bits of zeros here) | Rm (4). Opcodes: AND 0000, EOR 0001, SUB 0010, ADD 0100, ORR 1100, BIC 1110.' };
  } };

  G.pc = { title: 'Fetch, execute and the PC', gen: function () {
    var addr = 0x10 + 4 * rnd(8), isB = rnd(2), tgt = 0x40 + 4 * rnd(8);
    var ins = isB ? 'B 0x' + tgt.toString(16).toUpperCase().padStart(4, '0') : pick(['ADD R0, R0, #1', 'MOV R1, R2', 'CMP R0, #10']);
    var after = isB ? tgt : addr + 4;
    var opts = [addr, addr + 4, tgt, addr + 8].filter(function (v, i, a) { return a.indexOf(v) === i; });
    while (opts.length < 4) opts.push(addr + 12 + opts.length * 4);
    opts = Lab.shuffle(opts.slice(0, 4)); if (opts.indexOf(after) < 0) opts[0] = after;
    return { kind: 'mcq', q: 'The instruction `' + ins + '` is at address `' + hx(addr, 4) + '`. What is the PC right after it has executed?', opts: opts.map(function (v) { return hx(v, 4); }), ans: opts.indexOf(after),
      why: isB ? 'A branch **replaces** the PC with its target, so the PC is `' + hx(tgt, 4) + '`. There is no +4 on top.' : 'The PC was incremented by 4 during the fetch (every ARM instruction is 4 bytes), and nothing changed it, so it is `' + hx(addr + 4, 4) + '`.' };
  } };

  G.imm = { title: 'Which constants fit in an immediate?', gen: function () {
    var good = [0xFF, 0x3FC, 0xFF000000, 0x1000, 0x80000000, 0xF000000F, 0x2A0, 0x4000], bad = [0x101, 0x12345678, 0x1FF, 0xFFFF, 0x102, 0x00FF00FF, 0x1234];
    var v = rnd(2) ? pick(good) : pick(bad), enc = E.encodeImm(v), ok = !!enc;
    return { kind: 'mcq', q: 'Can `MOV R0, #' + hx(v) + '` use that constant directly as an ARM immediate?', opts: ['Yes', 'No, it needs LDR R0, =value'], ans: ok ? 0 : 1,
      why: ok ? 'An immediate is an 8-bit value rotated right by an even number of places. `' + hx(v) + '` = `' + hx(enc.imm8, 2) + '` rotated right by ' + 2 * enc.rot + ', so it fits.' : 'No rotation by an even number of places brings `' + hx(v) + '` down to 8 bits, so it cannot be an immediate. Use `LDR R0, =' + hx(v) + '`.' };
  } };

  var BITS = [
    { q: 'Which single instruction clears bits 4 and 7 of R1 and leaves the rest alone?', opts: ['`BIC R1, R1, #0x90`', '`ORR R1, R1, #0x90`', '`AND R1, R1, #0x90`', '`EOR R1, R1, #0x90`'], ans: 0, why: '`BIC` clears every bit that is 1 in operand 2. 0x90 has bits 4 and 7 set. `AND` with 0x90 would keep only those bits.' },
    { q: 'Which instruction sets bit 0 of R2 and leaves the other bits alone?', opts: ['`ORR R2, R2, #1`', '`AND R2, R2, #1`', '`BIC R2, R2, #1`', '`MOV R2, #1`'], ans: 0, why: '`ORR` forces a bit to 1 and leaves the others untouched.' },
    { q: 'Which instruction toggles bit 5 of R3 without knowing its value?', opts: ['`EOR R3, R3, #0x20`', '`ORR R3, R3, #0x20`', '`BIC R3, R3, #0x20`', '`TST R3, #0x20`'], ans: 0, why: 'XOR with 1 flips a bit whatever it was. `TST` only tests and sets flags.' },
    { q: 'You want to know whether bit 6 of R0 is set, without changing R0. Which instruction does this?', opts: ['`TST R0, #0x40`', '`AND R0, R0, #0x40`', '`CMP R0, #0x40`', '`MOV R0, #0x40`'], ans: 0, why: '`TST` ANDs the operands, discards the result and sets Z = 1 if the bit was clear. `AND` would overwrite R0.' },
    { q: 'What does `MVN R1, R2` do?', opts: ['Copies the bitwise complement of R2 into R1', 'Negates R2 as a signed number', 'Moves R2 into R1 and sets the flags', 'Copies R2 into R1'], ans: 0, why: 'MVN means move negated: every bit of the source is inverted.' }
  ];
  G.bits = { title: 'Bit manipulation', gen: function () { var q = pick(BITS); return { kind: 'mcq', q: q.q, opts: q.opts, ans: q.ans, why: q.why }; } };

  var THEORY = [
    { q: 'A processor has a 32-bit address bus. How much memory can it address?', opts: ['4 GiB', '32 GiB', '1 GiB', '128 MiB'], ans: 0, why: '2^32 bytes = 4 GiB. That is the memory address space. Installed memory can be less.' },
    { q: 'Why is the DRAM cycle time about twice its access time?', opts: ['A read destroys the stored charge, so a restore cycle must follow', 'DRAM uses two clock edges', 'The address is sent twice', 'Refreshing happens on every read'], ans: 0, why: 'Reading a capacitor cell drains it. The read must be followed by a restore.' },
    { q: 'Which memory is typically used for caches?', opts: ['SRAM', 'DRAM', 'Flash', 'Disk'], ans: 0, why: 'SRAM holds a bit in a flip-flop, needs no refresh, and is fast, though it is less dense and costs more.' },
    { q: 'What is the defining property of a load-store architecture?', opts: ['Arithmetic works only on registers, so memory data is loaded and stored explicitly', 'Instructions have variable length', 'There is no register file', 'Memory is accessed through the ALU'], ans: 0, why: 'ARM cannot add to a memory location directly. Load, operate, store.' },
    { q: 'How many bits does an ARM data-processing instruction use to name its three registers?', opts: ['12 (three fields of 4 bits)', '15', '8', '16'], ans: 0, why: 'Rn, Rd and Rm get 4 bits each. 4 bits name 16 registers, which is why ARM has 16.' },
    { q: 'Which register is the program counter?', opts: ['r15', 'r13', 'r14', 'r0'], ans: 0, why: 'r13 is SP, r14 is LR and r15 is the PC.' },
    { q: 'What does the S in ADDS do?', opts: ['Updates the N, Z, C and V flags', 'Makes the add signed', 'Saturates the result', 'Skips the instruction if it fails'], ans: 0, why: 'Flags are opt-in on ARM: only compares always set them. Everything else needs S.' },
    { q: 'The CPU computes a - b by...', opts: ['adding a, NOT b and 1', 'borrowing across digits in a subtractor', 'adding b to a and flipping the sign', 'repeated decrement'], ans: 0, why: 'There is one adder. Subtraction is addition of the complement plus 1, and C is the adder\'s carry out.' },
    { q: 'Why does ARM have no rotate-left instruction?', opts: ['Rotate left by n equals rotate right by 32 - n', 'It is too slow', 'The barrel shifter only goes right', 'It is covered by LSL'], ans: 0, why: 'A rotate left can always be written as a rotate right by a different amount.' }
  ];
  G.theory = { title: 'Concepts from Modules 2 and 3', gen: function () { var q = pick(THEORY); return { kind: 'mcq', q: q.q, opts: q.opts, ans: q.ans, why: q.why }; } };

  Lab.generators = G;
  var ORDER = ['hexadd', 'hexsub', 'negate', 'signed', 'shift', 'condition', 'cmpbranch', 'trace', 'endian', 'indexing', 'encode', 'pc', 'imm', 'bits', 'theory'];

  Lab.pages.practice = function (el, topicArg) {
    Lab.setTitle('Practice');
    var P = Lab.progress.practice;
    var state = { topic: topicArg && G[topicArg] ? topicArg : 'mixed', streak: 0 };
    el.appendChild(h('div', { class: 'lesson-head' }, h('h1', {}, 'Practice'), h('p', { class: 'lede' }, 'Fresh numbers every time. Every answer is computed by the same engine as the simulator, so the explanation shown after you answer is always correct.')));
    var chips = h('div', { class: 'seg', role: 'group', 'aria-label': 'Topic' });
    var slot = h('div', { class: 'practice-slot' }), stats = h('div', { class: 'practice-stats muted num' });
    function drawChips() {
      Lab.clear(chips);
      [['mixed', 'Mixed']].concat(ORDER.map(function (k) { return [k, G[k].title]; })).forEach(function (t) {
        chips.appendChild(h('button', { type: 'button', 'aria-pressed': state.topic === t[0] ? 'true' : 'false', onclick: function () { state.topic = t[0]; drawChips(); next(); } }, t[1]));
      });
    }
    el.appendChild(h('div', { class: 'practice-chips' }, chips));
    el.appendChild(stats); el.appendChild(slot);
    function drawStats() {
      var pct = P.answered ? Math.round(100 * P.correct / P.answered) : 0;
      stats.textContent = 'All time: ' + P.correct + ' of ' + P.answered + ' correct (' + pct + '%). Streak now: ' + state.streak + '. Best streak: ' + P.bestStreak + '.';
    }
    function next() {
      Lab.clear(slot);
      var key = state.topic === 'mixed' ? pick(ORDER) : state.topic;
      var spec; try { spec = G[key].gen(); } catch (e) { console.error(e); slot.appendChild(h('p', {}, 'Could not make a question: ' + e.message)); return; }
      var card = h('div', { class: 'card' }, h('span', { class: 'card-label' }, G[key].title));
      var nextBtn = h('button', { class: 'btn btn-primary', type: 'button', style: { marginTop: '14px' } }, 'Next question');
      nextBtn.addEventListener('click', next);
      var q = Lab.question(spec, { onDone: function (ok) {
        P.answered++; if (ok) { P.correct++; state.streak++; if (state.streak > P.bestStreak) P.bestStreak = state.streak; } else state.streak = 0;
        var t = P.byTopic[key] = P.byTopic[key] || { a: 0, c: 0 }; t.a++; if (ok) t.c++;
        Lab.saveProgress(); drawStats(); card.appendChild(nextBtn); nextBtn.focus();
      } });
      card.appendChild(q.el); slot.appendChild(card);
    }
    drawChips(); drawStats(); next();

    var tbl = ORDER.filter(function (k) { return P.byTopic[k]; });
    if (tbl.length) {
      el.appendChild(h('h2', { style: { fontSize: 'var(--fs-3)', marginTop: '32px' } }, 'Your accuracy by topic'));
      el.appendChild(Lab.table(['Topic', 'Correct', 'Attempts', 'Accuracy'], tbl.map(function (k) { var t = P.byTopic[k]; return [G[k].title, String(t.c), String(t.a), Math.round(100 * t.c / t.a) + '%']; })));
    }
  };
})(window);
