begin;
set local lock_timeout = '8s';
set local statement_timeout = '120s';

update auth.users u
set raw_app_meta_data = coalesce(u.raw_app_meta_data,'{}'::jsonb) || jsonb_build_object('role',p.role::text)
from public.profiles p
where p.id=u.id
  and coalesce(u.raw_app_meta_data->>'role','') is distinct from p.role::text;

create or replace function public.current_role()
returns public.app_role
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(nullif(auth.jwt()->'app_metadata'->>'role','')::public.app_role,'public'::public.app_role);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select public.current_role()='admin'::public.app_role; $$;

create or replace function public.is_teacher_or_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select public.current_role() in ('teacher_as'::public.app_role,'admin'::public.app_role); $$;

create or replace function public.educator_specialty()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
 select case public.current_role()
  when 'educator_football'::public.app_role then 'Football'
  when 'educator_escalade'::public.app_role then 'Escalade'
  when 'educator_gymnastique'::public.app_role then 'Gymnastique'
  else null end;
$$;

create or replace function public.v20_specialty_for_role()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
 select case public.current_role()
  when 'educator_football'::public.app_role then 'Section Football'
  when 'educator_escalade'::public.app_role then 'Option Escalade'
  when 'educator_gymnastique'::public.app_role then 'Sport-études Gymnastique'
  else null end;
$$;

alter table public.v20_orders
 add column if not exists request_id uuid,
 add column if not exists reference text,
 add column if not exists payment_verified_at timestamptz,
 add column if not exists payment_verified_by uuid,
 add column if not exists retention_due_at timestamptz,
 add column if not exists anonymized_at timestamptz;

create or replace function public.v22_new_order_reference()
returns text
language sql
volatile
security invoker
set search_path = ''
as $$
 select 'AS-' || to_char(clock_timestamp(),'YYYY') || '-' || upper(substr(replace(pg_catalog.gen_random_uuid()::text,'-',''),1,8));
$$;

update public.v20_orders
set reference=public.v22_new_order_reference()
where reference is null or btrim(reference)='';

update public.v20_orders
set retention_due_at=coalesce(retention_due_at,created_at + interval '24 months'),
    payment_verified_at=case when paid then coalesce(payment_verified_at,updated_at,created_at) else null end
where retention_due_at is null or (paid and payment_verified_at is null);

alter table public.v20_orders
 alter column reference set default public.v22_new_order_reference(),
 alter column reference set not null;

create unique index if not exists v20_orders_reference_uidx on public.v20_orders(reference);
create unique index if not exists v20_orders_request_uidx on public.v20_orders(request_id) where request_id is not null;

alter table public.v20_event_registrations
 add column if not exists request_id uuid,
 add column if not exists retention_due_at timestamptz;

update public.v20_event_registrations r
set retention_due_at=coalesce(r.retention_due_at,(e.date::timestamptz + interval '90 days'))
from public.v20_events e
where e.id=r.event_id and r.retention_due_at is null;

create unique index if not exists v20_event_registrations_request_uidx
 on public.v20_event_registrations(request_id) where request_id is not null;
create unique index if not exists v20_event_registrations_identity_uidx
 on public.v20_event_registrations(event_id,lower(btrim(last_name)),lower(btrim(first_name)),class_name);

create unique index if not exists v20_appreciations_one_author_uidx
 on public.v20_appreciations(student_id,term,educator_id) where educator_id is not null;

do $$
begin
 if not exists(select 1 from pg_constraint where conname='v20_orders_id_safe_chk' and conrelid='public.v20_orders'::regclass) then
  alter table public.v20_orders add constraint v20_orders_id_safe_chk check(id ~ '^[A-Za-z0-9_-]{1,80}$') not valid;
 end if;
 if not exists(select 1 from pg_constraint where conname='v20_orders_quantity_chk' and conrelid='public.v20_orders'::regclass) then
  alter table public.v20_orders add constraint v20_orders_quantity_chk check(quantity between 1 and 10) not valid;
 end if;
 if not exists(select 1 from pg_constraint where conname='v20_orders_identity_chk' and conrelid='public.v20_orders'::regclass) then
  alter table public.v20_orders add constraint v20_orders_identity_chk check(char_length(btrim(student_name)) between 2 and 120 and char_length(class_name) between 1 and 80) not valid;
 end if;
 if not exists(select 1 from pg_constraint where conname='v20_registrations_id_safe_chk' and conrelid='public.v20_event_registrations'::regclass) then
  alter table public.v20_event_registrations add constraint v20_registrations_id_safe_chk check(id ~ '^[A-Za-z0-9_-]{1,80}$') not valid;
 end if;
 if not exists(select 1 from pg_constraint where conname='v20_registrations_identity_chk' and conrelid='public.v20_event_registrations'::regclass) then
  alter table public.v20_event_registrations add constraint v20_registrations_identity_chk check(char_length(btrim(last_name)) between 2 and 80 and char_length(btrim(first_name)) between 2 and 80 and char_length(class_name) between 1 and 80) not valid;
 end if;
end $$;

alter table public.v20_orders validate constraint v20_orders_id_safe_chk;
alter table public.v20_orders validate constraint v20_orders_quantity_chk;
alter table public.v20_orders validate constraint v20_orders_identity_chk;
alter table public.v20_event_registrations validate constraint v20_registrations_id_safe_chk;
alter table public.v20_event_registrations validate constraint v20_registrations_identity_chk;

create or replace function public.v22_guard_order()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
 if tg_op='INSERT' then
  new.retention_due_at:=coalesce(new.retention_due_at,new.created_at + interval '24 months');
  if auth.uid() is null then
   new.paid:=false;new.distributed:=false;new.payment_verified_at:=null;new.payment_verified_by:=null;
  elsif new.paid then
   new.payment_verified_at:=clock_timestamp();new.payment_verified_by:=auth.uid();
  end if;
 else
  new.reference:=old.reference;new.request_id:=old.request_id;new.created_at:=old.created_at;
  new.retention_due_at:=old.retention_due_at;
  if new.paid is distinct from old.paid then
   if new.paid then new.payment_verified_at:=clock_timestamp();new.payment_verified_by:=auth.uid();
   else new.payment_verified_at:=null;new.payment_verified_by:=null;end if;
  elsif old.paid then
   new.payment_verified_at:=old.payment_verified_at;new.payment_verified_by:=old.payment_verified_by;
  else
   new.payment_verified_at:=null;new.payment_verified_by:=null;
  end if;
 end if;
 return new;
end;
$$;

drop trigger if exists v22_guard_order_trigger on public.v20_orders;
create trigger v22_guard_order_trigger
before insert or update on public.v20_orders
for each row execute function public.v22_guard_order();

create table if not exists public.v22_rate_limits(
 bucket text not null,
 key_hash text not null,
 window_started_at timestamptz not null default now(),
 attempts integer not null default 0,
 blocked_until timestamptz,
 updated_at timestamptz not null default now(),
 primary key(bucket,key_hash)
);
alter table public.v22_rate_limits enable row level security;

create table if not exists public.v22_audit_log(
 id bigint generated always as identity primary key,
 actor_id uuid,
 actor_role text not null default 'unknown',
 action text not null,
 table_name text not null,
 row_id text,
 created_at timestamptz not null default now()
);
alter table public.v22_audit_log enable row level security;
create index if not exists v22_audit_created_idx on public.v22_audit_log(created_at desc);

create or replace function public.v22_consume_rate_limit(
 p_bucket text,p_key_hash text,p_limit integer,p_window_seconds integer,p_block_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
 item public.v22_rate_limits%rowtype;
 now_at timestamptz:=clock_timestamp();
 retry integer:=0;
begin
 if auth.role() <> 'service_role' then raise insufficient_privilege; end if;
 if p_limit<1 or p_limit>1000 or p_window_seconds<1 or p_block_seconds<1 then raise exception 'invalid rate parameters';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_bucket || ':' || p_key_hash,0));
 select * into item from public.v22_rate_limits where bucket=p_bucket and key_hash=p_key_hash for update;
 if not found then
  insert into public.v22_rate_limits(bucket,key_hash,attempts,window_started_at,updated_at) values(p_bucket,p_key_hash,1,now_at,now_at);
  return jsonb_build_object('allowed',true,'retry_after',0);
 end if;
 if item.blocked_until is not null and item.blocked_until>now_at then
  retry:=greatest(1,ceil(extract(epoch from item.blocked_until-now_at))::integer);
  return jsonb_build_object('allowed',false,'retry_after',retry);
 end if;
 if item.window_started_at<=now_at-make_interval(secs=>p_window_seconds) then
  update public.v22_rate_limits set attempts=1,window_started_at=now_at,blocked_until=null,updated_at=now_at where bucket=p_bucket and key_hash=p_key_hash;
  return jsonb_build_object('allowed',true,'retry_after',0);
 end if;
 if item.attempts+1>p_limit then
  update public.v22_rate_limits set attempts=item.attempts+1,blocked_until=now_at+make_interval(secs=>p_block_seconds),updated_at=now_at where bucket=p_bucket and key_hash=p_key_hash;
  return jsonb_build_object('allowed',false,'retry_after',p_block_seconds);
 end if;
 update public.v22_rate_limits set attempts=item.attempts+1,updated_at=now_at where bucket=p_bucket and key_hash=p_key_hash;
 return jsonb_build_object('allowed',true,'retry_after',0);
end;
$$;

create or replace function public.v22_revoke_user_sessions(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
 if auth.role()<>'service_role' then raise insufficient_privilege;end if;
 delete from auth.sessions where user_id=p_user_id;
end;
$$;

create or replace function public.v22_audit_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare payload jsonb;
begin
 if tg_op='DELETE' then payload:=to_jsonb(old); else payload:=to_jsonb(new); end if;
 insert into public.v22_audit_log(actor_id,actor_role,action,table_name,row_id)
 values(auth.uid(),coalesce(auth.jwt()->'app_metadata'->>'role',auth.role(),'unknown'),tg_op,tg_table_name,
        coalesce(payload->>'id',payload->>'specialty',payload->>'term'));
 if tg_op='DELETE' then return old; else return new; end if;
end;
$$;

do $$
declare table_item text;
begin
 foreach table_item in array array['v20_events','v20_documents','v20_products','v20_students','v20_licenses','v20_appreciations','v20_convocations','v20_convocation_students','v20_reports','v20_orders','v20_event_registrations','v20_specialty_notes','v20_term_settings','profiles','pin_accounts']
 loop
  execute format('drop trigger if exists v22_audit_change_trigger on public.%I',table_item);
  execute format('create trigger v22_audit_change_trigger after insert or update or delete on public.%I for each row execute function public.v22_audit_change()',table_item);
 end loop;
end $$;

create or replace function public.v22_run_retention()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare regs integer:=0;orders integer:=0;apps integer:=0;reports integer:=0;links integer:=0;rates integer:=0;audits integer:=0;
begin
 if auth.role()<>'service_role' and session_user not in ('postgres','supabase_admin') then raise insufficient_privilege;end if;
 delete from public.v20_event_registrations where retention_due_at<clock_timestamp();get diagnostics regs=row_count;
 update public.v20_orders set student_name='ANONYMISÉ',class_name='—',color=null,request_id=null,payment_verified_by=null,anonymized_at=clock_timestamp()
  where retention_due_at<clock_timestamp() and anonymized_at is null;get diagnostics orders=row_count;
 delete from public.v20_appreciations where updated_at<clock_timestamp()-interval '24 months';get diagnostics apps=row_count;
 delete from public.v20_reports where updated_at<clock_timestamp()-interval '24 months';get diagnostics reports=row_count;
 delete from public.v20_convocation_students l using public.v20_convocations c where c.id=l.convocation_id and c.date<current_date-interval '24 months';get diagnostics links=row_count;
 delete from public.v22_rate_limits where updated_at<clock_timestamp()-interval '48 hours';get diagnostics rates=row_count;
 delete from public.v22_audit_log where created_at<clock_timestamp()-interval '12 months';get diagnostics audits=row_count;
 return jsonb_build_object('registrations',regs,'orders_anonymized',orders,'appreciations',apps,'reports',reports,'convocation_links',links,'rate_limits',rates,'audit_rows',audits);
end;
$$;

do $$
declare policy_item record;
begin
 for policy_item in
  select tablename,policyname from pg_policies
  where schemaname='public' and tablename=any(array['profiles','pin_accounts','pin_login_attempts','v20_events','v20_documents','v20_products','v20_students','v20_licenses','v20_appreciations','v20_convocations','v20_convocation_students','v20_reports','v20_orders','v20_event_registrations','v20_specialty_notes','v20_term_settings','v22_rate_limits','v22_audit_log'])
 loop
  execute format('drop policy if exists %I on public.%I',policy_item.policyname,policy_item.tablename);
 end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.pin_accounts enable row level security;
alter table public.pin_login_attempts enable row level security;
alter table public.v20_events enable row level security;
alter table public.v20_documents enable row level security;
alter table public.v20_products enable row level security;
alter table public.v20_students enable row level security;
alter table public.v20_licenses enable row level security;
alter table public.v20_appreciations enable row level security;
alter table public.v20_convocations enable row level security;
alter table public.v20_convocation_students enable row level security;
alter table public.v20_reports enable row level security;
alter table public.v20_orders enable row level security;
alter table public.v20_event_registrations enable row level security;
alter table public.v20_specialty_notes enable row level security;
alter table public.v20_term_settings enable row level security;

create policy profiles_self_select on public.profiles for select to authenticated using(id=auth.uid());

create policy v22_events_select on public.v20_events for select to anon,authenticated
 using(public_visible or public.is_teacher_or_admin() or specialty=public.v20_specialty_for_role());
create policy v22_events_manage on public.v20_events for all to authenticated
 using(public.is_teacher_or_admin()) with check(public.is_teacher_or_admin());

create policy v22_documents_select on public.v20_documents for select to anon,authenticated
 using(public_visible or public.is_teacher_or_admin() or specialty=public.v20_specialty_for_role());
create policy v22_documents_manage on public.v20_documents for all to authenticated
 using(public.is_teacher_or_admin()) with check(public.is_teacher_or_admin());

create policy v22_products_select on public.v20_products for select to anon,authenticated
 using(active or public.is_teacher_or_admin());
create policy v22_products_manage on public.v20_products for all to authenticated
 using(public.is_teacher_or_admin()) with check(public.is_teacher_or_admin());

create policy v22_students_select on public.v20_students for select to authenticated
 using(public.is_teacher_or_admin() or specialty=public.v20_specialty_for_role());
create policy v22_students_manage on public.v20_students for all to authenticated
 using(public.is_teacher_or_admin()) with check(public.is_teacher_or_admin());

create policy v22_licenses_select on public.v20_licenses for select to authenticated
 using(public.is_teacher_or_admin() or section_option=public.v20_specialty_for_role());
create policy v22_licenses_manage on public.v20_licenses for all to authenticated
 using(public.is_teacher_or_admin()) with check(public.is_teacher_or_admin());

create policy v22_appreciations_select on public.v20_appreciations for select to authenticated
 using(public.is_teacher_or_admin() or (educator_id=auth.uid() and exists(select 1 from public.v20_students s where s.id=student_id and s.specialty=public.v20_specialty_for_role())));
create policy v22_appreciations_insert on public.v20_appreciations for insert to authenticated
 with check(public.is_teacher_or_admin() or (educator_id=auth.uid() and exists(select 1 from public.v20_students s where s.id=student_id and s.specialty=public.v20_specialty_for_role())));
create policy v22_appreciations_update on public.v20_appreciations for update to authenticated
 using(public.is_teacher_or_admin() or educator_id=auth.uid())
 with check(public.is_teacher_or_admin() or (educator_id=auth.uid() and exists(select 1 from public.v20_students s where s.id=student_id and s.specialty=public.v20_specialty_for_role())));
create policy v22_appreciations_delete on public.v20_appreciations for delete to authenticated
 using(public.is_teacher_or_admin() or educator_id=auth.uid());

create policy v22_convocations_select on public.v20_convocations for select to anon,authenticated
 using((public_visible and status='published') or public.is_teacher_or_admin() or specialty=public.v20_specialty_for_role());
create policy v22_convocations_manage on public.v20_convocations for all to authenticated
 using(public.is_teacher_or_admin()) with check(public.is_teacher_or_admin());

create policy v22_convocation_links_select on public.v20_convocation_students for select to authenticated
 using(public.is_teacher_or_admin() or exists(select 1 from public.v20_convocations c where c.id=convocation_id and c.specialty=public.v20_specialty_for_role()));
create policy v22_convocation_links_manage on public.v20_convocation_students for all to authenticated
 using(public.is_teacher_or_admin()) with check(public.is_teacher_or_admin());

create policy v22_reports_manage on public.v20_reports for all to authenticated
 using(public.is_teacher_or_admin()) with check(public.is_teacher_or_admin());
create policy v22_orders_manage on public.v20_orders for all to authenticated
 using(public.is_teacher_or_admin()) with check(public.is_teacher_or_admin());
create policy v22_registrations_select on public.v20_event_registrations for select to authenticated
 using(public.is_teacher_or_admin());
create policy v22_registrations_delete on public.v20_event_registrations for delete to authenticated
 using(public.is_teacher_or_admin());

create policy v22_notes_select on public.v20_specialty_notes for select to anon,authenticated
 using((public_visible and active and (expires_at is null or expires_at>=current_date)) or public.is_teacher_or_admin() or specialty=public.v20_specialty_for_role());
create policy v22_notes_manage on public.v20_specialty_notes for all to authenticated
 using(public.is_teacher_or_admin() or specialty=public.v20_specialty_for_role())
 with check(public.is_teacher_or_admin() or specialty=public.v20_specialty_for_role());

create policy v22_terms_select on public.v20_term_settings for select to authenticated using(true);
create policy v22_terms_manage on public.v20_term_settings for all to authenticated
 using(public.is_admin()) with check(public.is_admin());

revoke all on all tables in schema public from anon,authenticated;
revoke all on all sequences in schema public from anon,authenticated;
revoke all on all functions in schema public from public,anon,authenticated;

grant execute on function public.current_role() to anon,authenticated;
grant execute on function public.is_admin() to anon,authenticated;
grant execute on function public.is_teacher_or_admin() to anon,authenticated;
grant execute on function public.educator_specialty() to anon,authenticated;
grant execute on function public.v20_specialty_for_role() to anon,authenticated;
grant execute on function public.v22_new_order_reference() to authenticated;

grant select on public.v20_events,public.v20_documents,public.v20_products,public.v20_convocations,public.v20_specialty_notes to anon;
grant select on public.profiles to authenticated;
grant select,insert,update,delete on public.v20_events,public.v20_documents,public.v20_products,public.v20_students,public.v20_licenses,public.v20_appreciations,public.v20_convocations,public.v20_convocation_students,public.v20_reports,public.v20_orders,public.v20_specialty_notes,public.v20_term_settings to authenticated;
grant select,delete on public.v20_event_registrations to authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on function public.v22_consume_rate_limit(text,text,integer,integer,integer) to service_role;
grant execute on function public.v22_revoke_user_sessions(uuid) to service_role;
grant execute on function public.v22_run_retention() to service_role;
grant execute on function public.v22_new_order_reference() to service_role;

alter default privileges for role postgres in schema public revoke select,insert,update,delete,truncate,references,trigger on tables from anon,authenticated;
alter default privileges for role postgres in schema public revoke usage,select,update on sequences from anon,authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public,anon,authenticated;

commit;
