-- 0007 programme status history. Written only by a security-definer trigger, so it cannot be forged
-- and cannot drift from programmes.status (the canonical current status).

create table public.programme_status_history (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  programme_id uuid not null,
  from_status text,
  to_status text not null,
  changed_at timestamptz not null default now(),
  foreign key (owner_id, programme_id) references public.programmes (owner_id, id) on delete cascade
);

create index programme_status_history_programme_idx on public.programme_status_history (programme_id, changed_at);

create function public.log_programme_status() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.programme_status_history (owner_id, programme_id, from_status, to_status)
    values (new.owner_id, new.id, null, new.status);
  elsif new.status is distinct from old.status then
    insert into public.programme_status_history (owner_id, programme_id, from_status, to_status)
    values (new.owner_id, new.id, old.status, new.status);
  end if;
  return null;
end $$;

revoke all on function public.log_programme_status() from public, anon, authenticated;

create trigger programmes_log_status after insert or update of status on public.programmes
  for each row execute function public.log_programme_status();
