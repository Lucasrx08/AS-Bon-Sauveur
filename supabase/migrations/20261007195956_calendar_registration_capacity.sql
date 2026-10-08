-- Optional quotas, public aggregate counts and explicit calendar participation.
-- Existing registrations and role policies remain in place.
alter table public.v20_events
  add column registration_mode text not null default 'none',
  add column registration_capacity integer,
  add column registration_count integer not null default 0;

update public.v20_events e set
  registration_mode = case when e.convocation_id is not null then 'convocation'
    when e.registration_open then 'open' else 'none' end,
  registration_open = e.registration_open and e.convocation_id is null,
  registration_count = (select count(*) from public.v20_event_registrations r where r.event_id=e.id);

alter table public.v20_events
  add constraint v318_events_mode_check check (registration_mode in ('none','open','convocation')),
  add constraint v318_events_capacity_check check (registration_capacity is null or registration_capacity between 1 and 10000),
  add constraint v318_events_count_check check (registration_count >= 0);

create function public.v318_normalize_event_registration()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  -- A cached older client may still send registration_open alone.
  if tg_op='INSERT' then
    if new.registration_mode='none' and new.registration_open then new.registration_mode:='open'; end if;
  elsif new.registration_mode is not distinct from old.registration_mode
    and new.registration_open is distinct from old.registration_open then
    new.registration_mode:=case when new.registration_open then 'open' else 'none' end;
  end if;
  if new.convocation_id is not null then new.registration_mode:='convocation'; end if;
  new.registration_open:=(new.registration_mode='open');
  -- The client cannot overwrite the aggregate with a stale or arbitrary value.
  select count(*)::integer into new.registration_count from public.v20_event_registrations r where r.event_id=new.id;
  if new.registration_capacity is not null and new.registration_capacity<new.registration_count then
    raise exception using errcode='P0001',message='CAPACITY_BELOW_REGISTERED';
  end if;
  return new;
end;
$$;

create function public.v318_guard_event_capacity()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  event_row public.v20_events%rowtype;
  used_places integer;
begin
  if tg_op='UPDATE' and new.event_id is not distinct from old.event_id then return new; end if;
  -- Lock affected events in ID order, including moves and deletions.
  if tg_op='INSERT' then
    perform e.id from public.v20_events e where e.id=new.event_id for update;
  elsif tg_op='DELETE' then
    perform e.id from public.v20_events e where e.id=old.event_id for update;
    return old;
  else
    perform e.id from public.v20_events e where e.id in (old.event_id,new.event_id) order by e.id for update;
  end if;
  select * into event_row from public.v20_events e where e.id=new.event_id;
  if not found then raise exception using errcode='P0001',message='EVENT_CLOSED'; end if;
  -- Leave duplicate/idempotency handling to the existing unique constraints.
  if tg_op='INSERT' and exists(select 1 from public.v20_event_registrations r where
    (new.request_id is not null and r.request_id=new.request_id) or
    (r.event_id=new.event_id and lower(btrim(r.last_name))=lower(btrim(new.last_name)) and lower(btrim(r.first_name))=lower(btrim(new.first_name)) and lower(btrim(r.class_name))=lower(btrim(new.class_name)))) then return new; end if;
  if not event_row.public_visible or not event_row.registration_open or event_row.registration_mode<>'open'
    or event_row.date<(now() at time zone 'Europe/Paris')::date or event_row.convocation_id is not null
    or exists(select 1 from public.v20_convocations c where c.public_visible and c.status='published'
      and c.date=event_row.date and c.title=event_row.title
      and c.specialty=any(coalesce(event_row.specialties,array[event_row.specialty]))) then
    raise exception using errcode='P0001',message='EVENT_CLOSED';
  end if;
  select count(*)::integer into used_places from public.v20_event_registrations r where r.event_id=new.event_id;
  if event_row.registration_capacity is not null and used_places>=event_row.registration_capacity then
    raise exception using errcode='P0001',message='EVENT_FULL';
  end if;
  return new;
end;
$$;

create function public.v318_sync_registration_count()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op='INSERT' then
    update public.v20_events e set registration_count=(select count(*) from public.v20_event_registrations r where r.event_id=e.id) where e.id=new.event_id;
  elsif tg_op='DELETE' then
    update public.v20_events e set registration_count=(select count(*) from public.v20_event_registrations r where r.event_id=e.id) where e.id=old.event_id;
  elsif new.event_id is distinct from old.event_id then
    update public.v20_events e set registration_count=(select count(*) from public.v20_event_registrations r where r.event_id=e.id) where e.id in (old.event_id,new.event_id);
  end if;
  return null;
end;
$$;

revoke all on function public.v318_normalize_event_registration(),public.v318_guard_event_capacity(),public.v318_sync_registration_count() from public,anon;
grant execute on function public.v318_normalize_event_registration(),public.v318_guard_event_capacity(),public.v318_sync_registration_count() to authenticated,service_role;

create trigger v318_normalize_event_registration before insert or update on public.v20_events
for each row execute function public.v318_normalize_event_registration();
create trigger v318_guard_event_capacity before insert or delete or update of event_id on public.v20_event_registrations
for each row execute function public.v318_guard_event_capacity();
create trigger v318_sync_registration_count after insert or delete or update of event_id on public.v20_event_registrations
for each row execute function public.v318_sync_registration_count();
