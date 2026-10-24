-- 0008 Row Level Security and grants (SEC-01): explicit per-operation policies, nothing for anon.
-- Supabase's default privileges grant broad access to new tables, so revoke first, then grant narrowly.

do $$
declare
  t text;
begin
  foreach t in array array['programmes', 'requirements', 'documents', 'requirement_documents', 'deadlines', 'tasks']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id = (select auth.uid()))', t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (owner_id = (select auth.uid()))', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (owner_id = (select auth.uid()))', t || '_delete', t);
  end loop;
end $$;

-- profiles: own row only; select and update. Insert happens in the new-user trigger; delete via account-deletion cascade.
alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select, update on public.profiles to authenticated;
create policy profiles_select on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- status history: read-only for users; rows come from the security-definer trigger.
alter table public.programme_status_history enable row level security;
revoke all on public.programme_status_history from public, anon, authenticated;
grant select on public.programme_status_history to authenticated;
create policy programme_status_history_select on public.programme_status_history for select to authenticated
  using (owner_id = (select auth.uid()));
