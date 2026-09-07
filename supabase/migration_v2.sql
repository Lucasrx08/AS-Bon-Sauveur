-- Migration V1 -> V2 Bon Sauveur Sport
-- À exécuter dans Supabase > SQL Editor si le schéma V1 a déjà été créé.

alter table public.profiles add column if not exists email text;
update public.profiles p set email=u.email from auth.users u where p.id=u.id and p.email is null;

alter table public.documents add column if not exists featured boolean not null default false;
alter table public.convocations add column if not exists meeting_point text;

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  instagram_url text,
  caption text,
  date date default current_date,
  featured boolean not null default true,
  public_visible boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
alter table public.photos enable row level security;

drop policy if exists "photos_public_read" on public.photos;
create policy "photos_public_read" on public.photos for select
using (public_visible or public.is_teacher_or_admin());
drop policy if exists "photos_staff_write" on public.photos;
create policy "photos_staff_write" on public.photos for all to authenticated
using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

create or replace function public.educator_specialty()
returns text
language sql stable security definer set search_path = public
as $$
  select case public.current_role()
    when 'educator_football' then 'Football'
    when 'educator_escalade' then 'Escalade'
    when 'educator_gymnastique' then 'Gymnastique'
    else null
  end;
$$;

drop policy if exists "students_staff_read" on public.students;
create policy "students_staff_read" on public.students for select to authenticated
using (public.is_teacher_or_admin() or specialty = public.educator_specialty());

drop policy if exists "appreciations_insert" on public.appreciations;
drop policy if exists "appreciations_update" on public.appreciations;
drop policy if exists "appreciations_delete" on public.appreciations;
create policy "appreciations_insert" on public.appreciations for insert to authenticated
with check (
  educator_id = auth.uid()
  and exists (select 1 from public.students s where s.id=student_id and s.specialty=public.educator_specialty())
);
create policy "appreciations_update" on public.appreciations for update to authenticated
using (educator_id=auth.uid()) with check (educator_id=auth.uid());
create policy "appreciations_delete" on public.appreciations for delete to authenticated
using (educator_id=auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email), new.email, 'public')
  on conflict (id) do update set email=excluded.email;
  return new;
end;
$$;
