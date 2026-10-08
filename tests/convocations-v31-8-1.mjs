import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {PGlite} from '@electric-sql/pglite';

const source=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const fixture={id:'event-fixture',title:'Rencontre de football',date:'2099-01-14',ageCategory:'Benjamin',specialty:'Association Sportive',specialties:['Association Sportive','Section Football'],place:'Terrain fictif',startTime:'12:00:00',endTime:'17:30:00',registrationMode:'convocation',registrationOpen:false};
// Exercise the actual bridge entry point with a fake RPC transport.
{
 const bridge=source('v20-bridge.js');const body=bridge.slice(bridge.indexOf('async function persistConvocation('),bridge.indexOf('window.__BS_PERSIST_CONVOCATION='));
 const camel=row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase()),v]));
 const clean=row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k.replace(/[A-Z]/g,c=>'_'+c.toLowerCase()),v]));
 let captured,reply={data:{convocation:{id:'bridge-fixture',student_ids:['s1']},event:{id:fixture.id,convocation_id:'bridge-fixture'},detached_event_ids:[]},error:null};
 const persist=new Function('sb','cleanRow','camel',body+';return persistConvocation;')({rpc:async(name,args)=>{captured={name,args};return reply}},clean,camel);
 const saved=await persist({id:'bridge-fixture',studentIds:['s1','s1'],status:'draft'},fixture.id);
 assert.equal(captured.name,'v3181_save_convocation');assert.equal(captured.args.p_event_id,fixture.id);assert.deepEqual(captured.args.p_student_ids,['s1']);assert.equal(captured.args.p_convocation.student_ids,undefined);assert.deepEqual(saved.convocation.studentIds,['s1']);assert.equal(saved.event.convocationId,'bridge-fixture');
 reply={data:null,error:new Error('refus serveur fictif')};await assert.rejects(persist({id:'bridge-fixture'},fixture.id),/refus serveur/);
 reply={data:{convocation:{id:'bridge-fixture'},event:null},error:null};await assert.rejects(persist({id:'bridge-fixture'},fixture.id),/EVENT_UNCONFIRMED/);
}
function setup(role='admin'){
 const dom=new JSDOM('<div id="app"></div>',{url:'https://example.test/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.localStorage.setItem('bs-demo-role-v4',role);w.sessionStorage.setItem('bs-v20-verified-role',role);
 w.scrollTo=()=>{};w.alert=()=>{};w.confirm=()=>true;w.__BS_SAVED=()=>{};w.eval(source('v19-app.js'));
 const app=w.app,data=app.readData();data.events=[structuredClone(fixture),{...fixture,id:'open-fixture',title:'Inscription libre',registrationMode:'open',registrationOpen:true}];
 data.licenses=[{id:'l1',studentId:'s1',fullName:'ÉLÈVE FICTIF',className:'6e AVIGNON',category:'Benjamin',sectionOption:'Section Football'}];
 return {dom,w,app,data};
}

// Calendar source, document identity, retry identity and access restrictions.
{
 const {dom,w,app,data}=setup();let calls=0,payload,eventId,fail=false;
 w.__BS_PERSIST_CONVOCATION=async (row,id)=>{
  calls++;payload=structuredClone(row);eventId=id;
  if(fail)throw new Error('Connexion fictive interrompue');
  return {convocation:{...row},event:{...fixture,convocationId:row.id,...(row.status==='published'?{title:row.title,date:row.date,startTime:row.departure,endTime:row.returnTime,place:row.place}:{} )},detachedEventIds:[]};
 };
 app.go('convocations');assert.equal(w.document.querySelectorAll('[data-convocation-event]').length,1);
 app.editConv();let form=w.document.querySelector('#v19-conv-form');
 assert.equal(form.elements.calendarEvent.options.length,2,'Seuls les événements de convocation sont proposés.');
 form.elements.calendarEvent.value=fixture.id;form.elements.calendarEvent.dispatchEvent(new w.Event('change'));
 form=w.document.querySelector('#v19-conv-form');assert.equal(form.elements.title.value,fixture.title);assert.equal(form.elements.departure.value,'12:00');assert.equal(form.elements.returnTime.value,'17:30');assert.equal(form.elements.date.value,fixture.date);assert.equal(form.elements.place.value,fixture.place);
 form.elements.title.value='Titre du brouillon';form.querySelector('[name="studentIds"]').checked=true;
 await form.onsubmit({preventDefault(){},submitter:form.querySelector('[value="draft"]')});
 assert.equal(eventId,fixture.id);assert.equal(payload.status,'draft');assert.equal(data.events[0].title,fixture.title);
 const id=payload.id;assert.equal(data.convocations.length,1);assert.equal(w.document.querySelectorAll('[data-convocation-event]').length,0);assert.match(w.document.querySelector('.v19-conv-card').textContent,/BROUILLON/);
 app.prepareConvocation(fixture.id);form=w.document.querySelector('#v19-conv-form');assert.equal(form.elements.title.value,'Titre du brouillon');assert.equal(form.elements.calendarEvent.disabled,true);assert.equal(form.querySelector('[name="studentIds"]').checked,true);
 form.elements.title.value='Rencontre déplacée';form.elements.date.value='2099-02-04';form.elements.departure.value='11:45';form.elements.returnTime.value='18:00';form.elements.teacher.value='Lucas RIGAUX';
 await form.onsubmit({preventDefault(){},submitter:form.querySelector('[value="published"]')});
 assert.equal(payload.id,id);assert.equal(data.convocations.length,1);assert.equal(data.events[0].id,fixture.id);assert.equal(data.events[0].title,'Rencontre déplacée');assert.equal(data.events[0].date,'2099-02-04');assert.equal(data.events[0].startTime,'11:45');assert.deepEqual(Array.from(data.events[0].specialties),fixture.specialties);
 app.editConv(id);form=w.document.querySelector('#v19-conv-form');assert.equal(form.elements.calendarEvent.value,fixture.id);assert.equal(form.elements.departure.value,'11:45');assert.equal(form.querySelector('[value="draft"]'),null);
 app.closeModal();
 // An interrupted new save can be retried without generating a second document ID.
 data.events.push({...fixture,id:'retry-fixture',title:'Rencontre distincte'});app.prepareConvocation('retry-fixture');form=w.document.querySelector('#v19-conv-form');form.elements.teacher.value='Lucas RIGAUX';fail=true;
 await form.onsubmit({preventDefault(){}});const failedId=payload.id;assert.equal(data.convocations.length,1);assert.ok(form.isConnected);fail=false;
 await form.onsubmit({preventDefault(){}});assert.equal(payload.id,failedId);assert.equal(data.convocations.length,2);assert.equal(calls,4);
 dom.window.close();
}
{
 const {dom,w,app,data}=setup('public');data.licenses=[];
 data.convocations=[{id:'draft',title:fixture.title,date:fixture.date,specialty:fixture.specialty,status:'draft',publicVisible:false},{id:'unrelated',title:fixture.title,date:fixture.date,specialty:fixture.specialty,status:'published',publicVisible:true}];data.events[0].convocationId='draft';
 app.openEventConvocation(fixture.id);assert.equal(w.document.querySelector('#v19-modal'),null);assert.match(w.document.querySelector('.v19-toast').textContent,/pas encore publiée/);
 app.go('convocations');assert.equal(w.document.querySelectorAll('[data-convocation-event]').length,0);assert.equal(w.document.querySelectorAll('.v19-conv-card').length,1);app.prepareConvocation(fixture.id);assert.equal(w.document.querySelector('#v19-conv-form'),null);
 Object.assign(data.convocations[0],{title:'Convocation modifiée',date:'2099-02-04',status:'published',publicVisible:true});app.openEventConvocation(fixture.id);assert.match(w.document.querySelector('#v19-modal').textContent,/Convocation modifiée/);
 dom.window.close();
}
{
 const {dom,w,app}=setup('educator_football');app.prepareConvocation(fixture.id);assert.equal(w.document.querySelector('#v19-conv-form'),null);dom.window.close();
}

// PostgreSQL transactions and RLS in a disposable engine; no production writes.
const db=new PGlite();
try{
 await db.exec(`
  create role anon;create role authenticated;create role service_role bypassrls;
  create role teacher_tester;create role educator_tester;grant authenticated to teacher_tester,educator_tester;
  create function public.is_teacher_or_admin() returns boolean language sql stable as $$select current_user='teacher_tester'$$;
  create table public.v20_students(id text primary key);
  create table public.v20_events(id text primary key,title text,age_category text,specialty text,specialties text[],date date,start_time time,end_time time,place text,convocation_id text,public_visible boolean default true,registration_open boolean default false,updated_at timestamptz default now());
  create table public.v20_convocations(id text primary key,title text,activity text,age_category text,specialty text,date date,departure time,return_time time,place text,meeting_point text,teacher text,extra_info text,status text default 'published',public_visible boolean default true,updated_at timestamptz default now());
  create table public.v20_convocation_students(convocation_id text references public.v20_convocations(id) on delete cascade,student_id text references public.v20_students(id),primary key(convocation_id,student_id));
  create table public.v20_event_registrations(id text primary key,event_id text references public.v20_events(id) on delete cascade,last_name text,first_name text,class_name text,request_id uuid unique);
  grant usage on schema public to authenticated,anon;
  grant select,insert,update,delete on public.v20_students,public.v20_events,public.v20_convocations,public.v20_convocation_students,public.v20_event_registrations to authenticated;
  grant select on public.v20_events,public.v20_convocations to anon;
  alter table public.v20_events enable row level security;alter table public.v20_convocations enable row level security;alter table public.v20_convocation_students enable row level security;
  create policy events_read on public.v20_events for select using(public_visible or public.is_teacher_or_admin());
  create policy events_write on public.v20_events for all to authenticated using(public.is_teacher_or_admin()) with check(public.is_teacher_or_admin());
  create policy conv_read on public.v20_convocations for select using((public_visible and status='published') or public.is_teacher_or_admin());
  create policy conv_write on public.v20_convocations for all to authenticated using(public.is_teacher_or_admin()) with check(public.is_teacher_or_admin());
  create policy links_staff on public.v20_convocation_students for all to authenticated using(public.is_teacher_or_admin()) with check(public.is_teacher_or_admin());
  insert into public.v20_students values('s1'),('s2');
 `);
 await db.exec(source('supabase/migrations/20261007195956_calendar_registration_capacity.sql'));
 await db.exec(source('supabase/migrations/20261008053330_linked_calendar_convocations_v3181.sql'));
 await db.exec(`insert into public.v20_events(id,title,age_category,specialty,specialties,date,start_time,end_time,place,registration_mode) values('event-fixture','Rencontre de football','Benjamin','Association Sportive',array['Association Sportive','Section Football'],'2099-01-14','12:00','17:30','Terrain fictif','convocation');set role teacher_tester;`);
 const row={id:'conv-fixture',title:'Titre du brouillon',activity:'Football',age_category:'Benjamin',specialty:'Section Football',date:'2099-01-14',departure:'11:45',return_time:'18:00',place:'Nouveau terrain',meeting_point:'Cour fictive',teacher:'',extra_info:'Tenue de sport',status:'draft'};
 const save=async (conv=row,students=['s1','s2','s1'],eventId='event-fixture')=>(await db.query('select public.v3181_save_convocation($1::jsonb,$2::text[],$3::text) as result',[JSON.stringify(conv),students,eventId])).rows[0].result;
 const draft=await save();assert.equal(draft.convocation.public_visible,false);assert.equal(draft.event.title,'Rencontre de football');assert.equal(draft.event.start_time,'12:00:00');assert.equal(draft.event.convocation_id,row.id);assert.deepEqual(draft.convocation.student_ids,['s1','s2']);
 await db.exec('set role anon;');assert.equal((await db.query('select count(*)::int n from public.v20_convocations')).rows[0].n,0);await assert.rejects(save(),/permission denied/);
 await db.exec('set role educator_tester;');await assert.rejects(save(),/CONVOCATION_FORBIDDEN/);
 await db.exec('set role teacher_tester;');await assert.rejects(save({...row,status:'published'}),/CONVOCATION_INVALID/);
 const published={...row,title:'Rencontre déplacée',date:'2099-02-04',teacher:'ENSEIGNANT FICTIF',status:'published'};
 await assert.rejects(save(published,['missing-student']),error=>error.code==='23503');
 assert.equal((await db.query('select status from public.v20_convocations where id=$1',[row.id])).rows[0].status,'draft');assert.equal((await db.query('select count(*)::int n from public.v20_convocation_students')).rows[0].n,2,'Un échec restaure aussi les élèves précédents.');
 const result=await save(published);assert.equal(result.event.id,'event-fixture');assert.equal(result.event.title,published.title);assert.equal(result.event.date,published.date);assert.equal(result.event.start_time,'11:45:00');assert.equal(result.event.end_time,'18:00:00');assert.deepEqual(result.event.specialties,['Association Sportive','Section Football']);assert.equal(result.convocation.public_visible,true);
 await save(published);assert.equal((await db.query('select count(*)::int n from public.v20_convocations')).rows[0].n,1,'La reprise après un résultat réseau incertain réutilise la même convocation.');
 await assert.rejects(save({...published,id:'duplicate'}),/CONVOCATION_EVENT_ALREADY_LINKED/);await assert.rejects(save({...published,specialty:'Option Escalade'}),/CONVOCATION_SPECIALTY_MISMATCH/);await assert.rejects(save(published,['s1'],'missing-event'),/CONVOCATION_EVENT_NOT_FOUND/);
 await db.exec('set role anon;');assert.equal((await db.query('select count(*)::int n from public.v20_convocations')).rows[0].n,1);await assert.rejects(db.query('select * from public.v20_convocation_students'),/permission denied/);
 const migration=source('supabase/migrations/20261008053330_linked_calendar_convocations_v3181.sql');assert.doesNotMatch(migration,/security definer|create policy/i);
}finally{await db.close()}
console.log('V31.8.1 convocations : reprise, brouillon privé, publication liée, horaires, reprises réseau, transaction et rôles OK (données fictives).');
