# ADR 0012 — Local-first data layer: IndexedDB is the source of truth

**Status:** Accepted · **Date:** 2026-10-11
**Builds on:** [ADR 0009](./0009-pwa-and-offline.md) · **Amends:** [ADR 0007](./0007-guest-mode.md)

## Context

[ADR 0007](./0007-guest-mode.md) made guests real Supabase anonymous users from their first save, so guest data lives in Postgres under RLS and conversion needs no migration. [ADR 0009](./0009-pwa-and-offline.md) separately specified an IndexedDB **outbox** for offline writes.

Phase 1 ([ADR 0011](./0011-nextjs-static-export-for-phase-1.md)) is a static app that should be usable with **no backend and no credentials** (constraint C5). Together with the README's "local and authenticated persistence", that makes the browser the natural primary store, and it changes the economics ADR 0007 relied on:

- Anonymous sessions count toward the **50,000 MAU** cap and the **500 MB** database. Syncing every curious visitor spends both on people who may never return.
- If the browser already holds the data, an anonymous server account adds cost without adding capability.

## Decision

### 1. IndexedDB is the source of truth; Supabase is a replica

The UI reads and writes **only** a typed repository over IndexedDB. Server sync (Slice B) is a background process behind that interface; it never changes what the UI calls.

Delivered in two slices ([SPEC-0002](../../specs/phase-1a-local-focus-room/spec.md), [SPEC-0003](../../specs/phase-1b-accounts-sync/spec.md)):

| Slice | Backend | Persistence |
|---|---|---|
| **1A** | None | IndexedDB only, mock/oEmbed YouTube, no accounts |
| **1B** | Supabase Auth + Postgres + RLS + one Edge Function | IndexedDB plus outbox sync |

### 2. Dexie behind repository ports

[Dexie](https://dexie.org) is the IndexedDB wrapper, used only inside the `storage` module. `learning` and `notes` declare **repository interfaces** (ports); `storage` implements them. React components never import Dexie. Dexie Cloud (paid sync) is explicitly not used.

### 3. Client-generated ids and a sync-ready row envelope

Every row has, from schema version 1:

```ts
interface RowEnvelope {
  id: string;           // UUIDv7, generated on the client
  createdAt: number;    // epoch ms
  updatedAt: number;    // epoch ms, bumped on every local write
  deletedAt: number | null; // soft delete, so deletions can sync
}
```

UUIDv7 gives collision-free ids across devices and sortable creation order. Including `updatedAt`/`deletedAt` in 1A means Slice B needs **no data migration** of existing rows. The outbox table itself is added in Slice B as Dexie version 2.

### 4. Schema versioning is a tested contract

Every change to a stored shape is a numbered Dexie `version(n)` with an `upgrade()` function. Each upgrade has a unit test that runs it against a fixture of the previous version's data. No upgrade ships untested.

### 5. Guests are local-only until sign-up (amends ADR 0007)

- No anonymous Supabase session is created. Sync begins at **"Save your learning journey"** (PRD §19) when the account is created.
- On sign-up the client enqueues every local row into the outbox and uploads in batches. Ids are fixed, so uploads are **idempotent** and safe to retry.
- Because the browser is the only copy until then, the UI must: request `navigator.storage.persist()`, **warn that browser data can be evicted** (iOS Safari evicts script-writable storage after 7 days idle, per ARCHITECTURE §18.1), and offer a one-click **JSON export**.

### 6. Slice B sync mechanics (detailed in SPEC-0003)

- **Push:** outbox, flushed on `online`, on foreground, and on a timer while visible.
- **Pull:** cursor-based, per table, on foreground and reconnect. **No Realtime** — its 200-connection free budget is reserved for group features (ARCHITECTURE §13).
- **Merge:** union by id. Same-row conflicts use ADR 0009's per-field rules, with one refinement (below).
- **Deletes:** soft (`deletedAt`), purged later.

**Refinement to ADR 0009's merge rules.** ARCHITECTURE §18.3 stores one `last_position_seconds` merged with `GREATEST()`. That makes "resume" mean *furthest point ever reached*, so a learner who rewatches minute 5 of a 60-minute video and leaves would resume at the furthest point instead of where they stopped. Phase 1 therefore stores **two** fields:

| Field | Meaning | Merge |
|---|---|---|
| `furthestPositionSeconds` | Furthest point reached | `GREATEST` (never rewinds) |
| `lastPositionSeconds` | Where the learner stopped, used for resume | last-write-wins by `updatedAt` |

Which one drives resume is recorded as an open question in SPEC-0002.

## Alternatives rejected

| Alternative | Why not |
|---|---|
| **Swappable repository** (local for guests, Supabase direct for signed-in users) | Needs guest-to-account migration code and gives signed-in users no offline writes. Re-creates the parallel data model ADR 0007 warned about, without its benefits. |
| **Sync library** (RxDB, PowerSync, Dexie Cloud) | Already rejected in ADR 0009; adds a dependency or vendor against the $0 constraint. |
| **Supabase from day one (ADR 0007 as written)** | Nothing works without a Supabase project; spends MAU/DB on visitors; breaks "clone and run with no credentials". |
| **`idb` or raw IndexedDB** | Hand-written indexes, migrations and live queries for a multi-table model. |

## Consequences

**Accepted:**

- **Guest data can be lost** if the browser clears storage. This is the price of D10, mitigated by the persistence request, the warning, and export. ADR 0007 already accepted the same risk for anonymous sessions.
- **We own merge code**, and it is the code most likely to regress silently. It needs the replay tests in ARCHITECTURE §21.3.
- **Client-chosen ids are an RLS concern.** Slice B must ensure `user_id` defaults to `auth.uid()` and cannot be supplied by the client, and that an upsert on a colliding id cannot touch or reveal another user's row. This is a named threat in SPEC-0003.
- Two persistence implementations exist conceptually (local, then local plus remote), but the UI sees one.

**Gained:**

- A usable product with no backend, and instant local writes.
- Server cost scales with committed users, not visitors.
- Slice B is additive: no UI rewrite, no row migration.

## Revisit when

- Guest data-loss complaints are common enough to justify anonymous server sync (reopen the ADR 0007 path, ideally after a meaningful-action threshold).
- Merge rules prove too costly to maintain, in which case evaluate a sync library.
- Offline use extends beyond notes and progress.
