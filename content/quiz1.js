/* Quiz 1 review: the fundamentals that cost marks, with the key checked against real ARM behaviour. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  Lab.lesson({
    id: 'quiz1', title: 'Quiz 1 review: the basics', minutes: 25, source: 'Quiz 01-2 Solutions',
    lede: 'Quiz 1 tested facts you can lose marks on even when you can solve harder problems. Each one is short, so learn them cold. Quiz 2 is on October 16.',
    blocks: [
      { say: 'The quiz had four recall questions, one memory-read-cycle question and one flags trace. Every recall item is a single fact or a single formula. If one fact is shaky, the question is lost no matter how well you can calculate.' },
      { h: 'Fact 1: RISC' },
      { predict: { q: 'RISC stands for...', opts: ['Reduced Instruction Set Computer', 'Restricted Instruction Sequencing Computer', 'Restricted Instruction Sequential Compiler', 'Rapid Integrated Sequential Computer'], ans: 0, why: 'Reduced Instruction Set Computer. ARM is RISC: a small set of simple, fixed-size instructions, with arithmetic done on registers and memory touched only by loads and stores.' } },
      { h: 'Fact 2: memory size' },
      { say: 'Memory size = **2 to the power of the address bus width** (number of locations) times the **size of each location** (data bus width in bytes).' },
      { p: 'An 8-bit data bus and a 24-bit address bus gives 2^24 locations of 1 byte each. 2^24 = 2^4 x 2^20 = 16 x 1 M, so **16 MB**. Learn the powers of two: 2^10 = 1 K, 2^20 = 1 M, 2^30 = 1 G, and the leftover exponent gives the multiplier (2^4 = 16, 2^5 = 32, 2^6 = 64).' },
      { ask: { q: 'A memory has a 16-bit address bus and an 8-bit data bus. How many **kilobytes** is it?', a: ['64'], type: 'num', why: '2^16 = 2^6 x 2^10 = 64 K locations, each 1 byte, so 64 KB.' } },
      { ask: { q: 'A memory has a 20-bit address bus and a 32-bit data bus. How many **megabytes** is it?', a: ['4'], type: 'num', why: '2^20 = 1 M locations. Each holds 32 bits = 4 bytes. 1 M x 4 B = 4 MB.' } },
      { h: 'Fact 3: what the PC contains' },
      { predict: { q: 'The R15 register (PC) of the ARM always contains...', opts: ['The address of the instruction to be fetched', 'The instruction currently being executed', 'The instruction to be fetched next', 'The result of the last operation'], ans: 0, why: 'The PC holds an address, not an instruction. The wording "the instruction to be fetched" is a trap. It is the address of that instruction.' } },
      { h: 'Fact 4: instruction size' },
      { predict: { q: 'Each ARM instruction is encoded into...', opts: ['4 bytes (one 32-bit word)', '2 bytes', '8 bytes', 'a variable length'], ans: 0, why: 'Every ARM instruction is 32 bits, so the PC advances by 4 each step. Registers are also 32 bits.' } },
      { h: 'The memory read cycle' },
      { p: 'The quiz asked for the steps in order. Memorise the four:' },
      { ol: ['The CPU places the target address on the **address bus**.', 'The CPU issues a **read** control signal.', 'The memory retrieves a copy of the data from that address and places it on the **data bus**.', 'The CPU reads the data from the data bus.'] },
      { widget: { name: 'buses', title: 'Step through a read' } },
      { h: 'The flags trace' },
      { p: 'Initial flags are clear. R0 = `4`, R1 = `8`, R2 = `0xA`. Trace this and say whether each instruction runs:' },
      { code: '  CMP R1, R0\n  SUBGTS R0, R1, R0, LSL #1\n  SUBEQS R2, R1, R2\nstop B stop', init: { regs: { R0: 4, R1: 8, R2: 10 } } },
      { widget: { name: 'calcTrace', title: 'Step by step in the simulator', opts: { regs: { R0: 4, R1: 8, R2: 10 }, code: '  CMP R1, R0\n  SUBGTS R0, R1, R0, LSL #1\n  SUBEQS R2, R1, R2', show: ['R0', 'R1', 'R2'] } } },
      { ol: ['`CMP R1, R0` computes 8 - 4 = 4. It changes no register. N = 0 and Z = 0, so **GT is true** (Z = 0 and N = V).', '`SUBGTS R0, R1, R0, LSL #1` runs. R0 = 8 - (4 shifted left 1 = 8) = 0. Z = 1.', '`SUBEQS R2, R1, R2` runs, because Z = 1 means EQ is true. R2 = 8 - 10 = -2 = `0xFFFFFFFE`. N = 1.'] },
      { warn: 'The two things that cost marks here: shifting R0 (the shift is done first, so the operand is 8 and not 4), and forgetting that the Z flag set by the second instruction is what lets the third one run.' },
      { h: 'The C flag: the key and real ARM differ' },
      { p: 'The posted key records the flags as `0100` after the second instruction and `1000` after the third, written as N Z C V. Real ARM hardware gives a slightly different C on those two lines.' },
      { table: { head: ['After', 'Quiz key (NZCV)', 'Real ARM (NZCV)', 'Why real ARM differs'], rows: [['`CMP R1, R0`', '0000', '0010', '8 - 4 needs no borrow, so C = 1'], ['`SUBGTS R0, ...`', '0100', '0110', '8 - 8 needs no borrow, so C = 1'], ['`SUBEQS R2, ...`', '1000', '1000', '8 - 10 borrows, so C = 0']] } },
      { slide: 'On real ARM hardware, **C after a subtraction means "no borrow"**: C = 1 when the first operand is greater than or equal to the second (as unsigned numbers), and 0 when it borrows. The quiz key leaves C at 0 for the first two lines. The instructions that execute and every register value are identical either way, so the key\'s answers on R0, R1, R2, and which instructions run, are all correct. Only C in the flags column is affected.' },
      { tip: 'For marks in this course, follow the convention the instructor and the key use. For understanding, know the hardware rule. Mixed conventions are the reason these flag columns feel inconsistent. Ask your instructor which one the quiz expects, or check how Homework 1\'s solutions write C after a subtraction.' },
      { widget: { name: 'condExplorer', title: 'See how GT depends on N and V' } },
      { h: 'Test yourself on the facts' },
      { quiz: { id: 'quiz1-facts', title: 'Quiz 1 fundamentals', qs: [
        { kind: 'mcq', q: 'RISC stands for...', opts: ['Reduced Instruction Set Computer', 'Restricted Instruction Sequencing Computer', 'Register Indexed Sequential Computer', 'None of the above'], ans: 0, why: 'Reduced Instruction Set Computer.' },
        { kind: 'mcq', q: 'A memory with an 8-bit data bus and a 24-bit address bus is...', opts: ['16 MB', '64 MB', '32 GB', '16 GB'], ans: 0, why: '2^24 = 16 M locations of 1 byte each.' },
        { kind: 'mcq', q: 'The PC always contains...', opts: ['The address of the instruction to be fetched', 'The instruction being executed', 'The instruction to be fetched next', 'The last result'], ans: 0, why: 'An address, not an instruction.' },
        { kind: 'mcq', q: 'Each ARM instruction is encoded into...', opts: ['4 bytes', '2 bytes', '8 bytes', '1 byte'], ans: 0, why: 'One 32-bit word.' },
        { kind: 'mcq', q: 'In a memory read, the CPU first...', opts: ['Places the address on the address bus', 'Reads the data bus', 'Issues the read signal', 'Increments the PC'], ans: 0, why: 'Address, then read signal, then memory drives the data bus, then the CPU reads it.' },
        { kind: 'mcq', q: 'After CMP R1, R0 with R1 = 8 and R0 = 4, GT is...', opts: ['True', 'False', 'Undefined', 'True only if C = 0'], ans: 0, why: '8 - 4 = 4: Z = 0 and N = V (both 0), so GT passes.' },
        { kind: 'input', q: '2^24 locations of 1 byte, in megabytes', type: 'num', a: ['16'], why: '2^24 = 16 M.' } ] } }
    ],
    takeaways: ['RISC: Reduced Instruction Set Computer. ARM instructions are 4 bytes each.', 'Memory size = 2^(address bits) x (data bits / 8) bytes.', 'The PC holds the address of the next instruction, never the instruction itself.', 'A read: address on the bus, read signal, memory puts data on the bus, CPU reads it.', 'Shift first, then subtract. A skipped conditional instruction changes nothing.']
  });
})(window);
