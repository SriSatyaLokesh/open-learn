# FEATURE SPECIFICATION (OUTLINE): PHASE 1B — ACCOUNTS & SYNC

**Specification ID:** SPEC-0003
**Feature:** Supabase auth, RLS schema, outbox sync, playlist import
**Status:** Outline — to be detailed after SPEC-0002 ships, using what Slice A teaches us about real data
**Depends on:** [SPEC-0002](../phase-1a-local-focus-room/spec.md)
**Governing ADRs:** [0002](../../docs/ADR/0002-data-access-and-rls.md) · [0006](../../docs/ADR/0006-youtube-provider-contract.md) · [0008](../../docs/ADR/0008-ingestion-execution-model.md) · [0009](../../docs/ADR/0009-pwa-and-offline.md) · [0011](../../docs/ADR/0011-nextjs-static-export-for-phase-1.md) · [0012](../../docs/ADR/0012-local-first-data-layer.md)

> This is deliberately an outline. Writing detailed ACs for server behaviour before Slice A exists would harden guesses. Decisions below are **locked**; items under "To specify" are not.

---

## 1. Locked decisions

| Topic | Decision |
|---|---|
| Source of truth | IndexedDB; Supabase is a replica (ADR 0012) |
| Guests | Local-only until sign-up; **no anonymous Supabase session** |
| Trigger | "Save your learning journey" → create account → backfill |
| Push | Outbox, idempotent (fixed client UUIDv7 ids), flushed on `online`, foreground, and a visible-tab timer |
| Pull | Per-table cursor on foreground/reconnect; **no Realtime** |
| Merge | Union by id; per-field rules (§2) |
| Deletes | Soft (`deletedAt`) |
| Auth providers | Google + email/password (COST.md: magic link deferred) |
| Playlist import | One Edge Function: batched `playlistItems.list` / `videos.list`, `QUOTA_LEDGER`, `search.list` banned |
| Service worker | Introduced here, designed **with** the outbox and update prompt (ADR 0009 §18.2) |

## 2. Merge rules

| Field | Rule |
|---|---|
| `furthestPositionSeconds` | `GREATEST` — never rewinds |
| `lastPositionSeconds` | Last-write-wins by server-assigned `updatedAt` |
| Concept completion | OR (once true, stays true); un-completion is an explicit later write with a newer `updatedAt` — **to specify** how this reconciles with OR |
| Notes | Per-note last-write-wins on server `updatedAt`; losing version kept in `NOTE_HISTORY` |
| Everything else | Union by id; same-row conflicts LWW by server `updatedAt` |

## 3. To specify (after SPEC-0002)

1. **Postgres schema and RLS** for the Phase 1 tables, derived from [`DATABASE.md`](../../docs/DATABASE.md) §1–5, with the RLS test per policy (ARCHITECTURE §21.3).
2. **Client-chosen id threat model.** `user_id` must default to `auth.uid()` and be unsettable by the client; an upsert on a colliding id must not touch or reveal another user's row. Needs explicit policy tests.
3. **Pull cursor correctness.** A plain `updated_at > cursor` can miss rows committed out of order. Specify a `(updated_at, id)` keyset with a small overlap window, and a test that replays out-of-order commits.
4. **Un-completion vs OR** (see §2).
5. **Backfill at sign-up:** batch size, resumability after interruption, progress UI, and the "signing in on a device with guest data and an existing account" union case.
6. **Sign-out and account switching** on a shared device: what happens to the local database (clear, keep, or namespace per user).
7. **Playlist Edge Function contract:** request/response shape, partial-failure list, quota-exhausted state, auth required or not.
8. **Service worker and update flow:** precache rules, "refresh to update" prompt, never swapping under an active Focus Room session.
9. **Account deletion** cascade and local-data handling (PRD §37).
10. **Supabase keepalive, backups, CI migrations** (COST.md operational items).

## 4. Preliminary AC headings

Auth and conversion · Backfill idempotency · Push/flush triggers · Pull cursor and out-of-order rows · Merge rules per field · Soft-delete propagation · RLS denial tests (owner, non-owner, anonymous-absent) · Playlist import and quota · Service worker update prompt · Account deletion · Guest-with-existing-account union · Offline write replay.
