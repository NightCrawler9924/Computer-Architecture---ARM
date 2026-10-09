/* The course map. To add a topic: write a content/<name>.js that calls Lab.lesson({...}),
   add its <script> line to index.html, and put its id in a unit below.
   track: 'course' appears under Course, 'labs' appears under Labs.
   soon: planned topics that are not written yet. */
(function (g) {
  'use strict';
  var Lab = g.Lab;

  Lab.lesson = function (spec) { Lab.lessons[spec.id] = spec; return spec; };

  Lab.units = [
    { id: 'u-start', track: 'course', title: 'Start here', blurb: 'A two-minute check that points you at the right place to begin.', lessons: ['start'] },
    { id: 'u-embedded', track: 'course', title: 'Embedded systems and computer organisation', blurb: 'Module 2. What a microcontroller is, how the CPU and memory talk, and how a processor runs a program.',
      lessons: ['m2-embedded', 'm2-computer', 'm2-memory', 'm2-numbers', 'm2-endian', 'm2-cycle'] },
    { id: 'u-arm', track: 'course', title: 'The ARM processor and assembly', blurb: 'Module 3 and Handout 03. Registers, flags, shifts, conditional execution, memory access, loops, the stack and GPIO.',
      lessons: ['m3-arm', 'm3-encoding', 'm3-dataproc', 'm3-flags', 'm3-sub', 'm3-shifts', 'm3-bits', 'm3-cond', 'm3-memaccess', 'm3-flow', 'm3-stack', 'm3-gpio'] },
    { id: 'u-hw', track: 'course', title: 'Homework and quizzes', blurb: 'Quiz 1 fundamentals, Homework 1 worked through, and Homework 2 with a checker that never gives away the answers.', lessons: ['quiz1', 'hw1', 'hw2'] },
    { id: 'u-soon', track: 'course', title: 'Planned topics', lessons: [],
      soon: ['Serial I/O: UART, SPI and I2C', 'Interrupts', 'Timers and PWM', 'Analog input and output', 'Memory-mapped peripherals'] },

    { id: 'l-board', track: 'labs', title: 'The Tiva LaunchPad', blurb: 'The board you build on, and how to read its pins.', lessons: ['lab-board'] },
    { id: 'l-lab2', track: 'labs', title: 'Lab 2: MKII BoosterPack, clock display and serial', blurb: 'The LCD clock, serial debugging, and a light sensor that dims the backlight.',
      lessons: ['lab2-hardware', 'lab2-clock', 'lab2-serial', 'lab2-light', 'lab2-demo'] },
    { id: 'l-more', track: 'labs', title: 'Other labs', lessons: [], soon: ['Lab 1: getting started with the LaunchPad', 'Lab 3 and later'] }
  ];

  Lab.toolList = [
    { name: 'hexLab', title: 'Hex and flags lab', blurb: 'Add or subtract two 32-bit numbers one column at a time and see why N, Z, C and V are set.' },
    { name: 'shifter', title: 'Barrel shifter', blurb: 'Shift and rotate 32 bits and watch which bits leave, which enter, and what C becomes.' },
    { name: 'condExplorer', title: 'Condition codes', blurb: 'Flip the flags or compare two numbers and see which of the 15 conditions pass.' },
    { name: 'endian', title: 'Endianness', blurb: 'See the same 32-bit word laid out in memory little-endian and big-endian.' },
    { name: 'loadLab', title: 'Load and store lab', blurb: 'Word, halfword and byte loads, and pre-index, post-index and auto-index addressing.' },
    { name: 'buses', title: 'Address, data and control buses', blurb: 'Step through a memory read and a memory write.' },
    { name: 'dram', title: 'DRAM charge and refresh', blurb: 'Watch a DRAM cell leak, and see why reads need a restore cycle.' },
    { name: 'fetchCycle', title: 'Fetch, decode, execute', blurb: 'Watch the PC, the instruction register and the registers through each phase.' },
    { name: 'encoder', title: 'Instruction encoder', blurb: 'Turn assembly into the 32-bit machine word, build one field by field, or decode a word.' },
    { name: 'gpioSim', title: 'GPIO simulator', blurb: 'Run ARM code against a memory-mapped port with LEDs and switches.' },
    { name: 'pinTable', title: 'MKII pin table', lab: true, blurb: 'Search the 40 pins and see which BoosterPack part uses each one.' },
    { name: 'clockLab', title: 'LCD clock', lab: true, blurb: 'The lab clock: second, minute and hour rollover and the string formatting.' },
    { name: 'baud', title: 'Serial timing', lab: true, blurb: 'How long a message takes at a given baud rate, and how much work the CPU could do meanwhile.' },
    { name: 'lightPwm', title: 'Light sensor to backlight', lab: true, blurb: 'map(), constrain() and PWM for the auto-dimming screen.' },
    { name: 'reactSpeed', title: 'Backlight reaction speed', lab: true, blurb: 'What changes when the backlight updates faster, and what it costs.' }
  ];
})(window);
