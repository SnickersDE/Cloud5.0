create table if not exists public.modules (
  module_id text primary key,
  name text not null,
  theme text not null default '',
  intro text not null default '',
  terms text not null default '',
  focus text not null default '',
  uploaded_at date,
  creator text not null default '',
  mode text not null default 'manual',
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.module_sections (
  section_id uuid primary key default gen_random_uuid(),
  module_id text not null references public.modules(module_id) on delete cascade,
  section_type text not null check (section_type in ('schwerpunkte', 'begriffe', 'beispiele', 'fragen', 'fazit')),
  title text not null default '',
  content text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.module_pdfs (
  pdf_id uuid primary key default gen_random_uuid(),
  module_id text not null references public.modules(module_id) on delete cascade,
  name text not null,
  url text not null,
  mime_type text not null default 'application/pdf' check (mime_type = 'application/pdf'),
  file_size_bytes bigint not null default 0 check (file_size_bytes >= 0),
  uploaded_at timestamptz not null default now()
);

create table if not exists public.user_fast_searches (
  fast_search_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null default 'summaries' check (scope in ('summaries', 'flashcards')),
  label text not null,
  created_at timestamptz not null default now()
);

alter table public.user_fast_searches
  add column if not exists scope text not null default 'summaries';

alter table public.user_fast_searches
  drop constraint if exists user_fast_searches_scope_check;

alter table public.user_fast_searches
  add constraint user_fast_searches_scope_check
  check (scope in ('summaries', 'flashcards'));

create index if not exists user_fast_searches_user_id_idx on public.user_fast_searches(user_id);
create index if not exists user_fast_searches_user_id_scope_idx on public.user_fast_searches(user_id, scope);

create index if not exists module_sections_module_id_idx on public.module_sections(module_id);
create index if not exists module_pdfs_module_id_idx on public.module_pdfs(module_id);

alter table public.modules enable row level security;
alter table public.module_sections enable row level security;
alter table public.module_pdfs enable row level security;
alter table public.user_fast_searches enable row level security;

drop policy if exists modules_select_owner_or_admin on public.modules;
create policy modules_select_owner_or_admin
  on public.modules
  for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists modules_insert_owner on public.modules;
create policy modules_insert_owner
  on public.modules
  for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists modules_update_owner_or_admin on public.modules;
create policy modules_update_owner_or_admin
  on public.modules
  for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists modules_delete_owner_or_admin on public.modules;
create policy modules_delete_owner_or_admin
  on public.modules
  for delete
  to authenticated
  using (auth.uid() is not null);

drop policy if exists module_sections_owner_or_admin on public.module_sections;
create policy module_sections_owner_or_admin
  on public.module_sections
  for all
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists module_pdfs_owner_or_admin on public.module_pdfs;
create policy module_pdfs_owner_or_admin
  on public.module_pdfs
  for all
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists user_fast_searches_owner on public.user_fast_searches;
create policy user_fast_searches_owner
  on public.user_fast_searches
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
