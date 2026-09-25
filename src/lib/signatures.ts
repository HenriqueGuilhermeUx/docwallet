import { requireApiUrl } from './apiBase';
import { readSession, handleAuthFailure, authExpiredMessage } from './backendSession';

export interface SignaturePartyInput {
  name: string;
  email?: string;
  phone?: string;
}

export interface SignatureParty {
  id: string;
  name: string;
  email?: string;
  phone?: string | null;
  status: string;
  code?: string;
  url?: string;
  signed_at?: string | null;
  signed_name?: string | null;
  signed_email?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  evidence_level?: string | null;
  signed_cpf?: string | null;
  signed_phone?: string | null;
  confirmation_phrase?: string | null;
  has_drawn_signature?: boolean;
  geo_latitude?: string | null;
  geo_longitude?: string | null;
  geo_accuracy?: string | null;
  device_fingerprint?: Record<string, any>;
  identity_verification?: Record<string, any>;
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

export interface ReinforcedSignaturePayload {
  name: string;
  email?: string;
  cpf?: string;
  phone?: string;
  confirmationPhrase?: string;
  signatureImage?: string;
  geolocation?: { latitude?: number | string; longitude?: number | string; accuracy?: number | string } | null;
  deviceFingerprint?: Record<string, any>;
  consentText?: string;
  evidenceLevel?: 'basic_evidence' | 'reinforced_evidence' | 'verified_evidence';
}

export interface SignatureDeliveryResult {
  success: boolean;
  channel: 'email' | 'whatsapp';
  signUrl?: string;
  url?: string;
  provider?: string;
  messageId?: string;
}

export interface SignatureIdentityConfig {
  success: boolean;
  emailAvailable: boolean;
  maskedEmail?: string;
  verified: boolean;
  method?: string | null;
  verifiedAt?: string | null;
  evidenceLevel?: 'reinforced_evidence' | 'verified_evidence';
}

export interface SignatureIdentityChallenge {
  success: boolean;
  challengeId: string;
  maskedEmail?: string;
  expiresIn: number;
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
  const token = readSession();
  if (!token) throw new Error(authExpiredMessage);

  const key = 'Author' + 'ization';
  return {
    [key]: `Bearer ${token}`,
    'Content-Type': 'application/json',
  } as Record<string, string>;
};

const readOrThrow = async <T>(response: Response, fallback: string, pick: (data: Record<string, any>) => T): Promise<T> => {
  const data = await parseJson(response);
  if (response.status === 401) throw new Error(handleAuthFailure(401));
  if (response.status === 403) throw new Error(data.error || handleAuthFailure(403));
  if (!response.ok || data.success === false) throw new Error(data.error || fallback);
  return pick(data);
};

export const getPublicAppUrl = () => {
  const configured = String(import.meta.env.VITE_DOCWALLET_PUBLIC_URL || '').trim().replace(/\/$/, '');
  if (configured) return configured;

  const origin = globalThis.location?.origin || '';
  if (origin && !origin.includes('localhost') && !origin.startsWith('capacitor://') && !origin.startsWith('ionic://')) {
    return origin.replace(/\/$/, '');
  }

  return 'https://docwallet.netlify.app';
};

export const buildDeviceFingerprint = () => {
  const nav = globalThis.navigator as Navigator & { userAgentData?: any };
  const screenInfo = globalThis.screen || null;
  return {
    userAgent: nav.userAgent,
    language: nav.language,
    languages: Array.from(nav.languages || []),
    platform: nav.platform,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    screen: screenInfo ? {
      width: screenInfo.width,
      height: screenInfo.height,
      colorDepth: screenInfo.colorDepth,
      pixelDepth: screenInfo.pixelDepth,
    } : null,
    viewport: {
      width: globalThis.innerWidth,
      height: globalThis.innerHeight,
      devicePixelRatio: globalThis.devicePixelRatio,
    },
    userAgentData: nav.userAgentData || null,
    capturedAt: new Date().toISOString(),
  };
};

export const listSignatureRequests = async (): Promise<SignatureRequest[]> => {
  const response = await fetch(`${requireApiUrl()}/api/signatures`, {
    headers: headers(),
  });
  return readOrThrow(response, 'Erro ao carregar assinaturas.', (data) => (data.requests || []) as SignatureRequest[]);
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

  return readOrThrow(response, 'Erro ao criar solicitação de assinatura.', (data) => data.request as SignatureRequest);
};

export const readSignatureRequest = async (requestId: string): Promise<{ request: SignatureRequest; contract_content: string }> => {
  const response = await fetch(`${requireApiUrl()}/api/signatures/${requestId}`, {
    headers: headers(),
  });
  return readOrThrow(response, 'Erro ao carregar assinatura.', (data) => ({ request: data.request as SignatureRequest, contract_content: data.contract_content }));
};

export const readSignatureEvidence = async (requestId: string): Promise<{ evidence: SignatureEvidence; contract_content: string }> => {
  const response = await fetch(`${requireApiUrl()}/api/signatures/${requestId}/evidence`, {
    headers: headers(),
  });
  return readOrThrow(response, 'Erro ao carregar evidências.', (data) => ({ evidence: data.evidence as SignatureEvidence, contract_content: data.contract_content || '' }));
};

export const createSignatureReminder = async (requestId: string, partyId?: string): Promise<{ party: SignatureParty; url: string; message: string }> => {
  const response = await fetch(`${requireApiUrl()}/api/signatures/${requestId}/reminder`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ party_id: partyId || '' }),
  });
  return readOrThrow(response, 'Erro ao criar lembrete.', (data) => ({ party: data.party as SignatureParty, url: data.url, message: data.message }));
};

export const deliverSignature = async (
  requestId: string,
  partyId: string,
  channel: 'email' | 'whatsapp',
  options: { phone?: string; reminder?: boolean } = {},
): Promise<SignatureDeliveryResult> => {
  const response = await fetch(`${requireApiUrl()}/api/signatures/${requestId}/deliver`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      party_id: partyId,
      channel,
      phone: options.phone || '',
      reminder: Boolean(options.reminder),
    }),
  });
  return readOrThrow(response, 'Erro ao enviar solicitação de assinatura.', (data) => data as SignatureDeliveryResult);
};

export const cancelSignatureRequest = async (requestId: string): Promise<SignatureRequest> => {
  const response = await fetch(`${requireApiUrl()}/api/signatures/${requestId}/cancel`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({}),
  });
  return readOrThrow(response, 'Erro ao cancelar assinatura.', (data) => data.request as SignatureRequest);
};

export const readPublicSignature = async (code: string) => {
  const response = await fetch(`${requireApiUrl()}/api/sign/${code}`);
  const data = await parseJson(response);
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Link de assinatura indisponível.');
  }
  return data;
};

export const readSignatureIdentity = async (code: string): Promise<SignatureIdentityConfig> => {
  const response = await fetch(`${requireApiUrl()}/api/sign/${code}/identity`);
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Não foi possível carregar a verificação de identidade.');
  return data as SignatureIdentityConfig;
};

export const requestSignatureEmailOtp = async (code: string): Promise<SignatureIdentityChallenge> => {
  const response = await fetch(`${requireApiUrl()}/api/sign/${code}/identity/email-otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Não foi possível enviar o código de verificação.');
  return data as SignatureIdentityChallenge;
};

export const verifySignatureEmailOtp = async (code: string, challengeId: string, otpCode: string): Promise<SignatureIdentityConfig> => {
  const response = await fetch(`${requireApiUrl()}/api/sign/${code}/identity/email-otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenge_id: challengeId, code: otpCode }),
  });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Código de verificação inválido.');
  return {
    success: true,
    emailAvailable: true,
    verified: Boolean(data.verified),
    verifiedAt: data.verifiedAt || null,
    method: 'email_otp',
    evidenceLevel: data.evidenceLevel || 'verified_evidence',
  };
};

export const acceptSignature = async (code: string, params: ReinforcedSignaturePayload) => {
  const response = await fetch(`${requireApiUrl()}/api/sign/${code}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signed_name: params.name,
      signed_email: params.email,
      signed_cpf: params.cpf,
      signed_phone: params.phone,
      confirmation_phrase: params.confirmationPhrase,
      signature_image: params.signatureImage,
      geolocation: params.geolocation,
      device_fingerprint: params.deviceFingerprint || buildDeviceFingerprint(),
      consent_text: params.consentText,
      evidence_level: params.evidenceLevel || 'reinforced_evidence',
      accepted: true,
    }),
  });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao assinar.');
  }
  return data;
};

export const publicSignUrl = (code: string) => `${getPublicAppUrl()}/sign/${code}`;

export const publicSignPathToUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${getPublicAppUrl()}${path.startsWith('/') ? path : `/${path}`}`;
};
