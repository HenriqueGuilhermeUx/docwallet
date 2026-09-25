export interface BackendUser {
  id: string;
  email: string;
  name?: string;
  plan?: string;
}

const KEY_A = 'docwallet_api_session';
const KEY_B = 'docwallet_api_profile';
export const SESSION_CHANGE_EVENT = 'docwallet-session-change';

const notifySessionChange = (profile: BackendUser | null) => {
  try {
    window.dispatchEvent(new CustomEvent(SESSION_CHANGE_EVENT, { detail: profile }));
  } catch {
    // Browsers without CustomEvent support still persist the session normally.
  }
};

export const readSession = () => {
  try {
    return window.localStorage.getItem(KEY_A);
  } catch {
    return null;
  }
};

export const readProfile = (): BackendUser | null => {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY_B);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveSession = (sessionValue: string, profile: BackendUser) => {
  try {
    window.localStorage.setItem(KEY_A, sessionValue);
    window.localStorage.setItem(KEY_B, JSON.stringify(profile));
  } finally {
    notifySessionChange(profile);
  }
};

export const clearSession = () => {
  try {
    window.localStorage.removeItem(KEY_A);
    window.localStorage.removeItem(KEY_B);
  } finally {
    notifySessionChange(null);
  }
};

export const hasSession = () => Boolean(readSession());

export const authExpiredMessage = 'Sua sessão expirou. Entre novamente para continuar.';
export const permissionDeniedMessage = 'Sua sessão continua ativa, mas esta ação não está autorizada para sua conta.';

export const handleAuthFailure = (status = 401) => {
  if (status === 401) {
    clearSession();
    return authExpiredMessage;
  }
  return permissionDeniedMessage;
};
