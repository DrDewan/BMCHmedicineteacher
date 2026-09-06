create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'viewer' check (role in ('admin','editor','viewer')),
  department text not null default 'Medicine',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.resource_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category_id uuid references public.resource_categories(id) on delete set null,
  resource_type text not null check (resource_type in ('pdf','pptx','docx','image','case','ecg','xray','investigation','procedure','presentation','link','other')),
  owner_id uuid not null references auth.users(id) on delete restrict,
  visibility text not null default 'registrars' check (visibility in ('private','registrars','department','students')),
  status text not null default 'draft' check (status in ('draft','approved','archived')),
  current_version_id uuid,
  structured_content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.resource_versions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  original_filename text,
  mime_type text,
  file_size bigint check (file_size is null or file_size >= 0),
  storage_path text,
  preview_path text,
  processing_status text not null default 'pending' check (processing_status in ('pending','processing','ready','failed','not_required')),
  processing_error text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(resource_id, version_number),
  unique(storage_path)
);

alter table public.resources
  add constraint resources_current_version_fk
  foreign key (current_version_id) references public.resource_versions(id) on delete set null;

create table public.resource_pages (
  id uuid primary key default gen_random_uuid(),
  resource_version_id uuid not null references public.resource_versions(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  text_content text,
  thumbnail_path text,
  image_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(resource_version_id, page_number)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.resource_tags (
  resource_id uuid not null references public.resources(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(resource_id, tag_id)
);

create table public.presentations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  description text,
  owner_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft','approved','archived')),
  visibility text not null default 'registrars' check (visibility in ('private','registrars','department','students')),
  theme jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.presentation_slides (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid not null references public.presentations(id) on delete cascade,
  sort_order integer not null default 0,
  slide_type text not null,
  content jsonb not null default '{}'::jsonb,
  source_resource_id uuid references public.resources(id) on delete set null,
  source_page integer,
  speaker_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  question_type text not null,
  stem text not null,
  options jsonb,
  correct_answer jsonb,
  explanation text,
  difficulty text check (difficulty is null or difficulty in ('easy','medium','hard')),
  topic text,
  subtopic text,
  status text not null default 'generated' check (status in ('generated','review','approved','rejected','archived')),
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_sources (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete cascade,
  resource_version_id uuid references public.resource_versions(id) on delete cascade,
  page_number integer,
  presentation_id uuid references public.presentations(id) on delete cascade,
  slide_id uuid references public.presentation_slides(id) on delete cascade,
  source_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  mode text not null default 'mixed',
  question_count integer not null default 0 check (question_count >= 0),
  score numeric,
  settings jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.practice_session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.practice_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  sort_order integer not null default 0,
  selected_answer jsonb,
  is_correct boolean,
  answer_time_ms integer check (answer_time_ms is null or answer_time_ms >= 0),
  answered_at timestamptz,
  unique(session_id, question_id)
);

create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  resource_id uuid references public.resources(id) on delete set null,
  requested_by uuid references auth.users(id) on delete set null,
  provider text,
  model text,
  input_metadata jsonb not null default '{}'::jsonb,
  output_metadata jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','cancelled')),
  error_message text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table public.audit_logs (
  id bigint generated by default as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index resources_category_idx on public.resources(category_id) where deleted_at is null;
create index resources_owner_idx on public.resources(owner_id) where deleted_at is null;
create index resources_status_idx on public.resources(status) where deleted_at is null;
create index resource_versions_resource_idx on public.resource_versions(resource_id, version_number desc);
create index resource_pages_version_idx on public.resource_pages(resource_version_id, page_number);
create index presentation_slides_presentation_idx on public.presentation_slides(presentation_id, sort_order);
create index questions_status_idx on public.questions(status);
create index questions_topic_idx on public.questions(topic, subtopic);
create index practice_sessions_user_idx on public.practice_sessions(user_id, started_at desc);
create index ai_jobs_resource_idx on public.ai_jobs(resource_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at before update on public.profiles for each row execute function private.touch_updated_at();
create trigger resource_categories_touch_updated_at before update on public.resource_categories for each row execute function private.touch_updated_at();
create trigger resources_touch_updated_at before update on public.resources for each row execute function private.touch_updated_at();
create trigger presentations_touch_updated_at before update on public.presentations for each row execute function private.touch_updated_at();
create trigger presentation_slides_touch_updated_at before update on public.presentation_slides for each row execute function private.touch_updated_at();
create trigger questions_touch_updated_at before update on public.questions for each row execute function private.touch_updated_at();

create or replace function private.prevent_storage_path_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.storage_path is distinct from new.storage_path then
    raise exception 'resource_versions.storage_path is immutable';
  end if;
  return new;
end;
$$;

create trigger resource_versions_storage_path_immutable
before update of storage_path on public.resource_versions
for each row execute function private.prevent_storage_path_change();

create or replace function private.has_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.is_active = true
        and p.role = any(allowed_roles)
    );
$$;
revoke all on function private.has_role(text[]) from public;
grant execute on function private.has_role(text[]) to authenticated;

create or replace function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_active = true
    );
$$;
revoke all on function private.is_active_user() from public;
grant execute on function private.is_active_user() to authenticated;

create or replace function private.can_read_resource(target_resource_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.resources r
    join public.profiles p on p.id = (select auth.uid())
    where r.id = target_resource_id
      and r.deleted_at is null
      and p.is_active = true
      and (
        p.role in ('admin','editor')
        or r.owner_id = (select auth.uid())
        or (r.status = 'approved' and r.visibility in ('registrars','department','students'))
      )
  );
$$;
revoke all on function private.can_read_resource(uuid) from public;
grant execute on function private.can_read_resource(uuid) to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role, department, is_active)
  values (new.id, new.raw_user_meta_data ->> 'full_name', 'viewer', 'Medicine', true)
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.resource_categories enable row level security;
alter table public.resources enable row level security;
alter table public.resource_versions enable row level security;
alter table public.resource_pages enable row level security;
alter table public.tags enable row level security;
alter table public.resource_tags enable row level security;
alter table public.presentations enable row level security;
alter table public.presentation_slides enable row level security;
alter table public.questions enable row level security;
alter table public.question_sources enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.practice_session_questions enable row level security;
alter table public.ai_jobs enable row level security;
alter table public.audit_logs enable row level security;

grant select on public.profiles to authenticated;
grant update(full_name, department) on public.profiles to authenticated;
grant select, insert, update, delete on public.resource_categories to authenticated;
grant select, insert, update, delete on public.resources to authenticated;
grant select, insert, update, delete on public.resource_versions to authenticated;
grant select, insert, update, delete on public.resource_pages to authenticated;
grant select, insert, update, delete on public.tags to authenticated;
grant select, insert, update, delete on public.resource_tags to authenticated;
grant select, insert, update, delete on public.presentations to authenticated;
grant select, insert, update, delete on public.presentation_slides to authenticated;
grant select, insert, update, delete on public.questions to authenticated;
grant select, insert, update, delete on public.question_sources to authenticated;
grant select, insert, update, delete on public.practice_sessions to authenticated;
grant select, insert, update, delete on public.practice_session_questions to authenticated;
grant select, insert, update on public.ai_jobs to authenticated;
grant select on public.audit_logs to authenticated;
grant usage, select on sequence public.audit_logs_id_seq to authenticated;

create policy profiles_select on public.profiles for select to authenticated
using (id = (select auth.uid()) or private.has_role(array['admin']));
create policy profiles_update_self on public.profiles for update to authenticated
using (id = (select auth.uid()) and private.is_active_user())
with check (id = (select auth.uid()) and private.is_active_user());

create policy categories_select on public.resource_categories for select to authenticated
using ((is_active and private.is_active_user()) or private.has_role(array['admin','editor']));
create policy categories_insert on public.resource_categories for insert to authenticated
with check (private.has_role(array['admin','editor']));
create policy categories_update on public.resource_categories for update to authenticated
using (private.has_role(array['admin','editor'])) with check (private.has_role(array['admin','editor']));
create policy categories_delete on public.resource_categories for delete to authenticated
using (private.has_role(array['admin']));

create policy resources_select on public.resources for select to authenticated
using (private.can_read_resource(id));
create policy resources_insert on public.resources for insert to authenticated
with check (owner_id = (select auth.uid()) and private.has_role(array['admin','editor']));
create policy resources_update on public.resources for update to authenticated
using (private.has_role(array['admin','editor'])) with check (private.has_role(array['admin','editor']));
create policy resources_delete on public.resources for delete to authenticated
using (private.has_role(array['admin']));

create policy versions_select on public.resource_versions for select to authenticated
using (private.can_read_resource(resource_id));
create policy versions_insert on public.resource_versions for insert to authenticated
with check (created_by = (select auth.uid()) and private.has_role(array['admin','editor']));
create policy versions_update on public.resource_versions for update to authenticated
using (private.has_role(array['admin','editor'])) with check (private.has_role(array['admin','editor']));
create policy versions_delete on public.resource_versions for delete to authenticated
using (private.has_role(array['admin']));

create policy pages_select on public.resource_pages for select to authenticated
using (exists (select 1 from public.resource_versions rv where rv.id = resource_version_id and private.can_read_resource(rv.resource_id)));
create policy pages_insert on public.resource_pages for insert to authenticated
with check (private.has_role(array['admin','editor']));
create policy pages_update on public.resource_pages for update to authenticated
using (private.has_role(array['admin','editor'])) with check (private.has_role(array['admin','editor']));
create policy pages_delete on public.resource_pages for delete to authenticated
using (private.has_role(array['admin']));

create policy tags_select on public.tags for select to authenticated using (private.is_active_user());
create policy tags_insert on public.tags for insert to authenticated with check (private.has_role(array['admin','editor']));
create policy tags_update on public.tags for update to authenticated using (private.has_role(array['admin','editor'])) with check (private.has_role(array['admin','editor']));
create policy tags_delete on public.tags for delete to authenticated using (private.has_role(array['admin']));

create policy resource_tags_select on public.resource_tags for select to authenticated
using (private.can_read_resource(resource_id));
create policy resource_tags_insert on public.resource_tags for insert to authenticated with check (private.has_role(array['admin','editor']));
create policy resource_tags_delete on public.resource_tags for delete to authenticated using (private.has_role(array['admin','editor']));

create policy presentations_select on public.presentations for select to authenticated
using (
  deleted_at is null and private.is_active_user() and (
    owner_id = (select auth.uid()) or private.has_role(array['admin','editor']) or
    (status = 'approved' and visibility in ('registrars','department','students'))
  )
);
create policy presentations_insert on public.presentations for insert to authenticated
with check (owner_id = (select auth.uid()) and private.has_role(array['admin','editor']));
create policy presentations_update on public.presentations for update to authenticated
using (private.has_role(array['admin','editor'])) with check (private.has_role(array['admin','editor']));
create policy presentations_delete on public.presentations for delete to authenticated
using (private.has_role(array['admin']));

create policy slides_select on public.presentation_slides for select to authenticated
using (exists (select 1 from public.presentations p where p.id = presentation_id));
create policy slides_insert on public.presentation_slides for insert to authenticated with check (private.has_role(array['admin','editor']));
create policy slides_update on public.presentation_slides for update to authenticated using (private.has_role(array['admin','editor'])) with check (private.has_role(array['admin','editor']));
create policy slides_delete on public.presentation_slides for delete to authenticated using (private.has_role(array['admin','editor']));

create policy questions_select on public.questions for select to authenticated
using (private.is_active_user() and (status = 'approved' or private.has_role(array['admin','editor'])));
create policy questions_insert on public.questions for insert to authenticated
with check (created_by = (select auth.uid()) and private.has_role(array['admin','editor']));
create policy questions_update on public.questions for update to authenticated
using (private.has_role(array['admin','editor'])) with check (private.has_role(array['admin','editor']));
create policy questions_delete on public.questions for delete to authenticated using (private.has_role(array['admin']));

create policy question_sources_select on public.question_sources for select to authenticated
using (exists (select 1 from public.questions q where q.id = question_id));
create policy question_sources_insert on public.question_sources for insert to authenticated with check (private.has_role(array['admin','editor']));
create policy question_sources_update on public.question_sources for update to authenticated using (private.has_role(array['admin','editor'])) with check (private.has_role(array['admin','editor']));
create policy question_sources_delete on public.question_sources for delete to authenticated using (private.has_role(array['admin']));

create policy practice_sessions_select on public.practice_sessions for select to authenticated
using (user_id = (select auth.uid()) or private.has_role(array['admin']));
create policy practice_sessions_insert on public.practice_sessions for insert to authenticated
with check (user_id = (select auth.uid()));
create policy practice_sessions_update on public.practice_sessions for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy practice_sessions_delete on public.practice_sessions for delete to authenticated
using (user_id = (select auth.uid()) or private.has_role(array['admin']));

create policy practice_questions_select on public.practice_session_questions for select to authenticated
using (exists (select 1 from public.practice_sessions s where s.id = session_id));
create policy practice_questions_insert on public.practice_session_questions for insert to authenticated
with check (exists (select 1 from public.practice_sessions s where s.id = session_id and s.user_id = (select auth.uid())));
create policy practice_questions_update on public.practice_session_questions for update to authenticated
using (exists (select 1 from public.practice_sessions s where s.id = session_id and s.user_id = (select auth.uid())))
with check (exists (select 1 from public.practice_sessions s where s.id = session_id and s.user_id = (select auth.uid())));
create policy practice_questions_delete on public.practice_session_questions for delete to authenticated
using (exists (select 1 from public.practice_sessions s where s.id = session_id and (s.user_id = (select auth.uid()) or private.has_role(array['admin']))));

create policy ai_jobs_select on public.ai_jobs for select to authenticated
using (requested_by = (select auth.uid()) or private.has_role(array['admin']));
create policy ai_jobs_insert on public.ai_jobs for insert to authenticated
with check (requested_by = (select auth.uid()) and private.has_role(array['admin','editor']));
create policy ai_jobs_update on public.ai_jobs for update to authenticated
using (requested_by = (select auth.uid()) and private.has_role(array['admin','editor']))
with check (requested_by = (select auth.uid()) and private.has_role(array['admin','editor']));

create policy audit_logs_select on public.audit_logs for select to authenticated
using (private.has_role(array['admin']));

insert into public.resource_categories (slug, name, description, sort_order) values
('clinical-cases','Clinical Cases','Structured teaching cases with presentation, examination, differential diagnosis, investigations and management.',10),
('teaching-materials','Teaching Materials','Lecture decks, handouts, teaching PDFs and registrar-created teaching resources.',20),
('clinical-images','Clinical Images','Clinical photographs and visual findings for bedside and exam teaching.',30),
('x-rays','X-Rays','Chest, abdominal and musculoskeletal radiographs with interpretation teaching.',40),
('ecg','ECG','Electrocardiograms with systematic interpretation and teaching notes.',50),
('investigations','Investigations','Laboratory, imaging and diagnostic investigation examples with interpretation.',60),
('procedures','Procedures','Procedure guides, indications, contraindications, steps, complications and visual aids.',70),
('question-bank','Question Bank','Curated and AI-assisted questions linked to department resources.',80),
('guidelines','Guidelines','Departmental, national and international clinical guidelines used for teaching.',90);
