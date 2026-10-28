# IMPLEMENTATION PLAN: SVELTEKIT FRONTEND MIGRATION

**Specification:** [SPEC-0002](./spec.md) · **Research:** [research.md](./research.md) · **Tasks:** [tasks.md](./tasks.md)
**Status:** Draft · **Date:** 2026-10-28
**Branch:** `spec/sveltekit-migration` (docs) → implementation on `feat/sveltekit-migration`

---

## 1. Summary

Replace the Next.js 15 landing page with a SvelteKit 3 static site of identical content and behaviour, delivered as Cloudflare Workers static assets with no Worker script, and stand up the frontend toolchain (pnpm, ESLint with module boundaries, `svelte-check`, Playwright + axe, CI) that every later feature builds on.

## 2. Technical context

| Item | Value |
|---|---|
| Language | TypeScript 6.0 (pinned `~6.0`, R2) |
| Framework | SvelteKit 3.1 + Svelte 5 (runes) |
| Build | Vite 8, `@sveltejs/adapter-static` 4 → `build/` |
| Styling | Tailwind CSS 3.4 + PostCSS + `tailwindcss-animate` |
| Icons / fonts | `@lucide/svelte`; `@fontsource-variable/{outfit,newsreader,jetbrains-mono}` |
| Package manager | pnpm 12 via Corepack |
| Runtime | Node 24 LTS in CI; ≥ 22.17 locally |
| Tests | Playwright 1.64 + `@axe-core/playwright` |
| Lint / types | ESLint 10 flat config + `eslint-plugin-svelte` + `typescript-eslint`; `svelte-check` |
| Hosting | Cloudflare Workers static assets, assets-only, `wrangler` 4 |
| Storage / backend | None in this spec |
| Performance goal | Total JS (gzip) lower than the Next.js build; Lighthouse mobile recorded (AC-21) |
| Constraints | $0; zero Worker invocations; no visual or copy change |

## 3. ADR compliance gate

Checked before implementation and again at PR review.

| ADR | Requirement | How this plan complies |
|---|---|---|
| 0001 | No request-time rendering; static assets are free and unlimited | `adapter-static`, `prerender = true`, `wrangler.json` without `main` |
| 0001b | SvelteKit + TypeScript + Tailwind | SvelteKit 3, TS 6.0, Tailwind 3. Adapter deviation (`adapter-static` vs `adapter-cloudflare`) recorded in research.md §R7 and spec OQ-4 |
| 0005 | Module boundaries enforced by lint | `no-restricted-imports` rule configured now; `src/modules/` arrives with first module |
| 0006 | YouTube thumbnails hotlinked, no image proxying | No image optimiser; existing `<img>` usage unchanged |
| ARCHITECTURE §17 | Accessibility acceptance criteria | AC-18–20; axe in CI |
| ARCHITECTURE §21.3 | Tests land with the code they cover | Playwright + axe for the landing page; Vitest/pgTAP deferred to first module/table |

**Gate status:** merge needs maintainer approval because the OpenNext deployment is removed (spec OQ-3). Phases 0–1 (baseline, scaffold in a branch) may proceed; merging to `main` may not.

## 4. Target project structure

```text
.
├── .github/workflows/ci.yml          # replaces deploy-cloudflare.yml
├── docs/DEPLOYMENT.md                # replaces CLOUDFLARE_SSR_DEPLOYMENT.md
├── e2e/
│   ├── landing.spec.ts               # AC-2–9, 11, 19, 20
│   └── a11y.spec.ts                  # AC-18
├── src/
│   ├── app.html
│   ├── app.css                       # from globals.css
│   ├── app.d.ts
│   ├── routes/
│   │   ├── +layout.svelte            # fonts, mesh, header/footer, <svelte:head>
│   │   ├── +layout.ts                # prerender = true
│   │   ├── +page.svelte              # 12 sections
│   │   └── +error.svelte             # 404
│   └── lib/
│       ├── components/
│       │   ├── landing/*.svelte + index.ts
│       │   └── layout/*.svelte + index.ts
│       ├── content/landingData.ts
│       ├── types/landing.ts
│       └── utils.ts
├── static/
│   ├── _headers
│   └── favicon.svg                   # if one exists today; otherwise none
├── eslint.config.js
├── playwright.config.ts
├── postcss.config.js
├── svelte.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── wrangler.json                     # assets-only
├── package.json                      # packageManager: pnpm@12.x, engines.node >=22.17
└── pnpm-lock.yaml
```

Removed: `src/app/**`, `src/components/**`, `src/content/**`, `src/types/**`, `src/lib/index.ts` (React-era barrels), `next.config.ts`, `next-env.d.ts`, `open-next.config.ts`, `package-lock.json`, `tsconfig.tsbuildinfo`, `.next/`, `.open-next/`.

## 5. Phases

Each phase ends in a commit that builds. Phase numbers map to task IDs in [tasks.md](./tasks.md).

### Phase 0 — Baseline (before touching anything)
Capture the Next.js build's evidence so parity can be judged: screenshots at 375/768/1280 px, Lighthouse mobile score, total JS gzip. Stored under `specs/sveltekit-migration/baseline/` (screenshots) and in the PR description (numbers).

### Phase 1 — Scaffold
Read the SvelteKit 3 migration notes. Scaffold with `npx sv create` (TypeScript, ESLint, Playwright, no demo) into a temp directory, then move config files into the repo root alongside the existing code. Switch to pnpm. Pin TypeScript `~6.0`. Install `adapter-static`; set `prerender = true`. Build must produce an empty-but-valid site.

### Phase 2 — Design system
Port `tailwind.config.ts` (globs only change), `postcss.config`, `globals.css` → `app.css`, fonts via `@fontsource-variable/*` keeping the three CSS variable names, `cn()`. Verify one token-heavy element renders identically.

### Phase 3 — Content and types
Move `landing.ts` and `landingData.ts` verbatim into `src/lib/`; rewrite imports to `$lib`. `svelte-check` clean.

### Phase 4 — Layout shell
`+layout.svelte` (mesh, header, main, footer), `<svelte:head>` metadata, `HeaderNav` (with menu state + `aria-expanded`), `EditorialFooter`.

### Phase 5 — Static sections (parallelisable)
ProblemAudit, SolutionPipeline, HowItWorks, DistractionFree, ProgressHud, OpenCurriculum, AudienceSection, FaqSection, BottomCta. Pure markup ports using R5's mapping.

### Phase 6 — Interactive sections
HeroSection (`activeQueueId`), PathVisualizer (`selectedNodeId`), PracticeDemo (`selectedOption`, `submitted`, reset, `aria-live`). Add `aria-pressed` on selectable items (spec §5).

### Phase 7 — Page assembly, 404, reduced motion
`+page.svelte` in SPEC-0001 order; `+error.svelte` and a verified `build/404.html`; reduced-motion CSS guard.

### Phase 8 — Tests
Playwright config (preview server, desktop + mobile projects); `landing.spec.ts` and `a11y.spec.ts` covering the AC map in §6.

### Phase 9 — Delivery and CI
Assets-only `wrangler.json`, `static/_headers`, new `ci.yml` (Node 24, pnpm, lint → check → build → e2e; deploy on `main` only, skip with warning without secrets). Delete old workflow.

### Phase 10 — Remove Next.js
Delete React/Next sources, configs and dependencies (AC-12). Confirm a clean `pnpm install` from scratch builds.

### Phase 11 — Docs and verification
Rewrite deployment guide; update CONTRIBUTING and README dev setup; update spec indexes and SPEC-0001 note; manual parity review against Phase 0 baseline; record performance numbers; run the [requirements checklist](./checklists/requirements.md); flip SPEC-0002 status to `Implemented` only when every AC is checked.

## 6. Acceptance-criteria traceability

| AC | Verified by | Phase / task |
|---|---|---|
| AC-1 static build, no Worker | CI build step + `wrangler.json` review | P1, P9 (T005, T040) |
| AC-2 section order + ids | `landing.spec.ts` | P7, P8 (T031, T034) |
| AC-3 Hero queue | `landing.spec.ts` | P6, P8 (T025, T034) |
| AC-4 PathVisualizer | `landing.spec.ts` | P6, P8 (T026, T034) |
| AC-5 PracticeDemo | `landing.spec.ts` | P6, P8 (T027, T034) |
| AC-6 FAQ | `landing.spec.ts` | P5, P8 (T022, T034) |
| AC-7 mobile nav | `landing.spec.ts` (mobile project) | P4, P8 (T014, T034) |
| AC-8 copy in prerendered HTML | `landing.spec.ts` (request API, no JS) | P7, P8 (T034) |
| AC-9 head metadata | `landing.spec.ts` | P4, P8 (T013, T034) |
| AC-10 visual parity | Manual vs Phase 0 baseline | P0, P11 (T001, T052) |
| AC-11 404 | `landing.spec.ts` | P7, P8 (T030, T034) |
| AC-12 Next removed | CI + grep | P10 (T045–T047) |
| AC-13 pnpm | CI | P1 (T004) |
| AC-14 lint + check | CI | P1, P8 (T006, T007) |
| AC-15 assets-only | `wrangler.json` + `wrangler deploy --dry-run` | P9 (T040) |
| AC-16 cache headers | `_headers` + response check on deploy/`wrangler dev` | P9 (T041, T053) |
| AC-17 CI pipeline | Workflow run on the PR | P9 (T042) |
| AC-18 axe | `a11y.spec.ts` | P8 (T035) |
| AC-19 keyboard | `landing.spec.ts` | P8 (T034) |
| AC-20 reduced motion | `landing.spec.ts` (emulated media) | P7, P8 (T032, T034) |
| AC-21 performance | Manual measurement vs baseline | P0, P11 (T002, T054) |
| AC-22 docs | Review | P11 (T049, T050) |
| AC-23 indexes | Review | P11 (T051) |

## 7. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| SvelteKit 3 breaking changes vs familiar v2 patterns | Medium | Medium | Read migration notes first (T003); scaffold with official CLI rather than hand-written config |
| TypeScript version conflict (Kit needs ≥ 6, typescript-eslint < 6.1) | Known | Build/lint fails | Pin `typescript: ~6.0.3` (R2) |
| Font rendering differences (`next/font` vs `@fontsource`) | Medium | Visual drift | Keep variable names and weights; compare in AC-10 review; accept sub-pixel differences only |
| Newsreader italic missing from variable package import | Low | Italic emphasis renders as faux-italic | Import italic axis CSS explicitly (T010) |
| `404.html` not emitted by static adapter | Low | 404 shows generic page | Fallback in R4; verified in T030 |
| `tailwindcss-animate` classes rely on React-era state mount | Low | Missing fade-in on menu/feedback | Svelte `{#if}` mounts the element the same way; checked in T014/T027 |
| Owner wants to keep the OpenNext deployment | Medium | Work unmerged | Phases 0–1 are cheap; full port waits for acceptance (gate §3) |
| Cloudflare secrets absent | High (today) | No live deploy | CI skips deploy with a warning; verify headers via `wrangler dev` (OQ-2) |

## 8. Rollback

The migration lands as one PR with phase-sized commits. If the deployed site regresses after merge, revert the merge commit; `main` returns to the Next.js build. No data or backend state is involved.

## 9. PR strategy

- **PR 1 (this branch):** spec, research, plan, tasks, quickstart, checklist. No ADR changes. Reviewed by the maintainer; acceptance unblocks implementation.
- **PR 2 (`feat/sveltekit-migration`):** Phases 0–11 as ordered commits, one PR so `main` never holds a half-ported site. The PR description carries baseline vs new performance numbers and the screenshot comparison.

## 10. Out of scope (tracked elsewhere)

Copy and claim fixes (spec §8 follow-up), Tailwind 4, Bits UI adoption, Phase 1 product features, Supabase, analytics, R2 public-page pipeline.
