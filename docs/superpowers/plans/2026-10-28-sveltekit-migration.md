# SvelteKit Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Next.js landing page with a behaviour- and content-identical SvelteKit 3 static site served as Cloudflare static assets with no Worker script.

**Architecture:** `adapter-static` prerenders `/` and `404.html` into `build/`; `wrangler.json` uploads `build/` with no `main`. Four components keep state with Svelte 5 runes; the other ten are static markup. Playwright + axe run against `vite preview` of the built site.

**Tech Stack:** SvelteKit 3.1, Svelte 5, Vite 8, TypeScript `~6.0.3`, Tailwind 3.4 + `tailwindcss-animate`, `@lucide/svelte`, `@fontsource-variable/*`, pnpm 12 (Corepack), ESLint 10 flat + `eslint-plugin-svelte` + `typescript-eslint`, `svelte-check`, Playwright 1.64 + `@axe-core/playwright`, wrangler 4.

**Spec:** [`specs/sveltekit-migration/spec.md`](../../../specs/sveltekit-migration/spec.md) (SPEC-0002, approved, merged in PR #3). This plan executes the approved [`tasks.md`](../../../specs/sveltekit-migration/tasks.md) and [`plan.md`](../../../specs/sveltekit-migration/plan.md); each task below names the `T0xx` IDs it closes. Versions: [`research.md`](../../../specs/sveltekit-migration/research.md) §R2.

## Changes from the approved tasks.md (architect review, 2026-10-28)

1. **`_headers` bug fixed.** Cloudflare merges the values of every matching `_headers` rule, so T041's `/*` rule would add `max-age=0, must-revalidate` to the hashed JS as well. Keep only the `/_app/immutable/*` rule. HTML already gets Cloudflare's default `public, max-age=0, must-revalidate`. T041, research.md §R7 and quickstart are corrected in Task 7.
2. **Next.js is removed in Task 1, not Phase 10.** If both toolchains share one `package.json`, `tsconfig`, Tailwind content glob and `src/` (`src/lib/utils.ts` and `src/lib/index.ts` already sit on Kit's `$lib` path), every intermediate commit fails `svelte-check`. Implementers read the React source with `git show main:<path>`. The single-PR rule (plan.md §9) still keeps `main` whole.
3. **Baseline (Phase 0) is captured from a separate `git worktree` of `main`**, so it doesn't depend on the order of work in this branch. The capture script is reused for the SvelteKit build (T052).
4. **TDD order.** Each port task writes its Playwright assertions first (red against the current build), then ports (green). Playwright is set up in Task 1.
5. **`+page.svelte` grows per task.** Each section task appends its component in SPEC-0001 order so its test can run immediately.

## Global Constraints

- Parity port: no copy, class-string, `id`, link-target or layout change (spec §1, §3.5). React source of truth: `git show main:src/...`.
- Node ≥ 22.17 locally, Node 24 in CI; `"packageManager": "pnpm@12.15.0"`; `"engines": { "node": ">=22.17" }`.
- `typescript` pinned `~6.0.3` (typescript-eslint supports `<6.1.0`).
- Icons only from `@lucide/svelte` (never `lucide-svelte`). No `bits-ui` and no new runtime deps beyond research.md §R2.
- Font CSS variables keep their names: `--font-outfit`, `--font-newsreader`, `--font-jetbrains-mono`.
- Imports use `$lib/...`; `landing.ts` and `landingData.ts` move verbatim (import lines only).
- `prerender = true` in root `+layout.ts`; no server output, no Worker entry.
- Commits: author `Saiteja Chada <saiteja.chada2000@gmail.com>`, Conventional Commits, **no Claude/Co-Authored-By trailer** (owner instruction).
- Every task ends with `pnpm lint && pnpm check && pnpm build && pnpm test:e2e` green.

## Review Focus

1. **Duplicate `{#each}` keys throw in Svelte 5.** React tolerated index keys and duplicates, but Svelte doesn't. Key by an id that is unique within that list, or leave the block unkeyed for static lists. (`q1` appears in both the hero queue and the FAQ, which is fine because they're separate lists.) Pinned by "no console errors on load" in Task 2's smoke test.
2. **Submit with no option selected** must stay disabled (React: `disabled={selectedOption === null}`). Test in Task 5.
3. **Reduced motion must also disable `scroll-smooth`** (`html { scroll-behavior }`), not just keyframe animations. Test in Task 6.
4. **Unknown path returns HTTP 404, not 200.** It must also not be a soft redirect to `/`. Test in Task 6 (preview) and Task 7 (`wrangler dev`).
5. **HTML must never get `immutable`**: `/` responds without `immutable` in `Cache-Control`, and `/_app/immutable/*.js` responds with exactly `public, max-age=31536000, immutable`. Checked in Task 7.

---

### Task 0 (controller, not a subagent): Baseline from `main`: T001, T002

**Files:**
- Create: `scripts/capture-screenshots.mjs`, `specs/sveltekit-migration/baseline/*.png`, `specs/sveltekit-migration/baseline/metrics.md`

**Interfaces:**
- Produces: `node scripts/capture-screenshots.mjs <baseUrl> <outDir>` writes `<viewport>-<state>.png` for viewports 375/768/1280 and states `full`, `menu-open` (375 only), `hero-q1..qN`, `path-n1..nN`, `practice-correct`, `practice-incorrect`, `faq-all-open`.

- [ ] Step 1: `git worktree add ../baseline-main main`, then `npm ci && npx next build && npx next start -p 3100` there (background).
- [ ] Step 2: Run the script (uses `chromium` from `@playwright/test`, which Task 1 installs; until then run it with `npx -p @playwright/test@1.64.1`) against `http://localhost:3100` into `specs/sveltekit-migration/baseline/`.
- [ ] Step 3: Lighthouse mobile (chrome-devtools `lighthouse_audit`) and total JS gzip (sum of `_next/static/**/*.js` transfer sizes) go into `metrics.md` with method.
- [ ] Step 4: Commit `chore(spec-0002): capture Next.js baseline`. Remove the worktree.

### Task 1: Scaffold, toolchain, Next.js removal: T003–T007, T011, T033, T045, T046

**Files:**
- Delete: `src/app/`, `src/components/`, `src/content/`, `src/types/`, `src/lib/index.ts`, `next.config.ts`, `next-env.d.ts`, `open-next.config.ts`, `package-lock.json` (`.github/workflows/deploy-cloudflare.yml` stays until Task 7; the branch is not pushed before then)
- Create: `svelte.config.js`, `vite.config.ts`, `src/app.html` (`lang="en"`, `class="scroll-smooth"` on `<html>`), `src/app.d.ts`, `src/routes/+layout.ts`, `src/routes/+page.svelte` (placeholder `<h1>`), `eslint.config.js`, `playwright.config.ts`, `e2e/smoke.spec.ts`, `pnpm-lock.yaml`
- Modify: `package.json` (scripts `dev`, `build`, `preview`, `lint`, `check`, `test:e2e`; deps per R2), `tsconfig.json` (extends `./.svelte-kit/tsconfig.json`), `.gitignore` (+`.svelte-kit/`, `test-results/`, `playwright-report/`; −`.next/`, `.open-next/`)
- Keep: `src/lib/utils.ts` (`cn()`, unchanged, now on `$lib`)

**Interfaces:**
- Produces: `pnpm build` → `build/index.html`; `pnpm test:e2e` runs projects `desktop-chromium` (1280×800) and `mobile-chromium` (375×812) against `pnpm build && pnpm preview` on port 4173; `cn(...inputs: ClassValue[]): string` from `$lib/utils`.

- [ ] Step 1: Read SvelteKit 3 migration notes; append "v3 changes affecting us" (or "none") to research.md §R4.
- [ ] Step 2: `npx sv@latest create <tmp> --template minimal --types ts --no-install` and `sv add eslint playwright` there; copy config into repo. Swap adapter to `@sveltejs/adapter-static`. Add `export const prerender = true;` to `+layout.ts`.
- [ ] Step 3: Delete Next files and deps (AC-12 list). `corepack enable`, set `packageManager`/`engines`, `pnpm install`.
- [ ] Step 4: Write `e2e/smoke.spec.ts`: `test('home responds 200 with no console errors')` collects `console` errors and `pageerror`, `expect(response.status()).toBe(200)`, `expect(errors).toEqual([])`.
- [ ] Step 5: ESLint flat config with the ADR 0005 `no-restricted-imports` rule verbatim from tasks.md T006. Prove it: create `src/modules/x/internal.ts` + a deep import, `pnpm lint` fails, delete both.
- [ ] Step 6: Run `pnpm lint && pnpm check && pnpm build && pnpm test:e2e`. Expect all green, `build/index.html` present, and no `.open-next/`.
- [ ] Step 7: Commit `feat(svelte): scaffold SvelteKit static toolchain and remove Next.js`.

### Task 2: Design system, content, layout shell: T008–T010, T012–T016

**Files:**
- Create: `tailwind.config.ts` (from `main`, `content: ['./src/**/*.{html,js,svelte,ts}']` only change), `postcss.config.js`, `src/app.css` (from `main:src/app/globals.css` verbatim + `:root` font vars), `src/routes/+layout.svelte`, `src/lib/types/landing.ts`, `src/lib/content/landingData.ts`, `src/lib/components/layout/{HeaderNav,EditorialFooter}.svelte`, `src/lib/components/layout/index.ts`, `e2e/landing.spec.ts`

**Interfaces:**
- Consumes: `cn` from `$lib/utils`.
- Produces: `LANDING_DATA: LandingDataContract` from `$lib/content/landingData`; `import { HeaderNav, EditorialFooter } from '$lib/components/layout'`; `+layout.svelte` renders `{@render children()}` inside `<main class="relative z-10 flex flex-col">`; `e2e/landing.spec.ts` exists for later tasks to extend.

- [ ] Step 1: Failing tests in `e2e/landing.spec.ts`:
  - `head metadata matches SPEC-0001` (AC-9): `title` = `OpenLearn — Turn Online Content Into Learning You Can Finish`; `meta[name=description]`, `keywords` (7 values from `main:src/app/layout.tsx`, comma-joined), `author` = `OpenLearn Community`, `og:title/description/type=website/locale=en_US/site_name=OpenLearn`, `twitter:card=summary_large_image/title/description`. Assert via `request.get('/')` HTML (no JS).
  - `mobile menu toggles and closes on link click` (AC-7, mobile project only): toggle has `aria-expanded="false"` and `aria-controls="mobile-menu"`; click → `true`, `#mobile-menu` shows each nav link label; click a link → menu hidden, `aria-expanded="false"`.
- [ ] Step 2: `pnpm test:e2e`. Both fail.
- [ ] Step 3: Port config/CSS/fonts (`@fontsource-variable/outfit`, `newsreader` incl. italic file, `jetbrains-mono`), move types/content (`git mv` is impossible across the deletion; copy from `main` and change only `@/types` imports), port the layout and both components. `let mobileMenuOpen = $state(false)`.
- [ ] Step 4: Verify the computed `font-family` of `.font-serif.italic` resolves to Newsreader italic. Use `getComputedStyle` in a test or by hand, and record which you did in the report.
- [ ] Step 5: Tests green, then commit `feat(svelte): port design system, content and layout shell`.

### Task 3: Static sections A: T017–T021

**Files:** Create `src/lib/components/landing/{ProblemAudit,SolutionPipeline,HowItWorks,DistractionFree,ProgressHud}.svelte`, `src/lib/components/landing/index.ts` (re-export as added); modify `src/routes/+page.svelte`, `e2e/landing.spec.ts`.

**Interfaces:** Produces `export { default as X } from './X.svelte'` lines in `landing/index.ts`; `+page.svelte` imports from `$lib/components/landing`.

- [ ] Step 1: Failing test `sections render in SPEC-0001 order`. Only six sections have ids on `main`: `hero` (index 0), `problem` (1), `how-it-works` (3), `curriculum` (5, PathVisualizer), `practice` (6), `faq` (10). The test keeps a 12-entry `SECTIONS` array of `{ index, id? , heading }`, where `heading` is each section's `h2` text read from `LANDING_DATA`/source. It asserts that `main > section` has the expected count and that each entry's `id`/heading sits at its index. Each task adds its own entries, and the count assertion uses `SECTIONS.length`. Don't add ids the React source lacks (parity).
- [ ] Step 2: Red. Step 3: port (R5 mapping; class strings byte-identical; icon names map 1:1 to `@lucide/svelte`). Hero/Path/Practice aren't ported yet, so their slots in `+page.svelte` stay empty and are filled in Task 5.
- [ ] Step 4: Green and smoke test passes (no console errors). Commit `feat(svelte): port static landing sections (A)`.

### Task 4: Static sections B + FAQ: T022–T024

**Files:** Create `{FaqSection,OpenCurriculum,AudienceSection,BottomCta}.svelte`; modify `landing/index.ts`, `+page.svelte`, `e2e/landing.spec.ts`.

- [ ] Step 1: Failing tests: add four entries to `SECTIONS`; `faq first open, others toggle independently` (AC-6): first `details` has `open`, the rest don't; open item 3, and items 1 and 3 are both open; close item 1, and item 3 stays open.
- [ ] Step 2: Red. Step 3: port; FAQ stays native `<details>` with `open={idx === 0}` and `group-open:rotate-45`.
- [ ] Step 4: Green. Commit `feat(svelte): port static landing sections (B)`.

### Task 5: Interactive sections: T025–T027

**Files:** Create `{HeroSection,PathVisualizer,PracticeDemo}.svelte`; modify `landing/index.ts`, `+page.svelte`, `e2e/landing.spec.ts`.

**Interfaces:** State per spec §2.2: `activeQueueId = $state('q3')`, `selectedNodeId = $state('n3')`, `selectedOption = $state<number | null>(null)`, `submitted = $state(false)`.

- [ ] Step 1: Failing tests (values read from `LANDING_DATA`, not hard-coded copy):
  - `hero: q3 active by default, clicking switches concept` (AC-3): queue button for q3 has `aria-pressed="true"`; the player shows q3's concept text; click each other item and the player shows its text and the button flips `aria-pressed`.
  - `path: n3 default, node click updates drawer` (AC-4): for each node, click, then the drawer shows its creator, duration and summary.
  - `practice: submit disabled until selection; correct/incorrect; reset` (AC-5 + Review Focus 2): Submit `toBeDisabled()`; pick the correct index, submit, and the `[aria-live="polite"]` region contains the correct-state text and explanation; reset clears it and Submit is disabled again; repeat with a wrong index for the incorrect state.
  - Add the three entries to `SECTIONS`; the order test now covers all 12 (AC-2). Until this task, sections are appended in relative order, so indices are asserted only once all 12 exist; earlier tasks assert relative order.
- [ ] Step 2: Red. Step 3: port with `<button aria-pressed>` on queue items and nodes; keep `animate-in fade-in`.
- [ ] Step 4: Green. Commit `feat(svelte): port interactive landing sections`.

### Task 6: 404, reduced motion, prerender/keyboard/a11y tests: T030, T032, T034 (remaining), T035

**Files:** Create `src/routes/+error.svelte`, `e2e/a11y.spec.ts`; modify `src/app.css`, `e2e/landing.spec.ts`; the R4 fallback (`src/routes/404/+page.svelte` + postbuild copy) applies only if `build/404.html` is missing.

- [ ] Step 1: Failing tests:
  - `prerendered HTML contains copy` (AC-8): `request.get('/')` body contains `LANDING_DATA` hero headline and every FAQ question.
  - `unknown path is a styled 404` (AC-11 + Review Focus 4): `page.goto('/does-not-exist')` gives status `404`, a link to `/`, and the site header visible.
  - `keyboard reaches and operates controls` (AC-19): Tab to the first hero queue button and press Enter to flip `aria-pressed`; Tab to a path node and press Space to update the drawer; Tab to a practice option, Enter, then Submit, Enter, to show feedback; on mobile, Tab to the menu toggle and press Enter to get `aria-expanded="true"`.
  - `reduced motion disables animation and smooth scroll` (AC-20 + Review Focus 3): `page.emulateMedia({ reducedMotion: 'reduce' })`; every element matching `.animate-sensorBlink, .animate-soundChipPulse, .animate-badgePop, .animate-pulse, .animate-in` has computed `animation-name: none`; `html` has `scroll-behavior: auto`.
  - `a11y.spec.ts` (AC-18): `AxeBuilder` on `/` per project, plus mobile with the menu open; no violations with impact `serious` or `critical`.
- [ ] Step 2: Red. Step 3: `+error.svelte` in site style; `@media (prefers-reduced-motion: reduce)` block in `app.css`; fix any axe findings without visual change.
- [ ] Step 4: Green and `build/404.html` exists. Commit `feat(svelte): add 404, reduced motion and a11y coverage`.

### Task 7: Delivery and CI: T040–T043, T053 (local)

**Files:** Modify `wrangler.json` (exact JSON from research.md §R7; `$schema` kept; no `main`, no `compatibility_flags`), `package.json` (`"deploy": "pnpm build && wrangler deploy"`); create `static/_headers`, `.github/workflows/ci.yml`; delete `.github/workflows/deploy-cloudflare.yml`; fix `_headers` text in `specs/sveltekit-migration/{research.md §R7, tasks.md T041, quickstart.md}`.

`static/_headers` (whole file):
```txt
/_app/immutable/*
  Cache-Control: public, max-age=31536000, immutable
```

- [ ] Step 1: `pnpm build && pnpm exec wrangler deploy --dry-run`. The output shows an assets upload and no Worker script (AC-15).
- [ ] Step 2: `pnpm exec wrangler dev` with `curl -sI`. `/` returns no `immutable`, `/_app/immutable/<file>.js` returns exactly the line above, and `/does-not-exist` returns 404 (AC-16, Review Focus 4–5). Paste the output into the task report.
- [ ] Step 3: `ci.yml` per tasks.md T042. The `verify` job runs on PR and push, using Node 24, `pnpm/action-setup` (version from `packageManager`), `actions/setup-node` with `cache: pnpm`, then install, lint, check, build, `pnpm exec playwright install --with-deps chromium`, and `test:e2e`, uploading `playwright-report` on failure. The `deploy` job needs `verify`, runs only on `main` push or `workflow_dispatch`, runs `wrangler deploy` when `CLOUDFLARE_API_TOKEN` is set, and otherwise emits the existing warning text.
- [ ] Step 4: Commit `chore(ci): assets-only Cloudflare delivery and SvelteKit CI`.

### Task 8: Docs: T049–T051

**Files:** Create `docs/DEPLOYMENT.md` (replaces `docs/CLOUDFLARE_SSR_DEPLOYMENT.md`, which is deleted; fix inbound links via grep); modify `CONTRIBUTING.md`, `README.md` (setup `corepack enable && pnpm install && pnpm dev`, scripts table, `pnpm run deploy` note, Node ≥ 22.17), `specs/README.md` (SPEC-0002 listed), `specs/landing-page/spec.md` §6 note "superseded by SPEC-0002 §2.3".

- [ ] Step 1: `grep -rn "CLOUDFLARE_SSR_DEPLOYMENT\|npm run\|npm install\|next dev" --include=*.md .` returns only historical/spec mentions.
- [ ] Step 2: Commit `docs: static deployment guide and pnpm dev setup`.

### Task 9 (controller): Verification: T047, T052, T054, T055

- [ ] Fresh clone of the branch → `corepack enable && pnpm install && pnpm lint && pnpm check && pnpm build && pnpm test:e2e`. `git grep -nE "from ['\"](react|next)" -- src` returns nothing.
- [ ] `capture-screenshots.mjs` against `pnpm preview` → `specs/sveltekit-migration/after/`; compare to `baseline/` side by side; fix visible differences.
- [ ] Lighthouse + JS gzip for the Svelte build into `metrics.md`.
- [ ] Gate B of `checklists/requirements.md`; tick spec ACs with evidence; status `Implemented` only if every AC is met (AC-16 live check and AC-17 CI run depend on PR/secrets; note them as pending if so).
- [ ] Final whole-branch code review subagent.
