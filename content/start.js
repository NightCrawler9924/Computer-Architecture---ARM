/* The two-minute check. Each question belongs to a lesson, so the result can say where to begin. */
(function (g) {
  'use strict';
  var Lab = g.Lab, h = Lab.h;

  var QS = [
    { lesson: 'm2-numbers', kind: 'mcq', q: 'Without converting anything: is `0xE0000000` positive or negative as a signed 32-bit number?', opts: ['Positive', 'Negative', 'Neither, it is zero', 'It depends on the processor'], ans: 1, why: 'The leading hex digit E is in the range 8 to F, so bit 31 is set and the number is negative.' },
    { lesson: 'm3-flags', kind: 'mcq', q: '`ADDS R0, R1, R2` with R1 = `0x7FFFFFFF` and R2 = `1`. What are C and V afterwards?', opts: ['C = 0, V = 1', 'C = 1, V = 0', 'C = 1, V = 1', 'C = 0, V = 0'], ans: 0, why: 'The result is `0x80000000`. Nothing carried out of bit 31, so C = 0. Positive plus positive gave a negative result, which is impossible, so V = 1.' },
    { lesson: 'm3-sub', kind: 'mcq', q: '`SUBS R0, R1, R2` with R1 = 3 and R2 = 5. What is C afterwards on ARM?', opts: ['C = 0', 'C = 1', 'C is unchanged', 'C = 0 on x86 and 1 on ARM, so it depends'], ans: 0, why: 'On ARM, C is NOT borrow. 3 - 5 needs a borrow, so C = 0. (On x86 the carry flag is the borrow itself, which is the opposite.)' },
    { lesson: 'm3-shifts', kind: 'mcq', q: '`MOVS R0, R1, LSL #1` with R1 = `0x80000001`. What is C afterwards?', opts: ['1', '0', 'Unchanged', 'Undefined'], ans: 0, why: 'LSL pushes bits off the top. The last one out is bit 31 of R1, which is 1, so C = 1.' },
    { lesson: 'm2-endian', kind: 'mcq', q: 'Memory at addresses 100, 101, 102, 103 holds `11 22 33 44`. On a little-endian ARM, what does a word load from address 100 give?', opts: ['`0x44332211`', '`0x11223344`', '`0x22114433`', '`0x44112233`'], ans: 0, why: 'Little-endian puts the least significant byte at the lowest address. Read the bytes from address 103 down to 100: 44 33 22 11.' },
    { lesson: 'm3-cond', kind: 'mcq', q: 'The flags are Z = 0, N = 1, V = 0. The instruction `ADDGTS R1, R0, R2` is skipped. What happens to the flags?', opts: ['Nothing, they stay as they were', 'They are updated from R0 + R2', 'They are cleared', 'Only Z is updated'], ans: 0, why: 'GT needs Z = 0 and N = V, but N = 1 and V = 0, so it is skipped. A skipped instruction does nothing at all, even if it has an S.' },
    { lesson: 'm2-cycle', kind: 'mcq', q: 'An instruction at `0x0020` is `B 0x0040`. What is the PC right after it has executed?', opts: ['`0x0040`', '`0x0044`', '`0x0024`', '`0x0020`'], ans: 0, why: 'A branch replaces the PC with its target. There is no +4 on top.' },
    { lesson: 'm3-arm', kind: 'mcq', q: 'Which is true of ARM arithmetic?', opts: ['It works only on registers, so memory data is loaded first', 'ADD can take a memory address as an operand', 'It works directly on memory like x86', 'It needs a separate floating-point unit for integers'], ans: 0, why: 'ARM is a load-store architecture: load, operate in registers, store.' }
  ];

  Lab.lesson({
    id: 'start', title: 'The 2-minute check', minutes: 3, source: 'the whole course',
    lede: 'Eight questions, no penalty for guessing. They show you which lesson to start from, so you do not sit through what you already know.',
    blocks: [
      { p: 'Answer from instinct. Each question is tied to one lesson, and at the end you get a list of the lessons where you slipped.' },
      { quiz: { id: 'diagnostic', title: 'Diagnostic', qs: QS, after: function (results) {
        var miss = QS.map(function (q, i) { return results[i] ? null : q.lesson; }).filter(Boolean);
        var box = h('div', { class: 'callout idea', style: { marginTop: '12px' } }, h('span', { class: 'label' }, 'Where to go next'));
        if (!miss.length) { box.appendChild(h('p', {}, 'You got everything. Try the Practice page for fresh numbers, or work through Homework 1 to test yourself properly.')); box.appendChild(h('div', { class: 'btn-row' }, h('a', { class: 'btn btn-primary', href: '#/practice' }, 'Go to Practice'), h('a', { class: 'btn', href: '#/lesson/hw1' }, 'Open Homework 1'))); return box; }
        box.appendChild(h('p', {}, 'Start with these, in this order:'));
        var order = Lab.allLessonIds();
        miss.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
        var ul = h('ul'); miss.forEach(function (id) { var L = Lab.lessons[id]; ul.appendChild(h('li', {}, h('a', { href: '#/lesson/' + id }, L ? L.title : id))); });
        box.appendChild(ul);
        return box;
      } } },
      { say: 'Not sure about any of them? Start at the top of the course map and go in order. Each lesson makes you commit to an answer before it explains, which is the fastest way to find your gaps.' }
    ]
  });
})(window);
