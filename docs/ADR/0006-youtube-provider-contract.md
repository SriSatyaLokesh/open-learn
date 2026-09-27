# ADR 0006 — YouTube provider contract: quota budget, 30-day retention, player constraints

**Status:** Accepted · **Date:** 2026-09-27
**Detail:** [`../YOUTUBE_INTEGRATION.md`](../YOUTUBE_INTEGRATION.md)

## Context

YouTube is OpenLearn's critical external dependency (PRD §40, §47). The previous architecture **did not mention quota, data retention, or player requirements once.** That omission produced six policy defects, one of which was in the data model: the `VIDEO` table was described as *"globally true and immutable from the perspective of OpenLearn"* and was never refreshed.

Three facts had to be established before the design could be called correct:

1. **Quota is 10,000 units/day per Google Cloud project, shared across every user of the deployment** — not per user. There is **no paid tier**; an increase requires a compliance audit taking roughly 1-6 weeks that is commonly rejected.
2. **Developer Policies III.E.4.d caps storage of API-derived data at 30 calendar days**, after which it must be refreshed or deleted.
3. **Required Minimum Functionality constrains the player**: ≥200×200 px, never obscured, no background playback.

## Decision

Treat the YouTube integration as a **contract with explicit obligations**, documented in `YOUTUBE_INTEGRATION.md` and checkable in review.

### Quota

- **Design for the default 10,000 units.** Do not assume an extension will be granted.
- Cache-first; never re-fetch a fresh `video` row.
- Always batch **50 ids** per `videos.list`.
- **`search.list` is banned** — input is always a pasted URL, and its separate ~100 calls/day bucket would vanish on first use. `captions.list` is banned too, at 50 units per call.
- Account every call in `quota_ledger`.
- **Interactive imports outrank background work**, with a reserved floor so the refresh sweep can never consume the day's budget.
- `quotaExceeded` (403) is never retried before the midnight Pacific reset; `rateLimitExceeded` (429) gets exponential backoff with jitter.

### Retention

`video.last_synced_at` plus an hourly batched `pg_cron` sweep. Identifiers are stored indefinitely; **descriptive fields are refreshed or cleared within 30 days.** Thumbnails are never stored — they are derived from the id at render time.

**The sweep satisfies three requirements in one API call**, which is why it is affordable. `videos.list` costs 1 unit per 50 ids *regardless of how many `part`s are requested*, so `part=snippet,contentDetails,status` gives:

| Requirement | Field |
|---|---|
| 30-day retention | `snippet.title`, `snippet.channelTitle`, `contentDetails.duration` |
| Video availability (PRD §47) | ids **absent from `items`** are deleted or private |
| Embeddability | `status.embeddable` |
| Geo-blocking | `contentDetails.regionRestriction` |

**~200 units refreshes 10,000 videos.**

### Compliance made structural

Three obligations are enforced by the schema or the layout rather than by documentation:

| Obligation | Enforcement |
|---|---|
| No rewarding users for watching | `xp_ledger.event_type` is a `CHECK` constraint listing only OpenLearn learning events. No watch-duration value exists, and adding one needs a migration a reviewer would see. |
| Player never obscured, ≥200×200 | The responsive Focus Room layout **pushes** content rather than overlaying; no modal appears while the player is visible. |
| No copies of YouTube content | Thumbnails are hotlinked from `i.ytimg.com`; no bytes enter R2. |

### Adapter shape

`parse` (no network) is separated from `resolve` (batched, budgeted), and `resolve` returns a `Result` per item rather than throwing — so a 40-video import with 2 private videos is a partial success with a visible failure list, per PRD §11.

`ProviderError` is a discriminated union, replacing the previous `handleError(error: any)`. The caller must distinguish "retry later" from "this video is gone"; those lead to completely different user experiences.

## Alternatives rejected

| Alternative | Why not |
|---|---|
| Assume a quota extension | It is a trust decision, not a purchase, and commonly rejected. Designing on it is a single point of failure. |
| Store metadata indefinitely | Violates III.E.4.d and is a cited reason audits fail. |
| Re-host thumbnails in R2 | Restricted by III.E.1, goes stale when creators change them, and costs storage for nothing. |
| Scrape `ytInitialData` | Breaches YouTube's Terms of Service and would sink the compliance audit. |
| `noembed.com` | Unaffiliated third-party proxy; adds an uncontrolled dependency and grants no exemption from YouTube's rules. |
| Award XP for watch time | Directly prohibited. |

## Consequences

**Accepted:**

- **Quota is a shared global resource**, so a burst of imports can degrade the experience for everyone that day. Mitigated by per-user rate limits, accounting and the priority policy — but not eliminated.
- Metadata can be up to 30 days stale, so a renamed video may display its old title briefly. Acceptable, and required by the alternative being non-compliant.
- **No audio-only mode, ever.** Recorded as an explicit product non-goal, because it is precisely what a focus-oriented learning product will be asked for.
- Retaining identifiers indefinitely rests on an **interpretation** — the policy states no explicit carve-out for ids. Recorded as a risk in `ARCHITECTURE_REVIEW.md` §11.
- XP compliance rests on judgement: Google publishes no ed-tech exception and no test cases.

**Gained:**

- Quota exhaustion is a **graceful, designed state**: playback is entirely unaffected because the IFrame player consumes no Data API quota. Only "add content" and "refresh" degrade.
- The retention sweep doubles as the video-health mechanism PRD §47 asked for and v1 never built.
- The adapter seam means a second provider is additive, satisfying PRD §47's stated mitigation for provider risk.

## Revisit when

- A quota extension is granted, which would relax the budget policy but none of the compliance obligations.
- Captions become a product feature, at which point the 50-unit cost needs its own budget line.
- YouTube changes the retention window or the player requirements.
