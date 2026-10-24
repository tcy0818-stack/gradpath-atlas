-- RLS coverage check (M2.10). Paste into the Supabase SQL editor, or run in any PostgreSQL after the migrations.
-- EXPECTED RESULT: zero rows. Any row names a table and the problem.
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
select t.relname as problem_table, 'RLS disabled' as problem from t where not t.relrowsecurity
union all
select r.rel, 'missing ' || r.cmd || ' policy' from required r
  where not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = r.rel and p.cmd = r.cmd)
union all
select tablename, 'unrestricted policy ' || policyname from pg_policies
  where schemaname = 'public' and (qual is not distinct from 'true' or with_check is not distinct from 'true')
union all
select t.relname, 'anon has ' || p from t cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) as p
  where has_table_privilege('anon', t.oid, p);
