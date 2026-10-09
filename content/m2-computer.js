/* Module 2, Part II: the three boxes and the three buses. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  Lab.lesson({
    id: 'm2-computer', title: 'The three boxes and the three buses', minutes: 14, source: 'Module 2, Part II',
    lede: 'Every computer in this course is the same picture: a CPU, a memory and some input/output, joined by wires. Get this picture right and the rest of the term hangs off it.',
    blocks: [
      { predict: { q: 'A processor has a **16-bit address bus** and an **8-bit data bus**. How much memory can it address, and how many memory transactions does it take to read one 32-bit value?', opts: ['64 KiB, and 4 transactions', '16 KiB, and 2 transactions', '64 KiB, and 1 transaction', '256 bytes, and 4 transactions'], ans: 0,
        why: '16 address wires give 2^16 = 65,536 bytes = 64 KiB. An 8-bit data bus moves one byte per transfer, so a 32-bit (4-byte) value needs four transactions. Narrow data buses cost speed: the same code runs four times as many bus cycles.' } },
      { h: 'Three boxes' },
      { p: 'A computer system has three main parts: the **CPU** (processor), the **memory**, and **input/output (I/O)** devices. They are joined by a **system bus**. A bus is just a group of wires that carry related signals.' },
      { h: 'Three buses' },
      { table: { head: ['Bus', 'Carries', 'Direction', 'What its width decides'], rows: [
        ['Address bus', 'Which location', 'One way: CPU to memory', 'How many bytes the processor can name'],
        ['Data bus', 'The value itself', 'Both ways', 'How many bytes move per transfer'],
        ['Control bus', 'What kind of transaction', 'Mostly from the CPU', 'Not a number of bytes. A set of signals'] ] } },
      { p: 'Typical **control signals** are memory read, memory write, I/O read, I/O write, interrupt request (IRQ), interrupt acknowledge, bus request and bus grant. When the processor writes to memory, the memory write signal is asserted. When it reads from an I/O device, the I/O read signal is asserted.' },
      { say: 'Address width sets how much memory you can **name**. Data width sets how much you can **move at once**. They are independent: the address bus says where, the data bus says what.' },
      { ask: { q: 'A processor has a 20-bit address bus. How many bytes can it address? Give a number of bytes (for example 4096).', a: ['1048576', '1,048,576'], type: 'text', why: '2^20 = 1,048,576 bytes, which is 1 MiB.', hint: 'It is 2 to the power of the number of address lines.' } },
      { ask: { q: 'A processor has a 12-bit address bus. How many bytes can it address?', a: ['4096', '4,096'], type: 'text', why: '2^12 = 4,096 bytes = 4 KiB.' } },
      { warn: 'Quiz 1 uses a slightly different formula: **memory size = 2^(address bits) x data bus width in bytes**. It treats each address as holding one data-bus-width unit. With an 8-bit data bus the two agree, so 24 address bits is 16 MB either way. With a wider data bus they differ (a byte-addressable 32-bit machine still names 2^A bytes). Use the formula the question\'s wording points to, and read the data bus width before you answer.' },
      { ask: { q: 'Quiz-style: a memory has a 24-bit address bus and an 8-bit data bus. How many megabytes is it?', a: ['16', '16 MB'], type: 'text', why: '2^24 = 16 M locations x 1 byte = 16 MB. Split 24 into 20 + 4: 2^20 = 1 M and 2^4 = 16.' } },
      { ask: { q: 'Quiz-style: a memory has a 16-bit address bus and a 16-bit data bus. How many kilobytes is it?', a: ['128', '128 KB'], type: 'text', why: '2^16 = 64 K locations x 2 bytes = 128 KB. A wider data bus multiplies the size.' } },
      { h: 'Address space is not installed memory' },
      { p: 'The ARM processor in this course has a **32-bit address bus**, so it can name 2^32 bytes, which is **4 GiB**. This is the **memory address space**. It is a ceiling, not a statement about how much memory you have. Your TM4C123 has a 32-bit address bus and a 4 GiB address space, but only 32 KiB of RAM. The rest of the space holds flash, peripheral registers, and a great deal of nothing.' },
      { predict: { q: 'Your board names 4 GiB of address space and has 32 KiB of RAM. What fills the other addresses?', opts: ['Flash, peripheral registers and unused space', 'More RAM that is hidden', 'Nothing can use those addresses', 'A copy of the RAM repeated many times'], ans: 0, why: 'Flash (256 KiB), the peripherals you control with registers, and a lot of unpopulated address space. Installed memory is always less than or equal to the address space.' } },
      { slide: 'Module 2 page 4 says "the ARM processor has a 32-bit address bus and a 16-bit data bus". That is not true of the Cortex-M4 on your board, which has a 32-bit data bus. Treat it as a generic teaching example, and note it when you answer a bus-width question using the slide\'s figures.' },
      { h: 'When two things want memory at once' },
      { p: 'If the processor and an I/O device both want memory at the same moment, only one gets the bus and the other waits until the bus cycle is over. This is **bus contention**, and many modern computer-organisation tricks exist to reduce it.' },
      { h: 'Where do the instructions come from?' },
      { p: 'Module 2 asks four questions. Here are the answers it gives.' },
      { list: ['**How does the hardware understand software?** You write C or assembly. A compiler or assembler translates it into machine-language instructions the processor understands.', '**Who puts instructions in memory?** On a PC, the operating system loads the program. On a bare microcontroller, they are already in flash.', '**How does the processor know where they are?** The address of the first instruction is held in a special register, the **program counter (PC)**.'] },
      { quiz: { id: 'm2-computer', title: 'Check yourself', qs: [
        { kind: 'mcq', q: 'Which bus runs one way only?', opts: ['Address bus', 'Data bus', 'Both', 'Neither'], ans: 0, why: 'The CPU asks and memory listens. The data bus has to carry data both ways because the CPU both reads and writes.' },
        { kind: 'mcq', q: 'The address bus is 32 bits wide and the data bus is 8 bits wide. How many transactions does a 32-bit value need?', opts: ['4', '1', '2', '8'], ans: 0, why: 'The data bus moves 1 byte per transfer and the value is 4 bytes.' },
        { kind: 'mcq', q: 'Which determines how many bytes the processor can address?', opts: ['The width of the address bus', 'The width of the data bus', 'The clock speed', 'The size of the cache'], ans: 0, why: 'Address width sets the memory address space.' },
        { kind: 'mcq', q: 'What does the control bus carry?', opts: ['The type of transaction, such as memory read or write', 'The memory address', 'The data value', 'The clock'], ans: 0, why: 'Memory read/write, I/O read/write, IRQ, bus request and bus grant are control signals.' } ] } }
    ],
    takeaways: ['CPU, memory and I/O are joined by an address bus, a data bus and a control bus.', 'Address width sets how much you can name (2^n bytes). Data width sets how much moves per transfer.', 'Address space is a ceiling. Installed memory is always less than or equal to it.', 'The PC holds the address of the first (then the next) instruction.']
  });
})(window);
