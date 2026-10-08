/* Endianness and alignment. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  Lab.lesson({
    id: 'm2-endian', title: 'Endianness and alignment', minutes: 12, source: 'Module 2 and Module 3',
    lede: 'A 32-bit value is four bytes, and memory holds one byte per address. Which byte goes first? ARM has an answer, and most indexing marks are lost by getting it backwards.',
    blocks: [
      { predict: { q: 'The 32-bit value `0xF498B70F` is stored at address 100. On a little-endian machine, which byte sits at address 100?', opts: ['`0F`, the least significant byte', '`F4`, the most significant byte', '`98`', '`B7`'], ans: 0, why: 'Little-endian puts the **least significant byte at the lowest address**. Mnemonic: the little end comes first.' } },
      { h: 'Two conventions' },
      { say: '**Little-endian**: the least significant byte goes at the lowest address. **Big-endian**: the most significant byte goes at the lowest address. ARM is little-endian by default (it can be configured big-endian). Either way, you name the whole value by its **lowest** address.' },
      { widget: { name: 'endian', title: 'Same word, two layouts' } },
      { slide: 'Endianness is about **byte** order only. It never changes the order of bits inside a byte.' },
      { h: 'Reading a memory table' },
      { p: 'A question gives you a memory table and asks what a word load produces. You must read the bytes **backwards**, from the highest address down to the lowest. This is where most marks are lost.' },
      { ask: { q: 'Memory holds `0x20008000 = EE`, `0x20008001 = 8C`, `0x20008002 = 90`, `0x20008003 = A7`. What does `LDR R1, [R0]` load with R0 = `0x20008000` on a little-endian ARM?', a: ['0xA7908CEE'], type: 'hex', why: 'Read from the highest address down: A7 90 8C EE, so `0xA7908CEE`. A big-endian machine would give `0xEE8C90A7` from the same bytes. This is the example in Module 3 page 12.', hint: 'Backwards: start with the byte at 0x20008003.' } },
      { h: 'Alignment' },
      { p: 'A word (4 bytes) can only be stored at an address **divisible by 4**. A halfword (2 bytes) only at an address divisible by 2. The address of a multi-byte value is the **lowest** of its byte addresses.' },
      { predict: { q: 'Which of these is a legal address for a **word** in the course?', opts: ['`0x20000008`', '`0x20000002`', '`0x20000001`', '`0x20000006`'], ans: 0, why: 'Only 0x20000008 is divisible by 4. 0x20000002 and 0x20000006 are only divisible by 2 (fine for halfwords). 0x20000001 is neither.' } },
      { quiz: { id: 'm2-endian', title: 'Check yourself', qs: [
        { kind: 'input', type: 'hex', q: 'Bytes at addresses 0, 1, 2, 3 are `78 56 34 12`. Little-endian word at address 0?', a: ['0x12345678'], why: 'Read from address 3 down: 12 34 56 78.' },
        { kind: 'mcq', q: 'ARM is...', opts: ['Little-endian by default', 'Big-endian only', 'Always configurable at run time by the program', 'Neither'], ans: 0, why: 'Little-endian by default. It can be made big-endian by configuration.' },
        { kind: 'mcq', q: 'Is a halfword access at `0x20000001` allowed in the course?', opts: ['No, a halfword needs an even address', 'Yes', 'Only for loads', 'Only for stores'], ans: 0, why: 'Halfword addresses must be divisible by 2.' } ] } }
    ],
    takeaways: ['Little-endian: the least significant byte is at the lowest address (ARM default).', 'Read a memory table backwards to get the word.', 'Word address divisible by 4, halfword by 2.', 'Endianness is byte order, never bit order.']
  });
})(window);
