# RESEARCH: SVELTEKIT FRONTEND MIGRATION

**Specification:** [SPEC-0002](./spec.md) · **Date:** 2026-10-28
**Purpose:** Facts and pinned decisions the [plan](./plan.md) depends on. Every version below was read from the npm registry on 2026-10-28; every Cloudflare behaviour is cited.

---

## R1. Current codebase inventory (on `main` @ `396b9df`)

| Finding | Evidence | Consequence for the port |
|---|---|---|
| 14 React components (~1,880 lines) + layout + page | `src/components/**`, `src/app/**` | One-to-one Svelte port, SPEC-0002 §2.2 |
| **Only 4 components hold state** | `useState` in `HeroSection`, `PathVisualizer`, `PracticeDemo`, `HeaderNav` | Four `$state` ports; the other 10 are static markup |
| **Radix is installed but never imported** | No `@radix-ui` import in `src/` | Drop it; no Bits UI component needed for this spec |
| **`motion` is installed but never imported** | No `motion` import in `src/` | Drop it |
| **`class-variance-authority` is unused** | No `cva(` call | Drop it |
| `tailwindcss-animate` **is used** | `animate-in fade-in` in `PracticeDemo.tsx:122`, `slide-in-from-top-2` in `HeaderNav.tsx:81` | Keep the plugin |
| FAQ accordion is native `<details>`/`<summary>` | `FaqSection.tsx:38` | Port as-is, no JS needed |
| Every component is `'use client'` | grep | Irrelevant after the port; Svelte hydrates only what has state |
| `globals.css` (187 lines): CSS variables, shadcn-compatible HSL vars, `.taste-bg-mesh`, `.btn*`, `.badge-bracket` | `src/app/globals.css` | Move to `src/app.css` verbatim (minus `next`-specific bits, none found) |
| Fonts via `next/font/google` exposing `--font-outfit`, `--font-newsreader`, `--font-jetbrains-mono` | `layout.tsx` | Keep variable names; source them from `@fontsource-variable/*` |
| Metadata via Next `metadata` export | `layout.tsx:33–67` | `<svelte:head>` in `+layout.svelte` with identical values |
| `next.config.ts` image `remotePatterns` | config | Not needed: no `next/image` use; YouTube thumbnails are plain `<img>` per policy |
| Deploy: OpenNext SSR + `wrangler.json` with `main: .open-next/worker.js` | `cc9bf15`, `396b9df` | Replace with assets-only static delivery (§R3) |
| CI: Node 22, `npm ci`, `tsc`, `build:worker`, conditional deploy | `.github/workflows/deploy-cloudflare.yml` | Rewrite for pnpm, Node 24, lint/check/build/e2e |
| No ESLint config, no tests | repo | Introduced by this spec |

## R2. Pinned versions

Read from npm on 2026-10-28. The plan installs these exact majors; minor/patch may float via `^`.

| Package | Version | Notes |
|---|---|---|
| `@sveltejs/kit` | **3.1.0** | **Major 3.** Peers: `svelte ^5.57.1`, `vite ^8.0.12`, `@sveltejs/vite-plugin-svelte ^7`, **`typescript ^6.0.0`**. Engine **Node ≥ 22.17** |
| `svelte` | 5.57.3 | Runes (`$state`, `$derived`, `$props`) |
| `@sveltejs/vite-plugin-svelte` | 7.3.1 | Peer `vite ^8` |
| `vite` | 8.3.5 | |
| `@sveltejs/adapter-static` | 4.0.0 | Peer `@sveltejs/kit ^3` |
| `typescript` | **6.0.3 (pin `~6.0`)** | Kit needs `^6.0.0`; `typescript-eslint 8.72` supports `<6.1.0`. Latest TS is 7.0.2 — **not usable** yet |
| `svelte-check` | 4.7.7 | Peer TS `^5 \|\| ^6` |
| `eslint` | 10.13.0 | Flat config only |
| `eslint-plugin-svelte` | 3.23.1 | Peer `eslint ^8.57 \|\| ^9 \|\| ^10` |
| `typescript-eslint` | 8.72.1 | Peer TS `>=4.8.4 <6.1.0` |
| `tailwindcss` | **3.4.19** | Owner decision: stay on v3 (latest is 4.3.3) |
| `postcss`, `autoprefixer` | current | Tailwind 3 runs as a PostCSS plugin |
| `tailwindcss-animate` | 1.0.7 | Kept (R1) |
| `tailwind-merge`, `clsx` | current | `cn()` unchanged |
| `@lucide/svelte` | 1.63.0 | Peer `svelte ^5`. **`lucide-svelte` is deprecated** — do not use |
| `@fontsource-variable/outfit` | 5.3.0 | |
| `@fontsource-variable/newsreader` | 5.3.0 | Italic needed — import the italic axis file (verify name during T010) |
| `@fontsource-variable/jetbrains-mono` | 5.3.0 | |
| `bits-ui` | 2.20.2 | **Not installed by this spec** (no component needs it) |
| `@playwright/test` | 1.64.1 | |
| `@axe-core/playwright` | 4.14.0 | |
| `wrangler` | 4.154.0 | Engine Node ≥ 22 |
| `pnpm` | 12.15.0 | Set via `packageManager` field + Corepack |
| Node.js | **24 LTS in CI** (local ≥ 22.17) | Kit 3 requires ≥ 22.17; current CI uses 22 unpinned |

**Risk:** SvelteKit 3 is a new major. Its migration notes must be read before T005 (scaffold) for breaking changes from v2 conventions. The scaffold (`npx sv create`) is the source of truth for config shape; this plan does not hand-write `svelte.config.js` from memory.

## R3. Cloudflare static delivery

| Question | Answer | Source |
|---|---|---|
| Can a Worker deploy with assets only and no script? | Yes — omit `main`, set `assets.directory` | [Static site generation](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/) |
| Do asset requests count as Worker requests? | *"Requests are only billable if a Worker script is invoked."* | same |
| 404 behaviour | `not_found_handling: "404-page"` serves the nearest `404.html` with status 404 | same |
| Trailing slashes | `html_handling` default `auto-trailing-slash` | same |
| Cache headers | `_headers` file in the asset directory (SvelteKit: `static/`); ≤ 100 rules; not applied to Worker responses | [Headers](https://developers.cloudflare.com/workers/static-assets/headers/) |
| File cap | 20,000 files per deploy on Free | [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) — landing build is far below |

## R4. SvelteKit static specifics

- `adapter-static` writes to `build/` by default; `fallback` is **not** set for this spec (everything prerenders). A SPA `fallback` page arrives with client-only app routes.
- `export const prerender = true` in the root `+layout.ts` makes every route prerender; the build **fails** on any unprerenderable route, which is the desired guard (spec §3.1).
- 404: SvelteKit emits `404.html` only with an explicit route or `fallback`; the plan adds a prerendered `+error.svelte` and verifies `build/404.html` exists (T030). If Kit 3 does not emit it from `+error.svelte`, add a prerendered `src/routes/404/+page.svelte` and copy to `404.html` in a postbuild step.
- Hydration: Svelte hydrates the whole page; only components with `$state` carry meaningful JS. Expect total JS well below the Next.js App Router baseline (to be measured, AC-21).

### v3 changes affecting us

Source: [Migrating to SvelteKit 3](https://svelte.dev/docs/kit/migrating-to-sveltekit-3), read 2026-10-28, cross-checked against `npx sv@1.1.1 create` output.

- **No `svelte.config.js`.** It is no longer supported. Kit options (including `adapter`) and `compilerOptions` go into the `sveltekit({...})` plugin in `vite.config.ts`.
- **`$lib` is gone; use `#lib`.** Declared as `"imports": { "#lib/*": "./src/lib/*" }` in `package.json` (Node subpath imports). Imports need explicit extensions: `import { cn } from '#lib/utils.js'`. Every later task that says `$lib/...` means `#lib/....js`.
- **tsconfig** extends `"$app/tsconfig"` (not `./.svelte-kit/tsconfig.json`) and must declare its own `include`.
- `$app/environment` → `$app/env`; `$app/stores` removed (use `$app/state`). Not used by the landing page.
- `prerender.origin` → `paths.origin`. Not used.
- adapter-static: no breaking change listed; v4 requires Kit 3. `build/index.html` is emitted with `prerender = true`. No `404.html` is emitted without a route for it (as expected above; T030 still owns it).
- Requirements match R2: Node ≥ 22.17, TypeScript ≥ 6, Svelte ≥ 5.57.1, Vite ≥ 8.0.12.

## R5. React → Svelte translation reference

| React (current) | Svelte 5 (target) |
|---|---|
| `const [x, setX] = useState(v)` | `let x = $state(v)`; assign `x = …` |
| Derived value in render | `const y = $derived(expr)` |
| `className=` | `class=` |
| `{cond && <A/>}` | `{#if cond}<A/>{/if}` |
| `{list.map(i => <A key={i.id}/>)}` | `{#each list as i (i.id)}<A/>{/each}` |
| `onClick={() => f()}` | `onclick={() => f()}` |
| `<Icon className="w-4 h-4"/>` (lucide-react) | `<Icon class="w-4 h-4"/>` (`@lucide/svelte`) |
| `cn(...)` | `cn(...)` unchanged |
| `export function X()` + barrel | `X.svelte` + `index.ts` re-export of default |
| `import … from '@/…'` | `import … from '$lib/…'` |
| `metadata` export | `<svelte:head>` |
| `open={idx === 0}` on `<details>` | `open={idx === 0}` (same) |

## R6. Testing approach for parity

- **Playwright** against `vite preview` of the static build (what users get), Chromium + mobile viewport project.
- Interactive ACs (3–7, 19–20) are behavioural assertions on roles and text, not pixel snapshots.
- **Prerender check (AC-8):** fetch `/` with Playwright's request API (no JS) and assert copy is present.
- **Visual parity (AC-10)** is a manual review of screenshots captured from both builds at 375/768/1280 px. Automated pixel diffs are rejected: font rasterisation differs between `next/font` and `@fontsource`, producing false failures.
- **axe** via `@axe-core/playwright`, failing on `serious` and `critical`.

## R7. Toolchain decisions and their ADR basis

ADRs are used as written; this section is the record of choices they leave open.

| Decision | Choice | ADR basis | Why |
|---|---|---|---|
| Adapter | **`adapter-static`** | ADR 0001 (no request-time rendering; landing "prerendered at build"); ADR 0001b reason 2 (per-route `prerender`) | Every current route prerenders; static output means zero Worker invocations. **Deviation:** ADR 0001b's Decision names `adapter-cloudflare`. Moving a route to server rendering later means switching to `adapter-cloudflare` and keeping `prerender` on all other routes — no framework change |
| Delivery | Workers static assets, **no `main` script** | ADR 0001 ("static asset requests are free and unlimited… only requests that invoke the Worker script count") | Removes the OpenNext SSR pipeline |
| UI primitives | Bits UI + shadcn-svelte (copied in), **added on first need** | ADR 0001b Consequences ("re-decided in Svelte terms") | Radix equivalent; accessible, unstyled; Radix was never imported |
| Animation | Svelte transitions | same | `motion` was never imported |
| Icons | `@lucide/svelte` | same | `lucide-svelte` deprecated |
| Fonts | `@fontsource-variable/*` | same | Self-hosted, replaces `next/font` |
| Styling | Tailwind 3 | ADR 0001b ("TypeScript and Tailwind CSS") | Owner decision 2026-10-28 |
| Package manager | pnpm | ADR 0005 ("`pnpm install && pnpm dev`") | Matches the ADR |
| Lint | ESLint + boundary rule | ADR 0005 | Rule text taken from ADR 0005 |
| Tests | Playwright + axe now | ARCHITECTURE §21.3 | Suites land with the code they cover |

### Delivery configuration

```json
{
  "name": "open-learn",
  "compatibility_date": "2026-10-28",
  "assets": {
    "directory": "./build",
    "not_found_handling": "404-page",
    "html_handling": "auto-trailing-slash"
  }
}
```

`static/_headers`:

| Path | `Cache-Control` |
|---|---|
| `/_app/immutable/*` | `public, max-age=31536000, immutable` |
| HTML | no rule; Cloudflare's default `public, max-age=0, must-revalidate` applies |

The file holds only the `/_app/immutable/*` rule: Cloudflare merges the values of every matching `_headers` rule, so a `/*` rule would also add `max-age=0, must-revalidate` to hashed assets.

`not_found_handling` moves to `single-page-application` when client-rendered app routes arrive.
