/* One question component used by lessons, quizzes and the practice page.
   Kinds:
     mcq    { q, opts[], ans, why }
     input  { q, a:[...] or check(fn), type:'hex'|'num'|'bin'|'text', why, unit }
     multi  { q, fields:[{label, a, type}], why }
     flags  { q, expect:{N,Z,C,V}, res?:uint32, why }       (result field optional)
   Every question grades itself and calls opts.onDone(correct) once. */
(function (g) {
  'use strict';
  var E = g.E359, Lab = g.Lab, h = Lab.h;

  function norm(s) { return String(s).toLowerCase().replace(/[\s,;:]+/g, '').replace(/^0x/, ''); }
  function sameValue(type, got, want) {
    if (type === 'text') return norm(got) === norm(want);
    if (type === 'bin') {
      var g1 = String(got).replace(/[\s_]/g, '').replace(/^0b/i, ''), w1 = String(want).replace(/[\s_]/g, '').replace(/^0b/i, '');
      return /^[01]+$/.test(g1) && parseInt(g1, 2) === parseInt(w1, 2);
    }
    var a = E.parseValue(got), b = typeof want === 'number' ? (want >>> 0) : E.parseValue(want);
    return a !== null && b !== null && a === b;
  }
  Lab.sameValue = sameValue;

  function verdict(ok, msg, whyHtml) {
    var fb = h('div', { class: 'feedback ' + (ok ? 'good' : 'bad'), role: 'status', 'aria-live': 'polite' });
    fb.appendChild(h('strong', { class: 'verdict' }, ok ? 'Correct.' : 'Not quite.'));
    if (msg) fb.appendChild(h('div', { html: Lab.fmt(msg) }));
    if (whyHtml) fb.appendChild(h('div', { html: Lab.fmt(whyHtml) }));
    return fb;
  }

  Lab.question = function (q, opts) {
    opts = opts || {};
    var root = h('div', { class: 'question' });
    var done = false;
    function finish(ok) { if (done) return; done = true; if (opts.onDone) opts.onDone(ok); }
    var fbSlot = h('div');

    if (q.q) root.appendChild(h('div', { class: 'q', html: Lab.fmt(q.q) }));
    if (q.pre) root.appendChild(q.pre instanceof Node ? q.pre : h('div', { html: q.pre }));

    if (q.kind === 'mcq') {
      var list = h('div', { class: 'opts', role: 'group', 'aria-label': 'Choices' });
      var letters = 'ABCDEFGH';
      q.opts.forEach(function (o, i) {
        var b = h('button', { type: 'button', class: 'opt', 'data-i': i }, h('span', { class: 'mark' }, letters[i]), h('span', { html: Lab.fmt(o) }));
        b.addEventListener('click', function () {
          if (done) return;
          var ok = i === q.ans;
          Array.prototype.forEach.call(list.children, function (c, j) { c.disabled = true; if (j === q.ans) c.classList.add('correct'); });
          if (!ok) b.classList.add('wrong'); else b.classList.add('picked');
          fbSlot.appendChild(verdict(ok, ok ? '' : 'The answer is **' + letters[q.ans] + '**.', q.why));
          finish(ok);
        });
        list.appendChild(b);
      });
      root.appendChild(list);
      root.appendChild(fbSlot);
      return { el: root, isDone: function () { return done; } };
    }

    var inputs = [], fields = [];
    if (q.kind === 'input') fields = [{ label: q.label || 'Your answer', a: q.a, type: q.type || 'text', check: q.check, ph: q.ph }];
    else if (q.kind === 'multi') fields = q.fields;
    var row = h('div', { class: 'field-row' });
    fields.forEach(function (f, i) {
      var id = 'q' + Math.random().toString(36).slice(2, 8);
      var inp = h('input', { type: 'text', id: id, spellcheck: 'false', autocomplete: 'off', placeholder: f.ph || (f.type === 'hex' ? '0x00000000' : ''), class: f.type === 'hex' ? 'hex-in' : '', 'aria-label': f.label || 'Answer' });
      inputs.push(inp);
      row.appendChild(h('div', { class: 'field' }, h('label', { for: id }, f.label || ''), inp));
    });
    var flagState = { N: 0, Z: 0, C: 0, V: 0 }, flagsEl = null;
    if (q.kind === 'flags') {
      if (q.res !== undefined) {
        var id2 = 'q' + Math.random().toString(36).slice(2, 8);
        var rinp = h('input', { type: 'text', id: id2, class: 'hex-in', placeholder: '0x00000000', spellcheck: 'false', autocomplete: 'off', 'aria-label': q.resLabel || 'Result' });
        inputs.push(rinp);
        row.appendChild(h('div', { class: 'field' }, h('label', { for: id2 }, q.resLabel || 'Result (hex)'), rinp));
      }
      var redraw = function () {
        var nw = Lab.flagChips(flagState, { click: function (k) { if (done) return; flagState[k] ^= 1; redraw(); } });
        if (flagsEl) flagsEl.replaceWith(nw); flagsEl = nw;
      };
      redraw();
      row.appendChild(h('div', { class: 'field' }, h('span', { class: 'lab' }, 'Flags (click to toggle)'), flagsEl));
    }
    root.appendChild(row);
    var btn = h('button', { type: 'button', class: 'btn btn-primary' }, 'Check');
    var hintBtn = q.hint ? h('button', { type: 'button', class: 'btn btn-quiet', onclick: function () { hintBtn.replaceWith(h('div', { class: 'muted', html: Lab.fmt('Hint: ' + q.hint) })); } }, 'Hint') : null;
    root.appendChild(h('div', { class: 'btn-row' }, btn, hintBtn));
    root.appendChild(fbSlot);

    function grade() {
      if (done) return;
      var ok = true, wrong = [];
      if (q.kind === 'flags') {
        var idx = 0;
        if (q.res !== undefined) { if (!sameValue('hex', inputs[0].value, q.res)) { ok = false; wrong.push('the result'); } idx = 1; }
        ['N', 'Z', 'C', 'V'].forEach(function (k) { if (flagState[k] !== q.expect[k]) { ok = false; wrong.push(k); } });
      } else {
        fields.forEach(function (f, i) {
          var val = inputs[i].value, good;
          if (f.check) good = !!f.check(val);
          else { var answers = Array.isArray(f.a) ? f.a : [f.a]; good = answers.some(function (a) { return sameValue(f.type, val, a); }); }
          inputs[i].classList.toggle('bad', !good); inputs[i].classList.toggle('ok', good);
          if (!good) { ok = false; wrong.push(f.label || 'answer ' + (i + 1)); }
        });
      }
      fbSlot.innerHTML = '';
      if (ok) { fbSlot.appendChild(verdict(true, '', q.why)); finish(true); btn.disabled = true; }
      else {
        var msg = 'Check ' + wrong.join(', ') + '.';
        if (opts.reveal !== false) {
          var show = h('button', { type: 'button', class: 'btn btn-sm', onclick: function () {
            fbSlot.innerHTML = ''; fbSlot.appendChild(verdict(false, q.show ? q.show() : 'The answer is shown below.', q.why)); finish(false); btn.disabled = true; } }, 'Show the answer');
          var fb = verdict(false, msg);
          fb.appendChild(h('div', { class: 'btn-row', style: { marginTop: '8px' } }, show));
          fbSlot.appendChild(fb);
        } else { fbSlot.appendChild(verdict(false, msg)); finish(false); }
      }
    }
    btn.addEventListener('click', grade);
    inputs.forEach(function (i) { i.addEventListener('keydown', function (e) { if (e.key === 'Enter') grade(); }); });
    return { el: root, isDone: function () { return done; }, grade: grade };
  };
})(window);
