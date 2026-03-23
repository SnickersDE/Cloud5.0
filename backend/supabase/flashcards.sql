create table if not exists public.flashcard_decks (
  deck_id text primary key,
  name text not null,
  creator text not null,
  topic text not null,
  card_count integer not null default 0,
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.flashcard_cards (
  card_id text primary key,
  deck_id text not null references public.flashcard_decks(deck_id) on delete cascade,
  card_title text not null default '',
  front text not null,
  back text not null,
  position integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists flashcard_cards_deck_idx
  on public.flashcard_cards(deck_id, position);

alter table public.flashcard_decks enable row level security;
alter table public.flashcard_cards enable row level security;

drop policy if exists flashcard_decks_select_authenticated on public.flashcard_decks;
create policy flashcard_decks_select_authenticated
  on public.flashcard_decks
  for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists flashcard_decks_insert_authenticated on public.flashcard_decks;
create policy flashcard_decks_insert_authenticated
  on public.flashcard_decks
  for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists flashcard_decks_update_authenticated on public.flashcard_decks;
create policy flashcard_decks_update_authenticated
  on public.flashcard_decks
  for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists flashcard_cards_select_authenticated on public.flashcard_cards;
create policy flashcard_cards_select_authenticated
  on public.flashcard_cards
  for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists flashcard_cards_insert_authenticated on public.flashcard_cards;
create policy flashcard_cards_insert_authenticated
  on public.flashcard_cards
  for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists flashcard_cards_update_authenticated on public.flashcard_cards;
create policy flashcard_cards_update_authenticated
  on public.flashcard_cards
  for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists flashcard_cards_delete_authenticated on public.flashcard_cards;
create policy flashcard_cards_delete_authenticated
  on public.flashcard_cards
  for delete
  to authenticated
  using (auth.uid() is not null);

drop policy if exists flashcard_decks_delete_owner_or_admin on public.flashcard_decks;
create policy flashcard_decks_delete_owner_or_admin
  on public.flashcard_decks
  for delete
  to authenticated
  using (
    created_by = auth.uid()
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
