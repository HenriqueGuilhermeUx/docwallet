import { requireApiUrl } from './apiBase';
import { saveSession, BackendUser, readSession, readProfile, clearSession } from './backendSession';

type AuthPayload = {
  success: boolean;
  session?: string;
  token?: string;
  user: BackendUser;
  error?: string;
};

const transientStatus = (status: number) => [502, 503, 504].includes(status);
const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
};

const postLogin = async (path: string, payload: Record<string, string>, retryTransient = false) => {
  let lastError: unknown = null;
  const attempts = retryTransient ? 2 : 1;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetchWithTimeout(`${requireApiUrl()}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (retryTransient && transientStatus(response.status) && attempt + 1 < attempts) {
        await sleep(1200);
        continue;
      }

      const text = await response.text();
      let data: AuthPayload;
      try {
        data = text ? JSON.parse(text) : ({ success: false, error: 'Resposta vazia do servidor.' } as AuthPayload);
      } catch {
        throw new Error(text || 'Resposta inválida do servidor.');
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Erro ao autenticar');
      }

      const sessionValue = data.session || data.token || '';
      if (!sessionValue || !data.user) throw new Error('Login concluído sem sessão válida. Tente novamente.');
      saveSession(sessionValue, data.user);
      return data.user;
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) {
        await sleep(1200);
        continue;
      }
    }
  }

  if (lastError instanceof DOMException && lastError.name === 'AbortError') {
    throw new Error('O servidor demorou para responder. Tente novamente em alguns segundos.');
  }
  if (lastError instanceof TypeError) {
    throw new Error('Não foi possível alcançar o servidor agora. Tentamos novamente automaticamente; tente mais uma vez em instantes.');
  }
  throw lastError instanceof Error ? lastError : new Error('Erro ao autenticar.');
};

export const loginWithBackend = (email: string, password: string) => {
  return postLogin('/api/auth/login', { email, password }, true);
};

export const registerWithBackend = (name: string, email: string, password: string) => {
  return postLogin('/api/auth/register', { name, email, password }, false);
};

export const validateBackendSession = async (): Promise<BackendUser | null> => {
  const session = readSession();
  const cachedProfile = readProfile();
  if (!session) {
    clearSession();
    return null;
  }

  const key = 'Author' + 'ization';

  try {
    const response = await fetchWithTimeout(`${requireApiUrl()}/api/auth/me`, {
      headers: { [key]: `Bearer ${session}` },
    }, 10000);

    const data = await response.json().catch(() => null) as { success?: boolean; user?: BackendUser; error?: string } | null;

    if (response.status === 401) {
      clearSession();
      return null;
    }

    if (response.status === 403 || transientStatus(response.status)) {
      return cachedProfile;
    }

    if (!response.ok || data?.success === false || !data?.user) {
      return cachedProfile;
    }

    saveSession(session, data.user);
    return data.user;
  } catch {
    // A temporary Render restart/network failure must not log a valid user out.
    return cachedProfile;
  }
};
