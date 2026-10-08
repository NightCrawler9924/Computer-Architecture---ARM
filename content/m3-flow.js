/* Branches, if/else, loops, and calling a function. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  Lab.lesson({
    id: 'm3-flow', title: 'Branches, if/else and loops', minutes: 28, source: 'Module 3 Part 3',
    lede: 'Turn C control flow into assembly. There is one rule that makes every pattern easy: to skip a body, branch on the opposite condition.',
    blocks: [
      { predict: { q: 'You want `if (R0 > 50) { body }`. After `CMP R0, #50`, which branch skips the body?', opts: ['`BLE skip`', '`BGT skip`', '`BEQ skip`', '`BGE skip`'], ans: 0, why: 'Branch on the **opposite** condition. The body should run when R0 > 50, so skip it when R0 <= 50: `BLE`. The inversion pairs are EQ/NE, GT/LE, GE/LT, HI/LS, HS/LO, MI/PL, VS/VC.' } },
      { h: 'Branches' },
      { p: '`B label` sets the PC to the label. Instructions between are skipped. `BL label` also saves the return address in LR, and `BX LR` returns. Add a condition for a conditional branch: `BEQ`, `BNE`, `BGT`, `BLE`, and so on.' },
      { table: { head: ['C comparison', 'Signed data', 'Unsigned data'], rows: [['`==`', '`BEQ`', '`BEQ`'], ['`!=`', '`BNE`', '`BNE`'], ['`>`', '`BGT`', '`BHI`'], ['`>=`', '`BGE`', '`BHS`'], ['`<`', '`BLT`', '`BLO`'], ['`<=`', '`BLE`', '`BLS`'] ] } },
      { keep: 'Equality is the same either way. **Every ordering comparison differs** between signed and unsigned. Check what type your data is before choosing.' },
      { h: 'Short if/else: conditional execution' },
      { sim: { title: 'if (R9 == 7) R0 = R1; else R0 = R2 + R3;', code: '  MOV R9, #7\n  MOV R1, #11\n  MOV R2, #20\n  MOV R3, #30\n  CMP R9, #7\n  MOVEQ R0, R1\n  ADDNE R0, R2, R3\nstop B stop' } },
      { h: 'Long if/else: a conditional branch' },
      { p: 'When the bodies are more than an instruction, make a true block and a false block and branch to one of them.' },
      { sim: { title: 'if (R9 > 7) R0 = 3R1 + R2; else R0 = 9R4 + 5R6;', code: '  MOV R9, #3\n  MOV R1, #2\n  MOV R2, #1\n  MOV R4, #2\n  MOV R6, #1\n  CMP R9, #7\n  BGT greater\n  ADD R12, R6, R6, LSL #2   ; false block: 5 R6\n  ADD R0, R4, R4, LSL #3    ; 9 R4\n  ADD R0, R0, R12\n  B getout                  ; <== skip the true block\ngreater ADD R0, R1, R1, LSL #1  ; true block: 3 R1\n  ADD R0, R0, R2\ngetout\nstop B stop' } },
      { warn: 'The `B getout` at the end of the false block is the most frequently forgotten line in this course. Leave it out and execution runs straight into the true block as well. Try deleting it in the simulator.' },
      { slide: 'Module 3 page 17 gives an example `BEQ NOT_EQUAL` that branches to the not-equal block when the comparison **is** equal. Trace it and it does the opposite of what is intended. It should be `BNE NOT_EQUAL`. The `BGT greater` example just below it is correct.' },
      { h: 'Loops' },
      { sim: { title: 'Counted loop: the body runs 10 times', code: '  MOV R0, #0\nLOOP ADD R0, R0, #1\n  CMP R0, #10\n  BNE LOOP\nstop B stop' } },
      { sim: { title: 'while (R0 > 50) { R1 += R2; R0 -= R1; }', code: '  MOV R0, #100\n  MOV R1, #0\n  MOV R2, #10\nagain CMP R0, #50\n  BLE getout        ; leave on the OPPOSITE condition\n  ADD R1, R1, R2\n  SUB R0, R0, R1\n  B again\ngetout\nstop B stop' } },
      { p: '`repeat ... until` tests at the **end**, `while ... do` tests at the **start**. For a repeat-until, branch back on the **opposite** of the "until" condition.' },
      { h: 'Calling a function' },
      { sim: { title: 'BL and BX LR, with PUSH and POP', code: '  MOV R0, #5\n  BL double\n  BL double\n  B stop\ndouble PUSH {R4, LR}\n  ADD R0, R0, R0\n  POP {R4, LR}\n  BX LR\nstop B stop', showPC: true } },
      { h: 'Exercises: write the assembly' },
      { p: 'Attempt each on paper, then compare. Open any answer in the simulator and step through it.' },
      { reveal: { q: '`if (a < 0) { a = 0 - a; } x = x + 1;` with a in R1 and x in R2.', rows: 3, answer: '<pre><code>  CMP   R1, #0\n  RSBLT R1, R1, #0    ; only if a &lt; 0: R1 = 0 - R1\n  ADD   R2, R2, #1</code></pre>Two instructions for the `if`, no branch and no label. Most students write five lines with a branch.' } },
      { reveal: { q: '`if (x <= 20 || x >= 25) { a = 1 }` with x signed in R0.', rows: 4, answer: '<pre><code>  CMP   R0, #20\n  MOVLE R1, #1        ; x &lt;= 20\n  BLE   done\n  CMP   R0, #25\n  MOVGE R1, #1        ; x &gt;= 25\ndone</code></pre>The first compare is enough when x <= 20. Otherwise compare against 25.' } },
      { reveal: { q: '`if (a == 1 || a == 7 || a == 11) y = 1; else y = -1;` with a in R0.', rows: 4, answer: '<pre><code>  MOV   R1, #-1       ; assume the else case\n  CMP   R0, #1\n  CMPNE R0, #7        ; only compare again if not already equal\n  CMPNE R0, #11\n  MOVEQ R1, #1</code></pre>`CMPNE` only runs if the previous compare was not equal, so as soon as one test matches, Z stays set and the rest are skipped.' } },
      { reveal: { q: '`int sum = 0; for (i = 0; i < 10; i++) sum += i;`', rows: 5, answer: '<pre><code>  MOV R10, #0    ; sum\n  MOV R0, #0     ; i\nloop CMP R0, #10\n  BGE done\n  ADD R10, R10, R0\n  ADD R0, R0, #1\n  B loop\ndone</code></pre>The loop test is at the top and leaves on the opposite of `i < 10`, which is `BGE`.' } },
      { quiz: { id: 'm3-flow', title: 'Check yourself', qs: [
        { kind: 'mcq', q: 'For unsigned data, "greater than" is...', opts: ['BHI', 'BGT', 'BGE', 'BEQ'], ans: 0, why: 'Unsigned ordering uses HI HS LO LS.' },
        { kind: 'mcq', q: 'A `B getout` at the end of a false block is there to...', opts: ['Skip the true block', 'End the program', 'Return from a function', 'Set the flags'], ans: 0, why: 'Without it the false block falls into the true block.' },
        { kind: 'mcq', q: 'To exit a while loop on `R0 > 50`, you branch out on...', opts: ['BLE', 'BGT', 'BEQ', 'BLO'], ans: 0, why: 'Leave on the opposite: R0 <= 50.' } ] } }
    ],
    takeaways: ['To skip a body, branch on the opposite condition.', 'Short bodies use conditional execution, long bodies use conditional branches.', 'Every false block must end with an unconditional B past the true block.', 'Signed data uses BGT BGE BLT BLE. Unsigned uses BHI BHS BLO BLS.']
  });
})(window);
