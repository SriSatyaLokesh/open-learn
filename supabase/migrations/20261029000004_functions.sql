create function handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profile (id, handle, display_name)
  values (new.id, 'guest-' || left(replace(new.id::text, '-', ''), 10), 'Guest');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

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

revoke execute on function save_position(uuid, integer) from public, anon;
grant execute on function save_position(uuid, integer) to authenticated;
