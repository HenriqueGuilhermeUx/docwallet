import { requireApiUrl } from './apiBase';
import { saveSession, BackendUser, readSession, readProfile, clearSession } from './backendSession';

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

export const validateBackendSession = async (): Promise<BackendUser | null> => {
  const session = readSession();
  if (!session) {
    clearSession();
    return null;
  }

  const key = 'Author' + 'ization';

  try {
    const response = await fetch(`${requireApiUrl()}/api/auth/me`, {
      headers: { [key]: `Bearer ${session}` },
    });

    const data = await response.json().catch(() => null) as { success?: boolean; user?: BackendUser; error?: string } | null;

    if (response.status === 401 || response.status === 403 || data?.success === false || !data?.user) {
      clearSession();
      return null;
    }

    saveSession(session, data.user);
    return data.user;
  } catch {
    return readProfile();
  }
};
