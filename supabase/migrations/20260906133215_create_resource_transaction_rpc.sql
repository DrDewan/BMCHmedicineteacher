create or replace function public.create_resource_with_version(
  p_resource_id uuid,
  p_version_id uuid,
  p_title text,
  p_description text,
  p_category_id uuid,
  p_resource_type text,
  p_visibility text,
  p_original_filename text,
  p_mime_type text,
  p_file_size bigint,
  p_storage_path text,
  p_processing_status text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null or not private.has_role(array['admin','editor']) then
    raise exception 'not authorized';
  end if;

  insert into public.resources (
    id, title, description, category_id, resource_type, owner_id, visibility, status, structured_content
  ) values (
    p_resource_id, p_title, nullif(p_description, ''), p_category_id, p_resource_type,
    v_user_id, p_visibility, 'draft', '{}'::jsonb
  );

  insert into public.resource_versions (
    id, resource_id, version_number, original_filename, mime_type, file_size,
    storage_path, processing_status, created_by
  ) values (
    p_version_id, p_resource_id, 1, p_original_filename, p_mime_type, p_file_size,
    p_storage_path, p_processing_status, v_user_id
  );

  update public.resources
  set current_version_id = p_version_id
  where id = p_resource_id;

  return p_resource_id;
end;
$$;

revoke all on function public.create_resource_with_version(uuid,uuid,text,text,uuid,text,text,text,text,bigint,text,text) from public;
grant execute on function public.create_resource_with_version(uuid,uuid,text,text,uuid,text,text,text,text,bigint,text,text) to authenticated;
