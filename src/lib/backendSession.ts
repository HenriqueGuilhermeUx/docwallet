export interface BackendUser {
  id: string;
  email: string;
  name?: string;
  plan?: string;
}

const KEY_A = 'docwallet_api_session';
const KEY_B = 'docwallet_api_profile';

export const readSession = () => window.localStorage.getItem(KEY_A);

export const readProfile = (): BackendUser | null => {
  const raw = window.localStorage.getItem(KEY_B);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveSession = (sessionValue: string, profile: BackendUser) => {
  window.localStorage.setItem(KEY_A, sessionValue);
  window.localStorage.setItem(KEY_B, JSON.stringify(profile));
};

export const clearSession = () => {
  window.localStorage.removeItem(KEY_A);
  window.localStorage.removeItem(KEY_B);
};
