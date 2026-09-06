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
  signed_name?: string | null;
  signed_email?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

export interface SignatureRequest {
  id: string;
  title: string;
  content_hash: string;
  final_hash?: string | null;
  status: string;
  created_at: string;
  completed_at?: string | null;
  total_parties?: number;
  signed_count?: number;
  pending_count?: number;
  progress_percent?: number;
  parties: SignatureParty[];
}

export interface SignatureEvidence {
  provider: string;
  evidence_version: string;
  generated_at: string;
  signature_request: Record<string, any>;
  parties: Record<string, any>[];
  events: Record<string, any>[];
}

const parseJson = async (response: Response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: text || 'Resposta inválida do servidor.' };
  }
};

const headers = () => {
  const key = 'Author' + 'ization';
  return {
    [key]: `Bearer ${readSession() || ''}`,
    'Content-Type': 'application/json',
  } as Record<string, string>;
};

export const listSignatureRequests = async (): Promise<SignatureRequest[]> => {
  const response = await fetch(`${requireApiUrl()}/api/signatures`, {
    headers: headers(),
  });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao carregar assinaturas.');
  }
  return (data.requests || []) as SignatureRequest[];
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

  const data = await parseJson(response);
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao criar solicitação de assinatura.');
  }

  return data.request as SignatureRequest;
};

export const readSignatureRequest = async (requestId: string): Promise<{ request: SignatureRequest; contract_content: string }> => {
  const response = await fetch(`${requireApiUrl()}/api/signatures/${requestId}`, {
    headers: headers(),
  });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao carregar assinatura.');
  }
  return { request: data.request as SignatureRequest, contract_content: data.contract_content };
};

export const readSignatureEvidence = async (requestId: string): Promise<{ evidence: SignatureEvidence; contract_content: string }> => {
  const response = await fetch(`${requireApiUrl()}/api/signatures/${requestId}/evidence`, {
    headers: headers(),
  });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao carregar evidências.');
  }
  return { evidence: data.evidence as SignatureEvidence, contract_content: data.contract_content || '' };
};

export const createSignatureReminder = async (requestId: string, partyId?: string): Promise<{ party: SignatureParty; url: string; message: string }> => {
  const response = await fetch(`${requireApiUrl()}/api/signatures/${requestId}/reminder`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ party_id: partyId || '' }),
  });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao criar lembrete.');
  }
  return { party: data.party as SignatureParty, url: data.url, message: data.message };
};

export const cancelSignatureRequest = async (requestId: string): Promise<SignatureRequest> => {
  const response = await fetch(`${requireApiUrl()}/api/signatures/${requestId}/cancel`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({}),
  });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao cancelar assinatura.');
  }
  return data.request as SignatureRequest;
};

export const readPublicSignature = async (code: string) => {
  const response = await fetch(`${requireApiUrl()}/api/sign/${code}`);
  const data = await parseJson(response);
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
  const data = await parseJson(response);
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao assinar.');
  }
  return data;
};

export const publicSignUrl = (code: string) => `${globalThis.location?.origin || ''}/sign/${code}`;

export const publicSignPathToUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${globalThis.location?.origin || ''}${path.startsWith('/') ? path : `/${path}`}`;
};
