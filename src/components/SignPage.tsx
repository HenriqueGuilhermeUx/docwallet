import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Copy, FileSignature, KeyRound, Loader2, Send, Shield, Wallet } from 'lucide-react';
import { acceptSignature, publicSignPathToUrl, readPublicSignature } from '../lib/signatures';
import { getIcpSignatureConfig, IcpSignatureConfig, IcpSignatureSession, startPublicIcpSignature } from '../lib/icpSignature';

type NextParty = {
  name: string;
  email?: string;
  url: string;
  code: string;
};

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
  next_party?: NextParty | null;
};

export const SignPage: React.FC = () => {
  const [data, setData] = useState<PublicData | null>(null);
  const [nextParty, setNextParty] = useState<NextParty | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [icpAccepted, setIcpAccepted] = useState(false);
  const [icpConfig, setIcpConfig] = useState<IcpSignatureConfig | null>(null);
  const [icpSession, setIcpSession] = useState<IcpSignatureSession | null>(null);
  const [icpLoading, setIcpLoading] = useState(false);
  const [icpNotice, setIcpNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts[0] === 'sign' ? parts[1] : '';
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [loaded, config] = await Promise.all([
          readPublicSignature(code),
          getIcpSignatureConfig().catch(() => null),
        ]);
        setData(loaded);
        setIcpConfig(config);
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
      const signed = await acceptSignature(code, { name, email });
      setSuccess(true);
      setData(signed);
      setNextParty(signed.next_party || null);
    } catch (err: any) {
      setError(err?.message || 'Erro ao assinar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIcpSign = async () => {
    setError('');
    setIcpNotice('');
    setIcpLoading(true);
    try {
      const result = await startPublicIcpSignature(code);
      setIcpConfig(result.config);
      setIcpSession(result.session);
      if (result.session.redirectUrl) {
        window.location.href = result.session.redirectUrl;
        return;
      }
      const metadataMessage = typeof result.session.metadata?.message === 'string' ? result.session.metadata.message : '';
      setIcpNotice(metadataMessage || result.config.statusMessage || 'Assinatura ICP-Brasil preparada. Configure o provider para assinar com certificado digital.');
    } catch (err: any) {
      setError(err?.message || 'Erro ao iniciar assinatura ICP-Brasil.');
    } finally {
      setIcpLoading(false);
    }
  };

  const nextPartyUrl = nextParty ? publicSignPathToUrl(nextParty.url) : '';
  const icpSessionMessage = typeof icpSession?.metadata?.message === 'string' ? icpSession.metadata.message : '';

  const copyNextLink = async () => {
    if (!nextPartyUrl) return;
    await navigator.clipboard.writeText(nextPartyUrl).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendByWhatsApp = () => {
    if (!nextPartyUrl || !nextParty) return;
    const text = encodeURIComponent(`Olá, ${nextParty.name}. Você recebeu um contrato para assinar eletronicamente no DocWallet: ${nextPartyUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
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
  const icpReady = Boolean(icpConfig?.configured && icpConfig?.enabled);

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
            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-emerald-800 flex gap-3">
                <CheckCircle size={22} />
                <div><p className="font-bold">Assinatura registrada</p><p className="text-sm">Sua evidência foi salva com data, IP, navegador e hash do contrato.</p></div>
              </div>

              {nextParty && (
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-indigo-900">
                  <p className="font-bold">Enviar para próxima parte</p>
                  <p className="text-sm mt-1">Agora envie o link para {nextParty.name} assinar.</p>
                  <input value={nextPartyUrl} readOnly className="mt-3 w-full px-3 py-2 rounded-lg border border-indigo-100 text-xs text-slate-700" />
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button onClick={copyNextLink} className="py-2 bg-slate-900 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
                      <Copy size={16} /> {copied ? 'Copiado' : 'Copiar'}
                    </button>
                    <button onClick={sendByWhatsApp} className="py-2 bg-emerald-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
                      <Send size={16} /> WhatsApp
                    </button>
                  </div>
                </div>
              )}

              {!nextParty && completed && (
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-slate-700 text-sm">
                  Todas as partes assinaram. O contrato está completo e já possui hash final assinado.
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" className="w-full px-4 py-3 border border-slate-300 rounded-xl" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu e-mail" className="w-full px-4 py-3 border border-slate-300 rounded-xl" />
              <label className="flex gap-3 text-sm text-slate-600"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /> Li, aceito e desejo assinar eletronicamente este contrato.</label>
              {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>}
              <button onClick={handleAccept} disabled={!accepted || !name || submitting} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18} />}
                Assinar eletronicamente com evidências
              </button>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <KeyRound className="text-slate-700 mt-0.5" size={20} />
                  <div>
                    <p className="font-bold text-slate-900">Assinar com certificado digital ICP-Brasil</p>
                    <p className="text-xs text-slate-500 mt-1">{icpConfig?.safeLabel || 'Assinatura qualificada depende de certificado digital ICP-Brasil e provider configurado.'}</p>
                  </div>
                </div>
                <label className="mt-3 flex gap-3 text-sm text-slate-600"><input type="checkbox" checked={icpAccepted} onChange={(e) => setIcpAccepted(e.target.checked)} /> Entendo que a assinatura qualificada depende do meu certificado digital ICP-Brasil.</label>
                <button onClick={handleIcpSign} disabled={!icpAccepted || icpLoading} className={`mt-3 w-full py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 ${icpReady ? 'bg-slate-950 text-white hover:bg-slate-800' : 'bg-white text-slate-700 border border-slate-200'}`}>
                  {icpLoading ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
                  {icpReady ? 'Assinar com certificado digital' : 'Preparar assinatura ICP-Brasil'}
                </button>
                {(icpNotice || icpSession) && (
                  <div className="mt-3 rounded-lg bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800">
                    {icpNotice || icpSessionMessage || 'Provider ICP-Brasil ainda não configurado.'}
                  </div>
                )}
              </div>
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
