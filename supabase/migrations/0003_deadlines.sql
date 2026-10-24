-- 0003 deadlines: the single home of every date, including each programme's submission deadline.
-- due_date is a calendar date (no time zone); "today" is computed in the app per user time zone.

create table public.deadlines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  programme_id uuid,
  deadline_type text not null check (deadline_type in ('submission', 'milestone', 'other')),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  due_date date not null,
  is_done boolean not null default false,
  sample_key text check (sample_key is null or char_length(sample_key) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  foreign key (owner_id, programme_id) references public.programmes (owner_id, id) on delete cascade,
  constraint deadlines_submission_needs_programme check (deadline_type <> 'submission' or programme_id is not null)
);

-- At most one submission deadline per programme (DL-01).
create unique index deadlines_one_submission_uq on public.deadlines (programme_id) where deadline_type = 'submission';
create unique index deadlines_sample_key_uq on public.deadlines (owner_id, sample_key) where sample_key is not null;
create index deadlines_owner_due_idx on public.deadlines (owner_id, due_date);
create index deadlines_programme_idx on public.deadlines (programme_id);

create trigger deadlines_set_updated_at before update on public.deadlines
  for each row execute function public.set_updated_at();
