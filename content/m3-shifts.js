/* The barrel shifter and multiplication. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  Lab.lesson({
    id: 'm3-shifts', title: 'Shifts, the barrel shifter and multiplication', minutes: 24, source: 'Module 3 Part 2, Handout 03, Homework 1',
    lede: 'ARM can shift an operand and do arithmetic in a single instruction. That makes multiplying by a constant cheap, and it makes shifts a favourite exam topic.',
    blocks: [
      { predict: { q: 'Why is `LSR #2` the wrong instruction to divide `0xFFFFFFF8` (which is -8) by 4?', opts: ['LSR brings in zeros at the top, giving a huge positive number', 'LSR cannot shift by 2', 'LSR rotates instead of shifting', 'It gives -2, which is correct'], ans: 0, why: '`0xFFFFFFF8 LSR #2` is `0x3FFFFFFE`. Signed division needs `ASR`, which copies the sign bit in and gives `0xFFFFFFFE` = -2.' } },
      { h: 'The five shifts' },
      { table: { head: ['Shift', 'What enters', 'What C becomes', 'Arithmetic meaning'], rows: [
        ['`LSL #n`', 'Zeros at the bottom', 'Last bit pushed off the top', 'x 2^n'], ['`LSR #n`', 'Zeros at the top', 'Last bit pushed off the bottom', 'unsigned / 2^n'], ['`ASR #n`', 'Copies of the sign bit', 'Last bit pushed off the bottom', 'signed / 2^n'],
        ['`ROR #n`', 'The bits that fell off the bottom', 'The new bit 31', 'nothing is lost'], ['`RRX`', 'The old C enters at the top', 'Bit 0 becomes C', 'rotate right 1 through C'] ] } },
      { widget: { name: 'shifter', title: 'Shift and rotate 32 bits' } },
      { p: 'There is a rotate right but no rotate left, because a rotate left by n is the same as a rotate right by 32 - n. `ASL` is just another name for `LSL`. LSL can shift by 0 to 31 places, and LSR, ASR and ROR by 0 to 32. Shifting by 0 is the same as not shifting.' },
      { h: 'Where the flags come from with MOVS' },
      { say: 'With `MOVS Rd, Rm, shift`: **N and Z** come from the **result**, **C** comes from the **shifter** (the last bit shifted out), and **V is preserved**, left exactly as it was. A move has nothing meaningful to say about signed overflow.' },
      { widget: { name: 'calcCheck', title: 'Homework 1 Problem 2(b): rotate', opts: { regs: { R1: 0xEFFD34A4 }, code: 'MOVS R8, R1, ROR #3', ask: ['R8'] } } },
      { widget: { name: 'calcCheck', title: 'Homework 1 Problem 2(e): shift right 4', opts: { regs: { R2: 0x9876543D }, code: 'MOVS R8, R2, LSR #4', ask: ['R8'] } } },
      { tip: 'A shift by a multiple of 4 moves whole hex digits. `LSR #4` drops the bottom digit and brings a 0 in at the top. `ROR #4` moves the bottom digit round to the top. That makes several homework parts almost instant.' },
      { h: 'A shift inside the instruction' },
      { p: 'The second operand can be shifted before the ALU uses it, in the same single instruction and the same single cycle:' },
      { sim: { title: 'ADD with a built-in shift', code: '  MOV r0, #7\n  ADD r1, r0, r0, LSL #3   ; r1 = r0 + (r0 << 3) = 9 x r0\nstop B stop' } },
      { slide: 'Module 3 page 9 writes `ADD r3, r2, r1, LS #3`. It should be `LSL #3`.' },
      { h: 'Multiplication' },
      { p: '`MUL r4, r3, r2` puts the low 32 bits of r3 x r2 in r4. `MLA r4, r3, r2, r1` adds r1. The slides say: no immediate operand, and the result register must not be the same as the first source. (That restriction applies to ARMv5 and earlier and was removed in ARMv6, but use the slides\' rule in the exam.) With `S`, V is preserved and C is meaningless.' },
      { p: 'Long multiplies keep all 64 bits across two registers, in the order low, high, first source, second source: `UMULL r0, r1, r2, r3` gives r1:r0 = r2 x r3 (unsigned). `SMULL` is signed. `UMLAL` and `SMLAL` also add the existing r1:r0.' },
      { h: 'Multiplying by a constant with shifts' },
      { p: 'A `MUL` is slower than a couple of adds, so constant multiplications become shifts. To multiply r0 by 35: factor it, 35 = 5 x 7, and write 5 = 4 + 1 and 7 = 8 - 1.' },
      { sim: { title: 'Multiply by 35', code: '  MOV r0, #3\n  ADD r0, r0, r0, LSL #2   ; 5 x r0\n  RSB r0, r0, r0, LSL #3   ; 8 x (5 r0) - 5 r0 = 35 x r0\nstop B stop' } },
      { slide: 'Module 3 page 10 writes `RSB, r0, r0, r0, LSL #3` with a stray comma after RSB. It should be `RSB r0, r0, r0, LSL #3`.' },
      { reveal: { q: 'Multiply R0 by 10 using only shifts and adds.', rows: 3, answer: '10 = 2 x 5 and 5 = 4 + 1:<pre><code>ADD R0, R0, R0, LSL #2   ; R0 = 5 x R0\nMOV R0, R0, LSL #1       ; R0 = 10 x R0</code></pre>Two instructions and two cycles, against a `MUL` that needs several cycles and a register to hold the constant 10.' } },
      { quiz: { id: 'm3-shifts', title: 'Check yourself', qs: [
        { kind: 'multi', q: 'After `MOVS R8, R1, LSL #2` with R1 = `0xEFFD34A4`, give R8 and C.', fields: [{ label: 'R8 (hex)', a: ['0xBFF4D290'], type: 'hex' }, { label: 'C', a: ['1'], type: 'num' }], why: 'Shifting left by 2 moves everything up two places: `0xBFF4D290`. The last bit pushed off the top was bit 30 of R1, which is 1, so C = 1.' },
        { kind: 'mcq', q: 'Which shift divides a signed number by 2^n?', opts: ['ASR', 'LSR', 'LSL', 'ROR'], ans: 0, why: 'ASR keeps the sign.' },
        { kind: 'mcq', q: 'What does MOVS leave unchanged?', opts: ['V', 'N', 'Z', 'C when a shift happens'], ans: 0, why: 'V is preserved by moves and logical operations.' } ] } }
    ],
    takeaways: ['LSL x 2^n, LSR unsigned / 2^n, ASR signed / 2^n, ROR wraps, RRX goes through C.', 'MOVS: N and Z from the result, C from the shifter, V unchanged.', 'ARM combines a shift and an ALU operation in one instruction, so multiply by a constant with shifts and adds.', 'LSR on a negative number is a bug. Use ASR.']
  });
})(window);
