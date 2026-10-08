/* Turns a lesson's block list into DOM.

   Block forms (one primary key each):
     {h:'Heading'}  {h3:'Sub'}  {p:'Paragraph with `code` and **bold**'}  {list:[..]}  {ol:[..]}
     {say:'The idea'}  {warn:'Watch out'}  {tip:'Tip'}  {slide:'Error in the slides'}  {keep:'Remember'}
     {predict:{q, opts, ans, why}}        commit to an answer before the explanation
     {ask:{q, a, type, why, hint}}        typed answer, checked
     {reveal:{q, answer, solo}}           write it down, then show the worked solution
     {worked:{title, intro, steps[]}}     steps appear one at a time
     {faded:{title, intro, parts[], why}} a worked example with the blanks to fill in
     {widget:{name, opts}}                an interactive tool from js/widgets
     {code:'asm', init, run:false}        highlighted assembly with an "Open in simulator" button
     {table:{head, rows, center}}  {diagram:'name'}  {quiz:{id, title, qs[]}}  {html:'raw'}  {hr:1} */
(function (g) {
  'use strict';
  var E = g.E359, Lab = g.Lab, h = Lab.h;

  function callout(kind, label, html) { return h('div', { class: 'callout ' + kind }, h('span', { class: 'label' }, label), h('div', { html: Lab.fmt(html) })); }

  Lab.renderBlocks = function (root, blocks, ctx) {
    ctx = ctx || { asked: 0, first: 0, tried: {} };
    blocks.forEach(function (b, i) { var el = renderBlock(b, ctx, i); if (el) root.appendChild(el); });
    return root;
  };

  function record(ctx, key, ok) {
    if (ctx.tried[key]) return; ctx.tried[key] = true; ctx.asked++; if (ok) ctx.first++;
    Lab.emit('answered', { ctx: ctx, ok: ok });
  }

  function renderBlock(b, ctx, idx) {
    if (b.h !== undefined) return h('h2', { id: 's' + idx, html: Lab.fmt(b.h) });
    if (b.h3 !== undefined) return h('h3', { html: Lab.fmt(b.h3) });
    if (b.p !== undefined) return h('p', { html: Lab.fmt(b.p) });
    if (b.html !== undefined) return h('div', { html: b.html });
    if (b.hr) return h('hr');
    if (b.list) return h('ul', {}, b.list.map(function (t) { return h('li', { html: Lab.fmt(t) }); }));
    if (b.ol) return h('ol', {}, b.ol.map(function (t) { return h('li', { html: Lab.fmt(t) }); }));
    if (b.say !== undefined) return callout('idea', 'The idea', b.say);
    if (b.warn !== undefined) return callout('warn', 'Watch out', b.warn);
    if (b.tip !== undefined) return callout('tip', 'Good to know', b.tip);
    if (b.slide !== undefined) return callout('slide', 'Error in the course slides', b.slide);
    if (b.keep !== undefined) return callout('keep', 'Remember', b.keep);
    if (b.table) return Lab.table(b.table.head, b.table.rows, { center: b.table.center });
    if (b.diagram) { var d = Lab.diagrams[b.diagram]; return d ? d() : h('p', {}, 'Missing diagram ' + b.diagram); }
    if (b.code !== undefined) return Lab.codeBlock(b.code, { init: b.init, run: b.run });
    if (b.widget) return renderWidget(b.widget.name, b.widget.opts, b.widget.title);
    if (b.sim) return renderWidget('armSim', Object.assign({ mini: true }, b.sim), b.sim.title);
    if (b.predict) return renderPredict(b.predict, ctx, idx);
    if (b.ask) return renderAsk(b.ask, ctx, idx);
    if (b.reveal) return renderReveal(b.reveal, ctx, idx);
    if (b.worked) return renderWorked(b.worked);
    if (b.faded) return renderFaded(b.faded, ctx, idx);
    if (b.quiz) return renderQuiz(b.quiz);
    return h('p', { class: 'muted' }, 'Unknown block');
  }

  function renderWidget(name, opts, title) {
    var fn = Lab.widgets[name];
    var box = h('div', { class: 'wide widget-card card' });
    if (title) box.appendChild(h('div', { class: 'card-label', 'aria-hidden': 'true' }, title));
    if (!fn) { box.appendChild(h('p', {}, 'Missing widget ' + name)); return box; }
    var inner = h('div', { class: 'widget' });
    box.appendChild(inner);
    try { fn(inner, opts || {}); } catch (e) { inner.appendChild(h('p', { class: 'muted' }, 'This tool failed to load: ' + e.message)); if (window.console) console.error(e); }
    return box;
  }
  Lab.mountWidget = function (container, name, opts) { Lab.widgets[name](container, opts || {}); };

  function renderPredict(p, ctx, idx) {
    var card = h('div', { class: 'card' }, h('span', { class: 'card-label' }, 'Predict'));
    var qn = Lab.question({ kind: 'mcq', q: p.q, opts: p.opts, ans: p.ans, why: p.why }, { onDone: function (ok) { record(ctx, 'p' + idx, ok); } });
    card.appendChild(qn.el);
    return card;
  }
  function renderAsk(a, ctx, idx) {
    var card = h('div', { class: 'card' }, h('span', { class: 'card-label' + (a.solo ? ' solo' : '') }, a.solo ? 'Solo' : 'Try it'));
    var spec = Object.assign({ kind: a.fields ? 'multi' : (a.expect ? 'flags' : 'input') }, a);
    card.appendChild(Lab.question(spec, { onDone: function (ok) { record(ctx, 'a' + idx, ok); } }).el);
    return card;
  }
  function renderReveal(r, ctx, idx) {
    var card = h('div', { class: 'card' }, h('span', { class: 'card-label' + (r.solo ? ' solo' : '') }, r.solo ? 'Solo' : 'Work it out'));
    card.appendChild(h('div', { class: 'q', html: Lab.fmt(r.q) }));
    if (r.pre) card.appendChild(h('div', { html: r.pre }));
    var ta = h('textarea', { rows: r.rows || 4, placeholder: 'Write your working here first, then show the solution.', 'aria-label': 'Your working' });
    card.appendChild(ta);
    var box = h('div', { class: 'reveal-box' });
    var btn = h('button', { class: 'btn', type: 'button' }, 'Show the solution');
    btn.addEventListener('click', function () {
      btn.remove();
      var ans = h('div', { class: 'answer' });
      if (typeof r.answer === 'string') ans.innerHTML = Lab.fmt(r.answer); else if (r.answer instanceof Node) ans.appendChild(r.answer);
      else if (typeof r.answer === 'function') ans.appendChild(r.answer());
      box.appendChild(ans);
      var grade = h('div', { class: 'self-grade' }, h('span', {}, 'Did your working match?'),
        h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { record(ctx, 'r' + idx, true); grade.textContent = 'Nice. That one is solid.'; } }, 'Yes'),
        h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { record(ctx, 'r' + idx, false); grade.textContent = 'Good to know. Redo it from the first step, then try a fresh one on the Practice page.'; } }, 'Not yet'));
      box.appendChild(grade);
    });
    box.appendChild(btn);
    card.appendChild(box);
    return card;
  }
  function renderWorked(w) {
    var card = h('div', { class: 'card' }, h('span', { class: 'card-label worked' }, 'Worked example'));
    if (w.title) card.appendChild(h('div', { class: 'q', html: Lab.fmt(w.title) }));
    if (w.intro) card.appendChild(h('div', { html: Lab.fmt(w.intro) }));
    var ol = h('ol', { class: 'steps' });
    card.appendChild(ol);
    var shown = 0;
    var next = h('button', { class: 'btn btn-primary', type: 'button' }, 'Show step 1');
    var all = h('button', { class: 'btn btn-quiet', type: 'button' }, 'Show all');
    function showOne() {
      if (shown >= w.steps.length) return;
      var s = w.steps[shown++], li = h('li');
      if (typeof s === 'string') li.innerHTML = Lab.fmt(s);
      else if (s instanceof Node) li.appendChild(s);
      else if (typeof s === 'function') li.appendChild(s());
      ol.appendChild(li);
      if (shown >= w.steps.length) { next.remove(); all.remove(); } else next.textContent = 'Show step ' + (shown + 1) + ' of ' + w.steps.length;
    }
    next.addEventListener('click', showOne);
    all.addEventListener('click', function () { while (shown < w.steps.length) showOne(); });
    card.appendChild(h('div', { class: 'btn-row' }, next, all));
    return card;
  }
  function renderFaded(f, ctx, idx) {
    var card = h('div', { class: 'card' }, h('span', { class: 'card-label faded' }, 'Fill in the blanks'));
    if (f.title) card.appendChild(h('div', { class: 'q', html: Lab.fmt(f.title) }));
    if (f.intro) card.appendChild(h('div', { html: Lab.fmt(f.intro) }));
    var inputs = [];
    var wrap = h('div');
    f.parts.forEach(function (p) {
      if (p.text !== undefined) wrap.appendChild(h('p', { html: Lab.fmt(p.text) }));
      else {
        var id = 'fd' + Math.random().toString(36).slice(2, 8);
        var inp = h('input', { type: 'text', id: id, class: p.type === 'hex' ? 'hex-in' : '', spellcheck: 'false', autocomplete: 'off', placeholder: p.ph || '', 'aria-label': p.label || 'Blank' });
        inputs.push({ el: inp, p: p });
        wrap.appendChild(h('div', { class: 'field-row' }, h('div', { class: 'field' }, h('label', { for: id, html: Lab.fmt(p.label || '') }), inp)));
      }
    });
    card.appendChild(wrap);
    var slot = h('div'), btn = h('button', { class: 'btn btn-primary', type: 'button' }, 'Check');
    var finished = false;
    btn.addEventListener('click', function () {
      var ok = true;
      inputs.forEach(function (x) {
        var good = (Array.isArray(x.p.ans) ? x.p.ans : [x.p.ans]).some(function (a) { return Lab.sameValue(x.p.type || 'text', x.el.value, a); });
        x.el.classList.toggle('bad', !good); x.el.classList.toggle('ok', good); if (!good) ok = false;
      });
      slot.innerHTML = '';
      var fb = h('div', { class: 'feedback ' + (ok ? 'good' : 'bad') }, h('strong', { class: 'verdict' }, ok ? 'Correct.' : 'Not all of them yet.'));
      if (ok && f.why) fb.appendChild(h('div', { html: Lab.fmt(f.why) }));
      if (!ok) {
        fb.appendChild(h('div', { class: 'btn-row', style: { marginTop: '8px' } }, h('button', { class: 'btn btn-sm', type: 'button', onclick: function () {
          inputs.forEach(function (x) { x.el.value = Array.isArray(x.p.ans) ? x.p.ans[0] : x.p.ans; x.el.classList.remove('bad'); x.el.classList.add('ok'); });
          slot.innerHTML = ''; slot.appendChild(h('div', { class: 'feedback' }, h('div', { html: Lab.fmt(f.why || 'The correct values are filled in.') })));
          if (!finished) { finished = true; record(ctx, 'f' + idx, false); }
        } }, 'Show the answers')));
      }
      slot.appendChild(fb);
      if (ok && !finished) { finished = true; record(ctx, 'f' + idx, true); }
    });
    card.appendChild(h('div', { class: 'btn-row' }, btn)); card.appendChild(slot);
    return card;
  }

  /* quiz: one question at a time, score saved */
  function renderQuiz(q) {
    var card = h('div', { class: 'card wide' }, h('span', { class: 'card-label' }, q.title || 'Quick quiz'));
    var body = h('div'), bar = h('div', { class: 'progress', 'aria-hidden': 'true' }, h('i'));
    card.appendChild(bar); card.appendChild(body);
    var i = 0, score = 0, results = [];
    function show() {
      body.innerHTML = ''; bar.firstChild.style.width = (i / q.qs.length * 100) + '%';
      if (i >= q.qs.length) return finish();
      var spec = q.qs[i];
      if (typeof spec === 'function') spec = spec();
      body.appendChild(h('p', { class: 'muted num', style: { marginTop: '12px' } }, 'Question ' + (i + 1) + ' of ' + q.qs.length));
      var inst = Lab.question(spec, { onDone: function (ok) {
        results.push(ok); if (ok) score++;
        var nxt = h('button', { class: 'btn btn-primary', type: 'button', style: { marginTop: '12px' } }, i + 1 >= q.qs.length ? 'See my score' : 'Next question');
        nxt.addEventListener('click', function () { i++; show(); });
        body.appendChild(nxt); nxt.focus();
      } });
      body.appendChild(inst.el);
    }
    function finish() {
      bar.firstChild.style.width = '100%';
      var best = Lab.progress.quiz[q.id];
      if (!best || score > best.best) Lab.progress.quiz[q.id] = { best: score, total: q.qs.length };
      Lab.saveProgress();
      var pct = Math.round(100 * score / q.qs.length);
      body.appendChild(h('h3', { style: { marginTop: '12px' } }, score + ' of ' + q.qs.length + ' (' + pct + '%)'));
      body.appendChild(h('p', {}, pct === 100 ? 'Clean sweep. Move on, or try the Practice page for fresh numbers.' : pct >= 60 ? 'Solid. Redo the ones you missed by rereading that section, then retry.' : 'This section needs another pass. Reread it with the widgets open, then retry.'));
      if (q.after) body.appendChild(q.after(results, score));
      body.appendChild(h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'button', onclick: function () { i = 0; score = 0; results = []; show(); } }, 'Try again')));
    }
    show();
    return card;
  }
})(window);
