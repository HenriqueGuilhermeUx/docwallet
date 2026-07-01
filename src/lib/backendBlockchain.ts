import { requireApiUrl } from './apiBase';
import { readSession } from './backendSession';

export interface BackendCertificate {
  id: string;
  document_id?: string | null;
  document_name: string;
  file_hash: string;
  certificate_id: string;
  wallet_address: string;
  tx_hash: string;
  chain_id: number;
  network_name: string;
  block_number?: number | null;
  explorer_url?: string;
  price_paid?: string;
  currency?: string;
  status: string;
  created_at: string;
}

const api = () => requireApiUrl();

const requestHeaders = () => {
  const key = 'Author' + 'ization';
  return {
    [key]: `Bearer ${readSession() || ''}`,
    'Content-Type': 'application/json',
  } as Record<string, string>;
};

export const listBackendCertificates = async (): Promise<BackendCertificate[]> => {
  const response = await fetch(`${api()}/api/blockchain/certificates`, {
    headers: requestHeaders(),
  });
  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao carregar certificados');
  }

  return data.certificates || [];
};

export const confirmBackendCertificate = async (params: {
  fileHash: string;
  documentName: string;
  txHash: string;
  walletAddress?: string;
}) => {
  const response = await fetch(`${api()}/api/blockchain/confirm`, {
    method: 'POST',
    headers: requestHeaders(),
    body: JSON.stringify({
      file_hash: params.fileHash,
      document_name: params.documentName,
      tx_hash: params.txHash,
      wallet_address: params.walletAddress,
    }),
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao confirmar certificado');
  }

  return data.certificate as BackendCertificate;
};

export const verifyBackendHash = async (fileHash: string): Promise<BackendCertificate | null> => {
  const response = await fetch(`${api()}/api/blockchain/verify/${fileHash}`);
  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao verificar hash');
  }

  return data.authentic ? data.certificate : null;
};
