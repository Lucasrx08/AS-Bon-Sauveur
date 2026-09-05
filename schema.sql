-- Bon Sauveur Sport — schéma Supabase V1
-- À exécuter dans SQL Editor d'un nouveau projet Supabase.

create extension if not exists pgcrypto;

create type public.app_role as enum (
  'public', 'educator_football', 'educator_escalade', 'educator_gymnastique', 'teacher_as', 'admin'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.app_role not null default 'public',
  class_name text,
  level_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_role()
returns public.app_role
language sql stable security definer set search_path = public
as $$ select coalesce((select role from public.profiles where id = auth.uid()), 'public'::public.app_role); $$;

create or replace function public.is_teacher_or_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select public.current_role() in ('teacher_as','admin'); $$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select public.current_role() = 'admin'; $$;

create table public.students (
  id uuid primary key default gen_random_uuid(),
  last_name text not null,
  first_name text not null,
  class_name text not null,
  level_name text,
  specialty text check (specialty in ('AS','Football','Escalade','Gymnastique')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('AS','Football','Escalade','Gymnastique')),
  date date not null,
  time time,
  place text,
  description text,
  audience text not null default 'Tous',
  level text default 'Tous',
  public_visible boolean not null default true,
  document_url text,
  link_url text,
  image_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  text text,
  category text not null check (category in ('AS','Football','Escalade','Gymnastique')),
  importance text not null default 'NORMAL' check (importance in ('NORMAL','IMPORTANT','URGENT')),
  audience text not null default 'Tous',
  level text default 'Tous',
  published_at date not null default current_date,
  expires_at date,
  status text not null default 'published' check (status in ('draft','scheduled','published','archived')),
  public_visible boolean not null default true,
  link_url text,
  document_url text,
  image_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('AS','Football','Escalade','Gymnastique')),
  description text,
  date date not null default current_date,
  audience text not null default 'Tous',
  level text default 'Tous',
  file_path text,
  url text,
  public_visible boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(8,2) not null default 0,
  sizes text[] not null default '{}',
  deadline date,
  category text not null default 'AS',
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  size text,
  quantity integer not null default 1 check (quantity > 0),
  status text not null default 'received' check (status in ('received','confirmed','delivered','cancelled')),
  created_at timestamptz not null default now()
);

create table public.convocations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('AS','Football','Escalade','Gymnastique')),
  date date not null,
  place text,
  departure time,
  return_time time,
  transport text,
  equipment text,
  extra_info text,
  document_url text,
  status text not null default 'published' check (status in ('draft','published','archived')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.convocation_students (
  convocation_id uuid references public.convocations(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  response_status text not null default 'to_view' check (response_status in ('to_view','viewed','confirmed')),
  primary key (convocation_id, student_id)
);

create table public.appreciations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  educator_id uuid not null references public.profiles(id) on delete cascade,
  term smallint not null check (term between 1 and 3),
  text text,
  status text not null default 'todo' check (status in ('todo','draft','validated')),
  deadline date,
  updated_at timestamptz not null default now(),
  unique(student_id, educator_id, term)
);

create table public.licenses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  activity text not null,
  status text not null default 'En attente',
  date date,
  notes text,
  created_at timestamptz not null default now()
);

create table public.as_reports (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  activity text not null,
  participants integer not null default 0,
  levels text,
  result text,
  comment text,
  photo_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Création automatique du profil lors d'une inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email), 'public');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.events enable row level security;
alter table public.announcements enable row level security;
alter table public.documents enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.convocations enable row level security;
alter table public.convocation_students enable row level security;
alter table public.appreciations enable row level security;
alter table public.licenses enable row level security;
alter table public.as_reports enable row level security;

-- Profils : chacun voit son profil, admin voit et modifie tout.
create policy "profile_self_read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profile_admin_update" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Données publiques de consultation.
create policy "events_public_read" on public.events for select using (public_visible or public.is_teacher_or_admin());
create policy "announcements_public_read" on public.announcements for select using ((public_visible and status='published' and (expires_at is null or expires_at >= current_date)) or public.is_teacher_or_admin());
create policy "documents_public_read" on public.documents for select using (public_visible or public.is_teacher_or_admin());
create policy "products_public_read" on public.products for select using (active or public.is_teacher_or_admin());
create policy "convocations_authenticated_read" on public.convocations for select to authenticated using (true);

-- Administration contenus : enseignants AS et admins.
create policy "events_staff_write" on public.events for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());
create policy "announcements_staff_write" on public.announcements for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());
create policy "documents_staff_write" on public.documents for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());
create policy "products_staff_write" on public.products for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());
create policy "convocations_staff_write" on public.convocations for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

-- Élèves / licences / bilans : jamais publics.
create policy "students_staff_read" on public.students for select to authenticated using (public.current_role() <> 'public');
create policy "students_admin_write" on public.students for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());
create policy "licenses_staff" on public.licenses for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());
create policy "reports_staff" on public.as_reports for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

-- Commandes : l'utilisateur connecté peut créer et lire ses commandes ; le staff voit tout.
create policy "orders_insert" on public.orders for insert to authenticated with check (user_id = auth.uid() or public.is_teacher_or_admin());
create policy "orders_read" on public.orders for select to authenticated using (user_id = auth.uid() or public.is_teacher_or_admin());
create policy "orders_staff_update" on public.orders for update to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

-- Appréciations : éducateur propriétaire + enseignants AS/admin.
create policy "appreciations_read" on public.appreciations for select to authenticated using (educator_id = auth.uid() or public.is_teacher_or_admin());
create policy "appreciations_insert" on public.appreciations for insert to authenticated with check (educator_id = auth.uid() or public.is_teacher_or_admin());
create policy "appreciations_update" on public.appreciations for update to authenticated using (educator_id = auth.uid() or public.is_teacher_or_admin()) with check (educator_id = auth.uid() or public.is_teacher_or_admin());

create policy "convocation_students_staff" on public.convocation_students for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

-- Stockage privé/public. Crée les buckets depuis Storage ou décommente selon votre projet.
-- insert into storage.buckets (id,name,public) values ('public-assets','public-assets',true) on conflict do nothing;
-- insert into storage.buckets (id,name,public) values ('private-documents','private-documents',false) on conflict do nothing;
