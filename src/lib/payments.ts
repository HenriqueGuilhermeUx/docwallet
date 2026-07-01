import { requireApiUrl } from './apiBase';
import { readSession } from './backendSession';

const headers = () => {
  const key = 'Author' + 'ization';
  return {
    [key]: `Bearer ${readSession() || ''}`,
    'Content-Type': 'application/json',
  } as Record<string, string>;
};

export const createPixPayment = async (productType: 'document' | 'contract') => {
  const response = await fetch(`${requireApiUrl()}/api/payments/woovi`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ product_type: productType }),
  });
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao criar pagamento Pix.');
  }
  return data.payment;
};
