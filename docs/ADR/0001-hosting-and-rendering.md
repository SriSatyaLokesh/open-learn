# ADR 0001 — Cloudflare hosting, with public pages prerendered into R2

**Status:** Accepted · **Date:** 2026-09-27

## Context

Hosting on Cloudflare with files in R2 is an owner requirement, at strictly $0/month. SEO is a first-class product feature (PRD §32), and public pages are created **continuously** by users — so build-time static generation is insufficient.

The constraint that decides everything: **Cloudflare Workers Free caps CPU at 10 ms per invocation**, enforced as a hard kill (Error 1102), not a throttle ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Error 1102](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1102/)). It counts CPU only — `fetch` wait time is excluded — so database round trips are free but template rendering is not. Cloudflare's own guidance notes that workloads doing *"authentication, server-side rendering, or parsing large payloads typically use 10-20 ms"*.

Request-time server rendering of an unbounded set of public pages is therefore a standing risk of user-visible failure, and the failure mode gets *worse* with traffic.

Two further facts closed off the obvious workarounds:

- **Cloudflare's CDN does not cache HTML by default** ([default cache behavior](https://developers.cloudflare.com/cache/about/default-cache-behavior)), and on the free plan the reliable fix is legacy Page Rules — of which **Free allows only 3** ([Page Rules](https://developers.cloudflare.com/rules/page-rules/)). Three rules cannot cover many distinct user-generated URL patterns, so "server-render and let the CDN cache it" does not scale here.
- **Static asset requests are free and unlimited** — *"Requests to static assets are free and unlimited… There is no additional cost for storing Assets"* ([static assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)). Only requests that invoke the Worker script count against the 100,000/day limit.

## Decision

**Public pages are rendered once, off the request path, and served as files.**

On publish or edit, a Supabase Edge Function (150 s, no CPU ceiling) renders complete HTML — meta tags, Open Graph, JSON-LD `Course` — and writes it to **R2**. Cloudflare serves it as a static asset. Nothing renders at request time.

Rendering strategy per page class:

| Page class | Strategy |
|---|---|
| Landing, about, category index | Prerendered at build |
| Public path, public profile, certificate verification | **Prerendered on publish/edit into R2** |
| Sitemap | Worker route querying Postgres, streamed |
| Dashboard, Builder, Focus Room, groups | Client-rendered, `noindex` |

Supporting decisions:

- **All server compute lives in Supabase Edge Functions, not the host.** Forced by the CPU ceiling, and beneficial: it makes the host a swappable deploy target rather than a dependency.
- **All scheduling lives in `pg_cron`.** Cloudflare's Cron Triggers exist on Free but are bound by the same 10 ms ceiling.
- **No host-proprietary APIs**, so moving hosts is a deploy change.

## Alternatives rejected

| Alternative | Why not |
|---|---|
| **Request-time SSR on Workers** | 10 ms ceiling makes it a standing 1102 risk that worsens with traffic, and the CDN cannot reliably cache the HTML on Free. |
| **Client-side rendering of public pages** | Googlebot renders JavaScript in a second, queued pass that can lag for days and fails silently at scale; Google advises against dynamic rendering. Unacceptable when SEO is a product feature. |
| **Prerender into Workers static assets** instead of R2 | Static assets cap at **20,000 files** on Free — a hard ceiling on the number of public paths. R2 has no such cap. |
| **Vercel** | The prior architecture's assumption. Superseded by the owner requirement; also removes Hobby's commercial-use clause, a real risk for a project that may accept sponsorship. |
| **Workers Paid ($5/mo)** | Would lift the CPU ceiling, but violates the $0 constraint. |

## Consequences

**Accepted:**

- A publish pipeline must be built and maintained — there is no off-the-shelf prerender-to-R2 product.
- **Worker routes take precedence over an R2 custom domain** on the same hostname. "Worker with R2 fallback" is not automatic; the Worker must explicitly `env.BUCKET.get(key)` and serve or 404.
- **R2 does not purge the CDN on overwrite.** Republishing needs a targeted purge or a short edge TTL.
- **R2 requires a payment method on file** even for free-tier use, and bills past the allowance rather than blocking. Billing alerts are mandatory (`COST.md`).
- A metadata refresh touching a video referenced by thousands of paths implies many re-renders. Mitigated by marking `prerender_state.stale` and rendering lazily rather than eagerly.

**Gained:**

- **A viral public page consumes no metered resource at all** — no Worker invocation, no CPU, no egress charge. This is what makes $0 structural rather than aspirational.
- Error 1102 is **structurally impossible** for public traffic.
- Public pages keep serving during a Supabase outage — a resilience benefit, not just a cost one.

## Revisit when

- The project accepts Workers Paid, which would allow request-time SSR.
- R2 Class A (write) operations approach 1,000,000/month, making the publish pipeline itself a cost.
- Cloudflare raises the free CPU limit or makes HTML caching reliable on the free plan.
