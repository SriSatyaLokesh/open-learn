# Architecture Decision Records

One file per contested decision. Each states the context, the choice, the alternatives rejected, the consequences we accepted, and **the condition under which it should be reopened**.

An ADR is not permanent. If you think one is wrong, open an issue citing its number — that is what the "Revisit when" section is for.

| # | Decision | Status |
|---|---|---|
| [0001](./0001-hosting-and-rendering.md) | Cloudflare hosting; public pages prerendered into R2 | Accepted |
| [0001b](./0001b-framework.md) | SvelteKit, not Next.js/React | Accepted |
| [0002](./0002-data-access-and-rls.md) | RLS is the authorization boundary; Drizzle for types and service-role work | Accepted |
| [0003](./0003-background-jobs.md) | `pg_cron` + `pgmq` + Edge Functions, no job vendor | Accepted |
| [0004](./0004-feed-strategy.md) | Single `ACTIVITY` table, not fan-out-on-write | Accepted |
| [0005](./0005-repo-structure.md) | Module folders with lint boundaries, not seven packages | Accepted |
| [0006](./0006-youtube-provider-contract.md) | Quota budget, 30-day retention sweep, player constraints | Accepted |
| [0007](./0007-guest-mode.md) | Supabase anonymous sign-in for Guest Mode | Accepted |
| [0008](./0008-ingestion-execution-model.md) | Ingestion in an Edge Function; direct-invoke, `pgmq` for outliers | Accepted |
| [0009](./0009-pwa-and-offline.md) | IndexedDB outbox, no sync engine; per-field merge rules | Accepted |
| [0010](./0010-r2-access-control.md) | R2 has no RLS; private objects via Edge-Function-signed URLs | Accepted |

Background for all of these: [`../ARCHITECTURE_REVIEW.md`](../ARCHITECTURE_REVIEW.md).
