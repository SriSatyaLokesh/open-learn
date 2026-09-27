# ADR 0007 — Supabase anonymous sign-in for Guest Mode

**Status:** Accepted · **Date:** 2026-09-27

## Context

PRD §19 makes guest mode **a first-class experience**: a guest can import a playlist, paste links, reorder resources, watch in the Focus Room, take notes and see basic progress. The conversion moment is *"Save your learning journey."*

**The previous architecture did not mention guest mode once** — in 327 lines. That is a significant gap, because guest mode is the product's primary top-of-funnel and it touches nearly every table.

The default approach would be to keep guest state in `localStorage`/IndexedDB in a shape mirroring the server tables, then replay it into Postgres on first sign-in. That works, but it means a parallel client-side data model, a bespoke migration routine, and merge-conflict handling for the case where a user already has an account with overlapping data.

**Supabase anonymous sign-in** removes all of that. An anonymous user gets a real `auth.users` row and a real JWT immediately, so guest data is written to the normal tables under the normal RLS policies from the first action. Converting via `updateUser({ email })` or by linking an OAuth identity **preserves `auth.users.id`**, so everything carries over with **no migration code at all**.

## Decision

Guest mode is **Supabase anonymous authentication**. Guests are real users with a restricted capability set.

### Lazy session creation

The anonymous session is created on the guest's **first persisting action** — first import, first note — and **never on page load**.

This matters: anonymous users count toward the **50,000 MAU** free-tier cap. A visitor who reads a public path and leaves must not consume one. Since public pages are prerendered static files ([ADR 0001](./0001-hosting-and-rendering.md)), reading them involves no auth at all, which makes this natural rather than a special case.

### Capability gating in the database

Guests are restricted by **policy**, not by hidden buttons:

```sql
create or replace function is_guest() returns boolean
language sql stable as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;
```

`star`, `follow`, `group_member` and `certificate` carry `and not is_guest()` in their insert policies, and `learning_path` forbids setting `visibility = 'public'` while anonymous. This mirrors PRD §19's account-required list exactly:

| Guests can | Account required |
|---|---|
| Import, reorder, edit a path | Cross-device progress and history |
| Watch in the Focus Room | Streaks, badges |
| Take notes | Groups, follows, stars |
| See basic progress | Public publishing |
| | Certificates |

### Conversion

`supabase.auth.updateUser({ email })` or linking a Google identity. Same user id, same rows, nothing to migrate. The prompt is PRD §19's: **"Save your learning journey."**

## Alternatives rejected

| Alternative | Why not |
|---|---|
| **localStorage/IndexedDB then replay on signup** | A parallel client-side data model, a bespoke migration routine, and merge-conflict handling for users who already have data. All of it eliminated by anonymous auth. |
| **No guest mode** | Contradicts PRD §19, which makes it first-class. |
| **Server-side guest sessions with a cookie and no auth user** | Reinvents anonymous auth, and every RLS policy would need a second code path for "session-scoped but not user-scoped" rows. |

## Consequences

**Accepted:**

- **Anonymous users consume MAU.** Mitigated by lazy creation, but a spike in guest usage counts against the 50k cap. `COST.md` tripwire #6 says to check lazy-creation correctness first if MAU climbs unexpectedly — a bug there would inflate MAU with visitors who never saved anything.
- **Abandoned guest accounts accumulate.** A `pg_cron` job should prune anonymous users with no activity after a retention window. Needs a decision on the window; 30 days is the starting proposal.
- **Every policy must consider three actors**, not two: anonymous, authenticated, and service role. This is exactly the kind of thing the RLS test suite exists for ([ADR 0002](./0002-data-access-and-rls.md)).
- Anonymous sessions can be lost if the client's storage is cleared — there is no recovery, by definition. The UI must be honest that unsaved work is tied to the browser until an account exists. This is precisely what PRD §19's conversion prompt is for.

**Gained:**

- **Zero migration code**, and no merge-conflict logic.
- Guest data is protected by the same RLS policies as everyone else's from the first write — a guest's notes are not readable by another guest.
- Guest mode is genuinely first-class rather than a degraded parallel path, which is what PRD §19 asks for.
- Conversion is atomic and cannot half-fail, because nothing moves.

## Revisit when

- MAU pressure from anonymous sessions becomes real, in which case a client-side-only "demo mode" for pure browsing could precede session creation.
- Abandoned-account volume makes the pruning window a live question.
