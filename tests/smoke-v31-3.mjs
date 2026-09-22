import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const version = '31.3.0';
const index = read('index.html');
const serviceWorker = read('sw.js');
const bridge = read('v20-bridge.js');
const pinAuth = read('v21-pin-auth.js');
const compatibilityAuth = read('v30-auth-simple.js');
const sessionSafety = read('v25-audit-fixes.js');
const functionalFixes = read('v25-1-functional.js');
const mobileCss = read('v31-mobile.css');
const mobileLock = read('v31-mobile-lock.js');

assert.match(index, new RegExp(`<meta name="bs-app-version" content="${version.replaceAll('.', '\\.') }"`));
assert.doesNotMatch(index, /v21-auth-fix\.js/);

const localVersionedAssets = [...index.matchAll(/(?:src|href)="([^"\s]+\?v=([^"\s]+))"/g)]
  .filter(([, url]) => !url.startsWith('https://'));
assert.ok(localVersionedAssets.length > 20, 'Les ressources locales versionnées doivent être présentes.');
for (const [, url, assetVersion] of localVersionedAssets) {
  assert.equal(assetVersion, version, `Version incohérente pour ${url}`);
  const relativePath = url.split('?')[0];
  assert.ok(existsSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url))), `Ressource absente : ${relativePath}`);
}

const versionInfo = JSON.parse(read('version.json'));
assert.equal(versionInfo.version, version);
assert.match(read('v31-release.js'), /label:'V31\.3',version:'31\.3\.0'/);
assert.match(serviceWorker, /APP_VERSION='31\.3\.0'/);

assert.doesNotMatch(serviceWorker, /NAV_CACHE|NAV_KEY|caches\.match\(request\)/);
assert.match(serviceWorker, /key\.startsWith\('as-bon-sauveur-'\)/);
assert.match(serviceWorker, /cache:'no-store'/);

assert.doesNotMatch(pinAuth, /location\.reload\(/);
assert.doesNotMatch(bridge, /location\.reload\(/);
assert.doesNotMatch(sessionSafety, /location\.reload\(/);
assert.match(pinAuth, /__BS_COMPLETE_SIGN_IN/);
assert.match(bridge, /__BS_COMPLETE_SIGN_IN/);
assert.match(bridge, /Promise\.all\(maps\.map/);
assert.match(bridge, /AUTH_METHOD='bs-auth-method-v31'/);
assert.match(pinAuth, /AUTH_METHOD='bs-auth-method-v31'/);
assert.doesNotMatch(bridge, /getItem\('bs-auth-method'\)/);
assert.match(compatibilityAuth, /AUTH_METHOD='bs-auth-method'/);

assert.match(mobileCss, /font-size:16px!important/);
assert.match(mobileCss, /input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\)/);
assert.doesNotMatch(functionalFixes, /font-size:15px!important/);
assert.doesNotMatch(mobileLock, /focusin|window\.scrollTo/);

console.log('Smoke V31.3 : OK');
