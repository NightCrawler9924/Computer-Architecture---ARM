/* About page: the maker, course coverage, how the numbers were checked, progress and settings.
   The old Syllabus route now lands here. */
(function (g) {
  'use strict';
  var Lab = g.Lab, h = Lab.h;

  Lab.pages.syllabus = function () { location.replace('#/about'); };

  Lab.pages.about = function (el) {
    Lab.setTitle('About');
    el.appendChild(h('div', { class: 'lesson-head' }, h('h1', {}, 'About Opcode'),
      h('p', { class: 'lede' }, 'An interactive course for ENGR 359 Microcomputer Engineering. It runs in your browser, works on a phone, and sends nothing anywhere.')));
    var body = h('div', { class: 'lesson' }); el.appendChild(body);

    /* progress first, because it is the part people come back for */
    var ids = Lab.allLessonIds(), done = ids.filter(Lab.isDone).length, P = Lab.progress;
    body.appendChild(h('h2', { style: { marginTop: 0 } }, 'Your progress'));
    body.appendChild(h('div', { class: 'progress', 'aria-hidden': 'true' }, h('i', { style: { width: (ids.length ? 100 * done / ids.length : 0) + '%' } })));
    body.appendChild(h('p', { class: 'num', style: { marginTop: '10px' } }, done + ' of ' + ids.length + ' lessons complete. Practice: ' + P.correct + ' of ' + P.answered + ' correct, best streak ' + P.bestStreak + '.'));
    body.appendChild(h('p', { class: 'muted' }, 'Progress stays in this browser. Clearing site data removes it.'));
    var slot = h('div');
    body.appendChild(h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'button', onclick: function () {
      Lab.clear(slot);
      slot.appendChild(h('div', { class: 'feedback bad' }, h('strong', { class: 'verdict' }, 'Reset all progress?'), h('div', {}, 'This clears completed lessons, quiz scores and practice stats on this device.'),
        h('div', { class: 'btn-row', style: { marginTop: '8px' } }, h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { Lab.resetProgress(); location.hash = '#/about'; location.reload(); } }, 'Yes, reset'), h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { Lab.clear(slot); } }, 'Keep it'))));
    } }, 'Reset progress')));
    body.appendChild(slot);

    body.appendChild(h('h2', {}, 'About the maker'));
    body.appendChild(h('p', { html: Lab.fmt('I am Deepansh Sabharwal, a student at UBC Okanagan. I built Opcode while taking ENGR 359, because I learn assembly fastest when I can poke at it. Every number on the site comes from a working ARM engine, so the answers and the explanations agree.') }));
    body.appendChild(h('p', {}, 'Found a mistake, or want a topic added? Open an issue or send a change on ', h('a', { href: 'https://github.com/NightCrawler9924/Computer-Architecture---ARM', rel: 'noopener' }, 'GitHub'), '. This is a study aid, not the official course material, so check anything that matters against your lecture notes.'));

    body.appendChild(h('h2', {}, 'What the course covers'));
    body.appendChild(h('p', { html: Lab.fmt('UBC lists ENGR 359 (3 credits, prerequisite APSC 255) as covering microcomputer architecture, number representation, assembly language, parallel and serial input/output, interrupts, memory and peripherals. Here is how much of that exists so far.') }));
    var rows = [
      ['Microcomputer architecture', 'Taught', 'Module 2 and the first half of Module 3'],
      ['Number representation', 'Taught', 'Hex, two\'s complement, endianness, signed and unsigned flags'],
      ['Assembly language', 'Taught', 'Module 3 and Handout 03, with a simulator, the stack and subroutines'],
      ['Memory', 'Taught', 'SRAM and DRAM, hierarchy, read and write cycles, addressing'],
      ['Parallel I/O', 'Taught', 'GPIO registers, switches and LEDs, with a port simulator. Lab 2 pin table.'],
      ['Serial I/O', 'Partly', 'Lab 2 covers serial printing and baud rate. UART, SPI and I2C lessons are next.'],
      ['Interrupts', 'Planned', 'Not written yet.'],
      ['Peripherals', 'Partly', 'Lab 2 covers the LCD, the light sensor and PWM. Timers and ADC are next.']
    ];
    body.appendChild(h('div', { class: 'wide' }, Lab.table(['Topic', 'Status', 'What exists'], rows.map(function (r) { return [h('strong', {}, r[0]), h('span', { class: r[1] === 'Taught' ? 'cond-yes' : 'muted' }, r[1]), r[2]]; }))));
    body.appendChild(h('p', { class: 'muted', style: { marginTop: '12px' } }, 'Built from: Module 2, Module 3, Handout 03 Parts 1 to 5, Homework 1 and 2, Quiz 1, and the Lab 2 manual.'));

    body.appendChild(h('h2', {}, 'How the numbers were checked'));
    body.appendChild(h('p', { html: Lab.fmt('Results, flags and carries come from a 32-bit ARM engine, not from typed-in answers. The engine has an automated test page (`tests/engine-tests.html`) with over 240 checks. Expected values came from an independent Python calculation or from worked examples in the course slides, such as `0xA0000030 ASR #2 = 0xE800000C` and `RBIT 0x12345678 = 0x1E6A2C48`. The program checkers for Homework 2 were tested with separate reference solutions.') }));
    body.appendChild(h('p', { html: Lab.fmt('One known difference: after a subtraction, real ARM sets C to 1 when no borrow is needed. Quiz 1\'s solution key leaves C at 0 in that case. The Quiz 1 review lesson shows both side by side.') }));
    body.appendChild(h('h2', {}, 'What the simulator leaves out'));
    body.appendChild(h('ul', {}, ['Thumb and Thumb-2. The Cortex-M4 runs Thumb-2, but the course teaches the 32-bit ARM instruction set, so Opcode does too.', 'Exceptions, interrupts, caches and cycle timing.', 'Coprocessor instructions.'].map(function (t) { return h('li', {}, t); })));
    body.appendChild(h('h2', {}, 'Settings'));
    body.appendChild(h('p', {}, 'Theme: use the sun, moon and screen buttons in the top bar. The third one follows your device.'));
  };
})(window);
