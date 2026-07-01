import { requireApiUrl } from './apiBase';

export const backendHealthUrl = () => `${requireApiUrl()}/api/health`;
