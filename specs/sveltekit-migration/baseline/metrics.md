# SPEC-0002 performance metrics (AC-21)

Method (identical for both builds, same machine):

- **Total JS:** every `script` response loaded by a first visit to `/` (Playwright Chromium, wait for `networkidle`), each body gzipped at level 9 and summed.
- **Lighthouse:** `lighthouse@12.8.2 --only-categories=performance` (default mobile emulation, simulated throttling), headless Chromium from Playwright 1.64.1, single run, local production server.

| Build | Server | Scripts | JS raw | JS gzip | Lighthouse mobile perf | LCP | TBT |
|---|---|---|---|---|---|---|---|
| Next.js 15 (`main` @ 22f43e4) | `next start` | 8 | 424.2 kB | 120.3 kB | 65 | 3.5 s | 780 ms |
| SvelteKit 3 static (feaee55) | `vite preview` | 12 | 174.4 kB | 59.7 kB | 90 | 2.9 s | 0 ms |

SvelteKit ships 50% less JS (gzip) and removes main-thread blocking time (AC-21 met).

## Visual parity (AC-10)

`scripts/capture-screenshots.mjs` captured the same 43 states from both builds: full page, the mobile menu, every hero queue item, every path node, both practice outcomes and all FAQ items open, at 375/768/1280. A per-pixel comparison (any channel delta > 16) found:

- **Full page, 3 viewports:** 0.02–0.04% of pixels differ, all anti-aliasing.
- **Hero, path and menu states:** 0.04–0.52% differ.
- **`practice-correct` (9.6–10.5%) and `faq-all-open` (1.9–3.3%):** the only outliers. On inspection, both come from the sticky header sitting at a different scroll offset in the element screenshot, plus a 1 px vertical offset below the first FAQ card. The section content is identical.

`baseline/` and `after/` hold the four full-page and menu-open captures; the full 43-image sets are attached to the PR.
