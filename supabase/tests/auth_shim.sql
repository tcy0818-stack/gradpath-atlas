-- TEST ONLY. Minimal stand-in for the parts of Supabase the migrations rely on, so the schema can be
-- exercised in a plain local PostgreSQL (PGlite). It is NOT a migration and is never applied to Supabase.
-- Mirrors Supabase: roles anon/authenticated, auth.users, auth.uid() from the JWT "sub" claim, and
-- permissive default privileges on public (so the migrations' explicit REVOKEs are really tested).

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);

create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
