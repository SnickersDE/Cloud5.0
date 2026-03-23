create table if not exists public.quizzes (
  quiz_id text primary key,
  title text not null,
  description text not null default '',
  module_id text references public.modules(module_id) on delete set null,
  difficulty text not null default 'Grundlagen' check (difficulty in ('Grundlagen', 'Vertiefung', 'Prüfungsvorbereitung')),
  time_limit_seconds integer,
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.quiz_questions (
  question_id text primary key,
  quiz_id text not null references public.quizzes(quiz_id) on delete cascade,
  question_type text not null default 'multiple_choice' check (question_type in ('multiple_choice', 'single_choice', 'short_answer')),
  question text not null,
  options jsonb not null default '[]'::jsonb,
  correct_answer jsonb not null default '[]'::jsonb,
  feedback text not null default '',
  position integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  attempt_id text primary key,
  quiz_id text not null references public.quizzes(quiz_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null default 0,
  max_score integer not null default 0,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  updated_at timestamptz not null default now()
);

create index if not exists quiz_questions_quiz_idx on public.quiz_questions(quiz_id, position);
create index if not exists quiz_attempts_quiz_idx on public.quiz_attempts(quiz_id);
create index if not exists quiz_attempts_user_idx on public.quiz_attempts(user_id);

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;

drop policy if exists quizzes_select_owner_or_admin on public.quizzes;
create policy quizzes_select_owner_or_admin
  on public.quizzes
  for select
  to authenticated
  using (
    created_by = auth.uid()
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

drop policy if exists quizzes_insert_owner on public.quizzes;
create policy quizzes_insert_owner
  on public.quizzes
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

drop policy if exists quizzes_update_owner_or_admin on public.quizzes;
create policy quizzes_update_owner_or_admin
  on public.quizzes
  for update
  to authenticated
  using (
    created_by = auth.uid()
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    created_by = auth.uid()
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

drop policy if exists quizzes_delete_owner_or_admin on public.quizzes;
create policy quizzes_delete_owner_or_admin
  on public.quizzes
  for delete
  to authenticated
  using (
    created_by = auth.uid()
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

drop policy if exists quiz_questions_owner_or_admin on public.quiz_questions;
create policy quiz_questions_owner_or_admin
  on public.quiz_questions
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.quizzes q
      where q.quiz_id = quiz_questions.quiz_id
        and (
          q.created_by = auth.uid()
          or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
    )
  )
  with check (
    exists (
      select 1
      from public.quizzes q
      where q.quiz_id = quiz_questions.quiz_id
        and (
          q.created_by = auth.uid()
          or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
    )
  );

drop policy if exists quiz_attempts_owner_or_admin on public.quiz_attempts;
create policy quiz_attempts_owner_or_admin
  on public.quiz_attempts
  for all
  to authenticated
  using (
    user_id = auth.uid()
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    user_id = auth.uid()
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
