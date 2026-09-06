drop policy if exists "bmch resource objects read" on storage.objects;

create policy "bmch resource objects read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'bmch-resources'
  and (
    exists (
      select 1
      from public.resource_versions rv
      where (rv.storage_path = name or rv.preview_path = name)
        and private.can_read_resource(rv.resource_id)
    )
    or exists (
      select 1
      from public.resource_pages rp
      join public.resource_versions rv on rv.id = rp.resource_version_id
      where (rp.image_path = name or rp.thumbnail_path = name)
        and private.can_read_resource(rv.resource_id)
    )
  )
);
