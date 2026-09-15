import { requireApiUrl } from './apiBase';
import { handleAuthFailure, readSession } from './backendSession';

export interface NexOfficeConnectionResult {
  id: string;
  workspaceId: string;
  status: string;
  connectedAt: string;
}

export async function connectNexOffice(token: string): Promise<NexOfficeConnectionResult> {
  const session = readSession();
  if (!session) throw new Error('Entre no DocWallet para autorizar a conexão com o NexOffice.');

  const response = await fetch(`${requireApiUrl()}/api/integrations/nexoffice/connect`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) throw new Error(handleAuthFailure());
  if (!response.ok) throw new Error(payload?.error || 'Não foi possível conectar o DocWallet ao NexOffice.');
  return payload.connection as NexOfficeConnectionResult;
}
