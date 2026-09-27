# OpenLearn — Architecture Review

**Reviewing:** `docs/ARCHITECTURE.md` (v1, 327 lines)
**Against:** `docs/OPENLEARN_PRD.md` (v0.1) and the project's stated hard constraints
**Date:** 27 September 2026
**Outcome:** `ARCHITECTURE.md` rewritten. See also `DATABASE.md`, `COST.md`, `YOUTUBE_INTEGRATION.md`, `ADR/`.

---

## 0. How to read this document

Every finding carries one of three verdicts:

| Verdict | Meaning |
|---|---|
| **KEEP** | Decision is correct. Recorded so the rewrite does not regress it. |
| **FIX** | Wrong, incomplete, or contradicts the PRD. Replacement given. |
| **CUT** | Complexity with no MVP payoff. Removed, with the condition that brings it back. |

Findings have IDs (`K`/`F`/`C`/`Y`/`CF`) so ADRs and commits can reference them.

Where a claim rests on an external fact — a free-tier limit, a platform policy — the source is cited. **No number in the rewritten architecture is asserted without a source.** That rule exists because v1 had two load-bearing numbers that were simply wrong, and both were used to justify design decisions.

---

## 1. Verdict summary

v1 is **well-organised and mostly well-reasoned**. Its data-normalisation core is genuinely good and survives unchanged. Its failures cluster in three places:

1. **It was written against the wrong constraints.** It assumes ~$50-100/month on Vercel + Next.js. The project requires **strictly $0** on **Cloudflare + R2 + Supabase**, as a **PWA**. That is not a hosting detail — it changes the rendering strategy and the framework.
2. **It contains no third-party policy analysis.** YouTube is the product's single critical dependency (PRD §40, §47), and v1 does not mention quota, data retention, or player requirements once. Six compliance defects follow, one of them in the data model.
3. **It is more complex than its own stated philosophy.** PRD §45 asks for a modular monolith with "no unnecessary microservices". v1 specifies 7 empty packages, 3 extra SaaS vendors, and a speculative Kafka/ElasticSearch tier.

| Category | Count |
|---|---|
| Decisions kept | 10 |
| Factual errors | 2 |
| YouTube compliance defects | 7 |
| Security / correctness defects | 3 |
| Data-model defects | 12 |
| PRD requirements missing entirely | 11 |
| Over-engineering items cut | 11 |
| External vendors | 7 → 4 |

---

## 2. KEEP — decisions the rewrite preserves

Recorded because a rewrite is the most likely moment to lose them.

### K1 — `VIDEO` / `RESOURCE` separation and the fork duplication boundary

The single best idea in v1. `VIDEO` is canonical third-party metadata, shared globally, never duplicated. `RESOURCE` is the *contextual usage* of that video inside one concept of one path — ordered, typed primary/alternative, duplicated when a path is forked.

Ten thousand forks produce ten thousand `RESOURCE` rows and exactly one `VIDEO` row. On a 500 MB free-tier Postgres, that is the difference between viable and not.

**Kept in full.** One word changes: v1 calls `VIDEO` *"immutable from the perspective of OpenLearn"*, which is a policy violation — see Y1.

### K2 — XP as an append-only event ledger

Matches PRD §21's "auditable event ledger" and PRD §47's gamification-abuse mitigation. Replayable, auditable, and lets scoring rules change without rewriting history. **Kept**, and strengthened: the ledger's `event_type` enum becomes the *enforcement mechanism* for YouTube incentive compliance (Y3).

### K3 — Provider adapter abstraction for ingestion

Implements PRD §11 and is the stated mitigation for PRD §47's top risk. **Kept**, with a narrowed interface — v1's `handleError(error: any): ProviderError` is not a useful contract, and `any` defeats the purpose of a typed seam.

### K4 — Recursive CTEs for fork lineage

Correct tool for an unbounded fork tree. **Kept**, plus cycle protection (F13) and a denormalised `root_path_id` so the common "all descendants" query needs no recursion at all.

### K5 — Focus Room local-first, debounced sync

IndexedDB heartbeat, `visibilitychange` flush, debounced server write. v1 explicitly rejected per-second WebSocket sync, and that rejection is the main reason Focus Room traffic fits a free tier. **Kept and extended** into the full offline outbox (F20).

### K6 — Deep copy over delta pointers for forks

Focus Room reads are hot; fork writes are rare. Right trade, and v1's reasoning ("storage is cheap; reads must be fast") is sound. **Kept**, execution changed from "async worker" to a `plpgsql` function (F14).

### K7 — Postgres full-text search before any search vendor

Matches PRD §33 verbatim. **Kept**, with an actual design added (F16) — v1 named `tsvector` and `pg_trgm` but specified nothing.

### K8 — `USER` (auth) separated from `PROFILE`

Mandatory with Supabase: `auth.users` is platform-managed and not yours to extend. **Kept.**

### K9 — SEO as first-class: server-rendered pages, JSON-LD `Course`, sitemaps

PRD §32 makes SEO a product feature and v1 treats it as one. **Kept**, but the *mechanism* changes completely — see CF3.

### K10 — The Trade-off Register with a "Revisit Condition" column

Rare and valuable. It is the artifact that makes this architecture re-openable by contributors instead of folklore. **Kept and extended** — it becomes the home for every CUT below.

---

## 3. FIX — factual errors

### F1 — "Cost: ~$50-100/month" contradicts the project's hardest constraint

v1 §14 budgets $50-100/month for MVP. The requirement is **strictly $0**.

Not a footnote to correct — it changes what the architecture is permitted to contain. Cost becomes a **tracked constraint with a budget table and tripwires** (`COST.md`), not an afterthought.

### F2 — "Prevents Vercel 10-60s timeout limits" is false, and the design it justified was wrong

v1's Trade-off Register lists ingestion as "Asynchronous from Day 1", rationale *"Prevents Vercel 10-60s timeout limits for large playlists"*, marked *"(Permanent architectural choice)"*.

Two problems:

1. **The number is wrong.** Vercel Hobby functions allow **300 s** ([Vercel functions limits](https://vercel.com/docs/functions/limitations)).
2. **The workload was never large.** `playlistItems.list` returns 50 items per call, so a 200-video playlist is ~4 API calls — a couple of seconds.

The justification for the most complex part of v1's ingestion design did not hold, and it was marked "permanent" on that false premise.

**Correct reasoning reaches a different answer anyway.** On Cloudflare Workers Free the ceiling is **10 ms CPU per invocation**, so ingestion cannot run in the host layer at *any* playlist size. It moves to a **Supabase Edge Function** (150 s, 500k invocations/month free) — invoked directly for ordinary imports, via `pgmq` for outliers.

Same destination, honest reasoning, and simpler than v1's queue + job table + Realtime subscription + "processing" UI state.

---

## 4. FIX — security and correctness defects

### F3 — Drizzle ORM and RLS, as specified, cannot both be true

v1 §3 promises Drizzle for "type-safe queries". v1 §13 promises *"Supabase Row Level Security (RLS) policies strictly separate private, group, and public paths."*

Drizzle over a direct Postgres connection authenticates as `postgres`, which owns the tables and carries `BYPASSRLS`. **RLS is skipped on every query and `auth.uid()` returns `NULL`.** The two sections describe mutually exclusive systems and the document never acknowledges it — so a contributor reading §13 would reasonably believe the database enforces access control when it does not.

Not hypothetical. A public project filed *"P0: RLS is bypassed on 114/117 Supabase-touching API routes (service-role client)"* — precisely the bug class this ambiguity invites.

Two further facts make RLS the right primary boundary for **this** product:

- **Supabase Realtime and Storage enforce access through their own RLS-style policies.** Any client-side use exposes the `anon` key to the browser by design. With RLS off, that key has no guard.
- RLS on application tables does **not** cover `storage.objects` or `realtime.messages`. Those need their own policies, written and tested separately — a point no version of the document made.

**Fix:** `supabase-js`/PostgREST for all user-scoped reads and writes, RLS enforced by the database. Drizzle for types plus admin/worker queries under the service role, where the bypass is deliberate, explicit, and confined to paths with no user input. See `ADR/0002`.

### F4 — Connection pooling listed as a "Growth (thousands of users)" concern

v1 §14 defers pooling to phase 2. On serverless that is wrong on the first deploy:

- Supabase free allows **~60 direct** vs **~200 pooled** connections. Each invocation can open its own, so ~60 concurrent invocations exhausts the database — reachable from cold-start spikes alone.
- Worse, **direct connections on Supabase free are IPv6-only**, which most serverless networks cannot reach at all.

**Fix:** Supavisor **transaction mode (port 6543)**, `prepare: false`, from day one. Direct/session mode (5432) only for CI migrations. Documented consequences: no prepared statements, no `LISTEN/NOTIFY`, no cross-statement advisory locks. See `ADR/0002`.

### F5 — `CERTIFICATE.verification_hash` is undefined

v1 specifies the field and nothing else — not what is hashed, not what signs it, not how verification proves anything. An unspecified hash is security theatre: a verifier recomputing a hash over public data proves nothing an attacker could not also compute.

**Fix:** specify the canonical payload, the HMAC key and its storage, and the verification procedure. The public `OL-CERT-XXXXX` code is the lookup key; the HMAC is the tamper check; the signing key lives in Edge Function secrets and never reaches the client. See `DATABASE.md`.

---

## 5. FIX — data-model defects

Not omissions — modelled incorrectly.

### F6 — `PROGRESS.last_position_seconds` is on the wrong entity

v1's `PROGRESS` is `(user_id, concept_id, path_id, status, last_position_seconds, completed_at)`.

PRD §14 puts learning state on the **concept**, but playback position belongs to a **specific video**. A concept with three alternative explanations — PRD §14's central feature — has one completion state and *three* playback positions. v1 cannot represent that.

**Fix:** split into `CONCEPT_PROGRESS` (completion state, `active_resource_id`) and `RESOURCE_PROGRESS` (per-resource position). Also isolates the Focus Room's high-frequency writes into one narrow table.

### F7 — `NOTE` has no `concept_id`

PRD §16 requires notes bound to timestamp, resource, **concept**, path and author. v1 has `resource_id` and `path_id` only. Without `concept_id`, a note cannot follow a learner who switches to an alternative explanation of the same concept.

### F8 — Course-level notes (PRD §17) are not modelled at all

PRD §17 describes a path-level Markdown document with objectives, summaries, references and code — a different object from a timestamped note. **Fix:** a separate `PATH_NOTE` table, chosen over a nullable-timestamp discriminator on `NOTE` because it keeps RLS policies simple and the two have different access patterns.

### F9 — `CATEGORY` cardinality contradicts itself within one section

v1's ERD says `LEARNING_PATH }o--|| CATEGORY` (many-to-one). Eight lines later the entity description gives `LEARNING_PATH` a `categories` field (plural). PRD §12 says "choose categories". **Fix:** many-to-many via `PATH_CATEGORY`. Plural wins.

### F10 — Fork lineage is modelled twice

v1's ERD has a `FORK` entity; its entity list puts `original_path_id` and `parent_version` on `LEARNING_PATH`. Both cannot be the source of truth. **Fix:** columns on `LEARNING_PATH` (`forked_from_path_id`, `root_path_id`); drop the `FORK` table. `root_path_id` makes "all descendants" a plain indexed query.

### F11 — No stable public ID and no SEO slug

PRD §12 requires an immutable shareable code (`OL-8F39A`); PRD §32 requires slug URLs (`/paths/machine-learning-foundations`). v1 has only `id`. Three different things with three different lifecycles.

**Fix:** `id uuid` (internal, FKs), `public_code text unique` (immutable, shareable), `slug text unique` (SEO, mutable with redirect history).

### F12 — Module and path progress rollup is undefined

PRD §18 requires module and path percentages on a dashboard. v1 stores only per-concept rows, so every dashboard load implies an aggregate scan. **Fix:** `USER_PATH` carries `concepts_total`, `concepts_completed`, `percent_complete`, maintained by trigger on `CONCEPT_PROGRESS`.

### F13 — Recursive lineage has no cycle protection

v1 §8 relies on recursive CTEs with no guard. A correction found during review and worth recording: **Postgres has no `max_recursive_depth` setting** — the core team explicitly rejected one. Protection must live in the query. **Fix:** `CYCLE` clause (PG14+) or an explicit depth counter, with `statement_timeout` as the backstop.

### F14 — Reorder strategy and fork-copy mechanism unspecified

- **Ordering:** v1 uses `order_index` integers, so every drag-and-drop move renumbers a range — multi-row writes and lock contention under concurrent edits. **Fix:** fractional / LexoRank-style `order_key text`. One row changes per move.
- **Fork copy:** v1 says "async worker". **Fix:** a `plpgsql` function called once via RPC inside a transaction. A single 4-level CTE chain with id remapping is possible but unreadable; this is atomic, one round trip, and a contributor can follow it.

### F15 — Leaderboards have no aggregate (and the first proposed fix was also wrong)

PRD §28 wants weekly / monthly / all-time / category / curator / contributor / group leaderboards. v1 has only `XP_LEDGER`.

Recorded honestly because it is instructive: the first fix proposed during this review was a maintained `USER_XP_ROLLUP` table. That was premature. **Actual fix:** window functions over the ledger at query time for MVP; materialised view + `pg_cron` `REFRESH ... CONCURRENTLY` when latency is *measured*; trigger-maintained aggregates only if near-real-time becomes a requirement. Escalation path documented rather than pre-built.

### F16 — Search is named, not designed

PRD §33 needs paths, users, categories, groups, concepts and resources in one result set. **Fix:** a denormalised `search_index` table fed by triggers, with a generated `tsvector` (weighted via `setweight`), a GIN index, `websearch_to_tsquery` so user input can never throw, and a `pg_trgm` GIN index for typo rescue. Ranked `ts_rank` then `similarity`. One index table, not a six-way `UNION ALL`.

### F17 — `LEARNING_PATH.status` includes `ai_suggested`

Contradicts PRD §6's non-goal: *"make AI the dependency of the core product."* AI is a P2 expansion (PRD §43). **Fix:** removed from the MVP enum.

---

## 6. FIX — PRD requirements absent from v1

| ID | PRD | Requirement | v1 state and fix |
|---|---|---|---|
| F18 | §19 | **Guest Mode, "a first-class experience"** | **Zero mentions in the entire document.** Now a named section. |
| F19 | §19 | Guest → account conversion | Absent. Supabase **anonymous sign-in** gives a real `auth.users` row and JWT immediately, so guest data lands in normal tables under normal RLS; conversion keeps the **same user id**, so data carries over with **zero migration code**. Two constraints: create the session **lazily** (first persisting action, never page load) because anonymous users count toward the 50k MAU cap; and gate publish/star/follow/certificates on the `is_anonymous` claim per PRD §19's account-required list. |
| F20 | owner | **PWA, offline, responsive** | Absent. Full section: outbox for notes/progress, service-worker rules, install UX, responsive Focus Room. |
| F21 | §47 | **Video availability** → "health checks, broken-resource states, replacement flows" | A PRD risk with no architecture. Now `resource.health_status` plus a batched `videos.list` sweep that doubles as the Y1 retention refresh. |
| F22 | §22, §41 | `BADGE`, `BADGE_AWARD`, `CHALLENGE` tables | Prose only (*"workers periodically scan the ledger"*). Now modelled. |
| F23 | §35, §36 | Moderation state machine + **audit log** | `REPORT` named in passing; no states, no audit table. PRD §36 requires audit logs from day one. Now `REPORT` with a status machine plus an append-only `MODERATION_ACTION`. |
| F24 | §34 | Notification **preferences** (channels and types) | Absent. Now `NOTIFICATION_PREFERENCE`. |
| F25 | §36, §37 | CSRF, brute-force, secrets, role separation, **account deletion**, privacy controls | 4 of 15 PRD §36 items covered. Now all 15, each with its $0 mechanism, plus a documented deletion cascade and `profile.activity_visibility`. |
| F26 | §38 | **Accessibility**, incl. keyboard alternative to drag/drop | Absent. Now a section; the keyboard-reorder requirement is a hard constraint on the Path Builder with stated acceptance criteria. |
| F27 | §45 | Automated tests, CI/CD, security checks | §17 covers local dev only. Now a testing section — **RLS policies especially**, since an untested policy is an unenforced one. |
| F28 | §27, §30, §41 | Group challenges / announcements / leaderboard; approved-course state; completion rules; user interests | Partially or not modelled. Certificates are *unimplementable* without `is_approved_course` and a completion-rule definition. |

---

## 7. CUT — over-engineering

v1 states "modular monolith first"; PRD §45 says "no unnecessary microservices". These items contradict that.

| ID | Cut | Why | Returns when |
|---|---|---|---|
| C1 | **Inngest / Trigger.dev** | A third vendor, dashboard, secret set and free tier, for jobs Postgres runs itself. Replaced by `pg_cron` + `pgmq` + Edge Functions — no new vendor, and it lives in `supabase/migrations`, so `supabase start` gives contributors the whole thing. | Jobs need >150 s, multi-day durable workflows, or a real retry dashboard. |
| C2 | **Upstash Redis for rate limiting** | Fourth vendor. Rate limiting itself is non-negotiable (PRD §36) — only the mechanism was over-chosen. A single `INSERT … ON CONFLICT DO UPDATE … RETURNING count` is atomic and race-free; measured ceiling ~15k req/s. | Measured contention, or limiter writes become a meaningful share of DB writes. |
| C3 | **Sentry** | Free plan allows **exactly 1 user** — unworkable for a multi-maintainer OSS project. PostHog free includes 100k error-tracking exceptions/month *and* unlimited seats, alongside the analytics v1 already wanted it for. One vendor removed, capability improved. | Error volume exceeds PostHog's tier, or Sentry-specific tooling is needed. |
| C4 | **Fan-out on write for feeds** | Multiplies rows by follower count — hostile to a 500 MB database. PRD §25 explicitly asks for a feed that is *"simple and explainable"*. Replaced by one append-only `ACTIVITY` table read via `join follows`. | Feed read P95 degrades at measured scale. |
| C5 | **7 empty packages on day 1** | 7 × package.json + tsconfig + build-graph edges before one feature exists. PRD §44 prescribes the *shape*, not that it be created empty. Highest-friction item for a first-time contributor. Replaced by `src/modules/{…}` with an ESLint import-boundary rule — same names, same boundaries, one build. | A second consumer exists — i.e. the P2 mobile app. |
| C6 | **§14's "Scale" tier: Kafka/Kinesis, ElasticSearch, multi-region, Redis state layer** | Speculation about 1M users that crowds out decisions that matter now. Compressed to measurable triggers in the Trade-off Register. | The named trigger metric fires. |
| C7 | **Supabase Realtime for notifications** | Free tier allows 200 concurrent connections; a socket per page view spends them on a badge count. Realtime kept only where it earns its keep (group/live surfaces); notifications fetch on navigation. | Concurrent-connection budget supports it. |
| C8 | **Vercel** | Superseded by the Cloudflare requirement. Removing it also removes Hobby's commercial-use clause — a real risk for a project that may accept sponsorship. | n/a |
| C9 | **Supabase Storage** | R2 is a project requirement and gives 10 GB with free egress vs Storage's 1 GB. Two blob stores would be one too many. **Consequence: R2 has no RLS**, so private objects need Edge-Function-signed URLs. | n/a |
| C10 | **Next.js / React / React Query / Zustand / `next/image`** | Cloudflare Workers Free caps CPU at **10 ms per invocation** (hard kill, Error 1102). React Server Component rendering routinely exceeds it, and `@opennextjs/cloudflare` has the most documented 1102 reports of any framework surveyed. With "guaranteed $0 headroom" prioritised over framework familiarity, React is out. Largest single change in the rewrite. | The project accepts Workers Paid ($5/mo). |
| C11 | **Async-from-day-1 ingestion machinery** (queue + job table + Realtime subscription + "processing" state as the default path) | Justified by a false premise (F2). Replaced by a single Edge Function invoked directly, with `pgmq` reserved for outliers. | Import volume makes direct invocation unreliable. |

---

## 8. FIX — YouTube policy: seven compliance defects

v1 mentions none of this. YouTube is the product's critical dependency (PRD §40), so these are architecture, not implementation detail. Full treatment in `YOUTUBE_INTEGRATION.md`.

### Y1 — The `VIDEO` table violates the 30-day data-retention rule

v1 calls `VIDEO` *"globally true and immutable from the perspective of OpenLearn"* and never refreshes it. YouTube Developer Policies III.E.4.d:

> *"API Clients may temporarily store limited amounts of Non-Authorized Data for as long as is necessary for the purposes of the API Client but not longer than **30 calendar days**."*

Cached `title`, `duration`, `channel_name` and `thumbnail_url` must be **refreshed or deleted** after 30 days. Storing them indefinitely is a violation — and non-compliant storage is a cited reason quota-extension audits are rejected.

**Fix:** `VIDEO.last_synced_at` plus a `pg_cron` sweep re-calling `videos.list` on stale rows.

The sweep is close to free, and this is the review's most useful single arithmetic observation: **`videos.list` costs 1 unit per 50 IDs regardless of how many `part`s are requested.** So requesting `snippet,contentDetails,status` in one call satisfies the retention refresh, the F21 health check, and the embeddable/region check **simultaneously**. Refreshing 10,000 videos costs ~200 units of a 10,000/day budget.

IDs are treated as permanently storable (a reference key the user pasted, not fetched descriptive content). Recorded as a **documented interpretation, not a guarantee** — the policy states no explicit carve-out.

### Y2 — Background / audio-only playback must never be built

Developer Policies III.I.9 prohibits playing content *"from a background player, meaning a player that is not displayed in the page, tab, or screen that the user is viewing."* Required Minimum Functionality additionally forbids **any overlay or element in front of or obscuring any part of the player, including its controls**, and sets a **minimum viewport of 200×200 px**.

Three architectural consequences, none previously written down:

- No "listen while you work" / audio-only / minimised-player mode, ever. Recorded as an explicit **non-goal**, because it is exactly the feature a focus-oriented learning product gets asked for.
- **The mobile Focus Room layout is policy-constrained**: a notes bottom sheet must **push** the player, never cover it.
- Autoplay only when >50% visible, one autoplaying player per page, and `mute=1` is required for mobile autoplay at all.

### Y3 — XP must be structurally incapable of rewarding watching

> *"Incentivize, reward, coerce, or provide compensation to users for watching a video. A user's decision to watch a video needs to be their own choice."*

v1 §9 claims compliance in prose. **Fix:** make it structural — `XP_LEDGER.event_type` is an enum of OpenLearn learning events with **no watch-duration-derived member possible**. The compliance boundary then lives in the schema rather than in marketing copy. Prohibited: "+50 XP for watching this video". Compliant: XP for marking a concept complete, finishing a path, writing notes, maintaining an activity streak.

### Y4 — Thumbnails must be hotlinked, not re-hosted

Do not copy thumbnail bytes into R2 or any CDN: III.E.1 restricts storing copies of YouTube content, and copies go stale when a creator changes them. Hotlink `https://i.ytimg.com/vi/{id}/hqdefault.jpg` — **zero API calls, zero storage, zero staleness**, including for `og:image`.

Convenient side effect: this also sidesteps Cloudflare Images, which is **not free beyond 5,000 transformations/month** (see CF6).

### Y5 — No advertising or sponsorship on or around the player

III.G.1.c forbids selling advertising, sponsorship or promotion placed on or within YouTube content or the player without written approval. Relevant because OpenLearn may take sponsorship: any sponsor placement must be structurally separate from the player surface.

### Y6 — Certificate attribution

Plain-text attribution only ("based on 'X' by Channel Y"). Do **not** place a creator's channel logo or likeness on a certificate — that is an endorsement/trademark exposure sitting *outside* the API terms, so nothing else in this review covers it. PRD §30 already handles the accreditation wording correctly.

### Y7 — Quota is a global shared resource, and v1 never mentions it

| Fact | Number |
|---|---|
| General daily quota | **10,000 units/day per Google Cloud project** |
| `playlistItems.list` | 1 unit / 50 items |
| `videos.list` | 1 unit / **50 IDs per call** |
| Effective cost per ingested video | **0.04 units** |
| Theoretical ceiling | ~250,000 videos/day |
| `search.list` | **Separate bucket, ~100 calls/day** (Google split this out on 1 June 2026) |
| `captions.list` | **50 units** — avoid |

Three consequences:

1. **Quota is per project, shared across every user of the deployment — not per user.** One large import, or an unthrottled refresh sweep, can starve everyone else for the rest of the day. Requires quota accounting, per-user ingestion rate limits, and a **priority rule: interactive imports outrank the background sweep**, which is skipped when the day's budget is low.
2. **`search.list` is banned in the adapter.** OpenLearn's input model is "user pastes a URL", so it is never needed, and ~100 calls/day would vanish instantly.
3. **Quota exhaustion is a designed state, not an error page.** Playback is *completely unaffected* — the IFrame player talks to YouTube directly and consumes no Data API quota. Only "add new content" and "refresh metadata" degrade. `quotaExceeded` (403) must not be retried; quota resets at midnight Pacific. `rateLimitExceeded` (429) is a separate short-window limit and gets exponential backoff with jitter.

There is **no paid tier for Data API quota** — extension is a trust decision via compliance audit, roughly 1-6 weeks, commonly rejected. So the system is designed to run on the default 10,000 units, and Y1/Y3/Y4 are prerequisites for ever passing that audit.

---

## 9. Cloudflare free-tier findings that shape the design

v1 assumed Vercel, so none of this was considered. Every number below is from Cloudflare's own documentation.

### CF1 — The 10 ms CPU limit is real, current, and a hard kill

Workers Free: **10 ms CPU per invocation**; Paid: 30 s, configurable to 5 minutes ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/)). Exceeding it returns **Error 1102** and terminates the request — no degrade mode ([Error 1102](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1102/)).

It is **CPU time only** — time awaiting `fetch` does not count. So database round trips are free; template rendering, JSON parsing and crypto are not. Cloudflare's own guidance notes the average Worker uses ~2.2 ms, and that *"heavier workloads that handle authentication, server-side rendering, or parse large payloads typically use 10-20 ms"* — Cloudflare itself flags SSR as limit-adjacent on Free.

### CF2 — Static asset serving is free and unlimited (the decisive fact)

> *"Requests to static assets are free and unlimited… There is no additional cost for storing Assets."*
> — [Workers Static Assets: billing and limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)

Cloudflare Pages uses identical language: a request is static when it does not invoke a Function ([Pages Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/)).

Only requests that *invoke the Worker script* count against the 100,000/day limit. **A static-first architecture is therefore unambiguously $0 for served-page traffic** — confirmed from primary docs, not inference. This is what makes the whole design work.

### CF3 — Prerender-on-publish into R2 is the right strategy for user-generated pages

Combining CF1 and CF2: pages that scale unboundedly must not render at request time.

**Chosen strategy.** When a path is published or edited, a Supabase Edge Function (150 s, no CPU ceiling) renders complete HTML — meta tags, Open Graph, JSON-LD `Course` — and writes it into R2. Cloudflare serves it as a static asset at **zero Worker CPU**. Nothing renders on the request path, so Error 1102 is structurally impossible for public traffic no matter how many paths exist.

Three implementation facts that matter:

- **Prerendered pages go in R2, not the build output.** Workers static assets cap at **20,000 files** on Free ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/)) — a hard ceiling on the number of public paths. R2 has no such cap. This detail decides where the artifacts live.
- **Worker routes take precedence over an R2 custom domain on the same hostname.** "Worker with R2 fallback" is not automatic; the Worker must explicitly `env.BUCKET.get(key)` and serve or 404.
- **R2 does not invalidate the CDN on overwrite.** Republishing a path needs a cache purge for that URL, or a short edge TTL.

Prior art for the render-once-serve-static pattern exists ([kotx/render](https://github.com/kotx/render), [cloudflare-workers-render-cache](https://github.com/mikaelvesavuori/cloudflare-workers-render-cache)).

### CF4 — Cloudflare's CDN does not cache HTML by default, and Free cannot fix it at scale

The CDN caches a published list of static extensions and **leaves HTML alone regardless of origin `Cache-Control`** ([default cache behavior](https://developers.cloudflare.com/cache/about/default-cache-behavior)). There are documented reports that modern Cache Rules fail to cache HTML reliably on Free, with the working fix being legacy Page Rules "Cache Everything" — and **Free includes only 3 Page Rules** ([Page Rules](https://developers.cloudflare.com/rules/page-rules/)).

Three rules cannot cover many distinct user-generated URL patterns. This independently rules out "server-render and hope the CDN caches it" and confirms CF3.

Good news on the same topic: **a Cache API hit does not invoke the Worker and consumes no CPU** ([Workers Cache](https://developers.cloudflare.com/workers/cache/)), so `caches.default` remains useful for the few genuinely dynamic routes.

### CF5 — R2 limits, and the one friction point worth flagging

10 GB storage, 1,000,000 Class A (write) operations/month, 10,000,000 Class B (read) operations/month, **egress free at any volume** ([R2 pricing](https://developers.cloudflare.com/r2/pricing/)).

**R2 requires a payment method on file even for free-tier use**, and past the free allowance it bills rather than blocking. So R2 is "$0 cost" but not "$0 friction", and it is the one place in this stack where overuse produces a bill instead of a hard stop. **Billing alerts are mandatory, not optional** — recorded in `COST.md`.

### CF6 — Two Cloudflare services that are not usefully free

- **Cloudflare Images / Transformations:** 5,000 unique transformations/month, then transforms fail with error 9422. Mitigation: no on-the-fly resizing — hotlink YouTube thumbnails (Y4) and pre-generate a small fixed set of sizes into R2 at publish time.
- **WAF Rate Limiting Rules: 1 rule on Free** ([rate limiting rules](https://developers.cloudflare.com/waf/rate-limiting-rules/)). Nowhere near enough for per-endpoint limits, which confirms C2's Postgres limiter as the real mechanism. The single edge rule is best spent as a coarse global abuse guard.

### CF7 — Free Cloudflare services worth adopting

- **Turnstile** — free CAPTCHA alternative. Directly serves PRD §36's brute-force and abuse requirements at $0, which v1 had no mechanism for.
- **Web Analytics** — free, unlimited, privacy-first, and does **not** consume the Worker request quota. Complements PostHog for traffic data without spending product-analytics events.
- **Durable Objects are available on Free** (SQLite-backed; only the older KV-backed backend needs Paid) — contrary to common assumption. Not needed for MVP; recorded so it is not wrongly ruled out later.
- **Cron Triggers:** 5 on Free, 1-minute minimum — but still bound by the 10 ms CPU limit, so scheduling stays in `pg_cron`.

### CF8 — Commercial use is permitted, and the old content restriction does not bite

Cloudflare's free plan explicitly permits commercial sites. The former ToS §2.8 "primarily HTML" clause was removed in 2023; the surviving CDN restriction is that video and large files may be served only when **hosted by a Cloudflare service**. Serving assets from **R2** is exactly the compliant path, so there is no exposure here — and this removes the sponsorship risk that Vercel Hobby carried (C8).

### CF9 — A correction to expectations: Drizzle *can* reach Postgres from a Worker

Cloudflare's TCP Socket API (`connect()`) allows outbound TCP, and Cloudflare's own tutorial demonstrates `postgres.js` and `node-postgres` from Workers. **Hyperdrive is free on Workers Free.**

This does not change the F3 decision — RLS-first stands on its own security merits — but it removes a wrong reason for it. Recorded so the ADR argues from the correct premise: the choice is about *where authorization is enforced*, not about what the runtime can technically connect to.

---

## 10. What replaced what

| Concern | v1 | v2 |
|---|---|---|
| Host | Vercel | **Cloudflare** (Workers + static assets) |
| Framework | Next.js + React | **SvelteKit** (see `ADR/0001b`) |
| Public page rendering | SSR / ISR at request time | **Prerendered on publish into R2**, zero request-time CPU |
| Blob storage | Supabase Storage (implied) | **Cloudflare R2** |
| Server compute | Next.js Server Actions | **Supabase Edge Functions** |
| Background jobs | Inngest / Trigger.dev | **`pg_cron` + `pgmq` + Edge Functions** |
| Rate limiting | Upstash Redis | **Postgres table** (+ Turnstile, + 1 edge rule) |
| Analytics + errors | PostHog + Sentry | **PostHog** (+ free CF Web Analytics) |
| Feed | Fan-out on write | **Single `ACTIVITY` table + `join follows`** |
| Authz boundary | Ambiguous (Drizzle vs RLS) | **RLS in the database**, explicitly |
| Repo | 7 packages | **`src/modules/` + ESLint boundaries** |
| Client | Web only | **PWA, offline outbox, responsive** |
| Guest mode | *(absent)* | **Supabase anonymous auth** |
| YouTube policy | *(absent)* | **`YOUTUBE_INTEGRATION.md`** |
| Cost | ~$50-100/mo | **$0, budgeted in `COST.md`** |
| Vendors | 7 | **4** |

---

## 11. Where this review is uncertain

Stated plainly so these are not mistaken for settled:

1. **YouTube ID retention.** The 30-day rule has no written carve-out for IDs. Treating them as permanent is the standard interpretation and defensible, but it *is* an interpretation.
2. **XP compliance.** Google publishes no ed-tech exception and no test cases. Tying rewards to in-app completion rather than watching is the furthest-from-the-line design available; it is risk management, not a guarantee. Worth confirming via the compliance audit if gamification becomes central.
3. **SvelteKit CPU headroom** rests on practitioner reports ("usually under 5 ms") plus one community thread showing a *single heavy server-side call* blowing the limit. Direction is clear, but the number is not from a Cloudflare benchmark. CF3 is what makes this safe regardless: public pages do not render at request time, so the framework's SSR cost only applies to authenticated routes that are never crawled and never viral.
4. **`svelte-dnd-action` labels its accessibility support beta.** It must be screen-reader tested rather than trusted. Fallback: explicit move-up/move-down controls, fully accessible and cheaper than building a drag library.
5. **Supabase-native jobs have a weaker retry/observability story** than Inngest. Accepted deliberately, mitigated by idempotent handlers and a dead-letter path from day one.
6. **No backups on Supabase free** (0-day retention; daily backups begin at Pro). "$0" here genuinely means "no managed backups". Mitigated by a nightly `pg_dump` from GitHub Actions — a real risk decision, not a deferred feature.
7. **Hyperdrive's exact free-plan query caps** are not stated in Cloudflare's own changelog; third-party figures exist but are unconfirmed. Irrelevant to the chosen design, which does not depend on Hyperdrive.
