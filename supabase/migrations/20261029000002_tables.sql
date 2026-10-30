create table profile (
  id                  uuid primary key references auth.users(id) on delete cascade,
  handle              citext unique not null,
  display_name        text not null,
  bio                 text,
  avatar_url          text,
  activity_visibility text not null default 'public'
                        check (activity_visibility in ('public','followers','private')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table learning_path (
  id                  uuid primary key default gen_random_uuid(),
  public_code         text unique not null default generate_public_code(),
  slug                text unique,
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

create table module (
  id        uuid primary key default gen_random_uuid(),
  path_id   uuid not null references learning_path(id) on delete cascade,
  title     text not null,
  order_key text not null,
  unique (id, path_id)
);

create table concept (
  id        uuid primary key default gen_random_uuid(),
  module_id uuid not null references module(id) on delete cascade,
  path_id   uuid not null references learning_path(id) on delete cascade,
  title     text not null,
  order_key text not null,
  unique (id, path_id),
  -- Bind the child to its parent's path so RLS on path_id cannot be bypassed cross-tenant.
  foreign key (module_id, path_id) references module (id, path_id) on delete cascade
);

create index on learning_path (author_id);
create index on learning_path (root_path_id);
create index on learning_path (visibility, status, published_at desc);
create index on module (path_id, order_key);
create index on concept (module_id, order_key);
create index on concept (path_id);

create table video (
  id                uuid primary key default gen_random_uuid(),
  provider          text not null default 'youtube',
  provider_video_id text not null,
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

create table resource (
  id            uuid primary key default gen_random_uuid(),
  concept_id    uuid not null references concept(id) on delete cascade,
  path_id       uuid not null references learning_path(id) on delete cascade,
  video_id      uuid not null references video(id) on delete restrict,
  kind          text not null default 'primary' check (kind in ('primary','alternative')),
  order_key     text not null,
  health_status text not null default 'ok' check (health_status in ('ok','broken','replaced')),
  source_url    text,
  created_at    timestamptz not null default now(),
  foreign key (concept_id, path_id) references concept (id, path_id) on delete cascade
);

create index on resource (concept_id, order_key);
create index on resource (video_id);
create index on resource (path_id);
create unique index resource_one_primary_per_concept
  on resource (concept_id) where kind = 'primary';

create table resource_progress (
  user_id               uuid not null references profile(id) on delete cascade,
  resource_id           uuid not null references resource(id) on delete cascade,
  last_position_seconds integer not null default 0 check (last_position_seconds >= 0),
  watched_seconds       integer not null default 0 check (watched_seconds >= 0),
  updated_at            timestamptz not null default now(),
  primary key (user_id, resource_id)
);
