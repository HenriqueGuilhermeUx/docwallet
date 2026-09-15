import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Link2, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import type { BackendUser } from '../lib/backendSession';
import { connectNexOffice } from '../lib/nexofficeBridge';

type Status = 'idle' | 'waiting_auth' | 'connecting' | 'connected' | 'error';

export function NexOfficeConnectFlow({ user, onLogin }: { user: BackendUser | null; onLogin: () => void }) {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const token = params.get('nexoffice_connect') || '';
  const workspaceId = params.get('nexoffice_workspace') || '';
  const [status, setStatus] = useState<Status>(token ? (user ? 'connecting' : 'waiting_auth') : 'idle');
  const [message, setMessage] = useState('');
  const attempted = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (!user) {
      setStatus('waiting_auth');
      return;
    }
    if (attempted.current) return;
    attempted.current = true;
    setStatus('connecting');
    setMessage('');

    connectNexOffice(token)
      .then((connection) => {
        setStatus('connected');
        setMessage(`DocWallet conectado ao workspace ${connection.workspaceId}.`);
        const url = new URL(window.location.href);
        url.searchParams.delete('nexoffice_connect');
        url.searchParams.delete('nexoffice_workspace');
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Não foi possível concluir a conexão.');
      });
  }, [token, user]);

  if (!token && status === 'idle') return null;

  const nexOfficeUrl = String(import.meta.env.VITE_NEXOFFICE_URL || '').replace(/\/$/, '');
  const workspaceLabel = workspaceId ? `Workspace ${workspaceId.slice(0, 8)}…` : 'NexOffice';

  return (
    <div className="max-w-6xl mx-auto px-4 pt-4">
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-sky-50 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              {status === 'connected' ? <CheckCircle2 size={22} /> : status === 'error' ? <XCircle size={22} /> : <Link2 size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">Conectar DocWallet ao NexOffice</h3>
                <ShieldCheck size={16} className="text-emerald-600" />
              </div>
              <p className="text-sm text-slate-600 mt-1">
                {status === 'waiting_auth' && `Entre no DocWallet para autorizar ${workspaceLabel}. Nenhum arquivo bruto será copiado para o NexOffice.`}
                {status === 'connecting' && 'Validando a autorização e vinculando sua conta com segurança…'}
                {status === 'connected' && (message || 'Conexão concluída com sucesso.')}
                {status === 'error' && (message || 'Não foi possível concluir a conexão.')}
              </p>
              <p className="text-xs text-slate-500 mt-2">A conexão pode ser revogada no DocWallet. O NexOffice recebe apenas referências, estados e resultados necessários às ações autorizadas.</p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {status === 'waiting_auth' && (
              <button onClick={onLogin} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors">
                Entrar e autorizar
              </button>
            )}
            {status === 'connecting' && (
              <div className="px-4 py-2.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 font-medium text-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Conectando
              </div>
            )}
            {status === 'connected' && nexOfficeUrl && (
              <a href={nexOfficeUrl} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors">
                Voltar ao NexOffice
              </a>
            )}
            {status === 'error' && (
              <button onClick={() => window.location.reload()} className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">
                Tentar novamente
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
