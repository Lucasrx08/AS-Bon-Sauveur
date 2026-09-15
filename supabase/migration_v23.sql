-- V23 — sécurité, rétention RGPD et durcissement des entrées publiques.
-- Migration appliquée en production le 15/09/2026.

update public.v20_orders
set reference = coalesce(reference, 'AS-' || upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 10))),
    retention_due_at = coalesce(retention_due_at, public.v22_academic_retention_due(created_at))
where reference is null or retention_due_at is null;

update public.v20_event_registrations r
set retention_due_at = coalesce(
  retention_due_at,
  (select public.v22_event_retention_due(e.date) from public.v20_events e where e.id = r.event_id),
  r.created_at + interval '1 day'
)
where retention_due_at is null;

alter table public.v20_orders
  alter column reference set not null,
  alter column retention_due_at set not null;

alter table public.v20_event_registrations
  alter column retention_due_at set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.v20_orders'::regclass and conname='v23_orders_quantity_check'
  ) then
    alter table public.v20_orders
      add constraint v23_orders_quantity_check check (quantity between 1 and 10);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='public.v20_orders'::regclass and conname='v23_orders_student_name_check'
  ) then
    alter table public.v20_orders
      add constraint v23_orders_student_name_check
      check (char_length(btrim(student_name)) between 2 and 120);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='public.v20_event_registrations'::regclass and conname='v23_registration_names_check'
  ) then
    alter table public.v20_event_registrations
      add constraint v23_registration_names_check
      check (
        char_length(btrim(last_name)) between 2 and 80
        and char_length(btrim(first_name)) between 2 and 80
        and char_length(btrim(class_name)) between 2 and 80
      );
  end if;
end
$$;

revoke all on table public.pin_accounts from public, anon, authenticated;
revoke all on table public.pin_login_attempts from public, anon, authenticated;
revoke all on table public.v22_rate_limits from public, anon, authenticated;

drop policy if exists v23_pin_accounts_deny on public.pin_accounts;
create policy v23_pin_accounts_deny
on public.pin_accounts as restrictive for all
to anon, authenticated
using (false) with check (false);

drop policy if exists v23_pin_login_attempts_deny on public.pin_login_attempts;
create policy v23_pin_login_attempts_deny
on public.pin_login_attempts as restrictive for all
to anon, authenticated
using (false) with check (false);

drop policy if exists v23_rate_limits_deny on public.v22_rate_limits;
create policy v23_rate_limits_deny
on public.v22_rate_limits as restrictive for all
to anon, authenticated
using (false) with check (false);

revoke all on table public.v20_orders from anon;
revoke all on table public.v20_event_registrations from anon;
drop policy if exists v20_orders_public_insert on public.v20_orders;
drop policy if exists v20_event_registrations_public_insert on public.v20_event_registrations;

revoke all on function public.v22_consume_rate_limit(text,text,integer,integer,integer)
  from public, anon, authenticated;
grant execute on function public.v22_consume_rate_limit(text,text,integer,integer,integer)
  to service_role;

revoke all on function public.v22_cleanup_expired()
  from public, anon, authenticated;
grant execute on function public.v22_cleanup_expired()
  to service_role;

revoke all on function public.v22_event_retention_due(date)
  from public, anon, authenticated;
grant execute on function public.v22_event_retention_due(date)
  to service_role;

do $$
declare jid bigint;
begin
  for jid in
    select jobid from cron.job where jobname in ('v22_rgpd_cleanup','v23_rgpd_cleanup')
  loop
    perform cron.unschedule(jid);
  end loop;

  perform cron.schedule(
    'v23_rgpd_cleanup',
    '0 * * * *',
    'select public.v22_cleanup_expired();'
  );
end
$$;

comment on table public.v22_rate_limits is
  'V23 internal rate-limit counters. Only hashed technical keys are stored.';
comment on column public.v20_event_registrations.retention_due_at is
  'V23 RGPD: deletion at the first hourly purge after midnight following the event.';
comment on column public.v20_orders.retention_due_at is
  'V23 RGPD: deletion no later than 1 July following the relevant school year.';
