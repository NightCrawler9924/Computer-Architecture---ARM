/* Syllabus coverage page, and the About and progress page. */
(function (g) {
  'use strict';
  var Lab = g.Lab, h = Lab.h;

  Lab.pages.syllabus = function (el) {
    Lab.setTitle('Syllabus and coverage');
    el.appendChild(h('div', { class: 'lesson-head' }, h('h1', {}, 'Syllabus and coverage'),
      h('p', { class: 'lede' }, 'What the course covers, what this site teaches so far, and what is planned.')));
    var body = h('div', { class: 'lesson' }); el.appendChild(body);
    body.appendChild(h('div', { class: 'callout keep' }, h('span', { class: 'label' }, 'The official description'),
      h('div', { html: Lab.fmt('UBC lists ENGR 359 Microcomputer Engineering (3 credits, prerequisite APSC 255) as covering "microcomputer architecture, number representation, assembly language, parallel and serial input/output, interrupts, memory, peripherals." Source: the UBC course listing. Topics here follow the order of the lecture modules.') })));
    var rows = [
      ['Microcomputer architecture', 'Taught', 'Module 2 and the first half of Module 3'],
      ['Number representation', 'Taught', 'Hex, two\'s complement, endianness, signed and unsigned flags'],
      ['Assembly language', 'Taught', 'Module 3 and Handout 03, with a simulator'],
      ['Memory', 'Taught', 'SRAM and DRAM, hierarchy, read and write cycles, addressing'],
      ['Parallel I/O', 'Planned', 'The Lab 2 pin table is covered. The GPIO lessons are planned.'],
      ['Serial I/O', 'Partly', 'Lab 2 covers serial printing and baud rate. UART, SPI and I2C lessons are planned.'],
      ['Interrupts', 'Planned', 'Planned.'],
      ['Peripherals', 'Partly', 'Lab 2 covers the LCD, the light sensor and PWM. Timer and ADC lessons are planned.']
    ];
    body.appendChild(h('div', { class: 'wide' }, Lab.table(['Topic from the description', 'Status', 'What exists'], rows.map(function (r) { return [h('strong', {}, r[0]), h('span', { class: r[1] === 'Taught' ? 'cond-yes' : 'muted' }, r[1]), r[2]]; }))));
    body.appendChild(h('h2', {}, 'Sources'));
    body.appendChild(h('ul', {}, ['Module 2: Embedded Systems and Computer Organization', 'Module 3: ARM Processors and Assembly', 'Handout 03: ARM Instruction Set, Part 1 (Dr. Ayman Elnaggar)', 'Homework 1, including its formula sheet', 'Lab 2 manual: the MKII BoosterPack, clock display and serial communications'].map(function (t) { return h('li', {}, t); })));
  };

  Lab.pages.about = function (el) {
    Lab.setTitle('About and progress');
    el.appendChild(h('div', { class: 'lesson-head' }, h('h1', {}, 'About and progress'), h('p', { class: 'lede' }, 'How this site was checked, what you have done so far, and your settings.')));
    var body = h('div', { class: 'lesson' }); el.appendChild(body);
    var ids = Lab.allLessonIds(), done = ids.filter(Lab.isDone).length, P = Lab.progress;
    body.appendChild(h('h2', { style: { marginTop: 0 } }, 'Your progress'));
    body.appendChild(h('div', { class: 'progress', 'aria-hidden': 'true' }, h('i', { style: { width: (ids.length ? 100 * done / ids.length : 0) + '%' } })));
    body.appendChild(h('p', { class: 'num', style: { marginTop: '10px' } }, done + ' of ' + ids.length + ' lessons complete. Practice: ' + P.correct + ' of ' + P.answered + ' correct, best streak ' + P.bestStreak + '.'));
    body.appendChild(h('p', { class: 'muted' }, 'Progress is saved in this browser only. Nothing is sent anywhere.'));
    var slot = h('div');
    body.appendChild(h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'button', onclick: function () {
      Lab.clear(slot);
      slot.appendChild(h('div', { class: 'feedback bad' }, h('strong', { class: 'verdict' }, 'Reset all progress?'), h('div', {}, 'This clears completed lessons, quiz scores and practice stats on this device.'),
        h('div', { class: 'btn-row', style: { marginTop: '8px' } }, h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { Lab.resetProgress(); location.hash = '#/about'; location.reload(); } }, 'Yes, reset'), h('button', { class: 'btn btn-sm btn-quiet', type: 'button', onclick: function () { Lab.clear(slot); } }, 'Cancel'))));
    } }, 'Reset progress')));
    body.appendChild(slot);
    body.appendChild(h('h2', {}, 'How the numbers were checked'));
    body.appendChild(h('p', { html: Lab.fmt('Every result, flag value and carry shown on this site is computed by a 32-bit ARM engine, not typed in by hand. The engine has an automated test page (`tests/engine-tests.html`) with over 200 checks. Expected values for those tests came from an independent Python calculation or from worked examples printed in the course slides, for example the `ASR` example `0xA0000030 ASR #2 = 0xE800000C` and `RBIT 0x12345678 = 0x1E6A2C48`. All four Homework 1 problems are reproduced and verified.') }));
    body.appendChild(h('h2', {}, 'What the simulator does not model'));
    body.appendChild(h('ul', {}, ['Thumb and Thumb-2. Your Cortex-M4 actually runs Thumb-2, but the course teaches the 32-bit ARM instruction set, so this site does too.', 'Exceptions, interrupts, caches and cycle timing.', 'Coprocessor instructions.'].map(function (t) { return h('li', {}, t); })));
    body.appendChild(h('h2', {}, 'Settings'));
    body.appendChild(h('p', {}, 'Theme: use the sun button in the top bar. It cycles between your device setting, dark and light.'));
  };
})(window);
