import { useEffect, useState } from 'react';
import { AlertTriangle, Brain, CalendarClock, FileSearch, Loader2, RefreshCw, Search, ShieldCheck, Signature, WalletCards } from 'lucide-react';
import { Document } from '../types/document';
import { analyzeDocument, getIntelligenceDashboard, IntelligenceDashboard as DashboardData, searchIntelligence } from '../lib/intelligence';
import { BackendUser } from '../lib/backendSession';

interface Props {
  user?: BackendUser | null;
  documents: Document[];
  onLogin: () => void;
}

const MetricCard: React.FC<{ label: string; value: number; icon: React.ReactNode; hint?: string }> = ({ label, value, icon, hint }) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-3xl font-black text-slate-950 mt-1">{value}</p>
      </div>
      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">{icon}</div>
    </div>
    {hint && <p className="text-xs text-slate-400 mt-3">{hint}</p>}
  </div>
);

const fmt = (value?: string | null) => value ? new Date(value).toLocaleDateString('pt-BR') : '—';

export const IntelligenceDashboard: React.FC<Props> = ({ user, documents, onLogin }) => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [query, setQuery] = useState('Quais contratos vencem nos próximos 60 dias?');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    if (!user) return;
    setError('');
    setLoading(true);
    try {
      setDashboard(await getIntelligenceDashboard());
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar inteligência.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, [user?.email]);

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      setResults(await searchIntelligence(query, 60));
    } catch (err: any) {
      setError(err?.message || 'Erro na busca semântica.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeAll = async () => {
    if (!documents.length) return;
    setAnalyzingAll(true);
    setNotice('');
    setError('');
    let ok = 0;
    for (const doc of documents.slice(0, 25)) {
      try {
        await analyzeDocument(doc.id);
        ok += 1;
      } catch {
        // keep going; user can open individual document for details
      }
    }
    setNotice(`${ok} documento(s) enviados para análise.`);
    await load();
    setAnalyzingAll(false);
  };

  if (!user) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10">
        <section className="bg-slate-950 text-white rounded-[2rem] p-8 lg:p-12 text-center">
          <Brain className="mx-auto text-indigo-300 mb-4" size={48} />
          <h1 className="text-3xl lg:text-5xl font-black">DocWallet Intelligence</h1>
          <p className="text-slate-300 mt-4 max-w-2xl mx-auto">Seu documento não fica apenas guardado. O DocWallet entende o que existe dentro dele.</p>
          <button onClick={onLogin} className="mt-7 px-7 py-3 bg-white text-slate-950 rounded-full font-bold">Entrar para usar</button>
        </section>
      </main>
    );
  }

  const m = dashboard?.metrics || { documents: 0, documentsAnalyzed: 0, activeContracts: 0, expiringIn30Days: 0, pendingSignatures: 0, documentsWithAlerts: 0 };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <section className="bg-slate-950 text-white rounded-[2rem] p-7 lg:p-10 overflow-hidden relative">
        <div className="relative z-10 grid lg:grid-cols-[1.2fr_0.8fr] gap-6 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-3 py-1 rounded-full text-sm font-semibold mb-4"><Brain size={16} /> Document Intelligence + Digital Trust</div>
            <h1 className="text-3xl lg:text-5xl font-black leading-tight">Seu documento não fica apenas guardado. O DocWallet entende o que existe dentro dele.</h1>
            <p className="text-slate-300 mt-4 max-w-3xl">Classificação, partes, prazos, valores, obrigações, alertas, assinaturas, hash, versões e trilha de auditoria em uma única camada.</p>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-3xl p-5">
            <p className="text-sm text-slate-300">Exemplo de resposta</p>
            <p className="font-bold mt-2">Contrato vence em 27 dias, possui renovação automática e ainda falta uma assinatura. O arquivo original continua íntegro e verificável.</p>
          </div>
        </div>
      </section>

      {error && <div className="bg-red-50 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}
      {notice && <div className="bg-emerald-50 text-emerald-700 rounded-2xl p-4 text-sm">{notice}</div>}

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Documentos" value={m.documents} icon={<FileSearch size={23} />} />
        <MetricCard label="Documentos analisados" value={m.documentsAnalyzed} icon={<Brain size={23} />} />
        <MetricCard label="Contratos ativos" value={m.activeContracts} icon={<ShieldCheck size={23} />} />
        <MetricCard label="Vencendo em 30 dias" value={m.expiringIn30Days} icon={<CalendarClock size={23} />} />
        <MetricCard label="Assinaturas pendentes" value={m.pendingSignatures} icon={<Signature size={23} />} />
        <MetricCard label="Documentos com alerta" value={m.documentsWithAlerts} icon={<AlertTriangle size={23} />} />
      </section>

      <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 lg:p-7">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Análise e busca semântica</h2>
            <p className="text-sm text-slate-500 mt-1">Pergunte sobre prazos, valores, multas, assinaturas e comprovações.</p>
          </div>
          <button onClick={analyzeAll} disabled={analyzingAll || !documents.length} className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {analyzingAll ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            Analisar documentos
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runSearch()} className="flex-1 rounded-xl border border-slate-200 px-4 py-3" placeholder="Ex.: Qual contrato tem multa de 20%?" />
          <button onClick={runSearch} disabled={loading} className="px-5 py-3 bg-slate-950 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
            Buscar
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-5 space-y-3">
            {results.map((item) => (
              <div key={item.document.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{item.document.name}</p>
                    <p className="text-sm text-slate-500">{item.intelligence?.documentType || item.document.type} • {item.reasons?.join(', ')}</p>
                  </div>
                  <a href="/" className="text-sm font-semibold text-indigo-600">Abrir no cofre</a>
                </div>
                {item.intelligence?.summary && <p className="text-sm text-slate-600 mt-3 whitespace-pre-line">{item.intelligence.summary}</p>}
                {item.alerts?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{item.alerts.slice(0, 3).map((a: any) => <span key={a.id} className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-1 rounded-full">{a.title}</span>)}</div>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 lg:p-7">
          <h2 className="text-xl font-black text-slate-950 mb-4">Próximos vencimentos e alertas</h2>
          <div className="space-y-3">{dashboard?.upcomingExpirations?.length ? dashboard.upcomingExpirations.map((alert) => <div key={alert.id} className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-amber-950"><p className="font-bold">{alert.title}</p><p className="text-sm mt-1">{alert.message}</p><p className="text-xs mt-2">Data: {fmt(alert.dueDate)}</p></div>) : <p className="text-sm text-slate-500">Nenhum vencimento próximo encontrado.</p>}</div>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 lg:p-7">
          <h2 className="text-xl font-black text-slate-950 mb-4">Contratos de maior valor</h2>
          <div className="space-y-3">{dashboard?.highValueContracts?.length ? dashboard.highValueContracts.map((amount) => <div key={amount.id} className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">{amount.label || amount.kind}</p><p className="font-black text-slate-900"><WalletCards className="inline mr-2 text-indigo-600" size={18} />{amount.currency || 'BRL'} {amount.value}</p></div>) : <p className="text-sm text-slate-500">Nenhum valor contratual detectado ainda.</p>}</div>
        </div>
      </section>
    </main>
  );
};
