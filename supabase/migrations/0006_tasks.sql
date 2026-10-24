-- 0006 tasks with one optional prerequisite. Blocked/actionable is derived, never stored.

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  programme_id uuid,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  due_date date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  prerequisite_task_id uuid,
  completed_at timestamptz,
  sample_key text check (sample_key is null or char_length(sample_key) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  constraint tasks_no_self_prerequisite check (prerequisite_task_id is null or prerequisite_task_id <> id),
  foreign key (owner_id, programme_id) references public.programmes (owner_id, id) on delete cascade,
  -- Column-list SET NULL (PostgreSQL 15+) keeps owner_id intact when a prerequisite is deleted.
  foreign key (owner_id, prerequisite_task_id) references public.tasks (owner_id, id)
    on delete set null (prerequisite_task_id)
);

create unique index tasks_sample_key_uq on public.tasks (owner_id, sample_key) where sample_key is not null;
create index tasks_owner_due_idx on public.tasks (owner_id, due_date);
create index tasks_programme_idx on public.tasks (programme_id);
create index tasks_prerequisite_idx on public.tasks (prerequisite_task_id);

create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- Rejects prerequisite cycles and "done while the prerequisite is not done"; maintains completed_at.
-- Runs as the caller, so it only ever sees that user's own rows.
-- Limit: a prerequisite reverted to not-done later does not un-complete an already-done dependent.
create function public.tasks_guard() returns trigger
language plpgsql as $$
declare
  cur uuid;
  hops integer := 0;
  prereq_status text;
begin
  if new.prerequisite_task_id is not null then
    cur := new.prerequisite_task_id;
    while cur is not null loop
      if cur = new.id then
        raise exception 'task prerequisite cycle' using errcode = '23514';
      end if;
      hops := hops + 1;
      if hops > 100 then
        raise exception 'task prerequisite chain too long' using errcode = '23514';
      end if;
      select t.prerequisite_task_id into cur from public.tasks t where t.id = cur and t.owner_id = new.owner_id;
    end loop;

    if new.status = 'done' then
      select t.status into prereq_status from public.tasks t
        where t.id = new.prerequisite_task_id and t.owner_id = new.owner_id;
      if prereq_status is distinct from 'done' then
        raise exception 'cannot complete a task while its prerequisite is not done' using errcode = '23514';
      end if;
    end if;
  end if;

  new.completed_at := case when new.status = 'done' then coalesce(new.completed_at, now()) else null end;
  return new;
end $$;

revoke all on function public.tasks_guard() from public, anon, authenticated;

create trigger tasks_guard_trg before insert or update on public.tasks
  for each row execute function public.tasks_guard();
