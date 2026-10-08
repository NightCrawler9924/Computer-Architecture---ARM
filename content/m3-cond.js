/* Conditional execution. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  Lab.lesson({
    id: 'm3-cond', title: 'Conditional execution', minutes: 28, source: 'Module 3 Part 1, Homework 1 Problem 3',
    lede: 'Every ARM instruction can be made conditional. That one idea is the heart of Homework 1 Problem 3, and the rule that skipped instructions change nothing is where marks are lost.',
    blocks: [
      { predict: { q: 'The flags are N = 1, Z = 0, V = 0. The instruction `ADDGTS R1, R0, R2` is skipped. What happens to the flags?', opts: ['Nothing, they stay as they were', 'They are updated from R0 + R2', 'They are cleared', 'Z is set'], ans: 0, why: 'GT needs Z = 0 AND N = V. N = 1 and V = 0 differ, so GT is false and the instruction is skipped. A skipped instruction does nothing at all, **even if it has an S**.' } },
      { h: 'Reading a conditional instruction' },
      { p: '`ADDGTS R1, R0, R2` has three pieces bolted together: the operation `ADD`, the condition `GT`, and the `S`. (The modern spelling `ADDSGT` puts S first. This course and this site accept both.)' },
      { say: '1. Look at the **current** flags. 2. Test the condition. 3. If **false**: nothing happens, **no flags change**. 4. If **true**: do the operation, and **only if S is present** update the flags from the result.' },
      { h: 'The conditions' },
      { widget: { name: 'condExplorer', title: 'Which conditions pass?' } },
      { p: 'You do not need to memorise this. The **signed** comparisons (GE, LT, GT, LE) read **N against V**: if N = V no overflow corrupted the sign, so the sign can be trusted. The **unsigned** comparisons (HI, HS, LO, LS) read **C**, because C is the unsigned flag. "Or equal" adds a Z term. So GT = GE and not EQ, and LE = LT or EQ.' },
      { slide: 'Module 3 page 3 says a GT instruction completes "if and only if the N flag is cleared". GT is **Z = 0 and N = V**. N clear alone is not enough. The condition table on the Homework 1 formula sheet (page 4) is the right one.' },
      { h: 'Worked trace' },
      { sim: { title: 'CMP, then a conditional ADDGTS', code: '  MOV R0, #5\n  MOV R2, #3\n  MOV R1, #0\n  CMP    R0, R2        ; 5 - 3: N=0 Z=0 C=1 V=0\n  ADDGTS R1, R0, R2    ; GT is true, so it runs and S overwrites the flags\nstop B stop', showPC: true } },
      { p: 'Notice that **C changed from 1 to 0** on the last line. The S on the conditional instruction overwrote the comparison\'s flags. If a later line tested `CS`, it would now see C = 0 and be skipped. Track the flags line by line.' },
      { h: 'Your turn: a trace table' },
      { widget: { name: 'calcTrace', title: 'Trace these three lines (all flags start clear)', opts: { regs: { R0: 2, R1: 7 }, code: '  CMP R0, R1\n  ADDLTS R0, R0, R1\n  SUBGES R1, R1, R0', show: ['R0', 'R1'] } } },
      { h: 'Homework 1, Problem 3' },
      { p: 'Initial flags **CVZN = 1100**, so C = 1, V = 1, Z = 0, N = 0. R0 = `0xFED46A34`, R1 = `0xEFFD3456`, R2 = `0x7865432A`. Give the registers and flags after each instruction.' },
      { widget: { name: 'calcTrace', title: 'The conditional chain', opts: { regs: { R0: 0xFED46A34, R1: 0xEFFD3456, R2: 0x7865432A }, flags: { N: 0, Z: 0, C: 1, V: 1 }, code: '  CMP R0, R2\n  CMPGTS R2, R0\n  ADDGTS R1, R0, R2\n  SUBCS R0, R2', show: ['R0', 'R1', 'R2'] } } },
      { slide: 'The initial CVZN = 1100 is a red herring: the first CMP overwrites all four flags before any condition is tested. The homework writes the flags as CNZV in Problem 1 and CVZN in Problems 2 and 3. This site always writes N Z C V.' },
      { h: 'Chaining comparisons' },
      { p: 'Both of these implement `if ((R0 == R1) && (R2 == R3)) R4++`. The right-hand version is three instructions and no branches:' },
      { sim: { title: 'CMPEQ chains a second test', code: '  MOV R0, #5\n  MOV R1, #5\n  MOV R2, #9\n  MOV R3, #9\n  MOV R4, #0\n  CMP   R0, R1\n  CMPEQ R2, R3    ; only runs if the first compare was equal\n  ADDEQ R4, R4, #1\nstop B stop' } },
      { p: '`CMPEQ` means "do this comparison only if the previous one was equal". If the first comparison failed, the second never runs, Z stays 0, and the `ADDEQ` is skipped too.' },
      { quiz: { id: 'm3-cond', title: 'Check yourself', qs: [
        { kind: 'mcq', q: 'GT is true when...', opts: ['Z = 0 and N = V', 'N = 0', 'C = 1 and Z = 0', 'N is not equal to V'], ans: 0, why: 'GT = Z clear and N equals V.' },
        { kind: 'mcq', q: 'A conditional instruction with S whose condition is true...', opts: ['Runs and overwrites the flags', 'Runs and leaves the flags alone', 'Is skipped', 'Updates only N and Z'], ans: 0, why: 'Condition true and S present: it runs and updates the flags.' },
        { kind: 'mcq', q: 'HS is the same as...', opts: ['CS (C = 1)', 'CC', 'GE', 'MI'], ans: 0, why: 'CS and HS are two names for the same condition.' } ] } }
    ],
    takeaways: ['Condition false: nothing happens, flags untouched. True with S: runs and overwrites the flags. True without S: runs, flags unchanged.', 'GT is Z = 0 and N = V. Signed comparisons read N and V, unsigned read C and Z.', 'Write the flags down after every line.']
  });
})(window);
