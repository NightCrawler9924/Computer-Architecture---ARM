/* Lab 2 widgets: the MKII BoosterPack pin table, the clock, serial timing, and the light sensor to PWM backlight. */
(function (g) {
  'use strict';
  var E = g.E359, Lab = g.Lab, h = Lab.h;
  var NS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, kids) { var el = document.createElementNS(NS, tag); Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); }); (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); }); return el; }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Transcribed from the pin table on page 3 of the Lab 2 manual (checked against the page image). */
  var PINS = [
    [1, 'J1-1', '', '', '3.3V', ''], [2, 'J1-2', 'PB_5', 'Read/write', 'SPI_2 CS', 'Joystick X-axis'], [3, 'J1-3', 'PB_0', 'Write', 'UART_1 RX', ''], [4, 'J1-4', 'PB_1', 'Write', 'UART_1 TX', ''],
    [5, 'J1-5', 'PE_4', 'Read', 'UART_5 RX, I2C_2 SCL', 'Joystick select button'], [6, 'J1-6', 'PE_5', 'Read', 'UART_5 TX, I2C_2 SDA', 'Microphone'], [7, 'J1-7', 'PB_4', 'Read/write', 'SPI_2 SCK', 'LCD SCK'],
    [8, 'J1-8', 'PA_5', '', 'SPI_0 MOSI', 'Light sensor interrupt'], [9, 'J1-9', 'PA_6', '', 'I2C_1 SCL', 'I2C SCL for light/temp sensors'], [10, 'J1-10', 'PA_7', '', 'I2C_1 SDA', 'I2C SDA for light/temp sensors'],
    [11, 'J2-10', 'PA_2', '', 'SPI_0 SCK', 'Temp sensor data ready'], [12, 'J2-9', 'PA_3', '', 'SPI_0 CS', ''], [13, 'J2-8', 'PA_4', '', 'SPI_0 MISO', 'LCD chip select'],
    [14, 'J2-7', 'PB_6', 'Write', 'SPI_2 MISO, I2C_3 SCL', ''], [15, 'J2-6', 'PB_7', 'Write', 'SPI_2 MOSI, I2C_3 SDA', 'LCD MOSI'], [16, 'J2-5', '', '', 'RST', ''],
    [17, 'J2-4', 'PF_0', 'Write', 'Button 2, SPI_1 MISO, !wake', 'LCD !RST'], [18, 'J2-3', 'PE_0', 'Read', 'UART_7 RX', ''], [19, 'J2-2', 'PB_2', 'Write', 'I2C_0 SCL', '(connected to servo header)'],
    [20, 'J2-1', '', '', 'GND', ''], [21, 'J3-1', '', '', '5V', ''], [22, 'J3-2', '', '', 'GND', ''],
    [23, 'J3-3', 'PD_0', 'Read/write', 'SPI_3 SCK, I2C_3 SCL', 'Accelerometer X-Out'], [24, 'J3-4', 'PD_1', 'Read/write', 'SPI_3 CS, I2C_3 SDA', 'Accelerometer Y-Out'], [25, 'J3-5', 'PD_2', 'Read/write', 'SPI_3 MISO', 'Accelerometer Z-Out'],
    [26, 'J3-6', 'PD_3', 'Read/write', 'SPI_3 MOSI, QE0 index', 'Joystick Y-axis'], [27, 'J3-7', 'PE_1', 'Read', 'UART_7 TX', ''], [28, 'J3-8', 'PE_2', 'Read', '', ''], [29, 'J3-9', 'PE_3', 'Read', '', ''],
    [30, 'J3-10', 'PF_1', 'Write', 'Red LED, SPI_1 MOSI, QE0 PhB', ''], [31, 'J4-10', 'PF_4', 'Write', 'Button 1', 'LCD register select'], [32, 'J4-9', 'PD_7', 'Write', 'VBUS detect, UART_2 TX', 'Button 2'],
    [33, 'J4-8', 'PD_6', 'Write', 'UART_2 RX, QE0 PhA', 'Button 1'], [34, 'J4-7', 'PC_7', 'Write', 'UART_3 TX', '(connected to gator clips)'], [35, 'J4-6', 'PC_6', 'Write', 'UART_3 RX, QE1 PhB', ''],
    [36, 'J4-5', 'PC_5', 'Write', 'UART_4 TX, QE1 PhA', ''], [37, 'J4-4', 'PC_4', 'Write', 'UART_4 RX, QE1 index', 'Blue LED'], [38, 'J4-3', 'PB_3', 'Write', 'I2C_0 SDA', 'Green LED'],
    [39, 'J4-2', 'PF_3', 'Write', 'Green LED, SPI_1 CS', 'Red LED, LCD backlight (see note)'], [40, 'J4-1', 'PF_2', 'Write', 'Blue LED, SPI_1 SCK', 'Buzzer']
  ];
  var PARTS = [
    ['A', 'Red LED / LCD backlight selection jumper', [39]], ['B', 'OPT3001 light sensor', [8, 9, 10]], ['C', 'TMP006 temperature sensor', [9, 10, 11]], ['D', '3-axis accelerometer', [23, 24, 25]],
    ['E', 'Buttons S1 and S2', [33, 32]], ['F', 'RGB LED', [37, 38, 39]], ['G', 'Buzzer', [40]], ['H', 'GPIO headers J2 and J4', []], ['J', 'LCD display', [7, 13, 15, 17, 31, 39]],
    ['K', 'GPIO headers J1 and J3', []], ['L', 'Microphone', [6]], ['M', 'Power indicator LEDs', []], ['N', '2-axis joystick with pushbutton', [2, 26, 5]]
  ];
  Lab.PINS = PINS;

  Lab.widgets.pinTable = function (root, o) {
    var st = { q: '', only: false, part: null };
    var q = h('input', { type: 'text', id: 'pin-q', placeholder: 'Search: pin number, PF_3, backlight, I2C...', 'aria-label': 'Filter the pin table', style: { width: '100%', maxWidth: '22rem' } });
    var only = h('label', { class: 'inline-check' }, h('input', { type: 'checkbox', onchange: function (e) { st.only = e.target.checked; draw(); } }), 'Only pins the MKII uses');
    q.addEventListener('input', function () { st.q = q.value.toLowerCase(); draw(); });
    var partsRow = h('div', { class: 'btn-row', role: 'group', 'aria-label': 'Board parts' });
    var view = h('div');
    root.appendChild(h('div', { class: 'field-row' }, h('div', { class: 'field' }, h('label', { for: 'pin-q' }, 'Find a pin'), q), only));
    root.appendChild(h('p', { class: 'lab' }, 'Or choose a part of the BoosterPack to see its pins'));
    root.appendChild(partsRow); root.appendChild(view);
    function drawParts() {
      Lab.clear(partsRow);
      PARTS.forEach(function (p) { partsRow.appendChild(h('button', { class: 'btn btn-sm', type: 'button', 'aria-pressed': st.part === p[0] ? 'true' : 'false', title: p[1], onclick: function () { st.part = st.part === p[0] ? null : p[0]; drawParts(); draw(); } }, p[0] + ' ' + p[1].split(' ').slice(0, 2).join(' '))); });
    }
    function draw() {
      Lab.clear(view);
      var part = PARTS.filter(function (p) { return p[0] === st.part; })[0];
      var rows = PINS.filter(function (p) {
        if (st.only && !p[5]) return false;
        if (part && part[2].indexOf(p[0]) < 0) return false;
        if (st.q && (p.join(' ').toLowerCase().indexOf(st.q) < 0)) return false;
        return true;
      });
      if (part) view.appendChild(h('p', {}, h('strong', {}, part[0] + ': ' + part[1]), part[2].length ? ' uses the pins below.' : ' has no signal pins of its own.'));
      var t = Lab.table(['Pin', 'Location', 'GPIO', 'Analog', 'LaunchPad purpose', 'MKII purpose'], rows.map(function (p) { return [h('strong', { class: 'mono' }, String(p[0])), p[1], h('span', { class: 'mono' }, p[2]), p[3], p[4], p[5] ? h('strong', {}, p[5]) : '']; }));
      view.appendChild(t);
      if (!rows.length) view.appendChild(h('p', { class: 'muted' }, 'No pins match.'));
      view.appendChild(h('p', { class: 'muted' }, 'Note from the manual: pin 39 is wired to a jumper that selects between the red LED and the LCD backlight. To use both, connect one of them with a jumper wire to an unused pin. The "Analog" column says whether the pin supports analog read, analog write, or both.'));
    }
    drawParts(); draw();
  };

  /* ---------- the clock from Lab 2 ---------- */
  Lab.widgets.clockLab = function (root, o) {
    var st = { hour: 1, minute: 0, second: 0, mode: 12, fix: true, timer: null, every: 1, ticks: 0 };
    var i32 = function (v) { return String(v).padStart(2, ' '); };    // i32toa(v, 1, 0, 2): right-aligned, 2 wide, no leading zeros
    var mode = h('div', { class: 'seg', role: 'group', 'aria-label': 'Hour rollover' });
    function drawMode() { Lab.clear(mode); [[12, 'Hour 1 to 12'], [24, 'Hour 0 to 23']].forEach(function (m) { mode.appendChild(h('button', { type: 'button', 'aria-pressed': st.mode === m[0] ? 'true' : 'false', onclick: function () { st.mode = m[0]; if (m[0] === 24 && st.hour === 12) st.hour = 0; if (m[0] === 12 && st.hour === 0) st.hour = 1; drawMode(); draw(); } }, m[1])); }); }
    drawMode();
    var fixBox = h('label', { class: 'inline-check' }, h('input', { type: 'checkbox', checked: true, onchange: function (e) { st.fix = e.target.checked; draw(); } }), 'Apply timeString.replace(": ", ":0")');
    root.appendChild(h('div', { class: 'field-row' }, h('div', { class: 'field' }, h('span', { class: 'lab' }, 'Your choice of rollover'), mode), h('div', { class: 'field' }, h('span', { class: 'lab' }, ' '), fixBox)));
    var lcd = h('div', { class: 'lcd mono', role: 'img' }), serial = h('div', { class: 'serial mono', 'aria-live': 'off' }), codeBox = h('div');
    root.appendChild(h('div', { class: 'clock-grid' },
      h('div', {}, h('p', { class: 'lab' }, 'LCD screen (white on black, scale 2)'), lcd),
      h('div', {}, h('p', { class: 'lab' }, 'Serial Monitor'), serial)));
    root.appendChild(codeBox);
    var ctl = h('div', { class: 'btn-row' });
    root.appendChild(ctl);
    var log = [];
    function tick() {
      st.second++; var rolled = [];
      if (st.second === 60) { st.minute++; st.second = 0; rolled.push('second hit 60: minute++ and second = 0'); }
      if (st.minute === 60) { st.hour++; st.minute = 0; rolled.push('minute hit 60: hour++ and minute = 0'); }
      if (st.mode === 12 && st.hour === 13) { st.hour = 1; rolled.push('hour passed 12: hour = 1'); }
      if (st.mode === 24 && st.hour === 24) { st.hour = 0; rolled.push('hour hit 24: hour = 0'); }
      st.last = rolled; st.ticks++;
      log.push('Hour=' + st.hour + ',minute=' + st.minute + ',second=' + st.second); if (log.length > 6) log.shift();
    }
    function timeString() { var t = i32(st.hour) + ':' + i32(st.minute) + ':' + i32(st.second); if (st.fix) t = t.split(': ').join(':0'); return t; }
    function draw() {
      var t = timeString();
      lcd.textContent = t; lcd.setAttribute('aria-label', 'LCD shows ' + t.replace(/ /g, 'space '));
      Lab.clear(serial); log.forEach(function (l) { serial.appendChild(h('div', {}, l)); }); if (!log.length) serial.appendChild(h('div', { class: 'muted' }, 'Nothing printed yet.'));
      Lab.clear(codeBox);
      codeBox.appendChild(h('pre', {}, h('code', { html: Lab.esc(
        'second++;                       // count one second\nif (second == 60) {             // when you reach 60 seconds\n  minute++;                     // count one minute\n  second = 0;                   // and reset the seconds\n}\nif (minute == 60) {\n  minute = 0;\n  hour++;\n}\nif (hour == ' + (st.mode === 12 ? '13' : '24') + ') hour = ' + (st.mode === 12 ? '1' : '0') + ';\n\ntimeString = i32toa(hour,1,0,2) + ":" + i32toa(minute,1,0,2) + ":" + i32toa(second,1,0,2);\n' + (st.fix ? 'timeString.replace(": ", ":0");\n' : '// (the replace line is off)\n')) })));
      if (st.last && st.last.length) codeBox.appendChild(h('p', { class: 'feedback good' }, 'This second: ' + st.last.join('; ') + '.'));
      if (!st.fix && /: /.test(i32(st.hour) + ':' + i32(st.minute) + ':' + i32(st.second))) codeBox.appendChild(h('p', { class: 'feedback bad' }, 'Without the replace line, i32toa pads with spaces, so the clock shows a space where a leading zero belongs. The replace turns every space after a colon into a zero. The hour is not preceded by a colon, so it keeps its space.'));
      Lab.clear(ctl);
      ctl.appendChild(h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: function () { stop(); tick(); draw(); } }, '+1 second'));
      ctl.appendChild(h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { stop(); for (var i = 0; i < 60; i++) tick(); draw(); } }, '+1 minute'));
      ctl.appendChild(h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { run(); } }, st.timer ? 'Pause' : 'Run'));
      ctl.appendChild(h('button', { class: 'btn btn-sm btn-quiet', type: 'button', onclick: function () { stop(); st.hour = st.mode === 12 ? 12 : 23; st.minute = 59; st.second = 55; st.last = null; log = []; draw(); } }, 'Jump to ' + (st.mode === 12 ? '12' : '23') + ':59:55'));
      ctl.appendChild(h('button', { class: 'btn btn-sm btn-quiet', type: 'button', onclick: function () { stop(); st.hour = st.mode === 12 ? 1 : 0; st.minute = 0; st.second = 0; st.last = null; log = []; draw(); } }, 'Reset'));
    }
    function stop() { if (st.timer) { clearInterval(st.timer); st.timer = null; } }
    function run() { if (st.timer) { stop(); draw(); return; } st.timer = setInterval(function () { if (!root.isConnected) { stop(); return; } tick(); draw(); }, reduce ? 300 : 500); draw(); }
    draw();
  };

  /* ---------- serial timing ---------- */
  Lab.widgets.baud = function (root, o) {
    var st = { baud: 9600, msg: 'Hour=1,minute=2,second=3', ln: true, clock: 80000000 };
    var sel = h('select', { id: 'bd', 'aria-label': 'Baud rate' }, [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map(function (b) { return h('option', { value: b, selected: b === st.baud }, String(b)); }));
    var msg = h('input', { type: 'text', id: 'bd-msg', value: st.msg, style: { width: '100%', maxWidth: '26rem' }, spellcheck: 'false', 'aria-label': 'Text sent' });
    var ln = h('label', { class: 'inline-check' }, h('input', { type: 'checkbox', checked: true, onchange: function (e) { st.ln = e.target.checked; draw(); } }), 'Serial.println (adds carriage return and newline)');
    sel.addEventListener('change', function () { st.baud = +sel.value; draw(); });
    msg.addEventListener('input', function () { st.msg = msg.value; draw(); });
    root.appendChild(h('div', { class: 'field-row' }, h('div', { class: 'field' }, h('label', { for: 'bd' }, 'Baud rate'), sel), h('div', { class: 'field' }, h('label', { for: 'bd-msg' }, 'What you print'), msg), h('div', { class: 'field' }, h('span', { class: 'lab' }, ' '), ln)));
    var out = h('div'); root.appendChild(out);
    function draw() {
      Lab.clear(out);
      var chars = st.msg.length + (st.ln ? 2 : 0), bits = chars * 10, secs = bits / st.baud, ms = secs * 1000;
      var instr = Math.round(secs * st.clock);
      out.appendChild(h('div', { class: 'load-out' },
        h('div', {}, h('span', { class: 'lab' }, 'Characters sent'), h('div', { class: 'mono big' }, String(chars))),
        h('div', {}, h('span', { class: 'lab' }, 'Time on the wire'), h('div', { class: 'mono big' }, ms.toFixed(ms < 10 ? 2 : 1) + ' ms')),
        h('div', {}, h('span', { class: 'lab' }, 'Throughput'), h('div', { class: 'mono big' }, Math.round(st.baud / 10) + ' bytes/s'))));
      out.appendChild(h('p', { html: Lab.fmt('Each character is sent as 10 bits (a start bit, 8 data bits and a stop bit), so ' + st.baud + ' baud carries about **' + Math.round(st.baud / 10) + ' characters per second**. Sending these ' + chars + ' characters takes ' + ms.toFixed(1) + ' ms. In that time an 80 MHz processor could execute roughly **' + instr.toLocaleString('en-US') + ' instructions** at one per clock cycle.') }));
      out.appendChild(h('p', { class: 'muted' }, 'This assumes the default 8 data bits, no parity and 1 stop bit (8N1), which the lab manual does not state. The 80 MHz clock is the figure the manual gives. This is why the manual says reading the sensor and printing every pass of loop() would swamp the serial link.'));
    }
    draw();
  };

  /* ---------- light sensor to PWM backlight ---------- */
  function arduinoMap(x, a, b, c, d) { if (b === a) return c; return Math.trunc(((x - a) * (d - c)) / (b - a)) + c; }
  Lab.widgets.lightPwm = function (root, o) {
    var st = { lo: 20, hi: 400, reading: 200 };
    function numField(id, label, val, set) {
      var inp = h('input', { type: 'text', id: id, value: String(val), style: { width: '6em' }, inputmode: 'numeric', 'aria-label': label });
      inp.addEventListener('input', function () { var v = parseInt(inp.value, 10); inp.classList.toggle('bad', isNaN(v)); if (!isNaN(v)) { set(v); draw(); } });
      return h('div', { class: 'field' }, h('label', { for: id }, label), inp);
    }
    var slider = h('input', { type: 'range', min: 0, max: 600, value: st.reading, id: 'lp-r', 'aria-label': 'Light sensor reading' });
    var rOut = h('output', { for: 'lp-r', class: 'mono' }, String(st.reading));
    slider.addEventListener('input', function () { st.reading = +slider.value; rOut.textContent = st.reading; draw(); });
    root.appendChild(h('div', { class: 'field-row' }, numField('lp-lo', 'Lowest light level you noted', st.lo, function (v) { st.lo = v; }), numField('lp-hi', 'Highest light level you noted', st.hi, function (v) { st.hi = v; }),
      h('div', { class: 'field', style: { flex: '1 1 14rem' } }, h('label', { for: 'lp-r' }, 'Sensor reading: ', rOut), slider)));
    var out = h('div'); root.appendChild(out);
    function draw() {
      Lab.clear(out);
      var raw = arduinoMap(st.reading, st.lo, st.hi, 50, 255), con = Math.min(255, Math.max(50, raw));
      out.appendChild(h('pre', {}, h('code', { html: Lab.esc('int backlight = map(readings, ' + st.lo + ', ' + st.hi + ', 50, 255);   // ' + raw + '\nbacklight = constrain(backlight, 50, 255);        // ' + con + '\nanalogWrite(Pin_Backlight, backlight);            // duty = ' + con + ' / 255 = ' + Math.round(con / 255 * 100) + '%') })));
      if (raw !== con) out.appendChild(h('p', { class: 'feedback' }, 'map() does not clamp. The reading is outside the range you noted, so map gave ' + raw + ', and constrain pulled it back to ' + con + '.'));
      // PWM waveform
      var W = 600, H = 90, per = 8, pw = W / per;
      var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + (H + 22), class: 'pwmsvg', role: 'img', 'aria-label': 'Pulse width modulation waveform at duty ' + Math.round(con / 255 * 100) + ' percent' });
      var d = 'M0 ' + H;
      for (var i = 0; i < per; i++) { var x0 = i * pw, on = pw * con / 255; d += ' L' + x0 + ' ' + 12 + ' L' + (x0 + on) + ' ' + 12 + ' L' + (x0 + on) + ' ' + H + ' L' + (x0 + pw) + ' ' + H; }
      svg.appendChild(s('path', { d: d, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
      var avg = H - (H - 12) * con / 255;
      svg.appendChild(s('line', { x1: 0, y1: avg, x2: W, y2: avg, stroke: 'var(--fC)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }));
      svg.appendChild(s('text', { x: W - 4, y: avg - 6, 'text-anchor': 'end', fill: 'var(--fC)', 'font-size': 12, 'font-weight': 600 }, ['average level']));
      svg.appendChild(s('text', { x: 2, y: H + 17, fill: 'var(--ink-3)', 'font-size': 12 }, ['The pin switches fully on and fully off very fast. Time on per period: ' + Math.round(con / 255 * 100) + '%.']));
      out.appendChild(svg);
      var box = h('div', { class: 'lcd-prev', 'aria-hidden': 'true', style: { opacity: String(0.15 + 0.85 * con / 255) } }, 'LCD backlight');
      out.appendChild(h('div', { class: 'backlight-row' }, box, h('p', { class: 'muted' }, 'An 8-bit analogWrite takes 0 to 255. The lab floors the value at 50 so the backlight never turns completely off. The average level the LCD sees is the duty cycle times full brightness.')));
    }
    draw();
  };

  /* how fast the backlight reacts: 1 Hz versus every pass of loop() */
  Lab.widgets.reactSpeed = function (root, o) {
    var st = { rate: 1, noise: 12 };
    var seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Update rate' });
    function drawSeg() { Lab.clear(seg); [[1, 'Once per second (the lab as written)'], [10, '10 times per second'], [100, 'Every pass of loop()']].forEach(function (r) { seg.appendChild(h('button', { type: 'button', 'aria-pressed': st.rate === r[0] ? 'true' : 'false', onclick: function () { st.rate = r[0]; drawSeg(); draw(); } }, r[1])); }); }
    drawSeg();
    var nz = h('input', { type: 'range', min: 0, max: 40, value: st.noise, id: 'rs-n', 'aria-label': 'Sensor noise' });
    nz.addEventListener('input', function () { st.noise = +nz.value; draw(); });
    root.appendChild(h('div', { class: 'field-row' }, h('div', { class: 'field' }, h('span', { class: 'lab' }, 'Backlight updates'), seg), h('div', { class: 'field' }, h('label', { for: 'rs-n' }, 'Sensor noise (reading units)'), nz)));
    var out = h('div'); root.appendChild(out);
    function rng(i) { var x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }
    function draw() {
      Lab.clear(out);
      var W = 640, H = 240, L = 44, R = 16, T = 14, B = 34, T_END = 3, NPTS = 600;
      var x = function (t) { return L + (t / T_END) * (W - L - R); }, y = function (v) { return T + (1 - (v - 40) / (270 - 40)) * (H - T - B); };
      var targetAt = function (t) { return t < 1.3 ? 90 : 230; };       // the room gets bright at t = 1.3 s
      var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart', role: 'img', 'aria-label': 'Backlight value over three seconds when the room brightens at 1.3 seconds, for the chosen update rate' });
      [50, 100, 150, 200, 255].forEach(function (v) { svg.appendChild(s('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: 'var(--line)', 'stroke-width': 1 })); svg.appendChild(s('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end', fill: 'var(--ink-3)', 'font-size': 11 }, [String(v)])); });
      [0, 1, 2, 3].forEach(function (t) { svg.appendChild(s('text', { x: x(t), y: H - 14, 'text-anchor': 'middle', fill: 'var(--ink-3)', 'font-size': 11 }, [t + ' s'])); });
      svg.appendChild(s('text', { x: L + 4, y: T + 10, fill: 'var(--ink-3)', 'font-size': 11 }, ['backlight value (50 to 255)']));
      // ideal
      var pts = '', ptsB = '', held = 0, lastU = -1;
      for (var i = 0; i <= NPTS; i++) {
        var t = i / NPTS * T_END, ideal = targetAt(t);
        pts += (i ? ' L' : 'M') + x(t) + ' ' + y(ideal);
        var slot = Math.floor(t * st.rate);
        if (slot !== lastU) { lastU = slot; var tt = slot / st.rate; held = Math.min(255, Math.max(50, targetAt(tt) + (rng(slot) - 0.5) * 2 * st.noise)); }
        ptsB += (i ? ' L' : 'M') + x(t) + ' ' + y(held);
      }
      svg.appendChild(s('path', { d: pts, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '5 4' }));
      svg.appendChild(s('path', { d: ptsB, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2.6, 'stroke-linejoin': 'round' }));
      svg.appendChild(s('text', { x: x(1.38), y: y(235) - 8, fill: 'var(--ink-3)', 'font-size': 12 }, ['what the room needs']));
      svg.appendChild(s('text', { x: x(0.05), y: y(st.rate === 100 ? 55 : 82) + 14, fill: 'var(--accent)', 'font-size': 12, 'font-weight': 600 }, ['what the backlight does']));
      out.appendChild(h('figure', { class: 'figure' }, svg, h('figcaption', { class: 'muted' }, 'Illustrative simulation with made-up numbers, not data from your board. The room gets brighter at 1.3 s. With one update per second the backlight keeps the old value until the next update. With very fast updates it follows the room immediately but also follows the sensor noise.')));
      var lag = st.rate === 1 ? 'up to 1 s of delay' : st.rate === 10 ? 'up to 0.1 s of delay' : 'almost no delay';
      out.appendChild(h('p', { html: Lab.fmt('Reaction: **' + lag + '**. Noise: the backlight wobbles by about ±' + (st.rate === 1 ? st.noise : st.noise) + ' units around the true value at every update, and at a fast rate you see that wobble as flicker.') }));
    }
    draw();
  };
})(window);
