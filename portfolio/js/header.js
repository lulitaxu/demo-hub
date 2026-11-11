/* Header behaviour for arafatarzu.me (2026-11-09, Arz: "the upper
   section is normal asf u did nthg on there"). The bar starts bare,
   condenses once the page moves, slides away on a fast scroll down
   and returns on the way up, carries the red scroll progress line,
   and marks the section in view. The name does one staggered wave
   under a fine pointer. Scroll handling is rAF-throttled and writes
   transforms and classes only; native scroll is never touched.
   Under prefers-reduced-motion the bar is static: no hide, no
   condense, no letter play; progress and scrollspy still report
   state, untransitioned. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  var bar = document.querySelector('.topbar');
  if (!bar) return;
  var prog = document.getElementById('scrollProg');

  /* ---------- scroll state: condense, hide/show, progress ------ */
  var lastY = window.scrollY || 0;
  var ticking = false;

  function update() {
    ticking = false;
    var y = window.scrollY || 0;

    if (prog) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      prog.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }

    if (!reduced) {
      if (y <= 10) {
        bar.classList.remove('is-condensed', 'is-hidden');
      } else {
        bar.classList.add('is-condensed');
        var dy = y - lastY;
        if (dy > 4 && y > 260) bar.classList.add('is-hidden');
        else if (dy < -4) bar.classList.remove('is-hidden');
      }
    }
    lastY = y;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();

  /* a keyboard user tabbing into the bar always gets it back */
  bar.addEventListener('focusin', function () { bar.classList.remove('is-hidden'); });

  /* ---------- scrollspy ----------------------------------------- */
  var links = {};
  bar.querySelectorAll('a[href^="#"]').forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    if (id && id !== 'top') links[id] = a;
  });
  var current = null;
  function setActive(id) {
    if (id === current) return;
    current = id;
    Object.keys(links).forEach(function (k) {
      links[k].classList.toggle('is-active', k === id);
    });
  }
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) setActive(en.target.id);
      });
    }, { rootMargin: '-38% 0px -55% 0px', threshold: 0 });
    Object.keys(links).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) spy.observe(sec);
    });
  }

  /* ---------- the name mark -------------------------------------- */
  var brand = bar.querySelector('.topbar__brand');
  if (brand) {
    brand.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });

    if (finePointer && !reduced) {
      /* split the name into letters for the wave; the anchor keeps
         its full name as an aria-label so nothing reads letter by
         letter to a screen reader */
      var text = brand.textContent;
      brand.setAttribute('aria-label', text + ' — back to top');
      brand.textContent = '';
      var idx = 0;
      text.split('').forEach(function (ch) {
        if (ch === ' ') { brand.appendChild(document.createTextNode(' ')); return; }
        var s = document.createElement('span');
        s.className = 'brand__l';
        s.setAttribute('aria-hidden', 'true');
        s.style.setProperty('--i', idx++);
        s.textContent = ch;
        brand.appendChild(s);
      });

      var playing = false;
      brand.addEventListener('mouseenter', function () {
        if (playing) return;
        playing = true;
        brand.classList.add('is-playing');
        var total = idx * 32 + 550 + 80;
        setTimeout(function () {
          brand.classList.remove('is-playing');
          playing = false;
        }, total);
      });
    }
  }
})();
