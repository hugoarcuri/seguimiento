insert into storage.buckets (id, name, public) values ('discipulo-avatars', 'discipulo-avatars', true)
on conflict (id) do nothing;

drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
  on storage.objects for select
  using (bucket_id = 'discipulo-avatars');

drop policy if exists "Authenticated Upload" on storage.objects;
create policy "Authenticated Upload"
  on storage.objects for insert
  with check (
    bucket_id = 'discipulo-avatars'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Authenticated Update" on storage.objects;
create policy "Authenticated Update"
  on storage.objects for update
  using (
    bucket_id = 'discipulo-avatars'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Authenticated Delete" on storage.objects;
create policy "Authenticated Delete"
  on storage.objects for delete
  using (
    bucket_id = 'discipulo-avatars'
    and auth.role() = 'authenticated'
  );
