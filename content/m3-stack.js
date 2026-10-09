/* Handout 03 Part 4: the stack, STMED and LDMED, and subroutines. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  var NESTED = '  LDR SP, =0x00340080     ; the stack pointer starts here\n  MOV R0, #1\n  MOV R1, #2\n  MOV R2, #3\n  BL sub1                 ; call sub1\n  ADD R3, R0, R1          ; R0 and R1 must still be 1 and 2\n  B stop\nsub1 STMED SP!, {R0-R2, LR}   ; save the work registers and the return address\n  MOV R0, #9\n  MOV R1, #8\n  BL sub2                 ; a nested call overwrites LR, so LR was saved first\n  LDMED SP!, {R0-R2, LR}  ; restore everything\n  MOV PC, LR              ; return to the caller\nsub2 STMED SP!, {R0, LR}\n  ADD R0, R0, R1\n  LDMED SP!, {R0, LR}\n  MOV PC, LR\nstop B stop';

  Lab.lesson({
    id: 'm3-stack', title: 'The stack and subroutines', minutes: 30, source: 'Handout 03 Part 4',
    lede: 'A stack is a region of memory with one open end. It lets a subroutine borrow registers, call another subroutine, and hand everything back untouched.',
    blocks: [
      { predict: { q: 'A subroutine uses R0, R1 and R2 for its own work. The caller was keeping values in them. Where can the subroutine park the caller\'s values so it can restore them before returning?', opts: ['In the stack, in memory', 'In the flags', 'In the PC', 'It cannot, so the caller must always avoid R0 to R2'], ans: 0, why: 'There are only 16 registers and a subroutine needs some of them. Memory is plentiful. The stack is the agreed place to park register values and take them back in the reverse order.' } },
      { h: 'What a stack is' },
      { say: 'A stack is last in, first out, like a pile of plates. You only ever touch the top plate. Push puts a new value on top. Pop takes the top value off.' },
      { p: 'In memory, a stack is a block of consecutive addresses plus one register that remembers where the top is. On ARM that register is **R13**, called the **stack pointer** (SP). The stack **grows downward**: a push moves SP to a lower address. The operating system sets SP before your program starts.' },
      { p: 'The course uses an **empty descending** stack. "Empty" means SP points at the **next free slot**, the one just below the last value pushed. "Descending" means it grows toward lower addresses.' },
      { table: { head: ['Operation', 'What happens (empty descending)'], rows: [['Push', 'Store the value at the address in SP, then SP = SP - 4'], ['Pop', 'SP = SP + 4, then load the value from the address in SP']] } },
      { slide: 'The slides describe `PUSH` and `POP` with sources like "a register or an immediate value". That is the style of other processors. On ARM, `PUSH` and `POP` take a **register list** only, and they are the full descending pair (decrement first, then store). The course uses `STMED` and `LDMED` for its empty descending stack, so write those when the question says "empty descending".' },
      { h: 'Watching one push' },
      { sim: { title: 'Three pushes with STMED, then three pops with LDMED', code: '  LDR SP, =0x00340080\n  MOV R1, #0x11\n  MOV R2, #0x22\n  MOV R3, #0x33\n  STMED SP!, {R1}      ; push R1\n  STMED SP!, {R2}      ; push R2\n  STMED SP!, {R3}      ; push R3\n  MOV R1, #0\n  MOV R2, #0\n  MOV R3, #0\n  LDMED SP!, {R3}      ; pop: R3 comes back first\n  LDMED SP!, {R2}\n  LDMED SP!, {R1}\nstop B stop', memBase: 0x00340060, watch: ['R1', 'R2', 'R3', 'R13'] } },
      { p: 'Step through it and watch SP. It drops by 4 on each push and rises by 4 on each pop. The values come back in the reverse order. That reversal is the whole point of a stack.' },
      { h: 'Saving several registers at once' },
      { p: '`STMED R13!, {R0-R2, R14}` stores a whole list in one instruction. `LDMED R13!, {R0-R2, R14}` takes them back. The `!` means SP is updated. The `-` is a range, so `R0-R2` is R0, R1 and R2.' },
      { warn: 'The order you write the registers in the braces does not matter. The hardware always stores the **lowest-numbered register at the lowest address**. `{R0, R1}` and `{R1, R0}` are the same instruction.' },
      { predict: { q: 'SP is `0x00340080`. You run `STMED R13!, {R0-R2, R14}`. What is SP afterwards?', opts: ['0x00340070', '0x00340074', '0x0034008C', '0x00340080'], ans: 0, why: 'Four registers, four bytes each, is 16 bytes (0x10). The stack grows down, so SP becomes 0x00340080 - 0x10 = 0x00340070.' } },
      { faded: { title: 'Where did each register go?', intro: 'SP = `0x00340080` before `STMED R13!, {R0-R2, R14}` on an empty descending stack. Remember the first store goes to the address SP holds, and the highest-numbered register is stored first.', parts: [
        { text: 'R14 is stored first, at the address SP held.' }, { label: 'Address of R14', type: 'hex', ans: '0x00340080', ph: '0x........' },
        { label: 'Address of R2', type: 'hex', ans: '0x0034007C', ph: '0x........' },
        { label: 'Address of R1', type: 'hex', ans: '0x00340078', ph: '0x........' },
        { label: 'Address of R0', type: 'hex', ans: '0x00340074', ph: '0x........' },
        { label: 'SP afterwards', type: 'hex', ans: '0x00340070', ph: '0x........' }
      ], why: 'R14 sits at 0x340080, then R2, R1 and R0 each 4 lower. SP ends up at the next free slot, 0x340070. After the matching `LDMED`, SP is back at 0x340080.' } },
      { sim: { title: 'Check it: the same registers, in the simulator', code: '  LDR SP, =0x00340080\n  MOV R0, #0xA0\n  MOV R1, #0xA1\n  MOV R2, #0xA2\n  MOV LR, #0xAE\n  STMED SP!, {R0-R2, LR}\nstop B stop', memBase: 0x00340060, watch: ['R0', 'R1', 'R2', 'R13', 'R14'] } },
      { h: 'Subroutines' },
      { p: 'A subroutine is a block of code you can run from anywhere. The caller uses **BL** (branch with link). It does two things: it saves the address of the next instruction in **R14**, the link register (LR), and it loads the PC with the subroutine\'s address. To return, the subroutine copies LR back into the PC, for example `MOV PC, LR`.' },
      { code: '  BL sub1          ; LR = address of the next line, PC = sub1\n  ADD R0, R1, R2   ; runs after sub1 returns\n  B stop\nsub1 ADD R1, R1, #1\n  MOV PC, LR       ; return to the caller\nstop B stop', run: true },
      { h: 'Why the stack matters here' },
      { list: ['**Preserve the caller\'s registers.** A good subroutine changes nothing the caller can see, except the result it hands back. It saves any register it uses and restores it before returning.', '**Preserve LR when you call another subroutine.** A second `BL` overwrites LR with a new return address. If the first return address was not saved, the subroutine can no longer return to its own caller.'] },
      { code: 'sub1 STMED R13!, {R0-R2, R14}   ; push work registers and the link register\n  ...                            ; free to use R0-R2 and to call others\n  BL   sub2\n  ...\n  LDMED R13!, {R0-R2, R14}       ; pop them back\n  MOV  PC, R14                   ; return', run: false },
      { sim: { title: 'Nested calls: sub1 calls sub2', code: NESTED, showPC: true, memBase: 0x00340060, watch: ['R0', 'R1', 'R2', 'R3', 'R13', 'R14'] } },
      { p: 'Step through and watch SP. It drops when `sub1` saves its registers and drops again when `sub2` does, then climbs back as each one restores. At the end R0 is 1 and R1 is 2 again, so R3 is 3, even though both subroutines overwrote them.' },
      { tip: 'Delete the `LR` from sub1\'s save list and run it again. The program never returns to `main` correctly, because the `BL sub2` replaced the only copy of the return address.' },
      { h: 'The stack during nesting' },
      { p: 'When `main` calls `sub1` and `sub1` calls `sub2`, each subroutine pushes its own block. Looking from the highest address down, you find the block for `sub1` (including its saved LR, which points back into `main`), then the block for `sub2` (including its saved LR, which points back into `sub1`). SP always sits just below the newest block. Returning pops blocks in the reverse order, which is the order the return addresses are needed.' },
      { h: 'Exercises' },
      { reveal: { q: 'SP is `0x00340080`. A subroutine runs `STMED R13!, {R4, R5, R14}` and then calls another subroutine that runs `STMED R13!, {R0-R3}`. What is SP inside the second subroutine?', rows: 3, answer: 'First save: 3 registers is 12 bytes (0xC), so SP = 0x00340080 - 0xC = **0x00340074**.<br>Second save: 4 registers is 16 bytes (0x10), so SP = 0x00340074 - 0x10 = **0x00340064**.' } },
      { reveal: { q: 'Write the first and last instructions of a subroutine that uses R4, R5 and R6 for its own work, and calls no other subroutine. Use the empty descending stack.', rows: 4, answer: '<pre><code>sub  STMED R13!, {R4-R6}   ; save the registers it will change\n  ...\n  LDMED R13!, {R4-R6}   ; restore them\n  MOV   PC, LR          ; return</code></pre>LR is not saved because this subroutine never calls another one, so LR still holds its caller\'s return address when it returns.' } },
      { reveal: { q: 'A subroutine saves its registers with `STMED R13!, {R0-R2, R14}` and restores with `LDMED R13!, {R0-R2}`. What goes wrong?', rows: 3, answer: 'The save pushes 4 registers (16 bytes) but the restore pops only 3 (12 bytes), so SP finishes **4 bytes below** where it started. R14 is also never restored, so `MOV PC, R14` jumps to whatever R14 holds at that moment. A save list and its matching restore list must name the same registers.' } },
      { quiz: { id: 'm3-stack', title: 'Check yourself', qs: [
        { kind: 'mcq', q: 'On an empty descending stack, a push does what?', opts: ['Stores at SP, then lowers SP by 4', 'Lowers SP by 4, then stores at SP', 'Raises SP by 4, then stores', 'Stores at SP and leaves SP alone'], ans: 0, why: 'Empty means SP points at a free slot, so the value goes there first. Then SP moves down to the next free slot.' },
        { kind: 'mcq', q: 'Which register is the link register?', opts: ['R14', 'R13', 'R15', 'R0'], ans: 0, why: 'R13 is SP, R14 is LR and R15 is the PC.' },
        { kind: 'mcq', q: 'What does BL do?', opts: ['Saves the return address in LR and branches', 'Branches only', 'Pushes the PC on the stack', 'Loads a byte'], ans: 0, why: 'BL puts the address of the next instruction in R14 and loads the PC with the target. It does not touch the stack.' },
        { kind: 'mcq', q: 'Why must a subroutine that calls another one save LR?', opts: ['The second BL overwrites LR', 'LR is a flag', 'The stack needs it', 'The assembler requires it'], ans: 0, why: 'LR holds only one return address. A nested BL replaces it.' },
        { kind: 'input', q: 'SP = 0x00340080. After `STMED R13!, {R0-R2, R14}`, what is SP? (hex)', type: 'hex', a: ['0x00340070'], why: 'Four registers is 16 bytes, so SP drops by 0x10.' },
        { kind: 'mcq', q: 'In `STMED R13!, {R2, R0}`, which register ends up at the lower address?', opts: ['R0', 'R2', 'They share one', 'The one written first'], ans: 0, why: 'The lowest-numbered register always goes at the lowest address, whatever order you write the list in.' } ] } }
    ],
    takeaways: ['SP is R13. The course stack is empty descending: store at SP, then move SP down by 4.', 'STMED pushes a register list, LDMED pops it. The lowest-numbered register sits at the lowest address.', 'BL saves the return address in R14 and branches. MOV PC, LR returns.', 'Save LR before any nested BL, and restore with the same register list.']
  });
})(window);
