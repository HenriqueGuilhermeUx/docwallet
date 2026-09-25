import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Copy, ExternalLink, FileSignature, KeyRound, Loader2, Mail, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { BackendUser } from '../lib/backendSession';
import {
  createDocFlowSignature,
  DocFlowSignatureState,
  DocFlowSubmission,
  getDocFlowSignature,
} from '../lib/docflow';
import { deliverSignature } from '../lib/signatures';

interface Props {
  user: BackendUser;
  submissions: DocFlowSubmission[];
  onChanged?: () => Promise<void> | void;
}

const signableStatuses = new Set(['approved', 'completed', 'archived', 'awaiting_signature']);
const eligible = (submission: DocFlowSubmission) => signableStatuses.has(submission.status);

export const DocFlowSignaturePanel: React.FC<Props> = ({ user, submissions, onChanged }) => {
  const candidates = useMemo(() => submissions.filter(eligible), [submissions]);
  const [submissionId, setSubmissionId] = useState('');
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<DocFlowSignatureState | null>(null);
  const [working, setWorking] = useState(false);
  const [busyPartyId, setBusyPartyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!candidates.length) {
      setSubmissionId('');
      setState(null);
      return;
    }
    if (!submissionId || !candidates.some((item) => item.id === submissionId)) {
      setSubmissionId(candidates[0].id);
    }
  }, [candidates, submissionId]);

  useEffect(() => {
    setName((current) => current || user.name || '');
    setEmail((current) => current || user.email || '');
  }, [user.id]);

  useEffect(() => {
    if (!submissionId) {
      setState(null);
      return;
    }
    let active = true;
    getDocFlowSignature(submissionId)
      .then((latest) => {
        if (active) setState(latest);
      })
      .catch(() => {
        // The explicit refresh/create actions surface errors. Silent preload keeps
        // the panel usable even during a temporary backend restart.
      });
    return () => {
      active = false;
    };
  }, [submissionId]);

  const selected = candidates.find((item) => item.id === submissionId) || null;

  const refreshSignature = async () => {
    if (!submissionId) return;
    setWorking(true);
    setError('');
    try {
      const latest = await getDocFlowSignature(submissionId);
      setState(latest);
      if (!latest) setNotice('Este processo ainda não foi enviado para assinatura.');
      else setNotice(latest.status === 'completed' ? 'Assinatura concluída e sincronizada com o DocFlow.' : 'Status da assinatura atualizado.');
      await onChanged?.();
    } catch (err: any) {
      setError(err?.message || 'Não foi possível consultar a assinatura.');
    } finally {
      setWorking(false);
    }
  };

  const createSignature = async () => {
    if (!submissionId || !selected) {
      setError('Selecione um processo aprovado ou concluído.');
      return;
    }
    if (!name.trim()) {
      setError('Informe o nome do signatário.');
      return;
    }
    setWorking(true);
    setError('');
    setNotice('');
    try {
      const created = await createDocFlowSignature(
        submissionId,
        [{ name: name.trim(), email: email.trim(), phone: phone.trim() }],
        `${selected.title} — formalização`,
      );
      setState(created);
      setNotice('Processo formalizado no DocWallet Sign. O signatário pode escolher assinatura eletrônica verificada ou ICP-Brasil.');
      await onChanged?.();
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar o processo para assinatura.');
    } finally {
      setWorking(false);
    }
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value).catch(() => undefined);
    setNotice('Link individual copiado.');
  };

  const sendInvite = async (partyId: string, channel: 'email' | 'whatsapp', partyPhone?: string | null) => {
    if (!state) return;
    setBusyPartyId(partyId);
    setError('');
    try {
      const delivered = await deliverSignature(state.signatureRequestId, partyId, channel, { phone: partyPhone || undefined });
      if (channel === 'whatsapp' && delivered.url) window.open(delivered.url, '_blank', 'noopener,noreferrer');
      setNotice(channel === 'email' ? 'Convite de assinatura enviado por e-mail.' : 'WhatsApp aberto com o convite individual pronto para envio.');
    } catch (err: any) {
      setError(err?.message || 'Não foi possível preparar o convite.');
    } finally {
      setBusyPartyId('');
    }
  };

  return (
    <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 lg:p-7 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 text-xs font-bold mb-3">
            <ShieldCheck size={15} /> DOCFLOW + DOCWALLET SIGN
          </div>
          <h2 className="text-2xl font-black text-slate-950">Formalizar processo com assinatura</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Depois da aprovação, transforme o resultado do workflow em um termo auditável. O destinatário recebe um link único e escolhe entre assinatura eletrônica com evidências/OTP ou certificado ICP-Brasil.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <KeyRound size={16} /> ICP-Brasil disponível no mesmo link
        </div>
      </div>

      {!candidates.length ? (
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-500">
          Crie e aprove um processo DocFlow primeiro. A formalização por assinatura só é liberada após a etapa de aprovação/conclusão.
        </div>
      ) : (
        <>
          <select
            value={submissionId}
            onChange={(e) => { setSubmissionId(e.target.value); setState(null); setNotice(''); setError(''); }}
            className="w-full rounded-xl border border-slate-200 px-4 py-3"
          >
            {candidates.map((submission) => (
              <option key={submission.id} value={submission.id}>{submission.title} • {submission.status}</option>
            ))}
          </select>

          <div className="grid md:grid-cols-3 gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl border border-slate-200 px-4 py-3" placeholder="Nome do signatário" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl border border-slate-200 px-4 py-3" placeholder="E-mail" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl border border-slate-200 px-4 py-3" placeholder="WhatsApp +55..." />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <button onClick={createSignature} disabled={working || Boolean(state)} className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              {working ? <Loader2 className="animate-spin" size={18} /> : state ? <CheckCircle size={18} /> : <FileSignature size={18} />}
              {state ? 'Fluxo de assinatura criado' : 'Enviar para assinatura'}
            </button>
            <button onClick={refreshSignature} disabled={working || !submissionId} className="px-5 py-3 bg-slate-100 text-slate-800 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              <RefreshCw size={18} /> Atualizar status
            </button>
          </div>
        </>
      )}

      {error && <div className="rounded-2xl bg-red-50 border border-red-100 text-red-700 p-4 text-sm">{error}</div>}
      {notice && <div className="rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 text-sm">{notice}</div>}

      {state && (
        <div className="rounded-3xl bg-slate-50 border border-slate-100 p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-black text-slate-950">{state.title}</p>
              <p className="text-xs text-slate-500 mt-1">Hash do termo: <span className="font-mono break-all">{state.contentHash}</span></p>
              {state.finalHash && <p className="text-xs text-emerald-700 mt-1">Hash final: <span className="font-mono break-all">{state.finalHash}</span></p>}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${state.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {state.status === 'completed' ? 'Concluído' : 'Aguardando assinatura'}
            </span>
          </div>

          <div className="space-y-3">
            {state.parties.map((party) => (
              <div key={party.id} className="rounded-2xl bg-white border border-slate-100 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{party.name}</p>
                    <p className="text-xs text-slate-500">{party.email || party.phone || 'link individual'}{party.evidenceLevel ? ` • ${party.evidenceLevel}` : ''}</p>
                  </div>
                  {party.status === 'signed' ? (
                    <span className="text-emerald-700 font-bold text-sm flex items-center gap-1"><CheckCircle size={16} /> Assinado</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => copy(party.signUrl)} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1"><Copy size={14} /> Copiar</button>
                      {party.email && <button onClick={() => sendInvite(party.id, 'email', party.phone)} disabled={busyPartyId === party.id} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"><Mail size={14} /> E-mail</button>}
                      <button onClick={() => sendInvite(party.id, 'whatsapp', party.phone)} disabled={busyPartyId === party.id} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"><Send size={14} /> WhatsApp</button>
                      <a href={party.signUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1"><ExternalLink size={14} /> Abrir</a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
