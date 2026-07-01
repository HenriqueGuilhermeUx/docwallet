import { requireApiUrl } from './apiBase';
import { saveSession, BackendUser } from './backendSession';

type AuthPayload = {
  success: boolean;
  session?: string;
  token?: string;
  user: BackendUser;
  error?: string;
};

const postLogin = async (path: string, payload: Record<string, string>) => {
  const response = await fetch(`${requireApiUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as AuthPayload;
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Erro ao autenticar');
  }

  const sessionValue = data.session || data.token || '';
  saveSession(sessionValue, data.user);
  return data.user;
};

export const loginWithBackend = (email: string, password: string) => {
  return postLogin('/api/auth/login', { email, password });
};

export const registerWithBackend = (name: string, email: string, password: string) => {
  return postLogin('/api/auth/register', { name, email, password });
};
