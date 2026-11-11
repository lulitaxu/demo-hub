/* Case views: clicking a work card opens the depth behind it.
   Content is the facts from the page and the projects themselves;
   nothing here is a metric the projects have not already made
   public. Esc, the backdrop, or the Close button shuts it; focus
   goes to the Close button on open and back to the card on close. */
(function () {
  'use strict';

  var CASES = {
    nyktos: {
      title: 'Nyktos',
      meta: 'Live since 2026 · Private messenger',
      body: '<p>Nyktos is my private messenger. A message is encrypted on the sender\u2019s phone and decrypted only on the receiver\u2019s; the server stores ciphertext and nothing else, so there is nothing readable to leak or sell.</p>' +
        '<h4>What I built</h4><ul>' +
        '<li>The whole product, solo: the Next.js app and its admin panel</li>' +
        '<li>The encryption layer: libsodium, a fresh ephemeral key per message, safety numbers so two people can verify each other</li>' +
        '<li>Encrypted photo and video attachments</li>' +
        '<li>Signup hardened with rate limits, temp-mail blocking and a captcha</li></ul>' +
        '<p>The security page on the live site documents exactly how it works, in public.</p>',
      chips: ['Next.js', 'TypeScript', 'libsodium', 'Supabase'],
      links: [{ label: 'Visit Nyktos', href: 'https://nyktos.tech' }]
    },
    cliphaus: {
      title: 'ClipHaus',
      meta: 'Founded 2026 · Clipping agency and platform',
      body: '<p>ClipHaus is the clipping agency I founded. Podcasters send in episodes; editors turn them into finished short clips. I built the entire platform it runs on, and I still run the technical side of the company.</p>' +
        '<h4>What I built</h4><ul>' +
        '<li>Client and editor dashboards with a real production state machine underneath</li>' +
        '<li>The quota ledger that tracks every clip against a plan</li>' +
        '<li>The transcription pipeline: GPU transcription with a local fallback</li>' +
        '<li>Invoicing end to end, and the Finance side for the agency</li>' +
        '<li>Moment Finder, the scan tool sold to clippers separately, with an abuse gate in front of it</li></ul>' +
        '<p>The agency sells a paid pilot and monthly clip packages; the live site has the numbers.</p>',
      chips: ['Next.js', 'Supabase', 'Cloudflare', 'Backblaze B2'],
      links: [{ label: 'Visit ClipHaus', href: 'https://cliphaus.dev' }]
    },
    arzxsh: {
      title: 'arzxsh',
      meta: 'Latest release 0.6.19 · Android music player',
      body: '<p>arzxsh is my Android music player, and the source is fully public. It resolves YouTube Music on the device, falls back to Audius, and plays local files, with gapless playback and crossfades between songs.</p>' +
        '<h4>What I built</h4><ul>' +
        '<li>The whole Kotlin app on Media3: playback, downloads, the theme engine</li>' +
        '<li>Synced lyrics that take their colour from the playing song\u2019s artwork</li>' +
        '<li>An in-app updater fed from GitHub Releases, signed with a permanent key</li>' +
        '<li>Mix mode, new in 0.6.19: on-device BPM and musical-key analysis for downloaded songs, per-pair Fade, Rise and Blend transitions, and a Smart Reorder that re-sequences a playlist by tempo and key</li></ul>',
      chips: ['Kotlin', 'Media3', 'Android'],
      links: [
        { label: 'Visit the release site', href: 'https://arzxsh.arafatarzu.me' },
        { label: 'Source on GitHub', href: 'https://github.com/lulitaxu/music-player' }
      ]
    },
    auditcanvas: {
      title: 'AuditCanvas',
      meta: 'Meta hackathon entry, 2026 · Submitted',
      body: '<p>AuditCanvas turns raw security evidence into findings you can act on. I built it for the Meta Global AI Developer Hackathon and submitted it in the Indie Developer Track in November 2026; the demo is still live and the results actually save.</p>' +
        '<h4>What I built</h4><ul>' +
        '<li>The full app: evidence in, structured findings out</li>' +
        '<li>An eval-driven pipeline, so the quality of a finding is measured, not vibes</li>' +
        '<li>Persistent reports and the admin side behind the demo</li></ul>' +
        '<p>It is the same audit discipline I sell to clients, turned into a product.</p>',
      chips: ['Next.js', 'AI evals', 'Neon'],
      links: [
        { label: 'Open the live demo', href: 'https://auditcanvas.vercel.app' },
        { label: 'In Meta\u2019s hackathon gallery', href: 'https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/gallery/2399' },
        { label: 'Source on GitHub', href: 'https://github.com/lulitaxu/auditcanvas' }
      ]
    },
    verro: {
      title: 'Verro',
      meta: 'Live since 2026 · Bot-or-human API',
      body: '<p>Verro is an API that scores a signup or checkout as bot or human before you pay for the OTP text or ship the prize. Every score comes back with its reasons in plain language; nothing about it is a black box.</p>' +
        '<h4>What I built</h4><ul>' +
        '<li>The scoring engine and the signals it reads</li>' +
        '<li>The API itself, plus the account dashboard</li>' +
        '<li>The live test console on the site, where anyone can run a check and watch the reasoning</li></ul>',
      chips: ['API', 'Vercel', 'Neon'],
      links: [{ label: 'Visit Verro', href: 'https://verro-sigma.vercel.app' }]
    },
    oshudh: {
      title: 'Oshudh',
      meta: 'Live since 2026 · Team Flexus',
      body: '<p>Oshudh is a pharmacy product I built with Team Flexus, lead Tahsin Ahmed Nasif. We submitted it to the CloudCamp AI Builders Congress, in the Idea to Unicorn preliminary round, in October 2026.</p>' +
        '<h4>What I built</h4><ul>' +
        '<li>The web product with the team: the storefront and the flows behind it</li>' +
        '<li>The build and deployment on Next.js and Vercel</li></ul>' +
        '<p>It is live and public, like everything else on this page.</p>',
      chips: ['Next.js', 'Vercel'],
      links: [{ label: 'Visit Oshudh', href: 'https://oshudh.vercel.app' }]
    }
  };

  var view = document.getElementById('caseView');
  if (!view) return;
  var panel = view.querySelector('.case__panel');
  var closeBtn = document.getElementById('caseClose');
  var metaEl = document.getElementById('caseMeta');
  var titleEl = document.getElementById('caseTitle');
  var bodyEl = document.getElementById('caseBody');
  var chipsEl = document.getElementById('caseChips');
  var ctaEl = document.getElementById('caseCta');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lastCard = null;
  var closeTimer = 0;

  function fill(data) {
    metaEl.textContent = data.meta;
    titleEl.textContent = data.title;
    bodyEl.innerHTML = data.body;
    chipsEl.innerHTML = '';
    data.chips.forEach(function (c) {
      var li = document.createElement('li');
      /* each stack chip carries its mark, same sprite as the cards */
      li.innerHTML = window.arzChipIcon ? window.arzChipIcon(c) : '';
      li.appendChild(document.createTextNode(c));
      chipsEl.appendChild(li);
    });
    ctaEl.innerHTML = '';
    data.links.forEach(function (l, i) {
      var a = document.createElement('a');
      a.className = 'btn' + (i === 0 ? ' btn-solid' : '');
      a.href = l.href;
      a.target = '_blank';
      a.rel = 'noopener';
      /* repo links get the GitHub mark, live sites the outward arrow */
      a.innerHTML = window.arzIcon
        ? window.arzIcon(l.href.indexOf('github.com') !== -1 ? 'i-github' : 'i-arrow')
        : '';
      a.appendChild(document.createTextNode(l.label));
      ctaEl.appendChild(a);
    });
  }

  function open(data, card) {
    fill(data);
    lastCard = card;
    clearTimeout(closeTimer);
    view.hidden = false;
    panel.scrollTop = 0;
    /* a fresh case starts flat; the parallax below re-earns its
       offsets from this case's own scroll */
    if (typeof pEls !== 'undefined') {
      pEls.forEach(function (o) { o.el.style.transform = ''; });
    }
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { view.classList.add('open'); });
    });
    closeBtn.focus();
  }

  function close() {
    view.classList.remove('open');
    document.documentElement.style.overflow = '';
    var done = function () { view.hidden = true; };
    if (reduced) done();
    else closeTimer = setTimeout(done, 480);
    if (lastCard) lastCard.focus();
  }

  /* ---------- case parallax ---------- */
  /* Berry's case pages stagger their layers at different scroll
     speeds: as the sheet scrolls, the head of the case lags a
     little behind the scroll and the body runs a touch ahead, so
     the sheet feels deep instead of flat. rates are small, clamps
     are smaller, transform-only, driven by the panel's own native
     scroll on a rAF tick. reduced motion never installs it */
  var pEls = [
    { el: metaEl, f: .10, max: 14 },
    { el: titleEl, f: .05, max: 10 },
    { el: bodyEl, f: -.02, max: 8 },
    { el: chipsEl, f: -.03, max: 9 },
    { el: ctaEl, f: -.045, max: 10 }
  ];
  var pTick = false;
  function pApply() {
    pTick = false;
    var st = panel.scrollTop;
    pEls.forEach(function (o) {
      var d = Math.max(-o.max, Math.min(o.max, st * o.f));
      o.el.style.transform = 'translate3d(0,' + d.toFixed(1) + 'px,0)';
    });
  }
  if (!reduced) {
    panel.addEventListener('scroll', function () {
      if (!pTick) { pTick = true; requestAnimationFrame(pApply); }
    }, { passive: true });
  }

  document.querySelectorAll('.wcard[data-case]').forEach(function (card) {
    card.addEventListener('click', function (e) {
      var data = CASES[card.getAttribute('data-case')];
      if (!data) return;
      e.preventDefault();
      open(data, card);
    });
  });
  closeBtn.addEventListener('click', close);
  view.querySelector('[data-close]').addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !view.hidden) close();
  });
})();
