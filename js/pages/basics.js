/* Basics deck: flashcards with spaced repetition (Leitner boxes).
   A missed card returns to box 1 and comes back in the same session. A card you know moves up a box and
   waits longer each time. State is stored in Lab.progress.basics as { cardId: { b: box, due: dayNumber } }. */
(function (g) {
  'use strict';
  var Lab = g.Lab, h = Lab.h;

  var T = { org: 'Computer', num: 'Numbers', flag: 'Flags', cond: 'Conditions', shift: 'Shifts and data', mem: 'Memory access', stack: 'Stack and calls', gpio: 'GPIO' };
  var DECK = [
    ['org', 'What does RISC stand for, and what does it mean for ARM?', 'Reduced Instruction Set Computer. A small set of simple instructions, all the same size. Arithmetic works on registers, and only loads and stores touch memory.'],
    ['org', 'How big is a memory with A address bits and D data bits?', '2^A locations of D bits each, so 2^A x D/8 bytes. Example: 24 address bits and an 8-bit bus is 2^24 x 1 byte = 16 MB.'],
    ['org', 'What do 2^10, 2^20 and 2^30 equal?', '2^10 = 1 K (1,024), 2^20 = 1 M (1,048,576), 2^30 = 1 G. For 2^n, split n into tens plus a remainder: 2^24 = 2^4 x 2^20 = 16 M.'],
    ['org', 'What does the PC (R15) always hold?', 'The address of the instruction to be fetched next. It holds an address, never the instruction itself.'],
    ['org', 'How many bytes is one ARM instruction, and how does the PC move?', '4 bytes (32 bits). The PC goes up by 4 after each instruction, unless a branch loads it with a target address.'],
    ['org', 'List the four steps of a memory read cycle.', '1. The CPU puts the address on the address bus. 2. The CPU issues the read signal. 3. The memory puts a copy of the data on the data bus. 4. The CPU reads the data.'],
    ['org', 'List the four steps of a memory write cycle.', '1. The CPU puts the address on the address bus. 2. The CPU puts the data on the data bus. 3. The CPU issues the write signal. 4. The memory stores the data at that address.'],
    ['org', 'What are the three buses, and which way does each carry information?', 'Address bus: one way, CPU to memory. Data bus: both ways. Control bus: carries signals such as read and write.'],
    ['org', 'SRAM against DRAM: how does each store a bit, and what follows from that?', 'SRAM uses a flip-flop: fast, no refresh, bigger and costlier, used for caches. DRAM uses one transistor and a capacitor that leaks: dense and cheap, but needs refreshing.'],
    ['org', 'Put the steps of the CPU cycle in order.', 'Fetch (read the instruction at the PC), decode (work out what it does), execute (do it). Then repeat.'],
    ['num', 'What is little-endian? Where do the bytes of 0x12345678 go at address 0x100?', 'The least significant byte sits at the lowest address. 0x100: 78, 0x101: 56, 0x102: 34, 0x103: 12.'],
    ['num', 'How many bits are in a byte, a halfword and a word on ARM?', '8, 16 and 32.'],
    ['num', 'How do you negate a number in two\'s complement?', 'Invert every bit, then add 1. Equivalent: subtract it from 0.'],
    ['num', 'What is the range of a signed 32-bit number?', '-2^31 to 2^31 - 1, which is 0x80000000 up to 0x7FFFFFFF. Bit 31 is the sign.'],
    ['num', 'How many bits does one hex digit stand for?', '4 bits. So 8 hex digits make 32 bits, and 0xF is 1111.'],
    ['num', 'Which register is which: R13, R14, R15?', 'R13 = SP (stack pointer), R14 = LR (link register), R15 = PC (program counter). R0 to R12 are general purpose.'],
    ['num', 'Must a word address be a multiple of 4? A halfword address a multiple of 2?', 'Yes to both. These are aligned accesses. A byte can sit at any address.'],
    ['flag', 'What do N, Z, C and V stand for?', 'N: negative (bit 31 of the result). Z: zero result. C: carry. V: signed overflow.'],
    ['flag', 'When is C set after an addition? After a subtraction?', 'Addition: when there is a carry out of bit 31 (unsigned overflow). Subtraction: C = 1 means no borrow, which happens when the first number is at least the second (unsigned). Quiz 1\'s key leaves C at 0 in that case, so follow the convention your marker uses.'],
    ['flag', 'When is V set?', 'When the signed result does not fit: both operands have the same sign and the result has the opposite sign. Check V from the operands, not from the result alone.'],
    ['flag', 'Which instructions update the flags?', 'Any data instruction with the S suffix (ADDS, SUBS, MOVS), and CMP, CMN, TST and TEQ always. Without S, the flags are untouched.'],
    ['flag', 'What does CMP R1, R0 do?', 'It computes R1 - R0, sets N Z C V, and discards the result. No register changes.'],
    ['flag', 'What does TST R1, #0x40 do?', 'It ANDs R1 with 0x40, sets N and Z, and discards the result. Z = 1 means the bit was 0.'],
    ['flag', 'If a conditional instruction does not run, what does it change?', 'Nothing. Not the registers and not the flags, even if it has an S.'],
    ['cond', 'Which flags do EQ, NE, MI and PL test?', 'EQ: Z = 1. NE: Z = 0. MI: N = 1. PL: N = 0.'],
    ['cond', 'Which flags do HS (CS), LO (CC), VS and VC test?', 'HS: C = 1. LO: C = 0. VS: V = 1. VC: V = 0.'],
    ['cond', 'Define HI and LS.', 'HI (unsigned higher): C = 1 and Z = 0. LS (unsigned lower or same): C = 0 or Z = 1.'],
    ['cond', 'Define GE, LT, GT and LE.', 'GE: N = V. LT: N is not V. GT: Z = 0 and N = V. LE: Z = 1 or N is not V.'],
    ['cond', 'Which conditions are for signed numbers and which for unsigned?', 'Signed: GT, GE, LT, LE. Unsigned: HI, HS, LO, LS. EQ and NE work for both.'],
    ['cond', 'To skip a body when the condition is R0 > 50, which branch do you use?', 'The opposite condition: BLE. To skip a body, branch on the opposite. Pairs: EQ/NE, GT/LE, GE/LT, HI/LS, HS/LO, MI/PL, VS/VC.'],
    ['shift', 'What do LSL #n, LSR #n and ASR #n do to a number?', 'LSL: multiply by 2^n, zeros come in. LSR: unsigned divide by 2^n, zeros come in. ASR: signed divide by 2^n, the sign bit is copied in.'],
    ['shift', 'What does ROR do, and where is the barrel shifter used?', 'ROR rotates the bits right, and the bits that leave re-enter at the top. The barrel shifter acts on the last operand, for example MOV R0, R1, LSL #2.'],
    ['shift', 'Multiply R1 by 5 with one instruction.', 'ADD R0, R1, R1, LSL #2. That is R1 + 4 x R1.'],
    ['shift', 'What constants can an ARM instruction hold directly?', 'An 8-bit value rotated right by an even amount (0, 2, 4, ... 30 places). Other constants need LDR R0, =value.'],
    ['shift', 'Which is a constant: MOV R1, 5 or MOV R1, #5?', 'MOV R1, #5. The # marks a constant. Without it, 5 is not valid.'],
    ['mem', 'Compare LDR, LDRB, LDRH, LDRSB and LDRSH.', 'LDR: 32-bit word. LDRB: byte, zero-extended. LDRH: halfword, zero-extended. LDRSB and LDRSH: byte or halfword, sign-extended.'],
    ['mem', 'What does LDR R0, [R1, #4] do to R1? What about [R1, #4]! and [R1], #4?', '[R1, #4]: address R1 + 4, R1 unchanged. [R1, #4]!: address R1 + 4, then R1 = R1 + 4. [R1], #4: use R1, then R1 = R1 + 4.'],
    ['mem', 'In LDR R0, [R1, R2, LSL #2], what is shifted?', 'Only the offset R2 is shifted (times 4). R1 and R2 are unchanged unless there is a ! or a post-index.'],
    ['stack', 'On an empty descending stack, what does a push do?', 'Store at the address in SP, then SP = SP - 4. SP always points at the next free slot. A pop does the reverse: SP = SP + 4, then load.'],
    ['stack', 'What do STMED and LDMED do?', 'STMED pushes a register list on an empty descending stack and moves SP down. LDMED pops the list and moves SP up. Use the same list for both.'],
    ['stack', 'In STMED R13!, {R2, R0}, which register goes at the lower address?', 'R0. The lowest-numbered register always goes at the lowest address, whatever order you write the list in.'],
    ['stack', 'What does BL do, and how do you return?', 'BL puts the address of the next instruction in LR (R14) and loads the PC with the target. Return with MOV PC, LR (or BX LR).'],
    ['stack', 'Why must a subroutine that calls another one save LR?', 'The nested BL overwrites LR. Without a saved copy it can no longer return to its own caller.'],
    ['gpio', 'In a direction register, what do 1 and 0 mean?', '1 = output, 0 = input. Set the direction before you drive a pin.'],
    ['gpio', 'How do the SET and CLR registers treat the bits you write?', 'Bits written as 1 change their pin (SET drives high, CLR drives low). Bits written as 0 change nothing, so other pins are safe.'],
    ['gpio', 'A positive-logic switch is on pin 6. After TST R1, #0x40, how do you branch to the pressed code?', 'BNE. Pressed reads 1, so the AND is non-zero and Z = 0. For negative logic (pressed = 0) use BEQ.'],
    ['gpio', 'What is the mask for pin n?', '1 << n. Pin 3 is 0x08, pin 6 is 0x40. Pins 4 and 5 together are 0x30.']
  ].map(function (c, i) { return { id: 'b' + i, t: c[0], q: c[1], a: c[2] }; });

  var BOX_DAYS = [0, 1, 2, 5, 12, 30];
  function today() { return Math.floor(Date.now() / 864e5); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  Lab.basicsDeck = DECK;
  Lab.pages.basics = function (el) {
    Lab.setTitle('Basics deck');
    var S = Lab.progress.basics = Lab.progress.basics || {};
    var state = { topic: 'all', queue: [], total: 0, seen: 0, missed: 0 };
    el.appendChild(h('div', { class: 'lesson-head' }, h('h1', {}, 'Basics deck'),
      h('p', { class: 'lede' }, 'The facts that cost marks on Quiz 1, as flashcards. Answer from memory first, then check. Cards you miss come back sooner. Cards you know come back later.')));
    var chips = h('div', { class: 'seg', role: 'group', 'aria-label': 'Topic' }), summary = h('p', { class: 'muted num' }), slot = h('div', { class: 'practice-slot', 'aria-live': 'polite' });
    el.appendChild(h('div', { class: 'practice-chips' }, chips)); el.appendChild(summary); el.appendChild(slot);

    function cards() { return DECK.filter(function (c) { return state.topic === 'all' || c.t === state.topic; }); }
    function isNew(c) { return !S[c.id]; }
    function isDue(c) { return !S[c.id] || S[c.id].due <= today(); }
    function drawChips() {
      Lab.clear(chips);
      [['all', 'All']].concat(Object.keys(T).map(function (k) { return [k, T[k]]; })).forEach(function (t) {
        chips.appendChild(h('button', { type: 'button', 'aria-pressed': state.topic === t[0] ? 'true' : 'false', onclick: function () { state.topic = t[0]; drawChips(); start(false); } }, t[1]));
      });
    }
    function counts() {
      var cs = cards(), due = cs.filter(function (c) { return !isNew(c) && isDue(c); }).length, nw = cs.filter(isNew).length;
      var known = cs.filter(function (c) { return S[c.id] && S[c.id].b >= 4; }).length;
      summary.textContent = cs.length + ' cards. ' + nw + ' new, ' + due + ' due for review, ' + known + ' well known.';
    }
    function start(all) {
      var cs = cards(), pool = cs.filter(function (c) { return all || isDue(c); });
      var due = shuffle(pool.filter(function (c) { return !isNew(c); })), fresh = shuffle(pool.filter(isNew));
      state.queue = due.concat(fresh).slice(0, 20); state.total = state.queue.length; state.seen = 0; state.missed = 0;
      counts(); show();
    }
    function show() {
      Lab.clear(slot);
      if (!state.queue.length) return done();
      var c = state.queue[0], box = S[c.id] ? S[c.id].b : 0;
      var card = h('div', { class: 'card' }, h('span', { class: 'card-label' }, T[c.t] + (box ? ' · box ' + box : ' · new')),
        h('div', { class: 'q', html: Lab.fmt(c.q) }));
      var ta = h('textarea', { rows: 2, placeholder: 'Say it or write it first, then check.', 'aria-label': 'Your answer' });
      var box2 = h('div'), reveal = h('button', { class: 'btn btn-primary', type: 'button' }, 'Show the answer');
      reveal.addEventListener('click', function () {
        reveal.remove(); ta.readOnly = true;
        box2.appendChild(h('div', { class: 'answer', html: Lab.fmt(c.a) }));
        box2.appendChild(h('div', { class: 'self-grade' }, h('span', {}, 'Did you have it?'),
          h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { grade(c, true); } }, 'Got it'),
          h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { grade(c, false); } }, 'Missed it')));
      });
      card.appendChild(ta); card.appendChild(h('div', { class: 'btn-row', style: { marginTop: '10px' } }, reveal)); card.appendChild(box2);
      slot.appendChild(h('div', { class: 'progress', 'aria-hidden': 'true', style: { marginBottom: '12px' } }, h('i', { style: { width: (state.total ? 100 * state.seen / state.total : 0) + '%' } })));
      slot.appendChild(h('p', { class: 'muted num' }, (state.seen + 1) + ' of ' + state.total + (state.missed ? ', ' + state.missed + ' to retry' : '')));
      slot.appendChild(card);
    }
    function grade(c, ok) {
      var s = S[c.id] || { b: 0, due: 0 };
      state.queue.shift();
      if (ok) { s.b = Math.min(BOX_DAYS.length - 1, (S[c.id] ? s.b : 1) + 1); s.due = today() + BOX_DAYS[s.b]; state.seen++; }
      else { s.b = 1; s.due = today(); state.missed++; state.queue.push(c); }
      S[c.id] = s; Lab.saveProgress(); counts(); show();
    }
    function done() {
      var left = cards().filter(isDue).length;
      slot.appendChild(h('div', { class: 'card' }, h('span', { class: 'card-label' }, 'Session done'),
        h('p', { class: 'q' }, state.total ? 'You went through ' + state.total + ' cards.' : 'Nothing is due in this topic right now.'),
        h('p', { class: 'muted' }, left ? left + ' more are due. Start another round.' : 'Come back tomorrow for the next reviews, or study everything again now.'),
        h('div', { class: 'btn-row' }, left ? h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { start(false); } }, 'Next round') : null,
          h('button', { class: 'btn', type: 'button', onclick: function () { start(true); } }, 'Study all anyway'), h('a', { class: 'btn btn-quiet', href: '#/practice' }, 'Practice questions'))));
    }
    drawChips(); start(false);
  };
})(window);
