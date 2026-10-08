/* Module 3: how an instruction is encoded. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  Lab.lesson({
    id: 'm3-encoding', title: 'How an instruction becomes 32 bits', minutes: 16, source: 'Module 3 pages 3 and 7',
    lede: 'The assembler turns each line into a 32-bit word. Seeing the fields makes several arbitrary-looking facts obvious: sixteen registers, a condition on everything, and why some constants cannot be used directly.',
    blocks: [
      { predict: { q: 'One line of C like `if (y > x) b = a + 5` becomes how many assembly instructions on ARM?', opts: ['Two or more: RISC keeps each instruction simple', 'Exactly one', 'None, the CPU runs C directly', 'Always three'], ans: 0, why: 'The module shows load y, load x, load a, a CMP, and an ADDGT. One statement becomes several simple instructions.' } },
      { h: 'The data-processing format' },
      { p: 'A 32-bit data-processing instruction (ADD, SUB, AND, MOV and so on) is laid out like this, from bit 31 down to bit 0:' },
      { table: { head: ['Field', 'Bits', 'Meaning'], rows: [
        ['cond', '31 to 28', 'The condition code, present in **every** instruction'], ['0 0', '27 to 26', 'Marks it as data processing'], ['#', '25', '0: operand 2 is a register. 1: operand 2 is an immediate'],
        ['opcode', '24 to 21', 'Which arithmetic or logic function'], ['S', '20', 'Update the flags?'], ['Rn', '19 to 16', 'First source register'], ['Rd', '15 to 12', 'Destination register'], ['operand 2', '11 to 0', 'The second operand'] ] } },
      { p: 'When bit 25 is 0, operand 2 splits into **shift amount** (5 bits), **shift type** (2 bits), a 0 bit and **Rm** (4 bits). When bit 25 is 1, it is an 8-bit **immediate** with a 4-bit **rotate**. Try it:' },
      { widget: { name: 'encoder', title: 'Encode and decode', opts: { tab: 'asm', text: 'ADDGT r0, r3, r9' } } },
      { h: 'Three things the layout explains' },
      { ol: ['Three register fields of 4 bits each is where **sixteen registers** comes from.', '`cond` sits in every instruction and costs 4 of the 32 bits. That is how ARM affords **conditional execution on everything**.', 'The shift amount and type live **inside** operand 2, which is why `ADD r3, r2, r1, LSL #3` is **one instruction in one cycle**, not two.'] },
      { worked: { title: 'Encode `ADDGT r0, r3, r9`', intro: 'The condition GT is `1100` and the ADD opcode is `0100`.', steps: [
        '**cond** = `1100` (GT).', '**bits 27 to 26** = `00` (data processing). **#** = `0`, because operand 2 is a register, not an immediate.', '**opcode** = `0100` (ADD). **S** = `0`, because the mnemonic has no S.',
        '**Rn** = `0011` (r3, the first source). **Rd** = `0000` (r0, the destination).', '**operand 2** is the register r9 with no shift: shift amount `00000`, type `00`, bit `0`, then **Rm** = `1001`. Joined: `1100 0000 1000 0011 0000 0000 0000 1001` = `0xC0830009`.' ] } },
      { ask: { q: 'What is the 32-bit hex word for `ADD r1, r2, r3`? (Condition AL is `1110`, ADD is `0100`, S = 0.)', a: ['0xE0821003'], type: 'hex', why: '`1110 00 0 0100 0 0010 0001 00000000 0011` = `0xE0821003`. The condition AL (always) is the default when you write none.', hint: 'cond 1110, 00, #=0, opcode 0100, S 0, Rn=2 (0010), Rd=1 (0001), then 8 zero bits, then Rm=3 (0011).' } },
      { h: 'Immediates cannot be any 32-bit number' },
      { p: 'The immediate is only 8 bits plus a 4-bit rotate. The assembler can encode a constant only if it is an **8-bit value rotated right by an even number of places**. `#0xFF` is fine. `#0xFF000000` is fine. `#0x12345678` is not, and neither is `#0x101`.' },
      { warn: 'If a constant does not fit, the assembler rejects it. Load it with `LDR R0, =0x12345678` instead, which the assembler turns into a load from a nearby literal.' },
      { ask: { q: 'Can `MOV R0, #0x3FC` use the constant directly? Answer yes or no.', a: ['yes', 'y'], type: 'text', why: '`0x3FC` = `0xFF` rotated right by 30, which is an even number, so it fits. The rotate field holds 15 (30 places / 2).', hint: '0x3FC is 0xFF shifted left by 2 bits.' } },
      { ask: { q: 'Can `MOV R0, #0x101` use the constant directly? Answer yes or no.', a: ['no', 'n'], type: 'text', why: '`0x101` has bits 0 and 8 set. No rotation by an even amount fits both into 8 bits, so it cannot be an immediate.' } },
      { quiz: { id: 'm3-encoding', title: 'Check yourself', qs: [
        { kind: 'mcq', q: 'How many bits does the cond field use?', opts: ['4', '2', '8', '1'], ans: 0, why: 'cond is bits 31 to 28.' },
        { kind: 'mcq', q: 'If bit 25 (#) is 1, operand 2 is...', opts: ['An immediate (8 bits and a 4-bit rotate)', 'A register', 'A memory address', 'The PC'], ans: 0, why: '# = 1 means immediate.' },
        { kind: 'input', type: 'hex', q: 'Encode `MOV r0, #0`. (cond 1110, 00, #=1, opcode MOV = 1101, S=0, Rn=0, Rd=0, operand 2 = 0.)', a: ['0xE3A00000'], why: '`1110 00 1 1101 0 0000 0000 000000000000` = `0xE3A00000`.' } ] } }
    ],
    takeaways: ['A data-processing instruction is cond | 00 | # | opcode | S | Rn | Rd | operand 2.', 'Four bits per register field gives 16 registers. A cond field in every instruction gives conditional execution.', 'An immediate is 8 bits rotated right by an even amount. Anything else needs LDR Rd, =value.']
  });
})(window);
