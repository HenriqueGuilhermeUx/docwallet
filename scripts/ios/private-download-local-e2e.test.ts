// Cross-repository CI integration: REAL HTTP to a synthetic, loopback-only Flask server.
// Never use a deployed backend URL or production credentials here.
import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest';

const originalSession = process.env.DOCWALLET_LOCAL_E2E_TOKEN;
vi.mock('../../src/lib/apiBase', () => ({
  requireApiUrl: () => 'http://127.0.0.1:8765',
}));
vi.mock('../../src/lib/backendSession', () => ({
  readSession: () => process.env.DOCWALLET_LOCAL_E2E_TOKEN || '',
  handleAuthFailure: (status: number) => 'Synthetic authorization failure ' + status,
}));
import { fetchPrivateDocumentBlob } from '../../src/lib/secureDocumentDownloads';
import { listBackendDocuments } from '../../src/lib/backendDocuments';

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
});
