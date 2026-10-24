-- 0002 programmes. Universities are columns here, not a table (PRD 5.2).
-- unique (owner_id, id) lets child tables reference (owner_id, id) so cross-owner links are impossible.

create table public.programmes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  university_name text not null check (char_length(btrim(university_name)) between 1 and 120),
  programme_name text not null check (char_length(btrim(programme_name)) between 1 and 160),
  country_region text check (country_region is null or char_length(country_region) <= 80),
  subject text check (subject is null or char_length(subject) <= 80),
  intake_label text check (intake_label is null or char_length(intake_label) <= 40),
  duration_months integer check (duration_months is null or duration_months between 1 and 120),
  tuition_state text not null default 'unknown' check (tuition_state in ('known', 'unknown', 'not_applicable')),
  tuition_amount numeric(12, 2) check (tuition_amount is null or tuition_amount >= 0),
  tuition_currency char(3) check (tuition_currency is null or tuition_currency ~ '^[A-Z]{3}$'),
  status text not null default 'researching'
    check (status in ('researching', 'preparing', 'submitted', 'decision_received', 'withdrawn')),
  is_shortlisted boolean not null default false,
  notes text check (notes is null or char_length(notes) <= 5000),
  sample_key text check (sample_key is null or char_length(sample_key) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  -- Unknown / not-applicable can never be stored as 0 (PRG-03).
  constraint programmes_tuition_consistent check (
    (tuition_state = 'known' and tuition_amount is not null and tuition_currency is not null)
    or (tuition_state <> 'known' and tuition_amount is null and tuition_currency is null)
  )
);

create unique index programmes_sample_key_uq on public.programmes (owner_id, sample_key) where sample_key is not null;
create index programmes_owner_idx on public.programmes (owner_id);

create trigger programmes_set_updated_at before update on public.programmes
  for each row execute function public.set_updated_at();
