import { requireApiUrl } from './apiBase';
import { handleAuthFailure, readSession } from './backendSession';

/**
 * Candidate for the private document download contract.
 *
 * Deliberately NOT wired into the live view yet: staging must first confirm
 * that GET /api/documents/:id/download accepts a Bearer token header.
 * Unlike legacy downloadUrl(), this never embeds the session in a URL.
 */
export async function fetchPrivateDocumentBlob(
  documentId: string,
  options: { signal?: AbortSignal } = {},
): Promise<Blob> {
  if (!documentId || !documentId.trim()) {
    throw new Error('Documento inválido.');
  }
  const token = readSession();
  if (!token) {
    throw new Error('Sessão necessária para visualizar este documento.');
  }
  const base = requireApiUrl().replace(/\/$/, '');
  const url = `${base}/api/documents/${encodeURIComponent(documentId)}/download`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    signal: options.signal,
    cache: 'no-store',
    credentials: 'omit',
    redirect: 'error',
  });
  if (response.status === 401) {
    throw new Error(handleAuthFailure(401));
  }
  if (!response.ok) {
    // Never include arbitrary backend response bodies or tokens in UI errors.
    throw new Error('Não foi possível baixar este documento.');
  }
  const type = (response.headers.get('content-type') || '').toLowerCase();
  if (type.includes('application/json') || type.includes('text/html')) {
    throw new Error('Resposta de arquivo inválida.');
  }
  return response.blob();
}
