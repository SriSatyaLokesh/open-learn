# FEATURE SPECIFICATION: SVELTEKIT FRONTEND MIGRATION

**Specification ID:** SPEC-0002
**Feature:** Port the landing page from Next.js 15 to SvelteKit with static delivery on Cloudflare
**Status:** Draft
**Target Route:** `/` (plus `404`)
**Primary Owner:** Frontend Engineering (`@SriSatyaLokesh`, `@scc4287`)
**Parent Documents:** [`SPEC-0001`](../landing-page/spec.md) (behaviour and content being preserved) · [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) §3, §5, §17, §21
**Governing ADRs:** [0001](../../docs/ADR/0001-hosting-and-rendering.md) · [0001b](../../docs/ADR/0001b-framework.md) · [0005](../../docs/ADR/0005-repo-structure.md) — used as written; toolchain choices are recorded in [`research.md`](./research.md) §R2 and §R7
**Companion files:** [`research.md`](./research.md) · [`plan.md`](./plan.md) · [`tasks.md`](./tasks.md) · [`quickstart.md`](./quickstart.md) · [`checklists/requirements.md`](./checklists/requirements.md)

---

## 1. Objective & Scope

Replace the Next.js landing page with a **behaviour- and content-identical** SvelteKit implementation, served as static files on Cloudflare with no Worker code, and establish the frontend toolchain every later feature will build on.

This is a **parity port**, not a redesign. A visitor must not be able to tell the difference except by speed.

### 1.1 In scope

- SvelteKit 3 + Svelte 5 + TypeScript 6.0 project on Node ≥ 22.17, `adapter-static`, all routes prerendered (versions pinned in [`research.md`](./research.md)).
- Port of all 12 landing sections, `HeaderNav`, `EditorialFooter`, layout shell, metadata.
- Port of design tokens (`tailwind.config.ts`), global styles (`globals.css`), fonts, `cn()` helper.
- Content store and types moved unchanged (`landingData.ts`, `landing.ts`).
- Assets-only Cloudflare deploy with cache headers; removal of OpenNext/Next.js.
- npm → pnpm.
- ESLint (with ADR 0005 boundary rule), `svelte-check`, Playwright + axe, CI workflow.
- Docs: deployment guide rewrite, CONTRIBUTING dev setup, specs/ADR indexes.

### 1.2 Out of scope

- Any copy, design or layout change. Known content issues are listed in §8 and handled separately.
- Phase 1 features (import, Focus Room, notes), Supabase, analytics.
- Tailwind 4.
- Introducing Bits UI components: no current section needs one (the FAQ uses native `<details>`; the mobile menu is a toggle). Bits UI is adopted when the first component needs it (research.md §R7).

---

## 2. Information Architecture

### 2.1 Page structure (unchanged from SPEC-0001)

Hero → ProblemAudit → SolutionPipeline → HowItWorks → DistractionFree → PathVisualizer → PracticeDemo → ProgressHud → OpenCurriculum → AudienceSection → FaqSection → BottomCta, wrapped by HeaderNav and EditorialFooter.

### 2.2 Component inventory and port mapping

| Current (React) | Target (Svelte) | State to preserve |
|---|---|---|
| `app/layout.tsx` | `routes/+layout.svelte` | Fonts, background mesh, header/footer wrapper |
| `app/page.tsx` | `routes/+page.svelte` | Section order; `<svelte:head>` metadata |
| `HeaderNav.tsx` | `lib/components/layout/HeaderNav.svelte` | `mobileMenuOpen` toggle; closes on link click |
| `EditorialFooter.tsx` | `lib/components/layout/EditorialFooter.svelte` | — |
| `HeroSection.tsx` | `lib/components/landing/HeroSection.svelte` | `activeQueueId` (default `q3`) switches mock player |
| `PathVisualizer.tsx` | `…/PathVisualizer.svelte` | `selectedNodeId` (default `n3`) drives drawer |
| `PracticeDemo.tsx` | `…/PracticeDemo.svelte` | `selectedOption`, `submitted`, reset |
| `FaqSection.tsx` | `…/FaqSection.svelte` | Native `<details>`, first item open |
| 8 other sections | `…/<Name>.svelte` | Static markup only |
| `content/landingData.ts` | `lib/content/landingData.ts` | Moved verbatim |
| `types/landing.ts` | `lib/types/landing.ts` | Moved verbatim |
| `lib/utils.ts` | `lib/utils.ts` | `cn()` unchanged |
| `app/globals.css` | `app.css` | All utilities (`.taste-bg-mesh`, `.btn*`, `.badge-bracket`, keyframes); `tailwindcss-animate` kept (used by `animate-in fade-in` in PracticeDemo and HeaderNav) |

### 2.3 Directory structure (ADR 0005, SvelteKit form)

```text
src/
├── app.html
├── app.css
├── routes/
│   ├── +layout.svelte
│   ├── +layout.ts          # export const prerender = true
│   ├── +page.svelte
│   └── +error.svelte       # 404
└── lib/
    ├── components/
    │   ├── landing/        # 12 sections + index.ts
    │   ├── layout/         # HeaderNav, EditorialFooter + index.ts
    │   └── ui/             # Bits UI / shadcn-svelte, added on first need
    ├── content/landingData.ts
    ├── types/landing.ts
    └── utils.ts
static/
└── _headers                # cache rules (research.md §R3)
```

`src/modules/` is created with the first domain module (Phase 1), not in this spec. The ESLint boundary rule is configured now so it applies from that module's first commit.

### 2.4 Delivery

```text
pnpm build ──► build/ (static HTML/JS/CSS + _headers)
            └─► wrangler deploy (assets-only, no Worker script)
```

---

## 3. Behaviour Specification

1. **Prerender everything.** `+layout.ts` sets `prerender = true`; the build fails if any route cannot be prerendered.
2. **Interactivity hydrates client-side** with Svelte 5 runes (`$state`), replacing `useState` one-for-one. Defaults are identical (`q3`, `n3`, no answer selected, menu closed).
3. **No client-only rendering of content.** All copy is present in the prerendered HTML (SEO parity with SPEC-0001 AC-1).
4. **Fonts** load from `@fontsource` CSS with `font-display: swap`; CSS variables `--font-outfit`, `--font-newsreader`, `--font-jetbrains-mono` keep their names so Tailwind tokens are unchanged.
5. **Links** keep their existing targets (`#curriculum`, `#practice`, `#hero`, etc.).
6. **Metadata** from `layout.tsx` (title, description, keywords, Open Graph, Twitter card) is emitted via `<svelte:head>` with identical values.
7. **404**: unknown paths serve a prerendered `404.html` in the site's style, linking home.

---

## 4. Data Contracts & Schemas

No contract changes. `LandingDataContract` and all types in `landing.ts` move verbatim; `LANDING_DATA` moves verbatim. Imports change from `@/…` to `$lib/…`.

---

## 5. Design Tokens & Accessibility

- `tailwind.config.ts` tokens (colors, fonts, radii, shadows, animations, container) port **unchanged**; only `content` globs change to `./src/**/*.{html,js,svelte,ts}`.
- Existing ARIA (`aria-label` on nav, toggle and GitHub link; `aria-hidden` mesh) is preserved.
- **Improvements allowed because they are not visual:** mobile toggle exposes `aria-expanded` and `aria-controls`; PathVisualizer and Hero queue items are `<button>`s with `aria-pressed` reflecting selection; PracticeDemo feedback announced via `aria-live="polite"`.
- Animations (`sensorBlink`, `soundChipPulse`, `badgePop`, transitions) are disabled under `prefers-reduced-motion`.

---

## 6. SEO / AEO / GEO

Identical to SPEC-0001 §5: same title, description, Open Graph and Twitter values, same FAQ `directAnswer` content in HTML. Pages are fully prerendered, so crawlers receive complete HTML without JavaScript.

---

## 7. Acceptance Criteria

Verification layer: **E** = Playwright · **A** = axe · **C** = CI/command · **M** = manual.

### Parity
- [x] **AC-1 (C)** `pnpm build` produces a static `build/` directory; no server bundle, no Worker entry.
- [x] **AC-2 (E)** All 12 sections render in the SPEC-0001 order, each with its existing `id`.
- [x] **AC-3 (E)** Hero: clicking a queue item switches the mock player's active concept; `q3` active by default.
- [x] **AC-4 (E)** PathVisualizer: clicking a node updates the drawer's creator, duration and summary; `n3` selected by default. *(Implemented: creator and summary. The React drawer never showed duration, so parity rules it out.)*
- [x] **AC-5 (E)** PracticeDemo: selecting then submitting shows correct/incorrect state and explanation; reset clears it.
- [x] **AC-6 (E)** FAQ: first item open by default; each item toggles independently.
- [x] **AC-7 (E)** Below 768 px the nav collapses to a toggle; opening shows links; clicking a link closes it.
- [x] **AC-8 (E)** All prerendered HTML contains the landing copy (fetch without JS executes and finds hero headline and every FAQ question).
- [x] **AC-9 (E)** `<head>` title, description, Open Graph and Twitter tags equal SPEC-0001's values.
- [x] **AC-10 (M)** Side-by-side visual review of old vs new at 375, 768 and 1280 px shows no visible difference in layout, typography or colour (screenshots attached to the PR). *(Done as a 43-state pixel comparison; results in `baseline/metrics.md`. The screenshots were not kept in the repo or the PR, by the owner's decision.)*
- [x] **AC-11 (E)** An unknown path returns the styled 404 page.

### Toolchain
- [x] **AC-12 (C)** `next`, `react`, `react-dom`, `@radix-ui/*`, `motion`, `lucide-react`, `@opennextjs/cloudflare`, `class-variance-authority` (unused), `open-next.config.ts`, `next.config.ts`, `next-env.d.ts` and all `.tsx` files are removed; icons come from `@lucide/svelte`.
- [x] **AC-13 (C)** `pnpm-lock.yaml` replaces `package-lock.json`; `packageManager` is set in `package.json`.
- [x] **AC-14 (C)** `pnpm lint` (ESLint + `eslint-plugin-svelte`, with the ADR 0005 `no-restricted-imports` rule) and `pnpm check` (`svelte-check`) pass with zero errors.

### Delivery
- [x] **AC-15 (C)** `wrangler.json` has an `assets` directory and **no `main`**; `wrangler deploy` uploads assets only.
- [ ] **AC-16 (C)** `static/_headers` sets immutable caching on `/_app/immutable/*` and revalidation on HTML; verified in deployed response headers. *(Pending: verified under `wrangler dev`; live check after the first deploy.)*
- [ ] **AC-17 (C)** CI on every PR runs install → lint → check → build → Playwright + axe; deploy runs only on `main` and is skipped with a warning when Cloudflare secrets are absent. *(Pending: the PR path is verified (lint, check, build and e2e passed on PR #4, deploy skipped); the main-only deploy and missing-secrets warning are checked on the first push to `main`.)*

### Accessibility and performance
- [ ] **AC-18 (A)** axe reports no serious or critical violations on `/`. *(Not met: `color-contrast` fails on existing design tokens and is excluded in `e2e/a11y.spec.ts`. Fixing it is a visual change and needs the owner's call. No other serious or critical violations.)*
- [x] **AC-19 (E)** Every interactive control is reachable and operable by keyboard; the mobile toggle reports `aria-expanded`.
- [x] **AC-20 (E)** With `prefers-reduced-motion: reduce`, decorative animations do not run.
- [x] **AC-21 (M)** Lighthouse mobile performance and total JS (gzip) are recorded for the Next.js build and the SvelteKit build in the PR; the SvelteKit JS total is lower.

### Documentation
- [x] **AC-22** `docs/CLOUDFLARE_SSR_DEPLOYMENT.md` is replaced by a static deployment guide; CONTRIBUTING documents `corepack enable && pnpm install && pnpm dev`.
- [x] **AC-23** `specs/README.md` lists SPEC-0002; SPEC-0001's directory-architecture section notes it was superseded by this spec.

---

## 8. Open Questions & Follow-ups

- **OQ-1 shadcn-svelte on Tailwind 3.** Current shadcn-svelte targets Tailwind 4. Not needed in this spec (§1.2); resolve when the first Bits UI component is added.
- **OQ-2 Cloudflare account.** Deploy needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in repo secrets (owner action). Until then AC-16's live check runs against `wrangler dev`.
- **OQ-3 Maintainer acceptance.** This spec removes the owner's OpenNext deployment (`cc9bf15`, `396b9df`); the owner should approve before the implementation merges.
- **OQ-4 Known ADR text mismatch (accepted).** ADR 0001b's Decision names `adapter-cloudflare`; this spec uses `adapter-static`. Rationale in research.md §R7. ADRs are deliberately not edited in this spec.
- **Follow-up (Phase 2, not this spec): ADR 0001 public-page read path.** ADR 0001's Consequences have a Worker `env.BUCKET.get()` each public page, which makes every view a Worker request (100,000/day limit), contradicting its own "no metered resource" goal. To be resolved when the R2 publish pipeline is specified (likely R2 custom domain behind the CDN cache).
- **Follow-up (not this spec): content issues carried over unchanged** — the unsourced "97%" abandonment claim (README says "<3%" finish), "Ad-free YouTube player" wording vs PRD §40's "Ad-free OpenLearn interface", the footer GitHub link pointing to `github.com/open-learn`, and CTAs that only scroll to `#curriculum`.
