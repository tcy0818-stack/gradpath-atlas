-- 0005 documents (metadata only; no files are stored) and the document <-> requirement junction.
-- "Expired" is derived from expiry_date, never stored.

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  doc_type text not null check (doc_type in
    ('transcript', 'statement', 'reference_letter', 'cv', 'language_certificate', 'test_report', 'portfolio', 'other')),
  prep_status text not null default 'not_started' check (prep_status in ('not_started', 'draft', 'ready')),
  expiry_date date,
  notes text check (notes is null or char_length(notes) <= 2000),
  sample_key text check (sample_key is null or char_length(sample_key) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id)
);

create unique index documents_sample_key_uq on public.documents (owner_id, sample_key) where sample_key is not null;
create index documents_owner_idx on public.documents (owner_id);

create trigger documents_set_updated_at before update on public.documents
  for each row execute function public.set_updated_at();

-- Deleting a programme removes its links (via requirements) but never the documents (PRG-04).
-- Deleting a document removes only its links.
create table public.requirement_documents (
  owner_id uuid not null default auth.uid(),
  requirement_id uuid not null,
  document_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (requirement_id, document_id),
  foreign key (owner_id, requirement_id) references public.requirements (owner_id, id) on delete cascade,
  foreign key (owner_id, document_id) references public.documents (owner_id, id) on delete cascade
);

create index requirement_documents_document_idx on public.requirement_documents (document_id);
