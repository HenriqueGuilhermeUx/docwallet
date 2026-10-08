const browserHostname = typeof globalThis !== 'undefined' ? globalThis.location?.hostname || '' : '';

const previewApiUrl =
  browserHostname === 'deploy-preview-8--docwallet.netlify.app'
    ? 'https://docwallet-mydatamed-homolog.onrender.com'
    : '';

export const DOCWALLET_API_URL = (
  previewApiUrl
  || import.meta.env.VITE_DOCWALLET_API_URL
  || ''
).replace(/\/$/, '');

export const requireApiUrl = () => {
  if (!DOCWALLET_API_URL) {
    throw new Error('Configure VITE_DOCWALLET_API_URL no Netlify.');
  }

  return DOCWALLET_API_URL;
};
