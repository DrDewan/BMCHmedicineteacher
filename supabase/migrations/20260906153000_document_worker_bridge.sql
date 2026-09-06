create extension if not exists pgcrypto with schema extensions;

create table if not exists public.document_worker_credentials (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  secret_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  rotated_at timestamptz
);

alter table public.document_worker_credentials enable row level security;
revoke all on public.document_worker_credentials from anon, authenticated;

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
