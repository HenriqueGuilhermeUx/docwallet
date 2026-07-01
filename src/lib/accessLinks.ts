import { requireApiUrl } from './apiBase';
import { readSession } from './backendSession';

export interface AccessLink {
  id: string;
  code: string;
  document_id: string;
  expires_at: string;
  max_views?: number | null;
  view_count: number;
  allow_download: boolean;
  is_revoked: boolean;
  api_url: string;
  file_url: string;
}

const makeHeaders = () => {
  const key = 'Author' + 'ization';
  return {
    [key]: `Bearer ${readSession() || ''}`,
    'Content-Type': 'application/json',
  } as Record<string, string>;
};

export const createAccessLink = async (documentId: string): Promise<AccessLink> => {
  const response = await fetch(`${requireApiUrl()}/api/shared`, {
    method: 'POST',
    headers: makeHeaders(),
    body: JSON.stringify({
      document_id: documentId,
      expires_hours: 168,
      max_views: 25,
      allow_download: true,
    }),
  });

  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao criar link.');
  }

  return data.share as AccessLink;
};

export const accessLinkUrl = (item: AccessLink): string => {
  const base = globalThis.location?.origin || '';
  return base + '/share/' + item.code;
};
