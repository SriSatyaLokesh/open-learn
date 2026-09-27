# ADR 0002 — RLS is the authorization boundary; Drizzle for types and service-role work

**Status:** Accepted · **Date:** 2026-09-27

## Context

The previous architecture made two promises that cannot both hold:

- §3: Drizzle ORM for "type-safe queries".
- §13: *"Supabase Row Level Security (RLS) policies strictly separate private, group, and public paths."*

Drizzle over a direct Postgres connection authenticates as `postgres`, which owns the tables and carries `BYPASSRLS`. **RLS is skipped on every query and `auth.uid()` returns `NULL`.** The document never acknowledged this, so a contributor reading §13 would reasonably believe the database was enforcing access control when it was not.

This is a known failure mode, not a theoretical one. A public project filed *"P0: RLS is bypassed on 114/117 Supabase-touching API routes (service-role client)"* — precisely the bug class the ambiguity invites.

Two facts specific to OpenLearn make the database the right place for enforcement:

- **Supabase Realtime and Storage enforce access through their own RLS-style policies**, and any client-side use exposes the `anon` key to the browser by design. With RLS off, that key has no guard.
- The product has three visibility tiers (private / group / public) — exactly what RLS policies are designed for, and exactly the logic that gets subtly wrong when duplicated by hand in every write path.

A correction worth recording so this ADR argues from the right premise: Cloudflare Workers **can** open raw TCP connections to Postgres (`connect()` API), Cloudflare's own tutorial demonstrates `postgres.js` and `node-postgres`, and **Hyperdrive is free on Workers Free**. So this decision is about *where authorization is enforced*, not about what the runtime can technically reach.

## Decision

**The database is the security boundary.**

| Path | Client | RLS | Used for |
|---|---|---|---|
| User request | `supabase-js` with the user's JWT → PostgREST | **Enforced** | All user-scoped reads and writes |
| Edge Function / cron | Service role | **Bypassed, deliberately** | Ingestion, prerendering, certificates, sweeps, moderation |
| Schema & types | Drizzle Kit (`drizzle-kit pull`) | n/a | Type generation only |

Rules that make it hold:

1. **Every table has RLS enabled with a deny-by-default posture.** A table with no policy is inaccessible, not open.
2. **Service-role code never interpolates user input into a query** and never honours a user-supplied filter. Its inputs are ids already authorized by a prior RLS-enforced read, or its own scheduled scope.
3. **`storage.objects` and `realtime.messages` get their own policies.** RLS on application tables does not extend to them — a quiet and common mistake.
4. **Guests are constrained by policy**, via the `is_anonymous` JWT claim, not by hiding UI. See [ADR 0007](./0007-guest-mode.md).
5. **Every policy is tested.** An untested RLS policy is an unenforced one. This is the highest-value test suite in the project precisely because RLS *is* the authorization model.

### Migrations

**Supabase CLI plain-SQL migrations are the single source of truth** for DDL, RLS policies, triggers, functions and `pg_cron` job registration. The Drizzle schema is kept in sync via `drizzle-kit pull` and is used for types and service-role queries.

Drizzle Kit does not own migrations because it has no concept of `cron.schedule(...)`, and its policy/trigger support is newer — a Drizzle-Kit-owned pipeline would split the schema across two toolchains. Plain SQL keeps it in one directory, and `supabase start` then gives a contributor the entire system including policies and cron jobs.

### Connections

Pooling is required on the **first** deploy, not at "growth" scale:

- Supabase free allows **~60 direct** vs **~200 pooled** connections; each serverless invocation can open its own, so ~60 concurrent invocations exhausts the database — reachable from cold-start spikes alone.
- **Direct connections on Supabase free are IPv6-only**, which most serverless networks cannot reach at all.

Therefore: **Supavisor transaction mode, port 6543, `prepare: false`.** Direct/session mode (5432) only for CLI migrations in CI.

## Alternatives rejected

| Alternative | Why not |
|---|---|
| **Drizzle everywhere, authz in application code** | One missed ownership check is a cross-user data leak, with no database backstop. The 114/117 case is what this looks like in practice. Also cannot protect Realtime or Storage. |
| **Drizzle everywhere with RLS-scoped transactions** (`SET LOCAL ROLE` + JWT claims inside `db.transaction`) | Technically works and is a real community pattern. Rejected because a single plain `db.select()` outside the wrapper silently bypasses everything with no error — a footgun that gets worse with more contributors. It is also community-built infrastructure the project would own and maintain. |
| **Drop RLS, expose nothing to the client** | Would require giving up the Supabase client SDKs for Realtime and Storage, a larger change than the one being avoided. |

## Consequences

**Accepted:**

- Two query styles in the codebase. Mitigated by a clear rule: `supabase-js` in anything reachable by a user request; Drizzle only in `src/lib/db` and Edge Functions.
- Policy expressions carry some logic that a reader might expect in application code. Mitigated by keeping them in reviewed SQL migrations and by testing them.
- Transaction-mode pooling forbids prepared statements, `LISTEN/NOTIFY`, and cross-statement advisory locks. Documented because these surprise people.
- Denormalised `path_id` columns on `concept` and `resource` exist so policies need no multi-hop joins per row.

**Gained:**

- A missed check in application code is not a data leak.
- Realtime and Storage are protected by the same model.
- The authorization model is inspectable in one place — the migrations — rather than distributed across every write path.

## Revisit when

- A specific hot path is measured to be materially slower through PostgREST than a direct query, in which case that path (not the model) is reconsidered.
- Drizzle Kit gains full policy, trigger and cron support, which would reopen the migration-ownership question only.
