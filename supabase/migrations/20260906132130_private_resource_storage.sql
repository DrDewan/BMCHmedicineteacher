insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bmch-resources',
  'bmch-resources',
  false,
  104857600,
  array[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "bmch resource objects read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'bmch-resources'
  and exists (
    select 1
    from public.resource_versions rv
    where rv.storage_path = name
      and private.can_read_resource(rv.resource_id)
  )
);

create policy "bmch resource objects insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'bmch-resources'
  and private.has_role(array['admin','editor'])
);

create policy "bmch resource objects update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'bmch-resources'
  and private.has_role(array['admin','editor'])
)
with check (
  bucket_id = 'bmch-resources'
  and private.has_role(array['admin','editor'])
);

create policy "bmch resource objects delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'bmch-resources'
  and exists (
    select 1
    from public.resource_versions rv
    where rv.storage_path = name
      and private.has_role(array['admin'])
  )
);
