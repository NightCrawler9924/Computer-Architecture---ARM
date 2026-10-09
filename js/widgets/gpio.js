/* GPIO simulator: ARM code driving the memory-mapped port from Handout 03, Part 5.
   Eight pins with LEDs on outputs and switches on inputs. The port keeps its state between runs, like real hardware. */
(function (g) {
  'use strict';
  var E = g.E359, Lab = g.Lab, h = Lab.h, hx = E.hex;

  var HDR = 'IOFPIN EQU 0xE0028000   ; read the pins\nIOFSET EQU 0xE0028004   ; write 1s to turn pins on\nIOFDIR EQU 0xE0028008   ; 1 = output, 0 = input\nIOFCLR EQU 0xE002800C   ; write 1s to turn pins off\n\n';
  Lab.gpioPresets = [
    { id: 'leds', title: 'Set the direction, then turn LEDs on and off', code: HDR + '  LDR R0, =IOFDIR\n  MOV R1, #0xFF        ; all eight pins are outputs\n  STR R1, [R0]\n  LDR R0, =IOFSET\n  MOV R2, #0x30        ; turn on pins 4 and 5\n  STR R2, [R0]\n  LDR R1, =IOFCLR\n  MOV R3, #0x07        ; turn off pins 0, 1 and 2\n  STR R3, [R1]\nstop B stop' },
    { id: 'switch', title: 'Read the switch on pin 6', code: HDR + '  LDR R0, =IOFPIN\n  LDR R1, [R0]         ; read the whole port\n  TST R1, #0x40        ; is pin 6 high?\n  BNE high\n  MOV R2, #0           ; pin 6 was low\n  B stop\nhigh MOV R2, #1        ; pin 6 was high\nstop B stop' },
    { id: 'toggle-slide', title: 'Toggle pin 3, using the slide\'s logic', code: HDR + '  LDR R0, =IOFDIR\n  MOV R1, #0x08\n  STR R1, [R0]         ; pin 3 is an output\n  LDR R0, =IOFPIN\n  LDR R5, =IOFSET\n  LDR R6, =IOFCLR\n  LDR R1, [R0]         ; read the port\n  MOV R7, #0x08        ; mask for bit 3\n  TST R1, R7           ; Z = 1 when pin 3 is clear\n  STREQ R7, [R6]       ; pin 3 is clear -> write the CLEAR register\n  STRNE R7, [R5]       ; pin 3 is set   -> write the SET register\nstop B stop' },
    { id: 'toggle-fixed', title: 'Toggle pin 3, corrected', code: HDR + '  LDR R0, =IOFDIR\n  MOV R1, #0x08\n  STR R1, [R0]         ; pin 3 is an output\n  LDR R0, =IOFPIN\n  LDR R5, =IOFSET\n  LDR R6, =IOFCLR\n  LDR R1, [R0]         ; read the port\n  MOV R7, #0x08        ; mask for bit 3\n  TST R1, R7           ; Z = 1 when pin 3 is clear\n  STREQ R7, [R5]       ; pin 3 is clear -> SET it\n  STRNE R7, [R6]       ; pin 3 is set   -> CLEAR it\nstop B stop' }
  ];

  Lab.widgets.gpioSim = function (root, o) {
    o = o || {};
    var gp = new E.Gpio();
    var st = { code: o.code || Lab.gpioPresets[0].code, pressed: {}, switchLogic: 'negative', ledLogic: 'high', regs: null, err: null, halted: '', ran: false };
    var presetSel = h('select', { id: 'gpio-preset', 'aria-label': 'Load an example program' }, [h('option', { value: '' }, 'Load an example…')].concat(Lab.gpioPresets.map(function (p) { return h('option', { value: p.id }, p.title); })));
    var ta = h('textarea', { id: 'gpio-src', class: 'sim-src gpio-src', rows: 14, spellcheck: 'false', 'aria-label': 'Assembly source' }); ta.value = st.code;
    ta.addEventListener('input', function () { st.code = ta.value; });
    presetSel.addEventListener('change', function () { var p = Lab.gpioPresets.filter(function (x) { return x.id === presetSel.value; })[0]; if (p) { st.code = p.code; ta.value = p.code; st.err = null; draw(); } presetSel.value = ''; });
    var runBtn = h('button', { class: 'btn btn-primary', type: 'button' }, 'Run program');
    var resetBtn = h('button', { class: 'btn', type: 'button', title: 'Clear the port: every pin back to an input, outputs low' }, 'Reset the port');
    var errBox = h('div', { 'aria-live': 'polite' });
    var left = h('div', { class: 'gpio-left' }, h('div', { class: 'field' }, h('label', { for: 'gpio-preset' }, 'Examples'), presetSel), ta, h('div', { class: 'btn-row', style: { marginTop: '10px' } }, runBtn, resetBtn), errBox);
    var board = h('div', { class: 'gpio-board' });
    var right = h('div', { class: 'gpio-right' }, board);
    root.appendChild(h('div', { class: 'gpio' }, left, right));

    function wiring() {
      var mk = function (id, label, key, opts) {
        var sel = h('select', { id: id, 'aria-label': label }, opts.map(function (x) { return h('option', { value: x[0], selected: st[key] === x[0] }, x[1]); }));
        sel.addEventListener('change', function () { st[key] = sel.value; draw(); });
        return h('div', { class: 'field' }, h('label', { for: id }, label), sel);
      };
      return h('div', { class: 'field-row' },
        mk('gpio-sw', 'Switch wiring', 'switchLogic', [['negative', 'Negative (pressed = 0)'], ['positive', 'Positive (pressed = 1)']]),
        mk('gpio-led', 'LED wiring', 'ledLogic', [['high', 'Active high'], ['low', 'Active low']]));
    }
    function applyExternal() {
      var ext = 0xFFFFFFFF;
      for (var i = 0; i < 8; i++) {
        var pressed = !!st.pressed[i], level = st.switchLogic === 'positive' ? (pressed ? 1 : 0) : (pressed ? 0 : 1);
        if (level) ext |= (1 << i); else ext &= ~(1 << i);
      }
      gp.ext = ext >>> 0;
    }
    function run() {
      st.err = null; Lab.clear(errBox);
      var a = E.assemble(st.code);
      if (!a.ok) { st.err = a.errors; draw(); return; }
      applyExternal(); gp.log = [];
      var cpu = new E.CPU(); cpu.reset(a); cpu.mmio = gp;
      cpu.run(5000);
      st.regs = cpu.reg.slice(0, 8); st.halted = cpu.haltReason; st.ran = true; draw();
    }
    runBtn.addEventListener('click', run);
    resetBtn.addEventListener('click', function () { var ext = gp.ext; gp.reset(); gp.ext = ext; st.regs = null; st.ran = false; st.err = null; draw(); });

    function draw() {
      Lab.clear(errBox); Lab.clear(board);
      if (st.err) st.err.forEach(function (er) { errBox.appendChild(h('div', { class: 'feedback bad' }, 'Line ' + er.line + ': ' + er.msg)); });
      applyExternal();
      board.appendChild(wiring());
      var pins = h('div', { class: 'gpio-pins', role: 'group', 'aria-label': 'Port pins 7 to 0' });
      for (var i = 7; i >= 0; i--) (function (i) {
        var isOut = ((gp.dir >>> i) & 1) === 1, level = (gp.pins() >>> i) & 1;
        var on = isOut && (st.ledLogic === 'high' ? level === 1 : level === 0);
        var cell = h('div', { class: 'gpin' + (isOut ? ' out' : ' in') });
        cell.appendChild(h('span', { class: 'gnum' }, String(i)));
        cell.appendChild(h('span', { class: 'gdir' }, isOut ? 'out' : 'in'));
        if (isOut) cell.appendChild(h('span', { class: 'led' + (on ? ' lit' : ''), role: 'img', 'aria-label': 'LED on pin ' + i + ' is ' + (on ? 'on' : 'off') }));
        else {
          var pressed = !!st.pressed[i];
          cell.appendChild(h('button', { type: 'button', class: 'swbtn', 'aria-pressed': pressed ? 'true' : 'false', 'aria-label': 'Switch on pin ' + i, onclick: function () { st.pressed[i] = !st.pressed[i]; draw(); } }, pressed ? 'Pressed' : 'Open'));
        }
        cell.appendChild(h('span', { class: 'glvl mono' }, String(level)));
        pins.appendChild(cell);
      })(i);
      board.appendChild(pins);
      board.appendChild(h('p', { class: 'muted gpio-note' }, 'The number under each pin is its voltage level: 1 is high (3.3 V), 0 is low. Outputs show an LED, inputs show a switch you can press.'));
      var regs = h('div', { class: 'gpio-regs mono' },
        [['IOFDIR', gp.dir], ['IOFPIN', gp.pins()]].map(function (r) { return h('div', { class: 'greg' }, h('span', { class: 'rn' }, r[0]), h('span', {}, hx(r[1] & 0xFF, 2))); }));
      board.appendChild(regs);
      if (st.regs) {
        board.appendChild(h('div', { class: 'subhead', style: { marginTop: '12px' } }, 'Registers after the run'));
        board.appendChild(h('div', { class: 'sim-regs' }, st.regs.map(function (v, i) { return h('div', { class: 'reg' }, h('span', { class: 'rn' }, 'R' + i), h('span', { class: 'rv mono' }, hx(v))); })));
      }
      if (st.ran) {
        var log = gp.log;
        board.appendChild(h('div', { class: 'subhead', style: { marginTop: '12px' } }, 'Port accesses'));
        if (!log.length) board.appendChild(h('p', { class: 'muted' }, 'The program never touched the port.'));
        else board.appendChild(Lab.table(['', 'Register', 'Value'], log.map(function (l) { return [l.kind === 'write' ? 'write' : 'read', h('code', {}, E.Gpio.NAMES[l.off] || ('+' + l.off)), h('code', {}, hx(l.val, 2))]; })));
      } else board.appendChild(h('p', { class: 'muted' }, 'Press Run program. The port keeps its state between runs, so you can run a program twice to see what happens the second time.'));
    }
    draw();
  };
})(window);
