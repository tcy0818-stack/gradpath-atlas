-- AUTHORISATION BEHAVIOUR check at database level (M2.15). Safe to run in the Supabase SQL editor:
-- everything the function does happens inside a sub-transaction that is always rolled back, so no row,
-- user or profile is left behind. Run the whole file; the final SELECT returns one PASS/FAIL line per check.
--
-- How it works: it creates two throw-away users in auth.users (rolled back), then switches the session role
-- to `authenticated` / `anon` and sets the JWT claim that auth.uid() reads, exactly as the API layer does,
-- so Row Level Security, grants, composite foreign keys, triggers and the seed functions run for real.
-- Limits: this is NOT the HTTP API path (PostgREST + real sign-in); that is task M3.11. If the INSERT into
-- auth.users is refused on your project, the function reports the error instead of guessing.
create or replace function pg_temp.hosted_authz_check() returns setof text
language plpgsql as $f$
declare
  ua uuid := gen_random_uuid();
  ub uuid := gen_random_uuid();
  res text[] := '{}';
  pid uuid;
  tid uuid;
  n integer;
  ok boolean;
begin
  begin -- sub-transaction: always rolled back at the end
    insert into auth.users (id, email) values (ua, 'authz-a@example.com'), (ub, 'authz-b@example.com');

    select count(*) = 2 into ok from public.profiles where id in (ua, ub);
    res := res || (case when ok then 'PASS' else 'FAIL' end || ' - profile row created for each new user');

    -- ===== user A creates data =====
    perform set_config('request.jwt.claim.sub', ua::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', ua, 'role', 'authenticated')::text, true);
    set local role authenticated;
    insert into public.programmes (university_name, programme_name) values ('Authz U', 'A programme') returning id into pid;
    insert into public.tasks (title) values ('A task') returning id into tid;
    select count(*) = 1 into ok from public.programme_status_history where programme_id = pid;
    res := res || (case when ok then 'PASS' else 'FAIL' end || ' - A sees own status-history row');
    begin
      insert into public.programme_status_history (owner_id, programme_id, to_status) values (ua, pid, 'withdrawn');
      res := res || 'FAIL - A could write status history';
    exception when others then
      res := res || (case when sqlstate = '42501' then 'PASS' else 'FAIL (' || sqlstate || ')' end || ' - A cannot write status history');
    end;
    reset role;

    -- ===== user B tries to touch A's data =====
    perform set_config('request.jwt.claim.sub', ub::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', ub, 'role', 'authenticated')::text, true);
    set local role authenticated;
    select count(*) = 0 into ok from public.programmes where id = pid;
    res := res || (case when ok then 'PASS' else 'FAIL' end || ' - B cannot read A''s programme');
    update public.programmes set programme_name = 'hacked' where id = pid;
    get diagnostics n = row_count;
    res := res || (case when n = 0 then 'PASS' else 'FAIL' end || ' - B cannot update A''s programme');
    delete from public.programmes where id = pid;
    get diagnostics n = row_count;
    res := res || (case when n = 0 then 'PASS' else 'FAIL' end || ' - B cannot delete A''s programme');
    begin
      insert into public.programmes (owner_id, university_name, programme_name) values (ua, 'x', 'y');
      res := res || 'FAIL - B inserted a row owned by A';
    exception when others then
      res := res || (case when sqlstate = '42501' then 'PASS' else 'FAIL (' || sqlstate || ')' end || ' - B cannot insert a row owned by A');
    end;
    begin
      insert into public.tasks (title, programme_id) values ('forged', pid);
      res := res || 'FAIL - B linked a task to A''s programme';
    exception when others then
      res := res || (case when sqlstate = '23503' then 'PASS' else 'FAIL (' || sqlstate || ')' end || ' - B cannot link a task to A''s programme (FK)');
    end;
    begin
      insert into public.tasks (title, prerequisite_task_id) values ('forged', tid);
      res := res || 'FAIL - B used A''s task as prerequisite';
    exception when others then
      res := res || (case when sqlstate = '23503' then 'PASS' else 'FAIL (' || sqlstate || ')' end || ' - B cannot use A''s task as prerequisite (FK)');
    end;
    begin
      update public.profiles set display_name = 'hacked' where id = ua;
      get diagnostics n = row_count;
      res := res || (case when n = 0 then 'PASS' else 'FAIL' end || ' - B cannot update A''s profile');
    end;
    reset role;

    -- ===== constraints that protect data meaning =====
    perform set_config('request.jwt.claim.sub', ua::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', ua, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      insert into public.programmes (university_name, programme_name, tuition_state, tuition_amount, tuition_currency)
      values ('U', 'P', 'unknown', 0, 'GBP');
      res := res || 'FAIL - unknown tuition stored as 0';
    exception when others then
      res := res || (case when sqlstate = '23514' then 'PASS' else 'FAIL (' || sqlstate || ')' end || ' - unknown tuition cannot be stored as an amount');
    end;

    -- ===== demo seed: idempotent, isolated, resettable =====
    select public.seed_demo_data(current_date) into n;
    res := res || (case when n = 6 then 'PASS' else 'FAIL (' || n || ')' end || ' - seed creates 6 sample programmes');
    select public.seed_demo_data(current_date) into n;
    res := res || (case when n = 6 then 'PASS' else 'FAIL (' || n || ')' end || ' - second seed adds nothing');
    reset role;
    perform set_config('request.jwt.claim.sub', ub::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', ub, 'role', 'authenticated')::text, true);
    set local role authenticated;
    select count(*) = 0 into ok from public.programmes where sample_key is not null;
    res := res || (case when ok then 'PASS' else 'FAIL' end || ' - B does not see A''s sample data');
    reset role;
    perform set_config('request.jwt.claim.sub', ua::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', ua, 'role', 'authenticated')::text, true);
    set local role authenticated;
    perform public.reset_demo_data();
    select count(*) = 0 into ok from public.programmes where sample_key is not null;
    select ok and count(*) = 1 into ok from public.programmes where id = pid;
    res := res || (case when ok then 'PASS' else 'FAIL' end || ' - reset removes samples and keeps A''s own programme');
    reset role;

    -- ===== anonymous caller =====
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '', true);
    set local role anon;
    begin
      perform count(*) from public.programmes;
      res := res || 'FAIL - anon can read programmes';
    exception when others then
      res := res || (case when sqlstate = '42501' then 'PASS' else 'FAIL (' || sqlstate || ')' end || ' - anon cannot read programmes');
    end;
    begin
      perform public.seed_demo_data(current_date);
      res := res || 'FAIL - anon can run seed';
    exception when others then
      res := res || (case when sqlstate = '42501' then 'PASS' else 'FAIL (' || sqlstate || ')' end || ' - anon cannot run the seed function');
    end;
    reset role;

    raise exception using errcode = 'P0001', message = '__rollback__'; -- undo everything above
  exception when others then
    if sqlerrm <> '__rollback__' then
      res := res || ('ERROR - check aborted: ' || sqlstate || ' ' || sqlerrm);
    end if;
  end;
  return query select unnest(res);
end
$f$;

select * from pg_temp.hosted_authz_check();
