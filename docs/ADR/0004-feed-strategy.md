# ADR 0004 — Single `ACTIVITY` table, not fan-out-on-write

**Status:** Accepted · **Date:** 2026-09-27

## Context

The previous architecture specified **fan-out on write**: when a user publishes, stars or forks a path, a trigger or worker inserts a `FEED_EVENT` row **for every follower**, so each user's feed is a materialised list readable in one indexed scan.

Its stated rationale — *"writes are relatively rare compared to feed reads"* — is a sound general principle. It is the wrong trade here for two specific reasons:

1. **The database budget is 500 MB.** Fan-out multiplies row count by follower count. One user with 5,000 followers publishing a path writes 5,000 rows for a single event. A handful of popular curators would consume the entire budget on feed rows — the exact resource this architecture is tightest on.
2. **PRD §25 explicitly asks for the opposite:** *"Initial feed ranking should be simple and explainable. Personalization can be introduced later."* Fan-out is the machinery you build when ranking gets sophisticated, not when it is chronological.

## Decision

One append-only `ACTIVITY` table. A follower's feed is a join.

```sql
create table activity (
  id          bigserial primary key,
  actor_id    uuid not null references profile(id) on delete cascade,
  verb        text not null,
  entity_type text not null,
  entity_id   uuid not null,
  created_at  timestamptz not null default now()
);
create index on activity (actor_id, created_at desc);
create index on activity (created_at desc);
```

```sql
select a.* from activity a
join follow f on f.followee_id = a.actor_id
join profile p on p.id = a.actor_id
where f.follower_id = auth.uid()
  and p.activity_visibility <> 'private'
  and (a.created_at, a.id) < ($1, $2)   -- keyset pagination
order by a.created_at desc, a.id desc
limit 30;
```

- **One row per event**, regardless of follower count.
- **Keyset pagination**, not `OFFSET`, so deep pages stay cheap.
- `activity_visibility` on `profile` is honoured in the query, satisfying PRD §37's requirement that users control the visibility of their learning activity.
- `activity` is **prunable beyond 90 days** and is the first table to trim when the size budget tightens.

## Alternatives rejected

| Alternative | Why not |
|---|---|
| **Fan-out on write** | Row count scales with follower count — the wrong shape for a 500 MB budget. Also has the classic "celebrity problem": a high-follower account creates a write storm. |
| **Hybrid** (fan-out for small follower counts, read-time for large) | Both code paths plus a threshold to tune, before any evidence that read-time is too slow. Premature. |
| **Materialised view per user** | Does not exist as a concept in Postgres, and would be worse than fan-out. |

## Consequences

**Accepted:**

- Feed reads do a join rather than a single-table scan. At the scale where this matters, the indexes above cover it; if it stops being true, the fix is measured rather than guessed.
- A user following thousands of accounts has a more expensive read. Acceptable, and unlikely in a learning product where follows are intentional.

**Gained:**

- **Storage proportional to events, not to events × followers.**
- No write amplification, so publishing stays fast and the celebrity problem does not exist.
- A new activity type is one enum value, not a fan-out job.
- Deleting a user's activity is `delete from activity where actor_id = …` rather than a hunt through every follower's materialised feed — which matters for PRD §37's account deletion.

## Revisit when

Feed read **P95 is measured** to degrade — not anticipated to. At that point the escalation is, in order:

1. Add a covering index on `(follower_id)` in `follow` joined against `activity(actor_id, created_at desc)`.
2. Cache the first page per user in a short-TTL table refreshed by `pg_cron`.
3. Fan-out on write **only** for accounts above a follower threshold, keeping read-time for everyone else.
