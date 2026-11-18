import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/apiBase', () => ({ requireApiUrl: () => 'https://example.invalid' }));
vi.mock('../../src/lib/backendSession', () => ({
  readSession: () => 'synthetic-session-secret',
  handleAuthFailure: (status: number) => 'Synthetic session expired: ' + status,
}));
import { fetchPrivateDocumentBlob } from '../../src/lib/secureDocumentDownloads';
import { listBackendDocuments } from '../../src/lib/backendDocuments';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Bearer-only private document download contract (not activated)', () => {
  it('downloads a synthetic file without putting a session into the URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(
      new Blob(['synthetic pdf bytes'], { type: 'application/pdf' }),
      { status: 200, headers: { 'content-type': 'application/pdf' } },
    ));
    vi.stubGlobal('fetch', mockFetch);
    const file = await fetchPrivateDocumentBlob('id with/slash');
    // jsdom and Node's fetch implementation use distinct Blob constructors.\n    expect(file.size).toBeGreaterThan(0);\n    expect(file.type).toBe('application/pdf');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://example.invalid/api/documents/id%20with%2Fslash/download');
    expect(url).not.toContain('synthetic-session-secret');
    expect(url).not.toContain('?');
    expect(init.headers.Authorization).toBe('Bearer synthetic-session-secret');
    expect(init.credentials).toBe('omit');
    expect(init.cache).toBe('no-store');
    expect(init.redirect).toBe('error');
  });

  it('handles synthetic 401 without exposing token or response details', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('no', { status: 401 }));
    vi.stubGlobal('fetch', mockFetch);
    await expect(fetchPrivateDocumentBlob('doc')).rejects.toThrow('Synthetic session expired: 401');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('rejects server errors with a generic message', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(
      'secret backend stack trace must not be shown', { status: 503 },
    ));
    vi.stubGlobal('fetch', mockFetch);
    await expect(fetchPrivateDocumentBlob('doc')).rejects.toThrow('Não foi possível baixar este documento.');
  });

  it('does not treat a JSON response as a document', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      '{}', { status: 200, headers: { 'content-type': 'application/json' } },
    )));
    await expect(fetchPrivateDocumentBlob('doc')).rejects.toThrow('Resposta de arquivo inválida.');
  });

  it('returns document metadata without a session-bearing image URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ success: true, documents: [{
        id: 'synthetic-id', name: 'Fictício', type: 'rg',
        file_type: 'application/pdf', category: 'ids', created_at: '2026-01-01T00:00:00Z',
      }] }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ));
    vi.stubGlobal('fetch', mockFetch);
    const documents = await listBackendDocuments();
    expect(documents).toHaveLength(1);
    expect(documents[0].fileData).toBe('');
    expect(JSON.stringify(documents)).not.toContain('synthetic-session-secret');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://example.invalid/api/documents');
    expect(init.headers.Authorization).toBe('Bearer synthetic-session-secret');
  });
});
