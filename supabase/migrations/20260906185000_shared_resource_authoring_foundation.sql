drop policy if exists resources_select on public.resources;

create policy resources_select on public.resources
for select to authenticated
using (
  private.has_role(array['admin','editor'])
  or private.can_read_resource(id)
);

create or replace function public.record_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_role(array['admin','editor']) then
    raise exception 'forbidden';
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values ((select auth.uid()), p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

revoke all on function public.record_audit_event(text, text, uuid, jsonb) from public;
grant execute on function public.record_audit_event(text, text, uuid, jsonb) to authenticated;
