-- 0004 requirements: typed per-programme requirements. Satisfaction is calculated, never stored (RDY-01).

create table public.requirements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  programme_id uuid not null,
  requirement_type text not null check (requirement_type in
    ('academic', 'language', 'references', 'statement', 'transcript', 'cv', 'test_score', 'portfolio', 'other')),
  level text not null default 'unknown' check (level in ('required', 'optional', 'not_applicable', 'unknown')),
  detail text check (detail is null or char_length(detail) <= 500),
  quantity integer not null default 1 check (quantity between 1 and 10),
  -- Used only by self-check types (academic, other); ignored for document-backed types.
  self_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  foreign key (owner_id, programme_id) references public.programmes (owner_id, id) on delete cascade
);

create unique index requirements_one_per_type_uq on public.requirements (programme_id, requirement_type)
  where requirement_type <> 'other';
create index requirements_programme_idx on public.requirements (programme_id);

create trigger requirements_set_updated_at before update on public.requirements
  for each row execute function public.set_updated_at();
