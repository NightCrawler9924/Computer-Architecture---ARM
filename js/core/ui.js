/* Shared UI helpers, the progress store and the registries every other file plugs into. */
(function (g) {
  'use strict';
  var E = g.E359;
  var Lab = g.Lab = g.Lab || {};
  Lab.units = [];          // course map, filled by content/manifest.js
  Lab.lessons = {};        // id -> lesson, filled by each content file
  Lab.widgets = {};        // name -> function(container, options)
  Lab.pages = {};          // name -> function(container, args)
  Lab.diagrams = {};       // name -> function() -> Element
  Lab.generators = {};     // practice question generators

  /* ---------- DOM ---------- */
  Lab.h = function (tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'dataset') Object.keys(v).forEach(function (d) { el.dataset[d] = v[d]; });
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      });
    }
    if ((tag === 'input' && (el.type === 'text' || !el.type)) || tag === 'textarea') { el.setAttribute('autocapitalize', 'off'); el.setAttribute('autocorrect', 'off'); el.setAttribute('spellcheck', 'false'); if (!el.hasAttribute('autocomplete')) el.setAttribute('autocomplete', 'off'); }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  };
  function append(el, kid) {
    if (kid === null || kid === undefined || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(function (k) { append(el, k); }); return; }
    if (kid instanceof Node) el.appendChild(kid);
    else el.appendChild(document.createTextNode(String(kid)));
  }
  var h = Lab.h;
  Lab.esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  Lab.clear = function (el) { while (el.firstChild) el.removeChild(el.firstChild); return el; };

  /* Inline formatting for content strings: `code` and **bold**. Everything else is trusted HTML. */
  Lab.fmt = function (s) {
    s = String(s);
    var parts = s.split('`'), out = '';
    for (var i = 0; i < parts.length; i++) {
      if (i % 2 === 1) out += '<code>' + Lab.esc(parts[i]) + '</code>';
      else out += parts[i].replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    }
    return out;
  };

  /* ---------- storage that never throws ---------- */
  var mem = {};
  function lsGet(k) { try { var v = localStorage.getItem(k); return v === null ? (k in mem ? mem[k] : null) : v; } catch (e) { return k in mem ? mem[k] : null; } }
  function lsSet(k, v) { mem[k] = v; try { localStorage.setItem(k, v); } catch (e) { /* private mode: keep in memory */ } }
  Lab.lsGet = lsGet; Lab.lsSet = lsSet;

  var P = { done: {}, quiz: {}, practice: { answered: 0, correct: 0, bestStreak: 0, byTopic: {} }, diag: null };
  try { var raw = lsGet('e359.progress'); if (raw) P = Object.assign(P, JSON.parse(raw)); } catch (e) { /* ignore corrupt data */ }
  Lab.progress = P;
  Lab.saveProgress = function () { lsSet('e359.progress', JSON.stringify(P)); Lab.emit('progress'); };
  Lab.isDone = function (id) { return !!P.done[id]; };
  Lab.setDone = function (id, v) { if (v) P.done[id] = true; else delete P.done[id]; Lab.saveProgress(); };
  Lab.resetProgress = function () { P.done = {}; P.quiz = {}; P.practice = { answered: 0, correct: 0, bestStreak: 0, byTopic: {} }; P.basics = {}; P.diag = null; Lab.saveProgress(); };

  var listeners = {};
  Lab.on = function (ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); };
  Lab.emit = function (ev, a) { (listeners[ev] || []).forEach(function (f) { f(a); }); };

  Lab.toast = function (msg) {
    var t = h('div', { class: 'toast', role: 'status' }, msg);
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2600);
  };

  Lab.copy = function (text) {
    function fallback() {
      var ta = h('textarea', { style: { position: 'fixed', opacity: '0' } }); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); Lab.toast('Copied.'); } catch (e) { Lab.toast('Select the text and copy it yourself.'); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { Lab.toast('Copied.'); }, fallback);
    else fallback();
  };

  /* ---------- numbers ---------- */
  Lab.hex = E.hex;
  Lab.parseNum = E.parseValue;
  Lab.rnd = function (n) { return Math.floor(Math.random() * n); };
  Lab.pick = function (a) { return a[Lab.rnd(a.length)]; };
  Lab.rand32 = function () { return ((Math.random() * 0x10000 & 0xFFFF) * 0x10000 + (Math.random() * 0x10000 & 0xFFFF)) >>> 0; };
  Lab.shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Lab.rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };

  /* ---------- small components ---------- */
  Lab.flagChips = function (f, opts) {
    opts = opts || {};
    var wrap = h('div', { class: 'flags', role: 'group', 'aria-label': 'Condition flags' });
    ['N', 'Z', 'C', 'V'].forEach(function (k) {
      var on = f[k] === 1, tag = opts.click ? 'button' : 'div';
      var chip = h(tag, { class: 'flag ' + (on ? 'on' : 'off') + (opts.changed && opts.changed[k] ? ' changed' : ''), 'data-f': k, title: Lab.flagTitle[k], 'aria-label': Lab.flagTitle[k] + ' = ' + f[k] },
        h('span', { class: 'k' }, k), h('span', { class: 'v' }, String(f[k])));
      if (opts.click) { chip.type = 'button'; chip.addEventListener('click', function () { opts.click(k); }); }
      wrap.appendChild(chip);
    });
    return wrap;
  };
  Lab.flagTitle = { N: 'N (negative): bit 31 of the result', Z: 'Z (zero): the result is exactly zero', C: 'C (carry): carry out of bit 31, or the last bit shifted out', V: 'V (overflow): signed overflow' };
  Lab.flagStr = function (f) { return 'N=' + f.N + ' Z=' + f.Z + ' C=' + f.C + ' V=' + f.V; };

  /* 32 bits in nibbles. opts: out[] bit indexes to mark as shifted out, inn[] as shifted in, idx:true shows bit numbers */
  Lab.bitsEl = function (x, opts) {
    opts = opts || {};
    var s = E.bin(x, 32), wrap = h('div', { class: 'bits', 'aria-label': E.binGroups(x) });
    var outSet = {}, inSet = {};
    (opts.out || []).forEach(function (i) { outSet[i] = 1; }); (opts.inn || []).forEach(function (i) { inSet[i] = 1; });
    for (var n = 0; n < 8; n++) {
      var nib = h('div', { class: 'nib' });
      for (var k = 0; k < 4; k++) {
        var pos = n * 4 + k, idx = 31 - pos, bit = s[pos];
        var cls = 'bit' + (bit === '1' ? ' one' : '') + (outSet[idx] ? ' out' : '') + (inSet[idx] ? ' in' : '') + (opts.last === idx ? ' last' : '');
        nib.appendChild(h('div', {}, opts.idx ? h('div', { class: 'bit-idx' }, String(idx)) : null, h('div', { class: cls }, bit)));
      }
      wrap.appendChild(nib);
    }
    return wrap;
  };

  Lab.hexDigitsEl = function (x, opts) {
    var s = E.hexDigits(x), row = h('div', { class: 'hexrow', 'aria-label': E.hex(x) });
    for (var i = 0; i < 8; i++) row.appendChild(h('div', { class: 'd' + (opts && opts.cls ? ' ' + opts.cls[i] : '') }, s[i]));
    return row;
  };

  Lab.table = function (head, rows, opts) {
    opts = opts || {};
    var t = h('table', {}, h('thead', {}, h('tr', {}, head.map(function (c, i) { return h('th', { scope: 'col', class: (opts.center && opts.center.indexOf(i) >= 0) ? 'c' : '' }, c); }))),
      h('tbody', {}, rows.map(function (r) { return h('tr', {}, r.map(function (c, i) { var cell = h('td', { class: (opts.center && opts.center.indexOf(i) >= 0) ? 'c' : '' }); if (c instanceof Node) cell.appendChild(c); else cell.innerHTML = Lab.fmt(c); return cell; })); })));
    return h('div', { class: 'table-wrap' }, t);
  };

  /* hex text field that validates as you type. returns {el, input, get(), set(v)} */
  Lab.hexField = function (o) {
    o = o || {};
    var id = 'hf' + Math.random().toString(36).slice(2, 8);
    var input = h('input', { type: 'text', id: id, class: 'hex-in', value: o.value !== undefined ? E.hex(o.value) : '', spellcheck: 'false', autocomplete: 'off', 'aria-label': o.label || 'Hex value', placeholder: o.placeholder || '0x00000000', inputmode: 'text' });
    function validate() { var v = E.parseValue(input.value); var badv = input.value.trim() !== '' && v === null; input.classList.toggle('bad', badv); input.setAttribute('aria-invalid', badv ? 'true' : 'false'); return v; }
    input.addEventListener('input', function () { var v = validate(); if (v !== null && o.onChange) o.onChange(v); });
    input.addEventListener('blur', function () { var v = E.parseValue(input.value); if (v !== null && /^[0-9a-f]+$/i.test(input.value.trim())) input.value = E.hex(v); });
    var el = h('div', { class: 'field' }, o.label ? h('label', { for: id }, o.label) : null, input);
    return { el: el, input: input, get: function () { return E.parseValue(input.value); }, set: function (v) { input.value = E.hex(v); input.classList.remove('bad'); } };
  };

  /* ---------- assembly highlighting ---------- */
  Lab.asmHtml = function (src) {
    return String(src).split('\n').map(function (line) {
      var com = '', code = line;
      var ci = line.search(/;|@|\/\//);
      if (ci >= 0) { code = line.slice(0, ci); com = line.slice(ci); }
      var out = Lab.esc(code);
      out = out.replace(/^([A-Za-z_.][\w.$]*:?)(?=\s|$)/, function (m) {
        var up = m.replace(':', '').toUpperCase();
        return (E.parseMnemonic(up) || /^(DCD|DCW|DCB|SPACE|EQU|END|AREA|ENTRY|ALIGN)$/.test(up)) && m.slice(-1) !== ':' ? m : '<span class="l">' + m + '</span>';
      });
      out = out.replace(/(^|\s|:)([A-Za-z]{2,7})(?=\s|$)/, function (m, a, b) {
        if (E.parseMnemonic(b.toUpperCase()) || /^(DCD|DCW|DCB|SPACE|EQU|END|AREA|ENTRY|ALIGN|PUSH|POP)$/i.test(b)) return a + '<span class="m">' + b + '</span>';
        return m;
      });
      out = out.replace(/\b(R1[0-5]|R[0-9]|SP|LR|PC|r1[0-5]|r[0-9]|sp|lr|pc)\b/g, '<span class="r">$1</span>');
      out = out.replace(/(#&amp;[0-9a-fA-F]+|#-?0x[0-9a-fA-F]+|#-?\d+|=0x[0-9a-fA-F]+|=\d+)/g, '<span class="i">$1</span>');
      return out + (com ? '<span class="c">' + Lab.esc(com) + '</span>' : '');
    }).join('\n');
  };
  Lab.codeBlock = function (src, opts) {
    opts = opts || {};
    var pre = h('pre', {}, h('code', { html: Lab.asmHtml(src) }));
    var wrap = h('div', { class: 'asm-wrap' }, pre);
    if (opts.run !== false) wrap.appendChild(h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { Lab.openInSim(src, opts.init); } }, 'Open in simulator'));
    return wrap;
  };
  Lab.openInSim = function (code, init) {
    try { sessionStorage.setItem('e359.simload', JSON.stringify({ code: code, init: init || null })); } catch (e) { Lab.pendingSim = { code: code, init: init || null }; }
    Lab.pendingSim = { code: code, init: init || null };
    location.hash = '#/sim';
  };

  /* ---------- theme ---------- */
  Lab.theme = {
    get: function () { var t = lsGet('e359.theme'); return t === 'light' || t === 'dark' || t === 'system' ? t : 'system'; },
    set: function (t) {
      lsSet('e359.theme', t);
      var de = document.documentElement;
      if (t === 'system') { de.removeAttribute('data-theme'); de.removeAttribute('data-system'); } else { de.setAttribute('data-theme', t); }
      if (Lab.syncThemeColor) Lab.syncThemeColor();
    },
    effective: function () {
      var t = Lab.theme.get();
      if (t !== 'system') return t;
      return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
  };

  /* the browser chrome colour follows the chosen theme, not just the device setting */
  Lab.syncThemeColor = function () {
    var dark = Lab.theme.effective() === 'dark', color = dark ? '#101113' : '#F5F5F3';
    Array.prototype.forEach.call(document.querySelectorAll('meta[name="theme-color"][media]'), function (m) { m.remove(); });
    var m = document.querySelector('meta[name="theme-color"]');
    if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
    m.content = color;
  };
  (function () { var t = Lab.theme.get(), de = document.documentElement; if (t === 'system') de.removeAttribute('data-theme'); else de.setAttribute('data-theme', t); })();
  Lab.syncThemeColor();
  if (window.matchMedia) { var mq = matchMedia('(prefers-color-scheme: dark)'); (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(function () { Lab.syncThemeColor(); }); }
})(window);
