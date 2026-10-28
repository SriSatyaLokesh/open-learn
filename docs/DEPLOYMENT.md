# Static Deployment Guide (Cloudflare Workers Static Assets)

OpenLearn's landing page is a SvelteKit 3 site prerendered to plain files and served by Cloudflare as static assets. There is no Worker script and no server runtime. Architecture decision and acceptance criteria: [SPEC-0002](../specs/sveltekit-migration/spec.md).

---

## 1. Assets-only model

```text
pnpm build  ──►  build/ (index.html, 404.html, _app/immutable/*)  ──►  wrangler deploy  ──►  Cloudflare global asset cache
```

[`wrangler.json`](../wrangler.json) declares only an `assets` block and has no `main`:

- `directory: ./build` is the `@sveltejs/adapter-static` output.
- `not_found_handling: 404-page` serves `build/404.html` with HTTP status 404. The page comes from `src/routes/404/+page.svelte`, prerendered.
- `html_handling: auto-trailing-slash` is the default URL normalization.

---

## 2. Caching (`static/_headers`)

[`static/_headers`](../static/_headers) holds one rule:

```text
/_app/immutable/*
  Cache-Control: public, max-age=31536000, immutable
```

Hashed build assets are cached for a year. HTML keeps Cloudflare's default `public, max-age=0, must-revalidate`, so a deploy is visible immediately.

Do not add a `/*` rule. Cloudflare merges the values of every matching `_headers` rule, so a catch-all would be appended to the immutable header instead of being overridden.

---

## 3. Secrets

Set both as GitHub repository secrets:

| Secret | Purpose |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Token with *Workers Scripts: Edit* permission |
| `CLOUDFLARE_ACCOUNT_ID` | Target Cloudflare account |

---

## 4. CI flow

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml):

| Job | Runs on | Steps |
|---|---|---|
| `verify` | Pull request, push, manual dispatch | `pnpm install --frozen-lockfile` → `lint` → `check` → `build` → install Chromium → `test:e2e`. Uploads `playwright-report` on failure. |
| `deploy` | Push to `main`, manual dispatch | Deploys when both secrets exist; otherwise logs a warning and skips. |

---

## 5. Manual deploy

```bash
corepack enable
pnpm install
pnpm exec wrangler login
pnpm run deploy        # pnpm build && wrangler deploy
```

Use `pnpm run deploy`: plain `pnpm deploy` is a built-in pnpm command, not this script.

Check caching afterwards:

```bash
curl -sI https://<your-domain>/ | grep -i cache-control
curl -sI https://<your-domain>/_app/immutable/<any-file>.js | grep -i cache-control
```

Expected: `public, max-age=0, must-revalidate` for HTML, exactly `public, max-age=31536000, immutable` for hashed assets.

---

## 6. Rollback

Revert the merge commit on `main`. CI redeploys the previous build.
