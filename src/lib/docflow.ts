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

export interface DocFlowTemplate {
  key: string;
  name: string;
  description: string;
  documentType?: string;
  schema: { version?: number; fields: string[]; required?: string[] };
  questions: string[];
  steps: Array<{ type: string; label: string; config?: Record<string, any> }>;
}

export interface DocFlowWorkflow {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  templateKey?: string;
  triggerType: string;
  documentType?: string;
  schema: { version?: number; fields?: string[]; required?: string[] };
  questions: string[];
  steps: Array<{ type: string; label: string; config?: Record<string, any> }>;
  integrations: any[];
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocFlowSubmission {
  id: string;
  tenantId: string;
  workflowId: string;
  documentId?: string;
  title: string;
  sourceType: string;
  status: string;
  currentStep?: string;
  extractedData: Record<string, any>;
  answers: Record<string, any>;
  validationErrors: string[];
  approvalStatus: string;
  hash?: string;
  approvals: Array<{ id: string; status: string; approverEmail?: string; decisionNote?: string; decidedAt?: string }>;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocFlowDashboard {
  tenant: { id: string; name: string; plan: string };
  metrics: {
    documentsReceived: number;
    processed: number;
    pending: number;
    awaitingApproval: number;
    rejected: number;
    completed: number;
    timeSavedMinutes: number;
    averageProcessingMinutes: number;
    users: number;
    workflows: number;
  };
  recentSubmissions: DocFlowSubmission[];
  workflows: DocFlowWorkflow[];
}

export const listDocFlowTemplates = async (): Promise<{ templates: DocFlowTemplate[]; blocks: string[]; capture: string[] }> => {
  const response = await fetch(`${api()}/api/docflow/templates`, { headers: authHeaders() });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Erro ao carregar templates DocFlow.');
  return { templates: data.templates || [], blocks: data.blocks || [], capture: data.capture || [] };
};

export const getDocFlowDashboard = async (): Promise<DocFlowDashboard> => {
  const response = await fetch(`${api()}/api/docflow/dashboard`, { headers: authHeaders() });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Erro ao carregar DocFlow.');
  return data as DocFlowDashboard;
};

export const listDocFlowWorkflows = async (): Promise<DocFlowWorkflow[]> => {
  const response = await fetch(`${api()}/api/docflow/workflows`, { headers: authHeaders() });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Erro ao listar fluxos.');
  return data.workflows || [];
};

export const createDocFlowWorkflow = async (payload: Partial<DocFlowWorkflow> & { fields?: string[]; required?: string[] }): Promise<DocFlowWorkflow> => {
  const response = await fetch(`${api()}/api/docflow/workflows`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Erro ao criar fluxo.');
  return data.workflow;
};

export const createDocFlowWorkflowFromTemplate = async (templateKey: string, name?: string): Promise<DocFlowWorkflow> => {
  const response = await fetch(`${api()}/api/docflow/workflows/from-template`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ templateKey, name }),
  });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Erro ao criar fluxo pelo template.');
  return data.workflow;
};

export const createDocFlowSubmission = async (payload: {
  workflowId: string;
  documentId?: string;
  title?: string;
  sourceType?: string;
  answers?: Record<string, any>;
  extractedData?: Record<string, any>;
}): Promise<DocFlowSubmission> => {
  const response = await fetch(`${api()}/api/docflow/submissions`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Erro ao criar processo.');
  return data.submission;
};

export const listDocFlowSubmissions = async (): Promise<DocFlowSubmission[]> => {
  const response = await fetch(`${api()}/api/docflow/submissions`, { headers: authHeaders() });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Erro ao listar processos.');
  return data.submissions || [];
};

export const runDocFlowSubmission = async (submissionId: string, answers?: Record<string, any>): Promise<DocFlowSubmission> => {
  const response = await fetch(`${api()}/api/docflow/submissions/${submissionId}/run`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ answers: answers || {} }),
  });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Erro ao executar processo.');
  return data.submission;
};

export const approveDocFlowSubmission = async (submissionId: string, note = 'Aprovado'): Promise<DocFlowSubmission> => {
  const response = await fetch(`${api()}/api/docflow/submissions/${submissionId}/approve`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ note }),
  });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Erro ao aprovar processo.');
  return data.submission;
};

export const rejectDocFlowSubmission = async (submissionId: string, note = 'Rejeitado'): Promise<DocFlowSubmission> => {
  const response = await fetch(`${api()}/api/docflow/submissions/${submissionId}/reject`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ note }),
  });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Erro ao rejeitar processo.');
  return data.submission;
};

export const createDocFlowIntegration = async (payload: { type: string; name?: string; workflowId?: string; config?: Record<string, any>; enabled?: boolean }) => {
  const response = await fetch(`${api()}/api/docflow/integrations`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  if (!response.ok || data.success === false) throw new Error(data.error || 'Erro ao criar integração.');
  return data.integration;
};
