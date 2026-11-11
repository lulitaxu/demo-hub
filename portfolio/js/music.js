/* Background music for arafatarzu.me. The track is the one the
   pre-rebuild site carried (an <audio id="bgAudio"> element pointing
   at an r2.guns.lol mp3, present in index.html from Oct 2026 until
   the rebuild dropped it); the file itself is now hosted here, at
   assets/audio/bg-music.mp3, so it cannot vanish with a third-party
   link again. Behaviour, deliberately unlike the old build: the
   music starts OFF. The toggle is the only thing that turns it on;
   it loops at low volume, fades in and out rather than cutting, and
   the choice persists in localStorage. If a returning visitor had
   it on, browsers still demand a gesture before sound, so the first
   pointer or key press of the visit starts it. */
(function () {
  'use strict';

  var audio = document.getElementById('bgAudio');
  var btn = document.getElementById('musicToggle');
  if (!audio || !btn) return;

  var VOL = 0.4;
  var KEY = 'arz_music';
  var wanted = false;
  try { wanted = localStorage.getItem(KEY) === '1'; } catch (e) { /* private mode */ }

  var fadeTimer = null;
  function fadeTo(target, done) {
    clearInterval(fadeTimer);
    var step = (target - audio.volume) / 22;
    if (step === 0) { done && done(); return; }
    fadeTimer = setInterval(function () {
      var v = audio.volume + step;
      if ((step > 0 && v >= target) || (step < 0 && v <= target)) {
        audio.volume = Math.max(0, Math.min(1, target));
        clearInterval(fadeTimer);
        done && done();
      } else {
        audio.volume = Math.max(0, Math.min(1, v));
      }
    }, 40);
  }

  function reflect() {
    btn.setAttribute('aria-pressed', wanted ? 'true' : 'false');
    btn.setAttribute('aria-label', wanted ? 'Turn background music off' : 'Turn background music on');
    btn.classList.toggle('is-on', wanted);
  }

  function start() {
    audio.volume = 0;
    var p = audio.play();
    if (p && p.catch) p.catch(function () { /* stays silent; toggle still reflects intent */ });
    fadeTo(VOL);
  }

  function setSound(on) {
    wanted = on;
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* ignore */ }
    reflect();
    if (on) {
      if (audio.paused) start();
      else fadeTo(VOL);
    } else {
      fadeTo(0, function () { audio.pause(); });
    }
  }

  btn.addEventListener('click', function () { setSound(!wanted); });

  /* the equalizer bars dance only while sound is actually coming out */
  audio.addEventListener('playing', function () { btn.classList.add('is-playing'); });
  audio.addEventListener('pause', function () { btn.classList.remove('is-playing'); });

  /* pause under a hidden tab, resume on return if it was wanted */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { audio.pause(); }
    else if (wanted && audio.paused) {
      var p = audio.play();
      if (p && p.catch) p.catch(function () {});
    }
  });

  reflect();

  /* returning visitor who left it on: arm the first real gesture */
  if (wanted) {
    var arm = function () {
      window.removeEventListener('pointerdown', arm, true);
      window.removeEventListener('keydown', arm, true);
      if (wanted && audio.paused) start();
    };
    window.addEventListener('pointerdown', arm, true);
    window.addEventListener('keydown', arm, true);
  }
})();
