export const sha256File = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const sha256Text = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const normalizeHashHex = (hash: string): string => {
  return hash.replace(/^0x/i, '').trim().toLowerCase();
};

export const hashToCalldata = (hash: string): `0x${string}` => {
  const normalized = normalizeHashHex(hash);

  if (!/^[0-9a-f]{64}$/i.test(normalized)) {
    throw new Error('Hash SHA-256 inválido.');
  }

  return `0x${normalized}`;
};

export const createCertificateId = (prefix = 'DW'): string => {
  const random = crypto.getRandomValues(new Uint8Array(8));
  const hex = Array.from(random).map((byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();

  return `${prefix}-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 16)}`;
};
