/* The fetch-decode-execute cycle, the PC, and the layers of abstraction. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  Lab.lesson({
    id: 'm2-cycle', title: 'Fetch, decode, execute', minutes: 18, source: 'Module 2 and Module 3',
    lede: 'A processor does one thing, forever: fetch an instruction, decode it, execute it. The detail that costs marks is when the PC changes.',
    blocks: [
      { predict: { q: 'An instruction at address `0x0020` is `ADD R0, R0, #1`. What is the PC right after it has executed?', opts: ['`0x0024`', '`0x0020`', '`0x0021`', '`0x0028`'], ans: 0, why: 'Every ARM instruction is 32 bits, which is 4 bytes, so the PC advances by 4. It was incremented during the fetch.' } },
      { h: 'The cycle' },
      { ol: ['**Fetch**: read the instruction at the address in the PC into the instruction register, then increment the PC by 4.', '**Decode**: split the instruction into fields and work out what it is and which control signals are needed.', '**Execute**: do it. If it is a branch, replace the PC with the target.'] },
      { say: 'Two details do all the damage in exam questions. The **PC advances by 4**, because ARM instructions are 4 bytes. And the PC is incremented **during the fetch, before execution**, so while an instruction runs the PC already points at the next one. A **branch replaces** the PC. It does not add to it.' },
      { widget: { name: 'fetchCycle', title: 'Step through it' } },
      { h: 'The parts of the CPU' },
      { table: { head: ['Part', 'What it does'], rows: [
        ['PC', 'Holds the address of the next instruction to fetch (32 bits on ARM)'], ['IR', 'Holds the instruction after it has been fetched (32 bits on ARM)'], ['Instruction decoder', 'Splits the instruction into fields for the control unit'],
        ['Control unit', 'Coordinates everything in the CPU, including the timing'], ['ALU', 'Arithmetic and logic: add, compare, AND, OR, NOT'], ['ALU input registers 1 and 2', 'Hold the operands going into the ALU'],
        ['ALU output register', 'Holds the result before it goes to its destination'], ['Register bank', 'The programmer\'s working registers'], ['MAR and MDR', 'Buffer the address and data at the boundary with the buses'] ] } },
      { predict: { q: 'The instruction at `0x0020` is `B 0x0040`. What is the PC after it executes?', opts: ['`0x0040`', '`0x0044`', '`0x0024`', '`0x0020`'], ans: 0, why: 'A branch overwrites the PC with its target. Adding 4 to a branch target is the single most common tracing error.' } },
      { h: 'Who starts the cycle?' },
      { p: 'On a desktop, the operating system loads your program and puts the address of its first instruction in the PC. On a bare microcontroller there is no operating system: a **reset vector** stored in flash supplies the initial PC. That is why embedded projects have startup code.' },
      { h: 'From C down to bits' },
      { p: 'Module 2 follows `int a = 1; int b = 2; int c = a + b;` all the way down:' },
      { table: { head: ['Address', 'Machine code (binary)', 'Hex', 'Assembly'], rows: [
        ['`0x08000100`', '`0010000100000000`', '`2100`', '`MOVS r1, #0x01`'], ['`0x08000102`', '`0010001000000001`', '`2201`', '`MOVS r2, #0x02`'], ['`0x08000104`', '`0001100010001011`', '`188B`', '`ADDS r3, r1, r2`'],
        ['`0x08000106`', '`0010000000000000`', '`2000`', '`MOVS r0, #0x00`'], ['`0x08000108`', '`0100011101110000`', '`4770`', '`BX lr`'] ] } },
      { tip: 'Look closely: the machine code here is **16 bits** and the addresses step by **2**, not 4. That is the Thumb instruction set, which your Cortex-M4 really runs. Module 3 teaches the 32-bit ARM set, where instructions are 32 bits and the PC advances by 4. For this course and the quiz, **use Module 3: instructions are 32 bits and the PC advances by 4**.' },
      { p: 'The chain to remember: C goes through the **compiler** to assembly, through the **assembler** to machine code, which is loaded into memory at addresses, and the PC points at the first one.' },
      { h: 'Layers of abstraction' },
      { diagram: 'layers' },
      { p: 'The **ISA** is the interface. Everything above it is software and everything below it is hardware. It is the agreement that lets the two be designed by different people, in different companies, in different decades. "ARM" the instruction set is a specification. The Cortex-M4 on your board is one microarchitecture that implements it.' },
      { quiz: { id: 'm2-cycle', title: 'Check yourself', qs: [
        { kind: 'mcq', q: 'During which phase is the PC incremented?', opts: ['Fetch', 'Decode', 'Execute', 'After the program ends'], ans: 0, why: 'The PC is incremented while the instruction is being fetched, so during execution it already points at the next instruction.' },
        { kind: 'mcq', q: 'What does the instruction register hold?', opts: ['The instruction just fetched', 'The address of the next instruction', 'The ALU result', 'The flags'], ans: 0, why: 'The PC holds the next address. The IR holds the fetched instruction.' },
        { kind: 'mcq', q: 'Software and hardware are separated by...', opts: ['The instruction set architecture', 'The compiler', 'The operating system', 'The cache'], ans: 0, why: 'The ISA is the contract between them.' },
        { kind: 'mcq', q: 'After `B 0x0018` at address `0x0000`, the PC is...', opts: ['`0x0018`', '`0x001C`', '`0x0004`', '`0x0000`'], ans: 0, why: 'A branch replaces the PC with the target.' } ] } }
    ],
    takeaways: ['Fetch, decode, execute, forever.', 'The PC advances by 4 during the fetch, so it points at the next instruction while the current one executes.', 'A branch replaces the PC with its target.', 'The ISA is the boundary between software and hardware.']
  });
})(window);
