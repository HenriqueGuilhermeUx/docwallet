import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, FileSignature, Loader2, Shield, Wallet } from 'lucide-react';
import { acceptSignature, readPublicSignature } from '../lib/signatures';

type PublicData = {
  request: {
    title: string;
    content_hash: string;
    final_hash?: string | null;
    status: string;
    parties: { name: string; email?: string; status: string; signed_at?: string | null }[];
  };
  party: { name: string; email?: string; status: string };
  contract_content: string;
};

export const SignPage: React.FC = () => {
  const [data, setData] = useState<PublicData | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const code = useMemo(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts[0] === 'sign' ? parts[1] : '';
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const loaded = await readPublicSignature(code);
        setData(loaded);
        setName(loaded.party?.name || '');
        setEmail(loaded.party?.email || '');
      } catch (err: any) {
        setError(err?.message || 'Link indisponível.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [code]);

  const handleAccept = async () => {
    setError('');
    setSubmitting(true);
    try {
      await acceptSignature(code, { name, email });
      setSuccess(true);
      const loaded = await readPublicSignature(code);
      setData(loaded);
    } catch (err: any) {
      setError(err?.message || 'Erro ao assinar.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
          <Loader2 className="animate-spin mx-auto text-indigo-600 mb-4" size={40} />
          <p className="font-semibold text-slate-800">Abrindo assinatura...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-md w-full">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={44} />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Link indisponível</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  const alreadySigned = data?.party?.status === 'signed' || success;
  const completed = data?.request?.status === 'completed';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><Wallet size={22} /></div>
            <div><p className="font-bold">DocWallet</p><p className="text-xs text-slate-400">assinatura eletrônica</p></div>
          </div>
          {completed && <span className="text-xs bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-full">Contrato completo</span>}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[380px_1fr] gap-6">
        <aside className="bg-white text-slate-900 rounded-2xl p-6 shadow-2xl h-fit">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4"><FileSignature size={28} /></div>
          <h1 className="text-2xl font-bold leading-tight break-words">{data?.request.title}</h1>
          <p className="text-sm text-slate-500 mt-2">Leia o contrato e confirme sua assinatura eletrônica.</p>

          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Hash original SHA-256</p>
            <p className="text-xs font-mono break-all text-slate-700">{data?.request.content_hash}</p>
          </div>

          {data?.request.final_hash && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-xs text-emerald-700 mb-1">Hash final assinado</p>
              <p className="text-xs font-mono break-all text-emerald-800">{data.request.final_hash}</p>
            </div>
          )}

          <div className="mt-5 space-y-2">
            {data?.request.parties.map((party, index) => (
              <div key={index} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-sm">
                <div><p className="font-semibold">{party.name}</p><p className="text-slate-500 text-xs">{party.email}</p></div>
                <span className={party.status === 'signed' ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>{party.status === 'signed' ? 'assinado' : 'pendente'}</span>
              </div>
            ))}
          </div>

          {alreadySigned ? (
            <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-emerald-800 flex gap-3">
              <CheckCircle size={22} />
              <div><p className="font-bold">Assinatura registrada</p><p className="text-sm">Sua evidência foi salva com data, IP, navegador e hash do contrato.</p></div>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" className="w-full px-4 py-3 border border-slate-300 rounded-xl" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu e-mail" className="w-full px-4 py-3 border border-slate-300 rounded-xl" />
              <label className="flex gap-3 text-sm text-slate-600"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /> Li, aceito e desejo assinar eletronicamente este contrato.</label>
              {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>}
              <button onClick={handleAccept} disabled={!accepted || !name || submitting} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18} />}
                Assinar eletronicamente
              </button>
            </div>
          )}
        </aside>

        <section className="bg-white text-slate-900 rounded-2xl min-h-[70vh] overflow-auto p-8">
          <pre className="whitespace-pre-wrap font-sans leading-relaxed text-sm">{data?.contract_content}</pre>
        </section>
      </main>
    </div>
  );
};
