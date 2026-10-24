-- 0010 fictional tasks and milestones for the demo (M5.21). A separate function, so 0009's seed_demo_data is not
-- rewritten. Run it after seed_demo_data; it only attaches to sample programmes that exist, and every row carries
-- a sample_key, so reset_demo_data() (0009) removes them. Runs as the caller (security invoker): RLS still applies.
-- Dates are fixed once, relative to the explicit seed date. Repeat calls add nothing and never touch edited rows.

create or replace function public.seed_demo_planning(p_seed_date date) returns integer
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

  insert into public.deadlines (owner_id, programme_id, deadline_type, title, due_date, sample_key)
  select uid, p.id, d.dtype, d.title, p_seed_date + d.offset_days, d.skey
  from (values
    ('aldermoor-marketing-analytics', 'milestone', 'Ask referees to submit letters', 2, 'aldermoor-referees-milestone'),
    ('eastvale-digital-innovation', 'milestone', 'Portfolio review with tutor', 14, 'eastvale-portfolio-milestone'),
    (null, 'other', 'Scholarship information evening', 30, 'general-scholarship-evening')
  ) as d (pkey, dtype, title, offset_days, skey)
  left join public.programmes p on p.owner_id = uid and p.sample_key = d.pkey
  where d.pkey is null or p.id is not null
  on conflict do nothing;

  insert into public.tasks (owner_id, programme_id, title, due_date, priority, status, sample_key)
  select uid, p.id, t.title, case when t.offset_days is null then null else p_seed_date + t.offset_days end, t.priority, t.status, t.skey
  from (values
    ('aldermoor-marketing-analytics', 'Draft personal statement', 3, 'high', 'in_progress', 'task-draft-statement'),
    ('aldermoor-marketing-analytics', 'Request two academic references', -2, 'high', 'todo', 'task-request-references'),
    ('aldermoor-marketing-analytics', 'Submit application', 6, 'high', 'todo', 'task-submit-aldermoor'),
    ('brightwater-data-science', 'Order official transcript', 0, 'medium', 'todo', 'task-order-transcript'),
    ('eastvale-digital-innovation', 'Finalise portfolio pieces', 12, 'medium', 'todo', 'task-finalise-portfolio'),
    ('eastvale-digital-innovation', 'Upload portfolio', 13, 'low', 'todo', 'task-upload-portfolio'),
    (null, 'Book an English test date', 10, 'medium', 'todo', 'task-book-language-test'),
    (null, 'Research scholarships', null, 'low', 'done', 'task-research-scholarships')
  ) as t (pkey, title, offset_days, priority, status, skey)
  left join public.programmes p on p.owner_id = uid and p.sample_key = t.pkey
  where t.pkey is null or p.id is not null
  on conflict do nothing;

  -- Prerequisite chain: statement -> submit; portfolio pieces -> upload. Only fills an empty prerequisite.
  update public.tasks t set prerequisite_task_id = pre.id
  from (values
    ('task-submit-aldermoor', 'task-draft-statement'),
    ('task-upload-portfolio', 'task-finalise-portfolio')
  ) as link (child, parent)
  join public.tasks pre on pre.owner_id = uid and pre.sample_key = link.parent
  where t.owner_id = uid and t.sample_key = link.child and t.prerequisite_task_id is null;

  select count(*) into n from public.tasks where owner_id = uid and sample_key is not null;
  return n;
end $$;

revoke all on function public.seed_demo_planning(date) from public, anon;
grant execute on function public.seed_demo_planning(date) to authenticated;
