# ADR 0011 — Next.js static export for Phase 1

**Status:** Accepted · **Date:** 2026-10-11
**Supersedes (for Phase 1 only):** [ADR 0001b](./0001b-framework.md)

## Context

[ADR 0001b](./0001b-framework.md) chose SvelteKit over Next.js and recorded the reason: Cloudflare Workers Free kills any invocation over **10 ms of CPU** (Error 1102), and Next.js on Workers via `@opennextjs/cloudflare` has the most documented 1102 failures.

Since then the repository was initialised with **Next.js 15 (App Router)** and a complete landing page ([SPEC-0001](../../specs/landing-page/spec.md), ~2,000 lines). No ADR recorded that departure, which left an Accepted ADR and the codebase in direct contradiction.

Re-examining the premise for **Phase 1** specifically:

- Phase 1 is the *authenticated, client-rendered app*: URL import, Focus Room, notes, progress. None of it is crawled (PRD §32 lists these as `noindex`).
- The public, SEO-critical pages (paths, profiles, certificates) are **Phase 2**, and [ADR 0001](./0001-hosting-and-rendering.md) already decides they are rendered **by a Supabase Edge Function into R2**, with their own HTML templates, not by the app framework. The framework choice therefore does not decide how public pages render.
- The 10 ms ceiling applies to *Worker invocations*. A static export serves files as Cloudflare static assets, which are **free, unlimited and run no code**. The failure mode that motivated ADR 0001b cannot occur.

So the objection to Next.js was an objection to **Next.js running on Workers**. It does not apply to Next.js producing static files.

## Decision

**Phase 1 ships as a Next.js 15 static export** (`output: 'export'`), served as static assets on Cloudflare.

### Configuration consequences

```ts
// next.config.ts
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },   // no image optimiser in a static export; thumbnails are hotlinked anyway (ARCHITECTURE §15)
  trailingSlash: true,             // plain-file hosting
  reactStrictMode: true,
};
```

### What a static export rules out

| Not available | Replacement |
|---|---|
| Route Handlers, Server Actions, middleware | Supabase Edge Functions ([ADR 0008](./0008-ingestion-execution-model.md)); `supabase-js` from the browser under RLS ([ADR 0002](./0002-data-access-and-rls.md)) |
| `next/image` optimisation | Not needed; thumbnails hotlinked from `i.ytimg.com` |
| Dynamic routes for user-owned ids (`/focus/[id]`) | **Query-parameter routes**: `/focus?path=<id>&lesson=<id>` |
| Request-time SSR / ISR | Not needed in Phase 1 |

### Routing for user-owned data

Ids for user-created paths exist only in the user's browser, so no build can pre-render them. Authenticated pages are fixed, pre-rendered shells that read `useSearchParams()` in a client component wrapped in `<Suspense>` (required by Next for static export).

```text
/                      landing (SPEC-0001, unchanged)
/import/               paste URLs
/library/              user's paths
/focus/?path=&lesson=  Focus Room
```

URLs survive refresh and are shareable to the same browser. Clean slugs for **public** paths are a Phase 2 concern with their own pipeline.

### Layout and tooling

[ADR 0005](./0005-repo-structure.md)'s module boundaries apply unchanged; only the framework folder differs:

```text
src/
├── app/          Next.js routes (replaces SvelteKit `src/routes`)
├── components/   React UI (replaces `src/lib/components`)
├── modules/      framework-free domain logic, one `index.ts` per module
└── lib/          shared helpers
```

ESLint flat config enforces (a) no deep imports across `modules/*` and (b) no `react`/`next` imports inside `modules/`. Neither rule exists today.

## Alternatives rejected

| Alternative | Why not |
|---|---|
| **Rewrite to SvelteKit now** (honour 0001b) | Discards working code before any Phase 1 feature exists, to solve a CPU problem a static export does not have. |
| **Next.js + `@opennextjs/cloudflare`** | The exact 1102 fragility 0001b documented. Still rejected. |
| **Single-page app with catch-all + SPA fallback** | Clean URLs, but depends on host rewrite config and fights Next's file routing. Query params work on any static host. |
| **Hash routing** | Not supported natively and unusable for later share links. |

## Consequences

**Accepted:**

- **This overrides the project owner's recorded priority** ("headroom over familiarity") on a narrower basis than 0001b considered: it removes the CPU risk rather than trading against it. The owner confirmed the direction on 2026-10-11 and is the gate for reopening it.
- **Query-parameter URLs are less pretty** than path routes.
- **The `svelte-dnd-action` argument from 0001b is not resolved, only deferred.** The Phase 2 Path Builder needs a keyboard-accessible drag-and-drop library for React (e.g. `dnd-kit`), which must be screen-reader tested exactly as ADR 0001b required of its Svelte equivalent.
- **React's larger client bundle** weighs on the Focus Room. Phase 1 must record a bundle-size and Lighthouse baseline so the Phase 2 decision uses measurements.
- Every landing-page component is currently `'use client'`. Static sections should drop it; that is cleanup, not a blocker.

**Gained:**

- No rewrite, and a framework contributors already know.
- Zero Worker CPU on every Phase 1 request, by construction.
- Phase 1 is host-portable (any static host), consistent with ARCHITECTURE §1.1 #7.

## Revisit when (a **gate**, not a trigger)

**Before Phase 2 starts**, reopen this ADR with measurements:

1. Focus Room JS payload and Lighthouse mobile score from Phase 1.
2. Whether the Phase 2 Path Builder's drag-and-drop requirement is better met in React or Svelte after a screen-reader spike.
3. Whether any Phase 2 authenticated route needs request-time rendering (which would put CPU back in play).

Also reopen if Cloudflare Workers Paid is accepted, or if static export blocks a required feature.
