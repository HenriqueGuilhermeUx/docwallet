// Offline source-level regression gate for DocWallet's failed upload contract.
// This does not replace an end-to-end simulated HTTP failure or iPhone QA.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function parse(path) {
  const source = readFileSync(path, 'utf8');
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  assert.equal(file.parseDiagnostics.length, 0, `TSX parse failed: ${path}`);
  return file;
}
function children(root, predicate) {
  const found = [];
  function visit(node) {
    if (predicate(node)) found.push(node);
    ts.forEachChild(node, visit);
  }
  visit(root);
  return found;
}
function findFunction(file, name) {
  const candidates = children(file, node =>
    ts.isVariableDeclaration(node) && node.name.getText(file) === name
    || ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert.equal(candidates.length, 1, `Expected exactly one ${name}`);
  return candidates[0];
}
const app = parse('src/App.tsx');
const modal = parse('src/components/AddDocumentModal.tsx');
const hook = parse('src/hooks/useDocumentsWithAuth.ts');
const callback = findFunction(app, 'handleAddDocument');
const submit = findFunction(modal, 'handleSubmit');
const upload = findFunction(hook, 'addDocument');
const callbackText = callback.getText(app);
const submitText = submit.getText(modal);
const uploadText = upload.getText(hook);
assert.match(uploadText, /return null\s*;/, 'The hook failure sentinel changed; re-evaluate the contract');
assert.match(callbackText, /await addDocument\(/, 'App must await upload result');
assert.match(callbackText, /if\s*\(\s*!savedDocument\s*\)/, 'App must detect null upload result');
assert.match(callbackText, /throw new Error\(/, 'App must reject failed upload');
assert.match(submitText, /await onAdd\(/, 'Modal must await callback');
assert.match(submitText, /catch\s*\(/, 'Modal must catch rejection');
assert.match(submitText, /setError\(/, 'Modal must show failure feedback');
const tryBlocks = children(submit, n => ts.isTryStatement(n));
assert.equal(tryBlocks.length, 1, 'Expected one try/catch in modal submit');
const tryText = tryBlocks[0].tryBlock.getText(modal);
assert.match(tryText, /handleClose\(/, 'Only successful callback may close the modal');
assert.doesNotMatch(tryBlocks[0].catchClause.getText(modal), /handleClose\(/, 'Failed upload must not close modal');
assert.doesNotMatch(tryBlocks[0].catchClause.getText(modal), /setSelectedFile\(null\)/, 'Failed upload must retain selected file');
console.log('PASS: failed-upload source contract — null => reject => modal stays open with error');
