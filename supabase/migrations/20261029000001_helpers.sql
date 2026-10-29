create extension if not exists citext;

create or replace function is_guest() returns boolean
language sql stable as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;

-- Not a secret; RLS is the guard.
create or replace function generate_public_code() returns text
language sql volatile as $$
  select 'OL-' || string_agg(substr('0123456789ABCDEFGHJKMNPQRSTVWXYZ', 1 + floor(random()*32)::int, 1), '')
  from generate_series(1, 5);
$$;
