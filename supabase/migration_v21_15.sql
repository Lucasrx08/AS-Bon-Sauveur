-- Association Sportive du Bon Sauveur — migration V21.15
-- Inscriptions libres aux événements sans convocation.
-- À exécuter après supabase/migration_v20.sql, avant de publier le frontend V21.15.

alter table public.v20_events
  add column if not exists registration_open boolean not null default false;

create table if not exists public.v20_event_registrations (
  id text primary key check (char_length(id) between 10 and 80),
  event_id text not null references public.v20_events(id) on delete cascade,
  last_name text not null check (last_name = btrim(last_name) and char_length(last_name) between 2 and 80),
  first_name text not null check (first_name = btrim(first_name) and char_length(first_name) between 2 and 80),
  class_name text not null check (
    class_name in (
      '6e AVIGNON','6e Georges BIZET','6e Paul CEZANNE','6e Alphonse DAUDET',
      '5e Jacqueline AURIOL','5e Adrienne BOLLAND','5e Bessie COLEMAN','5e Elise DEROCHE',
      '4e ESTANGUET','4e FLESSEL','4e Cyril MORE','4e DELAUNAY',
      '3e Antonio GAUDI','3e BARCELONE','3e CASTILLE','3e DALI','3e ESPINOZA',
      'Seconde Pro ECP','Seconde Pro Maslow','Seconde Pro Henderson','Seconde GT',
      'Première Pro ECP','Première Pro Curie','Première Pro Pasteur','Première ST2S',
      'Terminale ST2S','Terminale ASSP'
    )
  ),
  created_at timestamptz not null default now()
);

create unique index if not exists v20_event_registrations_unique_student
  on public.v20_event_registrations (
    event_id,
    lower(btrim(last_name)),
    lower(btrim(first_name)),
    lower(btrim(class_name))
  );

create index if not exists v20_event_registrations_event_created_idx
  on public.v20_event_registrations (event_id, created_at desc);

alter table public.v20_event_registrations enable row level security;

-- Un visiteur peut uniquement s'inscrire à un événement public, à venir,
-- explicitement ouvert et dépourvu de convocation disponible.
drop policy if exists "v20_event_registrations_public_insert" on public.v20_event_registrations;
create policy "v20_event_registrations_public_insert"
on public.v20_event_registrations
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.v20_events e
    where e.id = v20_event_registrations.event_id
      and e.public_visible
      and e.registration_open
      and e.date >= current_date
      and e.convocation_id is null
      and not exists (
        select 1
        from public.v20_convocations c
        where c.public_visible
          and c.status = 'published'
          and c.date = e.date
          and c.specialty = e.specialty
          and c.title = e.title
      )
  )
);

-- La liste nominative est réservée aux enseignants AS et aux administrateurs.
drop policy if exists "v20_event_registrations_staff_read" on public.v20_event_registrations;
create policy "v20_event_registrations_staff_read"
on public.v20_event_registrations
for select
to authenticated
using (public.is_teacher_or_admin());

revoke all on public.v20_event_registrations from anon, authenticated;
grant insert on public.v20_event_registrations to anon, authenticated;
grant select on public.v20_event_registrations to authenticated;

comment on column public.v20_events.registration_open is
  'Affiche l inscription libre uniquement lorsqu aucune convocation n est disponible.';
comment on table public.v20_event_registrations is
  'Inscriptions nominatives aux événements publics sans convocation, lisibles uniquement par le staff AS.';

notify pgrst, 'reload schema';
