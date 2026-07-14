import { requireApiUrl } from './apiBase';
import { readSession } from './backendSession';

const headers = () => {
  const key = 'Author' + 'ization';
  return {
    [key]: `Bearer ${readSession() || ''}`,
    'Content-Type': 'application/json',
  } as Record<string, string>;
};

export type PaymentProductType = 'document' | 'contract' | 'pro';

export interface PixPayment {
  id: string;
  product_type: PaymentProductType;
  method: string;
  amount_cents: number;
  amount_label: string;
  currency: string;
  status: 'pending' | 'paid' | 'expired' | 'failed' | 'config_required' | string;
  provider?: string;
  provider_ref?: string;
  br_code?: string;
  qr_code_image?: string;
  payment_link_url?: string;
  correlation_id?: string;
  tx_id?: string;
  created_at?: string;
  paid_at?: string;
}

export const createPixPayment = async (productType: PaymentProductType) => {
  const response = await fetch(`${requireApiUrl()}/api/payments/woovi`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ product_type: productType }),
  });
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao criar pagamento Pix.');
  }
  return data.payment as PixPayment;
};

export const getPixPaymentStatus = async (paymentId: string) => {
  const response = await fetch(`${requireApiUrl()}/api/payments/${paymentId}`, {
    headers: headers(),
  });
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao consultar pagamento Pix.');
  }
  return data.payment as PixPayment;
};
