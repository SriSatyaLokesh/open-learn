# SPEC-0003 research findings

## OQ-1: sharing `parse.ts` with the Deno edge function

- **IMPORT_MODE = relative**. `supabase/functions/ingest/index.ts` imports
  `../../../src/modules/youtube/parse.ts` directly; no copy step needed. Verified: GET
  `$API_URL/functions/v1/ingest` with the anon key returns `ok` (HTTP 200).
- **Serve command**: none separate. `supabase start` (`pnpm db:start`) serves functions itself via the
  edge-runtime container; the probe responded without `supabase functions serve`.
- The `functions:sync` copy fallback was not needed.

## `pnpm exec supabase status -o env` variable names

`ANON_KEY`, `API_URL`, `DB_URL`, `FUNCTIONS_URL`, `GRAPHQL_URL`, `INBUCKET_URL`, `JWT_SECRET`,
`MAILPIT_URL`, `MCP_URL`, `PUBLISHABLE_KEY`, `REST_URL`, `S3_PROTOCOL_ACCESS_KEY_ID`,
`S3_PROTOCOL_ACCESS_KEY_SECRET`, `S3_PROTOCOL_REGION`, `SECRET_KEY`, `SERVICE_ROLE_KEY`,
`STORAGE_S3_URL`, `STUDIO_URL`. So legacy `ANON_KEY`/`SERVICE_ROLE_KEY` exist alongside the new
`PUBLISHABLE_KEY`/`SECRET_KEY`.

## Windows port note

Local ports in `supabase/config.toml` are shifted from 543xx to 553xx (api 55321, db 55322, studio 55323,
...) because Windows/Hyper-V reserves the excluded range 54293-54392, which made `supabase start` fail
with "Ports are not available". Use `http://127.0.0.1:55321` as `API_URL`.
