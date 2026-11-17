// Cross-repository CI integration: REAL HTTP to a synthetic, loopback-only Flask server.
// Never use a deployed backend URL or production credentials here.
import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest';
import { File as NodeFile } from 'node:buffer';

const originalSession = process.env.DOCWALLET_LOCAL_E2E_TOKEN;
vi.mock('../../src/lib/apiBase', () => ({
  requireApiUrl: () => 'http://127.0.0.1:8765',
}));
vi.mock('../../src/lib/backendSession', () => ({
  readSession: () => process.env.DOCWALLET_LOCAL_E2E_TOKEN || '',
  handleAuthFailure: (status: number) => 'Synthetic authorization failure ' + status,
}));
import { fetchPrivateDocumentBlob } from '../../src/lib/secureDocumentDownloads';
import { listBackendDocuments, uploadBackendDocument, deleteBackendDocument } from '../../src/lib/backendDocuments';

const fixture = {
  documentId: process.env.DOCWALLET_LOCAL_E2E_DOC_ID || '',
  ownerToken: process.env.DOCWALLET_LOCAL_E2E_OWNER || '',
  otherToken: process.env.DOCWALLET_LOCAL_E2E_OTHER || '',
};
beforeAll(() => {
  if (!fixture.documentId || !fixture.ownerToken || !fixture.otherToken) {
    throw new Error('Missing synthetic local-only fixtures');
  }
});
afterAll(() => {
  if (originalSession === undefined) delete process.env.DOCWALLET_LOCAL_E2E_TOKEN;
  else process.env.DOCWALLET_LOCAL_E2E_TOKEN = originalSession;
});

describe('real HTTP to isolated Flask API (127.0.0.1 only)', () => {
  it('downloads owner PDF with Bearer without token in URL', async () => {
    process.env.DOCWALLET_LOCAL_E2E_TOKEN = fixture.ownerToken;
    const document = await fetchPrivateDocumentBlob(fixture.documentId);
    expect(document.size).toBeGreaterThan(0);
    expect(document.type).toBe('application/pdf');
  });

  it('lists metadata without leaking the owner session', async () => {
    process.env.DOCWALLET_LOCAL_E2E_TOKEN = fixture.ownerToken;
    const docs = await listBackendDocuments();
    expect(docs.map(x => x.id)).toContain(fixture.documentId);
    expect(docs.every(x => !x.fileData.includes(fixture.ownerToken))).toBe(true);
  });

  it('rejects the other tenant on the identical document', async () => {
    process.env.DOCWALLET_LOCAL_E2E_TOKEN = fixture.otherToken;
    await expect(fetchPrivateDocumentBlob(fixture.documentId))
      .rejects.toThrow('Não foi possível baixar este documento.');
  });

  it('rejects session as ?s= even with an otherwise valid owner token', async () => {
    process.env.DOCWALLET_LOCAL_E2E_TOKEN = fixture.ownerToken;
    const url = 'http://127.0.0.1:8765/api/documents/' +
      encodeURIComponent(fixture.documentId) + '/download?s=' +
      encodeURIComponent(fixture.ownerToken);
    const response = await fetch(url, { redirect: 'error', credentials: 'omit' });
    expect(response.status).toBe(401);
  });

  it('rejects an invalid bearer token with 401 handling', async () => {
    process.env.DOCWALLET_LOCAL_E2E_TOKEN = 'synthetic.invalid.token';
    await expect(fetchPrivateDocumentBlob(fixture.documentId))
      .rejects.toThrow('Synthetic authorization failure 401');
  });
  it('uploads, lists, downloads, isolates and deletes a synthetic PDF over real HTTP', async () => {
    process.env.DOCWALLET_LOCAL_E2E_TOKEN = fixture.ownerToken;
    const bytes = '%PDF-1.4\\n% fake integration fixture only\\n';
    const file = new NodeFile([bytes], 'synthetic-upload.pdf', { type: 'application/pdf' });
    const stored = await uploadBackendDocument(
      file as unknown as File, 'Synthetic upload test', 'rg', 'ids',
    );
    expect(stored.id).toBeTruthy();
    expect(stored.fileData).toBe('');
    expect(stored.fileType).toBe('application/pdf');
    const ownerList = await listBackendDocuments();
    expect(ownerList.some(item => item.id === stored.id)).toBe(true);
    const payload = await fetchPrivateDocumentBlob(stored.id);
    expect(await payload.text()).toBe(bytes);

    process.env.DOCWALLET_LOCAL_E2E_TOKEN = fixture.otherToken;
    const otherList = await listBackendDocuments();
    expect(otherList.some(item => item.id === stored.id)).toBe(false);
    await expect(fetchPrivateDocumentBlob(stored.id))
      .rejects.toThrow('Não foi possível baixar este documento.');
    await expect(deleteBackendDocument(stored.id))
      .rejects.toThrow('Documento não encontrado.');

    process.env.DOCWALLET_LOCAL_E2E_TOKEN = fixture.ownerToken;
    await deleteBackendDocument(stored.id);
    const postDeleteList = await listBackendDocuments();
    expect(postDeleteList.some(item => item.id === stored.id)).toBe(false);
    await expect(fetchPrivateDocumentBlob(stored.id))
      .rejects.toThrow('Não foi possível baixar este documento.');
  });

  it('rejects unauthorized upload and an unsupported synthetic extension', async () => {
    process.env.DOCWALLET_LOCAL_E2E_TOKEN = fixture.ownerToken;
    const invalid = new NodeFile(['only fictional text'], 'synthetic.exe', {
      type: 'application/octet-stream',
    });
    await expect(uploadBackendDocument(invalid as unknown as File, 'Invalid', 'rg', 'ids'))
      .rejects.toThrow('Formato não suportado.');
    process.env.DOCWALLET_LOCAL_E2E_TOKEN = 'synthetic.invalid.token';
    const valid = new NodeFile(['synthetic only'], 'synthetic.pdf', { type: 'application/pdf' });
    await expect(uploadBackendDocument(valid as unknown as File, 'Unauthorized', 'rg', 'ids'))
      .rejects.toThrow('Synthetic authorization failure 401');
  });

});
