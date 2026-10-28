/** Verify the exact publish directory, never the Brazilian app build. */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const repo = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dir = resolve(repo, 'dist-usa-docwallet');
const read = name => readFileSync(resolve(dir, name), 'utf8');
const walk = (path = dir) => readdirSync(path).flatMap(name => {
  const full = resolve(path, name);
  return statSync(full).isDirectory() ? walk(full) : [relative(dir, full).replaceAll('\\', '/')];
});
const names = walk().sort();
for (const required of ['index.html', '404.html', '_headers', '_redirects', 'robots.txt']) {
  assert.ok(names.includes(required), 'Missing USA publish file: ' + required);
}
assert.ok(names.some(name => /^assets\/.+\.js$/.test(name)), 'Missing standalone USA JS bundle');
assert.ok(names.some(name => /^assets\/.+\.css$/.test(name)), 'Missing standalone USA CSS');
for (const name of names) {
  assert.match(name, /^(?:index\.html|404\.html|_headers|_redirects|robots\.txt|assets\/[\w.-]+\.(?:js|css))$/, 'Unexpected file in USA artifact: ' + name);
}
assert.match(read('index.html'), /lang="en-US"/);
assert.match(read('index.html'), /noindex,nofollow/);
const headers = read('_headers');
for (const rule of ["default-src 'none'", "connect-src 'none'", "form-action 'none'", "frame-ancestors 'none'", 'X-Robots-Tag: noindex']) {
  assert.ok(headers.includes(rule), 'Missing USA security rule: ' + rule);
}
const redirects = read('_redirects');
assert.match(redirects, /^\/us\/workspace \/index\.html 200$/m);
assert.match(redirects, /^\/\* \/404\.html 404$/m);
assert.doesNotMatch(redirects, /^\/\* \/index\.html 200$/m, 'BR routes must not fall back to the USA SPA');
const bundle = names.filter(name => /\.(js|css|html)$/.test(name)).map(read).join('\n');
for (const forbidden of [/onrender\.com/i, /supabase\.co/i, /mercadopago/i, /icp-brasil/i, /\/api\//i, /docwallet\.netlify\.app/i, /\/login(?:\/|["'])/i, /\/cadastro(?:\/|["'])/i, /\/share\//i, /\/sign\//i, /serviceWorker\.register/i, /manifest\.json/i]) {
  assert.ok(!forbidden.test(bundle), 'Brazilian backend or application capability leaked into USA bundle: ' + forbidden);
}
assert.match(bundle, /DocWallet USA/, 'USA branding missing');
assert.match(bundle, /Document workspace/, 'Synthetic document workflow missing');
console.log('PASS: isolated DocWallet USA artifact, exact route allowlist, no BR assets/APIs, noindex and deny-by-default CSP');
