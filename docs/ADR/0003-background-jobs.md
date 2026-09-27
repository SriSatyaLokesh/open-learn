# ADR 0003 — `pg_cron` + `pgmq` + Edge Functions, no job vendor

**Status:** Accepted · **Date:** 2026-09-27

## Context

The previous architecture specified **Inngest or Trigger.dev** for background work: ingestion, forking, badge scans, gamification analysis.

OpenLearn needs scheduled jobs (streak rollover, badge scans, metadata refresh, prerender, push dispatch) and durable queued work (large imports). The budget is $0 and every added vendor costs a dashboard, a secret, a free tier to monitor, and a concept a new contributor has to learn.

Two facts closed the question:

- **The host cannot schedule anything useful.** Cloudflare Cron Triggers exist on Free but are bound by the same 10 ms CPU limit as any Worker ([ADR 0001](./0001-hosting-and-rendering.md)).
- **Postgres already does this.** `pg_cron`, `pg_net` and Supabase Queues (`pgmq`) are all available on the free tier with no separate quota beyond project compute. `pg_cron` schedules to the minute; `pg_net` does async outbound HTTP at ~200 req/s; `pgmq` gives durable queues with visibility timeouts.

## Decision

| Need | Mechanism |
|---|---|
| Scheduling | **`pg_cron`** |
| Triggering work | **`pg_net`** → HTTP call to an Edge Function |
| Durable queue | **Supabase Queues (`pgmq`)** |
| Worker body | **Supabase Edge Functions** (150 s, 500k/month) |

Two rules every job follows:

1. **Enqueue, do not compute.** `pg_net` calls from `pg_cron` have a short timeout (~5 s observed), so a cron job triggers work and returns. It never performs the work inline.
2. **Handlers are idempotent.** `pgmq` delivers **at least once** — a worker that crashes after doing the work but before deleting the message *will* see it again. Every handler tolerates redelivery; `xp_ledger`'s partial unique index on `(user_id, event_type, entity_id)` is one example of how.

A dead-letter path exists from day one: repeated failures archive the message rather than retrying forever.

## Alternatives rejected

| Alternative | Why not |
|---|---|
| **Inngest** (50k runs/month free) | A third vendor, dashboard, secret set and free tier for work Postgres does natively. Genuinely better retry and observability tooling — the one real loss, accepted. |
| **Trigger.dev** ($5/month usage credit) | Credit-metered rather than a true free tier. |
| **Upstash QStash** (1,000 messages/day) | Another vendor, and the daily cap is low. |
| **Cloudflare Cron Triggers** | Bound by the 10 ms CPU limit. |
| **Cloudflare Durable Objects** | Available on Free (SQLite-backed), but adds a second stateful system beside Postgres for no MVP gain. |

## Consequences

**Accepted:**

- **Weaker retries and observability than a purpose-built vendor.** Mitigated by idempotent handlers, a dead-letter path, `next_attempt_at` backoff columns, and structured logs. This is the honest cost of the decision.
- Jobs must fit in **150 s**. Long work is chunked and resumable — relevant to the metadata sweep, which batches rather than scanning everything at once.
- `pg_net` is fire-and-forget: failures surface in `net._http_response` (retained ~6 hours), not as an exception. Jobs log their own outcomes rather than assuming success.
- Debugging a queue means reading SQL, not a web dashboard.

**Gained:**

- **Zero additional vendors.** Jobs live in `supabase/migrations`, so `supabase start` gives a contributor the whole system — cron schedules included.
- Queue state is in the same transaction as the data it concerns, so enqueueing can be atomic with a write.
- No secret to rotate, no third-party outage to depend on.

## Revisit when

- A job genuinely needs more than 150 s and cannot be chunked.
- Multi-day durable workflows with sleeps are required.
- Retry debugging becomes a recurring drain on maintainer time — at which point Inngest's free tier is the first thing to try, since it does not require rewriting the handlers, only their invocation.
