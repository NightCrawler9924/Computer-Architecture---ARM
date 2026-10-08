/* Reference page: one-page cheat sheet, condition codes, instruction list, slide errors, glossary. */
(function (g) {
  'use strict';
  var E = g.E359, Lab = g.Lab, h = Lab.h;

  var CHEAT = [
    ['Sign', 'Leading hex digit 0 to 7 means positive, 8 to F means negative.'],
    ['Negate', 'Flip every hex digit (digit becomes F minus digit), then add 1.'],
    ['Subtract', '`A - B` is computed as `A + NOT B + 1`. There is only one adder.'],
    ['Add hex digits', 'Add the values. If the total is 16 or more, subtract 16 and carry 1.'],
    ['N', 'Bit 31 of the result. A leading hex digit of 8 to F means N = 1.'],
    ['Z', 'The result is exactly `0x00000000`. Zero is not negative: N = 0, Z = 1.'],
    ['C (add)', 'Carry out of the leftmost column, the 33rd bit.'],
    ['C (subtract)', 'NOT borrow. `C = 1` means A is at least B, unsigned. This is the opposite of x86.'],
    ['V (add)', 'Positive + positive giving negative, or negative + negative giving positive. Operands of different sign cannot overflow.'],
    ['V (subtract)', 'Positive - negative giving negative, or negative - positive giving positive. Operands of the same sign cannot overflow.'],
    ['C and V', 'Independent. All four combinations happen. Look at the operands, never only the result.'],
    ['Shifts', '`LSL` x 2^n, C = last bit off the top. `LSR` unsigned / 2^n. `ASR` signed / 2^n. `ROR` wraps round. `RRX` rotates right 1 through C.'],
    ['MOVS flags', 'N and Z from the result, C from the shifter, V unchanged.'],
    ['Conditional instruction', 'Condition false: nothing happens, flags untouched. Condition true with S: it runs and overwrites the flags.'],
    ['Branch', 'To skip a body, branch on the opposite condition. A branch replaces the PC, there is no +4.'],
    ['Fetch', 'Read the instruction at the PC, then PC = PC + 4 (4 bytes per ARM instruction), decode, execute.'],
    ['Memory', 'Word address divisible by 4, halfword by 2. Little-endian: the lowest address holds the least significant byte.'],
    ['Indexing', '`[R0, #4]` pre (R0 unchanged), `[R0], #4` post (R0 + 4 after), `[R0, #4]!` auto (R0 + 4 first, kept).'],
    ['Registers', 'r0 to r12 general purpose, r13 = SP, r14 = LR, r15 = PC.']
  ];

  var INSTR = [
    ['ADD, ADC', 'Add, add with carry', 'ADD R2, R1, R0', 'R2 = R1 + R0'], ['SUB, SBC, RSB, RSC', 'Subtract, with carry, reversed', 'RSB R0, R1, #0', 'R0 = 0 - R1'],
    ['AND, ORR, EOR, BIC, ORN', 'Bitwise logic and bit clear', 'BIC R1, R1, #0x90', 'R1 = R1 AND NOT 0x90'], ['MOV, MVN', 'Copy, copy complement', 'MOV R1, R2, LSL #3', 'R1 = R2 << 3'],
    ['CMP, CMN, TST, TEQ', 'Set flags only, no result register', 'CMP R0, #10', 'flags from R0 - 10'], ['LSL, LSR, ASR, ROR, RRX', 'Shift and rotate', 'ASR R0, R1, #2', 'R0 = R1 >> 2 (signed)'],
    ['MUL, MLA', 'Multiply, multiply-accumulate (low 32 bits)', 'MLA R4, R3, R2, R1', 'R4 = R3 x R2 + R1'], ['UMULL, SMULL, UMLAL, SMLAL', 'Long multiply into two registers', 'UMULL R0, R1, R2, R3', 'R1:R0 = R2 x R3'],
    ['UDIV, SDIV', 'Unsigned and signed divide', 'UDIV R0, R1, R2', 'R0 = R1 / R2'], ['BFC, BFI', 'Bit field clear and insert', 'BFI R9, R2, #8, #12', 'R9[19:8] = R2[11:0]'],
    ['CLZ, RBIT, REV', 'Count leading zeros, reverse bits, reverse bytes', 'RBIT R1, R0', 'R1 = bits of R0 reversed'], ['LDR, STR', 'Load and store a word', 'LDR R1, [R0, #4]', 'R1 = memory[R0 + 4]'],
    ['LDRB, STRB, LDRH, STRH, LDRSH, LDRSB', 'Byte and halfword transfers', 'LDRH R1, [R0]', 'zero-extended halfword'], ['LDM, STM, PUSH, POP', 'Load and store several registers', 'STMED R0!, {R1-R3}', 'empty descending store'],
    ['ADR, LDR Rd, =value', 'Put an address or constant in a register', 'ADR R0, label', 'R0 = address of label'], ['B, BL, BX', 'Branch, branch and link, branch to register', 'BX LR', 'return from a function'],
    ['MRS, MSR', 'Read and write the status register', 'MRS R0, APSR', 'R0 = flags'], ['NOP', 'Do nothing', 'NOP', '']
  ];

  var ERRORS = [
    ['Module 3, page 2', 'Says "except for r3, r14 and r15" are special.', 'It should say r13. The figure on the same page is right.'],
    ['Module 3, page 3', 'Says GT completes "if and only if the N flag is cleared".', 'GT is Z = 0 and N = V. N clear alone is not enough.'],
    ['Module 3, page 7', 'Says only CMP or TST set the condition codes, then explains the S suffix.', 'Compares always set the flags. Everything else sets them only with S.'],
    ['Module 3, page 9', 'Writes `ADD r3, r2, r1, LS #3`.', 'It should be `LSL #3`.'],
    ['Module 3, page 10', 'Writes `RSB, r0, r0, r0, LSL #3` with a comma after RSB.', 'No comma: `RSB r0, r0, r0, LSL #3`.'],
    ['Module 3, page 12', 'Writes `SDRH` in the text and `ADR R2, #&0000AAAA`.', '`STRH`. And ADR takes a label (`ADR R2, label`) or use `LDR R2, =0x0000AAAA`.'],
    ['Module 3, page 17', 'The example `BEQ NOT_EQUAL` branches to the not-equal block when equal.', 'It should be `BNE NOT_EQUAL`. The `BGT greater` example below it is correct.'],
    ['Module 2, page 2', 'Says the microcontroller is "ARM on both the Arduino Due or Mega".', 'Only the Due is ARM (SAM3X8E, Cortex-M3). The Mega 2560 uses an 8-bit AVR chip (ATmega2560), like the Uno. Checked against SparkFun and Arduino board comparisons.'],
    ['Module 2, page 4', 'Says the ARM has a 32-bit address bus and a 16-bit data bus.', 'The Cortex-M4 on your board has a 32-bit data bus. Treat it as a generic teaching figure.'],
    ['Handout 03, slide 29', 'Writes `LDR r0, =0xFFFFFFFFF` with nine Fs.', 'Eight Fs make 32 bits: `0xFFFFFFFF`.'],
    ['Handout 03, slide 34', 'Says `MOV r1, SP` copies "SP (r14)".', 'SP is r13. r14 is LR.'],
    ['Homework 1, Problem 4', 'R1 is never set, and one instruction says "4R0".', 'State your assumptions: R0 + R1 for the add, and "4R0" is most likely a typo for R0. Solve both readings if unsure.']
  ];

  var GLOSS = [
    ['Access time', 'How long memory takes to return data after being asked. Latency.'], ['Address bus', 'Carries the location the CPU wants, one way, CPU to memory. 32 lines on ARM, so 4 GiB of address space.'],
    ['Alignment', 'A word must sit at an address divisible by 4, a halfword at an address divisible by 2.'], ['ALU', 'Arithmetic and logic unit. Does add, subtract, AND, OR and the like.'],
    ['Barrel shifter', 'Hardware that shifts or rotates the second operand in the same cycle as the ALU operation.'], ['Baud rate', 'Symbols per second on a serial link. With 8N1 framing, about baud / 10 characters per second.'],
    ['Big-endian', 'The most significant byte goes at the lowest address.'], ['BoosterPack', 'A plug-in peripheral board. The MKII adds an LCD, joystick, sensors, buzzer and more.'],
    ['Branch', 'An instruction that changes the PC so execution continues somewhere else.'], ['Bus', 'A group of wires carrying related signals.'],
    ['C (carry flag)', 'After an add, the carry out of bit 31. After a subtract, NOT borrow. After a shift, the last bit shifted out.'], ['CISC', 'Complex instruction set computer: variable-length instructions that each do a lot. x86.'],
    ['Condition code', 'The two-letter suffix (EQ, GT, ...) that makes an instruction run only if the flags satisfy it.'], ['Control bus', 'Carries the type of transaction: memory read or write, I/O, interrupt request and so on.'],
    ['CPSR', 'Current program status register. Holds N, Z, C and V in its top four bits.'], ['Cycle time', 'The minimum time between the start of one memory operation and the next. Throughput.'],
    ['Data bus', 'Carries the value being read or written. Two-way.'], ['DRAM', 'Dynamic RAM. One capacitor per bit. Dense and cheap, needs refresh, and reads are destructive.'],
    ['Embedded system', 'A microcontroller plus fixed software in flash or ROM, solving one dedicated job, with software the user cannot reach.'], ['Fetch-decode-execute', 'The loop a processor repeats forever: read the instruction at the PC, split it into fields, do it.'],
    ['Flag', 'A single status bit, such as N, Z, C or V.'], ['Halfword', '16 bits, 2 bytes.'], ['Hexadecimal', 'Base 16. Each digit is exactly 4 bits.'],
    ['Immediate', 'A constant written inside the instruction, preceded by #. In ARM, 8 bits rotated right by an even amount.'], ['ISA', 'Instruction set architecture: the contract between software and hardware.'],
    ['LaunchPad', 'The Texas Instruments development board carrying the TM4C123 microcontroller.'], ['Link register (LR, r14)', 'Holds the return address after BL.'], ['Little-endian', 'The least significant byte goes at the lowest address. ARM default.'],
    ['Load-store architecture', 'Arithmetic works only on registers. Memory is touched only by load and store instructions.'], ['Memory address space', 'How many bytes the address bus can name. Installed memory can be less.'],
    ['Microcontroller', 'A CPU plus memory, timers, ADC/DAC and I/O ports on one chip.'], ['Microprocessor', 'A CPU alone. Needs external memory and I/O chips.'],
    ['N (negative flag)', 'Bit 31 of the result.'], ['Overflow (V flag)', 'Signed overflow: the sign of the result is impossible for the operands.'], ['Pipeline', 'Overlapping fetch, decode and execute of consecutive instructions.'],
    ['Post-index', '`[R0], #4`: use R0, then add the offset to R0.'], ['Pre-index', '`[R0, #4]`: use R0 plus the offset for this access only.'], ['Program counter (PC, r15)', 'Holds the address of the next instruction to fetch.'],
    ['PWM', 'Pulse width modulation. A pin switches fully on and off quickly, and the on-time fraction sets the average level.'], ['Refresh', 'Rewriting DRAM cells before their charge leaks away, about every 64 ms.'],
    ['Register', 'A small, very fast storage location inside the CPU.'], ['RISC', 'Reduced instruction set computer: fixed-length, simple instructions, load-store. ARM.'], ['SRAM', 'Static RAM. A flip-flop per bit. Fast, no refresh, less dense. Used for caches.'],
    ['Stack pointer (SP, r13)', 'Points at the top of the stack.'], ['Two\'s complement', 'The way signed integers are stored: negate by flipping all bits and adding 1.'], ['Word', '32 bits, 4 bytes, on ARM.'], ['Z (zero flag)', 'Set when the result is exactly zero.']
  ];

  Lab.pages.reference = function (el) {
    Lab.setTitle('Reference');
    el.appendChild(h('div', { class: 'lesson-head' }, h('h1', {}, 'Reference'), h('p', { class: 'lede' }, 'The one-page cheat sheet, the condition codes, the instruction list, the errors found in the course slides, and a glossary.')));
    var body = h('div', { class: 'lesson' });
    el.appendChild(body);
    body.appendChild(h('h2', { style: { marginTop: 0 } }, 'The one-page cheat sheet'));
    body.appendChild(Lab.table(['Topic', 'The rule'], CHEAT));
    body.appendChild(h('h2', {}, 'Condition codes'));
    body.appendChild(h('div', { class: 'wide' }, Lab.table(['Bits [31:28]', 'Code', 'Meaning', 'Flags needed'], E.COND.map(function (c) { return [h('code', {}, c.bits), h('strong', { class: 'mono' }, c.alias ? c.code + ' / ' + c.alias : c.code), c.name, h('span', { class: 'mono' }, c.need)]; }))));
    body.appendChild(h('p', { class: 'muted' }, 'Signed comparisons (GT GE LT LE) read N against V. Unsigned comparisons (HI HS LO LS) read C and Z. EQ and NE work for both.'));
    body.appendChild(h('h2', {}, 'Instruction quick list'));
    body.appendChild(h('div', { class: 'wide' }, Lab.table(['Instruction', 'What it does', 'Example', 'Meaning'], INSTR.map(function (r) { return [h('strong', { class: 'mono' }, r[0]), r[1], h('code', {}, r[2]), r[3]]; }))));
    body.appendChild(h('h2', {}, 'Errors in the course materials'));
    body.appendChild(h('p', {}, 'Each of these was checked against the original page, not against extracted text. If you memorised the printed version, fix it.'));
    body.appendChild(h('div', { class: 'wide' }, Lab.table(['Where', 'What it says', 'What it should say'], ERRORS)));
    body.appendChild(h('h2', {}, 'Glossary'));
    var q = h('input', { type: 'text', id: 'gl-q', placeholder: 'Filter terms...', 'aria-label': 'Filter the glossary', style: { width: '100%', maxWidth: '20rem' } });
    var list = h('div', { class: 'gloss' });
    body.appendChild(h('div', { class: 'field' }, h('label', { for: 'gl-q' }, 'Find a term'), q));
    body.appendChild(list);
    function draw() {
      Lab.clear(list); var f = q.value.toLowerCase();
      var items = GLOSS.filter(function (t) { return !f || (t[0] + ' ' + t[1]).toLowerCase().indexOf(f) >= 0; });
      items.forEach(function (t) { list.appendChild(h('div', { class: 'gl-item' }, h('dt', {}, t[0]), h('dd', { html: Lab.fmt(t[1]) }))); });
      if (!items.length) list.appendChild(h('p', { class: 'muted' }, 'No terms match.'));
    }
    q.addEventListener('input', draw); draw();
  };
})(window);
