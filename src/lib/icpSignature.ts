import { requireApiUrl } from './apiBase';
import { readSession, handleAuthFailure, authExpiredMessage } from './backendSession';

export interface IcpSignatureConfig {
  success: boolean;
  enabled: boolean;
  configured: boolean;
  provider: string;
  mode: string;
  publicUrl: string;
  supports: Record<string, boolean>;
  statusMessage: string;
  safeLabel: string;
}

export interface IcpSignatureSession {
  id: string;
  requestId: string;
  partyCode: string;
  provider: string;
  mode: string;
  status: string;
  signatureStandard: string;
  documentHash?: string;
  externalSessionId?: string;
  redirectUrl?: string | null;
  signedFileUrl?: string | null;
  certificateSubject?: string | null;
  certificateIssuer?: string | null;
  certificateSerial?: string | null;
  validationReport?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
}

const parseJson = async (response: Response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: text || 'Resposta inválida do servidor.' };
  }
};

const authHeaders = () => {
  const token = readSession();
  if (!token) throw new Error(authExpiredMessage);
  const key = 'Author' + 'ization';
  return { [key]: `Bearer ${token}`, 'Content-Type': 'application/json' } as Record<string, string>;
};

const readOrThrow = async <T>(response: Response, fallback: string, pick: (data: Record<string, any>) => T): Promise<T> => {
  const data = await parseJson(response);
  if (response.status === 401 || response.status === 403) throw new Error(handleAuthFailure());
  if (!response.ok || data.success === false) throw new Error(data.error || fallback);
  return pick(data);
};

export const getIcpSignatureConfig = async (): Promise<IcpSignatureConfig> => {
  const response = await fetch(`${requireApiUrl()}/api/icp-signature/config`);
  return readOrThrow(response, 'Erro ao carregar configuração ICP-Brasil.', (data) => data as IcpSignatureConfig);
};

export const prepareIcpSessions = async (requestId: string): Promise<{ sessions: IcpSignatureSession[]; config: IcpSignatureConfig }> => {
  const response = await fetch(`${requireApiUrl()}/api/signatures/${requestId}/icp/prepare`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({}),
  });
  return readOrThrow(response, 'Erro ao preparar assinatura ICP-Brasil.', (data) => ({
    sessions: data.sessions || [],
    config: data.config,
  }));
};

export const listIcpSessions = async (requestId: string): Promise<{ sessions: IcpSignatureSession[]; config: IcpSignatureConfig }> => {
  const response = await fetch(`${requireApiUrl()}/api/signatures/${requestId}/icp/sessions`, {
    headers: authHeaders(),
  });
  return readOrThrow(response, 'Erro ao listar sessões ICP-Brasil.', (data) => ({
    sessions: data.sessions || [],
    config: data.config,
  }));
};

export const startPublicIcpSignature = async (code: string): Promise<{ session: IcpSignatureSession; config: IcpSignatureConfig }> => {
  const response = await fetch(`${requireApiUrl()}/api/sign/${code}/icp/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return readOrThrow(response, 'Erro ao iniciar assinatura com certificado digital.', (data) => ({
    session: data.session,
    config: data.config,
  }));
};
