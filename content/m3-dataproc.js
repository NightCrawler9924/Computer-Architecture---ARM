/* Module 3: the data-processing instructions and the S suffix. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  Lab.lesson({
    id: 'm3-dataproc', title: 'Data-processing instructions and the S suffix', minutes: 20, source: 'Module 3 pages 4 to 7 and Handout 03',
    lede: 'Add, subtract, AND, OR, move and compare: the instructions that change data. Flags are opt-in, and a single misplaced S changes everything that follows.',
    blocks: [
      { predict: { q: 'After `ADD R0, R1, R2` (no S), what happens to the N, Z, C and V flags?', opts: ['They are left unchanged', 'They are updated from the sum', 'They are cleared', 'Only C is updated'], ans: 0, why: 'On ARM, flags are opt-in. Only compare instructions always set them. `ADDS` updates them, `ADD` does not.' } },
      { h: 'The form of an instruction' },
      { p: 'Assembly follows a rigid layout so the assembler can parse it line by line. One instruction per line. **Labels** start in the first column. **Instructions** start in the second column or later. **Comments** start with `;` and run to the end of the line.' },
      { code: 'label1  ADD r4, r3, r2   ; a comment (r4 = r3 + r2)\n        MOV r5, r6       ; copy r6 to r5\n        SUB r0, r0, #1   ; r0 = r0 - 1', run: false },
      { say: 'ARM data-processing instructions are **3-address**: the destination and the two sources are named independently. The order is always **result first, then the first operand, then the second**: `ADD r0, r1, r2` means r0 = r1 + r2.' },
      { h: 'The families' },
      { table: { head: ['Family', 'Instructions', 'Notes'], rows: [
        ['Arithmetic', '`ADD ADC SUB SBC RSB RSC`', 'ADC adds the carry flag. RSB is reverse subtract: `RSB R0, R1, R2` is R0 = R2 - R1'],
        ['Bitwise logic', '`AND ORR EOR BIC`', 'EOR is exclusive OR. BIC clears bits: every 1 in operand 2 clears the matching bit in operand 1'],
        ['Move', '`MOV MVN`', 'No first operand. MVN copies the bitwise complement'],
        ['Compare', '`CMP CMN TST TEQ`', 'No destination. They only set the flags: R1 - R2, R1 + R2, R1 AND R2, R1 EOR R2'] ] } },
      { sim: { title: 'Try each family', code: '  MOV R1, #12\n  MOV R2, #10\n  ADD R3, R1, R2      ; arithmetic: 22\n  RSB R4, R2, R1      ; reverse subtract: R1 - R2 = 2\n  AND R5, R1, R2      ; 1100 AND 1010 = 1000\n  BIC R6, R1, R2      ; 1100 AND NOT 1010 = 0100\n  MVN R7, R2          ; NOT 10\nstop B stop' } },
      { ask: { q: 'What is R6 after `BIC R6, R1, R2` with R1 = 12 and R2 = 10? Give it in decimal.', a: ['4'], type: 'num', why: '12 = 1100, 10 = 1010. NOT 10 = ...0101. 1100 AND 0101 = 0100 = 4. Every 1 in R2 clears the matching bit of R1.' } },
      { h: 'Immediates and the second operand' },
      { p: 'Replace the second source with a constant preceded by `#` to add a constant. In armasm style you can write hex as `#&ff` or `#0xFF`. The source and destination do not have to be different registers: `ADD r3, r3, #1` is fine.' },
      { code: 'ADD r3, r3, #1       ; r3 = r3 + 1\nAND r8, r7, #&ff     ; r8 = r7[7:0], the low byte', run: false },
      { h: 'The S suffix: flags are opt-in' },
      { keep: 'Comparison instructions **always** set the flags. Every other instruction sets them **only if you append S**.' },
      { slide: 'Module 3 page 7 says "Only the comparison operations (CMP or TST) set the condition codes", and then goes on to explain the S suffix. The accurate statement is the one above: compares always set them, and everything else can with S. (TEQ and CMN are compares too.)' },
      { p: 'Why make it optional? Because of **64-bit addition**. A register holds only 32 bits, so a 64-bit sum is two 32-bit additions, and the carry must survive from one to the next:' },
      { code: 'ADDS r2, r2, r0   ; add the low words and SET the carry\nADC  r3, r3, r1   ; add the high words PLUS that carry', run: false },
      { p: 'If every instruction clobbered the flags, the carry would not survive from one line to the next. What gets set by what:' },
      { list: ['**Arithmetic** operations (including CMP and CMN) set **all four** flags.', '**Logical** and **move** operations (TST, TEQ, MOV, MVN) set **N and Z** from the result, **preserve V**, and either preserve C or set it to the last bit shifted out.'] },
      { sim: { title: 'S or no S', code: '  MOV R0, #0\n  ADD R1, R0, #0     ; no S: flags untouched\n  ADDS R1, R0, #0    ; S: result is zero, so Z = 1', regs: {}, showPC: true } },
      { ask: { q: 'Write one instruction that clears bits 4 and 7 of R1 and leaves every other bit alone.', a: ['BIC R1, R1, #0x90', 'BIC R1,R1,#0x90', 'BIC R1, R1, #&90', 'BIC R1,R1,#&90', 'BIC R1, R1, #144'], type: 'text', check: function (v) { return /^bic\s*r1\s*,\s*r1\s*,\s*#\s*(0x90|&90|144)$/i.test(v.trim()); }, why: 'A mask with 1s in exactly those positions is `1001 0000` = `0x90`. BIC clears wherever operand 2 has a 1.' } },
      { quiz: { id: 'm3-dataproc', title: 'Check yourself', qs: [
        { kind: 'mcq', q: 'Which instruction always updates the flags, with no suffix?', opts: ['CMP', 'ADD', 'MOV', 'AND'], ans: 0, why: 'Compares exist only to set flags.' },
        { kind: 'mcq', q: '`RSB R0, R1, R2` computes...', opts: ['R0 = R2 - R1', 'R0 = R1 - R2', 'R0 = R1 + R2', 'R0 = -R1'], ans: 0, why: 'Reverse subtract: operand 2 minus the first operand.' },
        { kind: 'mcq', q: 'After `MOVS R0, R1` (no shift), which flags can change?', opts: ['N and Z only', 'All four', 'None', 'C and V only'], ans: 0, why: 'A move sets N and Z from the result. With no shift C is preserved and V is preserved.' },
        { kind: 'mcq', q: 'Which instruction forces a bit to 1 without disturbing the others?', opts: ['ORR', 'AND', 'BIC', 'CMP'], ans: 0, why: 'OR with a 1 gives 1, OR with a 0 leaves the bit alone.' } ] } }
    ],
    takeaways: ['3-address format: result first, then the two sources.', 'Arithmetic: ADD ADC SUB SBC RSB RSC. Logic: AND ORR EOR BIC. Move: MOV MVN. Compare: CMP CMN TST TEQ.', 'Compares always set flags. Everything else only with S.', 'ADDS then ADC is how a 64-bit add keeps the carry.']
  });
})(window);
