/** US-preview static regression contract. No network or environment secrets. */
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(projectRoot, path), "utf8");
const entry = read("src/App.tsx");
const preview = read("src/components/USPreview.tsx");
const css = read("src/components/USPreview.css");

assert.ok(entry.includes("USPreview") || entry.includes("UsLanding"), "US preview must be mounted explicitly");
assert.ok(entry.includes("'/us'"), "Expected existing route or US gate: '/us'");
assert.ok(entry.includes("'/share/'"), "Expected existing route or US gate: '/share/'");
assert.ok(entry.includes("/us"), "US preview must have an isolated route");
assert.ok(preview.includes("en-US"), "US preview must set document language");
assert.ok(preview.includes("Alternative Ventures"), "US brand attribution missing");
assert.match(preview, /preview/i, "US preview must identify non-live scope");
assert.match(preview, /checkout/i, "US preview must explicitly block unauthorized US commerce");
assert.ok(!/href=["']\/(app|login|cadastro|criar-conta)/i.test(preview), "US preview must not link directly to Brazilian signup");
assert.ok(!/fetch\s*\(/.test(preview), "US preview must not call Brazilian backend APIs");
assert.ok(!/href\\s*=\\s*["']https?:\\/\\//i.test(preview), "US preview must not navigate to external (including Brazilian) sites");
assert.match(preview, /No live accounts or services/, "US footer must disclose non-live demo scope");
for (const match of preview.matchAll(/href\\s*=\\s*["'](\\/[^"'?#]*)/g)) {
  assert.ok(["/us", "/us/workspace"].includes(match[1]), "US preview links must stay on isolated US routes: " + match[1]);
}

assert.ok(css.includes(".avus"), "Styles must use a US-specific namespace");
assert.ok(!/^\s*(body|html|:root|\*)\s*\{/m.test(css), "US preview styles must not redefine global selectors");

const operational = read("src/components/USHashTool.tsx");
assert.ok(operational.includes("crypto.subtle.digest"), "USHashTool.tsx expected capability missing: crypto.subtle.digest");
assert.ok(operational.includes("SHA-256"), "USHashTool.tsx expected capability missing: SHA-256");
assert.ok(operational.includes("not uploaded"), "USHashTool.tsx expected capability missing: not uploaded");
assert.ok(!/(fetch|XMLHttpRequest)\s*\(/.test(operational), "Operational US preview must not call backend APIs");
assert.ok(!/localStorage\s*\.|sessionStorage\s*\./.test(operational), "Demo should not persist potentially identifying visitor input");
assert.ok(!/href=["']\/(app|login|cadastro|criar-conta)/i.test(operational), "Demo must not send visitors to Brazilian account activation");


const workspace = read("src/components/USWorkspace.tsx");
assert.ok(entry.includes("/us/workspace"), "English workspace route missing");
assert.ok(preview.includes('href="/us/workspace"'), "Preview must link to interactive walkthrough");
assert.match(workspace, /initialDocuments/, "Walkthrough must use sample documents");
assert.match(workspace, /setDocuments/, "Sample document review interaction missing");
assert.ok(!/fetch\s*\(/.test(workspace), "Demo must never send data to Brazil APIs");
assert.ok(!/href\\s*=\\s*["\x27]https?:\\/\\//i.test(workspace), "US workspace must not navigate to external sites");
assert.ok(!/localStorage|sessionStorage|uploadDocument/.test(workspace), "Demo data must remain in memory");

console.log("PASS: docwallet US preview route, language, copy, branding, isolation and CSS namespace");
