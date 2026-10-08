/* Number representation: hex, two's complement, subtraction by addition. Built from first principles. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  Lab.lesson({
    id: 'm2-numbers', title: 'Hex and two\'s complement', minutes: 25, source: 'Module 2 and Module 3 (the arithmetic every flag question rests on)',
    lede: 'Every flag question in this course is an arithmetic question underneath. If you can add and negate 32-bit hex numbers calmly, the flags stop being rules to memorise.',
    blocks: [
      { predict: { q: 'Without converting anything: is `0xA3000000` positive or negative as a signed 32-bit number?', opts: ['Positive', 'Negative', 'It depends on the instruction', 'It is zero'], ans: 1, why: 'Look only at the leading hex digit. 0 to 7 means positive, 8 to F means negative. A is in 8 to F, so bit 31 is set and the number is negative.' } },
      { h: 'Hex counts to sixteen before carrying' },
      { p: 'Decimal has ten symbols and carries after 9. Hex has sixteen and carries after **F**. The letters are just digits with unfamiliar faces: A = 10, B = 11, C = 12, D = 13, E = 14, F = 15.' },
      { p: 'The reason we use hex at all: each hex digit is exactly **four bits**, so one digit maps to one nibble with no arithmetic. `0` = 0000, `5` = 0101, `A` = 1010, `F` = 1111.' },
      { say: 'To add two hex digits: add their values. If the total is **16 or more, subtract 16 and carry 1**. That is the whole skill.' },
      { faded: { title: 'Add hex digits', intro: 'Work each one. Remember: 16 or more means subtract 16 and carry.', parts: [
        { text: '`8 + 5 = 13`, which is below 16, so the digit is:' }, { label: 'digit (hex)', ans: ['D', 'd'], type: 'text' },
        { text: '`9 + A` is `9 + 10 = 19`. That is 16 or more, so the digit is `19 - 16 =` ' }, { label: 'digit (hex)', ans: ['3'], type: 'text' },
        { text: '`C + D + 1` (a carry came in) is `12 + 13 + 1 = 26`. The digit is `26 - 16 = 10`, which in hex is:' }, { label: 'digit (hex)', ans: ['A', 'a'], type: 'text' } ],
        why: 'D with no carry, 3 with a carry of 1, and A with a carry of 1.' } },
      { h: 'Adding two 32-bit numbers' },
      { p: 'Work **right to left**, one column at a time, carrying as you go, exactly like decimal long addition. Press Step and watch each column, then try your own numbers.' },
      { widget: { name: 'hexLab', title: 'Column by column', opts: { a: 0x7DBC1266, b: 0xEFD41234, op: 'ADD' } } },
      { p: 'The carry out of the leftmost column has nowhere to go. That final carry is the **C flag**. We needed no special rule to find it: it simply fell out of ordinary addition.' },
      { ask: { q: 'Add `0x6DFF8763 + 0x9876ABCD`. Give the 32-bit result.', a: ['0x06763330', '0x6763330'], type: 'hex', why: 'Working right to left: `3 + D = 16`, so write 0 and carry 1, and so on up to a carry out of the top. The result is `0x06763330` with a carry out of the leftmost column. (This is Homework 1 Problem 1b.)', hint: 'Column 1 is 3 + D = 3 + 13 = 16, so digit 0 and carry 1.' } },
      { warn: 'The usual slip is forgetting the incoming carry in the middle of a long sum. Write each carry down above the next column.' },
      { h: 'Negative numbers' },
      { p: 'Computers store signed numbers in **two\'s complement**. Bit 31 is the sign bit, so the leading-digit rule you just used works at a glance. To **negate** a number, flip every bit and add 1. In hex, flipping a digit means subtracting it from F: 0 becomes F, 1 becomes E, 2 becomes D, and so on. Each pair sums to F, so you only need to learn half the table.' },
      { worked: { title: 'Negate `0x0000000F`', steps: [
        'Write it out: `0 0 0 0 0 0 0 F`.',
        'Flip every digit (F minus the digit): `F F F F F F F 0`.',
        'Add 1: `F F F F F F F 1`. So `-0x0000000F = 0xFFFFFFF1`.',
        'Check: `0x0000000F + 0xFFFFFFF1` should be zero. Each column except the last gives F + 0 or 0 + F plus carries, the whole sum is `0x100000000`, and the 33rd bit falls off, leaving `0x00000000`. It works.' ] } },
      { ask: { q: 'Negate `0x12345678`.', a: ['0xEDCBA988'], type: 'hex', why: 'Flip each digit: 1 to E, 2 to D, 3 to C, 4 to B, 5 to A, 6 to 9, 7 to 8, 8 to 7, giving `EDCBA987`. Add 1: `0xEDCBA988`.', hint: 'Flip every digit, then add 1 at the right.' } },
      { ask: { q: '`0xEFD41234` is negative (leading E). What is its magnitude, as a hex number? In other words, what is it the negative of?', a: ['0x102BEDCC'], type: 'hex', why: 'Negate it: flip the digits to `102BEDCB`, add 1 to get `102BEDCC`. So `0xEFD41234` represents `-0x102BEDCC`.' } },
      { h: 'Subtraction is addition' },
      { say: 'The processor has no subtractor. It has an adder and an inverter. It computes `A - B` as `A + NOT B + 1`. You should do the same, because borrowing across hex digits is error-prone and negating is mechanical.' },
      { widget: { name: 'hexLab', title: 'Subtraction as addition', opts: { a: 0x6DFF8763, b: 0xEFD41234, op: 'SUB' } } },
      { p: 'A quick check on any subtraction: compare the **leading digits as unsigned numbers**. If the first number is smaller, a borrow was needed, so there will be **no** carry out of the top. Here the leading digits are 6 and E, 6 is smaller, so no carry out. That agrees with the full calculation.' },
      { ask: { q: 'Compute `0x9876ABCD - 0x6DFF8763`.', a: ['0x2A77246A'], type: 'hex', why: 'Flip `6DFF8763` to `9200789C` and add the carry-in 1 along with `9876ABCD`. The result is `0x2A77246A`, with a carry out of the top (leading digits 9 against 6: the first is larger, so no borrow, so a carry out). This is Homework 1 Problem 1d.' } },
      { quiz: { id: 'm2-numbers', title: 'Check yourself', qs: [
        { kind: 'input', type: 'hex', q: 'Add `0x00000FFF + 0x00000001`.', a: ['0x00001000', '0x1000'], why: 'F + 1 = 16, so digit 0 carry 1, and the carry ripples through every F: `0x00001000`.' },
        { kind: 'input', type: 'hex', q: 'What is `-1` as a 32-bit hex number?', a: ['0xFFFFFFFF'], why: 'Negate `0x00000001`: flip to `FFFFFFFE`, add 1 to get `FFFFFFFF`.' },
        { kind: 'mcq', q: 'Which statement about `A - B` is true for the processor?', opts: ['It computes A + NOT B + 1', 'It uses a dedicated subtractor', 'It computes B - A and negates it', 'It subtracts digit by digit with borrows'], ans: 0, why: 'There is one adder. Subtraction is addition of the complement plus 1.' },
        { kind: 'mcq', q: 'What does a carry out of the leftmost column of an addition become?', opts: ['The C flag', 'The N flag', 'The V flag', 'It is lost and has no effect'], ans: 0, why: 'It is literally the 33rd bit of the adder, kept as the carry flag.' } ] } }
    ],
    takeaways: ['A hex digit is 4 bits. Add values and subtract 16 with a carry whenever you reach 16.', 'Leading hex digit 0 to 7 is positive and 8 to F is negative.', 'Negate by flipping every digit (F minus the digit) and adding 1.', 'A - B is computed as A + NOT B + 1. The carry out of the top is the C flag.']
  });
})(window);
