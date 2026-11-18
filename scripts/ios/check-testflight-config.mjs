#!/usr/bin/env node
// Read-only configuration guard, not an Apple distribution authorization.
import { readFileSync } from 'node:fs';
const cap = readFileSync('capacitor.config.ts', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const errors = [];
const check = (ok, msg) => { if (!ok) errors.push(msg); };
check(cap.includes("appId: 'br.com.alternativeventures.docwalletdocs'"), 'Bundle ID differs from approved inventory');
check(/webDir:\s*['"]dist['"]/.test(cap), 'Capacitor webDir differs from dist');
for (const d of ['@capacitor/core', '@capacitor/cli', '@capacitor/android']) {
 const v = pkg.dependencies?.[d] ?? pkg.devDependencies?.[d] ?? '';
 check(new RegExp('^[\\^~]?6\\.').test(v), 'Expected Capacitor 6 dependency: ' + d);
}
check(Boolean(pkg.dependencies?.['@capacitor/filesystem']), 'Native dependency missing: @capacitor/filesystem');
check(Boolean(pkg.dependencies?.['@capacitor/share']), 'Native dependency missing: @capacitor/share');
console.log('INFO: Document import, preview, sharing, access isolation and deletion require end-to-end QA');
console.log('INFO: Apple Team, App Store Connect, commercial AAB, signed IPA, policy and functional QA not verified');
for (const item of errors) console.error('FAIL:', item);
if (errors.length) process.exitCode = 1;
else console.log('PASS: static pre-TestFlight configuration only');
