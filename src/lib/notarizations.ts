import { supabase } from './supabase';
import { BlockchainReceipt } from './evmWallet';
import { createCertificateId, normalizeHashHex } from './hash';

export interface NotarizationRecord {
  id: string;
  user_id: string;
  document_id: string | null;
  document_name: string;
  file_hash: string;
  certificate_id: string;
  wallet_address: string;
  chain_id: number;
  network_name: string;
  tx_hash: string;
  block_number: number | null;
  explorer_url: string;
  price_paid: string;
  currency: string;
  status: string;
  created_at: string;
}

export const saveNotarization = async (params: {
  userId: string;
  documentId?: string | null;
  documentName: string;
  fileHash: string;
  receipt: BlockchainReceipt;
}): Promise<NotarizationRecord> => {
  const certificateId = createCertificateId('DW-CERT');

  const { data, error } = await supabase
    .from('document_notarizations')
    .insert({
      user_id: params.userId,
      document_id: params.documentId ?? null,
      document_name: params.documentName,
      file_hash: normalizeHashHex(params.fileHash),
      certificate_id: certificateId,
      wallet_address: params.receipt.walletAddress,
      chain_id: params.receipt.chainId,
      network_name: params.receipt.networkName,
      tx_hash: params.receipt.txHash,
      block_number: params.receipt.blockNumber,
      explorer_url: params.receipt.explorerUrl,
      price_paid: params.receipt.pricePaid,
      currency: params.receipt.currency,
      status: 'confirmed',
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};

export const fetchUserNotarizations = async (userId: string): Promise<NotarizationRecord[]> => {
  const { data, error } = await supabase
    .from('document_notarizations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
};

export const verifyHash = async (fileHash: string): Promise<NotarizationRecord | null> => {
  const { data, error } = await supabase
    .from('document_notarizations')
    .select('*')
    .eq('file_hash', normalizeHashHex(fileHash))
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data ?? null;
};
