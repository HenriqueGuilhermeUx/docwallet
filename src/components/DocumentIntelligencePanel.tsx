import { useEffect, useState } from 'react';
import { AlertTriangle, Brain, CalendarClock, CheckCircle, FileSearch, Loader2, RefreshCw, ShieldCheck, Users, WalletCards } from 'lucide-react';
import { Document } from '../types/document';
import {
  analyzeDocument,
  createDocumentSignatureRequest,
  DocumentIntelligence,
  getDocumentAuditTrail,
  getDocumentIntelligence,
  updateDocumentIntelligence,
} from '../lib/intelligence';

interface Props {
  document: Document;
}

const fmt = (value?: string | null) => value ? new Date(value).toLocaleDateString('pt-BR') : '—';

export const DocumentIntelligencePanel: React.FC<Props> = ({ document }) => {
  const [intelligence, setIntelligence] = useState<DocumentIntelligence | null>(null);
  const [audit, setAudit] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [summaryDraft, setSummaryDraft] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const loaded = await getDocumentIntelligence(document.id);
      setIntelligence(loaded);
      setSummaryDraft(loaded?.summary || '');
      const trail = await getDocumentAuditTrail(document.id).catch(() => []);
      setAudit(trail);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar inteligência.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, [document.id]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setError('');
    setMessage('');
    try {
      const analyzed = await analyzeDocument(document.id);
      setIntelligence(analyzed);
      setSummaryDraft(analyzed.summary || '');
      setMessage('Documento analisado com sucesso. Revise os dados antes de usar como decisão.');
      const trail = await getDocumentAuditTrail(document.id).catch(() => []);
      setAudit(trail);
    } catch (err: any) {
      setError(err?.message || 'Erro ao analisar documento.');
    } finally {
      setAnalyzing(false);
    }
  };

  const saveReview = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await updateDocumentIntelligence(document.id, { summary: summaryDraft });
      setIntelligence(updated);
      setMessage('Revisão salva. O documento original não foi alterado.');
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar revisão.');
    } finally {
      setSaving(false);
    }
  };

  const createSignature = async () => {
    if (!intelligence) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const parties = intelligence.parties.map((p) => ({ name: p.name, email: p.email })).filter((p) => p.name);
      const req = await createDocumentSignatureRequest(document.id, { parties });
      setMessage(`Solicitação criada com ${req.parties?.length || 0} signatário(s). Abra a área Assinaturas para acompanhar.`);
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar assinatura.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-slate-500 flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Carregando inteligência...</div>;
  }

  return (
    <aside className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl max-h-[82vh] overflow-auto">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Brain size={23} /></div>
          <div>
            <h2 className="font-black text-lg">DocWallet Intelligence</h2>
            <p className="text-xs text-slate-500">Resumo, prazos, partes, valores e alertas</p>
          </div>
        </div>
        <button onClick={runAnalysis} disabled={analyzing} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
          {analyzing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
          Analisar
        </button>
      </div>

      <div className="p-5 space-y-5">
        {error && <div className="bg-red-50 text-red-700 rounded-xl p-3 text-sm">{error}</div>}
        {message && <div className="bg-emerald-50 text-emerald-700 rounded-xl p-3 text-sm">{message}</div>}

        {!intelligence ? (
          <div className="text-center py-8">
            <FileSearch className="mx-auto text-indigo-500 mb-3" size={42} />
            <h3 className="font-bold text-slate-900">Documento ainda não analisado</h3>
            <p className="text-sm text-slate-500 mt-2">Clique em Analisar para extrair tipo, resumo, datas, partes, valores, obrigações e alertas.</p>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Tipo</p><p className="font-bold">{intelligence.documentType}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Confiança</p><p className="font-bold">{Math.round((intelligence.confidence || 0) * 100)}%</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Emissão</p><p className="font-bold">{fmt(intelligence.issueDate)}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Vencimento</p><p className="font-bold">{fmt(intelligence.expirationDate)}</p></div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold flex items-center gap-2"><Brain size={18} /> Resumo inteligente</h3>
                {intelligence.reviewed && <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">revisado</span>}
              </div>
              <textarea value={summaryDraft} onChange={(e) => setSummaryDraft(e.target.value)} className="w-full min-h-[120px] rounded-xl border border-slate-200 p-3 text-sm" />
              <p className="text-xs text-slate-400 mt-1">Apoio informacional. Não é parecer jurídico e não altera o arquivo original.</p>
              <button onClick={saveReview} disabled={saving} className="mt-2 px-4 py-2 rounded-xl bg-slate-950 text-white text-sm font-semibold disabled:opacity-50">Salvar revisão</button>
            </section>

            {intelligence.contract && Object.keys(intelligence.contract).length > 0 && (
              <section className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 text-sm">
                <h3 className="font-bold text-indigo-950 mb-3">Contract Intelligence</h3>
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div><p className="text-xs text-slate-500">Objeto</p><p className="font-semibold line-clamp-3">{intelligence.contract.object || '—'}</p></div>
                  <div><p className="text-xs text-slate-500">Renovação</p><p className="font-semibold">{intelligence.contract.renewalType || '—'}</p></div>
                  <div><p className="text-xs text-slate-500">Valor total</p><p className="font-semibold">{intelligence.contract.totalValue ? `R$ ${intelligence.contract.totalValue}` : '—'}</p></div>
                  <div><p className="text-xs text-slate-500">Valor recorrente</p><p className="font-semibold">{intelligence.contract.recurringValue ? `R$ ${intelligence.contract.recurringValue}` : '—'}</p></div>
                  <div><p className="text-xs text-slate-500">Foro</p><p className="font-semibold">{intelligence.contract.jurisdiction || '—'}</p></div>
                  <div><p className="text-xs text-slate-500">Rescisão</p><p className="font-semibold line-clamp-3">{intelligence.contract.terminationRules || '—'}</p></div>
                </div>
                {(intelligence.contract.riskFlags || []).length > 0 && <div className="mt-3 space-y-2">{intelligence.contract.riskFlags.map((r: string) => <div key={r} className="flex gap-2 text-amber-800"><AlertTriangle size={16} /> {r}</div>)}</div>}
              </section>
            )}

            <section>
              <h3 className="font-bold flex items-center gap-2 mb-2"><Users size={18} /> Partes</h3>
              <div className="space-y-2">{intelligence.parties.length ? intelligence.parties.map((p, i) => <div key={`${p.name}-${i}`} className="rounded-xl border border-slate-100 p-3 text-sm"><p className="font-semibold">{p.name}</p><p className="text-slate-500">{p.role || 'parte'} {p.identifier ? `• ${p.identifier}` : ''}</p></div>) : <p className="text-sm text-slate-500">Nenhuma parte identificada.</p>}</div>
            </section>

            <section className="grid sm:grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold flex items-center gap-2 mb-2"><CalendarClock size={18} /> Datas</h3>
                <div className="space-y-2">{intelligence.dates.length ? intelligence.dates.map((d) => <div key={`${d.kind}-${d.value}`} className="rounded-xl bg-slate-50 p-3 text-sm"><p className="font-semibold">{d.label || d.kind}</p><p className="text-slate-500">{fmt(d.value)}</p></div>) : <p className="text-sm text-slate-500">Sem datas extraídas.</p>}</div>
              </div>
              <div>
                <h3 className="font-bold flex items-center gap-2 mb-2"><WalletCards size={18} /> Valores</h3>
                <div className="space-y-2">{intelligence.amounts.length ? intelligence.amounts.map((a) => <div key={`${a.kind}-${a.value}`} className="rounded-xl bg-slate-50 p-3 text-sm"><p className="font-semibold">{a.label || a.kind}</p><p className="text-slate-500">{a.currency || 'BRL'} {a.value}</p></div>) : <p className="text-sm text-slate-500">Sem valores extraídos.</p>}</div>
              </div>
            </section>

            <section>
              <h3 className="font-bold flex items-center gap-2 mb-2"><AlertTriangle size={18} /> Alertas</h3>
              <div className="space-y-2">{intelligence.alerts.length ? intelligence.alerts.map((a) => <div key={a.id} className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm text-amber-900"><p className="font-bold">{a.title}</p><p>{a.message}</p></div>) : <p className="text-sm text-slate-500">Nenhum alerta ativo.</p>}</div>
            </section>

            <section>
              <h3 className="font-bold flex items-center gap-2 mb-2"><ShieldCheck size={18} /> Integridade e versões</h3>
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 break-all">SHA-256 atual: {document.fileHash || '—'}</div>
              <div className="mt-2 space-y-2">{(intelligence.versions || []).map((v: any) => <div key={v.id} className="rounded-xl border border-slate-100 p-3 text-sm"><p className="font-semibold">Versão {v.versionNumber}</p><p className="text-xs text-slate-500 break-all">{v.fileHash}</p></div>)}</div>
            </section>

            <button onClick={createSignature} disabled={saving || !intelligence.parties.length} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              <CheckCircle size={18} /> Criar solicitação de assinatura com partes detectadas
            </button>

            <section>
              <h3 className="font-bold mb-2">Atividade</h3>
              <div className="space-y-2">{audit.length ? audit.slice(0, 8).map((ev) => <div key={ev.id} className="rounded-xl bg-slate-50 p-3 text-xs"><p className="font-semibold text-slate-800">{ev.action}</p><p className="text-slate-500">{ev.createdAt ? new Date(ev.createdAt).toLocaleString('pt-BR') : ''}</p></div>) : <p className="text-sm text-slate-500">Sem eventos recentes.</p>}</div>
            </section>
          </>
        )}
      </div>
    </aside>
  );
};
