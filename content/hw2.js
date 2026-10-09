/* Homework 2: questions only. The checkers say what is right or wrong and explain the method.
   They never show an answer, a solution or an expected value. Expected values come from the small
   reference functions below and are only ever compared, never displayed. */
(function (g) {
  'use strict';
  var Lab = g.Lab;
  var u = function (x) { return x >>> 0; };

  /* reference behaviour, written as plain JavaScript (not as assembly) */
  function sumSeries() { var s = 0; for (var v = 100; v <= 7072; v += 7) s = u(s + v); return s; }
  function p3(r8, r5, r6) { return (r8 & 1) === 0 ? u(16 * (r5 | 0) + 800) : u(r6 * (r6 + 1) / 2); }
  function p4(r6, r8) { return (r8 | 0) <= (r6 | 0) ? u(-(r6 | 0)) : u(Math.min(r6 | 0, r8 | 0)); }
  function pop(x) { x = u(x); var c = 0; while (x) { c += x & 1; x = x >>> 1; } return c; }
  function p9() { var r5 = 0, r3 = 0xAA00, r0 = 70, r1 = 21; while (r0 > r1) { r5 = u(u(r5 + r3) << 2); r1 += 3; } return { r5: r5, r1: r1 }; }
  function matmul(A, Bcols) { var C = []; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) { var s = 0; for (var k = 0; k < 3; k++) s += (A[3 * i + k] | 0) * (Bcols[3 * j + k] | 0); C.push(u(s)); } return C; }
  var junk = { R0: 0x5A5A5A5A, R1: 0x13579BDF, R2: 0x2468ACE0, R4: 0x0F0F0F0F, R5: 0x11111111, R6: 0x22222222, R7: 0x33333333, R9: 0x44444444, R10: 0x55555555, R11: 0x66666666, R12: 0x77777777 };
  function withJunk(over, skip) { var r = {}; Object.keys(junk).forEach(function (k) { if (!skip || skip.indexOf(k) < 0) r[k] = junk[k]; }); Object.keys(over || {}).forEach(function (k) { r[k] = over[k]; }); return r; }

  var MEM = [{ addr: 4, bytes: [0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0xAB, 0xAC, 0xAD, 0xAE, 0xAF, 0xB0] }];
  function part(label, code, explain) {
    return { widget: { name: 'calcCheck', opts: { title: label, regs: { R1: 4, R2: 2 }, mem: MEM, code: code, ask: ['R0', 'R1', 'R2'], askFlags: false, reveal: false, explain: explain } } };
  }

  var A1 = [1, 2, 3, 4, 5, 6, 7, 8, 9], B1 = [9, 6, 3, 8, 5, 2, 7, 4, 1];
  var Id = [1, 0, 0, 0, 1, 0, 0, 0, 1], An = [2, u(-1), 0, 5, 3, u(-4), 1, 1, 1], Bn = [3, 0, u(-2), u(-1), 4, 1, 2, 2, 0];
  function wordsData(label, arr) { return label + ' DCD ' + arr.join(', '); }

  Lab.lesson({
    id: 'hw2', title: 'Homework 2: practice and checking', minutes: 60, source: 'Homework 2',
    lede: 'Ten problems on loads and stores, loops and bit tricks. Quiz 2 on October 16 uses a similar set. This page has the questions and checks your work. It does not give the answers.',
    blocks: [
      { say: 'The checkers tell you whether you are right and explain the method behind each question. They never show the answer or a solution, so the thinking stays yours. For the programs, you write the assembly and the checker runs it against several hidden test inputs.' },
      { p: 'The homework says: show all your work, give registers in hexadecimal, treat numbers as signed, comment every instruction, and verify your code in VisUAL. The simulator on this site does the same job as VisUAL, and "Debug in the simulator" opens your program with the first test input.' },
      { h: 'Problem 1: loads and addressing modes' },
      { p: 'R1 = `0x00000004` and R2 = `0x00000002` at the start of **each** part, so treat the parts as independent. Memory is little-endian and holds these bytes (the sheet lists them from the top, address `0x0F`, down to `0x04`):' },
      { table: { head: ['Address', '04', '05', '06', '07', '08', '09', '0A', '0B', '0C', '0D', '0E', '0F'], rows: [['Contents', 'AA', 'BB', 'CC', 'DD', 'EE', 'FF', 'AB', 'AC', 'AD', 'AE', 'AF', 'B0']] } },
      { p: 'Give R0, R1 and R2 after each instruction, in hexadecimal.' },
      part('(a) LDR R0, [R1]', 'LDR R0, [R1]', 'This is a plain register-indirect load: the address is the value held in R1, and neither R1 nor R2 changes. LDR reads four bytes starting at that address. ARM is little-endian, so the byte at the lowest address becomes the least significant byte of R0. A word address must be divisible by 4.'),
      part('(b) LDRB R0, [R1, #4]', 'LDRB R0, [R1, #4]', 'The offset is added to R1 to form the address, but R1 itself is not updated because there is no ! and no offset after the brackets. LDRB loads a single byte and zero-extends it, so the top 24 bits of R0 are zero.'),
      part('(c) LDRH R0, [R1, R2]', 'LDRH R0, [R1, R2]', 'The offset is a register, so the address is R1 plus R2, with no shift. LDRH loads two bytes, little-endian, and zero-extends them. R1 and R2 stay as they were. A halfword address must be even, so check yours is.'),
      part('(d) LDRB R0, [R1, R2, LSL #2]', 'LDRB R0, [R1, R2, LSL #2]', 'R2 is shifted left by 2 places first (multiplied by 4), and that result is added to R1 to get the address. Only the offset is shifted. R2 itself is unchanged, and R1 is not written back. One byte, zero-extended.'),
      part('(e) LDR R0, [R1, R2, LSL #2]!', 'LDR R0, [R1, R2, LSL #2]!', 'The address is built the same way as in part (d), but now it loads a whole word and the ! writes the computed address back into R1. R2 does not change. Read the four bytes at that address from the highest address down to get the little-endian value.'),
      part('(f) LDR R0, [R1], #2', 'LDR R0, [R1], #2', 'The offset sits outside the brackets, which makes this post-indexed: the load uses R1 as it is now, and only afterwards is 2 added to R1. So R0 comes from the original address and R1 ends up changed.'),
      part('(g) LDR R0, [R1], R2, LSL #1', 'LDR R0, [R1], R2, LSL #1', 'Also post-indexed. The load uses the current R1. Afterwards R1 becomes R1 plus R2 shifted left by 1 place. R2 itself is not modified. The word load is little-endian.'),
      { h: 'Problem 2: a sum' },
      { p: 'Write a program that leaves **R3 = 100 + 107 + 114 + ... + 7072**.' },
      { widget: { name: 'asmChallenge', opts: { id: 'hw2-p2', title: 'Problem 2', rows: 10,
        note: 'The other registers start with junk values, so set up anything you rely on.',
        hints: ['Look at the pattern: each term is the previous one plus the same step. How many terms are there? (last - first) / step + 1.', 'A loop that adds a term, steps the term, and compares against the last value does it. Decide whether the compare is "less than or equal" or "less than".', 'If your total is off, check the first and last terms. Off-by-one errors in the loop bound are the usual cause.'],
        tests: [{ label: 'Fresh start', regs: withJunk({}), expect: { regs: { R3: sumSeries() } } }, { label: 'R3 holds junk at the start', regs: withJunk({ R3: 0xDEADBEEF }), expect: { regs: { R3: sumSeries() } } }] } } },
      { h: 'Problem 3: odd or even' },
      { p: 'Set R1 to **16 x R5 + 800** if R8 is even, otherwise to **1 + 2 + 3 + ... + R6**.' },
      { widget: { name: 'asmChallenge', opts: { id: 'hw2-p3', title: 'Problem 3', rows: 12,
        note: 'R5 is signed. R6 is a small positive number when R8 is odd.',
        hints: ['Whether a number is even depends only on bit 0. Which instruction tests a bit without changing the register?', 'For the second case you need a loop that adds 1, then 2, then 3, up to R6. A counter register and an accumulator register do it.', '16 x R5 is a shift. How many places is that?'],
        tests: [{ label: 'R8 even', regs: withJunk({ R8: 10, R5: 7, R6: 3 }), expect: { regs: { R1: p3(10, 7, 3) } } }, { label: 'R8 odd', regs: withJunk({ R8: 11, R5: 7, R6: 10 }), expect: { regs: { R1: p3(11, 7, 10) } } }, { label: 'R8 zero (even)', regs: withJunk({ R8: 0, R5: 0, R6: 4 }), expect: { regs: { R1: p3(0, 0, 4) } } }, { label: 'R8 odd, R6 = 1', regs: withJunk({ R8: 7, R5: 2, R6: 1 }), expect: { regs: { R1: p3(7, 2, 1) } } }, { label: 'R8 negative and even, R5 negative', regs: withJunk({ R8: u(-2), R5: u(-3), R6: 5 }), expect: { regs: { R1: p3(u(-2), u(-3), 5) } } }, { label: 'R8 odd, R6 = 100', regs: withJunk({ R8: 1, R5: 9, R6: 100 }), expect: { regs: { R1: p3(1, 9, 100) } } }] } } },
      { h: 'Problem 4: negate or pick the smaller' },
      { p: 'Set R4 to the **2\'s complement of R6** if R8 <= R6, otherwise to the **smaller of R6 and R8**. Treat the numbers as signed.' },
      { widget: { name: 'asmChallenge', opts: { id: 'hw2-p4', title: 'Problem 4', rows: 10,
        hints: ['A signed comparison needs a signed condition. Which of GT, GE, LT, LE, HI, HS, LO, LS are the signed ones?', 'The 2\'s complement of a number is 0 minus the number. Which instruction subtracts with the operands reversed?', 'In the second case, think about which of the two is smaller once you know R8 is greater than R6.'],
        tests: [{ label: 'R8 below R6', regs: withJunk({ R6: 5, R8: 3 }), expect: { regs: { R4: p4(5, 3) } } }, { label: 'R8 equals R6', regs: withJunk({ R6: 5, R8: 5 }), expect: { regs: { R4: p4(5, 5) } } }, { label: 'R8 above R6', regs: withJunk({ R6: 3, R8: 9 }), expect: { regs: { R4: p4(3, 9) } } }, { label: 'Negative R6, R8 below it', regs: withJunk({ R6: u(-4), R8: u(-10) }), expect: { regs: { R4: p4(u(-4), u(-10)) } } }, { label: 'Negative values, R8 above R6', regs: withJunk({ R6: u(-10), R8: u(-4) }), expect: { regs: { R4: p4(u(-10), u(-4)) } } }, { label: 'Both zero', regs: withJunk({ R6: 0, R8: 0 }), expect: { regs: { R4: p4(0, 0) } } }] } } },
      { h: 'Problem 5: compare two bits' },
      { p: 'Check bit 0 and bit 11 of R0. If they are the same, set **R8 = R4 >> 2**. Otherwise clear the least two bytes of R0.' },
      { widget: { name: 'asmChallenge', opts: { id: 'hw2-p5', title: 'Problem 5', rows: 12,
        note: 'The tests use positive R4 values, so a logical or arithmetic shift both pass.',
        hints: ['Isolate each bit with a shift and a mask, or test them one at a time with TST. You need to compare two single-bit results.', 'Two bits are the same when their XOR is 0.', '"Clear the least two bytes" means the low 16 bits. BIC with a 16-bit mask, or a shift pair, does it.'],
        tests: [{ label: 'Both bits set', regs: withJunk({ R0: 0x00000801, R4: 0x40 }), expect: { regs: { R8: 0x10 } } }, { label: 'Both bits clear', regs: withJunk({ R0: 0x12340000, R4: 0x1000 }), expect: { regs: { R8: 0x400 } } }, { label: 'Bit 0 set, bit 11 clear', regs: withJunk({ R0: 0x12340001, R4: 0x80 }), expect: { regs: { R0: 0x12340000 } } }, { label: 'Bit 0 clear, bit 11 set', regs: withJunk({ R0: 0xABCD0800, R4: 0x80 }), expect: { regs: { R0: 0xABCD0000 } } }, { label: 'Bits 1 to 10 set, bits 0 and 11 clear', regs: withJunk({ R0: 0x000007FE, R4: 0x20 }), expect: { regs: { R8: 0x8 } } }] } } },
      { h: 'Problem 6: count the ones' },
      { p: 'Write a program that finds the number of 1s in R3. The question does not say where to put the count, so pick the register below.' },
      { widget: { name: 'asmChallenge', opts: { id: 'hw2-p6', title: 'Problem 6', rows: 12, resultChoice: true, resultDefault: 'R0',
        hints: ['Look at one bit at a time. A shift moves the next bit into a position you can test.', 'The carry flag is a useful place to catch the bit that falls off a shift.', 'A loop that runs 32 times works. A loop that stops as soon as the register is zero is faster.'],
        tests: [{ label: 'All zeros', regs: withJunk({ R3: 0 }, ['R0']), expect: { regs: { RESULT: 0 } } }, { label: 'All ones', regs: withJunk({ R3: 0xFFFFFFFF }, ['R0']), expect: { regs: { RESULT: 32 } } }, { label: 'Top and bottom bits', regs: withJunk({ R3: 0x80000001 }, ['R0']), expect: { regs: { RESULT: 2 } } }, { label: 'A mixed pattern', regs: withJunk({ R3: 0x12345678 }, ['R0']), expect: { regs: { RESULT: pop(0x12345678) } } }, { label: 'Alternating nibbles', regs: withJunk({ R3: 0xF0F0F0F0 }, ['R0']), expect: { regs: { RESULT: 16 } } }, { label: 'A single bit', regs: withJunk({ R3: 0x00010000 }, ['R0']), expect: { regs: { RESULT: 1 } } }] } } },
      { h: 'Problem 7: an average' },
      { p: 'Find the average of an array of 8 numbers and put it in **R10**. The array is at the label `array_1`.' },
      { widget: { name: 'asmChallenge', opts: { id: 'hw2-p7', title: 'Problem 7', rows: 12,
        note: 'The checker supplies the label `array_1`. Do not define it yourself.',
        hints: ['Put the address of the array in a register with ADR, then step through it with a post-indexed load.', 'Add the eight words into one register, then divide. Dividing by 8 is a shift.', 'The numbers are signed, so a shift that keeps the sign is the right one.'],
        tests: [{ label: 'Eight equal numbers', regs: withJunk({}), data: wordsData('array_1', [5, 5, 5, 5, 5, 5, 5, 5]), expect: { regs: { R10: 5 } } }, { label: 'One to eight (sum not a multiple of 8)', regs: withJunk({}), data: wordsData('array_1', [1, 2, 3, 4, 5, 6, 7, 8]), expect: { regs: { R10: 4 } } }, { label: 'Tens', regs: withJunk({}), data: wordsData('array_1', [10, 20, 30, 40, 50, 60, 70, 80]), expect: { regs: { R10: 45 } } }, { label: 'Mixed signs, average zero', regs: withJunk({}), data: wordsData('array_1', [u(-16), 16, u(-16), 16, u(-16), 16, u(-16), 16]), expect: { regs: { R10: 0 } } }, { label: 'All negative', regs: withJunk({}), data: wordsData('array_1', [u(-8), u(-8), u(-8), u(-8), u(-8), u(-8), u(-8), u(-8)]), expect: { regs: { R10: u(-8) } } }] } } },
      { h: 'Problem 8: leading zeros' },
      { p: 'Count the leading zeros in the binary form of R0. For example, `0001 0110 1...10` has 3. The question does not say where the count goes, so pick the register below.' },
      { widget: { name: 'asmChallenge', opts: { id: 'hw2-p8', title: 'Problem 8', rows: 12, resultChoice: true, resultDefault: 'R1',
        hints: ['Shift left one place at a time and watch for the first 1 to reach bit 31. How can you tell?', 'Remember the special case where R0 is all zeros. How many leading zeros is that?', 'There is a single instruction that does this directly. The homework does not forbid it, but a loop is good practice for the quiz.'],
        tests: [{ label: 'The worked example from the sheet', regs: withJunk({ R0: 0x16800002 }, ['R1']), expect: { regs: { RESULT: 3 } } }, { label: 'Top bit set', regs: withJunk({ R0: 0x80000000 }, ['R1']), expect: { regs: { RESULT: 0 } } }, { label: 'Only the lowest bit', regs: withJunk({ R0: 0x00000001 }, ['R1']), expect: { regs: { RESULT: 31 } } }, { label: 'All zeros', regs: withJunk({ R0: 0 }, ['R1']), expect: { regs: { RESULT: 32 } } }, { label: 'Sixteen zeros', regs: withJunk({ R0: 0x0000FFFF }, ['R1']), expect: { regs: { RESULT: 16 } } }, { label: 'Eight zeros', regs: withJunk({ R0: 0x00F00000 }, ['R1']), expect: { regs: { RESULT: 8 } } }] } } },
      { h: 'Problem 9: translate a loop' },
      { p: 'Implement this pseudo-code. After it finishes, the checker looks at R5 and R1.' },
      { code: 'R5 = 0\nR3 = 0x0000AA00\nR0 = 70\nR1 = 21\nwhile R0 > R1 do\n    R5 = (R5 + R3) << 2\n    R1 = R1 + 3\nend while', run: false },
      { widget: { name: 'asmChallenge', opts: { id: 'hw2-p9', title: 'Problem 9', rows: 14,
        note: 'The registers start with junk, so your program must do the four assignments itself.',
        hints: ['Set the four starting values first. Then the loop test comes before the body, so leave the loop on the opposite condition.', 'Inside the body, the add and the shift can be one instruction using the barrel shifter, or two separate ones.', 'The value in R5 grows by a factor of 4 every pass, so it will wrap around 32 bits. That is expected.'],
        tests: [{ label: 'The values from the sheet', regs: withJunk({ R3: 7, R0: 99, R1: 3, R5: 0x12345678 }), expect: { regs: { R5: p9().r5, R1: p9().r1 } } }] } } },
      { h: 'Problem 10: matrix multiply (challenge)' },
      { p: 'Compute **C = A x B** for 3 x 3 matrices. A is stored row by row at `rows_A`. B is stored column by column at `columns_B`. Store C row by row at `mat_C`.' },
      { widget: { name: 'asmChallenge', opts: { id: 'hw2-p10', title: 'Problem 10', rows: 20,
        note: 'The checker supplies the labels `rows_A`, `columns_B` and `mat_C`. Do not define them yourself.',
        hints: ['Element C[i][j] is the dot product of row i of A and column j of B. Because B is stored by columns, both of those are three consecutive words.', 'You need three nested loops, or one loop over the nine outputs with an inner loop of three multiply-accumulates. MLA multiplies and adds in one instruction.', 'Keep a pointer for the start of the current row of A, a pointer for the start of the current column of B, and a pointer for where C[i][j] goes. Move each by 12 bytes (3 words) when you change rows or columns.'],
        tests: [{ label: 'Sequential A, reversed B', regs: withJunk({}), data: wordsData('rows_A', A1) + '\n' + wordsData('columns_B', B1) + '\nmat_C SPACE 36', expect: { mem: { label: 'mat_C', words: matmul(A1, B1) } } }, { label: 'B is the identity', regs: withJunk({}), data: wordsData('rows_A', A1) + '\n' + wordsData('columns_B', Id) + '\nmat_C SPACE 36', expect: { mem: { label: 'mat_C', words: matmul(A1, Id) } } }, { label: 'Negative entries', regs: withJunk({}), data: wordsData('rows_A', An) + '\n' + wordsData('columns_B', Bn) + '\nmat_C SPACE 36', expect: { mem: { label: 'mat_C', words: matmul(An, Bn) } } }] } } },
      { keep: 'These answers are for you to find. When the instructor releases the solutions, compare your programs with them, and keep the comments on every instruction. The quiz asks for the same habits.' }
    ],
    takeaways: ['Pre-index: [R1, offset]. Post-index: [R1], offset. Write-back: [R1, offset]!', 'Only a shifted register offset is shifted. The base register is not.', 'Signed comparisons need signed conditions (GT, GE, LT, LE).', 'Comment every instruction. It is part of the homework and part of how you catch your own mistakes.']
  });
})(window);
