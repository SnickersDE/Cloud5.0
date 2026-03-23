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
