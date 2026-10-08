/* Memory widgets: endianness, and a load lab covering word/halfword/byte loads and the three indexing modes. */
(function (g) {
  'use strict';
  var E = g.E359, Lab = g.Lab, h = Lab.h;
  var hx = E.hex;

  /* ---------- endianness ---------- */
  Lab.widgets.endian = function (root, o) {
    o = o || {};
    var st = { w: o.w !== undefined ? o.w >>> 0 : 0xA7908CEE, base: o.base !== undefined ? o.base >>> 0 : 0x20008000, size: 'LDR' };
    var fw = Lab.hexField({ value: st.w, label: 'The 32-bit word', onChange: function (v) { st.w = v; render(); } });
    var fbase = Lab.hexField({ value: st.base, label: 'Stored at address', onChange: function (v) { st.base = v; render(); } });
    root.appendChild(h('div', { class: 'field-row' }, fw.el, fbase.el));
    var view = h('div'); root.appendChild(view);
    var shade = ['b0', 'b1', 'b2', 'b3'];

    function stack(bytes, label, note) {
      var box = h('div', { class: 'memstack' }, h('div', { class: 'subhead' }, label), h('p', { class: 'muted' }, note));
      for (var i = 3; i >= 0; i--) {
        box.appendChild(h('div', { class: 'memrow' }, h('span', { class: 'addr mono' }, hx((st.base + i) >>> 0)), h('span', { class: 'bytecell mono ' + shade[bytes[i].sig] }, bytes[i].v.toString(16).toUpperCase().padStart(2, '0')), h('span', { class: 'sig' }, bytes[i].sig === 3 ? 'most significant byte' : bytes[i].sig === 0 ? 'least significant byte' : '')));
      }
      return box;
    }
    function render() {
      Lab.clear(view);
      var b = [st.w & 0xFF, (st.w >>> 8) & 0xFF, (st.w >>> 16) & 0xFF, st.w >>> 24];   // b[0] = least significant
      var little = [0, 1, 2, 3].map(function (i) { return { v: b[i], sig: i }; });
      var big = [0, 1, 2, 3].map(function (i) { return { v: b[3 - i], sig: 3 - i }; });
      view.appendChild(h('p', { style: { marginTop: '12px' } }, 'The word is ', h('code', {}, hx(st.w)), '. Memory holds one byte per address, so the four bytes have to be laid out in some order. The most significant byte is the one written first (leftmost) in the hex number.'));
      view.appendChild(h('div', { class: 'memstacks' },
        stack(little, 'Little-endian (ARM default)', 'The least significant byte sits at the lowest address.'),
        stack(big, 'Big-endian', 'The most significant byte sits at the lowest address.')));
      view.appendChild(h('p', { html: Lab.fmt('Either way you name the word by its **lowest** address, ' + '`' + hx(st.base) + '`' + '. Endianness is about the order of bytes, never the order of bits inside a byte.') }));
      view.appendChild(h('p', { class: 'muted', html: Lab.fmt('Memory table to word, little-endian: read the bytes from the **highest** address down to the lowest. For the table above that gives `' + hx(st.w) + '`.') }));
    }
    render();
  };

  /* ---------- load lab ---------- */
  var INSTR = [
    { k: 'LDR', t: 'LDR', note: 'Loads a whole word (4 bytes).' },
    { k: 'LDRH', t: 'LDRH', note: 'Loads a halfword (2 bytes) and zero-extends it.' },
    { k: 'LDRSH', t: 'LDRSH', note: 'Loads a halfword and sign-extends it.' },
    { k: 'LDRB', t: 'LDRB', note: 'Loads one byte and zero-extends it.' },
    { k: 'LDRSB', t: 'LDRSB', note: 'Loads one byte and sign-extends it.' },
    { k: 'STR', t: 'STR', note: 'Stores R1 into memory as a word.' }
  ];
  Lab.widgets.loadLab = function (root, o) {
    o = o || {};
    var bytes = (o.bytes || [0x1F, 0x2E, 0x3D, 0x4C, 0x5B, 0x6A, 0x79, 0x88]).slice();
    var st = { base: o.base !== undefined ? o.base >>> 0 : 0x20008000, ins: o.ins || 'LDR', mode: o.mode || 'pre', off: o.off !== undefined ? o.off : 4, r1: 0xCAFEF00D };
    var fbase = Lab.hexField({ value: st.base, label: 'R0 (base address)', onChange: function (v) { st.base = v; render(); } });
    var insSel = h('select', { id: 'll-ins', 'aria-label': 'Instruction' }, INSTR.map(function (i) { return h('option', { value: i.k, selected: i.k === st.ins }, i.t); }));
    var modeSel = h('select', { id: 'll-mode', 'aria-label': 'Addressing mode' },
      [['pre', 'Pre-index  [R0, #off]'], ['post', 'Post-index  [R0], #off'], ['auto', 'Auto-index  [R0, #off]!']].map(function (m) { return h('option', { value: m[0], selected: m[0] === st.mode }, m[1]); }));
    var offIn = h('input', { type: 'text', id: 'll-off', value: String(st.off), 'aria-label': 'Offset in bytes', style: { width: '5em' }, inputmode: 'numeric' });
    insSel.addEventListener('change', function () { st.ins = insSel.value; render(); });
    modeSel.addEventListener('change', function () { st.mode = modeSel.value; render(); });
    offIn.addEventListener('input', function () { var v = parseInt(offIn.value, 10); offIn.classList.toggle('bad', isNaN(v) || Math.abs(v) > 255); if (!isNaN(v) && Math.abs(v) <= 255) { st.off = v; render(); } });
    root.appendChild(h('div', { class: 'field-row' }, fbase.el,
      h('div', { class: 'field' }, h('label', { for: 'll-ins' }, 'Instruction'), insSel),
      h('div', { class: 'field' }, h('label', { for: 'll-mode' }, 'Addressing mode'), modeSel),
      h('div', { class: 'field' }, h('label', { for: 'll-off' }, 'Offset (bytes)'), offIn)));

    var memEdit = h('div', { class: 'memedit' });
    root.appendChild(h('p', { class: 'lab', style: { marginTop: '8px' } }, 'Memory contents (edit any byte, hex)'));
    root.appendChild(memEdit);
    var view = h('div'); root.appendChild(view);

    function render() {
      Lab.clear(view);
      var off = st.off, ins = st.ins;
      var offTxt = (off < 0 ? '-' : '') + '#' + Math.abs(off);
      var addrTxt = st.mode === 'pre' ? '[R0, ' + offTxt + ']' : st.mode === 'post' ? '[R0], ' + offTxt : '[R0, ' + offTxt + ']!';
      var line = ins + ' R1, ' + addrTxt;
      view.appendChild(h('p', { style: { marginTop: '12px' } }, 'Assembled as: ', h('code', {}, line)));
      var mem = [{ addr: st.base, bytes: bytes }];
      var src = '  ' + line + '\nstop B stop';
      var res = E.runProgram(src, { regs: { R0: st.base, R1: st.r1 }, mem: mem });
      if (!res.asm.ok) { view.appendChild(h('div', { class: 'feedback bad' }, res.asm.errors[0].msg)); return; }
      var cpu = res.cpu, t = res.trace[0] || {};
      var ea = t.ea;
      // memory grid with the touched bytes marked
      var span = Math.max(bytes.length, 8);
      var grid = h('div', { class: 'memgrid' });
      var touched = {};
      (t.memOps || []).forEach(function (m) { for (var i = 0; i < m.n; i++) touched[(m.addr + i) >>> 0] = m.kind; });
      for (var i = 0; i < span; i++) {
        var a = (st.base + i) >>> 0, v = cpu.readByte(a), tk = touched[a];
        grid.appendChild(h('div', { class: 'mcell' + (tk === 'r' ? ' read' : tk === 'w' ? ' wrote' : '') }, h('span', { class: 'addr mono' }, hx(a)), h('span', { class: 'mono val' }, v.toString(16).toUpperCase().padStart(2, '0'))));
      }
      view.appendChild(grid);
      if (cpu.haltReason && /Alignment/.test(cpu.haltReason) && !ea) {
        var badAddr = st.mode === 'post' ? st.base : (st.base + off) >>> 0;
        view.appendChild(h('div', { class: 'feedback bad' }, h('strong', { class: 'verdict' }, 'Alignment fault'), h('div', {}, cpu.haltReason + ' Word accesses need an address divisible by 4, halfword accesses divisible by 2.')));
        return;
      }
      var out = h('div', { class: 'load-out' },
        h('div', {}, h('span', { class: 'lab' }, 'Address accessed'), h('div', { class: 'mono big' }, ea !== undefined ? hx(ea) : '-')),
        ins === 'STR' ? h('div', {}, h('span', { class: 'lab' }, 'Memory afterwards'), h('div', { class: 'mono big' }, hx(cpu.readN(ea, 4)))) : h('div', {}, h('span', { class: 'lab' }, 'R1 afterwards'), h('div', { class: 'mono big' }, hx(cpu.reg[1]))),
        h('div', {}, h('span', { class: 'lab' }, 'R0 afterwards'), h('div', { class: 'mono big' }, hx(cpu.reg[0])), cpu.reg[0] === st.base ? h('span', { class: 'muted' }, 'unchanged') : h('span', { class: 'fC' }, 'changed')));
      view.appendChild(out);
      view.appendChild(h('p', { html: Lab.fmt(t.msg || '') }));
      var note = (INSTR.filter(function (x) { return x.k === ins; })[0] || {}).note || '';
      var modeNote = st.mode === 'pre' ? 'Pre-index: the offset is added for this access only. R0 does not change.' : st.mode === 'post' ? 'Post-index: the access uses R0 as it is, then R0 is updated by the offset. The offset is outside the brackets, so it happens after.' : 'Auto-index: the offset is added first, the access uses the new address, and R0 keeps it. The ! means write the address back.';
      view.appendChild(h('p', { class: 'muted' }, note + ' ' + modeNote));
      if (ins !== 'STR' && ea !== undefined && (ins === 'LDR')) {
        var bs = []; for (var j = 3; j >= 0; j--) bs.push(cpu.readByte(ea + j).toString(16).toUpperCase().padStart(2, '0'));
        view.appendChild(h('p', { class: 'muted', html: Lab.fmt('Little-endian: bytes ' + bs.map(function (x) { return '`' + x + '`'; }).join(' ') + ' (highest address first) make up the word `' + hx(cpu.reg[1]) + '`.') }));
      }
    }
    function drawEdit() {
      Lab.clear(memEdit);
      bytes.forEach(function (v, i) {
        var inp = h('input', { type: 'text', value: v.toString(16).toUpperCase().padStart(2, '0'), style: { width: '3.2em', textAlign: 'center' }, 'aria-label': 'Byte at base plus ' + i, spellcheck: 'false' });
        inp.addEventListener('input', function () { var n = parseInt(inp.value, 16); inp.classList.toggle('bad', !/^[0-9a-f]{1,2}$/i.test(inp.value)); if (/^[0-9a-f]{1,2}$/i.test(inp.value)) { bytes[i] = n; render(); } });
        memEdit.appendChild(h('div', { class: 'field' }, h('span', { class: 'lab mono' }, '+' + i), inp));
      });
    }
    drawEdit(); render();
  };
})(window);
