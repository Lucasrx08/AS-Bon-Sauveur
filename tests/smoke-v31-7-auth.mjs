import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const auth = read('v30-auth-simple.js');
const bridge = read('v20-bridge.js');
const pinAuth = read('v21-pin-auth.js');
const security = read('v31-7-security.js');
const hydrateSource = bridge.slice(bridge.indexOf('async function hydrateUser(user){'), bridge.indexOf('async function hydratePublic('));
assert.ok(hydrateSource.startsWith('async function hydrateUser'));

assert.match(pinAuth, /Pour l’administration, cliquez sur « Accès administrateur »/);
assert.match(pinAuth, /Aucun PIN à créer pour cet accès/);
assert.doesNotMatch(pinAuth, /data-admin-mfa|__BS_OPEN_MFA_SETUP/);

const storage = () => {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
};

function fixture({role = 'admin', method = 'email', profileError = false, restoreLogin = true} = {}) {
  const calls = {aal: 0, hydrated: 0, blocked: 0, dispatched: []};
  const sessionStorage = storage();
  sessionStorage.setItem('bs-auth-method-v31', method);
  const context = {
    console, Date, Map, sessionStorage, localStorage: storage(),
    requestAnimationFrame: fn => fn(),
    document: {getElementById: () => null, querySelectorAll: () => [], addEventListener: () => {}},
    window: {
      addEventListener: () => {},
      dispatchEvent: event => calls.dispatched.push(event.type),
      app: {hydrateFromServer: () => calls.hydrated++}
    },
    CustomEvent: class {constructor(type, options) {this.type = type; this.detail = options?.detail;}},
    currentUser: null, currentRole: 'public', userHydration: null,
    lastHydratedUserId: '', lastHydratedAt: 0, lastServerRefresh: 0, authEpoch: 0,
    VERIFIED: 'bs-v20-verified-role', ROLE_KEY: 'bs-demo-role-v4',
    applySignedOut: async () => {},
    clearPrivateCache: () => calls.blocked++,
    toast: () => {},
    hydrateAll: async () => ({students: []}),
    setupRealtime: async () => {},
    sb: {
      from: table => {
        assert.equal(table, 'profiles');
        return {select: () => ({eq: (key, id) => {
          assert.equal(key, 'id'); assert.equal(id, 'test-user');
          return {single: async () => profileError
            ? {data: null, error: new Error('Profile denied')}
            : {data: {role, display_name: 'Compte fictif', email: 'test@example.invalid'}, error: null}};
        }})};
      },
      auth: {mfa: {getAuthenticatorAssuranceLevel: async () => {
        calls.aal++;
        return {data: {currentLevel: 'aal1', nextLevel: 'aal2'}, error: null};
      }}}
    }
  };
  vm.createContext(context);
  if(restoreLogin) vm.runInContext(auth, context);
  else context.window.__BS_ADMIN_MFA_DISABLED = false;
  vm.runInContext(hydrateSource, context);
  return {context, calls};
}

for(const method of ['email', 'pin']) {
  const {context, calls} = fixture({method});
  const result = await context.hydrateUser({id: 'test-user'});
  assert.equal(result.role, 'admin');
  assert.equal(context.sessionStorage.getItem('bs-v20-verified-role'), 'admin');
  assert.equal(context.sessionStorage.getItem('bs-auth-method-v31'), method);
  assert.equal(calls.aal, 0, 'Aucun TOTP ne doit être demandé par la version de restauration.');
  assert.equal(calls.hydrated, 1);
  assert.deepEqual(calls.dispatched, []);
  assert.equal(context.window.ASV30_AUTH.mfaRequired, false);
  // The unloaded MFA module must also remain inert if an older shell includes it.
  vm.runInContext(security, context);
  assert.equal(context.window.__BS_OPEN_MFA_SETUP, undefined);
}

for(const role of ['teacher_as', 'educator_football', 'educator_gymnastique', 'educator_escalade']) {
  const {context, calls} = fixture({role});
  const result = await context.hydrateUser({id: 'test-user'});
  assert.equal(result.role, role, 'Le rôle doit rester celui du profil serveur.');
  assert.equal(context.sessionStorage.getItem('bs-v20-verified-role'), role);
  assert.equal(calls.aal, 0);
}

{
  const {context, calls} = fixture({profileError: true});
  await assert.rejects(context.hydrateUser({id: 'test-user'}), /Profile denied/);
  assert.equal(context.sessionStorage.getItem('bs-v20-verified-role'), null);
  assert.equal(calls.hydrated, 0, 'Ne jamais ouvrir un espace sur un profil non vérifié.');
}

{
  const {context, calls} = fixture({restoreLogin: false});
  await assert.rejects(context.hydrateUser({id: 'test-user'}), /MFA_REQUIRED/);
  assert.equal(calls.aal, 1);
  assert.equal(calls.hydrated, 0);
  assert.deepEqual(calls.dispatched, ['bs-admin-mfa-required']);
}

console.log('Régression connexion V31.7.3 : OK (comptes fictifs, aucun appel de production)');
