import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const version = '31.5.0';
const index = read('index.html');
const runtime = read('v22-runtime.js');
const admin = read('v21-admin.js');
const edge = read('supabase/functions/public-order/index.ts');
const migration = read('supabase/migration_v31_5_security.sql');
const versionInfo = JSON.parse(read('version.json'));

assert.equal(versionInfo.version, version);
assert.match(index, /bs-app-version" content="31\.5\.0/);
for (const [, assetVersion] of index.matchAll(/(?:src|href)="[^"\s]+\?v=([^"\s]+)"/g)) {
  assert.equal(assetVersion, version);
}

for (const source of [runtime, admin, edge]) {
  assert.match(source, /'Enseignant','Personnel'/);
}
assert.match(runtime, /ORDER_RECIPIENTS/);
assert.match(runtime, /Classe \/ profil/);
assert.match(runtime, /opts\(ORDER_RECIPIENTS\)/);
assert.match(edge, /ORDER_RECIPIENTS\.has\(className\)/);
assert.match(admin, /select required name="className"/);

assert.match(migration, /alter function public\.v20_events_sync_specialties\(\)/);
assert.match(migration, /set search_path = ''/);

console.log('Smoke V31.5 commandes et sécurité : OK');
