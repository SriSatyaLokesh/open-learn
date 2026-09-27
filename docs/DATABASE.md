# OpenLearn — Database Design

**Companion to** [`ARCHITECTURE.md`](./ARCHITECTURE.md). Source of truth for the schema is `supabase/migrations/` — this document explains it and should be read before writing a migration.

**Conventions**

- `uuid` primary keys, `gen_random_uuid()` default.
- `timestamptz`, always UTC.
- `snake_case`; tables singular.
- Every table has RLS **enabled**. A table with no policy is inaccessible, not open.
- Ordering uses `order_key text` (fractional/LexoRank), never integer indexes.
- Money-free, but progress and XP are correctness-sensitive: treat them with the same care.

---

## 1. Identity

Supabase owns `auth.users`. Never extend it; join to it.

```sql
create table profile (
  id                  uuid primary key references auth.users(id) on delete cascade,
  handle              citext unique not null,
  display_name        text not null,
  bio                 text,
  avatar_url          text,                      -- R2 object URL
  activity_visibility text not null default 'public'
                        check (activity_visibility in ('public','followers','private')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table user_interest (
  user_id     uuid not null references profile(id) on delete cascade,
  category_id uuid not null references category(id) on delete cascade,
  primary key (user_id, category_id)
);
```

`activity_visibility` implements PRD §37's requirement that users control the visibility of their learning activity — it is read by the `activity` policies in §9.

A row in `profile` is created by a trigger on `auth.users` insert, so anonymous (guest) users get one immediately and conversion needs no backfill.

### 1.1 Anonymous users

Guests are real `auth.users` rows created by Supabase anonymous sign-in, carrying `is_anonymous: true` in the JWT. Conversion to a permanent account preserves `auth.users.id`, so **no data migration is required** — this is the whole reason the feature was chosen over a client-side store.

Helper used throughout the policies below:

```sql
create or replace function is_guest() returns boolean
language sql stable as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;
```

---

## 2. Curriculum

```sql
create table category (
  id    uuid primary key default gen_random_uuid(),
  slug  text unique not null,
  name  text not null
);

create table learning_path (
  id                  uuid primary key default gen_random_uuid(),
  public_code         text unique not null,           -- OL-8F39A, immutable
  slug                text unique,                    -- SEO, mutable
  title               text not null,
  description         text,
  author_id           uuid not null references profile(id) on delete cascade,
  visibility          text not null default 'private'
                        check (visibility in ('private','unlisted','public')),
  status              text not null default 'draft'
                        check (status in ('draft','published','archived')),
  forked_from_path_id uuid references learning_path(id) on delete set null,
  root_path_id        uuid references learning_path(id) on delete set null,
  is_approved_course  boolean not null default false,
  star_count          integer not null default 0,
  fork_count          integer not null default 0,
  moderation_state    text not null default 'ok'
                        check (moderation_state in ('ok','quarantined','hidden','removed')),
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table path_category (
  path_id     uuid not null references learning_path(id) on delete cascade,
  category_id uuid not null references category(id) on delete cascade,
  primary key (path_id, category_id)
);

create table path_slug_history (
  slug       text primary key,
  path_id    uuid not null references learning_path(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table module (
  id        uuid primary key default gen_random_uuid(),
  path_id   uuid not null references learning_path(id) on delete cascade,
  title     text not null,
  order_key text not null
);

create table concept (
  id        uuid primary key default gen_random_uuid(),
  module_id uuid not null references module(id) on delete cascade,
  path_id   uuid not null references learning_path(id) on delete cascade,  -- denormalised
  title     text not null,
  order_key text not null
);
```

Notes on deliberate choices:

- **`status` has no `ai_suggested` value.** v1 included one, which contradicts PRD §6's non-goal of making AI a core dependency.
- **`concept.path_id` is denormalised** so RLS policies and progress queries do not need a two-hop join through `module` on every row check. Maintained by trigger.
- **`root_path_id`** makes "all descendants of this path" a plain indexed query, leaving recursion only for walking a single chain.
- **`path_slug_history`** means renaming a path never breaks an inbound link — required because slugs are public and SEO-relevant.

```sql
create index on learning_path (author_id);
create index on learning_path (root_path_id);
create index on learning_path (visibility, status, published_at desc);
create index on module (path_id, order_key);
create index on concept (module_id, order_key);
create index on concept (path_id);
```

---

## 3. Third-party content

```sql
create table video (
  id                uuid primary key default gen_random_uuid(),
  provider          text not null default 'youtube',
  provider_video_id text not null,

  -- Descriptive data from the provider API.
  -- YouTube Developer Policies III.E.4.d: refresh or delete within 30 days.
  title             text,
  channel_name      text,
  duration_seconds  integer,
  embeddable        boolean,
  region_blocked    text[],

  availability      text not null default 'available'
                      check (availability in ('available','unavailable','embed_disabled','geo_blocked','unknown')),
  last_synced_at    timestamptz,
  created_at        timestamptz not null default now(),

  unique (provider, provider_video_id)
);

create index on video (last_synced_at nulls first);
```

### 3.1 The retention rule is a schema concern

v1 called this table's contents *"immutable from the perspective of OpenLearn"*. That is a policy violation.

| Field | Retention |
|---|---|
| `provider`, `provider_video_id` | Indefinite — an identifier the user supplied, not fetched descriptive content. *(Documented interpretation; the policy states no explicit carve-out.)* |
| `title`, `channel_name`, `duration_seconds`, `embeddable`, `region_blocked` | **Must be refreshed or cleared within 30 days.** Governed by `last_synced_at` and the sweep in §14. |
| Thumbnails | **Never stored.** Derived at render time as `https://i.ytimg.com/vi/{provider_video_id}/hqdefault.jpg`. |

`last_synced_at` is indexed `nulls first` so the sweep naturally picks up never-synced rows first.

```sql
create table resource (
  id            uuid primary key default gen_random_uuid(),
  concept_id    uuid not null references concept(id) on delete cascade,
  path_id       uuid not null references learning_path(id) on delete cascade, -- denormalised
  video_id      uuid not null references video(id) on delete restrict,
  kind          text not null default 'primary' check (kind in ('primary','alternative')),
  order_key     text not null,
  health_status text not null default 'ok' check (health_status in ('ok','broken','replaced')),
  source_url    text,                        -- original URL, for attribution (PRD §11)
  created_at    timestamptz not null default now()
);

create index on resource (concept_id, order_key);
create index on resource (video_id);
create index on resource (path_id);
create unique index resource_one_primary_per_concept
  on resource (concept_id) where kind = 'primary';
```

- **`on delete restrict` on `video_id`** — a `video` row is shared by every path that references it and must never be removed while in use.
- **The partial unique index** enforces PRD §14's "one primary, many alternatives" at the database level rather than in application code.
- **`health_status`** is what PRD §47's "broken-resource states and replacement flows" needs and v1 lacked. Set by the sweep in §14.

---

## 4. Progress

Two tables, because completion belongs to a concept and position belongs to a video. See `ARCHITECTURE.md` §6.2.

```sql
create table user_path (
  user_id            uuid not null references profile(id) on delete cascade,
  path_id            uuid not null references learning_path(id) on delete cascade,
  enrolled_at        timestamptz not null default now(),
  last_active_at     timestamptz,
  concepts_total     integer not null default 0,
  concepts_completed integer not null default 0,
  percent_complete   smallint not null default 0,
  primary key (user_id, path_id)
);

create table concept_progress (
  user_id           uuid not null references profile(id) on delete cascade,
  concept_id        uuid not null references concept(id) on delete cascade,
  path_id           uuid not null references learning_path(id) on delete cascade,
  status            text not null default 'in_progress'
                      check (status in ('in_progress','completed')),
  active_resource_id uuid references resource(id) on delete set null,
  completed_at      timestamptz,
  updated_at        timestamptz not null default now(),
  primary key (user_id, concept_id)
);

create table resource_progress (
  user_id               uuid not null references profile(id) on delete cascade,
  resource_id           uuid not null references resource(id) on delete cascade,
  last_position_seconds integer not null default 0 check (last_position_seconds >= 0),
  watched_seconds       integer not null default 0 check (watched_seconds >= 0),
  updated_at            timestamptz not null default now(),
  primary key (user_id, resource_id)
);

create index on concept_progress (user_id, path_id);
create index on user_path (user_id, last_active_at desc);
```

`resource_progress` is the Focus Room's only high-frequency write target — a narrow table on a composite primary key, so an upsert is a single index lookup.

### 4.1 The merge rules are in the write path, not the client

These are the only supported ways to write progress. They make cross-device conflicts correct by construction, which answers the question v1 left open.

```sql
-- Playback position: monotonic. A stale device must never rewind a learner.
insert into resource_progress (user_id, resource_id, last_position_seconds, watched_seconds)
values ($1, $2, $3, $4)
on conflict (user_id, resource_id) do update set
  last_position_seconds = greatest(resource_progress.last_position_seconds,
                                   excluded.last_position_seconds),
  watched_seconds       = greatest(resource_progress.watched_seconds,
                                   excluded.watched_seconds),
  updated_at = now();

-- Completion: union. Once complete from any device, never un-completes.
insert into concept_progress (user_id, concept_id, path_id, status, completed_at)
values ($1, $2, $3, 'completed', now())
on conflict (user_id, concept_id) do update set
  status       = case when concept_progress.status = 'completed'
                      then 'completed' else excluded.status end,
  completed_at = coalesce(concept_progress.completed_at, excluded.completed_at),
  updated_at   = now();
```

### 4.2 Rollup trigger

`user_path.concepts_completed` and `percent_complete` are maintained by an `after insert or update` trigger on `concept_progress`, and `concepts_total` by a trigger on `concept`. PRD §18's dashboard is then a single indexed read instead of an aggregate scan.

---

## 5. Notes

```sql
create table note (
  id                uuid primary key default gen_random_uuid(),
  author_id         uuid not null references profile(id) on delete cascade,
  path_id           uuid not null references learning_path(id) on delete cascade,
  concept_id        uuid references concept(id) on delete set null,
  resource_id       uuid references resource(id) on delete set null,
  timestamp_seconds integer check (timestamp_seconds >= 0),
  content_markdown  text not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table note_history (
  id         uuid primary key default gen_random_uuid(),
  note_id    uuid not null references note(id) on delete cascade,
  content_markdown text not null,
  replaced_at timestamptz not null default now()
);

create table path_note (
  id               uuid primary key default gen_random_uuid(),
  author_id        uuid not null references profile(id) on delete cascade,
  path_id          uuid not null references learning_path(id) on delete cascade,
  content_markdown text not null,
  updated_at       timestamptz not null default now(),
  unique (author_id, path_id)
);

create index on note (author_id, path_id);
create index on note (resource_id, timestamp_seconds);
create index on note (concept_id);
```

- **`concept_id` was missing in v1.** Without it a note cannot follow a learner who switches to an alternative explanation of the same concept, which is the point of PRD §14.
- **`note_history`** holds the losing side of an offline last-write-wins merge. Cheap insurance against the rare concurrent-offline edit, and far simpler than a CRDT.
- **`path_note`** is PRD §17's course-level document — a separate object with a different access pattern, unique per author per path.
- **Markdown is sanitised server-side before insert.** Client-side sanitisation is a rendering convenience, never the control.

---

## 6. Social

```sql
create table star (
  user_id    uuid not null references profile(id) on delete cascade,
  path_id    uuid not null references learning_path(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, path_id)
);

create table follow (
  follower_id uuid not null references profile(id) on delete cascade,
  followee_id uuid not null references profile(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index on follow (followee_id);
create index on star (path_id);
```

`learning_path.star_count` and `fork_count` are maintained by trigger — public pages are prerendered, so counts must be correct at render time without an aggregate query.

---

## 7. Study groups

PRD §27 in full; v1 had only two of these tables.

```sql
create table study_group (
  id          uuid primary key default gen_random_uuid(),
  public_code text unique not null,
  name        text not null,
  description text,
  path_id     uuid references learning_path(id) on delete set null,
  owner_id    uuid not null references profile(id) on delete cascade,
  visibility  text not null default 'private' check (visibility in ('private','public')),
  target_date date,
  created_at  timestamptz not null default now()
);

create table group_member (
  group_id  uuid not null references study_group(id) on delete cascade,
  user_id   uuid not null references profile(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner','moderator','member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table group_announcement (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references study_group(id) on delete cascade,
  author_id  uuid not null references profile(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

create table group_invite (
  token      text primary key,
  group_id   uuid not null references study_group(id) on delete cascade,
  created_by uuid not null references profile(id) on delete cascade,
  expires_at timestamptz not null,
  used_at    timestamptz
);
```

Group progress and group leaderboards are derived from members' `user_path` rollups and `xp_ledger` — no separate stored aggregate until measurement demands one.

---

## 8. Gamification

```sql
create table xp_ledger (
  id         bigserial primary key,
  user_id    uuid not null references profile(id) on delete cascade,
  event_type text not null check (event_type in (
                'concept_completed','path_completed','note_created',
                'path_published','path_forked','streak_day','challenge_completed')),
  entity_id  uuid,
  xp         integer not null check (xp > 0),
  created_at timestamptz not null default now()
);

create index on xp_ledger (user_id, created_at desc);
create index on xp_ledger (created_at desc);
create unique index xp_ledger_dedupe
  on xp_ledger (user_id, event_type, entity_id)
  where entity_id is not null;
```

### 8.1 The `event_type` CHECK constraint is a compliance control

YouTube Developer Policies prohibit incentivising or rewarding users for watching a video. Every value in that list is an **OpenLearn learning event**; there is no watch-duration-derived value, and adding one would require a migration that a reviewer would see.

This is deliberate: putting the boundary in a `CHECK` constraint enforces it far better than a comment or a style guide. See `YOUTUBE_INTEGRATION.md` §4.

The partial unique index makes XP award idempotent — replaying an offline outbox or retrying a job cannot double-award.

```sql
create table streak (
  user_id          uuid primary key references profile(id) on delete cascade,
  current_days     integer not null default 0,
  longest_days     integer not null default 0,
  last_active_date date
);

create table badge (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text not null,
  criteria    jsonb not null
);

create table badge_award (
  user_id    uuid not null references profile(id) on delete cascade,
  badge_id   uuid not null references badge(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  source_event_id bigint references xp_ledger(id) on delete set null,
  primary key (user_id, badge_id)
);

create table challenge (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text,
  scope       text not null default 'global' check (scope in ('global','group')),
  group_id    uuid references study_group(id) on delete cascade,
  goal        jsonb not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  check (ends_at > starts_at)
);

create table challenge_participant (
  challenge_id uuid not null references challenge(id) on delete cascade,
  user_id      uuid not null references profile(id) on delete cascade,
  progress     jsonb not null default '{}',
  completed_at timestamptz,
  primary key (challenge_id, user_id)
);
```

`criteria` and `goal` are `jsonb` because badge and challenge definitions are content, not code — adding a badge should be a seed row, not a deploy.

### 8.2 Leaderboards

Start with a window function over the ledger. No stored aggregate until latency is measured.

```sql
select p.handle, p.display_name, sum(x.xp) as xp,
       rank() over (order by sum(x.xp) desc) as position
from xp_ledger x
join profile p on p.id = x.user_id
where x.created_at >= date_trunc('week', now())
group by p.id, p.handle, p.display_name
order by xp desc
limit 100;
```

Escalation, in order, each only when measured: materialised view refreshed by `pg_cron` with `REFRESH MATERIALIZED VIEW CONCURRENTLY` (needs a unique index), then a trigger-maintained aggregate table.

---

## 9. Activity and notifications

```sql
create table activity (
  id          bigserial primary key,
  actor_id    uuid not null references profile(id) on delete cascade,
  verb        text not null check (verb in (
                'published_path','forked_path','starred_path',
                'completed_path','earned_certificate','joined_group')),
  entity_type text not null,
  entity_id   uuid not null,
  created_at  timestamptz not null default now()
);

create index on activity (actor_id, created_at desc);
create index on activity (created_at desc);
```

A follower's feed is a join, not a fan-out:

```sql
select a.* from activity a
join follow f on f.followee_id = a.actor_id
join profile p on p.id = a.actor_id
where f.follower_id = auth.uid()
  and (p.activity_visibility = 'public'
       or (p.activity_visibility = 'followers'))
  and (a.created_at, a.id) < ($1, $2)     -- keyset pagination
order by a.created_at desc, a.id desc
limit 30;
```

`activity` is prunable beyond 90 days and is the first table to trim when the 500 MB budget tightens.

```sql
create table notification (
  id         bigserial primary key,
  user_id    uuid not null references profile(id) on delete cascade,
  type       text not null,
  payload    jsonb not null,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create table notification_preference (
  user_id uuid not null references profile(id) on delete cascade,
  type    text not null,
  in_app  boolean not null default true,
  email   boolean not null default false,
  push    boolean not null default false,
  primary key (user_id, type)
);

create table push_subscription (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profile(id) on delete cascade,
  endpoint   text unique not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create table notification_outbox (
  id           bigserial primary key,
  user_id      uuid not null references profile(id) on delete cascade,
  payload      jsonb not null,
  attempts     integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  sent_at      timestamptz,
  failed_at    timestamptz
);

create index on notification (user_id, created_at desc) where read_at is null;
create index on notification_outbox (next_attempt_at) where sent_at is null and failed_at is null;
```

`push_subscription` rows are deleted when the push service returns 404 or 410 — a dead subscription must not be retried forever.

---

## 10. Certificates

```sql
create table completion_rule (
  path_id            uuid primary key references learning_path(id) on delete cascade,
  require_all_concepts boolean not null default true,
  min_percent        smallint not null default 100 check (min_percent between 1 and 100),
  extra              jsonb not null default '{}'
);

create table certificate (
  id                 uuid primary key default gen_random_uuid(),
  public_code        text unique not null,          -- OL-CERT-8F39A
  user_id            uuid not null references profile(id) on delete restrict,
  path_id            uuid not null references learning_path(id) on delete restrict,
  learner_name       text not null,                 -- snapshot at issue time
  path_title         text not null,                 -- snapshot at issue time
  completion_snapshot jsonb not null,
  verification_hash  text not null,
  issued_at          timestamptz not null default now(),
  revoked_at         timestamptz,
  revoked_reason     text
);

create index on certificate (user_id);
```

### 10.1 What the hash actually is

v1 specified `verification_hash` with no payload, no key and no procedure. An unspecified hash proves nothing — a verifier recomputing a digest over public data establishes only that the data is self-consistent.

```text
payload = public_code || '|' || user_id || '|' || path_public_code || '|'
        || to_char(issued_at,'YYYY-MM-DD"T"HH24:MI:SSOF') || '|'
        || sha256(canonical_json(completion_snapshot))

verification_hash = hmac_sha256(payload, CERT_SIGNING_KEY)
```

- `CERT_SIGNING_KEY` lives **only** in Edge Function secrets. It never reaches the browser and is never stored in Postgres.
- Issuance and verification both happen in an Edge Function under the service role. The `public_code` is the lookup key; the HMAC is the tamper check.
- Name and title are **snapshotted** so a later rename cannot alter an issued certificate.
- `on delete restrict` on both foreign keys — an issued certificate is a record of fact and must not vanish because a path was deleted. Account deletion is handled explicitly in §13.
- Revocation is a field, not a delete, so a revoked certificate still verifies — as revoked.

---

## 11. Moderation

PRD §35 and §36 require a state machine and an audit trail. v1 mentioned `REPORT` only in passing.

```sql
create table report (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid references profile(id) on delete set null,
  entity_type  text not null check (entity_type in ('path','note','profile','group','resource')),
  entity_id    uuid not null,
  reason       text not null check (reason in (
                 'spam','inappropriate','malicious_link','misleading','abuse','copyright')),
  detail       text,
  status       text not null default 'open'
                 check (status in ('open','reviewing','actioned','dismissed')),
  created_at   timestamptz not null default now()
);

create table moderation_action (
  id         bigserial primary key,
  report_id  uuid references report(id) on delete set null,
  actor_id   uuid not null references profile(id) on delete restrict,
  action     text not null check (action in (
               'hide','quarantine','remove','restore','warn','suspend','dismiss')),
  entity_type text not null,
  entity_id  uuid not null,
  reason     text not null,
  created_at timestamptz not null default now()
);

create index on report (status, created_at);
create index on moderation_action (entity_type, entity_id);
```

`moderation_action` is **append-only**: no update or delete policy exists for anyone, including moderators. That is what makes PRD §35's "every administrative action affecting public content should be auditable" true rather than aspirational.

---

## 12. Operational tables

```sql
-- Postgres-native rate limiter. Atomic in one statement; no Redis.
create table rate_limit (
  key          text not null,
  window_start timestamptz not null,
  count        integer not null default 0,
  primary key (key, window_start)
);

-- YouTube quota accounting. Quota is per Google Cloud project — shared by all users.
create table quota_ledger (
  day        date not null,
  provider   text not null default 'youtube',
  units_used integer not null default 0,
  primary key (day, provider)
);

-- Prerender bookkeeping for the R2 pipeline.
create table prerender_state (
  path_id      uuid primary key references learning_path(id) on delete cascade,
  r2_key       text not null,
  content_hash text,
  rendered_at  timestamptz,
  stale        boolean not null default true
);

create index on prerender_state (stale) where stale;
```

Rate limit check — one statement, no race:

```sql
insert into rate_limit (key, window_start, count)
values ($1, date_trunc('minute', now()), 1)
on conflict (key, window_start) do update set count = rate_limit.count + 1
returning count;
```

`prerender_state.stale` is the coalescing mechanism for `ARCHITECTURE.md` §24's open question: a metadata refresh marks affected paths stale rather than re-rendering thousands of pages inline.

A `pg_cron` job deletes `rate_limit` rows older than a day.

---

## 13. Row Level Security

Every table has `alter table … enable row level security`. Policies below are representative; the migration is authoritative.

### 13.1 Reading a path

```sql
create policy path_read on learning_path for select using (
  moderation_state = 'ok'
  and (
    (visibility = 'public' and status = 'published')
    or author_id = auth.uid()
    or exists (
      select 1 from group_member gm
      join study_group g on g.id = gm.group_id
      where gm.user_id = auth.uid() and g.path_id = learning_path.id
    )
  )
);
```

Children (`module`, `concept`, `resource`) delegate to the same check via their denormalised `path_id`, which is why that column exists.

### 13.2 Writing a path — guests are barred by policy

```sql
create policy path_insert on learning_path for insert to authenticated
with check (author_id = auth.uid());

create policy path_update on learning_path for update to authenticated
using (author_id = auth.uid())
with check (
  author_id = auth.uid()
  -- Publishing requires a permanent account (PRD §19).
  and (visibility <> 'public' or not is_guest())
  -- is_approved_course is set by moderators via the service role only.
  and is_approved_course = (select is_approved_course from learning_path p where p.id = id)
);
```

Guest restrictions are enforced **in the database**, not by hiding buttons. `star`, `follow`, `group_member` and `certificate` carry `and not is_guest()` in their insert policies, matching PRD §19's account-required list.

### 13.3 Private data

```sql
create policy own_rows on note              for all to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy own_rows on concept_progress  for all to authenticated using (user_id  = auth.uid()) with check (user_id  = auth.uid());
create policy own_rows on resource_progress for all to authenticated using (user_id  = auth.uid()) with check (user_id  = auth.uid());
```

### 13.4 Tables with no user-facing write policy

`xp_ledger`, `activity`, `moderation_action`, `certificate`, `video`, `quota_ledger`, `rate_limit`, `prerender_state` and `notification` are written **only** by the service role in Edge Functions. Users may `select` their own rows where relevant; no insert, update or delete policy exists for them.

This is the point of the model: a user cannot award themselves XP or issue a certificate, because no policy permits it — not because the UI omits the button.

### 13.5 Surfaces RLS does not cover

Easy to miss, and worth stating explicitly:

- **`storage.objects` and `realtime.messages` need their own policies.** RLS on application tables does not extend to them.
- **R2 has no RLS at all.** Prerendered pages and OG images are public by design. Any private object is reached only via a signed URL issued by an Edge Function after an authorization check.
- **`pgmq_public`, if exposed through the Data API, needs RLS.** Preferred: do not expose it; enqueue from an Edge Function instead.

### 13.6 Account deletion

PRD §37 requires account deletion. `delete from auth.users` cascades through `profile` to owned content, with three deliberate exceptions:

| Table | Behaviour | Why |
|---|---|---|
| `certificate` | `on delete restrict` | An issued certificate is a public record of fact. A pre-deletion job anonymises `learner_name` and detaches the row instead. |
| `moderation_action.actor_id` | `on delete restrict` | The audit trail must not lose its actor. Deleting a moderator requires reassignment. |
| Public published paths | Author becomes a tombstone profile | Forks and inbound links must not break. Offered as a choice at deletion time: transfer, unpublish, or anonymise. |

The full procedure lives in a `plpgsql` function so it is testable, and it is tested — an untested deletion cascade is a privacy liability.

---

## 14. Scheduled jobs (`pg_cron`)

All scheduling is here, not on the host: Cloudflare's cron triggers are bound by the same 10 ms CPU limit as any Worker.

| Job | Schedule | Work |
|---|---|---|
| `video_refresh_sweep` | hourly, batched | Refresh `video` rows where `last_synced_at` is older than the retention window. Satisfies the 30-day rule, sets `availability` and `resource.health_status`, marks affected `prerender_state` stale. Yields when `quota_ledger` is low. |
| `prerender_stale` | every 5 min | Render pages marked stale into R2 and purge the CDN. |
| `streak_rollover` | daily 00:05 UTC | Advance or reset `streak`. |
| `badge_scan` | every 15 min | Award badges whose `criteria` are newly met. |
| `challenge_settle` | every 15 min | Update `challenge_participant`, close ended challenges. |
| `push_dispatch` | every minute | Drain `notification_outbox` with exponential backoff. |
| `rate_limit_gc` | hourly | Delete `rate_limit` rows older than a day. |
| `activity_prune` | weekly | Delete `activity` older than 90 days. |

Two rules for every job:

1. **Enqueue, do not compute.** `pg_net` calls from `pg_cron` have a short timeout, so a job triggers an Edge Function and returns; it never does the work inline.
2. **Handlers are idempotent.** `pgmq` delivers at least once, so every handler tolerates redelivery — the `xp_ledger_dedupe` index is one example of how.

---

## 15. Search

One denormalised index table rather than a six-way union across paths, profiles, categories, groups, concepts and resources.

```sql
create extension if not exists pg_trgm;

create table search_index (
  entity_type text not null check (entity_type in ('path','profile','category','group','concept')),
  entity_id   uuid not null,
  title       text not null,
  body        text,
  is_public   boolean not null default false,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(body,'')),  'B')
  ) stored,
  primary key (entity_type, entity_id)
);

create index on search_index using gin (search_vector);
create index on search_index using gin (title gin_trgm_ops);
create index on search_index (is_public);
```

```sql
select entity_type, entity_id, title,
       ts_rank(search_vector, q) as rank,
       similarity(title, $1)     as sim
from search_index, websearch_to_tsquery('english', $1) q
where is_public and (search_vector @@ q or title % $1)
order by rank desc, sim desc
limit 20;
```

`websearch_to_tsquery` is used deliberately: unlike `to_tsquery` it cannot throw on arbitrary user input, so a stray quote in a search box is not a 500. `pg_trgm` rescues typos and partial titles that full-text search misses. Rows are maintained by triggers on the source tables.

---

## 16. Fork copy

One `plpgsql` function, called via RPC inside a transaction. Chosen over a multi-level CTE (unreadable id remapping) and over v1's async worker (not atomic).

```sql
create or replace function fork_path(src_path_id uuid, new_owner uuid)
returns uuid
language plpgsql security definer as $$
declare
  new_path_id uuid;
begin
  insert into learning_path (
    public_code, title, description, author_id,
    forked_from_path_id, root_path_id, visibility, status)
  select generate_public_code(), title, description, new_owner,
         src_path_id, coalesce(root_path_id, src_path_id), 'private', 'draft'
  from learning_path where id = src_path_id
  returning id into new_path_id;

  with m as (
    insert into module (id, path_id, title, order_key)
    select gen_random_uuid(), new_path_id, title, order_key
    from module where path_id = src_path_id
    returning id as new_id, order_key
  )
  -- concepts and resources follow, joined on order_key within parent,
  -- then resource rows reference the existing video_id — never copied.
  ...

  update learning_path set fork_count = fork_count + 1 where id = src_path_id;
  return new_path_id;
end $$;
```

Invariants a test must assert:

- No new `video` rows are created. (This is the property that keeps the 500 MB budget viable.)
- `root_path_id` points at the original ancestor, not the immediate parent.
- The source path is byte-for-byte unchanged.
- Structure and ordering are preserved.

---

## 17. Lineage queries

```sql
-- Direct descendants of a root: no recursion needed, thanks to root_path_id.
select * from learning_path where root_path_id = $1;

-- Walk one chain upward, with cycle protection.
with recursive chain as (
  select id, forked_from_path_id, 1 as depth
  from learning_path where id = $1
  union all
  select p.id, p.forked_from_path_id, c.depth + 1
  from learning_path p join chain c on p.id = c.forked_from_path_id
  where c.depth < 100
)
cycle id set is_cycle using path
select * from chain;
```

Postgres has **no recursion-depth setting** — the core team explicitly rejected one — so the `depth` guard, the `CYCLE` clause and `statement_timeout` are the protection. All three are used.

---

## 18. Migration order

Dependency-ordered, so the first migration set applies cleanly:

1. Extensions (`pg_trgm`, `pg_cron`, `pg_net`, `pgmq`), helper functions (`is_guest`, `generate_public_code`, `next_order_key`)
2. `category`, `profile`, `user_interest`
3. `learning_path`, `path_category`, `path_slug_history`, `module`, `concept`
4. `video`, `resource`
5. `user_path`, `concept_progress`, `resource_progress`
6. `note`, `note_history`, `path_note`
7. `star`, `follow`
8. `study_group`, `group_member`, `group_announcement`, `group_invite`
9. `xp_ledger`, `streak`, `badge`, `badge_award`, `challenge`, `challenge_participant`
10. `activity`, `notification`, `notification_preference`, `push_subscription`, `notification_outbox`
11. `completion_rule`, `certificate`
12. `report`, `moderation_action`
13. `rate_limit`, `quota_ledger`, `prerender_state`
14. `search_index` and its triggers
15. RLS enablement and policies — **one migration per table group**, so a policy change reviews cleanly
16. Triggers (rollups, counters, search index, `profile` on signup)
17. `fork_path` and the deletion function
18. `pg_cron` job registration

Steps 15-18 are why the Supabase CLI owns migrations rather than Drizzle Kit: policies, triggers, functions and `cron.schedule` calls all need to be in version control, and only plain SQL expresses all four.
