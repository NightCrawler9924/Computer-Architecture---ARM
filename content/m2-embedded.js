/* Module 2, Part I: introduction to embedded systems. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  Lab.lesson({
    id: 'm2-embedded', title: 'What an embedded system is', minutes: 14, source: 'Module 2, Part I',
    lede: 'Three words get mixed up all the time: microprocessor, microcontroller and embedded system. Each means something different, and the course expects you to tell them apart.',
    blocks: [
      { predict: { q: 'Which of these is an embedded system?', opts: ['A laptop', 'The controller inside a washing machine', 'A desktop PC running Word', 'A university server'], ans: 1,
        why: 'The course definition: an embedded computing system is any device that contains a programmable computer but is not itself a general-purpose computer. A laptop, a PC and a server are general-purpose. The washing-machine controller has a programmable computer inside but does one dedicated job.' } },
      { h: 'Three boxes, three meanings' },
      { say: '**Microprocessor**: the CPU on its own. **Microcontroller**: the CPU plus memory, timers, ADC/DAC and I/O ports, all on one chip. **Embedded system**: a microcontroller plus fixed software in its flash or ROM, solving one dedicated problem.' },
      { table: { head: ['', 'Microprocessor', 'Microcontroller'], rows: [
        ['What is on the chip', 'The processor only', 'Processor, memory and input/output'], ['To make a working system', 'Needs other chips', 'Needs very little else'],
        ['Flexibility', 'More flexible. Few or many I/O devices on the same processor chip', 'Less flexible'], ['Power', 'More powerful', 'Less powerful'], ['Component count', 'More components in the system', 'Fewer components'] ] } },
      { predict: { q: 'Putting memory, timers and I/O on the same chip as the CPU does not make the system more powerful. What does it buy you?', opts: ['Lower cost, fewer chips, less wiring, less board area and lower power', 'A faster clock', 'More memory than a PC', 'Compatibility with every operating system'], ans: 0,
        why: 'Module 2 lists exactly these: lower design cost, fewer chips, less wiring, less PCB space, and lower power (milliwatts or even microwatts). That is the trade you accept for a thermostat.' } },
      { h: 'What an embedded system does' },
      { p: 'An embedded microcomputer system **accepts inputs, performs calculations, generates outputs and runs in real time**. In the block diagram from the module, sensors feed input ports, the microcontroller runs a control algorithm, output ports drive actuators, the actuators act on the work environment, and the sensors measure the result. That loop is the whole idea.' },
      { p: 'It is tuned to its job. It does not need the general-purpose bells and whistles, it is configured for one dedicated application, and its software is not accessible to the user of the device.' },
      { h: 'Choosing a microcontroller' },
      { p: 'The module gives two checklists. Specifications that matter: **speed** (bytes per second), **power** (watts), **size** (cm3) and **weight** (g), and **accuracy** (percent error). Things to weigh when you choose one:' },
      { list: ['Ability to process data: speed, precision, data type', 'I/O devices', 'RAM and ROM size', 'Power, package, size and voltage', 'Development tools: compiler, debugger, boards', 'Starter software'] },
      { diagram: 'chips' },
      { predict: { q: 'Using the table, how many times more flash does the TM4C123 on your LaunchPad have than the ATtiny? (256 kibibytes against 512 bytes.)', opts: ['About 512 times', 'About 50 times', 'About 5,000 times', 'The same'], ans: 0,
        why: '256 kibibytes = 256 x 1024 = 262,144 bytes. Divided by 512 bytes that is 512. Always convert to the same unit first.' } },
      { h: 'Development boards' },
      { p: 'A bare microcontroller is just an IC, and wiring to its pins is hectic. For learning and testing, it is mounted on a development board with a voltage regulator, capacitors and resistors, LEDs, switches and buttons, a motor driver, a timing crystal, USB or RS232, and digital and analog I/O. The Tiva LaunchPad in your labs is one. This course is about the ARM processor core found inside billions of microcontrollers.' },
      { slide: 'Module 2 page 2 says the Arduino\'s microcontroller is "AVR on the Arduino Uno or ARM on both the Arduino Due or Mega". Only the Due is ARM. The Mega 2560 uses an 8-bit AVR chip (ATmega2560), the same family as the Uno. The Due uses a 32-bit ARM Cortex-M3. Checked against SparkFun\'s Arduino comparison guide.' },
      { quiz: { id: 'm2-embedded', title: 'Check yourself', qs: [
        { kind: 'mcq', q: 'The course definition of an embedded computing system is...', opts: ['any device that includes a programmable computer but is not itself a general-purpose computer', 'any device with a CPU', 'a microcontroller with an operating system', 'a computer with no screen'], ans: 0, why: 'This is the definition to quote. The key is "not itself a general-purpose computer".' },
        { kind: 'mcq', q: 'A chip contains a CPU, flash, RAM, timers and I/O ports. It is a...', opts: ['Microcontroller', 'Microprocessor', 'Embedded system', 'Coprocessor'], ans: 0, why: 'All the parts of a computer on one chip is a microcontroller. A microprocessor is the CPU alone, and an embedded system also needs its fixed software.' },
        { kind: 'mcq', q: 'Which is NOT one of the benefits of integrating the parts onto one chip?', opts: ['Higher peak processing power than a microprocessor system', 'Fewer chips', 'Less PCB space', 'Lower power consumption'], ans: 0, why: 'Integration makes systems smaller, cheaper and lower power. A microcontroller is generally less powerful and less flexible than a full microprocessor system.' },
        { kind: 'multi', q: 'The TM4C123 has 256 kibibytes of flash and 32 kibibytes of RAM. How many bytes of RAM is that?', fields: [{ label: 'RAM in bytes', a: ['32768', '32,768'], type: 'text' }], why: '32 x 1024 = 32,768 bytes.' } ] } }
    ],
    takeaways: ['Microprocessor: CPU only. Microcontroller: CPU plus memory, timers, ADC/DAC and I/O on one chip. Embedded system: microcontroller plus fixed software for one job.', 'Integration lowers cost, chip count, wiring, board area and power.', 'Embedded systems accept inputs, calculate, produce outputs and run in real time.', 'Choose a microcontroller by speed, I/O, memory, power and package, and tools.']
  });
})(window);
