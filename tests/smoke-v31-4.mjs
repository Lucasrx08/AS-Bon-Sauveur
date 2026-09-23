import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const version = '31.4.0';
const index = read('index.html');
const admin = read('v21-admin.js');
const app = read('v19-app.js');
const migration = read('supabase/migration_v31_4_product_images.sql');
const versionInfo = JSON.parse(read('version.json'));

assert.equal(versionInfo.version, version);
assert.match(index, /bs-app-version" content="31\.4\.0/);
for (const [, assetVersion] of index.matchAll(/(?:src|href)="[^"\s]+\?v=([^"\s]+)"/g)) {
  assert.equal(assetVersion, version);
}

assert.match(admin, /type="file" name="imageFile"/);
assert.match(admin, /PRODUCT_IMAGE_BUCKET='public-assets'/);
assert.match(admin, /\.upload\(path,prepared\.blob/);
assert.match(admin, /upsert:false/);
assert.match(admin, /getPublicUrl\(path\)/);
assert.match(admin, /MAX_SOURCE_IMAGE_SIZE=15\*1024\*1024/);
assert.match(admin, /MAX_STORED_IMAGE_SIZE=5\*1024\*1024/);
assert.match(admin, /image\/webp/);

assert.match(app, /drive\.google\.com\/thumbnail/);
assert.match(app, /onerror="this\.onerror=null;this\.src='assets\/logo-as\.png'"/);

assert.match(migration, /'public-assets'[\s\S]*true[\s\S]*5242880/);
assert.match(migration, /product_images_staff_insert/);
assert.match(migration, /product_images_staff_delete/);
assert.match(migration, /public\.is_teacher_or_admin\(\)/);
assert.doesNotMatch(migration, /service_role/);

console.log('Smoke V31.4 photos produits : OK');
