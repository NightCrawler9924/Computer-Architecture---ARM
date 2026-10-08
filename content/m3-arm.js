/* Module 3, Part 1: ARM architecture and organisation. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  Lab.lesson({
    id: 'm3-arm', title: 'ARM: load-store, registers and the CPSR', minutes: 18, source: 'Module 3 Part 1 and Handout 03',
    lede: 'ARM is a RISC machine built around one rule: arithmetic happens in registers, never in memory. Everything else in the course follows from that.',
    blocks: [
      { predict: { q: 'On x86 you can write one instruction that adds 5 directly to a value in memory. On ARM...', opts: ['You can too', 'You cannot. You load the value into a register, add, then store it back', 'You can only if the value is aligned', 'You need a special coprocessor'], ans: 1, why: 'ARM is a load-store architecture. Arithmetic works only on registers, and memory is touched only by load and store instructions.' } },
      { h: 'RISC and CISC' },
      { table: { head: ['', 'CISC (x86)', 'RISC (ARM, MIPS)'], rows: [['Each instruction', 'Does a lot of complex work', 'Does one small, unit job'], ['Instruction length', 'Variable', 'Fixed (32 bits in ARM state)'], ['Memory access', 'Operations can use memory directly', 'Load and store only'] ] } },
      { p: 'ARM suits embedded systems because its implementation is very small (low price) and its power consumption is low (longer battery life). The course summarises the instruction set as "combining the best of RISC with the best of CISC": load-store and fixed-length instructions, but also conditional execution of every instruction, load/store of several registers at once, and a shift combined with an ALU operation in one instruction.' },
      { h: 'Load, operate, store' },
      { say: 'To do `x = x + 5` where `x` is in memory takes four instructions: put the address in a register, load, operate on registers, store. Every memory question in this course reduces to "have I loaded it first?"' },
      { sim: { title: 'x = x + 5', code: '  ADR R0, x        ; the ADDRESS of x\n  LDR R1, [R0]     ; load the value\n  ADD R1, R1, #5   ; operate, registers only\n  STR R1, [R0]     ; store it back\nstop B stop\nx DCD 10', showMem: true, memBase: 0x20000000, showPC: true } },
      { h: 'The sixteen registers' },
      { diagram: 'regs' },
      { p: 'ARM has 16 registers, `r0` to `r15`, each 32 bits. r0 to r12 are interchangeable: any operation you can do on one you can do on any other. Three have special jobs: **r13 is the stack pointer (SP)**, **r14 is the link register (LR)** and **r15 is the program counter (PC)**. Because the PC is an ordinary register, its value can be used as an operand, but you should not overwrite it as if it were data.' },
      { slide: 'Module 3 page 2 says "except for r3, r14 and r15". That is a typo for **r13**. The figure on the same page is correct.' },
      { predict: { q: 'Why does ARM have exactly sixteen registers?', opts: ['The instruction encoding gives 4 bits to each register field, and 4 bits name 16 things', 'It is a marketing choice', 'Sixteen is the number of flags', 'Memory only has sixteen addresses'], ans: 0, why: 'A 3-address instruction names Rn, Rd and Rm. Each field is 4 bits, so 4 + 4 + 4 = 12 bits in total, and 2^4 = 16. The encoding forces the register count.' } },
      { h: 'The status register' },
      { p: 'The **CPSR** (current program status register) holds status information. Its top four bits are the flags **N**, **Z**, **C** and **V**. Any arithmetic, logical or shift instruction can update them if you add the `S` suffix. Conditional instructions read them. The next lessons build each flag up properly.' },
      { h: 'Inside the processor' },
      { diagram: 'armOrg' },
      { p: 'In a single-cycle data-processing instruction, two register operands are read. The value on the **B bus** passes through the **barrel shifter** and is combined with the value on the **A bus** in the **ALU**. The result is written back to the register bank. At the same time the PC goes through the incrementer so that the next fetch address is ready. The shift and the ALU operation happen in the same cycle, which is the barrel shifter\'s whole reason for existing.' },
      { keep: 'The three-stage pipeline in the figure (fetch, decode, execute) overlaps instructions: while one executes, the next is decoded and the one after is fetched.' },
      { quiz: { id: 'm3-arm', title: 'Check yourself', qs: [
        { kind: 'mcq', q: 'Which of these is r13?', opts: ['The stack pointer', 'The link register', 'The program counter', 'A general register with no special role'], ans: 0, why: 'r13 SP, r14 LR, r15 PC.' },
        { kind: 'mcq', q: 'Which flags are in the CPSR?', opts: ['N, Z, C and V', 'A, B, C and D', 'S, P, L and R', 'X, Y and Z'], ans: 0, why: 'Negative, zero, carry and overflow.' },
        { kind: 'mcq', q: 'What does the barrel shifter let ARM do?', opts: ['Shift or rotate the second operand in the same cycle as the ALU operation', 'Shift memory contents', 'Divide by 10', 'Shift the PC'], ans: 0, why: 'A shift and an ALU operation in a single instruction and a single cycle.' },
        { kind: 'mcq', q: 'ARM instructions are, in ARM state...', opts: ['32 bits wide and 4-byte aligned', 'variable length', '16 bits wide', '64 bits wide'], ans: 0, why: 'Fixed 32-bit instructions, which is why the PC advances by 4.' } ] } }
    ],
    takeaways: ['ARM is RISC and load-store: arithmetic only on registers.', '16 registers (r0 to r15). r13 SP, r14 LR, r15 PC. Four bits per register field forces the number 16.', 'The CPSR holds N, Z, C and V.', 'The barrel shifter and the ALU work in the same cycle.']
  });
})(window);
