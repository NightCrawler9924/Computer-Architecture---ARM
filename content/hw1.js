/* Homework 1, solved step by step, with every answer verified by the simulator. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  Lab.lesson({
    id: 'hw1', title: 'Homework 1, worked and checked', minutes: 45, source: 'Homework 1',
    lede: 'All four problems. Do each yourself first. The checker runs your answer through the simulator, and after a miss it shows the column-by-column working.',
    blocks: [
      { p: 'The homework says: show all work, give results in hexadecimal, numbers are signed unless stated, and you may use VisUAL to verify. The "Open in simulator" button on each problem does the same job here.' },
      { slide: 'The homework writes the flag set as CNZV in Problem 1 and CVZN in Problems 2 and 3. This site always writes **N Z C V**. The values are the same. Reorder them to match whatever the question asks.' },
      { h: 'Problem 1: add, subtract, shift and OR' },
      { p: 'R0 = `0x7DBC1266`, R1 = `0xEFD41234`, R2 = `0x6DFF8763`, R3 = `0x9876ABCD`. Give each answer and the status of the flags, assuming each operation affects them.' },
      { widget: { name: 'calcCheck', title: '(a) R6 = R0 + R1', opts: { regs: { R0: 0x7DBC1266, R1: 0xEFD41234 }, code: 'ADDS R6, R0, R1', ask: ['R6'] } } },
      { widget: { name: 'calcCheck', title: '(b) R7 = R2 + R3', opts: { regs: { R2: 0x6DFF8763, R3: 0x9876ABCD }, code: 'ADDS R7, R2, R3', ask: ['R7'] } } },
      { widget: { name: 'calcCheck', title: '(c) R8 = R2 - R1', opts: { regs: { R1: 0xEFD41234, R2: 0x6DFF8763 }, code: 'SUBS R8, R2, R1', ask: ['R8'] } } },
      { widget: { name: 'calcCheck', title: '(d) R9 = R3 - R2', opts: { regs: { R2: 0x6DFF8763, R3: 0x9876ABCD }, code: 'SUBS R9, R3, R2', ask: ['R9'] } } },
      { p: '**(e)** R10 = (R2 shifted right by 2 bits) ORed with (R3 shifted left by 3 bits). This is two shifts and an OR. Because the homework does not say signed or unsigned for the right shift, a logical shift (LSR) is the usual reading for a bit pattern; note your choice.' },
      { widget: { name: 'calcTrace', title: '(e) step by step', opts: { regs: { R2: 0x6DFF8763, R3: 0x9876ABCD }, code: '  MOV R10, R2, LSR #2\n  MOV R11, R3, LSL #3\n  ORR R10, R10, R11', show: ['R10', 'R11'] } } },
      { h: 'Problem 2: five independent instructions' },
      { p: 'R0 = `0xFAB46AD2`, R1 = `0xEFFD34A4`, R2 = `0x9876543D`. Give R8 and the flags after each, treating them as independent. Flags start clear, so for the MOVS instructions the V you see is the V you started with.' },
      { widget: { name: 'calcCheck', title: '(a) ADDS R8, R0, R1', opts: { regs: { R0: 0xFAB46AD2, R1: 0xEFFD34A4, R2: 0x9876543D }, code: 'ADDS R8, R0, R1', ask: ['R8'] } } },
      { widget: { name: 'calcCheck', title: '(b) MOVS R8, R1, ROR #3', opts: { regs: { R0: 0xFAB46AD2, R1: 0xEFFD34A4, R2: 0x9876543D }, code: 'MOVS R8, R1, ROR #3', ask: ['R8'] } } },
      { widget: { name: 'calcCheck', title: '(c) SUBS R8, R1, R2', opts: { regs: { R0: 0xFAB46AD2, R1: 0xEFFD34A4, R2: 0x9876543D }, code: 'SUBS R8, R1, R2', ask: ['R8'] } } },
      { widget: { name: 'calcCheck', title: '(d) MOVS R8, R1, LSL #2', opts: { regs: { R0: 0xFAB46AD2, R1: 0xEFFD34A4, R2: 0x9876543D }, code: 'MOVS R8, R1, LSL #2', ask: ['R8'] } } },
      { widget: { name: 'calcCheck', title: '(e) MOVS R8, R2, LSR #4', opts: { regs: { R0: 0xFAB46AD2, R1: 0xEFFD34A4, R2: 0x9876543D }, code: 'MOVS R8, R2, LSR #4', ask: ['R8'] } } },
      { h: 'Problem 3: the conditional chain' },
      { p: 'Initial flags CVZN = 1100, so C = 1, V = 1, Z = 0, N = 0. R0 = `0xFED46A34`, R1 = `0xEFFD3456`, R2 = `0x7865432A`. After each instruction, give R0, R1, R2 and the flags.' },
      { widget: { name: 'calcTrace', opts: { regs: { R0: 0xFED46A34, R1: 0xEFFD3456, R2: 0x7865432A }, flags: { N: 0, Z: 0, C: 1, V: 1 }, code: '  CMP R0, R2\n  CMPGTS R2, R0\n  ADDGTS R1, R0, R2\n  SUBCS R0, R2', show: ['R0', 'R1', 'R2'] } } },
      { say: 'The first CMP leaves N different from V, and that single fact kills both GT instructions. If you assumed GT was true, or that a skipped instruction still updates the flags, everything after line 1 comes out wrong. The final SUBCS runs, because C = 1, but it has no S, so the flags are not updated.' },
      { h: 'Problem 4: tracing fetch and execute' },
      { p: 'The program sits in memory. Trace it from address `0x0000` until the stop instruction at `0x0030`, filling the PC and R0 before and after each instruction, and the contents of address `0x40` at the end.' },
      { widget: { name: 'toyTrace', title: 'The trace table' } },
      { warn: 'Two real ambiguities in the question: **R1 is never initialised** in the visible program (addresses 0x04 to 0x14 are shown only as "..."), and the store instruction says **"4R0"**, most likely a typo for R0. State your assumption explicitly in your submission. Solving it both ways earns more credit than silently picking one.' },
      { keep: 'Before the fetch the PC is the instruction\'s own address. After execution it is that address + 4, unless the instruction is a branch, in which case it is the target.' }
    ],
    takeaways: ['Check C and V by looking at the operands, never only the result.', 'A skipped conditional instruction changes nothing, not even the flags.', 'PC after a branch is the target, not target + 4.', 'Write down the flags after every line, and state your assumptions where the question is ambiguous.']
  });
})(window);
