# TASKS: SVELTEKIT FRONTEND MIGRATION

**Specification:** [SPEC-0002](./spec.md) · **Plan:** [plan.md](./plan.md) · **Research:** [research.md](./research.md)
**Status:** Draft · **Date:** 2026-10-28

## How to read this file

- **`[P]`** — can run in parallel with other `[P]` tasks in the same phase (different files, no shared dependency).
- **Depends** — task IDs that must be done first.
- **Done when** — the objective check that closes the task. A task is not done until its check passes.
- **AC** — acceptance criteria in the spec this task contributes to.
- IDs leave gaps between phases so tasks can be inserted without renumbering.
- Commit at the end of each phase with a Conventional Commit message (`feat(svelte): …`, `chore(ci): …`, `docs(…): …`).

**Gate:** Phases 0–1 may start now. Merging to `main` waits for maintainer approval of removing the OpenNext deployment (spec OQ-3).

---

## Phase 0 — Baseline (on `main`, Next.js build)

- [ ] **T001** Capture full-page screenshots of the current site at 375, 768 and 1280 px (Chromium), including mobile menu open, Hero with each queue item selected, PathVisualizer with each node, PracticeDemo correct/incorrect states, FAQ open/closed.
  - Files: `specs/sveltekit-migration/baseline/*.png`
  - Done when: screenshots committed, named `<viewport>-<state>.png`.
  - AC: 10
- [ ] **T002** `[P]` Record Lighthouse mobile performance score and total JS transferred (gzip) for `/` from `next build && next start`.
  - Files: `specs/sveltekit-migration/baseline/metrics.md`
  - Done when: numbers and method recorded.
  - AC: 21

## Phase 1 — Scaffold and toolchain

- [ ] **T003** Read the SvelteKit 3 migration guide and release notes; list any v3 breaking change that affects config, routing, prerendering or `adapter-static` in `research.md` §R4.
  - Depends: —
  - Done when: findings (or "none affecting us") appended to research.md.
- [ ] **T004** Switch to pnpm: `corepack enable`; add `"packageManager": "pnpm@12.15.0"` and `"engines": { "node": ">=22.17" }` to `package.json`; delete `package-lock.json`; generate `pnpm-lock.yaml`.
  - Depends: —
  - Done when: `pnpm install` succeeds from a clean checkout.
  - AC: 13
- [ ] **T005** Scaffold with `npx sv create` (TypeScript, ESLint, Playwright; no demo, no Prettier unless already wanted) in a temp folder; copy `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `src/app.html`, `src/app.d.ts`, `src/routes/` into the repo. Install versions per research.md R2; pin `typescript: ~6.0.3`. Replace the default adapter with `@sveltejs/adapter-static`. Add `src/routes/+layout.ts` with `export const prerender = true`.
  - Depends: T003, T004
  - Done when: `pnpm build` writes a valid `build/index.html`; no server output.
  - AC: 1
- [ ] **T006** Configure ESLint flat config: `eslint-plugin-svelte` recommended, `typescript-eslint` recommended, and ADR 0005's rule:
  ```js
  'no-restricted-imports': ['error', { patterns: [{
    group: ['**/modules/*/*', '!**/modules/*/index', '!**/modules/*/index.*'],
    message: 'Import from the module index, not its internals.' }] }]
  ```
  ADR 0005's `!(index)` never matches: `group` uses gitignore syntax, which has no extglob, so the rule is written with negations instead.
  Add `"lint": "eslint ."`.
  - Depends: T005
  - Done when: `pnpm lint` passes; a throwaway deep import into `src/modules/x/y.ts` fails (then delete it).
  - AC: 14
- [ ] **T007** `[P]` Add `"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"`.
  - Depends: T005
  - Done when: `pnpm check` reports 0 errors, 0 warnings.
  - AC: 14

## Phase 2 — Design system

- [ ] **T008** Port `tailwind.config.ts`: change `content` to `['./src/**/*.{html,js,svelte,ts}']`; keep every token, keyframe, animation and `tailwindcss-animate` plugin unchanged. Add `postcss.config.js` (tailwindcss, autoprefixer).
  - Depends: T005
  - Done when: a test element using `bg-page text-accent shadow-taste-md rounded-lg` renders with the expected computed styles.
- [ ] **T009** `[P]` Move `src/app/globals.css` → `src/app.css` verbatim (Tailwind directives, `:root` variables, `.taste-bg-mesh`, `.btn*`, `.badge-bracket`). Import it from `+layout.svelte`.
  - Depends: T005
  - Done when: `.btn-primary` and `.taste-bg-mesh` render on a test page.
- [ ] **T010** `[P]` Install `@fontsource-variable/outfit`, `/newsreader` (including the italic axis file), `/jetbrains-mono`; import in `+layout.svelte`; define `--font-outfit`, `--font-newsreader`, `--font-jetbrains-mono` on `:root` in `app.css` so Tailwind's `font-sans/heading/serif/mono` resolve unchanged.
  - Depends: T009
  - Done when: computed `font-family` for `font-serif italic` is Newsreader italic (not synthesized), checked in DevTools.
- [ ] **T011** `[P]` Port `cn()` to `src/lib/utils.ts` (`clsx` + `tailwind-merge`).
  - Depends: T005
  - Done when: imported from `$lib/utils` without errors.

## Phase 3 — Content and types

- [ ] **T012** Move `src/types/landing.ts` → `src/lib/types/landing.ts` and `src/content/landingData.ts` → `src/lib/content/landingData.ts` **verbatim**; change `@/types` → `$lib/types/landing`.
  - Depends: T005
  - Done when: `pnpm check` passes; `git diff --stat -M` shows the files as renames with only import-line changes.

## Phase 4 — Layout shell

- [ ] **T013** `+layout.svelte`: background mesh (`aria-hidden`), `<HeaderNav/>`, `<main class="relative z-10 flex flex-col">{@render children()}</main>`, `<EditorialFooter/>`, body classes from `layout.tsx`. `<svelte:head>`: title, description, keywords, author, Open Graph (title, description, type, locale, site name), Twitter (card, title, description) with values identical to `layout.tsx`. `lang="en"` and `scroll-smooth` on `<html>` via `app.html`.
  - Depends: T008–T011
  - Done when: `build/index.html` `<head>` contains every tag with identical values.
  - AC: 9
- [ ] **T014** `HeaderNav.svelte`: port markup; `let mobileMenuOpen = $state(false)`; toggle button gets `aria-expanded={mobileMenuOpen}` and `aria-controls="mobile-menu"`; menu closes on link click; keep `animate-in fade-in slide-in-from-top-2`.
  - Depends: T013
  - Done when: at 375 px the menu opens, shows links, and closes on link click.
  - AC: 7, 19
- [ ] **T015** `[P]` `EditorialFooter.svelte`: port markup and links unchanged (including the current GitHub href; fixing it is a follow-up).
  - Depends: T013
  - Done when: footer renders identically to baseline.
- [ ] **T016** `[P]` `src/lib/components/layout/index.ts` re-exporting both components.
  - Depends: T014, T015

## Phase 5 — Static sections (all `[P]`)

Each: port markup per research.md R5, replace `lucide-react` icons with `@lucide/svelte`, read data from `LANDING_DATA`, keep `id` attributes and class strings identical.

- [ ] **T017** `[P]` `ProblemAudit.svelte` — Depends: T012 — AC: 2
- [ ] **T018** `[P]` `SolutionPipeline.svelte` — Depends: T012 — AC: 2
- [ ] **T019** `[P]` `HowItWorks.svelte` — Depends: T012 — AC: 2
- [ ] **T020** `[P]` `DistractionFree.svelte` — Depends: T012 — AC: 2
- [ ] **T021** `[P]` `ProgressHud.svelte` — Depends: T012 — AC: 2
- [ ] **T022** `[P]` `FaqSection.svelte` — native `<details>`, `open={idx === 0}`, `group-open:rotate-45` preserved — Depends: T012 — AC: 2, 6
- [ ] **T023** `[P]` `OpenCurriculum.svelte` — Depends: T012 — AC: 2
- [ ] **T024** `[P]` `AudienceSection.svelte` and `BottomCta.svelte` — Depends: T012 — AC: 2

Done when (each): renders without console errors; side-by-side with the matching baseline screenshot shows no visible difference.

## Phase 6 — Interactive sections

- [ ] **T025** `HeroSection.svelte`: `let activeQueueId = $state('q3')`; `const activeItem = $derived(queue.find(q => q.id === activeQueueId) ?? queue[2])`; queue items are `<button>`s with `aria-pressed`.
  - Depends: T012
  - Done when: clicking each queue item updates the mock player's "Active Concept" text.
  - AC: 3, 19
- [ ] **T026** `[P]` `PathVisualizer.svelte`: `let selectedNodeId = $state('n3')`; derived selected node drives the drawer; nodes are `<button>`s with `aria-pressed`.
  - Depends: T012
  - Done when: clicking each node updates creator, duration and summary in the drawer.
  - AC: 4, 19
- [ ] **T027** `[P]` `PracticeDemo.svelte`: `selectedOption = $state<number | null>(null)`, `submitted = $state(false)`, `handleSelect`, `handleReset`; feedback region `aria-live="polite"`; keep `animate-in fade-in`.
  - Depends: T012
  - Done when: select → submit shows correct/incorrect + explanation; reset clears both.
  - AC: 5, 19
- [ ] **T028** `src/lib/components/landing/index.ts` re-exporting all 12 sections.
  - Depends: T017–T027

## Phase 7 — Page assembly, 404, motion

- [ ] **T030** `+error.svelte` styled 404 with a link home; confirm `build/404.html` exists after build. If not, apply research.md R4 fallback.
  - Depends: T013
  - Done when: `build/404.html` present; `vite preview` of `/does-not-exist` shows it with status 404 under `wrangler dev`.
  - AC: 11
- [ ] **T031** `+page.svelte`: 12 sections in SPEC-0001 order.
  - Depends: T028
  - Done when: section `id`s appear in order in `build/index.html`.
  - AC: 2, 8
- [ ] **T032** `[P]` Reduced motion: in `app.css`, under `@media (prefers-reduced-motion: reduce)`, disable `animate-sensorBlink`, `animate-soundChipPulse`, `animate-badgePop`, `animate-pulse`, `animate-in` and transitions on decorative elements.
  - Depends: T009
  - Done when: with emulated reduced motion, computed `animation-name` is `none` on those elements.
  - AC: 20

## Phase 8 — Tests

- [ ] **T033** `playwright.config.ts`: `webServer` = `pnpm build && pnpm preview`; projects `desktop-chromium` (1280×800) and `mobile-chromium` (375×812); retries 1 in CI.
  - Depends: T005
  - Done when: `pnpm test:e2e` runs an empty suite green.
- [ ] **T034** `e2e/landing.spec.ts`:
  - section order and ids (AC-2)
  - Hero default `q3` + switching (AC-3)
  - PathVisualizer default `n3` + drawer updates (AC-4)
  - PracticeDemo select/submit/reset + `aria-live` (AC-5)
  - FAQ first open, independent toggles (AC-6)
  - mobile menu toggle, `aria-expanded`, closes on link click (AC-7)
  - prerendered HTML via `request.get('/')` contains hero headline and every FAQ question (AC-8)
  - head tags equal SPEC-0001 values (AC-9)
  - unknown route → 404 page (AC-11)
  - keyboard: Tab reaches each control; Enter/Space activates (AC-19)
  - reduced motion emulation disables animations (AC-20)
  - Depends: T030–T033
  - Done when: all pass on both projects.
- [ ] **T035** `[P]` `e2e/a11y.spec.ts`: axe on `/` (desktop and mobile, menu open and closed); fail on `serious`/`critical`.
  - Depends: T033
  - Done when: zero serious/critical violations, or each is fixed.
  - AC: 18

## Phase 9 — Delivery and CI

- [ ] **T040** Replace `wrangler.json` with the assets-only config from research.md §R7 (`directory: ./build`, `not_found_handling: 404-page`, `html_handling: auto-trailing-slash`, no `main`). Remove `cf-typegen`, `build:worker`, `preview`/`deploy` OpenNext scripts; add `"deploy": "pnpm build && wrangler deploy"`.
  - Depends: T005
  - Done when: `wrangler deploy --dry-run` reports an assets-only upload with no Worker script.
  - AC: 1, 15
- [ ] **T041** `[P]` `static/_headers`:
  ```txt
  /_app/immutable/*
    Cache-Control: public, max-age=31536000, immutable
  ```
  No `/*` rule: Cloudflare merges values of all matching rules, so it would add `max-age=0, must-revalidate` to hashed assets too. HTML gets Cloudflare's default `public, max-age=0, must-revalidate`.
  - Depends: T005
  - Done when: `build/_headers` present; `wrangler dev` responses show the expected headers.
  - AC: 16
- [ ] **T042** `.github/workflows/ci.yml`: triggers on PR and push to `main`; Node 24; `pnpm/action-setup` + cache; jobs `verify` (install → lint → check → build → `playwright install --with-deps chromium` → e2e, upload report on failure) and `deploy` (needs verify; `main` only; `wrangler deploy`; skipped with a warning when `CLOUDFLARE_API_TOKEN` is empty).
  - Depends: T006, T007, T034, T040
  - Done when: workflow green on the PR.
  - AC: 17
- [ ] **T043** Delete `.github/workflows/deploy-cloudflare.yml`.
  - Depends: T042

## Phase 10 — Remove Next.js

- [ ] **T045** Delete `src/app/`, `src/components/`, `src/content/`, `src/types/`, old `src/lib/index.ts`, `next.config.ts`, `next-env.d.ts`, `open-next.config.ts`, `tsconfig.tsbuildinfo`.
  - Depends: T031
- [ ] **T046** Remove dependencies: `next`, `react`, `react-dom`, `@types/react`, `@types/react-dom`, `@radix-ui/*`, `motion`, `lucide-react`, `class-variance-authority`, `@opennextjs/cloudflare`. Update `.gitignore` (`.svelte-kit/`, `build/`, `.wrangler/`, `test-results/`, `playwright-report/`; drop `.next/`, `.open-next/`).
  - Depends: T045
- [ ] **T047** Verify: fresh clone → `pnpm install && pnpm lint && pnpm check && pnpm build && pnpm test:e2e` all pass; `grep -r "react\|next" src` returns nothing relevant.
  - Depends: T046
  - AC: 12

## Phase 11 — Docs and verification

- [ ] **T049** Replace `docs/CLOUDFLARE_SSR_DEPLOYMENT.md` with `docs/DEPLOYMENT.md`: assets-only model, `_headers`, secrets, CI flow, manual deploy, rollback.
  - Depends: T042
  - AC: 22
- [ ] **T050** `[P]` CONTRIBUTING and README: dev setup `corepack enable && pnpm install && pnpm dev`; scripts table (`dev`, `build`, `preview`, `lint`, `check`, `test:e2e`, `deploy` — run as `pnpm run deploy`, since `pnpm deploy` is a built-in command); Node ≥ 22.17.
  - AC: 22
- [ ] **T051** `[P]` `specs/README.md` status → `Implemented` (after T055); add a note under SPEC-0001 §6 that its directory architecture is superseded by SPEC-0002 §2.3.
  - AC: 23
- [ ] **T052** Visual parity review: capture the same screenshot set as T001 from the SvelteKit build; compare side by side; attach both sets to the PR; fix any visible difference.
  - Depends: T047, T001
  - AC: 10
- [ ] **T053** `[P]` Verify headers on the deployed site (or `wrangler dev` if secrets are absent): immutable on `/_app/immutable/*`, revalidate on `/`.
  - Depends: T041
  - AC: 16
- [ ] **T054** `[P]` Record Lighthouse mobile score and total JS gzip for the SvelteKit build next to T002's numbers in `baseline/metrics.md` and the PR description.
  - Depends: T047, T002
  - AC: 21
- [ ] **T055** Run [checklists/requirements.md](./checklists/requirements.md); tick every AC in the spec with evidence links; set SPEC-0002 status to `Implemented`.
  - Depends: all above

---

## Dependency overview

```text
P0 (T001–T002) ─────────────────────────────────────────────┐
P1 T003,T004 → T005 → T006,T007                              │
P2 T005 → T008,T009 → T010; T011                             │
P3 T005 → T012                                               │
P4 T008–T011 → T013 → T014,T015 → T016                       │
P5 T012 → T017…T024   (parallel)                             │
P6 T012 → T025,T026,T027 → T028                              │
P7 T013 → T030; T028 → T031; T009 → T032                     │
P8 T005 → T033 → T034,T035                                   │
P9 T005 → T040,T041; T006,T007,T034,T040 → T042 → T043       │
P10 T031 → T045 → T046 → T047                                │
P11 T047 + P0 → T052,T054; T041 → T053; all → T055 ◄─────────┘
```

**Estimated size:** ~45 tasks; Phases 5–6 are the bulk (~1,900 lines of markup), largely mechanical.
