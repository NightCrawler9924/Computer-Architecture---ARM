/* N, Z, C and V for addition. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  Lab.lesson({
    id: 'm3-flags', title: 'The flags: N, Z, C and V', minutes: 30, source: 'Module 3 page 2 and page 7, Homework 1',
    lede: 'Four bits explain almost every mark in the first homework. N and Z are easy to read off the result. C and V need thought, and they are independent of each other.',
    blocks: [
      { predict: { q: '`0x7FFFFFFF + 1` gives `0x80000000`. What are C and V?', opts: ['C = 0, V = 1', 'C = 1, V = 0', 'C = 1, V = 1', 'C = 0, V = 0'], ans: 0, why: 'Nothing carries out of the 32-bit adder, so C = 0. But two positive numbers gave a negative result, which is impossible as signed arithmetic, so V = 1. You will see why in a moment.' } },
      { h: 'N and Z: read them off the result' },
      { say: '**N** is bit 31 of the result. In hex, a leading digit of 8 to F means N = 1. **Z** is 1 only if every bit is zero, that is, the result is exactly `0x00000000`. Neither needs you to think about signed or unsigned, or to look at the operands.' },
      { warn: 'Zero is not negative. If the result is `0x00000000`, then Z = 1 and N = 0. People routinely set both.' },
      { ask: { q: 'Give N and Z for the result `0x80000000`, written as two digits (N then Z).', a: ['10'], type: 'text', why: 'Leading digit 8 is in the range 8 to F, so N = 1. It is not zero, so Z = 0.' } },
      { ask: { q: 'Give N and Z for the result `0x00000000`, written as two digits (N then Z).', a: ['01'], type: 'text', why: 'Leading 0 so N = 0, and every bit is zero so Z = 1.' } },
      { h: 'C: the unsigned carry' },
      { p: 'Add two 32-bit numbers and the true answer sometimes needs 33 bits. The register keeps 32. The extra bit becomes the carry flag. **C is the 33rd bit of the adder**, kept rather than thrown away.' },
      { widget: { name: 'hexLab', title: 'Where C comes from', opts: { a: 0xFFFFFFFF, b: 1, op: 'ADD' } } },
      { say: 'C is the **unsigned** story, and only the unsigned story. It asks: reading these bits as unsigned, did the result wrap past the maximum? You already know how to find it: it is the carry out of the leftmost column.' },
      { h: 'V: the signed overflow' },
      { p: 'Take `0x40000000 + 0x40000000`. In decimal that is 1,073,741,824 + 1,073,741,824 = 2,147,483,648, and the register holds `0x80000000`. Is that right? **It depends on what you claim the bits mean.** As unsigned, `0x80000000` is 2,147,483,648, which is correct. As signed it is **-2,147,483,648**: you added two positives and got a negative. Same bits, same operation, correct under one reading and broken under the other.' },
      { say: 'That is why there are two overflow flags. **C reports the unsigned failure, V reports the signed failure**, and the hardware computes both every time because it does not know which reading you meant.' },
      { p: '**V = 1 when the sign of the result is impossible.** For addition there are three cases:' },
      { table: { head: ['Operands', 'Result', 'V'], rows: [['positive + positive', 'negative', '1 (impossible)'], ['negative + negative', 'positive', '1 (impossible)'], ['positive + negative', 'anything', '0 always: opposite signs move toward zero and cannot escape the range'] ] } },
      { predict: { q: 'Which pair gives the **identical result** with **opposite C and V**: `0x40000000 + 0x40000000`, and...?', opts: ['`0xC0000000 + 0xC0000000`', '`0x00000001 + 0x7FFFFFFF`', '`0x80000000 + 0x00000001`', '`0xFFFFFFFF + 0x00000001`'], ans: 0, why: 'Both give `0x80000000`. The first is positive + positive: C = 0, V = 1. The second is negative + negative: it carries out so C = 1, and the sign is possible so V = 0. You cannot read C or V off the result. You must look at the operands.' } },
      { widget: { name: 'hexLab', title: 'The pair that teaches everything', opts: { a: 0xC0000000, b: 0xC0000000, op: 'ADD' } } },
      { keep: 'C and V are **independent**. All four combinations happen. For C = 1 and V = 1 together, add `0x80000000 + 0x80000001`: both negative, result positive, and the sum needs 33 bits. Never infer one flag from the other.' },
      { h: 'Your turn' },
      { widget: { name: 'calcCheck', title: 'Solve and check', opts: { title: 'ADDS on two 32-bit numbers', regs: { R0: 0x7DBC1266, R1: 0xEFD41234 }, code: 'ADDS R8, R0, R1', ask: ['R8'] } } },
      { widget: { name: 'calcCheck', opts: { title: 'Another one', regs: { R0: 0x70000000, R1: 0x20000000 }, code: 'ADDS R2, R0, R1', ask: ['R2'] } } },
      { widget: { name: 'calcCheck', opts: { title: 'A tricky one: the answer is zero, yet C is set', regs: { R0: 0x12345678, R1: 0xEDCBA988 }, code: 'ADDS R2, R0, R1', ask: ['R2'] } } },
      { p: 'The third one looks odd at first: the answer is zero, yet C is set. But R1 is exactly the negation of R0, so their sum is 2^32. The register keeps 0 and the 33rd bit becomes C. As signed arithmetic, a number plus its negative is zero, perfectly correct, so V = 0.' },
      { quiz: { id: 'm3-flags', title: 'Check yourself', qs: [
        { kind: 'flags', q: 'Give the result and the flags for `ADDS R8, R0, R1` with R0 = `0x80000000` and R1 = `0x80000000`.', res: 0, resLabel: 'R8 (hex)', expect: { N: 0, Z: 1, C: 1, V: 1 }, why: 'The sum is 2^32 so the register is zero, Z = 1, and the 33rd bit gives C = 1. Both operands are negative and the result is not negative, which is impossible, so V = 1.' },
        { kind: 'flags', q: 'Give the result and the flags for `ADDS R8, R0, R1` with R0 = `0x7FFFFFFF` and R1 = `0x80000000`.', res: 0xFFFFFFFF, resLabel: 'R8 (hex)', expect: { N: 1, Z: 0, C: 0, V: 0 }, why: 'Opposite signs cannot overflow, so V = 0. As signed it is 2,147,483,647 + (-2,147,483,648) = -1 = `0xFFFFFFFF`. Nothing carries out, so C = 0.' },
        { kind: 'mcq', q: 'If the two operands have different signs in an addition, what is V?', opts: ['0, always', '1, always', 'It depends on the result', 'It equals C'], ans: 0, why: 'Opposite signs move the answer toward zero, so it cannot overflow.' },
        { kind: 'mcq', q: 'C is the flag for...', opts: ['Unsigned carry out of the top', 'Signed overflow', 'A negative result', 'A zero result'], ans: 0, why: 'C is the unsigned story. V is the signed one.' } ] } },
      { p: 'Want more? The Practice page generates fresh additions with every case, and the Hex and flags lab accepts any numbers you like.' },
      { html: '<div class="btn-row"><a class="btn btn-primary" href="#/practice/hexadd">Practice flag questions</a><a class="btn" href="#/tool/hexLab">Open the Hex and flags lab</a></div>' }
    ],
    takeaways: ['N is bit 31 of the result. Z means the result is exactly zero. Zero is not negative.', 'C is the carry out of the top (the 33rd bit). It is the unsigned story.', 'V is set when the result sign is impossible: positive + positive giving negative, or negative + negative giving positive.', 'C and V are independent. Always look at the operands, never only the result.']
  });
})(window);
