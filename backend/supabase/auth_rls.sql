create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  role text not null default 'authenticated' check (role in ('authenticated', 'admin')),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated
  on public.profiles
  for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

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

alter table public.modules add column if not exists theme text not null default '';

alter table public.modules enable row level security;

drop policy if exists modules_select_authenticated on public.modules;
create policy modules_select_authenticated
  on public.modules
  for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists modules_insert_authenticated on public.modules;
create policy modules_insert_authenticated
  on public.modules
  for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists modules_update_authenticated on public.modules;
create policy modules_update_authenticated
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
  using (
    created_by = auth.uid()
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

do $$
begin
  if to_regclass('public.summaries') is not null then
    execute 'alter table public.summaries enable row level security';
    execute 'drop policy if exists summaries_select_authenticated on public.summaries';
    execute 'create policy summaries_select_authenticated on public.summaries for select to authenticated using (auth.uid() is not null)';
    execute 'drop policy if exists summaries_insert_authenticated on public.summaries';
    execute 'create policy summaries_insert_authenticated on public.summaries for insert to authenticated with check (auth.uid() = created_by)';
    execute 'drop policy if exists summaries_update_owner on public.summaries';
    execute 'create policy summaries_update_owner on public.summaries for update to authenticated using (auth.uid() = created_by) with check (auth.uid() = created_by)';
    execute 'drop policy if exists summaries_delete_owner on public.summaries';
    execute 'create policy summaries_delete_owner on public.summaries for delete to authenticated using (auth.uid() = created_by)';
  end if;
end $$;

do $$
begin
  if to_regclass('public.sections') is not null then
    execute 'alter table public.sections enable row level security';
    execute 'drop policy if exists sections_select_authenticated on public.sections';
    execute 'create policy sections_select_authenticated on public.sections for select to authenticated using (auth.uid() is not null)';
    execute 'drop policy if exists sections_insert_authenticated on public.sections';
    execute 'create policy sections_insert_authenticated on public.sections for insert to authenticated with check (auth.uid() = created_by)';
    execute 'drop policy if exists sections_update_owner on public.sections';
    execute 'create policy sections_update_owner on public.sections for update to authenticated using (auth.uid() = created_by) with check (auth.uid() = created_by)';
    execute 'drop policy if exists sections_delete_owner on public.sections';
    execute 'create policy sections_delete_owner on public.sections for delete to authenticated using (auth.uid() = created_by)';
  end if;
end $$;

do $$
begin
  if to_regclass('public.flashcards') is not null then
    execute 'alter table public.flashcards enable row level security';
    execute 'drop policy if exists flashcards_select_authenticated on public.flashcards';
    execute 'create policy flashcards_select_authenticated on public.flashcards for select to authenticated using (auth.uid() is not null)';
    execute 'drop policy if exists flashcards_insert_authenticated on public.flashcards';
    execute 'create policy flashcards_insert_authenticated on public.flashcards for insert to authenticated with check (auth.uid() = created_by)';
    execute 'drop policy if exists flashcards_update_owner on public.flashcards';
    execute 'create policy flashcards_update_owner on public.flashcards for update to authenticated using (auth.uid() = created_by) with check (auth.uid() = created_by)';
    execute 'drop policy if exists flashcards_delete_owner on public.flashcards';
    execute 'create policy flashcards_delete_owner on public.flashcards for delete to authenticated using (auth.uid() = created_by)';
  end if;
end $$;

do $$
begin
  if to_regclass('public.files') is not null then
    execute 'alter table public.files enable row level security';
    execute 'drop policy if exists files_select_authenticated on public.files';
    execute 'create policy files_select_authenticated on public.files for select to authenticated using (auth.uid() is not null)';
    execute 'drop policy if exists files_insert_authenticated on public.files';
    execute 'create policy files_insert_authenticated on public.files for insert to authenticated with check (auth.uid() = uploaded_by)';
    execute 'drop policy if exists files_update_owner on public.files';
    execute 'create policy files_update_owner on public.files for update to authenticated using (auth.uid() = uploaded_by) with check (auth.uid() = uploaded_by)';
    execute 'drop policy if exists files_delete_owner on public.files';
    execute 'create policy files_delete_owner on public.files for delete to authenticated using (auth.uid() = uploaded_by)';
  end if;
end $$;
