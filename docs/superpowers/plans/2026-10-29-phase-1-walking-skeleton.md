# Phase 1 Walking Skeleton (S1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A visitor pastes YouTube video URLs on `/start`, gets a private guest path, watches it on `/learn?path=…`, and on reload resumes where they paused.

**Architecture:** Static SvelteKit pages (`ssr = false`) talk to local Supabase directly through RLS. One Edge Function, `ingest`, parses and resolves input with a mock provider, upserts `video` with the service role, and writes path rows with the caller's JWT. Position is saved through a `security invoker` RPC that keeps the maximum.

**Tech Stack:** SvelteKit 3.1 / Svelte 5 / TS `~6.0.3` (existing), `@supabase/supabase-js` 2.118.0, `supabase` CLI 2.122.0 (dev dep), Vitest 5.0.5, Playwright 1.64 + axe (existing), Deno Edge Runtime (via the CLI).

**Spec:** [`specs/phase-1-walking-skeleton/spec.md`](../../../specs/phase-1-walking-skeleton/spec.md) (SPEC-0003, approved 2026-10-29). Section and AC numbers below refer to it.

## Global Constraints

- Prerequisite (owner): Docker Desktop running before Task 1. Nothing in this plan works without it.
- Dependency versions exactly: `@supabase/supabase-js@2.118.0` (dependency); `supabase@2.122.0`, `vitest@5.0.5` (devDependencies). No other new dependencies.
- `src/modules/youtube/parse.ts` has **no imports** (spec §3.2); it is shared with Deno.
- Every table has RLS enabled (spec §4.2). The service-role key is used only inside `supabase/functions/` and never in `src/` or `build/` (AC-21).
- Guest session is created on first Import submit only, never on page load (spec §3.1.3).
- Player box ≥ 200×200 at every width; nothing overlays it (spec §3.3.2).
- Input bounds: `input.length ≤ 10000`, `≤ 50` references (spec §3.2).
- `/start`, `/learn`: `<meta name="robots" content="noindex">`; titles "Import · OpenLearn", "Focus Room · OpenLearn" (spec §6).
- `wrangler.json` and the landing page are not changed (spec §2.2, AC-19).
- Commits: author `Saiteja Chada <saiteja.chada2000@gmail.com>`, Conventional Commits, **no Co-Authored-By or Claude trailer** (owner instruction).
- Every task ends with `pnpm lint && pnpm check && pnpm build` green plus the task's own tests.

## Review Focus

1. **CORS preflight on `ingest`.** The browser (`localhost:4173`/`5173`) calls the function cross-origin; without an `OPTIONS` handler and `Access-Control-Allow-Headers: authorization, apikey, content-type, x-client-info`, every import fails in the browser while integration tests (Node, no CORS) pass. Test in Task 4.
2. **DATABASE.md §13.2 `path_update` policy has a self-reference bug.** `(select is_approved_course from learning_path p where p.id = id)` resolves `id` to `p.id`, so the subquery returns every row and the update errors. Write `p.id = learning_path.id`. Test (guest renames own path) in Task 3.
3. **Double submit on `/start`** (double-click, or Enter then click) must produce one anonymous user and one path. Test in Task 5.
4. **Windows line endings and stray whitespace** in pasted input (`\r\n`, tabs, leading spaces) must parse the same as clean input. Test in Task 2.
5. **Non-finite player time** (`getCurrentTime()` returns `undefined`/`NaN` before metadata) must not call `save_position`. Test in Task 6.

---

### Task 1: Supabase scaffold and Deno-sharing spike (OQ-1)

Controller-run spike plus scaffold: its findings decide how Task 4 imports `parse.ts`.

**Files:**
- Modify: `package.json` (deps above; scripts `"db:start": "supabase start"`, `"db:reset": "supabase db reset"`, `"test:unit": "vitest run --project unit"`, `"test:integration": "vitest run --project integration"`)
- Create: `supabase/config.toml` (via `pnpm exec supabase init`), `supabase/functions/ingest/index.ts` (temporary probe), `src/modules/youtube/parse.ts` (temporary: `export const PROBE = 'ok';`)
- Create: `specs/phase-1-walking-skeleton/research.md` (findings)

**Interfaces:**
- Produces: a running local stack; `pnpm exec supabase status -o env` printing `API_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`; a recorded decision `IMPORT_MODE = relative | copied` for Task 4.

- [ ] **Step 1:** `pnpm add @supabase/supabase-js@2.118.0 && pnpm add -D supabase@2.122.0 vitest@5.0.5`; `pnpm exec supabase init`.
- [ ] **Step 2:** In `supabase/config.toml` set `[auth] enable_anonymous_sign_ins = true` and `[auth.rate_limit] anonymous_users = 1000` with the comment `# tests create many guests; default 30/h would fail CI`.
- [ ] **Step 3:** Probe function `index.ts`: `import { PROBE } from '../../../src/modules/youtube/parse.ts'; Deno.serve(() => new Response(PROBE));`
- [ ] **Step 4:** `pnpm exec supabase start`, then `curl -s "$API_URL/functions/v1/ingest" -H "Authorization: Bearer $ANON_KEY"`. Expected: `ok`. Also record whether `supabase start` serves functions itself or `supabase functions serve` is needed.
- [ ] **Step 5:** If Step 4 fails, implement the spec OQ-1 fallback: script `"functions:sync": "node -e \"require('fs').copyFileSync('src/modules/youtube/parse.ts','supabase/functions/_shared/parse.ts')\""`, import `../_shared/parse.ts`, re-run Step 4. Record `IMPORT_MODE` and the serve command in `research.md`.
- [ ] **Step 6:** Restore `parse.ts`/probe to empty placeholders (Task 2/4 own them), commit `chore(spec-0003): add local Supabase and record Deno import mode`.

### Task 2: `parse()` and `mockResolve()` (AC-1, AC-2)

**Files:**
- Create: `vitest.config.ts`, `src/modules/youtube/parse.ts`, `src/modules/youtube/mock.ts`, `src/modules/youtube/index.ts`, `tests/unit/parse.test.ts`, `tests/unit/mock.test.ts`
- Modify: `tsconfig.json` `include` += `"tests", "vitest.config.ts"`

**Interfaces:**
- Produces (spec §4.3, exact): `parse(input: string): ParseResult`, `mockResolve(ids: string[]): Map<string, NormalizedVideo | ResolveError>`, types `ResourceRef`, `ParseResult`, `NormalizedVideo`, `ResolveError`, all re-exported from `index.ts`.
- `vitest.config.ts`: `test.projects` = `{ name: 'unit', include: ['tests/unit/**/*.test.ts'] }` and `{ name: 'integration', include: ['tests/integration/**/*.test.ts'], globalSetup: 'tests/integration/setup.ts', fileParallelism: false }`. Standalone config (no SvelteKit plugin).

- [ ] **Step 1: Write failing tests** `tests/unit/parse.test.ts`:

```ts
const ID = 'dQw4w9WgXcQ';
it.each([
  `https://www.youtube.com/watch?v=${ID}`, `https://youtu.be/${ID}`, `https://youtu.be/${ID}?t=42`,
  `https://www.youtube.com/embed/${ID}`, `https://www.youtube.com/shorts/${ID}`,
  `https://m.youtube.com/watch?v=${ID}&feature=share`, `youtube.com/watch?v=${ID}&utm_source=x&t=1m30s`
])('extracts the id from %s', (url) =>
  expect(parse(url).refs).toEqual([{ kind: 'video', providerVideoId: ID, sourceUrl: url }]));

it('watch with list yields video then playlist', () =>
  expect(parse(`https://www.youtube.com/watch?v=${ID}&list=PL123`).refs.map((r) => r.kind)).toEqual(['video', 'playlist']));
it('bare playlist URL', () => expect(parse('https://www.youtube.com/playlist?list=PL123').refs[0])
  .toMatchObject({ kind: 'playlist', providerPlaylistId: 'PL123' }));
it('non-YouTube, malformed and 10-char ids go to invalid', () =>
  expect(parse('https://vimeo.com/1\nnot a url\nhttps://youtu.be/short12345').invalid)
  .toEqual(['https://vimeo.com/1', 'not', 'a', 'url', 'https://youtu.be/short12345']));
it('ignores blank lines, CRLF and surrounding whitespace', () => {
  const r = parse(`\r\n  https://youtu.be/${ID}\t\r\n\r\nhttps://youtu.be/M7lc1UVf-VE  \r\n`);
  expect(r.refs.map((x) => (x as { providerVideoId: string }).providerVideoId)).toEqual([ID, 'M7lc1UVf-VE']);
  expect(r.invalid).toEqual([]);
});
```

`tests/unit/mock.test.ts`: `mockResolve(['dQw4w9WgXcQ','unavailabl1','noembedxxx1'])` → first is a `NormalizedVideo` with `title 'Mock video dQw4w9WgXcQ'`, `channelName 'Mock Channel'`, `durationSeconds 600`, `embeddable true`, `regionBlocked []`; second `{ kind: 'not_found' }`; third `{ kind: 'not_embeddable' }`.

- [ ] **Step 2:** `pnpm test:unit` → FAIL (module not found).
- [ ] **Step 3: Implement.** `parse`: split input on `/\s+/`, drop empties; each token is one candidate; prefix `https://` when it has no scheme; `new URL()` in try/catch; host must be `youtube.com`, `www.youtube.com`, `m.youtube.com` or `youtu.be`; ids must match `/^[A-Za-z0-9_-]{11}$/`; a token yielding no ref goes to `invalid` verbatim; `sourceUrl` is always the original token (before any `https://` prefix). `mock.ts`: the fixture ids `unavailabl1` and `noembedxxx1` are the only failures.
- [ ] **Step 4:** `pnpm test:unit` → PASS. `pnpm lint && pnpm check && pnpm build` green.
- [ ] **Step 5:** Commit `feat(youtube): add URL parser and mock resolver`.

### Task 3: Schema, RLS and `save_position` (AC-3 – AC-8)

**Files:**
- Create: `supabase/migrations/20261029000001_helpers.sql`, `…02_tables.sql`, `…03_rls.sql`, `…04_functions.sql`
- Create: `tests/integration/setup.ts`, `tests/integration/helpers.ts`, `tests/integration/rls.test.ts`, `tests/integration/save-position.test.ts`

**Interfaces:**
- Consumes: Task 1's running stack.
- Produces: tables per spec §4.1; SQL `is_guest() returns boolean`, `generate_public_code() returns text` (default of `learning_path.public_code`), `save_position(p_resource_id uuid, p_seconds integer) returns void` (spec §3.4, verbatim), `handle_new_user()` trigger on `auth.users`.
- Produces (TS, `tests/integration/helpers.ts`): `env: { url: string; anonKey: string; serviceKey: string }` (read in `setup.ts` from `supabase status -o env`, passed via `provide`/`inject`); `guest(): Promise<SupabaseClient>` (new client, `signInAnonymously()`); `service(): SupabaseClient`; `seedPath(client): Promise<{ pathId: string; resourceId: string }>` (inserts path → module → concept → resource using a service-upserted `video`).

- [ ] **Step 1: Write failing tests.** `rls.test.ts`:
  - `new guest gets a profile` — `select handle from profile` returns one row matching `/^guest-[0-9a-f]{10}$/` (AC-4).
  - `guest B sees none of guest A's rows` — after `seedPath(a)` and an A `save_position`, B's `select` on `learning_path`, `module`, `concept`, `resource`, `resource_progress` each return `[]` (AC-5).
  - `guest B cannot insert a module under A's path` — insert returns error code `42501` (AC-5).
  - `authenticated user cannot write video` — insert and update both error (AC-6).
  - `guest cannot publish` — `update learning_path set visibility='public'` on own path errors (AC-7).
  - `guest can rename own path` — `update … set title='Renamed'` succeeds and reads back (Review Focus 2).
  - `save_position.test.ts`: 120 then 60 leaves 120; `-1` and `86401` error with code `22023`; a resource id from guest A called by guest B errors with `P0002` (AC-8).
- [ ] **Step 2:** `pnpm test:integration` → FAIL (relations do not exist).
- [ ] **Step 3: Implement migrations.**
  - `01_helpers`: `create extension if not exists citext;` `is_guest()` from DATABASE §1.1; `generate_public_code()`:
    ```sql
    select 'OL-' || string_agg(substr('0123456789ABCDEFGHJKMNPQRSTVWXYZ', 1 + floor(random()*32)::int, 1), '')
    from generate_series(1, 5);
    ```
    (Not a secret; RLS is the guard.)
  - `02_tables`: DATABASE §1 `profile`, §2 `learning_path`/`module`/`concept`, §3 `video`/`resource`, §4 `resource_progress`, verbatim with their indexes; `learning_path.public_code` gets `default generate_public_code()`. Skip `user_interest`, `category`, `path_category`, `path_slug_history`, `user_path`, `concept_progress`.
  - `03_rls`: enable RLS on all seven tables; policies per spec §4.2. Children check the parent with `exists (select 1 from learning_path p where p.id = <child>.path_id [and p.author_id = auth.uid()])`. `learning_path` read rule = DATABASE §13.1 without the `group_member` branch; update rule = §13.2 with the Review Focus 2 fix. `video`: `for select to authenticated using (true)` only.
  - `04_functions`: `handle_new_user()` `security definer set search_path = ''` inserting the profile per spec §4.1; `save_position` verbatim from spec §3.4; `revoke execute on function save_position from public, anon; grant … to authenticated`.
- [ ] **Step 4:** `pnpm db:reset` succeeds (AC-3); `pnpm test:integration` → PASS.
- [ ] **Step 5:** Commit `feat(db): add S1 schema, RLS and save_position`.

### Task 4: `ingest` Edge Function (AC-9 – AC-12)

**Files:**
- Create: `supabase/functions/ingest/index.ts`, `tests/integration/ingest.test.ts`
- Modify: `eslint.config.js` ignores += `'supabase/**'` (Deno globals; lint runs on Node code only)

**Interfaces:**
- Consumes: `parse`, `mockResolve` (import per Task 1 `IMPORT_MODE`); Task 3 schema; helpers `guest()`, `service()`, `env`.
- Produces: `POST {API_URL}/functions/v1/ingest`, body `{ input: string }` → `200 { publicCode: string; failures: { input: string; reason: 'unsupported'|'invalid_url'|'not_found'|'not_embeddable' }[] }`; `400 { error: string }`; `401`; `422 { failures }` when nothing imported; `500 { error }`. `OPTIONS` → `204` with CORS headers.

- [ ] **Step 1: Write failing tests** `ingest.test.ts` (call via `fetch` with `Authorization: Bearer <guest access token>` and `apikey: anonKey`):
  - `imports two videos in order and reports the bad line` — input `https://youtu.be/dQw4w9WgXcQ\nhttps://vimeo.com/1\nhttps://youtu.be/M7lc1UVf-VE`; 200; `failures` = `[{ input: 'https://vimeo.com/1', reason: 'invalid_url' }]`; reading the path's resources ordered by `order_key` gives `dQw4w9WgXcQ, M7lc1UVf-VE` with `source_url` set (AC-9).
  - `dedupes, rejects playlists, mock failures` — duplicated id → one resource; `…/playlist?list=PL1` → `unsupported`; `unavailabl1` → `not_found` (AC-10).
  - `creates nothing when every item fails` — 422 (plan decision: spec §3.2 gives no code for this case), and `select count(*) from learning_path` for that guest is 0 (AC-10).
  - `rejects bad requests` — no Authorization → 401; 10 001 chars → 400; 51 distinct ids → 400 (AC-11).
  - `reuses the video row across paths` — same id imported by two guests → one `video` row (service read), two `resource` rows (AC-12).
  - `answers CORS preflight` — `OPTIONS` → 204 with `access-control-allow-origin: *` and allow-headers containing `authorization`, `apikey`, `content-type`, `x-client-info` (Review Focus 1).
- [ ] **Step 2:** `pnpm test:integration -- ingest` → FAIL.
- [ ] **Step 3: Implement** in this order: CORS/`OPTIONS`; bounds (400); `userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization } } })`, `auth.getUser()` error → 401; `parse` → playlist refs → `unsupported`, `invalid` → `invalid_url`; dedupe video ids keeping first; `> 50` → 400; `mockResolve` → failures; none left → 422; `service` upserts `video` (`onConflict: 'provider,provider_video_id'`, `last_synced_at: now`); `userClient` inserts path (title `Imported path – YYYY-MM-DD`), module (`order_key 'a0000'`), concepts and resources with ids from `crypto.randomUUID()` and `order_key = 'a' + String(i).padStart(4, '0')`. Public-code `23505` → retry the path insert once. Any later insert error → delete the path (cascades) and 500. Import supabase-js as `npm:@supabase/supabase-js@2.118.0`.
- [ ] **Step 4:** `pnpm test:integration` → PASS (all files).
- [ ] **Step 5:** Commit `feat(ingest): add ingest Edge Function with mock provider`.

### Task 5: Browser client and `/start` (AC-13, AC-18 part)

**Files:**
- Create: `src/lib/supabase.ts`, `src/routes/start/+page.ts`, `src/routes/start/+page.svelte`, `.env.example`, `e2e/backend/start.spec.ts`
- Modify: `playwright.config.ts` (existing projects `testIgnore: 'backend/**'`; new project `backend` with `testMatch: 'backend/**'`, desktop viewport, skipped unless `process.env.PUBLIC_SUPABASE_URL` is set)

**Interfaces:**
- Produces: `getSupabase(): SupabaseClient | null` (singleton from `$env/dynamic/public`; `null` if either var is missing; `global.fetch` wraps `fetch` with `keepalive: true` so `pagehide` saves survive unload); `ensureSession(sb): Promise<void>` (calls `signInAnonymously()` only if `getSession()` has none).
- Produces: `/start` → on success `goto('/learn?path=' + publicCode, { state: { failures } })`.
- `e2e/backend/helpers.ts`: `authKey(page): Promise<string | null>` returns the `localStorage` key matching `/^sb-.*-auth-token$/`.

- [ ] **Step 1: Write failing tests** `start.spec.ts`:
  - `no guest is created until Import` — open `/start`, `authKey` is null; fill two valid URLs, click Import; URL matches `/\/learn\?path=OL-[0-9A-Z]{5}$/`; `authKey` non-null (AC-13).
  - `double submit creates one path` — `dblclick` on Import; count `POST …/functions/v1/ingest` requests via `page.on('request')` = 1 (Review Focus 3).
  - `all-failing input stays on /start` — input `https://vimeo.com/1`; URL still `/start`; alert lists `https://vimeo.com/1` with "invalid".
  - `robots and axe` — `meta[name=robots]` is `noindex`, title `Import · OpenLearn`; axe serious/critical = 0 (AC-18).
- [ ] **Step 2:** With the stack running, `PUBLIC_SUPABASE_URL=… PUBLIC_SUPABASE_ANON_KEY=… pnpm test:e2e --project backend` → FAIL.
- [ ] **Step 3: Implement.** `+page.ts`: `export const ssr = false;`. Page: labelled textarea "YouTube video links, one per line", Import button disabled while `busy` (set before any `await`, which is what makes double submit safe); `ensureSession` then `sb.functions.invoke('ingest', { body: { input } })` (a 400/422 arrives as `error` of type `FunctionsHttpError`; read its body with `await error.context.json()` to get `failures`/`error`); errors and failures in an `aria-live="polite"` region; "Backend not configured" when `getSupabase()` is null. `.env.example` lists `PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` and `PUBLIC_SUPABASE_ANON_KEY=` with a comment pointing to `pnpm exec supabase status`.
- [ ] **Step 4:** Backend project → PASS; default `pnpm test:e2e` (landing suites) still PASS.
- [ ] **Step 5:** Commit `feat(start): add import page with lazy guest session`.

### Task 6: Focus Room `/learn` (AC-14 – AC-18)

**Files:**
- Create: `src/lib/youtube-player.ts`, `src/routes/learn/+page.ts`, `src/routes/learn/+page.svelte`, `e2e/backend/fake-yt.ts`, `e2e/backend/learn.spec.ts`, `e2e/backend/real-youtube.spec.ts`

**Interfaces:**
- Consumes: `getSupabase`, Task 3 tables and `save_position`, Task 5 navigation state.
- Produces: `loadYouTubeApi(): Promise<YTNamespace>` — resolves immediately if `window.YT?.Player` exists (this is what lets tests inject a fake), otherwise injects `https://www.youtube.com/iframe_api` once and resolves on `onYouTubeIframeAPIReady`. `YTNamespace` is a minimal local type: `Player` constructor with `cueVideoById({ videoId, startSeconds })`, `loadVideoById({ videoId, startSeconds })`, `getCurrentTime(): number`, `destroy()`, events `onReady`, `onStateChange` (`PLAYING = 1`, `PAUSED = 2`).
- Produces: `e2e/backend/fake-yt.ts` `installFakeYT(page)` — `addInitScript` defining `window.YT` whose `Player` records `window.__yt = { constructed, cued: [], loaded: [], time, setTime(s), pause() }`; `pause()` fires `onStateChange({ data: 2 })`. `importPath(page, urls): Promise<string>` returns the public code.

- [ ] **Step 1: Write failing tests** `learn.spec.ts` (with `installFakeYT`):
  - `player box is at least 200×200 and uncovered` — at viewports 360×740, 768×1024, 1280×800: `[data-testid=player]` box `width ≥ 200 && height ≥ 200`; `document.elementFromPoint` at its centre is inside it (AC-14).
  - `resumes where the learner paused` — import, `__yt.setTime(90.4)`, `__yt.pause()`, wait for the `rpc/save_position` response, reload; `__yt.cued.at(-1)` equals `{ videoId: 'dQw4w9WgXcQ', startSeconds: 90 }`; text `Resumed at 1:30` visible (AC-15).
  - `switching videos does not remount` — click the second list button; `__yt.constructed === 1`, `__yt.loaded.at(-1).videoId === 'M7lc1UVf-VE'`; that button has `aria-current="true"` (AC-16).
  - `unknown and foreign codes say Path not found` — `/learn?path=OL-ZZZZZ`, and guest A's code opened in a fresh context (guest B), both show `Path not found` (AC-17).
  - `does not save a non-finite time` — `__yt.setTime(NaN)`, `pause()`; no `rpc/save_position` request within 1 s (Review Focus 5).
  - `import failures are listed beside the player` — import with one vimeo line; the list item is visible and does not intersect the player box.
  - `robots and axe` — `noindex`, title `Focus Room · OpenLearn`, axe serious/critical = 0 (AC-18).
  - `real-youtube.spec.ts` (no fake): `/learn` for an imported path shows an `iframe[src*="youtube.com/embed"]` within 15 s. Tagged `@real-youtube` (spec OQ-3).
- [ ] **Step 2:** Backend project → FAIL.
- [ ] **Step 3: Implement.** `+page.ts`: `ssr = false`. Page reads `path` from `page.url.searchParams` (trimmed, upper-cased), selects the path, its resources (`select('id, order_key, video(provider_video_id, title)')` ordered by `order_key`) and own `resource_progress`; none → "Path not found". Player container is created once (`data-testid="player"`, `aspect-video`, `min-w-[200px] min-h-[200px]`), outside any `{#if}` that changes with selection. Resume per spec §3.3.5; `fmt(s)` → `m:ss`. Save every 10 s while `PLAYING`, on `PAUSED`, on `visibilitychange`→hidden and `pagehide`, skipping when `!Number.isFinite(t)`; calls `rpc('save_position', { p_resource_id, p_seconds: Math.floor(t) })`. Layout: CSS grid, two columns ≥ 768 px, stacked below; failures list and offline notice live in the list column. Thumbnails `https://i.ytimg.com/vi/<id>/mqdefault.jpg`, `alt=""`. Iframe `title` per spec §5 (passed via player `onReady` → `getIframe().title`).
- [ ] **Step 4:** Backend project → PASS; landing suites PASS.
- [ ] **Step 5:** Commit `feat(learn): add Focus Room with resume`.

### Task 7: CI backend job and leak check (AC-19 – AC-21)

**Files:**
- Modify: `.github/workflows/ci.yml` (new job `backend`), `CONTRIBUTING.md` (local backend setup: Docker, `pnpm db:start`, `.env`, test commands), `specs/README.md` status stays `Draft` until merge

**Interfaces:**
- Consumes: all scripts above.

- [ ] **Step 1:** Add job `backend` (ubuntu-latest, Node 24, pnpm): `pnpm install --frozen-lockfile` → `pnpm exec supabase start` → `pnpm exec supabase status -o env >> "$GITHUB_ENV"` (then map `API_URL`→`PUBLIC_SUPABASE_URL`, `ANON_KEY`→`PUBLIC_SUPABASE_ANON_KEY`) → `pnpm test:unit` → `pnpm test:integration` → `pnpm exec playwright install --with-deps chromium` → `pnpm build` → `! grep -rqF "$SERVICE_ROLE_KEY" build/` (AC-21) → `pnpm test:e2e --project backend --grep-invert @real-youtube` → a final step `pnpm test:e2e --project backend --grep @real-youtube` with `continue-on-error: true` (OQ-3). Add the functions-serve step only if Task 1 recorded it as needed.
- [ ] **Step 2:** Verify locally the same sequence passes; `ls build/404.html` exists and the landing e2e suite passes (AC-19).
- [ ] **Step 3:** Commit `ci: run Supabase-backed tests on every PR`.
- [ ] **Step 4 (controller, owner approval required):** ask the owner before pushing; after approval push the branch, open a draft PR, and confirm both CI jobs are green (AC-20).

---

## Spec coverage

| Spec | Task |
|---|---|
| §3.1, AC-13 | 5 |
| §3.2, AC-9–12 | 4 (import mode from 1) |
| §3.3, AC-14–17 | 6 |
| §3.4, AC-8 | 3 |
| §4.1–4.2, AC-3–7 | 3 |
| §4.3, AC-1–2 | 2 |
| §4.4 | 5 (browser), 4 (function) |
| §5, §6, AC-18 | 5, 6 |
| AC-19–21 | 7 |
| OQ-1 | 1 · OQ-3 | 6, 7 |
