/* Module 3 Part 2: loads, stores, indexing, and several registers at once. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  Lab.lesson({
    id: 'm3-memaccess', title: 'Loads, stores and indexing', minutes: 26, source: 'Module 3 Part 2, Homework 1 formula sheet',
    lede: 'Since arithmetic only touches registers, every variable in memory has to be loaded and stored. This lesson covers the instructions, the three ways to step through an array, and the stack.',
    blocks: [
      { predict: { q: 'With R0 = `0x20008000`, what does `LDR R1, [R0, #4]` do to R0?', opts: ['Nothing: R0 is unchanged', 'R0 becomes `0x20008004`', 'R0 becomes 4', 'R0 is loaded from memory'], ans: 0, why: 'The offset is added for this one access only. This is the pre-index form and R0 is untouched. Only `!` or a post-index offset writes the new address back.' } },
      { h: 'Getting an address into a register' },
      { p: 'A 32-bit address cannot fit inside a 32-bit instruction that also holds an opcode and register fields. So ARM uses **register-indirect addressing**: put the address in a register first, then dereference it. `ADR R2, label` puts a label\'s address in R2, and `LDR R5, [R2]` loads the word at that address. `ADR` is a pseudo-instruction that takes a **label**, never a `#` number. For a literal address use `LDR R2, =0x0000AAAA`.' },
      { slide: 'Module 3 page 12 writes `ADR R2, #&0000AAAA`. That is not valid. Use `ADR R2, label` for a label, or `LDR R2, =0x0000AAAA` for a literal address. The same page also writes `SDRH` where `STRH` is meant.' },
      { h: 'Sizes' },
      { table: { head: ['Size', 'Load', 'Store', 'Alignment'], rows: [['Word (32 bits)', '`LDR`', '`STR`', 'address divisible by 4'], ['Halfword (16 bits)', '`LDRH`, `LDRSH` (sign-extends)', '`STRH`', 'divisible by 2'], ['Byte (8 bits)', '`LDRB`, `LDRSB`', '`STRB`', 'any'] ] } },
      { p: 'Byte and halfword loads **zero-extend** into the 32-bit register, unless you use the signed variant, which sign-extends. Try it with the slide\'s own example, memory `E1 E3 65 87` from `0x02000000`:' },
      { sim: { title: 'LDRB, LDRH and LDR on the same bytes', code: '  LDR  R0, =0x02000000\n  LDRB R1, [R0]\n  LDRH R2, [R0]\n  LDR  R3, [R0]\nstop B stop', init: { mem: [{ addr: 0x02000000, bytes: [0xE1, 0xE3, 0x65, 0x87] }] }, showMem: true, memBase: 0x02000000 } },
      { ask: { q: 'With those bytes, what is R2 after `LDRH R2, [R0]`?', a: ['0x0000E3E1'], type: 'hex', why: 'Two bytes, little-endian: the byte at the higher address (E3) is more significant, so `E3E1`, zero-extended to `0x0000E3E1`.' } },
      { h: 'Three ways to index' },
      { table: { head: ['Syntax', 'Address used', 'R0 afterwards', 'Name'], rows: [['`LDR R1, [R0, #4]`', 'R0 + 4', 'unchanged', 'Pre-index'], ['`LDR R1, [R0], #4`', 'R0', 'R0 + 4', 'Post-index'], ['`LDR R1, [R0, #4]!`', 'R0 + 4', 'R0 + 4', 'Auto-index'] ] } },
      { keep: 'The `!` means "write the new address back to the base register". The **brackets** tell you when the offset applies: **inside** the brackets means before the access, **outside** means after.' },
      { widget: { name: 'loadLab', title: 'Try every mode', opts: { ins: 'LDR', mode: 'pre', off: 4 } } },
      { ask: { q: 'Using the memory in the lab above (`1F 2E 3D 4C 5B 6A 79 88` from `0x20008000`), what does `LDR R1, [R0, #4]` load? (Read the bytes backwards.)', a: ['0x88796A5B'], type: 'hex', why: 'The word at `0x20008004` is the bytes `5B 6A 79 88`. Little-endian, so `0x88796A5B`.' } },
      { h: 'Post-index walks an array' },
      { p: 'Post-index loads and advances in one instruction, which is why it is the array idiom. Note the `#4`: you advance by 4 **bytes** per word, not by 1.' },
      { sim: { title: 'Sum four integers', code: '  MOV R3, #0            ; counter\n  MOV R2, #0            ; running total\n  LDR R0, =0x20008000   ; point at the first element\nLoop LDR R1, [R0], #4   ; load, THEN step R0 by 4\n  ADD R2, R2, R1\n  ADD R3, R3, #1\n  CMP R3, #4\n  BLT Loop\nstop B stop', init: { mem: [{ addr: 0x20008000, bytes: [1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0] }] }, showMem: true, memBase: 0x20008000 } },
      { h: 'Several registers at once, and the stack' },
      { p: '`STM` and `LDM` store and load many registers in one instruction. The Homework 1 formula sheet lists `STMED` and `LDMED`: **empty descending** stack. The four stack types map onto four addressing modes:' },
      { table: { head: ['Stack type', 'Store', 'Load'], rows: [['Full descending (FD)', 'STMDB (= STMFD)', 'LDMIA (= LDMFD)'], ['Empty descending (ED)', 'STMDA (= STMED)', 'LDMIB (= LDMED)'], ['Full ascending (FA)', 'STMIB (= STMFA)', 'LDMDA (= LDMFA)'], ['Empty ascending (EA)', 'STMIA (= STMEA)', 'LDMDB (= LDMEA)'] ] } },
      { p: '"Descending" means the stack grows toward lower addresses. "Empty" means the stack pointer points at the next free slot, "full" means it points at the last item pushed. `PUSH` and `POP` are `STMDB sp!` and `LDMIA sp!`. The lowest-numbered register always goes at the lowest address. Checked against the ARM documentation.' },
      { sim: { title: 'STMED then LDMED round trip', code: '  LDR R0, =0x20007F00\n  MOV R1, #1\n  MOV R2, #2\n  MOV R3, #3\n  STMED R0!, {R1-R3}   ; empty descending store\n  MOV R1, #0\n  MOV R2, #0\n  MOV R3, #0\n  LDMED R0!, {R1-R3}   ; and back\nstop B stop', showMem: true, memBase: 0x20007EF0 } },
      { quiz: { id: 'm3-memaccess', title: 'Check yourself', qs: [
        { kind: 'mcq', q: 'Which form changes the base register AFTER the access?', opts: ['`LDR R1, [R0], #4`', '`LDR R1, [R0, #4]`', '`LDR R1, [R0, #4]!`', 'None of them'], ans: 0, why: 'The offset outside the brackets is applied after: post-index.' },
        { kind: 'mcq', q: 'Is `LDR R1, [R0, #2]!` legal if R0 = `0x20008000`?', opts: ['No: a word access at 0x20008002 is not 4-aligned', 'Yes', 'Only for byte loads', 'Only with a register offset'], ans: 0, why: 'Words need an address divisible by 4.' },
        { kind: 'mcq', q: 'What does LDRSH do differently from LDRH?', opts: ['Sign-extends the halfword to 32 bits', 'Loads a signed word', 'Loads two halfwords', 'Stores instead of loads'], ans: 0, why: 'LDRH zero-extends and LDRSH sign-extends.' } ] } }
    ],
    takeaways: ['Load, operate, store. Put the address in a register with ADR label or LDR =value.', 'Word address divisible by 4, halfword by 2. Byte and halfword loads zero-extend unless the S variant sign-extends.', 'Pre-index: [R0,#4]. Post-index: [R0],#4. Auto-index: [R0,#4]!', 'STMED is STMDA and LDMED is LDMIB. PUSH/POP are STMDB/LDMIA on sp.']
  });
})(window);
