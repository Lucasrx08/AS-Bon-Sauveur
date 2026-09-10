-- Association Sportive du Bon Sauveur — correctif V21.15.2
-- Suppression ciblée d'une inscription, réservée au staff AS.
-- À exécuter après supabase/migration_v21_15.sql, avant de publier le frontend V21.15.2.

alter table public.v20_event_registrations enable row level security;

drop policy if exists "v20_event_registrations_staff_delete" on public.v20_event_registrations;
create policy "v20_event_registrations_staff_delete"
on public.v20_event_registrations
for delete
to authenticated
using ((select public.is_teacher_or_admin()));

revoke delete on public.v20_event_registrations from anon;
grant delete on public.v20_event_registrations to authenticated;

comment on policy "v20_event_registrations_staff_delete" on public.v20_event_registrations is
  'Autorise uniquement les enseignants AS et les administrateurs à retirer une inscription précise.';

notify pgrst, 'reload schema';
