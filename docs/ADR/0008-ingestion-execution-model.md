# ADR 0008 — Ingestion in an Edge Function: direct-invoke, `pgmq` for outliers

**Status:** Accepted · **Date:** 2026-09-27

## Context

The previous architecture made ingestion **asynchronous from day one** and marked it *"(Permanent architectural choice)"* in its trade-off register. The stated rationale was: *"Prevents Vercel 10-60s timeout limits for large playlists or slow API responses."*

Both halves of that rationale were wrong.

1. **The number was wrong.** Vercel Hobby functions allow **300 s**, not 10-60 s ([Vercel functions limits](https://vercel.com/docs/functions/limitations)).
2. **The workload was never large.** `playlistItems.list` returns 50 items per call and `videos.list` accepts 50 ids per call, so a 200-video playlist is roughly **4 API calls** — a couple of seconds, dominated by network wait.

So the most complex part of the ingestion design — a queue, a job table, a Realtime subscription and a "processing" UI state on the default path — was justified by a premise that did not hold, and then locked in as permanent.

This is recorded in detail because it is the clearest example in the review of a reasonable-sounding design built on an unchecked number.

## Decision

Correct reasoning reaches a different answer, and a simpler one.

**Cloudflare Workers Free allows 10 ms CPU per invocation** ([ADR 0001](./0001-hosting-and-rendering.md)), so ingestion cannot run in the host layer at **any** playlist size. It moves to a **Supabase Edge Function** (150 s, 500k invocations/month).

| Case | Path |
|---|---|
| Ordinary import (the overwhelming majority) | Edge Function invoked directly; returns the draft path in the response |
| Very large playlist, above a stated threshold | Enqueued to `pgmq`; the UI shows progress and polls |

The same adapter code serves both — only the invocation differs. The threshold is a configured constant, tuned from observed p99 durations rather than guessed.

Ingestion runs **only** in the Edge Function: never in the browser, never in the host Worker. That gives a single isolated egress point, which is what PRD §36 means by *"arbitrary URL ingestion… must be isolated"*.

## Alternatives rejected

| Alternative | Why not |
|---|---|
| **Always asynchronous** (the v1 design) | Builds a queue, job table, subscription and "processing" state to cover a case most users never hit. Every import pays a latency and complexity tax for the sake of the rare one. |
| **Always synchronous** | A genuinely huge playlist, or a slow provider response, would exceed even 150 s. The `pgmq` escape hatch is cheap insurance. |
| **Ingest in the host Worker** | Impossible: 10 ms CPU. |
| **Ingest in the browser** | Would expose the API key, make SSRF protection impossible, and make quota accounting unenforceable. |

## Consequences

**Accepted:**

- Two invocation paths to maintain, with a threshold to tune. Far less than v1's always-async machinery, but not zero.
- Very large imports still need a progress UI. Built once, used rarely.
- A direct invocation that fails mid-way leaves a partial draft. Handled as PRD §11 requires: a **partial success with a visible failure list and manual correction**, not an all-or-nothing rollback. A partially imported path a user can fix beats an error message.

**Gained:**

- The common case is **one round trip** and immediate feedback, which is the right experience for pasting a playlist URL.
- No queue, job table or Realtime subscription on the default path.
- Ingestion sits at a single isolated egress point, so SSRF checks, the provider allowlist, timeouts, response-size caps and quota accounting all live in exactly one place.
- Because the Edge Function holds the API key, the browser never sees it.

## Revisit when

- Observed p99 import duration approaches the 150 s Edge Function limit, which would mean lowering the threshold.
- Import volume makes direct invocation unreliable — for example if quota contention causes frequent retries, at which point queueing everything becomes the simpler story.
