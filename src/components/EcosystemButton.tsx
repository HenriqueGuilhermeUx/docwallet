import { KeyRound } from 'lucide-react';

export const EcosystemButton: React.FC = () => {
  const handleClick = () => {
    const portalUrl = import.meta.env.VITE_ECOSYSTEM_LOGIN_URL;

    if (!portalUrl) {
      alert('Abra pelo portal para usar esta entrada.');
      return;
    }

    const redirectUrl = encodeURIComponent(window.location.origin + window.location.pathname);
    window.location.href = `${portalUrl}?redirect=${redirectUrl}`;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
    >
      <KeyRound size={18} />
      Entrar pelo ecossistema
    </button>
  );
};
