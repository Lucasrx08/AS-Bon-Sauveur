-- V22.1 — suppression des données d'événement à minuit
-- Appliqué en production le 15/09/2026.

create or replace function public.v22_event_retention_due(p_event_date date)
returns timestamptz
language sql
immutable
security invoker
set search_path = ''
as $$
  select ((p_event_date + 1)::timestamp at time zone 'Europe/Paris');
$$;

update public.v20_event_registrations r
set retention_due_at = public.v22_event_retention_due(e.date)
from public.v20_events e
where e.id = r.event_id;

create or replace function public.v22_cleanup_expired()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
 registrations_deleted integer:=0; convocation_links_deleted integer:=0;
 appreciations_deleted integer:=0; licenses_deleted integer:=0; students_deleted integer:=0;
 reports_deleted integer:=0; orders_deleted integer:=0; rate_limits_deleted integer:=0; pin_attempts_deleted integer:=0;
begin
 delete from public.v20_event_registrations where retention_due_at is not null and retention_due_at<=now();
 get diagnostics registrations_deleted=row_count;

 delete from public.v20_convocation_students cs using public.v20_convocations c
 where cs.convocation_id=c.id
   and c.date < (now() at time zone 'Europe/Paris')::date;
 get diagnostics convocation_links_deleted=row_count;

 delete from public.v20_appreciations where retention_due_at is not null and retention_due_at<=now();
 get diagnostics appreciations_deleted=row_count;
 delete from public.v20_licenses where retention_due_at is not null and retention_due_at<=now();
 get diagnostics licenses_deleted=row_count;
 delete from public.v20_students where retention_due_at is not null and retention_due_at<=now();
 get diagnostics students_deleted=row_count;
 delete from public.v20_reports where retention_due_at is not null and retention_due_at<=now();
 get diagnostics reports_deleted=row_count;
 delete from public.v20_orders where retention_due_at is not null and retention_due_at<=now();
 get diagnostics orders_deleted=row_count;

 delete from public.v22_rate_limits
 where updated_at<now()-interval '48 hours' and (blocked_until is null or blocked_until<now());
 get diagnostics rate_limits_deleted=row_count;

 delete from public.pin_login_attempts
 where updated_at<now()-interval '30 days' and (locked_until is null or locked_until<now());
 get diagnostics pin_attempts_deleted=row_count;

 return jsonb_build_object(
  'registrations_deleted',registrations_deleted,'convocation_links_deleted',convocation_links_deleted,
  'appreciations_deleted',appreciations_deleted,'licenses_deleted',licenses_deleted,'students_deleted',students_deleted,
  'reports_deleted',reports_deleted,'orders_deleted',orders_deleted,'rate_limits_deleted',rate_limits_deleted,
  'pin_attempts_deleted',pin_attempts_deleted
 );
end;
$$;

do $$
declare existing_job bigint;
begin
 select jobid into existing_job from cron.job where jobname='v22_rgpd_cleanup' limit 1;
 if existing_job is not null then perform cron.unschedule(existing_job); end if;
 perform cron.schedule('v22_rgpd_cleanup','0 * * * *','select public.v22_cleanup_expired();');
end;
$$;
