-- Bon Sauveur Sport / Association Sportive du Bon Sauveur — migration V4
-- À exécuter après le schéma initial lorsque Supabase sera activé.

-- Événements : distinguer catégorie d'âge et spécialité, avec horaires départ/retour.
alter table public.events add column if not exists age_category text;
alter table public.events add column if not exists specialty text;
alter table public.events add column if not exists end_time time;
alter table public.events add column if not exists convocation_id uuid;

-- Convocations : activité + catégorie + spécialité.
alter table public.convocations add column if not exists activity text;
alter table public.convocations add column if not exists age_category text;
alter table public.convocations add column if not exists specialty text;
alter table public.convocations add column if not exists meeting_point text;

-- Licences : paiement et montant réellement encaissé.
alter table public.licenses add column if not exists full_name text;
alter table public.licenses add column if not exists class_name text;
alter table public.licenses add column if not exists category text;
alter table public.licenses add column if not exists contribution text;
alter table public.licenses add column if not exists payment_status text default 'En attente';
alter table public.licenses add column if not exists amount numeric(8,2) default 20;
alter table public.licenses add column if not exists charter_signed text;
alter table public.licenses add column if not exists section_option text;

-- Boutique : commande pour un élève + suivi paiement/préparation/distribution.
alter table public.orders add column if not exists student_name text;
alter table public.orders add column if not exists class_name text;
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists paid boolean not null default false;
alter table public.orders add column if not exists ready boolean not null default false;
alter table public.orders add column if not exists distributed boolean not null default false;
alter table public.products add column if not exists payment_link text;

-- Bilans AS : reprend les rubriques du Google Form historique.
alter table public.as_reports add column if not exists teacher text;
alter table public.as_reports add column if not exists level text;
alter table public.as_reports add column if not exists place text;
alter table public.as_reports add column if not exists category text;

-- Paramétrage des trimestres.
create table if not exists public.term_settings (
  term smallint primary key check (term between 1 and 3),
  appreciation_deadline date,
  term_end date,
  updated_at timestamptz not null default now()
);

insert into public.term_settings(term, appreciation_deadline, term_end)
values
  (1, '2026-11-30', '2026-12-11'),
  (2, '2027-03-12', '2027-03-19'),
  (3, '2027-06-11', '2027-06-25')
on conflict (term) do nothing;

alter table public.term_settings enable row level security;
drop policy if exists "term_settings_read" on public.term_settings;
create policy "term_settings_read" on public.term_settings for select to authenticated using (true);
drop policy if exists "term_settings_admin_write" on public.term_settings;
create policy "term_settings_admin_write" on public.term_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
