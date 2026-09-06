import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  FileSignature,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  UserCheck,
} from 'lucide-react';
import {
  cancelSignatureRequest,
  createSignatureReminder,
  createSignatureRequest,
  listSignatureRequests,
  publicSignPathToUrl,
  publicSignUrl,
  readSignatureEvidence,
  readSignatureRequest,
  SignatureParty,
  SignatureRequest,
} from '../lib/signatures';
import { BackendUser } from '../lib/backendSession';

interface SignaturesPageProps {
  user?: BackendUser | null;
  onLogin: () => void;
}

type PartyDraft = {
  name: string;
  email: string;
};

const initialContract = `CONTRATO DIGITAL DOCWALLET DOCS\n\nPARTES\nParte A: ________________________________\nParte B: ________________________________\n\nOBJETO\nDescreva aqui o objeto do contrato, obrigação, serviço, entrega ou acordo.\n\nVALOR E CONDIÇÕES\nDescreva valores, prazos, forma de pagamento e condições principais.\n\nASSINATURA ELETRÔNICA\nAs partes declaram que leram, compreenderam e aceitam assinar este documento eletronicamente pelo DocWallet Docs. O aceite eletrônico registra evidências técnicas, data, IP, navegador e hash SHA-256 do conteúdo.\n`;

const statusLabel = (status: string) => {
  if (status === 'completed') return 'Concluído';
  if (status === 'cancelled') return 'Cancelado';
  return 'Pendente';
};

const statusClass = (status: string) => {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'cancelled') return 'bg-red-50 text-red-700 border-red-100';
  return 'bg-amber-50 text-amber-700 border-amber-100';
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('pt-BR');
  } catch {
    return value;
  }
};

const downloadText = (filename: string, content: string, type = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const SignaturesPage: React.FC<SignaturesPageProps> = ({ user, onLogin }) => {
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [selected, setSelected] = useState<SignatureRequest | null>(null);
  const [selectedContent, setSelectedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [title, setTitle] = useState('Contrato de Prestação de Serviços');
  const [contractContent, setContractContent] = useState(initialContract);
  const [parties, setParties] = useState<PartyDraft[]>([
    { name: '', email: '' },
    { name: '', email: '' },
  ]);

  const totals = useMemo(() => {
    const total = requests.length;
    const completed = requests.filter((item) => item.status === 'completed').length;
    const pending = requests.filter((item) => item.status !== 'completed' && item.status !== 'cancelled').length;
    const signatures = requests.reduce((sum, item) => sum + (item.signed_count || item.parties.filter((p) => p.status === 'signed').length), 0);
    return { total, completed, pending, signatures };
  }, [requests]);

  const refresh = async () => {
    if (!user) return;
    setError('');
    setLoading(true);
    try {
      const loaded = await listSignatureRequests();
      setRequests(loaded);
      if (selected) {
        const next = loaded.find((item) => item.id === selected.id) || null;
        setSelected(next);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar assinaturas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [user?.email]);

  const loadDetails = async (requestId: string) => {
    setError('');
    setBusyId(requestId);
    try {
      const detail = await readSignatureRequest(requestId);
      setSelected(detail.request);
      setSelectedContent(detail.contract_content || '');
      setRequests((current) => current.map((item) => item.id === detail.request.id ? detail.request : item));
    } catch (err: any) {
      setError(err?.message || 'Erro ao abrir assinatura.');
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
        .map((item) => ({ name: item.name.trim(), email: item.email.trim() }))
        .filter((item) => item.name);
      if (!title.trim()) throw new Error('Informe o título do documento.');
      if (!contractContent.trim()) throw new Error('Cole ou escreva o conteúdo do documento.');
      if (cleanParties.length < 1) throw new Error('Informe pelo menos uma pessoa para assinar.');
      const created = await createSignatureRequest({
        title: title.trim(),
        contractContent: contractContent.trim(),
        parties: cleanParties,
      });
      setRequests((current) => [created, ...current]);
      setSelected(created);
      setSelectedContent(contractContent.trim());
      setNotice('Solicitação criada. Copie os links ou envie por WhatsApp/e-mail.');
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar assinatura.');
    } finally {
      setSaving(false);
    }
  };

  const setParty = (index: number, field: keyof PartyDraft, value: string) => {
    setParties((current) => current.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
  };

  const addParty = () => setParties((current) => [...current, { name: '', email: '' }]);

  const removeParty = (index: number) => {
    setParties((current) => current.length <= 1 ? current : current.filter((_, idx) => idx !== index));
  };

  const copy = async (value: string, message = 'Copiado.') => {
    await navigator.clipboard.writeText(value).catch(() => undefined);
    setNotice(message);
  };

  const partyUrl = (party: SignatureParty) => party.code ? publicSignUrl(party.code) : publicSignPathToUrl(party.url || '');

  const sendWhatsApp = (party: SignatureParty) => {
    const url = partyUrl(party);
    if (!url) return;
    const text = encodeURIComponent(`Olá, ${party.name}. Você recebeu um documento para assinar eletronicamente no DocWallet Docs: ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const sendEmail = (party: SignatureParty, req: SignatureRequest) => {
    const url = partyUrl(party);
    const subject = encodeURIComponent(`Assinatura eletrônica: ${req.title}`);
    const body = encodeURIComponent(`Olá, ${party.name}.\n\nVocê recebeu um documento para assinar eletronicamente no DocWallet Docs.\n\nAcesse: ${url}\n\nObrigado.`);
    window.location.href = `mailto:${party.email || ''}?subject=${subject}&body=${body}`;
  };

  const remind = async (req: SignatureRequest, party?: SignatureParty) => {
    setError('');
    setBusyId(party?.id || req.id);
    try {
      const reminder = await createSignatureReminder(req.id, party?.id);
      await copy(publicSignPathToUrl(reminder.url), `Lembrete pronto para ${reminder.party.name}. Link copiado.`);
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Erro ao gerar lembrete.');
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (req: SignatureRequest) => {
    if (!confirm('Cancelar esta solicitação de assinatura?')) return;
    setError('');
    setBusyId(req.id);
    try {
      const updated = await cancelSignatureRequest(req.id);
      setRequests((current) => current.map((item) => item.id === updated.id ? updated : item));
      if (selected?.id === updated.id) setSelected(updated);
      setNotice('Solicitação cancelada.');
    } catch (err: any) {
      setError(err?.message || 'Erro ao cancelar assinatura.');
    } finally {
      setBusyId(null);
    }
  };

  const downloadEvidence = async (req: SignatureRequest) => {
    setBusyId(req.id);
    setError('');
    try {
      const detail = await readSignatureEvidence(req.id);
      downloadText(`docwallet-evidencias-${req.id}.json`, JSON.stringify(detail.evidence, null, 2), 'application/json;charset=utf-8');
    } catch (err: any) {
      setError(err?.message || 'Erro ao baixar evidências.');
    } finally {
      setBusyId(null);
    }
  };

  const downloadSignedPackage = async (req: SignatureRequest) => {
    setBusyId(req.id);
    setError('');
    try {
      const detail = await readSignatureEvidence(req.id);
      const lines = [
        'DOCWALLET DOCS — DOCUMENTO ASSINADO ELETRONICAMENTE',
        '',
        `Título: ${req.title}`,
        `Status: ${statusLabel(req.status)}`,
        `Criado em: ${formatDate(req.created_at)}`,
        `Concluído em: ${formatDate(req.completed_at)}`,
        `Hash original SHA-256: ${req.content_hash}`,
        `Hash final SHA-256: ${req.final_hash || 'Aguardando conclusão'}`,
        '',
        'PARTES',
        ...detail.evidence.parties.map((p: any) => `- ${p.name} <${p.email || ''}> — ${p.status === 'signed' ? 'assinado' : 'pendente'} — ${formatDate(p.signed_at)} — IP: ${p.ip_address || '-'}`),
        '',
        'CONTEÚDO',
        detail.contract_content || selectedContent || '',
        '',
        'EVIDÊNCIAS JSON',
        JSON.stringify(detail.evidence, null, 2),
      ];
      downloadText(`docwallet-documento-assinado-${req.id}.txt`, lines.join('\n'));
    } catch (err: any) {
      setError(err?.message || 'Erro ao baixar documento assinado.');
    } finally {
      setBusyId(null);
    }
  };

  if (!user) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-card p-8 text-center">
          <FileSignature className="mx-auto text-indigo-600 mb-4" size={48} />
          <h1 className="text-3xl font-black text-slate-900">Assinaturas DocWallet Docs</h1>
          <p className="text-slate-600 mt-3 max-w-2xl mx-auto">Entre para criar documentos, adicionar destinatários, acompanhar assinaturas e baixar evidências digitais.</p>
          <button onClick={onLogin} className="mt-6 px-7 py-3 bg-indigo-600 text-white rounded-full font-bold">Entrar ou criar conta</button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <section className="bg-slate-950 text-white rounded-[2rem] p-6 md:p-8 overflow-hidden relative">
        <div className="absolute right-0 top-0 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 grid lg:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-3 py-1 rounded-full text-sm font-semibold mb-4">
              <ShieldCheck size={16} /> Assinatura eletrônica com evidências
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight">Envie documentos, colete assinaturas e acompanhe tudo.</h1>
            <p className="text-slate-300 mt-3 max-w-3xl">Crie links individuais, veja quem já assinou, envie lembretes, baixe pacote de evidências e gere hash final quando todas as partes concluírem.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 min-w-[260px]">
            <div className="bg-white/10 border border-white/10 rounded-2xl p-4"><p className="text-2xl font-black">{totals.total}</p><p className="text-xs text-slate-300">documentos</p></div>
            <div className="bg-white/10 border border-white/10 rounded-2xl p-4"><p className="text-2xl font-black">{totals.pending}</p><p className="text-xs text-slate-300">pendentes</p></div>
            <div className="bg-white/10 border border-white/10 rounded-2xl p-4"><p className="text-2xl font-black">{totals.signatures}</p><p className="text-xs text-slate-300">assinaturas</p></div>
          </div>
        </div>
      </section>

      {(error || notice) && (
        <div className={`rounded-2xl p-4 flex gap-3 ${error ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
          {error ? <AlertCircle size={22} /> : <CheckCircle size={22} />}
          <p className="text-sm font-medium">{error || notice}</p>
        </div>
      )}

      <section className="grid xl:grid-cols-[420px_1fr] gap-6 items-start">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Nova assinatura</h2>
              <p className="text-sm text-slate-500">Cole o documento e adicione as partes.</p>
            </div>
            <FileSignature className="text-indigo-600" />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-xl px-4 py-3" />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Documento / contrato</label>
            <textarea value={contractContent} onChange={(e) => setContractContent(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-xl px-4 py-3 min-h-[230px]" placeholder="Cole aqui o contrato final." />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700">Destinatários</label>
              <button type="button" onClick={addParty} className="text-sm font-bold text-indigo-600 flex items-center gap-1"><Plus size={15} /> adicionar</button>
            </div>
            {parties.map((party, index) => (
              <div key={index} className="grid grid-cols-[1fr_auto] gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-3">
                <div className="grid sm:grid-cols-2 gap-2">
                  <input value={party.name} onChange={(e) => setParty(index, 'name', e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Nome" />
                  <input value={party.email} onChange={(e) => setParty(index, 'email', e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="E-mail" />
                </div>
                <button type="button" onClick={() => removeParty(index)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>

          <button onClick={createRequest} disabled={saving} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            Criar fluxo de assinatura
          </button>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Fluxos de assinatura</h2>
                <p className="text-sm text-slate-500">Acompanhe quem já assinou e quem está pendente.</p>
              </div>
              <button onClick={refresh} disabled={loading} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                Atualizar
              </button>
            </div>

            {requests.length === 0 && !loading ? (
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-8 text-center text-slate-500">
                <ClipboardList className="mx-auto mb-3" size={38} />
                Nenhum fluxo criado ainda.
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-4">
                {requests.map((req) => {
                  const signed = req.signed_count ?? req.parties.filter((p) => p.status === 'signed').length;
                  const total = req.total_parties ?? req.parties.length;
                  const percent = req.progress_percent ?? (total ? Math.round((signed / total) * 100) : 0);
                  return (
                    <article key={req.id} className="border border-slate-100 rounded-3xl p-4 bg-white shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-black text-slate-900 truncate">{req.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">Criado em {formatDate(req.created_at)}</p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusClass(req.status)}`}>{statusLabel(req.status)}</span>
                      </div>
                      <div className="mt-4 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full border-8 border-indigo-100 flex items-center justify-center text-sm font-black text-indigo-700">{signed}/{total}</div>
                        <div className="flex-1">
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-600" style={{ width: `${percent}%` }} /></div>
                          <p className="text-xs text-slate-500 mt-2">{percent}% concluído</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        {req.parties.slice(0, 4).map((party) => (
                          <div key={party.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                            <div className="min-w-0"><p className="font-semibold text-slate-800 truncate">{party.name}</p><p className="text-xs text-slate-500 truncate">{party.email}</p></div>
                            <span className={party.status === 'signed' ? 'text-emerald-600 font-bold text-xs' : 'text-amber-600 font-bold text-xs'}>{party.status === 'signed' ? 'Assinado' : 'Pendente'}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button onClick={() => loadDetails(req.id)} className="py-2 rounded-xl bg-slate-950 text-white font-bold text-sm flex items-center justify-center gap-2">
                          {busyId === req.id ? <Loader2 className="animate-spin" size={15} /> : <ExternalLink size={15} />} Abrir
                        </button>
                        <button onClick={() => remind(req)} disabled={req.status !== 'pending'} className="py-2 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"><Mail size={15} /> Lembrar</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {selected && (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 space-y-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{selected.title}</h2>
                  <p className="text-sm text-slate-500 mt-1">Hash original: <span className="font-mono break-all">{selected.content_hash}</span></p>
                  {selected.final_hash && <p className="text-sm text-emerald-700 mt-1">Hash final: <span className="font-mono break-all">{selected.final_hash}</span></p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => downloadSignedPackage(selected)} className="px-4 py-2 rounded-xl bg-slate-950 text-white font-bold text-sm flex items-center gap-2"><Download size={16} /> Documento</button>
                  <button onClick={() => downloadEvidence(selected)} className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm flex items-center gap-2"><ShieldCheck size={16} /> Evidências</button>
                  {selected.status !== 'completed' && selected.status !== 'cancelled' && <button onClick={() => cancel(selected)} className="px-4 py-2 rounded-xl bg-red-50 text-red-700 font-bold text-sm">Cancelar</button>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {selected.parties.map((party) => {
                  const url = partyUrl(party);
                  return (
                    <div key={party.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0"><p className="font-black text-slate-900 truncate">{party.name}</p><p className="text-sm text-slate-500 truncate">{party.email}</p></div>
                        <span className={party.status === 'signed' ? 'text-emerald-600 font-bold text-sm flex items-center gap-1' : 'text-amber-600 font-bold text-sm'}>{party.status === 'signed' ? <><UserCheck size={15} /> Assinado</> : 'Pendente'}</span>
                      </div>
                      {party.signed_at && <p className="text-xs text-slate-500 mt-2">Assinado em {formatDate(party.signed_at)}</p>}
                      {url && (
                        <div className="mt-3 bg-white border border-slate-100 rounded-xl p-2 flex gap-2">
                          <input value={url} readOnly className="min-w-0 flex-1 text-xs px-2 outline-none" />
                          <button onClick={() => copy(url, 'Link copiado.')} className="p-2 rounded-lg bg-slate-950 text-white"><Copy size={15} /></button>
                        </div>
                      )}
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <button onClick={() => copy(url, 'Link copiado.')} disabled={!url} className="py-2 rounded-xl bg-white text-slate-700 border border-slate-100 font-bold text-xs disabled:opacity-40">Copiar</button>
                        <button onClick={() => sendWhatsApp(party)} disabled={!url} className="py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs disabled:opacity-40">WhatsApp</button>
                        <button onClick={() => sendEmail(party, selected)} disabled={!url} className="py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs disabled:opacity-40">E-mail</button>
                      </div>
                      {party.status !== 'signed' && <button onClick={() => remind(selected, party)} className="mt-2 w-full py-2 rounded-xl bg-amber-50 text-amber-700 font-bold text-xs">Registrar/enviar lembrete</button>}
                    </div>
                  );
                })}
              </div>

              {selectedContent && (
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <h3 className="font-black text-slate-900 mb-3">Documento</h3>
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed max-h-[360px] overflow-auto">{selectedContent}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};
