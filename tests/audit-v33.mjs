import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const db=new PGlite();
await db.exec(`create table v20_convocations(id text,date date,public_visible boolean,status text);create table v20_convocation_students(convocation_id text,student_id text);create table v20_students(id text,full_name text);create table v20_licenses(student_id text,full_name text);
insert into v20_convocations values('visible',current_date,true,'published'),('draft',current_date,true,'draft'),('private',current_date,false,'published'),('old',current_date-1,true,'published');
insert into v20_students values('a','DUPONT Jean'),('b','DUPONT JEAN'),('c','Dupont jean'),('d','LE GALL Anne-Marie'),('e','MARTIN'),('f','');
insert into v20_convocation_students select c.id,s.id from v20_convocations c cross join v20_students s;`);
const file=readdirSync(new URL('../supabase/migrations/',import.meta.url)).find(f=>f.endsWith('_professional_audit_v33.sql'));await db.exec(read('supabase/migrations/'+file));
const rows=(await db.query('select * from v3184_public_convocation_roster()')).rows;
assert.equal(rows.length,5);assert.ok(rows.every(x=>x.convocation_id==='visible'));assert.equal(rows.filter(x=>x.display_name==='Jean D.').length,3);assert.ok(rows.some(x=>x.display_name==='Anne-Marie L.'));assert.ok(rows.some(x=>x.display_name==='M.'));assert.ok(rows.every(x=>!x.display_name.includes('DUPONT')));await db.close();
for(const f of ['v22-1-privacy.js','v23-privacy.js']){const s=read(f);assert.match(s,/HelloAsso/);assert.match(s,/prénom et l’initiale/);assert.doesNotMatch(s,/Uniquement les personnels autorisés/)}
const s=read('v19-app.js');assert.match(s,/Par panier \/ référence/);const exports=s.slice(s.indexOf('async function exportExcel('));assert.doesNotMatch(exports,/Aptos/);assert.match(exports,/name:'Anton'/);assert.match(exports,/name:'Montserrat'/);
console.log('V33 : noms toutes casses, projection publique filtrée, confidentialité, vue par panier et charte Excel OK.');

const ordersPage=s.slice(s.indexOf('function ordersPage(){'),s.indexOf('function reportsPage(){'));assert.equal((ordersPage.match(/\+ Commande/g)||[]).length,1);assert.match(ordersPage,/data-v21-order-add/);
