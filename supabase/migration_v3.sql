-- Association Sportive du Bon Sauveur — migration V3
alter table public.licenses add column if not exists full_name text;
alter table public.licenses add column if not exists class_name text;
alter table public.licenses add column if not exists category text;
alter table public.licenses add column if not exists contribution text;
alter table public.licenses add column if not exists charter_signed text;
alter table public.licenses add column if not exists section_option text;
alter table public.licenses add column if not exists active boolean not null default true;

alter table public.documents add column if not exists featured boolean not null default false;

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  caption text,
  image_url text not null,
  instagram_url text,
  published_at timestamptz not null default now(),
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.photos enable row level security;
drop policy if exists "photos_public_read" on public.photos;
create policy "photos_public_read" on public.photos for select using (visible or public.is_teacher_or_admin());
drop policy if exists "photos_staff_write" on public.photos;
create policy "photos_staff_write" on public.photos for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());
