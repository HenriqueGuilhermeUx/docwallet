/**
 * Fail closed before any Netlify USA Git build.
 * This guard cannot attest to a deploy: validate the actual Netlify deploy
 * rules, HTTP responses and browser requests separately.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const expectedSite = 'a5b1cda8-535a-4db2-b01f-07f41c30be76';
const expectedBranch = 'feature/usa-localized-preview-20261024';

assert.equal(process.env.SITE_ID, expectedSite,
  'Refusing USA build: Netlify site ID is not the dedicated DocWallet USA project');
assert.equal(process.env.BRANCH, expectedBranch,
  'Refusing USA build: source branch is not the reviewed USA draft branch');
assert.equal(process.env.CONTEXT, 'production',
  'Refusing USA build outside the dedicated project production context');

const forbiddenKeys = Object.keys(process.env).filter(key =>
  key.startsWith('VITE_') ||
  /^(?:SUPABASE_SERVICE_ROLE_KEY|DATABASE_URL|DOCWALLET_API_URL|STRIPE_SECRET_KEY|MERCADOPAGO_ACCESS_TOKEN)$/.test(key)
);
assert.deepEqual(forbiddenKeys, [],
  'Refusing USA build: frontend/API or provider environment keys present: ' + forbiddenKeys.join(', '));

const config = readFileSync('deploy/netlify/docwallet/netlify.toml', 'utf8');
assert.match(config, /^\s*publish\s*=\s*"dist-usa-docwallet"\s*$/m);
assert.match(config, /scripts\/usa-netlify-site-guard\.mjs/);
assert.match(config, /vite\.usa\.config\.ts/);
assert.match(config, /scripts\/usa-netlify-isolation-check\.mjs/);
assert.doesNotMatch(config, /docwallet-backend\.onrender\.com|docwallet\.netlify\.app|\/\*.*\/index\.html/i,
  'Dedicated USA config must not contain Brazilian backend, site or SPA fallback');
console.log('PASS: dedicated DocWallet USA site/branch/context, no inherited provider env, isolated publish config');
