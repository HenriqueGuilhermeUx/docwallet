import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
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
import { analyzeDocument } from '../lib/intelligence';
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

const companyLanes = [
  {
    title: 'Funcionário / campo',
    icon: Camera,
    items: ['abre o app', 'fotografa recibo ou comprovante', 'informa projeto e centro de custo', 'envia em menos de 30 segundos'],
  },
  {
    title: 'Gestor',
    icon: ClipboardCheck,
    items: ['recebe processo estruturado', 'confere valor, data e fornecedor', 'aprova ou rejeita', 'deixa trilha de auditoria'],
  },
  {
    title: 'Financeiro / compliance',
    icon: ShieldCheck,
    items: ['visualiza aprovados', 'exporta CSV/webhook/ERP', 'guarda comprovante com hash', 'formaliza pagamento e arquivo'],
  },
];

const captureCards = [
  { key: 'camera_mobile', label: 'Câmera mobile', Icon: Camera },
  { key: 'upload_web', label: 'Upload web', Icon: Upload },
  { key: 'email_forwarding', label: 'Email forwarding', Icon: Mail },
  { key: 'api', label: 'API / batch', Icon: FileText },
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

const sessionExpired = (message: string) => message.toLowerCase().includes('sessão expirou') || message.toLowerCase().includes('token inválido');

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
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar DocFlow.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, [user?.id]);

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
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar fluxo.');
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
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar fluxo customizado.');
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
      if (selectedDocumentId) {
        await analyzeDocument(selectedDocumentId).catch(() => undefined);
      }
      const submission = await createDocFlowSubmission({
        workflowId: activeWorkflow.id,
        documentId: selectedDocumentId || undefined,
        title: doc ? `${activeWorkflow.name} • ${doc.name}` : activeWorkflow.name,
        sourceType: selectedDocumentId ? 'camera_mobile' : 'api',
        answers: parseAnswers(),
      });
      const processed = await runDocFlowSubmission(submission.id, parseAnswers());
      setNotice(`Processo criado: ${statusLabel[processed.status] || processed.status}`);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Erro ao iniciar processo.');
    } finally {
      setWorking(false);
    }
  };

  const approve = async (submissionId: string) => {
    setWorking(true);
    setError('');
    try {
      await approveDocFlowSubmission(submissionId, 'Aprovado pelo gestor');
      setNotice('Processo aprovado. O financeiro já pode formalizar pagamento/exportação.');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Erro ao aprovar.');
    } finally {
      setWorking(false);
    }
  };

  const reject = async (submissionId: string) => {
    setWorking(true);
    setError('');
    try {
      await rejectDocFlowSubmission(submissionId, 'Rejeitado para correção');
      setNotice('Processo rejeitado para correção.');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Erro ao rejeitar.');
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
    } catch (err: any) {
      setError(err?.message || 'Erro ao preparar integração.');
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
            <p className="text-slate-300 mt-4 max-w-3xl">O funcionário fotografa. A empresa aprova, formaliza, exporta e arquiva. O motor por baixo é o AV Document Intelligence do DocWallet.</p>
            <div className="flex flex-wrap gap-3 mt-6">
              <button onClick={onAddDocument} className="px-5 py-3 bg-white text-slate-950 rounded-xl font-bold flex items-center gap-2"><Camera size={18} /> Capturar documento</button>
              <button onClick={createTemplateWorkflow} disabled={working} className="px-5 py-3 bg-violet-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"><Zap size={18} /> Criar fluxo por template</button>
            </div>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-3xl p-5">
            <p className="text-sm text-slate-300">Prestação de contas de viagem</p>
            <div className="mt-3 space-y-2 text-sm">
              {workflowBlocks.map(([k, v]) => (
                <div key={k} className="bg-white/10 rounded-2xl p-3 flex gap-3"><span className="font-black text-violet-200 w-20">{k}</span><span>{v}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error && sessionExpired(error) && (
        <section className="bg-amber-50 border border-amber-100 text-amber-900 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-bold">Sessão antiga detectada</h2>
            <p className="text-sm mt-1">O backend foi atualizado e o token antigo perdeu validade. Entre novamente para limpar essa mensagem.</p>
          </div>
          <button onClick={() => window.location.reload()} className="px-5 py-3 rounded-xl bg-amber-600 text-white font-bold">Atualizar login</button>
        </section>
      )}
      {error && !sessionExpired(error) && <div className="bg-red-50 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}
      {notice && <div className="bg-emerald-50 text-emerald-700 rounded-2xl p-4 text-sm">{notice}</div>}
      {loading && <div className="bg-white rounded-2xl p-4 text-slate-500 flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Carregando DocFlow...</div>}

      <section className="grid lg:grid-cols-3 gap-4">
        {companyLanes.map((lane) => {
          const Icon = lane.icon;
          return (
            <div key={lane.title} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5">
              <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mb-4"><Icon size={23} /></div>
              <h2 className="text-xl font-black text-slate-950">{lane.title}</h2>
              <div className="mt-4 space-y-2">
                {lane.items.map((item) => <div key={item} className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle size={16} className="text-emerald-500" /> {item}</div>)}
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Metric label="Documentos recebidos" value={metrics.documentsReceived} icon={<Upload size={23} />} />
        <Metric label="Processados" value={metrics.processed} icon={<Brain size={23} />} />
        <Metric label="Pendentes" value={metrics.pending} icon={<AlertTriangle size={23} />} />
        <Metric label="Aguardando aprovação" value={metrics.awaitingApproval} icon={<ClipboardCheck size={23} />} />
        <Metric label="Concluídos" value={metrics.completed} icon={<CheckCircle size={23} />} />
        <Metric label="Tempo economizado" value={`${metrics.timeSavedMinutes}min`} icon={<BarChart3 size={23} />} hint="Estimativa conservadora: 8 min por documento processado." />
      </section>

      <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 lg:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Captura mobile-first</h2>
            <p className="text-sm text-slate-500 mt-1">O fluxo ideal é abrir, fotografar, confirmar centro de custo/projeto e enviar.</p>
          </div>
          <button onClick={onAddDocument} className="px-5 py-3 bg-slate-950 text-white rounded-xl font-bold flex items-center justify-center gap-2"><Camera size={18} /> Adicionar foto/PDF</button>
        </div>
        <div className="grid sm:grid-cols-4 gap-3">
          {captureCards.map(({ key, label, Icon }) => {
            const enabled = capture.includes(key) || (key === 'api' && capture.includes('batch_upload'));
            return <div key={key} className="rounded-2xl bg-slate-50 border border-slate-100 p-4"><Icon className="text-violet-600 mb-2" size={22} /><p className="font-bold text-sm">{label}</p><p className="text-xs text-slate-500 mt-1">{enabled ? 'Preparado' : 'Em roadmap'}</p></div>;
          })}
        </div>
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
          <button onClick={createTemplateWorkflow} disabled={working || !templates.length} className="w-full px-5 py-3 bg-violet-600 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {working ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
            Criar fluxo por template
          </button>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="font-black text-slate-950 flex items-center gap-2"><Settings size={18} /> Builder no-code</h3>
            <input value={customName} onChange={(e) => setCustomName(e.target.value)} className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3" />
            <textarea value={customFields} onChange={(e) => setCustomFields(e.target.value)} className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 min-h-[90px]" />
            <button onClick={createCustomWorkflow} disabled={working} className="mt-3 w-full px-5 py-3 bg-slate-950 text-white rounded-xl font-bold disabled:opacity-50">Criar fluxo customizado</button>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 lg:p-7 space-y-5">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Rodar processo</h2>
            <p className="text-sm text-slate-500 mt-1">Selecione um fluxo e um documento já salvo/analisado no DocWallet.</p>
          </div>

          <select value={selectedWorkflowId} onChange={(e) => setSelectedWorkflowId(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3">
            <option value="">Selecione um fluxo</option>
            {workflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.name}</option>)}
          </select>

          <select value={selectedDocumentId} onChange={(e) => setSelectedDocumentId(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3">
            <option value="">Sem documento vinculado / API</option>
            {documents.map((doc) => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
          </select>

          {!documents.length && (
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-900">
              Nenhum documento no cofre ainda. Use Capturar documento para simular o funcionário enviando um recibo, nota ou comprovante.
            </div>
          )}

          <textarea value={answersText} onChange={(e) => setAnswersText(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 min-h-[105px]" />

          <button onClick={startSubmission} disabled={working || !activeWorkflow} className="w-full px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {working ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            Enviar para aprovação
          </button>

          <button onClick={prepareWebhook} disabled={working || !activeWorkflow} className="w-full px-5 py-3 bg-slate-100 text-slate-800 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            <Database size={18} /> Preparar integração ERP/webhook segura
          </button>
        </div>
      </section>

      <section className="grid lg:grid-cols-[1fr_1fr] gap-5">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 lg:p-7">
          <h2 className="text-2xl font-black text-slate-950 mb-4">Processos recentes</h2>
          <div className="space-y-3">
            {submissions.length ? submissions.slice(0, 8).map((submission) => (
              <div key={submission.id} className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{submission.title}</p>
                    <p className="text-sm text-slate-500">{statusLabel[submission.status] || submission.status} • {submission.currentStep || 'processo'}</p>
                  </div>
                  {submission.status === 'awaiting_approval' && (
                    <div className="flex gap-2">
                      <button onClick={() => approve(submission.id)} disabled={working} className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">Aprovar</button>
                      <button onClick={() => reject(submission.id)} disabled={working} className="px-3 py-2 bg-red-50 text-red-700 rounded-xl text-sm font-bold disabled:opacity-50">Rejeitar</button>
                    </div>
                  )}
                </div>
              </div>
            )) : <p className="text-sm text-slate-500">Nenhum processo criado ainda.</p>}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 lg:p-7">
          <h2 className="text-2xl font-black text-slate-950 mb-4">Dados estruturados</h2>
          {latestSubmission ? <JsonPreview data={latestSubmission.extractedData || {}} /> : <p className="text-sm text-slate-500">Rode um processo para ver o JSON extraído pela inteligência documental.</p>}
          <div className="mt-4 rounded-2xl bg-indigo-50 border border-indigo-100 p-4 text-sm text-indigo-950">
            <p className="font-bold flex items-center gap-2"><ShieldCheck size={17} /> DocWallet Trust</p>
            <p className="mt-1">O arquivo original fica preservado, com hash, trilha de auditoria e opção de assinatura/registro de integridade.</p>
          </div>
        </div>
      </section>
    </main>
  );
};
