/* Handout 03: bit manipulation, bit-field instructions, 64-bit arithmetic. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  Lab.lesson({
    id: 'm3-bits', title: 'Bit tricks and 64-bit arithmetic', minutes: 20, source: 'Handout 03',
    lede: 'Hardware registers are controlled one bit at a time, and numbers bigger than 32 bits need two registers. Both use a handful of instructions you can learn in one sitting.',
    blocks: [
      { predict: { q: 'Which instruction toggles bit 5 of R3 without knowing its current value?', opts: ['`EOR R3, R3, #0x20`', '`ORR R3, R3, #0x20`', '`BIC R3, R3, #0x20`', '`AND R3, R3, #0x20`'], ans: 0, why: 'XOR with 1 flips a bit whatever it was. Without knowing the initial value, a bit can be toggled by XORing it with a 1.' } },
      { h: 'Four jobs, four instructions' },
      { table: { head: ['Job', 'C idiom', 'ARM instruction'], rows: [
        ['Check a bit', '`a & (1 << k)`', '`TST R0, #0x20` (sets Z if the bit is clear)'], ['Set a bit', '`a |= (1 << k)`', '`ORR R0, R0, #0x20`'], ['Clear a bit', '`a &= ~(1 << k)`', '`BIC R0, R0, #0x20`'], ['Toggle a bit', '`a ^= (1 << k)`', '`EOR R0, R0, #0x20`'] ] } },
      { p: 'The mask `1 << k` has a single 1 at bit k. For k = 5 that is `0x20`. `BIC` is exactly "AND with the NOT of the mask", so it is the clear-a-bit instruction. `TST` ANDs the operands, throws the result away, and sets only the flags.' },
      { sim: { title: 'Set, clear, toggle, test bit 5', code: '  MOV R0, #0x00      ; start with nothing set\n  ORR R0, R0, #0x20  ; set bit 5        -> 0x20\n  EOR R0, R0, #0x20  ; toggle bit 5     -> 0x00\n  EOR R0, R0, #0x20  ; toggle again     -> 0x20\n  TST R0, #0x20      ; is it set? Z = 0 means yes\n  BIC R0, R0, #0x20  ; clear bit 5      -> 0x00\nstop B stop' } },
      { ask: { q: 'R2 = `0xF0`. After `EOR R2, R2, #0x20`, what is R2?', a: ['0xD0'], type: 'hex', why: '`0xF0` = 1111 0000. Bit 5 is 1. XOR with the mask 0x20 flips it to 0, giving 1101 0000 = `0xD0`.' } },
      { h: 'Bit fields' },
      { p: '`BFC Rd, #lsb, #width` clears `width` bits starting at bit `lsb`. `BFI Rd, Rn, #lsb, #width` replaces those bits of Rd with the low `width` bits of Rn.' },
      { sim: { title: 'BFC, BFI and RBIT', code: '  LDR R4, =0xFFFFFFFF\n  BFC R4, #8, #12           ; clear bits 8 to 19\n  LDR R2, =0x00000ABC\n  MOV R9, #0\n  BFI R9, R2, #8, #12       ; put the low 12 bits of R2 at bit 8\n  LDR R0, =0x12345678\n  RBIT R1, R0               ; reverse every bit\nstop B stop' } },
      { ask: { q: 'What is R4 after `BFC R4, #8, #12` when R4 = `0xFFFFFFFF`?', a: ['0xFFF000FF'], type: 'hex', why: 'Bits 8 to 19 (12 bits) become 0, leaving `FFF000FF`.' } },
      { p: 'Also useful: `CLZ` counts leading zeros, `REV` reverses the bytes, and `MVN` complements every bit. In the slides, `RBIT` of `0x12345678` gives `0x1E6A2C48`, which the simulator reproduces.' },
      { h: '64-bit arithmetic with two registers' },
      { p: 'A register holds 32 bits, so a 64-bit integer needs two. Add the low halves with `ADDS`, which sets the carry, then add the high halves with `ADC`, which includes it. Subtraction uses `SUBS` then `SBC`.' },
      { sim: { title: '0x00000002FFFFFFFF + 0x0000000400000001', code: '  LDR  r0, =0xFFFFFFFF  ; A low\n  LDR  r1, =0x00000002  ; A high\n  LDR  r2, =0x00000001  ; B low\n  LDR  r3, =0x00000004  ; B high\n  ADDS r4, r2, r0       ; low words, sets C\n  ADC  r5, r3, r1       ; high words plus C\nstop B stop' } },
      { ask: { q: 'In that example, what does r5 (the high word of the sum) hold?', a: ['0x00000007', '7', '0x7'], type: 'hex', why: 'The low words `FFFFFFFF + 00000001` give `00000000` with a carry. The high words are `00000002 + 00000004 + carry 1 = 7`. So the sum is `0x0000000700000000`.' } },
      { slide: 'Handout 03 slide 29 writes `LDR r0, =0xFFFFFFFFF` with nine Fs. Eight Fs make 32 bits. Slide 34 says `MOV r1, SP` copies "SP (r14)", but SP is r13.' },
      { quiz: { id: 'm3-bits', title: 'Check yourself', qs: [
        { kind: 'mcq', q: 'Which clears bits without changing others?', opts: ['BIC', 'ORR', 'EOR', 'MOV'], ans: 0, why: 'BIC = bit clear: AND with NOT the mask.' },
        { kind: 'mcq', q: 'Which tests a bit and changes no register?', opts: ['TST', 'AND', 'ORR', 'MVN'], ans: 0, why: 'TST sets flags only.' },
        { kind: 'mcq', q: 'To add two 64-bit numbers you use...', opts: ['ADDS on the low words then ADC on the high words', 'ADD twice', 'MUL', 'ADDS twice'], ans: 0, why: 'ADC includes the carry from the low half.' } ] } }
    ],
    takeaways: ['Check: TST. Set: ORR. Clear: BIC. Toggle: EOR. The mask is 1 << k.', 'BFC clears a bit field, BFI inserts one, RBIT reverses all bits, CLZ counts leading zeros.', '64-bit add: ADDS (low) then ADC (high). Subtract: SUBS then SBC.']
  });
})(window);
