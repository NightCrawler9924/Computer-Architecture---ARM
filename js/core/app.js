/* Router, sidebar, home page, lesson and unit pages. */
(function (g) {
  'use strict';
  var Lab = g.Lab, h = Lab.h, E = g.E359;
  var main, sidebar, current = '';

  /* ---------- lookup helpers ---------- */
  /* Two tracks: the lecture course, and the labs (the Tiva board). A unit says which one it belongs to. */
  var TRACKS = { course: 'Course', labs: 'Labs' };
  Lab.track = Lab.lsGet('e359.track') === 'labs' ? 'labs' : 'course';
  function trackOf(u) { return u.track || 'course'; }
  function unitsOf(track) { return Lab.units.filter(function (u) { return trackOf(u) === track; }); }
  Lab.unitsOf = unitsOf;
  function trackIds(track) { var out = []; unitsOf(track).forEach(function (u) { (u.lessons || []).forEach(function (id) { if (Lab.lessons[id]) out.push(id); }); }); return out; }
  function allLessonIds() { return trackIds('course').concat(trackIds('labs')); }
  Lab.allLessonIds = allLessonIds;
  function unitOf(id) { for (var i = 0; i < Lab.units.length; i++) if ((Lab.units[i].lessons || []).indexOf(id) >= 0) return Lab.units[i]; return null; }
  function neighbours(id) { var u = unitOf(id), ids = trackIds(u ? trackOf(u) : 'course'), i = ids.indexOf(id); return { prev: i > 0 ? ids[i - 1] : null, next: i >= 0 && i < ids.length - 1 ? ids[i + 1] : null }; }
  function nextUndone() { var ids = trackIds('course'); for (var i = 0; i < ids.length; i++) if (!Lab.isDone(ids[i])) return ids[i]; return null; }
  function setTrack(t) { Lab.track = t; Lab.lsSet('e359.track', t); }

  /* ---------- sidebar ---------- */
  function buildSidebar() {
    Lab.clear(sidebar);
    var tabs = h('div', { class: 'seg side-tabs', role: 'group', 'aria-label': 'Course or labs' }, Object.keys(TRACKS).map(function (t) {
      return h('button', { type: 'button', 'aria-pressed': Lab.track === t ? 'true' : 'false', onclick: function () { setTrack(t); buildSidebar(); } }, TRACKS[t]);
    }));
    sidebar.appendChild(tabs);
    var nav = h('nav', { 'aria-label': TRACKS[Lab.track] + ' map' });
    unitsOf(Lab.track).forEach(function (u) {
      var lessons = (u.lessons || []).filter(function (id) { return Lab.lessons[id]; });
      var done = lessons.filter(Lab.isDone).length;
      var ul = h('ul');
      lessons.forEach(function (id) {
        var L = Lab.lessons[id], isDone = Lab.isDone(id);
        ul.appendChild(h('li', {}, h('a', { href: '#/lesson/' + id, 'data-route': 'lesson/' + id },
          h('span', { class: 'tick' + (isDone ? ' done' : ''), 'aria-hidden': 'true' }, isDone ? '✓' : ''),
          h('span', {}, L.title, isDone ? h('span', { class: 'sr-only' }, ' (completed)') : null))));
      });
      (u.soon || []).forEach(function (t) {
        ul.appendChild(h('li', {}, h('a', { href: '#/syllabus', class: 'soon', title: 'Planned' },
          h('span', { class: 'tick soon', 'aria-hidden': 'true' }), h('span', {}, t, h('span', { class: 'sr-only' }, ' (not added yet)')))));
      });
      nav.appendChild(h('div', { class: 'unit' },
        h('div', { class: 'unit-title' }, h('span', {}, u.title), lessons.length ? h('small', { class: 'num' }, done + '/' + lessons.length) : null), ul));
    });
    nav.appendChild(h('div', { class: 'side-sec' }, 'Tools'));
    nav.appendChild(h('ul', { style: { listStyle: 'none', margin: 0, padding: 0 } },
      [['sim', 'ARM simulator'], ['tools', 'All interactive tools'], ['practice', 'Practice questions'], ['reference', 'Reference and glossary'], ['syllabus', 'Syllabus and coverage'], ['about', 'About and progress']].map(function (r) {
        return h('li', {}, h('a', { href: '#/' + r[0], 'data-route': r[0], style: { display: 'block', padding: '7px 10px', borderRadius: 'var(--r)', color: 'var(--ink-2)', textDecoration: 'none' } }, r[1]));
      })));
    sidebar.appendChild(nav);
    markCurrent();
    updatePill();
  }
  function markCurrent() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-route]'), function (a) {
      if (a.getAttribute('data-route') === current) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.topnav a, .tabbar a'), function (a) {
      var r = a.getAttribute('data-top'), inCourse = /^(lesson|unit|home)/.test(current) || current === '', on;
      if (r === 'course') on = inCourse && Lab.track === 'course';
      else if (r === 'labs') on = current === 'labs' || (inCourse && Lab.track === 'labs' && current !== 'home');
      else on = current === r || current.indexOf(r + '/') === 0;
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  function updatePill() {
    var ids = allLessonIds(), done = ids.filter(Lab.isDone).length, p = document.getElementById('progress-pill');
    if (p) p.textContent = done + ' of ' + ids.length + ' lessons';
  }

  /* ---------- router ---------- */
  function parse() {
    var hash = location.hash.replace(/^#\/?/, '');
    var parts = hash.split('/').filter(Boolean);
    return { name: parts[0] || 'home', arg: parts[1] ? decodeURIComponent(parts.slice(1).join('/')) : null, key: parts.join('/') };
  }
  function route() {
    var r = parse();
    current = r.key || 'home';
    if (r.name === 'home') setTrack('course');
    else if (r.name === 'labs') setTrack('labs');
    else if (r.name === 'lesson' && r.arg && unitOf(r.arg)) setTrack(trackOf(unitOf(r.arg)));
    else if (r.name === 'unit' && r.arg) { var uu = Lab.units.filter(function (x) { return x.id === r.arg; })[0]; if (uu) setTrack(trackOf(uu)); }
    buildSidebar();
    document.body.classList.remove('nav-open'); main.inert = false; var tg = document.getElementById('nav-toggle'); if (tg) tg.setAttribute('aria-expanded', 'false');
    var scrim = document.querySelector('.scrim'); if (scrim) scrim.remove();
    Lab.clear(main);
    window.scrollTo(0, 0);
    var page = Lab.pages[r.name];
    var wrap = h('div', { class: 'page' });
    main.appendChild(wrap);
    if (!page) { wrap.appendChild(h('h1', {}, 'Page not found')); wrap.appendChild(h('p', {}, 'There is no page called "' + r.name + '". Try the course map on the left.')); document.title = 'Not found | Opcode'; }
    else { try { page(wrap, r.arg); } catch (e) { wrap.appendChild(h('p', { class: 'muted' }, 'Something went wrong loading this page: ' + e.message)); if (window.console) console.error(e); } }
    markCurrent();
    var hd = wrap.querySelector('h1');
    if (hd) { hd.setAttribute('tabindex', '-1'); hd.focus({ preventScroll: true }); } else main.focus({ preventScroll: true });
  }
  Lab.go = function (hash) { location.hash = hash; };
  Lab.setTitle = function (t) { document.title = t ? t + ' | Opcode' : 'Opcode: learn how computers run code'; };

  /* ---------- pages ---------- */
  Lab.pages.home = function (el) {
    Lab.setTitle('');
    var ids = allLessonIds(), done = ids.filter(Lab.isDone).length, nxt = nextUndone();
    var demo = h('div', { class: 'hero-demo' }, h('h2', {}, 'Try it: add two 32-bit numbers'), h('div', { class: 'widget' }));
    el.appendChild(h('section', { class: 'hero' },
      h('div', {},
        h('h1', {}, 'Learn how a computer really runs your code'),
        h('p', { class: 'sub' }, 'ENGR 359 from zero: registers, flags, ARM assembly and the lab hardware. Predict first, then watch it run.'),
        h('div', { class: 'btn-row' },
          h('a', { class: 'btn btn-primary', href: '#/lesson/start' }, done ? 'Continue learning' : 'Start with the 2-minute check'),
          h('a', { class: 'btn', href: '#/sim' }, 'Open the simulator'))),
      demo));
    Lab.mountWidget(demo.querySelector('.widget'), 'hexLab', { a: 0x7FFFFFFF, b: 1, op: 'ADD', compact: true });

    var path = h('div', { class: 'path' });
    unitsOf('course').forEach(function (u) {
      var ls = (u.lessons || []).filter(function (id) { return Lab.lessons[id]; });
      if (!ls.length) return;
      var d = ls.filter(Lab.isDone).length;
      path.appendChild(h('a', { class: 'path-item', href: '#/unit/' + u.id },
        h('span', { class: 'tick' + (d === ls.length ? ' done' : d ? ' part' : ''), 'aria-hidden': 'true' }, d === ls.length ? '✓' : ''),
        h('div', {}, h('div', { class: 'item-title' }, u.title), h('p', {}, u.blurb || '')),
        h('span', { class: 'go num' }, d + '/' + ls.length)));
    });
    var labIds = trackIds('labs'), labDone = labIds.filter(Lab.isDone).length;
    if (labIds.length) path.appendChild(h('a', { class: 'path-item', href: '#/labs' },
      h('span', { class: 'tick' + (labDone === labIds.length ? ' done' : labDone ? ' part' : ''), 'aria-hidden': 'true' }, labDone === labIds.length ? '✓' : ''),
      h('div', {}, h('div', { class: 'item-title' }, 'Labs: the Tiva LaunchPad'), h('p', {}, 'The hardware side, kept apart from the lectures: the board, the BoosterPack, the clock, serial and the light sensor.')),
      h('span', { class: 'go num' }, labDone + '/' + labIds.length)));
    var tools = h('div', { class: 'tool-list' },
      [['sim', 'ARM simulator', 'Write assembly, step through it, watch registers and flags'],
       ['tool/hexLab', 'Hex and flags lab', 'See every carry column and why N, Z, C, V are set'],
       ['tool/shifter', 'Barrel shifter', 'Shift and rotate 32 bits, bit by bit'],
       ['tool/encoder', 'Instruction encoder', 'Turn assembly into the 32-bit machine word'],
       ['practice', 'Practice questions', 'Endless fresh numbers, every answer checked by the engine']].map(function (t) {
        return h('a', { href: '#/' + t[0] }, t[1], h('small', {}, t[2]));
      }));
    el.appendChild(h('div', { class: 'home-grid' },
      h('section', { class: 'home-section' }, h('h2', {}, 'The course, in order'), path),
      h('section', { class: 'home-section' }, h('h2', {}, 'Tools you can use any time'), tools)));
  };

  Lab.pages.unit = function (el, id) {
    var u = Lab.units.filter(function (x) { return x.id === id; })[0];
    if (!u) { el.appendChild(h('h1', {}, 'Unit not found')); return; }
    Lab.setTitle(u.title);
    var isLab = trackOf(u) === 'labs';
    el.appendChild(h('div', { class: 'lesson-head' }, h('div', { class: 'crumbs' }, h('a', { href: isLab ? '#/labs' : '#/' }, isLab ? 'Labs' : 'Course'), ' / Unit'), h('h1', {}, u.title), u.blurb ? h('p', { class: 'lede' }, u.blurb) : null));
    var path = h('div', { class: 'path' });
    (u.lessons || []).forEach(function (lid) {
      var L = Lab.lessons[lid]; if (!L) return;
      var d = Lab.isDone(lid);
      path.appendChild(h('a', { class: 'path-item', href: '#/lesson/' + lid },
        h('span', { class: 'tick' + (d ? ' done' : ''), 'aria-hidden': 'true' }, d ? '✓' : ''),
        h('div', {}, h('div', { class: 'item-title' }, L.title), h('p', {}, L.lede || '')), h('span', { class: 'go num' }, (L.minutes || 10) + ' min')));
    });
    el.appendChild(path);
  };

  Lab.pages.lesson = function (el, id) {
    var L = Lab.lessons[id];
    if (!L) { el.appendChild(h('h1', {}, 'Lesson not found')); el.appendChild(h('p', {}, h('a', { href: '#/' }, 'Back to the course map'))); return; }
    Lab.setTitle(L.title);
    var u = unitOf(id);
    var head = h('header', { class: 'lesson-head' },
      h('div', { class: 'crumbs' }, h('a', { href: u && trackOf(u) === 'labs' ? '#/labs' : '#/' }, u && trackOf(u) === 'labs' ? 'Labs' : 'Course'), u ? [' / ', h('a', { href: '#/unit/' + u.id }, u.title)] : null),
      h('h1', {}, L.title), L.lede ? h('p', { class: 'lede' }, L.lede) : null,
      h('div', { class: 'meta' }, h('span', {}, (L.minutes || 10) + ' min'), L.source ? h('span', {}, 'From ' + L.source) : null, Lab.isDone(id) ? h('span', {}, 'Completed') : null));
    var body = h('article', { class: 'lesson' });
    el.appendChild(head); el.appendChild(body);
    var ctx = { asked: 0, first: 0, tried: {} };
    Lab.renderBlocks(body, L.blocks, ctx);
    if (L.takeaways && L.takeaways.length) {
      body.appendChild(h('div', { class: 'summary' }, h('h3', {}, 'What to take away'), h('ul', {}, L.takeaways.map(function (t) { return h('li', { html: Lab.fmt(t) }); }))));
    }
    var nb = neighbours(id);
    var doneBtn = h('button', { class: 'btn ' + (Lab.isDone(id) ? '' : 'btn-primary'), type: 'button' }, Lab.isDone(id) ? 'Completed. Mark as not done' : 'Mark lesson complete');
    doneBtn.addEventListener('click', function () {
      var v = !Lab.isDone(id); Lab.setDone(id, v);
      doneBtn.textContent = v ? 'Completed. Mark as not done' : 'Mark lesson complete'; doneBtn.classList.toggle('btn-primary', !v);
      Lab.toast(v ? 'Lesson marked complete.' : 'Marked as not done.'); buildSidebar();
    });
    var stat = h('p', { class: 'muted num', style: { marginTop: '20px' } });
    Lab.on('answered', function (e) { if (e.ctx === ctx) stat.textContent = 'This lesson: ' + ctx.first + ' of ' + ctx.asked + ' questions right on the first try.'; });
    body.appendChild(stat);
    body.appendChild(h('div', { class: 'btn-row', style: { marginTop: '16px' } }, doneBtn));
    body.appendChild(h('div', { class: 'lesson-nav' },
      nb.prev ? h('a', { class: 'btn', href: '#/lesson/' + nb.prev }, '← ' + Lab.lessons[nb.prev].title) : h('span'),
      nb.next ? h('a', { class: 'btn btn-primary', href: '#/lesson/' + nb.next }, Lab.lessons[nb.next].title + ' →') : h('a', { class: 'btn btn-primary', href: '#/practice' }, 'Practice what you learned →')));
  };

  /* The Labs tab: the hardware side of the course, separate from the lectures. */
  Lab.pages.labs = function (el) {
    Lab.setTitle('Labs');
    el.appendChild(h('div', { class: 'lesson-head' },
      h('div', { class: 'crumbs' }, 'Labs'),
      h('h1', {}, 'Labs: the Tiva LaunchPad'),
      h('p', { class: 'lede' }, 'The hands-on side of ENGR 359. You write C++ in the Arduino IDE for a Tiva LaunchPad, and this tab teaches the board, the BoosterPack and the code behind each lab, with simulators so you can try things before you touch the hardware.')));
    unitsOf('labs').forEach(function (u) {
      var ls = (u.lessons || []).filter(function (id) { return Lab.lessons[id]; });
      el.appendChild(h('h2', { style: { fontSize: 'var(--fs-3)', marginTop: '28px' } }, u.title));
      if (u.blurb) el.appendChild(h('p', { class: 'muted', style: { maxWidth: '46rem' } }, u.blurb));
      var path = h('div', { class: 'path' });
      ls.forEach(function (lid) {
        var L = Lab.lessons[lid], d = Lab.isDone(lid);
        path.appendChild(h('a', { class: 'path-item', href: '#/lesson/' + lid },
          h('span', { class: 'tick' + (d ? ' done' : ''), 'aria-hidden': 'true' }, d ? '✓' : ''),
          h('div', {}, h('div', { class: 'item-title' }, L.title), h('p', {}, L.lede || '')), h('span', { class: 'go num' }, (L.minutes || 10) + ' min')));
      });
      (u.soon || []).forEach(function (t) {
        path.appendChild(h('div', { class: 'path-item', style: { opacity: .75 } }, h('span', { class: 'tick soon', 'aria-hidden': 'true' }), h('div', {}, h('div', { class: 'item-title' }, t), h('p', {}, 'Planned.')), h('span', { class: 'go' }, 'Planned')));
      });
      el.appendChild(path);
    });
    var tl = (Lab.toolList || []).filter(function (t) { return t.lab; });
    if (tl.length) {
      el.appendChild(h('h2', { style: { fontSize: 'var(--fs-3)', marginTop: '36px' } }, 'Lab tools you can open any time'));
      el.appendChild(h('div', { class: 'tool-list', style: { maxWidth: '46rem' } }, tl.map(function (t) { return h('a', { href: '#/tool/' + t.name }, t.title, h('small', {}, t.blurb)); })));
    }
  };

  Lab.pages.tools = function (el) {
    Lab.setTitle('Interactive tools');
    el.appendChild(h('div', { class: 'lesson-head' }, h('h1', {}, 'Interactive tools'), h('p', { class: 'lede' }, 'Every tool runs on the same engine as the simulator, so a number here can never disagree with a number there.')));
    var list = h('div', { class: 'path' });
    (Lab.toolList || []).forEach(function (t) {
      list.appendChild(h('a', { class: 'path-item', href: '#/tool/' + t.name }, h('span', { class: 'tick', 'aria-hidden': 'true', style: { border: 0 } }), h('div', {}, h('div', { class: 'item-title' }, t.title), h('p', {}, t.blurb)), h('span', { class: 'go' }, 'Open')));
    });
    el.appendChild(list);
  };
  Lab.pages.tool = function (el, name) {
    var t = (Lab.toolList || []).filter(function (x) { return x.name === name; })[0];
    if (!t || !Lab.widgets[name]) { el.appendChild(h('h1', {}, 'Tool not found')); return; }
    Lab.setTitle(t.title);
    el.appendChild(h('div', { class: 'lesson-head' }, h('div', { class: 'crumbs' }, h('a', { href: '#/tools' }, 'Tools'), ' / ' + t.title), h('h1', {}, t.title), h('p', { class: 'lede' }, t.blurb)));
    var box = h('div', { class: 'card widget-card' }, h('div', { class: 'widget' }));
    el.appendChild(box);
    Lab.mountWidget(box.querySelector('.widget'), name, t.opts || {});
    if (t.after) el.appendChild(h('div', { class: 'lesson', style: { marginTop: '24px' } }, h('div', { html: Lab.fmt(t.after) })));
  };

  /* ---------- boot ---------- */
  function boot() {
    main = document.getElementById('main'); sidebar = document.getElementById('sidebar');
    buildSidebar();
    Lab.on('progress', function () { updatePill(); });
    var sw = document.querySelectorAll('[data-theme-set]');
    function drawTheme() { var cur = Lab.theme.get(); Array.prototype.forEach.call(sw, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-theme-set') === cur ? 'true' : 'false'); }); }
    Array.prototype.forEach.call(sw, function (b) { b.addEventListener('click', function () { Lab.theme.set(b.getAttribute('data-theme-set')); drawTheme(); }); });
    drawTheme();
    function setDrawer(open) {
      document.body.classList.toggle('nav-open', open);
      var t = document.getElementById('nav-toggle'); t.setAttribute('aria-expanded', open ? 'true' : 'false');
      var s = document.querySelector('.scrim');
      if (open && !s) { var sc = h('div', { class: 'scrim', onclick: function () { setDrawer(false); } }); document.body.appendChild(sc); } else if (!open && s) s.remove();
      if (window.matchMedia('(max-width: 980px)').matches) { main.inert = open; }
      if (open) { var first = sidebar.querySelector('a, button'); if (first) first.focus(); }
    }
    Lab.closeDrawer = function () { if (document.body.classList.contains('nav-open')) setDrawer(false); };
    document.getElementById('nav-toggle').addEventListener('click', function () { setDrawer(!document.body.classList.contains('nav-open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { setDrawer(false); document.getElementById('nav-toggle').focus(); } });
    window.addEventListener('hashchange', route);
    route();
  }
  Lab.boot = boot;
  document.addEventListener('DOMContentLoaded', function () { if (!Lab.noBoot) boot(); });
})(window);
