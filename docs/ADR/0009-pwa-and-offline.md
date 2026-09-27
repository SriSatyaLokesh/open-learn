# ADR 0009 — IndexedDB outbox, no sync engine; per-field merge rules

**Status:** Accepted · **Date:** 2026-09-27

## Context

OpenLearn must be a PWA — installable, offline-capable, responsive for mobile and desktop (owner requirement). The previous architecture mentioned none of this; it specified an IndexedDB fallback for Focus Room progress and nothing else.

The actual requirement is narrow and worth stating precisely: **writes made while offline — timestamped notes, playback position, concept completions — must not be lost.**

That is a queue-and-replay problem, not a bidirectional replication problem. And the boundary is set by the product itself: **video playback requires the network.** A learner offline cannot watch anything, so deep offline support buys very little.

Platform reality also constrains this. **iOS does not support the Background Sync API on any version** — no flag, no Apple position — so "sync while the app is closed" is not available regardless of what infrastructure is chosen. Sync happens on foreground and reconnect.

## Decision

### An IndexedDB outbox, and no sync engine

```ts
type OutboxEntry = {
  table: 'note' | 'resource_progress' | 'concept_progress';
  op: 'upsert' | 'delete';
  payload: unknown;
  clientTimestamp: number;
  retries: number;
};
```

Flushed on the `online` event, on app foreground, and on a timer while the tab is visible. Entries are deleted on success.

### Merge rules per field, not one global policy

This is the substantive part, and it also answers the question v1 itself left open — *"how to perfectly resolve conflicts if a user learns the same path concurrently on mobile and desktop?"*

```sql
insert into resource_progress (user_id, resource_id, last_position_seconds)
values ($1, $2, $3)
on conflict (user_id, resource_id) do update set
  last_position_seconds = greatest(resource_progress.last_position_seconds,
                                   excluded.last_position_seconds),
  updated_at = now();
```

| Field | Rule | Why |
|---|---|---|
| Playback position | **`GREATEST()` — monotonic** | A stale device must never rewind a learner. The truth is "furthest point ever reached", which is what `GREATEST` expresses. This is the model media platforms use. |
| Concept completion | **Union / OR** | Once complete from any device, stays complete. Never un-completes. |
| Notes | **Per-note last-write-wins** on a **server-assigned** `updated_at` | Free text has no mergeable ordering. Per-note, not per-table, so editing note A never clobbers note B. Server-assigned because client clocks skew. |

The losing side of a note merge is kept in `note_history` rather than discarded — cheap insurance against the rare concurrent-offline edit, and much simpler than a CRDT.

### Offline scope

| Offline | Online only |
|---|---|
| Write notes | Video playback |
| Record playback position | Publishing, forking |
| Mark concepts complete | Leaderboards, feed, groups |
| Read the app shell | Search, import |

### Service worker rules

**The service worker must never own the HTML of crawlable routes.** Cache-first HTML is how stale titles and structured data reach users and potentially crawlers.

| Asset class | Strategy |
|---|---|
| Hashed JS/CSS | Precache, cache-first — safe, filenames change per deploy |
| Public page HTML | Network-first, or excluded from navigation handling. Public pages must be correct with **no service worker at all** |
| API responses | Network-first with a short offline-read fallback |
| Images | Cache-first, size-capped LRU |
| `sw.js` | `Cache-Control: no-cache`, excluded from immutable caching |

Updates pair `skipWaiting()` with a "refresh to update" prompt — **never a silent swap under an active Focus Room session.**

## Alternatives rejected

Every local-first sync engine was evaluated. All rejected for the same underlying reason: they solve bidirectional replication and offline relational queries, neither of which this product needs.

| Alternative | Why not |
|---|---|
| **ElectricSQL** | Real Supabase integration, but a sync service to operate and a large concept for contributors. Overkill for "don't lose notes". |
| **PowerSync** | Same verdict; heavier than the requirement. |
| **Zero (Rocicorp)** | Reached 1.0 in June 2026 — new, and needs its own `zero-cache` server against a read replica. Too much operational surface for a $0 project. |
| **RxDB** | Mature, and the reasonable middle ground *if* full offline reads were ever needed. Still more than the requirement. |
| **TinyBase** | No first-class Supabase story; suited to local reactive state. |
| **Triplit** | Team acqui-hired by Supabase in Aug 2025; now community-maintained with unclear direction. |
| **Y.js / CRDTs** | The right tool **only** if notes gain real-time multi-cursor collaboration. Not needed for single-author notes with LWW. |
| **Full offline browsing of enrolled paths** | Considered and declined: video needs the network, so the marginal value is low relative to cached-read invalidation complexity. |

## Consequences

**Accepted:**

- Reads are **not** available offline beyond the app shell. Opening the app with no connection shows a clear offline state, not a browsable library.
- iOS gives no background sync, so a user who closes the app before reconnecting syncs on next open. Unavoidable on the platform.
- **Local storage is best-effort, never durable.** iOS evicts Safari-tab storage after 7 days idle (installed PWAs have their own counter), and quota is ~50 MB. The outbox flushes eagerly and is treated as a safety net, not a store of record.
- Rare concurrent-offline note edits lose one version from the live row. Mitigated by `note_history`.

**Gained:**

- A small amount of code and **zero new infrastructure, vendors or free tiers**.
- Nothing new for a contributor to learn beyond IndexedDB.
- Merge rules are **in SQL**, in the write path, so every client gets them — including a future mobile app.
- Correctness by construction: progress cannot go backwards and completion cannot revert, regardless of client behaviour or clock skew.

## Revisit when

- True offline browsing with local relational queries becomes a product requirement — RxDB is the first thing to evaluate.
- Notes gain real-time collaborative editing — Y.js for that field only, not for the data layer.
