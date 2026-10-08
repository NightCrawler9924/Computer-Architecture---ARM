/* Static diagrams used inside lessons. Each one shows a mechanism from the course material. */
(function (g) {
  'use strict';
  var E = g.E359, Lab = g.Lab, h = Lab.h, s = null;
  var NS = 'http://www.w3.org/2000/svg';
  function sv(tag, attrs, kids) { var el = document.createElementNS(NS, tag); Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); }); (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); }); return el; }

  /* the layers of abstraction figure from Module 2 page 5 */
  Lab.diagrams.layers = function () {
    var rows = [['sw', 'Application'], ['sw', 'Problem-oriented programming language'], ['sw', 'Assembly language'], ['sw', 'Machine code'], ['isa', 'Instruction set architecture (ISA)'], ['hw', 'Microarchitecture'], ['hw', 'Logic gates and registers'], ['hw', 'Devices (transistors)'], ['hw', 'Physics (electron flow)']];
    var box = h('div', { class: 'layers', role: 'img', 'aria-label': 'Nine layers from application down to physics. Application through machine code are software, the instruction set architecture is the boundary, microarchitecture down to physics are hardware.' });
    rows.forEach(function (r, i) {
      box.appendChild(h('div', { class: 'layer ' + r[0] }, r[1], i === 0 ? h('span', { class: 'muted', style: { float: 'right', fontWeight: 400 } }, 'software') : (i === 5 ? h('span', { class: 'muted', style: { float: 'right', fontWeight: 400 } }, 'hardware') : null)));
    });
    return h('figure', { class: 'figure' }, box, h('figcaption', { class: 'muted' }, 'Everything above the dashed ISA line is software and everything below it is hardware. The ISA is the contract between them.'));
  };

  /* memory hierarchy from Module 2 page 6, bar length is log scale of latency */
  Lab.diagrams.hierarchy = function () {
    var data = [['Register file', 0.5, '½ cycle', '100s of bytes'], ['L1 cache', 1, '1 cycle', '10s of KB'], ['L2 and L3 cache', 10, '10s of cycles', 'MBs'], ['Main memory (DRAM)', 100, '100s of cycles', 'GBs'], ['Secondary storage', 10000, '10,000s of cycles', 'TBs']];
    var lo = Math.log10(0.3), hi = Math.log10(30000);
    var box = h('div', { class: 'hier', role: 'img', 'aria-label': 'Memory hierarchy: access time grows from half a cycle for registers to tens of thousands of cycles for disk, while size grows from hundreds of bytes to terabytes.' });
    box.appendChild(h('div', { class: 'hier-row muted', style: { fontSize: 'var(--fs-0)', fontWeight: 600 } }, h('span', {}, 'Level'), h('span', {}, 'Access time (log scale)'), h('span', {}, 'Size')));
    data.forEach(function (d) {
      var w = Math.round(100 * (Math.log10(d[1]) - lo) / (hi - lo));
      box.appendChild(h('div', { class: 'hier-row' }, h('strong', {}, d[0]), h('div', { class: 'hier-bar' }, h('i', { style: { width: w + '%' } })), h('span', { class: 'num' }, d[2] + ', ' + d[3])));
    });
    return h('figure', { class: 'figure' }, box, h('figcaption', { class: 'muted' }, 'Orders of magnitude from Module 2 page 6. Bar length is on a log scale, so each step to the right is roughly ten times slower.'));
  };

  /* the 16 registers and the CPSR flags, Module 3 page 2 */
  Lab.diagrams.regs = function () {
    var roles = { 13: 'SP, the stack pointer', 14: 'LR, the link register', 15: 'PC, the program counter' };
    var grid = h('div', { class: 'regmap', role: 'img', 'aria-label': 'Sixteen 32-bit registers r0 to r15. r13 is the stack pointer, r14 the link register, r15 the program counter. A separate CPSR holds N, Z, C and V in bits 31 to 28.' });
    for (var i = 0; i < 16; i++) grid.appendChild(h('div', { class: 'rm' + (i >= 13 ? ' special' : '') }, h('span', { class: 'rn mono' }, 'r' + i), h('span', { class: 'rr' }, roles[i] || 'general purpose')));
    var psr = h('div', { class: 'psr' }, h('span', { class: 'rn mono' }, 'CPSR'), h('div', { class: 'psr-bits mono' },
      ['N', 'Z', 'C', 'V'].map(function (k, j) { return h('div', { class: 'pb f' + k }, h('span', { class: 'pbi' }, String(31 - j)), h('span', { class: 'pbk' }, k)); }), h('div', { class: 'pb rest' }, h('span', { class: 'pbi' }, '27 to 0'), h('span', { class: 'pbk' }, 'other fields'))));
    return h('figure', { class: 'figure' }, h('div', { class: 'regs-fig' }, grid, psr), h('figcaption', { class: 'muted' }, 'All registers are 32 bits wide. r0 to r12 are interchangeable. The four flags live in the top bits of the CPSR.'));
  };

  /* the ARM organisation from Module 3 page 1 */
  Lab.diagrams.armOrg = function () {
    var svg = sv('svg', { viewBox: '0 0 640 430', role: 'img', class: 'orgsvg', 'aria-label': 'ARM datapath: an address register with an incrementer feeds memory, a register bank feeds the A bus and, through a barrel shifter, the B bus, both going into the ALU. The ALU result returns to the register bank. An instruction decoder controls everything. Data goes in and out through data registers.' });
    svg.appendChild(sv('defs', {}, [sv('marker', { id: 'ah', viewBox: '0 0 10 10', refX: '8', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto' }, [sv('path', { d: 'M0 0 L10 5 L0 10 z', fill: 'currentColor' })])]));
    function box(x, y, w, hh, t, cls) { var gg = sv('g', { class: 'ob ' + (cls || '') }); gg.appendChild(sv('rect', { x: x, y: y, width: w, height: hh, rx: 5 })); gg.appendChild(sv('text', { x: x + w / 2, y: y + hh / 2 + 4, 'text-anchor': 'middle' }, [t])); return gg; }
    function line(x1, y1, x2, y2, label, lx, ly) { var gg = sv('g', { class: 'ol' }); gg.appendChild(sv('line', { x1: x1, y1: y1, x2: x2, y2: y2, 'marker-end': 'url(#ah)' })); if (label) gg.appendChild(sv('text', { x: lx, y: ly, class: 'olt' }, [label])); return gg; }
    svg.appendChild(box(120, 20, 200, 40, 'address register'));
    svg.appendChild(box(360, 70, 130, 36, 'incrementer'));
    svg.appendChild(box(120, 110, 200, 70, 'register bank'));
    svg.appendChild(box(170, 214, 120, 34, 'barrel shifter'));
    svg.appendChild(box(120, 290, 200, 44, 'ALU'));
    svg.appendChild(box(120, 380, 200, 36, 'data out register'));
    svg.appendChild(box(360, 380, 200, 36, 'data in register'));
    svg.appendChild(box(520, 20, 100, 330, 'instruction decode and control', 'ctl'));
    svg.appendChild(line(220, 20, 220, 6, 'A[31:0] to memory', 230, 12));
    svg.appendChild(line(320, 40, 360, 84, '', 0, 0)); svg.appendChild(line(425, 106, 320, 140, 'PC + 4', 400, 126));
    svg.appendChild(line(220, 110, 220, 60, 'PC', 226, 92));
    svg.appendChild(line(150, 180, 150, 290, 'A bus', 100, 240));
    svg.appendChild(line(260, 180, 260, 214, 'B bus', 268, 202));
    svg.appendChild(line(230, 248, 230, 290, '', 0, 0));
    svg.appendChild(line(120, 312, 78, 312, '', 0, 0)); svg.appendChild(line(78, 312, 78, 150, 'ALU bus (result back to the register bank)', 14, 346)); svg.appendChild(line(78, 150, 120, 150, '', 0, 0));
    svg.appendChild(line(220, 334, 220, 380, '', 0, 0));
    svg.appendChild(line(460, 380, 460, 330, '', 0, 0));
    svg.appendChild(line(520, 200, 330, 200, 'control signals', 370, 192));
    return h('figure', { class: 'figure' }, svg, h('figcaption', { class: 'muted' }, 'Simplified from Module 3 page 1. In one data-processing cycle two registers are read, the B value passes through the barrel shifter, the ALU combines it with the A value, and the result goes back to the register bank. The PC goes through the incrementer so the next fetch address is ready.'));
  };

  /* chip comparison from Module 2 page 3 */
  Lab.diagrams.chips = function () {
    return Lab.table(['Chip', 'Flash (program)', 'RAM (data)', 'Package'], [['ATtiny', '512 bytes', '32 bytes', '3 mm'], ['MSP430 F2012', '2048 bytes', '128 bytes', '5 mm'], ['TM4C123 (your LaunchPad)', '256 kibibytes', '32 kibibytes', '10 mm']]);
  };
})(window);
