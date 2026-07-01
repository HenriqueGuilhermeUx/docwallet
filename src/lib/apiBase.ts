export const DOCWALLET_API_URL = (import.meta.env.VITE_DOCWALLET_API_URL || '').replace(/\/$/, '');

export const requireApiUrl = () => {
  if (!DOCWALLET_API_URL) {
    throw new Error('Configure VITE_DOCWALLET_API_URL no Netlify.');
  }

  return DOCWALLET_API_URL;
};
