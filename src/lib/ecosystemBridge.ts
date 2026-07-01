import { requireApiUrl } from './apiBase';
import { saveSession, BackendUser } from './backendSession';

export const enterWithExternalProfile = async (profile: { email: string; name?: string; fullName?: string }): Promise<BackendUser> => {
  if (!profile.email) throw new Error('Perfil sem e-mail.');

  const response = await fetch(`${requireApiUrl()}/api/bridge/nexa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: profile }),
  });
  const data = await response.json();

  if (!response.ok || data.success === false || !data.token) {
    throw new Error(data.error || 'Erro ao criar sessão.');
  }

  saveSession(data.token, data.user);
  return data.user;
};
