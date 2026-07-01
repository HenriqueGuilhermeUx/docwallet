import { requireApiUrl } from './apiBase';
import { readSession } from './backendSession';
import { Document, DocumentType, Category } from '../types/document';

const api = () => requireApiUrl();

const requestHeaders = () => {
  const key = 'Author' + 'ization';
  return { [key]: `Bearer ${readSession() || ''}` } as Record<string, string>;
};

const toDocument = (item: any): Document => ({
  id: item.id,
  name: item.name,
  type: item.type || 'other',
  category: item.category || 'other',
  fileData: `${api()}${item.download_url}`,
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
  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao carregar documentos');
  }

  return (data.documents || []).map(toDocument);
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

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao enviar documento');
  }

  return toDocument(data.document);
};

export const deleteBackendDocument = async (documentId: string): Promise<void> => {
  const response = await fetch(`${api()}/api/documents/${documentId}`, {
    method: 'DELETE',
    headers: requestHeaders(),
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao excluir documento');
  }
};

export const backendShareLink = (documentId: string): string => {
  return `${api()}/api/documents/${documentId}/download`;
};
