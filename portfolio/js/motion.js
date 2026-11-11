/* Motion for arafatarzu.me: the hero entrance, the work rail (drag,
   buttons, progress, active-card settle), card parallax, receipts
   counters and activity pulse, scroll reveals in the manner of a
   colleague's site (added 2026-11-09 at Arz's direct order, over the
   earlier no-reveals rule), magnetic toolkit rows, the typewriter
   line in the hero, the typewriter tab title, a cursor companion in
   Berry's pattern (dot, circling name ring, View disc), and the
   shine that chases the pointer across the hero name.
   prefers-reduced-motion switches the whole layer off. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var root = document.documentElement;

  /* ---------- hero entrance ---------- */
  function loaded() { root.classList.add('is-loaded'); }
  if (document.readyState !== 'loading') requestAnimationFrame(loaded);
  else document.addEventListener('DOMContentLoaded', function () { requestAnimationFrame(loaded); });
  /* never leave the hero hidden if load has already fired oddly */
  setTimeout(loaded, 1200);

  /* scroll reveals live at the bottom of this file (added later the
     same day, at Arz's order); the hero sequence above stays the
     page's one orchestrated load moment */

  /* ---------- work rail ---------- */
  var rail = document.getElementById('workRail');
  var prog = document.getElementById('railProg');
  if (rail) {
    var updateProg = function () {
      var max = rail.scrollWidth - rail.clientWidth;
      var p = max > 0 ? rail.scrollLeft / max : 0;
      if (prog) prog.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    };
    rail.addEventListener('scroll', updateProg, { passive: true });
    window.addEventListener('resize', updateProg);
    updateProg();

    var step = function () {
      var card = rail.querySelector('.wcard');
      return card ? card.getBoundingClientRect().width + 22 : 320;
    };
    var prev = document.getElementById('railPrev');
    var next = document.getElementById('railNext');
    if (prev) prev.addEventListener('click', function () {
      rail.scrollBy({ left: -step(), behavior: reduced ? 'auto' : 'smooth' });
    });
    if (next) next.addEventListener('click', function () {
      rail.scrollBy({ left: step(), behavior: reduced ? 'auto' : 'smooth' });
    });

    /* drag to scroll, mouse and pen only; touch keeps native swipe.
       a native image drag would eat the gesture, so it is off here */
    rail.addEventListener('dragstart', function (e) { e.preventDefault(); });
    var dragging = false, startX = 0, startL = 0, moved = 0;
    rail.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;
      dragging = true; moved = 0;
      startX = e.clientX; startL = rail.scrollLeft;
      rail.classList.add('is-drag');
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      rail.scrollLeft = startL - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!dragging) return;
      dragging = false;
      rail.classList.remove('is-drag');
    });
    /* a drag that ends on a card must not open it */
    rail.addEventListener('click', function (e) {
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; }
    }, true);

    /* ---------- card parallax ---------- */
    if (!reduced && finePointer) {
      [].slice.call(rail.querySelectorAll('.wcard')).forEach(function (card) {
        var img = card.querySelector('.wcard__media > img.ph');
        if (!img) return;
        var raf = 0;
        card.addEventListener('pointermove', function (e) {
          if (e.pointerType === 'touch') return;
          var r = card.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5;
          var y = (e.clientY - r.top) / r.height - 0.5;
          if (raf) return;
          raf = requestAnimationFrame(function () {
            raf = 0;
            img.style.transform = 'translate(' + (x * -10).toFixed(1) + 'px,' + (y * -8).toFixed(1) + 'px) scale(1.09)';
          });
        });
        card.addEventListener('pointerleave', function () {
          if (raf) cancelAnimationFrame(raf);
          raf = 0;
          img.style.transform = '';
        });
      });
    }
  }

  /* ---------- ledger counters ---------- */
  /* ledger.js owns the numbers; this only tweens how they arrive.
     'since' is a year and stays still on purpose. */
  var counted = new WeakSet();
  function armCounter(el) {
    if (counted.has(el)) return;
    var raw = (el.textContent || '').trim();
    if (!/^\d+$/.test(raw)) return;
    counted.add(el);
    if (reduced) return;
    var end = parseInt(raw, 10);
    var t0 = null, dur = 900;
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(end * eased));
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = raw;
    }
    requestAnimationFrame(tick);
  }
  function armAll(scope) {
    ['repos', 'langcount', 'pushes'].forEach(function (name) {
      scope.querySelectorAll('[data-ledger="' + name + '"]').forEach(armCounter);
    });
  }
  var watched = ['.cover__facts', '.ledger__stats']
    .map(function (s) { return document.querySelector(s); })
    .filter(Boolean);
  if ('MutationObserver' in window) {
    var mo = new MutationObserver(function () { watched.forEach(armAll); });
    watched.forEach(function (el) {
      mo.observe(el, { childList: true, characterData: true, subtree: true });
      armAll(el);
    });
    /* stop watching once every counter has fired */
    setTimeout(function () { mo.disconnect(); }, 20000);
  }

  /* ---------- hero typewriter line ---------- */
  /* the same typing behaviour as the tab title, but in the hero
     itself where a phone can actually see it: types a role out,
     sits with it, backspaces, types the next, loops forever.
     the HTML carries the first line as static text, so reduced
     motion and no-JS still read a complete line */
  var typeEl = document.getElementById('typeLine');
  if (typeEl && !reduced) {
    var lines = ['Full-stack developer', 'Security auditor', 'Founder, ClipHaus', 'Founder, Nyktos'];
    var li = 0, lc = lines[0].length, ldel = true, lTimer = 0;
    function heroStep() {
      if (ldel) {
        lc -= 1;
        typeEl.textContent = lines[li].slice(0, lc);
        if (lc <= 0) {
          ldel = false;
          li = (li + 1) % lines.length;
          lTimer = setTimeout(heroStep, 380);
          return;
        }
        lTimer = setTimeout(heroStep, 42);
      } else {
        lc += 1;
        typeEl.textContent = lines[li].slice(0, lc);
        if (lc >= lines[li].length) {
          ldel = true;
          lTimer = setTimeout(heroStep, 1750);
          return;
        }
        lTimer = setTimeout(heroStep, 95);
      }
    }
    /* first run waits for the entrance to land, then starts by
       backspacing the static line away */
    lTimer = setTimeout(heroStep, 2700);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { clearTimeout(lTimer); lTimer = 0; }
      else if (!lTimer) lTimer = setTimeout(heroStep, 500);
    });
  }

  /* ---------- animated tab title ---------- */
  /* types itself out, deletes itself, types again. the static
     <title> in the HTML stays put for search and sharing; this
     only runs live, and it sleeps while the tab is hidden */
  var phrases = ['Arafat Arzu', 'Full-stack developer'];
  var intro = document.title; /* the static SEO title deletes first */
  var pi = 0, ci = intro.length, deleting = true, timer = 0;
  function typeStep() {
    if (deleting) {
      var word = intro || phrases[pi];
      ci -= 1;
      document.title = word.slice(0, ci) || ' ';
      if (ci <= 0) {
        deleting = false;
        if (intro) { intro = ''; pi = 0; }
        else pi = (pi + 1) % phrases.length;
        timer = setTimeout(typeStep, 400);
        return;
      }
      timer = setTimeout(typeStep, 50);
    } else {
      ci += 1;
      document.title = phrases[pi].slice(0, ci);
      if (ci >= phrases[pi].length) {
        deleting = true;
        timer = setTimeout(typeStep, 1700);
        return;
      }
      timer = setTimeout(typeStep, 115);
    }
  }
  if (!reduced) timer = setTimeout(typeStep, 1800);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { clearTimeout(timer); timer = 0; }
    else if (!timer && !reduced) timer = setTimeout(typeStep, 500);
  });

  /* ---------- split curtain ---------- */
  /* two panels grow out of the centre seam as the tall split
     section scrolls through: progress from the section's own
     geometry, smoothstepped, written as scaleY transforms on a
     rAF-throttled scroll listener. native scroll throughout */
  var split = document.querySelector('.split');
  if (split && !reduced) {
    var sTop = split.querySelector('.split__panel--top');
    var sBot = split.querySelector('.split__panel--bot');
    var sTick = false;
    function splitUpdate() {
      sTick = false;
      var r = split.getBoundingClientRect();
      var total = r.height - window.innerHeight;
      var p = total > 0 ? (-r.top) / (total * .75) : 0;
      p = Math.max(0, Math.min(1, p));
      p = p * p * (3 - 2 * p);
      var t = 'scaleY(' + p.toFixed(4) + ')';
      sTop.style.transform = t;
      sBot.style.transform = t;
    }
    function splitScroll() {
      if (!sTick) { sTick = true; requestAnimationFrame(splitUpdate); }
    }
    window.addEventListener('scroll', splitScroll, { passive: true });
    window.addEventListener('resize', splitScroll);
    splitUpdate();
  }

  /* ---------- cursor companion ---------- */
  /* Berry's cursor pattern in Arz's system: a 6px accent dot that
     stays on the pointer, a ring of his name in tiny type circling
     slowly as it trails on a lerp, the pair fading out when the
     pointer sits still, and over a work card the dot blooms into a
     red disc that says View, because that is what a click there
     does, while the name ring keeps circling faintly around it.
     fine pointers only, native cursor untouched, and the rAF loop
     parks itself once everything has caught up, so an idle mouse
     costs nothing */
  if (finePointer && !reduced) {
    var cDot = document.createElement('div');
    cDot.className = 'cursor-dot';
    var cTxt = document.createElement('div');
    cTxt.className = 'cursor-txt';
    cTxt.setAttribute('aria-hidden', 'true');
    cTxt.innerHTML = '<svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">' +
      '<defs><path id="cursorCirc" d="M40,40 m-30,0 a30,30 0 1,1 60,0 a30,30 0 1,1 -60,0" fill="none"/></defs>' +
      '<text><textPath href="#cursorCirc" textLength="188" lengthAdjust="spacingAndGlyphs">ARAFAT ARZU • ARAFAT ARZU • </textPath></text></svg>';
    var cDisc = document.createElement('div');
    cDisc.className = 'cursor-disc';
    cDisc.setAttribute('aria-hidden', 'true');
    cDisc.innerHTML = '<span>View</span>';
    document.body.appendChild(cDot);
    document.body.appendChild(cTxt);
    document.body.appendChild(cDisc);
    root.classList.add('cursor-on');
    var mx = -100, my = -100, dX = -100, dY = -100, rX = -100, rY = -100;
    var dSc = .12, dScT = .12, rSc = 1, rScT = 1;
    var cRun = false, cSeen = false, idleTimer = 0;
    function cLoop() {
      dX += (mx - dX) * .45; dY += (my - dY) * .45;
      rX += (mx - rX) * .16; rY += (my - rY) * .16;
      dSc += (dScT - dSc) * .2;
      rSc += (rScT - rSc) * .18;
      var dot = 'translate3d(' + dX.toFixed(1) + 'px,' + dY.toFixed(1) + 'px,0) translate(-50%,-50%)';
      cDot.style.transform = dot;
      cDisc.style.transform = dot + ' scale(' + dSc.toFixed(3) + ')';
      cTxt.style.transform = 'translate3d(' + rX.toFixed(1) + 'px,' + rY.toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + rSc.toFixed(3) + ')';
      if (Math.abs(mx - rX) > .1 || Math.abs(my - rY) > .1 ||
          Math.abs(dSc - dScT) > .005 || Math.abs(rSc - rScT) > .005) {
        requestAnimationFrame(cLoop);
      } else cRun = false;
    }
    function cKick() {
      if (!cRun) { cRun = true; requestAnimationFrame(cLoop); }
    }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      mx = e.clientX; my = e.clientY;
      if (!cSeen) {
        cSeen = true;
        dX = rX = mx; dY = rY = my;
        root.classList.add('cursor-live');
      }
      root.classList.remove('cursor-idle');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () { root.classList.add('cursor-idle'); }, 1600);
      cKick();
    }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      if (!e.target.closest) return;
      var onCard = !!e.target.closest('.wcard');
      var hot = !onCard && !!e.target.closest('a,button');
      root.classList.toggle('cursor-disc-on', onCard);
      dScT = onCard ? 1 : .12;
      rScT = onCard ? 1.3 : (hot ? 1.18 : 1);
      if (cSeen) cKick();
    });
    document.addEventListener('mouseout', function (e) {
      if (!e.relatedTarget) {
        root.classList.remove('cursor-live');
        root.classList.remove('cursor-disc-on');
        clearTimeout(idleTimer);
        dScT = .12; rScT = 1;
        cSeen = false;
      }
    });
  }

  /* ---------- the scratch: shine across the hero name ---------- */
  /* the colleague's text treatment: the name is painted as a
     bg-clip-text gradient and a light band lives inside the
     letters. move the pointer across the name and the band chases
     it on a spring (stiffness 220, critically damped, the same
     numbers he runs), with a blurred red copy of the name glowing
     underneath the band. left alone, the band sweeps the name by
     itself every few seconds. the static look never changes: with
     no band in play the gradient is flat paper */
  if (finePointer && !reduced) {
    var nameEl = document.querySelectorAll('.cover__name .lm__i')[0];
    if (nameEl) {
      nameEl.classList.add('shine-on');
      var glowEl = document.createElement('span');
      glowEl.className = 'shine-glow';
      glowEl.setAttribute('aria-hidden', 'true');
      glowEl.textContent = nameEl.textContent;
      nameEl.appendChild(glowEl);

      var BASE = '#f4f1ea', PEAK = '#ffffff';
      var sh = {
        pos: null, vel: 0, mode: 'wait', inside: false, target: 0,
        visible: false, from: 0, to: 0, start: 0, dur: 1500, dir: 1,
        next: performance.now() + 1400, raf: 0, last: 0
      };
      function shGrad(pos, stops) {
        if (pos === null) return 'linear-gradient(100deg,' + stops[0] + ',' + stops[0] + ')';
        var band = stops[1];
        var parts = [
          stops[0] + ' 0%',
          stops[0] + ' ' + (pos - 17).toFixed(1) + '%',
          band + ' ' + (pos - 6).toFixed(1) + '%',
          band + ' ' + pos.toFixed(1) + '%',
          band + ' ' + (pos + 6).toFixed(1) + '%',
          stops[0] + ' ' + (pos + 17).toFixed(1) + '%',
          stops[0] + ' 100%'
        ];
        return 'linear-gradient(100deg,' + parts.join(',') + ')';
      }
      function shRender() {
        nameEl.style.backgroundImage = shGrad(sh.pos, [BASE, PEAK]);
        if (sh.pos === null) {
          glowEl.style.opacity = '0';
        } else {
          glowEl.style.backgroundImage = shGrad(sh.pos, ['rgba(252,60,68,0)', 'rgba(252,60,68,.9)']);
          glowEl.style.opacity = '.5';
        }
      }
      function shProject(e) {
        var r = nameEl.getBoundingClientRect();
        var ang = 100 * Math.PI / 180, n = Math.sin(ang), l = -Math.cos(ang);
        var o = Math.abs(r.width * n) + Math.abs(r.height * l) || 1;
        return 50 + ((e.clientX - r.left - r.width / 2) * n +
                     (e.clientY - r.top - r.height / 2) * l) / o * 100;
      }
      function shSweep(from, to, now) {
        sh.mode = 'sweep'; sh.from = from; sh.to = to;
        sh.start = now; sh.pos = from;
      }
      function shTick(now) {
        sh.raf = 0;
        var dt = Math.min(.05, Math.max(0, (now - sh.last) / 1000 || 0));
        sh.last = now;
        if (sh.mode === 'follow') {
          sh.vel += ((sh.target - sh.pos) * 220 - 2 * sh.vel * Math.sqrt(220)) * dt;
          sh.pos += sh.vel * dt;
          shRender();
          sh.raf = requestAnimationFrame(shTick);
          return;
        }
        if (sh.mode === 'sweep') {
          var t = Math.min(1, (now - sh.start) / sh.dur);
          var e = 1 - Math.pow(1 - t, 5);
          sh.pos = sh.from + (sh.to - sh.from) * e;
          shRender();
          if (t < 1) { sh.raf = requestAnimationFrame(shTick); return; }
          sh.mode = 'wait'; sh.pos = null; shRender();
          sh.next = now + 4200;
        }
        /* wait: nothing moves until the next idle sweep is due or
           the pointer comes back; park on a timer, not a hot loop */
        if (sh.inside) return;
        if (sh.visible && now >= sh.next) {
          sh.dir *= -1;
          shSweep(sh.dir > 0 ? -20 : 120, sh.dir > 0 ? 120 : -20, now);
          sh.raf = requestAnimationFrame(shTick);
          return;
        }
        if (sh.visible) setTimeout(shKick, Math.max(60, sh.next - now));
      }
      function shKick() {
        if (!sh.raf) { sh.last = performance.now(); sh.raf = requestAnimationFrame(shTick); }
      }
      nameEl.addEventListener('pointerenter', function (e) {
        sh.inside = true;
        sh.target = shProject(e);
        if (sh.pos === null) sh.pos = sh.target < 50 ? -20 : 120;
        sh.mode = 'follow';
        shKick();
      });
      nameEl.addEventListener('pointermove', function (e) {
        sh.target = shProject(e);
        if (sh.mode !== 'follow') { sh.mode = 'follow'; if (sh.pos === null) sh.pos = sh.target; }
        shKick();
      });
      nameEl.addEventListener('pointerleave', function () {
        sh.inside = false;
        if (sh.pos !== null) shSweep(sh.pos, sh.target < 50 ? -20 : 120, performance.now());
        shKick();
      });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) {
          sh.visible = en[0].isIntersecting;
          if (sh.visible) shKick();
        }, { threshold: .2 }).observe(nameEl);
      } else sh.visible = true;
      shRender();
      shKick();
    }
  }

  /* ---------- the ambient background answers the visitor ---------- */
  /* the ember glows keep their keyframe drift untouched: each one
     rides in a wrapper (.amb__w) and this writes transforms to the
     wrappers only, so the interactive offsets compose with the
     drift instead of overriding it. on fine pointers the nearest
     glow leans toward the cursor the most, the mid one less, the
     far wisp slightly against, all on a slow lerp so the light
     feels suspended in liquid rather than wired to the mouse. a
     pool of light (.amb__spot) follows the pointer on a faster
     lag and fades out on the same 1.6s idle clock as the cursor
     companion, and the glows ease home when the pointer leaves
     the window. touch has no cursor, so coarse pointers get a
     gentle scroll-linked shift instead. reduced motion installs
     none of it, and the rAF loop parks once everything settles */
  var amb = document.querySelector('.amb');
  if (amb && !reduced) {
    var ambW = [
      { el: amb.querySelector('.amb__w--1'), fx: 54, fy: 38, x: 0, y: 0 },
      { el: amb.querySelector('.amb__w--2'), fx: 30, fy: 22, x: 0, y: 0 },
      { el: amb.querySelector('.amb__w--3'), fx: -16, fy: -12, x: 0, y: 0 }
    ].filter(function (w) { return w.el; });

    if (finePointer && ambW.length) {
      var spot = amb.querySelector('.amb__spot');
      var aTx = 0, aTy = 0;                    /* pointer, normalised -1..1 */
      var sX = 0, sY = 0, stX = 0, stY = 0;    /* spotlight pos + target */
      var sO = 0, sOT = 0;                     /* spotlight opacity */
      var aRun = false, aSeen = false, aIdle = 0;
      function ambLoop() {
        if (document.hidden) { aRun = false; return; }
        var live = false;
        ambW.forEach(function (w) {
          var gx = aTx * w.fx, gy = aTy * w.fy;
          w.x += (gx - w.x) * .055;
          w.y += (gy - w.y) * .055;
          if (Math.abs(gx - w.x) > .15 || Math.abs(gy - w.y) > .15) live = true;
          w.el.style.transform = 'translate3d(' + w.x.toFixed(1) + 'px,' + w.y.toFixed(1) + 'px,0)';
        });
        if (spot) {
          sX += (stX - sX) * .12;
          sY += (stY - sY) * .12;
          sO += (sOT - sO) * .09;
          if (Math.abs(stX - sX) > .2 || Math.abs(stY - sY) > .2 ||
              Math.abs(sOT - sO) > .004) live = true;
          spot.style.transform = 'translate3d(' + sX.toFixed(1) + 'px,' + sY.toFixed(1) + 'px,0) translate(-50%,-50%)';
          spot.style.opacity = sO.toFixed(3);
        }
        if (live) requestAnimationFrame(ambLoop);
        else aRun = false;
      }
      function ambKick() {
        if (!aRun) { aRun = true; requestAnimationFrame(ambLoop); }
      }
      window.addEventListener('pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
        aTx = (e.clientX / window.innerWidth) * 2 - 1;
        aTy = (e.clientY / window.innerHeight) * 2 - 1;
        stX = e.clientX; stY = e.clientY;
        if (!aSeen) { aSeen = true; sX = stX; sY = stY; }
        sOT = 1;
        clearTimeout(aIdle);
        aIdle = setTimeout(function () { sOT = 0; ambKick(); }, 1600);
        ambKick();
      }, { passive: true });
      document.addEventListener('mouseout', function (e) {
        if (!e.relatedTarget) {
          aTx = 0; aTy = 0; sOT = 0;
          clearTimeout(aIdle);
          ambKick();
        }
      });
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden && aSeen) ambKick();
      });
    } else if (ambW.length) {
      /* coarse pointers: the field leans a few px against the
         scroll, so the background still feels alive under a thumb.
         straight off a rAF-throttled scroll listener, transform
         writes only, nothing running between scrolls */
      var ambScTick = false;
      function ambScroll() {
        ambScTick = false;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var p = max > 0 ? window.scrollY / max : 0;
        var offs = [-p * 36, p * 26, -p * 18];
        ambW.forEach(function (w, i) {
          w.el.style.transform = 'translate3d(0,' + offs[i].toFixed(1) + 'px,0)';
        });
      }
      window.addEventListener('scroll', function () {
        if (!ambScTick) { ambScTick = true; requestAnimationFrame(ambScroll); }
      }, { passive: true });
      window.addEventListener('resize', ambScroll);
      ambScroll();
    }
  }

  /* ---------- scroll reveals ---------- */
  /* the colleague's pattern, at Arz's order: titles masked-rise,
     blocks fade up, siblings echo. gated hard: no observer or
     reduced motion and nothing is ever tagged or hidden */
  if (!reduced && 'IntersectionObserver' in window) {
    root.classList.add('rv-on');

    function tag(sel, kind, steps, step) {
      var out = [];
      [].slice.call(document.querySelectorAll(sel)).forEach(function (el, i) {
        el.setAttribute('data-rv', kind || '');
        if (steps) el.style.setProperty('--rd', ((i % steps) * step).toFixed(2) + 's');
        out.push(el);
      });
      return out;
    }
    var rvEls = [];
    [].slice.call(document.querySelectorAll('.sec__title')).forEach(function (el) {
      if (el.closest('.cover') || el.closest('#contact')) return;
      el.setAttribute('data-rv', 'title');
      rvEls.push(el);
    });
    rvEls = rvEls.concat(
      tag('.about__body p', '', 3, .21),
      tag('.about__list li', '', 3, .21),
      tag('.wcard', '', 99, .09),
      tag('.index-list'),
      tag('.kit > div', '', 4, .12),
      tag('.ledger__intro'),
      tag('.ledger__stats'),
      tag('.ledger__cols > div', '', 2, .2),
      tag('.ledger__stamp'),
      tag('.chapter', '', 3, .18),
      tag('.certs'),
      tag('.contact__line'),
      tag('.contact__cta')
    );
    var rvIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          rvIO.unobserve(en.target);
          /* a work card that has landed hands its transforms back to
             its own hover rules: strip the reveal attributes once the
             wave has passed */
          if (en.target.classList.contains('wcard')) {
            var card = en.target;
            setTimeout(function () {
              card.removeAttribute('data-rv');
              card.style.removeProperty('--rd');
            }, 1800);
          }
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    rvEls.forEach(function (el) { rvIO.observe(el); });
    /* safety: anything already at or above the viewport edge after a
       few seconds is shown regardless, nothing stays hidden. work
       cards are exempt: their observer sees them through the rail,
       and they must arrive on the rail's own scroll, not a timer */
    setTimeout(function () {
      rvEls.forEach(function (el) {
        if (el.classList.contains('wcard')) return;
        if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add('is-in');
        }
      });
    }, 5000);

    /* ---------- receipts activity pulse ---------- */
    var grid = document.getElementById('ledgerGrid');
    if (grid) {
      var gridSeen = false, pulsed = false;
      function staggerCells() {
        [].forEach.call(grid.children, function (c, i) {
          c.style.transitionDelay = (i * 10) + 'ms';
        });
      }
      function tryPulse() {
        if (pulsed || !gridSeen || !grid.children.length) return;
        pulsed = true;
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { grid.classList.add('pulsed'); });
        });
      }
      staggerCells();
      new MutationObserver(function () { staggerCells(); tryPulse(); })
        .observe(grid, { childList: true });
      new IntersectionObserver(function (en, io) {
        if (en[0].isIntersecting) { gridSeen = true; tryPulse(); io.disconnect(); }
      }, { threshold: .2 }).observe(grid);
    }

    /* ---------- the rail's active card ---------- */
    var railEl = document.getElementById('workRail');
    if (railEl) {
      var cards = [].slice.call(railEl.querySelectorAll('.wcard'));
      var aIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            cards.forEach(function (c) { c.classList.toggle('is-active', c === en.target); });
          }
        });
      }, { root: railEl, rootMargin: '0px -42% 0px -42%', threshold: 0 });
      cards.forEach(function (c) { aIO.observe(c); });

      /* scroll parallax on the card pictures: as the rail moves, each
         photo drifts a few pixels against its frame. rAF-throttled,
         transform-only, and it stands down on any card being hovered
         so the pointer parallax owns that card alone */
      var pCards = cards.map(function (c) {
        return { card: c, img: c.querySelector('.wcard__media > img.ph') };
      }).filter(function (o) { return o.img; });
      var pTick = false, pIdle = 0;
      function railParallax() {
        pTick = false;
        var r = railEl.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        pCards.forEach(function (o) {
          if (o.card._hov) return;
          var b = o.card.getBoundingClientRect();
          var rel = ((b.left + b.width / 2) - cx) / r.width;
          rel = Math.max(-.6, Math.min(.6, rel));
          o.img.style.transform = 'translate3d(' + (-rel * 26).toFixed(1) + 'px,0,0) scale(1.12)';
        });
      }
      railEl.addEventListener('scroll', function () {
        railEl.classList.add('is-scrolling');
        clearTimeout(pIdle);
        pIdle = setTimeout(function () { railEl.classList.remove('is-scrolling'); }, 160);
        if (!pTick) { pTick = true; requestAnimationFrame(railParallax); }
      }, { passive: true });
      pCards.forEach(function (o) {
        o.card.addEventListener('pointerenter', function () {
          o.card._hov = true;
          o.img.style.transform = '';
        });
        o.card.addEventListener('pointerleave', function () {
          o.card._hov = false;
          o.img.style.transform = '';
          if (!pTick) { pTick = true; requestAnimationFrame(railParallax); }
        });
      });
      railParallax();
    }

    /* ---------- toolkit tiles lean to the pointer ---------- */
    if (finePointer) {
      [].slice.call(document.querySelectorAll('.kit > div')).forEach(function (tile) {
        var raf = 0;
        tile.addEventListener('pointermove', function (e) {
          if (e.pointerType === 'touch') return;
          var r = tile.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width;
          var py = (e.clientY - r.top) / r.height;
          if (raf) return;
          raf = requestAnimationFrame(function () {
            raf = 0;
            tile.classList.add('mag');
            tile.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
            tile.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
            tile.style.transform = 'translate3d(' + ((px - .5) * 6).toFixed(1) + 'px,' + ((py - .5) * 4).toFixed(1) + 'px,0)';
          });
        });
        tile.addEventListener('pointerleave', function () {
          if (raf) cancelAnimationFrame(raf);
          raf = 0;
          tile.style.transform = '';
        });
      });
    }
  }
})();
