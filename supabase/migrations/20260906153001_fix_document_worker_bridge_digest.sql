create or replace function public.verify_document_worker_secret(p_secret text)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.document_worker_credentials
    where is_active = true
      and secret_hash = encode(extensions.digest(convert_to(p_secret, 'UTF8'), 'sha256'), 'hex')
  );
$$;

revoke all on function public.verify_document_worker_secret(text) from public, anon, authenticated;
