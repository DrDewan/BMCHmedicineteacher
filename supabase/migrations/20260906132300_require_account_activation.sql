alter table public.profiles alter column is_active set default false;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role, department, is_active)
  values (new.id, new.raw_user_meta_data ->> 'full_name', 'viewer', 'Medicine', false)
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public;
