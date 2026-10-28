# SPEC-0002 performance metrics (AC-21)

Method (identical for both builds, same machine):

- **Total JS:** every `script` response loaded by a first visit to `/` (Playwright Chromium, wait for `networkidle`), each body gzipped at level 9 and summed.
- **Lighthouse:** `lighthouse@12.8.2 --only-categories=performance` (default mobile emulation, simulated throttling), headless Chromium from Playwright 1.64.1, single run, local production server.

| Build | Server | Scripts | JS raw | JS gzip | Lighthouse mobile perf | LCP | TBT |
|---|---|---|---|---|---|---|---|
| Next.js 15 (`main` @ 22f43e4) | `next start` | 8 | 424.2 kB | 120.3 kB | 65 | 3.5 s | 780 ms |

Screenshots: `baseline/` holds the full-page captures at 375/768/1280 and the 375 menu-open state. The full interactive-state set (43 images) comes from `scripts/capture-screenshots.mjs` and is attached to the PR rather than committed.
