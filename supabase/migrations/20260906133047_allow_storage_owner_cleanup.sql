drop policy if exists "bmch resource objects delete" on storage.objects;

create policy "bmch resource objects delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'bmch-resources'
  and (
    owner_id = (select auth.uid()::text)
    or (
      private.has_role(array['admin'])
      and exists (
        select 1
        from public.resource_versions rv
        where rv.storage_path = name
      )
    )
  )
);
