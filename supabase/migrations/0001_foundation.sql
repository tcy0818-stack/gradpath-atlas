-- 0001 foundation: shared trigger helper, profiles, new-user hook.
-- Requires PostgreSQL >= 15 (later migrations use ON DELETE SET NULL (column)).

create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 80),
  -- IANA zone name; validated against known zones in the app (Phase 2), drives "today" (PRD 5.5).
  time_zone text not null default 'UTC' check (char_length(time_zone) between 1 and 64),
  -- Simulation only: no payment is ever taken (PRD 6.4).
  demo_plan text not null default 'free' check (demo_plan in ('free', 'season_pass', 'licence_enquiry')),
  demo_plan_selected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

-- Trigger-only function: must not be callable through the API.
revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
