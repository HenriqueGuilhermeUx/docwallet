import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, FileText, Loader2, Wallet } from 'lucide-react';
import { requireApiUrl } from '../lib/apiBase';

type PublicDocData = {
  name: string;
  file_type: string;
  file_size: number;
  file_hash?: string;
};

type PublicDocInfo = {
  expires_at: string;
  max_views?: number | null;
  view_count: number;
  file_url: string;
};

export const PublicDoc: React.FC = () => {
  const [doc, setDoc] = useState<PublicDocData | null>(null);
  const [info, setInfo] = useState<PublicDocInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const code = useMemo(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts[0] === 'share' ? parts[1] : '';
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${requireApiUrl()}/api/shared/${code}`);
        const data = await res.json();
        if (!res.ok || data.success === false) throw new Error(data.error || 'Link indisponível.');
        setDoc(data.document);
        setInfo(data.share);
      } catch (err: any) {
        setError(err?.message || 'Não foi possível abrir este link.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
          <Loader2 className="animate-spin mx-auto text-indigo-600 mb-4" size={40} />
          <p className="font-semibold text-slate-800">Abrindo documento seguro...</p>
        </div>
      </div>
    );
  }

  if (error || !doc || !info) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-md w-full">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={44} />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Link indisponível</h1>
          <p className="text-slate-500">{error || 'Este link expirou ou foi revogado.'}</p>
          <a href="/" className="inline-flex mt-6 px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold">Ir para o DocWallet</a>
        </div>
      </div>
    );
  }

  const fileUrl = `${requireApiUrl()}${info.file_url}`;
  const size = doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : '-';
  const expiry = new Date(info.expires_at).toLocaleString('pt-BR');
  const isPdf = doc.file_type === 'application/pdf';
  const isImage = doc.file_type?.startsWith('image/');

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><Wallet size={22} /></div>
            <div>
              <p className="font-bold">DocWallet</p>
              <p className="text-xs text-slate-400">compartilhamento seguro</p>
            </div>
          </div>
          <a href="/" className="text-sm text-slate-300 hover:text-white">Abrir DocWallet</a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[360px_1fr] gap-6">
        <aside className="bg-white text-slate-900 rounded-2xl p-6 shadow-2xl h-fit">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4"><FileText size={28} /></div>
          <h1 className="text-2xl font-bold leading-tight break-words">{doc.name}</h1>
          <p className="text-sm text-slate-500 mt-2">Arquivo compartilhado com segurança via DocWallet.</p>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-t border-slate-100 pt-3"><span className="text-slate-500">Tipo</span><span className="font-medium text-right">{doc.file_type || 'arquivo'}</span></div>
            <div className="flex justify-between gap-4 border-t border-slate-100 pt-3"><span className="text-slate-500">Tamanho</span><span className="font-medium">{size}</span></div>
            <div className="flex justify-between gap-4 border-t border-slate-100 pt-3"><span className="text-slate-500">Expira em</span><span className="font-medium text-right">{expiry}</span></div>
            <div className="flex justify-between gap-4 border-t border-slate-100 pt-3"><span className="text-slate-500">Acessos</span><span className="font-medium">{info.view_count}/{info.max_views || 'sem limite'}</span></div>
          </div>

          {doc.file_hash && <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100"><p className="text-xs text-slate-500 mb-1">SHA-256</p><p className="text-xs font-mono break-all text-slate-700">{doc.file_hash}</p></div>}

          <a href={fileUrl} target="_blank" rel="noreferrer" className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-center block">Abrir arquivo</a>
        </aside>

        <section className="bg-white/5 border border-white/10 rounded-2xl min-h-[70vh] overflow-hidden flex items-center justify-center">
          {isPdf ? <iframe src={fileUrl} title={doc.name} className="w-full h-[80vh] bg-white" /> : isImage ? <img src={fileUrl} alt={doc.name} className="max-w-full max-h-[80vh] object-contain" /> : <div className="text-center p-8"><FileText className="mx-auto text-slate-500 mb-4" size={64} /><p className="text-slate-300 font-semibold">Pré-visualização não disponível</p><p className="text-slate-500 text-sm mt-1">Use o botão para abrir o arquivo.</p></div>}
        </section>
      </main>
    </div>
  );
};
