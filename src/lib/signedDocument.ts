import { requireApiUrl } from './apiBase';
import { authExpiredMessage, handleAuthFailure, readSession } from './backendSession';

const authHeaders = () => {
  const token = readSession();
  if (!token) throw new Error(authExpiredMessage);
  const key = 'Author' + 'ization';
  return { [key]: `Bearer ${token}` } as Record<string, string>;
};

const filenameFromDisposition = (value: string | null, fallback: string) => {
  if (!value) return fallback;

  const utf8 = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].replace(/^"|"$/g, ''));
    } catch {
      return utf8[1].replace(/^"|"$/g, '');
    }
  }

  const plain = value.match(/filename="?([^";]+)"?/i);
  return plain?.[1]?.trim() || fallback;
};

export const readSignedDocumentPdf = async (requestId: string) => {
  const response = await fetch(`${requireApiUrl()}/api/signatures/${encodeURIComponent(requestId)}/document.pdf`, {
    headers: authHeaders(),
  });

  if (response.status === 401) throw new Error(handleAuthFailure(401));
  if (response.status === 403) throw new Error(handleAuthFailure(403));

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      const parsed = JSON.parse(text);
      message = parsed.error || parsed.message || text;
    } catch {
      // keep text fallback
    }
    throw new Error(message || 'Não foi possível gerar o PDF assinado.');
  }

  const blob = await response.blob();
  const fallback = `docwallet-documento-assinado-${requestId}.pdf`;
  const filename = filenameFromDisposition(response.headers.get('content-disposition'), fallback);
  return { blob, filename };
};
