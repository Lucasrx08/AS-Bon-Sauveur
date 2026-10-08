import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

// A disposable PostgreSQL engine in memory; never connect to production.
// Parallel requests are queued by PGlite. Native multi-session load is not covered.
const db=new PGlite();
const migration=readFileSync(new URL('../supabase/migrations/20261007195956_calendar_registration_capacity.sql',import.meta.url),'utf8');
try{
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create table public.v20_events(id text primary key,title text,specialty text,specialties text[],date date,convocation_id text,public_visible boolean default true,registration_open boolean default false);
    create table public.v20_convocations(id text primary key,title text,specialty text,date date,status text default 'published',public_visible boolean default true);
    create table public.v20_event_registrations(id text primary key,event_id text references public.v20_events(id) on delete cascade,last_name text,first_name text,class_name text,request_id uuid unique);
    create unique index registrations_identity on public.v20_event_registrations(event_id,lower(btrim(last_name)),lower(btrim(first_name)),lower(btrim(class_name)));
    insert into public.v20_events(id,title,specialty,specialties,date,registration_open) values ('existing','Existant','Association Sportive',array['Association Sportive'],'2099-01-01',true);
    insert into public.v20_event_registrations values ('old','existing','TEST','Existant','6e AVIGNON',null);
  `);
  await db.exec(migration);
  const row=async id=>(await db.query('select * from public.v20_events where id=$1',[id])).rows[0];
  assert.equal((await row('existing')).registration_mode,'open');assert.equal((await row('existing')).registration_count,1);assert.equal((await row('existing')).registration_capacity,null);
  await db.query(`insert into public.v20_events(id,title,specialty,specialties,date,registration_mode,registration_capacity) values ('limited','Limité','Association Sportive',array['Association Sportive','Option Escalade'],'2099-02-01','open',1),('unlimited','Libre','Association Sportive',array['Association Sportive'],'2099-02-02','open',null),('pending','Convocation','Association Sportive',array['Association Sportive'],'2099-02-03','convocation',null)`);
  const insert=(id,eventId)=>db.query('insert into public.v20_event_registrations(id,event_id,last_name,first_name,class_name) values ($1,$2,$1,\'Fictif\',\'6e AVIGNON\')',[id,eventId]);
  const racing=await Promise.allSettled([insert('race1','limited'),insert('race2','limited')]);
  assert.equal(racing.filter(r=>r.status==='fulfilled').length,1);assert.match(racing.find(r=>r.status==='rejected').reason.message,/EVENT_FULL/);assert.equal((await row('limited')).registration_count,1);
  await assert.rejects(insert('third','limited'),/EVENT_FULL/);
  await db.query("delete from public.v20_event_registrations where event_id='limited'");assert.equal((await row('limited')).registration_count,0);await insert('after-delete','limited');
  await Promise.all([insert('unlimited1','unlimited'),insert('unlimited2','unlimited'),insert('unlimited3','unlimited')]);assert.equal((await row('unlimited')).registration_count,3);
  await assert.rejects(db.query("update public.v20_events set registration_capacity=2 where id='unlimited'"),/CAPACITY_BELOW_REGISTERED/);assert.equal((await row('unlimited')).registration_capacity,null);
  await db.query("update public.v20_events set registration_count=999 where id='limited'");assert.equal((await row('limited')).registration_count,1);
  await assert.rejects(insert('pending-test','pending'),/EVENT_CLOSED/);
  await db.query("insert into public.v20_convocations values ('linked','Limité','Option Escalade','2099-02-01','published',true)");
  await db.query("delete from public.v20_event_registrations where event_id='limited'");await assert.rejects(insert('with-convocation','limited'),/EVENT_CLOSED/);
  await db.query("update public.v20_events set registration_open=false where id='unlimited'");assert.equal((await row('unlimited')).registration_mode,'none');await assert.rejects(insert('closed','unlimited'),/EVENT_CLOSED/);
  // Duplicate attempts keep the existing unique constraint and do not consume a place.
  await assert.rejects(insert('unlimited1','unlimited'),error=>error.code==='23505');assert.equal((await row('unlimited')).registration_count,3);
  // Cascading deletion and cleanup do not fail because the parent has vanished.
  await db.query("delete from public.v20_events where id='unlimited'");assert.equal((await db.query("select count(*)::int as n from public.v20_event_registrations where event_id='unlimited'")).rows[0].n,0);
  assert.match(migration,/order by e\.id for update/);assert.doesNotMatch(migration,/security definer|create policy/i);
  console.log('V31.8 quotas : conservation, limite, demandes parallèles, refus, libération, illimité, doublons et convocations OK (PostgreSQL en mémoire).');
}finally{await db.close()}
