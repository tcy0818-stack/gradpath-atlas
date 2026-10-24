-- 0009 per-user fictional demo data (SEED-01..04). Both functions run as the caller (security invoker),
-- so RLS and owner checks still apply. Later phases replace seed_demo_data to add documents, tasks, milestones.
-- All names are invented; every row is marked by sample_key and labelled in notes.

create or replace function public.seed_demo_data(p_seed_date date) returns integer
language plpgsql as $$
declare
  uid uuid := auth.uid();
  n integer;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_seed_date is null then
    raise exception 'seed date is required' using errcode = '22004';
  end if;

  insert into public.programmes
    (owner_id, sample_key, university_name, programme_name, country_region, subject, intake_label,
     duration_months, tuition_state, tuition_amount, tuition_currency, status, is_shortlisted, notes)
  values
    (uid, 'aldermoor-marketing-analytics', 'Aldermoor University', 'MSc Marketing Analytics', 'United Kingdom', 'Marketing',
     'Sep 2027', 12, 'known', 24500, 'GBP', 'preparing', true, 'Fictional example programme, invented for demonstration.'),
    (uid, 'brightwater-data-science', 'Brightwater Institute', 'MSc Data Science', 'Netherlands', 'Data science',
     'Sep 2027', 24, 'known', 18200, 'EUR', 'preparing', true, 'Fictional example programme, invented for demonstration.'),
    (uid, 'corvane-computer-science', 'Corvane University of Technology', 'MEng Computer Science', 'Germany', 'Computer science',
     'Oct 2027', 24, 'not_applicable', null, null, 'researching', false, 'Fictional example programme, invented for demonstration.'),
    (uid, 'dunmere-economics', 'Dunmere School of Economics', 'MSc Economics', 'United Kingdom', 'Economics',
     'Sep 2027', 9, 'known', 31000, 'GBP', 'researching', true, 'Fictional example programme, invented for demonstration.'),
    (uid, 'eastvale-digital-innovation', 'Eastvale University', 'MA Digital Innovation', 'Hong Kong', 'Digital innovation',
     'Aug 2027', 12, 'known', 198000, 'HKD', 'preparing', true, 'Fictional example programme, invented for demonstration.'),
    (uid, 'fernhollow-management', 'Fernhollow College', 'MSc Management', 'Australia', 'Management',
     'Feb 2028', 18, 'known', 46000, 'AUD', 'submitted', false, 'Fictional example programme, invented for demonstration.')
  on conflict do nothing;

  insert into public.requirements (owner_id, programme_id, requirement_type, level, detail, quantity)
  select uid, p.id, r.rtype, r.level, r.detail, r.qty
  from (values
    ('aldermoor-marketing-analytics', 'academic', 'required', 'Upper second-class standard or equivalent (fictional)', 1),
    ('aldermoor-marketing-analytics', 'language', 'required', 'English test, overall 6.5 (fictional)', 1),
    ('aldermoor-marketing-analytics', 'references', 'required', 'Two academic references', 2),
    ('aldermoor-marketing-analytics', 'statement', 'required', 'Personal statement, about 800 words', 1),
    ('aldermoor-marketing-analytics', 'transcript', 'required', 'Official transcript', 1),
    ('aldermoor-marketing-analytics', 'cv', 'required', 'Current CV', 1),
    ('brightwater-data-science', 'academic', 'required', 'GPA 3.3 / 4.0 or equivalent (fictional)', 1),
    ('brightwater-data-science', 'language', 'required', 'English test, overall 95 (fictional)', 1),
    ('brightwater-data-science', 'references', 'required', 'Two references', 2),
    ('brightwater-data-science', 'statement', 'required', 'One-page motivation letter', 1),
    ('brightwater-data-science', 'transcript', 'required', 'Official transcript', 1),
    ('brightwater-data-science', 'test_score', 'optional', 'Quantitative test score welcome but optional', 1),
    ('corvane-computer-science', 'academic', 'required', 'Strong quantitative background (fictional)', 1),
    ('corvane-computer-science', 'language', 'required', 'German level B2 (fictional)', 1),
    ('corvane-computer-science', 'references', 'not_applicable', null, 1),
    ('corvane-computer-science', 'statement', 'optional', 'Short statement', 1),
    ('corvane-computer-science', 'transcript', 'required', 'Official transcript', 1),
    ('corvane-computer-science', 'cv', 'required', 'Current CV', 1),
    ('dunmere-economics', 'academic', 'required', 'Strong undergraduate record (fictional)', 1),
    ('dunmere-economics', 'language', 'unknown', null, 1),
    ('dunmere-economics', 'references', 'unknown', null, 1),
    ('dunmere-economics', 'statement', 'required', 'Personal statement', 1),
    ('dunmere-economics', 'transcript', 'required', 'Official transcript', 1),
    ('eastvale-digital-innovation', 'academic', 'required', 'Relevant undergraduate degree (fictional)', 1),
    ('eastvale-digital-innovation', 'language', 'required', 'English test, overall 6.5 (fictional)', 1),
    ('eastvale-digital-innovation', 'references', 'required', 'Three references', 3),
    ('eastvale-digital-innovation', 'statement', 'required', 'Statement of purpose', 1),
    ('eastvale-digital-innovation', 'transcript', 'required', 'Official transcript', 1),
    ('eastvale-digital-innovation', 'portfolio', 'required', 'Portfolio of five pieces', 1),
    ('eastvale-digital-innovation', 'cv', 'optional', 'CV welcome', 1),
    ('fernhollow-management', 'academic', 'required', 'Undergraduate degree (fictional)', 1),
    ('fernhollow-management', 'language', 'required', 'English test (fictional)', 1),
    ('fernhollow-management', 'references', 'required', 'Two references', 2),
    ('fernhollow-management', 'statement', 'required', 'Personal statement', 1),
    ('fernhollow-management', 'transcript', 'required', 'Official transcript', 1),
    ('fernhollow-management', 'cv', 'required', 'Current CV', 1)
  ) as r (pkey, rtype, level, detail, qty)
  join public.programmes p on p.owner_id = uid and p.sample_key = r.pkey
  on conflict do nothing;

  -- Dates are fixed once, relative to the explicit seeding date (overdue, due today, soon, later).
  insert into public.deadlines (owner_id, programme_id, deadline_type, title, due_date, sample_key)
  select uid, p.id, 'submission', 'Application deadline', p_seed_date + d.offset_days, d.pkey || '-submission'
  from (values
    ('aldermoor-marketing-analytics', 6),
    ('brightwater-data-science', -5),
    ('corvane-computer-science', 45),
    ('eastvale-digital-innovation', 0),
    ('fernhollow-management', 120)
  ) as d (pkey, offset_days)
  join public.programmes p on p.owner_id = uid and p.sample_key = d.pkey
  on conflict do nothing;

  select count(*) into n from public.programmes where owner_id = uid and sample_key is not null;
  return n;
end $$;

-- Removes only the caller's sample rows. Rows that depend on them (requirements, links, history,
-- tasks/deadlines attached to sample programmes) go with them; the caller's own programmes are untouched.
create or replace function public.reset_demo_data() returns jsonb
language plpgsql as $$
declare
  uid uuid := auth.uid();
  p integer;
  d integer;
  t integer;
  dl integer;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  with x as (delete from public.programmes where owner_id = uid and sample_key is not null returning 1)
    select count(*) into p from x;
  with x as (delete from public.documents where owner_id = uid and sample_key is not null returning 1)
    select count(*) into d from x;
  with x as (delete from public.tasks where owner_id = uid and sample_key is not null returning 1)
    select count(*) into t from x;
  with x as (delete from public.deadlines where owner_id = uid and sample_key is not null returning 1)
    select count(*) into dl from x;

  return jsonb_build_object('programmes', p, 'documents', d, 'tasks', t, 'deadlines', dl);
end $$;

revoke all on function public.seed_demo_data(date) from public, anon;
revoke all on function public.reset_demo_data() from public, anon;
grant execute on function public.seed_demo_data(date) to authenticated;
grant execute on function public.reset_demo_data() to authenticated;
