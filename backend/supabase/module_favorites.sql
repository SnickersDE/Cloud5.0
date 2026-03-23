create table if not exists public.module_favorites (
  favorite_id uuid primary key default gen_random_uuid(),
  module_id text not null references public.modules(module_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (module_id, user_id)
);

create index if not exists module_favorites_user_id_idx on public.module_favorites(user_id);
create index if not exists module_favorites_module_id_idx on public.module_favorites(module_id);

alter table public.module_favorites enable row level security;

drop policy if exists module_favorites_select_owner on public.module_favorites;
create policy module_favorites_select_owner
  on public.module_favorites
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists module_favorites_insert_owner on public.module_favorites;
create policy module_favorites_insert_owner
  on public.module_favorites
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists module_favorites_delete_owner on public.module_favorites;
create policy module_favorites_delete_owner
  on public.module_favorites
  for delete
  to authenticated
  using (user_id = auth.uid());
