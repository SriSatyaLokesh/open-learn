# ADR 0001b — SvelteKit, not Next.js/React

**Status:** Accepted · **Date:** 2026-09-27

## Context

The previous architecture specified Next.js (App Router), React, React Query and Zustand. [ADR 0001](./0001-hosting-and-rendering.md) establishes the hosting constraint: **Cloudflare Workers Free allows 10 ms CPU per invocation**, a hard kill.

The project owner was asked to weigh two priorities and chose explicitly: **guaranteed free-tier headroom over framework familiarity.**

Evidence gathered on each candidate:

- **Next.js via `@opennextjs/cloudflare`** has the most documented Error 1102 reports of any framework surveyed — prerendered routes fully re-rendering when the incremental cache binding is not wired up, isolate state accumulating until the Worker dies after a few hundred renders, and cold-start CPU consumed by module-scope setup. It works, but it is fragile and is commonly described as needing Workers Paid for production reliability. Bundle size is no longer the blocker it was — Cloudflare removed the compressed-size check in September 2026 in favour of a single 64 MiB uncompressed limit ([changelog](https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/)) — but CPU remains.
- **SvelteKit** has the best-evidenced track record of staying under the ceiling; practitioner reports put typical requests under 5 ms, with the documented failure case being one heavy synchronous call in a `load` function rather than the framework itself.
- **Astro** is architecturally well suited to the content half (islands, static-first, minimal per-request work), but public evidence at load on the free plan is thinner, and it fits the *app* half poorly.
- **Remix / React Router v7** and **Nuxt** lack strong public evidence either way.

OpenLearn is roughly half public content (SEO-critical, crawlable) and half rich interactive app (a drag-and-drop curriculum builder, a stateful Focus Room).

## Decision

**SvelteKit** with TypeScript and Tailwind CSS, deployed via `adapter-cloudflare`.

Reasoning beyond raw CPU:

1. **One paradigm covers both halves.** Astro would require embedding a SPA as an island for the Focus Room and Builder, giving the codebase two mental models — a real cost for an open-source project taking contributions from strangers.
2. **Per-route `prerender` control** aligns directly with ADR 0001's per-page-class strategy.
3. **Svelte SSR is string concatenation**, so server rendering cost is low by construction rather than by optimisation.
4. `svelte-dnd-action` provides keyboard and ARIA support for the reorderable nested lists PRD §38 requires (see Consequences).
5. Supabase publishes an official SvelteKit auth guide, and `@supabase/ssr` is framework-agnostic.

## Alternatives rejected

| Alternative | Why not |
|---|---|
| Next.js + `@opennextjs/cloudflare` | Most documented 1102 reports; requires correct ISR cache-binding configuration to avoid re-rendering every request; the framework most often described as needing Workers Paid. Directly contradicts the owner's stated priority. |
| Astro | Excellent for the content half, poor for the app half — would mean two paradigms in one repo. |
| Remix / React Router v7 | Insufficient evidence on the free tier; would need prototyping and CPU profiling to justify. |
| Nuxt | Thinnest evidence of the five surveyed. |
| Vite SPA + prerender | Would work, but hand-rolls routing, data loading and prerendering that SvelteKit provides. |

## Consequences

**Accepted:**

- **Smaller contributor pool than React.** The most significant cost, accepted knowingly. Mitigated by Svelte's low learning curve and a documented local-dev path needing no credentials.
- The following are replaced and must be re-decided in Svelte terms: Server Actions → SvelteKit form actions plus Edge Functions; React Query → SvelteKit `load` plus stores; Zustand → Svelte stores; `next/image` → not needed, since thumbnails are hotlinked per YouTube policy.
- **`svelte-dnd-action` labels its accessibility support beta.** It provides keyboard drag (Space/Enter, configurable), ARIA attributes, screen-reader instructions, nested zones via `SHADOW_PLACEHOLDER_ITEM_ID`, and an `autoAriaDisabled` escape hatch — but it must be **screen-reader tested, not trusted**. Documented fallback: explicit move-up / move-down / move-to controls, which are fully accessible and cheaper than building a drag library.

**Gained:**

- Comfortable CPU headroom on the free tier for the authenticated routes that *do* render server-side.
- One framework, one set of conventions, one build.
- Smaller client bundles, which matters for the PWA and for mobile performance (PRD §39).

## Note on residual risk

ADR 0001 is what makes this decision low-stakes: **public pages do not render at request time at all.** So SvelteKit's SSR cost applies only to authenticated routes, which are never crawled and never go viral. Even if the CPU estimate is optimistic, the blast radius is bounded.

## Revisit when

- Measured CPU on authenticated routes approaches the ceiling.
- Contributor friction from Svelte proves to be a real, observed drag on the project.
- Workers Paid is accepted, which would reopen the field entirely.
