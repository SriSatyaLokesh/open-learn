# OpenLearn — YouTube Integration and Provider Contract

YouTube is OpenLearn's critical external dependency (PRD §40, §47). This document is the compliance and quota contract. **v1 of the architecture did not mention any of it**, which produced six policy defects — one of them in the data model.

Treat this as reviewable: §7 is a checklist a PR reviewer can run.

**Authoritative sources**

- [YouTube API Services Terms of Service](https://developers.google.com/youtube/terms/api-services-terms-of-service)
- [Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
- [Required Minimum Functionality](https://developers.google.com/youtube/terms/required-minimum-functionality)
- [Branding Guidelines](https://developers.google.com/youtube/terms/branding-guidelines)
- [Quota costs](https://developers.google.com/youtube/v3/determine_quota_cost)
- [IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)

---

## 1. Quota

### 1.1 The numbers

| Method | Cost | Page size |
|---|---|---|
| `playlistItems.list` | 1 unit | 50 max |
| `videos.list` | 1 unit | **50 ids per call** (51+ fails) |
| `playlists.list` | 1 unit | 50 max |
| `channels.list` | 1 unit | 50 max |
| `search.list` | **Separate bucket, ~100 calls/day** | 50 max |
| `captions.list` | **50 units** | — |

General daily quota: **10,000 units/day**.

### 1.2 The two facts that shape the design

**Quota is per Google Cloud project, shared across every user of the deployment.** It is not per user. One person importing a large library, or an unthrottled background sweep, can exhaust the day's budget for everybody. This is the fact v1 was missing, and it is why quota accounting is architecture rather than an implementation detail.

**Cost does not scale with `part` count.** `videos.list` costs 1 unit per call regardless of whether you request one `part` or three. This is the most useful arithmetic in this document, because it means one call can satisfy three separate requirements at once (§3).

### 1.3 Effective cost

Ingesting a playlist:

```
playlistItems.list   1 unit  → 50 video ids
videos.list          1 unit  → metadata for those 50
                     ───────
                     2 units per 50 videos = 0.04 units/video
```

Theoretical ceiling on the default quota: **~250,000 videos/day**. The budget is generous for the actual workload — the risk is not the arithmetic, it is an unbudgeted background job competing with live users.

### 1.4 Budget policy

1. **Cache first.** Never call the API for a video already in `video` and within the freshness window.
2. **Always batch 50.** Never call `videos.list` with fewer ids than are pending.
3. **`search.list` is banned.** Input is always a user-pasted URL, so search is never needed. Its separate ~100 calls/day bucket would vanish on first use. Enforced by code review — see §7.
4. **`captions.list` is banned** unless captions become a feature. At 50 units it costs 25× a metadata call.
5. **Account every call** in `quota_ledger` (`day`, `provider`, `units_used`).
6. **Interactive imports outrank background work.** The refresh sweep checks remaining budget and yields — a user pasting a playlist must never fail because a cron job spent the day's quota.
7. **Reserve a floor** (e.g. 20%) for interactive imports so the sweep can never consume the entire budget.

### 1.5 Exhaustion is a designed state

When quota runs out:

- **Playback is completely unaffected.** The IFrame player talks to YouTube directly and consumes **no Data API quota**. Every existing learning path keeps working in full.
- Only two things degrade: adding new content, and refreshing metadata.
- The UI says so plainly — "we can't add new videos right now, try again later today" — never a 500.

That is a genuinely graceful failure mode, but only if it is designed for.

| Error | HTTP | Handling |
|---|---|---|
| `quotaExceeded` | 403 | **Do not retry.** Quota resets at midnight Pacific. Mark the provider degraded and surface the state. |
| `rateLimitExceeded` / `userRateLimitExceeded` | 429 | Short-window limit. Exponential backoff with jitter. |
| `videoNotFound` | 404 / absent from `items` | Mark the resource broken (§3). |
| 5xx | 5xx | Backoff with jitter, capped retries, then defer. |

### 1.6 Quota extension

There is **no paid tier.** An increase requires the [Audit and Quota Extension Form](https://support.google.com/youtube/contact/yt_api_form), takes roughly 1-6 weeks, and reviews **compliance**, not need. Common rejection reasons include scraping-shaped use cases, missing privacy policy or terms, and — directly relevant — **non-compliant data storage**.

Therefore: **the system is designed to run on the default 10,000 units**, and §2, §4 and §5 are prerequisites for ever passing that audit.

---

## 2. Data retention — the defect that was in the schema

v1 described the `VIDEO` table as *"globally true and immutable from the perspective of OpenLearn"* and never refreshed it.

> **Developer Policies III.E.4.d** — *"API Clients may temporarily store limited amounts of Non-Authorized Data for as long as is necessary for the purposes of the API Client but not longer than **30 calendar days**."*

OpenLearn uses an API key with no user OAuth, so everything it fetches is **Non-Authorized Data**. Storing `title`, `channel_name` and `duration_seconds` indefinitely with no refresh is a violation.

The policies also require that *"API Clients must use reasonable efforts to ensure that their stored API Data is consistent with the current data available through YouTube API Services."*

### 2.1 What may be stored, and for how long

| Data | Retention | Basis |
|---|---|---|
| `provider_video_id`, playlist id, channel id | **Indefinite** | An identifier the user supplied, not fetched descriptive content. **Documented interpretation — the policy states no explicit carve-out for ids.** |
| `title`, `channel_name`, `duration_seconds`, `embeddable`, `region_blocked` | **≤30 days, then refresh or clear** | III.E.4.d |
| Thumbnail **image bytes** | **Never stored** | III.E.1 restricts storing copies of YouTube content |
| Thumbnail **URL** | Not stored either — derived from the id at render time | Simpler and always current |
| View counts / statistics | Not stored at all | Would fall under III.E.4.b and is not needed |

### 2.2 Implementation

`video.last_synced_at` plus the hourly sweep in §3. A row past the window is refreshed; if the video no longer exists, descriptive fields are cleared and `availability` is set.

The interpretation about ids is recorded as a **risk, not a certainty**, in `ARCHITECTURE_REVIEW.md` §11.

---

## 3. One call, three requirements

The sweep is the single most efficient thing in this integration, because `videos.list` costs 1 unit per 50 ids with any `part` combination:

```
GET /youtube/v3/videos
  ?part=snippet,contentDetails,status
  &id=<50 comma-separated ids>
```

| Requirement | Satisfied by |
|---|---|
| **30-day retention** (§2) | `snippet.title`, `snippet.channelTitle`, `contentDetails.duration` |
| **Video availability** (PRD §47) | Ids **absent from `items`** are deleted or private |
| **Embeddability** | `status.embeddable` |
| **Geo-blocking** | `contentDetails.regionRestriction.allowed` / `.blocked` |

**Refreshing 10,000 cached videos costs ~200 units** of a 10,000/day budget.

### 3.1 Availability detection

There is no "deleted" status for a non-owner. A deleted or private video simply **does not appear in the response**, so detection is diffing requested ids against returned ids.

| Signal | State |
|---|---|
| Absent from `items` | `availability = 'unavailable'` |
| `status.embeddable = false` | `availability = 'embed_disabled'` |
| `regionRestriction` present | `availability = 'geo_blocked'`, restrictions stored |

Runtime signals from the IFrame player complement this: error **101**/**150** (embedding disallowed), **100** (removed or private), **2** (malformed id). Both paths write `resource.health_status`.

A broken resource enters a **replacement flow** — the path owner is prompted to swap it, and learners see a clear broken state rather than a silently dead player. This is PRD §47's stated mitigation, which v1 left unimplemented.

### 3.2 Cheap alternatives, and one to avoid

| Option | Quota | Compliant | Gives |
|---|---|---|---|
| `i.ytimg.com/vi/{id}/hqdefault.jpg` | **None** | Yes — official YouTube CDN, derivable from the id | Thumbnail, no API call |
| `youtube.com/oembed` | **None** | Yes — official endpoint | title, `author_name`, thumbnail. **No duration, no embeddable status.** Useful as a quota-pressure fallback for a title refresh only. |
| IFrame `getDuration()` | None | Yes | Duration, but only after a user has loaded that specific video — cannot prefetch a playlist |
| `noembed.com` | None | Third-party proxy, unaffiliated with Google | Same shape as oEmbed. **Not a dependency** — it adds an uncontrolled intermediary and grants no exemption from YouTube's rules. |
| Scraping `ytInitialData` | None | **No — breaches YouTube's Terms of Service** | Everything. **Never used.** It would also sink the compliance audit in §1.6. |

---

## 4. Gamification — the rule and how the schema enforces it

> *"Incentivize, reward, coerce, or provide compensation to users for watching a video. A user's decision to watch a video needs to be their own choice."*
> Also: *"you must not offer or provide incentives, rewards, or other compensation to users for engaging with YouTube Applications… by performing actions like viewing content, liking content, sharing content, subscribing to channels, adding comments."*

v1 §9 asserted compliance in prose. Prose is not a control.

**The control is a `CHECK` constraint.** `xp_ledger.event_type` is a closed set of OpenLearn learning events:

```sql
check (event_type in (
  'concept_completed','path_completed','note_created',
  'path_published','path_forked','streak_day','challenge_completed'))
```

No member is derived from watch duration, and **adding one would require a migration a reviewer would see.** That is meaningfully stronger than a style guide.

| Prohibited | Compliant |
|---|---|
| XP for watch time or percentage watched | XP for marking a concept complete |
| "+50 XP for watching this video" | "+50 XP for completing this concept" |
| "Watch 3 videos to unlock a badge" | "Complete 3 concepts to unlock a badge" |
| Leaderboards ranked on minutes watched | Leaderboards ranked on completions and contributions |

This extends to **user-facing copy**, which is part of compliance, not marketing polish: reward language refers to *completing* and *learning*, never to *watching*. PRD §28's "scoring must be transparent and must not be based simply on rewarded YouTube engagement" says the same thing.

**Honest caveat:** Google publishes no ed-tech exception and no test cases. Tying rewards to in-app completion is the furthest-from-the-line design available; it is risk management, not a guarantee. If gamification becomes central to the product, confirm via the compliance audit.

---

## 5. Player requirements

From Required Minimum Functionality and Developer Policies III.I. These are **architecture constraints**, not styling preferences — they shape the responsive layout in `ARCHITECTURE.md` §18.4.

| Requirement | Consequence for OpenLearn |
|---|---|
| **Viewport ≥200×200 px** | No breakpoint or panel resize may shrink the player below this. Checked at 360 px width. |
| **No overlay or element in front of or obscuring any part of the player, including controls** | The Focus Room's notes sheet **pushes** the player, never covers it. No modal is presented while the player is visible. |
| **No background player** (III.I.9) | **No audio-only or minimised-playback mode, ever.** An explicit product non-goal. |
| Player must be the official player, unmodified beyond documented parameters | No custom control bar, no replaced scrubber. |
| Links in the player (title, channel, "Watch on YouTube") must not be removed, obscured, altered or disabled | The Focus Room does not hide player chrome. |
| Autoplay only when >50% of the player is visible; one autoplaying player per page | Lesson advance respects visibility. |
| **No ads or sponsorship on or within the player** (III.G.1.c) | Any sponsor placement is structurally separate from the player surface. |
| YouTube must be identifiable as the content source, per Branding Guidelines | Channel name and a link back are shown wherever a video appears. |
| `modestbranding` is deprecated and has no effect | Do not use it; do not promise a chrome-free player. |

Two further practical notes:

- **`mute=1` is required for autoplay on mobile.** Unmuted autoplay fails silently in Safari and Chrome.
- **`playsinline=1` is required, and is not always sufficient on iOS** — an installed PWA can still force fullscreen, and this has been reported to lock up the surrounding app. Test in installed-standalone mode specifically, and keep a reachable escape control.

### 5.1 Advertising wording

PRD §40 already gets this right and it is repeated here because it is easy to regress in marketing copy:

> **"Ad-free OpenLearn interface"** — correct.
> "No ads" / "ad-free videos" — **false and prohibited.** OpenLearn cannot suppress YouTube's own embedded advertising and must not imply otherwise.

---

## 6. Provider adapter

The abstraction exists because PRD §47 names YouTube dependency as the top product risk.

```ts
interface ContentProvider {
  readonly id: 'youtube';

  /** Cheap, synchronous, no network: does this URL belong to this provider? */
  canHandle(url: URL): boolean;

  /** Extract candidate references from a URL or pasted text. No network calls. */
  parse(input: string): ResourceRef[];

  /** Resolve metadata in batches, respecting the quota budget. */
  resolve(
    refs: ResourceRef[],
    budget: QuotaBudget,
  ): Promise<Result<NormalizedVideo, ProviderError>[]>;
}

type ResourceRef =
  | { kind: 'video';    providerVideoId: string }
  | { kind: 'playlist'; providerPlaylistId: string };

interface NormalizedVideo {
  providerVideoId: string;
  title: string;
  channelName: string;
  durationSeconds: number;
  embeddable: boolean;
  regionBlocked: string[];
}

type ProviderError =
  | { kind: 'quota_exhausted'; retryAfter: Date }
  | { kind: 'rate_limited';    retryAfter: Date }
  | { kind: 'not_found' }
  | { kind: 'not_embeddable' }
  | { kind: 'geo_blocked'; regions: string[] }
  | { kind: 'transport'; status: number };
```

Three deliberate differences from v1's interface:

1. **`parse` is separated from `resolve`.** URL extraction needs no API key and no network, so it is fully testable offline — which is what makes the "clone and run with no credentials" promise (PRD §44) achievable.
2. **`resolve` returns a `Result` per item**, not a throw. A 40-video import where 2 videos are private is a **partial success with a visible failure list**, per PRD §11's "show failures clearly", not an all-or-nothing error.
3. **`ProviderError` is a discriminated union**, not v1's `handleError(error: any): ProviderError`. `any` defeats the purpose of a typed seam, and the caller needs to distinguish "retry later" from "this video is gone" — they lead to completely different user experiences.

### 6.1 Mock adapter

`src/modules/youtube/mock.ts` implements the same interface against fixtures. It is the default in local development, so a contributor needs **no Google Cloud project and no API key** to run OpenLearn.

### 6.2 URL normalisation

Handled in `parse`, with fixtures for each form: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/`, `youtube.com/shorts/`, `youtube.com/playlist?list=`, `watch?v=…&list=…` (both a video and a playlist reference), `m.youtube.com`, and URLs carrying tracking parameters or a `t=` timestamp.

### 6.3 Ingestion security (PRD §36, §47)

Arbitrary URL ingestion is the product's most security-sensitive input.

- **Provider allowlist.** Only hosts a registered adapter claims are fetched. There is no generic "fetch any URL" path.
- **SSRF protection.** Resolved IPs are checked against private, loopback, link-local and metadata ranges before any request; redirects are re-validated at each hop; redirect count is capped.
- **Timeouts and response size caps** on every outbound call.
- **Rate limiting** per user and per IP on the ingestion endpoint (`rate_limit` table), plus Cloudflare Turnstile on the import form.
- **Pasted text is bounded** in length and in the number of extracted references per request.
- Ingestion runs **only** in a Supabase Edge Function, never in the browser and never in the host Worker — a single isolated egress point, which is what PRD §36 means by "must be isolated".

---

## 7. Compliance checklist

Run against any PR touching ingestion, the player, gamification or the `video` table.

**Quota**

- [ ] No `search.list` call anywhere in the codebase.
- [ ] No `captions.list` call (unless captions are a shipped feature).
- [ ] `videos.list` is always batched to 50 ids.
- [ ] Every API call records units in `quota_ledger`.
- [ ] Background jobs check remaining budget and yield to interactive work.
- [ ] `quotaExceeded` (403) is never retried before the Pacific-midnight reset.

**Retention**

- [ ] `video.last_synced_at` is written on every refresh.
- [ ] The sweep is scheduled and covers every row within the 30-day window.
- [ ] No thumbnail bytes are stored anywhere, including R2.
- [ ] Thumbnails are derived from `provider_video_id` at render time.
- [ ] No view counts or statistics are persisted.

**Player**

- [ ] Player is ≥200×200 at every breakpoint, including 360 px width.
- [ ] Nothing overlays the player — no sheet, modal, toast or badge.
- [ ] No audio-only, background or minimised playback mode exists.
- [ ] `playsinline=1`; `mute=1` wherever autoplay is used.
- [ ] Tested in installed-standalone PWA mode on iOS, not only in a Safari tab.
- [ ] Player chrome and its links are unmodified.
- [ ] No ad or sponsor element touches the player's bounding box.

**Gamification**

- [ ] No new `xp_ledger.event_type` derived from watch duration.
- [ ] No user-facing copy rewards *watching* — only completing, learning, contributing.
- [ ] Leaderboards rank completions and contributions, not minutes watched.

**Attribution**

- [ ] Channel name and a link back to YouTube appear wherever a video is shown.
- [ ] Certificates use plain-text attribution only — no channel logos or likenesses.
- [ ] No copy implies YouTube endorsement, partnership, or that OpenLearn removes YouTube's ads.

**Security**

- [ ] Ingestion runs only in an Edge Function.
- [ ] SSRF checks run before every fetch and on every redirect hop.
- [ ] Rate limit and Turnstile are enforced on the import endpoint.
