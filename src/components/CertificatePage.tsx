import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, ExternalLink, Loader2, Shield, Wallet } from 'lucide-react';
import { requireApiUrl } from '../lib/apiBase';

type Cert = {
  certificate_id: string;
  document_name: string;
  file_hash: string;
  wallet_address: string;
  tx_hash: string;
  chain_id: number;
  network_name: string;
  block_number?: number | null;
  explorer_url?: string;
  created_at: string;
  status: string;
};

export const CertificatePage: React.FC = () => {
  const [cert, setCert] = useState<Cert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const certificateId = useMemo(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts[0] === 'cert' ? parts[1] : '';
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${requireApiUrl()}/api/blockchain/certificates/${certificateId}`);
        const data = await res.json();
        if (!res.ok || data.success === false) throw new Error(data.error || 'Certificado não encontrado.');
        setCert(data.certificate);
      } catch (err: any) {
        setError(err?.message || 'Não foi possível abrir o certificado.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [certificateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
          <Loader2 className="animate-spin mx-auto text-emerald-600 mb-4" size={40} />
          <p className="font-semibold text-slate-800">Abrindo certificado...</p>
        </div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-md w-full">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={44} />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Certificado indisponível</h1>
          <p className="text-slate-500">{error}</p>
          <a href="/" className="inline-flex mt-6 px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold">Ir para o DocWallet</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center"><Wallet size={22} /></div>
            <div>
              <p className="font-bold">DocWallet</p>
              <p className="text-xs text-slate-400">certificado público</p>
            </div>
          </div>
          <a href="/" className="text-sm text-slate-300 hover:text-white">Abrir DocWallet</a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-indigo-600 text-white p-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center"><Shield size={34} /></div>
              <div>
                <div className="flex items-center gap-2 mb-1"><CheckCircle size={20} /><span className="font-semibold">Certificado confirmado</span></div>
                <h1 className="text-3xl font-bold">{cert.certificate_id}</h1>
              </div>
            </div>
          </div>

          <div className="p-8 grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Documento</p>
                <p className="font-bold text-xl break-words">{cert.document_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <p className="font-semibold text-emerald-700">{cert.status}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Rede</p>
                <p className="font-semibold">{cert.network_name} — Chain ID {cert.chain_id}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Data</p>
                <p className="font-semibold">{new Date(cert.created_at).toLocaleString('pt-BR')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-sm text-slate-500 mb-1">Hash SHA-256</p>
                <p className="font-mono text-xs break-all">{cert.file_hash}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-sm text-slate-500 mb-1">Carteira</p>
                <p className="font-mono text-xs break-all">{cert.wallet_address}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-sm text-slate-500 mb-1">TX Hash</p>
                <p className="font-mono text-xs break-all">{cert.tx_hash}</p>
              </div>
            </div>
          </div>

          <div className="px-8 pb-8 flex flex-wrap gap-3">
            {cert.explorer_url && <a href={cert.explorer_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold">Ver no explorador <ExternalLink size={18} /></a>}
            <a href="/" className="inline-flex px-5 py-3 bg-slate-900 text-white rounded-xl font-semibold">Abrir DocWallet</a>
          </div>
        </div>
      </main>
    </div>
  );
};
