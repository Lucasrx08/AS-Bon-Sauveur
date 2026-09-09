-- Association Sportive du Bon Sauveur — migration V20
-- Modèle aligné sur l'interface V19/V20 avec identifiants texte pour conserver
-- les données existantes et faciliter la synchronisation multi-appareils.
-- À exécuter après schema.sql et les migrations précédentes.

create or replace function public.v20_specialty_for_role()
returns text
language sql stable security definer set search_path = public
as $$
  select case public.current_role()
    when 'educator_football' then 'Section Football'
    when 'educator_escalade' then 'Option Escalade'
    when 'educator_gymnastique' then 'Sport-études Gymnastique'
    else null
  end;
$$;

create table if not exists public.v20_events (
  id text primary key,
  title text not null,
  age_category text,
  specialty text not null,
  date date not null,
  start_time time,
  end_time time,
  place text,
  convocation_id text,
  public_visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.v20_documents (
  id text primary key,
  title text not null,
  specialty text not null,
  date date,
  description text,
  url text,
  featured boolean not null default false,
  public_visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.v20_products (
  id text primary key,
  name text not null,
  description text,
  price numeric(8,2) not null default 0,
  deadline date,
  active boolean not null default true,
  image text,
  color text,
  updated_at timestamptz not null default now()
);

create table if not exists public.v20_orders (
  id text primary key,
  product_id text,
  student_name text not null check (char_length(trim(student_name)) between 2 and 120),
  class_name text not null check (char_length(trim(class_name)) between 1 and 80),
  size text,
  quantity integer not null default 1 check (quantity between 1 and 10),
  payment_method text,
  paid boolean not null default false,
  distributed boolean not null default false,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.v20_students (
  id text primary key,
  full_name text not null,
  class_name text not null,
  specialty text not null,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.v20_appreciations (
  id text primary key,
  student_id text not null references public.v20_students(id) on delete cascade,
  educator_id uuid references public.profiles(id) on delete set null,
  term smallint not null check (term between 1 and 3),
  text text,
  status text not null default 'draft' check (status in ('todo','draft','validated')),
  updated_at timestamptz not null default now()
);

create table if not exists public.v20_licenses (
  id text primary key,
  student_id text references public.v20_students(id) on delete set null,
  full_name text not null,
  class_name text not null,
  category text,
  contribution text,
  payment_status text not null default 'En attente',
  amount numeric(8,2) not null default 20,
  charter_signed text,
  section_option text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.v20_convocations (
  id text primary key,
  title text not null,
  activity text,
  age_category text,
  specialty text not null,
  date date not null,
  departure time,
  return_time time,
  place text,
  meeting_point text,
  teacher text,
  extra_info text,
  status text not null default 'published' check (status in ('draft','published','archived')),
  public_visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.v20_convocation_students (
  convocation_id text not null references public.v20_convocations(id) on delete cascade,
  student_id text not null references public.v20_students(id) on delete cascade,
  primary key (convocation_id, student_id)
);

create table if not exists public.v20_reports (
  id text primary key,
  date date not null,
  activity text not null,
  teacher text,
  level text,
  place text,
  category text,
  participants integer not null default 0 check (participants >= 0),
  comment text,
  updated_at timestamptz not null default now()
);

create table if not exists public.v20_specialty_notes (
  specialty text primary key,
  message text,
  expires_at date,
  active boolean not null default false,
  public_visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.v20_term_settings (
  term smallint primary key check (term between 1 and 3),
  deadline date,
  term_end date,
  updated_at timestamptz not null default now()
);

insert into public.v20_term_settings(term,deadline,term_end) values
  (1,'2026-11-30','2026-12-11'),
  (2,'2027-03-12','2027-03-19'),
  (3,'2027-06-11','2027-06-25')
on conflict (term) do nothing;

insert into public.v20_specialty_notes(specialty,message,active) values
  ('Section Football','',false),
  ('Option Escalade','',false),
  ('Sport-études Gymnastique','',false)
on conflict (specialty) do nothing;

alter table public.v20_events enable row level security;
alter table public.v20_documents enable row level security;
alter table public.v20_products enable row level security;
alter table public.v20_orders enable row level security;
alter table public.v20_students enable row level security;
alter table public.v20_appreciations enable row level security;
alter table public.v20_licenses enable row level security;
alter table public.v20_convocations enable row level security;
alter table public.v20_convocation_students enable row level security;
alter table public.v20_reports enable row level security;
alter table public.v20_specialty_notes enable row level security;
alter table public.v20_term_settings enable row level security;

-- Lecture publique : uniquement les contenus explicitement publiés.
drop policy if exists "v20_events_read" on public.v20_events;
create policy "v20_events_read" on public.v20_events for select
using (public_visible or public.is_teacher_or_admin() or specialty = public.v20_specialty_for_role());

drop policy if exists "v20_documents_read" on public.v20_documents;
create policy "v20_documents_read" on public.v20_documents for select
using (public_visible or public.is_teacher_or_admin() or specialty = public.v20_specialty_for_role());

drop policy if exists "v20_products_read" on public.v20_products;
create policy "v20_products_read" on public.v20_products for select
using (active or public.is_teacher_or_admin());

drop policy if exists "v20_convocations_read" on public.v20_convocations;
create policy "v20_convocations_read" on public.v20_convocations for select
using ((public_visible and status='published') or public.is_teacher_or_admin() or specialty = public.v20_specialty_for_role());

drop policy if exists "v20_notes_read" on public.v20_specialty_notes;
create policy "v20_notes_read" on public.v20_specialty_notes for select
using (
  (public_visible and active and (expires_at is null or expires_at >= current_date))
  or public.is_teacher_or_admin()
  or specialty = public.v20_specialty_for_role()
);

-- Contenus éditoriaux : enseignants AS et administrateur uniquement.
drop policy if exists "v20_events_write" on public.v20_events;
create policy "v20_events_write" on public.v20_events for all to authenticated
using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

drop policy if exists "v20_documents_write" on public.v20_documents;
create policy "v20_documents_write" on public.v20_documents for all to authenticated
using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

drop policy if exists "v20_products_write" on public.v20_products;
create policy "v20_products_write" on public.v20_products for all to authenticated
using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

drop policy if exists "v20_convocations_write" on public.v20_convocations;
create policy "v20_convocations_write" on public.v20_convocations for all to authenticated
using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

-- Élèves : jamais publics. Un éducateur ne voit que sa spécialité.
drop policy if exists "v20_students_read" on public.v20_students;
create policy "v20_students_read" on public.v20_students for select to authenticated
using (public.is_teacher_or_admin() or specialty = public.v20_specialty_for_role());

drop policy if exists "v20_students_write" on public.v20_students;
create policy "v20_students_write" on public.v20_students for all to authenticated
using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

-- Licences : écriture réservée au staff AS ; lecture éducateur limitée à sa spécialité.
drop policy if exists "v20_licenses_read" on public.v20_licenses;
create policy "v20_licenses_read" on public.v20_licenses for select to authenticated
using (public.is_teacher_or_admin() or section_option = public.v20_specialty_for_role());

drop policy if exists "v20_licenses_write" on public.v20_licenses;
create policy "v20_licenses_write" on public.v20_licenses for all to authenticated
using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

-- Appréciations : l'éducateur ne peut agir que sur ses propres appréciations
-- et sur les élèves correspondant à sa spécialité. Le staff AS garde la supervision.
drop policy if exists "v20_appreciations_read" on public.v20_appreciations;
create policy "v20_appreciations_read" on public.v20_appreciations for select to authenticated
using (
  public.is_teacher_or_admin()
  or (
    educator_id = auth.uid()
    and exists (
      select 1 from public.v20_students s
      where s.id = student_id and s.specialty = public.v20_specialty_for_role()
    )
  )
);

drop policy if exists "v20_appreciations_insert" on public.v20_appreciations;
create policy "v20_appreciations_insert" on public.v20_appreciations for insert to authenticated
with check (
  public.is_teacher_or_admin()
  or (
    educator_id = auth.uid()
    and exists (
      select 1 from public.v20_students s
      where s.id = student_id and s.specialty = public.v20_specialty_for_role()
    )
  )
);

drop policy if exists "v20_appreciations_update" on public.v20_appreciations;
create policy "v20_appreciations_update" on public.v20_appreciations for update to authenticated
using (public.is_teacher_or_admin() or educator_id = auth.uid())
with check (
  public.is_teacher_or_admin()
  or (
    educator_id = auth.uid()
    and exists (
      select 1 from public.v20_students s
      where s.id = student_id and s.specialty = public.v20_specialty_for_role()
    )
  )
);

drop policy if exists "v20_appreciations_delete" on public.v20_appreciations;
create policy "v20_appreciations_delete" on public.v20_appreciations for delete to authenticated
using (public.is_teacher_or_admin() or educator_id = auth.uid());

-- Élèves convoqués : jamais visibles anonymement.
drop policy if exists "v20_conv_links_read" on public.v20_convocation_students;
create policy "v20_conv_links_read" on public.v20_convocation_students for select to authenticated
using (
  public.is_teacher_or_admin()
  or exists (
    select 1 from public.v20_convocations c
    where c.id = convocation_id and c.specialty = public.v20_specialty_for_role()
  )
);

drop policy if exists "v20_conv_links_write" on public.v20_convocation_students;
create policy "v20_conv_links_write" on public.v20_convocation_students for all to authenticated
using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

-- Bilans : données internes au staff AS.
drop policy if exists "v20_reports_staff" on public.v20_reports;
create policy "v20_reports_staff" on public.v20_reports for all to authenticated
using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

-- Boutique : un visiteur peut uniquement déposer une commande ; il ne peut
-- ni lister, ni relire, ni modifier les commandes. Le staff AS les gère.
drop policy if exists "v20_orders_public_insert" on public.v20_orders;
create policy "v20_orders_public_insert" on public.v20_orders for insert to anon, authenticated
with check (true);

drop policy if exists "v20_orders_staff_read" on public.v20_orders;
create policy "v20_orders_staff_read" on public.v20_orders for select to authenticated
using (public.is_teacher_or_admin());

drop policy if exists "v20_orders_staff_update" on public.v20_orders;
create policy "v20_orders_staff_update" on public.v20_orders for update to authenticated
using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

drop policy if exists "v20_orders_staff_delete" on public.v20_orders;
create policy "v20_orders_staff_delete" on public.v20_orders for delete to authenticated
using (public.is_teacher_or_admin());

-- Notes : administrateur/staff AS, ou éducateur uniquement pour sa spécialité.
drop policy if exists "v20_notes_write" on public.v20_specialty_notes;
create policy "v20_notes_write" on public.v20_specialty_notes for all to authenticated
using (public.is_teacher_or_admin() or specialty = public.v20_specialty_for_role())
with check (public.is_teacher_or_admin() or specialty = public.v20_specialty_for_role());

-- Paramétrage des trimestres : lecture staff, écriture administrateur.
drop policy if exists "v20_terms_read" on public.v20_term_settings;
create policy "v20_terms_read" on public.v20_term_settings for select to authenticated using (true);

drop policy if exists "v20_terms_write" on public.v20_term_settings;
create policy "v20_terms_write" on public.v20_term_settings for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Privilèges SQL explicites ; les politiques RLS restent la barrière de sécurité.
grant select on public.v20_events, public.v20_documents, public.v20_products,
  public.v20_convocations, public.v20_specialty_notes to anon, authenticated;
grant insert on public.v20_orders to anon, authenticated;
grant select, insert, update, delete on public.v20_events, public.v20_documents,
  public.v20_products, public.v20_orders, public.v20_students, public.v20_appreciations,
  public.v20_licenses, public.v20_convocations, public.v20_convocation_students,
  public.v20_reports, public.v20_specialty_notes, public.v20_term_settings to authenticated;
