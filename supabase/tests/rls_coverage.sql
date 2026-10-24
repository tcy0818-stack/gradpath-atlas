-- RLS / privilege COVERAGE check (M2.10). Paste into the Supabase SQL editor, or run in any PostgreSQL
-- after the migrations. EXPECTED RESULT: zero rows. Any row names a table/function and the problem.
--
-- What this proves: the schema is *configured* as designed (RLS switched on, each required policy exists,
-- policies are tied to auth.uid(), no literal-true policy, anon holds no table privilege, API roles cannot
-- call the trigger functions, anon cannot call the seed functions).
-- What it does NOT prove: that the policy expressions are *correct*, that one user really cannot read or
-- change another's rows, or that forged cross-owner links fail. Those are behaviour, checked by
-- hosted_authz_check.sql (database level) and, later, by two real users through the API (task M3.11).
with t as (
  select c.oid, c.relname, c.relrowsecurity
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
),
required as (
  select t.relname as rel, cmd
  from t, unnest(case t.relname
    when 'profiles' then array['SELECT', 'UPDATE']
    when 'programme_status_history' then array['SELECT']
    else array['SELECT', 'INSERT', 'UPDATE', 'DELETE'] end) as cmd
)
select t.relname as problem_object, 'RLS disabled' as problem from t where not t.relrowsecurity
union all
select r.rel, 'missing ' || r.cmd || ' policy' from required r
  where not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = r.rel and p.cmd = r.cmd)
union all
select tablename, 'unrestricted policy ' || policyname from pg_policies
  where schemaname = 'public' and (qual is not distinct from 'true' or with_check is not distinct from 'true')
union all
-- every policy expression must mention auth.uid() (a coarse shape check, not a correctness proof)
select tablename, 'policy ' || policyname || ' does not reference auth.uid()' from pg_policies
  where schemaname = 'public'
    and coalesce(qual, '') || coalesce(with_check, '') not like '%auth.uid()%'
union all
select t.relname, 'anon has ' || p from t cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) as p
  where has_table_privilege('anon', t.oid, p)
union all
select fn, role_name || ' can execute ' || fn
  from unnest(array['public.handle_new_user()', 'public.tasks_guard()', 'public.log_programme_status()']) as fn
  cross join unnest(array['anon', 'authenticated']) as role_name
  where has_function_privilege(role_name, fn, 'execute')
union all
select fn, 'anon can execute ' || fn
  from unnest(array['public.seed_demo_data(date)', 'public.reset_demo_data()']) as fn
  where has_function_privilege('anon', fn, 'execute');
