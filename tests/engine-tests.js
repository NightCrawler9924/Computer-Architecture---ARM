/* Engine tests. Expected values were computed independently with Python big integers
   (not with this engine) or taken from worked examples printed in the course slides. */
(function () {
  var E = window.E359, out = document.getElementById('out'), pass = 0, fail = 0, failures = [];
  function T(name, ok, detail) {
    var d = document.createElement('div');
    d.className = ok ? 'pass' : 'fail';
    d.textContent = (ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  ->  ' + detail);
    out.appendChild(d);
    if (ok) pass++; else { fail++; failures.push(name + ' -> ' + detail); }
  }
  function eq(name, got, want) { T(name, got === want, 'got ' + got + ', want ' + want); }
  function fl(f) { return '' + f.N + f.Z + f.C + f.V; }
  var hx = E.hex;

  /* ---- adder: the pairs the study book is built around ---- */
  function addCase(name, a, b, res, nzcv) {
    var r = E.add(a, b);
    eq(name + ' result', hx(r.res), res);
    eq(name + ' NZCV', fl(r), nzcv);
  }
  addCase('7FFFFFFF+1', 0x7FFFFFFF, 1, '0x80000000', '1001');
  addCase('FFFFFFFF+1', 0xFFFFFFFF, 1, '0x00000000', '0110');
  addCase('40000000x2', 0x40000000, 0x40000000, '0x80000000', '1001');
  addCase('C0000000x2', 0xC0000000, 0xC0000000, '0x80000000', '1010');
  addCase('80000000+80000001', 0x80000000, 0x80000001, '0x00000001', '0011');
  addCase('7DBC1266+EFD41234 (HW1 1a)', 0x7DBC1266, 0xEFD41234, '0x6D90249A', '0010');
  addCase('6DFF8763+9876ABCD (HW1 1b)', 0x6DFF8763, 0x9876ABCD, '0x06763330', '0010');
  addCase('12345678+EDCBA988', 0x12345678, 0xEDCBA988, '0x00000000', '0110');
  addCase('FAB46AD2+EFFD34A4 (HW1 2a)', 0xFAB46AD2, 0xEFFD34A4, '0xEAB19F76', '1010');

  function subCase(name, a, b, res, nzcv) {
    var r = E.sub(a, b);
    eq(name + ' result', hx(r.res), res);
    eq(name + ' NZCV', fl(r), nzcv);
  }
  subCase('6DFF8763-EFD41234 (HW1 1c)', 0x6DFF8763, 0xEFD41234, '0x7E2B752F', '0000');
  subCase('9876ABCD-6DFF8763 (HW1 1d)', 0x9876ABCD, 0x6DFF8763, '0x2A77246A', '0011');
  subCase('EFD41234-9876543D... (HW1 2c uses EFFD34A4-9876543D)', 0xEFFD34A4, 0x9876543D, '0x5786E067', '0010');
  subCase('FED46A34-7865432A (HW1 3 CMP)', 0xFED46A34, 0x7865432A, '0x866F270A', '1010');
  subCase('3-5 (ARM C = NOT borrow)', 3, 5, '0xFFFFFFFE', '1000');
  subCase('5-3', 5, 3, '0x00000002', '0010');
  subCase('FFFFFFFF-1', 0xFFFFFFFF, 1, '0xFFFFFFFE', '1010');
  subCase('X-X gives C=1', 0x1234, 0x1234, '0x00000000', '0110');

  /* ---- column table agrees with the adder ---- */
  var ca = E.columnAdd(0x7DBC1266, 0xEFD41234, 0);
  eq('columnAdd digits', ca.result, '6D90249A');
  eq('columnAdd carry out', ca.carryOut, 1);
  eq('columnAdd first column worked is the rightmost, numbered 1', ca.cols[0].col, 1);
  eq('columnAdd rightmost 6+4 = 10 -> A carry 0', ca.cols[0].sum + ':' + ca.cols[0].digit + ':' + ca.cols[0].cout, '10:A:0');
  eq('columnAdd leftmost 7+E+1 = 22 -> 6 carry 1', ca.cols[7].sum + ':' + ca.cols[7].digit + ':' + ca.cols[7].cout, '22:6:1');
  eq('columnAdd leftmost is column 8', ca.cols[7].col, 8);
  var ns = E.negateSteps(0xEFD41234);
  eq('negate flip', ns.flip, '102BEDCB'); eq('negate +1', ns.plus1, '102BEDCC');

  /* ---- shifts ---- */
  function sh(name, type, x, n, cin, res, c) { var r = E.shiftC(type, x, n, cin); eq(name + ' result', hx(r.res), res); eq(name + ' C', r.C, c); }
  sh('LSL 60000000 #2 (HW-style)', 'LSL', 0x60000000, 2, 0, '0x80000000', 1);
  sh('LSR 9876543D #4', 'LSR', 0x9876543D, 4, 0, '0x09876543', 1);
  sh('ROR EFFD34A4 #3 (HW1 2b)', 'ROR', 0xEFFD34A4, 3, 0, '0x9DFFA694', 1);
  sh('LSL EFFD34A4 #2 (HW1 2d)', 'LSL', 0xEFFD34A4, 2, 0, '0xBFF4D290', 1);
  sh('ASR A0000030 #2 (slide)', 'ASR', 0xA0000030, 2, 0, '0xE800000C', 0);
  sh('LSL 00000030 #2 (slide)', 'LSL', 0x30, 2, 0, '0x000000C0', 0);
  sh('LSR FFFFFFF8 #2 (bug demo)', 'LSR', 0xFFFFFFF8, 2, 0, '0x3FFFFFFE', 0);
  sh('ASR FFFFFFF8 #2', 'ASR', 0xFFFFFFF8, 2, 0, '0xFFFFFFFE', 0);
  sh('LSR #32', 'LSR', 0x80000001, 32, 0, '0x00000000', 1);
  sh('ASR #32 negative', 'ASR', 0x80000000, 32, 0, '0xFFFFFFFF', 1);
  sh('LSL #0 keeps C', 'LSL', 0x1234, 0, 1, '0x00001234', 1);
  sh('RRX with C=1', 'RRX', 0x00000003, 1, 1, '0x80000001', 1);
  sh('RRX with C=0', 'RRX', 0x00000002, 1, 0, '0x00000001', 0);
  sh('ROR #32 keeps value, C=bit31', 'ROR', 0x80000000, 32, 0, '0x80000000', 1);

  /* ---- conditions against the formula sheet ---- */
  function cc(name, f, want) { eq('cond ' + name + ' @ ' + fl(f), E.condPasses(name, f) ? 1 : 0, want); }
  cc('GT', { N: 1, Z: 0, C: 1, V: 0 }, 0);
  cc('GT', { N: 0, Z: 0, C: 1, V: 0 }, 1);
  cc('GT', { N: 1, Z: 0, C: 0, V: 1 }, 1);
  cc('LE', { N: 1, Z: 0, C: 0, V: 0 }, 1);
  cc('HI', { N: 0, Z: 0, C: 1, V: 0 }, 1);
  cc('HI', { N: 0, Z: 1, C: 1, V: 0 }, 0);
  cc('LS', { N: 0, Z: 1, C: 1, V: 0 }, 1);
  cc('HS', { N: 0, Z: 0, C: 1, V: 0 }, 1);
  cc('LO', { N: 0, Z: 0, C: 0, V: 0 }, 1);
  cc('GE', { N: 1, Z: 0, C: 0, V: 1 }, 1);
  cc('LT', { N: 1, Z: 0, C: 0, V: 0 }, 1);
  cc('VS', { N: 0, Z: 0, C: 0, V: 1 }, 1);
  cc('MI', { N: 1, Z: 0, C: 0, V: 0 }, 1);
  cc('PL', { N: 0, Z: 1, C: 0, V: 0 }, 1);
  cc('AL', { N: 0, Z: 0, C: 0, V: 0 }, 1);
  eq('cond bits GT', E.condByName('GT').bits, '1100');
  eq('cond bits CS', E.condByName('HS').bits, '0010');

  /* ---- immediates ---- */
  T('imm 0xFF ok', !!E.encodeImm(0xFF)); T('imm 0xFF000000 ok', !!E.encodeImm(0xFF000000));
  T('imm 0x12345678 not ok', E.encodeImm(0x12345678) === null);
  T('imm 0x3FC ok', !!E.encodeImm(0x3FC)); T('imm 0x101 not ok', E.encodeImm(0x101) === null);
  eq('decodeImm round trip', hx(E.decodeImm(E.encodeImm(0xFF000000).rot, E.encodeImm(0xFF000000).imm8)), '0xFF000000');

  /* ---- parsing ---- */
  eq('parse 0x1F', E.parseValue('0x1F'), 31); eq('parse &ff', E.parseValue('&ff'), 255);
  eq('parse -1', E.parseValue('-1'), 0xFFFFFFFF); eq('parse 0b101', E.parseValue('0b101'), 5);
  eq('parse junk', E.parseValue('hello'), null);
  function pm(m) { var p = E.parseMnemonic(m); return p ? p.base + '/' + p.cond + '/' + (p.S ? 'S' : '-') + (p.size ? '/' + p.size : '') : 'null'; }
  eq('mnemonic ADDGTS', pm('ADDGTS'), 'ADD/GT/S'); eq('mnemonic ADDSGT', pm('ADDSGT'), 'ADD/GT/S');
  eq('mnemonic ADDS', pm('ADDS'), 'ADD/AL/S'); eq('mnemonic ADDLS', pm('ADDLS'), 'ADD/LS/-');
  eq('mnemonic CMPGTS', pm('CMPGTS'), 'CMP/GT/S'); eq('mnemonic MOVEQ', pm('MOVEQ'), 'MOV/EQ/-');
  eq('mnemonic BLE', pm('BLE'), 'B/LE/-'); eq('mnemonic BLT', pm('BLT'), 'B/LT/-');
  eq('mnemonic BL', pm('BL'), 'BL/AL/-'); eq('mnemonic BLEQ', pm('BLEQ'), 'BL/EQ/-');
  eq('mnemonic BIC not a branch', pm('BIC'), 'BIC/AL/-'); eq('mnemonic BICS', pm('BICS'), 'BIC/AL/S');
  eq('mnemonic LDRB', pm('LDRB'), 'LDR/AL/-/B'); eq('mnemonic LDRHS is LDR+HS', pm('LDRHS'), 'LDR/CS/-');
  eq('mnemonic LDRSH', pm('LDRSH'), 'LDR/AL/-/SH'); eq('mnemonic LDREQB', pm('LDREQB'), 'LDR/EQ/-/B');
  eq('mnemonic UMULLS', pm('UMULLS'), 'UMULL/AL/S'); eq('mnemonic SUBCS', pm('SUBCS'), 'SUB/CS/-');
  eq('mnemonic nonsense', pm('FOOBAR'), 'null');

  /* ---- machine-code encodings (formats from Module 3; spot values are the standard ARM encodings) ---- */
  function enc(line, want) {
    var a = E.assemble('  ' + line + '\nstop B stop');
    if (!a.ok) { T('encode ' + line, false, JSON.stringify(a.errors)); return; }
    var w = E.encode(a.program[0]);
    eq('encode ' + line, w === null ? 'null' : hx(w), want);
  }
  enc('ADDGT r0, r3, r9', '0xC0830009');   // Module 3 p.3 worked example
  enc('ADD r1, r2, r3', '0xE0821003');
  enc('ADD r1, r2, #4', '0xE2821004');
  enc('MOV r0, #0', '0xE3A00000');
  enc('SUBS r4, r0, r2', '0xE0504002');
  enc('CMP r0, #10', '0xE350000A');
  enc('MOV r1, r2, LSL #3', '0xE1A01182');
  enc('ADD r1, r0, r0, LSL #3', '0xE0801180');
  enc('LDR r1, [r0]', '0xE5901000');
  enc('STR r1, [r0]', '0xE5801000');
  enc('LDR r1, [r0, #4]!', '0xE5B01004');
  enc('LDR r1, [r0], #4', '0xE4901004');
  enc('LDRB r1, [r0]', '0xE5D01000');
  enc('LDRH r1, [r0]', '0xE1D010B0');
  enc('MUL r4, r3, r2', '0xE0040293');
  enc('UMULL r0, r1, r2, r3', '0xE0810392');
  enc('SMULL r0, r1, r2, r3', '0xE0C10392');
  enc('BX lr', '0xE12FFF1E');
  var bself = E.assemble('stop B stop'); eq('encode B to self', hx(E.encode(bself.program[0])), '0xEAFFFFFE');
  var bfwd = E.assemble('  B skip\n  NOP\nskip NOP'); eq('encode B forward 1', hx(E.encode(bfwd.program[0])), '0xEA000000');

  /* ---- whole programs ---- */
  function run(src, init) { var r = E.runProgram(src, init); if (!r.asm.ok) throw new Error(JSON.stringify(r.asm.errors)); return r.cpu; }

  // Homework 1 Problem 3, exactly as printed, starting from CVZN = 1100
  var c3 = run('  CMP R0, R2\n  CMPGTS R2, R0\n  ADDGTS R1, R0, R2\n  SUBCS R0, R2\nstop B stop',
    { regs: { R0: 0xFED46A34, R1: 0xEFFD3456, R2: 0x7865432A }, flags: { C: 1, V: 1, Z: 0, N: 0 } });
  eq('HW1 P3 R0', hx(c3.reg[0]), '0x866F270A'); eq('HW1 P3 R1 (skipped)', hx(c3.reg[1]), '0xEFFD3456');
  eq('HW1 P3 R2', hx(c3.reg[2]), '0x7865432A'); eq('HW1 P3 flags NZCV', fl(c3.f), '1010');

  // Homework 1 Problem 2, each independent
  function one(line, regs) { return run('  ' + line + '\nstop B stop', { regs: regs || { R0: 0xFAB46AD2, R1: 0xEFFD34A4, R2: 0x9876543D } }); }
  var p2b = one('MOVS R8, R1, ROR #3'); eq('HW1 P2b', hx(p2b.reg[8]), '0x9DFFA694');
  eq('HW1 P2b C', p2b.f.C, 1); eq('HW1 P2b N', p2b.f.N, 1);
  var p2c = one('SUBS R8, R1, R2'); eq('HW1 P2c', hx(p2c.reg[8]), '0x5786E067'); eq('HW1 P2c NZCV', fl(p2c.f), '0010');
  var p2d = one('MOVS R8, R1, LSL #2'); eq('HW1 P2d', hx(p2d.reg[8]), '0xBFF4D290'); eq('HW1 P2d C', p2d.f.C, 1);
  var p2e = one('MOVS R8, R2, LSR #4'); eq('HW1 P2e', hx(p2e.reg[8]), '0x09876543'); eq('HW1 P2e C', p2e.f.C, 1);
  var p2a = one('ADDS R8, R0, R1'); eq('HW1 P2a', hx(p2a.reg[8]), '0xEAB19F76'); eq('HW1 P2a NZCV', fl(p2a.f), '1010');
  // V is preserved by MOVS
  var vp = run('  MOVS R8, R1, LSL #2\nstop B stop', { regs: { R1: 0xEFFD34A4 }, flags: { V: 1 } }); eq('MOVS preserves V', vp.f.V, 1);
  var vp0 = run('  MOVS R8, R1, LSL #2\nstop B stop', { regs: { R1: 0xEFFD34A4 }, flags: { V: 0 } }); eq('MOVS preserves V=0', vp0.f.V, 0);

  // Homework 1 Problem 1e
  var p1e = run('  MOV R10, R2, LSR #2\n  MOV R11, R3, LSL #3\n  ORR R10, R10, R11\nstop B stop', { regs: { R2: 0x6DFF8763, R3: 0x9876ABCD } });
  eq('HW1 P1e', hx(p1e.reg[10]), '0xDBFFFFF8');

  // Course slide: handout examples
  var rb = run('  LDR r0, =0x12345678\n  RBIT r1, r0\nstop B stop'); eq('RBIT slide example', hx(rb.reg[1]), '0x1E6A2C48');
  var w64 = run('  LDR r0, =0xFFFFFFFF\n  LDR r1, =0x00000002\n  LDR r2, =0x00000001\n  LDR r3, =0x00000004\n  ADDS r4, r2, r0\n  ADC r5, r3, r1\nstop B stop');
  eq('64-bit add low', hx(w64.reg[4]), '0x00000000'); eq('64-bit add high', hx(w64.reg[5]), '0x00000007');
  var s64 = run('  LDR r0, =0xFFFFFFFF\n  LDR r1, =0x00000002\n  LDR r2, =0x00000001\n  LDR r3, =0x00000004\n  SUBS r4, r0, r2\n  SBC r5, r1, r3\nstop B stop');
  eq('64-bit sub low', hx(s64.reg[4]), '0xFFFFFFFE'); eq('64-bit sub high', hx(s64.reg[5]), '0xFFFFFFFE');
  var bits = run('  BIC R1, R1, #0x90\n  ORR R2, R2, #1\nstop B stop', { regs: { R1: 0xFFFFFFFF, R2: 0x10 } });
  eq('BIC clears bits 4 and 7', hx(bits.reg[1]), '0xFFFFFF6F'); eq('ORR sets bit 0', hx(bits.reg[2]), '0x00000011');
  var bf = run('  BFC R4, #8, #12\n  BFI R9, R2, #8, #12\nstop B stop', { regs: { R4: 0xFFFFFFFF, R9: 0, R2: 0xABC } });
  eq('BFC', hx(bf.reg[4]), '0xFFF000FF'); eq('BFI', hx(bf.reg[9]), '0x000ABC00');
  var mul35 = run('  ADD r0, r0, r0, LSL #2\n  RSB r0, r0, r0, LSL #3\nstop B stop', { regs: { R0: 3 } }); eq('x35 with shifts', mul35.reg[0], 105);
  var b9 = run('  ADD r1, r0, r0, LSL #3\nstop B stop', { regs: { R0: 7 } }); eq('9x with barrel shifter', b9.reg[1], 63);

  // Memory: endianness and load sizes (Module 3 p.12-13)
  var mem1 = [{ addr: 0x02000000, bytes: [0xE1, 0xE3, 0x65, 0x87] }];
  var ld = run('  LDR R0, =0x02000000\n  LDRB R1, [R0]\n  LDRH R2, [R0]\n  LDR R3, [R0]\nstop B stop', { mem: mem1 });
  eq('LDRB', hx(ld.reg[1]), '0x000000E1'); eq('LDRH', hx(ld.reg[2]), '0x0000E3E1'); eq('LDR', hx(ld.reg[3]), '0x8765E3E1');
  var lsh = run('  LDR R0, =0x100\n  LDRSH R1, [R0]\n  LDRSB R2, [R0]\nstop B stop', { mem: [{ addr: 0x100, bytes: [0x00, 0x80] }] });
  eq('LDRSH sign extends', hx(lsh.reg[1]), '0xFFFF8000'); eq('LDRSB sign extends', hx(lsh.reg[2]), '0x00000000');
  var en = run('  LDR R0, =0x20008000\n  LDR R1, [R0]\nstop B stop', { mem: [{ addr: 0x20008000, bytes: [0xEE, 0x8C, 0x90, 0xA7] }] });
  eq('slide endian example', hx(en.reg[1]), '0xA7908CEE');
  var mem2 = [{ addr: 0x20008000, bytes: [0x1F, 0x2E, 0x3D, 0x4C, 0x5B, 0x6A, 0x79, 0x88] }];
  var pre = run('  LDR R0, =0x20008000\n  LDR R1, [R0, #4]\nstop B stop', { mem: mem2 });
  eq('pre-index R1', hx(pre.reg[1]), '0x88796A5B'); eq('pre-index R0 unchanged', hx(pre.reg[0]), '0x20008000');
  var post = run('  LDR R0, =0x20008000\n  LDR R1, [R0], #4\nstop B stop', { mem: mem2 });
  eq('post-index R1', hx(post.reg[1]), '0x4C3D2E1F'); eq('post-index R0', hx(post.reg[0]), '0x20008004');
  var auto = run('  LDR R0, =0x20008000\n  LDR R1, [R0, #4]!\nstop B stop', { mem: mem2 });
  eq('auto-index R1', hx(auto.reg[1]), '0x88796A5B'); eq('auto-index R0', hx(auto.reg[0]), '0x20008004');
  var mis = E.runProgram('  LDR R0, =0x20008000\n  LDR R1, [R0, #2]!\nstop B stop', { mem: mem2 });
  T('misaligned word load faults', mis.cpu.halted && /Alignment/.test(mis.cpu.haltReason), mis.cpu.haltReason);
  var lh2 = run('  LDR R0, =0x20008000\n  LDRH R1, [R0, #2]\nstop B stop', { mem: mem2 });
  eq('LDRH at +2 is legal', hx(lh2.reg[1]), '0x00004C3D');
  var st = run('  LDR R0, =0x20008010\n  LDR R1, =0xAABBCCDD\n  STR R1, [R0]\n  LDRB R2, [R0]\n  LDRB R3, [R0, #3]\nstop B stop');
  eq('STR little-endian byte 0', hx(st.reg[2], 2), '0xDD'); eq('STR little-endian byte 3', hx(st.reg[3], 2), '0xAA');

  // Array sum from Module 3 p.15
  var sum = run('  MOV R3, #0\n  MOV R2, #0\n  LDR R0, =0x20008000\nLoop LDR R1, [R0], #4\n  ADD R2, R2, R1\n  ADD R3, R3, #1\n  CMP R3, #4\n  BLT Loop\nstop B stop',
    { mem: [{ addr: 0x20008000, bytes: [1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0] }] });
  eq('array sum', sum.reg[2], 10); eq('array sum final R3', sum.reg[3], 4);

  // Control flow shapes from Module 3 p.17-19
  var ife = run('  CMP R9, #7\n  MOVEQ R0, R1\n  ADDNE R0, R2, R3\nstop B stop', { regs: { R9: 7, R1: 11, R2: 20, R3: 30 } }); eq('if/else true', ife.reg[0], 11);
  var ifn = run('  CMP R9, #7\n  MOVEQ R0, R1\n  ADDNE R0, R2, R3\nstop B stop', { regs: { R9: 8, R1: 11, R2: 20, R3: 30 } }); eq('if/else false', ifn.reg[0], 50);
  var whl = run('again CMP R0, #50\n  BLE getout\n  ADD R1, R1, R2\n  SUB R0, R0, R1\n  B again\ngetout\nstop B stop', { regs: { R0: 100, R1: 0, R2: 10 } });
  eq('while loop ends with R0', whl.reg[0] | 0, 100 - 10 - 20 - 30); // 100,90,70,40 -> stops when R0<=50
  var absr = run('  CMP R1, #0\n  RSBLT R1, R1, #0\nstop B stop', { regs: { R1: 0xFFFFFFFB } }); eq('abs value via RSBLT', absr.reg[1], 5);
  var chain = run('  CMP R0, R1\n  CMPEQ R2, R3\n  ADDEQ R4, R4, #1\nstop B stop', { regs: { R0: 5, R1: 5, R2: 9, R3: 9, R4: 0 } }); eq('chained compare, both equal', chain.reg[4], 1);
  var chain2 = run('  CMP R0, R1\n  CMPEQ R2, R3\n  ADDEQ R4, R4, #1\nstop B stop', { regs: { R0: 5, R1: 6, R2: 9, R3: 9, R4: 0 } }); eq('chained compare, first differs', chain2.reg[4], 0);
  var cnt = run('  MOV R0, #0\nLOOP ADD R0, R0, #1\n  CMP R0, #10\n  BNE LOOP\nstop B stop'); eq('count loop', cnt.reg[0], 10);
  var fsum = run('  MOV R1, #0\n  MOV R0, #0\nl CMP R0, #10\n  BGE done\n  ADD R1, R1, R0\n  ADD R0, R0, #1\n  B l\ndone\nstop B stop'); eq('for-loop sum 0..9', fsum.reg[1], 45);
  var bl = run('  MOV R0, #5\n  BL double\n  B stop\ndouble ADD R0, R0, R0\n  BX LR\nstop B stop'); eq('BL / BX LR', bl.reg[0], 10);
  var stk = run('  MOV R4, #7\n  MOV R5, #9\n  PUSH {R4, R5}\n  MOV R4, #0\n  MOV R5, #0\n  POP {R4, R5}\nstop B stop'); eq('PUSH/POP R4', stk.reg[4], 7); eq('PUSH/POP R5', stk.reg[5], 9); eq('SP restored', hx(stk.reg[13]), '0x20008000');
  var stm = run('  LDR R0, =0x20008100\n  MOV R1, #1\n  MOV R2, #2\n  STMED R0!, {R1, R2}\nstop B stop');
  // empty descending: the highest register goes AT the base address, the base then drops by 8
  eq('STMED R2 stored at the base address', hx(stm.readN(0x20008100, 4)), '0x00000002');
  eq('STMED R1 stored one word below', hx(stm.readN(0x200080FC, 4)), '0x00000001');
  eq('STMED R0 after', hx(stm.reg[0]), '0x200080F8');
  var ldm = run('  LDR R0, =0x20008000\n  LDMIA R0!, {R1-R3}\nstop B stop', { mem: [{ addr: 0x20008000, bytes: [1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0] }] });
  eq('LDMIA R3', ldm.reg[3], 3); eq('LDMIA writeback', hx(ldm.reg[0]), '0x2000800C');
  var ml = run('  UMULL r0, r1, r2, r3\nstop B stop', { regs: { R2: 0xFFFFFFFF, R3: 0xFFFFFFFF } }); eq('UMULL lo', hx(ml.reg[0]), '0x00000001'); eq('UMULL hi', hx(ml.reg[1]), '0xFFFFFFFE');
  var sml = run('  SMULL r0, r1, r2, r3\nstop B stop', { regs: { R2: 0xFFFFFFFF, R3: 3 } }); eq('SMULL lo', hx(sml.reg[0]), '0xFFFFFFFD'); eq('SMULL hi', hx(sml.reg[1]), '0xFFFFFFFF');
  var mla = run('  MLA r4, r3, r2, r1\nstop B stop', { regs: { R3: 6, R2: 7, R1: 100 } }); eq('MLA', mla.reg[4], 142);
  var dv = run('  UDIV r0, r1, r2\n  SDIV r3, r4, r2\nstop B stop', { regs: { R1: 100, R2: 7, R4: 0xFFFFFF9C } }); eq('UDIV', dv.reg[0], 14); eq('SDIV -100/7', dv.reg[3] | 0, -14);
  var clz = run('  CLZ r0, r1\nstop B stop', { regs: { R1: 0x00010000 } }); eq('CLZ', clz.reg[0], 15);
  var rrx = run('  MOVS r0, r1, RRX\nstop B stop', { regs: { R1: 3 }, flags: { C: 1 } }); eq('RRX result', hx(rrx.reg[0]), '0x80000001'); eq('RRX C', rrx.f.C, 1);

  // data directives and labels
  var dd = run('  ADR R0, nums\n  LDR R1, [R0, #4]\nstop B stop\nnums DCD 10, 20, 30');
  eq('DCD label via ADR', dd.reg[1], 20);

  // assembler error messages that teach
  var e1 = E.assemble('  MOV R0, #0x12345678'); T('unencodable immediate is rejected', !e1.ok && /LDR/.test(e1.errors[0].msg), JSON.stringify(e1.errors));
  var e2 = E.assemble('  MOV R0, 5'); T('missing # is explained', !e2.ok && /#/.test(e2.errors[0].msg), JSON.stringify(e2.errors));
  var e3 = E.assemble('  MUL R0, R1, #3'); T('MUL immediate is explained', !e3.ok && /immediate/.test(e3.errors[0].msg), JSON.stringify(e3.errors));
  var e4 = E.assemble('  ADR R2, #0xAAAA'); T('ADR with # is rejected like the slide error', !e4.ok && /label/.test(e4.errors[0].msg), JSON.stringify(e4.errors));
  var e5 = E.assemble('  B nowhere'); T('unknown label', !e5.ok && /Unknown/.test(e5.errors[0].msg), JSON.stringify(e5.errors));
  var e6 = E.assemble('  MOV R0, #-1'); T('MOV #-1 becomes MVN', e6.ok && e6.program[0].op === 'MVN', JSON.stringify(e6));
  var neg = run('  MOV R0, #-1\n  ADD R1, R0, #-2\nstop B stop'); eq('MOV #-1', hx(neg.reg[0]), '0xFFFFFFFF'); eq('ADD #-2 becomes SUB', hx(neg.reg[1]), '0xFFFFFFFD');

  document.getElementById('summary').innerHTML = '<b>' + pass + ' passed, ' + fail + ' failed</b>';
  window.__results = { pass: pass, fail: fail, failures: failures };
})();
