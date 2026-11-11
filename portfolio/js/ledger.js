/* The receipts: real numbers from the public GitHub API for lulitaxu.
   No token, no invented figures.
   How the numbers get here (rebuilt 2026-11-10): the page used to call
   api.github.com live from the browser, which takes ~57 anonymous API
   calls (one per repo for languages) against a 60/hour per-IP limit.
   On any shared or busy IP the limit was already spent, the fetch died,
   and the section sat on dashes; Arz hit exactly that on his phone.
   Now a scheduled job (scripts/build-ledger.mjs, run daily by the
   repo's GitHub Action with an authenticated token) precomputes the
   same numbers into assets/ledger.json, and the page reads that
   same-origin file: no API limit, no wait. The old live fetch remains
   only as a last resort if the file is missing, and the localStorage
   cache covers a visitor between refreshes. On total failure the
   section says the API is resting instead of guessing. */
(function () {
  'use strict';

  var USER = 'lulitaxu';
  var API = 'https://api.github.com';
  var CACHE_KEY = 'arz_ledger_v2';
  var CACHE_MS = 6 * 60 * 60 * 1000;

  var stampEl = document.getElementById('ledgerStamp');
  var gridEl = document.getElementById('ledgerGrid');
  var langsEl = document.getElementById('ledgerLangs');

  function setStat(name, value) {
    document.querySelectorAll('[data-ledger="' + name + '"]').forEach(function (el) {
      el.textContent = value;
    });
  }

  function fmtDate(ts) {
    return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function render(data, stampText) {
    setStat('repos', String(data.repos));
    setStat('since', String(data.since));
    setStat('langcount', String(data.langs.length));
    setStat('pushes', String(data.pushes));

    if (gridEl) {
      gridEl.innerHTML = '';
      data.days.forEach(function (count) {
        var cell = document.createElement('i');
        var level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;
        if (level) cell.setAttribute('data-l', String(level));
        cell.title = count + (count === 1 ? ' push' : ' pushes');
        gridEl.appendChild(cell);
      });
    }

    if (langsEl) {
      langsEl.innerHTML = '';
      var total = data.langs.reduce(function (s, l) { return s + l.bytes; }, 0) || 1;
      data.langs.slice(0, 6).forEach(function (l) {
        var pct = (l.bytes / total) * 100;
        var li = document.createElement('li');
        var row = document.createElement('div');
        row.className = 'row';
        var b = document.createElement('b');
        /* the language's own mark beside its name, from the page
           sprite; unmapped languages get the plain code glyph */
        b.innerHTML = window.arzLangIcon ? window.arzLangIcon(l.name) : '';
        b.appendChild(document.createTextNode(l.name));
        var span = document.createElement('span'); span.textContent = pct.toFixed(1) + '%';
        row.appendChild(b); row.appendChild(span);
        var bar = document.createElement('div');
        bar.className = 'bar';
        var fill = document.createElement('i');
        fill.style.width = Math.max(1.5, pct) + '%';
        bar.appendChild(fill);
        li.appendChild(row); li.appendChild(bar);
        langsEl.appendChild(li);
      });
    }

    if (stampEl) stampEl.textContent = stampText;
  }

  function fetchJSON(url, timeoutMs) {
    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, timeoutMs || 12000) : 0;
    return fetch(url, { headers: { 'Accept': 'application/vnd.github+json' }, signal: ctrl ? ctrl.signal : undefined }).then(function (r) {
      if (timer) clearTimeout(timer);
      if (!r.ok) throw new Error('GitHub API ' + r.status);
      return r.json();
    }).catch(function (e) { if (timer) clearTimeout(timer); throw e; });
  }

  function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) { return null; }
  }
  function writeCache(at, data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: at, data: data })); } catch (e) {}
  }

  /* last resort only: the original live path (~57 anonymous calls,
     hostage to the per-IP rate limit). Kept for the day the baked
     file is somehow missing; not the normal path any more. */
  function loadLive(cached) {
    var userP = fetchJSON(API + '/users/' + USER);
    var reposP = fetchJSON(API + '/users/' + USER + '/repos?per_page=100&type=owner');
    var eventsP = fetchJSON(API + '/users/' + USER + '/events/public?per_page=100').catch(function () { return []; });

    Promise.all([userP, reposP, eventsP]).then(function (res) {
      var user = res[0], repos = res[1], events = res[2];
      var own = repos.filter(function (r) { return !r.fork; });

      var DAY = 86400000;
      var start = Date.now() - 90 * DAY;
      var days = new Array(90).fill(0);
      var pushes = 0;
      events.forEach(function (ev) {
        if (ev.type !== 'PushEvent') return;
        var t = new Date(ev.created_at).getTime();
        if (t < start) return;
        var commits = (ev.payload && ev.payload.commits) ? ev.payload.commits.length : 1;
        pushes += commits;
        var idx = Math.min(89, Math.floor((t - start) / DAY));
        days[idx] += commits;
      });

      var langRepos = own.filter(function (r) { return r.size > 0; });
      return Promise.all(langRepos.map(function (r) {
        return fetchJSON(API + '/repos/' + USER + '/' + r.name + '/languages').catch(function () { return {}; });
      })).then(function (langMaps) {
        var totals = {};
        langMaps.forEach(function (m) {
          Object.keys(m).forEach(function (k) { totals[k] = (totals[k] || 0) + m[k]; });
        });
        var langs = Object.keys(totals).map(function (k) { return { name: k, bytes: totals[k] }; })
          .sort(function (a, b) { return b.bytes - a.bytes; });

        var data = {
          repos: user.public_repos,
          since: new Date(user.created_at).getFullYear(),
          pushes: pushes,
          days: days,
          langs: langs
        };
        var now = Date.now();
        writeCache(now, data);
        render(data, 'Fetched from GitHub ' + fmtDate(now) + '.');
      });
    }).catch(function () {
      if (cached) {
        render(cached.data, 'GitHub API is rate-limited right now. Showing the last good fetch, from ' + fmtDate(cached.at) + '.');
      } else if (stampEl) {
        stampEl.textContent = 'GitHub API is rate-limited right now, so the receipts are resting instead of guessing. The numbers live at github.com/' + USER + '.';
      }
    });
  }

  function load() {
    var cached = readCache();

    /* the normal path: the precomputed same-origin file */
    fetch('assets/ledger.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('ledger.json ' + r.status);
      return r.json();
    }).then(function (file) {
      if (!file || !file.data || !file.data.langs) throw new Error('ledger.json malformed');
      writeCache(file.fetchedAt || Date.now(), file.data);
      render(file.data, 'Fetched from GitHub ' + fmtDate(file.fetchedAt) + '. The receipts refresh daily.');
    }).catch(function () {
      if (cached && (Date.now() - cached.at) < CACHE_MS) {
        render(cached.data, 'Fetched from GitHub ' + fmtDate(cached.at) + ' (cached copy).');
        return;
      }
      loadLive(cached);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
