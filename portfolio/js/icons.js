/* Icon helper for the dynamic renderers (receipts, case views).
   The glyphs themselves live in the inline symbol sprite at the top
   of index.html, drawn once for the whole site; this file only maps
   names to symbols and stamps out <svg><use> markup. Unknown names
   fall back to the plain code glyph, never to nothing. */
(function () {
  'use strict';

  var LANG_ICON = {
  "JavaScript": "i-js",
  "TypeScript": "i-ts",
  "Python": "i-py",
  "HTML": "i-html",
  "CSS": "i-css",
  "SCSS": "i-css",
  "Kotlin": "i-kotlin",
  "C": "i-c",
  "C++": "i-cpp",
  "C#": "i-csharp",
  "Shell": "i-shell",
  "Go": "i-go",
  "Rust": "i-rust",
  "Ruby": "i-ruby",
  "PHP": "i-php",
  "Java": "i-java",
  "Objective-C": "i-c"
};
  var CHIP_ICON = {
  "Next.js": "i-next",
  "React": "i-react",
  "TypeScript": "i-ts",
  "JavaScript": "i-js",
  "Python": "i-py",
  "Node": "i-node",
  "libsodium": "i-lock",
  "Supabase": "i-bolt",
  "Cloudflare": "i-cloud",
  "Backblaze B2": "i-db",
  "PostgreSQL": "i-db",
  "Kotlin": "i-kotlin",
  "Media3": "i-play",
  "Android": "i-android",
  "AI evals": "i-chip",
  "Neon": "i-neon",
  "API": "i-code",
  "Vercel": "i-vercel"
};

  window.arzIcon = function (id, cls) {
    return '<svg class="ic ' + (cls || '') + '" aria-hidden="true" focusable="false"><use href="#' + id + '"></use></svg>';
  };
  window.arzLangIcon = function (name) {
    return window.arzIcon(LANG_ICON[name] || 'i-code');
  };
  window.arzChipIcon = function (name) {
    var id = CHIP_ICON[name];
    return id ? window.arzIcon(id) : '';
  };
})();
