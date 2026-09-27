# OpenLearn — Cost Model

**Target: $0.00/month.** Not "cheap". Zero.

This file exists because the previous architecture budgeted "~$50-100/month" for MVP, which contradicted the project's hardest constraint. Cost is treated here as a **tracked constraint with tripwires**, not an estimate.

**Rule: no number in this file without a source link.** If a limit cannot be verified, it is marked unverified.

---

## 1. The stack and its free tiers

Four vendors. Every earlier candidate that added a fifth was removed — see `ARCHITECTURE_REVIEW.md` §7.

### Cloudflare

| Resource | Free limit | What consumes it | Source |
|---|---|---|---|
| **Static asset requests** | **Free and unlimited** | Every public page view (they are prerendered files) | [static assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) |
| Static asset file count | **20,000 files** | Build output only — prerendered pages live in R2 instead, precisely to avoid this ceiling | [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) |
| Worker requests | 100,000/day | Only requests that invoke the script: API routes, sitemap, the R2 fallback route | [Pages Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/) |
| **Worker CPU** | **10 ms per invocation (hard kill, Error 1102)** | Synchronous work only — `fetch` wait time does not count | [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Error 1102](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1102/) |
| Worker bundle size | 64 MiB uncompressed (both plans, since 2026-09-04) | Build output | [changelog](https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/) |
| Pages builds | 500/month, 20 min each, 1 concurrent | CI deploys | [Pages limits](https://developers.cloudflare.com/pages/platform/limits/) |
| Cron Triggers | 5/account, 1 min minimum | Unused — scheduling lives in `pg_cron` (still subject to the 10 ms cap) | [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) |
| WAF rate-limiting rules | **1 rule** | One coarse global abuse guard | [rate limiting rules](https://developers.cloudflare.com/waf/rate-limiting-rules/) |
| Turnstile | Free | CAPTCHA on signup and ingestion | [Turnstile](https://developers.cloudflare.com/turnstile/) |
| Web Analytics | Free, unlimited, does not touch the Worker quota | Traffic stats | [Web Analytics](https://developers.cloudflare.com/web-analytics/about/) |

### Cloudflare R2

| Resource | Free limit | What consumes it | Source |
|---|---|---|---|
| Storage | 10 GB-month (Standard class) | Prerendered HTML, certificate images, OG images, avatars, DB backups | [R2 pricing](https://developers.cloudflare.com/r2/pricing/) |
| Class A ops (writes) | 1,000,000/month | Publishing/editing a path, generating a certificate, nightly backup | same |
| Class B ops (reads) | 10,000,000/month | Serving prerendered pages and assets | same |
| **Egress** | **Free at any volume** | — | same |

### Supabase

| Resource | Free limit | What consumes it | Source |
|---|---|---|---|
| Database | 500 MB | All relational data | [pricing](https://supabase.com/pricing) |
| Egress | 5 GB + 5 GB cached | API reads | same |
| MAU | 50,000 | Signed-in users **including anonymous guest sessions** | same |
| Realtime | 200 concurrent connections, 2M messages/month | Group/live surfaces only | same |
| Edge Functions | 500,000 invocations/month, **150 s** each | All server-side compute | [function limits](https://supabase.com/docs/guides/functions/limits) |
| Connections | ~60 direct / ~200 pooled | Must use the pooler | [pooling](https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits) |
| Auth email (built-in) | **~2 emails/hour** | Why magic link is deferred | [auth SMTP](https://supabase.com/docs/guides/auth/auth-smtp) |
| Backups | **None (0-day retention)** | — | [pricing](https://supabase.com/pricing) |
| Project pausing | **Paused after 7 days inactivity** | — | [free project pausing](https://supabase.com/docs/guides/platform/free-project-pausing) |

### PostHog and GitHub

| Resource | Free limit | Source |
|---|---|---|
| PostHog analytics events | 1,000,000/month | [pricing](https://posthog.com/pricing) |
| PostHog error tracking | 100,000 exceptions/month | same |
| PostHog seats | Unlimited (this is why Sentry was dropped — its free plan allows 1 user) | same |
| GitHub Actions (public repo) | **Unlimited minutes** | [Actions billing](https://docs.github.com/billing/managing-billing-for-github-actions/about-billing-for-github-actions) |

### YouTube Data API

| Resource | Free limit | Source |
|---|---|---|
| General quota | **10,000 units/day per Google Cloud project — shared across all users** | [quota costs](https://developers.google.com/youtube/v3/determine_quota_cost) |
| `search.list` | Separate bucket, ~100 calls/day — **banned in our adapter** | [getting started](https://developers.google.com/youtube/v3/getting-started) |

There is **no paid tier for Data API quota**. See `YOUTUBE_INTEGRATION.md`.

---

## 2. Why this stays at $0 structurally

The design does not merely fit inside the free tiers — it removes the unbounded resource from the metered path entirely.

**Public traffic is the thing that grows without limit.** Public pages are prerendered into R2 on publish and served as static assets. Static asset requests are free and unlimited, and R2 egress is free at any volume. So **a public page going viral consumes no metered resource at all.** No Worker invocation, no CPU, no bandwidth charge.

What remains metered scales with *active users*, not *visitors*:

| Metered resource | Scales with |
|---|---|
| Worker requests (100k/day) | API calls from signed-in users |
| Edge Function invocations (500k/mo) | Imports, publishes, scheduled jobs |
| Database size (500 MB) | Stored paths, notes, progress |
| MAU (50k) | Signed-in and guest users |
| YouTube quota (10k/day) | New content imported |

---

## 3. Tripwires — the first things that break

Ranked by what a growing project hits soonest. Each has an owner action, not just a number.

| # | Tripwire | Warning sign | Action |
|---|---|---|---|
| 1 | **Supabase project pauses after 7 days inactivity** | Site down; API returns errors | **Prevented, not monitored**: a daily GitHub Actions cron pings a health endpoint. This is the single most likely "why is the site down" incident for a quiet project — it is in the README, not buried here. |
| 2 | **R2 requires a card on file and bills past the free allowance** | Any R2 line item above $0 | **Billing alert configured at $0.01.** This is the only resource in the stack that produces a bill rather than a hard stop. |
| 3 | **YouTube quota exhausted mid-day** | `quotaExceeded` 403s; imports failing | Designed degradation: playback is unaffected, only imports/refresh stop. Quota accounting table + the refresh sweep yields to interactive imports. Do not retry until midnight Pacific. |
| 4 | **Supabase DB approaching 500 MB** | >400 MB | Check `ACTIVITY` and `XP_LEDGER` first — append-only tables grow fastest. Add retention windows (`ACTIVITY` older than 90 days is prunable; XP ledger is not, it is the audit record). |
| 5 | **Worker requests approaching 100k/day** | >70k/day | Something dynamic is being hit that should be static. Audit which routes invoke the script; most should not. |
| 6 | **MAU approaching 50k** | >40k | Check anonymous-session creation first — guest sessions must be created lazily on first *persisting* action, never on page load. A bug there inflates MAU with visitors who never saved anything. |
| 7 | **Realtime concurrent connections near 200** | >150 | A page is opening a socket it does not need. Realtime is for group/live surfaces only; notifications fetch on navigation. |
| 8 | **Edge Function invocations near 500k/mo** | >350k | Usually a `pg_cron` job running more often than it needs to. |
| 9 | **PostHog events near 1M/mo** | >700k | Sample non-critical client events; keep the north-star funnel unsampled. |
| 10 | **Cloudflare Pages builds near 500/mo** | >350 | Batch deploys; do not deploy per commit on `main`. |

---

## 4. Accepted risks of being free

Honest list. These are decisions, not oversights.

| Risk | Why accepted | Mitigation |
|---|---|---|
| **No managed database backups** | Daily backups begin at Supabase Pro ($25/mo) | Nightly `pg_dump` from GitHub Actions (unlimited for public repos), encrypted, written to R2. Restore procedure documented and **tested**, since an untested backup is not a backup. |
| **No uptime SLA** | Free tiers on both Cloudflare and Supabase | Status page; the prerendered-in-R2 design means public pages survive a Supabase outage entirely — a genuine resilience benefit of the architecture, not just a cost one. |
| **Single Postgres, no read replica** | Replicas are paid | Read load is small by design: public pages never query the database at request time. |
| **No magic-link auth at launch** | Built-in sender allows ~2 emails/hour, and every free provider needs a verified domain | Google OAuth + email/password at launch. Documented deviation from PRD §20 with a re-enable path. |
| **10 ms CPU on any dynamic route** | Workers Free | Public pages do not render at request time, so this only constrains authenticated API routes, which are thin JSON. |
| **YouTube quota is shared globally** | No paid tier exists | Cache-first, batch by 50, `search.list` banned, per-user rate limit, priority policy. |

---

## 5. What paying would buy, in priority order

Recorded so the first dollar, if ever spent, goes to the right place — and so nobody pays for the wrong thing first.

| Priority | Spend | Buys | Trigger |
|---|---|---|---|
| 1 | **Supabase Pro — $25/mo** | Daily backups (7-day retention), no project pausing, 8 GB DB, higher connection limits | Real users with data worth losing. This is the *only* spend that buys durability rather than scale. |
| 2 | Cloudflare Workers Paid — $5/mo | 30 s CPU (from 10 ms), 100k files, more rate-limiting rules | Only if request-time rendering becomes necessary. The current design deliberately avoids needing it. |
| 3 | Domain — ~$10-15/year | Custom domain, and therefore magic-link email via Resend | Wanting magic link, or branded URLs |
| 4 | Resend — $0 up to 3,000/mo | Transactional email | Requires the domain above |

Everything else — search infrastructure, Redis, a job vendor, error tracking, read replicas — has a **measured** trigger in the Trade-off Register in `ARCHITECTURE.md`. None should be bought on speculation.
