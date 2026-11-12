# UNSLOP AUDIT — demo.arafatarzu.me

Audit only (2026-11-07). Method: unslop skill audit pass + Arz's AI-slop checklist
(MEMORY.md, 2026-10-11), run against source (`index.html`, `styles.css`, `motion.js`)
and a fresh local screenshot pass (desktop 1440 + mobile 390, in `qa-unslop/`).
No code was changed. Companion comparison: streetifybd.com (see §5), from its
shipped production CSS (fetched), its rendered content, and a real-browser visual study.

---

## 1. Verdict — why a reviewer reads "vibe-coded" within 10 seconds

No single element convicts this page; the **composite** does. In the first screen an
agency reviewer takes in: near-black background with a hot orange accent (the exact
black-and-orange pairing Arz himself flagged on 2026-11-05 as Muse's AI default),
a tiny tracked-out orange mono label, a giant grotesque headline laid over stock
footage of *someone else's video-editing timeline*, a four-box stat band whose
numbers visibly count up, and a logo marquee sliding underneath. Scroll, and every
single section fades/slides in, every screenshot tilts and grows a cursor-following
shine, the page hijacks the wheel with a lerped smooth-scroll, and a second,
floating glass pill nav appears to duplicate the topbar. Each piece is well built.
Together they are the canonical 2024–26 AI-portfolio starter kit: **the motion
density is the biggest tell** — a human designer picks one or two moves and holds
them; this page runs eight interaction systems at once, and `motion.js` says so
itself: it "re-expresses the reference site's interaction system" (hero
choreography, smooth scroll, reveals, count-ups, parallax, tilt+shine, marquee,
pill nav). The deep irony an auditor has to state plainly: the *content* is
stronger than most human portfolios — six real, deployed, clickable products —
but the chrome keeps announcing "generated" over it. Streetify (§5) proves the
point from the other side: an AI-built storefront that reads professional purely
because it exercises restraint the hub doesn't.

## 2. Findings

Severity: **Instant** = reads AI on sight · **Suspicious** = contributes to the read · **Fine** = checked, not a problem.

| # | Tell | Where it lives | Severity | Fix direction |
|---|------|----------------|----------|---------------|
| 1 | Black + hot-orange palette. `--ink:#0B0B0C` + `--signal:#FF4A1C` everywhere: labels, separators, CTA fill, CTA glow, wordmark dot, favicon (orange square, mono "A"). Arz's own rule (2026-11-05): never default to black+orange. | `styles.css:2-9` `:root`; `.label`, `.cta`, `.ticker-sep`, favicon in `index.html:23` | **Instant** | Pick a palette with a reason tied to the work (see directions §4). At minimum the orange cannot stay the *only* color idea on a near-black field. |
| 2 | `//` comment-prefix section labels — `// Flagships`, `// Client demos`, `// Start a project`. Dev-cosplay; the single most recognisable generated-portfolio mannerism. | `index.html` section heads (`<p class="mono label">// Flagships</p>` etc.) | **Instant** | Drop the slashes; a label system can survive without pretending the page is a source file. |
| 3 | Uppercase wide-tracked mono labels as the *entire* meta voice: `.mono { font-size:12px; letter-spacing:.14em; text-transform:uppercase }` on nav, labels, tags, stats, ticker, footer, buttons. Unslop sign verbatim ("uppercase labels with wide tracking"). | `styles.css:30-35`; used on ~every meta element in `index.html` | **Instant** | Keep mono for data only; give labels a second, quieter voice (see type contrast lesson, §5). |
| 4 | Scroll fade-ins on *every* block: `.section-head`, `.flagship`, `.demo-card`, `.inquiry` all start `opacity:0` and IO-reveal — a named item on Arz's checklist ("scroll fade-ins"). Directional variants (flagships slide from ±22px) make it more, not less, templated. | `styles.css` motion layer, "scroll reveals" block; `motion.js` §3 | **Instant** | Remove reveals as a system. If any entrance survives, it is one, on the hero only. |
| 5 | Count-up animation on hero stats (`runCounters`, 900ms easeOutExpo tweens). Motion that communicates nothing; the numbers are counts of the page's own contents. | `motion.js` §4; `.hero-stats` in `index.html` | **Instant** | Numbers render as numbers. See also #6. |
| 6 | The stat band itself: four equal boxes (`6 Products live / 3 Client demos / 9 Sites deployed / 0 Templates used`). Self-referential filler, and "0 Templates used" is a defensive meta-claim that reads as protesting too much — the one stat that makes a reviewer *more* suspicious. Equal-width stat boxes are a template component (unslop: stat cards are numbers, not a grid ritual). | `index.html` `.hero-stats`; `styles.css:139-163` | **Instant** | Cut the band, or cut it to the two facts that aren't countable from the page itself. "0 templates" goes regardless of direction chosen. |
| 7 | Cursor-following radial shine on every screenshot: `.flagship-media::after { background: radial-gradient(480px circle at var(--mx) var(--my), …) }` + 3D tilt (`perspective(950px) rotateX/Y`). Arz's checklist names the cursor beam explicitly. | `styles.css` "tilt + shine" block; `motion.js` §5 | **Instant** | Delete tilt and shine. A screenshot is evidence; it doesn't need to perform. |
| 8 | CTA hover = accent glow shadow + lift: `.cta:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(255,74,28,.26) }` — a colored glow, an unslop surface sign, and the only shadow on the page. | `styles.css` micro-interactions block | **Instant** | Hover becomes a surface/color step inside the palette. No glow, no float. |
| 9 | Wheel-hijacking lerped smooth scroll (desktop). Feels "buttery" in demos and "wrong" to every reviewer who scrolls for a living; also a Bárries-kit import, not a decision this page needed. | `motion.js` §2 (`smoothTick`, `onWheel`) | **Suspicious** | Native scroll. Smoothness theatre is a tell precisely because real studios don't do this on content pages. |
| 10 | Infinite logo/name marquee (75s loop, duplicated groups). Portfolio-template staple; also pure duplication — it lists the same nine projects the next two sections then present. Earns nothing. | `index.html` `.ticker`; `styles.css` ticker block; `motion.js` §7 | **Suspicious** | Cut it, or demote to a static hairline index strip. A marquee is a divider streetify uses *once* (§5), not a content system. |
| 11 | Floating pill nav with `backdrop-filter: blur(10px)` over `rgba(19,19,21,.92)` — the page's only glassmorphism, duplicating a topbar that already links the same three sections on a four-section page. | `styles.css` `.pillnav`; built in `motion.js` §8 | **Suspicious** | One nav. The page is short enough that the topbar plus anchors suffice. |
| 12 | Inner-image parallax on all screenshots (`--py` ±6px drift, base `scale(1.045)`). Subtle, competently done — and still one more system in the stack (see verdict). | `styles.css` `.flagship-media img`; `motion.js` §6 | **Suspicious** | Goes with the general motion diet; static crops are fine. |
| 13 | Hero construction = the template formula: full-bleed stock video (a Premiere Pro timeline, i.e. footage of *editing software*, not of any product on the page) + dark scrim + giant type + stat band. Headline also carries `text-shadow: 0 1px 14px rgba(0,0,0,.5)` to survive the busy footage — text fighting its background is a composition tell. | `index.html` `.hero`; `styles.css:71-107` | **Suspicious** | Hero should show the work or nothing. If footage stays, it must be footage *of the products*, with type on calm space. |
| 14 | Six flagship rows in strict alternation (media/body, flip, media/body…) at identical rhythm, each product reduced to a full homepage screenshot squeezed into a 16/10 top-crop — real products presented as tiny unreadable webpages-in-a-box, uniformly. Uniform treatment of unlike things reads as generated layout. | `index.html` `#flagships`; `styles.css:188-226` | **Suspicious** | Vary the presentation by product (a dashboard crop, a phone shot, a detail), or go full index (§4, direction 1) where uniformity is the *point* and reads as system, not template. |
| 15 | Type voice: Cabinet Grotesk 700 for
...[truncated 9112 chars]