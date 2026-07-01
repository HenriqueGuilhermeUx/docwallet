import { requireApiUrl } from './apiBase';
import { readSession } from './backendSession';

export interface SignaturePartyInput {
  name: string;
  email?: string;
}

export interface SignatureParty {
  id: string;
  name: string;
  email?: string;
  status: string;
  code?: string;
  url?: string;
  signed_at?: string | null;
}

export interface SignatureRequest {
  id: string;
  title: string;
  content_hash: string;
  final_hash?: string | null;
  status: string;
  created_at: string;
  completed_at?: string | null;
  parties: SignatureParty[];
}

const headers = () => {
  const key = 'Author' + 'ization';
  return {
    [key]: `Bearer ${readSession() || ''}`,
    'Content-Type': 'application/json',
  } as Record<string, string>;
};

export const createSignatureRequest = async (params: {
  title: string;
  contractContent: string;
  parties: SignaturePartyInput[];
}): Promise<SignatureRequest> => {
  const response = await fetch(`${requireApiUrl()}/api/signatures/request`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      title: params.title,
      contract_content: params.contractContent,
      parties: params.parties,
    }),
  });

  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao criar solicitação de assinatura.');
  }

  return data.request as SignatureRequest;
};

export const readPublicSignature = async (code: string) => {
  const response = await fetch(`${requireApiUrl()}/api/sign/${code}`);
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Link de assinatura indisponível.');
  }
  return data;
};

export const acceptSignature = async (code: string, params: { name: string; email?: string }) => {
  const response = await fetch(`${requireApiUrl()}/api/sign/${code}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signed_name: params.name, signed_email: params.email, accepted: true }),
  });
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao assinar.');
  }
  return data;
};

export const publicSignUrl = (code: string) => `${globalThis.location?.origin || ''}/sign/${code}`;
