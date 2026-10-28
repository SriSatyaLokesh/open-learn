# QUICKSTART: SVELTEKIT FRONTEND (SPEC-0002)

How to run, test, build and deploy the frontend once [SPEC-0002](./spec.md) is implemented. This doubles as the manual verification script for reviewers.

## Prerequisites

- Node.js **≥ 22.17** (CI uses 24 LTS)
- Corepack (ships with Node)
- No accounts or API keys are needed for local development

## Setup

```bash
corepack enable
pnpm install
```

## Everyday commands

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server with hot reload at `http://localhost:5173` |
| `pnpm build` | Prerenders every route into `build/` (fails if any route can't prerender) |
| `pnpm preview` | Serves `build/` locally, the same files users get |
| `pnpm lint` | ESLint, including the module-boundary rule (ADR 0005) |
| `pnpm check` | `svelte-check` type checking |
| `pnpm test:e2e` | Playwright parity + accessibility tests against the built site |
| `pnpm run deploy` | Build and upload `build/` to Cloudflare as static assets (needs credentials) |

## Reviewer verification (10 minutes)

1. `pnpm build` — confirm `build/index.html` and `build/404.html` exist and there is **no** `.open-next/` or Worker script.
2. `pnpm preview`, open the site:
   - Click each Hero queue item → the mock player's active concept changes (default: third item).
   - Click each Path Visualizer node → drawer updates (default: third node).
   - Practice: pick an answer → Submit → feedback and explanation; Reset clears.
   - FAQ: first item open; others toggle independently.
   - Narrow the window below 768 px → menu toggle opens/closes; clicking a link closes it.
3. Visit `/does-not-exist` → styled 404 page.
4. View source of `/` → full landing copy is in the HTML without JavaScript.
5. `pnpm test:e2e` → all green on desktop and mobile projects.
6. Compare against `specs/sveltekit-migration/baseline/*.png` at 375 / 768 / 1280 px.

## Deploy

CI deploys automatically on push to `main` when these repository secrets exist:

| Secret | Purpose |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Token with *Workers Scripts: Edit* permission |
| `CLOUDFLARE_ACCOUNT_ID` | Target account |

Without them, CI still verifies everything and skips deploy with a warning.

Manual deploy: `pnpm run deploy` (after `wrangler login`). Note: plain `pnpm deploy` is a built-in pnpm command, not our script.

Check caching after deploy:

```bash
curl -sI https://<your-domain>/ | grep -i cache-control
curl -sI https://<your-domain>/_app/immutable/<any-file>.js | grep -i cache-control
```

Expected: `max-age=0, must-revalidate` for HTML; `max-age=31536000, immutable` for hashed assets.

## Rollback

Revert the merge commit on `main`; CI redeploys the previous build.
