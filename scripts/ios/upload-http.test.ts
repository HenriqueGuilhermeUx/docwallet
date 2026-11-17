// Synthetic HTTP contract tests. No network, credentials or production APIs.
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/apiBase', () => ({
  requireApiUrl: () => 'https://example.invalid',
}));
vi.mock('../../src/lib/backendSession', () => ({
  readSession: () => 'synthetic-token-never-real',
  handleAuthFailure: (status: number) => 'Synthetic authorization failure ' + status,
}));
import { uploadBackendDocument } from '../../src/lib/backendDocuments';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('DocWallet upload HTTP failure contract', () => {
  const file = () => new File(['synthetic-document'], 'ficticio.pdf', { type: 'application/pdf' });

  it('rejects on server HTTP 503 and does not retry automatically', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ success: false, error: 'synthetic unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    ));
    vi.stubGlobal('fetch', mockFetch);
    await expect(uploadBackendDocument(file(), 'Fictício', 'rg', 'ids')).rejects.toThrow('synthetic unavailable');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://example.invalid/api/documents/upload');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
  });

  it('rejects on HTTP 401 and passes status to auth failure handler', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ success: false }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    ));
    vi.stubGlobal('fetch', mockFetch);
    await expect(uploadBackendDocument(file(), 'Fictício', 'rg', 'ids'))
      .rejects.toThrow('Synthetic authorization failure 401');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('rejects on a network error without sending another request', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new TypeError('synthetic offline'));
    vi.stubGlobal('fetch', mockFetch);
    await expect(uploadBackendDocument(file(), 'Fictício', 'rg', 'ids')).rejects.toThrow('synthetic offline');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
