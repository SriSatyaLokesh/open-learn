# ADR 0010 — R2 has no RLS; private objects via Edge-Function-signed URLs

**Status:** Accepted · **Date:** 2026-09-27

## Context

R2 is the project's blob store (owner requirement), replacing Supabase Storage. It holds:

| Object | Visibility |
|---|---|
| Prerendered public page HTML | **Public** — the whole point ([ADR 0001](./0001-hosting-and-rendering.md)) |
| Generated Open Graph images | **Public** |
| Certificate images / PDFs | **Public** — verification pages are public by design (PRD §30) |
| Profile avatars | **Public** |
| Nightly `pg_dump` backups | **Private — must never be world-readable** |

[ADR 0002](./0002-data-access-and-rls.md) establishes that the database is the authorization boundary, enforced by RLS. **R2 has no equivalent.** It is object storage with bucket-level and token-level access, and no per-row, per-user policy engine. Supabase Storage *does* have RLS-style policies on `storage.objects`; choosing R2 gives up that mechanism in exchange for 10 GB instead of 1 GB and free egress.

This has to be stated explicitly, because the failure mode is quiet: a developer who has internalised "RLS protects everything" will reasonably assume an uploaded file is protected the same way a row is. It is not.

## Decision

**Two buckets with different postures, and no private object ever reachable by URL alone.**

### `openlearn-public` — world-readable

Served through a Cloudflare custom domain with CDN caching. Contains prerendered HTML, OG images, certificate artifacts and avatars. Everything in it is *intended* to be public, and nothing is written to it that is not.

Two operational facts from ADR 0001 apply here: **Worker routes take precedence over an R2 custom domain** on the same hostname, so the fallback must be coded explicitly (`env.BUCKET.get(key)` → serve or 404); and **R2 does not purge the CDN on overwrite**, so republishing needs a targeted purge or a short edge TTL.

### `openlearn-private` — no public access

No custom domain, no public bucket setting. Reachable only by:

1. **Supabase Edge Functions** holding R2 credentials in function secrets, which perform an authorization check and then issue a **short-lived presigned URL**; or
2. **GitHub Actions** using a scoped token for the nightly backup write.

### Rules

1. **No R2 credentials ever reach the browser.** Not the API token, not the account id, not an S3 access key.
2. **Every private read is authorized first.** The Edge Function checks the request against the database — under RLS where the actor is a user — *then* signs a URL. The signature is the delivery mechanism; the database is still the decision-maker.
3. **Presigned URLs are short-lived** (minutes) and single-purpose. A leaked URL expires; a leaked credential would not.
4. **Uploads are mediated.** A user never writes to R2 directly. An Edge Function validates content type and size, and generates the key — so a user cannot choose a path that would overwrite a prerendered page or another user's avatar.
5. **Keys are non-guessable** for anything user-scoped: `avatars/{user_id}/{uuid}.webp`, never `avatars/{handle}.jpg`. Even in the public bucket, enumeration should not be trivial.
6. **Backups are encrypted before upload.** Bucket privacy is the second line of defence, not the only one — a misconfigured bucket setting must not be sufficient to expose a full database dump.

## Alternatives rejected

| Alternative | Why not |
|---|---|
| **Supabase Storage** | Has RLS-style policies, which is genuinely attractive. Rejected on capacity: 1 GB vs R2's 10 GB and free egress, and R2 is an owner requirement. Also, prerendered HTML needs a CDN-fronted origin, which R2 does natively. |
| **One bucket with path conventions** | A single misconfiguration would expose backups. Two buckets make the security posture structural rather than conventional. |
| **Direct browser uploads with a public write token** | Any token capable of writing is capable of overwriting prerendered pages. Never. |
| **Long-lived signed URLs** | Become de facto public links once shared or logged. |
| **Cloudflare Access / Zero Trust in front of private objects** | Adds an identity system parallel to Supabase Auth, with two sources of truth about who a user is. |

## Consequences

**Accepted:**

- **Every private object read costs an Edge Function invocation** (500k/month free). Acceptable because private objects are rare — effectively only backups today.
- R2 credentials exist as secrets in two places (Supabase function secrets, GitHub Actions secrets) and need a documented rotation procedure.
- Authorization logic for files lives in Edge Functions rather than in policies, so it is **not** covered by the RLS test suite. It needs its own tests — called out explicitly because ADR 0002's test strategy does not reach here.
- Avatars are public. Anyone with the URL can view one. Consistent with public profiles (PRD §32), but a deliberate choice rather than an accident.

**Gained:**

- 10 GB and free egress, which is what makes the prerender strategy affordable at any traffic level.
- A clear, stateable rule for contributors: *"public bucket is for things that are meant to be on the internet; everything else goes through an Edge Function."*
- Presigned URLs mean a leak is time-bounded.

## Revisit when

- A genuinely user-private file feature appears (private notes with attachments, private group materials), which would make private reads frequent enough to warrant caching signed URLs or reconsidering Supabase Storage for that class of object.
- R2 storage approaches 10 GB, or Class A operations approach 1,000,000/month.
