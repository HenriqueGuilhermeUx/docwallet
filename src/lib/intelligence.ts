import { requireApiUrl } from './apiBase';
import { readSession, handleAuthFailure, authExpiredMessage } from './backendSession';

const api = () => requireApiUrl();

const authHeaders = (json = false) => {
  const token = readSession();
  if (!token) throw new Error(authExpiredMessage);

  const key = 'Author' + 'ization';
  const headers: Record<string, string> = { [key]: `Bearer ${token}` };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
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

export type IntelligenceDocumentType =
  | 'CONTRACT'
  | 'NDA'
  | 'INVOICE'
  | 'RECEIPT'
  | 'IDENTITY'
  | 'CERTIFICATE'
  | 'POWER_OF_ATTORNEY'
  | 'CORPORATE_DOCUMENT'
  | 'LEGAL_DOCUMENT'
  | 'MEDICAL_DOCUMENT'
  | 'OTHER';

export interface IntelligenceAlert {
  id: string;
  documentId?: string;
  intelligenceId?: string;
  type: string;
  title: string;
  message: string;
  dueDate?: string | null;
  severity: 'info' | 'warning' | 'danger' | string;
  status: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, any>;
  createdAt?: string;
}

export interface IntelligenceParty {
  id?: string;
  role?: string;
  name: string;
  email?: string;
  identifier?: string;
  source?: string;
  confidence?: number;
}

export interface IntelligenceDate {
  id?: string;
  kind: string;
  label?: string;
  value: string;
  source?: string;
  confidence?: number;
}

export interface IntelligenceAmount {
  id?: string;
  kind: string;
  label?: string;
  currency?: string;
  value: string;
  raw?: string;
  source?: string;
  confidence?: number;
}

export interface IntelligenceObligation {
  id?: string;
  party?: string | null;
  description: string;
  dueDate?: string | null;
  status?: string;
  source?: string;
  confidence?: number;
}

export interface DocumentIntelligence {
  id: string;
  documentId: string;
  provider: string;
  documentType: IntelligenceDocumentType;
  title?: string;
  issuer?: string;
  documentNumber?: string;
  issueDate?: string | null;
  expirationDate?: string | null;
  summary?: string;
  confidence?: number;
  metadata?: Record<string, any>;
  contract?: Record<string, any>;
  parties: IntelligenceParty[];
  dates: IntelligenceDate[];
  amounts: IntelligenceAmount[];
  obligations: IntelligenceObligation[];
  alerts: IntelligenceAlert[];
  versions?: Record<string, any>[];
  status: string;
  reviewed: boolean;
  versionNumber?: number;
  isCurrent?: boolean;
  createdAt?: string;
  updatedAt?: string;
  rawText?: string;
}

export interface IntelligenceDashboard {
  metrics: {
    documents: number;
    documentsAnalyzed: number;
    activeContracts: number;
    expiringIn30Days: number;
    pendingSignatures: number;
    documentsWithAlerts: number;
  };
  upcomingExpirations: IntelligenceAlert[];
  recentDocuments: Array<{ id: string; name: string; type?: string; createdAt?: string; fileHash?: string }>;
  highValueContracts: IntelligenceAmount[];
}

export const analyzeDocument = async (documentId: string): Promise<DocumentIntelligence> => {
  const response = await fetch(`${api()}/api/documents/${documentId}/analyze`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({}),
  });
  return readOrThrow(response, 'Erro ao analisar documento.', (data) => data.intelligence as DocumentIntelligence);
};

export const getDocumentIntelligence = async (documentId: string, includeRaw = false): Promise<DocumentIntelligence | null> => {
  const response = await fetch(`${api()}/api/documents/${documentId}/intelligence?include_raw=${includeRaw ? 'true' : 'false'}`, {
    headers: authHeaders(),
  });
  return readOrThrow(response, 'Erro ao carregar inteligência.', (data) => data.intelligence as DocumentIntelligence | null);
};

export const updateDocumentIntelligence = async (documentId: string, payload: Partial<DocumentIntelligence>): Promise<DocumentIntelligence> => {
  const response = await fetch(`${api()}/api/documents/${documentId}/intelligence`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return readOrThrow(response, 'Erro ao revisar inteligência.', (data) => data.intelligence as DocumentIntelligence);
};

export const getDocumentAlerts = async (documentId: string): Promise<IntelligenceAlert[]> => {
  const response = await fetch(`${api()}/api/documents/${documentId}/alerts`, { headers: authHeaders() });
  return readOrThrow(response, 'Erro ao carregar alertas.', (data) => (data.alerts || []) as IntelligenceAlert[]);
};

export const getDocumentAuditTrail = async (documentId: string): Promise<any[]> => {
  const response = await fetch(`${api()}/api/documents/${documentId}/audit-trail`, { headers: authHeaders() });
  return readOrThrow(response, 'Erro ao carregar atividade.', (data) => data.events || []);
};

export const getIntelligenceDashboard = async (): Promise<IntelligenceDashboard> => {
  const response = await fetch(`${api()}/api/intelligence/dashboard`, { headers: authHeaders() });
  return readOrThrow(response, 'Erro ao carregar dashboard de inteligência.', (data) => data as IntelligenceDashboard);
};

export const searchIntelligence = async (query: string, days = 60): Promise<any[]> => {
  const params = new URLSearchParams({ q: query, days: String(days) });
  const response = await fetch(`${api()}/api/documents/search?${params.toString()}`, { headers: authHeaders() });
  return readOrThrow(response, 'Erro ao buscar documentos.', (data) => data.results || []);
};

export const getUpcomingExpirations = async (days = 60): Promise<IntelligenceAlert[]> => {
  const response = await fetch(`${api()}/api/contracts/upcoming-expirations?days=${days}`, { headers: authHeaders() });
  return readOrThrow(response, 'Erro ao carregar vencimentos.', (data) => data.alerts || []);
};

export const createDocumentSignatureRequest = async (
  documentId: string,
  payload: { title?: string; contract_content?: string; parties?: Array<{ name: string; email?: string; phone?: string }> } = {},
): Promise<any> => {
  const response = await fetch(`${api()}/api/documents/${documentId}/signature-request`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return readOrThrow(response, 'Erro ao criar assinatura do documento.', (data) => data.request);
};
