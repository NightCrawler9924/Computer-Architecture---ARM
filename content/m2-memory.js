/* Module 2: memory. Organisation, read and write cycles, SRAM and DRAM, the hierarchy. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  Lab.lesson({
    id: 'm2-memory', title: 'Memory: bytes, RAM and the hierarchy', minutes: 20, source: 'Module 2, Part II',
    lede: 'Memory is a long row of numbered bytes. This lesson covers how the processor reads and writes them, why DRAM works the way it does, and why a computer needs several kinds of memory at once.',
    blocks: [
      { h: 'A row of numbered bytes' },
      { p: 'Memory is built from billions of tiny switches, each holding a **bit**. Eight bits make a **byte**, and each byte has a sequence number starting at 0, its **address**. That is **byte-addressable memory**. A 32-bit address bus names addresses `0x00000000` up to `0xFFFFFFFF`.' },
      { p: 'Memory supports two operations, **read** and **write**. Both need an address. A write also needs the value to store.' },
      { predict: { q: 'Which of these is true?', opts: ['Reading a location destroys its contents and writing does not', 'Reading is non-destructive, and writing destroys the old contents', 'Both reading and writing destroy the contents', 'Neither changes anything'], ans: 1, why: 'You can read a location as many times as you like without changing it. A write replaces the old value, so the old contents are gone. (DRAM cells are a special case at the circuit level, covered below, but the logical rule is this one.)' } },
      { h: 'A read and a write, step by step' },
      { widget: { name: 'buses', title: 'Memory cycles' } },
      { p: 'Notice the asymmetry. A **write** has to put the data on the data bus before asserting the write signal, and nothing useful comes back. A **read** has a wait in the middle, the **access time**, and the data comes back on the data bus.' },
      { predict: { q: 'In a **write** cycle, who drives the data bus?', opts: ['The CPU', 'The memory', 'The I/O controller', 'Nobody, it is idle'], ans: 0, why: 'For a write the CPU supplies the value. For a read, memory drives the data bus and the CPU samples it.' } },
      { h: 'Access time versus cycle time' },
      { p: '**Access time** is how long you wait for data after asking. That is latency. **Cycle time** is the minimum gap between the start of one operation and the start of the next. That is throughput. Cycle time is always at least as large as access time.' },
      { h: 'SRAM and DRAM' },
      { p: 'The difference between the two comes from one design decision: **what physically holds the bit**.' },
      { table: { head: ['', 'SRAM', 'DRAM'], rows: [
        ['Holds a bit in', 'A flip-flop (about six transistors)', 'One capacitor'], ['Needs refresh', 'No', 'Yes, about every 64 ms'], ['Reading a bit', 'Does not disturb it', 'Destroys it, so a restore cycle must follow'],
        ['Cycle time', 'About equal to access time', 'About twice the access time'], ['Density and cost', 'Low density, expensive', 'High density, cheap'], ['Used for', 'Caches and registers', 'Bulk main memory'] ] } },
      { p: 'You should be able to derive the DRAM facts, not memorise them. A capacitor leaks, so it must be refreshed. Testing whether it is charged uses up the charge, so every read needs a restore, which is why cycle time is about twice access time. Try it:' },
      { widget: { name: 'dram', title: 'One DRAM cell' } },
      { ask: { q: 'A DRAM has an access time of 20 ns. Roughly what is its cycle time, in ns?', a: ['40', '40 ns', '40ns'], type: 'text', why: 'About twice the access time: 40 ns. Each read destroys the charge and a restore cycle must follow before the next access.' } },
      { ask: { q: 'With that 20 ns access time and a 40 ns cycle time, how many reads per second (in millions) can it sustain back to back?', a: ['25', '25 million', '25000000'], type: 'text', why: 'One read per 40 ns is 25 million reads per second, not the 50 million the access time alone suggests. Access time tells you latency. Cycle time tells you throughput.', hint: '1 second divided by 40 ns.' } },
      { h: 'Registers and the hierarchy' },
      { p: 'No single technology is fast, large and cheap at once, so computers stack several. Registers sit inside the CPU, are built from flip-flops, and are read or written in a fraction of a cycle. Because they are fast and large per bit, we only have a few of them.' },
      { diagram: 'hierarchy' },
      { predict: { q: 'Going from main memory (DRAM) to disk, access time gets roughly...', opts: ['100 times slower (hundreds of cycles to tens of thousands)', '2 times slower', 'The same', 'Faster, because disks are bigger'], ans: 0, why: 'From hundreds of cycles to tens of thousands is about a hundred times. The gap from register to disk is about five orders of magnitude, and that gap is why the hierarchy exists.' } },
      { quiz: { id: 'm2-memory', title: 'Check yourself', qs: [
        { kind: 'mcq', q: 'Why does DRAM need to be refreshed?', opts: ['Capacitors leak their charge', 'The flip-flops overheat', 'Reads are slow', 'The address changes'], ans: 0, why: 'A charged capacitor slowly loses its charge, so each bit must be rewritten roughly every 64 ms.' },
        { kind: 'mcq', q: 'Why is DRAM cycle time about twice its access time?', opts: ['A read destroys the charge, so a restore cycle follows', 'It has two clocks', 'The address is sent twice', 'It refreshes on every read'], ans: 0, why: 'Destructive read, then restore.' },
        { kind: 'mcq', q: 'Which memory is used for caches?', opts: ['SRAM', 'DRAM', 'Flash', 'Tape'], ans: 0, why: 'SRAM is fast and needs no refresh.' },
        { kind: 'mcq', q: 'How many steps are in a typical memory read cycle in the module?', opts: ['5', '3', '7', '2'], ans: 0, why: 'Address, read signal, wait, read the data, drop the signal.' } ] } }
    ],
    takeaways: ['Memory is byte-addressable. Read is non-destructive, write destroys the old value.', 'Access time is latency, cycle time is throughput. DRAM cycle time is about twice access time.', 'SRAM uses flip-flops (fast, no refresh). DRAM uses capacitors (dense, cheap, refresh about every 64 ms, destructive read).', 'The hierarchy exists because nothing is fast, big and cheap together.']
  });
})(window);
