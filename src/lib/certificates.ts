import { requireApiUrl } from './apiBase';
import { readSession } from './backendSession';

export interface BlockchainCertificate {
  id?: string;
  certificate_id?: string;
  document_name?: string;
  file_name?: string;
  file_hash?: string;
  tx_hash?: string;
  transaction_hash?: string;
  wallet_address?: string;
  network?: string;
  created_at?: string;
  status?: string;
}

const authHeaders = () => {
  const session = readSession();
  return session ? { ['Author' + 'ization']: `Bearer ${session}` } : {};
};

export const listCertificates = async (): Promise<BlockchainCertificate[]> => {
  const response = await fetch(`${requireApiUrl()}/api/blockchain/certificates`, {
    headers: authHeaders(),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || data?.message || 'Nao foi possivel carregar certificados.');
  }

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.certificates)) return data.certificates;
  if (Array.isArray(data.items)) return data.items;
  return [];
};
