import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const version = JSON.parse(read('version.json')).version;
const index = read('index.html');
const app = read('v19-app.js');
const css = read('v19.css');
const pdf = read('v21-12-pdf.js');
const privacy = read('v22-1-privacy.js');
const runtime = read('v22-runtime.js');
const bridge = read('v20-bridge.js');
const auth = read('v30-auth-simple.js');
const security = read('v31-7-security.js');
const orderEdge = read('supabase/functions/public-order/index.ts');
const registrationEdge = read('supabase/functions/public-registration/index.ts');
const serviceWorker = read('sw.js');

assert.equal(version, '31.7.0');
assert.match(index, /integrity="sha384-JBR\+x8bl/);
assert.match(index, /v31-7-security\.js\?v=31\.7\.0/);
assert.match(bridge, /sha384-vtjasyid/);
assert.match(bridge, /sha384-Pqp51FUN/);
assert.match(pdf, /sha384-en\/ztfPS/);

assert.match(css, /\.v19-event-card\[hidden\]\{display:none!important\}/);
assert.match(app, /timeZone:'Europe\/Paris'/);
assert.match(app, /String\(p\.deadline\)>=todayKey\(\)/);
assert.match(app, /app\.downloadDoc/);
assert.match(app, /Horaire à confirmer/);
assert.match(app, /calendarSpecialty,eventSpecialties:eventSpecialtiesOf/);
assert.match(privacy, /button\.onclick=event=>\{event\.stopPropagation\(\);openPrivacy\(\)\}/);
assert.match(privacy, /document\.addEventListener\('click'/);
assert.match(runtime, /product\.deadline&&String\(product\.deadline\)<todayParis\(\)/);
assert.match(runtime, /window\.app\?\.eventSpecialties/);
assert.match(orderEdge, /timeZone:'Europe\/Paris'/);
assert.match(orderEdge, /dateParts\.year/);
assert.match(registrationEdge, /select\('id,title,specialty,specialties,date/);
assert.match(registrationEdge, /\.in\('specialty',eventSpecialties\)/);

assert.match(serviceWorker, /APP_SHELL_URL='\.\/index\.html'/);
assert.match(serviceWorker, /CDN_ASSETS/);
assert.match(serviceWorker, /current\.match\(APP_SHELL_URL\)/);
assert.match(auth, /mfaRequiredWhenEnrolled:true/);
assert.match(bridge, /aal\?\.nextLevel==='aal2'&&aal\?\.currentLevel!=='aal2'/);
assert.match(security, /__BS_OPEN_MFA_SETUP=enroll/);

const football = {id:'football',date:'2099-01-01',specialty:'Section Football',specialties:['Section Football']};
const shared = {id:'shared',date:'2099-01-02',specialty:'Association Sportive',specialties:['Association Sportive','Section Football']};
const climbing = {id:'climbing',date:'2099-01-03',specialty:'Option Escalade',specialties:['Option Escalade']};
const context = {
  console,
  Map,
  Set,
  Date,
  Intl,
  setTimeout,
  clearTimeout,
  document:{querySelectorAll:()=>[],addEventListener:()=>{}},
  window:{app:{
    readData:()=>({events:[football,shared,climbing],convocations:[]}),
    calendarSpecialty:()=> 'Section Football',
    roleSpecialty:()=> null,
    eventSpecialties:event=>event.specialties
  }}
};
context.globalThis=context;
vm.runInNewContext(pdf,context);
assert.deepEqual(Array.from(context.window.ASV2112_PDF.orderedEvents(),event=>event.id),['football','shared']);

console.log('Smoke V31.7 audit et correctifs : OK');
