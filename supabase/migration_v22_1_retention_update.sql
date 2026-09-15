-- V22.1 — réduction des durées de conservation
-- Appliqué en production le 15/09/2026.

create or replace function public.v22_academic_retention_due(p_at timestamptz default now())
returns timestamptz language sql immutable security invoker set search_path=''
as $$
  select make_timestamptz(
    extract(year from (p_at at time zone 'Europe/Paris'))::integer
      + case when extract(month from (p_at at time zone 'Europe/Paris'))::integer >= 7 then 1 else 0 end,
    7,1,0,0,0,'Europe/Paris'
  );
$$;

create or replace function public.v22_event_retention_due(p_event_date date)
returns timestamptz language sql immutable security invoker set search_path=''
as $$ select ((p_event_date + 8)::timestamp at time zone 'Europe/Paris'); $$;

revoke all on function public.v22_event_retention_due(date) from public;
grant execute on function public.v22_event_retention_due(date) to authenticated, service_role;

alter table public.v20_orders alter column retention_due_at set default public.v22_academic_retention_due(now());
alter table public.v20_reports alter column retention_due_at set default public.v22_academic_retention_due(now());

update public.v20_orders set retention_due_at=public.v22_academic_retention_due(created_at) where created_at is not null;
update public.v20_students set retention_due_at=public.v22_academic_retention_due(coalesce(updated_at,now()));
update public.v20_licenses set retention_due_at=public.v22_academic_retention_due(coalesce(updated_at,now()));
update public.v20_appreciations set retention_due_at=public.v22_academic_retention_due(coalesce(updated_at,now()));
update public.v20_reports set retention_due_at=public.v22_academic_retention_due(coalesce((date::timestamp at time zone 'Europe/Paris'),now()));

update public.v20_event_registrations r
set retention_due_at=public.v22_event_retention_due(e.date)
from public.v20_events e
where e.id=r.event_id;

create or replace function public.v22_set_registration_retention()
returns trigger language plpgsql security invoker set search_path=public,pg_temp
as $$
declare d date;
begin
  select e.date into d from public.v20_events e where e.id=new.event_id;
  if d is not null then new.retention_due_at:=public.v22_event_retention_due(d); end if;
  return new;
end;
$$;

drop trigger if exists v22_registration_retention on public.v20_event_registrations;
create trigger v22_registration_retention
before insert or update of event_id on public.v20_event_registrations
for each row execute function public.v22_set_registration_retention();

create or replace function public.v22_cleanup_expired()
returns jsonb language plpgsql security definer set search_path=public,pg_temp
as $$
declare
 registrations_deleted integer:=0; convocation_links_deleted integer:=0;
 appreciations_deleted integer:=0; licenses_deleted integer:=0; students_deleted integer:=0;
 reports_deleted integer:=0; orders_deleted integer:=0; rate_limits_deleted integer:=0; pin_attempts_deleted integer:=0;
begin
 delete from public.v20_event_registrations where retention_due_at is not null and retention_due_at<now();
 get diagnostics registrations_deleted=row_count;
 delete from public.v20_convocation_students cs using public.v20_convocations c
 where cs.convocation_id=c.id and c.date<current_date-7;
 get diagnostics convocation_links_deleted=row_count;
 delete from public.v20_appreciations where retention_due_at is not null and retention_due_at<now();
 get diagnostics appreciations_deleted=row_count;
 delete from public.v20_licenses where retention_due_at is not null and retention_due_at<now();
 get diagnostics licenses_deleted=row_count;
 delete from public.v20_students where retention_due_at is not null and retention_due_at<now();
 get diagnostics students_deleted=row_count;
 delete from public.v20_reports where retention_due_at is not null and retention_due_at<now();
 get diagnostics reports_deleted=row_count;
 delete from public.v20_orders where retention_due_at is not null and retention_due_at<now();
 get diagnostics orders_deleted=row_count;
 delete from public.v22_rate_limits where updated_at<now()-interval '48 hours' and (blocked_until is null or blocked_until<now());
 get diagnostics rate_limits_deleted=row_count;
 delete from public.pin_login_attempts where updated_at<now()-interval '30 days' and (locked_until is null or locked_until<now());
 get diagnostics pin_attempts_deleted=row_count;
 return jsonb_build_object(
  'registrations_deleted',registrations_deleted,'convocation_links_deleted',convocation_links_deleted,
  'appreciations_deleted',appreciations_deleted,'licenses_deleted',licenses_deleted,'students_deleted',students_deleted,
  'reports_deleted',reports_deleted,'orders_deleted',orders_deleted,'rate_limits_deleted',rate_limits_deleted,
  'pin_attempts_deleted',pin_attempts_deleted
 );
end;
$$;

revoke all on function public.v22_cleanup_expired() from public,anon,authenticated;
grant execute on function public.v22_cleanup_expired() to service_role;
