/** DocWallet USA headless browser QA: synthetic data only, no uploads or customer records. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:4181';
const server = spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '4181', '--strictPort'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, VITE_API_URL: 'http://127.0.0.1:65535' },
});
let output = '';
server.stdout.on('data', chunk => { output += String(chunk).slice(-2000); });
server.stderr.on('data', chunk => { output += String(chunk).slice(-2000); });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 70; i++) {
    if (server.exitCode !== null) throw new Error('Vite preview failed: ' + output);
    try { if ((await fetch(base + '/us/workspace')).ok) { ready = true; break; } }
    catch { /* preview startup */ }
    await sleep(500);
  }
  assert.ok(ready, 'Vite preview did not start: ' + output);
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const backendCalls = [];
  const browserErrors = [];
  page.on('request', request => {
    const u = request.url();
    if (/\/api\/|supabase\.co|onrender\.com/i.test(u)) backendCalls.push(u);
  });
  page.on('pageerror', error => browserErrors.push(error.message));

  await page.goto(base + '/us/workspace', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('heading', { name: 'Document workspace' }).waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'), 'en-US');
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex,nofollow');
  assert.equal((await page.locator('.avus-grid article').nth(1).locator('h3').innerText()).trim(), '2');
  await page.getByRole('button', { name: 'Mark reviewed' }).first().click();
  assert.equal((await page.locator('.avus-grid article').nth(1).locator('h3').innerText()).trim(), '1');
  await page.getByLabel('Find a document').fill('no match exists');
  await page.getByText('No sample documents match this search.').waitFor();
  await page.getByRole('button', { name: 'Reset sample data' }).click();
  assert.equal((await page.locator('.avus-grid article').nth(1).locator('h3').innerText()).trim(), '2');
  await page.getByLabel('Category').selectOption('Invoices');
  await page.getByText('Service invoice — sample').waitFor();
  assert.equal(await page.locator('.avus-document-list article').count(), 1);

  await page.goto(base + '/us', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /Check a document.s digital fingerprint/i }).waitFor();
  const sample = Buffer.from('DocWallet USA synthetic integrity example\n', 'utf8');
  const expectedHash = createHash('sha256').update(sample).digest('hex');
  await page.locator('input[type=file]').setInputFiles({ name: 'sample.txt', mimeType: 'text/plain', buffer: sample });
  await page.getByText('SHA-256 calculated locally. Your document was not uploaded.').waitFor();
  assert.equal(await page.getByLabel('Calculated SHA-256').inputValue(), expectedHash);
  await page.getByLabel('Compare with a known SHA-256 (optional)').fill(expectedHash);
  await page.getByText('Hashes match: file bytes match the provided reference.').waitFor();
  assert.equal(backendCalls.length, 0, 'Unexpected Brazilian API request: ' + backendCalls.join(', '));
  assert.deepEqual(browserErrors, [], 'Browser JavaScript errors');
  console.log('PASS: DocWallet USA mobile sample workflow, local SHA-256, no backend calls');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
