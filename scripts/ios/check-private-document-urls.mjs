// Security regression gate for shipping client code, not synthetic test fixtures.
// No network calls, secrets, real documents or backend access.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const files = [
  'src/lib/backendDocuments.ts',
  'src/lib/secureDocumentDownloads.ts',
  'src/hooks/useDocumentsWithAuth.ts',
  'src/components/DocumentCard.tsx',
  'src/components/DocumentViewerModal.tsx',
  'src/components/ShareModal.tsx',
];
for (const path of files) {
  const code = readFileSync(path, 'utf8');
  assert.doesNotMatch(code, /[?&]s=(?:\\$\\{|\\+|\\w)/, `SESSION-IN-URL regression in ${path}`);
  assert.doesNotMatch(code, /(?:downloadUrl|backendShareLink)\\s*\\(/, `Legacy private document link in ${path}`);
}

const backendDocuments = readFileSync('src/lib/backendDocuments.ts', 'utf8');
const secureDownload = readFileSync('src/lib/secureDocumentDownloads.ts', 'utf8');
const shareModal = readFileSync('src/components/ShareModal.tsx', 'utf8');
const viewer = readFileSync('src/components/DocumentViewerModal.tsx', 'utf8');
assert.match(backendDocuments, /fileData:\\s*''/, 'Private document listing must not embed credentials in URLs');
assert.match(secureDownload, /Authorization:\\s*`Bearer /, 'Private document download must authenticate by header');
assert.match(shareModal, /createAccessLink\\(/, 'External sharing must use access grants');
assert.match(viewer, /URL\\.revokeObjectURL\\(/, 'Private preview must revoke object URLs');
console.log('PASS: private document URLs do not expose session; Bearer + scoped sharing + cleanup guards retained.');
