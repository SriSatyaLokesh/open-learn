alter table profile           enable row level security;
alter table learning_path     enable row level security;
alter table module            enable row level security;
alter table concept           enable row level security;
alter table video             enable row level security;
alter table resource          enable row level security;
alter table resource_progress enable row level security;

-- profile: own row; no insert policy (trigger only), no delete.
create policy profile_select on profile for select to authenticated using (id = auth.uid());
create policy profile_update on profile for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- learning_path
create policy path_read on learning_path for select using (
  moderation_state = 'ok'
  and (
    (visibility = 'public' and status = 'published')
    or author_id = auth.uid()
  )
);
create policy path_insert on learning_path for insert to authenticated
  with check (author_id = auth.uid());
create policy path_update on learning_path for update to authenticated
using (author_id = auth.uid())
with check (
  author_id = auth.uid()
  -- Publishing requires a permanent account (PRD 19).
  and (visibility <> 'public' or not is_guest())
  -- is_approved_course is set by moderators via the service role only.
  -- DATABASE 13.2 says `p.id = id`, which resolves to p.id = p.id; qualify it.
  and is_approved_course = (select p.is_approved_course from learning_path p where p.id = learning_path.id)
);
create policy path_delete on learning_path for delete to authenticated
  using (author_id = auth.uid());

-- module / concept / resource: delegate to the parent path via path_id.
create policy module_select on module for select using (
  exists (select 1 from learning_path p where p.id = module.path_id));
create policy module_insert on module for insert to authenticated with check (
  exists (select 1 from learning_path p where p.id = module.path_id and p.author_id = auth.uid()));
create policy module_update on module for update to authenticated
  using (exists (select 1 from learning_path p where p.id = module.path_id and p.author_id = auth.uid()))
  with check (exists (select 1 from learning_path p where p.id = module.path_id and p.author_id = auth.uid()));
create policy module_delete on module for delete to authenticated using (
  exists (select 1 from learning_path p where p.id = module.path_id and p.author_id = auth.uid()));

create policy concept_select on concept for select using (
  exists (select 1 from learning_path p where p.id = concept.path_id));
create policy concept_insert on concept for insert to authenticated with check (
  exists (select 1 from learning_path p where p.id = concept.path_id and p.author_id = auth.uid()));
create policy concept_update on concept for update to authenticated
  using (exists (select 1 from learning_path p where p.id = concept.path_id and p.author_id = auth.uid()))
  with check (exists (select 1 from learning_path p where p.id = concept.path_id and p.author_id = auth.uid()));
create policy concept_delete on concept for delete to authenticated using (
  exists (select 1 from learning_path p where p.id = concept.path_id and p.author_id = auth.uid()));

create policy resource_select on resource for select using (
  exists (select 1 from learning_path p where p.id = resource.path_id));
create policy resource_insert on resource for insert to authenticated with check (
  exists (select 1 from learning_path p where p.id = resource.path_id and p.author_id = auth.uid()));
create policy resource_update on resource for update to authenticated
  using (exists (select 1 from learning_path p where p.id = resource.path_id and p.author_id = auth.uid()))
  with check (exists (select 1 from learning_path p where p.id = resource.path_id and p.author_id = auth.uid()));
create policy resource_delete on resource for delete to authenticated using (
  exists (select 1 from learning_path p where p.id = resource.path_id and p.author_id = auth.uid()));

-- video: read-only for authenticated; writes via service role only.
create policy video_select on video for select to authenticated using (true);

-- resource_progress: own rows.
create policy progress_select on resource_progress for select to authenticated using (user_id = auth.uid());
create policy progress_insert on resource_progress for insert to authenticated with check (user_id = auth.uid());
create policy progress_update on resource_progress for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy progress_delete on resource_progress for delete to authenticated using (user_id = auth.uid());
