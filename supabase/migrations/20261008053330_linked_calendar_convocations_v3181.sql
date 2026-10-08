-- Save the document, its pupils and its calendar link in one transaction.
-- Existing RLS and server-verified teacher/admin roles remain authoritative.
create function public.v3181_save_convocation(
  p_convocation jsonb,
  p_student_ids text[] default '{}',
  p_event_id text default null
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_id text := nullif(btrim(p_convocation->>'id'),'');
  v_event_id text := nullif(btrim(p_event_id),'');
  v_status text := coalesce(p_convocation->>'status','published');
  v_conv public.v20_convocations%rowtype;
  v_event public.v20_events%rowtype;
  v_detached text[] := '{}';
  v_students text[] := '{}';
begin
  if not coalesce(public.is_teacher_or_admin(),false) then
    raise exception using errcode='42501',message='CONVOCATION_FORBIDDEN';
  end if;
  if v_id is null or nullif(btrim(p_convocation->>'title'),'') is null
    or nullif(p_convocation->>'date','') is null
    or v_status not in ('draft','published')
    or (v_status='published' and nullif(btrim(p_convocation->>'teacher'),'') is null) then
    raise exception using errcode='22023',message='CONVOCATION_INVALID';
  end if;

  perform c.id from public.v20_convocations c where c.id=v_id for update;
  perform e.id from public.v20_events e
    where e.id=v_event_id or e.convocation_id=v_id order by e.id for update;
  if v_event_id is not null then
    select * into v_event from public.v20_events e where e.id=v_event_id;
    if not found then
      raise exception using errcode='P0001',message='CONVOCATION_EVENT_NOT_FOUND';
    end if;
    if v_event.convocation_id is not null and v_event.convocation_id<>v_id then
      raise exception using errcode='P0001',message='CONVOCATION_EVENT_ALREADY_LINKED';
    end if;
    if not coalesce((p_convocation->>'specialty')=any(
      coalesce(v_event.specialties,'{}') || array[v_event.specialty]),false) then
      raise exception using errcode='22023',message='CONVOCATION_SPECIALTY_MISMATCH';
    end if;
  end if;

  insert into public.v20_convocations as c
    (id,title,activity,age_category,specialty,date,departure,return_time,place,
     meeting_point,teacher,extra_info,status,public_visible,updated_at)
  values
    (v_id,btrim(p_convocation->>'title'),p_convocation->>'activity',
     p_convocation->>'age_category',p_convocation->>'specialty',
     (p_convocation->>'date')::date,nullif(p_convocation->>'departure','')::time,
     nullif(p_convocation->>'return_time','')::time,p_convocation->>'place',
     p_convocation->>'meeting_point',p_convocation->>'teacher',
     p_convocation->>'extra_info',v_status,v_status='published',now())
  on conflict (id) do update set
    title=excluded.title,activity=excluded.activity,age_category=excluded.age_category,
    specialty=excluded.specialty,date=excluded.date,departure=excluded.departure,
    return_time=excluded.return_time,place=excluded.place,meeting_point=excluded.meeting_point,
    teacher=excluded.teacher,extra_info=excluded.extra_info,status=excluded.status,
    public_visible=excluded.public_visible,updated_at=excluded.updated_at
  returning c.* into v_conv;

  delete from public.v20_convocation_students l where l.convocation_id=v_id;
  insert into public.v20_convocation_students(convocation_id,student_id)
    select v_id,s.id from (select distinct unnest(coalesce(p_student_ids,'{}')) as id) s;
  select coalesce(array_agg(l.student_id order by l.student_id),'{}') into v_students
    from public.v20_convocation_students l where l.convocation_id=v_id;

  with detached as (
    update public.v20_events e set convocation_id=null,updated_at=now()
    where e.convocation_id=v_id and e.id is distinct from v_event_id returning e.id
  ) select coalesce(array_agg(id),'{}') into v_detached from detached;

  if v_event_id is not null then
    update public.v20_events e set
      convocation_id=v_id,registration_mode='convocation',registration_open=false,
      title=case when v_status='published' then v_conv.title else e.title end,
      date=case when v_status='published' then v_conv.date else e.date end,
      age_category=case when v_status='published' then v_conv.age_category else e.age_category end,
      place=case when v_status='published' then v_conv.place else e.place end,
      start_time=case when v_status='published' then v_conv.departure else e.start_time end,
      end_time=case when v_status='published' then v_conv.return_time else e.end_time end,
      updated_at=now()
    where e.id=v_event_id returning e.* into v_event;
  end if;
  return jsonb_build_object('convocation',to_jsonb(v_conv)||jsonb_build_object('student_ids',v_students),
    'event',case when v_event_id is not null then to_jsonb(v_event) else 'null'::jsonb end,
    'detached_event_ids',v_detached);
end;
$$;

revoke all on function public.v3181_save_convocation(jsonb,text[],text) from public,anon;
grant execute on function public.v3181_save_convocation(jsonb,text[],text) to authenticated;
