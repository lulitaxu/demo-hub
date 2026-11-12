/* Demo Archive — motion layer.
   Hand-rolled vanilla JS, no libraries. Re-expresses the reference site's
   interaction system (hero choreography, light smooth scroll, scroll
   reveals, count-ups, image parallax, tilt + shine, marquee, pill nav)
   in this site's own design language.

   Safety model: everything is gated on the .js-motion class, which the
   inline head script adds only when JS runs AND the user has not asked
   for reduced motion. Without JS (or with reduced motion) this file
   either never runs or returns immediately, and the page is the
   original static site. All animation is transform/opacity only. */
(function () {
  "use strict";

  var docEl = document.documentElement;
  if (!docEl.classList.contains("js-motion") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.__motionReady = true;
    return;
  }
  window.__motionReady = true;
  if (window.__motionFallback) clearTimeout(window.__motionFallback);

  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var desktopMq = window.matchMedia("(min-width: 861px)");
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var easeOutExpo = function (t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };

  /* ================= smooth-scroll state (used by the shared loop) === */
  var smoothOn = false;
  var smoothStepping = false;
  var targetY = window.scrollY;
  var currentY = window.scrollY;
  var maxY = 1;

  function measureMax() {
    maxY = Math.max(1, docEl.scrollHeight - window.innerHeight);
  }
  function syncSmoothTarget() { targetY = currentY = window.scrollY; }
  function smoothTick() {
    if (!smoothOn || !smoothStepping) return false;
    var diff = targetY - currentY;
    if (Math.abs(diff) < 0.4) {
      currentY = targetY;
      window.scrollTo(0, currentY);
      smoothStepping = false;
      return false;
    }
    currentY += diff * 0.13;
    window.scrollTo(0, currentY);
    return true;
  }

  /* ================= shared rAF scroll loop =================
     Scroll-driven modules register step functions; they run inside one
     rAF, and only on frames where the scroll position changed or the
     smooth-scroll lerp is still travelling. */
  var tickers = [];
  var rafId = null;
  var lastY = window.scrollY;
  function requestLoop() { if (rafId === null) rafId = requestAnimationFrame(loop); }
  function loop() {
    rafId = null;
    var moving = smoothTick();
    var y = window.scrollY;
    if (y !== lastY || moving) {
      lastY = y;
      for (var i = 0; i < tickers.length; i++) tickers[i]();
      if (moving) requestLoop();
    }
  }
  window.addEventListener("scroll", function () {
    if (!smoothStepping) syncSmoothTarget();
    requestLoop();
  }, { passive: true });

  /* ================= 1. hero load choreography ================= */
  var hero = document.querySelector(".hero");
  var h1 = hero ? hero.querySelector("h1") : null;
  if (h1) {
    // Split the headline into its two <br>-separated lines and wrap each
    // in a mask so it can rise into place (Bárries Rezept 7, by hand).
    var lines = [], cur = [];
    Array.prototype.forEach.call(h1.childNodes, function (n) {
      if (n.nodeName === "BR") { lines.push(cur.join("")); cur = []; }
      else cur.push(n.textContent);
    });
    lines.push(cur.join(""));
    h1.textContent = "";
    lines.forEach(function (text) {
      var mask = document.createElement("span");
      mask.className = "line-mask";
      var inner = document.createElement("span");
      inner.className = "line-inner";
      inner.textContent = text;
      mask.appendChild(inner);
      h1.appendChild(mask);
    });
  }

  /* ================= 4. count-ups (hero stat blocks) ================= */
  var countersDone = false;
  function runCounters() {
    if (countersDone) return;
    countersDone = true;
    document.querySelectorAll(".stat-num").forEach(function (el) {
      var raw = el.textContent.trim();
      if (!/^\d+$/.test(raw)) return; // not purely numeric: leave it static
      var end = parseInt(raw, 10);
      if (end === 0) return;
      var t0 = null, dur = 900;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var p = clamp((ts - t0) / dur, 0, 1);
        el.textContent = String(Math.round(end * easeOutExpo(p)));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function startHero() {
    if (hero) hero.classList.add("hero-in");
    window.setTimeout(runCounters, 480);
  }
  // Double rAF, so the pre-states are painted before the entrance flips.
  requestAnimationFrame(function () { requestAnimationFrame(startHero); });

  /* ================= 3. scroll reveals (one-shot) ================= */
  var revealEls = document.querySelectorAll(".section-head, .flagship, .demo-card, .inquiry");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ================= 2. light smooth scroll (fine pointers only) === */
  function onWheel(e) {
    if (e.ctrlKey || e.metaKey) return; // pinch-zoom etc. stays native
    // If an inner scroller ever appears, let it consume its own wheel.
    var node = e.target;
    while (node && node !== document.body) {
      if (node instanceof Element) {
        var st = window.getComputedStyle(node);
        if ((st.overflowY === "auto" || st.overflowY === "scroll") &&
            node.scrollHeight > node.clientHeight) return;
      }
      node = node.parentNode;
    }
    var delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 16;                       // lines
    else if (e.deltaMode === 2) delta *= window.innerHeight; // pages
    if (delta === 0) return;
    e.preventDefault();
    measureMax();
    if (!smoothStepping) { currentY = window.scrollY; targetY = currentY; }
    targetY = clamp(targetY + delta, 0, maxY);
    smoothStepping = true;
    requestLoop();
  }

  if (finePointer.matches) {
    smoothOn = true;
    docEl.classList.add("ss-on"); // kills CSS scroll-behavior:smooth so the lerp owns it
    measureMax();
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", function (e) {
      // Keyboard scrolling stays native; just stop the lerp fighting it.
      if ([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"].indexOf(e.key) !== -1) {
        smoothStepping = false;
        syncSmoothTarget();
      }
    });
    window.addEventListener("load", measureMax);
  }

  /* Anchor navigation: ride the lerp when smooth scroll is on (with a
     topbar offset), stay with the site's original native behaviour
     otherwise. Delegated, so it also covers the JS-built pill nav. */
  document.addEventListener("click", function (e) {
    if (!smoothOn) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var hash = a.getAttribute("href");
    if (!hash || hash.length < 2) return;
    var el = document.querySelector(hash);
    if (!el) return;
    e.preventDefault();
    var bar = document.querySelector(".topbar");
    var off = bar ? bar.offsetHeight : 0;
    measureMax();
    targetY = clamp(el.getBoundingClientRect().top + window.scrollY - off - 4, 0, maxY);
    currentY = window.scrollY;
    smoothStepping = true;
    requestLoop();
    if (window.history && window.history.pushState) window.history.pushState(null, "", hash);
  });

  /* ================= 6. inner-image parallax (desktop, fine pointer) == */
  var pxItems = [];
  if (finePointer.matches && desktopMq.matches) {
    document.querySelectorAll(".flagship-media img, .demo-media img").forEach(function (img) {
      pxItems.push({ img: img, cur: 0 });
    });
  }
  function parallaxStep() {
    var vh = window.innerHeight;
    for (var i = 0; i < pxItems.length; i++) {
      var it = pxItems[i];
      var r = it.img.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) continue;
      var prog = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); // -1..1
      var target = clamp(-prog, -1, 1) * 6;                                  // +-6px drift
      it.cur += (target - it.cur) * 0.12;
      it.img.style.setProperty("--py", it.cur.toFixed(2) + "px");
    }
  }
  if (pxItems.length) tickers.push(parallaxStep);

  /* ================= 5. tilt + shine (fine pointers) ================= */
  if (finePointer.matches) {
    document.querySelectorAll(".flagship-media, .demo-media").forEach(function (el) {
      var raf = null, ev = null;
      function apply() {
        raf = null;
        if (!ev) return;
        var r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var px = (ev.clientX - r.left) / r.width;
        var py = (ev.clientY - r.top) / r.height;
        var rx = clamp((0.5 - py) * 8, -4, 4);
        var ry = clamp((px - 0.5) * 8, -4, 4);
        el.style.transform =
          "perspective(950px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
        el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      }
      el.addEventListener("pointermove", function (e) {
        if (e.pointerType && e.pointerType !== "mouse" && e.pointerType !== "pen") return;
        ev = e;
        el.classList.add("tilting");
        if (raf === null) raf = requestAnimationFrame(apply);
      }, { passive: true });
      el.addEventListener("pointerleave", function () {
        ev = null;
        if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
        el.classList.remove("tilting");
        el.style.transform = ""; // CSS transition eases it back to flat
      });
    });
  }

  /* ================= 8. pill nav + scrollspy ================= */
  var pill = document.createElement("nav");
  pill.className = "pillnav mono";
  pill.setAttribute("aria-label", "On this page");
  pill.innerHTML =
    '<a href="#flagships" data-spy="flagships">Flagships</a>' +
    '<a href="#demos" data-spy="demos">Demos</a>' +
    '<a href="#inquiry" data-spy="inquiry">Inquiry</a>';
  document.body.appendChild(pill);

  var pillLinks = {};
  pill.querySelectorAll("a").forEach(function (a) {
    pillLinks[a.getAttribute("data-spy")] = a;
  });
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        Object.keys(pillLinks).forEach(function (k) {
          pillLinks[k].classList.toggle("active", k === en.target.id);
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    ["flagships", "demos", "inquiry"].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  }

  var inquiryEl = document.getElementById("inquiry");
  var footerEl = document.querySelector(".footer");
  function pillStep() {
    var past = hero
      ? window.scrollY > hero.offsetTop + hero.offsetHeight * 0.72
      : window.scrollY > 400;
    var blocked = false;
    [inquiryEl, footerEl].forEach(function (el) {
      if (!el) return;
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) blocked = true;
    });
    pill.classList.toggle("pill-show", past && !blocked);
  }
  tickers.push(pillStep);
  pillStep();

  /* ================= 7. ticker speed calibration =================
     The CSS keyframe loop translates the track by -50% (one group), so
     duration = group width / desired px-per-second. Fallback in CSS is
     75s if this never runs. */
  var track = document.getElementById("tickerTrack");
  function calibrateTicker() {
    if (!track) return;
    var group = track.querySelector(".ticker-group");
    if (!group) return;
    var w = group.getBoundingClientRect().width;
    if (!w) return;
    var speed = window.innerWidth <= 700 ? 26 : 40; // px/s; gentler on small screens
    track.style.animationDuration = (w / speed).toFixed(1) + "s";
  }
  calibrateTicker();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(calibrateTicker);

  /* ================= resize housekeeping ================= */
  var rsT = null;
  window.addEventListener("resize", function () {
    if (rsT) clearTimeout(rsT);
    rsT = setTimeout(function () {
      measureMax();
      calibrateTicker();
      pillStep();
    }, 160);
  }, { passive: true });
})();
