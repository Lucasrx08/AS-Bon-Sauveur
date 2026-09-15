-- V22.1 — finalisation RGPD
-- Migration appliquée en production le 15/09/2026.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create or replace function private.current_role()
returns public.app_role
language sql stable security definer set search_path=''
as $$
  select coalesce((select role from public.profiles where id = auth.uid()),'public'::public.app_role);
$$;
revoke all on function private.current_role() from public;
grant execute on function private.current_role() to anon, authenticated, service_role;

create or replace function public.current_role()
returns public.app_role language sql stable security invoker set search_path=''
as $$ select private.current_role(); $$;

create or replace function public.is_admin()
returns boolean language sql stable security invoker set search_path=''
as $$ select private.current_role()='admin'::public.app_role; $$;

create or replace function public.is_teacher_or_admin()
returns boolean language sql stable security invoker set search_path=''
as $$ select private.current_role() in ('teacher_as'::public.app_role,'admin'::public.app_role); $$;

create or replace function public.educator_specialty()
returns text language sql stable security invoker set search_path=''
as $$ select case private.current_role()
  when 'educator_football'::public.app_role then 'Football'
  when 'educator_escalade'::public.app_role then 'Escalade'
  when 'educator_gymnastique'::public.app_role then 'Gymnastique'
  else null end; $$;

create or replace function public.v20_specialty_for_role()
returns text language sql stable security invoker set search_path=''
as $$ select case private.current_role()
  when 'educator_football'::public.app_role then 'Section Football'
  when 'educator_escalade'::public.app_role then 'Option Escalade'
  when 'educator_gymnastique'::public.app_role then 'Sport-études Gymnastique'
  else null end; $$;

revoke all on function public.current_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_teacher_or_admin() from public;
revoke all on function public.educator_specialty() from public;
revoke all on function public.v20_specialty_for_role() from public;
grant execute on function public.current_role() to anon, authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.is_teacher_or_admin() to anon, authenticated, service_role;
grant execute on function public.educator_specialty() to anon, authenticated, service_role;
grant execute on function public.v20_specialty_for_role() to anon, authenticated, service_role;

create or replace function public.v22_academic_retention_due(p_at timestamptz default now())
returns timestamptz language sql immutable security invoker set search_path=''
as $$
  select make_timestamptz(
    extract(year from (p_at at time zone 'Europe/Paris'))::integer
    + case when extract(month from (p_at at time zone 'Europe/Paris'))::integer >= 8 then 1 else 0 end,
    10,1,3,0,0,'Europe/Paris'
  );
$$;

alter table public.v20_students add column if not exists retention_due_at timestamptz default public.v22_academic_retention_due(now());
alter table public.v20_licenses add column if not exists retention_due_at timestamptz default public.v22_academic_retention_due(now());
alter table public.v20_appreciations add column if not exists retention_due_at timestamptz default public.v22_academic_retention_due(now());
alter table public.v20_reports add column if not exists retention_due_at timestamptz default (now()+interval '24 months');

create or replace function public.v22_cleanup_expired()
returns jsonb language plpgsql security definer set search_path=public,pg_temp
as $$
declare
 r1 int:=0;r2 int:=0;r3 int:=0;r4 int:=0;r5 int:=0;r6 int:=0;r7 int:=0;r8 int:=0;r9 int:=0;
begin
 delete from public.v20_event_registrations where retention_due_at<now(); get diagnostics r1=row_count;
 delete from public.v20_convocation_students cs using public.v20_convocations c where cs.convocation_id=c.id and c.date<current_date-90; get diagnostics r2=row_count;
 delete from public.v20_appreciations where retention_due_at<now(); get diagnostics r3=row_count;
 delete from public.v20_licenses where retention_due_at<now(); get diagnostics r4=row_count;
 delete from public.v20_students where retention_due_at<now(); get diagnostics r5=row_count;
 delete from public.v20_reports where retention_due_at<now(); get diagnostics r6=row_count;
 delete from public.v20_orders where retention_due_at<now(); get diagnostics r7=row_count;
 delete from public.v22_rate_limits where updated_at<now()-interval '48 hours' and (blocked_until is null or blocked_until<now()); get diagnostics r8=row_count;
 delete from public.pin_login_attempts where updated_at<now()-interval '30 days' and (locked_until is null or locked_until<now()); get diagnostics r9=row_count;
 return jsonb_build_object('registrations',r1,'convocation_links',r2,'appreciations',r3,'licenses',r4,'students',r5,'reports',r6,'orders',r7,'rate_limits',r8,'pin_attempts',r9);
end;
$$;
revoke all on function public.v22_cleanup_expired() from public,anon,authenticated;
grant execute on function public.v22_cleanup_expired() to service_role;
