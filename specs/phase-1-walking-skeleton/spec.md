# FEATURE SPECIFICATION: PHASE 1 WALKING SKELETON (S1)

**Specification ID:** SPEC-0003
**Feature:** Paste YouTube URLs → guest session → Focus Room plays → reload resumes
**Status:** Approved
**Target Routes:** `/start`, `/learn?path=<public_code>` · Edge Function `ingest` · `supabase/migrations/`
**Primary Owner:** Full-stack Engineering (`@SriSatyaLokesh`, `@ChadaSaiteja`)
**Parent Documents:** README roadmap, Phase 1 · [`docs/OPENLEARN_PRD.md`](../../docs/OPENLEARN_PRD.md) §11, §15, §18, §19 · [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) §8, §9, §16 · [`docs/DATABASE.md`](../../docs/DATABASE.md) §1–4, §13 · [`docs/YOUTUBE_INTEGRATION.md`](../../docs/YOUTUBE_INTEGRATION.md) §5, §6
**Governing ADRs:** [0002](../../docs/ADR/0002-data-access-and-rls.md) · [0005](../../docs/ADR/0005-repo-structure.md) · [0006](../../docs/ADR/0006-youtube-provider-contract.md) · [0007](../../docs/ADR/0007-guest-mode.md) · [0008](../../docs/ADR/0008-ingestion-execution-model.md)

---

## 0. Where this fits

Phase 1 is defined by the README roadmap. PRD §41 is the **MVP**, reached when Phases 1–3 are complete; it is not a Phase 1 checklist. Phase 1 is delivered as five vertical slices, each with its own spec → plan → build cycle:

| Slice | Delivers |
|---|---|
| **S1 (this spec)** | Walking skeleton: paste video URLs → guest → Focus Room plays → reload resumes. Mock provider. |
| S2 | Real ingestion: playlists, pasted text, YouTube Data API, quota ledger, rate limit, Turnstile, 30-day refresh sweep |
| S3 | Full Focus Room: lesson navigation, completion, progress rollups, IndexedDB outbox, remove + up/down reorder |
| S4 | Notes: timestamped notes, seek on click, course notes, Markdown preview, `.md` export |
| S5 | Accounts: email/password + Google, "Save your learning journey" conversion, 30-day guest prune |

S1 exists to retire integration risk early: static hosting + Supabase anonymous auth + Edge Function + RLS + the YouTube IFrame player, all exercised end to end before any slice widens.

---

## 1. Objective & Scope

A visitor pastes one or more YouTube video URLs, gets a private learning path without creating an account, watches it in a minimal Focus Room, and on reload resumes where they left off.

### 1.1 In scope

- Local Supabase project (`supabase/config.toml`) with anonymous sign-in enabled.
- Migrations for exactly the tables S1 writes or reads, copied from `DATABASE.md`: `profile`, `learning_path`, `module`, `concept`, `video`, `resource`, `resource_progress`; helpers `is_guest()` and `generate_public_code()`; the `profile`-on-signup trigger; RLS on every table; the `save_position` RPC.
- `src/modules/youtube/`: pure `parse()` and a mock `resolve()`.
- Edge Function `ingest`.
- Browser Supabase client and two client-rendered pages: `/start` and `/learn`.
- Vitest (unit + integration against local Supabase), Playwright flow test, axe checks.
- A CI job that starts local Supabase and runs the backend and flow tests.

### 1.2 Out of scope (and which slice owns it)

- Playlists, pasted free text, the real YouTube Data API, `quota_ledger`, `rate_limit`, Turnstile, refresh sweep — **S2**.
- `concept_progress`, `user_path`, completion, lesson "next/previous" controls, outbox, editing — **S3**.
- Notes — **S4**. Sign-up, login, conversion, guest prune — **S5**.
- `category`, `user_interest`, and every social, gamification, certificate or SEO table — later phases.
- Linking `/start` from the landing page, and any production Supabase project. S1 is developed and verified locally and in CI only.
- Service worker / installable PWA (decided: not in Phase 1 unless revisited).

---

## 2. Information Architecture

### 2.1 Flow

```text
/start ──paste URLs──► [first submit only] signInAnonymously()
       ──POST ingest (JWT)──► { publicCode, failures[] }
       ──navigate──► /learn?path=OL-XXXXX
/learn ──select via RLS──► path → resources (+ video) → my resource_progress
       ──play from last_position_seconds──► save_position() every ~10 s, on pause, on pagehide
```

### 2.2 Runtime boundaries

| Piece | Runs in | Credentials |
|---|---|---|
| `/start`, `/learn` | Browser (static shell, `ssr = false`) | Anon key + the user's JWT |
| `ingest` | Supabase Edge Function (Deno) | User's JWT for path rows; service role **only** for `video` upsert |
| Postgres + RLS | Supabase | — |

No code runs in the Cloudflare host. `wrangler.json` is unchanged (`not_found_handling: "404-page"`), because both app pages are single prerendered shells and the path code travels in the query string.

### 2.3 Directory additions (ADR 0005)

```text
src/
├── lib/supabase.ts                 # browser client (createClient; env via src/env.ts defineEnvVars + $app/env/public, baked in at build time, R8)
├── modules/youtube/
│   ├── index.ts                    # public surface: parse, mockResolve, types
│   ├── parse.ts                    # pure, no imports — also bundled into the Edge Function
│   └── mock.ts                     # deterministic fixture metadata
└── routes/
    ├── start/+page.svelte          # import form
    └── learn/+page.svelte          # Focus Room (+page.ts: ssr = false)
supabase/
├── config.toml                     # [auth] enable_anonymous_sign_ins = true
├── migrations/                     # one file per DATABASE.md §18 group in scope, RLS separate
└── functions/ingest/index.ts
tests/
├── unit/                           # Vitest: parse, mock
└── integration/                    # Vitest against local Supabase: RLS, save_position, ingest
```

---

## 3. Behaviour Specification

### 3.1 Import (`/start`)

1. One `<textarea>` (label "YouTube video links, one per line") and an **Import** button.
2. Client-side `parse()` runs on submit to give instant feedback; the Edge Function re-parses (the client is never trusted).
3. **Lazy guest session (ADR 0007):** `signInAnonymously()` is called on the first submit only if no session exists — never on page load. Loading `/start` or `/learn` must not create an `auth.users` row.
4. The button is disabled with "Importing…" while the request is in flight.
5. On success, navigate to `/learn?path=<publicCode>`. If `failures[]` is non-empty it is passed to `/learn` as SvelteKit navigation state (`goto(url, { state })`, read from `page.state`), where it is shown as a dismissible list beside the player (not over it), each with the URL and a reason. It is not persisted, so a reload drops it.
6. If every reference fails, stay on `/start` and show the failure list with no path created.

### 3.2 Ingestion (`supabase/functions/ingest`)

| Step | Rule |
|---|---|
| Auth | Reject without a valid JWT (401). Guests are valid. |
| Input bounds | Body `{ input: string }`, `input.length ≤ 10 000`; at most **50** references after parse; else 400 with a readable message. |
| Parse | `parse()` from `src/modules/youtube/parse.ts`. S1 accepts **video** references only; a playlist reference is reported as a failure with reason `unsupported` (S2 lifts this). Exception (ruling R12): ingest, not `parse()`, silently drops a playlist ref whose `sourceUrl` equals that of a video ref in the same input (e.g. `watch?v=X&list=Y`): the video imports with no `unsupported` failure. A bare `playlist?list=` URL still fails `unsupported`. |
| Dedupe | Repeated video IDs in one input are imported once, first occurrence wins (preserve import order, PRD §11). |
| Resolve | Mock adapter: deterministic title/channel/duration from the ID; IDs listed as unavailable in the fixture return `not_found` / `not_embeddable`. |
| Video upsert | **Service-role** client, `on conflict (provider, provider_video_id)` updating descriptive fields and `last_synced_at`. Users have no write policy on `video` (DATABASE §13.4). |
| Path write | **User-JWT** client, so RLS applies: one `learning_path` (title "Imported path – <date>", `visibility 'private'`, `status 'draft'`), one `module`, then one `concept` + one `resource` (`kind 'primary'`, `source_url` = the pasted URL) per resolved video, ordered by import order. |
| Order keys | Fixed-width keys from import index (`a0000`, `a0001`, …). S3 introduces between-key generation for reordering. |
| Public code | `generate_public_code()` default; on unique violation retry once, then 500. |
| Response | `200 { publicCode, failures: { input, reason }[] }`. `reason ∈ unsupported \| invalid_url \| not_found \| not_embeddable`. |
| Partial failure | A failed item is reported and not inserted; it never aborts the others (PRD §11, ADR 0008). |

`parse.ts` has **no imports** so the same file is valid in Vite (TypeScript) and Deno. Verifying that the Supabase CLI bundles it from outside `supabase/functions/` is the first task of the plan (OQ-1).

### 3.3 Focus Room (`/learn?path=…`)

1. Reads the path, its resources (with `video`), and the caller's `resource_progress` rows **through RLS**. A missing, foreign or malformed code renders "Path not found" — the same message in every case, so existence is not leaked.
2. Layout per ARCHITECTURE §18.4: desktop side-by-side (player | video list); ≤ 768 px the player is pinned on top and the list scrolls beneath. The player box is **≥ 200×200 px at every width, never overlaid** (YOUTUBE_INTEGRATION §5) — no modal, toast or sheet may cover it.
3. The IFrame API script is loaded once. The player component is mounted once per page; switching videos calls `loadVideoById`, never remounts the iframe.
4. The video list is a list of `<button>`s; the current one has `aria-current="true"`. Thumbnails are hotlinked from `i.ytimg.com/vi/<id>/mqdefault.jpg`; nothing is stored or proxied.
5. **Resume:** on open, the video whose `resource_progress` row has the most recent `updated_at` is selected and cued (not autoplayed) at its `last_position_seconds`; with no progress rows, the first video is cued at 0. A line under the list reads "Resumed at m:ss".
6. **Saving position:** while playing, every ~10 s; immediately on pause, on `visibilitychange → hidden` and on `pagehide`. Each save calls `save_position(resource_id, floor(seconds))`. Errors are retried on the next tick; S1 has no offline queue (S3).
7. Offline (`navigator.onLine === false`): a non-blocking notice in the list panel, "You're offline — playback needs a connection."

### 3.4 `save_position` RPC

```sql
create function save_position(p_resource_id uuid, p_seconds integer)
returns void language plpgsql security invoker as $$
begin
  if p_seconds < 0 or p_seconds > 86400 then
    raise exception 'position out of range' using errcode = '22023';
  end if;
  -- RLS on resource: the caller must be able to see the resource.
  if not exists (select 1 from resource where id = p_resource_id) then
    raise exception 'resource not found' using errcode = 'P0002';
  end if;
  insert into resource_progress (user_id, resource_id, last_position_seconds)
  values (auth.uid(), p_resource_id, p_seconds)
  on conflict (user_id, resource_id) do update set
    last_position_seconds = greatest(resource_progress.last_position_seconds,
                                     excluded.last_position_seconds),
    updated_at = now();
end $$;
```

`security invoker` keeps RLS in force. Position is **monotonic** by design (ADR 0009): resume returns to the furthest point reached, so re-watching an earlier section does not move it back (accepted, OQ-2).

---

## 4. Data Contracts & Schemas

### 4.1 Tables

Column definitions are `DATABASE.md` §1, §2, §3, §4's DDL, plus the R7 composite FKs and `unique (id, path_id)` on `module` and `concept` (these keep `concept.path_id` and `resource.path_id` consistent with their parents), for: `profile`, `learning_path`, `module`, `concept`, `video`, `resource`, `resource_progress`, including their indexes and the `resource_one_primary_per_concept` partial unique index. Extension: `citext` (`gen_random_uuid()` is built into Postgres 13+). `category`, `path_category`, `path_slug_history` and `user_interest` are **not** created in S1.

`profile`-on-signup trigger: inserts `(id, handle, display_name)` with `handle = 'guest-' || left(replace(id::text,'-',''), 10)` and `display_name = 'Guest'` for every new `auth.users` row, anonymous or not. S5 lets a converted user change both.

### 4.2 RLS (all tables `enable row level security`)

| Table | select | insert | update | delete |
|---|---|---|---|---|
| `profile` | own row | — (trigger only) | own row | — |
| `learning_path` | DATABASE §13.1 read rule (public + published, or author) | `author_id = auth.uid()` | DATABASE §13.2 (`visibility <> 'public' or not is_guest()`) | author |
| `module`, `concept`, `resource` | parent path readable (via `path_id`) | parent path authored by caller | same | same |
| `video` | any authenticated user | — (service role) | — | — |
| `resource_progress` | own rows | own rows | own rows | own rows |

The `study_group` branch of §13.1 is omitted until that table exists (Phase 3).

### 4.3 TypeScript contracts (`src/modules/youtube/index.ts`)

```ts
export type ResourceRef =
  | { kind: 'video'; providerVideoId: string; sourceUrl: string }
  | { kind: 'playlist'; providerPlaylistId: string; sourceUrl: string };

export type ParseResult = { refs: ResourceRef[]; invalid: string[] };

export function parse(input: string): ParseResult;

export type NormalizedVideo = {
  providerVideoId: string; title: string; channelName: string;
  durationSeconds: number; embeddable: boolean; regionBlocked: string[];
};

export type ResolveError = { kind: 'not_found' } | { kind: 'not_embeddable' };

export function mockResolve(ids: string[]): Map<string, NormalizedVideo | ResolveError>;
```

`parse()` recognises (YOUTUBE_INTEGRATION §6.2): `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/`, `youtube.com/shorts/`, `m.youtube.com`, `youtube.com/playlist?list=`, `watch?v=…&list=…` (yields **both** a video and a playlist ref), and URLs with tracking parameters or `t=`. A video ID is exactly 11 chars of `[A-Za-z0-9_-]`. Non-YouTube or malformed lines go to `invalid`. Blank lines are ignored.

S2 widens `mockResolve` into the `ContentProvider` interface of YOUTUBE_INTEGRATION §6; S1 deliberately does not build that interface for one implementation.

### 4.4 Configuration

| Variable | Where | Notes |
|---|---|---|
| `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` | Browser, via `src/env.ts` `defineEnvVars` + `$app/env/public`; baked in at build time (R8), so set before `pnpm build` | `.env.example` carries the local-stack values. If absent, `/start` and `/learn` render "Backend not configured" instead of failing the build. |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Edge Function | Injected by Supabase; the service key never reaches the browser bundle. |

---

## 5. Design Tokens & Accessibility

- Reuse the existing Tailwind tokens and fonts; no new tokens.
- The iframe has `title="<video title> — YouTube video player"`.
- Every control is a native `<button>`/`<textarea>` with a visible label; full keyboard operation; visible focus.
- Import errors and the "Resumed at" line use `aria-live="polite"`.
- No motion beyond what `prefers-reduced-motion` already gates.
- axe reports zero serious/critical violations on `/start` and on `/learn` with a loaded path.

---

## 6. SEO / AEO / GEO

`/start` and `/learn` are private app surfaces: `<meta name="robots" content="noindex">`, a plain `<title>` ("Import · OpenLearn", "Focus Room · OpenLearn"), no Open Graph tags, not linked from the landing page in S1, and never in a sitemap. The landing page's SEO is unchanged.

---

## 7. Acceptance Criteria

Verification layer: **U** = Vitest unit · **I** = Vitest integration (local Supabase) · **E** = Playwright · **A** = axe · **C** = CI/command.

### Parsing
- **AC-1 (U)** `parse()` returns the correct 11-char ID for every URL form in §4.3, including `t=` and tracking parameters.
- **AC-2 (U)** `watch?v=X&list=Y` yields one video ref and one playlist ref; non-YouTube and malformed lines land in `invalid`; blank lines are ignored.

### Database and RLS
- **AC-3 (C)** `supabase db reset` applies all migrations cleanly from empty.
- **AC-4 (I)** A new anonymous user gets a `profile` row via the trigger.
- **AC-5 (I)** Guest A cannot select guest B's `learning_path`, `module`, `concept`, `resource` or `resource_progress`, and cannot insert children under B's path.
- **AC-6 (I)** An authenticated user cannot insert or update `video`.
- **AC-7 (I)** A guest cannot set their path's `visibility` to `'public'`.
- **AC-8 (I)** `save_position` keeps the maximum: saving 120 then 60 leaves 120; saving −1 or 86 401 errors; saving against a resource the caller cannot see errors.

### Ingestion
- **AC-9 (I)** Two valid URLs and one non-YouTube line → 200, a path with two resources in input order, one `invalid_url` failure.
- **AC-10 (I)** A duplicated video URL is imported once; a playlist URL yields an `unsupported` failure; an all-failing input creates no path.
- **AC-11 (I)** No JWT → 401; input over 10 000 chars or over 50 references → 400.
- **AC-12 (I)** Importing a video that already exists in `video` reuses the row (one `video`, two `resource` rows across two paths).

### Focus Room flow
- **AC-13 (E)** Loading `/start` creates no anonymous user; the first Import does.
- **AC-14 (E)** Import → `/learn` plays the first video in a player box ≥ 200×200 at 360 px, 768 px and 1280 px widths, with nothing overlapping it.
- **AC-15 (E)** Seek to 1:30, pause, reload → the same video is cued at 1:30 (±2 s) and "Resumed at 1:30" is shown.
- **AC-16 (E)** Choosing another video in the list switches playback without remounting the iframe.
- **AC-17 (E)** `/learn?path=OL-ZZZZZ` and another guest's code both show "Path not found".

### Quality gates
- **AC-18 (A)** axe: zero serious/critical violations on `/start` and `/learn`.
- **AC-19 (C)** `pnpm lint`, `pnpm check`, `pnpm build` pass; the build output still contains `404.html` and the landing page is unchanged (existing Playwright suite green).
- **AC-20 (C)** CI runs a backend job (`supabase start` → integration tests → flow tests) on every PR, alongside the existing job.
- **AC-21 (C)** The service-role key does not appear anywhere in `build/`.

---

## 8. Open Questions & Follow-ups

- **OQ-1 Sharing `parse.ts` with Deno.** Assumed the Supabase CLI bundles a relative import from `src/modules/youtube/parse.ts`. If it does not, fallback: a `pnpm` script copies `parse.ts` into `supabase/functions/_shared/` before serve/deploy, with a CI check that the copy is identical. Settled in plan task 1.
- **OQ-2 Monotonic resume (accepted).** `GREATEST()` means re-watching earlier content never moves the resume point back. Chosen in ADR 0009 for cross-device safety; revisit only if user feedback asks for "resume where I last was" over "furthest point".
- **OQ-3 Flow tests depend on youtube.com.** AC-14–16 load the real IFrame player, so CI needs network access to YouTube and may see ads or consent screens. If that proves flaky, the flow tests stub `window.YT` with a fake player exposing the same methods, and one real-player smoke test stays as a non-blocking check.
- **OQ-4 Public code space.** `OL-` + 5 characters; collisions retried once. Revisit if the retry ever fires in practice.
- **Deviation to record in S4, not here:** Markdown will be sanitised at render time (DOMPurify) rather than server-side as `DATABASE.md` §5 says, because notes are author-only in Phase 1. Must be revisited before any note becomes public.
- **Follow-up:** guest accounts created in S1 local testing are not pruned until S5's `pg_cron` job.
