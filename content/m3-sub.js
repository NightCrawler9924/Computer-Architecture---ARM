/* Subtraction, C as NOT borrow, and signed versus unsigned comparison. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  Lab.lesson({
    id: 'm3-sub', title: 'Subtraction, and why C means "no borrow"', minutes: 22, source: 'Module 3, Homework 1 Problem 1',
    lede: 'Where most marks die. On ARM, subtraction sets C the opposite way to x86, but it is not a separate rule: it falls out of how the adder works.',
    blocks: [
      { predict: { q: '`SUBS R0, R1, R2` with R1 = 3 and R2 = 5. What is C on ARM?', opts: ['0', '1', 'Unchanged', 'It depends on V'], ans: 0, why: 'ARM sets C = NOT borrow. 3 - 5 needs a borrow, so C = 0. On x86 the carry flag IS the borrow, so it would be 1 there. Using the x86 convention is the most common mistake on this material.' } },
      { h: 'Where it comes from' },
      { say: 'The processor computes `A - B` as `A + NOT B + 1`, and **C is the ordinary carry out of that addition**. Nothing special happens.' },
      { table: { head: ['Unsigned comparison', 'Borrow needed?', 'Adder carries out?', 'C'], rows: [['A is greater than or equal to B', 'No', 'Yes', '1'], ['A is less than B', 'Yes', 'No', '0'] ] } },
      { p: 'So after `CMP A, B`, **C = 1 means A is greater than or equal to B, unsigned**. That is exactly why the condition `HS` (unsigned higher or same) tests C = 1. The condition codes simply read whatever the subtraction naturally produced.' },
      { widget: { name: 'hexLab', title: 'Watch the carry in a subtraction', opts: { a: 3, b: 5, op: 'SUB' } } },
      { h: 'V for subtraction flips the sign rule' },
      { table: { head: ['Operands', 'Result', 'V'], rows: [['positive - negative', 'negative', '1 (impossible)'], ['negative - positive', 'positive', '1 (impossible)'], ['same sign', 'anything', '0 always'] ] } },
      { p: 'Compare with addition, where **same** signs were the dangerous case. For subtraction it is **different** signs, because you negated the second operand. Notice the mirroring rather than memorising two unrelated lists.' },
      { keep: 'A two-second check on any subtraction: compare the leading digits as unsigned. If A\'s is smaller, a borrow happened, so C = 0. Always do this before trusting your flags.' },
      { h: 'Your turn: Homework 1, Problem 1(c) and 1(d)' },
      { widget: { name: 'calcCheck', title: 'Problem 1(c)', opts: { regs: { R1: 0xEFD41234, R2: 0x6DFF8763 }, code: 'SUBS R8, R2, R1', ask: ['R8'] } } },
      { widget: { name: 'calcCheck', title: 'Problem 1(d): both C and V end up set', opts: { regs: { R2: 0x6DFF8763, R3: 0x9876ABCD }, code: 'SUBS R9, R3, R2', ask: ['R9'] } } },
      { h: 'Signed and unsigned comparisons disagree' },
      { p: 'Suppose `CMP R0, R1` with R0 = `0xFFFFFFFF` and R1 = `1`. The subtraction gives `0xFFFFFFFE` with C = 1 (no borrow), N = 1, V = 0. Ask two questions about the same bits: is R0 **unsigned-higher**? `HI` needs C = 1 and Z = 0, so yes: 4,294,967,295 really is greater than 1. Is R0 **signed-greater**? `GT` needs Z = 0 and N = V, but N = 1 and V = 0, so no: -1 is not greater than 1. Same bits, same instruction, opposite answers.' },
      { widget: { name: 'condExplorer', title: 'Compare two numbers', opts: { tab: 'cmp', a: 0xFFFFFFFF, b: 1 } } },
      { quiz: { id: 'm3-sub', title: 'Check yourself', qs: [
        { kind: 'flags', q: 'Give the result and flags for `SUBS R8, R0, R1` with R0 = 5 and R1 = 3.', res: 2, resLabel: 'R8 (hex)', expect: { N: 0, Z: 0, C: 1, V: 0 }, why: '5 - 3 = 2. No borrow so C = 1. Same-sign operands cannot overflow, so V = 0.' },
        { kind: 'flags', q: 'Give the result and flags for `SUBS R8, R0, R1` with R0 = `0x1234` and R1 = `0x1234`.', res: 0, resLabel: 'R8 (hex)', expect: { N: 0, Z: 1, C: 1, V: 0 }, why: 'Equal numbers give zero. No borrow was needed, so C = 1, which is why HS is true for equal values.' },
        { kind: 'mcq', q: 'After CMP, C = 1 means...', opts: ['The first operand is greater than or equal to the second, unsigned', 'The first operand is less than the second', 'There was signed overflow', 'The operands are equal'], ans: 0, why: 'C = NOT borrow.' },
        { kind: 'mcq', q: 'Which pair of conditions test signed comparisons?', opts: ['GT, GE, LT, LE', 'HI, HS, LO, LS', 'EQ, NE', 'MI, PL'], ans: 0, why: 'Signed comparisons read N against V. Unsigned ones read C and Z.' } ] } }
    ],
    takeaways: ['On ARM, subtraction gives C = NOT borrow: C = 1 means A is at least B, unsigned.', 'It is just the carry out of A + NOT B + 1.', 'V for subtraction: different-sign operands are the dangerous case.', 'Signed and unsigned comparisons can disagree, which is why there are two families of conditions.']
  });
})(window);
