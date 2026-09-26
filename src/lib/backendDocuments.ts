import { requireApiUrl } from './apiBase';
import { readSession, handleAuthFailure } from './backendSession';
import { Document, DocumentType, Category } from '../types/document';

const api = () => requireApiUrl();

const requestHeaders = () => {
  const key = 'Author' + 'ization';
  return { [key]: `Bearer ${readSession() || ''}` } as Record<string, string>;
};

const parseJson = async (response: Response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: text || 'Resposta inválida do servidor.' };
  }
};

const readOrThrow = async <T>(response: Response, fallback: string, pick: (data: Record<string, any>) => T): Promise<T> => {
  const data = await parseJson(response);
  if (response.status === 401) throw new Error(handleAuthFailure(401));
  if (response.status === 403) throw new Error(data.error || handleAuthFailure(403));
  if (!response.ok || data.success === false) throw new Error(data.error || fallback);
  return pick(data);
};

const downloadUrl = (documentId: string) => {
  const session = encodeURIComponent(readSession() || '');
  return `${api()}/api/documents/${documentId}/download?s=${session}`;
};

const toDocument = (item: any): Document => ({
  id: item.id,
  name: item.name,
  type: item.type || 'other',
  category: item.category || 'other',
  fileData: downloadUrl(item.id),
  fileType: item.file_type || 'application/octet-stream',
  createdAt: item.created_at,
  filePath: item.download_url,
  fileSize: item.file_size,
  fileHash: item.file_hash,
  isNotarized: Boolean(item.is_notarized),
  certificateId: item.certificate_id,
});

export const listBackendDocuments = async (): Promise<Document[]> => {
  const response = await fetch(`${api()}/api/documents`, { headers: requestHeaders() });
  return readOrThrow(response, 'Erro ao carregar documentos', (data) => (data.documents || []).map(toDocument));
};

export const uploadBackendDocument = async (
  file: File,
  name: string,
  type: DocumentType,
  category: Category
): Promise<Document> => {
  const form = new FormData();
  form.append('file', file);
  form.append('name', name);
  form.append('type', type);
  form.append('category', category);

  const response = await fetch(`${api()}/api/documents/upload`, {
    method: 'POST',
    headers: requestHeaders(),
    body: form,
  });

  return readOrThrow(response, 'Erro ao enviar documento', (data) => toDocument(data.document));
};

export const deleteBackendDocument = async (documentId: string): Promise<void> => {
  const response = await fetch(`${api()}/api/documents/${documentId}`, {
    method: 'DELETE',
    headers: requestHeaders(),
  });

  return readOrThrow(response, 'Erro ao excluir documento', () => undefined);
};

export const backendShareLink = (documentId: string): string => {
  return downloadUrl(documentId);
};
