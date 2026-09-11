import { requireApiUrl } from './apiBase';
import { readSession } from './backendSession';

const api = () => requireApiUrl();

const authHeaders = (json = false) => {
  const key = 'Author' + 'ization';
  const headers: Record<string, string> = { [key]: `Bearer ${readSession() || ''}` };
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
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Erro ao analisar documento.');
  return data.intelligence as DocumentIntelligence;
};

export const getDocumentIntelligence = async (documentId: string, includeRaw = false): Promise<DocumentIntelligence | null> => {
  const response = await fetch(`${api()}/api/documents/${documentId}/intelligence?include_raw=${includeRaw ? 'true' : 'false'}`, {
    headers: authHeaders(),
  });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Erro ao carregar inteligência.');
  return data.intelligence as DocumentIntelligence | null;
};

export const updateDocumentIntelligence = async (documentId: string, payload: Partial<DocumentIntelligence>): Promise<DocumentIntelligence> => {
  const response = await fetch(`${api()}/api/documents/${documentId}/intelligence`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Erro ao revisar inteligência.');
  return data.intelligence as DocumentIntelligence;
};

export const getDocumentAlerts = async (documentId: string): Promise<IntelligenceAlert[]> => {
  const response = await fetch(`${api()}/api/documents/${documentId}/alerts`, { headers: authHeaders() });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Erro ao carregar alertas.');
  return (data.alerts || []) as IntelligenceAlert[];
};

export const getDocumentAuditTrail = async (documentId: string): Promise<any[]> => {
  const response = await fetch(`${api()}/api/documents/${documentId}/audit-trail`, { headers: authHeaders() });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Erro ao carregar atividade.');
  return data.events || [];
};

export const getIntelligenceDashboard = async (): Promise<IntelligenceDashboard> => {
  const response = await fetch(`${api()}/api/intelligence/dashboard`, { headers: authHeaders() });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Erro ao carregar dashboard de inteligência.');
  return data as IntelligenceDashboard;
};

export const searchIntelligence = async (query: string, days = 60): Promise<any[]> => {
  const params = new URLSearchParams({ q: query, days: String(days) });
  const response = await fetch(`${api()}/api/documents/search?${params.toString()}`, { headers: authHeaders() });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Erro ao buscar documentos.');
  return data.results || [];
};

export const getUpcomingExpirations = async (days = 60): Promise<IntelligenceAlert[]> => {
  const response = await fetch(`${api()}/api/contracts/upcoming-expirations?days=${days}`, { headers: authHeaders() });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Erro ao carregar vencimentos.');
  return data.alerts || [];
};

export const createDocumentSignatureRequest = async (
  documentId: string,
  payload: { title?: string; contract_content?: string; parties?: Array<{ name: string; email?: string }> } = {},
): Promise<any> => {
  const response = await fetch(`${api()}/api/documents/${documentId}/signature-request`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Erro ao criar assinatura do documento.');
  return data.request;
};
