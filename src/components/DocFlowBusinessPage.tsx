import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  Building2,
  Camera,
  CheckCircle,
  ClipboardCheck,
  Database,
  FileText,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  Upload,
  Zap,
} from 'lucide-react';
import { BackendUser } from '../lib/backendSession';
import { Document } from '../types/document';
import {
  approveDocFlowSubmission,
  createDocFlowIntegration,
  createDocFlowSubmission,
  createDocFlowWorkflow,
  createDocFlowWorkflowFromTemplate,
  DocFlowDashboard,
  DocFlowSubmission,
  DocFlowTemplate,
  getDocFlowDashboard,
  listDocFlowSubmissions,
  listDocFlowTemplates,
  rejectDocFlowSubmission,
  runDocFlowSubmission,
} from '../lib/docflow';

interface Props {
  user?: BackendUser | null;
  documents: Document[];
  onLogin: () => void;
  onAddDocument: () => void;
}

const statusLabel: Record<string, string> = {
  received: 'Recebido',
  needs_intelligence: 'Precisa de inteligência',
  needs_review: 'Revisão necessária',
  awaiting_approval: 'Aguardando aprovação',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  completed: 'Concluído',
  archived: 'Arquivado',
};

const workflowBlocks = [
  ['QUANDO', 'documento recebido'],
  ['SE', 'tipo = receipt / contract / invoice'],
  ['EXTRAIR', 'valor, data, fornecedor, partes'],
  ['PEDIR', 'centro de custo, projeto, motivo'],
  ['ENTÃO', 'aprovar, exportar, arquivar'],
];

const Metric: React.FC<{ label: string; value: number | string; icon: React.ReactNode; hint?: string }> = ({ label, value, icon, hint }) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-3xl font-black text-slate-950 mt-1">{value}</p>
      </div>
      <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center">{icon}</div>
    </div>
    {hint && <p className="text-xs text-slate-400 mt-3">{hint}</p>}
  </div>
);

const JsonPreview: React.FC<{ data: Record<string, unknown> }> = ({ data }) => (
  <pre className="text-xs bg-slate-950 text-slate-100 rounded-2xl p-4 overflow-auto max-h-64 whitespace-pre-wrap">
    {JSON.stringify(data || {}, null, 2)}
  </pre>
);

const captureCards = [
  { label: 'Câmera mobile', Icon: Camera },
  { label: 'Upload web', Icon: Upload },
  { label: 'Email forwarding', Icon: Mail },
  { label: 'API / batch', Icon: FileText },
];

export const DocFlowBusinessPage: React.FC<Props> = ({ user, documents, onLogin, onAddDocument }) => {
  const [dashboard, setDashboard] = useState<DocFlowDashboard | null>(null);
  const [templates, setTemplates] = useState<DocFlowTemplate[]>([]);
  const [capture, setCapture] = useState<string[]>([]);
  const [submissions, setSubmissions] = useState<DocFlowSubmission[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('travel_expense');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [customName, setCustomName] = useState('Fluxo customizado');
  const [customFields, setCustomFields] = useState('número do pedido, fornecedor, valor, nome do vendedor, data de entrega');
  const [answersText, setAnswersText] = useState('projeto=DocWallet\ncentro_de_custo=Operações\nmotivo=Reembolso operacional');
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const workflows = dashboard?.workflows || [];
  const activeWorkflow = useMemo(() => workflows.find((w) => w.id === selectedWorkflowId) || workflows[0], [workflows, selectedWorkflowId]);
  const latestSubmission = submissions[0];
  const metrics = dashboard?.metrics || { documentsReceived: 0, processed: 0, pending: 0, awaitingApproval: 0, rejected: 0, completed: 0, timeSavedMinutes: 0, averageProcessingMinutes: 0, users: 0, workflows: 0 };

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const [tpl, dash, subs] = await Promise.all([
        listDocFlowTemplates(),
        getDocFlowDashboard(),
        listDocFlowSubmissions(),
      ]);
      setTemplates(tpl.templates);
      setCapture(tpl.capture);
      setDashboard(dash);
      setSubmissions(subs);
      if (!selectedWorkflowId && dash.workflows[0]) setSelectedWorkflowId(dash.workflows[0].id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar DocFlow.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, [user?.email]);

  const parseAnswers = () => {
    const out: Record<string, string> = {};
    answersText.split('\n').forEach((line) => {
      const [key, ...rest] = line.split('=');
      if (key?.trim() && rest.length) out[key.trim()] = rest.join('=').trim();
    });
    return out;
  };

  const createTemplateWorkflow = async () => {
    setWorking(true);
    setError('');
    setNotice('');
    try {
      const workflow = await createDocFlowWorkflowFromTemplate(selectedTemplate);
      setNotice(`Fluxo criado: ${workflow.name}`);
      setSelectedWorkflowId(workflow.id);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar fluxo.');
    } finally {
      setWorking(false);
    }
  };

  const createCustomWorkflow = async () => {
    setWorking(true);
    setError('');
    setNotice('');
    try {
      const fields = customFields.split(',').map((item) => item.trim()).filter(Boolean);
      const workflow = await createDocFlowWorkflow({
        name: customName,
        description: 'Fluxo customizado criado pelo builder no-code do DocFlow.',
        fields,
        required: fields.slice(0, Math.min(3, fields.length)),
        documentType: 'OTHER',
        steps: [
          { type: 'extract', label: 'Extrair dados com AV Document Intelligence' },
          { type: 'validate', label: 'Validar campos obrigatórios' },
          { type: 'ask_user', label: 'Pedir complementos' },
          { type: 'approve', label: 'Aprovação do gestor' },
          { type: 'webhook', label: 'Enviar webhook/ERP quando habilitado' },
          { type: 'archive', label: 'Arquivar no DocWallet' },
        ],
      });
      setNotice(`Fluxo customizado criado: ${workflow.name}`);
      setSelectedWorkflowId(workflow.id);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar fluxo customizado.');
    } finally {
      setWorking(false);
    }
  };

  const startSubmission = async () => {
    if (!activeWorkflow) {
      setError('Crie ou selecione um fluxo primeiro.');
      return;
    }
    setWorking(true);
    setError('');
    setNotice('');
    try {
      const doc = documents.find((item) => item.id === selectedDocumentId);
      const submission = await createDocFlowSubmission({
        workflowId: activeWorkflow.id,
        documentId: selectedDocumentId || undefined,
        title: doc ? `${activeWorkflow.name} • ${doc.name}` : activeWorkflow.name,
        sourceType: selectedDocumentId ? 'upload_web' : 'api',
        answers: parseAnswers(),
      });
      const processed = await runDocFlowSubmission(submission.id, parseAnswers());
      setNotice(`Processo criado: ${statusLabel[processed.status] || processed.status}`);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar processo.');
    } finally {
      setWorking(false);
    }
  };

  const approve = async (submissionId: string) => {
    setWorking(true);
    setError('');
    try {
      await approveDocFlowSubmission(submissionId, 'Aprovado pelo gestor');
      setNotice('Processo aprovado.');
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao aprovar.');
    } finally {
      setWorking(false);
    }
  };

  const reject = async (submissionId: string) => {
    setWorking(true);
    setError('');
    try {
      await rejectDocFlowSubmission(submissionId, 'Rejeitado para correção');
      setNotice('Processo rejeitado.');
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao rejeitar.');
    } finally {
      setWorking(false);
    }
  };

  const prepareWebhook = async () => {
    if (!activeWorkflow) return;
    setWorking(true);
    setError('');
    try {
      await createDocFlowIntegration({
        workflowId: activeWorkflow.id,
        type: 'webhook',
        name: 'Webhook/ERP preparado',
        enabled: false,
        config: { url: 'https://erp.exemplo.com/webhook', mode: 'disabled_until_review' },
      });
      setNotice('Integração criada em modo seguro/desabilitado. Nenhum dado foi enviado para fora.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao preparar integração.');
    } finally {
      setWorking(false);
    }
  };

  if (!user) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10">
        <section className="bg-slate-950 text-white rounded-[2rem] p-8 lg:p-12 text-center overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/25 to-indigo-600/10" />
          <div className="relative z-10">
            <Zap className="mx-auto text-violet-300 mb-4" size={50} />
            <p className="text-violet-200 font-bold mb-2">DOCFLOW BY DOCWALLET</p>
            <h1 className="text-3xl lg:text-5xl font-black">Transforme documentos em processos.</h1>
            <p className="text-slate-300 mt-4 max-w-3xl mx-auto">Fotografe, envie ou receba um documento. O DocFlow extrai dados, pede complementos, envia para aprovação, prepara integração e arquiva com trilha de confiança.</p>
            <button onClick={onLogin} className="mt-7 px-7 py-3 bg-white text-slate-950 rounded-full font-bold">Entrar para usar</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <section className="bg-slate-950 text-white rounded-[2rem] p-7 lg:p-10 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/25 via-indigo-600/10 to-transparent" />
        <div className="relative z-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-3 py-1 rounded-full text-sm font-semibold mb-4"><Building2 size={16} /> DOCFLOW BY DOCWALLET</div>
            <h1 className="text-3xl lg:text-5xl font-black leading-tight">Transforme documentos em processos.</h1>
            <p className="text-slate-300 mt-4 max-w-3xl">Pare de digitar o que já está no papel. Use AV Document Intelligence para transformar foto, PDF, nota, recibo, comprovante, formulário e contrato em dados estruturados + workflow + aprovação + integração.</p>
            <div className="flex flex-wrap gap-3 mt-6">
              <button onClick={onAddDocument} className="px-5 py-3 bg-white text-slate-950 rounded-xl font-bold flex items-center gap-2"><Camera size={18} /> Capturar documento</button>
              <button onClick={createTemplateWorkflow} disabled={working} className="px-5 py-3 bg-violet-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"><Zap size={18} /> Criar fluxo por template</button>
            </div>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-3xl p-5">
            <p className="text-sm text-slate-300">Exemplo</p>
            <div className="mt-3 space-y-2 text-sm">
              {workflowBlocks.map(([k, v]) => (
                <div key={k} className="bg-white/10 rounded-2xl p-3 flex gap-3"><span className="font-black text-violet-200 w-20">{k}</span><span>{v}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error && <div className="bg-red-50 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}
      {notice && <div className="bg-emerald-50 text-emerald-700 rounded-2xl p-4 text-sm">{notice}</div>}
      {loading && <div className="bg-white rounded-2xl p-4 text-slate-500 flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Carregando DocFlow...</div>}

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Metric label="Documentos recebidos" value={metrics.documentsReceived} icon={<Upload size={23} />} />
        <Metric label="Processados" value={metrics.processed} icon={<Brain size={23} />} />
        <Metric label="Pendentes" value={metrics.pending} icon={<AlertTriangle size={23} />} />
        <Metric label="Aguardando aprovação" value={metrics.awaitingApproval} icon={<ClipboardCheck size={23} />} />
        <Metric label="Concluídos" value={metrics.completed} icon={<CheckCircle size={23} />} />
        <Metric label="Tempo economizado" value={`${metrics.timeSavedMinutes}min`} icon={<BarChart3 size={23} />} hint="Estimativa conservadora: 8 min por documento processado." />
      </section>

      <section className="grid lg:grid-cols-[0.95fr_1.05fr] gap-5">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 lg:p-7 space-y-5">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Templates B2B</h2>
            <p className="text-sm text-slate-500 mt-1">Comece com fluxos prontos e ajuste depois no builder no-code.</p>
          </div>
          <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3">
            {templates.map((tpl) => <option key={tpl.key} value={tpl.key}>{tpl.name}</option>)}
          </select>
          <div className="space-y-3 max-h-72 overflow-auto">
            {templates.map((tpl) => (
              <button key={tpl.key} onClick={() => setSelectedTemplate(tpl.key)} className={`w-full text-left rounded-2xl border p-4 transition-colors ${selectedTemplate === tpl.key ? 'border-violet-300 bg-violet-50' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'}`}>
                <p className="font-bold text-slate-900">{tpl.name}</p>
                <p className="text-sm text-slate-500 mt-1">{tpl.description}</p>
              </button>
            ))}
          </div>
          <button onClick={createTemplateWorkflow} disabled={working || !selectedTemplate} className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {working ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
            Criar fluxo selecionado
          </button>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 lg:p-7 space-y-5">
          <div>
            <h2 className="text-2xl font-black text-slate-950">No-code workflow builder</h2>
            <p className="text-sm text-slate-500 mt-1">Crie um schema customizado dizendo quais dados quer extrair.</p>
          </div>
          <input value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="Nome do fluxo" />
          <textarea value={customFields} onChange={(e) => setCustomFields(e.target.value)} className="w-full min-h-[95px] rounded-xl border border-slate-200 px-4 py-3" placeholder="Campos separados por vírgula" />
          <div className="grid sm:grid-cols-5 gap-2">
            {workflowBlocks.map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-slate-50 border border-slate-100 p-3 text-xs">
                <p className="font-black text-violet-700">{k}</p>
                <p className="text-slate-500 mt-1">{v}</p>
              </div>
            ))}
          </div>
          <button onClick={createCustomWorkflow} disabled={working} className="w-full py-3 rounded-xl bg-slate-950 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            <Settings size={18} /> Criar fluxo customizado
          </button>
        </div>
      </section>

      <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 lg:p-7">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Executar processo</h2>
            <p className="text-sm text-slate-500 mt-1">Escolha um fluxo, selecione um documento do DocWallet e rode extração + validação + aprovação.</p>
          </div>
          <button onClick={load} className="px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold flex items-center gap-2"><RefreshCw size={17} /> Atualizar</button>
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">Fluxo</label>
            <select value={activeWorkflow?.id || ''} onChange={(e) => setSelectedWorkflowId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3">
              {workflows.length ? workflows.map((wf) => <option key={wf.id} value={wf.id}>{wf.name}</option>) : <option>Nenhum fluxo criado</option>}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Documento</label>
            <select value={selectedDocumentId} onChange={(e) => setSelectedDocumentId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3">
              <option value="">Sem documento / API manual</option>
              {documents.map((doc) => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Complementos</label>
            <textarea value={answersText} onChange={(e) => setAnswersText(e.target.value)} className="mt-2 w-full h-[50px] rounded-xl border border-slate-200 px-4 py-3 text-xs" />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-5">
          <button onClick={startSubmission} disabled={working || !activeWorkflow} className="px-5 py-3 bg-violet-600 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {working ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            Rodar processo
          </button>
          <button onClick={prepareWebhook} disabled={working || !activeWorkflow} className="px-5 py-3 bg-slate-100 text-slate-800 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            <Database size={18} /> Preparar integração ERP/Webhook
          </button>
        </div>
      </section>

      <section className="grid lg:grid-cols-[1fr_0.9fr] gap-5">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 lg:p-7">
          <h2 className="text-2xl font-black text-slate-950 mb-4">Processos recentes</h2>
          <div className="space-y-3">
            {submissions.length ? submissions.map((s) => (
              <div key={s.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{s.title}</p>
                    <p className="text-sm text-slate-500">{statusLabel[s.status] || s.status} • {s.sourceType} • aprovação: {s.approvalStatus}</p>
                    {s.validationErrors?.length > 0 && <p className="text-xs text-amber-700 mt-1">{s.validationErrors.join(' | ')}</p>}
                  </div>
                  <div className="flex gap-2">
                    {s.status === 'awaiting_approval' && <button onClick={() => approve(s.id)} className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold">Aprovar</button>}
                    {s.status === 'awaiting_approval' && <button onClick={() => reject(s.id)} className="px-3 py-2 bg-red-500 text-white rounded-xl text-sm font-bold">Rejeitar</button>}
                  </div>
                </div>
                {s.hash && <p className="text-[11px] text-slate-400 mt-2 break-all">SHA-256: {s.hash}</p>}
              </div>
            )) : <p className="text-sm text-slate-500">Nenhum processo criado ainda.</p>}
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 lg:p-7 space-y-5">
          <h2 className="text-2xl font-black text-slate-950">Resultado estruturado</h2>
          {latestSubmission ? <JsonPreview data={latestSubmission.extractedData} /> : <p className="text-sm text-slate-500">Rode um processo para ver dados extraídos e revisáveis.</p>}
          <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 text-sm text-indigo-950">
            <p className="font-bold flex items-center gap-2"><ShieldCheck size={18} /> DocWallet Trust</p>
            <p className="mt-1">Cada processo preserva arquivo original, hash, trilha de auditoria, revisão humana e integração opcional com assinatura ou registro de integridade.</p>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-4 gap-4">
        {captureCards.map(({ label, Icon }) => (
          <div key={label} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 text-center">
            <Icon className="mx-auto text-violet-600 mb-3" size={30} />
            <p className="font-bold text-slate-900">{label}</p>
          </div>
        ))}
      </section>

      <p className="text-xs text-slate-400 text-center">
        Capturas habilitadas/preparadas: {capture.join(', ') || 'camera_mobile, upload_web, email_forwarding, api, batch_upload'}. Integrações externas ficam desabilitadas até configuração segura no backend.
      </p>
    </main>
  );
};
