import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clipboard,
  Download,
  FileSignature,
  Loader2,
  Mail,
  MessageCircle,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import { BackendUser } from '../lib/backendSession';
import { deliverFileToUser } from '../lib/downloadFile';
import { readSignedDocumentPdf } from '../lib/signedDocument';
import {
  createSignatureRequest,
  deliverSignature,
  listSignatureRequests,
  publicSignPathToUrl,
  publicSignUrl,
  readSignatureEvidence,
  readSignatureRequest,
  SignatureParty,
  SignatureRequest,
} from '../lib/signatures';

type NativeSignatureView = 'list' | 'create' | 'detail';

type PartyDraft = {
  name: string;
  email: string;
  phone: string;
};

type Props = {
  user?: BackendUser | null;
  onLogin: () => void;
};

const emptyParty = (): PartyDraft => ({ name: '', email: '', phone: '' });

const statusLabel = (status: string) => {
  if (status === 'completed') return 'Concluído';
  if (status === 'cancelled') return 'Cancelado';
  return 'Aguardando assinatura';
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('pt-BR');
  } catch {
    return value;
  }
};

export const NativeSignaturesPage: React.FC<Props> = ({ user, onLogin }) => {
  const [view, setView] = useState<NativeSignatureView>('list');
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [selected, setSelected] = useState<SignatureRequest | null>(null);
  const [selectedContent, setSelectedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [title, setTitle] = useState('Documento para assinatura');
  const [contractContent, setContractContent] = useState('');
  const [parties, setParties] = useState<PartyDraft[]>([emptyParty()]);

  const totals = useMemo(() => ({
    completed: requests.filter((item) => item.status === 'completed').length,
    pending: requests.filter((item) => item.status !== 'completed' && item.status !== 'cancelled').length,
  }), [requests]);

  const refresh = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    setError('');
    try {
      const loaded = await listSignatureRequests();
      setRequests(loaded);
      if (selected) {
        const next = loaded.find((item) => item.id === selected.id);
        if (next) setSelected(next);
      }
    } catch (err: any) {
      if (!silent) setError(err?.message || 'Não foi possível atualizar suas assinaturas.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [user?.email]);

  useEffect(() => {
    if (!user) return;
    const updateWhenBack = () => {
      if (!document.hidden) refresh(true).catch(() => undefined);
    };
    window.addEventListener('focus', updateWhenBack);
    document.addEventListener('visibilitychange', updateWhenBack);
    return () => {
      window.removeEventListener('focus', updateWhenBack);
      document.removeEventListener('visibilitychange', updateWhenBack);
    };
  }, [user?.email, selected?.id]);

  const openRequest = async (requestId: string) => {
    setError('');
    setNotice('');
    setBusyId(requestId);
    try {
      const detail = await readSignatureRequest(requestId);
      setSelected(detail.request);
      setSelectedContent(detail.contract_content || '');
      setView('detail');
      setRequests((current) => current.map((item) => item.id === detail.request.id ? detail.request : item));
    } catch (err: any) {
      setError(err?.message || 'Não foi possível abrir este fluxo.');
    } finally {
      setBusyId(null);
    }
  };

  const createRequest = async () => {
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const cleanParties = parties
        .map((party) => ({
          name: party.name.trim(),
          email: party.email.trim(),
          phone: party.phone.trim(),
        }))
        .filter((party) => party.name);

      if (!title.trim()) throw new Error('Dê um nome para o documento.');
      if (!contractContent.trim()) throw new Error('Cole ou escreva o documento que será assinado.');
      if (!cleanParties.length) throw new Error('Informe pelo menos uma pessoa que vai assinar.');

      const created = await createSignatureRequest({
        title: title.trim(),
        contractContent: contractContent.trim(),
        parties: cleanParties,
      });

      setRequests((current) => [created, ...current]);
      setSelected(created);
      setSelectedContent(contractContent.trim());
      setView('detail');
      setNotice('Fluxo criado. Agora escolha como enviar para cada pessoa assinar.');
      setTitle('Documento para assinatura');
      setContractContent('');
      setParties([emptyParty()]);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível criar o fluxo de assinatura.');
    } finally {
      setSaving(false);
    }
  };

  const setParty = (index: number, field: keyof PartyDraft, value: string) => {
    setParties((current) => current.map((party, idx) => idx === index ? { ...party, [field]: value } : party));
  };

  const removeParty = (index: number) => {
    setParties((current) => current.length <= 1 ? current : current.filter((_, idx) => idx !== index));
  };

  const partyUrl = (party: SignatureParty) => party.code ? publicSignUrl(party.code) : publicSignPathToUrl(party.url || '');

  const copyLink = async (party: SignatureParty) => {
    const url = partyUrl(party);
    if (!url) return;
    await navigator.clipboard.writeText(url).catch(() => undefined);
    setNotice(`Link de ${party.name} copiado.`);
  };

  const sendEmail = async (req: SignatureRequest, party: SignatureParty) => {
    setError('');
    setNotice('');
    setBusyId(party.id);
    try {
      await deliverSignature(req.id, party.id, 'email');
      setNotice(`Convite enviado por e-mail para ${party.name}.`);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível enviar o e-mail.');
    } finally {
      setBusyId(null);
    }
  };

  const sendWhatsApp = async (req: SignatureRequest, party: SignatureParty) => {
    setError('');
    setNotice('');
    setBusyId(party.id);
    try {
      const result = await deliverSignature(req.id, party.id, 'whatsapp', { phone: party.phone || undefined });
      const url = result.url || result.signUrl || partyUrl(party);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      setNotice(`WhatsApp preparado para ${party.name}.`);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível abrir o envio pelo WhatsApp.');
    } finally {
      setBusyId(null);
    }
  };

  const downloadPdf = async (req: SignatureRequest) => {
    setBusyId(req.id);
    setError('');
    setNotice('');
    try {
      const { blob, filename } = await readSignedDocumentPdf(req.id);
      const result = await deliverFileToUser(blob, filename, 'Documento assinado DocWallet');
      setNotice(result === 'shared'
        ? 'PDF pronto. Escolha onde salvar ou compartilhar no seu celular.'
        : 'PDF baixado.');
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setError(err?.message || 'Não foi possível baixar o PDF assinado.');
    } finally {
      setBusyId(null);
    }
  };

  const downloadEvidence = async (req: SignatureRequest) => {
    setBusyId(req.id);
    setError('');
    setNotice('');
    try {
      const detail = await readSignatureEvidence(req.id);
      const blob = new Blob([JSON.stringify(detail.evidence, null, 2)], { type: 'application/json' });
      await deliverFileToUser(blob, `docwallet-evidencias-${req.id}.json`, 'Evidências DocWallet');
      setNotice('Pacote técnico de evidências pronto para salvar ou compartilhar.');
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setError(err?.message || 'Não foi possível abrir as evidências.');
    } finally {
      setBusyId(null);
    }
  };

  if (!user) {
    return (
      <div className="px-4 py-6">
        <div className="rounded-3xl bg-white border border-slate-200 p-6 text-center shadow-sm">
          <FileSignature className="mx-auto text-indigo-600" size={42} />
          <h2 className="text-2xl font-black text-slate-900 mt-4">Assine e acompanhe</h2>
          <p className="text-sm text-slate-500 mt-2">Entre para enviar documentos e acompanhar quem já assinou.</p>
          <button onClick={onLogin} className="mt-5 w-full min-h-12 rounded-2xl bg-slate-950 text-white font-black">Entrar</button>
        </div>
      </div>
    );
  }

  const feedback = (error || notice) && (
    <div className={`rounded-2xl p-4 flex gap-3 ${error ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'}`}>
      {error ? <AlertCircle size={20} className="shrink-0" /> : <CheckCircle size={20} className="shrink-0" />}
      <p className="text-sm font-semibold">{error || notice}</p>
    </div>
  );

  if (view === 'create') {
    return (
      <div className="px-4 py-5 space-y-4">
        <button onClick={() => setView('list')} className="inline-flex items-center gap-2 text-sm font-black text-slate-700 min-h-10">
          <ArrowLeft size={18} /> Voltar
        </button>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Nova assinatura</p>
          <h2 className="text-2xl font-black text-slate-900 mt-1">O que vamos enviar?</h2>
          <p className="text-sm text-slate-500 mt-1">Documento primeiro. Pessoas depois. Sem complicação.</p>
        </div>

        {feedback}

        <div className="rounded-3xl bg-white border border-slate-200 p-4 space-y-4 shadow-sm">
          <div>
            <label className="text-sm font-black text-slate-800">Nome do documento</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full min-h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:border-indigo-400"
              placeholder="Ex.: Contrato de prestação de serviços"
            />
          </div>

          <div>
            <label className="text-sm font-black text-slate-800">Documento</label>
            <p className="text-xs text-slate-500 mt-1">Cole aqui o texto final que a pessoa vai ler e assinar.</p>
            <textarea
              value={contractContent}
              onChange={(e) => setContractContent(e.target.value)}
              className="mt-2 w-full min-h-[220px] rounded-2xl border border-slate-200 p-4 outline-none focus:border-indigo-400"
              placeholder="Cole ou escreva o documento..."
            />
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 p-4 space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900">Quem vai assinar?</h3>
              <p className="text-xs text-slate-500 mt-1">E-mail ou WhatsApp ajudam no envio.</p>
            </div>
            <button onClick={() => setParties((current) => [...current, emptyParty()])} className="text-sm font-black text-indigo-600 inline-flex items-center gap-1 min-h-10">
              <Plus size={16} /> Outra pessoa
            </button>
          </div>

          {parties.map((party, index) => (
            <div key={index} className="rounded-2xl bg-slate-50 border border-slate-100 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-slate-500">Pessoa {index + 1}</span>
                {parties.length > 1 && (
                  <button onClick={() => removeParty(index)} className="w-9 h-9 rounded-xl text-slate-400 flex items-center justify-center" aria-label="Remover pessoa">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <input value={party.name} onChange={(e) => setParty(index, 'name', e.target.value)} className="w-full min-h-11 rounded-xl border border-slate-200 px-3" placeholder="Nome completo" />
              <input value={party.email} onChange={(e) => setParty(index, 'email', e.target.value)} className="w-full min-h-11 rounded-xl border border-slate-200 px-3" placeholder="E-mail (recomendado)" inputMode="email" />
              <input value={party.phone} onChange={(e) => setParty(index, 'phone', e.target.value)} className="w-full min-h-11 rounded-xl border border-slate-200 px-3" placeholder="WhatsApp +55... (opcional)" inputMode="tel" />
            </div>
          ))}
        </div>

        <button
          onClick={createRequest}
          disabled={saving}
          className="w-full min-h-14 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          Criar e escolher como enviar
        </button>
      </div>
    );
  }

  if (view === 'detail' && selected) {
    const signed = selected.signed_count ?? selected.parties.filter((party) => party.status === 'signed').length;
    const total = selected.total_parties ?? selected.parties.length;
    const completed = selected.status === 'completed';

    return (
      <div className="px-4 py-5 space-y-4">
        <button onClick={() => { setView('list'); setSelected(null); }} className="inline-flex items-center gap-2 text-sm font-black text-slate-700 min-h-10">
          <ArrowLeft size={18} /> Minhas assinaturas
        </button>

        {feedback}

        <div className={`rounded-3xl p-5 border ${completed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-xs font-black uppercase tracking-[0.16em] ${completed ? 'text-emerald-700' : 'text-amber-700'}`}>{statusLabel(selected.status)}</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1 break-words">{selected.title}</h2>
              <p className="text-sm text-slate-500 mt-2">{signed} de {total} assinatura{total === 1 ? '' : 's'} concluída{total === 1 ? '' : 's'}.</p>
            </div>
            {completed ? <CheckCircle size={34} className="text-emerald-600 shrink-0" /> : <FileSignature size={34} className="text-amber-600 shrink-0" />}
          </div>

          {completed && (
            <div className="mt-5 space-y-2">
              <button
                onClick={() => downloadPdf(selected)}
                disabled={busyId === selected.id}
                className="w-full min-h-14 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {busyId === selected.id ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                Baixar PDF assinado
              </button>
              <p className="text-xs text-emerald-800 text-center">No Android, abriremos o menu do celular para você salvar ou compartilhar o PDF.</p>
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 p-4 shadow-sm space-y-3">
          <div>
            <h3 className="font-black text-slate-900">Pessoas</h3>
            <p className="text-xs text-slate-500 mt-1">Cada pessoa recebe um link individual.</p>
          </div>

          {selected.parties.map((party) => {
            const partyBusy = busyId === party.id;
            const signedParty = party.status === 'signed';
            return (
              <div key={party.id} className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 truncate">{party.name}</p>
                    <p className="text-xs text-slate-500 truncate mt-1">{party.email || party.phone || 'Link individual'}</p>
                    {signedParty && <p className="text-xs text-emerald-700 font-bold mt-1">Assinado em {formatDate(party.signed_at)}</p>}
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${signedParty ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {signedParty ? 'Assinado' : 'Pendente'}
                  </span>
                </div>

                {!signedParty && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <button
                      onClick={() => sendEmail(selected, party)}
                      disabled={!party.email || partyBusy}
                      className="min-h-11 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-black flex items-center justify-center gap-1 disabled:opacity-40"
                    >
                      {partyBusy ? <Loader2 className="animate-spin" size={15} /> : <Mail size={15} />} E-mail
                    </button>
                    <button
                      onClick={() => sendWhatsApp(selected, party)}
                      disabled={partyBusy}
                      className="min-h-11 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center justify-center gap-1 disabled:opacity-40"
                    >
                      <MessageCircle size={15} /> WhatsApp
                    </button>
                    <button
                      onClick={() => copyLink(party)}
                      disabled={partyBusy}
                      className="min-h-11 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center justify-center gap-1 disabled:opacity-40"
                    >
                      <Clipboard size={15} /> Link
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <details className="rounded-3xl bg-white border border-slate-200 p-4 shadow-sm">
          <summary className="font-black text-slate-900 cursor-pointer">Ver documento</summary>
          <div className="mt-4 whitespace-pre-wrap text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-2xl p-4 border border-slate-100">{selectedContent || 'Conteúdo indisponível.'}</div>
        </details>

        {completed && (
          <button
            onClick={() => downloadEvidence(selected)}
            disabled={busyId === selected.id}
            className="w-full min-h-12 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <ShieldCheck size={18} /> Evidências técnicas
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Assinar</p>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Minhas assinaturas</h2>
          <p className="text-sm text-slate-500 mt-1">Envie, acompanhe e baixe o documento final.</p>
        </div>
        <button
          onClick={() => setView('create')}
          className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm active:scale-95 shrink-0"
          aria-label="Nova assinatura"
        >
          <Plus size={22} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
          <p className="text-2xl font-black text-amber-700">{totals.pending}</p>
          <p className="text-xs font-bold text-amber-700 mt-1">aguardando</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
          <p className="text-2xl font-black text-emerald-700">{totals.completed}</p>
          <p className="text-xs font-bold text-emerald-700 mt-1">concluídos</p>
        </div>
      </div>

      {feedback}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Ao voltar para o app, o status atualiza automaticamente.</p>
        <button onClick={() => refresh()} disabled={loading} className="min-h-10 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-black inline-flex items-center gap-1 disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" size={15} /> : <RefreshCw size={15} />} Atualizar
        </button>
      </div>

      {requests.length === 0 && !loading ? (
        <div className="rounded-3xl bg-white border border-slate-200 p-7 text-center shadow-sm">
          <UserRound size={38} className="mx-auto text-slate-300" />
          <h3 className="font-black text-slate-900 mt-3">Nenhum documento enviado ainda</h3>
          <p className="text-sm text-slate-500 mt-1">Crie seu primeiro fluxo de assinatura em poucos passos.</p>
          <button onClick={() => setView('create')} className="mt-5 min-h-12 px-5 rounded-2xl bg-indigo-600 text-white font-black">Nova assinatura</button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const signed = req.signed_count ?? req.parties.filter((party) => party.status === 'signed').length;
            const total = req.total_parties ?? req.parties.length;
            const completed = req.status === 'completed';
            return (
              <div key={req.id} className="rounded-3xl bg-white border border-slate-200 p-4 shadow-sm">
                <button onClick={() => openRequest(req.id)} className="w-full text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 break-words">{req.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{signed}/{total} assinaram • {formatDate(req.created_at)}</p>
                    </div>
                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-full shrink-0 ${completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {completed ? 'Concluído' : 'Pendente'}
                    </span>
                  </div>
                </button>

                {completed ? (
                  <button
                    onClick={() => downloadPdf(req)}
                    disabled={busyId === req.id}
                    className="mt-4 w-full min-h-12 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {busyId === req.id ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                    Baixar PDF assinado
                  </button>
                ) : (
                  <button
                    onClick={() => openRequest(req.id)}
                    disabled={busyId === req.id}
                    className="mt-4 w-full min-h-11 rounded-2xl bg-slate-950 text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {busyId === req.id ? <Loader2 className="animate-spin" size={17} /> : <FileSignature size={17} />}
                    Ver envio e andamento
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
