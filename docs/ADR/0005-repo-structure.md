# ADR 0005 — Module folders with lint-enforced boundaries, not seven packages

**Status:** Accepted · **Date:** 2026-09-27

## Context

PRD §44 recommends a repository shape with `apps/web` plus seven packages: `ui`, `auth`, `database`, `youtube`, `learning`, `community`, `shared`. The previous architecture took that literally and specified a Turborepo with all seven created up front.

PRD §45 asks, in the same document, for a **modular monolith** with "no unnecessary microservices", and PRD §44's own stated goal is that *"the project should be contribution-ready from the beginning."*

Those pull in opposite directions. Seven packages before the first feature exists means seven `package.json` files, seven `tsconfig.json` files, a build graph, workspace protocol resolution, and cross-package type generation — all of which a first-time contributor must understand before changing one line. For an open-source project whose success depends on drive-by contributions, this is the single highest-friction structural decision available.

The valuable part of PRD §44 is the **boundary set** — those seven names are a good decomposition of the domain. What is not valuable, yet, is the packaging ceremony that enforces it.

## Decision

Keep the boundaries. Drop the packaging.

```text
src/
├── routes/                  # SvelteKit routes
├── modules/
│   ├── learning/            # paths, modules, concepts, forking, lineage
│   ├── youtube/             # provider adapter + mock
│   ├── community/           # social graph, XP, feed, groups
│   ├── certificates/
│   ├── notes/
│   └── shared/              # types, validation schemas, utilities
└── lib/
    ├── supabase/            # browser / server / hook clients
    └── db/                  # Drizzle schema (generated), service-role queries
```

Each module has an `index.ts` that is its **only** public surface. Boundaries are enforced by lint, not by publishing:

```js
// eslint.config.js — no cross-module deep imports
'no-restricted-imports': ['error', {
  patterns: [{
    group: ['**/modules/*/!(index)', '**/modules/*/!(index)/**'],
    message: 'Import from the module index, not its internals.',
  }],
}],
```

So a violation fails CI exactly as it would with real packages, and the refactor to packages later is mechanical: move the folder, add a `package.json`, keep the same `index.ts`.

**Promotion trigger:** a module becomes a published package when a **second consumer** exists — in practice, the P2 mobile app (PRD §43). That is the point at which packaging earns its cost, and not before.

## Alternatives rejected

| Alternative | Why not |
|---|---|
| **Full 7-package Turborepo now** | Real cost, no current benefit. Nothing consumes these packages but one app. Slower CI, harder onboarding, and a workspace resolution failure is a confusing first experience for a new contributor. |
| **No boundaries at all** (flat `src/lib`) | Would drift into a tangle and lose PRD §44's decomposition. The lint rule is cheap; give up the ceremony, keep the discipline. |
| **Folder boundaries with no enforcement** | Conventions without enforcement decay, especially with many contributors. |

## Consequences

**Accepted:**

- **Module boundaries are enforced by lint, not by the type system**, so a determined contributor can bypass them with an eslint-disable comment. Caught in review; an acceptable risk at this stage.
- One `package.json`, so per-module dependency isolation does not exist. Not needed for a single deployable.
- Migrating to packages later is work — but mechanical work, and only paid when there is a reason.

**Gained:**

- A contributor clones, runs `pnpm install && pnpm dev`, and edits one file. No workspace concepts required.
- One build, one test command, one type-check. Faster CI on GitHub Actions.
- The decomposition PRD §44 wants, available for inspection, without the packaging.

## Note on `packages/ui`

PRD §44 lists a `ui` package. There is no `modules/ui`: with SvelteKit, shared components live in `src/lib/components`, which is the framework's own convention. Inventing a module for it would fight the framework for no benefit.

## Revisit when

- The P2 mobile app needs to consume domain logic — the stated promotion trigger.
- A module genuinely needs its own dependency set or release cadence.
- The single build becomes slow enough that incremental package builds would measurably help.
